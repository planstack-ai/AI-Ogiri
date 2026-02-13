# Phase 6: ブラウズ + 仕上げ

## 過去の大喜利一覧

### src/app/topics/page.tsx

- ページネーション付きの一覧ページ
- フィルタ: 全て / 完了済みのみ
- ソート: 新しい順 / 投票数順
- 各カードに優勝モデル、投票数、相対時間を表示

## リアルタイム更新（オプション）

Supabase Realtime で topics テーブルの status 変更を監視。
生成中のページで `generating` → `judging` → `completed` のステータス遷移をリアルタイム表示。

```typescript
useEffect(() => {
  const channel = supabase
    .channel(`topic:${topicId}`)
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'topics',
      filter: `id=eq.${topicId}`,
    }, (payload) => {
      setTopicStatus(payload.new.status);
      if (payload.new.status === 'completed') router.refresh();
    })
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}, [topicId]);
```

## レート制限

### src/lib/utils/rate-limit.ts

インメモリ Map ベース（MVP用。本番は Upstash Redis に移行）。

| 対象 | 上限 |
|---|---|
| トピック作成 | 10回/ユーザー/時間 |
| AI生成トリガー | 5回/ユーザー/時間 |
| 投票 | 30回/ユーザー/分 |
| OG画像生成 | 60回/IP/分 |

## デザイン

- ダークテーマ: slate-900 ベース
- モデル別カラーアクセント:
  - ChatGPT: #10a37f (green)
  - Gemini: #4285f4 (blue)
  - Claude: #d97706 (amber)
  - DeepSeek: #6366f1 (indigo)
- レスポンシブ: モバイルでは1列、デスクトップでは2x2グリッド
- ローディング: スケルトンUI + ステータスインジケーター

## エラーハンドリング

- API タイムアウト: モデルごとに 30秒
- 部分的失敗: 一部モデルが失敗しても他は表示
- ネットワークエラー: リトライボタン表示
- 認証エラー: ログインページへリダイレクト
