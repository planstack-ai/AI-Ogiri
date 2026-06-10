"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { TopicStatus } from "@/types";

interface GenerationStatusProps {
  topicId: string;
  status: TopicStatus;
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { error?: string };
    if (payload.error) return payload.error;
  } catch {
    // Fall through to the generic message below.
  }

  return `生成に失敗しました（HTTP ${response.status}）`;
}

function getStatusMessage(status: TopicStatus, isTriggering: boolean) {
  if (status === "pending" && isTriggering) {
    return "AI生成を開始しています...";
  }
  if (status === "generating") {
    return "AIモデルが回答を生成中...";
  }
  if (status === "judging") {
    return "AI審査員が審査中...";
  }

  return "待機中...";
}

export function GenerationStatus({ topicId, status }: GenerationStatusProps) {
  const router = useRouter();
  const hasTriggered = useRef(false);
  const [isTriggering, setIsTriggering] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const triggerGeneration = useCallback(async () => {
    setErrorMessage(null);
    setIsTriggering(true);

    try {
      const response = await fetch(`/api/topics/${topicId}/generate`, {
        method: "POST",
      });

      if (!response.ok && response.status !== 409) {
        throw new Error(await readErrorMessage(response));
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "生成に失敗しました"
      );
    } finally {
      setIsTriggering(false);
      router.refresh();
    }
  }, [router, topicId]);

  useEffect(() => {
    if (status !== "pending" || hasTriggered.current) return;

    hasTriggered.current = true;
    void triggerGeneration();
  }, [status, triggerGeneration]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      router.refresh();
    }, 3000);

    return () => window.clearInterval(interval);
  }, [router]);

  return (
    <div className="mb-8 rounded-xl border border-amber-500/30 bg-amber-500/10 p-6 text-center">
      <p className="text-amber-300">
        {getStatusMessage(status, isTriggering)}
      </p>
      <p className="mt-2 text-sm text-slate-400">
        結果が出るまで自動で更新します
      </p>
      {errorMessage && (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-red-200">{errorMessage}</p>
          <button
            type="button"
            onClick={() => {
              hasTriggered.current = true;
              void triggerGeneration();
            }}
            disabled={isTriggering}
            className="rounded-lg border border-red-400/50 px-4 py-2 text-sm font-medium text-red-100 transition-colors hover:bg-red-500/10 disabled:opacity-50"
          >
            再試行
          </button>
        </div>
      )}
    </div>
  );
}
