import OpenAI from "openai";
import { storage } from "./storage";
import type { InsertAssumption } from "@shared/schema";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

interface ExtractedAssumption {
  text: string;
  category: "Market" | "Customer" | "Product" | "Competition" | "Financial" | "Execution";
  riskLevel: "High" | "Medium" | "Low";
  sourceSlide: string;
  stressQuestion: string;
  reasoning: string;
}

export async function analyzeDeck(deckId: number, pdfText: string): Promise<void> {
  try {
    await storage.updateDeckStatus(deckId, "analyzing");

    const slideChunks = pdfText.split(/(?=slide\s*\d|page\s*\d)/i);
    const estimatedSlides = Math.max(slideChunks.length, Math.ceil(pdfText.length / 500));

    const systemPrompt = `You are an expert investor and pitch deck analyst. Your task is to analyze a pitch deck's text and extract all explicit and implicit strategic assumptions.

For each assumption, you must:
1. Identify the assumption (both stated and implied claims)
2. Categorize it into one of: Market, Customer, Product, Competition, Financial, Execution
3. Assign a risk level: High (fragile, unvalidated, or overly optimistic), Medium (partially supported), Low (well-supported or standard)
4. Note which slide or section it came from (if detectable, otherwise "General")
5. Create a pointed stress-test question an investor would ask
6. Provide brief reasoning for the risk rating

Focus on:
- Market sizing claims and TAM/SAM/SOM
- Customer adoption and growth assumptions
- Product differentiation and defensibility
- Competitive advantages and moat claims
- Revenue projections and financial models
- Team execution and timeline assumptions
- Go-to-market strategy assumptions

Be thorough. Aim for 10-25 assumptions per deck. Be calibrated and neutral in tone - not harsh, but honest.

IMPORTANT: Only extract assumptions that are actually present or clearly implied in the deck text. Do not hallucinate claims that aren't there.

Return your response as a JSON array of objects with these exact fields:
{
  "assumptions": [
    {
      "text": "The assumption statement",
      "category": "Market|Customer|Product|Competition|Financial|Execution",
      "riskLevel": "High|Medium|Low",
      "sourceSlide": "Slide number or General",
      "stressQuestion": "The investor stress-test question",
      "reasoning": "Why this risk level was assigned"
    }
  ]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-5-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Here is the pitch deck text to analyze:\n\n${pdfText}` },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 8192,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from AI");
    }

    const parsed = JSON.parse(content);
    const extractedAssumptions: ExtractedAssumption[] = parsed.assumptions || [];

    if (extractedAssumptions.length === 0) {
      throw new Error("No assumptions could be extracted from this deck");
    }

    const validCategories = ["Market", "Customer", "Product", "Competition", "Financial", "Execution"];
    const validRiskLevels = ["High", "Medium", "Low"];

    const insertData: InsertAssumption[] = extractedAssumptions.map((a) => ({
      deckId,
      text: a.text,
      category: validCategories.includes(a.category) ? a.category : "Market",
      riskLevel: validRiskLevels.includes(a.riskLevel) ? a.riskLevel : "Medium",
      sourceSlide: a.sourceSlide || "General",
      stressQuestion: a.stressQuestion,
      reasoning: a.reasoning,
    }));

    await storage.createAssumptions(insertData);
    await storage.updateDeckStatus(deckId, "complete", estimatedSlides);
  } catch (error) {
    console.error("Analysis failed for deck", deckId, error);
    await storage.updateDeckStatus(deckId, "failed");
  }
}
