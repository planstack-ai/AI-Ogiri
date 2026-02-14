# Supabase セットアップガイド

## 1. Supabase プロジェクトの作成

1. [Supabase](https://supabase.com/) にアクセスし、GitHub アカウントでサインインする
2. **New Project** をクリック
3. 以下を入力して **Create new project** をクリック
   - **Organization**: 任意（個人の場合はデフォルト）
   - **Name**: `ai-ogiri`（任意）
   - **Database Password**: 強力なパスワードを設定（控えておく）
   - **Region**: `Northeast Asia (Tokyo)` を選択
4. プロジェクトの作成が完了するまで数分待つ

## 2. API キーの取得

プロジェクトが作成されたら、`.env.local` に設定するキーを取得します。

### 取得手順

1. Supabase Dashboard でプロジェクトを開く
2. 左サイドバーの **Project Settings**（歯車アイコン）をクリック
3. **API** セクションを開く

### 必要なキー

#### `NEXT_PUBLIC_SUPABASE_URL`

- **場所**: Project Settings → API → **Project URL**
- **形式**: `https://xxxxxxxxxxxx.supabase.co`
- 公開しても問題ないキーです

#### `NEXT_PUBLIC_SUPABASE_ANON_KEY`

- **場所**: Project Settings → API → **Project API keys** → `anon` `public`
- **形式**: `eyJ` で始まる長い文字列
- RLS（Row Level Security）で保護されるため、クライアントに公開可能です

#### `SUPABASE_SERVICE_ROLE_KEY`

- **場所**: Project Settings → API → **Project API keys** → `service_role` `secret`
- **形式**: `eyJ` で始まる長い文字列
- **このキーは絶対に公開しないこと。** RLS をバイパスするため、サーバーサイドでのみ使用します

### .env.local への設定

```bash
cp .env.local.example .env.local
```

`.env.local` の該当行を取得した値に置き換えてください。

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...（取得した anon key）
SUPABASE_SERVICE_ROLE_KEY=eyJ...（取得した service_role key）
```

## 3. データベースのセットアップ

Supabase Dashboard の **SQL Editor** でスキーマを作成します。

1. 左サイドバーの **SQL Editor** をクリック
2. **New query** をクリック
3. 以下の SQL を順番に実行する

### 3.1 profiles テーブル

ユーザー登録時に `auth.users` から自動作成されるプロフィールテーブルです。

```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ユーザー作成時にプロフィールを自動作成するトリガー
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

### 3.2 topics テーブル

お題を管理するテーブルです。

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

### 3.3 answers テーブル

各 AI モデルの回答を格納するテーブルです。

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

### 3.4 ai_judgments テーブル

AI 審査員の評価結果を格納するテーブルです。

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

### 3.5 votes テーブル + vote_counts ビュー

ユーザー投票のテーブルと集計ビューです。

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

-- 投票数の集計ビュー
CREATE VIEW public.vote_counts AS
SELECT answer_id, topic_id, COUNT(*) AS vote_count
FROM public.votes
GROUP BY answer_id, topic_id;
```

### 3.6 RLS（Row Level Security）ポリシー

各テーブルのアクセス制御を設定します。`answers` と `ai_judgments` への INSERT は `service_role` 経由のみ許可されます。

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

-- answers（INSERT は service_role 経由のみ）
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Answers are viewable by everyone"
  ON public.answers FOR SELECT USING (true);

-- ai_judgments（INSERT は service_role 経由のみ）
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

## 4. URL Configuration（認証の前提設定）

OAuth が正しく動作するために、Supabase 側でリダイレクト先を許可する必要があります。

1. Supabase Dashboard → **Authentication** → **URL Configuration**
2. 以下を設定:
   - **Site URL**: `http://localhost:3000`
   - **Redirect URLs**: `http://localhost:3000/callback` を追加

> **本番デプロイ時**: `https://your-domain.com` と `https://your-domain.com/callback` に変更してください。

## 5. Google OAuth の設定

### 5.1 Google Cloud Console での設定

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. プロジェクトを選択（または新規作成）
3. **APIs & Services** → **OAuth consent screen** で同意画面を設定（未設定の場合）
   - User Type: **External** を選択
   - アプリ名やメールアドレスを入力して保存
4. **APIs & Services** → **Credentials** に移動
5. **Create Credentials** → **OAuth client ID** をクリック
6. 以下を設定:
   - **Application type**: Web application
   - **Name**: `AI大喜利グランプリ`（任意）
   - **Authorized redirect URIs**: `https://xxxxxxxxxxxx.supabase.co/auth/v1/callback`（Supabase の Project URL に `/auth/v1/callback` を付けたもの）
7. **Create** をクリックし、**Client ID** と **Client Secret** を控える

### 5.2 Supabase での設定

1. Supabase Dashboard → **Authentication** → **Providers**
2. **Google** を展開し有効化する
3. Google Cloud Console で取得した **Client ID** と **Client Secret** を入力
4. **Save** をクリック

## 6. GitHub OAuth の設定

### 6.1 GitHub での OAuth App 作成

1. [GitHub Settings → Developer settings → OAuth Apps](https://github.com/settings/developers) にアクセス
2. **New OAuth App** をクリック
3. 以下を入力:
   - **Application name**: `AI大喜利グランプリ`（任意）
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `https://xxxxxxxxxxxx.supabase.co/auth/v1/callback`（Supabase の Project URL に `/auth/v1/callback` を付けたもの）
4. **Register application** をクリック
5. **Client ID** を控える
6. **Generate a new client secret** をクリックして **Client Secret** を控える

### 6.2 Supabase での設定

1. Supabase Dashboard → **Authentication** → **Providers**
2. **GitHub** を展開し有効化する
3. GitHub で取得した **Client ID** と **Client Secret** を入力
4. **Save** をクリック

## 7. 動作確認

セットアップが正しく完了しているか確認します。

```bash
npm run dev
```

1. `http://localhost:3000` にアクセスできることを確認
2. Google ログインが動作することを確認
3. GitHub ログインが動作することを確認
4. Supabase Dashboard → **Table Editor** で `profiles` テーブルにレコードが作成されていることを確認

## トラブルシューティング

### ログイン後にエラーページにリダイレクトされる

- Supabase Dashboard → **Authentication** → **URL Configuration** で `http://localhost:3000/callback` が Redirect URLs に含まれているか確認
- OAuth プロバイダの **Authorized redirect URI** / **Authorization callback URL** が `https://xxxxxxxxxxxx.supabase.co/auth/v1/callback` になっているか確認

### "OAuth consent screen" エラー（Google）

- Google Cloud Console で OAuth 同意画面の設定が完了しているか確認
- テストユーザーにログインするアカウントが追加されているか確認（公開ステータスが「テスト」の場合）

### "Provider is not enabled" エラー

- Supabase Dashboard → **Authentication** → **Providers** で該当プロバイダが有効化されているか確認
