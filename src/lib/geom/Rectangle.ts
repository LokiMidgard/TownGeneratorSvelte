import { z } from "zod";


export const RectangleSchema = z.object({
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number()
});
export type Rectangle = z.infer<typeof RectangleSchema>;
export function isRectangle(r: unknown): r is Rectangle {
    return RectangleSchema.safeParse(r).success;
}