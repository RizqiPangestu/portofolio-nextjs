import { readSheet, writeSheet } from "@/app/api/sheet/client";
import type { ResolveResult, ShortenResult, UrlShortener } from "./types";

const SHEET_NAME = "URL Shortener";
const URL_ID_COLUMN = "urlID";
const URL_ORIGINAL_COLUMN = "urlOriginal";
const URL_ID_LENGTH = 8;
const MAX_ID_ATTEMPTS = 3;

const ALPHANUMERIC = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

function generateUrlId(length = URL_ID_LENGTH): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  let id = "";
  for (let i = 0; i < length; i++) {
    id += ALPHANUMERIC[bytes[i]! % ALPHANUMERIC.length];
  }
  return id;
}

function rowRecord(
  columnNames: string[],
  row: string[],
): Record<string, string> {
  const rec: Record<string, string> = {};
  columnNames.forEach((col, i) => {
    rec[col] = row[i] ?? "";
  });
  return rec;
}

function toShortUrl(origin: string, urlId: string): string {
  return `${origin.replace(/\/$/, "")}/u/${urlId}`;
}

async function lookupByColumn(column: string, value: string) {
  return readSheet({
    sheetName: SHEET_NAME,
    queryColumn: column,
    queryValue: value,
  });
}

function lookupByUrlId(urlId: string) {
  return lookupByColumn(URL_ID_COLUMN, urlId);
}

function lookupByOriginalUrl(originalUrl: string) {
  return lookupByColumn(URL_ORIGINAL_COLUMN, originalUrl);
}

function findMatchingValue(
  columnNames: string[],
  rows: string[][],
  matchColumn: string,
  matchValue: string,
  returnColumn: string,
): string | null {
  for (const row of rows) {
    const rec = rowRecord(columnNames, row);
    if (rec[matchColumn]?.trim() !== matchValue) continue;
    const found = rec[returnColumn]?.trim();
    if (found) return found;
  }
  return null;
}

function findOriginalUrl(
  columnNames: string[],
  rows: string[][],
  urlId: string,
): string | null {
  return findMatchingValue(
    columnNames,
    rows,
    URL_ID_COLUMN,
    urlId,
    URL_ORIGINAL_COLUMN,
  );
}

function findExistingUrlId(
  columnNames: string[],
  rows: string[][],
  originalUrl: string,
): string | null {
  return findMatchingValue(
    columnNames,
    rows,
    URL_ORIGINAL_COLUMN,
    originalUrl,
    URL_ID_COLUMN,
  );
}

function isUrlIdTaken(
  columnNames: string[],
  rows: string[][],
  urlId: string,
): boolean {
  return findMatchingValue(
    columnNames,
    rows,
    URL_ID_COLUMN,
    urlId,
    URL_ID_COLUMN,
  ) !== null;
}

export const gsheetShortener: UrlShortener = {
  async shorten(originalUrl, { origin }): Promise<ShortenResult> {
    const existingOriginal = await lookupByOriginalUrl(originalUrl);
    if (!existingOriginal.ok) {
      return {
        ok: false,
        error: existingOriginal.error,
        status: existingOriginal.status,
      };
    }

    const existingId = findExistingUrlId(
      existingOriginal.columnNames,
      existingOriginal.rows,
      originalUrl,
    );
    if (existingId) {
      return { ok: true, shortUrl: toShortUrl(origin, existingId) };
    }

    let urlId: string | null = null;

    for (let attempt = 1; attempt <= MAX_ID_ATTEMPTS; attempt++) {
      const candidate = generateUrlId();
      const existing = await lookupByUrlId(candidate);
      if (!existing.ok) {
        return {
          ok: false,
          error: existing.error,
          status: existing.status,
        };
      }
      if (!isUrlIdTaken(existing.columnNames, existing.rows, candidate)) {
        urlId = candidate;
        break;
      }
    }

    if (!urlId) {
      return {
        ok: false,
        error: "Could not generate a unique short URL. Please try again.",
        status: 409,
      };
    }

    const created = await writeSheet({
      sheetName: SHEET_NAME,
      action: "create",
      columnNames: [URL_ID_COLUMN, URL_ORIGINAL_COLUMN],
      rows: [urlId, originalUrl],
    });
    if (!created.ok) {
      return {
        ok: false,
        error: created.error,
        status: created.status,
      };
    }

    return { ok: true, shortUrl: toShortUrl(origin, urlId) };
  },

  async resolve(urlId): Promise<ResolveResult> {
    const result = await lookupByUrlId(urlId);
    if (!result.ok) {
      return {
        ok: false,
        error: result.error,
        status: result.status,
      };
    }

    const original = findOriginalUrl(result.columnNames, result.rows, urlId);
    if (!original) {
      return { ok: false, error: "Short URL not found.", status: 404 };
    }

    try {
      return {
        ok: true,
        type: "redirect",
        location: new URL(original).toString(),
        status: 302,
      };
    } catch {
      return {
        ok: false,
        error: "Stored URL is invalid.",
        status: 502,
      };
    }
  },
};
