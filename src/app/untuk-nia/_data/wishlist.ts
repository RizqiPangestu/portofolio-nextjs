/**
 * Wishlist types + helpers for the `/untuk-nia/wishlist` page.
 *
 * The data now lives in a Google Sheet and is read/written through
 * `/api/sheet`. Each row has these columns:
 *   id | category | value | isChecked | createdDate | updatedDate
 */

import { DEFAULT_CONFIG } from "./config";

export type WishlistItem = {
  id: string;
  category: string;
  value: string;
  isChecked: boolean;
  createdDate: string;
  updatedDate: string;
};

/**
 * Rows arrive from the Sheet loosely typed (booleans may come back as the
 * strings "TRUE"/"FALSE", numbers, etc.), so normalize an unknown row into a
 * well-typed `WishlistItem`.
 */
export function toBool(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const v = value.trim().toLowerCase();
    return v === "true" || v === "1" || v === "yes" || v === "✓";
  }
  return false;
}

/** The Sheet tab that stores the wishlist, and its column order. */
export const WISHLIST_SHEET = "Wishlist";
export const WISHLIST_COLUMNS = [
  "id",
  "category",
  "value",
  "isChecked",
  "createdDate",
  "updatedDate",
] as const;

/**
 * Convert the generic `{ columnNames, rows }` response from `/api/sheet` into
 * typed wishlist items.
 */
export function rowsToWishlistItems(
  columnNames: string[],
  rows: string[][],
  defaultCategory: string = DEFAULT_CONFIG.wishlist.defaultCategory,
): WishlistItem[] {
  return rows
    .map((row) => {
      const record: Record<string, unknown> = {};
      columnNames.forEach((col, i) => {
        record[col] = row[i];
      });
      return normalizeWishlistItem(record, defaultCategory);
    })
    .filter((x): x is WishlistItem => x !== null);
}

export function normalizeWishlistItem(
  raw: unknown,
  defaultCategory: string = DEFAULT_CONFIG.wishlist.defaultCategory,
): WishlistItem | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const id = typeof r.id === "string" ? r.id : String(r.id ?? "");
  const value = typeof r.value === "string" ? r.value : String(r.value ?? "");
  if (!id || !value.trim()) return null;
  const category =
    typeof r.category === "string" && r.category.trim()
      ? r.category.trim()
      : defaultCategory;
  return {
    id,
    category,
    value: value.trim(),
    isChecked: toBool(r.isChecked),
    createdDate: String(r.createdDate ?? ""),
    updatedDate: String(r.updatedDate ?? ""),
  };
}

/**
 * A small emoji per known category, with a sensible fallback. The map defaults
 * to `DEFAULT_CONFIG.wishlist.categoryEmoji` but can be overridden with the
 * sheet-loaded config.
 */
export function categoryEmoji(
  category: string,
  map: Record<string, string> = DEFAULT_CONFIG.wishlist.categoryEmoji,
): string {
  return map[category.trim().toLowerCase()] ?? "💗";
}