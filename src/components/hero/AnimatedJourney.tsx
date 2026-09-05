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
      icon: <Send className="text-[var(--coral-glow)]" />,
      title: "User types query.",
      bg: "bg-white",
    },
    {
      id: 1,
      icon: <Sparkles className="text-[var(--soft-periwinkle)]" />,
      title: "AI agent prepares itinerary.",
      bg: "bg-[var(--soft-periwinkle)]/10",
    },
    {
      id: 2,
      icon: <Ticket className="text-[var(--salmon)]" />,
      title: "Boarding passes & bookings confirmed.",
      bg: "bg-[var(--salmon)]/10",
    },
    {
      id: 3,
      icon: <UserCheck className="text-emerald-500" />,
      title: "Bespoke agent handles requests.",
      bg: "bg-emerald-50",
    }
  ];

  return (
    <div className="relative w-full max-w-sm h-full flex flex-col justify-center gap-4">
      <AnimatePresence mode="popLayout">
        {steps.map((s, i) => (
          i <= step && (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, x: i % 2 === 0 ? -50 : 50, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className={cn(
                "p-4 rounded-3xl shadow-lg border border-white/50 flex items-center gap-4 backdrop-blur-sm",
                s.bg,
                i === step ? "ring-2 ring-[var(--coral-glow)]/30" : "opacity-60 grayscale-[30%]"
              )}
            >
              <div className="bg-white p-3 rounded-full shadow-sm">
                {s.icon}
              </div>
              <p className="font-semibold">{s.title}</p>
            </motion.div>
          )
        ))}
      </AnimatePresence>
    </div>
  );
}
