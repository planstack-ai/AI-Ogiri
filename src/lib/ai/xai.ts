import OpenAI from "openai";
import { AiResponse } from "./types";
import { MODEL_IDS } from "./model-config";

export async function generateXAI(
  prompt: string,
  systemPrompt: string
): Promise<AiResponse> {
  if (!process.env.XAI_API_KEY) {
    throw new Error("XAI_API_KEY is required");
  }

  const client = new OpenAI({
    apiKey: process.env.XAI_API_KEY,
    baseURL: "https://api.x.ai/v1",
    timeout: 360_000,
  });

  const start = Date.now();
  const response = await client.chat.completions.create({
    model: MODEL_IDS.xai,
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
