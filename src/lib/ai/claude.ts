import Anthropic from "@anthropic-ai/sdk";
import { AiResponse } from "./types";
import { MODEL_IDS } from "./model-config";

export async function generateClaude(
  prompt: string,
  systemPrompt: string
): Promise<AiResponse> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is required");
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const start = Date.now();
  const message = await client.messages.create({
    model: MODEL_IDS.claude,
    max_tokens: 500,
    system: systemPrompt,
    messages: [{ role: "user", content: prompt }],
  });
  const textBlock = message.content.find((b) => b.type === "text");
  return {
    text: textBlock?.text ?? "",
    generationTimeMs: Date.now() - start,
    modelVersion: message.model,
    tokenCount: message.usage.input_tokens + message.usage.output_tokens,
  };
}
