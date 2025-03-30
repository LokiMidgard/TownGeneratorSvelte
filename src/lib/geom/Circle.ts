import { z } from "zod";

export const CircleSchema = z.object({
	x: z.number(),
	y: z.number(),
	r: z.number()
});

export type Circle = z.infer<typeof CircleSchema>;