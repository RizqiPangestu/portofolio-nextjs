# Google Sheets Integration Guide (Generic Read / Write / Edit)

A step-by-step guide for a **generic** Google Sheets API in this Next.js app.
`/api/sheet` is not tied to one schema — you pass a `sheetName`, a list of
`columnNames`, and the `rows` values, so the same endpoint can back any sheet.
The running example is the wishlist on `/untuk-nia/wishlist`.

This matches the conventions already used in this repo:

- **App Router** route handlers under `src/app/api/*/route.ts`
- Validation + `NextResponse.json(...)` responses
- Secrets kept in **environment variables** (never shipped to the browser)
- The browser only talks to **our own API route**, which talks to Google

> Golden rule: **credentials and the sheet ID live on the server only.** The
> client calls `/api/sheet`, and the server calls Google. Never put a Google
> API key or service-account key in client code or `NEXT_PUBLIC_`* vars.

---

## Table of contents

1. [Architecture](#architecture)
2. [Choosing an approach](#choosing-an-approach)
3. [Approach A — Google Apps Script Web App (quickest)](#approach-a--google-apps-script-web-app-quickest)
4. [Approach B — Sheets API v4 + Service Account (recommended for production)](#approach-b--sheets-api-v4--service-account-recommended-for-production)
5. [The frontend page (shared by both approaches)](#the-frontend-page-shared-by-both-approaches)
6. [Testing](#testing)
7. [Deployment (Vercel)](#deployment-vercel)
8. [Security & hardening](#security--hardening)
9. [Troubleshooting](#troubleshooting)

---

## Architecture

```
Browser (form page)
   │  GET  /api/sheet?sheetName=..&queryColumn=..&queryValue=..  → read rows
   │  POST /api/sheet  { sheetName, action:"create", columnNames, rows }
   │  POST /api/sheet  { sheetName, action:"update", updateColumn,
   │                     updateValue, columnNames, rows }
   ▼
Next.js Route Handler (src/app/api/sheet/route.ts)   ← secrets live here
   │
   ▼
Google Sheets
   • Approach A: via an Apps Script Web App URL
   • Approach B: via the official Sheets API + Service Account
```

### The generic contract

`**GET /api/sheet**` — read rows. Inputs are query params (a GET can't carry a
body over `fetch`):


| Param                        | Required | Meaning                                                                            |
| ---------------------------- | -------- | ---------------------------------------------------------------------------------- |
| `sheetName`                  | yes      | which tab to read                                                                  |
| `queryColumn` + `queryValue` | no       | only return rows where that column equals that value; omit both to read everything |


Response: `{ columnNames: string[], rows: string[][] }` — the header row plus a
2-D array of the matching rows (all cells stringified).

`**POST /api/sheet**` — create or update, JSON body:


| Field                          | Required    | Meaning                                                                            |
| ------------------------------ | ----------- | ---------------------------------------------------------------------------------- |
| `sheetName`                    | yes         | which tab to write                                                                 |
| `action`                       | yes         | `"create"` or `"update"`                                                           |
| `columnNames`                  | yes         | `string[]` — the columns each value in `rows` maps to                              |
| `rows`                         | yes         | `string[]` — one row's values, aligned to `columnNames`                            |
| `updateColumn` + `updateValue` | update only | find the row where `updateColumn` equals `updateValue`, then set the given columns |


Response: `{ ok: true }`.

Because the caller supplies `columnNames`, the API never hard-codes a schema —
only the columns you send are written (create appends; update overwrites just
those cells in the matched row).

### The wishlist example

The wishlist tab (named `**Wishlist**`) uses these columns:


| id  | category | value | isChecked | createdDate | updatedDate |
| --- | -------- | ----- | --------- | ----------- | ----------- |


The **client** owns all values here: it generates `id` (`crypto.randomUUID()`),
sets `isChecked` as `"TRUE"`/`"FALSE"`, and stamps `createdDate`/`updatedDate`.
Edits match on `updateColumn: "id"` and always bump `updatedDate`.

---

## Choosing an approach


|                      | **A. Apps Script Web App**             | **B. Sheets API + Service Account** |
| -------------------- | -------------------------------------- | ----------------------------------- |
| Setup time           | ~10 min                                | ~30 min                             |
| Google Cloud project | Not required                           | Required                            |
| npm dependency       | None                                   | `googleapis`                        |
| Auth                 | A secret URL (+ optional shared token) | Service-account key (JWT)           |
| Best for             | Quick tools, portfolio demos           | Production, fine-grained control    |
| Rate limits          | Apps Script quotas                     | Sheets API quotas (higher)          |


If you just want it working fast, use **A**. If you want the "proper" Google
API, use **B**. Both plug into the **same** frontend page.

---

## Approach A — Google Apps Script Web App (quickest)

### A1. Create the sheet

1. Create a Google Sheet with a tab named `**Wishlist`** (this is the
  `sheetName` the frontend sends — see `WISHLIST_SHEET` in
   `src/app/untuk-nia/_data/wishlist.ts`).
2. In the first row add the headers, in this order:
  `id`, `category`, `value`, `isChecked`, `createdDate`, `updatedDate`.

> The generic Apps Script writes each row by matching `columnNames` to these
> headers, so the header names must match what the client sends. If the tab is
> completely empty, the first `create` will seed the header row for you from the
> `columnNames` it receives. You can add more tabs later — the API works with
> any `sheetName`.

### A2. Add the Apps Script

In the sheet: **Extensions → Apps Script**, replace the contents with:

```javascript
// Code.gs — generic Sheet API (works for any tab / any columns)
// Optional shared secret; must match SHEET_TOKEN in your Next.js env.
const TOKEN = "CHANGE_ME_TO_A_LONG_RANDOM_STRING";

function _json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

function _sheet(name) {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
}

function _headers(sheet) {
  const lastCol = sheet.getLastColumn();
  if (lastCol === 0) return [];
  return sheet
    .getRange(1, 1, 1, lastCol)
    .getValues()[0]
    .map(function (h) {
      return String(h);
    });
}

// READ: ?sheetName=..&queryColumn=..&queryValue=..
// → { columnNames: [...], rows: [[...], ...] }
function doGet(e) {
  if (TOKEN && e.parameter.token !== TOKEN) {
    return _json({ error: "Unauthorized" });
  }
  const sheetName = e.parameter.sheetName;
  if (!sheetName) return _json({ error: "sheetName is required" });
  const sheet = _sheet(sheetName);
  if (!sheet) return _json({ error: "Sheet not found: " + sheetName });

  const values = sheet.getDataRange().getValues();
  if (values.length === 0) return _json({ columnNames: [], rows: [] });

  const columnNames = values[0].map(String);
  let rows = values.slice(1);

  const queryColumn = e.parameter.queryColumn;
  if (queryColumn) {
    const col = columnNames.indexOf(queryColumn);
    if (col === -1)
      return _json({ error: "Unknown queryColumn: " + queryColumn });
    const queryValue = e.parameter.queryValue || "";
    rows = rows.filter(function (r) {
      return String(r[col]) === String(queryValue);
    });
  }

  // Stringify every cell for a consistent JSON contract.
  const stringRows = rows.map(function (r) {
    return r.map(function (c) {
      return c === null || c === undefined ? "" : String(c);
    });
  });
  return _json({ columnNames: columnNames, rows: stringRows });
}

// WRITE: body { sheetName, action, columnNames, rows, updateColumn?, updateValue? }
// (Apps Script Web Apps only support doGet/doPost, so there is no doPut.)
function doPost(e) {
  const body = JSON.parse(e.postData.contents || "{}");
  if (TOKEN && body.token !== TOKEN) {
    return _json({ error: "Unauthorized" });
  }
  if (!body.sheetName) return _json({ error: "sheetName is required" });
  const sheet = _sheet(body.sheetName);
  if (!sheet) return _json({ error: "Sheet not found: " + body.sheetName });

  const columnNames = body.columnNames;
  const rowValues = body.rows;
  if (!Array.isArray(columnNames) || !Array.isArray(rowValues)) {
    return _json({ error: "columnNames and rows must be arrays" });
  }
  if (columnNames.length !== rowValues.length) {
    return _json({ error: "columnNames and rows length mismatch" });
  }

  if (body.action === "create") return _create(sheet, columnNames, rowValues);
  if (body.action === "update") return _update(sheet, body, columnNames, rowValues);
  return _json({ error: "Unknown action: " + body.action });
}

function _create(sheet, columnNames, rowValues) {
  let headers = _headers(sheet);
  // Seed the header row from columnNames if the tab is empty.
  if (headers.length === 0) {
    sheet.appendRow(columnNames);
    headers = columnNames.slice();
  }
  // Align the incoming values to the sheet's header order.
  const row = headers.map(function (h) {
    const i = columnNames.indexOf(h);
    return i === -1 ? "" : rowValues[i];
  });
  sheet.appendRow(row);
  return _json({ ok: true });
}

function _update(sheet, body, columnNames, rowValues) {
  const updateColumn = body.updateColumn;
  const updateValue = body.updateValue;
  if (!updateColumn || updateValue === undefined) {
    return _json({ error: "updateColumn and updateValue are required" });
  }
  const values = sheet.getDataRange().getValues();
  if (values.length === 0) return _json({ error: "Sheet is empty" });

  const headers = values[0].map(String);
  const queryCol = headers.indexOf(updateColumn);
  if (queryCol === -1)
    return _json({ error: "Unknown updateColumn: " + updateColumn });

  for (let i = 1; i < values.length; i++) {
    if (String(values[i][queryCol]) === String(updateValue)) {
      const rowNumber = i + 1; // 1-based sheet row
      for (let j = 0; j < columnNames.length; j++) {
        const c = headers.indexOf(columnNames[j]);
        if (c !== -1) sheet.getRange(rowNumber, c + 1).setValue(rowValues[j]);
      }
      return _json({ ok: true });
    }
  }
  return _json({ error: "Row not found" });
}
```

### A3. Deploy it

1. **Deploy → New deployment → Type: Web app**.
2. Execute as **Me**, Who has access **Anyone**.
3. Authorize when prompted.
4. Copy the **Web app URL** (looks like `https://script.google.com/macros/s/AKfyc.../exec`).

### A4. Environment variables

Create `.env.local` in the project root (and add the same vars in Vercel later):

```bash
# .env.local
SHEET_WEBAPP_URL="https://script.google.com/macros/s/AKfyc.../exec"
SHEET_TOKEN="CHANGE_ME_TO_A_LONG_RANDOM_STRING"   # must equal TOKEN in Code.gs
```

> `.env.local` is gitignored by Next.js by default — keep it that way.

### A5. The API route (proxy)

Create `src/app/api/sheet/route.ts`:

```typescript
import { NextResponse } from "next/server";

// Always run this handler dynamically (no caching of user data).
export const dynamic = "force-dynamic";

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

// READ — inputs via query params (a GET can't carry a body over fetch).
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
  if (b.columnNames.length !== b.rows.length || b.columnNames.length === 0) {
    return NextResponse.json(
      { error: '"columnNames" and "rows" must be non-empty and equal length.' },
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
    if (!updateColumn || typeof b.updateValue !== "string") {
      return NextResponse.json(
        { error: '"updateColumn" and "updateValue" are required for update.' },
        { status: 400 },
      );
    }
    payload.updateColumn = updateColumn;
    payload.updateValue = b.updateValue;
  }

  return postToWebApp(base, payload);
}
```

> **Note on Apps Script + POST:** Apps Script Web Apps do not support
> `Content-Type: application/json` preflight from browsers directly, which is
> exactly why we proxy through our own server route (server-to-server has no
> CORS restriction). `e.postData.contents` still receives the JSON string.

Now skip to [The frontend page](#the-frontend-page-shared-by-both-approaches).

---

## Approach B — Sheets API v4 + Service Account (recommended for production)

### B1. Google Cloud setup

1. Go to [https://console.cloud.google.com/](https://console.cloud.google.com/) → create/select a project.
2. **APIs & Services → Library →** enable **Google Sheets API**.
3. **APIs & Services → Credentials → Create credentials → Service account**.
4. Open the service account → **Keys → Add key → Create new key → JSON**. A
  `.json` file downloads. It contains `client_email` and `private_key`.

### B2. Share the sheet with the service account

Open your Google Sheet → **Share** → paste the service account's
`client_email` (e.g. `my-bot@my-project.iam.gserviceaccount.com`) → give it
**Editor** access. Without this the API returns `403`.

Grab the **spreadsheet ID** from the URL:

```
https://docs.google.com/spreadsheets/d/<THIS_IS_THE_ID>/edit
```

### B3. Install the dependency

```bash
npm install googleapis
```

### B4. Environment variables

```bash
# .env.local
GOOGLE_SHEETS_ID="1AbC...the_long_id"
GOOGLE_SERVICE_ACCOUNT_EMAIL="my-bot@my-project.iam.gserviceaccount.com"
# Paste the whole private_key. Keep the literal \n sequences on one line:
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"
```

> No fixed range is needed anymore — the tab (`sheetName`) is provided per
> request, so the route reads/writes whichever tab the caller names.

> The private key contains newlines. Storing it as a single line with literal
> `\n` (and converting back in code) is the most portable way — especially on
> Vercel, whose UI stores it as a one-line string.

### B5. A small Sheets client helper

Create `src/app/api/sheet/_sheets.ts`:

```typescript
import { google } from "googleapis";

export function getSheetsClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
  const rawKey = process.env.GOOGLE_PRIVATE_KEY;
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID?.trim();

  if (!email || !rawKey || !spreadsheetId) {
    return null;
  }

  // Convert the escaped "\n" back into real newlines.
  const privateKey = rawKey.replace(/\\n/g, "\n");

  const auth = new google.auth.JWT({
    email,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = google.sheets({ version: "v4", auth });
  return { sheets, spreadsheetId };
}
```

### B6. The API route

Create `src/app/api/sheet/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { getSheetsClient } from "./_sheets";

export const dynamic = "force-dynamic";

function misconfig(): NextResponse {
  return NextResponse.json(
    { error: "Server misconfiguration: Google Sheets env vars missing." },
    { status: 503 },
  );
}

function badJson(): NextResponse {
  return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
}

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === "string");
}

// Convert a 0-based column index to an A1 letter (0 → A, 26 → AA).
function colLetter(index: number): string {
  let n = index;
  let s = "";
  do {
    s = String.fromCharCode((n % 26) + 65) + s;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return s;
}

// READ — inputs via query params.
export async function GET(request: Request) {
  const client = getSheetsClient();
  if (!client) return misconfig();

  const { searchParams } = new URL(request.url);
  const sheetName = searchParams.get("sheetName")?.trim();
  if (!sheetName) {
    return NextResponse.json(
      { error: 'Query param "sheetName" is required.' },
      { status: 400 },
    );
  }
  const queryColumn = searchParams.get("queryColumn")?.trim();
  const queryValue = searchParams.get("queryValue") ?? "";

  try {
    const res = await client.sheets.spreadsheets.values.get({
      spreadsheetId: client.spreadsheetId,
      range: sheetName, // whole tab
    });
    const values = res.data.values ?? [];
    if (values.length === 0) {
      return NextResponse.json({ columnNames: [], rows: [] });
    }

    const columnNames = values[0].map(String);
    let rows = values.slice(1);
    if (queryColumn) {
      const col = columnNames.indexOf(queryColumn);
      if (col === -1) {
        return NextResponse.json(
          { error: `Unknown queryColumn: ${queryColumn}` },
          { status: 400 },
        );
      }
      rows = rows.filter((r) => String(r[col] ?? "") === queryValue);
    }

    const stringRows = rows.map((r) =>
      columnNames.map((_, i) => (r[i] == null ? "" : String(r[i]))),
    );
    return NextResponse.json({ columnNames, rows: stringRows });
  } catch {
    return NextResponse.json(
      { error: "Failed to read the spreadsheet." },
      { status: 502 },
    );
  }
}

// CREATE / UPDATE
export async function POST(request: Request) {
  const client = getSheetsClient();
  if (!client) return misconfig();

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
  if (!isStringArray(b.columnNames) || !isStringArray(b.rows)) {
    return NextResponse.json(
      { error: '"columnNames" and "rows" must be arrays of strings.' },
      { status: 400 },
    );
  }
  if (b.columnNames.length !== b.rows.length || b.columnNames.length === 0) {
    return NextResponse.json(
      { error: '"columnNames" and "rows" must be non-empty and equal length.' },
      { status: 400 },
    );
  }
  const columnNames = b.columnNames;
  const rowValues = b.rows;

  try {
    // Read the header row (and data, for updates).
    const res = await client.sheets.spreadsheets.values.get({
      spreadsheetId: client.spreadsheetId,
      range: sheetName,
    });
    const values = res.data.values ?? [];
    let headers = values[0]?.map(String) ?? [];

    if (b.action === "create") {
      // Seed the header row from columnNames if the tab is empty.
      if (headers.length === 0) {
        await client.sheets.spreadsheets.values.append({
          spreadsheetId: client.spreadsheetId,
          range: sheetName,
          valueInputOption: "USER_ENTERED",
          requestBody: { values: [columnNames] },
        });
        headers = [...columnNames];
      }
      const row = headers.map((h) => {
        const i = columnNames.indexOf(h);
        return i === -1 ? "" : rowValues[i];
      });
      await client.sheets.spreadsheets.values.append({
        spreadsheetId: client.spreadsheetId,
        range: sheetName,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [row] },
      });
      return NextResponse.json({ ok: true });
    }

    // action === "update"
    const updateColumn =
      typeof b.updateColumn === "string" ? b.updateColumn.trim() : "";
    if (!updateColumn || typeof b.updateValue !== "string") {
      return NextResponse.json(
        { error: '"updateColumn" and "updateValue" are required for update.' },
        { status: 400 },
      );
    }
    const queryCol = headers.indexOf(updateColumn);
    if (queryCol === -1) {
      return NextResponse.json(
        { error: `Unknown updateColumn: ${updateColumn}` },
        { status: 400 },
      );
    }
    const dataIndex = values.findIndex(
      (row, i) => i > 0 && String(row[queryCol] ?? "") === b.updateValue,
    );
    if (dataIndex === -1) {
      return NextResponse.json({ error: "Row not found." }, { status: 404 });
    }

    // Overwrite only the provided columns in the matched row.
    const rowNumber = dataIndex + 1; // 1-based sheet row
    const existing = values[dataIndex];
    const merged = headers.map((h, i) => {
      const j = columnNames.indexOf(h);
      return j === -1 ? (existing[i] ?? "") : rowValues[j];
    });
    const lastCol = colLetter(headers.length - 1);
    await client.sheets.spreadsheets.values.update({
      spreadsheetId: client.spreadsheetId,
      range: `${sheetName}!A${rowNumber}:${lastCol}${rowNumber}`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [merged] },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to write to the spreadsheet." },
      { status: 502 },
    );
  }
}
```

---

## The frontend (wishlist page)

In this repo the frontend is the wishlist, implemented as a client component at
`src/app/untuk-nia/_components/WishlistChecklist.tsx` and rendered by
`src/app/untuk-nia/wishlist/page.tsx`. It:

- **reads** on mount via `GET /api/sheet?sheetName=Wishlist`, converts the
`{ columnNames, rows }` response into typed items with `rowsToWishlistItems`
(see `src/app/untuk-nia/_data/wishlist.ts`), and groups items by `category`;
- **toggles** an item's done state with an optimistic UI update, then a
`POST` with `action: "update"`, `updateColumn: "id"`, and
`columnNames: ["isChecked", "updatedDate"]` (rolls back on failure);
- **adds** an item via a modal → `POST` with `action: "create"` and the full
`WISHLIST_COLUMNS` row (client generates `id` + timestamps);
- **edits** category/value via the same modal → `POST` with `action: "update"`
and `columnNames: ["category", "value", "updatedDate"]`.

Because the client owns the column layout, the shared helpers live in
`_data/wishlist.ts`:

```ts
export const WISHLIST_SHEET = "Wishlist";
export const WISHLIST_COLUMNS = [
  "id",
  "category",
  "value",
  "isChecked",
  "createdDate",
  "updatedDate",
] as const;

type WishlistItem = {
  id: string;
  category: string;
  value: string;
  isChecked: boolean;
  createdDate: string; // ISO
  updatedDate: string; // ISO
};
```

Visit `http://localhost:3000/untuk-nia/wishlist` after `npm run dev`.

---

## Testing

Read all rows of a tab:

```bash
curl "http://localhost:3000/api/sheet?sheetName=Wishlist"
# → {"columnNames":["id","category",...],"rows":[["3f2c..","Makan",...]]}
```

Read only matching rows:

```bash
curl "http://localhost:3000/api/sheet?sheetName=Wishlist&queryColumn=category&queryValue=Makan"
```

Create a row (client supplies every column, aligned to `columnNames`):

```bash
curl -X POST http://localhost:3000/api/sheet \
  -H "Content-Type: application/json" \
  -d '{
    "sheetName": "Wishlist",
    "action": "create",
    "columnNames": ["id","category","value","isChecked","createdDate","updatedDate"],
    "rows": ["id-123","Makan","Sushi Hiro","FALSE","2026-01-01T00:00:00Z","2026-01-01T00:00:00Z"]
  }'
```

Update (toggle) just one column of the row where `id == id-123`:

```bash
curl -X POST http://localhost:3000/api/sheet \
  -H "Content-Type: application/json" \
  -d '{
    "sheetName": "Wishlist",
    "action": "update",
    "updateColumn": "id",
    "updateValue": "id-123",
    "columnNames": ["isChecked","updatedDate"],
    "rows": ["TRUE","2026-02-02T00:00:00Z"]
  }'
```

Then re-run the GET (or refresh the page) and confirm the new/edited row
appears both in the app and in the actual Google Sheet.

---

## Deployment (Vercel)

1. Push the code.
2. In Vercel: **Project → Settings → Environment Variables**, add the same keys
  you put in `.env.local` (`SHEET_WEBAPP_URL` + `SHEET_TOKEN` for Approach A,
   or `GOOGLE_SHEETS_ID` / `GOOGLE_SERVICE_ACCOUNT_EMAIL` / `GOOGLE_PRIVATE_KEY`
   for Approach B).
3. For `GOOGLE_PRIVATE_KEY`, paste the value **with literal `\n`** on one line
  (the code already converts `\n` back to real newlines).
4. Redeploy.

---

## Security & hardening

- **Never** expose the sheet ID, service-account key, or web-app token to the
client. Keep all Google calls in the route handler (server side).
- Add **input validation / length limits** on `category` and `value` to avoid
garbage or oversized rows (e.g. cap at 100 / 2000 chars).
- Add **rate limiting / spam protection** (e.g. a hidden honeypot field, a
simple per-IP limiter, or a CAPTCHA) since the write endpoint is public.
- Consider a **shared token** (Approach A already supports `SHEET_TOKEN`) so the
Apps Script URL can't be abused if it leaks.
- Sanitize/escape values when rendering if you ever switch to
`dangerouslySetInnerHTML` (the example above renders as plain text, which is
safe).
- Watch **quotas**: Sheets is not a database. For high write volume, buffer or
move to a real DB.

---

## Troubleshooting


| Symptom                              | Likely cause                          | Fix                                                                       |
| ------------------------------------ | ------------------------------------- | ------------------------------------------------------------------------- |
| `503 ... env vars missing`           | `.env.local` not loaded               | Restart `npm run dev` after editing env files                             |
| `403` from Sheets API (B)            | Sheet not shared with service account | Share the sheet with `client_email` as Editor                             |
| `error:0909006C ... PEM` (B)         | `\n` not converted                    | Ensure `privateKey.replace(/\\n/g, "\n")` and quotes around the env value |
| `Sheet not found: X`                 | `sheetName` doesn't match a tab       | Create/rename the tab (e.g. `Wishlist`) or fix the `sheetName` sent       |
| Edit returns `Row not found`         | `updateValue` matched no cell         | Confirm the row exists and `updateColumn`/`updateValue` are correct       |
| `Unknown queryColumn/updateColumn`   | Column name not in the header row     | Use a name that exists in row 1 of the tab                                |
| Old data cached                      | Response cached                       | Keep `export const dynamic = "force-dynamic"` and `cache: "no-store"`     |
| Changes to `Code.gs` not applied (A) | Old deployment                        | **Deploy → Manage deployments → Edit → New version**                      |


