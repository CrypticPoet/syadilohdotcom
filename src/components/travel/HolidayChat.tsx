"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import ChatStarter from "@/components/chat/ChatStarter";
import ChatScreen from "@/components/chat/ChatScreen";
import type { PageContent } from "@/lib/travel/types";

export default function HolidayChat({ sourcePath, destination, pageType, duration }: {
  sourcePath: string; destination?: string; pageType?: PageContent["type"]; duration?: number;
}) {
  const [initialQuery, setInitialQuery] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const returnScroll = useRef({ x: 0, y: 0 });

  function startChat(query: string) {
    returnScroll.current = { x: window.scrollX, y: window.scrollY };
    setInitialQuery(query);
  }

  useEffect(() => {
    if (initialQuery === null) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.showModal();
    dialogRef.current?.querySelector("textarea")?.focus({ preventScroll: true });
    return () => {
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus({ preventScroll: true });
      window.scrollTo({ left: returnScroll.current.x, top: returnScroll.current.y, behavior: "instant" });
    };
  }, [initialQuery]);

  const style = pageType === "family" ? "family" : pageType === "couples" ? "couples" : "";
  const suggestions = destination ? [
    pageType === "itinerary" && duration ? `Tailor this ${duration}-day ${destination} itinerary` : `Plan a ${style ? `${style} ` : ""}holiday in ${destination}`,
    style === "family" ? `Make a relaxed family itinerary for ${destination}` : style === "couples" ? `Find romantic experiences in ${destination}` : `Plan a family holiday in ${destination}`,
    `Help me choose where to stay in ${destination}`,
    `When should I visit ${destination}?`,
  ] : ["Help me choose a holiday destination", "Plan a family holiday from the UK", "Help me plan a couples holiday", "Find a relaxed city break"];

  return <section id="request-itinerary" aria-labelledby="holiday-chat-heading" className="scroll-mt-6 rounded-[2rem] border border-periwinkle/30 bg-periwinkle/15 p-4 text-grape md:p-8">
    <div className="mb-5 max-w-2xl">
      <p className="text-xs font-bold uppercase tracking-widest text-grape/55">Your ideas. A journey made for you.</p>
      <h2 id="holiday-chat-heading" className="mt-2 font-heading text-3xl font-semibold md:text-4xl">{destination ? `Let’s plan your ${destination} trip.` : "Let’s find your next adventure."}</h2>
      <p className="mt-3 text-sm leading-relaxed text-grape/75">Choose a prompt, make it your own, then send to start planning with our concierge. Review and confirm your itinerary request so our agents can follow up with you.</p>
    </div>
    <ChatStarter onStartChat={startChat} suggestions={suggestions.map(prompt => ({ label: prompt, prompt }))} placeholder={destination ? `Tell us about your dream trip to ${destination}…` : "Where would you love to go?"} label={destination ? `Describe your ${destination} trip` : "Describe your dream trip"} />
    {initialQuery !== null && createPortal(
      <dialog ref={dialogRef} aria-label={destination ? `Plan your ${destination} trip` : "Plan your trip"} onCancel={event => { event.preventDefault(); setInitialQuery(null); }} className="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none border-0 bg-transparent p-0 text-grape backdrop:bg-grape/30">
        <ChatScreen key={sourcePath} sourcePath={sourcePath} initialQuery={initialQuery} initialSuggestions={suggestions} onExit={() => setInitialQuery(null)} exitLabel="Back to guide" />
      </dialog>, document.body,
    )}
    <p className="mt-4 text-xs leading-relaxed text-grape/60">An itinerary request, with no payment required. By confirming your request, you’re asking Syadiloh to contact you about your trip.</p>
  </section>;
}
