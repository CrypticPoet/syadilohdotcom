"use client";
import { motion } from "framer-motion";
import {
  MapPin,
  Calendar,
  Wallet,
  Users,
  Sparkles,
  PlaneTakeoff,
  Clock,
  Mail,
  Phone,
} from "lucide-react";

interface ItineraryCardProps {
  referenceId: string;
  destination: string;
  departureCity?: string;
  travelers?: string;
  partySize?: number;
  budget: string;
  vibe: string;
  timeOfTrip?: string;
  duration: string;
  email?: string;
  phone?: string;
}

export default function ItineraryCard({
  referenceId,
  destination,
  departureCity,
  travelers,
  partySize,
  budget,
  vibe,
  timeOfTrip,
  duration,
  email,
  phone,
}: ItineraryCardProps) {
  const travelersDisplay =
    travelers ||
    (partySize ? `${partySize} ${partySize === 1 ? "Traveler" : "Travelers"}` : "2 Adults");

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="w-full"
    >
      <div className="w-full bg-white rounded-2xl sm:rounded-3xl border-2 border-[var(--vintage-grape)]/15 p-4 sm:p-5 flex flex-col gap-3 sm:gap-3.5">
        {/* Header — Badge & Reference ID */}
        <div className="flex items-center justify-between gap-2 border-b border-[var(--vintage-grape)]/10 pb-2.5">
          <div className="flex items-center gap-1.5">
            <Sparkles size={15} className="text-[var(--coral-glow)] shrink-0" />
            <span className="text-[11px] sm:text-sm font-bold text-[var(--vintage-grape)] uppercase tracking-wider">
              Confirmed Itinerary
            </span>
          </div>
          <div className="bg-[var(--vintage-grape)] px-3 py-1 rounded-full shrink-0">
            <span className="text-[11px] sm:text-sm font-bold text-[var(--ivory)] font-heading tracking-wide">
              Reference: {referenceId}
            </span>
          </div>
        </div>

        {/* Destination Heading & Vibe Subheading */}
        <div className="text-center py-0.5">
          <h3 className="text-lg sm:text-xl md:text-2xl font-heading font-bold text-[var(--vintage-grape)] leading-snug">
            {departureCity ? `${departureCity} → ${destination}` : destination}
          </h3>
          {vibe && (
            <p className="text-xs sm:text-sm text-[var(--coral-glow)] font-semibold mt-0.5 italic">
              &ldquo;{vibe}&rdquo;
            </p>
          )}
        </div>

        {/* 6-Item Details Grid — Compact 2 cols on mobile, 3 cols on tablet/desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5">
          {/* 1. Departure */}
          <div className="bg-[var(--ivory)] rounded-xl p-2.5 sm:p-3 border border-[var(--vintage-grape)]/10 flex items-center gap-2.5 min-w-0">
            <div className="bg-white p-1.5 sm:p-2 rounded-lg border border-[var(--vintage-grape)]/10 shrink-0">
              <PlaneTakeoff size={15} className="text-[var(--coral-glow)]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[9px] sm:text-[10px] font-bold text-[var(--vintage-grape)]/60 uppercase tracking-wider truncate">
                Departure
              </p>
              <p className="text-xs sm:text-sm font-bold text-[var(--vintage-grape)] leading-tight mt-0.5 truncate">
                {departureCity || "TBD"}
              </p>
            </div>
          </div>

          {/* 2. Destination */}
          <div className="bg-[var(--ivory)] rounded-xl p-2.5 sm:p-3 border border-[var(--vintage-grape)]/10 flex items-center gap-2.5 min-w-0">
            <div className="bg-white p-1.5 sm:p-2 rounded-lg border border-[var(--vintage-grape)]/10 shrink-0">
              <MapPin size={15} className="text-[var(--coral-glow)]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[9px] sm:text-[10px] font-bold text-[var(--vintage-grape)]/60 uppercase tracking-wider truncate">
                Destination
              </p>
              <p className="text-xs sm:text-sm font-bold text-[var(--vintage-grape)] leading-tight mt-0.5 truncate">
                {destination}
              </p>
            </div>
          </div>

          {/* 3. Travelers */}
          <div className="bg-[var(--ivory)] rounded-xl p-2.5 sm:p-3 border border-[var(--vintage-grape)]/10 flex items-center gap-2.5 min-w-0">
            <div className="bg-white p-1.5 sm:p-2 rounded-lg border border-[var(--vintage-grape)]/10 shrink-0">
              <Users size={15} className="text-[var(--coral-glow)]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[9px] sm:text-[10px] font-bold text-[var(--vintage-grape)]/60 uppercase tracking-wider truncate">
                Travelers
              </p>
              <p className="text-xs sm:text-sm font-bold text-[var(--vintage-grape)] leading-tight mt-0.5 truncate">
                {travelersDisplay}
              </p>
            </div>
          </div>

          {/* 4. Budget */}
          <div className="bg-[var(--ivory)] rounded-xl p-2.5 sm:p-3 border border-[var(--vintage-grape)]/10 flex items-center gap-2.5 min-w-0">
            <div className="bg-white p-1.5 sm:p-2 rounded-lg border border-[var(--vintage-grape)]/10 shrink-0">
              <Wallet size={15} className="text-[var(--coral-glow)]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[9px] sm:text-[10px] font-bold text-[var(--vintage-grape)]/60 uppercase tracking-wider truncate">
                Budget
              </p>
              <p className="text-xs sm:text-sm font-bold text-[var(--vintage-grape)] leading-tight mt-0.5 truncate">
                {budget}
              </p>
            </div>
          </div>

          {/* 5. Dates / Timing */}
          <div className="bg-[var(--ivory)] rounded-xl p-2.5 sm:p-3 border border-[var(--vintage-grape)]/10 flex items-center gap-2.5 min-w-0">
            <div className="bg-white p-1.5 sm:p-2 rounded-lg border border-[var(--vintage-grape)]/10 shrink-0">
              <Calendar size={15} className="text-[var(--coral-glow)]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[9px] sm:text-[10px] font-bold text-[var(--vintage-grape)]/60 uppercase tracking-wider truncate">
                Dates / Timing
              </p>
              <p className="text-xs sm:text-sm font-bold text-[var(--vintage-grape)] leading-tight mt-0.5 truncate">
                {timeOfTrip || "Flexible"}
              </p>
            </div>
          </div>

          {/* 6. Duration */}
          <div className="bg-[var(--ivory)] rounded-xl p-2.5 sm:p-3 border border-[var(--vintage-grape)]/10 flex items-center gap-2.5 min-w-0">
            <div className="bg-white p-1.5 sm:p-2 rounded-lg border border-[var(--vintage-grape)]/10 shrink-0">
              <Clock size={15} className="text-[var(--coral-glow)]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[9px] sm:text-[10px] font-bold text-[var(--vintage-grape)]/60 uppercase tracking-wider truncate">
                Duration
              </p>
              <p className="text-xs sm:text-sm font-bold text-[var(--vintage-grape)] leading-tight mt-0.5 truncate">
                {duration}
              </p>
            </div>
          </div>
        </div>

        {/* Contact Information — Compact Pill Badges (Not large detail boxes) */}
        <div className="flex flex-wrap gap-2 pt-3 border-t border-[var(--vintage-grape)]/10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--ivory)] border border-[var(--vintage-grape)]/10 text-[11px] sm:text-xs font-semibold text-[var(--vintage-grape)]">
            <Mail size={12} className="text-[var(--coral-glow)] shrink-0" />
            <span>{email || "Email confirmed"}</span>
          </div>
          {phone && phone !== "Not provided" && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--ivory)] border border-[var(--vintage-grape)]/10 text-[11px] sm:text-xs font-semibold text-[var(--vintage-grape)]">
              <Phone size={12} className="text-[var(--coral-glow)] shrink-0" />
              <span>{phone}</span>
            </div>
          )}
        </div>

        {/* Footer Message */}
        <div className="bg-[var(--ivory)] rounded-xl p-2.5 sm:p-3 border border-[var(--vintage-grape)]/10">
          <p className="text-[11px] sm:text-xs text-[var(--vintage-grape)] font-medium text-center leading-normal">
            Our concierge will send an email with your full itinerary summary to <span className="font-bold text-[var(--vintage-grape)]">{email || "your email"}</span>
            {phone && phone !== "Not provided" ? (
              <span> and will attempt to reach you at <span className="font-bold text-[var(--vintage-grape)]">{phone}</span></span>
            ) : null}{" "}
            to begin finalizing your reservations.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
