"use client";
import { FAQS } from "@/lib/data";
import FaqItem from "./FaqItem";

export default function FaqSection() {
  return (
    <section id="faq-section" className="py-16 relative flex flex-col justify-center bg-transparent w-full">
      {/* Background Accents */}
      <div className="absolute top-[20%] right-[10%] w-[60vw] h-[60vw] rounded-full bg-[var(--soft-periwinkle)]/30 blur-[80px] -z-10 pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-[var(--salmon)]/20 blur-[80px] -z-10 pointer-events-none" />

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
