import { NextRequest } from "next/server";

import { parseBearerToken, verifySessionToken } from "@/lib/server/auth";
import { getServerEnv } from "@/lib/server/env";

export async function authorizeRequest(
  request: NextRequest,
): Promise<{ visitId: string } | null> {
  const token = parseBearerToken(request.headers.get("authorization"));
  if (!token) {
    return null;
  }

  const env = getServerEnv();
  const payload = await verifySessionToken(token, env.SESSION_SIGNING_KEY);

  if (!payload || payload.visitId !== env.VISIT_ID) {
    return null;
  }

  return {
    visitId: payload.visitId,
  };
}
