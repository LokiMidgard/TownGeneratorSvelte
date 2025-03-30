import type { Point } from "$lib/geom/Point";
import { Polygon } from "$lib/geom/Polygon";
import type { Region } from "$lib/geom/Voronoi";
import type { Ward } from "../wards/Ward";

export class Patch {
	shape: Polygon;
	ward: Ward | null;

	withinWalls: boolean;
	withinCity: boolean;

	constructor(vertices: Point[]) {
		this.shape = new Polygon(vertices);

		this.withinCity = false;
		this.withinWalls = false;
		this.ward = null;
	}

	static fromRegion(r: Region): Patch {
		return new Patch(r.vertices.map(tr => tr.c));
	}
}
