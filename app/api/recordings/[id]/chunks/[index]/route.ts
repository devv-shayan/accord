import { NextRequest, NextResponse } from "next/server";
import { HttpError, requireUser } from "@/lib/capture/auth";
import { MAX_CHUNK_BYTES } from "@/lib/capture/config";
import { failure } from "@/lib/capture/http";
import { uploadChunk } from "@/lib/capture/service";

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string; index: string }> }) {
  try {
    const user = await requireUser(request, true);
    const { id, index } = await context.params;
    if (Number(request.headers.get("content-length")) > MAX_CHUNK_BYTES) throw new HttpError(413, "This audio part is too large.");
    if (!/^\d+$/.test(index)) throw new HttpError(400, "Invalid recording part.");
    const bytes = new Uint8Array(await request.arrayBuffer());
    return NextResponse.json(await uploadChunk(user, id, Number(index), bytes));
  } catch (error) { return failure(error); }
}
