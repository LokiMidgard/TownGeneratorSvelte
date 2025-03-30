import { Patch } from "../building/Patch";
import { Model } from "../building/Model";
import { CommonWard } from "./CommonWard";
import { Random } from "$lib/utils/Random";

export class Slum extends CommonWard {
	constructor(model: Model, patch: Patch) {
		super(
			model,
			patch,
			10 + 30 * Random.float() * Random.float(), // small to medium
			0.6 + Random.float() * 0.4, 0.8, // chaotic
			0.03
		);
	}

	public static rateLocation(model: Model, patch: Patch): number {
		// Slums should be as far from the center as possible
		return -patch.shape.distance(
			model.plaza ? model.plaza.shape.center : model.center
		);
	}

	public getLabel(): string {
		return "Slum";
	}
}
