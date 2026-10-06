import { createHash } from "node:crypto";
import { nanoid } from "nanoid";
import { enquirySchema } from "@/lib/travel/enquiry";
import { travelSql } from "@/lib/travel/database";
import { getPage } from "@/lib/travel/repository";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return Response.json({ error: "Invalid request origin" }, { status: 403 });
  if (!request.headers.get("content-type")?.startsWith("application/json")) return Response.json({ error: "JSON required" }, { status: 415 });
  const reader = request.body?.getReader();
  if (!reader) return Response.json({ error: "Request details required" }, { status: 400 });
  const chunks: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.length;
    if (length > 12000) { await reader.cancel(); return Response.json({ error: "Request too large" }, { status: 413 }); }
    chunks.push(value);
  }
  let input;
  try { input = enquirySchema.safeParse(JSON.parse(Buffer.concat(chunks).toString("utf8"))); }
  catch { return Response.json({ error: "Invalid request details" }, { status: 400 }); }
  if (!input.success || input.data.website) return Response.json({ error: "Please check your trip details" }, { status: 400 });
  const data = input.data;
  try {
    const page = data.sourcePath === "/holidays" ? null : await getPage(data.sourcePath);
    if (data.sourcePath !== "/holidays" && !page) return Response.json({ error: "Unknown destination guide" }, { status: 400 });
    const destination = page?.content.destination.name ?? data.destination;
    const referenceId = `TRIP-${nanoid(10).toUpperCase()}`;
    const key = createHash("sha256").update(data.email).digest("hex");
    const saved = await travelSql().begin(async tx => {
      const [rate] = await tx`INSERT INTO travel.enquiry_limits(key,window_start,count) VALUES(${key},now(),1) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN travel.enquiry_limits.window_start<now()-interval '10 minutes' THEN 1 ELSE travel.enquiry_limits.count+1 END,window_start=CASE WHEN travel.enquiry_limits.window_start<now()-interval '10 minutes' THEN now() ELSE travel.enquiry_limits.window_start END RETURNING count`;
      if (rate.count > 5) return false;
      await tx`INSERT INTO public.enquiries(reference_id,destination,state,email,trip_details) VALUES(${referenceId},${destination},'CONFIRMED',${data.email},${tx.json({ source: "travel-guide", sourcePath: data.sourcePath, departure: data.departure, dates: data.dates, travellerType: data.travellerType, durationDays: data.duration, budget: { amount: data.budget, currency: "GBP" }, notes: data.notes })})`;
      return true;
    });
    if (!saved) return Response.json({ error: "Too many requests. Please try again in ten minutes." }, { status: 429 });
    return Response.json({ referenceId }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Your request could not be saved. Please try again later." }, { status: 503 });
  }
}
