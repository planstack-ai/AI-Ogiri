import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { prompt, is_ai_generated } = await request.json();

  if (!prompt || typeof prompt !== "string" || prompt.length > 200) {
    return NextResponse.json(
      { error: "お題は1〜200文字で入力してください" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("topics")
    .insert({
      prompt: prompt.trim(),
      author_id: user.id,
      is_ai_generated: is_ai_generated ?? false,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "10");
  const status = searchParams.get("status");

  const supabase = await createServerClient();

  let query = supabase
    .from("topics")
    .select("*, answers(*), ai_judgments(*)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (status) {
    query = query.eq("status", status);
  }

  const { data, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data, total: count, page, limit });
}
