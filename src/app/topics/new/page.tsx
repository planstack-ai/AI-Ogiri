import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { TopicForm } from "@/components/topic/topic-form";

export const metadata: Metadata = {
  title: "新しいお題を投稿",
  description:
    "大喜利のお題を投稿して、5つのAIモデルに回答させよう。AI審査員が順位を決定します。",
};

export default async function NewTopicPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-white">
        新しいお題を投稿
      </h1>
      <TopicForm />
    </div>
  );
}
