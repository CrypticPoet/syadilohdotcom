import Navbar from "@/components/common/Navbar";
import Hero from "@/components/hero/Hero";
import Features from "@/components/features/Features";
import Destinations from "@/components/destinations/Destinations";
import FaqSection from "@/components/faq/FaqSection";
import Footer from "@/components/common/Footer";

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
