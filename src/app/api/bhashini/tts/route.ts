import { NextRequest, NextResponse } from "next/server";
import { textToSpeech } from "@/lib/bhashini";

/**
 * POST /api/bhashini/tts
 * Accepts { text, language } and returns base64 audio.
 * The Bhashini API key stays server-side — never sent to browser.
 */
export async function POST(request: NextRequest) {
  try {
    const { text, language } = await request.json();

    if (!text || !language) {
      return NextResponse.json(
        { error: "Missing required fields: text, language" },
        { status: 400 }
      );
    }

    const audioBase64 = await textToSpeech(text, language);
    return NextResponse.json({ audio: audioBase64 });
  } catch (err) {
    console.error("[TTS API]", err);
    const message = err instanceof Error ? err.message : "TTS request failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
