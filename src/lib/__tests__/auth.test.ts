import { describe, expect, it } from "vitest";

import {
  issueSessionToken,
  parseBearerToken,
  verifySessionToken,
} from "@/lib/server/auth";

describe("auth helpers", () => {
  it("issues and verifies session token", async () => {
    const token = await issueSessionToken(
      {
        visitId: "visit-1",
        scope: "site-journal",
      },
      "this-is-a-long-enough-signing-key-1234",
      60,
    );

    const payload = await verifySessionToken(
      token,
      "this-is-a-long-enough-signing-key-1234",
    );

    expect(payload).toEqual({
      visitId: "visit-1",
      scope: "site-journal",
    });
  });

  it("rejects malformed bearer header", () => {
    expect(parseBearerToken(null)).toBeNull();
    expect(parseBearerToken("Basic xyz")).toBeNull();
  });

  it("parses valid bearer header", () => {
    expect(parseBearerToken("Bearer abc123")).toBe("abc123");
  });
});
