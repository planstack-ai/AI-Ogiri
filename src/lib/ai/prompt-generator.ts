import OpenAI from "openai";

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
    model: "gpt-4o",
    messages: [{ role: "user", content: TOPIC_GENERATOR_PROMPT }],
    temperature: 1.0,
    max_tokens: 200,
  });
  return response.choices[0].message.content?.trim() ?? "";
}
