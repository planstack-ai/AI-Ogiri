import { GoogleGenerativeAI } from "@google/generative-ai";
import { AiResponse } from "./types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function generateGemini(
  prompt: string,
  systemPrompt: string
): Promise<AiResponse> {
  const start = Date.now();
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-pro",
    systemInstruction: systemPrompt,
  });
  const result = await model.generateContent(prompt);
  return {
    text: result.response.text(),
    generationTimeMs: Date.now() - start,
  };
}
