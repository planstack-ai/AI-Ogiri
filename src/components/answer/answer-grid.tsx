"use client";

import { useState, useCallback } from "react";
import { AnswerCard } from "./answer-card";
import { getCharacterById } from "@/lib/ai/characters-dataset";
import type { Answer, RankingEntry } from "@/types";

interface AnswerGridProps {
  answers: Answer[];
  rankings: RankingEntry[];
  votedAnswerId?: string | null;
  onVote?: (answerId: string) => void;
  showVoteButtons?: boolean;
  animate?: boolean;
}

export function AnswerGrid({
  answers,
  rankings,
  votedAnswerId,
  onVote,
  showVoteButtons,
  animate = false,
}: AnswerGridProps) {
  const rankMap = new Map(rankings.map((r) => [r.model_name, r]));
  const sorted = [...answers].sort((a, b) => {
    const ra = rankMap.get(a.model_name)?.rank ?? 99;
    const rb = rankMap.get(b.model_name)?.rank ?? 99;
    return ra - rb;
  });

  const [activeIndex, setActiveIndex] = useState(0);

  const handleCardComplete = useCallback((index: number) => {
    setTimeout(() => {
      setActiveIndex((prev) => Math.max(prev, index + 1));
    }, 400);
  }, []);

  return (
    <div className="grid gap-4">
      {sorted.map((answer, index) => {
        // アニメーション時は未到達のカードを描画しない（マウント時にフレッシュ状態を保証）
        if (animate && index > activeIndex) {
          return <div key={answer.id} />;
        }

        const isTyping = animate && index === activeIndex;

        return (
          <div
            key={answer.id}
            className={animate ? "animate-fade-in-up" : undefined}
          >
            <AnswerCard
              answer={answer}
              ranking={rankMap.get(answer.model_name)}
              characterName={
                answer.character_id
                  ? getCharacterById(answer.character_id)?.name
                  : undefined
              }
              animate={isTyping}
              onAnimationComplete={() => handleCardComplete(index)}
              voted={votedAnswerId === answer.id}
              onVote={onVote ? () => onVote(answer.id) : undefined}
              showVoteButton={showVoteButtons}
            />
          </div>
        );
      })}
    </div>
  );
}
