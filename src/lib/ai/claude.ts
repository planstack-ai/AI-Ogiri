import Anthropic from "@anthropic-ai/sdk";
import { AiResponse } from "./types";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function generateClaude(
  prompt: string,
  systemPrompt: string
): Promise<AiResponse> {
  const start = Date.now();
  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
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
