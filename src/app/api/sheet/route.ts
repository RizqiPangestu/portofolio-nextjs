import { NextResponse } from "next/server";

// Always run this handler dynamically (no caching of user data).
export const dynamic = "force-dynamic";

/*
Generic Google Sheet contract (proxied to the Apps Script Web App).

GET  /api/sheet?sheetName=...&queryColumn=...&queryValue=...
  - sheetName             (required) which tab to read
  - queryColumn/queryValue (optional) filter to rows where that column matches;
                          omit both to read every row
  → { columnNames: string[], rows: string[][] }

  NOTE: HTTP GET cannot carry a request body via fetch, so the read inputs are
  passed as query params rather than a JSON body.

POST /api/sheet   (JSON body)
  - sheetName              (required)
  - action                 (required) "create" | "update"
  - columnNames: string[]  (required) the columns each value in `rows` maps to
  - rows: string[]         (required) one row's values, aligned to columnNames
  - updateColumn           (required for "update") column to match on
  - updateValue            (required for "update") value to match on
  → { ok: true }
*/

function webAppUrl(): string | null {
  const url = process.env.SHEET_WEBAPP_URL?.trim();
  return url || null;
}

function sheetToken(): string {
  return process.env.SHEET_TOKEN?.trim() ?? "";
}

function misconfig(): NextResponse {
  return NextResponse.json(
    { error: "Server misconfiguration: SHEET_WEBAPP_URL is not set." },
    { status: 503 },
  );
}

function badJson(): NextResponse {
  return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
}

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === "string");
}

// Apps Script Web Apps only expose doGet/doPost, so create and update both go
// through POST — the payload's `action` tells the script what to do.
async function postToWebApp(
  base: string,
  payload: Record<string, unknown>,
): Promise<NextResponse> {
  let upstream: Response;
  try {
    upstream = await fetch(base, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, token: sheetToken() }),
    });
  } catch {
    return NextResponse.json(
      { error: "Could not reach the Sheet service." },
      { status: 502 },
    );
  }

  const json = (await upstream.json().catch(() => null)) as
    | { ok?: boolean; error?: string }
    | null;

  if (!json || json.error) {
    return NextResponse.json(
      { error: json?.error ?? "Sheet service rejected the request." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}

// READ
export async function GET(request: Request) {
  const base = webAppUrl();
  if (!base) return misconfig();

  const { searchParams } = new URL(request.url);
  const sheetName = searchParams.get("sheetName")?.trim();
  if (!sheetName) {
    return NextResponse.json(
      { error: 'Query param "sheetName" is required.' },
      { status: 400 },
    );
  }

  const queryColumn = searchParams.get("queryColumn")?.trim();
  const queryValue = searchParams.get("queryValue");

  const upstreamUrl = new URL(base);
  upstreamUrl.searchParams.set("sheetName", sheetName);
  if (queryColumn) {
    upstreamUrl.searchParams.set("queryColumn", queryColumn);
    upstreamUrl.searchParams.set("queryValue", queryValue ?? "");
  }
  const token = sheetToken();
  if (token) upstreamUrl.searchParams.set("token", token);

  let upstream: Response;
  try {
    upstream = await fetch(upstreamUrl.toString(), { cache: "no-store" });
  } catch {
    return NextResponse.json(
      { error: "Could not reach the Sheet service." },
      { status: 502 },
    );
  }

  const json = (await upstream.json().catch(() => null)) as
    | { columnNames?: string[]; rows?: string[][]; error?: string }
    | null;

  if (!json || json.error) {
    return NextResponse.json(
      { error: json?.error ?? "Sheet service returned an error." },
      { status: 502 },
    );
  }

  return NextResponse.json({
    columnNames: json.columnNames ?? [],
    rows: json.rows ?? [],
  });
}

// CREATE / UPDATE
export async function POST(request: Request) {
  const base = webAppUrl();
  if (!base) return misconfig();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badJson();
  }

  const b = body as {
    sheetName?: unknown;
    action?: unknown;
    updateColumn?: unknown;
    updateValue?: unknown;
    columnNames?: unknown;
    rows?: unknown;
  };

  const sheetName = typeof b.sheetName === "string" ? b.sheetName.trim() : "";
  if (!sheetName) {
    return NextResponse.json(
      { error: 'Field "sheetName" is required.' },
      { status: 400 },
    );
  }

  if (b.action !== "create" && b.action !== "update") {
    return NextResponse.json(
      { error: 'Field "action" must be "create" or "update".' },
      { status: 400 },
    );
  }

  if (!isStringArray(b.columnNames)) {
    return NextResponse.json(
      { error: 'Field "columnNames" must be an array of strings.' },
      { status: 400 },
    );
  }
  if (!isStringArray(b.rows)) {
    return NextResponse.json(
      { error: 'Field "rows" must be an array of strings.' },
      { status: 400 },
    );
  }
  if (b.columnNames.length !== b.rows.length) {
    return NextResponse.json(
      { error: '"columnNames" and "rows" must have the same length.' },
      { status: 400 },
    );
  }
  if (b.columnNames.length === 0) {
    return NextResponse.json(
      { error: '"columnNames" must not be empty.' },
      { status: 400 },
    );
  }

  const payload: Record<string, unknown> = {
    sheetName,
    action: b.action,
    columnNames: b.columnNames,
    rows: b.rows,
  };

  if (b.action === "update") {
    const updateColumn =
      typeof b.updateColumn === "string" ? b.updateColumn.trim() : "";
    if (!updateColumn) {
      return NextResponse.json(
        { error: 'Field "updateColumn" is required for update.' },
        { status: 400 },
      );
    }
    if (typeof b.updateValue !== "string") {
      return NextResponse.json(
        { error: 'Field "updateValue" is required for update.' },
        { status: 400 },
      );
    }
    payload.updateColumn = updateColumn;
    payload.updateValue = b.updateValue;
  }

  return postToWebApp(base, payload);
}
