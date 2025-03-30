import { Patch } from "../building/Patch";
import { Model } from "../building/Model";
import { CommonWard } from "./CommonWard";
import { Random } from "$lib/utils/Random";

export class CraftsmenWard extends CommonWard {
	constructor(model: Model, patch: Patch) {
		super(
			model,
			patch,
			10 + 80 * Random.float() * Random.float(), // small to large
			0.5 + Random.float() * 0.2,
			0.6 // moderately regular
		);
	}

	getLabel(): string {
		return "Craftsmen";
	}
}
