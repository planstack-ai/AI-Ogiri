export type TopicStatus = "pending" | "generating" | "judging" | "completed";
export type ModelName = "chatgpt" | "gemini" | "claude" | "deepseek";

export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Topic {
  id: string;
  prompt: string;
  author_id: string | null;
  is_ai_generated: boolean;
  is_character_mode: boolean;
  status: TopicStatus;
  created_at: string;
  updated_at: string;
}

export interface Answer {
  id: string;
  topic_id: string;
  model_name: ModelName;
  answer_text: string;
  generation_time_ms: number | null;
  character_id: string | null;
  model_version: string | null;
  token_count: number | null;
  created_at: string;
}

export interface RankingEntry {
  model_name: string;
  rank: number;
  score: number;
  reasoning: string;
}

export interface AiJudgment {
  id: string;
  topic_id: string;
  judge_model: string;
  rankings: RankingEntry[];
  overall_comment: string | null;
  created_at: string;
}

export interface Vote {
  id: string;
  topic_id: string;
  answer_id: string;
  user_id: string;
  created_at: string;
}

export interface VoteCount {
  answer_id: string;
  topic_id: string;
  vote_count: number;
}
