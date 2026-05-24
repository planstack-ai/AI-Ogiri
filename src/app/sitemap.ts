import type { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { SITE_URL } from "@/lib/utils/constants";

const STATIC_ENTRIES: MetadataRoute.Sitemap = [
  {
    url: SITE_URL,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 1,
  },
  {
    url: `${SITE_URL}/topics`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 0.9,
  },
  {
    url: `${SITE_URL}/topics/new`,
    changeFrequency: "monthly",
    priority: 0.5,
  },
  {
    url: `${SITE_URL}/ai-wolf`,
    changeFrequency: "weekly",
    priority: 0.8,
  },
  {
    url: `${SITE_URL}/ai-wolf/archive`,
    changeFrequency: "daily",
    priority: 0.7,
  },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return STATIC_ENTRIES;
  }

  const supabase = createAdminClient();

  const { data: topics } = await supabase
    .from("topics")
    .select("id, updated_at")
    .eq("status", "completed")
    .order("created_at", { ascending: false });

  const topicEntries: MetadataRoute.Sitemap = (topics ?? []).map((topic) => ({
    url: `${SITE_URL}/topics/${topic.id}`,
    lastModified: topic.updated_at,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...STATIC_ENTRIES, ...topicEntries];
}
