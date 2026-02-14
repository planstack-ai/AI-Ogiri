# 実装計画: 順位・得点の視覚強調

## Context

回答カードの順位バッジ（1st, 2nd...）と得点が `text-xs text-slate-300 bg-slate-700` で小さく地味。文字サイズ・色を強調して目立たせる。

---

## 変更ファイル

### `src/components/answer/answer-card.tsx`

- 順位バッジのスタイルを順位ごとに色分け:
  - 1位: 金色（amber-400 背景 + amber-900 テキスト）
  - 2位: 銀色（slate-300 背景 + slate-800 テキスト）
  - 3位: 銅色（orange-400 背景 + orange-900 テキスト）
  - 4位: 現行のまま（slate-700 背景 + slate-300 テキスト）
- 文字サイズを `text-xs` → `text-sm font-bold` に拡大
- 得点を別行で大きめに表示（`text-lg font-bold`）、順位バッジの下に配置

---

## DB 変更: なし
## API 変更: なし
