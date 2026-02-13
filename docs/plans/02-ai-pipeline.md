# Phase 2: AIパイプライン（コア機能）

## Step 2.1: 各モデルの呼び出し

### 共通型定義 - src/lib/ai/types.ts

```typescript
export interface AiResponse {
  text: string;
  generationTimeMs: number;
}

export type ModelName = 'chatgpt' | 'gemini' | 'claude' | 'deepseek';
```

### src/lib/ai/openai.ts - ChatGPT

```typescript
import OpenAI from 'openai';
import { AiResponse } from './types';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateChatGPT(prompt: string, systemPrompt: string): Promise<AiResponse> {
  const start = Date.now();
  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ],
    max_tokens: 500,
    temperature: 0.9,
  });
  return {
    text: response.choices[0].message.content ?? '',
    generationTimeMs: Date.now() - start,
  };
}
```

### src/lib/ai/gemini.ts - Gemini

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AiResponse } from './types';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function generateGemini(prompt: string, systemPrompt: string): Promise<AiResponse> {
  const start = Date.now();
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-pro',
    systemInstruction: systemPrompt,
  });
  const result = await model.generateContent(prompt);
  return {
    text: result.response.text(),
    generationTimeMs: Date.now() - start,
  };
}
```

### src/lib/ai/claude.ts - Claude

```typescript
import Anthropic from '@anthropic-ai/sdk';
import { AiResponse } from './types';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function generateClaude(prompt: string, systemPrompt: string): Promise<AiResponse> {
  const start = Date.now();
  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 500,
    system: systemPrompt,
    messages: [{ role: 'user', content: prompt }],
  });
  const textBlock = message.content.find(b => b.type === 'text');
  return {
    text: textBlock?.text ?? '',
    generationTimeMs: Date.now() - start,
  };
}
```

### src/lib/ai/deepseek.ts - DeepSeek (OpenAI互換)

```typescript
import OpenAI from 'openai';
import { AiResponse } from './types';

const client = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com',
});

export async function generateDeepSeek(prompt: string, systemPrompt: string): Promise<AiResponse> {
  const start = Date.now();
  const response = await client.chat.completions.create({
    model: 'deepseek-chat',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ],
    max_tokens: 500,
    temperature: 0.9,
  });
  return {
    text: response.choices[0].message.content ?? '',
    generationTimeMs: Date.now() - start,
  };
}
```

## Step 2.2: 並列オーケストレーター

### src/lib/ai/generate-all.ts

```typescript
import { generateChatGPT } from './openai';
import { generateGemini } from './gemini';
import { generateClaude } from './claude';
import { generateDeepSeek } from './deepseek';
import { ModelName } from './types';

const OGIRI_SYSTEM_PROMPT = `あなたは大喜利の回答者です。与えられたお題に対して、面白くてウィットに富んだ回答を1つだけ日本語で返してください。
回答は簡潔に（1〜3文程度）、オチ・センス・意外性を重視してください。
説明や前置きは不要です。回答のみを返してください。`;

const callers = [
  { name: 'chatgpt' as ModelName,  fn: generateChatGPT },
  { name: 'gemini' as ModelName,   fn: generateGemini },
  { name: 'claude' as ModelName,   fn: generateClaude },
  { name: 'deepseek' as ModelName, fn: generateDeepSeek },
];

export async function generateAllAnswers(prompt: string) {
  const results = await Promise.allSettled(
    callers.map(async (caller) => {
      const response = await caller.fn(prompt, OGIRI_SYSTEM_PROMPT);
      return { modelName: caller.name, ...response };
    })
  );

  return results.map((result, i) => {
    if (result.status === 'fulfilled') return result.value;
    return {
      modelName: callers[i].name,
      text: '(回答の生成に失敗しました)',
      generationTimeMs: 0,
    };
  });
}
```

ポイント:
- `Promise.allSettled` で個別の失敗が他をブロックしない
- 失敗時はフォールバックテキストを返す
- temperature=0.9 で創造性を高く設定

## Step 2.3: AI審査員

### src/lib/ai/judge.ts

```typescript
import OpenAI from 'openai';

