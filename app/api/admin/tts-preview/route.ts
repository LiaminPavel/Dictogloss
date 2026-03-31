import { z } from "zod";

import { requireAdmin } from "@/lib/auth/utils";
import { generateSpeechMp3 } from "@/lib/audio/tts";

const previewSchema = z.object({
  text: z.string().trim().min(1).max(500),
  voice: z.enum(["alloy", "echo", "fable", "onyx", "nova", "shimmer"]),
});

type ApiErrorBody = {
  data: null;
  error: {
    message: string;
    code: string;
  };
};

function errorResponse(message: string, code: string, status: number): Response {
  const body: ApiErrorBody = {
    data: null,
    error: { message, code },
  };
  return Response.json(body, { status });
}

export async function POST(request: Request): Promise<Response> {
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return errorResponse("Invalid JSON body.", "INVALID_JSON", 400);
  }

  const parsedBody = previewSchema.safeParse(rawBody);
  if (!parsedBody.success) {
    return errorResponse("Invalid preview payload.", "VALIDATION_ERROR", 400);
  }

  try {
    await requireAdmin();
    const audioBuffer = await generateSpeechMp3(parsedBody.data.text, parsedBody.data.voice);

    return new Response(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (error instanceof Error && (error.message === "Unauthorized" || error.message === "Forbidden")) {
      const status = error.message === "Unauthorized" ? 401 : 403;
      const code = error.message === "Unauthorized" ? "UNAUTHORIZED" : "FORBIDDEN";
      return errorResponse(error.message, code, status);
    }

    return errorResponse(
      error instanceof Error ? error.message : "Preview generation failed.",
      "PREVIEW_FAILED",
      500,
    );
  }
}
