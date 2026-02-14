import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@/lib/supabase/server";
import { generateAllAnswers } from "@/lib/ai/generate-all";
import { judgeAnswers } from "@/lib/ai/judge";
import { getCharacterById } from "@/lib/ai/characters-dataset";

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
  if (topic.status !== "pending") {
    return NextResponse.json({ error: "Already processed" }, { status: 409 });
  }

  await admin
    .from("topics")
    .update({ status: "generating" })
    .eq("id", topicId);

  try {
    // 1. 4モデル並列で回答生成
    const isCharacterMode = topic.is_character_mode ?? false;
    const answers = await generateAllAnswers(topic.prompt, isCharacterMode);

    // 2. 回答をDBに保存
    await admin.from("answers").insert(
      answers.map((a) => ({
        topic_id: topicId,
        model_name: a.modelName,
        answer_text: a.text,
        generation_time_ms: a.generationTimeMs,
        character_id: a.characterId,
      }))
    );

    // 3. AI審査
    await admin
      .from("topics")
      .update({ status: "judging" })
      .eq("id", topicId);
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
    await admin.from("ai_judgments").insert({
      topic_id: topicId,
      judge_model: "gpt-4o",
      rankings: judgment.rankings,
      overall_comment: judgment.overall_comment,
    });

    // 5. 完了
    await admin
      .from("topics")
      .update({ status: "completed" })
      .eq("id", topicId);

    return NextResponse.json({ success: true, answers, judgment });
  } catch {
    await admin
      .from("topics")
      .update({ status: "pending" })
      .eq("id", topicId);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}
