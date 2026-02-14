import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { PDFParse } from "pdf-parse";
import { storage } from "./storage";
import { analyzeDeck } from "./analyze";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  },
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.post("/api/decks/upload", upload.single("deck"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No PDF file provided" });
      }

      const parser = new PDFParse({ data: req.file.buffer });
      const textResult = await parser.getText();
      let pdfText = textResult.text;

      pdfText = pdfText.replace(/--\s*\d+\s*of\s*\d+\s*--/g, "").replace(/\n{3,}/g, "\n\n").trim();

      console.log(`PDF text extracted: ${pdfText.length} chars, ${textResult.pages?.length || 0} pages, file: ${req.file.originalname}`);

      if (!pdfText || pdfText.length < 50) {
        return res.status(400).json({ error: "Could not extract enough text from this PDF. Make sure it contains readable text, not just images." });
      }

      const deckName = req.file.originalname.replace(/\.pdf$/i, "").replace(/[-_]/g, " ");

      const deck = await storage.createDeck({
        name: deckName,
        fileName: req.file.originalname,
        status: "analyzing",
      });

      res.json(deck);

      analyzeDeck(deck.id, pdfText).catch((err) => {
        console.error("Background analysis failed:", err);
      });
    } catch (error: any) {
      console.error("Upload error:", error);
      const message = error?.name === "InvalidPDFException"
        ? "This file doesn't appear to be a valid PDF. Please try a different file."
        : error.message || "Failed to process upload";
      res.status(500).json({ error: message });
    }
  });

  app.get("/api/decks", async (_req, res) => {
    try {
      const allDecks = await storage.getAllDecks();
      res.json(allDecks);
    } catch (error) {
      console.error("Error fetching decks:", error);
      res.status(500).json({ error: "Failed to fetch decks" });
    }
  });

  app.get("/api/decks/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deck = await storage.getDeck(id);
      if (!deck) {
        return res.status(404).json({ error: "Deck not found" });
      }
      res.json(deck);
    } catch (error) {
      console.error("Error fetching deck:", error);
      res.status(500).json({ error: "Failed to fetch deck" });
    }
  });

  app.get("/api/decks/:id/assumptions", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const result = await storage.getAssumptionsByDeck(id);
      res.json(result);
    } catch (error) {
      console.error("Error fetching assumptions:", error);
      res.status(500).json({ error: "Failed to fetch assumptions" });
    }
  });

  app.delete("/api/decks/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteDeck(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting deck:", error);
      res.status(500).json({ error: "Failed to delete deck" });
    }
  });

  return httpServer;
}
