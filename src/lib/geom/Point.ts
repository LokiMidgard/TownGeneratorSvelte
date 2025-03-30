

export class Point {


  constructor(public x: number = 0, public y: number = 0) {
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

  public addEq(p1: Point): Point {
    this.x += p1.x;
    this.y += p1.y;
    return this;
  }
  public scaleEq(s: number): Point {
    this.x *= s;
    this.y *= s;
    return this;
  }

  public offsetEq(x: number, y: number): Point {
    this.x += x;
    this.y += y;
    return this;
  }

  public setTo(x: number, y: number): Point {
    this.x = x;
    this.y = y;
    return this;
  }
  public set(p: Point): Point {
    this.x = p.x;
    this.y = p.y;
    return this;
  }



  public add(p1: Point): Point {
    return new Point(this.x + p1.x, this.y + p1.y);
  }

  public subtract(p1: Point): Point {
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

  public distance(p1: Point): number {
    const dx = p1.x - this.x;
    const dy = p1.y - this.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  public distanceSq(p1: Point): number {
    const dx = p1.x - this.x;
    const dy = p1.y - this.y;
    return dx * dx + dy * dy;
  }

  public dotProduct(p1: Point): number {
    return this.x * p1.x + this.y * p1.y;
  }

  public crossProduct(p1: Point): number {
    return this.x * p1.y - this.y * p1.x;
  }

  public equals(p1: Point): boolean {
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

  public dot(p1: Point): number {
    return this.x * p1.x + this.y * p1.y;
  }
}