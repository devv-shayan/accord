import { NextRequest } from "next/server";
import { HttpError } from "@/lib/capture/auth";
import { failure } from "@/lib/capture/http";
import { audioResponse } from "@/lib/capture/media";
import { sharedAudio } from "@/lib/capture/shares";
import { loadBlob } from "@/lib/capture/store";

export async function GET(request: NextRequest, context: { params: Promise<{ token: string }> }) {
  try {
    const share = await sharedAudio((await context.params).token);
    if (!share) throw new HttpError(404, "This clip link has expired or was removed.");
    return audioResponse(await loadBlob(share.audioPath), request, "audio/webm");
  } catch (error) { return failure(error); }
}
