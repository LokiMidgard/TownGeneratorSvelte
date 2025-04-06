

class Rectangle {
    private _x: number;
    private _y: number;
    private _width: number;
    private _height: number;
    public get x(): number {
        return this._x;
    }
    public get y(): number {
        return this._y;
    }
    public get width(): number {
        return this._width;
    }
    public get height(): number {
        return this._height;
    }
    constructor(x: number, y: number, width: number, height: number) {
        this._x = x;
        this._y = y;
        this._width = width;
        this._height = height;
    }
    public clone(): Rectangle {
        return new Rectangle(this.x, this.y, this.width, this.height);
    }
    public static from(r: Rectangle): Rectangle {
        return new Rectangle(r.x, r.y, r.width, r.height);
    }

    public get area(): number {
        return this.width * this.height;
    }

    public get perimeter(): number {
        return 2 * (this.width + this.height);
    }
    public get center(): Point {
        return new Point(this.x + this.width / 2, this.y + this.height / 2);
    }
    public get topLeft(): Point {
        return new Point(this.x, this.y);
    }
    public get topRight(): Point {
        return new Point(this.x + this.width, this.y);
    }
    public get bottomLeft(): Point {
        return new Point(this.x, this.y + this.height);
    }
    public get bottomRight(): Point {
        return new Point(this.x + this.width, this.y + this.height);
    }
    public get top(): number {
        return this.y;
    }
    public get bottom(): number {
        return this.y + this.height;
    }
    public get left(): number {
        return this.x;
    }
    public get right(): number {
        return this.x + this.width;
    }
    public get size(): Point {
        return new Point(this.width, this.height);
    }
    public get isEmpty(): boolean {
        return this.width <= 0 || this.height <= 0;
    }
    public get isSquare(): boolean {
        return this.width === this.height;
    }

    public offset(x: number, y: number): Rectangle;
    public offset(offset: Point): Rectangle;
    public offset(x: number | Point, y?: number): Rectangle {
        if (typeof x === 'object') {
            y = x.y;
            x = x.x;
        }
        if (y === undefined) {
            throw new Error('y is undefined');
        }
        if (x === undefined) {
            throw new Error('x is undefined');
        }
        return new Rectangle(this.x + x, this.y + y, this.width, this.height);
    }
    public scale(scale: number): Rectangle {
        return new Rectangle(this.x, this.y, this.width * scale, this.height * scale);
    }
    public scaleXY(scaleX: number, scaleY: number): Rectangle {
        return new Rectangle(this.x, this.y, this.width * scaleX, this.height * scaleY);
    }

    public rotate90(clockwise: boolean): Rectangle {
        if (clockwise) {
            return new Rectangle(this.x, this.y, this.height, this.width);
        } else {
            return new Rectangle(this.x, this.y, this.height, this.width);
        }
    }


    public toPath(): PathSpecefied<typeof this.closed> {
        const points = [
            new Point(this.x, this.y),
            new Point(this.x + this.width, this.y),
            new Point(this.x + this.width, this.y + this.height),
            new Point(this.x, this.y + this.height)
        ];
        return new ClosedPath(points);
    }

}

class Point {
    private _x: number;
    private _y: number;
    public get x(): number {
        return this._x;
    }
    public get y(): number {
        return this._y;
    }

    public get length(): number {
        return Math.sqrt(this.x ** 2 + this.y ** 2);
    }

    public get lengthSquared(): number {
        return this.x ** 2 + this.y ** 2;
    }
    public get angleDegree(): number {
        return this.angleRadian * (180 / Math.PI);
    }
    public get angleRadian(): number {
        return Math.atan2(this.y, this.x);
    }
    public get isZero(): boolean {
        return this.x === 0 && this.y === 0;
    }
    constructor(x: number, y: number) {
        this._x = x;
        this._y = y;
    }

    public clone(): Point {
        return new Point(this.x, this.y);
    }

    public static from(p: Point): Point {
        return new Point(p.x, p.y);
    }

    public static fromXY(x: number, y: number): Point {
        return new Point(x, y);
    }

    public offset(x: number, y: number): Point;
    public offset(offset: Point): Point;
    public offset(x: number | Point, y?: number): Point {
        if (typeof x === 'object') {
            y = x.y;
            x = x.x;
        }
        if (y === undefined) {
            throw new Error('y is undefined');
        }
        if (x === undefined) {
            throw new Error('x is undefined');
        }
        return new Point(this.x + x, this.y + y);
    }

