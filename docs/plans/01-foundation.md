# Phase 1: プロジェクト初期化 + DB + Auth

## Step 1.1: プロジェクト作成

```bash
npx create-next-app@latest . --typescript --tailwind --app --src-dir
npm install @supabase/supabase-js @supabase/ssr openai @anthropic-ai/sdk @google/generative-ai satori @resvg/resvg-js
```

## Step 1.2: Supabase スキーマ

ファイル: `supabase/migrations/001_initial_schema.sql`

### profiles テーブル
auth.users からトリガーで自動作成。

```sql
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
```

### topics テーブル

```sql
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
```

### answers テーブル

```sql
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
```

### ai_judgments テーブル

```sql
CREATE TABLE public.ai_judgments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE UNIQUE,
  judge_model TEXT NOT NULL,
  rankings JSONB NOT NULL,
  overall_comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

rankings JSONB の形式:
```json
[
  { "model_name": "gemini", "rank": 1, "score": 92, "reasoning": "..." },
  { "model_name": "chatgpt", "rank": 2, "score": 85, "reasoning": "..." },
  { "model_name": "claude", "rank": 3, "score": 78, "reasoning": "..." },
  { "model_name": "deepseek", "rank": 4, "score": 70, "reasoning": "..." }
]
```

### votes テーブル

```sql
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
```

### vote_counts ビュー

```sql
CREATE VIEW public.vote_counts AS
SELECT answer_id, topic_id, COUNT(*) AS vote_count
FROM public.votes
GROUP BY answer_id, topic_id;
```

### RLS ポリシー

```sql
-- profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- topics
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Topics are viewable by everyone"
  ON public.topics FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create topics"
  ON public.topics FOR INSERT WITH CHECK (auth.uid() = author_id);

-- answers (INSERT は service_role 経由のみ)
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Answers are viewable by everyone"
  ON public.answers FOR SELECT USING (true);

-- ai_judgments (INSERT は service_role 経由のみ)
ALTER TABLE public.ai_judgments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Judgments are viewable by everyone"
  ON public.ai_judgments FOR SELECT USING (true);

-- votes
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Votes are viewable by everyone"
  ON public.votes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can vote"
  ON public.votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own vote"
  ON public.votes FOR DELETE USING (auth.uid() = user_id);
```

## Step 1.3: Supabase クライアント

### src/lib/supabase/client.ts (ブラウザ用)

```typescript
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

### src/lib/supabase/server.ts (Server Component用)

```typescript
import { createServerClient as createClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createServerClient() {
  const cookieStore = await cookies();
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
}
```

### src/lib/supabase/admin.ts (service_role用)

```typescript
import { createClient } from '@supabase/supabase-js';

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
```

## Step 1.4: Auth

### src/middleware.ts

```typescript
import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );
  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons/).*)'],
};
```

## 環境変数 (.env.local)

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=AI...
ANTHROPIC_API_KEY=sk-ant-...
DEEPSEEK_API_KEY=sk-...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```
