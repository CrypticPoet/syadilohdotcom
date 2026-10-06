import { normaliseClimate, normaliseGeography } from "./core";
import type { EditorialDestination, Geography } from "./types";

const AGENT = "SyadilohTravel/1.0 (https://syadiloh.com; destination-planning research)";
export async function fetchSource(url: string) {
  const response = await fetch(url, { headers: { "User-Agent": AGENT, Accept: "application/json" }, signal: AbortSignal.timeout(45_000), cache: "no-store" });
  if (!response.ok) throw new Error(`Source returned HTTP ${response.status}`);
  const length = Number(response.headers.get("content-length") || 0);
  if (length > 25_000_000) throw new Error("Source response exceeds size limit");
  const body = await response.text();
  if (body.length > 25_000_000) throw new Error("Source response exceeds size limit");
  return JSON.parse(body) as unknown;
}
export async function getGeography(destination: EditorialDestination) {
  const url = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${destination.wikidataId}&props=labels%7Cclaims&languages=en&format=json`;
  const raw = await fetchSource(url);
  return { value: normaliseGeography(raw, destination.wikidataId), raw, url };
}
export async function getClimate(geography: Geography) {
  const url = new URL("https://power.larc.nasa.gov/api/temporal/climatology/point");
  url.search = new URLSearchParams({ parameters: "T2M,PRECTOTCORR,CLOUD_AMT", community: "AG", longitude: String(geography.longitude), latitude: String(geography.latitude), format: "JSON" }).toString();
  const raw = await fetchSource(url.toString());
  return { value: normaliseClimate(raw, geography.latitude, geography.longitude), raw, url: url.toString() };
}
