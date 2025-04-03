import { Point } from "$lib/geom/Point";
import { Polygon } from "$lib/geom/Polygon";
import * as martinez from "martinez-polygon-clipping";


type MartinezPosition = number[]
type MartinezPolygon = MartinezPosition[][]
type MartinezMultiPolygon = MartinezPosition[][][]
type MartinezGeometry = MartinezPolygon | MartinezMultiPolygon


export class Building {


    /**
     *
     */
    constructor(polygons: Polygon[]) {

        const merged = unionPolygonsWithRings(polygons.map(x => x.inflateEq(1.001)));

        const newPolygon = merged.map(x => {
            const p = x.createSimpifiedPolygon(0.1) as MultiPolygon & { type: 'outline' | 'fill' };
            p.type = 'fill';
            return p;
        });

        this.polygons = [
            ...newPolygon.map(p => {
                const m = p as MultiPolygon & { type: 'outline' | 'fill' };
                m.type = 'outline';
                return m;
            }),
            ...newPolygon.map(p => {
                const m = p.createShrinkedPolygon(0.6) as MultiPolygon & { type: 'outline' | 'fill' };
                m.type = 'fill';
                return m;
            }),
        ]


        // this.polygons = polygons.map(p => {
        //     const m = new MultiPolygon([p.vertices]) as MultiPolygon & { type: 'outline' | 'fill' };
        //     m.type = 'outline';
        //     return m;
        // });


    }
    public get center() {
        // calculate center of all polygons
        const center = this.polygons.map(p => p.center).reduce((a, b) => a.add(b), new Point(0, 0));
        return center.scale(1 / this.polygons.length);
    }



    /**
     * An Orderd list of polygons, that should be dranwn in that order.
     * It is argumented by type wich defines if it is part of outline or
     * fill.
     * 
     * It is assumed that the fill color is opacque. The outline may
     * bleed into the fill part
     */
    public readonly polygons: (MultiPolygon & { type: 'outline' | 'fill' })[];
}


export class MultiPolygon {
    private _pathes: { vertices: Point[] }[];
    constructor(pathes: Point[][]) {
        this._pathes = pathes.map(path => {
            return { vertices: path };
        });
    }

    public get pathes() {
        return this._pathes;
    }
    public get vertices() {
        return this._pathes.map(path => path.vertices).flat();
    }
    public get center() {
        return areaWeightedCentroid(this.pathes[0].vertices);
    }

    public createShrinkedPolygon(shrink: number) {
        const shrinkedPathes = this._pathes.map(({ vertices }) => {
            return shrinkPolygon(vertices, shrink);
        });
        return new MultiPolygon(shrinkedPathes);
    }

    public createSimpifiedPolygon(threshold: number) {
        const simplifiedPathes = this._pathes.map(({ vertices }) => {
            return simplifyPolygon(vertices, threshold);
        });
        return new MultiPolygon(simplifiedPathes);
    }
}

function simplifyPolygon(vertices: Point[], threshold: number): Point[] {
    const newVertices: Point[] = [...vertices];
    const thresholdSq = threshold * threshold;
    if (newVertices.length < 3) return newVertices; // No simplification needed for less than 3 vertices
    for (let i = 0; i < newVertices.length && newVertices.length > 3; i++) {
        const current = newVertices[i];
        const next = newVertices[(i + 1) % newVertices.length];


        // Check if the distance to the next vertex is greater than the threshold
        if (current.distanceSq(next) > thresholdSq) {
            // ntohing to do
        } else {
            // If the distance is less than the threshold, we can merge the vertices
            const newVertex = new Point(
                (current.x + next.x) / 2,
                (current.y + next.y) / 2
            );
            if (i == newVertices.length - 1) {
                newVertices.splice(i, 1, newVertex); // Replace the last vertex with the new vertex
                // and remove the first vertex
                newVertices.splice(0, 1);
            } else {
                newVertices.splice(i, 2, newVertex); // Replace the current vertex with the new vertex
            }
            i--; // Decrement i to account for the removed vertex
        }
    }

    // second pass to remove verteces that are too close to the virtual edege connectiong its siblings
    for (let i = 0; i < newVertices.length && newVertices.length > 3; i++) {
        const current = newVertices[i];
        const prev = newVertices[(i - 1 + newVertices.length) % newVertices.length];
        const next = newVertices[(i + 1) % newVertices.length];

        // calculate the distance to the virtual edge connecting prev and next
        const virtualEdge = next.subtract(prev).norm(1);
        const distanceToVirtualEdge = Math.abs(current.subtract(prev).crossProduct(virtualEdge));
        if (distanceToVirtualEdge < threshold) {
            // Remove the current vertex if it is too close to the virtual edge
            newVertices.splice(i, 1);
            i--; // Decrement i to account for the removed vertex
        }

    }


    return newVertices;

}

function shrinkPolygon(vertices: Point[], shrink: number): Point[] {
    const newVertices: Point[] = [];
    const numVertices = vertices.length;

    for (let i = 0; i < numVertices; i++) {
        const prev = vertices[(i - 1 + numVertices) % numVertices];
        const current = vertices[i];
        const next = vertices[(i + 1) % numVertices];

        // Berechne Normalen für beide angrenzenden Kanten
        const normal1 = edgeNormal(prev, current);
        const normal2 = edgeNormal(current, next);

        // Mittlere Normale bestimmen (um sanfte Übergänge zu ermöglichen)
        const bisector = normal1.add(normal2).norm(1);

        // Punkt entlang der Normalen verschieben
        newVertices.push(current.add(bisector.scale(shrink)));
    }

    return newVertices;
}

