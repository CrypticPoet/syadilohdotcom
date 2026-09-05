"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Sun, CloudRain } from "lucide-react";
import { cn } from "@/lib/utils";

export default function DestinationCard({ dest }: { dest: { id: number, name: string, image: string, desc: string, q1: string, q2: string, q3: string, q4: string } }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div 
      className="relative rounded-3xl overflow-hidden aspect-[10/9] cursor-pointer group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ y: -5 }}
    >
      <img 
        src={dest.image} 
        alt={dest.name} 
        className={cn(
          "w-full h-full object-cover transition-all duration-500",
          isHovered ? "scale-110 blur-sm brightness-50" : "scale-100 blur-0 brightness-100"
        )}
      />
      
      {/* Default State */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity duration-300",
        isHovered ? "opacity-0" : "opacity-100"
      )}>
        <div className="absolute bottom-4 left-4 right-4 text-white">
          <div className="flex items-center gap-2 mb-1 opacity-80">
            <MapPin size={14} />
            <span className="text-xs font-medium">{dest.name.split(',')[1]}</span>
          </div>
          <h3 className="text-xl font-heading font-semibold">{dest.name.split(',')[0]}</h3>
          <p className="text-xs text-white/80 mt-1 line-clamp-1">{dest.desc}</p>
        </div>
      </div>

      {/* Hover State - Weather Data */}
      <AnimatePresence>
        {isHovered && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute inset-0 p-4 flex flex-col justify-center text-white bg-black/40 backdrop-blur-md"
          >
            <h3 className="text-lg font-heading font-semibold mb-3 text-center">{dest.name}</h3>
            <div className="space-y-2">
              {[
                { q: "Jan-Mar", data: dest.q1 },
                { q: "Apr-Jun", data: dest.q2 },
                { q: "Jul-Sep", data: dest.q3 },
                { q: "Oct-Dec", data: dest.q4 },
              ].map((quarter, i) => (
                <div key={i} className="bg-white/20 rounded-xl p-2 px-3 flex items-center justify-between backdrop-blur-lg border border-white/10">
                  <span className="text-xs font-medium text-white/90">{quarter.q}</span>
                  <div className="flex items-center gap-2 text-xs font-semibold">
                    <span className="flex items-center gap-1"><Sun size={12} className="text-yellow-300"/> {quarter.data.split(' / ')[0]}</span>
                    <span className="text-white/40">|</span>
                    <span className="flex items-center gap-1"><CloudRain size={12} className="text-blue-300"/> {quarter.data.split(' / ')[1]}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

