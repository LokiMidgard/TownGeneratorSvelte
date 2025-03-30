

export class Rectangle {
    constructor(public x: number, public y: number, public width: number = 0, public height: number=0) { }

    public get left(): number {
        return this.x;
    }
    public set left(x: number) {
        this.x = x;
    }
    public get right(): number {
        return this.x + this.width;
    }
    public set right(x: number) {
        this.x = x - this.width;
    }
    public get top(): number {
        return this.y;
    }
    public set top(y: number) {
        this.y = y;
    }
    public get bottom(): number {
        return this.y + this.height;
    }
    public set bottom(y: number) {
        this.y = y - this.height;
    }
    public get centerX(): number {
        return this.x + this.width / 2;
    }
    public set centerX(x: number) {
        this.x = x - this.width / 2;
    }
    public get centerY(): number {
        return this.y + this.height / 2;
    }
    public set centerY(y: number) {
        this.y = y - this.height / 2;
    }
    public get area(): number {
        return this.width * this.height;
    }
    public get perimeter(): number {
        return 2 * (this.width + this.height);
    }
    public get isEmpty(): boolean {
        return this.width <= 0 || this.height <= 0;
    }
    public get isSquare(): boolean {
        return this.width === this.height;
    }
    public get isPoint(): boolean {
        return this.width === 0 && this.height === 0;
    }
    public get isLine(): boolean {
        return this.width === 0 || this.height === 0;
    }

    public static copy(r: Rectangle): Rectangle {
        return new Rectangle(r.x, r.y, r.width, r.height);
    }
}

