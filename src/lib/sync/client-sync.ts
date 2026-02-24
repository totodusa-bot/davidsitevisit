import { SESSION_STORAGE_KEY } from "@/lib/config";
import {
  getPendingEntries,
  markError,
  markSynced,
  mergeRemoteEntries,
} from "@/lib/storage/entries-repo";

import type { JournalEntryDTO } from "@/lib/types";

interface EntriesResponse {
  entries: JournalEntryDTO[];
}

interface UpsertResponse {
  upserted: number;
  failedIds: string[];
}

interface UnlockResponse {
  token: string;
  expiresInSec: number;
}

export function getSessionToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(SESSION_STORAGE_KEY);
}

export function storeSessionToken(token: string): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(SESSION_STORAGE_KEY, token);
}

export function clearSessionToken(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(SESSION_STORAGE_KEY);
}

async function authorizedFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const token = getSessionToken();

  if (!token) {
    throw new Error("Cloud session is locked.");
  }

  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);

  return fetch(input, {
    ...init,
    headers,
  });
}

export async function unlockCloud(passcode: string): Promise<UnlockResponse> {
  const response = await fetch("/api/unlock", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ passcode }),
  });

  if (!response.ok) {
    throw new Error("Invalid passcode.");
  }

  const payload = (await response.json()) as UnlockResponse;
  storeSessionToken(payload.token);

  return payload;
}

export async function pullRemoteEntries(
  since?: string,
): Promise<JournalEntryDTO[]> {
  const query = since ? `?since=${encodeURIComponent(since)}` : "";
  const response = await authorizedFetch(`/api/entries${query}`);

  if (response.status === 401) {
    clearSessionToken();
    throw new Error("Cloud session expired. Unlock again.");
  }

  if (!response.ok) {
    throw new Error("Failed to fetch cloud entries.");
  }

  const payload = (await response.json()) as EntriesResponse;
  return payload.entries;
}

export async function pushPendingEntries(): Promise<number> {
  const pending = await getPendingEntries();
  if (pending.length === 0) {
    return 0;
  }

  const response = await authorizedFetch("/api/entries/batch-upsert", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      entries: pending,
    }),
  });

  if (response.status === 401) {
    clearSessionToken();
    throw new Error("Cloud session expired. Unlock again.");
  }

  if (!response.ok) {
    const errorText = await response.text();
    const ids = pending.map((entry) => entry.id);
    await markError(ids, "Cloud upsert failed.");
    throw new Error(errorText || "Failed to sync pending entries.");
  }

  const payload = (await response.json()) as UpsertResponse;
  const pendingIds = pending.map((entry) => entry.id);
  const syncedIds = pendingIds.filter((id) => !payload.failedIds.includes(id));

  await markSynced(syncedIds);

  if (payload.failedIds.length > 0) {
    await markError(payload.failedIds, "Cloud rejected entry.");
  }

  return syncedIds.length;
}

export async function syncNow(): Promise<{ pushed: number; pulled: number }> {
  const pushed = await pushPendingEntries();
  const remoteEntries = await pullRemoteEntries();
  await mergeRemoteEntries(remoteEntries);

  return {
    pushed,
    pulled: remoteEntries.length,
  };
}
