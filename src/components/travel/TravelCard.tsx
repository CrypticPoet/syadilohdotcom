import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { PageSummary } from "@/lib/travel/types";

export default function TravelCard({ page }: { page: PageSummary }) {
  return <Link href={page.path} className="group overflow-hidden rounded-3xl border border-grape/5 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
    <div className="relative aspect-[4/3] overflow-hidden"><Image src={page.image.url} alt={page.image.alt} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover transition duration-500 group-hover:scale-105" /><span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold capitalize">{page.country}</span></div>
    <div className="p-5"><div className="flex items-start justify-between gap-4"><h3 className="font-heading text-2xl font-semibold">{page.name}</h3><ArrowUpRight className="mt-1 shrink-0 text-coral" size={20} /></div><p className="mt-2 line-clamp-2 text-sm leading-relaxed text-grape/70">{page.description}</p></div>
  </Link>;
}
