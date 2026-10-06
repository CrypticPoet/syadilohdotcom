"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import ChatStarter from "@/components/chat/ChatStarter";
import { PROMPTS } from "@/lib/data";
import AnimatedJourney from "./AnimatedJourney";

interface HeroProps {
  onStartChat: (initialQuery: string) => void;
}

export default function Hero({ onStartChat }: HeroProps) {
  const [promptIndex, setPromptIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    if (isTyping) {
      if (displayText.length < PROMPTS[promptIndex].length) {
        timeout = setTimeout(() => {
          setDisplayText(PROMPTS[promptIndex].slice(0, displayText.length + 1));
        }, 40);
      } else {
        timeout = setTimeout(() => setIsTyping(false), 2000);
      }
    } else {
      if (displayText.length > 0) {
        timeout = setTimeout(() => {
          setDisplayText(displayText.slice(0, -1));
        }, 20);
      } else {
        timeout = setTimeout(() => {
          setPromptIndex((prev) => (prev + 1) % PROMPTS.length);
          setIsTyping(true);
        }, 300);
      }
    }

    return () => clearTimeout(timeout);
  }, [displayText, isTyping, promptIndex]);

  return (
    <section className="relative pt-32 pb-14 md:pt-48 md:pb-24 px-6 md:px-8 w-full min-h-[100svh] flex flex-col justify-center overflow-hidden">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16 w-full">
        {/* Blurred Tropical Background */}
        <div className="absolute inset-0 -z-20">
          <div className="absolute inset-[-10%] bg-[url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2073&auto=format&fit=crop')] bg-cover bg-center blur-[4px] scale-105" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--soft-periwinkle)]/40 to-transparent mix-blend-color -z-10" />
        <div className="absolute inset-0 bg-white/50 -z-10" />

        {/* Left Column */}
        <div className="flex-1 flex flex-col gap-6 z-10 w-full">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-heading font-bold leading-tight"
          >
            Plan your trips like you{" "}
            <span className="text-[var(--coral-glow)]">dream</span>,
            we&apos;ll handle the rest
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg md:text-xl text-[var(--vintage-grape)]/80 max-w-xl font-medium"
          >
            Smartest AI trip planner and bespoke travel agents, a message away.
          </motion.p>

          <ChatStarter onStartChat={onStartChat} placeholder={displayText} showCursor showExtras suggestions={[
            { label: "Surprise me 🎲", prompt: "Surprise me with a weekend getaway" },
            { label: "Beach holiday 🏖️", prompt: "Plan a relaxing beach holiday" },
          ]} />
        </div>

        {/* Right Column - Animated Flow */}
        <div
          className="flex-1 relative w-full flex flex-col items-center justify-center gap-4 sm:gap-6 z-10 py-2 sm:py-0"
          id="how-it-works"
        >
          <AnimatedJourney />

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="w-auto max-w-[92%] sm:max-w-lg text-center text-xs sm:text-base font-medium text-[var(--vintage-grape)] bg-white/80 backdrop-blur-md px-4 py-2.5 sm:py-3 rounded-full shadow-md border border-white/60 leading-normal"
          >
            Give shape to the trip of your dreams, travel like an emperor.
          </motion.div>
        </div>
      </div>
    </section>
  );
}
