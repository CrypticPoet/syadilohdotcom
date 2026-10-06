import { revalidatePath, revalidateTag } from "next/cache";
import { travelSql } from "./database";

export async function flushInvalidations() {
  const sql = travelSql();
  const rows = await sql`SELECT id,path FROM travel.invalidations ORDER BY id LIMIT 100`;
  if (!rows.length) return 0;
  for (const path of new Set(rows.map(r => r.path as string))) {
    revalidateTag(`travel:page:${path}`, { expire: 0 });
    revalidatePath(path);
  }
  revalidateTag("travel:index", { expire: 0 });
  revalidatePath("/");
  revalidatePath("/holidays");
  revalidatePath("/sitemap.xml");
  revalidatePath("/travel-sitemap", "layout");
  revalidatePath("/robots.txt");
  await sql`DELETE FROM travel.invalidations WHERE id IN ${sql(rows.map(r => r.id))}`;
  return rows.length;
}
