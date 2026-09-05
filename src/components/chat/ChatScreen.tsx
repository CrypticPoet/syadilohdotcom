"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import { useChat } from "@ai-sdk/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Paperclip,
  Mic,
  Send,
  Loader2,
  ArrowLeft,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import Navbar from "@/components/common/Navbar";
import ItineraryCard from "@/components/hero/ItineraryCard";

interface ChatScreenProps {
  initialQuery?: string;
  onExit: () => void;
}

// Strip suggestions block from rendered message text
function cleanMessageText(text: string): string {
  return text.replace(/\[SUGGESTIONS:[\s\S]*?(\]|$)/gi, "").trim();
}

// Formatter for AI responses supporting bold (**text**) and bullet points (- item)
function FormattedText({ text }: { text: string }) {
  const cleaned = cleanMessageText(text);
  const lines = cleaned.split("\n");

  return (
    <div className="space-y-1.5 leading-relaxed text-sm sm:text-base">
      {lines.map((line, lIdx) => {
        if (!line.trim()) return <div key={lIdx} className="h-1" />;

        const isBullet =
          line.trim().startsWith("- ") ||
          line.trim().startsWith("* ") ||
          line.trim().startsWith("• ");
        const content = isBullet ? line.trim().replace(/^[-*•]\s+/, "") : line;

        const parts = content.split(/(\*\*.*?\*\*)/g);

        const renderedLine = parts.map((part, pIdx) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return (
              <strong
                key={pIdx}
                className="font-bold text-[var(--vintage-grape)]"
              >
                {part.slice(2, -2)}
              </strong>
            );
          }
          return <span key={pIdx}>{part}</span>;
        });

        if (isBullet) {
          return (
            <div key={lIdx} className="flex items-start gap-1.5 pl-1.5">
              <span className="text-[var(--coral-glow)] font-bold shrink-0 leading-tight">
                •
              </span>
              <div className="flex-1">{renderedLine}</div>
            </div>
          );
        }

        return <p key={lIdx}>{renderedLine}</p>;
      })}
    </div>
  );
}

