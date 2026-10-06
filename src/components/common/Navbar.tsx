"use client";
import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";

export default function Navbar({ onStartPlanning }: { onStartPlanning?: () => void }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="absolute top-4 left-1/2 -translate-x-1/2 w-[95%] max-w-7xl z-50">
      <div className="bg-white/70 backdrop-blur-md border border-white/20 rounded-full px-6 py-4 flex items-center justify-between shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="text-2xl font-heading font-semibold text-[var(--coral-glow)]">
          syadiloh.com
        </div>
        
        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8 font-medium">
          <Link href="/holidays" className="hover:text-[var(--coral-glow)] transition-colors">Destinations</Link>
          <a href="#how-it-works" className="hover:text-[var(--coral-glow)] transition-colors">How it Works</a>
          <a href="#faq-section" className="hover:text-[var(--coral-glow)] transition-colors">FAQ</a>
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:block">
          <button
            onClick={onStartPlanning}
            className="bg-gradient-to-r from-[var(--coral-glow)] to-[var(--salmon)] text-white px-6 py-2.5 rounded-full font-semibold hover:shadow-lg hover:scale-105 transition-all cursor-pointer"
          >
            Start Planning
          </button>
        </div>

        {/* Mobile Toggle */}
        <button className="md:hidden text-[var(--vintage-grape)]" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 w-full mt-2 bg-white/95 backdrop-blur-xl border border-white/20 rounded-3xl p-6 flex flex-col gap-4 shadow-xl"
          >
            <Link href="/holidays" onClick={() => setIsOpen(false)} className="font-semibold text-lg hover:text-[var(--coral-glow)]">Destinations</Link>
            <a href="#how-it-works" onClick={() => setIsOpen(false)} className="font-semibold text-lg hover:text-[var(--coral-glow)]">How it Works</a>
            <a href="#faq-section" onClick={() => setIsOpen(false)} className="font-semibold text-lg hover:text-[var(--coral-glow)]">FAQ</a>
            <button
              onClick={() => {
                setIsOpen(false);
                onStartPlanning?.();
              }}
              className="bg-[var(--coral-glow)] text-white px-6 py-3 rounded-full font-semibold mt-4 cursor-pointer"
            >
              Start Planning
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
