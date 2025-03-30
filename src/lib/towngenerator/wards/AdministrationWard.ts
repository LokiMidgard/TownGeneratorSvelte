
import { Patch } from "../building/Patch";
import { Model } from "../building/Model";
import { CommonWard } from "./CommonWard";
import { Random } from "$lib/utils/Random";

export class AdministrationWard extends CommonWard {
	constructor(model: Model, patch: Patch) {
		super(
			model,
			patch,
			80 + 30 * Random.float() * Random.float(), // large
			0.1 + Random.float() * 0.3, 0.3 // regular
		);
	}

	public static rateLocation(model: Model, patch: Patch): number {
		// Ideally administration ward should overlook the plaza,
		// otherwise it should be as close to the plaza as possible
		if (model.plaza) {
			return patch.shape.borders(model.plaza.shape)
				? 0
				: patch.shape.distance(model.plaza.shape.center);
		} else {
			return patch.shape.distance(model.center!);
		}
	}

	public getLabel(): string {
		return "Administration";
	}
}