    public add(p: Point): Point {
        return new Point(this.x + p.x, this.y + p.y);
    }
    public subtract(p: Point): Point {
        return new Point(this.x - p.x, this.y - p.y);
    }
    public multiply(p: Point): Point {
        return new Point(this.x * p.x, this.y * p.y);
    }
    public divide(p: Point): Point {
        if (p.x === 0 || p.y === 0) {
            throw new Error('Division by zero');
        }
        return new Point(this.x / p.x, this.y / p.y);
    }


    public scale(scale: number): Point {
        return new Point(this.x * scale, this.y * scale);
    }
    public scaleXY(scaleX: number, scaleY: number): Point;
    public scaleXY(scale: Point): Point;
    public scaleXY(scaleX: number | Point, scaleY?: number): Point {
        if (typeof scaleX === 'object') {
            scaleY = scaleX.y;
            scaleX = scaleX.x;
        }
        if (scaleY === undefined) {
            throw new Error('scaleY is undefined');
        }
        if (scaleX === undefined) {
            throw new Error('scaleX is undefined');
        }
        return new Point(this.x * scaleX, this.y * scaleY);
    }

    public normalize(): Point {
        const length = this.length;
        if (length === 0) {
            return new Point(0, 0);
        }
        return new Point(this.x / length, this.y / length);
    }

    public dot(p: Point): number {
        return this.x * p.x + this.y * p.y;
    }
}

class Edge {
    public start: Point;
    public end: Point;
    constructor(start: Point, end: Point) {
        this.start = start;
        this.end = end;
    }

    public get vector(): Point {
        return new Point(this.end.x - this.start.x, this.end.y - this.start.y);
    }
    public get lengthSquared(): number {
        return this.vector.lengthSquared;
    }
    public get length(): number {
        return this.vector.length;
    }




    public clone(): Edge {
        return new Edge(this.start.clone(), this.end.clone());
    }

    public offset(x: number, y: number): Edge;
    public offset(offset: Point): Edge;
    public offset(x: number | Point, y?: number): Edge {
        if (typeof x === 'object') {
            y = x.y;
            x = x.x;
        }
        if (y === undefined) {
            throw new Error('y is undefined');
        }
        if (x === undefined) {
            throw new Error('x is undefined');
        }
        return new Edge(this.start.offset(x, y), this.end.offset(x, y));
    }
    public scale(scale: number): Edge {
        return new Edge(this.start.scale(scale), this.end.scale(scale));
    }
    public scaleXY(scaleX: number, scaleY: number): Edge;
    public scaleXY(scale: Point): Edge;
    public scaleXY(scaleX: number | Point, scaleY?: number): Edge {
        if (typeof scaleX === 'object') {
            scaleY = scaleX.y;
            scaleX = scaleX.x;
        }
        if (scaleY === undefined) {
            throw new Error('scaleY is undefined');
        }
        if (scaleX === undefined) {
            throw new Error('scaleX is undefined');
        }
        return new Edge(this.start.scaleXY(scaleX, scaleY), this.end.scaleXY(scaleX, scaleY));
    }

    /**
     * Calculates the distance to the nearest point on the edge.
     * @param p The point to calculate the distance to
     * @returns The distance to the nearest point on the edge
     */
    public distanceToEdge(p: Point): number {
        return Math.sqrt(this.distanceToEdgeSquared(p));
    }

    /**
     * Calculates the squared distance to the nearest point on the edge.
     * This is more efficient than distanceToEdge, as it avoids the square root calculation.
     * @param p The point to calculate the distance to
     * @returns The squared distance to the nearest point on the edge
     * @remarks This method is useful for performance-sensitive applications where the exact distance is not needed.
     */
    public distanceToEdgeSquared(p: Point): number {
        const edgeLengthSquared = this.lengthSquared;

        if (edgeLengthSquared === 0) {
            return new Edge(this.start, p).lengthSquared;
        }

        const edgeVector = this.vector;
        const pointVectorFromStart = p.subtract(this.start);

        // Project pointVectorFromStart onto edgeVector (squared length version)
        const projectionLength = pointVectorFromStart.dot(edgeVector) / edgeLengthSquared;

        if (projectionLength < 0) {
            // The point is before the start of the edge
            return pointVectorFromStart.lengthSquared;
        }

        if (projectionLength > 1) {
            // The point is after the end of the edge
            const pointVectorFromEnd = p.subtract(this.end);
            return pointVectorFromEnd.lengthSquared;
        }

        // Calculate the projection point
        const projectionVector = edgeVector.scale(projectionLength);
        const projectionPoint = this.start.add(projectionVector);

        const distanceVector = p.subtract(projectionPoint);
        return distanceVector.lengthSquared;
    }
}

abstract class BasePath  {

    abstract get closed(): boolean;
    abstract get opend(): boolean;

    protected _vertices: Point[];
    public get vertices(): Point[] {
        return this._vertices;
    }
    public get length(): number {
        return this._vertices.length;
    }
    constructor(vertices: Point[]) {
        this._vertices = vertices;
    }

