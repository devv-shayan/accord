import { NextRequest, NextResponse } from "next/server";
import { extensionToken, requireUser, revokeExtensions } from "@/lib/capture/auth";
import { failure } from "@/lib/capture/http";

export async function POST(request: NextRequest) {
  try { return NextResponse.json(await extensionToken(await requireUser(request)), { headers: { "Cache-Control": "no-store" } }); }
  catch (error) { return failure(error); }
}
export async function DELETE(request: NextRequest) {
  try { await revokeExtensions(await requireUser(request)); return NextResponse.json({ disconnected: true }); }
  catch (error) { return failure(error); }
}
