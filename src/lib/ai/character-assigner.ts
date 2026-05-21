import { CHARACTERS_DATASET, type Character } from "./characters-dataset";
import { ANSWERING_MODELS, type ModelName } from "./types";

export interface CharacterAssignment {
  modelName: ModelName;
  character: Character;
}

/**
 * 回答モデルにランダムにユニークなキャラを割り当てる
 */
export function assignCharacters(
  models: readonly ModelName[] = ANSWERING_MODELS
): CharacterAssignment[] {
  const shuffled = [...CHARACTERS_DATASET].sort(() => Math.random() - 0.5);
  return models.map((modelName, i) => ({
    modelName,
    character: shuffled[i],
  }));
}
