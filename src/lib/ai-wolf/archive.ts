import { createAdminClient } from "@/lib/supabase/admin";
import type { AiWolfSession } from "./types";

interface AiWolfSessionRow {
  id: string;
  topic: string;
  stance_a: string;
  stance_b: string;
  debate_turn_count: number;
  hunt_turn_count: number;
  moderator: AiWolfSession["moderator"];
  teams: AiWolfSession["teams"];
  participants: AiWolfSession["participants"];
  debate_messages: AiWolfSession["debateMessages"];
  hunt_messages: AiWolfSession["huntMessages"];
  moderator_notes: AiWolfSession["moderatorNotes"];
  generated_by: string;
  created_at: string;
}

interface AiWolfArchiveListResult {
  sessions: AiWolfSession[];
  error: string | null;
}

export function canUseAiWolfArchive() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

function rowToSession(row: AiWolfSessionRow): AiWolfSession {
  return {
    id: row.id,
    topic: row.topic,
    stanceA: row.stance_a,
    stanceB: row.stance_b,
    debateTurnCount: row.debate_turn_count,
    huntTurnCount: row.hunt_turn_count,
    moderator: row.moderator,
    teams: row.teams,
    participants: row.participants,
    debateMessages: row.debate_messages,
    huntMessages: row.hunt_messages,
    moderatorNotes: row.moderator_notes,
    generatedBy: row.generated_by,
    createdAt: row.created_at,
  };
}

function sessionToRow(session: AiWolfSession): AiWolfSessionRow {
  return {
    id: session.id,
    topic: session.topic,
    stance_a: session.stanceA,
    stance_b: session.stanceB,
    debate_turn_count: session.debateTurnCount,
    hunt_turn_count: session.huntTurnCount,
    moderator: session.moderator,
    teams: session.teams,
    participants: session.participants,
    debate_messages: session.debateMessages,
    hunt_messages: session.huntMessages,
    moderator_notes: session.moderatorNotes,
    generated_by: session.generatedBy,
    created_at: session.createdAt,
  };
}

export async function saveAiWolfSession(session: AiWolfSession) {
  if (!canUseAiWolfArchive()) return;

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("ai_wolf_sessions")
    .upsert(sessionToRow(session), { onConflict: "id" });

  if (error) {
    console.error("Failed to archive AI wolf session:", error);
  }
}

export async function listAiWolfSessions(limit = 20) {
  const result = await listAiWolfSessionsWithStatus(limit);
  return result.sessions;
}

export async function listAiWolfSessionsWithStatus(
  limit = 20
): Promise<AiWolfArchiveListResult> {
  if (!canUseAiWolfArchive()) {
    return {
      sessions: [],
      error: null,
    };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("ai_wolf_sessions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Failed to fetch AI wolf archive:", error);
    return {
      sessions: [],
      error: error.message,
    };
  }

  return {
    sessions: ((data ?? []) as AiWolfSessionRow[]).map(rowToSession),
    error: null,
  };
}

export async function getAiWolfSession(id: string) {
  if (!canUseAiWolfArchive()) return null;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("ai_wolf_sessions")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Failed to fetch AI wolf session:", error);
    return null;
  }

  return rowToSession(data as AiWolfSessionRow);
}
