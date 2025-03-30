const g = 48271.0;
const n = 2147483647;

export class Random {


	private static seed = 1;

	public static reset(seed = -1) {
		this.seed = (seed != -1 ? seed : Std.int(Date.now() % n));
	}
	public static getSeed(): number { return this.seed };

	private static next(): number {
		return (this.seed = Std.int((this.seed * g) % n));
	}
	public static float(): number {
		return this.next() / n;
	}
	public static normal(): number {
		return (this.float() + this.float() + this.float()) / 3;
	}
	public static int(min: number, max: number): number {
		return Std.int(min + this.next() / n * (max - min));
	}
	public static bool(chance = 0.5): boolean {
		return this.float() < chance;
	}
	public static fuzzy(f = 1.0): number {
		return (f == 0)
			? 0.5
			:
			(1 - f) / 2 + f * this.normal();
	}
}

class Std {
	public static int(value: number): number {
		return Math.floor(value);
	}
	public static float(value: number): number {
		return value;
	}
	public static bool(value: boolean): boolean {
		return value;
	}
}