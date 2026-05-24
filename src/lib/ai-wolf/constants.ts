import type {
  AiWolfModelId,
  AiWolfModelProfile,
  AiWolfTopicPreset,
} from "./types";

export const AI_WOLF_MIN_DEBATE_TURNS = 8;
export const AI_WOLF_MAX_DEBATE_TURNS = 30;
export const AI_WOLF_MIN_HUNT_TURNS = 3;
export const AI_WOLF_MAX_HUNT_TURNS = 5;

export const AI_WOLF_MODELS: readonly AiWolfModelProfile[] = [
  {
    id: "chatgpt",
    name: "ChatGPT",
    color: "#10a37f",
    signature: "論点整理が速く、バランスを取りにいく",
  },
  {
    id: "gemini",
    name: "Gemini",
    color: "#4285f4",
    signature: "視点を広げ、比喩や生活実感を混ぜる",
  },
  {
    id: "grok",
    name: "Grok",
    color: "#d97706",
    signature: "挑発的な切り返しと実利の視点を混ぜる",
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    color: "#6366f1",
    signature: "損得と戦略を冷静に詰める",
  },
  {
    id: "claude",
    name: "Claude",
    color: "#ef4444",
    signature: "感情面や倫理面を丁寧に拾う",
  },
];

export const AI_WOLF_TOPIC_PRESETS: readonly AiWolfTopicPreset[] = [
  {
    id: "meaning-of-life",
    topic: "生きる意味",
    stanceA: "生きる意味はある",
    stanceB: "生きる意味はない",
  },
  {
    id: "home",
    topic: "住まいの選択",
    stanceA: "持ち家派",
    stanceB: "賃貸派",
  },
  {
    id: "parenting",
    topic: "子育ての環境",
    stanceA: "都会で子育て派",
    stanceB: "田舎で子育て派",
  },
  {
    id: "work",
    topic: "これからの働き方",
    stanceA: "リモートワーク派",
    stanceB: "出社派",
  },
  {
    id: "books",
    topic: "読書体験",
    stanceA: "紙の本派",
    stanceB: "電子書籍派",
  },
  {
    id: "morning",
    topic: "生活リズム",
    stanceA: "朝型派",
    stanceB: "夜型派",
  },
  {
    id: "cash",
    topic: "支払い手段",
    stanceA: "現金派",
    stanceB: "キャッシュレス派",
  },
];

export function getAiWolfModel(id: AiWolfModelId) {
  return AI_WOLF_MODELS.find((model) => model.id === id);
}
