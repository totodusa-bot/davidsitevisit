"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { SYNC_INTERVAL_MS } from "@/lib/config";
import {
  getSessionToken,
  syncNow,
  unlockCloud,
} from "@/lib/sync/client-sync";

type SyncStatus =
  | "idle"
  | "syncing"
  | "success"
  | "locked"
  | "offline"
  | "error";

export function useCloudSync() {
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() =>
    Boolean(getSessionToken()),
  );
  const [status, setStatus] = useState<SyncStatus>("idle");
  const [message, setMessage] = useState<string>("Cloud sync inactive.");

  const runSync = useCallback(async () => {
    if (!navigator.onLine) {
      setStatus("offline");
      setMessage("Offline. Waiting for connection.");
      return;
    }

    if (!getSessionToken()) {
      setStatus("locked");
      setMessage("Cloud locked. Unlock to sync.");
      setIsUnlocked(false);
      return;
    }

    setStatus("syncing");
    setMessage("Syncing entries...");

    try {
      const result = await syncNow();
      setStatus("success");
      setMessage(`Synced. Pushed ${result.pushed}, pulled ${result.pulled}.`);
      setIsUnlocked(true);
    } catch (error) {
      const nextMessage =
        error instanceof Error ? error.message : "Cloud sync failed.";
      setStatus("error");
      setMessage(nextMessage);
      setIsUnlocked(Boolean(getSessionToken()));
    }
  }, []);

  const unlock = useCallback(
    async (passcode: string) => {
      await unlockCloud(passcode);
      setIsUnlocked(true);
      setStatus("idle");
      setMessage("Cloud unlocked.");
      await runSync();
    },
    [runSync],
  );

  useEffect(() => {
    if (!isUnlocked) {
      return;
    }

    const onOnline = () => {
      void runSync();
    };

    const interval = window.setInterval(() => {
      void runSync();
    }, SYNC_INTERVAL_MS);

    window.addEventListener("online", onOnline);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("online", onOnline);
    };
  }, [isUnlocked, runSync]);

  return useMemo(
    () => ({
      isUnlocked,
      status,
      message,
      unlock,
      runSync,
    }),
    [isUnlocked, status, message, unlock, runSync],
  );
}
