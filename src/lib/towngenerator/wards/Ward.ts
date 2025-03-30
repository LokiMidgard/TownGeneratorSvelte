import { Model } from '../model/Model';
import * as  Patch  from '$lib/towngenerator/building/Patch';
import * as GeomUtils from '$lib/geom/GeomUtils';
import { Cutter } from '$lib/towngenerator/building/Cutter';
import { Random } from '$lib/utils/Random';
import * as Polygon from '$lib/geom/Polygon';
import * as Point from '$lib/geom/Point';

export abstract class Ward {
    // Static constants
    public static readonly MAIN_STREET: number = 2.0;
    public static readonly REGULAR_STREET: number = 1.0;
    public static readonly ALLEY: number = 0.6;

    // Properties
    public model: Model;
    public patch: Patch.Patch;
    public geometry: Polygon.Polygon[] = [];

    constructor(model: Model, patch: Patch) {
        this.model = model;
        this.patch = patch;
    }

    public createGeometry(): void {
        this.geometry = [];
    }

    public getCityBlock(): Polygon.Polygon {
        const insetDist: number[] = [];

        const innerPatch = this.model.wall == null || this.patch.withinWalls;
        this.patch.shape.forEdge((v0: Point.Point, v1: Point.Point) => {
            if (this.model.wall != null && this.model.wall.bordersBy(this.patch, v0, v1)) {
                // Not too close to the wall
                insetDist.push(Ward.MAIN_STREET / 2);
            } else {
                let onStreet = innerPatch && (this.model.plaza != null && this.model.plaza.shape.findEdge(v1, v0) != -1);
                if (!onStreet) {
                    for (const street of this.model.arteries) {
                        if (street.contains(v0) && street.contains(v1)) {
                            onStreet = true;
                            break;
                        }
                    }
                }
                insetDist.push((onStreet ? Ward.MAIN_STREET : (innerPatch ? Ward.REGULAR_STREET : Ward.ALLEY)) / 2);
            }
        });

        return this.patch.shape.isConvex() ?
            this.patch.shape.shrink(insetDist) :
            this.patch.shape.buffer(insetDist);
    }

    private filterOutskirts(): void {
        const populatedEdges: Array<{ x: number, y: number, dx: number, dy: number, d: number }> = [];

        const addEdge = (v1: Point.Point, v2: Point.Point, factor: number = 1.0) => {
            const dx = v2.x - v1.x;
            const dy = v2.y - v1.y;
            const distances = new Map<Point.Point, number>();

            const d = this.patch.shape.max((v: Point.Point) => {
                return distances.set(v, (v != v1 && v != v2 ?
                    GeomUtils.distance2line(v1.x, v1.y, dx, dy, v.x, v.y) : 0) * factor).get(v) || 0;
            });

            populatedEdges.push({ x: v1.x, y: v1.y, dx: dx, dy: dy, d: distances.get(d) || 0 });
        };

        this.patch.shape.forEdge((v1: Point.Point, v2: Point.Point) => {
            let onRoad = false;
            for (const street of this.model.arteries) {
                if (street.contains(v1) && street.contains(v2)) {
                    onRoad = true;
                    break;
                }
            }

            if (onRoad) {
                addEdge(v1, v2, 1);
            } else {
                const n = this.model.getNeighbour(this.patch, v1);
                if (n != null) {
                    if (n.withinCity) {
                        addEdge(v1, v2, this.model.isEnclosed(n) ? 1 : 0.4);
                    }
                }
            }
        });

        // For every vertex: if this belongs only
        // to patches within city, then 1, otherwise 0
        const density: number[] = [];
        for (const v of this.patch.shape) {
            if (this.model.gates.contains(v)) {
                density.push(1);
            } else {
                const allWithinCity = this.model.patchByVertex(v).every((p: Patch) => p.withinCity);
                density.push(allWithinCity ? 2 * Random.float() : 0);
            }
        }

        this.geometry = this.geometry.filter((building: Polygon.Polygon) => {
            let minDist = 1.0;
            for (const edge of populatedEdges) {
                for (const v of building.vertices) {
                    // Distance from the center of the building to the edge
                    const d = GeomUtils.distance2line(edge.x, edge.y, edge.dx, edge.dy, v.x, v.y);
                    const dist = d / edge.d;
                    if (dist < minDist) {
                        minDist = dist;
                    }
                }
            }

            const c = Polygon.center(building);
            const i = this.patch.shape.interpolate(c);
            let p = 0.0;
            for (let j = 0; j < i.length; j++) {
                p += density[j] * i[j];
            }
            minDist /= p;

            return Random.fuzzy(1) > minDist;
        });
    }

