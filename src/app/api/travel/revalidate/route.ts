import { timingSafeEqual } from "node:crypto";
import { flushInvalidations } from "@/lib/travel/invalidation";

export async function POST(request: Request) {
  const expected = Buffer.from(`Bearer ${process.env.CRON_SECRET || ""}`);
  const actual = Buffer.from(request.headers.get("authorization") || "");
  if (!process.env.CRON_SECRET || expected.length !== actual.length || !timingSafeEqual(expected, actual)) return Response.json({ error: "Unauthorised" }, { status: 401 });
  return Response.json({ invalidated: await flushInvalidations() });
}
