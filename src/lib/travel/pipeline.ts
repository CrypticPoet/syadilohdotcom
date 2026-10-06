import { randomUUID } from "node:crypto";
import { buildPages, contentHash, normaliseClimate, normaliseGeography } from "./core";
import { travelSql } from "./database";
import { getClimate, getGeography } from "./providers";
import { climateSchema, editorialSchema, geographySchema, type EditorialDestination } from "./types";

type Job = { id: string; destination_id: string; kind: "geography" | "climate" | "publish"; attempts: number; lease_token: string };
export async function seedDestinations(records: unknown[]) {
  const destinations = records.map(record => editorialSchema.parse(record));
  if (new Set(destinations.map(d => d.id)).size !== destinations.length) throw new Error("Duplicate destination IDs");
  const countries = new Set(destinations.filter(d => d.kind === "country").map(d => d.id));
  for (const d of destinations) if (!countries.has(d.country)) throw new Error(`Unknown country for ${d.id}`);
  const sql = travelSql();
  const byId = new Map(destinations.map(d => [d.id, d]));
  // Bound transaction payloads and round trips when the catalogue reaches 10k.
  // Each batch commits its destination changes and durable jobs together.
  for (let offset = 0; offset < destinations.length; offset += 250) {
    const batch = destinations.slice(offset, offset + 250);
    await sql.begin(async tx => {
      const values = batch.map(d => ({ id: d.id, country: d.country, editorial: tx.json(d) }));
      const changed = await tx`INSERT INTO travel.destinations ${tx(values, "id", "country", "editorial")} ON CONFLICT(id) DO UPDATE SET country=excluded.country,editorial=excluded.editorial WHERE travel.destinations.editorial<>excluded.editorial RETURNING id,geography,climate`;
      if (!changed.length) return;
      const jobs = changed.map(row => {
        const d = byId.get(row.id)!;
        const kind = row.geography?.wikidataId !== d.wikidataId ? "geography" : d.kind !== "country" && !row.climate ? "climate" : "publish";
        return { destination_id: d.id, kind };
      });
      await tx`INSERT INTO travel.jobs ${tx(jobs, "destination_id", "kind")} ON CONFLICT(destination_id,kind) DO UPDATE SET state=CASE WHEN travel.jobs.state='running' THEN 'running' ELSE 'pending' END,rerun_requested=(travel.jobs.state='running'),attempts=CASE WHEN travel.jobs.state='running' THEN travel.jobs.attempts ELSE 0 END,next_run_at=now(),error=NULL`;
    });
  }
  return destinations.length;
}
export async function enqueue(destinationId: string, kind: Job["kind"], force = false) {
  const sql = travelSql();
  await sql`INSERT INTO travel.jobs(destination_id,kind) VALUES(${destinationId},${kind}) ON CONFLICT(destination_id,kind) DO UPDATE SET state=CASE WHEN travel.jobs.state='running' THEN 'running' ELSE 'pending' END,rerun_requested=(travel.jobs.state='running'),attempts=CASE WHEN travel.jobs.state='running' THEN travel.jobs.attempts ELSE 0 END,next_run_at=now(),error=NULL,updated_at=now() WHERE ${force} OR travel.jobs.state='succeeded'`;
}
export async function scheduleDue(force = false, destinationId?: string) {
  const sql = travelSql();
  const rows = destinationId ? await sql`SELECT * FROM travel.destinations WHERE id=${destinationId}` : await sql`SELECT * FROM travel.destinations WHERE checked_at IS NULL OR checked_at < now()-interval '1 year' OR ${force} ORDER BY id LIMIT 100`;
  for (const row of rows) await enqueue(row.id, "geography", force);
  return rows.length;
}
export async function claimJob(destinationId?: string): Promise<Job | undefined> {
  const sql = travelSql();
  await sql`UPDATE travel.jobs SET state='dead',error='Lease expired after final attempt',updated_at=now() WHERE state='running' AND lease_until<now() AND attempts>=max_attempts`;
  const token = randomUUID();
  const [job] = await sql<Job[]>`UPDATE travel.jobs SET state='running',attempts=attempts+1,lease_token=${token},lease_until=now()+interval '2 minutes',updated_at=now() WHERE id=(SELECT id FROM travel.jobs WHERE (${destinationId ?? null}::text IS NULL OR destination_id=${destinationId ?? null}) AND ((state='pending' AND next_run_at<=now()) OR (state='running' AND lease_until<now())) AND attempts<max_attempts ORDER BY next_run_at,id FOR UPDATE SKIP LOCKED LIMIT 1) RETURNING id,destination_id,kind,attempts,lease_token`;
  return job;
}
async function runJob(job: Job) {
  const sql = travelSql();
  const [row] = await sql`SELECT * FROM travel.destinations WHERE id=${job.destination_id}`;
  const destination = editorialSchema.parse(row.editorial);
  let fetched: Awaited<ReturnType<typeof getGeography>> | Awaited<ReturnType<typeof getClimate>> | undefined;
  if (job.kind === "geography") fetched = await getGeography(destination);
  if (job.kind === "climate") fetched = await getClimate(geographySchema.parse(row.geography));
  const childrenRows = destination.kind === "country" ? await sql`SELECT editorial FROM travel.destinations WHERE country=${destination.id} AND id<>${destination.id} ORDER BY id LIMIT 24` : [];
  const children = childrenRows.map(c => editorialSchema.parse(c.editorial));
  let changed = 0;
  await sql.begin(async tx => {
    const [lease] = await tx`SELECT id FROM travel.jobs WHERE id=${job.id} AND lease_token=${job.lease_token} AND state='running' AND lease_until>now() FOR UPDATE`;
    if (!lease) throw new Error("Job lease lost; stale worker cannot publish");
    if (fetched) {
      await tx`INSERT INTO travel.source_snapshots(destination_id,provider,content_hash,source_url,payload) VALUES(${destination.id},${job.kind},${contentHash(fetched.raw)},${fetched.url},${tx.json(fetched.raw as never)}) ON CONFLICT DO NOTHING`;
      if (job.kind === "geography") await tx`UPDATE travel.destinations SET geography=${tx.json(fetched.value)},checked_at=now() WHERE id=${destination.id}`;
      else await tx`UPDATE travel.destinations SET climate=${tx.json(fetched.value)},checked_at=now() WHERE id=${destination.id}`;
      const next = job.kind === "geography" && destination.kind !== "country" ? "climate" : "publish";
      await tx`INSERT INTO travel.jobs(destination_id,kind) VALUES(${destination.id},${next}) ON CONFLICT(destination_id,kind) DO UPDATE SET state=CASE WHEN travel.jobs.state='running' THEN 'running' ELSE 'pending' END,rerun_requested=(travel.jobs.state='running'),attempts=CASE WHEN travel.jobs.state='running' THEN travel.jobs.attempts ELSE 0 END,next_run_at=now(),error=NULL,updated_at=now()`;
    } else {
      const [current] = await tx`SELECT * FROM travel.destinations WHERE id=${destination.id}`;
      const pages = buildPages(destination, geographySchema.parse(current.geography), current.climate ? climateSchema.parse(current.climate) : null, children);
      for (const page of pages) {
        const hash = contentHash(page);
        const result = await tx`INSERT INTO travel.pages(path,destination_id,type,content,content_hash) VALUES(${page.path},${destination.id},${page.type},${tx.json(page)},${hash}) ON CONFLICT(path) DO UPDATE SET content=excluded.content,content_hash=excluded.content_hash,updated_at=now() WHERE travel.pages.content_hash <> excluded.content_hash RETURNING path`;
        if (result.length) {
          await tx`INSERT INTO travel.page_versions(path,content_hash,content) VALUES(${page.path},${hash},${tx.json(page)}) ON CONFLICT DO NOTHING`;
          await tx`INSERT INTO travel.invalidations(path) VALUES(${page.path})`;
          changed++;
        }
      }
      // Country comparisons depend on their child profiles, not on a full-site rebuild.
      if (destination.kind !== "country") await tx`INSERT INTO travel.jobs(destination_id,kind) VALUES(${destination.country},'publish') ON CONFLICT(destination_id,kind) DO UPDATE SET state=CASE WHEN travel.jobs.state='running' THEN 'running' ELSE 'pending' END,rerun_requested=(travel.jobs.state='running'),attempts=CASE WHEN travel.jobs.state='running' THEN travel.jobs.attempts ELSE 0 END,next_run_at=now()`;
    }
    await tx`UPDATE travel.jobs SET state=CASE WHEN rerun_requested THEN 'pending' ELSE 'succeeded' END,attempts=CASE WHEN rerun_requested THEN 0 ELSE attempts END,rerun_requested=false,next_run_at=now(),lease_until=NULL,error=NULL,updated_at=now() WHERE id=${job.id} AND lease_token=${job.lease_token}`;
  });
  return changed;
}
export async function runBatch(limit = 10, timeBudgetMs = 45_000, destinationId?: string) {
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new Error("Batch limit must be 1–100");
  const sql = travelSql();
  const [run] = await sql`INSERT INTO travel.runs DEFAULT VALUES RETURNING id`;
  const started = Date.now();
  let processed = 0, failed = 0, changed = 0;
  try {
    while (processed + failed < limit && Date.now() - started < timeBudgetMs) {
      const job = await claimJob(destinationId);
      if (!job) break;
      try { changed += await runJob(job); processed++; }
      catch (error) {
        failed++;
        const message = error instanceof Error ? error.message.slice(0, 500) : "Job failed";
        const delay = Math.min(3600, 30 * 2 ** job.attempts);
        await sql`UPDATE travel.jobs SET state=CASE WHEN attempts>=max_attempts THEN 'dead' ELSE 'pending' END,next_run_at=now()+${delay}*interval '1 second',lease_until=NULL,error=${message},updated_at=now() WHERE id=${job.id} AND lease_token=${job.lease_token}`;
      }
    }
  } finally { await sql`UPDATE travel.runs SET finished_at=now(),processed=${processed},failed=${failed} WHERE id=${run.id}`; }
  return { runId: run.id, processed, failed, changed };
}
export async function rollback(path: string, hash: string) {
  const sql = travelSql();
  return sql.begin(async tx => {
    const [version] = await tx`SELECT content FROM travel.page_versions WHERE path=${path} AND content_hash=${hash}`;
    if (!version) throw new Error("Published version not found");
    const changed = await tx`UPDATE travel.pages SET content=${tx.json(version.content)},content_hash=${hash},updated_at=now() WHERE path=${path} AND content_hash<>${hash} RETURNING path`;
    if (changed.length) await tx`INSERT INTO travel.invalidations(path) VALUES(${path})`;
    return changed.length;
  });
}
export async function pipelineStatus() {
  const sql = travelSql();
  const [counts] = await sql`SELECT (SELECT count(*)::int FROM travel.destinations) destinations,(SELECT count(*)::int FROM travel.pages) pages,(SELECT count(*)::int FROM travel.page_versions) versions,(SELECT count(*)::int FROM travel.invalidations) invalidations`;
  const jobs = await sql`SELECT state,kind,count(*)::int AS count FROM travel.jobs GROUP BY state,kind ORDER BY state,kind`;
  const failures = await sql`SELECT destination_id,kind,state,error,next_run_at FROM travel.jobs WHERE error IS NOT NULL ORDER BY updated_at DESC LIMIT 20`;
  return { ...counts, jobs, failures };
}
export async function republish(destinations: EditorialDestination[]) { for (const d of destinations) await enqueue(d.id, "publish", true); }

