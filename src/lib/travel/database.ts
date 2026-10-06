import postgres from "postgres";

let client: ReturnType<typeof postgres> | undefined;
export function travelSql() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required for the travel pipeline");
  client ??= postgres(process.env.DATABASE_URL, { prepare: false, max: 5, connect_timeout: 10, idle_timeout: 20 });
  return client;
}
export async function closeTravelDatabase() { if (client) { await client.end({ timeout: 5 }); client = undefined; } }
