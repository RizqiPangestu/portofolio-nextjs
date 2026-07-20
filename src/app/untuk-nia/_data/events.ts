/**
 * Event types + helpers for the triggered popups on the `/untuk-nia` main page.
 *
 * The data now lives in two Google Sheet tabs and is read through `/api/sheet`
 * (same contract the wishlist uses):
 *
 *   "Events" — one row per event (the parent):
 *       id | triggerAt | windowMs | cookieSecond | audio | decorations
 *
 *   "EventDetails" — one row per carousel slide (the child):
 *       id | eventId | orderNumber | title | body | rawImage | parsedImage | viewMs
 *
 * Slides are matched to their event by `eventId` and sorted by `orderNumber`.
 * `rawImage` is intentionally ignored (it holds the original Drive share link);
 * `parsedImage` is the usable image URL.
 */

import { DEFAULT_CONFIG } from "./config";
import type { DecorationLayer } from "./decorations";

export type EventTrigger = string;

export type EventAudioConfig = {
  src: string;
  volume?: number;
  loop?: boolean;
};

/**
 * Per-event "shown before" cookie config.
 *
 *  - enabled : if true, a cookie is set when the user finishes the popup so
 *              the same event won't fire again on later visits until the
 *              cookie expires. When false the cookie is ignored (the event can
 *              fire on every eligible page-load).
 *  - maxAgeS : cookie lifetime in seconds. Ignored when `enabled` is false.
 */
export type EventCookieConfig = {
  enabled: boolean;
  maxAgeS: number;
};

/**
 * One slide inside an event's carousel.
 *
 *  - title : short heading
 *  - body  : HTML string (rendered with dangerouslySetInnerHTML)
 *  - image : public-relative path or absolute URL
 *  - viewMs: minimum read time before the Next button unlocks for this slide.
 */
export type EventObject = {
  id: string;
  title: string;
  body: string;
  image: string;
  viewMs?: number;
};

/**
 * One triggered popup carousel on the main page.
 *
 *  - id         : stable identifier (also used for the "shown before" cookie).
 *  - triggerAt  : when the event becomes eligible. Accepts an ISO datetime or a
 *                 relative offset from page load ("+15s", "+2m", "+1h", …).
 *  - windowMs   : (optional) how long the event stays eligible after the
 *                 trigger fires. Defaults to 24 h in the consumer.
 *  - items      : carousel slides shown inside the popup, in order.
 *  - decorations: (optional) decoration layers played on top of the page while
 *                 the popup is open (referenced by name from a predefined set).
 *  - audio      : (optional) event-specific background track.
 *  - cookie     : "shown before" config.
 */
export type Event = {
  id: string;
  triggerAt: EventTrigger;
  windowMs?: number;
  items: EventObject[];
  decorations?: DecorationLayer[];
  audio?: EventAudioConfig;
  cookie: EventCookieConfig;
};

/** The Sheet tabs that store events, and their column order. */
export const EVENTS_SHEET = "Events";
export const EVENT_DETAILS_SHEET = "EventDetails";

/**
 * Config knobs used while building events from sheet rows. Defaults come from
 * `DEFAULT_CONFIG`; callers (e.g. `EventPopup`) pass the sheet-loaded values.
 */
export type EventsBuildConfig = {
  defaultViewMs: number;
  audioVolume: number;
};

const EVENTS_BUILD_DEFAULTS: EventsBuildConfig = {
  defaultViewMs: DEFAULT_CONFIG.events.defaultViewMs,
  audioVolume: DEFAULT_CONFIG.events.audioVolume,
};

/**
 * Predefined decoration sets, kept in code and referenced by name from the
 * `decorations` column in the Events sheet (e.g. a cell value of "birthday").
 * Lookups are lenient: case-insensitive and a trailing "-decorations" suffix is
 * ignored, so both "birthday" and "birthday-decorations" resolve here.
 */
export const birthdayDecorations: DecorationLayer[] = [
  {
    id: "bday-fireworks",
    effect: "firework",
    intervalMs: 600,
    durationMs: 1600,
    position: "random",
    size: 220,
    movement: "burst",
    color: ["#ff7eb6", "#ffd166", "#a0f0ff", "#c8b6ff", "#ff9bcd"],
  },
  {
    id: "bday-emoji",
    effect: "emoji",
    intervalMs: 350,
    durationMs: 4500,
    position: "random",
    size: [30, 64],
    movement: "rise",
    content: ["🎂", "🎉", "🎊", "🎈", "🎁", "💖", "💕", "✨", "🌸"],
  },
  {
    id: "bday-sparkles",
    effect: "sparkle",
    intervalMs: 100,
    durationMs: 1400,
    position: "random",
    size: [3, 5],
    movement: "twinkle",
    color: ["#ffd1e8", "#fff3a8", "#a0f0ff", "#ffffff"],
  },
  {
    id: "bday-spiral",
    effect: "spiral",
    intervalMs: 5000,
    durationMs: 3000,
    position: "random",
    size: 100,
    movement: "spin",
  },
];

export const DECORATION_SETS: Record<string, DecorationLayer[]> = {
  birthday: birthdayDecorations,
};

function decorationsFor(raw: unknown): DecorationLayer[] | undefined {
  const key = String(raw ?? "")
    .trim()
    .toLowerCase()
    .replace(/-?decorations$/, "");
  if (!key) return undefined;
  return DECORATION_SETS[key];
}

