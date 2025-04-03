import { PatchPoint, PatchPolygon } from "$lib/geom/PatchPolygon";
import type { Region } from "$lib/geom/Voronoi";
import type { Ward } from "../wards/Ward";

export class Patch {
	shape: PatchPolygon;
	ward: Ward | null;

	withinWalls: boolean;
	withinCity: boolean;

	private constructor(vertices: PatchPoint[]) {
		this.shape = new PatchPolygon(vertices);

		this.withinCity = false;
		this.withinWalls = false;
		this.ward = null;
	}

	static create(regions: Region[]) {
		const pointLookup = new Map<number, Map<number, PatchPoint>>();
		const getPoint = (x: number, y: number) => {
			if (pointLookup.has(x)) {
				const sub = pointLookup.get(x)!;
				if (!sub.has(y)) {
					sub.set(y, new PatchPoint(x, y));
				}
			} else {
				const sub = new Map<number, PatchPoint>();
				sub.set(y, new PatchPoint(x, y));
				pointLookup.set(x, sub);
			}
			return pointLookup.get(x)!.get(y)!;
		}
		return regions.map(r => new Patch(r.vertices.map(x => getPoint(x.c.x, x.c.y))))
	}

	public static findCircumference(wards: Array<Patch>): PatchPolygon {
		if (wards.length === 0) return new PatchPolygon();
		if (wards.length === 1) return wards[0].shape;

		const A: Array<PatchPoint> = [];
		const B: Array<PatchPoint> = [];

		for (const w1 of wards) {
			w1.shape.forEdge((a, b) => {
				let outerEdge = true;
				for (const w2 of wards) {
					if (w2.shape.findEdge(b, a) !== -1) {
						outerEdge = false;
						break;
					}
				}
				if (outerEdge) {
					A.push(a);
					B.push(b);
				}
			});
		}

		const result = new PatchPolygon();
		let index = 0;
		const idexes: number[] = [];
		do {
			const oldIndex = index;
			result.vertices.push(A[index]);
			index = A.findIndex(p => p === (B[index]));
			if (index == -1) {
				// this shold not happen, but just in case
				console.error("Error in findCircumference: no index found for ", B[oldIndex]);
				break;
			}
			idexes.push(index);
			if (idexes.length > A.length) {
				console.error("Error in findCircumference: too many indexes found", idexes);
				break;
			}
		} while (index !== 0);

		return result;
	}

	equals(patch: Patch | null) {
		return patch === this;
	}

	public split(p1: PatchPoint, p2: PatchPoint): [Patch, Patch] {
		let index1 = this.shape.vertices.indexOf(p1);
		let index2 = this.shape.vertices.indexOf(p2);
		if (index1 === -1 || index2 === -1) {
			throw new Error("Points not found in the shape");
		}
		if (index1 === index2) {
			throw new Error("Points are the same");
		}
		if (Math.abs(index1 - index2) === 1 || Math.abs(index1 - index2) === this.shape.vertices.length - 1) {
			throw new Error("Points are neighbours");
		}
		if (index1 > index2) {
			[index1, index2] = [index2, index1];
		}
		return [
			new Patch(this.shape.vertices.slice(index1, index2 + 1)),
			new Patch(this.shape.vertices.slice(index2).concat(this.shape.vertices.slice(0, index1 + 1))),
		]

	}

}
