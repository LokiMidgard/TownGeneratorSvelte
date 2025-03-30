
import { Patch } from "../building/Patch";
import { Model } from "../building/Model";
import { CommonWard } from "./CommonWard";
import { Random } from "$lib/utils/Random";

export class MerchantWard extends CommonWard {
	constructor(model: Model, patch: Patch) {
		super(
			model,
			patch,
			50 + 60 * Random.float() * Random.float(), // medium to large
			0.5 + Random.float() * 0.3, 0.7,           // moderately regular
			0.15
		);
	}

	public static rateLocation(model: Model, patch: Patch): number {
		// Merchant ward should be as close to the center as possible
		return patch.shape.distance(
			model.plaza ? model.plaza.shape.center : model.center
		);
	}

	public override getLabel(): string {
		return "Merchant";
	}
}