/** Parse a loosely-typed sheet cell into a finite number, or null. */
function toNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const t = value.trim();
    if (!t) return null;
    const n = Number(t);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/**
 * `cookieSecond` → cookie config: 0/negative/invalid disables the cookie,
 * otherwise the value is the cookie lifetime in seconds.
 */
function cookieFromSeconds(raw: unknown): EventCookieConfig {
  const n = toNumber(raw);
  if (n == null || n <= 0) return { enabled: false, maxAgeS: 0 };
  return { enabled: true, maxAgeS: Math.floor(n) };
}

/** Build "/untuk-nia/audio/<file>" from a file name, appending .mp3 if needed. */
function audioSrcFrom(raw: unknown, volume: number): EventAudioConfig | undefined {
  const file = String(raw ?? "").trim();
  if (!file) return undefined;
  const fileName = /\.[a-z0-9]+$/i.test(file) ? file : `${file}.mp3`;
  return { src: `/untuk-nia/audio/${fileName}`, volume, loop: true };
}

/** Zip a header row + data row into a `{ column: value }` record. */
function zip(columns: string[], row: string[]): Record<string, unknown> {
  const record: Record<string, unknown> = {};
  columns.forEach((col, i) => {
    record[col] = row[i];
  });
  return record;
}

/** Group EventDetails rows by `eventId`, sorted by `orderNumber`. */
function groupDetails(
  columns: string[],
  rows: string[][],
  defaultViewMs: number,
): Map<string, EventObject[]> {
  const staged = new Map<string, { item: EventObject; order: number }[]>();

  for (const row of rows) {
    const r = zip(columns, row);
    const id = String(r.id ?? "").trim();
    const eventId = String(r.eventId ?? "").trim();
    if (!id || !eventId) continue;

    const viewMsNum = toNumber(r.viewMs);
    const item: EventObject = {
      id,
      title: String(r.title ?? "").trim(),
      body: String(r.body ?? ""),
      image: String(r.parsedImage ?? "").trim(),
      viewMs: viewMsNum != null && viewMsNum > 0 ? viewMsNum : defaultViewMs,
    };

    const order = toNumber(r.orderNumber) ?? 0;
    const list = staged.get(eventId) ?? [];
    list.push({ item, order });
    staged.set(eventId, list);
  }

  const out = new Map<string, EventObject[]>();
  for (const [eventId, list] of staged) {
    list.sort((a, b) => a.order - b.order);
    out.set(
      eventId,
      list.map((x) => x.item),
    );
  }
  return out;
}

function normalizeEvent(
  raw: Record<string, unknown>,
  detailsByEvent: Map<string, EventObject[]>,
  audioVolume: number,
): Event | null {
  const id = String(raw.id ?? "").trim();
  const triggerAt = String(raw.triggerAt ?? "").trim();
  if (!id || !triggerAt) return null;

  const event: Event = {
    id,
    triggerAt,
    items: detailsByEvent.get(id) ?? [],
    cookie: cookieFromSeconds(raw.cookieSecond),
  };

  const windowMs = toNumber(raw.windowMs);
  if (windowMs != null && windowMs > 0) event.windowMs = windowMs;

  const audio = audioSrcFrom(raw.audio, audioVolume);
  if (audio) event.audio = audio;

  const decorations = decorationsFor(raw.decorations);
  if (decorations) event.decorations = decorations;

  return event;
}

/**
 * Combine the generic `{ columnNames, rows }` responses from the "Events" and
 * "EventDetails" tabs into typed `Event`s with their slides attached.
 */
export function rowsToEvents(
  eventsColumns: string[],
  eventsRows: string[][],
  detailsColumns: string[],
  detailsRows: string[][],
  config: EventsBuildConfig = EVENTS_BUILD_DEFAULTS,
): Event[] {
  const detailsByEvent = groupDetails(
    detailsColumns,
    detailsRows,
    config.defaultViewMs,
  );
  return eventsRows
    .map((row) =>
      normalizeEvent(zip(eventsColumns, row), detailsByEvent, config.audioVolume),
    )
    .filter((x): x is Event => x !== null);
}

/**
 * Read both event tabs from `/api/sheet` and return typed events. Used by
 * `EventPopup` on mount.
 */
export async function fetchEvents(
  config?: Partial<EventsBuildConfig>,
): Promise<Event[]> {
  const merged: EventsBuildConfig = { ...EVENTS_BUILD_DEFAULTS, ...config };
  const [eventsRes, detailsRes] = await Promise.all([
    fetch(`/api/sheet?sheetName=${encodeURIComponent(EVENTS_SHEET)}`, {
      cache: "no-store",
    }),
    fetch(`/api/sheet?sheetName=${encodeURIComponent(EVENT_DETAILS_SHEET)}`, {
      cache: "no-store",
    }),
  ]);

  const eventsJson = await eventsRes.json().catch(() => null);
  const detailsJson = await detailsRes.json().catch(() => null);

  if (!eventsRes.ok) {
    throw new Error(eventsJson?.error ?? "Gagal memuat events.");
  }
  if (!detailsRes.ok) {
    throw new Error(detailsJson?.error ?? "Gagal memuat event details.");
  }

  return rowsToEvents(
    Array.isArray(eventsJson?.columnNames) ? eventsJson.columnNames : [],
    Array.isArray(eventsJson?.rows) ? eventsJson.rows : [],
    Array.isArray(detailsJson?.columnNames) ? detailsJson.columnNames : [],
    Array.isArray(detailsJson?.rows) ? detailsJson.rows : [],
    merged,
  );
}
