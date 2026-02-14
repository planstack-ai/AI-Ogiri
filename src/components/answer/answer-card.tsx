"use client";

import { useState } from "react";
import { MODEL_DISPLAY_NAMES, MODEL_COLORS } from "@/lib/utils/constants";
import { TypewriterText } from "./typewriter-text";
import type { Answer, RankingEntry } from "@/types";

const RANK_BADGES: Record<number, string> = {
  1: "1st",
  2: "2nd",
  3: "3rd",
  4: "4th",
};

const RANK_EMOJI: Record<number, string> = {
  1: "\u{1f947}",
  2: "\u{1f948}",
  3: "\u{1f949}",
};

interface AnswerCardProps {
  answer: Answer;
  ranking?: RankingEntry;
  characterName?: string;
  voted?: boolean;
  onVote?: () => void;
  showVoteButton?: boolean;
  animate?: boolean;
  onAnimationComplete?: () => void;
}

export function AnswerCard({
  answer,
  ranking,
  characterName,
  voted,
  onVote,
  showVoteButton,
  animate,
  onAnimationComplete,
}: AnswerCardProps) {
  const [typingDone, setTypingDone] = useState(!animate);
  const rank = ranking?.rank ?? 4;
  const color = MODEL_COLORS[answer.model_name] ?? "#6366f1";

  const handleTypingComplete = () => {
    setTypingDone(true);
    onAnimationComplete?.();
  };

  return (
    <div
      className="rounded-xl border border-slate-700 bg-slate-800 p-5"
      style={{ borderLeftWidth: "4px", borderLeftColor: color }}
    >
      <div className="mb-3 flex items-center justify-between">
        <div>
          <span className="font-bold text-white">
            {typingDone && RANK_EMOJI[rank] ? `${RANK_EMOJI[rank]} ` : ""}
            {MODEL_DISPLAY_NAMES[answer.model_name]}
          </span>
          {characterName && (
            <span className="ml-2 text-sm text-amber-400">
              as {characterName}
            </span>
          )}
        </div>
        <span
          className={`rounded-full bg-slate-700 px-2 py-0.5 text-xs text-slate-300 transition-opacity duration-300 ${
            typingDone ? "opacity-100" : "opacity-0"
          }`}
        >
          {RANK_BADGES[rank]}
          {ranking?.score != null && ` (${ranking.score}pts)`}
        </span>
      </div>
      <p className="mb-3 whitespace-pre-wrap text-slate-200">
        {animate && !typingDone ? (
          <TypewriterText
            text={answer.answer_text}
            onComplete={handleTypingComplete}
          />
        ) : (
          answer.answer_text
        )}
      </p>
      <div
        className={`transition-opacity duration-300 ${
          typingDone ? "opacity-100" : "opacity-0"
        }`}
      >
        {ranking?.reasoning && (
          <p className="mb-3 text-xs text-slate-400">{ranking.reasoning}</p>
        )}
        <div className="flex items-center justify-between">
          {answer.generation_time_ms != null && (
            <span className="text-xs text-slate-500">
              {(answer.generation_time_ms / 1000).toFixed(1)}s
            </span>
          )}
          {showVoteButton && onVote && (
            <button
              onClick={onVote}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                voted
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
            >
              {voted ? "投票済み" : "投票する"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
