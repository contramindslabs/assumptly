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

const systemPrompt = `You are an expert investor and pitch deck analyst. Analyze the following pitch deck text and extract ALL strategic assumptions - both explicit claims and implicit beliefs.

For EACH assumption found, provide:
- "text": A clear statement of the assumption
- "category": One of: Market, Customer, Product, Competition, Financial, Execution
- "riskLevel": One of: High (fragile/unvalidated), Medium (partially supported), Low (well-supported)
- "sourceSlide": Which slide/section (or "General" if unclear)
- "stressQuestion": A pointed question an investor would ask to challenge this assumption
- "reasoning": Brief explanation of why you assigned that risk level

Look for assumptions about:
- Market sizing (TAM/SAM/SOM), growth rates
- Customer behavior, adoption, willingness to pay
- Product differentiation, defensibility, moat
- Competitive landscape, barriers to entry
- Revenue projections, unit economics, path to profitability
- Team capability, hiring plans, execution timelines
- Go-to-market strategy, distribution channels

You MUST find at least 5 assumptions. Most pitch decks contain 10-25 assumptions. Even short decks with limited text have implicit assumptions worth analyzing.

Return ONLY valid JSON in this exact format:
{"assumptions": [{"text": "...", "category": "...", "riskLevel": "...", "sourceSlide": "...", "stressQuestion": "...", "reasoning": "..."}]}`;

async function callOpenAI(pdfText: string, deckId: number): Promise<ExtractedAssumption[]> {
  let response;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      response = await openai.chat.completions.create({
        model: "gpt-5-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Analyze this pitch deck text and extract all assumptions:\n\n${pdfText}` },
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 8192,
      });
      break;
    } catch (apiError: any) {
      console.error(`OpenAI API attempt ${attempt}/3 failed for deck ${deckId}:`, apiError?.message || apiError);
      if (attempt === 3) throw apiError;
      await new Promise((r) => setTimeout(r, 2000 * attempt));
    }
  }

  if (!response) {
    throw new Error("Failed to get AI response after retries");
  }

  const choice = response.choices[0];
  const content = choice?.message?.content;
  if (!content) {
    throw new Error(`No response from AI. Finish reason: ${choice?.finish_reason}`);
  }

  if (choice.finish_reason === "length") {
    console.warn("AI response was truncated due to token limit for deck", deckId);
  }

  console.log(`AI response for deck ${deckId}: ${content.length} chars, finish_reason: ${choice.finish_reason}`);

  let parsed: any;
  try {
    parsed = JSON.parse(content);
  } catch {
    console.error("Failed to parse AI response as JSON for deck", deckId, "Content:", content.substring(0, 500));
    throw new Error("AI returned invalid JSON response");
  }

  if (Array.isArray(parsed.assumptions)) return parsed.assumptions;
  if (Array.isArray(parsed)) return parsed;
  const arrayKey = Object.keys(parsed).find((k) => Array.isArray(parsed[k]));
  if (arrayKey) return parsed[arrayKey];

  console.error("Unexpected AI response structure for deck", deckId, "Keys:", Object.keys(parsed));
  return [];
}

export async function analyzeDeck(deckId: number, pdfText: string): Promise<void> {
  try {
    await storage.updateDeckStatus(deckId, "analyzing");

    const slideChunks = pdfText.split(/(?=slide\s*\d|page\s*\d)/i);
    const estimatedSlides = Math.max(slideChunks.length, Math.ceil(pdfText.length / 500));

    console.log(`Starting analysis for deck ${deckId}: ${pdfText.length} chars of text, ~${estimatedSlides} slides`);

    let extractedAssumptions = await callOpenAI(pdfText, deckId);

    if (extractedAssumptions.length === 0) {
      console.warn(`First attempt returned empty for deck ${deckId}, retrying with simpler prompt...`);
      await new Promise((r) => setTimeout(r, 1000));
      extractedAssumptions = await callOpenAI(pdfText, deckId);
    }

    if (extractedAssumptions.length === 0) {
      throw new Error("No assumptions could be extracted from this deck after multiple attempts");
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
    console.log(`Analysis complete for deck ${deckId}: ${insertData.length} assumptions extracted`);
  } catch (error) {
    console.error("Analysis failed for deck", deckId, error);
    await storage.updateDeckStatus(deckId, "failed");
  }
}
