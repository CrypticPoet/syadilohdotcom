import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { claimJob, enqueue, importSourceSnapshot, rollback, runBatch, seedDestinations } from "../src/lib/travel/pipeline";
import { travelSql, closeTravelDatabase } from "../src/lib/travel/database";
import type { PublishedPage } from "../src/lib/travel/types";

test("Postgres: leases, crash recovery, idempotent publication, versions and rollback", { skip: !process.env.DATABASE_URL }, async () => {
  const sql = travelSql();
  const id = `test-${randomUUID()}`;
  const path = `/holidays/${id}`;
  const published: PublishedPage[] = JSON.parse(readFileSync("content/travel/published.json", "utf8")).pages;
  const country = published.find(p => p.path === "/holidays/spain")!.content.destination;
  const editorial = { ...country, id, country: id, variants: [] };
  const raw = JSON.parse(readFileSync("content/travel/sources/spain.geography.json", "utf8"));
  const runs: string[] = [];
  try {
    await seedDestinations([editorial]);
    await importSourceSnapshot(id, raw);
    const claims = await Promise.all([claimJob(id), claimJob(id)]);
    const claimed = claims.filter(Boolean);
    assert.equal(claimed.length, 1, "one worker owns the destination job");
    await enqueue(id, "publish", true);
    const [queued] = await sql`SELECT rerun_requested FROM travel.jobs WHERE destination_id=${id} AND kind='publish'`;
    assert.equal(queued.rerun_requested, true, "changes during an active lease are not dropped");
    await sql`UPDATE travel.jobs SET lease_until=now()-interval '1 second' WHERE id=${claimed[0]!.id}`;
    const replacement = await claimJob(id);
    assert.ok(replacement);
    assert.notEqual(replacement.lease_token, claimed[0]!.lease_token);
    const stale = await sql`SELECT id FROM travel.jobs WHERE id=${claimed[0]!.id} AND lease_token=${claimed[0]!.lease_token} AND lease_until>now()`;
    assert.equal(stale.length, 0, "expired worker cannot pass the publication guard");
    await sql`UPDATE travel.jobs SET lease_until=now()-interval '1 second' WHERE id=${replacement.id}`;
    const first = await runBatch(2, 45000, id); runs.push(first.runId);
    assert.equal(first.failed, 0); assert.equal(first.changed, 1);
    const [before] = await sql`SELECT content_hash,updated_at FROM travel.pages WHERE path=${path}`;
    await enqueue(id, "publish", true);
    const again = await runBatch(1, 45000, id); runs.push(again.runId);
    assert.equal(again.changed, 0);
    const [after] = await sql`SELECT content_hash,updated_at FROM travel.pages WHERE path=${path}`;
    assert.equal(after.content_hash, before.content_hash);
    assert.equal(after.updated_at.toISOString(), before.updated_at.toISOString());
    await seedDestinations([{ ...editorial, summary: `${editorial.summary} Allow an extra day to explore a second region at a slower pace.` }]);
    await enqueue(id, "publish", true);
    const changed = await runBatch(1, 45000, id); runs.push(changed.runId);
    assert.equal(changed.changed, 1);
    const [versions] = await sql`SELECT count(*)::int count FROM travel.page_versions WHERE path=${path}`;
    assert.equal(versions.count, 2);
    assert.equal(await rollback(path, before.content_hash), 1);
    assert.equal(await rollback(path, before.content_hash), 0);
    const [invalidations] = await sql`SELECT count(*)::int count FROM travel.invalidations WHERE path=${path}`;
    assert.equal(invalidations.count, 3, "only meaningful changes enter the outbox");
  } finally {
    // Remove only this UUID-isolated fixture; never touch application records.
    await sql.begin(async tx => {
      await tx`DELETE FROM travel.invalidations WHERE path=${path}`;
      await tx`DELETE FROM travel.page_versions WHERE path=${path}`;
      await tx`DELETE FROM travel.pages WHERE destination_id=${id}`;
      await tx`DELETE FROM travel.jobs WHERE destination_id=${id}`;
      await tx`DELETE FROM travel.source_snapshots WHERE destination_id=${id}`;
      await tx`DELETE FROM travel.destinations WHERE id=${id}`;
      if (runs.length) await tx`DELETE FROM travel.runs WHERE id IN ${tx(runs)}`;
    });
    await closeTravelDatabase();
  }
});
