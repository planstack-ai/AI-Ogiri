import OpenAI from "openai";
import { sampleTopics } from "./topic-sampler";

interface PromptTemplate {
  role: string;
  instruction: string;
  tips: string;
}

const PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    role: "あなたは大喜利のお題を作る天才です。",
    instruction: "日本語で面白い大喜利のお題を1つだけ生成してください。",
    tips: `良いお題の特徴：
- 回答の自由度が高い
- 「こんな○○は嫌だ」「○○とかけまして」「もしも○○だったら」などの定番フォーマットも可`,
  },
  {
    role: "あなたはIPPONグランプリの出題者です。",
    instruction:
      "回答者が一言で笑いを取れるような、シンプルで切れ味のある大喜利のお題を1つ考えてください。",
    tips: `良いお題の特徴：
- 一言〜二言で答えられるシンプルさ
- 日常の「あるある」や人間関係に根ざしたテーマ
- 写真で一言、穴埋め形式も可`,
  },
  {
    role: "あなたはベテランの大喜利作家です。",
    instruction:
      "意外な組み合わせや視点のズラしで笑いを生む大喜利のお題を1つ作ってください。",
    tips: `良いお題の特徴：
- ギャップや意外性がある設定
- 「もしも○○が△△だったら」「○○が言いそうにないセリフ」など
- 職業・動物・歴史上の人物など具体的なモチーフを入れる`,
  },
  {
    role: "あなたは日常観察の達人です。",
    instruction:
      "誰もが共感できる日常のワンシーンから、面白い大喜利のお題を1つ作ってください。",
    tips: `良いお題の特徴：
- 学校・職場・家庭・電車など身近なシーン
- 「こんな○○は嫌だ」「○○あるある」形式も可
- 食べ物・季節・イベントなど生活に密着したテーマ`,
  },
  {
    role: "あなたはシュールな笑いを得意とする放送作家です。",
    instruction:
      "ナンセンスで予想外の展開を引き出せる大喜利のお題を1つ作ってください。",
    tips: `良いお題の特徴：
- 常識を覆すような設定やシチュエーション
- 「絶対にありえない○○」「世界一○○な△△」など
- ことわざ・慣用句をもじった形式も可`,
  },
];

function buildTopicGeneratorPrompt(): string {
  const samples = sampleTopics(5);
  const examplesBlock = samples
    .map((s, i) => `${i + 1}. ${s.topic}`)
    .join("\n");

  const template =
    PROMPT_TEMPLATES[Math.floor(Math.random() * PROMPT_TEMPLATES.length)];

  return `${template.role}
${template.instruction}

${template.tips}

以下は参考例です。これらをそのままコピーせず、インスピレーションとして使って新しいお題を考えてください：
${examplesBlock}

お題のみを返してください。「お題：」などの接頭語は不要です。`;
}

export async function generateTopic(): Promise<string> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: buildTopicGeneratorPrompt() }],
    temperature: 1.0,
    max_tokens: 200,
  });
  return response.choices[0].message.content?.trim() ?? "";
}
