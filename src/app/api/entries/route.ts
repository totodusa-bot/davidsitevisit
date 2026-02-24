import { NextRequest, NextResponse } from "next/server";

import {
  type JournalEntryRow,
  rowToDto,
} from "@/lib/server/entry-row";
import { authorizeRequest } from "@/lib/server/request-auth";
import { getSupabaseServerClient } from "@/lib/server/supabase";

export async function GET(request: NextRequest) {
  const auth = await authorizeRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const since = request.nextUrl.searchParams.get("since");
  let sinceIso: string | null = null;

  if (since) {
    const parsed = new Date(since);
    if (Number.isNaN(parsed.getTime())) {
      return NextResponse.json(
        { error: "Invalid since timestamp." },
        { status: 400 },
      );
    }

    sinceIso = parsed.toISOString();
  }

  const supabase = getSupabaseServerClient();
  let query = supabase
    .from("journal_entries")
    .select("*")
    .eq("visit_id", auth.visitId)
    .order("updated_at", { ascending: false });

  if (sinceIso) {
    query = query.gt("updated_at", sinceIso);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: "Failed to read entries.", details: error.message },
      { status: 500 },
    );
  }

  const rows = (data ?? []) as JournalEntryRow[];
  return NextResponse.json({ entries: rows.map(rowToDto) });
}