// Berechnet die Normale einer Kante
function edgeNormal(p1: Point, p2: Point): Point {
    const edge = p2.subtract(p1).norm(1);
    return new Point(-edge.y, edge.x); // 90° Rotation für die Normale
}

/**
 * Calculates the area-weighted centroid of a polygon
 * This works correctly for complex, concave, and self-intersecting polygons
 */
function areaWeightedCentroid(polygon: Point[]): Point {
    // Handle edge cases
    if (polygon.length === 0) return new Point(0, 0);
    if (polygon.length === 1) return polygon[0].clone();
    if (polygon.length === 2) return new Point((polygon[0].x + polygon[1].x) / 2, (polygon[0].y + polygon[1].y) / 2);

    let area = 0;
    let cx = 0;
    let cy = 0;

    // Process each vertex and its next neighbor
    for (let i = 0; i < polygon.length; i++) {
        const j = (i + 1) % polygon.length;
        const p1 = polygon[i];
        const p2 = polygon[j];

        // Calculate the signed area contribution of this segment
        const signedArea = (p1.x * p2.y - p2.x * p1.y);
        area += signedArea;

        // Accumulate weighted centroid terms
        cx += (p1.x + p2.x) * signedArea;
        cy += (p1.y + p2.y) * signedArea;
    }

    // Finalize the calculations
    area /= 2;
    const absArea = Math.abs(area);

    if (absArea < Number.EPSILON) {
        // If area is effectively zero, fall back to simple centroid
        return center(polygon);
    }

    // Complete the centroid formula: divide by 6 times the area
    cx = cx / (6 * area);
    cy = cy / (6 * area);

    return new Point(cx, cy);
}

function center(polygon: Point[]): Point {
    let x = 0;
    let y = 0;
    for (const point of polygon) {
        x += point.x;
        y += point.y;
    }
    return new Point(x / polygon.length, y / polygon.length);
}

function isClockWise(polygon: Point[]): boolean {
    let sum = 0;
    for (let i = 0; i < polygon.length - 1; i++) {
        const p1 = polygon[i];
        const p2 = polygon[i + 1];
        sum += (p2.x - p1.x) * (p2.y + p1.y);
    }
    return sum > 0;
}

/**
 * Converts a Polygon object to the format required by martinez-polygon-clipping.
 */
function polygonToMartinezFormat(polygon: Polygon): MartinezGeometry {
    return [[...polygon.vertices.map(p => [p.x, p.y]), [polygon.vertices[0].x, polygon.vertices[0].y]]];
}

/**
 * Converts a result from martinez-polygon-clipping to a Polygon class instance.
 */
function martinezToPolygon(martinezOutput: MartinezGeometry): MultiPolygon[] {
    // get the dimension of the Array
    const dimension = !Array.isArray(martinezOutput)
        ? 0
        : !Array.isArray(martinezOutput[0])
            ? 1 // its a Point
            : !Array.isArray(martinezOutput[0][0])
                ? 2 // its a Polygon
                : !Array.isArray(martinezOutput[0][0][0])
                    ? 3 // its a Polygon with holes
                    : !Array.isArray(martinezOutput[0][0][0][0])
                        ? 4 // its a MultiPolygon with holes
                        : 5; // should not happen
    if (dimension < 2) {
        throw new Error(`Invalid martinez output: ${JSON.stringify(martinezOutput)}`);
    } else if (dimension === 2) {
        const pointList = (martinezOutput as unknown as MartinezPosition[]).map(([x, y]) => new Point(x, y))
        return [new MultiPolygon([pointList])];
    } else if (dimension === 3) {
        return [convertRingsToMultiPolygon(martinezOutput as MartinezPolygon)];
    } else if (dimension === 4) {
        return (martinezOutput as MartinezMultiPolygon).map(polygon => {
            return convertRingsToMultiPolygon(polygon);
        });
    } else {
        throw new Error(`Invalid martinez output: ${JSON.stringify(martinezOutput)}`);
    }

    function convertRingsToMultiPolygon(martinezOutput: MartinezPolygon): MultiPolygon {
        return new MultiPolygon((martinezOutput).map((ring, i) => {
            const pointList = ring.map(([x, y]) => new Point(x, y));
            if (i % 2 === 1) {
                return pointList.reverse();
            }
            return pointList;
        }));
    }
}

/**
 * Performs a union operation on an array of Polygon instances, correctly handling holes.
 * @param polygons An array of Polygon instances.
 * @returns A list of Polygon instances after performing the union operation.
 */
function unionPolygonsWithRings(polygons: Polygon[]): MultiPolygon[] {
    if (polygons.length === 0) {
        return [];
    }

    let result = polygonToMartinezFormat(polygons[0]);

    for (let i = 1; i < polygons.length; i++) {
        result = martinez.union(result, polygonToMartinezFormat(polygons[i]));
    }

    return martinezToPolygon(result);
}