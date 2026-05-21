import OpenAI from "openai";
import { sampleTopics } from "./topic-sampler";
import { MODEL_IDS, TOPIC_GENERATOR_MODEL } from "./model-config";

interface PromptTemplate {
  role: string;
  instruction: string;
  tips: string;
}

interface TopicCandidate {
  source: "openai" | "xai";
  topic: string;
}

const TOPIC_QUALITY_CRITERIA = `良いお題の条件：
- 日本語として短く、声に出したときにすぐ理解できる
- 5つのAIモデルがそれぞれ違う角度でボケられる余白がある
- 説明なしで状況が浮かぶ
- 固有名詞や時事ネタに頼りすぎず、知らない人でも答えられる
- 差別・中傷・実在個人への攻撃にならない
- 「回答者に知識を問う問題」ではなく「発想で笑わせるお題」になっている`;

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

${TOPIC_QUALITY_CRITERIA}

以下は参考例です。これらをそのままコピーせず、インスピレーションとして使って新しいお題を考えてください：
${examplesBlock}

候補を3つ作ってください。
出力は1行に1候補のみ。「お題：」などの接頭語は不要です。`;
}

function buildXaiWebSearchPrompt(): string {
  const samples = sampleTopics(5)
    .map((s, i) => `${i + 1}. ${s.topic}`)
    .join("\n");

  return `あなたは日本のお笑い番組の構成作家です。
WebSearchで日本の最近の話題、生活トレンド、SNSでよく見る違和感、仕事・学校・家庭のあるあるを調べてください。
調べた題材をそのまま使わず、大喜利として答えやすいお題に変換してください。

${TOPIC_QUALITY_CRITERIA}

参考例：
${samples}

候補を3つ作ってください。
出力は1行に1候補のみ。「お題：」などの接頭語は不要です。`;
}

function buildSelectionPrompt(candidates: TopicCandidate[]): string {
  const candidateBlock = candidates
    .map((candidate, i) => `${i + 1}. [${candidate.source}] ${candidate.topic}`)
    .join("\n");

  return `あなたは大喜利番組の最終採用会議の編集長です。
以下の候補から、AI大喜利グランプリのお題として最も面白い1つだけを選んでください。
必要なら少しだけ言い回しを磨いてください。

${TOPIC_QUALITY_CRITERIA}

選定基準：
- AIモデル同士の個性差が出る
- 回答が一言で落としやすい
- 新鮮だが、時事ネタを知らなくても笑える
- 「こんな○○は嫌だ」「もしも○○だったら」など、回答形式が自然に浮かぶ

候補：
${candidateBlock}

採用するお題だけを1行で返してください。`;
}

function cleanTopic(text: string): string {
  return text
    .trim()
    .replace(/^[\s\d\-.*・)）]+/, "")
    .replace(/^お題[:：]\s*/, "")
    .replace(/^["「]|["」]$/g, "")
    .trim();
}

function extractTopicCandidates(
  source: TopicCandidate["source"],
  text: string
): TopicCandidate[] {
  return text
    .split("\n")
    .map(cleanTopic)
    .filter(Boolean)
    .slice(0, 3)
    .map((topic) => ({ source, topic }));
}

async function generateOpenAiTopicCandidates(): Promise<TopicCandidate[]> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is required");
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await client.chat.completions.create({
    model: TOPIC_GENERATOR_MODEL,
    messages: [{ role: "user", content: buildTopicGeneratorPrompt() }],
    temperature: 1.0,
    max_completion_tokens: 500,
  });

  return extractTopicCandidates(
    "openai",
    response.choices[0].message.content ?? ""
  );
}

async function generateXaiTopicCandidates(): Promise<TopicCandidate[]> {
  if (!process.env.XAI_API_KEY) {
    return [];
  }

  const client = new OpenAI({
    apiKey: process.env.XAI_API_KEY,
    baseURL: "https://api.x.ai/v1",
    timeout: 360_000,
  });

  const response = await client.responses.create({
    model: MODEL_IDS.xai,
    input: buildXaiWebSearchPrompt(),
    tools: [{ type: "web_search" }],
    max_output_tokens: 700,
  });

  return extractTopicCandidates("xai", response.output_text ?? "");
}

async function selectBestTopic(candidates: TopicCandidate[]): Promise<string> {
  if (candidates.length === 0) {
    throw new Error("No topic candidates generated");
  }

  if (!process.env.OPENAI_API_KEY || candidates.length === 1) {
    return candidates[0].topic;
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await client.chat.completions.create({
    model: TOPIC_GENERATOR_MODEL,
    messages: [{ role: "user", content: buildSelectionPrompt(candidates) }],
    temperature: 0.5,
    max_completion_tokens: 200,
  });

  return cleanTopic(response.choices[0].message.content ?? candidates[0].topic);
}

export async function generateTopic(): Promise<string> {
  const results = await Promise.allSettled([
    generateOpenAiTopicCandidates(),
    generateXaiTopicCandidates(),
  ]);

  const candidates = results.flatMap((result) =>
    result.status === "fulfilled" ? result.value : []
  );

  return selectBestTopic(candidates);
}