// Replay retained upstream payloads through the same validation contract.
// This avoids fetching again when bootstrapping from a reviewed source snapshot.
export async function importSourceSnapshot(destinationId: string, rawGeography: unknown, rawClimate?: unknown) {
  const sql = travelSql();
  const [row] = await sql`SELECT editorial FROM travel.destinations WHERE id=${destinationId}`;
  if (!row) throw new Error("Destination must be seeded before source import");
  const d = editorialSchema.parse(row.editorial);
  const geography = normaliseGeography(rawGeography, d.wikidataId);
  const climate = d.kind === "country" ? null : normaliseClimate(rawClimate, geography.latitude, geography.longitude);
  await sql.begin(async tx => {
    const active = await tx`SELECT id FROM travel.jobs WHERE destination_id=${d.id} AND state='running' FOR UPDATE`;
    if (active.length) throw new Error("Wait for the active destination job before replaying sources");
    for (const source of [{ provider: "geography", raw: rawGeography, url: geography.source.url }, ...(climate ? [{ provider: "climate", raw: rawClimate, url: climate.source.url }] : [])]) {
      await tx`INSERT INTO travel.source_snapshots(destination_id,provider,content_hash,source_url,payload) VALUES(${d.id},${source.provider},${contentHash(source.raw)},${source.url},${tx.json(source.raw as never)}) ON CONFLICT DO NOTHING`;
    }
    await tx`UPDATE travel.destinations SET geography=${tx.json(geography)},climate=${climate ? tx.json(climate) : null},checked_at=now() WHERE id=${d.id}`;
    await tx`UPDATE travel.jobs SET state='succeeded',lease_until=NULL,error=NULL,updated_at=now() WHERE destination_id=${d.id} AND kind IN ('geography','climate')`;
  });
  await enqueue(d.id, "publish", true);
}
