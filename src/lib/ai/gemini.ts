import { GoogleGenerativeAI } from "@google/generative-ai";
import { AiResponse } from "./types";
import { MODEL_IDS } from "./model-config";

export async function generateGemini(
  prompt: string,
  systemPrompt: string
): Promise<AiResponse> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is required");
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const start = Date.now();
  const modelId = MODEL_IDS.gemini;
  const model = genAI.getGenerativeModel({
    model: modelId,
    systemInstruction: systemPrompt,
  });
  const result = await model.generateContent(prompt);
  return {
    text: result.response.text(),
    generationTimeMs: Date.now() - start,
    modelVersion: modelId,
    tokenCount: result.response.usageMetadata?.totalTokenCount ?? null,
  };
}
