



export function gate(value: number, min: number, max: number): number {
	return value < min ? min : (value < max ? value : max);
}

export function gatei(value: number, min: number, max: number): number {
	return value < min ? min : (value < max ? value : max);
}

export function sign(value: number): number {
	return value == 0 ? 0 : (value < 0 ? -1 : 1);
}

