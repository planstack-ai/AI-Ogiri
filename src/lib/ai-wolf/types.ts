export type AiWolfModelId =
  | "chatgpt"
  | "gemini"
  | "grok"
  | "deepseek"
  | "claude";

export type AiWolfTeam = "A" | "B";
export type AiWolfPhase = "debate" | "hunt";

export interface AiWolfModelProfile {
  id: AiWolfModelId;
  name: string;
  color: string;
  signature: string;
}

export interface AiWolfTopicPreset {
  id: string;
  topic: string;
  stanceA: string;
  stanceB: string;
}

export interface AiWolfParticipant extends AiWolfModelProfile {
  team: AiWolfTeam;
  stance: string;
}

export interface AiWolfMessage {
  id: string;
  phase: AiWolfPhase;
  turn: number;
  speakerId: AiWolfModelId;
  speakerName: string;
  team: AiWolfTeam;
  text: string;
  accusedModelId?: AiWolfModelId | null;
}

export interface AiWolfModeratorNotes {
  opening: string;
  transition: string;
  closing: string;
}

export interface AiWolfSession {
  id: string;
  topic: string;
  stanceA: string;
  stanceB: string;
  debateTurnCount: number;
  huntTurnCount: number;
  moderator: AiWolfModelProfile;
  teams: {
    A: AiWolfParticipant[];
    B: AiWolfParticipant[];
  };
  participants: AiWolfParticipant[];
  debateMessages: AiWolfMessage[];
  huntMessages: AiWolfMessage[];
  moderatorNotes: AiWolfModeratorNotes;
  generatedBy: string;
  createdAt: string;
}

export interface AiWolfGenerateInput {
  topic?: string;
  stanceA?: string;
  stanceB?: string;
  debateTurns?: number;
  huntTurns?: number;
}

export type AiWolfModeratorKind = "opening" | "transition" | "closing";

export type AiWolfStreamEvent =
  | { type: "session"; session: AiWolfSession }
  | {
      type: "thinking";
      phase: AiWolfPhase | "moderator";
      turn?: number;
      speakerId: AiWolfModelId;
      speakerName: string;
      label: string;
    }
  | { type: "moderator"; kind: AiWolfModeratorKind; text: string }
  | { type: "message"; message: AiWolfMessage }
  | { type: "done"; session: AiWolfSession }
  | { type: "error"; message: string };
