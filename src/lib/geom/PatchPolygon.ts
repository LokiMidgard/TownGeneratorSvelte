import { Point } from './Point'; // Assuming Point is defined in a separate file
import { Rectangle } from './Rectangle'; // Assuming Rectangle is defined in a separate file
import { GeomUtils } from './GeomUtils';
import { Polygon } from './Polygon';

export interface IPointLike {
	readonly x: number;
	readonly y: number;
}
export class PatchPoint {
	private _x: number;
	private _y: number;

	constructor(x: number, y: number) {
		this._x = x;
		this._y = y;
	}

	public get length(): number {
		return Math.sqrt(this._x ** 2 + this._y ** 2);
	}
	public get lengthSq(): number {
		return this._x ** 2 + this._y ** 2;
	}



	public get x(): number {
		return this._x;
	}

	public get y(): number {
		return this._y;
	}

	public moveTo(point: IPointLike) {
		this._x = point.x;
		this._y = point.y;
	}

	public moveBy(point: IPointLike) {
		this._x += point.x;
		this._y += point.y;
	}

	public distance(p: IPointLike): number {
		return Math.sqrt((this.x - p.x) ** 2 + (this.y - p.y) ** 2);
	}
	public squareDistance(p: IPointLike): number {
		return (this.x - p.x) ** 2 + (this.y - p.y) ** 2;
	}


	public toPoint(): Point {
		return new Point(this.x, this.y);
	}

}

export class PatchPolygon {
	private static readonly DELTA = 0.000001;
	private _vertices: PatchPoint[];

	public get vertices(): PatchPoint[] {
		return this._vertices;
	}

	constructor(vertices: PatchPoint[] = []) {
		this._vertices = vertices;
	}



	get square(): number {
		let v1 = this.vertices[this.vertices.length - 1];
		let v2 = this.vertices[0];
		let s = v1.x * v2.y - v2.x * v1.y;
		for (let i = 1; i < this.vertices.length; i++) {
			v1 = v2;
			v2 = this.vertices[i];
			s += v1.x * v2.y - v2.x * v1.y;
		}
		return s * 0.5;
	}

	get perimeter(): number {
		let len = 0.0;
		this.forEdge((v0, v1) => {
			len += v0.distance(v1);
		});
		return len;
	}

	get compactness(): number {
		const p = this.perimeter;
		return (4 * Math.PI * this.square) / (p * p);
	}

	get center(): Point {
		let c = new Point(0, 0);
		for (const v of this.vertices) {
			c = c.add(v);
		}
		c = c.scale(1 / this.vertices.length);
		return c;
	}

	get centroid(): Point {
		let x = 0.0;
		let y = 0.0;
		let a = 0.0;
		this.forEdge((v0, v1) => {
			const f = GeomUtils.cross(v0.x, v0.y, v1.x, v1.y);
			a += f;
			x += (v0.x + v1.x) * f;
			y += (v0.y + v1.y) * f;
		});
		const s6 = 1 / (3 * a);
		return new Point(s6 * x, s6 * y);
	}

	containsDefiningVertex(v: IPointLike): boolean {
		if (v instanceof PatchPoint) {
			return this.vertices.includes(v);
		}
		return this.vertices.findIndex(p => p.x === v.x && p.y === v.y) !== -1;
	}

	forEdge(f: (v0: PatchPoint, v1: PatchPoint) => void): void {
		const len = this.vertices.length;
		for (let i = 0; i < len; i++) {
			f(this.vertices[i], this.vertices[(i + 1) % len]);
		}
	}

	forSegment(f: (v0: PatchPoint, v1: PatchPoint) => void): void {
		for (let i = 0; i < this.vertices.length - 1; i++) {
			f(this.vertices[i], this.vertices[i + 1]);
		}
	}

	offset(p: IPointLike): void {
		for (const v of this.vertices) {
			v.moveBy(p);
		}
	}

	// rotate(a: number): void {
	// 	const cosA = Math.cos(a);
	// 	const sinA = Math.sin(a);

	// 	const newVertices = this.vertices.map(v => {
	// 		const vx = v.x * cosA - v.y * sinA;
	// 		const vy = v.y * cosA + v.x * sinA;
	// 		return new Point(vx, vy);
	// 	});

	// 	this._vertices = newVertices;
	// }

