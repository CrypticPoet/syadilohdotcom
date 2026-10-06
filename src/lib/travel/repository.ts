import { cacheLife, cacheTag } from "next/cache";
import { readFile } from "node:fs/promises";
import { travelSql } from "./database";
import { pageSchema, type PageSummary, type PublishedPage } from "./types";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://syadiloh.com").replace(/\/$/, "");
const mode = () => process.env.TRAVEL_DATA_MODE || (process.env.DATABASE_URL ? "database" : "snapshot");
let snapshot: Promise<Map<string, PublishedPage>> | undefined;
async function snapshotPages() {
  snapshot ??= readFile(`${process.cwd()}/content/travel/published.json`, "utf8").then(raw => {
    const file = JSON.parse(raw) as { schemaVersion: number; pages: PublishedPage[] };
    if (file.schemaVersion !== 1) throw new Error("Unsupported travel snapshot version");
    return new Map(file.pages.map(p => [p.path, { ...p, content: pageSchema.parse(p.content) }]));
  });
  return snapshot;
}
export async function getPage(path: string): Promise<PublishedPage | null> {
  "use cache";
  cacheLife("max");
  cacheTag(`travel:page:${path}`);
  if (mode() === "snapshot") return (await snapshotPages()).get(path) ?? null;
  const [row] = await travelSql()`SELECT path,content_hash,updated_at,content FROM travel.pages WHERE path=${path}`;
  return row ? { path: row.path, hash: row.content_hash, updatedAt: new Date(row.updated_at).toISOString(), content: pageSchema.parse(row.content) } : null;
}
function summary(p: PublishedPage): PageSummary {
  const { destination: d } = p.content;
  return { path: p.path, title: p.content.title, description: p.content.description, type: p.content.type, destinationId: d.id, country: d.country, name: d.name, image: d.image, updatedAt: p.updatedAt };
}
export async function getPageSummaries(limit = 100, offset = 0, type?: PageSummary["type"], filters: { country?: string; destinationId?: string; excludeDestinationId?: string } = {}): Promise<PageSummary[]> {
  "use cache";
  cacheLife("max");
  cacheTag("travel:index");
  if (limit < 1 || limit > 5000 || offset < 0) throw new Error("Invalid page window");
  if (mode() === "snapshot") return [...(await snapshotPages()).values()].filter(p => (!type || p.content.type === type) && (!filters.country || p.content.destination.country === filters.country) && (!filters.destinationId || p.content.destination.id === filters.destinationId) && (!filters.excludeDestinationId || p.content.destination.id !== filters.excludeDestinationId)).sort((a, b) => a.path.localeCompare(b.path)).slice(offset, offset + limit).map(summary);
  const sql = travelSql();
  // Read only listing fields, not entire content payloads, even for sitemap shards.
  const rows = await sql`SELECT path,type,updated_at,content->>'title' title,content->>'description' description,content->'destination'->>'id' destination_id,content->'destination'->>'country' country,content->'destination'->>'name' name,content->'destination'->'image' image FROM travel.pages WHERE (${type ?? null}::text IS NULL OR type=${type ?? null}) AND (${filters.country ?? null}::text IS NULL OR content->'destination'->>'country'=${filters.country ?? null}) AND (${filters.destinationId ?? null}::text IS NULL OR destination_id=${filters.destinationId ?? null}) AND (${filters.excludeDestinationId ?? null}::text IS NULL OR destination_id<>${filters.excludeDestinationId ?? null}) ORDER BY path LIMIT ${limit} OFFSET ${offset}`;
  return rows.map(r => ({ path: r.path, title: r.title, description: r.description, type: r.type, destinationId: r.destination_id, country: r.country, name: r.name, image: r.image, updatedAt: new Date(r.updated_at).toISOString() }));
}
export async function getPageCount(type?: PageSummary["type"]): Promise<number> {
  "use cache";
  cacheLife("max");
  cacheTag("travel:index");
  if (mode() === "snapshot") return [...(await snapshotPages()).values()].filter(p => !type || p.content.type === type).length;
  const [row] = await travelSql()`SELECT count(*)::int AS count FROM travel.pages WHERE (${type ?? null}::text IS NULL OR type=${type ?? null})`;
  return row.count;
}
