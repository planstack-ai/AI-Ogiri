# 実装計画: レイアウト変更 & タイピング速度調整

## Context

1. PC画面で回答カードが 2x2 グリッドになっているが、1列（1x4）で1回答1行のレイアウトにしたい
2. タイピングアニメーションの文字表示速度が速すぎるので、半分の速度に落とす

---

## 変更ファイル

### `src/components/answer/answer-grid.tsx`

- `grid gap-4 sm:grid-cols-2` → `grid gap-4`（`sm:grid-cols-2` を削除して常に1列）

### `src/components/answer/typewriter-text.tsx`

- 各遅延を2倍に変更:
  | 文字種 | 現在 | 変更後 |
  |---|---|---|
  | 通常文字 | 30ms | 60ms |
  | 読点（`、` `,`） | 120ms | 240ms |
  | 句点・感嘆符（`。` `！` `？` `…` `.` `!` `?` `\n`） | 300ms | 600ms |

---

## DB 変更: なし
## API 変更: なし
