# AI大喜利グランプリ

5つのAIモデル（ChatGPT, Gemini, Claude, DeepSeek, xAI Grok）が大喜利のお題に回答し、AI審査員＋ユーザー投票でNo.1を決定するWebサービス。

## Tech Stack

- **Framework**: Next.js 15 (App Router, TypeScript)
- **DB/Auth**: Supabase (PostgreSQL + Auth + RLS)
- **Styling**: Tailwind CSS v4
- **AI**: OpenAI (`gpt-5.5`), Google Generative AI (`gemini-3.1-pro-preview`), Anthropic (`claude-opus-4-7`), DeepSeek (`deepseek-v4-pro`), xAI (`grok-4.3`)
- **OG画像**: Satori + @resvg/resvg-js

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.local.example` をコピーして `.env.local` を作成し、各値を設定します。

```bash
cp .env.local.example .env.local
```

| 変数名 | 説明 | 取得先 |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase プロジェクトの URL | [Supabase Dashboard](https://supabase.com/dashboard) → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase の匿名キー（公開可） | 同上 |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase の Service Role キー（秘密） | 同上（**絶対に公開しないこと**） |
| `OPENAI_API_KEY` | OpenAI API キー | [OpenAI Platform](https://platform.openai.com/api-keys) |
| `GEMINI_API_KEY` | Google Gemini API キー | [Google AI Studio](https://aistudio.google.com/apikey) |
| `ANTHROPIC_API_KEY` | Anthropic API キー | [Anthropic Console](https://console.anthropic.com/) |
| `DEEPSEEK_API_KEY` | DeepSeek API キー | [DeepSeek Platform](https://platform.deepseek.com/) |
| `XAI_API_KEY` | xAI API キー（回答生成 + お題生成時の Web Search） | [xAI Console](https://console.x.ai/) |
| `OPENAI_ANSWER_MODEL` | ChatGPT 回答モデル（任意） | 既定値: `gpt-5.5` |
| `OPENAI_JUDGE_MODEL` | AI 審査員モデル（任意） | 既定値: `gpt-5.5` |
| `OPENAI_TOPIC_MODEL` | お題生成モデル（任意） | 既定値: `gpt-5.5` |
| `GEMINI_MODEL` | Gemini 回答モデル（任意） | 既定値: `gemini-3.1-pro-preview` |
| `CLAUDE_MODEL` | Claude 回答モデル（任意） | 既定値: `claude-opus-4-7` |
| `DEEPSEEK_MODEL` | DeepSeek 回答モデル（任意） | 既定値: `deepseek-v4-pro` |
| `XAI_MODEL` | xAI Grok 回答モデル（任意） | 既定値: `grok-4.3` |
| `NEXT_PUBLIC_SITE_URL` | サイトの公開 URL | ローカルでは `http://localhost:3000` |

### 3. Supabase のセットアップ

Supabase プロジェクトの作成、APIキーの取得、DB スキーマの構築が必要です。
詳細な手順は [Supabase セットアップガイド](docs/setup/supabase.md) を参照してください。

### 4. OAuth・API キーの設定

Google / GitHub OAuth と各 AI サービスの API キー取得手順は [API キー・OAuth 設定ガイド](docs/setup/api-keys.md) を参照してください。

### 5. 開発サーバーの起動

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) を開いてアクセスできます。

## コマンド

```bash
npm run dev      # 開発サーバー起動
npm run build    # プロダクションビルド
npm run lint     # ESLint
```
