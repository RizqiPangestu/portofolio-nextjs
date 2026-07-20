/**
 * Data + helpers for the two "floating popup" features on the /untuk-nia page:
 *   1. Mini Quiz Games — interactive Q&A carousel.
 *   2. Quotes         — flirty sentences shown one at a time.
 *
 * The content now lives in three Google Sheet tabs and is read through
 * `/api/sheet` (same contract the events + wishlist use):
 *
 *   "Popups"  — one row per time-gated group (the parent):
 *       id | triggerAt | windowMs
 *
 *   "Quizzes" — one row per quiz question (child, grouped by popupId):
 *       id | popupId | orderNumber | type | title | question | hint |
 *       options | correctIndex | correctDate | correctFeedback | wrongFeedback
 *
 *   "Quotes"  — one row per quote (child, grouped by popupId):
 *       id | popupId | orderNumber | text
 *
 * A "Popup" defines the availability window (`[triggerAt, triggerAt + windowMs)`).
 * Quizzes and quotes attach to a popup via `popupId`, sorted by `orderNumber`.
 *
 * ─── Trigger group shape (shared) ───────────────────────────────────────────
 *  - id        : stable identifier for the group (used for React keys).
 *  - triggerAt : when the group unlocks. Accepts either an ISO datetime
 *                (e.g. "2026-07-14T00:00:00+07:00") or a relative offset from
 *                page load (e.g. "+0s", "+15s", "+2m", "+1h"; units: ms/s/m/h).
 *  - windowMs  : how long the group stays unlocked after `triggerAt` fires.
 *
 * ─── Quiz item shape ────────────────────────────────────────────────────────
 *  - type: "choice" → user picks 1 of 4 options.
 *      options       : answer strings (HTML allowed), pipe-separated in the sheet.
 *      correctIndex  : 0-based index into `options`.
 *  - type: "date"   → user picks a date and submits.
 *      correctDate   : ISO date string "YYYY-MM-DD".
 *  Shared: id, title, question (HTML), hint (optional), feedback.correct/.wrong.
 *
 * ─── Quote item shape ───────────────────────────────────────────────────────
 *  - id, text (HTML allowed).
 */

import { DEFAULT_CONFIG } from "./config";

/**
 * Common shape shared by every "floating popup" group. Both `QuizGroup` and
 * `QuoteGroup` extend this so the availability logic in the component can be
 * written once and reused.
 */
export type TriggeredGroup = {
  id: string;
  triggerAt: string;
  windowMs: number;
};

export type QuizFeedback = {
  correct: string;
  wrong: string;
};

type QuizCommon = {
  id: string;
  title: string;
  question: string;
  hint?: string;
  feedback: QuizFeedback;
};

export type ChoiceQuiz = QuizCommon & {
  type: "choice";
  options: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
};

export type DateQuiz = QuizCommon & {
  type: "date";
  correctDate: string;
};

export type Quiz = ChoiceQuiz | DateQuiz;

/**
 * Icon shown on the floating quiz button in the bottom-right corner of every
 * page. Swap the path here to change the button artwork.
 */
export const QUIZ_BUTTON_ICON = "/untuk-nia/icons/love-letter.png";

/**
 * Per-type visual metadata used by the "quiz type" chip inside the modal.
 *
 *  - icon  : path to the icon file rendered next to the type label.
 *  - label : short human-friendly text shown to the user for that type.
 *
 * Add a new entry here if a new `Quiz["type"]` is introduced, or change the
 * paths/labels to rebrand the existing types.
 */
export type QuizTypeMeta = {
  icon: string;
  label: string;
};

export const QUIZ_TYPE_META: Record<Quiz["type"], QuizTypeMeta> = {
  choice: {
    icon: "/untuk-nia/icons/book.png",
    label: "Pilihan Ganda",
  },
  date: {
    icon: "/untuk-nia/icons/valentine-calendar.png",
    label: "Pilih Tanggal",
  },
};

