import type { IPointLike } from "./PatchPolygon";


export class Point {

  public readonly _x: number;
  public readonly _y: number;


  public get x(): number {
    return this._x;
  }
  public get y(): number {
    return this._y;
  }
  constructor(x: number = 0, y: number = 0) {
    this._x = x;
    this._y = y;
  }

  public clone(): Point {
    return new Point(this.x, this.y);
  }

  public static from(p: Point): Point {
    return new Point(p.x, p.y);
  }

  public static fromXY(x: number, y: number): Point {
    return new Point(x, y);
  }

  public offset(x: number, y: number): Point;
  public offset(offset: Point): Point;
  public offset(x: number | Point, y?: number): Point {
    if (typeof x === 'object') {
      y = x.y;
      x = x.x;
    }
    if (y === undefined) {
      throw new Error('y is undefined');
    }
    if (x === undefined) {
      throw new Error('x is undefined');
    }
    return new Point(this.x + x, this.y + y);
  }

  // public addEq(p1: Point): Point {
  //   this.x += p1.x;
  //   this.y += p1.y;
  //   return this;
  // }
  // public scaleEq(s: number): Point {
  //   this.x *= s;
  //   this.y *= s;
  //   return this;
  // }

  // public offsetEq(x: number, y: number): Point {
  //   this.x += x;
  //   this.y += y;
  //   return this;
  // }

  // public setTo(x: number, y: number): Point {
  //   this.x = x;
  //   this.y = y;
  //   return this;
  // }
  // public set(p: Point): Point {
  //   this.x = p.x;
  //   this.y = p.y;
  //   return this;
  // }



  public add(p1: IPointLike): Point {
    return new Point(this.x + p1.x, this.y + p1.y);
  }

  public subtract(p1: IPointLike): Point {
    return new Point(this.x - p1.x, this.y - p1.y);
  }

  public scale(s: number): Point {
    return new Point(this.x * s, this.y * s);
  }

  public norm(length: number = 1): Point {
    const len = Math.sqrt(this.x * this.x + this.y * this.y);
    if (len > 0) {
      const factor = length / len;
      return new Point(this.x * factor, this.y * factor);
    }
    return this.clone();
  }


  

  public distance(p1: IPointLike): number {
    const dx = p1.x - this.x;
    const dy = p1.y - this.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  public distanceSq(p1: IPointLike): number {
    const dx = p1.x - this.x;
    const dy = p1.y - this.y;
    return dx * dx + dy * dy;
  }

  public dotProduct(p1: IPointLike): number {
    return this.x * p1.x + this.y * p1.y;
  }

  public crossProduct(p1: IPointLike): number {
    return this.x * p1.y - this.y * p1.x;
  }

  public equals(p1: IPointLike | null): boolean {
    if (!p1) return false;
    if (this === p1) return true;
    return this.x === p1.x && this.y === p1.y;
  }
  public get length(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }
  public get lengthSq(): number {
    return this.x * this.x + this.y * this.y;
  }
  public rotate90(): Point {
    return new Point(-this.y, this.x);
  }

  public dot(p1: IPointLike): number {
    return this.x * p1.x + this.y * p1.y;
  }
}