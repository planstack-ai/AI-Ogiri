import { OGIRI_TOPICS_DATASET, type TopicEntry, type TopicCategory } from "./ogiri-topics-dataset";

/**
 * データセットからカテゴリ分散でランダム N 件をサンプルする
 */
export function sampleTopics(count: number = 5): TopicEntry[] {
  const byCategory = new Map<TopicCategory, TopicEntry[]>();
  for (const entry of OGIRI_TOPICS_DATASET) {
    const list = byCategory.get(entry.category) ?? [];
    list.push(entry);
    byCategory.set(entry.category, list);
  }

  const categories = [...byCategory.keys()];
  const result: TopicEntry[] = [];
  const used = new Set<string>();

  // ラウンドロビンでカテゴリから均等に選ぶ
  let catIndex = Math.floor(Math.random() * categories.length);
  while (result.length < count) {
    const cat = categories[catIndex % categories.length];
    const pool = byCategory.get(cat)!.filter((e) => !used.has(e.topic));
    if (pool.length > 0) {
      const picked = pool[Math.floor(Math.random() * pool.length)];
      result.push(picked);
      used.add(picked.topic);
    }
    catIndex++;
    // 全て使い切った場合は終了
    if (used.size >= OGIRI_TOPICS_DATASET.length) break;
  }

  return result;
}
