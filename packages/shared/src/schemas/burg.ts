import { z } from "zod";

export const burgSchema = z.object({
  id: z.string().uuid(),
  worldId: z.string().uuid(),
  stateId: z.string().uuid().optional(),
  fmgId: z.number().int(),
  name: z.string().min(1),
  nameOriginal: z.string().nullable().optional(),
  population: z.number().int().nonnegative().default(0),
  isCapital: z.boolean().default(false),
  isPort: z.boolean().default(false),
  x: z.number(),
  y: z.number(),
  economy: z.number().nonnegative().default(0),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type Burg = z.infer<typeof burgSchema>;
