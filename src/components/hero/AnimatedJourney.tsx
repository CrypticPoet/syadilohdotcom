"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, Ticket, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AnimatedJourney() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((s) => (s + 1) % 4);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const steps = [
    {
      id: 0,
      icon: <Send size={18} className="text-[var(--coral-glow)]" />,
      title: "User types query.",
      bg: "bg-white",
    },
    {
      id: 1,
      icon: <Sparkles size={18} className="text-[var(--soft-periwinkle)]" />,
      title: "AI agent prepares itinerary.",
      bg: "bg-[var(--soft-periwinkle)]/10",
    },
    {
      id: 2,
      icon: <Ticket size={18} className="text-[var(--salmon)]" />,
      title: "Boarding passes & bookings confirmed.",
      bg: "bg-[var(--salmon)]/10",
    },
    {
      id: 3,
      icon: <UserCheck size={18} className="text-emerald-500" />,
      title: "Bespoke agent handles requests.",
      bg: "bg-emerald-50",
    },
  ];

  return (
    <div className="relative w-full max-w-sm h-[285px] sm:h-[310px] flex flex-col justify-start gap-2.5 sm:gap-3">
      <AnimatePresence mode="popLayout">
        {steps.map((s, i) =>
          i <= step ? (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 220, damping: 22 }}
              className={cn(
                "p-3 sm:p-3.5 rounded-2xl sm:rounded-3xl shadow-md border border-white/60 flex items-center gap-3 sm:gap-3.5 backdrop-blur-sm h-[58px] sm:h-[64px]",
                s.bg,
                i === step
                  ? "ring-2 ring-[var(--coral-glow)]/40 shadow-lg"
                  : "opacity-65"
              )}
            >
              <div className="bg-white p-2 sm:p-2.5 rounded-full shadow-sm shrink-0">
                {s.icon}
              </div>
              <p className="font-semibold text-xs sm:text-sm text-[var(--vintage-grape)] leading-snug">
                {s.title}
              </p>
            </motion.div>
          ) : null
        )}
      </AnimatePresence>
    </div>
  );
}
