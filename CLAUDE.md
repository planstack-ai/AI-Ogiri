# AI大喜利グランプリ

4つのAIモデル（ChatGPT, Gemini, Claude, DeepSeek）が大喜利のお題に回答し、AI審査員＋ユーザー投票でNo.1を決定するWebサービス。

## Tech Stack

- **Framework**: Next.js 15 (App Router, TypeScript, `src/` ディレクトリ)
- **DB/Auth**: Supabase (PostgreSQL + Auth + RLS)
- **Styling**: Tailwind CSS v4
- **AI**: OpenAI SDK (`gpt-4o`), Google Generative AI (`gemini-2.5-pro`), Anthropic SDK (`claude-sonnet-4-20250514`), DeepSeek (`deepseek-chat`, OpenAI互換)
- **OG画像**: Satori + @resvg/resvg-js

## コマンド

```bash
npm run dev      # 開発サーバー起動
npm run build    # プロダクションビルド
npm run lint     # ESLint
```

## プロジェクト構成

```
src/
├── app/                          # App Router ページ・API
│   ├── (auth)/                   # 認証関連 (login, callback)
│   ├── topics/                   # お題一覧・詳細・新規作成
│   │   └── [topicId]/            # 結果表示ページ
│   └── api/                      # APIルート
│       ├── topics/               # CRUD + AI生成トリガー
│       └── og/[topicId]/         # OG画像エンドポイント
├── lib/
│   ├── supabase/                 # client.ts(ブラウザ), server.ts(RSC), admin.ts(service_role)
│   ├── ai/                       # 各モデル呼び出し + オーケストレーター + 審査
│   ├── og/                       # OG画像レイアウト・レンダリング
│   └── utils/                    # レート制限, 定数, シェアURL
├── components/                   # UIコンポーネント
│   ├── answer/                   # 回答カード・グリッド
│   ├── voting/                   # 投票ボタン・結果表示
│   ├── judge/                    # AI審査結果
│   ├── share/                    # SNSシェアボタン
│   ├── topic/                    # お題カード・フォーム
│   └── layout/                   # ヘッダー・フッター
├── middleware.ts                  # Supabase Auth セッション管理
└── types/                        # 型定義
```

## アーキテクチャ上の注意点

- **Supabase クライアントは3種**: ブラウザ用(`client.ts`)、Server Component用(`server.ts`)、管理用(`admin.ts` = service_role)。用途に応じて使い分ける
- **AI回答の保存・審査結果の保存は `admin` (service_role) 経由**: RLSで一般ユーザーのINSERTを禁止しているため
- **AI回答生成は `Promise.allSettled`** で並列実行。個別の失敗が全体をブロックしない
- **AI審査員は GPT-4o** を使用（回答者とは別インスタンス、temperature=0.3）
- **OG画像の Satori は flexbox のみ対応**（CSS Grid 不可）
- **投票は1ユーザー1トピック1票**（upsert で変更可能）

## 環境変数 (.env.local)

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
GEMINI_API_KEY=
ANTHROPIC_API_KEY=
DEEPSEEK_API_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## 実装計画

詳細な設計ドキュメントは `docs/plans/` にある。Phase 1 から順に実装する。

| Phase | 内容 | ドキュメント |
|---|---|---|
| 1 | プロジェクト初期化 + DB + Auth | `docs/plans/01-foundation.md` |
| 2 | AIパイプライン（コア機能） | `docs/plans/02-ai-pipeline.md` |
| 3 | お題投稿 + 結果表示UI | `docs/plans/03-ui.md` |
| 4 | 投票機能 | `docs/plans/04-voting.md` |
| 5 | SNSシェア画像生成 | `docs/plans/05-sns-share.md` |
| 6 | ブラウズ + 仕上げ | `docs/plans/06-polish.md` |
| 7 | お題データセット + キャラなりきりモード | `docs/plans/07-dataset-and-character-mode.md` |
| 8 | 回答タイピングアニメーション | `docs/plans/08-typing-animation.md` |
| 9 | レイアウト変更 & タイピング速度調整 | `docs/plans/09-layout-and-speed-tuning.md` |
| 10 | 4位から順に発表 | `docs/plans/10-reverse-rank-order.md` |

> **注意**: Phase 7 の DBマイグレーション（`supabase/migrations/002_character_mode.sql`）は未適用。手動実行が必要。

## デザイン方針

- ダークテーマ（slate-900 ベース）
- モデル別カラー: ChatGPT=#10a37f, Gemini=#4285f4, Claude=#d97706, DeepSeek=#6366f1
- レスポンシブ: モバイル1列、デスクトップ2x2グリッド
