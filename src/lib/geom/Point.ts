
import { z } from "zod";


export const PointSchema = z.object({
  x: z.number(),
  y: z.number()
});


export type Point = z.infer<typeof PointSchema>;

export function isPoint(p: unknown): p is Point {
  return PointSchema.safeParse(p).success;
}


export function add(p1: Point, p2: Point): Point {
  return { x: p1.x + p2.x, y: p1.y + p2.y };
}

export function subtract(p1: Point, p2: Point): Point {
  return { x: p1.x - p2.x, y: p1.y - p2.y };
}

export function scale(p: Point, s: number): Point {
  return { x: p.x * s, y: p.y * s };
}

export function normalize(p: Point, length: number = 1): Point {
  const len = Math.sqrt(p.x * p.x + p.y * p.y);
  if (len > 0) {
    const factor = length / len;
    return { x: p.x * factor, y: p.y * factor };
  }
  return { ...p };
}

export function distance(p1: Point, p2: Point): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function distanceSq(p1: Point, p2: Point): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return dx * dx + dy * dy;
}

export function dotProduct(p1: Point, p2: Point): number {
  return p1.x * p2.x + p1.y * p2.y;
}

export function crossProduct(p1: Point, p2: Point): number {
  return p1.x * p2.y - p1.y * p2.x;
}

export function equals(p1: Point, p2: Point): boolean {
  return p1.x === p2.x && p1.y === p2.y;
}
export function length(p: Point): number {
  return Math.sqrt(p.x * p.x + p.y * p.y);
}
export function lengthSq(p: Point): number {
  return p.x * p.x + p.y * p.y;
}
export function rotate90(p: Point): Point {
  return { x: -p.y, y: p.x };
}