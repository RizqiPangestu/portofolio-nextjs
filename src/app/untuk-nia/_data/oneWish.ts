/**
 * "One Wish Willow" — a special floating popup where the user gets to write a
 * single wish, exactly once.
 *
 * The wish lives in a Google Sheet tab named "One Wish Willow" and is
 * read/written through `/api/sheet` (same contract the wishlist uses). Each row
 * has these columns:
 *   id | wish | createdDate
 *
 * The sheet is the source of truth for the "only once" rule: if a row already
 * exists, the wish has been made and the UI switches to read-only.
 */

/** Icon shown on the floating One Wish Willow button. */
export const ONE_WISH_BUTTON_ICON = "/untuk-nia/icons/one-wish-willow.png";

/** Warning shown at the top of the modal before the wish is submitted. */
export const ONE_WISH_WARNING = "Wish ini hanya bisa diisi sekali, sebelum submit, coba dipikir baik-baik ya sayang🥰";

/** The Sheet tab that stores the single wish, and its column order. */
export const ONE_WISH_SHEET = "One Wish Willow";
export const ONE_WISH_COLUMNS = ["id", "wish", "createdDate"] as const;

export type OneWish = {
  id: string;
  wish: string;
  createdDate: string;
};

function toStr(value: unknown): string {
  return typeof value === "string" ? value : String(value ?? "");
}

/**
 * Convert the generic `{ columnNames, rows }` response from `/api/sheet` into
 * the single stored wish (the first non-empty row), or `null` if none exists.
 */
export function rowsToOneWish(
  columnNames: string[],
  rows: string[][],
): OneWish | null {
  for (const row of rows) {
    const record: Record<string, unknown> = {};
    columnNames.forEach((col, i) => {
      record[col] = row[i];
    });
    const id = toStr(record.id).trim();
    const wish = toStr(record.wish).trim();
    if (!id && !wish) continue;
    return {
      id: id || crypto.randomUUID(),
      wish,
      createdDate: toStr(record.createdDate),
    };
  }
  return null;
}

/** Read the "One Wish Willow" tab and return the stored wish, or `null`. */
export async function fetchOneWish(): Promise<OneWish | null> {
  const res = await fetch(
    `/api/sheet?sheetName=${encodeURIComponent(ONE_WISH_SHEET)}`,
    { cache: "no-store" },
  );
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(json?.error ?? "Gagal memuat wish.");
  }
  return rowsToOneWish(
    Array.isArray(json?.columnNames) ? json.columnNames : [],
    Array.isArray(json?.rows) ? json.rows : [],
  );
}

/** Persist a new wish to the sheet. Returns the created `OneWish`. */
export async function saveOneWish(wish: string): Promise<OneWish> {
  const id = crypto.randomUUID();
  const createdDate = new Date().toISOString();
  const res = await fetch("/api/sheet", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sheetName: ONE_WISH_SHEET,
      action: "create",
      columnNames: ONE_WISH_COLUMNS,
      rows: [id, wish, createdDate],
    }),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(json?.error ?? "Gagal menyimpan wish.");
  }
  return { id, wish, createdDate };
}
