"use client";

import { AnswerCard } from "./answer-card";
import type { Answer, RankingEntry } from "@/types";

interface AnswerGridProps {
  answers: Answer[];
  rankings: RankingEntry[];
  votedAnswerId?: string | null;
  onVote?: (answerId: string) => void;
  showVoteButtons?: boolean;
}

export function AnswerGrid({
  answers,
  rankings,
  votedAnswerId,
  onVote,
  showVoteButtons,
}: AnswerGridProps) {
  const rankMap = new Map(rankings.map((r) => [r.model_name, r]));
  const sorted = [...answers].sort((a, b) => {
    const ra = rankMap.get(a.model_name)?.rank ?? 99;
    const rb = rankMap.get(b.model_name)?.rank ?? 99;
    return ra - rb;
  });

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {sorted.map((answer) => (
        <AnswerCard
          key={answer.id}
          answer={answer}
          ranking={rankMap.get(answer.model_name)}
          voted={votedAnswerId === answer.id}
          onVote={onVote ? () => onVote(answer.id) : undefined}
          showVoteButton={showVoteButtons}
        />
      ))}
    </div>
  );
}
