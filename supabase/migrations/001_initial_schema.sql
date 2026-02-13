-- profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', 'Anonymous'),
    NEW.raw_user_meta_data ->> 'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- topics
CREATE TABLE public.topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt TEXT NOT NULL,
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_ai_generated BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'generating', 'judging', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_topics_status ON public.topics(status);
CREATE INDEX idx_topics_created_at ON public.topics(created_at DESC);

-- answers
CREATE TABLE public.answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  model_name TEXT NOT NULL
    CHECK (model_name IN ('chatgpt', 'gemini', 'claude', 'deepseek')),
  answer_text TEXT NOT NULL,
  generation_time_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(topic_id, model_name)
);

CREATE INDEX idx_answers_topic_id ON public.answers(topic_id);

-- ai_judgments
CREATE TABLE public.ai_judgments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE UNIQUE,
  judge_model TEXT NOT NULL,
  rankings JSONB NOT NULL,
  overall_comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- votes
CREATE TABLE public.votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  answer_id UUID NOT NULL REFERENCES public.answers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(topic_id, user_id)
);

CREATE INDEX idx_votes_topic_id ON public.votes(topic_id);
CREATE INDEX idx_votes_answer_id ON public.votes(answer_id);

-- vote_counts view
CREATE VIEW public.vote_counts AS
SELECT answer_id, topic_id, COUNT(*) AS vote_count
FROM public.votes
GROUP BY answer_id, topic_id;

-- RLS policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Topics are viewable by everyone"
  ON public.topics FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create topics"
  ON public.topics FOR INSERT WITH CHECK (auth.uid() = author_id);

ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Answers are viewable by everyone"
  ON public.answers FOR SELECT USING (true);

ALTER TABLE public.ai_judgments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Judgments are viewable by everyone"
  ON public.ai_judgments FOR SELECT USING (true);

ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Votes are viewable by everyone"
  ON public.votes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can vote"
  ON public.votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own vote"
  ON public.votes FOR DELETE USING (auth.uid() = user_id);
