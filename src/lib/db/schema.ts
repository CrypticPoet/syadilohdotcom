import {
  pgTable,
  uuid,
  text,
  jsonb,
  timestamp,
} from "drizzle-orm/pg-core";

export const enquiries = pgTable("enquiries", {
  id: uuid("id").primaryKey().defaultRandom(),
  referenceId: text("reference_id").unique().notNull(),
  destination: text("destination").notNull(),
  state: text("state").default("PENDING_CONFIRMATION").notNull(),
  email: text("email").default("pending@syadiloh.com").notNull(),
  phone: text("phone"),
  tripDetails: jsonb("trip_details").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
