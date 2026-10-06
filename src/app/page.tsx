import HomeLanding from "@/components/home/HomeLanding";
import { getPageSummaries } from "@/lib/travel/repository";

export default async function Home() {
  const destinations = await getPageSummaries(24, 0, "destination");
  return <HomeLanding destinations={destinations} />;
}
