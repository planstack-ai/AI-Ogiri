export function buildXShareUrl(
  topic: { id: string; prompt: string },
  siteUrl: string
): string {
  const topicUrl = `${siteUrl}/topics/${topic.id}`;
  const text = `AI大喜利のお題: 「${topic.prompt}」\n\n4つのAIモデルが回答した結果はこちら!\n${topicUrl}\n\n#AI大喜利`;
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
}