export type QuizGroup = TriggeredGroup & {
  quizzes: Quiz[];
};

/**
 * Icon shown on the floating quotes button. Swap the path here to change the
 * button artwork.
 */
export const QUOTE_BUTTON_ICON = "/untuk-nia/icons/quote.svg";

export type Quote = {
  id: string;
  text: string;
};

export type QuoteGroup = TriggeredGroup & {
  quotes: Quote[];
};

// ─── Sheet-backed loading ────────────────────────────────────────────────────

/** The Sheet tabs that store popups + their children. */
export const POPUPS_SHEET = "Popups";
export const QUIZZES_SHEET = "Quizzes";
export const QUOTES_SHEET = "Quotes";

/**
 * Config knobs used while building popups from sheet rows. Defaults come from
 * `DEFAULT_CONFIG`; callers (e.g. `FloatingPopups`) pass the sheet-loaded values.
 */
export type PopupsBuildConfig = {
  defaultWindowMs: number;
  optionsSeparator: string;
};

const POPUPS_BUILD_DEFAULTS: PopupsBuildConfig = {
  defaultWindowMs: DEFAULT_CONFIG.popups.defaultWindowMs,
  optionsSeparator: DEFAULT_CONFIG.popups.optionsSeparator,
};

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

function toStr(value: unknown): string {
  return typeof value === "string" ? value : String(value ?? "");
}

/**
 * Normalize a raw date cell into a plain `yyyy-mm-dd` string (to match the value
 * produced by `<input type="date">`). Returns "" if empty, or the original
 * trimmed string if it can't be parsed.
 */
