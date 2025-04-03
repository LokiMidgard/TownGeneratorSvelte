import { Building } from "../building/Building";
import { Cutter } from "../building/Cutter";
import { Ward } from "./Ward";

class Park extends Ward {
	override createGeometry(): void {
		const block = this.getCityBlock();
		this.geometry = [new Building(block.compactness >= 0.7
			? Cutter.radial(block, null, Ward.ALLEY)
			: Cutter.semiRadial(block, null, Ward.ALLEY))];
	}

	override getLabel(): string {
		return "Park";
	}
}

export { Park };