    public getLabel(): string | null {
        return null;
    }

    public static rateLocation(model: Model, patch: Patch): number {
        return 0;
    }

    public static createAlleys(
        p: Polygon.Polygon,
        minSq: number,
        gridChaos: number,
        sizeChaos: number,
        emptyProb: number = 0.04,
        split: boolean = true
    ): Polygon.Polygon[] {
        // Looking for the longest edge to cut it
        let v: Point.Point | null = null;
        let length = -1.0;

        Polygon.forEdge(p, (p0: Point.Point, p1: Point.Point) => {
            const len = Point.distance(p0, p1);
            if (len > length) {
                length = len;
                v = p0;
            }
        });

        const spread = 0.8 * gridChaos;
        const ratio = (1 - spread) / 2 + Random.float() * spread;

        // Trying to keep buildings rectangular even in chaotic wards
        const angleSpread = Math.PI / 6 * gridChaos * (Polygon.square(p) < minSq * 4 ? 0.0 : 1);
        const b = (Random.float() - 0.5) * angleSpread;

        const halves = Cutter.bisect(p, v!, ratio, b, split ? Ward.ALLEY : 0.0);

        const buildings: Polygon.Polygon[] = [];
        for (const half of halves) {
            if (half.square < minSq * Math.pow(2, 4 * sizeChaos * (Random.float() - 0.5))) {
                if (!Random.bool(emptyProb)) {
                    buildings.push(half);
                }
            } else {
                buildings.push(...Ward.createAlleys(
                    half, minSq, gridChaos, sizeChaos, emptyProb, half.square > minSq / (Random.float() * Random.float())
                ));
            }
        }

        return buildings;
    }

    private static findLongestEdge(poly: Polygon.Polygon): Point.Point {
        let max = 0;
        let v: Point.Point | null = null;
        Polygon.forEdge(poly, (v0: Point.Point, v1: Point.Point) => {
            const len = Point.distance(v0, v1);
            if (len > max) {
                max = len;
                v = v0;
            }
        });
        if (v == null) {
            throw new Error("No vertex found");
        }
        return v;
    }

    public static createOrthoBuilding(poly: Polygon.Polygon, minBlockSq: number, fill: number): Polygon.Polygon[] {
        const slice = (poly: Polygon.Polygon, c1: Point.Point, c2: Point.Point): Polygon.Polygon[] => {
            const v0 = Ward.findLongestEdge(poly);
            const v1 = Polygon.next(poly, v0);
            const v = Point.subtract(v1, v0);

            const ratio = 0.4 + Random.float() * 0.2;
            const p1 = GeomUtils.interpolate(v0, v1, ratio);

            const c = Math.abs(GeomUtils.scalar(v.x, v.y, c1.x, c1.y)) <
                Math.abs(GeomUtils.scalar(v.x, v.y, c2.x, c2.y)) ? c1 : c2;

            const halves = Polygon.cut(poly, p1, p1.add(c));
            const buildings: Polygon.Polygon[] = [];

            for (const half of halves) {
                if (Polygon.square(half) < minBlockSq * Math.pow(2, Random.normal() * 2 - 1)) {
                    if (Random.bool(fill)) {
                        buildings.push(half);
                    }
                } else {
                    buildings.push(...slice(half, c1, c2));
                }
            }
            return buildings;
        };

        if (Polygon.square(poly) < minBlockSq) {
            return [poly];
        } else {
            const c1 = Polygon.vector(poly, Ward.findLongestEdge(poly));
            const c2 = Point.rotate90(c1);

            while (true) {
                const blocks = slice(poly, c1, c2);
                if (blocks.length > 0) {
                    return blocks;
                }
            }
        }
    }
}
