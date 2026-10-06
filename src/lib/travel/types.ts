import { z } from "zod";

export const sourceSchema = z.object({ name: z.string().min(1), url: z.url(), licence: z.string().min(1) });
const adviceSchema = z.object({ intro: z.string().min(70), tips: z.array(z.string().min(30)).min(3) });
export const editorialSchema = z.object({
  id: z.string().regex(/^[a-z][a-z0-9-]+$/), name: z.string().min(2),
  country: z.string(), kind: z.enum(["country", "city", "island", "region"]),
  wikidataId: z.string().regex(/^Q\d+$/),
  summary: z.string().min(100), bestFor: z.string(), pace: z.string(),
  gettingAround: z.string().min(80), timing: z.string().min(80),
  image: z.object({ url: z.url(), alt: z.string().min(10), credit: z.string().min(1), creditUrl: z.url(), licence: z.string().min(1) }),
  areas: z.array(z.object({ name: z.string().min(2), character: z.string().min(10), consider: z.string().min(10) })).min(3),
  experiences: z.array(z.object({ name: z.string(), description: z.string().min(30) })).min(4),
  days: z.array(z.object({ title: z.string().min(5), morning: z.string().min(10), afternoon: z.string().min(10), evening: z.string().min(10) })).min(3),
  family: adviceSchema, couples: adviceSchema,
  sources: z.array(sourceSchema).min(1),
  variants: z.array(z.enum(["family", "couples"])), itineraryDays: z.number().int().min(3).max(7).optional(),
}).superRefine((value, ctx) => {
  if (new Set(value.variants).size !== value.variants.length) ctx.addIssue({ code: "custom", message: "Duplicate page variants" });
  if (value.itineraryDays && value.itineraryDays > value.days.length) ctx.addIssue({ code: "custom", message: "Itinerary must describe every promised day" });
});
export type EditorialDestination = z.infer<typeof editorialSchema>;
export const climateSchema = z.object({
  baseline: z.literal("2001–2020"), source: sourceSchema,
  location: z.object({ latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180) }),
  methodology: z.string(),
  months: z.array(z.object({ month: z.number().int().min(1).max(12), temperatureC: z.number().min(-90).max(70), precipitationMm: z.number().min(0).max(3000), cloudCoverPercent: z.number().min(0).max(100) })).length(12),
}).superRefine((value, ctx) => {
  if (new Set(value.months.map(m => m.month)).size !== 12) ctx.addIssue({ code: "custom", message: "Climate must contain each month once" });
});
export type ClimateProfile = z.infer<typeof climateSchema>;
export const geographySchema = z.object({ wikidataId: z.string(), name: z.string(), latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180), geonamesId: z.string().nullable(), source: sourceSchema });
export type Geography = z.infer<typeof geographySchema>;
export const pageSchema = z.object({
  path: z.string().regex(/^\/(holidays|itineraries)\/[a-z0-9/-]+$/),
  type: z.enum(["country", "destination", "family", "couples", "itinerary"]),
  title: z.string().min(10), description: z.string().min(60).max(300),
  destination: editorialSchema, geography: geographySchema,
  climate: climateSchema.nullable(), children: z.array(editorialSchema),
  days: z.number().int().optional(),
});
export type PageContent = z.infer<typeof pageSchema>;
export type PublishedPage = { path: string; hash: string; updatedAt: string; content: PageContent };
export type PageSummary = { path: string; title: string; description: string; type: PageContent["type"]; destinationId: string; country: string; name: string; image: EditorialDestination["image"]; updatedAt: string };
export const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
