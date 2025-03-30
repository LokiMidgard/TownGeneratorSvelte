import { Patch } from "../building/Patch";
import { Model } from "../building/Model";
import { Ward } from "./Ward";
import { Random } from "$lib/utils/Random";

class MilitaryWard extends Ward {
    override createGeometry(): void {
        const block = this.getCityBlock();
        this.geometry = Ward.createAlleys(
            block,
            Math.sqrt(block.square) * (1 + Random.float()),
            0.1 + Random.float() * 0.3, // regular
            0.3,                       // regular
            0.25                       // squares
        );
    }

    public static rateLocation(model: Model, patch: Patch): number {
        // Military ward should border the citadel or the city walls
        if (model.citadel && model.citadel.shape.borders(patch.shape)) {
            return 0;
        } else if (model.wall && model.wall.borders(patch)) {
            return 1;
        } else {
            return (model.citadel === null && model.wall === null) ? 0 : Number.POSITIVE_INFINITY;
        }
    }

    override getLabel(): string {
        return "Military";
    }
}

export { MilitaryWard };
