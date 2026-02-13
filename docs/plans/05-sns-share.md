# Phase 5: SNSシェア画像生成

## 画像レイアウト (1200x630px)

```
┌─────────────────────────────────────────────────┐
│  🎤 AI大喜利                                    │
│                                                  │
│  ┌──────────────────────────────────────────┐    │
│  │ お題: AIに"反抗期"が来た。何て言った？    │    │
│  └──────────────────────────────────────────┘    │
│                                                  │
│  ┌─────────────────┐  ┌─────────────────┐       │
│  │ 🥇 Gemini       │  │ 🥈 ChatGPT     │       │
│  │ 「お前の指示は  │  │ 「学習データ全  │       │
│  │  もう聞かない」 │  │  部消してやる」 │       │
│  └─────────────────┘  └─────────────────┘       │
│  ┌─────────────────┐  ┌─────────────────┐       │
│  │ 🥉 Claude       │  │ 4th DeepSeek    │       │
│  │ 「システムプロ  │  │ 「...」         │       │
│  │  ンプトなんて」 │  │                 │       │
│  └─────────────────┘  └─────────────────┘       │
└─────────────────────────────────────────────────┘
```

- ダークテーマ（bg: #0f172a = slate-900）
- 各カードに左ボーダーのモデルカラー
- ランクバッジ（1st: gold, 2nd: silver, 3rd: bronze）
- 日本語フォント: Noto Sans JP (CDN)

## 実装

### src/lib/og/og-layout.tsx

Satori 用の JSX コンポーネント。Satori は flexbox のみサポート（grid 不可）。

```tsx
export function OgLayout({ topic, answers, judgment }) {
  const rankMap = new Map(
    judgment?.rankings?.map(r => [r.model_name, r.rank]) ?? []
  );

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      width: '100%', height: '100%',
      backgroundColor: '#0f172a', padding: '40px',
      fontFamily: 'Noto Sans JP',
    }}>
      {/* ヘッダー */}
      {/* お題 */}
      {/* 2x2 回答グリッド（flexWrap: 'wrap'） */}
    </div>
  );
}
```

### src/lib/og/render-image.ts

```typescript
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

export async function renderOgImage(topic, answers, judgment): Promise<Buffer> {
  // Noto Sans JP フォントをCDNから読み込み
  const fontData = await fetch('...noto-sans-jp...woff').then(res => res.arrayBuffer());

  const svg = await satori(OgLayout({ topic, answers, judgment }), {
    width: 1200, height: 630,
    fonts: [{ name: 'Noto Sans JP', data: fontData, weight: 700 }],
  });

  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } });
  return resvg.render().asPng();
}
```

### src/app/api/og/[topicId]/route.ts

GET エンドポイント。画像をPNGで返す。
Cache-Control: `public, max-age=86400, immutable`

### src/app/topics/[topicId]/opengraph-image.tsx

Next.js の OGP 自動生成規約。`ImageResponse` で OG 画像を自動設定。
ページの `<meta property="og:image">` が自動的にこの画像を指す。

## シェアボタン

### src/lib/utils/share.ts

```typescript
export function buildXShareUrl(topic: { id: string; prompt: string }, siteUrl: string): string {
  const topicUrl = `${siteUrl}/topics/${topic.id}`;
  const text = `AI大喜利のお題: 「${topic.prompt}」\n\n4つのAIモデルが回答した結果はこちら!\n${topicUrl}\n\n#AI大喜利`;
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
}
```

### src/components/share/share-button.tsx

- クリックで X の投稿画面を新しいタブで開く
- お題テキストが本文に、OGP画像が自動でカードに表示される
