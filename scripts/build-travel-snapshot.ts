import { readFile, writeFile, mkdir, rename } from "node:fs/promises";
import { editorial } from "../content/travel/editorial";
import { contentHash, buildPages, normaliseGeography, normaliseClimate } from "../src/lib/travel/core";
import { fetchSource, getClimate } from "../src/lib/travel/providers";
import { editorialSchema, pageSchema, type PublishedPage } from "../src/lib/travel/types";

// Offline/build-step publication uses the same contracts and hashes as Postgres.
// --refresh checks upstream sources; ordinary runs replay retained snapshots.
async function main() {
  const refresh = process.argv.includes("--refresh");
  const images = JSON.parse(await readFile("content/travel/images.json", "utf8"));
  const records = editorial.map(d => editorialSchema.parse({ ...d, image: images[d.id] }));
  await mkdir("content/travel/sources", { recursive: true });
  const previous = new Map<string, PublishedPage>();
  try {
    const old = JSON.parse(await readFile("content/travel/published.json", "utf8"));
    if (old.schemaVersion !== 1) throw new Error("Unexpected publication schema");
    for (const p of old.pages) {
      pageSchema.parse(p.content);
      if (contentHash(p.content) !== p.hash || !Number.isFinite(Date.parse(p.updatedAt))) throw new Error("Existing publication is corrupt");
      previous.set(p.path, p);
    }
  } catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
  let entities: Record<string, unknown> | undefined;
  const pages: PublishedPage[] = [];
  for (const [index, d] of records.entries()) {
    const geographyFile = `content/travel/sources/${d.id}.geography.json`;
    let raw: unknown;
    try { if (refresh) throw new Error("Refresh requested"); raw = JSON.parse(await readFile(geographyFile, "utf8")); }
    catch {
      if (!entities?.[d.wikidataId]) {
        const batch = records.slice(index, index + 40);
        const response = await fetchSource(`https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${batch.map(r => r.wikidataId).join("%7C")}&props=labels%7Cclaims&languages=en&format=json`) as { entities: Record<string, { labels: unknown; claims: Record<string, unknown> }> };
        entities = { ...entities, ...Object.fromEntries(Object.entries(response.entities).map(([id, e]) => [id, { id, labels: e.labels, claims: { P625: e.claims.P625, P1566: e.claims.P1566 } }])) };
      }
      raw = { entities: { [d.wikidataId]: entities[d.wikidataId] } };
      normaliseGeography(raw, d.wikidataId);
      await writeFile(geographyFile, JSON.stringify(raw, null, 2));
    }
    const geography = normaliseGeography(raw, d.wikidataId);
    let climate = null;
    if (d.kind !== "country") {
      const climateFile = `content/travel/sources/${d.id}.climate.json`;
      let climateRaw: unknown;
      try { if (refresh) throw new Error("Refresh requested"); climateRaw = JSON.parse(await readFile(climateFile, "utf8")); }
      catch { const fetched = await getClimate(geography); climateRaw = fetched.raw; await writeFile(climateFile, JSON.stringify(climateRaw, null, 2)); }
      climate = normaliseClimate(climateRaw, geography.latitude, geography.longitude);
    }
    const children = d.kind === "country" ? records.filter(c => c.country === d.id && c.id !== d.id).sort((a, b) => a.id.localeCompare(b.id)).slice(0, 24) : [];
    for (const content of buildPages(d, geography, climate, children)) {
      const hash = contentHash(content);
      const old = previous.get(content.path);
      pages.push({ path: content.path, hash, updatedAt: old?.hash === hash ? old.updatedAt : new Date().toISOString(), content });
    }
    console.log(`${d.id}: validated`);
  }
  if (new Set(pages.map(p => p.path)).size !== pages.length || !pages.length) throw new Error("Invalid publication manifest");
  await writeFile("content/travel/published.json.tmp", JSON.stringify({ schemaVersion: 1, pages }, null, 2));
  await rename("content/travel/published.json.tmp", "content/travel/published.json");
  console.log({ published: pages.length, changed: pages.filter(p => previous.get(p.path)?.hash !== p.hash).length });
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
