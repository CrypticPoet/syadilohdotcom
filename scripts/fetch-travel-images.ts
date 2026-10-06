import { writeFile, mkdir } from "node:fs/promises";
import { editorial } from "../content/travel/editorial";
import { fetchSource } from "../src/lib/travel/providers";
import type { EditorialDestination } from "../src/lib/travel/types";

type Entity = { claims?: { P18?: { mainsnak: { datavalue?: { value: string } } }[] } };
type ImageInfo = { descriptionurl: string; thumburl?: string; url: string; extmetadata: Record<string, { value: string }> };
const plain = (html: string) => html.replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"').trim();
async function main() {
  const destinations = editorial.filter(d => d.kind !== "country");
  const wiki = await fetchSource(`https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${destinations.map(d => d.wikidataId).join("%7C")}&props=claims&format=json`) as { entities: Record<string, Entity> };
  const images: Record<string, EditorialDestination["image"]> = {};
  for (const d of destinations) {
    const file = wiki.entities[d.wikidataId]?.claims?.P18?.[0]?.mainsnak.datavalue?.value;
    if (!file) throw new Error(`No destination photo for ${d.id}`);
    const url = new URL("https://commons.wikimedia.org/w/api.php");
    url.search = new URLSearchParams({ action: "query", titles: `File:${file}`, prop: "imageinfo", iiprop: "url|extmetadata", iiurlwidth: "1600", format: "json" }).toString();
    const commons = await fetchSource(url.toString()) as { query: { pages: Record<string, { imageinfo?: ImageInfo[] }> } };
    const info = Object.values(commons.query.pages)[0]?.imageinfo?.[0];
    if (!info) throw new Error(`Missing Commons image metadata for ${d.id}`);
    const licence = plain(info.extmetadata.LicenseShortName?.value || "");
    if (!/^(CC BY|CC0|Public domain)/i.test(licence) || /NC|ND/.test(licence)) throw new Error(`Image licence needs review for ${d.id}: ${licence}`);
    images[d.id] = { url: info.thumburl || info.url, alt: `${d.name}: ${plain(file.replace(/\.[^.]+$/, ""))}`, credit: plain(info.extmetadata.Artist?.value || "Wikimedia Commons contributors"), creditUrl: info.descriptionurl, licence };
    console.log(`${d.id}: ${licence}`);
  }
  for (const country of editorial.filter(d => d.kind === "country")) images[country.id] = images[destinations.find(d => d.country === country.id)!.id];
  await mkdir("content/travel", { recursive: true });
  await writeFile("content/travel/images.json", JSON.stringify(images, null, 2));
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
