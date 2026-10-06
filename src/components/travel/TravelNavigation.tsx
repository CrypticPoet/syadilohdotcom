import Link from "next/link";
import { ArrowUpRight, Plane } from "lucide-react";

export default function TravelNavigation() {
  return <nav aria-label="Main navigation" className="absolute left-1/2 top-4 z-30 flex w-[95%] max-w-7xl -translate-x-1/2 items-center justify-between rounded-full border border-white/60 bg-white/85 px-5 py-4 shadow-sm backdrop-blur-md md:px-8">
    <Link href="/" className="flex items-center gap-2 font-heading text-xl font-semibold text-coral md:text-2xl"><Plane size={22} aria-hidden="true" />syadiloh<span className="hidden sm:inline">.com</span></Link>
    <div className="flex items-center gap-4 text-sm font-semibold md:gap-8"><Link href="/holidays" className="transition-colors hover:text-coral"><span className="sm:hidden">Holidays</span><span className="hidden sm:inline">Explore holidays</span></Link><a href="#request-itinerary" className="inline-flex items-center gap-2 rounded-full bg-grape px-4 py-2.5 text-white transition-colors hover:bg-grape/85 md:px-5">Plan my trip<ArrowUpRight size={16} aria-hidden="true" /></a></div>
  </nav>;
}
