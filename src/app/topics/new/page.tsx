import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { TopicForm } from "@/components/topic/topic-form";

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
