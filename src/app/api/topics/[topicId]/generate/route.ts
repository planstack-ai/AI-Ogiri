import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@/lib/supabase/server";
import { generateAllAnswers } from "@/lib/ai/generate-all";
import { judgeAnswers } from "@/lib/ai/judge";
import { JUDGE_MODEL } from "@/lib/ai/model-config";
import { getCharacterById } from "@/lib/ai/characters-dataset";

export const runtime = "nodejs";
export const maxDuration = 300;

type SupabaseMutationResult = {
  error: { message: string } | null;
};

function throwIfSupabaseError(
  result: SupabaseMutationResult,
  action: string
) {
  if (result.error) {
    throw new Error(`${action}: ${result.error.message}`);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ topicId: string }> }
) {
  const { topicId } = await params;

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data: topic } = await admin
    .from("topics")
    .select("*")
    .eq("id", topicId)
    .single();
  if (!topic) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is required for AI judging" },
      { status: 500 }
    );
  }
  if (topic.status === "completed") {
    return NextResponse.json({ success: true, alreadyCompleted: true });
  }
  if (topic.status !== "pending") {
    return NextResponse.json({ error: "Already processed" }, { status: 409 });
  }

  try {
    const { data: lockedTopic, error: lockError } = await admin
      .from("topics")
      .update({ status: "generating" })
      .eq("id", topicId)
      .eq("status", "pending")
      .select("id")
      .maybeSingle();

    if (lockError) {
      throw new Error(
        `Failed to mark topic as generating: ${lockError.message}`
      );
    }
    if (!lockedTopic) {
      return NextResponse.json({ error: "Already processed" }, { status: 409 });
    }

    // 1. 5モデル並列で回答生成
    const isCharacterMode = topic.is_character_mode ?? false;
    const answers = await generateAllAnswers(topic.prompt, isCharacterMode);

    // 2. 回答をDBに保存
    throwIfSupabaseError(
      await admin.from("answers").upsert(
        answers.map((a) => ({
          topic_id: topicId,
          model_name: a.modelName,
          answer_text: a.text,
          generation_time_ms: a.generationTimeMs,
          character_id: a.characterId,
          model_version: a.modelVersion || null,
          token_count: a.tokenCount,
        })),
        { onConflict: "topic_id,model_name" }
      ),
      "Failed to save AI answers"
    );

    // 3. AI審査
    throwIfSupabaseError(
      await admin
        .from("topics")
        .update({ status: "judging" })
        .eq("id", topicId),
      "Failed to mark topic as judging"
    );
    const judgment = await judgeAnswers(
      topic.prompt,
      answers.map((a) => ({
        modelName: a.modelName,
        text: a.text,
        characterName: a.characterId
          ? getCharacterById(a.characterId)?.name
          : undefined,
      })),
      isCharacterMode
    );

    // 4. 審査結果保存
    throwIfSupabaseError(
      await admin.from("ai_judgments").upsert(
        {
          topic_id: topicId,
          judge_model: JUDGE_MODEL,
          rankings: judgment.rankings,
          overall_comment: judgment.overall_comment,
        },
        { onConflict: "topic_id" }
      ),
      "Failed to save AI judgment"
    );

    // 5. 完了
    throwIfSupabaseError(
      await admin
        .from("topics")
        .update({ status: "completed" })
        .eq("id", topicId),
      "Failed to mark topic as completed"
    );

    return NextResponse.json({ success: true, answers, judgment });
  } catch (error) {
    console.error("Failed to generate topic answers:", error);
    await admin.from("topics").update({ status: "pending" }).eq("id", topicId);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}
