import { createHash } from "node:crypto";
import { climateSchema, geographySchema, pageSchema, type ClimateProfile, type EditorialDestination, type Geography, type PageContent } from "./types";

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => [k, canonical(v)]));
  return value;
}
export function contentHash(value: unknown) { return createHash("sha256").update(JSON.stringify(canonical(value))).digest("hex"); }
export function monthlyDays(month: number) {
  let total = 0;
  for (let year = 2001; year <= 2020; year++) total += new Date(Date.UTC(year, month, 0)).getUTCDate();
  return total / 20;
}
export function normaliseClimate(payload: unknown, latitude: number, longitude: number): ClimateProfile {
  const p = payload as { header?: { range?: string; fill_value?: number }; parameters?: Record<string, { units: string }>; properties?: { parameter?: Record<string, Record<string, number>> } };
  if (!p.header?.range?.includes("January 2001 - December 2020")) throw new Error("Unexpected NASA baseline; review before publishing");
  if (p.parameters?.T2M?.units !== "C" || p.parameters?.PRECTOTCORR?.units !== "mm/day" || p.parameters?.CLOUD_AMT?.units !== "%") throw new Error("Unexpected climate units");
  const keys = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  const values = p.properties?.parameter;
  const read = (key: string, month: string) => {
    const n = values?.[key]?.[month];
    if (!Number.isFinite(n) || n === p.header?.fill_value || n === -999) throw new Error(`Missing ${key} for ${month}`);
    return n as number;
  };
  return climateSchema.parse({
    baseline: "2001–2020", location: { latitude, longitude },
    source: { name: "NASA POWER climatology", url: "https://power.larc.nasa.gov/docs/services/api/temporal/climatology/", licence: "Publicly available NASA POWER data; source acknowledged" },
    methodology: "Modelled regional climate averages, not a forecast or station reading. Monthly precipitation is estimated from the source mean daily rate multiplied by the mean calendar-month length over 2001–2020. Precipitation includes rain and snow water equivalent. Cloud cover is not sunshine duration. No snowfall or sunshine-hour estimates are inferred.",
    months: keys.map((key, i) => ({ month: i + 1, temperatureC: Math.round(read("T2M", key) * 10) / 10, precipitationMm: Math.round(read("PRECTOTCORR", key) * monthlyDays(i + 1)), cloudCoverPercent: Math.round(read("CLOUD_AMT", key)) })),
  });
}
export function normaliseGeography(payload: unknown, id: string): Geography {
  const p = payload as { entities?: Record<string, { labels?: { en?: { value: string } }; claims?: Record<string, { rank?: string; mainsnak: { datavalue?: { value: unknown } } }[]> }> };
  const entity = p.entities?.[id];
  const claim = (key: string) => entity?.claims?.[key]?.find(c => c.rank !== "deprecated" && c.mainsnak.datavalue)?.mainsnak.datavalue?.value;
  const point = claim("P625") as { latitude?: number; longitude?: number; globe?: string } | undefined;
  if (!point || point.globe !== "http://www.wikidata.org/entity/Q2") throw new Error(`No terrestrial coordinates for ${id}`);
  return geographySchema.parse({ wikidataId: id, name: entity?.labels?.en?.value, latitude: point.latitude, longitude: point.longitude, geonamesId: claim("P1566") ?? null, source: { name: "Wikidata", url: `https://www.wikidata.org/wiki/${id}`, licence: "CC0" } });
}
export function buildPages(destination: EditorialDestination, geography: Geography, climate: ClimateProfile | null, children: EditorialDestination[]): PageContent[] {
  if (destination.wikidataId !== geography.wikidataId) throw new Error("Destination identity mismatch");
  if (destination.kind !== "country" && !climate) throw new Error("Destination requires a validated climate profile");
  if (climate && (climate.location.latitude !== geography.latitude || climate.location.longitude !== geography.longitude)) throw new Error("Climate location does not match destination geography");
  const base = destination.kind === "country" ? `/holidays/${destination.id}` : `/holidays/${destination.country}/${destination.id}`;
  const pages: PageContent[] = [{ path: base, type: destination.kind === "country" ? "country" : "destination", title: `${destination.name} holidays, thoughtfully planned`, description: `Explore ${destination.name} with practical neighbourhood comparisons, travel ideas${climate ? ", monthly climate averages" : ", destination comparisons"} and a personalised itinerary request for UK travellers.`, destination, geography, climate, children }];
  for (const type of destination.variants) pages.push({ path: `${base}/${type}`, type, title: `${type === "family" ? "Family holidays" : "Holidays for couples"} in ${destination.name}`, description: `${destination.name} ${type === "family" ? "family holiday ideas with child-friendly pacing and practical planning" : "couples holiday ideas with unhurried experiences and thoughtful places to stay"}. Explore a suggested trip and request your own itinerary.`, destination, geography, climate, children });
  if (destination.itineraryDays) pages.push({ path: `/itineraries/${destination.country}/${destination.id}/${destination.itineraryDays}-days`, type: "itinerary", title: `${destination.itineraryDays} days in ${destination.name}: a relaxed itinerary`, description: `Plan ${destination.itineraryDays} days in ${destination.name} with a day-by-day itinerary, realistic pacing, neighbourhood advice and monthly climate averages. Tailor the trip with Syadiloh.`, destination, geography, climate, children, days: destination.itineraryDays });
  return pages.map(page => pageSchema.parse(page));
}
