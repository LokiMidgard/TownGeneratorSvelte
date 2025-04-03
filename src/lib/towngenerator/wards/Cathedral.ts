
import { Cutter } from "../building/Cutter";
import { Patch } from "../building/Patch";
import { Model } from "../building/Model";
import { Ward } from "./Ward";
import { Random } from "$lib/utils/Random";
import { Building } from "../building/Building";

export class Cathedral extends Ward {
	override createGeometry(): void {
		const cityBlock = this.getCityBlock().inflateEq(0.8);
		this.geometry = [new Building(Random.bool(0.4)
			? Cutter.ring(cityBlock, 2 + Random.float() * 4)
			: Ward.createOrthoBuilding(cityBlock, 50, 0.8))];
	}

	public static rateLocation(model: Model, patch: Patch): number {
		// Ideally the main temple should overlook the plaza,
		// otherwise it should be as close to the plaza as possible
		return model.plaza && patch.shape.borders(model.plaza.shape)
			? -1 / patch.shape.square
			: patch.shape.distance(model.plaza ? model.plaza.shape.center : model.center!) * patch.shape.square;
	}

	override getLabel(): string {
		return "Temple";
	}
}
