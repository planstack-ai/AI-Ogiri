import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { AnswerGrid } from "@/components/answer/answer-grid";
import { JudgeResults } from "@/components/judge/judge-results";
import { VoteSection } from "@/components/voting/vote-section";
import { ShareButton } from "@/components/share/share-button";
import {
  SITE_URL,
  SITE_NAME,
  MODEL_DISPLAY_NAMES,
} from "@/lib/utils/constants";
import type { Answer, AiJudgment } from "@/types";

interface Props {
  params: Promise<{ topicId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { topicId } = await params;
  const supabase = await createServerClient();
  const { data: topic } = await supabase
    .from("topics")
    .select("prompt")
    .eq("id", topicId)
    .single();

  if (!topic) return {};

  const title = `「${topic.prompt}」`;
  const description = `お題「${topic.prompt}」に4つのAIモデルが回答！ChatGPT・Gemini・Claude・DeepSeekの大喜利結果を見てみよう。`;
  const ogImageUrl = `${SITE_URL}/api/og/${topicId}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: ogImageUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  };
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

  // JSON-LD 構造化データ
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "QAPage",
    mainEntity: {
      "@type": "Question",
      name: topic.prompt,
      dateCreated: topic.created_at,
      answerCount: (answers as Answer[] | null)?.length ?? 0,
      ...(isCompleted && (answers as Answer[] | null)?.length
        ? {
            suggestedAnswer: (answers as Answer[]).map((a) => ({
              "@type": "Answer",
              text: a.answer_text,
              author: {
                "@type": "Organization",
                name: MODEL_DISPLAY_NAMES[a.model_name] ?? a.model_name,
              },
              dateCreated: a.created_at,
            })),
          }
        : {}),
    },
    name: `「${topic.prompt}」| ${SITE_NAME}`,
    url: `${SITE_URL}/topics/${topicId}`,
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
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
              animate
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

      <div className="mt-8 flex items-center justify-center gap-4">
        <Link
          href="/topics"
          className="rounded-lg border border-slate-600 px-5 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
        >
          一覧に戻る
        </Link>
        <Link
          href="/topics/new"
          className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
        >
          新しいお題を投稿
        </Link>
      </div>
    </div>
  );
}
