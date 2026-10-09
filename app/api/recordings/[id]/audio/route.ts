import { NextRequest } from "next/server";
import { HttpError, requireUser } from "@/lib/capture/auth";
import { failure } from "@/lib/capture/http";
import { audioResponse } from "@/lib/capture/media";
import { ownedCapture } from "@/lib/capture/service";
import { loadBlob } from "@/lib/capture/store";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const capture = await ownedCapture(await requireUser(request), (await context.params).id);
    if (!capture.audioPath) throw new HttpError(409, "The recording is still being prepared.");
    return audioResponse(await loadBlob(capture.audioPath), request, capture.mimeType);
  } catch (error) { return failure(error); }
}
