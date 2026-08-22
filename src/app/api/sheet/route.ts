import { NextResponse } from "next/server";
import { readSheet, writeSheet } from "./client";

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

function badJson(): NextResponse {
  return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
}

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === "string");
}

function sheetError(result: { error: string; status: number }): NextResponse {
  return NextResponse.json({ error: result.error }, { status: result.status });
}

// READ
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sheetName = searchParams.get("sheetName")?.trim();
  if (!sheetName) {
    return NextResponse.json(
      { error: 'Query param "sheetName" is required.' },
      { status: 400 },
    );
  }

  const queryColumn = searchParams.get("queryColumn")?.trim();
  const queryValue = searchParams.get("queryValue") ?? undefined;

  const result = await readSheet({
    sheetName,
    queryColumn: queryColumn || undefined,
    queryValue,
  });
  if (!result.ok) return sheetError(result);

  return NextResponse.json({
    columnNames: result.columnNames,
    rows: result.rows,
  });
}

// CREATE / UPDATE
export async function POST(request: Request) {
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

  let updateColumn: string | undefined;
  let updateValue: string | undefined;
  if (b.action === "update") {
    updateColumn =
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
    updateValue = b.updateValue;
  }

  const result = await writeSheet({
    sheetName,
    action: b.action,
    columnNames: b.columnNames,
    rows: b.rows,
    updateColumn,
    updateValue,
  });
  if (!result.ok) return sheetError(result);

  return NextResponse.json({ ok: true });
}
