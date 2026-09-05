"use client";
import { MapPin, PlaneTakeoff } from "lucide-react";

export default function Footer() {
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
