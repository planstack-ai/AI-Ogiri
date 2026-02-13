export interface AiResponse {
  text: string;
  generationTimeMs: number;
}

export type ModelName = "chatgpt" | "gemini" | "claude" | "deepseek";
