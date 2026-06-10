import OpenAI from "openai";
import { AiResponse } from "./types";
import { MODEL_IDS, openAiTemperatureParam } from "./model-config";

export async function generateChatGPT(
  prompt: string,
  systemPrompt: string
): Promise<AiResponse> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is required");
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const start = Date.now();
  const model = MODEL_IDS.chatgpt;
  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt },
    ],
    max_completion_tokens: 500,
    ...openAiTemperatureParam(model, 0.9),
  });
  return {
    text: response.choices[0].message.content ?? "",
    generationTimeMs: Date.now() - start,
    modelVersion: response.model,
    tokenCount: response.usage?.total_tokens ?? null,
  };
}
