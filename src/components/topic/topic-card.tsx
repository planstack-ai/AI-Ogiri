import Link from "next/link";
import { MODEL_DISPLAY_NAMES } from "@/lib/utils/constants";
import type { Topic, Answer, AiJudgment } from "@/types";

interface TopicCardProps {
  topic: Topic & { answers: Answer[]; ai_judgments: AiJudgment[] };
}

export function TopicCard({ topic }: TopicCardProps) {
  const judgment = topic.ai_judgments?.[0];
  const winner = judgment?.rankings?.sort(
    (a, b) => a.rank - b.rank
  )[0];

  const timeAgo = getTimeAgo(topic.created_at);

  return (
    <Link
      href={`/topics/${topic.id}`}
      className="block rounded-xl border border-slate-700 bg-slate-800 p-5 transition-colors hover:border-slate-600"
    >
      <p className="mb-2 text-lg font-medium text-white">
        {topic.prompt}
      </p>
      <div className="flex items-center gap-3 text-sm text-slate-400">
        {topic.status === "completed" && winner && (
          <span>
            優勝: {MODEL_DISPLAY_NAMES[winner.model_name] ?? winner.model_name}{" "}
            {"\u{1f3c6}"}
          </span>
        )}
        {topic.status !== "completed" && (
          <span className="text-amber-400">
            {topic.status === "generating"
              ? "生成中..."
              : topic.status === "judging"
                ? "審査中..."
                : "待機中"}
          </span>
        )}
        <span>{timeAgo}</span>
      </div>
    </Link>
  );
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "たった今";
  if (minutes < 60) return `${minutes}分前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}時間前`;
  const days = Math.floor(hours / 24);
  return `${days}日前`;
}
