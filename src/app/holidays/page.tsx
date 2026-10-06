import type { Metadata } from "next";
import { SITE_URL } from "@/lib/travel/repository";
import HolidayDirectory from "@/components/travel/HolidayDirectory";

export const metadata: Metadata = { title: "Holiday inspiration & tailored itineraries | Syadiloh", description: "Find your next holiday with destination comparisons, monthly climate tables and thoughtful itineraries for UK travellers. Request a trip shaped around you.", alternates: { canonical: `${SITE_URL}/holidays` } };
export default function Holidays() { return <HolidayDirectory />; }
