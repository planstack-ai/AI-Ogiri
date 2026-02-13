# Phase 4: 投票機能

## API

### src/app/api/topics/[topicId]/vote/route.ts

```typescript
// POST: 投票（upsert で投票変更もサポート）
export async function POST(request: NextRequest, { params }) {
  const { topicId } = await params;
  const { answerId } = await request.json();

  // 認証チェック
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // upsert: 既存の投票があれば変更
  const { error } = await supabase.from('votes').upsert(
    { topic_id: topicId, answer_id: answerId, user_id: user.id },
    { onConflict: 'topic_id,user_id' }
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}

// DELETE: 投票取消
export async function DELETE(request: NextRequest, { params }) {
  const { topicId } = await params;

  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await supabase.from('votes').delete().match({ topic_id: topicId, user_id: user.id });
  return NextResponse.json({ success: true });
}
```

## コンポーネント

### src/components/voting/vote-button.tsx

- ログイン済み: 投票ボタン表示（選択中はハイライト）
- 未ログイン: 「ログインして投票」リンク表示
- 楽観的UI更新（クリック即反映、API失敗時にロールバック）

### src/components/voting/vote-results.tsx

- 横棒グラフで投票分布を表示
- 各モデルのカラーで色分け
- パーセンテージと票数を表示
- アニメーション付き

## 投票ルール
- 1ユーザー1トピックにつき1票
- 投票先の変更可能（upsert）
- 投票の取消可能（DELETE）
- ログイン必須