export default function ChatScreen({ initialQuery, onExit }: ChatScreenProps) {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status, setMessages } = useChat();
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const initialSentRef = useRef(false);

  // Send initial query on mount if provided
  useEffect(() => {
    if (initialQuery && !initialSentRef.current) {
      initialSentRef.current = true;
      sendMessage({ text: initialQuery });
    }
  }, [initialQuery, sendMessage]);

  // Auto-scroll ONLY internal messages container
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [messages, status]);

  // Extract quick reply suggestions from the latest assistant message
  const suggestions = useMemo(() => {
    if (messages.length === 0) {
      return [
        "Help me discover a destination 🌴",
        "I have a destination in mind ✈️",
      ];
    }

    const lastAssistant = [...messages]
      .reverse()
      .find((m) => m.role === "assistant");
    if (!lastAssistant) return [];

    for (const part of [...lastAssistant.parts].reverse()) {
      if (part.type === "text" && part.text) {
        // Robust extraction: matches [SUGGESTIONS: ... ] or unclosed [SUGGESTIONS: ...
        const match =
          part.text.match(/\[SUGGESTIONS:\s*([\s\S]*?)\]/i) ||
          part.text.match(/\[SUGGESTIONS:\s*([^\n\r]+)/i);

        if (match) {
          const rawContent = match[1];
          // Split on pipe characters OR newlines
          const items = rawContent
            .split(/\s*\|\s*|\n+/)
            .map((item) =>
              item
                .replace(/^[-*•\s"'`]+|["'`\s]+$/g, "")
                .replace(/\|/g, "")
                .replace(/\s+/g, " ")
                .trim()
            )
            .filter(
              (item) =>
                item.length > 0 &&
                !item.toLowerCase().startsWith("suggestion")
            );

          if (items.length > 0) {
            // Stick to 2 suggestions
            return items.slice(0, 2);
          }
        }
      }
    }

    return [];
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = input.trim();
    if (!query) return;

    sendMessage({ text: query });
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (status === "submitted" || status === "streaming") return;
    if (suggestion.toLowerCase().includes("back to home")) {
      onExit();
      return;
    }
    if (suggestion.toLowerCase().includes("plan another trip")) {
      handleResetChat();
      return;
    }
    sendMessage({ text: suggestion });
  };

  const handleResetChat = () => {
    setMessages([]);
    setInput("");
  };

  const isStreaming = status === "submitted" || status === "streaming";

  return (
    <div className="h-dvh w-full overflow-hidden flex flex-col relative select-none">
      {/* Exact Tropical Location Hero Background */}
      <div className="absolute inset-0 -z-20 overflow-hidden pointer-events-none">
        <div className="absolute inset-[-10%] bg-[url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2073&auto=format&fit=crop')] bg-cover bg-center blur-[4px] scale-105" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--soft-periwinkle)]/40 to-transparent mix-blend-color -z-10 pointer-events-none" />
      <div className="absolute inset-0 bg-white/40 -z-10 pointer-events-none" />

      {/* Main Navbar at top */}
      <Navbar onStartPlanning={() => {}} />

      {/* Chat Sub-Navigation & Reduced-Width Container */}
      <div className="pt-20 sm:pt-24 pb-3 sm:pb-5 px-3 sm:px-4 max-w-2xl md:max-w-4xl w-full mx-auto flex-1 flex flex-col min-h-0 z-10">
        {/* Equal-Sized Top Buttons: Back to Home & New Chat */}
        <div className="flex items-center justify-between my-4 px-1 gap-2">
          <button
            onClick={onExit}
            className="group flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/90 hover:bg-white text-[var(--vintage-grape)] shadow-sm border border-gray-200/80 font-semibold text-xs sm:text-sm transition-all hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-md shrink-0"
            title="Return to homepage"
          >
            <ArrowLeft
              size={15}
              className="group-hover:-translate-x-0.5 transition-transform text-[var(--coral-glow)] shrink-0"
            />
            <span>Back to Home</span>
          </button>

          <button
            onClick={handleResetChat}
            className="group flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/90 hover:bg-white text-[var(--vintage-grape)] shadow-sm border border-gray-200/80 font-semibold text-xs sm:text-sm transition-all hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-md shrink-0"
            title="Start fresh conversation"
          >
            <RotateCcw
              size={14}
              className="group-hover:-rotate-45 transition-transform text-[var(--coral-glow)] shrink-0"
            />
            <span>New Chat</span>
          </button>
        </div>

        {/* The Expanded Chat Card — Focused Width & Translucent */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="flex-1 flex flex-col bg-white/85 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-white/60 shadow-xl overflow-hidden min-h-0 select-text"
        >
          {/* Scrollable messages container — ONLY this div scrolls */}
          <div
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto px-3.5 sm:px-6 py-4 sm:py-5 space-y-3.5 min-h-0"
          >
            {/* Initial Welcome */}
            {messages.length === 0 && (
              <div className="flex justify-start">
                <div className="max-w-[90%] sm:max-w-[80%] px-4 sm:px-5 py-3 rounded-2xl rounded-bl-sm text-sm sm:text-base leading-relaxed bg-white text-[var(--vintage-grape)] border border-gray-200/80 shadow-sm font-medium">
                  Welcome to Syadiloh. ✨ Tell me what you&apos;re dreaming of, or let me help you discover the ultimate destination!
                </div>
              </div>
            )}

            {/* Messages */}
            {messages.map((message) => {
              const isUser = message.role === "user";

              return (
                <div key={message.id} className="space-y-2.5 w-full">
                  {message.parts.map((part, i) => {
                    // 1. Text Parts
                    if (part.type === "text" && part.text.trim()) {
                      return (
                        <div
                          key={`${message.id}-${i}`}
                          className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[90%] sm:max-w-[80%] px-4 sm:px-5 py-2.5 sm:py-3 text-sm sm:text-base leading-relaxed ${
                              isUser
                                ? "bg-[var(--vintage-grape)] text-[var(--ivory)] rounded-2xl rounded-br-xs shadow-sm"
                                : "bg-white text-[var(--vintage-grape)] rounded-2xl rounded-bl-xs border border-gray-200/80 shadow-sm"
                            }`}
                          >
                            {isUser ? (
                              <p className="whitespace-pre-wrap">{part.text}</p>
                            ) : (
                              <FormattedText text={part.text} />
                            )}
                          </div>
                        </div>
                      );
                    }

                    // 2. Tool Part — showTripSummary (Itinerary Summary Card)
                    const isSummaryTool =
                      part.type === "tool-showTripSummary" ||
                      (part.type === "dynamic-tool" &&
                        (part as any).toolName === "showTripSummary") ||
                      (part as any).toolName === "showTripSummary";

                    if (isSummaryTool) {
                      const p = part as any;
                      const toolOutput = p.output || p.result;

                      // If the tool execution returned an error (e.g. premature call rejected), suppress card
                      if (
                        toolOutput?.error ||
                        p.state === "output-error" ||
                        p.errorText
                      ) {
                        const hasOtherContent = message.parts.some(
                          (otherPart, otherIdx) =>
                            otherIdx !== i &&
                            ((otherPart.type === "text" &&
                              otherPart.text.trim().length > 0) ||
                              (otherPart as any).output?.destination)
                        );
                        if (hasOtherContent) {
                          return null;
                        }
                        return (
                          <div
                            key={`${message.id}-${i}`}
                            className="flex justify-start"
                          >
                            <div className="bg-amber-50 text-amber-800 px-3.5 py-2 rounded-xl text-xs border border-amber-200/80 font-medium">
                              Reviewing itinerary details...
                            </div>
                          </div>
                        );
                      }

                      // When verified output data is available from server, render compact full-width card
                      if (
                        toolOutput &&
                        (toolOutput.destination || toolOutput.referenceId)
                      ) {
                        return (
                          <div
                            key={`${message.id}-${i}`}
                            className="my-2.5 w-full"
                          >
                            <ItineraryCard
                              referenceId={
                                toolOutput.referenceId || "SYA-PREVIEW"
                              }
                              destination={
                                toolOutput.destination || "Bespoke Getaway"
                              }
                              departureCity={toolOutput.departureCity}
                              travelers={toolOutput.travelers}
                              partySize={Number(toolOutput.partySize) || 2}
                              budget={toolOutput.budget || "Luxury Tier"}
                              timeOfTrip={toolOutput.timeOfTrip}
                              duration={toolOutput.duration || "Custom Dates"}
                              vibe={toolOutput.vibe || "Curated Experience"}
                              email={toolOutput.email}
                              phone={toolOutput.phone}
                            />
                          </div>
                        );
                      }

                      // Preparing state while server executes
                      return (
                        <div
                          key={`${message.id}-${i}`}
                          className="flex justify-start"
                        >
                          <div className="bg-white text-[var(--vintage-grape)] px-3.5 py-2 rounded-xl border border-gray-200/80 text-xs sm:text-sm flex items-center gap-2 shadow-sm">
                            <Loader2
                              size={14}
                              className="animate-spin text-[var(--coral-glow)]"
                            />
                            <span>Generating your itinerary summary...</span>
                          </div>
                        </div>
                      );
                    }

                    // 3. Tool Part — saveTripEnquiry (Database Persistence)
                    const isSaveTripTool =
                      part.type === "tool-saveTripEnquiry" ||
                      (part.type === "dynamic-tool" &&
                        (part as any).toolName === "saveTripEnquiry") ||
                      (part as any).toolName === "saveTripEnquiry";

                    if (isSaveTripTool) {
                      const p = part as any;
                      // While saving, show loading indicator
                      if (!p.output && !p.result && p.state !== "output-available") {
                        return (
                          <div
                            key={`${message.id}-${i}`}
                            className="flex justify-start"
                          >
                            <div className="bg-white text-[var(--vintage-grape)] px-3.5 py-2 rounded-xl border border-gray-200/80 text-xs sm:text-sm flex items-center gap-2 shadow-sm">
                              <Loader2
                                size={14}
                                className="animate-spin text-[var(--coral-glow)]"
                              />
                              <span>Confirming and saving your booking...</span>
                            </div>
                          </div>
                        );
                      }
                      // Once saved, do NOT show duplicate card; confirmation text message is rendered below
                      return null;
                    }

                    return null;
                  })}
                </div>
              );
            })}

            {/* Streaming Indicator */}
            {isStreaming &&
              messages.length > 0 &&
              messages[messages.length - 1].role === "user" && (
                <div className="flex justify-start">
                  <div className="bg-white px-4 py-2.5 rounded-2xl rounded-bl-xs border border-gray-200/80 text-sm flex items-center gap-2 text-[var(--vintage-grape)] shadow-sm">
                    <div className="flex gap-1.5 py-0.5">
                      <span className="w-2 h-2 bg-[var(--coral-glow)] rounded-full animate-bounce [animation-delay:0ms]" />
                      <span className="w-2 h-2 bg-[var(--coral-glow)] rounded-full animate-bounce [animation-delay:150ms]" />
                      <span className="w-2 h-2 bg-[var(--coral-glow)] rounded-full animate-bounce [animation-delay:300ms]" />
                    </div>
                  </div>
                </div>
              )}
          </div>

          {/* Quick Reply Suggestions (Appears Just Above Text Box) */}
          <AnimatePresence>
            {!isStreaming && suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.15 }}
                className="px-3 sm:px-5 py-2 bg-white/95 border-t border-gray-100 flex flex-wrap items-center gap-1.5 sm:gap-2"
              >
                <div className="flex items-center gap-1 text-[11px] sm:text-xs font-semibold text-[var(--vintage-grape)]/60 mr-0.5 shrink-0">
                  <Sparkles size={12} className="text-[var(--coral-glow)]" />
                  <span className="hidden xs:inline">Suggestions:</span>
                </div>
                {suggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="px-3 py-1.5 rounded-full bg-[var(--ivory)] hover:bg-[var(--soft-periwinkle)]/20 text-[var(--vintage-grape)] border border-gray-200/90 hover:border-[var(--soft-periwinkle)] text-xs sm:text-sm font-semibold transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-xs text-left min-h-[34px] flex items-center"
                  >
                    {suggestion}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom Chat Input Bar — Mobile Optimized */}
          <form
            onSubmit={handleSubmit}
            className="p-2.5 sm:p-3.5 border-t border-gray-100/90 bg-white/95 backdrop-blur-md flex items-end gap-1.5 sm:gap-2 shrink-0"
          >
            <textarea
              ref={textareaRef}
              className="flex-1 bg-transparent resize-none outline-none text-sm sm:text-base text-[var(--vintage-grape)] min-h-[38px] max-h-[100px] py-1.5 sm:py-2 px-2.5 sm:px-3 placeholder:text-gray-400 leading-relaxed font-sans"
              placeholder="Reply to concierge..."
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = `${Math.min(target.scrollHeight, 100)}px`;
              }}
            />
            <div className="flex items-center gap-1 shrink-0 pb-0.5">
              <button
                type="button"
                className="p-2 text-gray-400 hover:text-[var(--coral-glow)] transition-colors rounded-full hover:bg-gray-50 cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
                title="Attach details"
              >
                <Paperclip size={17} />
              </button>
              <button
                type="button"
                className="p-2 text-gray-400 hover:text-[var(--coral-glow)] transition-colors rounded-full hover:bg-gray-50 cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
                title="Voice input"
              >
                <Mic size={17} />
              </button>
              <button
                type="submit"
                disabled={isStreaming || !input.trim()}
                className="bg-gradient-to-r from-[var(--coral-glow)] to-[var(--salmon)] text-white p-2 sm:p-2.5 rounded-full hover:scale-105 active:scale-95 transition-all shadow-md ml-0.5 disabled:opacity-50 disabled:hover:scale-100 cursor-pointer disabled:cursor-not-allowed min-w-[36px] min-h-[36px] flex items-center justify-center"
              >
                {isStreaming ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
