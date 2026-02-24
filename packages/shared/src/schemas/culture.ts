import { z } from "zod";

export const cultureTypeEnum = z.enum([
  "nomadic",
  "river",
  "lake",
  "naval",
  "hunting",
  "highland",
  "generic",
]);

export const cultureSchema = z.object({
  id: z.string().uuid(),
  worldId: z.string().uuid(),
  fmgId: z.number().int(),
  name: z.string().min(1),
  nameOriginal: z.string().nullable().optional(),
  type: cultureTypeEnum,
  color: z.string().optional(),
  traits: z.record(z.unknown()).optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type Culture = z.infer<typeof cultureSchema>;
export type CultureType = z.infer<typeof cultureTypeEnum>;
