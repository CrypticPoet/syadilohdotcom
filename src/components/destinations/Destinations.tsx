"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { PageSummary } from "@/lib/travel/types";
import { cn } from "@/lib/utils";
import DestinationCard from "./DestinationCard";

export default function Destinations({ destinations }: { destinations: PageSummary[] }) {
  const [activeTab, setActiveTab] = useState("all");
  const tabs = ["all", ...new Set(destinations.map(d => d.country))];
  const visible = destinations.filter(d => activeTab === "all" || d.country === activeTab).slice(0, 8);

  return (
    <section id="destinations" className="py-16 relative w-full">
      {/* Background Accents */}
      <div className="absolute top-[30%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-[var(--soft-periwinkle)]/25 blur-[80px] -z-10 pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-[var(--salmon)]/20 blur-[80px] -z-10 pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-heading font-bold mb-6">Find your next destination</h2>
          
          {/* Pill Tabs */}
          <div className="inline-flex bg-white p-2 rounded-full shadow-md overflow-x-auto max-w-full">
            {tabs.map((tab) => (
              <button
                key={tab === "all" ? "All destinations" : tab.charAt(0).toUpperCase() + tab.slice(1)}
                onClick={() => setActiveTab(tab)}
                aria-pressed={activeTab === tab}
                className={cn(
                  "px-3.5 sm:px-6 py-2.5 rounded-full font-medium transition-all whitespace-nowrap",
                  activeTab === tab 
                    ? "bg-[var(--coral-glow)] text-white shadow-md" 
                    : "text-gray-500 hover:text-[var(--vintage-grape)] hover:bg-gray-50"
                )}
              >
                {tab === "all" ? "All destinations" : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <motion.div 
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {visible.map((dest) => (
            <DestinationCard key={dest.path} dest={dest} />
          ))}
        </motion.div>
        <div className="mt-10 text-center">
          <Link href="/holidays" className="inline-flex items-center gap-2 rounded-full bg-[var(--coral-glow)] px-6 py-3.5 font-semibold text-white shadow-sm transition hover:bg-[var(--salmon)]">
            Explore other options <ArrowUpRight size={18} />
          </Link>
        </div>
      </div>
    </section>
  );
}
