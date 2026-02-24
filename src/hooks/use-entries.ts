"use client";

import { useLiveQuery } from "dexie-react-hooks";

import { db } from "@/lib/storage/db";
import {
  createEntry,
  importEntries,
  listEntries,
  restoreEntry,
  softDeleteEntry,
  updateEntry,
} from "@/lib/storage/entries-repo";
import type { JournalEntryDTO, LocalJournalEntry } from "@/lib/types";

export function useEntries() {
  const entries =
    useLiveQuery(async () => listEntries(), [], [] as LocalJournalEntry[]) ?? [];

  return {
    entries,
    async create(nextEntry: JournalEntryDTO) {
      await createEntry(nextEntry);
    },
    async update(nextEntry: JournalEntryDTO) {
      await updateEntry(nextEntry);
    },
    async remove(id: string) {
      await softDeleteEntry(id);
    },
    async restore(id: string) {
      await restoreEntry(id);
    },
    async importBulk(importedEntries: JournalEntryDTO[]) {
      return importEntries(importedEntries);
    },
    async clearAll() {
      await db.entries.clear();
    },
  };
}
