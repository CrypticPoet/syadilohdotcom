import { z } from "zod";

export const enquirySchema = z.object({
  sourcePath: z.string().max(200).regex(/^\/(holidays|itineraries)(\/[a-z0-9/-]+)?$/),
  destination: z.string().trim().min(2).max(100),
  departure: z.string().trim().min(2).max(100),
  dates: z.string().trim().min(2).max(100),
  travellerType: z.enum(["couples", "family", "solo", "friends"]),
  duration: z.coerce.number().int().min(1).max(90),
  budget: z.coerce.number().min(1).max(1000000),
  email: z.email().max(254).transform(v => v.toLowerCase()),
  notes: z.string().trim().max(2000).default(""),
  website: z.string().max(200).default(""),
});
