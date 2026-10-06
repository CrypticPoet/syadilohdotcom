"use client";
import { useState } from "react";
import type { PageSummary } from "@/lib/travel/types";
import Navbar from "@/components/common/Navbar";
import Hero from "@/components/hero/Hero";
import Features from "@/components/features/Features";
import Destinations from "@/components/destinations/Destinations";
import FaqSection from "@/components/faq/FaqSection";
import Footer from "@/components/common/Footer";
import ChatScreen from "@/components/chat/ChatScreen";

export default function HomeLanding({ destinations }: { destinations: PageSummary[] }) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [initialQuery, setInitialQuery] = useState("");

  const handleStartChat = (query: string) => {
    setInitialQuery(query);
    setIsChatOpen(true);
  };

  const handleExitChat = () => {
    setIsChatOpen(false);
    setInitialQuery("");
  };

  if (isChatOpen) {
    return (
      <ChatScreen
        initialQuery={initialQuery}
        onExit={handleExitChat}
      />
    );
  }

  return (
    <main className="min-h-screen w-full relative overflow-hidden bg-transparent text-[var(--vintage-grape)] scroll-smooth">
      <Navbar onStartPlanning={() => handleStartChat("")} />
      <Hero onStartChat={handleStartChat} />
      <Features />
      <Destinations destinations={destinations} />
      <FaqSection />
      <Footer onStartPlanning={() => handleStartChat("")} />
    </main>
  );
}
