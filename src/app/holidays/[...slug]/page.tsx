import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPage, getPageSummaries, SITE_URL } from "@/lib/travel/repository";
import GuidePage from "@/components/travel/GuidePage";

type Props = { params: Promise<{ slug: string[] }> };
export async function generateStaticParams() {
  return (await getPageSummaries(50)).filter(p => p.path.startsWith("/holidays/")).map(p => ({ slug: p.path.slice("/holidays/".length).split("/") }));
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPage(`/holidays/${slug.join("/")}`);
  if (!page) notFound();
  const { content } = page;
  return { title: `${content.title} | Syadiloh`, description: content.description, alternates: { canonical: `${SITE_URL}${page.path}` }, openGraph: { title: content.title, description: content.description, url: `${SITE_URL}${page.path}`, locale: "en_GB", images: [{ url: content.destination.image.url, alt: content.destination.image.alt }] } };
}
export default async function HolidayPage({ params }: Props) {
  const { slug } = await params;
  const page = await getPage(`/holidays/${slug.join("/")}`);
  if (!page) notFound();
  const [related, variants] = await Promise.all([
    getPageSummaries(3, 0, "destination", { country: page.content.destination.country, excludeDestinationId: page.content.destination.id }),
    getPageSummaries(10, 0, undefined, { destinationId: page.content.destination.id }),
  ]);
  return <GuidePage page={page} related={related} variants={variants.filter(p => p.path !== page.path)} />;
}
