"use client";

import { useId, useState } from "react";
import { ArrowUpRight, CheckCircle2, LoaderCircle } from "lucide-react";

export default function EnquiryForm({ sourcePath, destination, travellerType, duration }: { sourcePath: string; destination: string; travellerType?: string; duration?: number }) {
  const id = useId();
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");
  const [reference, setReference] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setState("sending"); setError("");
    try {
      const response = await fetch("/api/enquiries", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sourcePath, destination: data.get("destination") || destination, travellerType: data.get("travellerType"), duration: data.get("duration"), departure: data.get("departure"), dates: data.get("dates"), budget: data.get("budget"), email: data.get("email"), notes: data.get("notes"), website: data.get("website") }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Your request could not be saved. Please try again.");
      setReference(result.referenceId); setState("sent"); form.reset();
    } catch (e) { setError(e instanceof Error ? e.message : "Please try again."); setState("idle"); }
  }
  const input = "mt-2 w-full rounded-2xl border border-grape/15 bg-white px-4 py-3 text-sm text-grape outline-none transition focus:border-periwinkle focus:ring-2 focus:ring-periwinkle/20";
  return <section id="request-itinerary" className="scroll-mt-8 rounded-[2rem] bg-grape p-6 text-white md:p-10">
    <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14">
      <div><span className="text-xs font-bold uppercase tracking-[0.2em] text-periwinkle">A little inspiration. A trip that’s yours.</span><h2 className="mt-4 font-heading text-3xl leading-tight md:text-4xl">Let’s make<br />{destination} happen.</h2><p className="mt-5 max-w-sm leading-relaxed text-white/75">Tell us what you have in mind. Our travel agents can shape these ideas around your dates, interests and budget.</p><p className="mt-6 text-sm leading-relaxed text-white/65">An itinerary request, with no payment required. Suggested trips are customisable; prices and availability are confirmed in your quote.</p></div>
      {state === "sent" ? <div role="status" className="flex min-h-72 flex-col justify-center rounded-3xl bg-white/10 p-8"><CheckCircle2 className="text-periwinkle" size={40} /><h3 className="mt-5 font-heading text-2xl">Your next chapter starts here.</h3><p className="mt-3 leading-relaxed text-white/80">Your request has been saved. Our agents have your trip details and email address.</p><p className="mt-4 text-sm">Reference: <strong>{reference}</strong></p><button onClick={() => setState("idle")} className="mt-6 self-start underline underline-offset-4">Send another request</button></div> : <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        {sourcePath === "/holidays" ? <label htmlFor={`${id}-destination`} className="text-sm font-semibold sm:col-span-2">Where would you like to go?<input id={`${id}-destination`} name="destination" required minLength={2} maxLength={100} placeholder="A city, country or a few ideas…" className={input} /></label> : null}
        <label htmlFor={`${id}-departure`} className="text-sm font-semibold">Departure city<input id={`${id}-departure`} name="departure" required maxLength={100} placeholder="e.g. London or Manchester" autoComplete="address-level2" className={input} /></label>
        <label htmlFor={`${id}-dates`} className="text-sm font-semibold">When would you like to go?<input id={`${id}-dates`} name="dates" required maxLength={100} placeholder="e.g. May, dates flexible" className={input} /></label>
        <label htmlFor={`${id}-travellers`} className="text-sm font-semibold">Who’s coming?<select id={`${id}-travellers`} name="travellerType" defaultValue={travellerType || ""} required className={input}><option value="" disabled>Choose your travel group</option><option value="couples">Couple</option><option value="family">Family</option><option value="solo">Solo traveller</option><option value="friends">Friends</option></select></label>
        <label htmlFor={`${id}-duration`} className="text-sm font-semibold">How many days?<input id={`${id}-duration`} name="duration" type="number" min={1} max={90} required defaultValue={duration} placeholder="e.g. 4" className={input} /></label>
        <label htmlFor={`${id}-budget`} className="text-sm font-semibold">Total trip budget (GBP)<input id={`${id}-budget`} name="budget" type="number" min={1} max={1000000} required placeholder="Your approximate budget" className={input} /></label>
        <label htmlFor={`${id}-email`} className="text-sm font-semibold">Your email<input id={`${id}-email`} name="email" type="email" required maxLength={254} autoComplete="email" placeholder="you@example.com" className={input} /></label>
        <label htmlFor={`${id}-notes`} className="text-sm font-semibold sm:col-span-2">What would make it special? <span className="font-normal text-white/60">Optional</span><textarea id={`${id}-notes`} name="notes" maxLength={2000} rows={3} placeholder="Traveller numbers, children’s ages, must-sees or a slower pace…" className={input} /></label>
        <div aria-hidden="true" className="hidden"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
        {error ? <p role="alert" className="rounded-xl bg-white/10 p-3 text-sm text-white sm:col-span-2">{error}</p> : null}
        <div className="sm:col-span-2"><button disabled={state === "sending"} type="submit" className="inline-flex w-full items-center justify-center gap-3 rounded-full bg-coral px-6 py-4 font-bold text-white transition hover:bg-salmon disabled:cursor-wait disabled:opacity-70 sm:w-auto">{state === "sending" ? <LoaderCircle className="animate-spin" size={18} /> : <ArrowUpRight size={19} />} {state === "sending" ? "Saving your request…" : "Request my itinerary"}</button><p className="mt-3 text-xs leading-relaxed text-white/60">By submitting, you’re asking Syadiloh to contact you about this trip.</p></div>
      </form>}
    </div>
  </section>;
}
