import { NextRequest, NextResponse } from "next/server";
import { speechToText } from "@/lib/bhashini";

/**
 * POST /api/bhashini/asr
 * Accepts { audioBase64, language } and returns transcript text.
 * The Bhashini API key stays server-side — never sent to browser.
 */
export async function POST(request: NextRequest) {
  try {
    const { audioBase64, language } = await request.json();

    if (!audioBase64 || !language) {
      return NextResponse.json(
        { error: "Missing required fields: audioBase64, language" },
        { status: 400 }
      );
    }

    const transcript = await speechToText(audioBase64, language);
    return NextResponse.json({ transcript });
  } catch (err) {
    console.error("[ASR API]", err);
    const message = err instanceof Error ? err.message : "ASR request failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
