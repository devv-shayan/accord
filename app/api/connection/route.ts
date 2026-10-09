import { NextRequest, NextResponse } from "next/server";
import { publicUser, requestUser } from "@/lib/capture/auth";
import { appOrigin, googleConfigured, localMode } from "@/lib/capture/config";
import { failure } from "@/lib/capture/http";
import { listDocuments, storageStatus } from "@/lib/capture/store";

export async function GET(request: NextRequest) {
  try {
    const storage = await storageStatus();
    const user = storage.ready ? await requestUser(request) : null;
    const paired = user ? await listDocuments<{ expiresAt: number; verifiedAt?: number }>("extension", user.id) : [];
    return NextResponse.json({ user: user ? publicUser(user) : null,
      googleConfigured: googleConfigured(), localMode: localMode(appOrigin(request.url)), storage: storage.mode,
      storageReady: storage.ready, storageIssue: storage.issue,
      extensionConnected: paired.some((entry) => entry.data.expiresAt > Date.now() && !!entry.data.verifiedAt) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return failure(error); }
}
