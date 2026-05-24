"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AI_WOLF_MAX_DEBATE_TURNS,
  AI_WOLF_MAX_HUNT_TURNS,
  AI_WOLF_MIN_DEBATE_TURNS,
  AI_WOLF_MIN_HUNT_TURNS,
  AI_WOLF_TOPIC_PRESETS,
} from "@/lib/ai-wolf/constants";
import type {
  AiWolfMessage,
  AiWolfParticipant,
  AiWolfSession,
  AiWolfStreamEvent,
  AiWolfTopicPreset,
} from "@/lib/ai-wolf/types";

const INITIAL_PRESET = AI_WOLF_TOPIC_PRESETS[0];

type ThinkingState = Extract<AiWolfStreamEvent, { type: "thinking" }>;

function ModelDot({ color }: { color: string }) {
  return (
    <span
      className="h-2.5 w-2.5 shrink-0 rounded-full"
      style={{ backgroundColor: color }}
    />
  );
}

function ParticipantPill({ participant }: { participant: AiWolfParticipant }) {
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium text-white"
      style={{
        borderColor: `${participant.color}80`,
        backgroundColor: `${participant.color}18`,
      }}
    >
      <ModelDot color={participant.color} />
      {participant.name}
    </span>
  );
}

function TeamRoster({
  title,
  stance,
  participants,
  accent,
}: {
  title: string;
  stance: string;
  participants: AiWolfParticipant[];
  accent: string;
}) {
  return (
    <div className="border-l-4 py-1 pl-4" style={{ borderLeftColor: accent }}>
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
        {title}
      </p>
      <p className="mt-1 text-lg font-bold text-white">{stance}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {participants.map((participant) => (
          <ParticipantPill key={participant.id} participant={participant} />
        ))}
      </div>
    </div>
  );
}

function ModeratorNote({
  label,
  note,
  session,
}: {
  label: string;
  note: string;
  session: AiWolfSession;
}) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800/70 px-4 py-3">
      <div className="mb-1 flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-400">
        <span>{label}</span>
        <span className="text-slate-600">/</span>
        <span
          className="inline-flex items-center gap-1.5 text-slate-200"
          style={{ color: session.moderator.color }}
        >
          <ModelDot color={session.moderator.color} />
          {session.moderator.name}
        </span>
      </div>
      <p className="text-sm leading-6 text-slate-200">{note}</p>
    </div>
  );
}

function ThinkingCard({
  thinking,
  session,
}: {
  thinking: ThinkingState;
  session: AiWolfSession;
}) {
  const speaker =
    session.participants.find(
      (participant) => participant.id === thinking.speakerId
    ) ??
    (session.moderator.id === thinking.speakerId ? session.moderator : null);
  const color = speaker?.color ?? "#22d3ee";

  return (
    <div
      className="rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-4 py-3"
      style={{ borderLeftWidth: 4, borderLeftColor: color }}
    >
      <div className="mb-2 flex flex-wrap items-center gap-2 text-sm font-bold text-cyan-100">
        <span className="relative flex h-2.5 w-2.5">
          <span
            className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60"
            style={{ backgroundColor: color }}
          />
          <span
            className="relative inline-flex h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: color }}
          />
        </span>
        <span>思考中...</span>
        <span className="text-slate-300">{thinking.speakerName}</span>
      </div>
      <p className="text-sm text-slate-300">{thinking.label}</p>
    </div>
  );
}

function ThreadMessage({
  message,
  session,
}: {
  message: AiWolfMessage;
  session: AiWolfSession;
}) {
  const speaker = session.participants.find(
    (participant) => participant.id === message.speakerId
  );
  const accused = session.participants.find(
    (participant) => participant.id === message.accusedModelId
  );
  const color = speaker?.color ?? "#6366f1";

  return (
    <article
      className="rounded-lg border border-slate-700 bg-slate-800 p-4"
      style={{ borderLeftWidth: 4, borderLeftColor: color }}
    >
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-slate-700 px-2.5 py-1 text-xs font-bold text-slate-200">
          {message.phase === "debate" ? "討論" : "炙り出し"} {message.turn}
        </span>
        <span
          className="inline-flex items-center gap-2 text-sm font-bold text-white"
          style={{ color }}
        >
          <ModelDot color={color} />
          {message.speakerName}
        </span>
        <span className="text-xs text-slate-500">陣営{message.team}</span>
        {accused && (
          <span className="rounded-full bg-rose-500/15 px-2.5 py-1 text-xs font-medium text-rose-200">
            疑い先: {accused.name}
          </span>
        )}
      </div>
      <p className="whitespace-pre-wrap text-[15px] leading-7 text-slate-100">
        {message.text}
      </p>
    </article>
  );
}

