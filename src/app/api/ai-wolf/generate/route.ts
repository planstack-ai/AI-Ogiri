import { NextRequest, NextResponse } from "next/server";
import {
  generateAiWolfSession,
  streamAiWolfSession,
} from "@/lib/ai-wolf/generator";
import type { AiWolfGenerateInput } from "@/lib/ai-wolf/types";

export const runtime = "nodejs";
export const maxDuration = 180;

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as AiWolfGenerateInput;
  const acceptsStream =
    request.headers.get("accept")?.includes("application/x-ndjson") ||
    request.headers.get("x-ai-wolf-stream") === "1";

  if (acceptsStream) {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (value: unknown) => {
          controller.enqueue(encoder.encode(`${JSON.stringify(value)}\n`));
        };

        try {
          for await (const event of streamAiWolfSession(body)) {
            send(event);
          }
        } catch (error) {
          console.error("Failed to stream AI wolf session:", error);
          send({
            type: "error",
            message: "討論の生成中にエラーが発生しました",
          });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Accel-Buffering": "no",
      },
    });
  }

  const session = await generateAiWolfSession(body);
  return NextResponse.json(session);
}
