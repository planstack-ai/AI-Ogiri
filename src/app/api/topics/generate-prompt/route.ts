import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { generateTopic } from "@/lib/ai/prompt-generator";

export async function POST() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const prompt = await generateTopic();
  return NextResponse.json({ prompt });
}
