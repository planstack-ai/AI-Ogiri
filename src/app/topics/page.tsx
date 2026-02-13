import { createServerClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { TopicCard } from "@/components/topic/topic-card";
import Link from "next/link";

interface Props {
  searchParams: Promise<{ page?: string; status?: string }>;
}

export default async function TopicsPage({ searchParams }: Props) {
  const { page: pageStr, status } = await searchParams;
  const page = parseInt(pageStr ?? "1");
  const limit = 10;

  const supabase = await createServerClient();

  let query = supabase
    .from("topics")
    .select("*, answers(*), ai_judgments(*)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (status) {
    query = query.eq("status", status);
  }

  const { data: topics, count } = await query;

  const totalPages = Math.ceil((count ?? 0) / limit);

  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold text-white">
          過去の大喜利
        </h1>

        {/* フィルタ */}
        <div className="mb-6 flex gap-2">
          <Link
            href="/topics"
            className={`rounded-lg px-3 py-1.5 text-sm ${
              !status
                ? "bg-indigo-600 text-white"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            すべて
          </Link>
          <Link
            href="/topics?status=completed"
            className={`rounded-lg px-3 py-1.5 text-sm ${
              status === "completed"
                ? "bg-indigo-600 text-white"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            完了済み
          </Link>
        </div>

        {topics && topics.length > 0 ? (
          <div className="space-y-3">
            {topics.map((topic) => (
              <TopicCard key={topic.id} topic={topic} />
            ))}
          </div>
        ) : (
          <p className="text-center text-slate-500">
            大喜利がまだありません
          </p>
        )}

        {/* ページネーション */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            {page > 1 && (
              <Link
                href={`/topics?page=${page - 1}${status ? `&status=${status}` : ""}`}
                className="rounded-lg bg-slate-800 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700"
              >
                前へ
              </Link>
            )}
            <span className="text-sm text-slate-400">
              {page} / {totalPages}
            </span>
            {page < totalPages && (
              <Link
                href={`/topics?page=${page + 1}${status ? `&status=${status}` : ""}`}
                className="rounded-lg bg-slate-800 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700"
              >
                次へ
              </Link>
            )}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
