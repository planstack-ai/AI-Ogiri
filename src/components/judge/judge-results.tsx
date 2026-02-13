import type { AiJudgment } from "@/types";

interface JudgeResultsProps {
  judgment: AiJudgment;
}

export function JudgeResults({ judgment }: JudgeResultsProps) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800 p-5">
      <h3 className="mb-3 text-lg font-bold text-white">AI審査員の講評</h3>
      {judgment.overall_comment && (
        <p className="text-sm text-slate-300">{judgment.overall_comment}</p>
      )}
    </div>
  );
}
