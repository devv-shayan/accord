import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/capture/auth";
import { failure } from "@/lib/capture/http";
import { digest } from "@/lib/capture/crypto";
import { readDocument, writeDocument } from "@/lib/capture/store";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request, true);
    const token = request.headers.get("authorization")?.slice(7);
    if (token) {
      const record = await readDocument<{ expiresAt: number }>("extension", digest(token));
      if (record) await writeDocument("extension", record.id, record.owner_id, { ...record.data, verifiedAt: Date.now() });
    }
    return NextResponse.json({ name: user.name, connected: true }, { headers: { "Cache-Control": "no-store" } });
  }
  catch (error) { return failure(error); }
}
