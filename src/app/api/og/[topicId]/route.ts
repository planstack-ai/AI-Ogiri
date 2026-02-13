import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { renderOgImage } from "@/lib/og/render-image";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ topicId: string }> }
) {
  const { topicId } = await params;
  const admin = createAdminClient();

  const [{ data: topic }, { data: answers }, { data: judgments }] =
    await Promise.all([
      admin.from("topics").select("*").eq("id", topicId).single(),
      admin.from("answers").select("*").eq("topic_id", topicId),
      admin.from("ai_judgments").select("*").eq("topic_id", topicId),
    ]);

  if (!topic) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const judgment = judgments?.[0] ?? null;
  const imageResponse = await renderOgImage(topic, answers ?? [], judgment);

  // ImageResponse から body を取得して Cache-Control を付与
  const body = imageResponse.body;
  return new NextResponse(body, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400, immutable",
    },
  });
}
