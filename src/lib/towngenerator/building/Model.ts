import { CraftsmenWard, MerchantWard, Cathedral, AdministrationWard, Slum, PatriciateWard, Market, MilitaryWard, Park, GateWard, Farm, Ward } from 'com/watabou/towngenerator/wards';
import { CurtainWall } from './CurtainWall';
import { Patch } from './Patch';
import { Topology } from './Topology';
import { Point } from '$lib/geom/Point';
import { Random } from '$lib/utils/Random';
import { Voronoi } from '$lib/geom/Voronoi';
import { MathUtils } from '$lib/utils/MathUtils';
import { Polygon } from '$lib/geom/Polygon';
import { Segment } from '$lib/geom/Segment';
import { Castle } from '../wards/Castle';

type Street = Polygon;

export class Model {
	public static instance: Model;

	private nPatches: number;
	private plazaNeeded: boolean;
	private citadelNeeded: boolean;
	private wallsNeeded: boolean;

	public static WARDS: Array<typeof Ward> = [
		CraftsmenWard, CraftsmenWard, MerchantWard, CraftsmenWard, CraftsmenWard, Cathedral,
		CraftsmenWard, CraftsmenWard, CraftsmenWard, CraftsmenWard, CraftsmenWard,
		CraftsmenWard, CraftsmenWard, CraftsmenWard, AdministrationWard, CraftsmenWard,
		Slum, CraftsmenWard, Slum, PatriciateWard, Market,
		Slum, CraftsmenWard, CraftsmenWard, CraftsmenWard, Slum,
		CraftsmenWard, CraftsmenWard, CraftsmenWard, MilitaryWard, Slum,
		CraftsmenWard, Park, PatriciateWard, Market, MerchantWard
	];

	public topology: Topology | null = null;
	public patches: Array<Patch> = [];
	public waterbody: Array<Patch> = [];
	public inner: Array<Patch> = [];
	public citadel: Patch | null = null;
	public plaza: Patch | null = null;
	public center: Point = null!;

	public border: CurtainWall | null = null;
	public wall: CurtainWall | null = null;

	public cityRadius: number = 0;
	public gates: Array<Point> = [];
	public arteries: Array<Street> = [];
	public streets: Array<Street> = [];
	public roads: Array<Street> = [];

	constructor(nPatches: number = -1, seed: number = -1) {
		if (seed > 0) Random.reset(seed);
		this.nPatches = nPatches !== -1 ? nPatches : 15;

		this.plazaNeeded = Random.bool();
		this.citadelNeeded = Random.bool();
		this.wallsNeeded = Random.bool();

		do {
			try {
				this.build();
				Model.instance = this;
			} catch (e) {
				console.error((e as { message?: string })?.message ?? e);
				Model.instance = null!;
			}
		} while (Model.instance === null);
	}

	private build(): void {
		this.streets = [];
		this.roads = [];

		this.buildPatches();
		this.optimizeJunctions();
		this.buildWalls();
		this.buildStreets();
		this.createWards();
		this.buildGeometry();
	}

	private buildPatches(): void {
		const sa = Random.float() * 2 * Math.PI;
		const points = Array.from({ length: this.nPatches * 8 }, (_, i) => {
			const a = sa + Math.sqrt(i) * 5;
			const r = i === 0 ? 0 : 10 + i * (2 + Random.float());
			return new Point(Math.cos(a) * r, Math.sin(a) * r);
		});
		let voronoi = Voronoi.build(points);

		for (let i = 0; i < 3; i++) {
			const toRelax = voronoi.points.slice(0, 3);
			toRelax.push(voronoi.points[this.nPatches]);
			voronoi = Voronoi.relax(voronoi, toRelax);
		}

		voronoi.points.sort((p1, p2) => MathUtils.sign(p1.length - p2.length));
		const regions = voronoi.partioning();

		this.patches = [];
		this.inner = [];

		let count = 0;
		for (const r of regions) {
			const patch = Patch.fromRegion(r);
			this.patches.push(patch);

			if (count === 0) {
				this.center = patch.shape.min((p: Point) => p.length);
				if (this.plazaNeeded) this.plaza = patch;
			} else if (count === this.nPatches && this.citadelNeeded) {
				this.citadel = patch;
				this.citadel.withinCity = true;
			}

			if (count < this.nPatches) {
				patch.withinCity = true;
				patch.withinWalls = this.wallsNeeded;
				this.inner.push(patch);
			}

			count++;
		}
	}

