import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildPages, contentHash, monthlyDays, normaliseClimate, normaliseGeography } from "../src/lib/travel/core";
import { climateSchema, editorialSchema, pageSchema, type PublishedPage } from "../src/lib/travel/types";
import { enquirySchema } from "../src/lib/travel/enquiry";

const file = (name: string) => JSON.parse(readFileSync(`content/travel/${name}`, "utf8"));
const climate = file("sources/rome.climate.json");
const geography = normaliseGeography(file("sources/rome.geography.json"), "Q220");
const pages: PublishedPage[] = file("published.json").pages;
const rome = pages.find(p => p.path === "/holidays/italy/rome")!;

test("publication contains 50 valid, unique, verifiable pages with distinct intent", () => {
  assert.equal(pages.length, 50);
  assert.equal(new Set(pages.map(p => p.path)).size, 50);
  const counts: Record<string, number> = {};
  for (const p of pages) {
    pageSchema.parse(p.content);
    assert.equal(contentHash(p.content), p.hash);
    assert.ok(Number.isFinite(Date.parse(p.updatedAt)));
    counts[p.content.type] = (counts[p.content.type] ?? 0) + 1;
    if (p.content.destination.kind !== "country") assert.ok(p.content.climate);
  }
  assert.deepEqual(counts, { country: 5, family: 10, couples: 10, destination: 15, itinerary: 10 });
});
test("canonical content hashes ignore object-key order but detect meaningful changes", () => {
  assert.equal(contentHash({ a: 1, b: { c: 2, d: 3 } }), contentHash({ b: { d: 3, c: 2 }, a: 1 }));
  assert.notEqual(contentHash({ a: 1 }), contentHash({ a: 2 }));
});
test("climate aggregation uses the actual 2001–2020 baseline and leap years", () => {
  assert.equal(monthlyDays(2), 28.25);
  const result = normaliseClimate(climate, geography.latitude, geography.longitude);
  assert.equal(result.months[1].precipitationMm, Math.round(climate.properties.parameter.PRECTOTCORR.FEB * 28.25));
  assert.equal(result.months[0].temperatureC, Math.round(climate.properties.parameter.T2M.JAN * 10) / 10);
  assert.equal(result.baseline, "2001–2020");
});
test("unexpected baselines, units, missing months and fill values block publication", () => {
  for (const mutate of [
    (v: typeof climate) => { v.header.range = "January 1991 - December 2020"; },
    (v: typeof climate) => { v.parameters.PRECTOTCORR.units = "mm"; },
    (v: typeof climate) => { delete v.properties.parameter.T2M.JAN; },
    (v: typeof climate) => { v.properties.parameter.T2M.JAN = -999; },
    (v: typeof climate) => { v.properties.parameter.CLOUD_AMT.JAN = 101; },
  ]) {
    const changed = structuredClone(climate); mutate(changed);
    assert.throws(() => normaliseClimate(changed, geography.latitude, geography.longitude));
  }
});
test("duplicate climate months are rejected", () => {
  const changed = structuredClone(rome.content.climate!);
  changed.months[11].month = 1;
  assert.equal(climateSchema.safeParse(changed).success, false);
});
test("missing climate, incorrect identities and misplaced climate cannot make a page", () => {
  assert.throws(() => buildPages(rome.content.destination, geography, null, []));
  assert.throws(() => buildPages(rome.content.destination, { ...geography, wikidataId: "Q90" }, rome.content.climate, []));
  const misplaced = structuredClone(rome.content.climate!); misplaced.location.latitude = 0;
  assert.throws(() => buildPages(rome.content.destination, geography, misplaced, []));
});
test("editorial quality gate rejects duplicate variants and incomplete itineraries", () => {
  assert.equal(editorialSchema.safeParse({ ...rome.content.destination, itineraryDays: 7 }).success, false);
  assert.equal(editorialSchema.safeParse({ ...rome.content.destination, variants: ["family", "family"] }).success, false);
});
test("Wikidata coordinates must describe a terrestrial place", () => {
  const raw = file("sources/rome.geography.json");
  raw.entities.Q220.claims.P625[0].mainsnak.datavalue.value.globe = "http://www.wikidata.org/entity/Q405";
  assert.throws(() => normaliseGeography(raw, "Q220"));
});
test("enquiries reject invalid email, overlong notes and impossible trip lengths", () => {
  const valid = { sourcePath: rome.path, destination: "Rome", departure: "London", dates: "May", travellerType: "family", duration: "4", budget: "2500", email: "Traveller@example.com" };
  assert.equal(enquirySchema.parse(valid).email, "traveller@example.com");
  for (const change of [{ email: "invalid" }, { duration: 0 }, { duration: 91 }, { notes: "x".repeat(2001) }, { sourcePath: "https://other.example" }]) assert.equal(enquirySchema.safeParse({ ...valid, ...change }).success, false);
});

test("the same page contract supports 10,000 distinct routes without a route file per page", () => {
  const paths = new Set<string>();
  for (let i = 0; i < 2500; i++) {
    // Synthetic identities exist only in this test, never in the publication.
    const d = { ...rome.content.destination, id: `scale-test-${i}` };
    for (const p of buildPages(d, geography, rome.content.climate, [])) paths.add(p.path);
  }
  assert.equal(paths.size, 10000);
});
