import { CHARACTERS_DATASET, type Character } from "./characters-dataset";
import type { ModelName } from "./types";

export interface CharacterAssignment {
  modelName: ModelName;
  character: Character;
}

/**
 * 4モデルにランダムにユニークなキャラを割り当てる
 */
export function assignCharacters(
  models: ModelName[] = ["chatgpt", "gemini", "claude", "deepseek"]
): CharacterAssignment[] {
  const shuffled = [...CHARACTERS_DATASET].sort(() => Math.random() - 0.5);
  return models.map((modelName, i) => ({
    modelName,
    character: shuffled[i],
  }));
}
