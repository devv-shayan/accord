import { NextRequest, NextResponse } from "next/server";
import { HttpError, requireUser } from "@/lib/capture/auth";
import { failure, smallJson } from "@/lib/capture/http";
import { ownedCapture } from "@/lib/capture/service";
import { validateMoment } from "@/lib/capture/review";
import { createShare } from "@/lib/capture/shares";
import { withLock, writeDocument } from "@/lib/capture/store";

export const maxDuration = 180;
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(request);
    const { id } = await context.params;
    const body = await smallJson(request);
    const sharePath = await withLock(id, async () => {
      const capture = await ownedCapture(user, id);
      const moment = validateMoment(body.moment, id, capture.durationSeconds);
      const stored = capture.reviewState?.moments.find((item) => item.id === moment.id);
      if (!stored || stored.label !== moment.label || stored.startSeconds !== moment.startSeconds || stored.endSeconds !== moment.endSeconds) throw new HttpError(409, "Save the moment before you create a clip.");
      const path = await createShare(capture, stored);
      const saved = { ...moment, shared: true, sharePath: path };
      if (!capture.reviewState) throw new Error("The recording is not ready.");
      await writeDocument("capture", id, user.id, { ...capture, reviewState: { ...capture.reviewState,
        moments: [saved, ...capture.reviewState.moments.filter((item) => item.id !== moment.id)] } });
      return path;
    });
    return NextResponse.json({ sharePath });
  } catch (error) { return failure(error); }
}
