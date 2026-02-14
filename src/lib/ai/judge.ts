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

const CHARACTER_JUDGE_SYSTEM_PROMPT = `あなたは大喜利の審査員です。お題と4つのAIモデルの回答が与えられます。
各モデルはアニメ・漫画キャラになりきって回答しています。

以下の基準で各回答を評価し、順位をつけてください：

1. **面白さ** (30点): 笑いを誘えるか
2. **センス** (25点): 言葉選びの巧みさ、知性
3. **意外性** (20点): 予想外の切り口か
4. **キャラクターらしさ** (25点): そのキャラクターの口調・性格・価値観が再現されているか

重要: 回答者の名前（モデル名）に惑わされず、純粋に回答の質とキャラクター再現度で判断してください。

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

interface JudgeAnswer {
  modelName: string;
  text: string;
  characterName?: string;
}

export async function judgeAnswers(
  topicPrompt: string,
  answers: JudgeAnswer[],
  isCharacterMode: boolean = false
): Promise<JudgmentResult> {
  const userPrompt =
    `【お題】\n${topicPrompt}\n\n` +
    answers
      .map((a) => {
        const label = a.characterName
          ? `${a.modelName}の回答（${a.characterName}として）`
          : `${a.modelName}の回答`;
        return `【${label}】\n${a.text}`;
      })
      .join("\n\n");

  const systemPrompt = isCharacterMode
    ? CHARACTER_JUDGE_SYSTEM_PROMPT
    : JUDGE_SYSTEM_PROMPT;

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0.3,
  });

  return JSON.parse(response.choices[0].message.content!);
}
