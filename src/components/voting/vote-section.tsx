"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { VoteResults } from "./vote-results";
import { MODEL_DISPLAY_NAMES, MODEL_COLORS } from "@/lib/utils/constants";
import type { Answer, VoteCount } from "@/types";

interface VoteSectionProps {
  topicId: string;
  answers: Answer[];
  voteCounts: VoteCount[];
  userVotedAnswerId: string | null;
  isLoggedIn: boolean;
}

export function VoteSection({
  topicId,
  answers,
  voteCounts,
  userVotedAnswerId,
  isLoggedIn,
}: VoteSectionProps) {
  const [votedId, setVotedId] = useState(userVotedAnswerId);
  const [counts, setCounts] = useState(voteCounts);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleVote = async (answerId: string) => {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }

    // 楽観的更新
    const prevVotedId = votedId;
    const prevCounts = counts;

    setVotedId(answerId);
    setCounts((prev) => {
      const updated = prev.map((c) => ({ ...c }));

      // 前の投票を減算
      if (prevVotedId) {
        const prevIdx = updated.findIndex(
          (c) => c.answer_id === prevVotedId
        );
        if (prevIdx >= 0) {
          updated[prevIdx] = {
            ...updated[prevIdx],
            vote_count: updated[prevIdx].vote_count - 1,
          };
        }
      }

      // 新しい投票を加算
      const idx = updated.findIndex((c) => c.answer_id === answerId);
      if (idx >= 0) {
        updated[idx] = {
          ...updated[idx],
          vote_count: updated[idx].vote_count + 1,
        };
      } else {
        updated.push({
          answer_id: answerId,
          topic_id: topicId,
          vote_count: 1,
        });
      }

      return updated;
    });

    try {
      const res = await fetch(`/api/topics/${topicId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answerId }),
      });
      if (!res.ok) throw new Error();
      startTransition(() => router.refresh());
    } catch {
      // ロールバック
      setVotedId(prevVotedId);
      setCounts(prevCounts);
    }
  };

  const totalVotes = counts.reduce((sum, c) => sum + c.vote_count, 0);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-white">ユーザー投票</h3>

      {/* 投票ボタン */}
      <div className="grid gap-2 sm:grid-cols-2">
        {answers.map((answer) => {
          const isVoted = votedId === answer.id;
          const color = MODEL_COLORS[answer.model_name] ?? "#6366f1";
          return (
            <button
              key={answer.id}
              onClick={() => handleVote(answer.id)}
              disabled={isPending}
              className={`rounded-lg border px-4 py-3 text-left text-sm font-medium transition-colors ${
                isVoted
                  ? "border-indigo-500 bg-indigo-600/20 text-white"
                  : "border-slate-600 bg-slate-800 text-slate-300 hover:border-slate-500"
              }`}
              style={isVoted ? { borderLeftWidth: "4px", borderLeftColor: color } : {}}
            >
              {MODEL_DISPLAY_NAMES[answer.model_name]} に投票
              {isVoted && " \u2713"}
            </button>
          );
        })}
      </div>

      {!isLoggedIn && (
        <p className="text-center text-sm text-slate-400">
          投票するには
          <a href="/login" className="text-indigo-400 hover:underline">
            ログイン
          </a>
          が必要です
        </p>
      )}

      {/* 投票結果 */}
      {totalVotes > 0 && (
        <VoteResults answers={answers} voteCounts={counts} total={totalVotes} />
      )}
    </div>
  );
}
