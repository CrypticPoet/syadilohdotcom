"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Paperclip, Send, Mic, Sparkles, Ticket, UserCheck, 
  Bot, Star, PlaneTakeoff, Menu, X, MapPin, ChevronDown, ChevronUp, Sun, CloudRain
} from "lucide-react";
import { PROMPTS, FEATURES, MARQUEE_ITEMS, DESTINATIONS, REVIEWS, FAQS } from "@/lib/data";
import clsx from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export default function Home() {
  return (
    <main className="min-h-screen w-full relative overflow-hidden bg-transparent text-[var(--vintage-grape)] scroll-smooth">
      <Navbar />
      <Hero />
      <Features />
      <Destinations />
      <FaqSection />
      <Footer />
    </main>
  );
}

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="absolute top-4 left-1/2 -translate-x-1/2 w-[95%] max-w-7xl z-50">
      <div className="bg-white/70 backdrop-blur-md border border-white/20 rounded-full px-6 py-4 flex items-center justify-between shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="text-2xl font-heading font-semibold text-[var(--coral-glow)]">
          syadiloh.com
        </div>
        
        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8 font-medium">
          <a href="#destinations" className="hover:text-[var(--coral-glow)] transition-colors">Destinations</a>
          <a href="#how-it-works" className="hover:text-[var(--coral-glow)] transition-colors">How it Works</a>
          <a href="#faq-section" className="hover:text-[var(--coral-glow)] transition-colors">FAQ</a>
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:block">
          <button className="bg-gradient-to-r from-[var(--coral-glow)] to-[var(--salmon)] text-white px-6 py-2.5 rounded-full font-semibold hover:shadow-lg hover:scale-105 transition-all">
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
            <a href="#destinations" onClick={() => setIsOpen(false)} className="font-semibold text-lg hover:text-[var(--coral-glow)]">Destinations</a>
            <a href="#how-it-works" onClick={() => setIsOpen(false)} className="font-semibold text-lg hover:text-[var(--coral-glow)]">How it Works</a>
            <a href="#faq-section" onClick={() => setIsOpen(false)} className="font-semibold text-lg hover:text-[var(--coral-glow)]">FAQ</a>
            <button className="bg-[var(--coral-glow)] text-white px-6 py-3 rounded-full font-semibold mt-4">
              Start Planning
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

function Hero() {
  const [promptIndex, setPromptIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const [inputValue, setInputValue] = useState("");

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
        }, 300); // short pause before typing next
      }
    }

    return () => clearTimeout(timeout);
  }, [displayText, isTyping, promptIndex]);

  return (
    <section className="relative pt-32 pb-14 md:pt-48 md:pb-24 px-4 md:px-8 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
      {/* Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-[var(--soft-periwinkle)]/30 blur-[100px] -z-10" />
      <div className="absolute top-[20%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-[var(--salmon)]/20 blur-[120px] -z-10" />

      {/* Left Column */}
      <div className="flex-1 flex flex-col gap-6 z-10 w-full">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-6xl font-heading font-bold leading-tight"
        >
          Plan your trips like you <span className="text-[var(--coral-glow)]">dream</span>, we&apos;ll handle the rest
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-lg md:text-xl text-[var(--vintage-grape)]/80 max-w-xl"
        >
          Smartest AI trip planner and bespoke travel agents, a message away.
        </motion.p>

        {/* Chat Input Area */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative bg-white p-4 rounded-[2rem] shadow-[0_20px_50px_rgb(0,0,0,0.1)] flex flex-col border border-gray-100 mt-2 max-w-2xl w-full"
        >
          <div className="relative flex flex-col items-start min-h-[120px]">
            <textarea 
              className="w-full h-full min-h-[100px] bg-transparent resize-none outline-none text-lg text-[var(--vintage-grape)] p-2 z-10 placeholder-transparent"
              placeholder="Type your dream trip here..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            {inputValue.length === 0 && (
              <div className="absolute top-2 left-2 text-gray-400 text-lg pointer-events-none">
                {displayText}<span className="animate-pulse">|</span>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-2 pt-4 border-t border-gray-100 gap-4">
            {/* Quick buttons */}
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => setInputValue("Surprise me with a weekend getaway")}
                className="text-sm font-semibold bg-[var(--salmon)]/15 text-[var(--salmon)] px-4 py-2 rounded-full hover:bg-[var(--salmon)]/25 transition-colors"
              >
                Surprise me 🎲
              </button>
              <button 
                onClick={() => setInputValue("Plan a relaxing beach holiday")}
                className="text-sm font-semibold bg-[var(--soft-periwinkle)]/15 text-[var(--soft-periwinkle)] px-4 py-2 rounded-full hover:bg-[var(--soft-periwinkle)]/25 transition-colors"
              >
                Beach holiday 🏖️
              </button>
            </div>

            <div className="flex items-center gap-1 self-end sm:self-auto shrink-0">
              <button className="p-2 text-gray-400 hover:text-[var(--coral-glow)] transition-colors rounded-full hover:bg-gray-50">
                <Paperclip size={20} />
              </button>
              <button className="p-2 text-gray-400 hover:text-[var(--coral-glow)] transition-colors rounded-full hover:bg-gray-50">
                <Mic size={20} />
              </button>
              <button className="bg-gradient-to-r from-[var(--coral-glow)] to-[var(--salmon)] text-white p-3 rounded-full hover:scale-105 transition-transform shadow-md ml-2">
                <Send size={18} />
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Right Column - Animated Flow */}
      <div className="flex-1 relative w-full h-[500px] flex items-center justify-center z-10" id="how-it-works">
        <AnimatedJourney />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white/70 backdrop-blur-md px-6 py-3 rounded-full shadow-lg border border-white/40 text-sm font-medium"
        >
          Give shape to the trip of your dreams, travel like an emperor.
        </motion.div>
      </div>
    </section>
  );
}

