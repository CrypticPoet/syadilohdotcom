"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Mic, Paperclip, Send } from "lucide-react";

interface ChatStarterProps {
  onStartChat: (query: string) => void;
  suggestions: { label: string; prompt: string }[];
  placeholder: string;
  label?: string;
  showCursor?: boolean;
  showExtras?: boolean;
}

export default function ChatStarter({ onStartChat, suggestions, placeholder, label = "Describe your dream trip", showCursor = false, showExtras = false }: ChatStarterProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const query = input.trim();
    if (query) onStartChat(query);
  }

  return <motion.form onSubmit={submit} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="relative mt-2 flex w-full max-w-2xl flex-col rounded-[2rem] border border-gray-100 bg-white p-4 shadow-[0_20px_50px_rgb(0,0,0,0.1)]">
    <div className="relative flex min-h-[120px] flex-col items-start">
      <textarea ref={textareaRef} aria-label={label} className="z-10 min-h-[100px] w-full resize-none bg-transparent p-2 text-lg text-[var(--vintage-grape)] outline-none placeholder-transparent" placeholder={placeholder || label} value={input} onChange={event => setInput(event.target.value)} onKeyDown={event => {
        if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) submit(event);
      }} />
      {!input && <div aria-hidden="true" className="pointer-events-none absolute left-2 top-2 pr-2 text-lg text-gray-500">{placeholder}{showCursor && <span className="animate-pulse">|</span>}</div>}
    </div>
    <div className="mt-2 flex flex-col justify-between gap-4 border-t border-gray-100 pt-4 sm:flex-row sm:items-center">
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion, index) => <button key={suggestion.prompt} type="button" onClick={() => { setInput(suggestion.prompt); textareaRef.current?.focus(); }} className={`cursor-pointer rounded-full px-4 py-2 text-left text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--coral-glow)] ${index % 2 === 0 ? "bg-[var(--salmon)]/15 text-[var(--salmon)] hover:bg-[var(--salmon)]/25" : "bg-[var(--soft-periwinkle)]/15 text-[var(--soft-periwinkle)] hover:bg-[var(--soft-periwinkle)]/25"}`}>{suggestion.label}</button>)}
      </div>
      <div className="flex shrink-0 items-center gap-1 self-end sm:self-auto">
        {showExtras && <><button type="button" aria-label="Attach details" className="rounded-full p-2 text-gray-400"><Paperclip size={20} /></button><button type="button" aria-label="Voice input" className="rounded-full p-2 text-gray-400"><Mic size={20} /></button></>}
        <button type="submit" aria-label="Send message" disabled={!input.trim()} className="ml-2 rounded-full bg-gradient-to-r from-[var(--coral-glow)] to-[var(--salmon)] p-3 text-white shadow-md transition-all hover:scale-105 active:scale-95 disabled:cursor-default disabled:opacity-50 disabled:hover:scale-100"><Send size={18} /></button>
      </div>
    </div>
  </motion.form>;
}
