export interface AiResponse {
  text: string;
  generationTimeMs: number;
  modelVersion: string;
  tokenCount: number | null;
}

export const ANSWERING_MODELS = [
  "chatgpt",
  "gemini",
  "claude",
  "deepseek",
  "xai",
] as const;

export type ModelName = (typeof ANSWERING_MODELS)[number];
