import { z } from "zod";

export const governmentFormEnum = z.enum([
  "monarchy",
  "republic",
  "theocracy",
  "tribal",
  "empire",
  "anarchy",
]);

export const stateSchema = z.object({
  id: z.string().uuid(),
  worldId: z.string().uuid(),
  fmgId: z.number().int(),
  name: z.string().min(1),
  form: governmentFormEnum,
  color: z.string().optional(),
  population: z.number().int().nonnegative().default(0),
  military: z.number().nonnegative().default(0),
  economy: z.number().nonnegative().default(0),
  stability: z.number().min(0).max(100).default(50),
  diplomacy: z.record(z.unknown()).optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type State = z.infer<typeof stateSchema>;
export type GovernmentForm = z.infer<typeof governmentFormEnum>;
