import { Patch } from "../building/Patch";
import { Model } from "../building/Model";
import { Ward } from "./Ward";

export class CommonWard extends Ward {
	private minSq: number;
	private gridChaos: number;
	private sizeChaos: number;
	private emptyProb: number;

	constructor(model: Model, patch: Patch, minSq: number, gridChaos: number, sizeChaos: number, emptyProb: number = 0.04) {
		super(model, patch);

		this.minSq = minSq;
		this.gridChaos = gridChaos;
		this.sizeChaos = sizeChaos;
		this.emptyProb = emptyProb;
	}

	override createGeometry(): void {
		const block = this.getCityBlock();
		this.geometry = Ward.createAlleys(block, this.minSq, this.gridChaos, this.sizeChaos, this.emptyProb);

		if (!this.model.isEnclosed(this.patch)) {
			this.filterOutskirts();
		}
	}
}
