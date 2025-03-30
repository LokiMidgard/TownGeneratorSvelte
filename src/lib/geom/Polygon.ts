import { Point } from './Point'; // Assuming Point is defined in a separate file
import { Rectangle } from './Rectangle'; // Assuming Rectangle is defined in a separate file
import { MathUtils } from '$lib/utils/MathUtils'; // Assuming MathUtils is defined in a separate file
import { GeomUtils } from './GeomUtils';

export class Polygon {
	private static readonly DELTA = 0.000001;
	public vertices: Point[];

	constructor(vertices: Point[] = []) {
		this.vertices = vertices.slice();
	}

	clone(): Polygon {
		return new Polygon(this.vertices.map((v) => v.clone()));
	}

	set(p: Polygon): void {
		for (let i = 0; i < p.vertices.length; i++) {
			this.vertices[i] = p.vertices[i].clone();
		}
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
		const c = new Point(0, 0);
		for (const v of this.vertices) {
			c.addEq(v);
		}
		c.scaleEq(1 / this.vertices.length);
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

	contains(v: Point): boolean {
		return this.vertices.includes(v);
	}

	forEdge(f: (v0: Point, v1: Point) => void): void {
		const len = this.vertices.length;
		for (let i = 0; i < len; i++) {
			f(this.vertices[i], this.vertices[(i + 1) % len]);
		}
	}

	forSegment(f: (v0: Point, v1: Point) => void): void {
		for (let i = 0; i < this.vertices.length - 1; i++) {
			f(this.vertices[i], this.vertices[i + 1]);
		}
	}

	offset(p: Point): void {
		const dx = p.x;
		const dy = p.y;
		for (const v of this.vertices) {
			v.offsetEq(dx, dy);
		}
	}

	rotate(a: number): void {
		const cosA = Math.cos(a);
		const sinA = Math.sin(a);
		for (const v of this.vertices) {
			const vx = v.x * cosA - v.y * sinA;
			const vy = v.y * cosA + v.x * sinA;
			v.setTo(vx, vy);
		}
	}

	isConvexVertexi(i: number): boolean {
		const len = this.vertices.length;
		const v0 = this.vertices[(i + len - 1) % len];
		const v1 = this.vertices[i];
		const v2 = this.vertices[(i + 1) % len];
		return GeomUtils.cross(v1.x - v0.x, v1.y - v0.y, v2.x - v1.x, v2.y - v1.y) > 0;
	}

	isConvexVertex(v1: Point): boolean {
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

	smoothVertexi(i: number, f = 1.0): Point {
		const v = this.vertices[i];
		const len = this.vertices.length;
		const prev = this.vertices[(i + len - 1) % len];
		const next = this.vertices[(i + 1) % len];
		return new Point(
			(prev.x + v.x * f + next.x) / (2 + f),
			(prev.y + v.y * f + next.y) / (2 + f)
		);
	}

	smoothVertex(v: Point, f = 1.0): Point {
		const prev = this.prev(v);
		const next = this.next(v);
		return new Point(
			prev.x + v.x * f + next.x,
			prev.y + v.y * f + next.y
		).scale(1 / (2 + f));
	}

	distance(p: Point): number {
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

	smoothVertexEq(f = 1.0): Polygon {
		const len = this.vertices.length;
		let v1 = this.vertices[len - 1];
		let v2 = this.vertices[0];
		return new Polygon(
			Array.from({ length: len }, (_, i) => {
				const v0 = v1;
				v1 = v2;
				v2 = this.vertices[(i + 1) % len];
				return new Point(
					(v0.x + v1.x * f + v2.x) / (2 + f),
					(v0.y + v1.y * f + v2.y) / (2 + f)
				);
			})
		);
	}

	filterShort(threshold: number): Polygon {
		let i = 1;
		let v0 = this.vertices[0];
		let v1 = this.vertices[1];
		const result = [v0];
		do {
			do {
				v1 = this.vertices[i++];
			} while (v0.distance(v1) < threshold && i < this.vertices.length);
			result.push((v0 = v1));
		} while (i < this.vertices.length);

		return new Polygon(result);
	}

	inset(p1: Point, d: number): void {
		const i1 = this.vertices.indexOf(p1);
		const i0 = i1 > 0 ? i1 - 1 : this.vertices.length - 1;
		const p0 = this.vertices[i0];
		const i2 = i1 < this.vertices.length - 1 ? i1 + 1 : 0;
		const p2 = this.vertices[i2];
		const i3 = i2 < this.vertices.length - 1 ? i2 + 1 : 0;
		const p3 = this.vertices[i3];

		const v0 = p1.subtract(p0);
		const v1 = p2.subtract(p1);
		const v2 = p3.subtract(p2);

		let cos = v0.dot(v1) / v0.length / v1.length;
		let z = v0.x * v1.y - v0.y * v1.x;
		let t = d / Math.sqrt(1 - cos * cos);
		if (z > 0) {
			t = Math.min(t, v0.length * 0.99);
		} else {
			t = Math.min(t, v1.length * 0.5);
		}
		t *= MathUtils.sign(z);
		this.vertices[i1] = p1.subtract(v0.norm(t));

		cos = v1.dot(v2) / v1.length / v2.length;
		z = v1.x * v2.y - v1.y * v2.x;
		t = d / Math.sqrt(1 - cos * cos);
		if (z > 0) {
			t = Math.min(t, v2.length * 0.99);
		} else {
			t = Math.min(t, v1.length * 0.5);
		}
		this.vertices[i2] = p2.add(v2.norm(t));
	}

	insetAll(d: number[]): Polygon {
		const p = new Polygon(this.vertices);
		for (let i = 0; i < p.vertices.length; i++) {
			if (d[i] !== 0) p.inset(p.vertices[i], d[i]);
		}
		return p;
	}

	insetEq(d: number): void {
		for (let i = 0; i < this.vertices.length; i++) {
			this.inset(this.vertices[i], d);
		}
	}

	buffer(d: number[]): Polygon {
		const q = new Polygon();
		let i = 0;
		this.forEdge((v0, v1) => {
			const dd = d[i++];
			if (dd === 0) {
				q.vertices.push(v0);
				q.vertices.push(v1);
			} else {
				const v = v1.subtract(v0);
				const n = v.rotate90().norm(dd);
				q.vertices.push(v0.add(n));
				q.vertices.push(v1.add(n));
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
						int.x > Polygon.DELTA &&
						int.x < 1 - Polygon.DELTA &&
						int.y > Polygon.DELTA &&
						int.y < 1 - Polygon.DELTA
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
				const next1 = q.vertices.indexOf(v);
				i = next1 === next ? q.vertices.lastIndexOf(v) : next1 === -1 ? next : next1;
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

	bufferEq(d: number): Polygon {
		return this.buffer(Array.from({ length: this.vertices.length }, () => d));
	}

	shrink(d: number[]): Polygon {
		let q = new Polygon(this.vertices);
		let i = 0;
		this.forEdge((v1, v2) => {
			const dd = d[i++];
			if (dd > 0) {
				const v = v2.subtract(v1);
				const n = v.rotate90().norm(dd);
				q = q.cut(v1.add(n), v2.add(n), 0)[0];
			}
		});
		return q;
	}

	shrinkEq(d: number): Polygon {
		return this.shrink(Array.from({ length: this.vertices.length }, () => d));
	}

	peel(v1: Point, d: number): Polygon {
		const i1 = this.vertices.indexOf(v1);
		const i2 = i1 === this.vertices.length - 1 ? 0 : i1 + 1;
		const v2 = this.vertices[i2];

		const v = v2.subtract(v1);
		const n = v.rotate90().norm(d);

		return this.cut(v1.add(n), v2.add(n), 0)[0];
	}

	simplyfy(n: number): void {
		let len = this.vertices.length;
		while (len > n) {
			let result = 0;
			let min = Infinity;

			let b = this.vertices[len - 1];
			let c = this.vertices[0];
			for (let i = 0; i < len; i++) {
				const a = b;
				b = c;
				c = this.vertices[(i + 1) % len];
				const measure = Math.abs(
					a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y)
				);
				if (measure < min) {
					result = i;
					min = measure;
				}
			}

			this.vertices.splice(result, 1);
			len--;
		}
	}

	findEdge(a: Point, b: Point): number {
		const index = this.vertices.indexOf(a);
		return index !== -1 && this.vertices[(index + 1) % this.vertices.length] === b
			? index
			: -1;
	}

	next(a: Point): Point {
		return this.vertices[(this.vertices.indexOf(a) + 1) % this.vertices.length];
	}

	prev(a: Point): Point {
		return this.vertices[
			(this.vertices.indexOf(a) + this.vertices.length - 1) % this.vertices.length
		];
	}

	vector(v: Point): Point {
		return this.next(v).subtract(v);
	}

	vectori(i: number): Point {
		return this.vertices[i === this.vertices.length - 1 ? 0 : i + 1].subtract(
			this.vertices[i]
		);
	}

	borders(another: Polygon): boolean {
		const len1 = this.vertices.length;
		const len2 = another.vertices.length;
		for (let i = 0; i < len1; i++) {
			const j = another.vertices.indexOf(this.vertices[i]);
			if (j !== -1) {
				const next = this.vertices[(i + 1) % len1];
				if (
					next === another.vertices[(j + 1) % len2] ||
					next === another.vertices[(j + len2 - 1) % len2]
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

	split(p1: Point, p2: Point): Polygon[] {
		return this.spliti(this.vertices.indexOf(p1), this.vertices.indexOf(p2));
	}

	spliti(i1: number, i2: number): Polygon[] {
		if (i1 > i2) {
			const t = i1;
			i1 = i2;
			i2 = t;
		}

		return [
			new Polygon(this.vertices.slice(i1, i2 + 1)),
			new Polygon(this.vertices.slice(i2).concat(this.vertices.slice(0, i1 + 1))),
		];
	}

	cut(p1: Point, p2: Point, gap = 0): Polygon[] {
		const x1 = p1.x;
		const y1 = p1.y;
		const dx1 = p2.x - x1;
		const dy1 = p2.y - y1;

		const len = this.vertices.length;
		let edge1 = 0,
			ratio1 = 0.0;
		let edge2 = 0,
			ratio2 = 0.0;
		let count = 0;

		for (let i = 0; i < len; i++) {
			const v0 = this.vertices[i];
			const v1 = this.vertices[(i + 1) % len];

			const x2 = v0.x;
			const y2 = v0.y;
			const dx2 = v1.x - x2;
			const dy2 = v1.y - y2;

			const t = GeomUtils.intersectLines(x1, y1, dx1, dy1, x2, y2, dx2, dy2);
			if (t !== null && t.y >= 0 && t.y <= 1) {
				switch (count) {
					case 0:
						edge1 = i;
						ratio1 = t.x;
						break;
					case 1:
						edge2 = i;
						ratio2 = t.x;
						break;
				}
				count++;
			}
		}

		if (count === 2) {
			const point1 = p1.add(p2.subtract(p1).scale(ratio1));
			const point2 = p1.add(p2.subtract(p1).scale(ratio2));

			let half1 = new Polygon(this.vertices.slice(edge1 + 1, edge2 + 1));
			half1.vertices.unshift(point1);
			half1.vertices.push(point2);

			let half2 = new Polygon(
				this.vertices.slice(edge2 + 1).concat(this.vertices.slice(0, edge1 + 1))
			);
			half2.vertices.unshift(point2);
			half2.vertices.push(point1);

			if (gap > 0) {
				half1 = half1.peel(point2, gap / 2);
				half2 = half2.peel(point1, gap / 2);
			}

			const v = this.vectori(edge1);
			return GeomUtils.cross(dx1, dy1, v.x, v.y) > 0 ? [half1, half2] : [half2, half1];
		} else {
			return [new Polygon(this.vertices)];
		}
	}

	interpolate(p: Point): number[] {
		let sum = 0.0;
		const dd = this.vertices.map((v) => {
			const d = 1 / v.distance(p);
			sum += d;
			return d;
		});
		return dd.map((d) => d / sum);
	}

	max(f: (v: Point) => number): Point {
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

	min(f: (v: Point) => number): Point {
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

	static rect(w = 1.0, h = 1.0): Polygon {
		return new Polygon([
			new Point(-w / 2, -h / 2),
			new Point(w / 2, -h / 2),
			new Point(w / 2, h / 2),
			new Point(-w / 2, h / 2),
		]);
	}

	static regular(n = 8, r = 1.0): Polygon {
		return new Polygon(
			Array.from({ length: n }, (_, i) => {
				const a = (i / n) * Math.PI * 2;
				return new Point(r * Math.cos(a), r * Math.sin(a));
			})
		);
	}

	static circle(r = 1.0): Polygon {
		return Polygon.regular(16, r);
	}
}