	isConvexVertexi(i: number): boolean {
		const len = this.vertices.length;
		const v0 = this.vertices[(i + len - 1) % len];
		const v1 = this.vertices[i];
		const v2 = this.vertices[(i + 1) % len];
		return GeomUtils.cross(v1.x - v0.x, v1.y - v0.y, v2.x - v1.x, v2.y - v1.y) > 0;
	}

	isConvexVertex(v1: PatchPoint): boolean {
		const v0 = this.prev(v1);
		const v2 = this.next(v1);
		return GeomUtils.cross(v1.x - v0.x, v1.y - v0.y, v2.x - v1.x, v2.y - v1.y) > 0;
	}

	isConvex(): boolean {
		for (const v of this.vertices) {
			if (!this.isConvexVertex(v)) return false;
		}
		return true;
	}


	public smoothVertexes(): void;
	public smoothVertexes(f: number): void;
	public smoothVertexes(f: number, points: IPointLike[]): void;
	public smoothVertexes(f: number, indexes: number[]): void;
	public smoothVertexes(points: IPointLike[]): void;
	public smoothVertexes(indexes: number[]): void;
	public smoothVertexes(f?: number | number[] | IPointLike[], pointsOrIndex?: number[] | IPointLike[]): void {
		if (f == undefined) {
			f = 1.0;
		} else if (typeof f !== 'number') {
			pointsOrIndex = f;
			f = 1.0;
		}
		if (pointsOrIndex == undefined) {
			pointsOrIndex = this.vertices.map((_, i) => i);
		} else {
			pointsOrIndex = pointsOrIndex.map(i => {
				if (typeof i === 'number') {
					return i;
				} else if (i instanceof PatchPoint) {
					return this.vertices.indexOf(i);
				} else {
					return this.vertices.findIndex(p => p.x === i.x && p.y === i.y);
				}
			}).filter(i => i !== -1);
		}
		// we need to calculate smothing on every vertex before we apply it
		// otherwise we will get a wrong result
		const indexLookup = new Set(pointsOrIndex);
		const newVerticePositions = this.vertices.map((v, i) => {
			if (indexLookup.has(i)) {
				return this.calculateSmoothVertexi(i, f) as IPointLike;
			}
			return v as IPointLike;
		});
		for (let i = 0; i < this.vertices.length; i++) {
			this.vertices[i].moveTo(newVerticePositions[i]);
		}

	}

	private calculateSmoothVertexi(i: number, f = 1.0): Point {
		const v = this.vertices[i];
		const len = this.vertices.length;
		const prev = this.vertices[(i + len - 1) % len];
		const next = this.vertices[(i + 1) % len];
		return new Point(
			(prev.x + v.x * f + next.x) / (2 + f),
			(prev.y + v.y * f + next.y) / (2 + f)
		);
	}


	distance(p: IPointLike): number {
		let v0 = this.vertices[0];
		let d = v0.distance(p);
		for (let i = 1; i < this.vertices.length; i++) {
			const v1 = this.vertices[i];
			const d1 = v1.distance(p);
			if (d1 < d) {
				v0 = v1;
				d = d1;
			}
		}
		return d;
	}

	// smoothVertexEq(f = 1.0) {
	// 	const len = this.vertices.length;
	// 	let v1 = this.vertices[len - 1];
	// 	let v2 = this.vertices[0];
	// 	return new Polygon(
	// 		Array.from({ length: len }, (_, i) => {
	// 			const v0 = v1;
	// 			v1 = v2;
	// 			v2 = this.vertices[(i + 1) % len];
	// 			return new Point(
	// 				(v0.x + v1.x * f + v2.x) / (2 + f),
	// 				(v0.y + v1.y * f + v2.y) / (2 + f)
	// 			);
	// 		})
	// 	);
	// }

	// filterShort(threshold: number): Polygon {
	// 	let i = 1;
	// 	let v0 = this.vertices[0];
	// 	let v1 = this.vertices[1];
	// 	const result = [v0];
	// 	do {
	// 		do {
	// 			v1 = this.vertices[i++];
	// 		} while (v0.distance(v1) < threshold && i < this.vertices.length);
	// 		result.push((v0 = v1));
	// 	} while (i < this.vertices.length);

	// 	return new Polygon(result);
	// }

