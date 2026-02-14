# AI大喜利グランプリ

4つのAIモデル（ChatGPT, Gemini, Claude, DeepSeek）が大喜利のお題に回答し、AI審査員＋ユーザー投票でNo.1を決定するWebサービス。

## Tech Stack

- **Framework**: Next.js 15 (App Router, TypeScript)
- **DB/Auth**: Supabase (PostgreSQL + Auth + RLS)
- **Styling**: Tailwind CSS v4
- **AI**: OpenAI (`gpt-4o`), Google Generative AI (`gemini-2.5-pro`), Anthropic (`claude-sonnet-4-20250514`), DeepSeek (`deepseek-chat`)
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
