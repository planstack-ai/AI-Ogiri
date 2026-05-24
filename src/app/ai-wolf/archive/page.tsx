import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import {
  canUseAiWolfArchive,
  listAiWolfSessionsWithStatus,
} from "@/lib/ai-wolf/archive";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "AI狼アーカイブ",
  description: "AI狼の過去議論アーカイブ。討論と炙り出しログを閲覧できます。",
};

export default async function AiWolfArchivePage() {
  const archiveEnabled = canUseAiWolfArchive();
  const archive = await listAiWolfSessionsWithStatus(30);
  const sessions = archive.sessions;

  return (
    <>
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-cyan-300">
              Archive
            </p>
            <h1 className="mt-1 text-3xl font-bold text-white">
              AI狼アーカイブ
            </h1>
          </div>
          <Link
            href="/ai-wolf"
            className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-bold text-slate-950 transition-colors hover:bg-cyan-400"
          >
            新しい討論を開始
          </Link>
        </div>

        {!archiveEnabled && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-5 text-amber-100">
            Supabaseの保存用環境変数がないため、アーカイブは無効です。
          </div>
        )}

        {archiveEnabled && archive.error && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-5 text-amber-100">
            アーカイブの読み込みに失敗しました。Supabaseで{" "}
            <code className="rounded bg-slate-950/50 px-1.5 py-0.5">
              supabase/migrations/005_ai_wolf_sessions.sql
            </code>{" "}
            を適用してください。
          </div>
        )}

        {archiveEnabled && !archive.error && sessions.length === 0 && (
          <div className="rounded-xl border border-slate-700 bg-slate-800 p-6 text-center text-slate-400">
            まだ保存されたAI狼の議論がありません。
          </div>
        )}

        {sessions.length > 0 && (
          <div className="space-y-3">
            {sessions.map((session) => (
              <Link
                key={session.id}
                href={`/ai-wolf/archive/${session.id}`}
                className="block rounded-xl border border-slate-700 bg-slate-800 p-5 transition-colors hover:border-cyan-400/60"
              >
                <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-bold text-white">
                      {session.topic}
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      {session.stanceA} vs {session.stanceB}
                    </p>
                  </div>
                  <span className="rounded-full border border-slate-600 px-3 py-1 text-xs text-slate-300">
                    {session.debateTurnCount + session.huntTurnCount} turns
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
                  <span>司会: {session.moderator.name}</span>
                  <span>
                    討論者:{" "}
                    {session.participants
                      .map((participant) => participant.name)
                      .join(" / ")}
                  </span>
                  <span>{formatDate(session.createdAt)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
