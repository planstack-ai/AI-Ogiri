import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ログイン",
  description: "AI大喜利グランプリにログインして、お題投稿や投票に参加しよう。",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
