import { Patch } from "../building/Patch";
import { Model } from "../building/Model";
import { CommonWard } from "./CommonWard";
import { Park } from "./Park";
import { Slum } from "./Slum";
import { Random } from "$lib/utils/Random";

export class PatriciateWard extends CommonWard {
	constructor(model: Model, patch: Patch) {
		super(
			model,
			patch,
			80 + 30 * Random.float() * Random.float(), // large
			0.5 + Random.float() * 0.3, 0.8,           // moderately regular
			0.2
		);
	}

	public static rateLocation(model: Model, patch: Patch): number {
		// Patriciate ward prefers to border a park and not to border slums
		let rate = 0;
		for (const p of model.patches) {
			if (p.ward != null && p.shape.borders(patch.shape)) {
				if (p.ward instanceof Park) {
					rate--;
				} else if (p.ward instanceof Slum) {
					rate++;
				}
			}
		}
		return rate;
	}

	public override getLabel(): string {
		return "Patriciate";
	}
}
