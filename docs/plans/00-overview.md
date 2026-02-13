# AI大喜利グランプリ - 実装計画 概要

## Context
Gizmodo Japan の「AI大喜利グランプリ」記事にインスパイアされたWebサービス。
4つのAIモデル（ChatGPT, Gemini, Claude, DeepSeek）が大喜利のお題に回答し、
AI審査員＋ユーザー投票でNo.1を決定する。SNSシェア用の画像生成機能付き。

## Tech Stack
| カテゴリ | 技術 |
|---|---|
| Frontend/Backend | Next.js 15 (App Router, TypeScript) |
| DB/Auth | Supabase (PostgreSQL + Auth) |
| Styling | Tailwind CSS v4 |
| AI | OpenAI SDK, Google Generative AI, Anthropic SDK, DeepSeek (OpenAI互換) |
| 画像生成 | Satori + @resvg/resvg-js |

## フェーズ一覧

| Phase | 内容 | 詳細ドキュメント |
|---|---|---|
| 1 | プロジェクト初期化 + DB + Auth | [01-foundation.md](./01-foundation.md) |
| 2 | AIパイプライン（コア機能） | [02-ai-pipeline.md](./02-ai-pipeline.md) |
| 3 | お題投稿 + 結果表示UI | [03-ui.md](./03-ui.md) |
| 4 | 投票機能 | [04-voting.md](./04-voting.md) |
| 5 | SNSシェア画像生成 | [05-sns-share.md](./05-sns-share.md) |
| 6 | ブラウズ + 仕上げ | [06-polish.md](./06-polish.md) |

## 主要ファイル構成

```
src/
├── app/
│   ├── layout.tsx, page.tsx, globals.css
│   ├── (auth)/login/page.tsx, callback/route.ts
│   ├── topics/
│   │   ├── page.tsx, new/page.tsx
│   │   └── [topicId]/page.tsx, opengraph-image.tsx
│   └── api/
│       ├── topics/route.ts, generate-prompt/route.ts
│       ├── topics/[topicId]/generate/route.ts, judge/route.ts, vote/route.ts
│       └── og/[topicId]/route.ts
├── lib/
│   ├── supabase/client.ts, server.ts, admin.ts
│   ├── ai/openai.ts, gemini.ts, claude.ts, deepseek.ts, generate-all.ts, judge.ts
│   ├── og/og-layout.tsx, render-image.ts
│   └── utils/rate-limit.ts, constants.ts, share.ts
├── components/
│   ├── layout/header.tsx, footer.tsx
│   ├── topic/topic-card.tsx, topic-form.tsx
│   ├── answer/answer-card.tsx, answer-grid.tsx
│   ├── voting/vote-button.tsx, vote-results.tsx
│   ├── judge/judge-results.tsx
│   └── share/share-button.tsx
├── middleware.ts
└── types/database.ts, index.ts
```

## 検証方法
1. `npm run dev` でローカル起動
2. Supabase でユーザー登録 → ログイン確認
3. お題投稿 → 4モデル回答生成 → AI審査 → 結果表示の一連フロー確認
4. 投票 → 投票結果反映確認
5. `/api/og/[topicId]` で画像生成確認
6. Xシェアボタンでシェアプレビュー確認
7. `/topics` で過去の大喜利一覧表示確認