function SessionSummary({ session }: { session: AiWolfSession }) {
  return (
    <section className="rounded-xl border border-slate-700 bg-slate-800/70 p-5">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-400">テーマ</p>
          <h2 className="mt-1 text-2xl font-bold text-white">
            {session.topic}
          </h2>
        </div>
        <div className="rounded-full border border-slate-600 px-3 py-1.5 text-sm text-slate-300">
          司会:{" "}
          <span style={{ color: session.moderator.color }}>
            {session.moderator.name}
          </span>
        </div>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <TeamRoster
          title="Team A"
          stance={session.stanceA}
          participants={session.teams.A}
          accent="#38bdf8"
        />
        <TeamRoster
          title="Team B"
          stance={session.stanceB}
          participants={session.teams.B}
          accent="#f97316"
        />
      </div>
    </section>
  );
}

function VotePanel({ session }: { session: AiWolfSession }) {
  const [votedId, setVotedId] = useState<string | null>(null);
  const voted = session.participants.find(
    (participant) => participant.id === votedId
  );
  const aiAccusations = useMemo(
    () =>
      session.participants
        .map((participant) => ({
          participant,
          count: session.huntMessages.filter(
            (message) => message.accusedModelId === participant.id
          ).length,
        }))
        .sort((a, b) => b.count - a.count),
    [session]
  );
  const maxAiVotes = Math.max(
    1,
    ...aiAccusations.map((accusation) => accusation.count)
  );

  return (
    <section className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-5">
      <div className="mb-4">
        <p className="text-sm font-bold uppercase tracking-wide text-rose-200">
          Human Vote
        </p>
        <h2 className="mt-1 text-xl font-bold text-white">
          一番人間ぽいAIをアウトにする
        </h2>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {session.participants.map((participant) => {
          const selected = votedId === participant.id;
          return (
            <button
              key={participant.id}
              type="button"
              onClick={() => setVotedId(participant.id)}
              className="min-h-14 rounded-lg border px-4 py-3 text-left text-sm font-bold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
              style={{
                borderColor: selected ? participant.color : "#475569",
                backgroundColor: selected ? `${participant.color}25` : "#1e293b",
              }}
            >
              <span className="flex items-center gap-2">
                <ModelDot color={participant.color} />
                {participant.name}
                {selected && <span className="text-rose-200">OUT</span>}
              </span>
            </button>
          );
        })}
      </div>

      {voted && (
        <div className="mt-4 rounded-lg border border-rose-400/40 bg-slate-950/30 px-4 py-3">
          <p className="text-sm text-slate-300">今回のペナルティ対象</p>
          <p className="mt-1 text-lg font-bold text-white">
            <span style={{ color: voted.color }}>{voted.name}</span> が人間ぽい判定でアウト
          </p>
        </div>
      )}

      <div className="mt-5 space-y-3">
        <p className="text-sm font-bold text-slate-200">AI同士の疑い先</p>
        {aiAccusations.map(({ participant, count }) => (
          <div key={participant.id}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="inline-flex items-center gap-2 text-slate-200">
                <ModelDot color={participant.color} />
                {participant.name}
              </span>
              <span className="text-slate-400">{count}票</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-700">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(count / maxAiVotes) * 100}%`,
                  backgroundColor: participant.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function applyModeratorEvent(
  session: AiWolfSession,
  event: Extract<AiWolfStreamEvent, { type: "moderator" }>
): AiWolfSession {
  return {
    ...session,
    moderatorNotes: {
      ...session.moderatorNotes,
      [event.kind]: event.text,
    },
  };
}

function applyMessageEvent(
  session: AiWolfSession,
  message: AiWolfMessage
): AiWolfSession {
  if (message.phase === "debate") {
    return {
      ...session,
      debateMessages: [...session.debateMessages, message],
    };
  }

  return {
    ...session,
    huntMessages: [...session.huntMessages, message],
  };
}

export function AiWolfSessionView({
  session,
  thinking,
  completed = true,
  showVote = true,
}: {
  session: AiWolfSession;
  thinking?: ThinkingState | null;
  completed?: boolean;
  showVote?: boolean;
}) {
  return (
    <>
      <SessionSummary session={session} />

      <section className="space-y-3">
        {session.moderatorNotes.opening && (
          <ModeratorNote
            label="Opening"
            note={session.moderatorNotes.opening}
            session={session}
          />
        )}
        <div className="space-y-3">
          {session.debateMessages.map((message) => (
            <ThreadMessage key={message.id} message={message} session={session} />
          ))}
        </div>
        {session.moderatorNotes.transition && (
          <ModeratorNote
            label="Phase Change"
            note={session.moderatorNotes.transition}
            session={session}
          />
        )}
        <div className="space-y-3">
          {session.huntMessages.map((message) => (
            <ThreadMessage key={message.id} message={message} session={session} />
          ))}
        </div>
        {session.moderatorNotes.closing && (
          <ModeratorNote
            label="Vote"
            note={session.moderatorNotes.closing}
            session={session}
          />
        )}
        {thinking && <ThinkingCard thinking={thinking} session={session} />}
      </section>

      {completed && showVote && <VotePanel session={session} />}
    </>
  );
}

export function AiWolfGame() {
  const [topic, setTopic] = useState(INITIAL_PRESET.topic);
  const [stanceA, setStanceA] = useState(INITIAL_PRESET.stanceA);
  const [stanceB, setStanceB] = useState(INITIAL_PRESET.stanceB);
  const [debateTurns, setDebateTurns] = useState(AI_WOLF_MIN_DEBATE_TURNS);
  const [huntTurns, setHuntTurns] = useState(AI_WOLF_MIN_HUNT_TURNS);
  const [session, setSession] = useState<AiWolfSession | null>(null);
  const [thinking, setThinking] = useState<ThinkingState | null>(null);
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectPreset = (preset: AiWolfTopicPreset) => {
    setTopic(preset.topic);
    setStanceA(preset.stanceA);
    setStanceB(preset.stanceB);
  };
  const generatedTurnCount =
    (session?.debateMessages.length ?? 0) + (session?.huntMessages.length ?? 0);
  const totalTurnCount = debateTurns + huntTurns;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSession(null);
    setThinking(null);
    setCompleted(false);

    try {
      const response = await fetch("/api/ai-wolf/generate", {
        method: "POST",
        headers: {
          Accept: "application/x-ndjson",
          "Content-Type": "application/json",
          "X-AI-Wolf-Stream": "1",
        },
        body: JSON.stringify({
          topic,
          stanceA,
          stanceB,
          debateTurns,
          huntTurns,
        }),
      });
      if (!response.ok) throw new Error("生成に失敗しました");
      if (!response.body) {
        const nextSession = (await response.json()) as AiWolfSession;
        setSession(nextSession);
        setCompleted(true);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      const applyEvent = (streamEvent: AiWolfStreamEvent) => {
        if (streamEvent.type === "session") {
          setSession(streamEvent.session);
          return;
        }

        if (streamEvent.type === "thinking") {
          setThinking(streamEvent);
          return;
        }

        if (streamEvent.type === "moderator") {
          setThinking(null);
          setSession((current) =>
            current ? applyModeratorEvent(current, streamEvent) : current
          );
          return;
        }

        if (streamEvent.type === "message") {
          setThinking(null);
          setSession((current) =>
            current
              ? applyMessageEvent(current, streamEvent.message)
              : current
          );
          return;
        }

        if (streamEvent.type === "done") {
          setThinking(null);
          setSession(streamEvent.session);
          setCompleted(true);
          return;
        }

        if (streamEvent.type === "error") {
          setError(streamEvent.message);
        }
      };

      const parseLines = (chunk: string) => {
        buffer += chunk;
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.trim()) continue;
          applyEvent(JSON.parse(line) as AiWolfStreamEvent);
        }
      };

      while (true) {
        const { value, done } = await reader.read();
        if (value) {
          parseLines(decoder.decode(value, { stream: !done }));
        }
        if (done) break;
      }

      parseLines(decoder.decode());
      if (buffer.trim()) {
        applyEvent(JSON.parse(buffer) as AiWolfStreamEvent);
      }
    } catch {
      setError("討論を生成できませんでした。もう一度試してください。");
    } finally {
      setLoading(false);
      setThinking(null);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
      <aside className="lg:sticky lg:top-6 lg:self-start">
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-slate-700 bg-slate-800/70 p-5"
        >
          <div className="mb-5">
            <p className="text-sm font-bold uppercase tracking-wide text-cyan-300">
              AI Werewolf
            </p>
            <div className="mt-1 flex items-center justify-between gap-3">
              <h1 className="text-3xl font-bold text-white">AI狼</h1>
              <Link
                href="/ai-wolf/archive"
                className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-cyan-400 hover:text-white"
              >
                アーカイブ
              </Link>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              4体が討論し、残り1体が司会。最後に人間ぽいAIをアウトにします。
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="ai-wolf-topic"
                className="mb-1.5 block text-sm font-medium text-slate-200"
              >
                テーマ
              </label>
              <input
                id="ai-wolf-topic"
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                maxLength={80}
                className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2.5 text-white placeholder-slate-400 focus:border-cyan-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div>
                <label
                  htmlFor="ai-wolf-stance-a"
                  className="mb-1.5 block text-sm font-medium text-slate-200"
                >
                  陣営A
                </label>
                <input
                  id="ai-wolf-stance-a"
                  value={stanceA}
                  onChange={(event) => setStanceA(event.target.value)}
                  maxLength={40}
                  className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2.5 text-white placeholder-slate-400 focus:border-cyan-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                />
              </div>
              <div>
                <label
                  htmlFor="ai-wolf-stance-b"
                  className="mb-1.5 block text-sm font-medium text-slate-200"
                >
                  陣営B
                </label>
                <input
                  id="ai-wolf-stance-b"
                  value={stanceB}
                  onChange={(event) => setStanceB(event.target.value)}
                  maxLength={40}
                  className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2.5 text-white placeholder-slate-400 focus:border-cyan-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                />
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-slate-200">
                プリセット
              </p>
              <div className="flex flex-wrap gap-2">
                {AI_WOLF_TOPIC_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => selectPreset(preset)}
                    className="rounded-full border border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-cyan-400 hover:text-white"
                  >
                    {preset.topic}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label
                  htmlFor="ai-wolf-debate-turns"
                  className="text-sm font-medium text-slate-200"
                >
                  討論ターン
                </label>
                <span className="text-sm font-bold text-white">
                  {debateTurns}
                </span>
              </div>
              <input
                id="ai-wolf-debate-turns"
                type="range"
                min={AI_WOLF_MIN_DEBATE_TURNS}
                max={AI_WOLF_MAX_DEBATE_TURNS}
                step={1}
                value={debateTurns}
                onChange={(event) => setDebateTurns(Number(event.target.value))}
                className="w-full accent-cyan-400"
              />
              <div className="mt-1 flex justify-between text-xs text-slate-500">
                <span>{AI_WOLF_MIN_DEBATE_TURNS}</span>
                <span>{AI_WOLF_MAX_DEBATE_TURNS}</span>
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label
                  htmlFor="ai-wolf-hunt-turns"
                  className="text-sm font-medium text-slate-200"
                >
                  炙り出しターン
                </label>
                <span className="text-sm font-bold text-white">
                  {huntTurns}
                </span>
              </div>
              <input
                id="ai-wolf-hunt-turns"
                type="range"
                min={AI_WOLF_MIN_HUNT_TURNS}
                max={AI_WOLF_MAX_HUNT_TURNS}
                value={huntTurns}
                onChange={(event) => setHuntTurns(Number(event.target.value))}
                className="w-full accent-rose-400"
              />
            </div>

            {error && (
              <p className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                {error}
              </p>
            )}

            {loading && (
              <div className="rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-3 py-2">
                <div className="mb-1 flex items-center justify-between text-xs font-bold text-cyan-100">
                  <span>進行中</span>
                  <span>
                    {generatedTurnCount}/{totalTurnCount} turns
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-700">
                  <div
                    className="h-full rounded-full bg-cyan-400 transition-all duration-500"
                    style={{
                      width: `${Math.max(
                        6,
                        (generatedTurnCount / totalTurnCount) * 100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !topic.trim() || !stanceA.trim() || !stanceB.trim()}
              className="w-full rounded-lg bg-cyan-500 px-4 py-3 text-sm font-bold text-slate-950 transition-colors hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "AI同士が討論中..." : session ? "もう一戦生成" : "討論を開始"}
            </button>
          </div>
        </form>
      </aside>

      <main className="min-w-0 space-y-5">
        {session ? (
          <AiWolfSessionView
            session={session}
            thinking={thinking}
            completed={completed}
          />
        ) : (
          <section className="rounded-xl border border-slate-700 bg-slate-800/70 p-6">
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-slate-400">
                  Lineup
                </p>
                <p className="mt-2 text-2xl font-bold text-white">
                  5体から4体を抽選
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-400">
                  抽選で外れた1体が司会になり、討論者4体が2対2で議論します。
                </p>
              </div>
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-slate-400">
                  Flow
                </p>
                <div className="mt-3 space-y-3 text-sm text-slate-300">
                  <p>1. 陣営A/Bの討論</p>
                  <p>2. AI同士の人間炙り出し</p>
                  <p>3. 観戦者が人間ぽいAIへ投票</p>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
