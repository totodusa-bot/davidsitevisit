import type { Unit } from "@/lib/types";

export const DEFAULT_UNIT: Unit =
  process.env.NEXT_PUBLIC_DEFAULT_UNIT === "metric" ? "metric" : "imperial";

export const PUBLIC_VISIT_ID =
  process.env.NEXT_PUBLIC_VISIT_ID?.trim() || "site-visit-1";

export const SESSION_STORAGE_KEY = "sitevisit.session.token";
export const SYNC_INTERVAL_MS = 15_000;
