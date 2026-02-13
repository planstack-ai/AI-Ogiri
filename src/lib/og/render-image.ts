import { ImageResponse } from "next/og";
import { OgLayout } from "./og-layout";
import type { Topic, Answer, AiJudgment } from "@/types";

const FONT_URL =
  "https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-jp@latest/japanese-700-normal.woff";

let fontCache: ArrayBuffer | null = null;

async function getFont(): Promise<ArrayBuffer> {
  if (fontCache) return fontCache;
  const res = await fetch(FONT_URL);
  fontCache = await res.arrayBuffer();
  return fontCache;
}

export async function renderOgImage(
  topic: Topic,
  answers: Answer[],
  judgment: AiJudgment | null
): Promise<ImageResponse> {
  const fontData = await getFont();

  const element = OgLayout({ topic, answers, judgment });

  return new ImageResponse(element, {
    width: 1200,
    height: 630,
    fonts: [
      {
        name: "Noto Sans JP",
        data: fontData,
        weight: 700,
        style: "normal",
      },
    ],
  });
}
