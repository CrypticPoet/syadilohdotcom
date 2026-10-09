"use client";
import { Compass, Star, UserCheck } from "lucide-react";
import { motion } from "framer-motion";
import { FEATURES, MARQUEE_ITEMS } from "@/lib/data";

export default function Features() {
  return (
    <section className="py-14 flex flex-col justify-between gap-12 relative">
      {/* Background Accents */}
      <div className="absolute top-[20%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-[var(--soft-periwinkle)]/20 blur-[60px] -z-10 pointer-events-none" />
      <div className="absolute bottom-[40%] left-[-10%] w-[30vw] h-[30vw] rounded-full bg-[var(--vintage-grape)]/10 blur-[60px] -z-10 pointer-events-none" />
      
      {/* Title */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 text-center mt-12 w-full z-10">
        <h2 className="text-3xl md:text-5xl font-heading font-bold text-[var(--vintage-grape)]">
          Crafted with Intelligence, tailored by our expert agents
        </h2>
      </div>

      {/* Top Half: Feature Cards */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 items-center w-full">
        {FEATURES.map((feature, i) => (
          <motion.div 
            key={feature.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.15 }}
            className="relative group rounded-3xl overflow-hidden aspect-[4/3] md:aspect-square"
          >
            <img src={feature.image} alt="Feature" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            
            {/* Floaty Bubble */}
            <motion.div 
              animate={{ y: [0, -5, 0] }}
              transition={{ repeat: Infinity, duration: 4, delay: i }}
              className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-md p-3 rounded-2xl shadow-xl flex gap-3 items-center"
            >
              <div className="bg-[var(--coral-glow)]/10 p-2 rounded-full text-[var(--coral-glow)] shrink-0">
                {feature.bubbleIcon === "planner" && <Compass size={20} />}
                {feature.bubbleIcon === "concierge" && <UserCheck size={20} />}
                {feature.bubbleIcon === "star" && <Star size={20} />}
              </div>
              <p className="text-sm font-medium leading-tight">{feature.bubbleText}</p>
            </motion.div>
          </motion.div>
        ))}
      </div>

      {/* Bottom Half: Infinite Marquee */}
      <div className="relative w-full overflow-hidden bg-gradient-to-r from-[var(--vintage-grape)] to-[var(--soft-periwinkle)] py-8 flex flex-col gap-6 -rotate-1 scale-105 mt-auto">
        <div className="flex gap-6 animate-marquee w-max">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, idx) => (
            <div key={idx} className="relative w-64 h-40 rounded-3xl overflow-hidden shrink-0 group">
              <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
              <div className="absolute bottom-3 left-4 right-4 text-white">
                <h4 className="font-heading font-semibold text-lg">{item.title}</h4>
                <p className="text-xs text-white/80 line-clamp-1">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