    public get boundingBox(): Rectangle {
        if (this._vertices.length === 0) {
            return new Rectangle(0, 0, 0, 0);
        }
        let minX = this._vertices[0].x;
        let minY = this._vertices[0].y;
        let maxX = this._vertices[0].x;
        let maxY = this._vertices[0].y;
        for (const vertex of this._vertices) {
            if (vertex.x < minX) {
                minX = vertex.x;
            }
            if (vertex.y < minY) {
                minY = vertex.y;
            }
            if (vertex.x > maxX) {
                maxX = vertex.x;
            }
            if (vertex.y > maxY) {
                maxY = vertex.y;
            }
        }
        return new Rectangle(minX, minY, maxX - minX, maxY - minY);
    }

    public get center(): Point {
        const bbox = this.boundingBox;
        return new Point(bbox.x + bbox.width / 2, bbox.y + bbox.height / 2);
    }

    public abstract get segments(): Edge[];

    public abstract clone(): Path;

    public map(transform: (p: Point, i: number) => Point): PathSpecefied<typeof this.closed> {
        const newVertices = this._vertices.map((v, i) => transform(v, i));
        return Path.create(newVertices, this.closed);
    }

    public replaceVertices(start: number, end: number, newVertices: Point[]): PathSpecefied<typeof this.closed> {
        const newVerticesList = this._vertices.slice(0, start).concat(newVertices).concat(this._vertices.slice(end));
        return Path.create(newVerticesList, this.closed);
    }

    public addVertices(vertices: Point[], index?: number): PathSpecefied<typeof this.closed> {
        if (index === undefined) {
            index = this._vertices.length;
        }
        const newVertices = this._vertices.slice(0, index).concat(vertices).concat(this._vertices.slice(index));
        return Path.create(newVertices, this.closed);
    }

    public addVertex(vertex: Point, index?: number): PathSpecefied<typeof this.closed> {
        return this.addVertices([vertex], index);
    }

    public removeVertices(start: number, end: number): PathSpecefied<typeof this.closed> {
        const newVertices = this._vertices.slice(0, start).concat(this._vertices.slice(end));
        return Path.create(newVertices, this.closed);
    }
    public removeVertex(index: number): PathSpecefied<typeof this.closed> {
        return this.removeVertices(index, index + 1);
    }
    public removeLastVertex(): PathSpecefied<typeof this.closed> {
        return this.removeVertex(this._vertices.length - 1);
    }
    public removeFirstVertex(): PathSpecefied<typeof this.closed> {
        return this.removeVertex(0);
    }
    public replaceVertex(index: number, vertex: Point): PathSpecefied<typeof this.closed> {
        const newVertices = this._vertices.slice(0, index).concat(vertex).concat(this._vertices.slice(index + 1));
        return Path.create(newVertices, this.closed);
    }

    public slice(start: number, end: number): PathSpecefied<typeof this.closed> {
        const newVertices = this._vertices.slice(start, end);
        return Path.create(newVertices, this.closed);
    }

    public reverse(): PathSpecefied<typeof this.closed> {
        const newVertices = this._vertices.slice().reverse();
        return Path.create(newVertices, this.closed);
    }

    public isVertexConvex(i: number): boolean;
    public isVertexConvex(p: Point): boolean;
    public isVertexConvex(p: Point | number): boolean {
        const current = typeof p === 'number' ? this._vertices[p] : p;
        const prev = this._vertices[(this._vertices.length + this._vertices.indexOf(current) - 1) % this._vertices.length];
        const next = this._vertices[(this._vertices.length + this._vertices.indexOf(current) + 1) % this._vertices.length];
        const cross = (next.x - current.x) * (prev.y - current.y) - (next.y - current.y) * (prev.x - current.x);
        return cross >= 0;
    }

    public isVertexConcave(i: number): boolean;
    public isVertexConcave(p: Point): boolean;
    public isVertexConcave(p: Point | number): boolean {
        if (typeof p === 'number') {
            return this.isVertexConvex(p);
        } else {
            return !this.isVertexConvex(p);
        }
    }

    public isVertexReflex(i: number): boolean;
    public isVertexReflex(p: Point): boolean;
    public isVertexReflex(p: Point | number): boolean {
        const current = typeof p === 'number' ? this._vertices[p] : p;
        const prev = this._vertices[(this._vertices.length + this._vertices.indexOf(current) - 1) % this._vertices.length];
        const next = this._vertices[(this._vertices.length + this._vertices.indexOf(current) + 1) % this._vertices.length];
        const cross = (next.x - current.x) * (prev.y - current.y) - (next.y - current.y) * (prev.x - current.x);
        return cross < 0;
    }

