import { NextRequest, NextResponse } from "next/server";
import {
  AiWolfConfigurationError,
  generateAiWolfSession,
  streamAiWolfSession,
} from "@/lib/ai-wolf/generator";
import { saveAiWolfSession } from "@/lib/ai-wolf/archive";
import type { AiWolfGenerateInput } from "@/lib/ai-wolf/types";

export const runtime = "nodejs";
export const maxDuration = 300;

function getErrorMessage(error: unknown) {
  if (error instanceof AiWolfConfigurationError) {
    return error.message;
  }
  return "討論の生成中にエラーが発生しました";
}

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
            if (event.type === "done") {
              await saveAiWolfSession(event.session);
            }
            send(event);
          }
        } catch (error) {
          console.error("Failed to stream AI wolf session:", error);
          send({
            type: "error",
            message: getErrorMessage(error),
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

  try {
    const session = await generateAiWolfSession(body);
    await saveAiWolfSession(session);
    return NextResponse.json(session);
  } catch (error) {
    console.error("Failed to generate AI wolf session:", error);
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: error instanceof AiWolfConfigurationError ? 400 : 500 }
    );
  }
}
