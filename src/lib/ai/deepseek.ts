import OpenAI from "openai";
import { AiResponse } from "./types";
import { MODEL_IDS } from "./model-config";

export async function generateDeepSeek(
  prompt: string,
  systemPrompt: string
): Promise<AiResponse> {
  if (!process.env.DEEPSEEK_API_KEY) {
    throw new Error("DEEPSEEK_API_KEY is required");
  }

  const client = new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: "https://api.deepseek.com",
  });

  const start = Date.now();
  const response = await client.chat.completions.create({
    model: MODEL_IDS.deepseek,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt },
    ],
    max_tokens: 500,
    temperature: 0.9,
  });
  return {
    text: response.choices[0].message.content ?? "",
    generationTimeMs: Date.now() - start,
    modelVersion: response.model,
    tokenCount: response.usage?.total_tokens ?? null,
  };
}
