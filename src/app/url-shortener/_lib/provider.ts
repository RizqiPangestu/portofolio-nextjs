import type { UrlShortenerProviderName } from "./types";

/**
 * Select the URL shortener backend.
 *
 * `SHORTENER_PROVIDER=http|gsheet` forces a backend.
 * If unset, the HTTP service is used when `SHORTENER_SERVICE_HOST` is set,
 * otherwise Google Sheets.
 */
export function getShortenerProviderName(): UrlShortenerProviderName {
  const explicit = process.env.SHORTENER_PROVIDER?.trim().toLowerCase();
  if (explicit === "gsheet" || explicit === "sheet" || explicit === "google-sheet") {
    return "gsheet";
  }
  if (explicit === "http" || explicit === "service") {
    return "http";
  }
  if (process.env.SHORTENER_SERVICE_HOST?.trim()) return "http";
  return "gsheet";
}
