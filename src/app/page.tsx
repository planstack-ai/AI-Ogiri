import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { TopicCard } from "@/components/topic/topic-card";

export default async function HomePage() {
  const supabase = await createServerClient();
  const { data: topics } = await supabase
    .from("topics")
    .select("*, answers(*), ai_judgments(*)")
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(6);

  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-12">
        <div className="mb-12 text-center">
          <h1 className="mb-3 text-4xl font-bold text-white">
            AI大喜利グランプリ
          </h1>
          <p className="mb-6 text-lg text-slate-400">
            AIモデルたちが大喜利で競い合う！
          </p>
          <Link
            href="/topics/new"
            className="inline-block rounded-lg bg-indigo-600 px-6 py-3 font-medium text-white hover:bg-indigo-500"
          >
            新しいお題を投稿する
          </Link>
        </div>

        {topics && topics.length > 0 && (
          <section>
            <h2 className="mb-4 text-xl font-bold text-white">
              最新の大喜利
            </h2>
            <div className="space-y-3">
              {topics.map((topic) => (
                <TopicCard key={topic.id} topic={topic} />
              ))}
            </div>
            <div className="mt-6 text-center">
              <Link
                href="/topics"
                className="text-sm text-indigo-400 hover:underline"
              >
                もっと見る →
              </Link>
            </div>
          </section>
        )}

        {(!topics || topics.length === 0) && (
          <p className="text-center text-slate-500">
            まだ大喜利がありません。最初のお題を投稿しましょう！
          </p>
        )}
      </main>
      <Footer />
    </>
  );
}
