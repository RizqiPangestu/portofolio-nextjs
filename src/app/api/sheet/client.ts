/**
 * Server-only Google Sheet client. Holds SHEET_WEBAPP_URL / SHEET_TOKEN from
 * process.env and talks to the Apps Script Web App.
 *
 * Used by `/api/sheet` (the browser-facing proxy) and by other Route Handlers
 * that must stay on the server — never import this from a `"use client"` file.
 */

export type SheetReadSuccess = {
  ok: true;
  columnNames: string[];
  rows: string[][];
};

export type SheetWriteSuccess = { ok: true };

export type SheetFailure = {
  ok: false;
  error: string;
  status: number;
};

function webAppUrl(): string | null {
  const url = process.env.SHEET_WEBAPP_URL?.trim();
  return url || null;
}

function sheetToken(): string {
  return process.env.SHEET_TOKEN?.trim() ?? "";
}

function misconfig(): SheetFailure {
  return {
    ok: false,
    error: "Server misconfiguration: SHEET_WEBAPP_URL is not set.",
    status: 503,
  };
}

export async function readSheet(opts: {
  sheetName: string;
  queryColumn?: string;
  queryValue?: string;
}): Promise<SheetReadSuccess | SheetFailure> {
  const base = webAppUrl();
  if (!base) return misconfig();

  const upstreamUrl = new URL(base);
  upstreamUrl.searchParams.set("sheetName", opts.sheetName);
  if (opts.queryColumn) {
    upstreamUrl.searchParams.set("queryColumn", opts.queryColumn);
    upstreamUrl.searchParams.set("queryValue", opts.queryValue ?? "");
  }
  const token = sheetToken();
  if (token) upstreamUrl.searchParams.set("token", token);

  let upstream: Response;
  try {
    upstream = await fetch(upstreamUrl.toString(), { cache: "no-store" });
  } catch {
    return {
      ok: false,
      error: "Could not reach the Sheet service.",
      status: 502,
    };
  }

  const json = (await upstream.json().catch(() => null)) as
    | { columnNames?: string[]; rows?: string[][]; error?: string }
    | null;

  if (!json || json.error) {
    return {
      ok: false,
      error: json?.error ?? "Sheet service returned an error.",
      status: 502,
    };
  }

  return {
    ok: true,
    columnNames: json.columnNames ?? [],
    rows: json.rows ?? [],
  };
}

export async function writeSheet(opts: {
  sheetName: string;
  action: "create" | "update";
  columnNames: string[];
  rows: string[];
  updateColumn?: string;
  updateValue?: string;
}): Promise<SheetWriteSuccess | SheetFailure> {
  const base = webAppUrl();
  if (!base) return misconfig();

  const payload: Record<string, unknown> = {
    sheetName: opts.sheetName,
    action: opts.action,
    columnNames: opts.columnNames,
    rows: opts.rows,
    token: sheetToken(),
  };
  if (opts.action === "update") {
    payload.updateColumn = opts.updateColumn;
    payload.updateValue = opts.updateValue;
  }

  let upstream: Response;
  try {
    upstream = await fetch(base, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    return {
      ok: false,
      error: "Could not reach the Sheet service.",
      status: 502,
    };
  }

  const json = (await upstream.json().catch(() => null)) as
    | { ok?: boolean; error?: string }
    | null;

  if (!json || json.error) {
    return {
      ok: false,
      error: json?.error ?? "Sheet service rejected the request.",
      status: 502,
    };
  }

  return { ok: true };
}
