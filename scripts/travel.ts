import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import { editorial } from "../content/travel/editorial";
import { travelSql, closeTravelDatabase } from "../src/lib/travel/database";
import { enqueue, importSourceSnapshot, pipelineStatus, republish, rollback, runBatch, scheduleDue, seedDestinations } from "../src/lib/travel/pipeline";
import { contentHash } from "../src/lib/travel/core";
import { pageSchema } from "../src/lib/travel/types";

async function main() {
  const [command, ...args] = process.argv.slice(2);
  let images: Record<string, unknown> = {};
  try { images = JSON.parse(await readFile("content/travel/images.json", "utf8")); } catch { /* Images can be supplied by the image-import command. */ }
  const sql = travelSql();
  if (command === "setup") {
    for (const file of (await readdir("migrations/travel")).filter(f => f.endsWith(".sql")).sort()) {
      const migration = await readFile(`migrations/travel/${file}`, "utf8");
      await sql.begin(async tx => { await tx.unsafe(migration); });
    }
    console.log("Travel schema ready; existing enquiry tables unchanged.");
  } else if (command === "seed" || command === "bootstrap") {
    const records = editorial.map(d => {
      if (!images[d.id]) throw new Error(`Missing licensed photograph for ${d.id}; run travel:images first`);
      return { ...d, image: images[d.id] };
    });
    console.log({ destinations: await seedDestinations(records) });
    await scheduleDue(false);
    if (command === "bootstrap") {
      for (let batch = 0; batch < 100; batch++) {
        const result = await runBatch(10, 50_000);
        console.log(result);
        if (result.failed) throw new Error("Source jobs failed; inspect status, then retry after backoff");
        if (!result.processed) break;
      }
      console.log(await pipelineStatus());
    }
  } else if (command === "import-sources") {
    for (const d of editorial.filter(d => !args[0] || args[0] === d.id)) {
      const geography = JSON.parse(await readFile(`content/travel/sources/${d.id}.geography.json`, "utf8"));
      const climate = d.kind === "country" ? undefined : JSON.parse(await readFile(`content/travel/sources/${d.id}.climate.json`, "utf8"));
      await importSourceSnapshot(d.id, geography, climate);
      console.log(`${d.id}: source snapshots imported`);
    }
  } else if (command === "drain") {
    const minutes = Number(args[0] ?? 5);
    if (!Number.isFinite(minutes) || minutes < 1 || minutes > 60) throw new Error("Drain duration must be 1–60 minutes");
    const deadline = Date.now() + minutes * 60000;
    while (Date.now() < deadline) {
      const result = await runBatch(100, Math.min(50000, deadline - Date.now()));
      console.log(result);
      if (!result.processed && !result.failed) break;
    }
    console.log(await pipelineStatus());
  } else if (command === "work") {
    const limit = Number(args[0] ?? 10);
    console.log(await runBatch(limit, 50_000));
  } else if (command === "schedule") {
    console.log({ scheduled: await scheduleDue(args.includes("--force"), args.find(a => !a.startsWith("--"))) });
  } else if (command === "retry") {
    if (!args[0] || !["geography", "climate", "publish"].includes(args[1])) throw new Error("Usage: retry <destination> <geography|climate|publish>");
    await enqueue(args[0], args[1] as "geography" | "climate" | "publish", true);
    console.log("Job requeued.");
  } else if (command === "publish") {
    await republish(editorial);
    console.log(await runBatch(100, 50_000));
  } else if (command === "status") console.log(JSON.stringify(await pipelineStatus(), null, 2));
  else if (command === "rollback") {
    if (!args[0] || !args[1]) throw new Error("Usage: rollback <path> <content-hash>");
    console.log({ changed: await rollback(args[0], args[1]) });
  } else if (command === "export") {
    const pages = await sql`SELECT path,content_hash,updated_at,content FROM travel.pages ORDER BY path`;
    if (!pages.length) throw new Error("Refusing to export an empty publication");
    const snapshot = { schemaVersion: 1, pages: pages.map(p => ({ path: p.path, hash: p.content_hash, updatedAt: new Date(p.updated_at).toISOString(), content: pageSchema.parse(p.content) })) };
    await mkdir("content/travel", { recursive: true });
    await writeFile("content/travel/published.json.tmp", JSON.stringify(snapshot, null, 2));
    const { rename } = await import("node:fs/promises");
    await rename("content/travel/published.json.tmp", "content/travel/published.json");
    console.log({ exported: snapshot.pages.length, contentHash: contentHash(snapshot.pages.map(p => p.hash)) });
  } else throw new Error("Commands: setup, seed, bootstrap, import-sources [destination], schedule [destination] [--force], work [1–100], drain [minutes], retry, publish, status, rollback, export");
}
main().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(closeTravelDatabase);
