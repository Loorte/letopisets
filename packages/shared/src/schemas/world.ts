import { z } from "zod";

export const simStatusEnum = z.enum(["idle", "running", "paused"]);

export const worldSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200),
  seed: z.string().optional(),
  currentTick: z.number().int().nonnegative().default(0),
  simStatus: simStatusEnum.default("idle"),
  fmgData: z.record(z.unknown()).optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const createWorldSchema = z.object({
  name: z.string().min(1).max(200),
  seed: z.string().optional(),
  fmgData: z.record(z.unknown()).optional(),
});

export type World = z.infer<typeof worldSchema>;
export type CreateWorld = z.infer<typeof createWorldSchema>;
export type SimStatus = z.infer<typeof simStatusEnum>;