	// inset(p1: Point, d: number): void {
	// 	const i1 = this.vertices.findIndex(ppppp => ppppp.equals(p1));
	// 	const i0 = i1 > 0 ? i1 - 1 : this.vertices.length - 1;
	// 	const p0 = this.vertices[i0];
	// 	const i2 = i1 < this.vertices.length - 1 ? i1 + 1 : 0;
	// 	const p2 = this.vertices[i2];
	// 	const i3 = i2 < this.vertices.length - 1 ? i2 + 1 : 0;
	// 	const p3 = this.vertices[i3];

	// 	const v0 = p1.subtract(p0);
	// 	const v1 = p2.subtract(p1);
	// 	const v2 = p3.subtract(p2);

	// 	let cos = v0.dot(v1) / v0.length / v1.length;
	// 	let z = v0.x * v1.y - v0.y * v1.x;
	// 	let t = d / Math.sqrt(1 - cos * cos);
	// 	if (z > 0) {
	// 		t = Math.min(t, v0.length * 0.99);
	// 	} else {
	// 		t = Math.min(t, v1.length * 0.5);
	// 	}
	// 	t *= MathUtils.sign(z);
	// 	this.vertices[i1] = p1.subtract(v0.norm(t));

	// 	cos = v1.dot(v2) / v1.length / v2.length;
	// 	z = v1.x * v2.y - v1.y * v2.x;
	// 	t = d / Math.sqrt(1 - cos * cos);
	// 	if (z > 0) {
	// 		t = Math.min(t, v2.length * 0.99);
	// 	} else {
	// 		t = Math.min(t, v1.length * 0.5);
	// 	}
	// 	this.vertices[i2] = p2.add(v2.norm(t));
	// }

	// insetAll(d: number[]): Polygon {
	// 	const p = new Polygon(this.vertices);
	// 	for (let i = 0; i < p.vertices.length; i++) {
	// 		if (d[i] !== 0) p.inset(p.vertices[i], d[i]);
	// 	}
	// 	return p;
	// }

	// insetEq(d: number): void {
	// 	for (let i = 0; i < this.vertices.length; i++) {
	// 		this.inset(this.vertices[i], d);
	// 	}
	// }

	createBufferedPolygon(d: number[]): Polygon {
		const q = new Polygon();
		let i = 0;
		this.forEdge((v0, v1) => {
			const dd = d[i++];
			if (dd === 0) {
				q.vertices.push(v0.toPoint());
				q.vertices.push(v1.toPoint());
			} else {
				const v = v1.toPoint().subtract(v0);
				const n = v.rotate90().norm(dd);
				q.vertices.push(v0.toPoint().add(n));
				q.vertices.push(v1.toPoint().add(n));
			}
		});

		let wasCut: boolean;
		let lastEdge = 0;
		do {
			wasCut = false;

			const n = q.vertices.length;
			for (i = lastEdge; i < n - 2; i++) {
				lastEdge = i;

				const p11 = q.vertices[i];
				const p12 = q.vertices[i + 1];
				const x1 = p11.x;
				const y1 = p11.y;
				const dx1 = p12.x - x1;
				const dy1 = p12.y - y1;

				for (let j = i + 2; j < (i > 0 ? n : n - 1); j++) {
					const p21 = q.vertices[j];
					const p22 = j < n - 1 ? q.vertices[j + 1] : q.vertices[0];
					const x2 = p21.x;
					const y2 = p21.y;
					const dx2 = p22.x - x2;
					const dy2 = p22.y - y2;

					const int = GeomUtils.intersectLines(x1, y1, dx1, dy1, x2, y2, dx2, dy2);
					if (
						int !== null &&
						int.x > PatchPolygon.DELTA &&
						int.x < 1 - PatchPolygon.DELTA &&
						int.y > PatchPolygon.DELTA &&
						int.y < 1 - PatchPolygon.DELTA
					) {
						const pn = new Point(x1 + dx1 * int.x, y1 + dy1 * int.x);

						q.vertices.splice(j + 1, 0, pn);
						q.vertices.splice(i + 1, 0, pn);

						wasCut = true;
						break;
					}
				}
				if (wasCut) break;
			}
		} while (wasCut);

		const regular = Array.from({ length: q.vertices.length }, (_, i) => i);

		let bestPart: Polygon | null = null;
		let bestPartSq = -Infinity;

		while (regular.length > 0) {
			const indices: number[] = [];
			const start = regular[0];
			let i = start;
			do {
				indices.push(i);
				regular.splice(regular.indexOf(i), 1);

				const next = (i + 1) % q.vertices.length;
				const v = q.vertices[next];
				const next1 = q.vertices.findIndex(ppppp => ppppp.equals(v));
				i = next1 === next ? q.vertices.findLastIndex(ppppp => ppppp.equals(v)) : next1 === -1 ? next : next1;
			} while (i !== start);

			const p = new Polygon(indices.map((index) => q.vertices[index]));
			const s = p.square;
			if (s > bestPartSq) {
				bestPart = p;
				bestPartSq = s;
			}
		}

		return bestPart!;
	}

