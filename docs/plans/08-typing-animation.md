# 実装計画: 回答タイピングアニメーション

## Context

トピック詳細ページ (`/topics/{id}`) で回答が一気に全て表示されてしまい、AIが回答している臨場感がない。回答を1つずつ順番に、1文字ずつタイピングするアニメーションで表示し、句読点で一拍おくなど人間っぽさを演出する。

---

## 概要

- 回答カードを順番に1枚ずつ表示
- 各カードの回答テキストを1文字ずつタイプライター風に描画
- 句読点（`。！？`）で長めの停止、読点（`、,`）で短めの停止
- タイピング完了後にランキング・スコア・評価理由をフェードイン
- カード登場時にフェードイン＋スライドアップアニメーション

---

## 新規ファイル

| ファイル | 内容 |
|---|---|
| `src/components/answer/typewriter-text.tsx` | 1文字ずつ表示するクライアントコンポーネント。`onComplete` コールバック付き |

## 変更ファイル

**`src/app/globals.css`**
- `@keyframes fade-in-up` + `.animate-fade-in-up` クラス追加

**`src/components/answer/answer-card.tsx`**
- `"use client"` 追加（useState 使用のため）
- `animate?: boolean` + `onAnimationComplete?: () => void` props 追加
- タイピング中: ランキングメダル・スコアバッジ・評価理由・生成時間を非表示（opacity-0）
- タイピング完了後: フェードインで表示（transition-opacity duration-300）

**`src/components/answer/answer-grid.tsx`**
- `animate?: boolean` prop 追加
- `activeIndex` state で順次表示を管理
- 未到達カードは空 div（マウント時にフレッシュ state を保証）
- カード完了後 400ms 遅延で次カードを表示
- 表示済みカードに `animate-fade-in-up` クラス適用

**`src/app/topics/[topicId]/page.tsx`**
- `AnswerGrid` に `animate` prop を渡す

---

## TypewriterText 仕様

| 文字種 | 遅延 |
|---|---|
| 通常文字 | 30ms |
| 読点（`、` `,`） | 120ms |
| 句点・感嘆符（`。` `！` `？` `…` `.` `!` `?` `\n`） | 300ms |

- タイピング中はカーソルバー（`animate-pulse`）を表示
- 完了時に `onComplete` コールバックを1回だけ呼び出し（`useRef` で制御）

---

## アニメーションフロー

1. カード 1 がフェードインで登場（0.5s ease-out）
2. モデル名・キャラ名が見える状態でテキストが1文字ずつタイプ
3. タイピング完了 → ランキングメダル・スコア・評価理由がフェードイン（300ms）
4. 400ms 後にカード 2 が登場 → 同様に繰り返し
5. 全4枚完了後、審査結果・投票セクションは最初から表示済み

---

## DB 変更: なし
## API 変更: なし
