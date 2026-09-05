"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { DESTINATIONS } from "@/lib/data";
import { cn } from "@/lib/utils";
import DestinationCard from "./DestinationCard";

export default function Destinations() {
  const [activeTab, setActiveTab] = useState<keyof typeof DESTINATIONS>("North America");
  const tabs: (keyof typeof DESTINATIONS)[] = ["North America", "Europe", "Asia", "Africa"];

  return (
    <section id="destinations" className="py-16 relative w-full overflow-hidden">
      {/* Background Accents */}
      <div className="absolute top-[10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-[var(--soft-periwinkle)]/20 blur-[80px] -z-10 pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[35vw] h-[35vw] rounded-full bg-[var(--salmon)]/10 blur-[100px] -z-10 pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-heading font-bold mb-6">Where users are travelling to</h2>
          
          {/* Pill Tabs */}
          <div className="inline-flex bg-white p-2 rounded-full shadow-md overflow-x-auto max-w-full">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-6 py-2.5 rounded-full font-medium transition-all whitespace-nowrap",
                  activeTab === tab 
                    ? "bg-[var(--coral-glow)] text-white shadow-md" 
                    : "text-gray-500 hover:text-[var(--vintage-grape)] hover:bg-gray-50"
                )}
              >
                {tab}
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
          {DESTINATIONS[activeTab].map((dest) => (
            <DestinationCard key={dest.id} dest={dest} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
