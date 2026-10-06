import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import HolidayDirectory from "@/components/travel/HolidayDirectory";
import { SITE_URL } from "@/lib/travel/repository";

type Props = { params: Promise<{ page: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { page } = await params;
  return { title: `Holiday destinations – page ${page} | Syadiloh`, alternates: { canonical: `${SITE_URL}/holidays/browse/${page}` } };
}
async function Directory({ params }: Props) {
  const { page } = await params;
  if (!/^[1-9]\d{0,4}$/.test(page)) notFound();
  if (page === "1") redirect("/holidays");
  return <HolidayDirectory pageNumber={Number(page)} />;
}
export default function Page(props: Props) { return <Suspense fallback={<p className="p-12">Finding your next destination…</p>}><Directory {...props} /></Suspense>; }
