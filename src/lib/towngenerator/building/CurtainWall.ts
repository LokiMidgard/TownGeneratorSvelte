import type { PatchPoint, PatchPolygon } from "$lib/geom/PatchPolygon";
import { Point } from "$lib/geom/Point";
import { Random } from "$lib/utils/Random";
import { Model } from "./Model";
import { Patch } from "./Patch";

export class CurtainWall {
	shape: PatchPolygon;
	segments: boolean[];
	gates: PatchPoint[] = [];
	towers: PatchPoint[] = [];

	private real: boolean;
	private patches: Patch[];

	constructor(real: boolean, model: Model, patches: Patch[], reserved: PatchPoint[]) {
		this.real = real;
		this.patches = patches;

		if (patches.length === 1) {
			this.shape = patches[0].shape;
		} else {
			this.shape = Patch.findCircumference(patches);

			if (real) {
				const smoothFactor = Math.min(1, 40 / patches.length);
				this.shape.smoothVertexes(smoothFactor, this.shape.vertices.filter(v => !reserved.includes(v)));
			}
		}

		this.segments = this.shape.vertices.map(() => true);

		this.buildGates(real, model, reserved);
	}

	private buildGates(real: boolean, model: Model, reserved: PatchPoint[]): void {
		this.gates = [];


		// we search for all possible entrances
		// an entrance is a vertex that is on the border of the shape
		// and is not part of the reserved list (the citadel)
		// and is part of at least two patches of the inside of the city.
		// This means it is not a corner of the shape
		// special case: if there is only one patch, we take all the vertices
		// of the shape that are not reserved
		const possibleEntrances = this.patches.length > 1
			? this.shape.vertices.filter((v) =>
				!reserved.includes(v) && this.patches.filter((p) => p.shape.containsDefiningVertex(v)).length > 1
			)
			: this.shape.vertices.filter((v) => !reserved.includes(v));

		if (possibleEntrances.length === 0) {
			throw new Error("Bad walled area shape!");
		}

		do {
			// we take a random entrance from the list of
			// possible entrances and make it a gate
			const index = Random.int(0, possibleEntrances.length);
			const gate = possibleEntrances[index];
			this.gates.push(gate);

			if (real) {
				const outerWards = model.patchByVertex(gate).filter((w) => !this.patches.includes(w));
				if (outerWards.length === 1) {
					// if we have only one outer ward, we split it in two
					// otherwise, we could not make a street
					const outer = outerWards[0];
					if (outer.shape.vertices.length > 3) {
						// we need at least 4 vertices otherwise a split is not possible
						const wall = this.shape.next(gate).toPoint().subtract(this.shape.prev(gate));
						// wall is the direction vector of the wall, and 
						// out is the ortogonal vector of the wall pointing outwards
						const out = new Point(wall.y, -wall.x);

						const farthest = outer.shape.vertices.reduce((max, v) => {
							if (this.shape.containsDefiningVertex(v) || reserved.includes(v)) {
								return max;
							}
							const dir = v.toPoint().subtract(gate);
							const score = dir.dot(out) / dir.length;
							return score > max.score ? { point: v, score } : max;
						}, { point: null as PatchPoint | null, score: Number.NEGATIVE_INFINITY }).point;

						if (farthest == null) {
							throw new Error("Bad walled area shape!");
						}
						model.splitPatch(outer, gate, farthest);
					}
				}
			}

			if (index === 0) {
				possibleEntrances.splice(0, 2);
				possibleEntrances.pop();
			} else if (index === possibleEntrances.length - 1) {
				possibleEntrances.splice(index - 1, 2);
				possibleEntrances.shift();
			} else {
				possibleEntrances.splice(index - 1, 3);
			}
		} while (possibleEntrances.length >= 3);

		if (this.gates.length === 0) {
			throw new Error("Bad walled area shape!");
		}

		if (real) {
			this.gates.forEach((gate) => this.shape.smoothVertexes([gate]));
		}
	}

	public buildTowers(): void {
		this.towers = [];
		if (this.real) {
			const len = this.shape.vertices.length;
			for (let i = 0; i < len; i++) {
				const t = this.shape.vertices[i];
				if (!this.gates.includes(t) && (this.segments[(i + len - 1) % len] || this.segments[i])) {
					this.towers.push(t);
				}
			}
		}
	}

	public getRadius(): number {
		return this.shape.vertices.reduce((radius, v) => Math.max(radius, v.length), 0);
	}

	public bordersBy(p: Patch, v0: PatchPoint, v1: PatchPoint): boolean {
		const index = this.patches.includes(p)
			? this.shape.findEdge(v0, v1)
			: this.shape.findEdge(v1, v0);
		return index !== -1 && this.segments[index];
	}

	public borders(p: Patch): boolean {
		const withinWalls = this.patches.findIndex(x => x.equals(p)) !== -1;
		const length = this.shape.vertices.length;

		for (let i = 0; i < length; i++) {
			if (this.segments[i]) {
				const v0 = this.shape.vertices[i];
				const v1 = this.shape.vertices[(i + 1) % length];
				const index = withinWalls
					? p.shape.findEdge(v0, v1)
					: p.shape.findEdge(v1, v0);
				if (index !== -1) {
					return true;
				}
			}
		}

		return false;
	}
}
