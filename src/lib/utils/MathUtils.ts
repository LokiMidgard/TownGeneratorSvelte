

export class MathUtils {
	
	
	public static gate(value: number, min: number, max: number): number {
		return value < min ? min : (value < max ? value : max);
	}
	
	public static gatei(value: number, min: number, max: number): number {
		return value < min ? min : (value < max ? value : max);
	}
	
	public static sign(value: number): number {
		return value == 0 ? 0 : (value < 0 ? -1 : 1);
	}
	
	
}