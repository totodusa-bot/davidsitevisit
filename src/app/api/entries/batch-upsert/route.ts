import { NextRequest, NextResponse } from "next/server";

import { dtoToRow } from "@/lib/server/entry-row";
import { getServerEnv } from "@/lib/server/env";
import { authorizeRequest } from "@/lib/server/request-auth";
import { getSupabaseServerClient } from "@/lib/server/supabase";
import { batchUpsertSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const auth = await authorizeRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parseResult = batchUpsertSchema.safeParse(body);

  if (!parseResult.success) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const env = getServerEnv();
  const normalizedEntries = parseResult.data.entries.map((entry) => ({
    ...entry,
    visitId: env.VISIT_ID,
  }));

  const rows = normalizedEntries.map(dtoToRow);
  const supabase = getSupabaseServerClient();

  const { error } = await supabase
    .from("journal_entries")
    .upsert(rows, { onConflict: "id" });

  if (error) {
    return NextResponse.json(
      {
        error: "Failed to upsert entries.",
        details: error.message,
        failedIds: normalizedEntries.map((entry) => entry.id),
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    upserted: normalizedEntries.length,
    failedIds: [],
  });
}
