import { Point } from "./Point";


export class Spline {
	public static curvature: number = 0.1;

	public static startCurve(p0: Point, p1: Point, p2: Point): Point[] {
		const tangent = new Point(p2.x - p0.x, p2.y - p0.y);
		const control = new Point(
			p1.x - tangent.x * Spline.curvature,
			p1.y - tangent.y * Spline.curvature
		);
		return [control, p1];
	}

	public static endCurve(p0: Point, p1: Point, p2: Point): Point[] {
		const tangent = new Point(p2.x - p0.x, p2.y - p0.y);
		const control = new Point(
			p1.x + tangent.x * Spline.curvature,
			p1.y + tangent.y * Spline.curvature
		);
		return [control, p2];
	}

	public static midCurve(p0: Point, p1: Point, p2: Point, p3: Point): Point[] {
		const tangent1 = new Point(p2.x - p0.x, p2.y - p0.y);
		const tangent2 = new Point(p3.x - p1.x, p3.y - p1.y);

		const p1a = new Point(
			p1.x + tangent1.x * Spline.curvature,
			p1.y + tangent1.y * Spline.curvature
		);
		const p2a = new Point(
			p2.x - tangent2.x * Spline.curvature,
			p2.y - tangent2.y * Spline.curvature
		);
		const p12 = new Point(
			(p1a.x + p2a.x) * 0.5,
			(p1a.y + p2a.y) * 0.5
		);

		return [p1a, p12, p2a, p2];
	}

	// Uncomment and implement if needed
	/*
	public static curvePolygon(g: Graphics, p: Point[]): void {
		g.moveTo(p[0].x, p[0].y);

		const n = p.length;
		let c: Point[];

		c = Spline.startCurve(p[0], p[1], p[2]);
		g.curveTo(c[0].x, c[0].y, c[1].x, c[1].y);

		for (let i = 1; i < n - 2; i++) {
			c = Spline.midCurve(p[i - 1], p[i], p[i + 1], p[i + 2]);
			g.curveTo(c[0].x, c[0].y, c[1].x, c[1].y);
			g.curveTo(c[2].x, c[2].y, c[3].x, c[3].y);
		}

		c = Spline.endCurve(p[n - 3], p[n - 2], p[n - 1]);
		g.curveTo(c[0].x, c[0].y, c[1].x, c[1].y);
	}
	*/
}