	private buildWalls(): void {
		const reserved = this.citadel ? this.citadel.shape.clone().vertices : [];

		this.border = new CurtainWall(this.wallsNeeded, this, this.inner, reserved);
		if (this.wallsNeeded) {
			this.wall = this.border;
			this.wall.buildTowers();
		}

		const radius = this.border.getRadius();
		this.patches = this.patches.filter(p => p.shape.distance(this.center!) < radius * 3);

		this.gates = this.border.gates;

		if (this.citadel) {
			const castle = new Castle(this, this.citadel);
			castle.wall.buildTowers();
			this.citadel.ward = castle;

			if (this.citadel.shape.compactness < 0.75) {
				throw new Error("Bad citadel shape!");
			}

			this.gates = this.gates.concat(castle.wall.gates);
		}
	}

	public static findCircumference(wards: Array<Patch>): Polygon {
		if (wards.length === 0) return new Polygon();
		if (wards.length === 1) return wards[0].shape.clone();

		const A: Array<Point> = [];
		const B: Array<Point> = [];

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

		const result = new Polygon();
		let index = 0;
		do {
			result.vertices.push(A[index]);
			index = A.indexOf(B[index]);
		} while (index !== 0);

		return result;
	}

	public patchByVertex(v: Point): Array<Patch> {
		return this.patches.filter(patch => patch.shape.contains(v));
	}

	private buildStreets(): void {
		const smoothStreet = (street: Street): void => {
			const smoothed = street.smoothVertexEq(3);
			for (let i = 1; i < street.vertices.length - 1; i++) {
				street.vertices[i] = smoothed.vertices[i];
			}
		};

		this.topology = new Topology(this);

		for (const gate of this.gates) {
			const end = this.plaza
				? this.plaza.shape.min((v: Point) => v.distance(gate))
				: this.center!;

			const street = this.topology.buildPath(gate, end, this.topology.outer);
			if (street) {
				this.streets.push(new Polygon(street));

				if (this.border!.gates.includes(gate)) {
					const dir = gate.norm(1000);
					let start: Point | null = null;
					let dist = Number.POSITIVE_INFINITY;
					for (const [, p] of this.topology.node2pt) {
						const d = p.distance(dir);
						if (d < dist) {
							dist = d;
							start = p;
						}
					}

					const road = this.topology.buildPath(start!, gate, this.topology.inner);
					if (road) this.roads.push(new Polygon(road));
				}
			} else {
				throw new Error("Unable to build a street!");
			}
		}

		this.tidyUpRoads();

		for (const a of this.arteries) {
			smoothStreet(a);
		}
	}

	private tidyUpRoads(): void {
		const segments: Array<Segment> = [];
		const cut2segments = (street: Street): void => {
			let v0: Point | null = null;
			let v1: Point = street.vertices[0];
			for (let i = 1; i < street.vertices.length; i++) {
				v0 = v1;
				v1 = street.vertices[i];

				if (this.plaza && this.plaza.shape.contains(v0) && this.plaza.shape.contains(v1)) {
					continue;
				}

				const exists = segments.some(seg => seg.start === v0 && seg.end === v1);
				if (!exists) {
					segments.push(new Segment(v0, v1));
				}
			}
		};

		for (const street of this.streets) {
			cut2segments(street);
		}
		for (const road of this.roads) {
			cut2segments(road);
		}

		this.arteries = [];
		while (segments.length > 0) {
			const seg = segments.pop()!;
			let attached = false;
			for (const a of this.arteries) {
				if (a.vertices[0] === seg.end) {
					a.vertices.unshift(seg.start);
					attached = true;
					break;
				} else if (a.vertices[a.vertices.length - 1] === seg.start) {
					a.vertices.push(seg.end);
					attached = true;
					break;
				}
			}

			if (!attached) {
				this.arteries.push(new Polygon([seg.start, seg.end]));
			}
		}
	}

