import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/capture/auth";
import { failure, smallJson } from "@/lib/capture/http";
import { userCaptures } from "@/lib/capture/meetings";
import { publicCapture, startCapture } from "@/lib/capture/service";

export async function POST(request: NextRequest) {
  try { return NextResponse.json({ capture: publicCapture(await startCapture(await requireUser(request, true), await smallJson(request))) }, { status: 201 }); }
  catch (error) { return failure(error); }
}
export async function GET(request: NextRequest) {
  try { return NextResponse.json({ captures: (await userCaptures(await requireUser(request, true))).map(publicCapture) }, { headers: { "Cache-Control": "no-store" } }); }
  catch (error) { return failure(error); }
}
