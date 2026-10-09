import { NextResponse } from "next/server";
import { HttpError } from "./auth";

export function failure(error: unknown) {
  if (error instanceof HttpError) return NextResponse.json({ error: error.message, ...(error.code ? { code: error.code } : {}) }, { status: error.status, headers: { "Cache-Control": "no-store" } });
  const message = error instanceof Error && /busy|could not (?:upload|read|save|load)|Set ACCORD/.test(error.message)
    ? error.message : "The recording service could not finish this step. Try again.";
  console.error("Accord capture request failed", error instanceof Error ? error.name : "Unknown error");
  return NextResponse.json({ error: message }, { status: 503, headers: { "Cache-Control": "no-store" } });
}
export async function smallJson(request: Request, max = 32_000) {
  const declared = Number(request.headers.get("content-length"));
  if (declared > max) throw new HttpError(413, "This request is too large.");
  const text = await request.text();
  if (Buffer.byteLength(text) > max) throw new HttpError(413, "This request is too large.");
  try { return JSON.parse(text) as Record<string, unknown>; }
  catch { throw new HttpError(400, "This request is not valid JSON."); }
}
