export const SITE_NAME = "AI大喜利グランプリ";
export const SITE_DESCRIPTION =
  "5つのAIモデルが大喜利と討論ゲームで競い合う。AI審査員＋ユーザー投票で勝者を決めよう。";
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const MODEL_DISPLAY_NAMES: Record<string, string> = {
  chatgpt: "ChatGPT",
  gemini: "Gemini",
  claude: "Claude",
  deepseek: "DeepSeek",
  xai: "xAI Grok",
};

export const MODEL_COLORS: Record<string, string> = {
  chatgpt: "#10a37f",
  gemini: "#4285f4",
  claude: "#d97706",
  deepseek: "#6366f1",
  xai: "#e5e7eb",
};
