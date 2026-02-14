import { sql } from "drizzle-orm";
import { pgTable, text, varchar, serial, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const decks = pgTable("decks", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  fileName: text("file_name").notNull(),
  status: text("status").notNull().default("pending"),
  slideCount: integer("slide_count"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const assumptions = pgTable("assumptions", {
  id: serial("id").primaryKey(),
  deckId: integer("deck_id").notNull().references(() => decks.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  category: text("category").notNull(),
  riskLevel: text("risk_level").notNull(),
  sourceSlide: text("source_slide"),
  stressQuestion: text("stress_question").notNull(),
  reasoning: text("reasoning").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertDeckSchema = createInsertSchema(decks).omit({
  id: true,
  createdAt: true,
});

export const insertAssumptionSchema = createInsertSchema(assumptions).omit({
  id: true,
  createdAt: true,
});

export type Deck = typeof decks.$inferSelect;
export type InsertDeck = z.infer<typeof insertDeckSchema>;
export type Assumption = typeof assumptions.$inferSelect;
export type InsertAssumption = z.infer<typeof insertAssumptionSchema>;
