import { z } from "zod";

export const religionTypeEnum = z.enum([
  "folk",
  "organized",
  "cult",
  "heresy",
]);

export const religionSchema = z.object({
  id: z.string().uuid(),
  worldId: z.string().uuid(),
  fmgId: z.number().int(),
  name: z.string().min(1),
  nameOriginal: z.string().nullable().optional(),
  type: religionTypeEnum,
  deity: z.string().optional(),
  deityOriginal: z.string().nullable().optional(),
  color: z.string().optional(),
  tenets: z.record(z.unknown()).optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type Religion = z.infer<typeof religionSchema>;
export type ReligionType = z.infer<typeof religionTypeEnum>;
