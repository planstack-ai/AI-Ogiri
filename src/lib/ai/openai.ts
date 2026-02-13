import OpenAI from "openai";
import { AiResponse } from "./types";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateChatGPT(
  prompt: string,
  systemPrompt: string
): Promise<AiResponse> {
  const start = Date.now();
  const response = await client.chat.completions.create({
    model: "gpt-4o",
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
  };
}
