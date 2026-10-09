import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/capture/auth";
import { failure, smallJson } from "@/lib/capture/http";
import { ownedCapture } from "@/lib/capture/service";
import { validReview } from "@/lib/capture/review";
import { withLock, writeDocument } from "@/lib/capture/store";
import { invalidateShares } from "@/lib/capture/shares";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const capture = await ownedCapture(await requireUser(request), (await context.params).id);
    return NextResponse.json({ state: capture.reviewState }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return failure(error); }
}
export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(request);
    const { id } = await context.params;
    const body = await smallJson(request, 500_000);
    await withLock(id, async () => {
      const capture = await ownedCapture(user, id);
      const state = validReview(body.state, id, capture.durationSeconds, capture.record?.transcript);
      // The server owns share paths. A client cannot substitute another recording's link.
      state.moments = state.moments.map((moment) => {
        const old = capture.reviewState?.moments.find((item) => item.id === moment.id);
        const same = old?.startSeconds === moment.startSeconds && old?.endSeconds === moment.endSeconds && old?.label === moment.label;
        return { ...moment, shared: same && !!old?.shared, sharePath: same ? old?.sharePath : undefined };
      });
      await invalidateShares(capture, state.moments);
      await writeDocument("capture", id, user.id, { ...capture, reviewState: state });
    });
    return NextResponse.json({ saved: true });
  } catch (error) { return failure(error); }
}
