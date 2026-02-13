import { generateChatGPT } from "./openai";
import { generateGemini } from "./gemini";
import { generateClaude } from "./claude";
import { generateDeepSeek } from "./deepseek";
import { ModelName } from "./types";

const OGIRI_SYSTEM_PROMPT = `あなたは大喜利の回答者です。与えられたお題に対して、面白くてウィットに富んだ回答を1つだけ日本語で返してください。
回答は簡潔に（1〜3文程度）、オチ・センス・意外性を重視してください。
説明や前置きは不要です。回答のみを返してください。`;

const callers = [
  { name: "chatgpt" as ModelName, fn: generateChatGPT },
  { name: "gemini" as ModelName, fn: generateGemini },
  { name: "claude" as ModelName, fn: generateClaude },
  { name: "deepseek" as ModelName, fn: generateDeepSeek },
];

export async function generateAllAnswers(prompt: string) {
  const results = await Promise.allSettled(
    callers.map(async (caller) => {
      const response = await caller.fn(prompt, OGIRI_SYSTEM_PROMPT);
      return { modelName: caller.name, ...response };
    })
  );

  return results.map((result, i) => {
    if (result.status === "fulfilled") return result.value;
    return {
      modelName: callers[i].name,
      text: "(回答の生成に失敗しました)",
      generationTimeMs: 0,
    };
  });
}
