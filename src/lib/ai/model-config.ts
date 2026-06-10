import type { ModelName } from "./types";

export const DEFAULT_MODEL_IDS: Record<ModelName, string> = {
  chatgpt: "gpt-5.5",
  gemini: "gemini-3.1-pro-preview",
  claude: "claude-opus-4-7",
  deepseek: "deepseek-v4-pro",
  xai: "grok-4.3",
};

export const MODEL_IDS: Record<ModelName, string> = {
  chatgpt: process.env.OPENAI_ANSWER_MODEL ?? DEFAULT_MODEL_IDS.chatgpt,
  gemini: process.env.GEMINI_MODEL ?? DEFAULT_MODEL_IDS.gemini,
  claude: process.env.CLAUDE_MODEL ?? DEFAULT_MODEL_IDS.claude,
  deepseek: process.env.DEEPSEEK_MODEL ?? DEFAULT_MODEL_IDS.deepseek,
  xai: process.env.XAI_MODEL ?? DEFAULT_MODEL_IDS.xai,
};

export const JUDGE_MODEL =
  process.env.OPENAI_JUDGE_MODEL ??
  process.env.OPENAI_ANSWER_MODEL ??
  DEFAULT_MODEL_IDS.chatgpt;

export const TOPIC_GENERATOR_MODEL =
  process.env.OPENAI_TOPIC_MODEL ??
  process.env.OPENAI_ANSWER_MODEL ??
  DEFAULT_MODEL_IDS.chatgpt;

export function openAiTemperatureParam(
  model: string,
  temperature: number
): { temperature?: number } {
  if (model.toLowerCase().startsWith("gpt-5")) {
    return {};
  }

  return { temperature };
}