function toDateString(value: unknown): string {
  const raw = toStr(value).trim();
  if (!raw) return "";
  // Already starts with yyyy-mm-dd (e.g. "2024-01-05" or an ISO timestamp).
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Zip a header row + data row into a `{ column: value }` record. */
function zip(columns: string[], row: string[]): Record<string, unknown> {
  const record: Record<string, unknown> = {};
  columns.forEach((col, i) => {
    record[col] = row[i];
  });
  return record;
}

function normalizeQuiz(
  raw: Record<string, unknown>,
  optionsSeparator: string,
): Quiz | null {
  const id = toStr(raw.id).trim();
  const type = toStr(raw.type).trim().toLowerCase();
  const title = toStr(raw.title).trim();
  const question = toStr(raw.question);
  if (!id || (type !== "choice" && type !== "date")) return null;

  const feedback: QuizFeedback = {
    correct: toStr(raw.correctFeedback),
    wrong: toStr(raw.wrongFeedback),
  };
  const hint = toStr(raw.hint).trim();
  const common: QuizCommon = {
    id,
    title,
    question,
    feedback,
    ...(hint ? { hint } : {}),
  };

  if (type === "choice") {
    const options = toStr(raw.options)
      .split(optionsSeparator)
      .map((o) => o.trim())
      .filter((o) => o.length > 0);
    if (options.length === 0) return null;
    const idx = toNumber(raw.correctIndex) ?? 0;
    const correctIndex = Math.min(Math.max(Math.floor(idx), 0), 3) as
      | 0
      | 1
      | 2
      | 3;
    return {
      ...common,
      type: "choice",
      options: options as unknown as [string, string, string, string],
      correctIndex,
    };
  }

  return {
    ...common,
    type: "date",
    correctDate: toDateString(raw.correctDate),
  };
}

function normalizeQuote(raw: Record<string, unknown>): Quote | null {
  const id = toStr(raw.id).trim();
  const text = toStr(raw.text);
  if (!id || !text.trim()) return null;
  return { id, text };
}

/**
 * Group child rows by their `popupId`, sorted by `orderNumber`, using the given
 * normalizer to turn each raw row into a typed item.
 */
function groupByPopup<T>(
  columns: string[],
  rows: string[][],
  normalize: (raw: Record<string, unknown>) => T | null,
): Map<string, T[]> {
  const staged = new Map<string, { item: T; order: number }[]>();
  for (const row of rows) {
    const r = zip(columns, row);
    const popupId = toStr(r.popupId).trim();
    if (!popupId) continue;
    const item = normalize(r);
    if (item == null) continue;
    const order = toNumber(r.orderNumber) ?? 0;
    const list = staged.get(popupId) ?? [];
    list.push({ item, order });
    staged.set(popupId, list);
  }

  const out = new Map<string, T[]>();
  for (const [popupId, list] of staged) {
    list.sort((a, b) => a.order - b.order);
    out.set(
      popupId,
      list.map((x) => x.item),
    );
  }
  return out;
}

type PopupParent = { id: string; triggerAt: string; windowMs: number };

function normalizePopup(
  raw: Record<string, unknown>,
  defaultWindowMs: number,
): PopupParent | null {
  const id = toStr(raw.id).trim();
  const triggerAt = toStr(raw.triggerAt).trim();
  if (!id || !triggerAt) return null;
  const windowMs = toNumber(raw.windowMs);
  return {
    id,
    triggerAt,
    windowMs: windowMs != null && windowMs > 0 ? windowMs : defaultWindowMs,
  };
}

/**
 * Combine the generic `{ columnNames, rows }` responses from the "Popups",
 * "Quizzes", and "Quotes" tabs into the typed group arrays the UI consumes.
 */
export function rowsToPopups(
  popupsColumns: string[],
  popupsRows: string[][],
  quizzesColumns: string[],
  quizzesRows: string[][],
  quotesColumns: string[],
  quotesRows: string[][],
  config: PopupsBuildConfig = POPUPS_BUILD_DEFAULTS,
): { quizGroups: QuizGroup[]; quoteGroups: QuoteGroup[] } {
  const quizzesByPopup = groupByPopup(quizzesColumns, quizzesRows, (raw) =>
    normalizeQuiz(raw, config.optionsSeparator),
  );
  const quotesByPopup = groupByPopup(quotesColumns, quotesRows, normalizeQuote);

  const quizGroups: QuizGroup[] = [];
  const quoteGroups: QuoteGroup[] = [];

  for (const row of popupsRows) {
    const popup = normalizePopup(zip(popupsColumns, row), config.defaultWindowMs);
    if (!popup) continue;

    const quizzes = quizzesByPopup.get(popup.id);
    if (quizzes && quizzes.length > 0) {
      quizGroups.push({ ...popup, quizzes });
    }

    const quotes = quotesByPopup.get(popup.id);
    if (quotes && quotes.length > 0) {
      quoteGroups.push({ ...popup, quotes });
    }
  }

  return { quizGroups, quoteGroups };
}

async function readSheet(
  sheetName: string,
): Promise<{ columnNames: string[]; rows: string[][] }> {
  const res = await fetch(`/api/sheet?sheetName=${encodeURIComponent(sheetName)}`, {
    cache: "no-store",
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(json?.error ?? `Gagal memuat ${sheetName}.`);
  }
  return {
    columnNames: Array.isArray(json?.columnNames) ? json.columnNames : [],
    rows: Array.isArray(json?.rows) ? json.rows : [],
  };
}

/**
 * Read the three popup tabs from `/api/sheet` and return typed quiz/quote
 * groups. Used by `FloatingPopups` on mount.
 */
export async function fetchPopups(
  config?: Partial<PopupsBuildConfig>,
): Promise<{
  quizGroups: QuizGroup[];
  quoteGroups: QuoteGroup[];
}> {
  const merged: PopupsBuildConfig = { ...POPUPS_BUILD_DEFAULTS, ...config };
  const [popups, quizzes, quotes] = await Promise.all([
    readSheet(POPUPS_SHEET),
    readSheet(QUIZZES_SHEET),
    readSheet(QUOTES_SHEET),
  ]);

  return rowsToPopups(
    popups.columnNames,
    popups.rows,
    quizzes.columnNames,
    quizzes.rows,
    quotes.columnNames,
    quotes.rows,
    merged,
  );
}
