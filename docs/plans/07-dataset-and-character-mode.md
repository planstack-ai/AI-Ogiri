# 実装計画: お題データセット充実 + キャラなりきりモード

## Context

現状の AI お題生成は GPT-4o に自由に考えさせているだけで、大喜利らしいお題が出にくい。また、AI の回答が "AI っぽい" 無難な内容になりがち。この2つの課題を解決する。

---

## Feature 1: お題データセット + Few-shot 生成

### 概要
IPPON グランプリ等の大喜利番組を参考にしたお題のデータセット（~50件）を用意し、生成時に数件をランダムサンプルして few-shot examples として渡す。

### 新規ファイル

| ファイル | 内容 |
|---|---|
| `src/lib/ai/ogiri-topics-dataset.ts` | お題データセット（配列）。各エントリに `topic` と `category`（"konna" / "if" / "nazokake" / "oogiri" 等）を持つ |
| `src/lib/ai/topic-sampler.ts` | データセットからカテゴリ分散でランダム N 件をサンプルする関数 |

### 変更ファイル

**`src/lib/ai/prompt-generator.ts`**
- 静的な `TOPIC_GENERATOR_PROMPT` → `buildTopicGeneratorPrompt()` 関数に変更
- サンプルした 5 件を few-shot examples としてプロンプトに埋め込む
- 「これらをそのままコピーせず、インスピレーションとして使って」と指示

### DB 変更: なし
### API 変更: なし

---

## Feature 2: キャラなりきりモード

### 概要
お題投稿時に「キャラなりきりモード」を ON にすると、各 AI モデルにランダムなアニメ・漫画キャラが割り当てられ、そのキャラになりきって回答する。

### DB マイグレーション

```sql
ALTER TABLE public.topics ADD COLUMN is_character_mode BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.answers ADD COLUMN character_id TEXT;
```

### 新規ファイル

| ファイル | 内容 |
|---|---|
| `src/lib/ai/characters-dataset.ts` | キャラ定義配列（~16-20件）。`id`, `name`, `source`, `personality`, `speechStyle` |
| `src/lib/ai/character-assigner.ts` | 4モデルにランダムにユニークなキャラを割り当てる関数 |
| `supabase/migrations/002_character_mode.sql` | 上記 ALTER TABLE |

### 変更ファイル

**`src/types/database.ts`**
- `Topic` に `is_character_mode: boolean` 追加
- `Answer` に `character_id: string | null` 追加

**`src/lib/ai/generate-all.ts`**
- `generateAllAnswers(prompt, isCharacterMode)` にシグネチャ変更
- キャラモード ON 時: `buildCharacterSystemPrompt(character)` でキャラ設定込みの system prompt を構築
- 戻り値に `characterId` を追加

**`src/lib/ai/judge.ts`**
- `judgeAnswers()` に `isCharacterMode` と `characterName` を受け取るように拡張
- キャラモード時は評価基準に「キャラクターらしさ」を追加

**`src/app/api/topics/route.ts`** (POST)
- リクエストボディから `is_character_mode` を受け取り insert に追加

**`src/app/api/topics/[topicId]/generate/route.ts`**
- `generateAllAnswers()` に `topic.is_character_mode` を渡す
- answers insert に `character_id` を追加
- judge 呼び出しにキャラ名を渡す

**`src/components/topic/topic-form.tsx`**
- トグルスイッチ「キャラなりきりモード」を追加
- submit 時に `is_character_mode` を送信

**`src/components/answer/answer-card.tsx`**
- props に `characterName` 追加
- モデル名の下に `as キャラ名` を表示（amber-400）

**`src/components/answer/answer-grid.tsx`**
- `characters-dataset` から character_id を名前に解決して AnswerCard に渡す

**`src/components/topic/topic-card.tsx`**
- キャラモード時に「なりきり」バッジ表示

**`src/lib/og/og-layout.tsx`**
- OG 画像にキャラ名表示

---

## 実装順序

### Phase 1: お題データセット（DB変更なし）
1. `src/lib/ai/ogiri-topics-dataset.ts` 作成（~50件のお題）
2. `src/lib/ai/topic-sampler.ts` 作成
3. `src/lib/ai/prompt-generator.ts` 修正

### Phase 2: キャラモード — データ層
4. `supabase/migrations/002_character_mode.sql` 作成 + 実行
5. `src/types/database.ts` 型追加
6. `src/lib/ai/characters-dataset.ts` 作成（~16-20キャラ）
7. `src/lib/ai/character-assigner.ts` 作成

### Phase 3: キャラモード — AI パイプライン
8. `src/lib/ai/generate-all.ts` 修正
9. `src/lib/ai/judge.ts` 修正
10. `src/app/api/topics/route.ts` 修正
11. `src/app/api/topics/[topicId]/generate/route.ts` 修正

### Phase 4: キャラモード — UI
12. `src/components/topic/topic-form.tsx` トグル追加
13. `src/components/answer/answer-card.tsx` キャラ名表示
14. `src/components/answer/answer-grid.tsx` キャラ名解決
15. `src/components/topic/topic-card.tsx` バッジ表示
16. `src/lib/og/og-layout.tsx` OG画像対応

### Phase 5: 動作確認
17. キャラモード OFF でお題生成 → few-shot で生成内容が改善されていることを確認
18. キャラモード ON でお題投稿 → 4モデルがキャラになりきり回答 → 審査 → 結果表示にキャラ名が出ることを確認
19. `npm run build` が通ることを確認
