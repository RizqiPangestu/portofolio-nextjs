/**
 * Photo / memory gallery for the `/untuk-nia` home page.
 *
 * Data lives in a Google Sheet tab named "PhotoGallery" and is read through
 * `/api/sheet` (same contract the events + wishlist use):
 *
 *   parsedImage | shortCaptions
 *
 * `parsedImage` is the usable image URL (typically an lh3.googleusercontent.com
 * Drive link — see docs/google-drive-image-storage.md). `rawImage`-style share
 * links are not used here. Rows without a `parsedImage` are skipped. Order
 * follows the sheet.
 */

export type PhotoGalleryItem = {
  image: string;
  caption: string;
};

/** The Sheet tab that stores gallery rows. */
export const PHOTO_GALLERY_SHEET = "PhotoGallery";

/** Zip a header row + data row into a `{ column: value }` record. */
function zip(columns: string[], row: string[]): Record<string, unknown> {
  const record: Record<string, unknown> = {};
  columns.forEach((col, i) => {
    record[col] = row[i];
  });
  return record;
}

/**
 * Convert the generic `{ columnNames, rows }` response from `/api/sheet` into
 * typed gallery items. Rows without a usable `parsedImage` are dropped.
 */
export function rowsToPhotoGallery(
  columns: string[],
  rows: string[][],
): PhotoGalleryItem[] {
  const items: PhotoGalleryItem[] = [];

  for (const row of rows) {
    const r = zip(columns, row);
    const image = String(r.parsedImage ?? "").trim();
    if (!image) continue;

    items.push({
      image,
      caption: String(r.shortCaptions ?? "").trim(),
    });
  }

  return items;
}

/**
 * Read the "PhotoGallery" tab from `/api/sheet` and return typed items.
 * Used by `PhotoGallery` on mount.
 */
export async function fetchPhotoGallery(): Promise<PhotoGalleryItem[]> {
  const res = await fetch(
    `/api/sheet?sheetName=${encodeURIComponent(PHOTO_GALLERY_SHEET)}`,
    { cache: "no-store" },
  );
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(json?.error ?? "Gagal memuat photo gallery.");
  }
  return rowsToPhotoGallery(
    Array.isArray(json?.columnNames) ? json.columnNames : [],
    Array.isArray(json?.rows) ? json.rows : [],
  );
}
