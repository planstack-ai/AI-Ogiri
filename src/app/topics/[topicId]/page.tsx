import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { AnswerGrid } from "@/components/answer/answer-grid";
import { JudgeResults } from "@/components/judge/judge-results";
import { VoteSection } from "@/components/voting/vote-section";
import { ShareButton } from "@/components/share/share-button";
import type { Answer, AiJudgment } from "@/types";

interface Props {
  params: Promise<{ topicId: string }>;
}

export default async function TopicDetailPage({ params }: Props) {
  const { topicId } = await params;
  const supabase = await createServerClient();

  const { data: topic } = await supabase
    .from("topics")
    .select("*")
    .eq("id", topicId)
    .single();

  if (!topic) notFound();

  const [{ data: answers }, { data: judgments }, { data: { user } }] =
    await Promise.all([
      supabase
        .from("answers")
        .select("*")
        .eq("topic_id", topicId),
      supabase
        .from("ai_judgments")
        .select("*")
        .eq("topic_id", topicId),
      supabase.auth.getUser(),
    ]);

  const judgment = (judgments as AiJudgment[] | null)?.[0];
  const rankings = judgment?.rankings ?? [];
  const isCompleted = topic.status === "completed";

  // ユーザーの投票状態
  let userVotedAnswerId: string | null = null;
  if (user) {
    const { data: vote } = await supabase
      .from("votes")
      .select("answer_id")
      .eq("topic_id", topicId)
      .eq("user_id", user.id)
      .single();
    userVotedAnswerId = vote?.answer_id ?? null;
  }

  // 投票集計
  const { data: voteCounts } = await supabase
    .from("vote_counts")
    .select("*")
    .eq("topic_id", topicId);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8">
        <p className="mb-2 text-sm text-slate-400">お題</p>
        <h1 className="text-2xl font-bold text-white">
          「{topic.prompt}」
        </h1>
      </div>

      {!isCompleted && (
        <div className="mb-8 rounded-xl border border-amber-500/30 bg-amber-500/10 p-6 text-center">
          <p className="text-amber-300">
            {topic.status === "generating"
              ? "AIモデルが回答を生成中..."
              : topic.status === "judging"
                ? "AI審査員が審査中..."
                : "待機中..."}
          </p>
          <p className="mt-2 text-sm text-slate-400">
            ページを更新して結果を確認してください
          </p>
        </div>
      )}

      {isCompleted && (answers as Answer[] | null)?.length && (
        <>
          <div className="mb-8">
            <AnswerGrid
              answers={answers as Answer[]}
              rankings={rankings}
            />
          </div>

          {judgment && (
            <div className="mb-8">
              <JudgeResults judgment={judgment} />
            </div>
          )}

          <div className="mb-8">
            <VoteSection
              topicId={topicId}
              answers={answers as Answer[]}
              voteCounts={voteCounts ?? []}
              userVotedAnswerId={userVotedAnswerId}
              isLoggedIn={!!user}
            />
          </div>

          <div className="text-center">
            <ShareButton topicId={topicId} prompt={topic.prompt} />
          </div>
        </>
      )}
    </div>
  );
}
