import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
import type { PublishedPage } from "../src/lib/travel/types";

async function main() {
  const base = process.env.TRAVEL_VERIFY_URL || "http://localhost:3000";
  const canonical = (process.env.NEXT_PUBLIC_SITE_URL || "https://syadiloh.com").replace(/\/$/, "");
  const pages: PublishedPage[] = JSON.parse(await readFile("content/travel/published.json", "utf8")).pages;
  for (let offset = 0; offset < pages.length; offset += 4) {
    await Promise.all(pages.slice(offset, offset + 4).map(async p => {
      const response = await fetch(`${base}${p.path}`, { signal: AbortSignal.timeout(45000) });
      assert.equal(response.status, 200, p.path);
      const html = await response.text();
      assert.ok(html.includes('<h1'), `${p.path}: missing server-rendered heading`);
      assert.ok(html.includes(`href="${canonical}${p.path}"`), `${p.path}: incorrect canonical`);
      assert.ok(html.includes('application/ld+json'), `${p.path}: missing structured data`);
      if (p.content.climate) assert.ok(html.includes("mm/month"), `${p.path}: missing climate table`);
    }));
  }
  const robots = await (await fetch(`${base}/robots.txt`)).text();
  assert.ok(robots.includes(`${canonical}/travel-sitemap/0.xml`));
  const sitemap = await (await fetch(`${base}/travel-sitemap/0.xml`)).text();
  assert.equal((sitemap.match(/<url>/g) || []).length, pages.length);
  const missing = await fetch(`${base}/holidays/unknown-destination`);
  const missingBody = await missing.text();
  assert.ok(missing.status === 404 || /name="robots" content="noindex"/.test(missingBody), "Unknown guide must not be indexable");
  const unauthorised = await fetch(`${base}/api/travel/cron`);
  assert.equal(unauthorised.status, 401);
  const badEnquiry = await fetch(`${base}/api/enquiries`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: "invalid" }) });
  assert.equal(badEnquiry.status, 400);
  let invalidated = 0;
  if (process.env.CRON_SECRET) {
    const response = await fetch(`${base}/api/travel/revalidate`, { method: "POST", headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` } });
    assert.equal(response.status, 200);
    invalidated = (await response.json()).invalidated;
    const cron = await fetch(`${base}/api/travel/cron`, { headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` } });
    assert.equal(cron.status, 200);
    assert.equal((await cron.json()).failed, 0);
  }
  console.log({ verifiedPages: pages.length, sitemapEntries: pages.length, unknownGuideStatus: missing.status, protectedCron: true, invalidated });
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
