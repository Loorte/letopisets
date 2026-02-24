import { z } from "zod";

export const eventTypeEnum = z.enum([
  "political",
  "economic",
  "military",
  "social",
  "natural",
  "magical",
  "creature",
]);

export const severityEnum = z.enum(["minor", "moderate", "major", "catastrophic"]);

export const worldEventSchema = z.object({
  id: z.string().uuid(),
  worldId: z.string().uuid(),
  tick: z.number().int().nonnegative(),
  type: eventTypeEnum,
  title: z.string().min(1),
  description: z.string(),
  severity: severityEnum,
  effects: z.record(z.unknown()).optional(),
  relatedEntityIds: z.array(z.string().uuid()).default([]),
  createdAt: z.coerce.date(),
});

export type WorldEvent = z.infer<typeof worldEventSchema>;
export type EventType = z.infer<typeof eventTypeEnum>;
export type Severity = z.infer<typeof severityEnum>;
