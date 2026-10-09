import type { Metadata } from "next";
import HomeLanding from "@/components/home/HomeLanding";
import { getPageSummaries, SITE_URL } from "@/lib/travel/repository";

export const metadata: Metadata = {
  alternates: { canonical: SITE_URL },
};

export default async function Home() {
  const destinations = await getPageSummaries(24, 0, "destination");
  return <HomeLanding destinations={destinations} />;
}
