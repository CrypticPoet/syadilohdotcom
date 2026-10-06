import { getPageCount, getPageSummaries, SITE_URL } from "@/lib/travel/repository";

const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+\.xml$/.test(id)) return new Response("Not found", { status: 404 });
  const shard = Number(id.slice(0, -4));
  if (shard >= Math.max(1, Math.ceil(await getPageCount() / 5000))) return new Response("Not found", { status: 404 });
  const pages = await getPageSummaries(5000, shard * 5000);
  const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${pages.map(p => `<url><loc>${escape(`${SITE_URL}${p.path}`)}</loc><lastmod>${escape(p.updatedAt)}</lastmod></url>`).join("")}</urlset>`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=300" } });
}