const JUDGE_SYSTEM_PROMPT = `あなたは大喜利の審査員です。お題と4つのAIモデルの回答が与えられます。
以下の基準で各回答を評価し、順位をつけてください：

1. **面白さ** (40点): 笑いを誘えるか
2. **センス** (30点): 言葉選びの巧みさ、知性
3. **意外性** (30点): 予想外の切り口か

重要: 回答者の名前（モデル名）に惑わされず、純粋に回答の質で判断してください。

以下のJSON形式で返答してください（日本語で）：
{
  "rankings": [
    { "model_name": "モデル名", "rank": 1, "score": 92, "reasoning": "評価理由を1〜2文で" }
  ],
  "overall_comment": "全体的な講評を2〜3文で"
}`;

export interface JudgmentResult {
  rankings: {
    model_name: string;
    rank: number;
    score: number;
    reasoning: string;
  }[];
  overall_comment: string;
}

export async function judgeAnswers(
  topicPrompt: string,
  answers: { modelName: string; text: string }[]
): Promise<JudgmentResult> {
  const userPrompt = `【お題】\n${topicPrompt}\n\n` +
    answers.map(a => `【${a.modelName}の回答】\n${a.text}`).join('\n\n');

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: JUDGE_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.3,
  });

  return JSON.parse(response.choices[0].message.content!);
}
```

ポイント:
- 審査員は GPT-4o（回答者とは別インスタンス）
- `response_format: { type: 'json_object' }` で構造化出力を保証
- temperature=0.3 で一貫した評価

## Step 2.4: 生成APIルート

### src/app/api/topics/[topicId]/generate/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createServerClient } from '@/lib/supabase/server';
import { generateAllAnswers } from '@/lib/ai/generate-all';
import { judgeAnswers } from '@/lib/ai/judge';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ topicId: string }> }
) {
  const { topicId } = await params;

  // 認証チェック
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();

  // トピック存在確認 + ステータスチェック
  const { data: topic } = await admin.from('topics').select('*').eq('id', topicId).single();
  if (!topic) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (topic.status !== 'pending') {
    return NextResponse.json({ error: 'Already processed' }, { status: 409 });
  }

  // ステータス更新: generating
  await admin.from('topics').update({ status: 'generating' }).eq('id', topicId);

  try {
    // 1. 4モデル並列で回答生成
    const answers = await generateAllAnswers(topic.prompt);

    // 2. 回答をDBに保存
    await admin.from('answers').insert(
      answers.map(a => ({
        topic_id: topicId,
        model_name: a.modelName,
        answer_text: a.text,
        generation_time_ms: a.generationTimeMs,
      }))
    );

    // 3. AI審査
    await admin.from('topics').update({ status: 'judging' }).eq('id', topicId);
    const judgment = await judgeAnswers(
      topic.prompt,
      answers.map(a => ({ modelName: a.modelName, text: a.text }))
    );

    // 4. 審査結果保存
    await admin.from('ai_judgments').insert({
      topic_id: topicId,
      judge_model: 'gpt-4o',
      rankings: judgment.rankings,
      overall_comment: judgment.overall_comment,
    });

    // 5. 完了
    await admin.from('topics').update({ status: 'completed' }).eq('id', topicId);

    return NextResponse.json({ success: true, answers, judgment });
  } catch (error) {
    // 失敗時は pending に戻してリトライ可能にする
    await admin.from('topics').update({ status: 'pending' }).eq('id', topicId);
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
  }
}
```

### お題自動生成 - src/lib/ai/prompt-generator.ts

```typescript
import OpenAI from 'openai';

const TOPIC_GENERATOR_PROMPT = `あなたは大喜利のお題を作る天才です。
日本語で面白い大喜利のお題を1つだけ生成してください。

良いお題の特徴：
- 回答の自由度が高い
- AIが面白い回答を出せそうな余地がある
- 時事ネタやテクノロジーに関連するものも良い
- 「こんな○○は嫌だ」「○○とかけまして」などの定番フォーマットも可

お題のみを返してください。「お題：」などの接頭語は不要です。`;

export async function generateTopic(): Promise<string> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: TOPIC_GENERATOR_PROMPT }],
    temperature: 1.0,
    max_tokens: 200,
  });
  return response.choices[0].message.content?.trim() ?? '';
}
```
