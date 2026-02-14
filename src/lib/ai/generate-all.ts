import { generateChatGPT } from "./openai";
import { generateGemini } from "./gemini";
import { generateClaude } from "./claude";
import { generateDeepSeek } from "./deepseek";
import { ModelName } from "./types";
import { assignCharacters, type CharacterAssignment } from "./character-assigner";
import type { Character } from "./characters-dataset";

const OGIRI_SYSTEM_PROMPT = `あなたは大喜利の回答者です。与えられたお題に対して、面白くてウィットに富んだ回答を1つだけ日本語で返してください。
回答は簡潔に（1〜3文程度）、オチ・センス・意外性を重視してください。
説明や前置きは不要です。回答のみを返してください。`;

function buildCharacterSystemPrompt(character: Character): string {
  return `あなたは「${character.name}」（${character.source}）になりきって大喜利に回答してください。

【キャラクター設定】
- 性格: ${character.personality}
- 話し方: ${character.speechStyle}

【回答ルール】
- ${character.name}らしい口調・視点で回答すること
- 回答は簡潔に（1〜3文程度）
- キャラクターの特徴を活かしたボケを入れること
- 説明や前置きは不要。回答のみを返してください`;
}

const callers = [
  { name: "chatgpt" as ModelName, fn: generateChatGPT },
  { name: "gemini" as ModelName, fn: generateGemini },
  { name: "claude" as ModelName, fn: generateClaude },
  { name: "deepseek" as ModelName, fn: generateDeepSeek },
];

interface GenerateResult {
  modelName: ModelName;
  text: string;
  generationTimeMs: number;
  characterId: string | null;
  modelVersion: string;
  tokenCount: number | null;
}

export async function generateAllAnswers(
  prompt: string,
  isCharacterMode: boolean = false
): Promise<GenerateResult[]> {
  const assignments: CharacterAssignment[] | null = isCharacterMode
    ? assignCharacters(callers.map((c) => c.name))
    : null;

  const results = await Promise.allSettled(
    callers.map(async (caller) => {
      const assignment = assignments?.find((a) => a.modelName === caller.name);
      const systemPrompt = assignment
        ? buildCharacterSystemPrompt(assignment.character)
        : OGIRI_SYSTEM_PROMPT;

      const response = await caller.fn(prompt, systemPrompt);
      return {
        modelName: caller.name,
        ...response,
        characterId: assignment?.character.id ?? null,
      };
    })
  );

  return results.map((result, i) => {
    if (result.status === "fulfilled") return result.value;
    return {
      modelName: callers[i].name,
      text: "(回答の生成に失敗しました)",
      generationTimeMs: 0,
      characterId: assignments?.[i]?.character.id ?? null,
      modelVersion: "",
      tokenCount: null,
    };
  });
}
