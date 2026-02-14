import { db } from "./db";
import { decks, assumptions, type Deck, type InsertDeck, type Assumption, type InsertAssumption } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  createDeck(deck: InsertDeck): Promise<Deck>;
  getDeck(id: number): Promise<Deck | undefined>;
  getAllDecks(): Promise<Deck[]>;
  updateDeckStatus(id: number, status: string, slideCount?: number): Promise<Deck | undefined>;
  deleteDeck(id: number): Promise<void>;
  createAssumptions(items: InsertAssumption[]): Promise<Assumption[]>;
  getAssumptionsByDeck(deckId: number): Promise<Assumption[]>;
}

export class DatabaseStorage implements IStorage {
  async createDeck(deck: InsertDeck): Promise<Deck> {
    const [result] = await db.insert(decks).values(deck).returning();
    return result;
  }

  async getDeck(id: number): Promise<Deck | undefined> {
    const [result] = await db.select().from(decks).where(eq(decks.id, id));
    return result;
  }

  async getAllDecks(): Promise<Deck[]> {
    return db.select().from(decks).orderBy(desc(decks.createdAt));
  }

  async updateDeckStatus(id: number, status: string, slideCount?: number): Promise<Deck | undefined> {
    const values: Partial<Deck> = { status };
    if (slideCount !== undefined) {
      values.slideCount = slideCount;
    }
    const [result] = await db.update(decks).set(values).where(eq(decks.id, id)).returning();
    return result;
  }

  async deleteDeck(id: number): Promise<void> {
    await db.delete(assumptions).where(eq(assumptions.deckId, id));
    await db.delete(decks).where(eq(decks.id, id));
  }

  async createAssumptions(items: InsertAssumption[]): Promise<Assumption[]> {
    if (items.length === 0) return [];
    return db.insert(assumptions).values(items).returning();
  }

  async getAssumptionsByDeck(deckId: number): Promise<Assumption[]> {
    return db.select().from(assumptions).where(eq(assumptions.deckId, deckId));
  }
}

export const storage = new DatabaseStorage();
