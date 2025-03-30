import { Point } from "./Point";


export class Segment {
	public start: Point;
	public end: Point;

	constructor(start: Point, end: Point) {
		this.start = start;
		this.end = end;
	}

	get dx(): number {
		return this.end.x - this.start.x;
	}

	get dy(): number {
		return this.end.y - this.start.y;
	}

	get vector(): Point {
		return new Point(this.end.x - this.start.x, this.end.y - this.start.y);
	}

	get length(): number {
		return this.start.distance(this.end);
	}
}