	// bufferEq(d: number): Polygon {
	// 	return this.buffer(Array.from({ length: this.vertices.length }, () => d));
	// }

	createShrinkedPolygon(d: number[] | number): Polygon {
		if (typeof d == 'number') {
			const actuleD = d;
			d = Array.from({ length: this.vertices.length }, () => actuleD);
		}
		let q = new Polygon(this.vertices.map(x => x.toPoint()));
		let i = 0;
		this.forEdge((v1, v2) => {
			const dd = d[i++];
			if (dd > 0) {
				const v = v2.toPoint().subtract(v1);
				const n = v.rotate90().norm(dd);
				q = q.cut(v1.toPoint().add(n), v2.toPoint().add(n), 0)[0];
			}
		});
		return q;
	}

	// shrinkEq(d: number): Polygon {
	// 	return this.shrink(Array.from({ length: this.vertices.length }, () => d));
	// }

	// peel(v1: Point, d: number): Polygon {
	// 	const i1 = this.vertices.findIndex(ppppp => ppppp.equals(v1));
	// 	const i2 = i1 === this.vertices.length - 1 ? 0 : i1 + 1;
	// 	const v2 = this.vertices[i2];

	// 	const v = v2.subtract(v1);
	// 	const n = v.rotate90().norm(d);

	// 	return this.cut(v1.add(n), v2.add(n), 0)[0];
	// }

	// simplyfy(n: number): void {
	// 	let len = this.vertices.length;
	// 	while (len > n) {
	// 		let result = 0;
	// 		let min = Infinity;

	// 		let b = this.vertices[len - 1];
	// 		let c = this.vertices[0];
	// 		for (let i = 0; i < len; i++) {
	// 			const a = b;
	// 			b = c;
	// 			c = this.vertices[(i + 1) % len];
	// 			const measure = Math.abs(
	// 				a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y)
	// 			);
	// 			if (measure < min) {
	// 				result = i;
	// 				min = measure;
	// 			}
	// 		}

	// 		this.vertices.splice(result, 1);
	// 		len--;
	// 	}
	// }

	findEdge(a: PatchPoint, b: PatchPoint): number {
		const index = this.vertices.indexOf(a);
		return index !== -1 && this.vertices[(index + 1) % this.vertices.length] === (b)
			? index
			: -1;
	}

	next(a: PatchPoint): PatchPoint {
		return this.vertices[(this.vertices.indexOf(a) + 1) % this.vertices.length];
	}

	prev(a: PatchPoint): PatchPoint {
		return this.vertices[
			(this.vertices.indexOf(a) + this.vertices.length - 1) % this.vertices.length
		];
	}

	vector(v: PatchPoint): Point {
		const next = this.next(v);
		return new Point(next.x - v.x, next.y - v.y);
	}

	vectori(i: number): Point {
		const a = this.vertices[i];
		const b = this.vertices[i === this.vertices.length - 1 ? 0 : i + 1];
		return new Point(b.x - a.x, b.y - a.y);
	}

	borders(another: PatchPolygon): boolean {
		const len1 = this.vertices.length;
		const len2 = another.vertices.length;
		for (let i = 0; i < len1; i++) {
			const j = another.vertices.indexOf(this.vertices[i]);
			if (j !== -1) {
				const next = this.vertices[(i + 1) % len1];
				if (
					next === (another.vertices[(j + 1) % len2]) ||
					next === (another.vertices[(j + len2 - 1) % len2])
				)
					return true;
			}
		}
		return false;
	}

