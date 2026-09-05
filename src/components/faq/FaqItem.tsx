"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

export default function FaqItem({ question, answer }: { question: string, answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div 
      className={cn(
        "border border-gray-200 rounded-2xl overflow-hidden transition-all duration-300 hover:border-[var(--coral-glow)] hover:shadow-md",
        isOpen ? "bg-gradient-to-r from-[var(--ivory)] to-[var(--soft-periwinkle)]/10" : "bg-white hover:bg-gray-50"
      )}
    >
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between text-left"
      >
        <span className="font-semibold text-[var(--vintage-grape)]">{question}</span>
        {isOpen ? <ChevronUp className="text-[var(--coral-glow)] shrink-0" /> : <ChevronDown className="text-gray-400 shrink-0" />}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <p className="px-6 pb-4 text-sm text-gray-600 leading-relaxed">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

