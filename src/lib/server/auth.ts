import { SignJWT, jwtVerify } from "jose";

const encoder = new TextEncoder();

export interface SessionPayload {
  visitId: string;
  scope: "site-journal";
}

export function parseBearerToken(headerValue: string | null): string | null {
  if (!headerValue) {
    return null;
  }

  const [scheme, token] = headerValue.trim().split(/\s+/);
  if (scheme !== "Bearer" || !token) {
    return null;
  }

  return token;
}

export async function issueSessionToken(
  payload: SessionPayload,
  signingKey: string,
  expiresInSeconds = 43_200,
): Promise<string> {
  const key = encoder.encode(signingKey);

  return new SignJWT({
    visitId: payload.visitId,
    scope: payload.scope,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${expiresInSeconds}s`)
    .sign(key);
}

export async function verifySessionToken(
  token: string,
  signingKey: string,
): Promise<SessionPayload | null> {
  try {
    const key = encoder.encode(signingKey);
    const result = await jwtVerify(token, key, {
      algorithms: ["HS256"],
    });

    const visitId = result.payload.visitId;
    const scope = result.payload.scope;

    if (typeof visitId !== "string" || scope !== "site-journal") {
      return null;
    }

    return {
      visitId,
      scope,
    };
  } catch {
    return null;
  }
}
