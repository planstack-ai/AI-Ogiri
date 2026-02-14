"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function TopicForm() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [isAiGenerated, setIsAiGenerated] = useState(false);
  const [isCharacterMode, setIsCharacterMode] = useState(false);
  const router = useRouter();

  const handleGeneratePrompt = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/topics/generate-prompt", {
        method: "POST",
      });
      const data = await res.json();
      if (data.prompt) {
        setPrompt(data.prompt);
        setIsAiGenerated(true);
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    setLoading(true);

    try {
      // 1. トピック作成
      const topicRes = await fetch("/api/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          is_ai_generated: isAiGenerated,
          is_character_mode: isCharacterMode,
        }),
      });
      const topic = await topicRes.json();
      if (!topicRes.ok) throw new Error(topic.error);

      // 2. AI回答生成トリガー
      fetch(`/api/topics/${topic.id}/generate`, { method: "POST" });

      // 3. 結果ページへ遷移
      router.push(`/topics/${topic.id}`);
    } catch {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <textarea
          value={prompt}
          onChange={(e) => {
            setPrompt(e.target.value);
            setIsAiGenerated(false);
          }}
          placeholder="大喜利のお題を入力..."
          maxLength={200}
          rows={3}
          className="w-full resize-none rounded-lg border border-slate-600 bg-slate-700 px-4 py-3 text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
        />
        <p className="mt-1 text-right text-xs text-slate-500">
          {prompt.length}/200
        </p>
      </div>
      {/* キャラなりきりモード */}
      <label className="flex cursor-pointer items-center gap-3">
        <div className="relative">
          <input
            type="checkbox"
            checked={isCharacterMode}
            onChange={(e) => setIsCharacterMode(e.target.checked)}
            className="peer sr-only"
          />
          <div className="h-6 w-11 rounded-full bg-slate-600 transition-colors peer-checked:bg-amber-500" />
          <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform peer-checked:translate-x-5" />
        </div>
        <span className="text-sm text-slate-300">
          キャラなりきりモード
        </span>
        <span className="text-xs text-slate-500">
          AIがアニメキャラになりきって回答します
        </span>
      </label>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleGeneratePrompt}
          disabled={generating}
          className="rounded-lg border border-slate-600 px-4 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-700 disabled:opacity-50"
        >
          {generating ? "考え中..." : "AIにお題を考えてもらう"}
        </button>
        <button
          type="submit"
          disabled={loading || !prompt.trim()}
          className="flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
        >
          {loading ? "送信中..." : "投稿してAIに回答させる"}
        </button>
      </div>
    </form>
  );
}
