import type { MetadataRoute } from "next";
import { getPageCount, SITE_URL } from "@/lib/travel/repository";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const shards = Math.max(1, Math.ceil(await getPageCount() / 5000));
  return { rules: { userAgent: "*", allow: "/", disallow: ["/api/"] }, sitemap: [`${SITE_URL}/sitemap.xml`, ...Array.from({ length: shards }, (_, i) => `${SITE_URL}/travel-sitemap/${i}.xml`)] };
}
