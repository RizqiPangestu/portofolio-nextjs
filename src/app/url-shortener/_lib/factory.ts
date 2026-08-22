import { gsheetShortener } from "./gsheet";
import { httpShortener } from "./http";
import { getShortenerProviderName } from "./provider";
import type { UrlShortener, UrlShortenerProviderName } from "./types";

export { getShortenerProviderName };

export function createUrlShortener(
  name: UrlShortenerProviderName = getShortenerProviderName(),
): UrlShortener {
  switch (name) {
    case "gsheet":
      return gsheetShortener;
    case "http":
      return httpShortener;
  }
}
