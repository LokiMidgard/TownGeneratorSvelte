import { Graph, Node } from "$lib/geom/Graph";
import type { Point } from "$lib/geom/Point";
import type { Model } from "./Model";


export class Topology {
	private model: Model;

	private graph: Graph;

	public pt2node: Map<Point, Node>;
	public node2pt: Map<Node, Point>;

	private blocked: Point[];

	public inner: Node[];
	public outer: Node[];

	constructor(model: Model) {
		this.model = model;

		this.graph = new Graph();
		this.pt2node = new Map();
		this.node2pt = new Map();

		this.inner = [];
		this.outer = [];

		// Building a list of all blocked points (shore + walls excluding gates)
		this.blocked = [];
		if (model.citadel != null) {
			this.blocked = this.blocked.concat(model.citadel.shape.vertices);
		}
		if (model.wall != null) {
			this.blocked = this.blocked.concat(model.wall.shape);
		}
		this.blocked = this.blocked.filter((p) => !model.gates.includes(p));

		const border = model.border.shape;

		for (const p of model.patches) {
			const withinCity = p.withinCity;

			let v1 = p.shape.vertices[p.shape.vertices.length - 1];
			let n1 = this.processPoint(v1);

			for (let i = 0; i < p.shape.vertices.length; i++) {
				const v0 = v1;
				v1 = p.shape.vertices[i];
				const n0 = n1;
				n1 = this.processPoint(v1);

				if (n0 != null && !border.includes(v0)) {
					if (withinCity) {
						this.inner.push(n0);
					} else {
						this.outer.push(n0);
					}
				}
				if (n1 != null && !border.includes(v1)) {
					if (withinCity) {
						this.inner.push(n1);
					} else {
						this.outer.push(n1);
					}
				}

				if (n0 != null && n1 != null) {
					n0.link(n1, v0.distance(v1));
				}
			}
		}
	}

	private processPoint(v: Point): Node | null {
		let n: Node;

		if (this.pt2node.has(v)) {
			n = this.pt2node.get(v)!;
		} else {
			n = this.graph.add();
			this.pt2node.set(v, n);
			this.node2pt.set(n, v);
		}

		return this.blocked.includes(v) ? null : n;
	}

	public buildPath(from: Point, to: Point, exclude: Node[] = []): Point[] | null {
		const path = this.graph.aStar(this.pt2node.get(from)!, this.pt2node.get(to)!, exclude);
		return path == null ? null : path.map((n) => this.node2pt.get(n)!);
	}
}