	getBounds(): Rectangle {
		const rect = new Rectangle(this.vertices[0].x, this.vertices[0].y);
		for (const v of this.vertices) {
			rect.left = Math.min(rect.left, v.x);
			rect.right = Math.max(rect.right, v.x);
			rect.top = Math.min(rect.top, v.y);
			rect.bottom = Math.max(rect.bottom, v.y);
		}
		return rect;
	}

	// split(p1: Point, p2: Point): Polygon[] {
	// 	return this.spliti(this.vertices.findIndex(ppppp => ppppp.equals(p1)), this.vertices.findIndex(ppppp => ppppp.equals(p2)));
	// }

	// spliti(i1: number, i2: number): Polygon[] {
	// 	if (i1 > i2) {
	// 		const t = i1;
	// 		i1 = i2;
	// 		i2 = t;
	// 	}

	// 	return [
	// 		new Polygon(this.vertices.slice(i1, i2 + 1)),
	// 		new Polygon(this.vertices.slice(i2).concat(this.vertices.slice(0, i1 + 1))),
	// 	];
	// }

	// cut(p1: Point, p2: Point, gap = 0): Polygon[] {
	// 	const x1 = p1.x;
	// 	const y1 = p1.y;
	// 	const dx1 = p2.x - x1;
	// 	const dy1 = p2.y - y1;

	// 	const len = this.vertices.length;
	// 	let edge1 = 0,
	// 		ratio1 = 0.0;
	// 	let edge2 = 0,
	// 		ratio2 = 0.0;
	// 	let count = 0;

	// 	for (let i = 0; i < len; i++) {
	// 		const v0 = this.vertices[i];
	// 		const v1 = this.vertices[(i + 1) % len];

	// 		const x2 = v0.x;
	// 		const y2 = v0.y;
	// 		const dx2 = v1.x - x2;
	// 		const dy2 = v1.y - y2;

	// 		const t = GeomUtils.intersectLines(x1, y1, dx1, dy1, x2, y2, dx2, dy2);
	// 		if (t !== null && t.y >= 0 && t.y <= 1) {
	// 			switch (count) {
	// 				case 0:
	// 					edge1 = i;
	// 					ratio1 = t.x;
	// 					break;
	// 				case 1:
	// 					edge2 = i;
	// 					ratio2 = t.x;
	// 					break;
	// 			}
	// 			count++;
	// 		}
	// 	}

	// 	if (count === 2) {
	// 		const point1 = p1.add(p2.subtract(p1).scale(ratio1));
	// 		const point2 = p1.add(p2.subtract(p1).scale(ratio2));

	// 		let half1 = new Polygon(this.vertices.slice(edge1 + 1, edge2 + 1));
	// 		half1.vertices.unshift(point1);
	// 		half1.vertices.push(point2);

	// 		let half2 = new Polygon(
	// 			this.vertices.slice(edge2 + 1).concat(this.vertices.slice(0, edge1 + 1))
	// 		);
	// 		half2.vertices.unshift(point2);
	// 		half2.vertices.push(point1);

	// 		if (gap > 0) {
	// 			half1 = half1.peel(point2, gap / 2);
	// 			half2 = half2.peel(point1, gap / 2);
	// 		}

	// 		const v = this.vectori(edge1);
	// 		return GeomUtils.cross(dx1, dy1, v.x, v.y) > 0 ? [half1, half2] : [half2, half1];
	// 	} else {
	// 		return [new Polygon(this.vertices)];
	// 	}
	// }

	interpolate(p: Point): number[] {
		let sum = 0.0;
		const dd = this.vertices.map((v) => {
			const d = 1 / v.distance(p);
			sum += d;
			return d;
		});
		return dd.map((d) => d / sum);
	}

	max(f: (v: PatchPoint) => number): PatchPoint {
		let max = f(this.vertices[0]);
		let vmax = this.vertices[0];
		for (const v of this.vertices) {
			const m = f(v);
			if (m > max) {
				max = m;
				vmax = v;
			}
		}
		return vmax;
	}

	min(f: (v: PatchPoint) => number): PatchPoint {
		let min = f(this.vertices[0]);
		let vmin = this.vertices[0];
		for (const v of this.vertices) {
			const m = f(v);
			if (m < min) {
				min = m;
				vmin = v;
			}
		}
		return vmin;
	}

}