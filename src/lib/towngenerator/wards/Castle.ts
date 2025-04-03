import { Patch } from "../building/Patch";
import { Model } from "../building/Model";
import { CurtainWall } from "../building/CurtainWall";
import { Ward } from "./Ward";
import { Building } from "../building/Building";

export class Castle extends Ward {
	public wall: CurtainWall;

	constructor(model: Model, patch: Patch) {
		super(model, patch);

		this.wall = new CurtainWall(
			true,
			model,
			[patch],
			patch.shape.vertices.filter((v) =>
				model.patchByVertex(v).some((p: Patch) => !p.withinCity)
			)
		);
	}

	override createGeometry(): void {
		const block = this.patch.shape.createShrinkedPolygon(Ward.MAIN_STREET * 2);
		this.geometry = [new Building(Ward.createOrthoBuilding(
			block,
			Math.sqrt(block.square) * 4,
			0.6
		))];
	}

	override getLabel(): string {
		return "Castle";
	}
}