    public rotateDegree(angleInDegree: number): PathSpecefied<typeof this.closed> {
        const angleInRadian = (angleInDegree * Math.PI) / 180;
        return this.rotateRadian(angleInRadian);
    }
    public rotateRadian(angleInRadian: number): PathSpecefied<typeof this.closed> {
        const cos = Math.cos(angleInRadian);
        const sin = Math.sin(angleInRadian);
        const newVertices = this._vertices.map(v => {
            const x = v.x * cos - v.y * sin;
            const y = v.x * sin + v.y * cos;
            return new Point(x, y);
        });
        return Path.create(newVertices, this.closed);
    }

    /**
     * Performs a simplification of the path using the Douglas-Peucker algorithm.
     * @param tolerance The tolerance for the simplification. A smaller value will result in a more detailed path, while a larger value will result in a simpler path.
     * @returns A simplified version of the path.
     */
    public simplify(tolerance: number): PathSpecefied<typeof this.closed> {
        // using Douglas-Peucker algorithm ringwise only between two segments
        // this has probably a hihger computation time than the original algorithm, since we can't discard multiple points
        // but it will work for open and closed paths

        if (this._vertices.length < 3 || tolerance <= 0) {
            return this.clone();
        }
        const toleranceSquared = tolerance * tolerance;

        let simplifiedPath: PathSpecefied<typeof this.closed> = this;
        for (let i = 0; i < simplifiedPath.segments.length; i++) {
            const edge = simplifiedPath.segments[i];
            const nextEdge = simplifiedPath.segments[(i + 1) % simplifiedPath.segments.length];
            const virtualEdge = new Edge(edge.start, nextEdge.end);
            const distanceSquared = virtualEdge.distanceToEdgeSquared(edge.end);
            if (distanceSquared < toleranceSquared) {
                simplifiedPath = simplifiedPath.removeVertices(i + 1, i + 2);

            }

        }



    }
}

class ClosedPath extends BasePath {
    public get closed() { return true; }
    public get opend() { return false; }

    public get segments(): Edge[] {
        const edges: Edge[] = [];
        for (let i = 0; i < this._vertices.length; i++) {
            const start = this._vertices[i];
            const end = this._vertices[(i + 1) % this._vertices.length];
            edges.push(new Edge(start, end));
        }
        return edges;
    }

    public clone(): PathSpecefied<typeof this.closed> {
        return new ClosedPath(this.vertices.map(v => v.clone()));
    }

    constructor(vertices: Point[]) {
        super(vertices);
    }

    public get area(): number {
        let area = 0;
        for (let i = 0; i < this._vertices.length; i++) {
            const p1 = this._vertices[i];
            const p2 = this._vertices[(i + 1) % this._vertices.length];
            area += (p2.x - p1.x) * (p2.y + p1.y);
        }
        return area / 2;
    }
    public get centroid(): Point {
        let cx = 0, cy = 0;
        for (let i = 0; i < this._vertices.length; i++) {
            const p1 = this._vertices[i];
            const p2 = this._vertices[(i + 1) % this._vertices.length];
            const cross = (p2.x - p1.x) * (p2.y + p1.y);
            cx += (p1.x + p2.x) * cross;
            cy += (p1.y + p2.y) * cross;
        }
        const area = this.area;
        cx /= 6 * area;
        cy /= 6 * area;
        return new Point(cx, cy);
    }

    private isClockwise(): boolean {
        let sum = 0;
        for (let i = 0; i < this._vertices.length; i++) {
            const p1 = this._vertices[i];
            const p2 = this._vertices[(i + 1) % this._vertices.length];
            sum += (p2.x - p1.x) * (p2.y + p1.y);
        }
        return sum > 0;
    }
}

class OpenPath extends BasePath {
    public get closed() { return false; }
    public get opend() { return true; }

    public get segments(): Edge[] {
        const edges: Edge[] = [];
        for (let i = 0; i < this._vertices.length - 1; i++) {
            const start = this._vertices[i];
            const end = this._vertices[i + 1];
            edges.push(new Edge(start, end));
        }
        return edges;
    }

    public clone(): PathSpecefied<typeof this.closed> {
        return new OpenPath(this.vertices.map(v => v.clone()));
    }

    constructor(vertices: Point[]) {
        super(vertices);
    }

}

export type Path = ClosedPath | OpenPath;
type PathSpecefied<T extends boolean> = T extends true ? ClosedPath : OpenPath;
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Path {
    export function create(vertices: Point[], closed: boolean): PathSpecefied<typeof closed> {
        if (closed) {
            return new ClosedPath(vertices);
        } else {
            return new OpenPath(vertices);
        }
    }
}