	private optimizeJunctions(): void {
		const patchesToOptimize = this.citadel ? this.inner.concat([this.citadel]) : this.inner;

		const wards2clean: Array<Patch> = [];
		for (const w of patchesToOptimize) {
			let index = 0;
			while (index < w.shape.vertices.length) {
				const v0 = w.shape.vertices[index];
				const v1 = w.shape.vertices[(index + 1) % w.shape.vertices.length];

				if (v0 !== v1 && v0.distance(v1) < 8) {
					for (const w1 of this.patchByVertex(v1)) {
						if (w1 !== w) {
							w1.shape.vertices[w1.shape.vertices.findIndex(x => x.equals(v1))] = v0;
							wards2clean.push(w1);
						}
					}

					v0.addEq(v1);
					v0.scaleEq(0.5);

					w.shape.vertices.splice(index, 1);
				}
				index++;
			}
		}

		for (const w of wards2clean) {
			for (let i = 0; i < w.shape.vertices.length; i++) {
				const v = w.shape.vertices[i];
				let dupIdx;
				while ((dupIdx = w.shape.vertices.indexOf(v, i + 1)) !== -1) {
					w.shape.vertices.splice(dupIdx, 1);
				}
			}
		}
	}

	private createWards(): void {
		const unassigned = [...this.inner];
		if (this.plaza) {
			this.plaza.ward = new Market(this, this.plaza);
			unassigned.splice(unassigned.indexOf(this.plaza), 1);
		}

		for (const gate of this.border!.gates) {
			for (const patch of this.patchByVertex(gate)) {
				if (patch.withinCity && !patch.ward && Random.bool(this.wall ? 0.5 : 0.2)) {
					patch.ward = new GateWard(this, patch);
					unassigned.splice(unassigned.indexOf(patch), 1);
				}
			}
		}

		const wards = [...Model.WARDS];
		for (let i = 0; i < Math.floor(wards.length / 10); i++) {
			const index = Random.int(0, wards.length - 1);
			const tmp = wards[index];
			wards[index] = wards[index + 1];
			wards[index + 1] = tmp;
		}

		while (unassigned.length > 0) {
			let bestPatch: Patch | null = null;

			const wardClass = wards.length > 0 ? wards.shift()! : Slum;
			const rateFunc = (wardClass).rateLocation;

			if (!rateFunc) {
				do {
					bestPatch = unassigned[Math.floor(Math.random() * unassigned.length)];
				} while (bestPatch.ward);
			} else {
				bestPatch = unassigned.reduce((best, patch) => {
					if (!patch.ward) {
						const rate = rateFunc(this, patch);
						return rate < (best ? rateFunc(this, best) : Infinity) ? patch : best;
					}
					return best;
				}, null as Patch | null);
			}

			bestPatch!.ward = new wardClass(this, bestPatch!);
			unassigned.splice(unassigned.indexOf(bestPatch!), 1);
		}

		if (this.wall) {
			for (const gate of this.wall.gates) {
				if (!Random.bool(1 / (this.nPatches - 5))) {
					for (const patch of this.patchByVertex(gate)) {
						if (!patch.ward) {
							patch.withinCity = true;
							patch.ward = new GateWard(this, patch);
						}
					}
				}
			}
		}

		this.cityRadius = 0;
		for (const patch of this.patches) {
			if (patch.withinCity) {
				for (const v of patch.shape.vertices) {
					this.cityRadius = Math.max(this.cityRadius, v.length);
				}
			} else if (!patch.ward) {
				patch.ward = Random.bool(0.2) && patch.shape.compactness >= 0.7
					? new Farm(this, patch)
					: new Ward(this, patch);
			}
		}
	}

	private buildGeometry(): void {
		for (const patch of this.patches.filter(p => p.ward)) {
			patch.ward!.createGeometry();
		}
	}

	public getNeighbour(patch: Patch, v: Point): Patch | null {
		const next = patch.shape.next(v);
		for (const p of this.patches) {
			if (p.shape.findEdge(next, v) !== -1) {
				return p;
			}
		}
		return null;
	}

	public getNeighbours(patch: Patch): Array<Patch> {
		return this.patches.filter(p => p !== patch && p.shape.borders(patch.shape));
	}

	public isEnclosed(patch: Patch): boolean {
		return patch.withinCity && (patch.withinWalls || this.getNeighbours(patch).every(p => p.withinCity));
	}
}
