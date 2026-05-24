import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AiWolfSessionView } from "@/components/ai-wolf/ai-wolf-game";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { getAiWolfSession } from "@/lib/ai-wolf/archive";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ sessionId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { sessionId } = await params;
  const session = await getAiWolfSession(sessionId);

  if (!session) return {};

  return {
    title: `AI狼「${session.topic}」`,
    description: `AI狼アーカイブ「${session.topic}」。${session.stanceA} vs ${session.stanceB} の討論ログ。`,
  };
}

export default async function AiWolfArchiveDetailPage({ params }: Props) {
  const { sessionId } = await params;
  const session = await getAiWolfSession(sessionId);

  if (!session) notFound();

  return (
    <>
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/ai-wolf/archive"
            className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-700"
          >
            アーカイブに戻る
          </Link>
          <Link
            href="/ai-wolf"
            className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-bold text-slate-950 transition-colors hover:bg-cyan-400"
          >
            新しい討論を開始
          </Link>
        </div>
        <div className="space-y-5">
          <AiWolfSessionView session={session} showVote={false} />
        </div>
      </main>
      <Footer />
    </>
  );
}
