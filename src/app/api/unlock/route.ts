import { timingSafeEqual } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

import { issueSessionToken } from "@/lib/server/auth";
import { getServerEnv } from "@/lib/server/env";
import { unlockRequestSchema } from "@/lib/validation";

function safePasscodeCompare(input: string, secret: string): boolean {
  const inputBuffer = Buffer.from(input);
  const secretBuffer = Buffer.from(secret);

  if (inputBuffer.length !== secretBuffer.length) {
    return false;
  }

  return timingSafeEqual(inputBuffer, secretBuffer);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parseResult = unlockRequestSchema.safeParse(body);

  if (!parseResult.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const env = getServerEnv();
  const matches = safePasscodeCompare(parseResult.data.passcode, env.VISIT_PASSCODE);

  if (!matches) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const expiresInSec = 43_200;
  const token = await issueSessionToken(
    {
      visitId: env.VISIT_ID,
      scope: "site-journal",
    },
    env.SESSION_SIGNING_KEY,
    expiresInSec,
  );

  return NextResponse.json({ token, expiresInSec });
}
