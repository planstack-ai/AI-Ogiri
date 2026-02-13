import OpenAI from "openai";

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
  const userPrompt =
    `【お題】\n${topicPrompt}\n\n` +
    answers.map((a) => `【${a.modelName}の回答】\n${a.text}`).join("\n\n");

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: JUDGE_SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0.3,
  });

  return JSON.parse(response.choices[0].message.content!);
}
