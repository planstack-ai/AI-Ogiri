export interface AiResponse {
  text: string;
  generationTimeMs: number;
  modelVersion: string;
  tokenCount: number | null;
}

export type ModelName = "chatgpt" | "gemini" | "claude" | "deepseek";
