import { after, NextRequest, NextResponse } from "next/server";
import { HttpError, requireUser } from "@/lib/capture/auth";
import { failure } from "@/lib/capture/http";
import { processCapture } from "@/lib/capture/processing";
import { ownedCapture } from "@/lib/capture/service";
import { withLock, writeDocument } from "@/lib/capture/store";

export const maxDuration = 300;
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(request, true);
    const { id } = await context.params;
    await withLock(id, async () => {
      const capture = await ownedCapture(user, id);
      const stale = ["transcribing", "summarizing"].includes(capture.status) && Date.now() - Date.parse(capture.processingStartedAt || "") > 10 * 60_000;
      if (capture.status !== "error" && capture.status !== "queued" && !stale) throw new HttpError(409, "Processing is still active.");
      if (!capture.chunkCount) throw new HttpError(409, "Finish the audio upload first.");
      await writeDocument("capture", id, user.id, { ...capture, status: "queued", lease: undefined });
    });
    if (process.env.ACCORD_EXTERNAL_WORKER !== "true") after(() => processCapture(id));
    return NextResponse.json({ queued: true }, { status: 202 });
  } catch (error) { return failure(error); }
}
