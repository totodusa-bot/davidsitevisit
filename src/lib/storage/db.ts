import Dexie, { type EntityTable } from "dexie";

import type { LocalJournalEntry } from "@/lib/types";

interface MetaRecord {
  key: string;
  value: string;
}

class JournalDB extends Dexie {
  entries!: EntityTable<LocalJournalEntry, "id">;
  meta!: EntityTable<MetaRecord, "key">;

  constructor() {
    super("site-journal-db");

    this.version(1).stores({
      entries:
        "&id, visitId, capturedAt, updatedAt, measurementKind, syncState, deleted",
      meta: "&key",
    });
  }
}

export const db = new JournalDB();
