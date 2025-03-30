import * as Point from './Point';
import * as Rectangle from './Rectangle';
import * as MathUtils from '../utils/MathUtils';
import * as GeomUtils from './GeomUtils';
import { z } from 'zod';

const DELTA = 0.000001;
const PolygonSchema = z.object({
    vertices: z.array(Point.PointSchema)
});

export type Polygon = z.infer<typeof PolygonSchema>;
export function isPolygon(p: unknown): p is Polygon {
    return PolygonSchema.safeParse(p).success;
}

export function square(p: Polygon): number {
    let v1 = p.vertices[p.vertices.length - 1];
    let v2 = p.vertices[1];
    let s = v1.x * v2.y - v2.x * v1.y;

    for (let i = 2; i < p.vertices.length; i++) {
        v1 = v2;
        v2 = p.vertices[i];
        s += (v1.x * v2.y - v2.x * v1.y);
    }
    return s * 0.5;
}
export function perimeter(p: Polygon): number {
    let len = 0.0;
    for (let i = 0; i < p.vertices.length - 1; i++) {
        len += Point.distance(p.vertices[i], p.vertices[i + 1]);
    }
    return len;
}
export function compactness(p: Polygon): number {
    const perim = perimeter(p);
    return 4 * Math.PI * square(p) / (perim * perim);
}
export function center(p: Polygon): Point.Point {
    const c = { x: 0, y: 0 } satisfies Point.Point;
    for (const v of p.vertices) {
        c.x += v.x;
        c.y += v.y;
    }
    c.x /= p.vertices.length;
    c.y /= p.vertices.length;
    return c;
}
export function centroid(p: Polygon): Point.Point {
    let x = 0.0;
    let y = 0.0;
    let a = 0.0;

    for (let i = 0; i < p.vertices.length - 1; i++) {
        const v0 = p.vertices[i];
        const v1 = p.vertices[i + 1];
        const f = GeomUtils.cross(v0.x, v0.y, v1.x, v1.y);
        a += f;
        x += (v0.x + v1.x) * f;
        y += (v0.y + v1.y) * f;
    }

    const s6 = 1 / (3 * a);
    return { x: s6 * x, y: s6 * y };
}
export function contains(p: Polygon, v: Point.Point): boolean {
    return p.vertices.some(vertex => Point.equals(vertex, v));
}
export function forEdge(p: Polygon, f: (v0: Point.Point, v1: Point.Point) => void): void {
    const len = p.vertices.length;
    for (let i = 0; i < len; i++) {
        f(p.vertices[i], p.vertices[(i + 1) % len]);
    }
}
export function forSegment(p: Polygon, f: (v0: Point.Point, v1: Point.Point) => void): void {
    for (let i = 0; i < p.vertices.length - 1; i++) {
        f(p.vertices[i], p.vertices[i + 1]);
    }
}
export function offset(p: Polygon, dx: number, dy: number): void {
    for (const v of p.vertices) {
        v.x += dx;
        v.y += dy;
    }
}
export function rotate(p: Polygon, a: number): void {
    const cosA = Math.cos(a);
    const sinA = Math.sin(a);
    for (const v of p.vertices) {
        const vx = v.x * cosA - v.y * sinA;
        const vy = v.y * cosA + v.x * sinA;
        v.x = vx;
        v.y = vy;
    }
}
export function isConvexVertexi(p: Polygon, i: number): boolean {
    const len = p.vertices.length;
    const v0 = p.vertices[(i + len - 1) % len];
    const v1 = p.vertices[i];
    const v2 = p.vertices[(i + 1) % len];
    return GeomUtils.cross(v1.x - v0.x, v1.y - v0.y, v2.x - v1.x, v2.y - v1.y) > 0;
}
export function isConvexVertex(p: Polygon, v1: Point.Point): boolean {
    const v0 = prev(p, v1);
    const v2 = next(p, v1);
    return GeomUtils.cross(v1.x - v0.x, v1.y - v0.y, v2.x - v1.x, v2.y - v1.y) > 0;
}
export function isConvex(p: Polygon): boolean {
    for (let i = 0; i < p.vertices.length; i++) {
        if (!isConvexVertexi(p, i)) return false;
    }
    return true;
}
export function smoothVertexi(p: Polygon, i: number, f = 1.0): Point.Point {
    const v = p.vertices[i];
    const len = p.vertices.length;
    const prev = p.vertices[(i + len - 1) % len];
    const next = p.vertices[(i + 1) % len];
    return {
        x: (prev.x + v.x * f + next.x) / (2 + f),
        y: (prev.y + v.y * f + next.y) / (2 + f)
    }
}
export function smoothVertex(p: Polygon, v: Point.Point, f = 1.0): Point.Point {
    const _prev = prev(p, v);
    const _next = next(p, v);
    return {
        x: (_prev.x + v.x * f + _next.x) / (2 + f),
        y: (_prev.y + v.y * f + _next.y) / (2 + f)
    }
}
export function distance(p: Polygon, p1: Point.Point): number {
    let v0 = p.vertices[0];
    let d = Point.distance(v0, p1);
    for (let i = 1; i < p.vertices.length; i++) {
        const v1 = p.vertices[i];
        const d1 = Point.distance(v1, p1);
        if (d1 < d) {
            v0 = v1;
            d = d1;
        }
    }
    return d;
}
export function smoothVertexEq(p: Polygon, f = 1.0): Polygon {
    const len = p.vertices.length;
    let v1 = p.vertices[len - 1];
    let v2 = p.vertices[0];
    const result = [];
    for (let i = 0; i < len; i++) {
        const v0 = v1;
        v1 = v2;
        v2 = p.vertices[(i + 1) % len];
        result.push({
            x: (v0.x + v1.x * f + v2.x) / (2 + f),
            y: (v0.y + v1.y * f + v2.y) / (2 + f)
        });
    }
    return { vertices: (result) };
}
export function filterShort(p: Polygon, threshold: number): Polygon {
    let i = 1;
    let v0 = p.vertices[0];
    let v1 = p.vertices[1];
    const result = [v0];
    do {
        do {
            v1 = p.vertices[i++];
        } while (Point.distance(v0, v1) < threshold && i < p.vertices.length);
        result.push(v0 = v1);
    } while (i < p.vertices.length);
    return { vertices: result };
}
// This function insets one edge defined by its first vertex.
// It's not very relyable, but it usually works (better for convex
// vertices than for concave ones). It doesn't change the number
// of vertices.
export function inset(p: Polygon, p1: Point.Point, d: number): void {
    const i1 = p.vertices.findIndex(v => Point.equals(v, p1));
    const i0 = (i1 > 0 ? i1 - 1 : p.vertices.length - 1);
    const p0 = p.vertices[i0];
    const i2 = (i1 < p.vertices.length - 1 ? i1 + 1 : 0);
    const p2 = p.vertices[i2];
    const i3 = (i2 < p.vertices.length - 1 ? i2 + 1 : 0);
    const p3 = p.vertices[i3];
    const v0 = Point.subtract(p1, p0);
    const v1 = Point.subtract(p2, p1);
    const v2 = Point.subtract(p3, p2);
    let cos = Point.dotProduct(v0, v1) / Point.length(v0) / Point.length(v1);
    let z = v0.x * v1.y - v0.y * v1.x;
    let t = d / Math.sqrt(1 - cos * cos);
    if (z > 0) {
        t = Math.min(t, Point.length(v0) * 0.99);
    } else {
        t = Math.min(t, Point.length(v1) * 0.5);
    }
    t *= MathUtils.sign(z);
    p.vertices[i1] = Point.subtract(p1, Point.normalize(v0, t));
    cos = Point.dotProduct(v1, v2) / Point.length(v1) / Point.length(v2);
    z = v1.x * v2.y - v1.y * v2.x;
    t = d / Math.sqrt(1 - cos * cos);
    if (z > 0) {
        t = Math.min(t, Point.length(v2) * 0.99);
    }
    else {
        t = Math.min(t, Point.length(v1) * 0.5);
    }
    p.vertices[i2] = Point.add(p2, Point.normalize(v2, t));
}
export function insetAll(p: Polygon, d: number[]): Polygon {
    const q = { vertices: [...p.vertices] } satisfies Polygon;
    for (let i = 0; i < q.vertices.length; i++) {
        if (d[i] !== 0 && d[i] !== undefined) {
            inset(q, q.vertices[i], d[i]);
        }
    }
    return q;
}
export function insetEq(p: Polygon, d: number): void {
    for (let i = 0; i < p.vertices.length; i++) {
        inset(p, p.vertices[i], d);
    }
}
export function buffer(p: Polygon, d: number[]): Polygon {
    const q: Polygon = { vertices: [] };
    let i = 0;
    forEdge(p, (v0: Point.Point, v1: Point.Point) => {
        const dd = d[i++];
        if (dd === 0) {
            q.vertices.push(v0);
            q.vertices.push(v1);
        } else {
            const v = Point.subtract(v1, v0);
            const n = Point.normalize(Point.rotate90(v), dd);
            q.vertices.push(Point.add(v0, n));
            q.vertices.push(Point.add(v1, n));
        }
    });
    let wasCut: boolean;
    let lastEdge = 0;
    do {
        wasCut = false;
        const n = q.vertices.length;
        for (let i = lastEdge; i < n - 2; i++) {
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
                if (int != null && int.x > DELTA && int.x < 1 - DELTA && int.y > DELTA && int.y < 1 - DELTA) {
                    const pn: Point.Point = { x: x1 + dx1 * int.x, y: y1 + dy1 * int.x };
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
    let bestPartSq = Number.NEGATIVE_INFINITY;
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
        const p: Polygon = { vertices: (indices.map(i => q.vertices[i])) };
        const s = square(p);
        if (s > bestPartSq) {
            bestPart = p;
            bestPartSq = s;
        }
    }
    if (bestPart == null) {
        throw new Error("Thiis should not happen");
    }
    return bestPart;
}
export function bufferEq(p: Polygon, d: number): Polygon {
    return buffer(p, Array.from({ length: p.vertices.length }, () => d));
}
export function shrink(p: Polygon, d: number[]): Polygon {
    let q = { vertices: [...p.vertices] } satisfies Polygon;
    let i = 0;
    forEdge(p, (v1: Point.Point, v2: Point.Point) => {
        const dd = d[i++];
        if (dd > 0) {
            const v = Point.subtract(v2, v1);
            const n = Point.normalize(Point.rotate90(v), dd);
            q = cut(q, Point.add(v1, n), Point.add(v2, n), 0)[0];
        }
    });
    return q;
}
export function shrinkEq(p: Polygon, d: number): Polygon {
    return shrink(p, Array.from({ length: p.vertices.length }, () => d));
}
export function peel(p: Polygon, v1: Point.Point, d: number): Polygon {
    const i1 = p.vertices.findIndex(v => Point.equals(v, v1));
    const i2 = (i1 === p.vertices.length - 1 ? 0 : i1 + 1);
    const v2 = p.vertices[i2];
    const v = Point.subtract(v2, v1);
    const n = Point.normalize(Point.rotate90(v), d);
    return cut(p, Point.add(v1, n), Point.add(v2, n), 0)[0];
}
export function simplyfy(p: Polygon, n: number): void {
    let len = p.vertices.length;
    while (len > n) {
        let result = 0;
        let min = Number.POSITIVE_INFINITY;
        let b = p.vertices[len - 1];
        let c = p.vertices[0];
        for (let i = 0; i < len; i++) {
            const a = b;
            b = c;
            c = p.vertices[(i + 1) % len];
            const measure = Math.abs(a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y));
            if (measure < min) {
                result = i;
                min = measure;
            }
        }
        p.vertices.splice(result, 1);
        len--;
    }
}
export function findEdge(p: Polygon, a: Point.Point, b: Point.Point): number {
    const index = p.vertices.findIndex(v => Point.equals(v, a));
    return (index !== -1 && p.vertices[(index + 1) % p.vertices.length] === b ? index : -1);
}
export function next(p: Polygon, a: Point.Point): Point.Point {
    const index = p.vertices.findIndex(v => Point.equals(v, a));
    return p.vertices[(index + 1) % p.vertices.length];
}
export function prev(p: Polygon, a: Point.Point): Point.Point {
    const index = p.vertices.findIndex(v => Point.equals(v, a));
    return p.vertices[(index + p.vertices.length - 1) % p.vertices.length];
}
export function vector(p: Polygon, v: Point.Point): Point.Point {
    return Point.subtract(next(p, v), v);
}
export function vectori(p: Polygon, i: number): Point.Point {
    return Point.subtract(p.vertices[i === p.vertices.length - 1 ? 0 : i + 1], p.vertices[i]);
}
export function borders(p: Polygon, another: Polygon): boolean {
    const len1 = p.vertices.length;
    const len2 = another.vertices.length;
    for (let i = 0; i < len1; i++) {
        const j = another.vertices.findIndex(v => Point.equals(v, p.vertices[i]));
        if (j !== -1) {
            const next = p.vertices[(i + 1) % len1];
            if (next === another.vertices[(j + 1) % len2] || next === another.vertices[(j + len2 - 1) % len2]) {
                return true;
            }
        }
    }
    return false;
}
export function getBounds(p: Polygon): Rectangle.Rectangle {
    const rect: Rectangle.Rectangle = { x: p.vertices[0].x, y: p.vertices[0].y, width: 0, height: 0 };
    for (const v of p.vertices) {
        rect.x = Math.min(rect.x, v.x);
        rect.y = Math.min(rect.y, v.y);
        rect.width = Math.max(rect.width, v.x);
        rect.height = Math.max(rect.height, v.y);
    }
    rect.width -= rect.x;
    rect.height -= rect.y;
    return rect;
}
export function split(p: Polygon, p1: Point.Point, p2: Point.Point): Polygon[] {
    return spliti(p, p.vertices.indexOf(p1), p.vertices.indexOf(p2));
}
export function spliti(p: Polygon, i1: number, i2: number): Polygon[] {
    if (i1 > i2) {
        const t = i1;
        i1 = i2;
        i2 = t;
    }
    return [
        { vertices: p.vertices.slice(i1, i2 + 1) },
        { vertices: p.vertices.slice(i2).concat(p.vertices.slice(0, i1 + 1)) }
    ];
}
export function cut(p: Polygon, p1: Point.Point, p2: Point.Point, gap = 0): Polygon[] {
    const x1 = p1.x;
    const y1 = p1.y;
    const dx1 = p2.x - x1;
    const dy1 = p2.y - y1;
    const len = p.vertices.length;
    let edge1 = 0, ratio1 = 0.0;
    let edge2 = 0, ratio2 = 0.0;
    let count = 0;
    for (let i = 0; i < len; i++) {
        const v0 = p.vertices[i];
        const v1 = p.vertices[(i + 1) % len];
        const x2 = v0.x;
        const y2 = v0.y;
        const dx2 = v1.x - x2;
        const dy2 = v1.y - y2;
        const t = GeomUtils.intersectLines(x1, y1, dx1, dy1, x2, y2, dx2, dy2);
        if (t != null && t.y >= 0 && t.y <= 1) {
            switch (count) {
                case 0: edge1 = i; ratio1 = t.x; break;
                case 1: edge2 = i; ratio2 = t.x; break;
            }
            count++;
        }
    }
    if (count === 2) {
        const point1 = Point.add(p1, Point.scale(Point.subtract(p2, p1), ratio1));
        const point2 = Point.add(p1, Point.scale(Point.subtract(p2, p1), ratio2));
        let half1 = { vertices: p.vertices.slice(edge1 + 1, edge2 + 1) } satisfies Polygon;
        half1.vertices.unshift(point1);
        half1.vertices.push(point2);
        let half2 = { vertices: p.vertices.slice(edge2 + 1).concat(p.vertices.slice(0, edge1 + 1)) } satisfies Polygon;
        half2.vertices.unshift(point2);
        half2.vertices.push(point1);
        if (gap > 0) {
            half1 = peel(half1, point2, gap / 2);
            half2 = peel(half2, point1, gap / 2);
        }
        const v = vectori(p, edge1);
        return GeomUtils.cross(dx1, dy1, v.x, v.y) > 0 ? [half1, half2] : [half2, half1];
    } else {
        return [{ vertices: [...p.vertices] }];
    }
}
export function interpolate(p: Polygon, p1: Point.Point): number[] {
    let sum = 0.0;
    const inverseDistances = p.vertices.map(v => {
        const d = 1 / Point.distance(v, p1);
        sum += d;
        return d;
    });
    return inverseDistances.map(d => d / sum);
}
export function rect(w: number = 1.0, h: number = 1.0): Polygon {
    const poly: Polygon = {
        vertices: [
            { x: -w / 2, y: -h / 2 },
            { x: w / 2, y: -h / 2 },
            { x: w / 2, y: h / 2 },
            { x: -w / 2, y: h / 2 },
        ]
    };
    return poly;
}
export function regular(n: number = 8, r: number = 1.0): Polygon {
    const vertices = Array.from({ length: n }, (_, i) => {
        const a = i / n * Math.PI * 2;
        return { x: r * Math.cos(a), y: r * Math.sin(a) };
    });
    return { vertices };
}
export function circle(r: number = 1.0): Polygon {
    return regular(16, r);
}
