import { GeomUtils } from "$lib/geom/GeomUtils";
import { Polygon } from "$lib/geom/Polygon";
import { Random } from "$lib/utils/Random";
import { Building } from "../building/Building";
import { Ward } from "./Ward";

export class Farm extends Ward {
	override createGeometry(): void {
		const housing = Polygon.rect(4, 4);
		const pos = GeomUtils.interpolate(
			this.patch.shape.vertices[Random.int(0, this.patch.shape.vertices.length - 1)],
			this.patch.shape.centroid,
			0.3 + Random.float() * 0.4
		);
		housing.rotate(Random.float() * Math.PI);
		housing.offset(pos);

		this.geometry = [new Building(Ward.createOrthoBuilding(housing, 8, 0.5))];
	}

	override getLabel(): string {
		return "Farm";
	}
}
