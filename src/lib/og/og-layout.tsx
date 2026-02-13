import { MODEL_DISPLAY_NAMES, MODEL_COLORS } from "@/lib/utils/constants";
import type { Topic, Answer, AiJudgment } from "@/types";

const RANK_EMOJI: Record<number, string> = {
  1: "\u{1f947}",
  2: "\u{1f948}",
  3: "\u{1f949}",
};

interface OgLayoutProps {
  topic: Topic;
  answers: Answer[];
  judgment: AiJudgment | null;
}

export function OgLayout({ topic, answers, judgment }: OgLayoutProps) {
  const rankMap = new Map(
    judgment?.rankings?.map((r) => [r.model_name, r.rank]) ?? []
  );

  const sorted = [...answers].sort(
    (a, b) => (rankMap.get(a.model_name) ?? 99) - (rankMap.get(b.model_name) ?? 99)
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        backgroundColor: "#0f172a",
        padding: "40px",
        fontFamily: "Noto Sans JP",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <span style={{ fontSize: "24px", color: "#e2e8f0", fontWeight: 700 }}>
          AI大喜利グランプリ
        </span>
      </div>

      {/* Topic */}
      <div
        style={{
          display: "flex",
          backgroundColor: "#1e293b",
          borderRadius: "12px",
          padding: "16px 24px",
          marginBottom: "24px",
        }}
      >
        <span style={{ fontSize: "22px", color: "#ffffff", fontWeight: 700 }}>
          {topic.prompt}
        </span>
      </div>

      {/* 2x2 Answer grid */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "12px",
          flex: 1,
        }}
      >
        {sorted.slice(0, 4).map((answer) => {
          const rank = rankMap.get(answer.model_name) ?? 4;
          const color = MODEL_COLORS[answer.model_name] ?? "#6366f1";
          const emoji = RANK_EMOJI[rank] ?? "";
          const text =
            answer.answer_text.length > 60
              ? answer.answer_text.slice(0, 57) + "..."
              : answer.answer_text;

          return (
            <div
              key={answer.id}
              style={{
                display: "flex",
                flexDirection: "column",
                width: "calc(50% - 6px)",
                backgroundColor: "#1e293b",
                borderRadius: "12px",
                padding: "16px",
                borderLeft: `4px solid ${color}`,
              }}
            >
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "#e2e8f0",
                  marginBottom: "8px",
                }}
              >
                {emoji} {MODEL_DISPLAY_NAMES[answer.model_name]}
              </span>
              <span style={{ fontSize: "16px", color: "#cbd5e1" }}>
                {text}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
