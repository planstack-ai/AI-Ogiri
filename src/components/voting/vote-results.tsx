import { MODEL_DISPLAY_NAMES, MODEL_COLORS } from "@/lib/utils/constants";
import type { Answer, VoteCount } from "@/types";

interface VoteResultsProps {
  answers: Answer[];
  voteCounts: VoteCount[];
  total: number;
}

export function VoteResults({ answers, voteCounts, total }: VoteResultsProps) {
  const countMap = new Map(voteCounts.map((c) => [c.answer_id, c.vote_count]));

  const sorted = [...answers].sort(
    (a, b) => (countMap.get(b.id) ?? 0) - (countMap.get(a.id) ?? 0)
  );

  return (
    <div className="space-y-3">
      {sorted.map((answer) => {
        const count = countMap.get(answer.id) ?? 0;
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        const color = MODEL_COLORS[answer.model_name] ?? "#6366f1";

        return (
          <div key={answer.id}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="text-slate-300">
                {MODEL_DISPLAY_NAMES[answer.model_name]}
              </span>
              <span className="text-slate-400">
                {pct}% ({count}票)
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-slate-700">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, backgroundColor: color }}
              />
            </div>
          </div>
        );
      })}
      <p className="text-right text-xs text-slate-500">合計 {total} 票</p>
    </div>
  );
}
