export const SITE_NAME = "AI大喜利グランプリ";
export const SITE_DESCRIPTION =
  "4つのAIモデルが大喜利で競い合う！お題を投稿して、AI審査員＋ユーザー投票でNo.1を決めよう。";
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const MODEL_DISPLAY_NAMES: Record<string, string> = {
  chatgpt: "ChatGPT",
  gemini: "Gemini",
  claude: "Claude",
  deepseek: "DeepSeek",
};

export const MODEL_COLORS: Record<string, string> = {
  chatgpt: "#10a37f",
  gemini: "#4285f4",
  claude: "#d97706",
  deepseek: "#6366f1",
};
