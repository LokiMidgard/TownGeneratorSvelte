import { GeomUtils } from "$lib/geom/GeomUtils";
import type { PatchPoint } from "$lib/geom/PatchPolygon";
import { Polygon } from "$lib/geom/Polygon";
import { Random } from "$lib/utils/Random";
import { Building } from "../building/Building";
import type { Model } from "../building/Model";
import type { Patch } from "../building/Patch";
import { Ward } from "./Ward";

export class Market extends Ward {
	override createGeometry(): void {
		// fountain or statue
		const statue = Random.bool(0.6);
		// we always offset a statue and sometimes a fountain
		const offset = statue || Random.bool(0.3);

		let v0: PatchPoint | null = null;
		let v1: PatchPoint | null = null;
		if (statue || offset) {
			// we need an edge both for rotating a statue and offsetting
			let length = -1.0;
			this.patch.shape.forEdge((p0, p1) => {
				const len = p0.distance(p1);
				if (len > length) {
					length = len;
					v0 = p0;
					v1 = p1;
				}
			});
		}

		let object: Polygon;
		if (statue) {
			object = Polygon.rect(1 + Random.float(), 1 + Random.float());
			object.rotate(Math.atan2(v1!.y - v0!.y, v1!.x - v0!.x));
		} else {
			object = Polygon.circle(1 + Random.float());
		}

		if (offset) {
			const gravity = GeomUtils.interpolate(v0!, v1!);
			object.offset(
				GeomUtils.interpolate(
					this.patch.shape.centroid,
					gravity,
					0.2 + Random.float() * 0.4
				)
			);
		} else {
			object.offset(this.patch.shape.centroid);
		}

		this.geometry = [new Building([object])];
	}

	static rateLocation(model: Model, patch: Patch): number {
		// One market should not touch another
		for (const p of model.inner) {
			if (p.ward instanceof Market && p.shape.borders(patch.shape)) {
				return Number.POSITIVE_INFINITY;
			}
		}

		// Market shouldn't be much larger than the plaza
		return model.plaza
			? patch.shape.square / model.plaza.shape.square
			: patch.shape.distance(model.center);
	}

	override getLabel(): string {
		return "Market";
	}
}
