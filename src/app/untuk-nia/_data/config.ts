/**
 * App-wide config for the /untuk-nia page.
 *
 * The default values live here in `DEFAULT_CONFIG` (the single source of truth
 * that the data builders + components fall back to). They can be overridden at
 * runtime from a Google Sheet tab named "Config" with these columns:
 *
 *   key | value | type
 *
 *  - key   : dot-notation path into the config, e.g. "events.defaultWindowMs".
 *  - value : the raw cell value.
 *  - type  : how to parse `value` — "string" | "number" | "boolean" | "array"
 *            | "object". `array`/`object` are parsed as JSON.
 *
 * Only keys present in the sheet override the defaults; anything missing or
 * unparseable keeps its `DEFAULT_CONFIG` value.
 */

export const CONFIG_SHEET = "Config";

export type NiaConfig = {
  audio: {
    /**
     * Background track file name only (e.g. "main-sound.mp3"). The
     * "/untuk-nia/audio/" prefix is added in code — see `resolveAudioSrc`.
     * Override via the "audio.src" config row.
     */
    src: string;
  };
  events: {
    defaultWindowMs: number;
    defaultViewMs: number;
    carouselMinViewMs: number;
    sendCookiePrefix: string;
    audioVolume: number;
  };
  popups: {
    defaultWindowMs: number;
    defaultViewMs: number;
    cookieMaxAgeS: number;
    optionsSeparator: string;
    seenCookiePrefix: string;
  };
  wishlist: {
    toggleDebounceMs: number;
    defaultCategory: string;
    categoryEmoji: Record<string, string>;
  };
};

export const DEFAULT_CONFIG: NiaConfig = {
  audio: {
    src: "glenn-fredly-romansa-ke-masa-depan",
  },
  events: {
    defaultWindowMs: 24 * 60 * 60 * 1000,
    defaultViewMs: 5000,
    carouselMinViewMs: 5000,
    sendCookiePrefix: "untuk-nia-event-",
    audioVolume: 1,
  },
  popups: {
    defaultWindowMs: 24 * 60 * 60 * 1000,
    defaultViewMs: 5000,
    cookieMaxAgeS: 365 * 24 * 60 * 60,
    optionsSeparator: "|",
    seenCookiePrefix: "untuk-nia-quote-seen",
  },
  wishlist: {
    toggleDebounceMs: 500,
    defaultCategory: "Lainnya",
    categoryEmoji: {
      makan: "🍜",
      food: "🍜",
      kuliner: "🍜",
      ngedate: "🎡",
      date: "🎡",
      activity: "🎡",
      aktivitas: "🎡",
      jalan: "🧳",
      travel: "🧳",
      nonton: "🎬",
      film: "🎬",
    },
  },
};

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/**
 * Deep-merge an (possibly partial or stale) config over `DEFAULT_CONFIG`.
 *
 * Cached configs written by older builds may be missing keys that were added
 * later (e.g. `audio`). Merging over the defaults guarantees every key exists,
 * so consumers can safely read nested values like `config.audio.src` without a
 * crash — cached values still win, defaults only fill the gaps.
 */
export function withConfigDefaults(value: unknown): NiaConfig {
  const merge = (defaults: unknown, incoming: unknown): unknown => {
    if (!isPlainObject(defaults) || !isPlainObject(incoming)) {
      return incoming === undefined ? defaults : incoming;
    }
    const out: Record<string, unknown> = { ...incoming };
    for (const key of Object.keys(defaults)) {
      out[key] = merge(defaults[key], incoming[key]);
    }
    return out;
  };
  return merge(DEFAULT_CONFIG, value) as NiaConfig;
}

function parseValue(raw: string, type: string): unknown {
  const t = type.trim().toLowerCase();
  switch (t) {
    case "number": {
      const n = Number(raw.trim());
      return Number.isFinite(n) ? n : undefined;
    }
    case "boolean": {
      const v = raw.trim().toLowerCase();
      return v === "true" || v === "1" || v === "yes";
    }
    case "array":
    case "object": {
      try {
        return JSON.parse(raw);
      } catch {
        return undefined;
      }
    }
    default:
      return raw;
  }
}

function setByPath(
  target: Record<string, unknown>,
  path: string,
  value: unknown,
): void {
  const parts = path.split(".").map((p) => p.trim());
  let node = target;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    if (typeof node[p] !== "object" || node[p] === null) node[p] = {};
    node = node[p] as Record<string, unknown>;
  }
  node[parts[parts.length - 1]] = value;
}

/**
 * Merge the generic `{ columnNames, rows }` response from the "Config" tab over
 * `DEFAULT_CONFIG`. Rows are `key | value | type`.
 */
export function rowsToConfig(columns: string[], rows: string[][]): NiaConfig {
  const result = JSON.parse(JSON.stringify(DEFAULT_CONFIG)) as NiaConfig;
  const keyIdx = columns.indexOf("key");
  const valIdx = columns.indexOf("value");
  const typeIdx = columns.indexOf("type");
  if (keyIdx === -1 || valIdx === -1) return result;

  for (const row of rows) {
    const key = (row[keyIdx] ?? "").trim();
    if (!key) continue;
    const rawVal = row[valIdx] ?? "";
    const type = typeIdx === -1 ? "string" : row[typeIdx] ?? "string";
    const parsed = parseValue(rawVal, type);
    if (parsed === undefined) continue;
    setByPath(result as unknown as Record<string, unknown>, key, parsed);
  }

  return result;
}

/** Read the "Config" tab from `/api/sheet` and return a merged `NiaConfig`. */
export async function fetchConfig(): Promise<NiaConfig> {
  const res = await fetch(
    `/api/sheet?sheetName=${encodeURIComponent(CONFIG_SHEET)}`,
    { cache: "no-store" },
  );
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(json?.error ?? "Gagal memuat config.");
  }
  return rowsToConfig(
    Array.isArray(json?.columnNames) ? json.columnNames : [],
    Array.isArray(json?.rows) ? json.rows : [],
  );
}
