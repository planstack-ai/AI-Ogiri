-- AI wolf archived sessions
CREATE TABLE public.ai_wolf_sessions (
  id UUID PRIMARY KEY,
  topic TEXT NOT NULL,
  stance_a TEXT NOT NULL,
  stance_b TEXT NOT NULL,
  debate_turn_count INTEGER NOT NULL,
  hunt_turn_count INTEGER NOT NULL,
  moderator JSONB NOT NULL,
  teams JSONB NOT NULL,
  participants JSONB NOT NULL,
  debate_messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  hunt_messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  moderator_notes JSONB NOT NULL,
  generated_by TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_wolf_sessions_created_at
  ON public.ai_wolf_sessions(created_at DESC);

-- RLS policies
ALTER TABLE public.ai_wolf_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "AI wolf sessions are viewable by everyone"
  ON public.ai_wolf_sessions FOR SELECT USING (true);
