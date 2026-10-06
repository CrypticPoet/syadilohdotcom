import { timingSafeEqual } from "node:crypto";
import { scheduleDue, runBatch } from "@/lib/travel/pipeline";
import { flushInvalidations } from "@/lib/travel/invalidation";

export const maxDuration = 180;
function authorised(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const actual = Buffer.from(request.headers.get("authorization") || "");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
export async function GET(request: Request) {
  if (!authorised(request)) return Response.json({ error: "Unauthorised" }, { status: 401 });
  try {
    const scheduled = await scheduleDue();
    const result = await runBatch(10, 100_000);
    const invalidated = await flushInvalidations();
    return Response.json({ scheduled, ...result, invalidated }, { headers: { "Cache-Control": "no-store" } });
  } catch { return Response.json({ error: "Pipeline unavailable; inspect server logs and job status" }, { status: 503 }); }
}
