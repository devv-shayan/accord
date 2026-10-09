import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import { buildSummaryPrompt, isSummaryTemplate, summaryModel, summaryResponseSchema, validateSummary } from "@/lib/ai-summary";
import type { AiSummaryDraft } from "@/lib/client-state";
import { requestUser, sameOrigin } from "@/lib/capture/auth";
import { accessibleMeeting } from "@/lib/capture/meetings";
import { smallJson, failure } from "@/lib/capture/http";

export async function POST(request: NextRequest) {
  let body: { meetingId?: unknown; format?: unknown };
  try { sameOrigin(request); body = await smallJson(request); }
  catch (error) { return failure(error); }
  if (!isSummaryTemplate(body?.format)) return NextResponse.json({ error: "Choose Outcome or Brief." }, { status: 400 });
  const meeting = typeof body.meetingId === "string" ? await accessibleMeeting(body.meetingId, await requestUser(request)) : null;
  if (!meeting) return NextResponse.json({ error: "Meeting not found." }, { status: 404 });
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Gemini is not configured. Add the server API key to generate this summary." }, { status: 503 });

  try {
    const client = new GoogleGenAI({ apiKey });
    const interaction = await client.interactions.create({
      model: summaryModel,
      input: buildSummaryPrompt(meeting, body.format),
      store: false,
      generation_config: { thinking_level: "low" },
      response_format: { type: "text", mime_type: "application/json", schema: summaryResponseSchema },
    }, { signal: AbortSignal.any([request.signal, AbortSignal.timeout(60_000)]), maxRetries: 0 });
    const draft: AiSummaryDraft = {
      format: body.format,
      generatedAt: new Date().toISOString(),
      model: summaryModel,
      insights: validateSummary(JSON.parse(interaction.output_text || "{}"), meeting.transcript, body.format),
    };
    return NextResponse.json({ draft });
  } catch (error) {
    const timedOut = error instanceof Error && (error.name === "TimeoutError" || error.name === "RequestTimeoutError");
    console.error("Gemini summary failed", error instanceof Error ? error.name : "Unknown error");
    return NextResponse.json({ error: timedOut ? "Summary generation took too long. Try again." : "Gemini could not return a valid summary with source links. Try again." }, { status: 502 });
  }
}
