import { Point } from "$lib/geom/Point";
import type { Polygon } from "$lib/geom/Polygon";
import { Random } from "$lib/utils/Random";
import { Model } from "./Model";
import { Patch } from "./Patch";

export class CurtainWall {
	shape: Polygon;
	segments: boolean[];
	gates: Point[] = [];
	towers: Point[] = [];

	private real: boolean;
	private patches: Patch[];

	constructor(real: boolean, model: Model, patches: Patch[], reserved: Point[]) {
		this.real = true;
		this.patches = patches;

		if (patches.length === 1) {
			this.shape = patches[0].shape;
		} else {
			this.shape = Model.findCircumference(patches);

			if (real) {
				const smoothFactor = Math.min(1, 40 / patches.length);
				this.shape.vertices = (this.shape.vertices.map((v) =>
					reserved.includes(v) ? v : this.shape.smoothVertex(v, smoothFactor)
				));
			}
		}

		this.segments = this.shape.vertices.map(() => true);

		this.buildGates(real, model, reserved);
	}

	private buildGates(real: boolean, model: Model, reserved: Point[]): void {
		this.gates = [];

		const entrances = this.patches.length > 1
			? this.shape.vertices.filter((v) =>
				!reserved.includes(v) && this.patches.filter((p) => p.shape.contains(v)).length > 1
			)
			: this.shape.vertices.filter((v) => !reserved.includes(v));

		if (entrances.length === 0) {
			throw new Error("Bad walled area shape!");
		}

		do {
			const index = Random.int(0, entrances.length);
			const gate = entrances[index];
			this.gates.push(gate);

			if (real) {
				const outerWards = model.patchByVertex(gate).filter((w) => !this.patches.includes(w));
				if (outerWards.length === 1) {
					const outer = outerWards[0];
					if (outer.shape.vertices.length > 3) {
						const wall = this.shape.next(gate).subtract(this.shape.prev(gate));
						const out = new Point(wall.y, -wall.x);

						const farthest = outer.shape.vertices.reduce((max, v) => {
							if (this.shape.contains(v) || reserved.includes(v)) {
								return max;
							}
							const dir = v.subtract(gate);
							const score = dir.dot(out) / dir.length;
							return score > max.score ? { point: v, score } : max;
						}, { point: null as Point | null, score: Number.NEGATIVE_INFINITY }).point;

						if (farthest == null) {
							throw new Error("Bad walled area shape!");
						}

						const newPatches = outer.shape.split(gate, farthest).map((half) => new Patch(half.vertices));
						model.patches.splice(model.patches.indexOf(outer), 1, ...newPatches);
					}
				}
			}

			if (index === 0) {
				entrances.splice(0, 2);
				entrances.pop();
			} else if (index === entrances.length - 1) {
				entrances.splice(index - 1, 2);
				entrances.shift();
			} else {
				entrances.splice(index - 1, 3);
			}
		} while (entrances.length >= 3);

		if (this.gates.length === 0) {
			throw new Error("Bad walled area shape!");
		}

		if (real) {
			this.gates.forEach((gate) => gate.set(this.shape.smoothVertex(gate)));
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

	public bordersBy(p: Patch, v0: Point, v1: Point): boolean {
		const index = this.patches.includes(p)
			? this.shape.findEdge(v0, v1)
			: this.shape.findEdge(v1, v0);
		return index !== -1 && this.segments[index];
	}

	public borders(p: Patch): boolean {
		const withinWalls = this.patches.includes(p);
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
