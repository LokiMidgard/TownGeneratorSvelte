import { Patch } from "../building/Patch";
import { Model } from "../building/Model";
import { CommonWard } from "./CommonWard";
import { Random } from "$lib/utils/Random";


export class GateWard extends CommonWard {
	constructor(model: Model, patch: Patch) {
		super(
			model,
			patch,
			10 + 50 * Random.float() * Random.float(),
			0.5 + Random.float() * 0.3,
			0.7
		);
	}

	getLabel(): string {
		return "Gate";
	}
}
