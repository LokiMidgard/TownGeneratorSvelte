import type { Polygon } from "$lib/geom/Polygon";

export type  Patch ={
	shape	: Polygon;
	ward 	: Ward;
	withinWalls	: Bool;
	withinCity	: Bool;
}


// export function fromRegion( r:Region ):Patch{
// 	return Patch.fromRegion( r );
// }
