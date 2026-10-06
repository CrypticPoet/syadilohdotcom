import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/travel/repository";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return [{ url: SITE_URL }, { url: `${SITE_URL}/holidays` }];
}
