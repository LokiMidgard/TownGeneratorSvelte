import type { IPointLike, PatchPoint } from "./PatchPolygon";
import { Point } from "./Point";

export class GeomUtils {


	public static intersectLines(x1: number, y1: number, dx1: number, dy1: number, x2: number, y2: number, dx2: number, dy2: number): Point | null {
		const d = dx1 * dy2 - dy1 * dx2;
		if (d == 0)
			return null;

		const t2 = (dy1 * (x2 - x1) - dx1 * (y2 - y1)) / d;
		const t1 = dx1 != 0 ?
			(x2 - x1 + dx2 * t2) / dx1 :
			(y2 - y1 + dy2 * t2) / dy1;

		return new Point(t1, t2);
	}
	public static interpolate(p1: IPointLike, p2: IPointLike, ratio = 0.5): Point {
		const d = new Point(p2.x - p1.x, p2.y - p1.y);
		return new Point(p1.x + d.x * ratio, p1.y + d.y * ratio);
	}
	public static scalar(x1: number, y1: number, x2: number, y2: number): number {
		return x1 * x2 + y1 * y2;
	}
	public static cross(x1: number, y1: number, x2: number, y2: number): number {
		return x1 * y2 - y1 * x2;
	}
	public static distance2line(x1: number, y1: number, dx1: number, dy1: number, x0: number, y0: number): number {
		return (dx1 * y0 - dy1 * x0 + (y1 + dy1) * x1 - (x1 + dx1) * y1) / Math.sqrt(dx1 * dx1 + dy1 * dy1);
	}




}