import { z } from "zod";

const baseEntrySchema = z.object({
  id: z.uuid(),
  visitId: z.string().min(1),
  capturedAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  accuracyM: z.number().nonnegative().nullable(),
  headingDeg: z.number().min(0).max(360).nullable(),
  measurementKind: z.enum(["direct", "calculated"]),
  directValue: z.number().positive().nullable(),
  calcBaseValue: z.number().positive().nullable(),
  calcTopValue: z.number().positive().nullable(),
  unit: z.enum(["imperial", "metric"]),
  notes: z.string().max(5_000),
  deleted: z.boolean(),
});

export const journalEntrySchema = baseEntrySchema.superRefine((entry, ctx) => {
  if (entry.measurementKind === "direct") {
    if (entry.directValue === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["directValue"],
        message: "directValue is required for direct measurements.",
      });
    }

    if (entry.calcBaseValue !== null || entry.calcTopValue !== null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["measurementKind"],
        message:
          "Calculated fields must be null when measurementKind is direct.",
      });
    }
  }

  if (entry.measurementKind === "calculated") {
    if (entry.calcBaseValue === null || entry.calcTopValue === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["measurementKind"],
        message:
          "calcBaseValue and calcTopValue are required for calculated measurements.",
      });
    }

    if (entry.directValue !== null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["directValue"],
        message:
          "directValue must be null when measurementKind is calculated.",
      });
    }
  }
});

export const batchUpsertSchema = z.object({
  entries: z.array(journalEntrySchema).max(500),
});

export const unlockRequestSchema = z.object({
  passcode: z.string().min(1).max(128),
});

export type JournalEntryInput = z.infer<typeof journalEntrySchema>;
