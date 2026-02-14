# 実装計画: モデルバージョン & トークン数の表示

## Context

各AI回答に使用したモデルバージョン（例: `gpt-4o`, `gemini-2.5-pro`）と消費トークン数を表示したい。現在は `AiResponse` に `text` と `generationTimeMs` しかなく、DBにもカラムがない。

---

## 変更ファイル

### `src/lib/ai/types.ts`

- `AiResponse` に `modelVersion: string` と `tokenCount: number | null` を追加

### `src/lib/ai/openai.ts`

- `response.model` からモデルバージョン取得
- `response.usage?.total_tokens` からトークン数取得

### `src/lib/ai/gemini.ts`

- モデルバージョンはハードコード `"gemini-2.5-pro"`
- `result.response.usageMetadata?.totalTokenCount` からトークン数取得

### `src/lib/ai/claude.ts`

- `message.model` からモデルバージョン取得
- `message.usage.input_tokens + message.usage.output_tokens` からトークン数取得

### `src/lib/ai/deepseek.ts`

- `response.model` からモデルバージョン取得
- `response.usage?.total_tokens` からトークン数取得

### `src/lib/ai/generate-all.ts`

- `GenerateResult` に `modelVersion: string` と `tokenCount: number | null` を追加
- 失敗時はデフォルト値を設定

### `supabase/migrations/003_model_version_tokens.sql`

- `ALTER TABLE public.answers ADD COLUMN model_version TEXT;`
- `ALTER TABLE public.answers ADD COLUMN token_count INTEGER;`

### `src/types/database.ts`

- `Answer` に `model_version: string | null` と `token_count: number | null` を追加

### `src/app/api/topics/[topicId]/generate/route.ts`

- 回答保存時に `model_version` と `token_count` を含める

### `src/components/answer/answer-card.tsx`

- 評価理由の下に、モデルバージョンとトークン数を表示
- モデルバージョン: `text-xs text-slate-500`
- トークン数: `text-xs text-slate-500`（例: `1,234 tokens`）

---

## DB 変更: あり（マイグレーション追加）
## API 変更: なし（レスポンス構造のみ拡張）
