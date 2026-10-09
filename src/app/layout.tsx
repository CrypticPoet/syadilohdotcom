import type { Metadata } from "next";
import { Quicksand, Fredoka } from "next/font/google";
import "./globals.css";

const quicksand = Quicksand({
  variable: "--font-sans",
  subsets: ["latin"],
});

const fredoka = Fredoka({
  variable: "--font-heading",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "syadiloh | Smart trip planner & travel concierge",
  description: "Describe your dream trip in your own words. Our smart trip planner and bespoke travel agents help shape a personalised itinerary around you.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${quicksand.variable} ${fredoka.variable} antialiased`}
    >
      <body className="font-sans bg-[var(--ivory)] text-[var(--vintage-grape)] min-h-screen">
        {children}
      </body>
    </html>
  );
}
