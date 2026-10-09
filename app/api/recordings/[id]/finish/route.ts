import { after, NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/capture/auth";
import { failure, smallJson } from "@/lib/capture/http";
import { finishCapture, publicCapture } from "@/lib/capture/service";
import { processCapture } from "@/lib/capture/processing";

export const maxDuration = 300;
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(request, true);
    const { id } = await context.params;
    const capture = await finishCapture(user, id, await smallJson(request));
    if (capture.status === "queued" && process.env.ACCORD_EXTERNAL_WORKER !== "true") after(() => processCapture(id));
    return NextResponse.json({ capture: publicCapture(capture) }, { status: 202 });
  } catch (error) { return failure(error); }
}
