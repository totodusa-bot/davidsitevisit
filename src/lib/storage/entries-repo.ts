import { db } from "@/lib/storage/db";
import type { JournalEntryDTO, LocalJournalEntry } from "@/lib/types";

function toMillis(isoTimestamp: string): number {
  const value = new Date(isoTimestamp).getTime();
  return Number.isNaN(value) ? 0 : value;
}

export function pickPreferredEntry(
  local: LocalJournalEntry,
  remote: JournalEntryDTO,
): "local" | "remote" {
  const localMs = toMillis(local.updatedAt);
  const remoteMs = toMillis(remote.updatedAt);

  if (remoteMs > localMs) {
    return "remote";
  }

  if (remoteMs < localMs) {
    return "local";
  }

  return local.syncState === "pending" ? "local" : "remote";
}

export async function listEntries(): Promise<LocalJournalEntry[]> {
  const entries = await db.entries.orderBy("capturedAt").reverse().toArray();
  return entries;
}

export async function getEntryById(
  id: string,
): Promise<LocalJournalEntry | undefined> {
  return db.entries.get(id);
}

export async function upsertLocalEntry(entry: JournalEntryDTO): Promise<void> {
  const existing = await db.entries.get(entry.id);

  await db.entries.put({
    ...entry,
    syncState: existing?.syncState ?? "pending",
    syncError: null,
  });
}

export async function createEntry(entry: JournalEntryDTO): Promise<void> {
  await db.entries.put({
    ...entry,
    syncState: "pending",
    syncError: null,
  });
}

export async function updateEntry(entry: JournalEntryDTO): Promise<void> {
  await db.entries.put({
    ...entry,
    syncState: "pending",
    syncError: null,
  });
}

export async function softDeleteEntry(id: string): Promise<void> {
  const existing = await db.entries.get(id);
  if (!existing) {
    return;
  }

  await db.entries.put({
    ...existing,
    deleted: true,
    updatedAt: new Date().toISOString(),
    syncState: "pending",
    syncError: null,
  });
}

export async function restoreEntry(id: string): Promise<void> {
  const existing = await db.entries.get(id);
  if (!existing) {
    return;
  }

  await db.entries.put({
    ...existing,
    deleted: false,
    updatedAt: new Date().toISOString(),
    syncState: "pending",
    syncError: null,
  });
}

export async function getPendingEntries(): Promise<LocalJournalEntry[]> {
  return db.entries
    .where("syncState")
    .anyOf(["pending", "error"])
    .toArray();
}

export async function markSynced(ids: string[]): Promise<void> {
  if (ids.length === 0) {
    return;
  }

  await db.transaction("rw", db.entries, async () => {
    await Promise.all(
      ids.map(async (id) => {
        const existing = await db.entries.get(id);
        if (!existing) {
          return;
        }

        await db.entries.put({
          ...existing,
          syncState: "synced",
          syncError: null,
        });
      }),
    );
  });
}

export async function markError(ids: string[], errorMessage: string): Promise<void> {
  if (ids.length === 0) {
    return;
  }

  await db.transaction("rw", db.entries, async () => {
    await Promise.all(
      ids.map(async (id) => {
        const existing = await db.entries.get(id);
        if (!existing) {
          return;
        }

        await db.entries.put({
          ...existing,
          syncState: "error",
          syncError: errorMessage,
        });
      }),
    );
  });
}

export async function queueAllForSync(ids: string[]): Promise<void> {
  if (ids.length === 0) {
    return;
  }

  await db.transaction("rw", db.entries, async () => {
    await Promise.all(
      ids.map(async (id) => {
        const existing = await db.entries.get(id);
        if (!existing) {
          return;
        }

        await db.entries.put({
          ...existing,
          syncState: "pending",
          syncError: null,
        });
      }),
    );
  });
}

export async function mergeRemoteEntries(entries: JournalEntryDTO[]): Promise<void> {
  await db.transaction("rw", db.entries, async () => {
    for (const remote of entries) {
      const local = await db.entries.get(remote.id);

      if (!local) {
        await db.entries.put({
          ...remote,
          syncState: "synced",
          syncError: null,
        });
        continue;
      }

      if (pickPreferredEntry(local, remote) === "remote") {
        await db.entries.put({
          ...remote,
          syncState: "synced",
          syncError: null,
        });
      }
    }
  });
}

export async function importEntries(entries: JournalEntryDTO[]): Promise<number> {
  let imported = 0;

  await db.transaction("rw", db.entries, async () => {
    for (const entry of entries) {
      const existing = await db.entries.get(entry.id);
      if (!existing) {
        imported += 1;
        await db.entries.put({
          ...entry,
          syncState: "pending",
          syncError: null,
        });
        continue;
      }

      if (pickPreferredEntry(existing, entry) === "remote") {
        imported += 1;
        await db.entries.put({
          ...entry,
          syncState: "pending",
          syncError: null,
        });
      }
    }
  });

  return imported;
}
