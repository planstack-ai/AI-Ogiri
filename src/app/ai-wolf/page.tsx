import type { Metadata } from "next";
import { AiWolfGame } from "@/components/ai-wolf/ai-wolf-game";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";

export const metadata: Metadata = {
  title: "AI狼",
  description:
    "5つのAIモデルから4つを選び、2対2で討論させる人間炙り出しゲーム。",
};

export default function AiWolfPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <AiWolfGame />
      </main>
      <Footer />
    </>
  );
}
