"use client";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, MapPin } from "lucide-react";
import type { PageSummary } from "@/lib/travel/types";

export default function DestinationCard({ dest }: { dest: PageSummary }) {
  return (
    <motion.div whileHover={{ y: -5 }}>
      <Link href={dest.path} className="relative block overflow-hidden rounded-3xl aspect-[10/9] group focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--coral-glow)]">
        <Image src={dest.image.url} alt={dest.image.alt} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" className="object-cover transition-transform duration-500 group-hover:scale-105 group-focus-visible:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />
        <div className="absolute bottom-5 left-5 right-5 text-white">
          <p className="mb-1 flex items-center gap-2 text-xs font-medium capitalize text-white/80"><MapPin size={14} />{dest.country}</p>
          <h3 className="font-heading text-2xl font-semibold">{dest.name}</h3>
          <p className="mt-2 line-clamp-2 text-sm text-white/85">{dest.description}</p>
          <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold">Explore {dest.name}<ArrowUpRight size={16} /></span>
        </div>
      </Link>
      <p className="mt-2 px-1 text-[10px] leading-relaxed text-[var(--vintage-grape)]/55"><a href={dest.image.creditUrl} className="underline underline-offset-2">{dest.image.credit} · {dest.image.licence}</a></p>
    </motion.div>
  );
}
