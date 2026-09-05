"use client";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Paperclip, Mic, Send } from "lucide-react";
import { PROMPTS } from "@/lib/data";
import AnimatedJourney from "./AnimatedJourney";

interface HeroProps {
  onStartChat: (initialQuery: string) => void;
}

export default function Hero({ onStartChat }: HeroProps) {
  const [promptIndex, setPromptIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const [inputValue, setInputValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = inputValue.trim();
    if (!query) return;
    onStartChat(query);
  };

  const handleQuickButtonClick = (text: string) => {
    // Only fills the textarea, does NOT automatically submit
    setInputValue(text);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

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

          {/* Chat Input Area */}
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative bg-white p-4 rounded-[2rem] shadow-[0_20px_50px_rgb(0,0,0,0.1)] flex flex-col border border-gray-100 mt-2 max-w-2xl w-full"
          >
            <div className="relative flex flex-col items-start min-h-[120px]">
              <textarea
                ref={textareaRef}
                className="w-full h-full min-h-[100px] bg-transparent resize-none outline-none text-lg text-[var(--vintage-grape)] p-2 z-10 placeholder-transparent"
                placeholder="Type your dream trip here..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />
              {inputValue.length === 0 && (
                <div className="absolute top-2 left-2 text-gray-500 text-lg pointer-events-none">
                  {displayText}
                  <span className="animate-pulse">|</span>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-2 pt-4 border-t border-gray-100 gap-4">
              {/* Quick buttons — Only fill input, do NOT auto-start chat */}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickButtonClick("Surprise me with a weekend getaway")}
                  className="text-sm font-semibold bg-[var(--salmon)]/15 text-[var(--salmon)] px-4 py-2 rounded-full hover:bg-[var(--salmon)]/25 transition-colors cursor-pointer"
                >
                  Surprise me 🎲
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickButtonClick("Plan a relaxing beach holiday")}
                  className="text-sm font-semibold bg-[var(--soft-periwinkle)]/15 text-[var(--soft-periwinkle)] px-4 py-2 rounded-full hover:bg-[var(--soft-periwinkle)]/25 transition-colors cursor-pointer"
                >
                  Beach holiday 🏖️
                </button>
              </div>

              <div className="flex items-center gap-1 self-end sm:self-auto shrink-0">
                <button
                  type="button"
                  className="p-2 text-gray-400 hover:text-[var(--coral-glow)] transition-colors rounded-full hover:bg-gray-50 cursor-pointer"
                >
                  <Paperclip size={20} />
                </button>
                <button
                  type="button"
                  className="p-2 text-gray-400 hover:text-[var(--coral-glow)] transition-colors rounded-full hover:bg-gray-50 cursor-pointer"
                >
                  <Mic size={20} />
                </button>
                <button
                  type="submit"
                  aria-label="Send message"
                  className={`bg-gradient-to-r from-[var(--coral-glow)] to-[var(--salmon)] text-white p-3 rounded-full shadow-md ml-2 transition-all ${
                    inputValue.trim()
                      ? "hover:scale-105 active:scale-95 cursor-pointer opacity-100"
                      : "opacity-50 cursor-default"
                  }`}
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </motion.form>
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