function AnimatedJourney() {
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

function Features() {
  return (
    <section className="py-14 flex flex-col justify-between gap-12 overflow-hidden relative">
      {/* Background Accents */}
      <div className="absolute top-[20%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-[var(--soft-periwinkle)]/20 blur-[100px] -z-10 pointer-events-none" />
      <div className="absolute bottom-[40%] left-[-10%] w-[30vw] h-[30vw] rounded-full bg-[var(--vintage-grape)]/10 blur-[100px] -z-10 pointer-events-none" />
      
      {/* Title */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 text-center mt-12 w-full z-10">
        <h2 className="text-3xl md:text-5xl font-heading font-bold text-[var(--vintage-grape)]">
          Crafted by AI, Tailored by our Expert agents
        </h2>
      </div>

      {/* Top Half: Feature Cards */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 items-center w-full">
        {FEATURES.map((feature, i) => (
          <motion.div 
            key={feature.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.15 }}
            className="relative group rounded-3xl overflow-hidden aspect-[4/3] md:aspect-square"
          >
            <img src={feature.image} alt="Feature" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            
            {/* Floaty Bubble */}
            <motion.div 
              animate={{ y: [0, -5, 0] }}
              transition={{ repeat: Infinity, duration: 4, delay: i }}
              className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-md p-3 rounded-2xl shadow-xl flex gap-3 items-center"
            >
              <div className="bg-[var(--coral-glow)]/10 p-2 rounded-full text-[var(--coral-glow)] shrink-0">
                {feature.bubbleIcon === "ai" && <Bot size={20} />}
                {feature.bubbleIcon === "concierge" && <UserCheck size={20} />}
                {feature.bubbleIcon === "star" && <Star size={20} />}
              </div>
              <p className="text-sm font-medium leading-tight">{feature.bubbleText}</p>
            </motion.div>
          </motion.div>
        ))}
      </div>

      {/* Bottom Half: Infinite Marquee */}
      <div className="relative w-full overflow-hidden bg-gradient-to-r from-[var(--vintage-grape)] to-[var(--soft-periwinkle)] py-8 flex flex-col gap-6 -rotate-1 scale-105 mt-auto">
        <div className="flex gap-6 animate-marquee w-max">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, idx) => (
            <div key={idx} className="relative w-64 h-40 rounded-3xl overflow-hidden shrink-0 group">
              <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
              <div className="absolute bottom-3 left-4 right-4 text-white">
                <h4 className="font-heading font-semibold text-lg">{item.title}</h4>
                <p className="text-xs text-white/80 line-clamp-1">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Destinations() {
  const [activeTab, setActiveTab] = useState<keyof typeof DESTINATIONS>("North America");
  const tabs: (keyof typeof DESTINATIONS)[] = ["North America", "Europe", "Asia", "Africa"];

  return (
    <section id="destinations" className="py-16 relative w-full overflow-hidden">
      {/* Background Accents */}
      <div className="absolute top-[10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-[var(--soft-periwinkle)]/20 blur-[120px] -z-10 pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[35vw] h-[35vw] rounded-full bg-[var(--salmon)]/10 blur-[100px] -z-10 pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-heading font-bold mb-6">Where users are travelling to</h2>
          
          {/* Pill Tabs */}
          <div className="inline-flex bg-white p-2 rounded-full shadow-md overflow-x-auto max-w-full">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-6 py-2.5 rounded-full font-medium transition-all whitespace-nowrap",
                  activeTab === tab 
                    ? "bg-[var(--coral-glow)] text-white shadow-md" 
                    : "text-gray-500 hover:text-[var(--vintage-grape)] hover:bg-gray-50"
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <motion.div 
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {DESTINATIONS[activeTab].map((dest) => (
            <DestinationCard key={dest.id} dest={dest} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function DestinationCard({ dest }: { dest: { id: number, name: string, image: string, desc: string, q1: string, q2: string, q3: string, q4: string } }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div 
      className="relative rounded-3xl overflow-hidden aspect-[4/5] cursor-pointer group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ y: -5 }}
    >
      <img 
        src={dest.image} 
        alt={dest.name} 
        className={cn(
          "w-full h-full object-cover transition-all duration-500",
          isHovered ? "scale-110 blur-sm brightness-50" : "scale-100 blur-0 brightness-100"
        )}
      />
      
      {/* Default State */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity duration-300",
        isHovered ? "opacity-0" : "opacity-100"
      )}>
        <div className="absolute bottom-4 left-4 right-4 text-white">
          <div className="flex items-center gap-2 mb-1 opacity-80">
            <MapPin size={14} />
            <span className="text-xs font-medium">{dest.name.split(',')[1]}</span>
          </div>
          <h3 className="text-xl font-heading font-semibold">{dest.name.split(',')[0]}</h3>
          <p className="text-xs text-white/80 mt-1 line-clamp-1">{dest.desc}</p>
        </div>
      </div>

      {/* Hover State - Weather Data */}
      <AnimatePresence>
        {isHovered && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute inset-0 p-4 flex flex-col justify-center text-white bg-black/40 backdrop-blur-md"
          >
            <h3 className="text-lg font-heading font-semibold mb-3 text-center">{dest.name}</h3>
            <div className="space-y-2">
              {[
                { q: "Jan-Mar", data: dest.q1 },
                { q: "Apr-Jun", data: dest.q2 },
                { q: "Jul-Sep", data: dest.q3 },
                { q: "Oct-Dec", data: dest.q4 },
              ].map((quarter, i) => (
                <div key={i} className="bg-white/20 rounded-xl p-2 px-3 flex items-center justify-between backdrop-blur-lg border border-white/10">
                  <span className="text-xs font-medium text-white/90">{quarter.q}</span>
                  <div className="flex items-center gap-2 text-xs font-semibold">
                    <span className="flex items-center gap-1"><Sun size={12} className="text-yellow-300"/> {quarter.data.split(' / ')[0]}</span>
                    <span className="text-white/40">|</span>
                    <span className="flex items-center gap-1"><CloudRain size={12} className="text-blue-300"/> {quarter.data.split(' / ')[1]}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function FaqSection() {
  return (
    <section id="faq-section" className="py-16 relative flex flex-col justify-center bg-transparent overflow-hidden w-full">
      {/* Background Accents */}
      <div className="absolute top-[30%] right-[10%] w-[40vw] h-[40vw] rounded-full bg-[var(--soft-periwinkle)]/25 blur-[120px] -z-10 pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[10%] w-[50vw] h-[50vw] rounded-full bg-[var(--vintage-grape)]/10 blur-[120px] -z-10 pointer-events-none" />

      <div className="max-w-3xl mx-auto px-4 md:px-8 w-full z-10 relative">
        <h2 className="text-2xl md:text-3xl font-heading font-bold mb-6 text-center">Frequently Asked Questions</h2>
        <div className="space-y-2">
          {FAQS.map((faq, i) => (
            <FaqItem key={i} question={faq.q} answer={faq.a} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FaqItem({ question, answer }: { question: string, answer: string }) {
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

function Footer() {
  return (
    <footer className="bg-gradient-to-br from-[#2D2A3D] to-[var(--vintage-grape)] text-white pt-24 pb-12 rounded-t-[3rem] mt-16 flex flex-col justify-between">
      <div className="max-w-7xl mx-auto px-4 md:px-8 w-full flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8 mb-16">
          <div className="lg:col-span-2">
            <h3 className="text-3xl font-heading font-bold text-[var(--coral-glow)] mb-6">syadiloh</h3>
            <p className="text-white/70 max-w-sm mb-8 leading-relaxed">
              The smartest AI trip planner paired with elite human concierges. Give shape to the trip of your dreams.
            </p>
            <div className="flex gap-4">
              <a href="#" className="bg-white/10 p-3 rounded-full hover:bg-[var(--coral-glow)] transition-colors"><span className="text-sm font-semibold">IG</span></a>
              <a href="#" className="bg-white/10 p-3 rounded-full hover:bg-[var(--coral-glow)] transition-colors"><span className="text-sm font-semibold">TW</span></a>
              <a href="#" className="bg-white/10 p-3 rounded-full hover:bg-[var(--coral-glow)] transition-colors"><span className="text-sm font-semibold">IN</span></a>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold text-lg mb-6">Company</h4>
            <ul className="space-y-4 text-white/70">
              <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Plan your Trip</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-lg mb-6">Legal</h4>
            <ul className="space-y-4 text-white/70">
              <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Cookie Policy</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-lg mb-6">Top Destinations</h4>
            <ul className="space-y-4 text-white/70">
              <li><a href="#" className="hover:text-white transition-colors">Paris, France</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Kyoto, Japan</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Bali, Indonesia</a></li>
              <li><a href="#" className="hover:text-white transition-colors">New York, USA</a></li>
            </ul>
          </div>
        </div>
      </div>
        
      <div className="max-w-7xl mx-auto px-4 md:px-8 w-full pt-8 border-t border-white/10 text-center text-white/50 text-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <p>&copy; {new Date().getFullYear()} syadiloh. All rights reserved.</p>
        <p className="flex items-center gap-2">Made with <PlaneTakeoff size={16} /> for modern travelers.</p>
      </div>
    </footer>
  );
}

