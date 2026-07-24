"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  fetchPopups,
  QUIZ_BUTTON_ICON,
  QUIZ_TYPE_META,
  QUOTE_BUTTON_ICON,
  type ChoiceQuiz,
  type DateQuiz,
  type Quiz,
  type QuizGroup,
  type Quote,
  type QuoteGroup,
  type TriggeredGroup,
} from "../_data/popups";
import { DEFAULT_CONFIG } from "../_data/config";
import { useConfig } from "./ConfigProvider";

// ─── Cookie helpers (shared) ────────────────────────────────────────────────

const QUIZ_SOLVED_COOKIE = "untuk-nia-quiz-solved";

function readCookieIds(cookieName: string): Set<string> {
  if (typeof document === "undefined") return new Set();
  const prefix = `${cookieName}=`;
  const raw = document.cookie.split("; ").find((c) => c.startsWith(prefix));
  if (!raw) return new Set();
  const value = decodeURIComponent(raw.slice(prefix.length));
  return new Set(value.split(",").filter(Boolean));
}

function writeCookieIds(
  cookieName: string,
  ids: Set<string>,
  maxAgeS: number,
): void {
  if (typeof document === "undefined") return;
  const value = encodeURIComponent(Array.from(ids).join(","));
  document.cookie = `${cookieName}=${value}; path=/; max-age=${maxAgeS}; SameSite=Lax`;
}

// ─── Trigger / availability helpers (shared) ────────────────────────────────

function parseRelativeOffsetMs(raw: string): number | null {
  const m = raw.match(/^\+(\d+)(ms|s|m|h)$/);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  const unit = m[2];
  switch (unit) {
    case "ms":
      return n;
    case "s":
      return n * 1000;
    case "m":
      return n * 60 * 1000;
    case "h":
      return n * 60 * 60 * 1000;
  }
  return null;
}

function resolveTriggerEpochMs(
  trigger: string,
  pageLoadEpochMs: number,
): number | null {
  if (trigger.startsWith("+")) {
    const offset = parseRelativeOffsetMs(trigger);
    if (offset == null) return null;
    return pageLoadEpochMs + offset;
  }
  const t = Date.parse(trigger);
  if (Number.isNaN(t)) return null;
  return t;
}

function isGroupInWindow(
  group: TriggeredGroup,
  pageLoadEpochMs: number,
  now: number,
): boolean {
  const triggerMs = resolveTriggerEpochMs(group.triggerAt, pageLoadEpochMs);
  if (triggerMs == null) return false;
  return now >= triggerMs && now < triggerMs + group.windowMs;
}

function collectAvailableItems<G extends TriggeredGroup, T>(
  groups: G[],
  extractor: (g: G) => T[],
  pageLoadEpochMs: number,
  now: number,
): T[] {
  return groups.flatMap((g) =>
    isGroupInWindow(g, pageLoadEpochMs, now) ? extractor(g) : [],
  );
}

function QuizTypeChip({ type }: { type: Quiz["type"] }) {
  const meta = QUIZ_TYPE_META[type];
  return (
    <span className="inline-flex items-center gap-2 self-start px-3 py-1.5 rounded-full bg-white/5 border border-pink-200/15">
      <img
        src={meta.icon}
        alt=""
        aria-hidden="true"
        className="w-5 h-5"
      />
      <span className="text-xs font-medium text-pink-200/85">{meta.label}</span>
    </span>
  );
}

function formatCorrectDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

type AnswerState = "asking" | "correct" | "wrong";

export function QuizButton({
  groups = [],
  cookieMaxAgeS = DEFAULT_CONFIG.popups.cookieMaxAgeS,
}: {
  groups?: QuizGroup[];
  cookieMaxAgeS?: number;
}) {
  // `mounted` guards against SSR/CSR hydration mismatches: cookies and
  // Date.now() aren't stable across the server → client boundary, so we
  // render nothing until we've mounted on the client.
  const [mounted, setMounted] = useState(false);
  const pageLoadRef = useRef<number>(0);
  const [availableQuizzes, setAvailableQuizzes] = useState<Quiz[]>([]);
  const available = availableQuizzes.length > 0;
  const [solvedIds, setSolvedIds] = useState<Set<string>>(() => new Set());
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [answerState, setAnswerState] = useState<AnswerState>("asking");
  const [celebrated, setCelebrated] = useState(false);
  const answeredThisSessionRef = useRef(false);

  const allSolved = useMemo(
    () =>
      availableQuizzes.length > 0 &&
      availableQuizzes.every((q) => solvedIds.has(q.id)),
    [availableQuizzes, solvedIds],
  );

  useEffect(() => {
    pageLoadRef.current = Date.now();
    setSolvedIds(readCookieIds(QUIZ_SOLVED_COOKIE));
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    function check() {
      setAvailableQuizzes(
        collectAvailableItems(
          groups,
          (g) => g.quizzes,
          pageLoadRef.current,
          Date.now(),
        ),
      );
    }
    check();
    const id = setInterval(check, 1000);
    return () => clearInterval(id);
  }, [groups, mounted]);

  useEffect(() => {
    if (available) return;
    setOpen(false);
  }, [available]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const safeIndex =
    availableQuizzes.length > 0
      ? Math.min(index, availableQuizzes.length - 1)
      : 0;
  const currentQuiz = availableQuizzes[safeIndex];
  const isLast = safeIndex === availableQuizzes.length - 1;
  const currentSolved = currentQuiz ? solvedIds.has(currentQuiz.id) : false;
  const isReviewing = allSolved || currentSolved;

  function handleOpen() {
    const solved = readCookieIds(QUIZ_SOLVED_COOKIE);
    setSolvedIds(solved);
    const firstUnsolved = availableQuizzes.findIndex((q) => !solved.has(q.id));
    setIndex(firstUnsolved === -1 ? 0 : firstUnsolved);
    setAnswerState("asking");
    setCelebrated(false);
    answeredThisSessionRef.current = false;
    setOpen(true);
  }

  function handleClose() {
    setOpen(false);
    setAnswerState("asking");
    setCelebrated(false);
  }

  function handleAnswer(quiz: Quiz, isCorrect: boolean) {
    if (isCorrect) {
      const next = new Set(solvedIds);
      next.add(quiz.id);
      setSolvedIds(next);
      writeCookieIds(QUIZ_SOLVED_COOKIE, next, cookieMaxAgeS);
      answeredThisSessionRef.current = true;
      setAnswerState("correct");
    } else {
      setAnswerState("wrong");
    }
  }

  function handleRetry() {
    setAnswerState("asking");
  }

  function handleNext() {
    if (isLast) {
      setCelebrated(true);
      return;
    }
    setIndex((i) => i + 1);
    setAnswerState("asking");
  }

  if (!mounted || !available) return null;

  return (
    <>
      <div className={allSolved ? "" : "nia-heart-pulse"}>
        <button
          type="button"
          onClick={handleOpen}
          aria-label={
            allSolved ? "Buka Mini Quiz (sudah selesai)" : "Buka Mini Quiz"
          }
          className="group relative flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-full text-white shadow-xl shadow-pink-500/40 bg-gradient-to-br from-pink-400 via-rose-500 to-fuchsia-600 hover:scale-110 active:scale-95 transition-transform focus:outline-none focus:ring-4 focus:ring-pink-300/50 nia-quiz-pulse"
        >
          <img
            src={QUIZ_BUTTON_ICON}
            alt=""
            aria-hidden="true"
            className="w-8 h-8 md:w-10 md:h-10 drop-shadow-md"
          />
          {allSolved ? (
            <img
              src="/untuk-nia/icons/check.svg"
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute -top-1 -right-1 w-5 h-5 drop-shadow-md"
            />
          ) : (
            <>
              <span className="pointer-events-none absolute -top-1 -right-1 w-3 h-3 rounded-full bg-yellow-300 shadow shadow-yellow-300/70 animate-ping" />
              <span className="pointer-events-none absolute -top-1 -right-1 w-3 h-3 rounded-full bg-yellow-300" />
            </>
          )}
        </button>
      </div>

      {open && currentQuiz && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Mini Quiz Games"
          className="fixed inset-0 z-40 flex items-center justify-center px-4 py-8 bg-black/70 backdrop-blur-md nia-fade-in"
          onClick={handleClose}
        >
          <div
            className="relative w-full max-w-xl max-h-[85vh] rounded-3xl bg-gradient-to-br from-pink-900/80 to-rose-950/80 border border-pink-300/20 shadow-2xl shadow-pink-500/20 overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <ModalHeader
              title={celebrated ? "Selesai!" : currentQuiz.title}
              index={safeIndex}
              total={availableQuizzes.length}
              quizzes={availableQuizzes}
              solvedIds={solvedIds}
              onClose={handleClose}
              hideProgress={celebrated}
            />

            <div
              key={celebrated ? "done" : currentQuiz.id + answerState}
              className="flex-1 overflow-y-auto p-5 md:p-6 nia-scroll nia-fade-in"
            >
              {celebrated ? (
                <CelebrationView
                  onClose={handleClose}
                  isReview={!answeredThisSessionRef.current}
                />
              ) : answerState !== "asking" ? (
                <FeedbackView
                  quiz={currentQuiz}
                  isCorrect={answerState === "correct"}
                  onRetry={handleRetry}
                  onNext={handleNext}
                  isLast={isLast}
                />
              ) : isReviewing ? (
                <ReviewView
                  quiz={currentQuiz}
                  onNext={handleNext}
                  isLast={isLast}
                />
              ) : (
                <AskView
                  quiz={currentQuiz}
                  onAnswer={(ok) => handleAnswer(currentQuiz, ok)}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ModalHeader({
  title,
  index,
  total,
  quizzes,
  solvedIds,
  onClose,
  hideProgress,
}: {
  title: string;
  index: number;
  total: number;
  quizzes: Quiz[];
  solvedIds: Set<string>;
  onClose: () => void;
  hideProgress: boolean;
}) {
  return (
    <div className="shrink-0 flex flex-col gap-2 px-5 md:px-6 py-4 border-b border-pink-300/10 bg-gradient-to-r from-pink-500/10 to-rose-500/10">
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg md:text-xl font-semibold text-pink-50 truncate">
            {title}
          </h2>
          {!hideProgress && (
            <p className="text-xs md:text-sm text-pink-200/70">
              Pertanyaan {index + 1} dari {total}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup"
          className="flex items-center justify-center w-9 h-9 rounded-full text-pink-100 hover:bg-white/10 transition"
        >
          <img
            src="/untuk-nia/icons/close.svg"
            alt=""
            aria-hidden="true"
            className="w-5 h-5"
          />
        </button>
      </div>
      {!hideProgress && total > 1 && (
        <div className="flex items-center gap-1.5 pt-1">
          {quizzes.map((q, i) => {
            const solved = solvedIds.has(q.id);
            const isActive = i === index;
            return (
              <span
                key={q.id}
                aria-hidden="true"
                className={`h-1.5 rounded-full transition-all ${
                  isActive
                    ? "w-6 bg-pink-300"
                    : solved
                      ? "w-3 bg-emerald-400/70"
                      : "w-3 bg-pink-200/20"
                }`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function HintTooltip({ hint }: { hint: string }) {
  const [open, setOpen] = useState(false);

  // Close when clicking anywhere. The opening click is stopped from bubbling,
  // so it won't immediately re-close the tooltip.
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [open]);

  return (
    <div className="flex items-center gap-2 self-start">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        aria-expanded={open}
        aria-label={open ? "Sembunyikan petunjuk" : "Lihat petunjuk"}
        className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-pink-200/85 bg-white/5 border border-pink-200/20 hover:bg-white/10 active:scale-95 transition"
      >
        <span className="italic">hint</span>
      </button>
      {open && (
        <div
          role="tooltip"
          className="flex-1 rounded-2xl border border-pink-200/20 bg-pink-950/95 backdrop-blur-sm px-3 py-2 text-xs md:text-sm text-pink-100/90 italic shadow-lg shadow-pink-500/20 nia-fade-in"
        >
          {hint}
        </div>
      )}
    </div>
  );
}

function AskView({
  quiz,
  onAnswer,
}: {
  quiz: Quiz;
  onAnswer: (isCorrect: boolean) => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <QuizTypeChip type={quiz.type} />
      <div
        className="text-pink-50 text-base md:text-lg leading-relaxed [&_b]:text-pink-200 [&_i]:text-pink-200/80"
        dangerouslySetInnerHTML={{ __html: quiz.question }}
      />
      {quiz.hint && <HintTooltip hint={quiz.hint} />}

      {quiz.type === "choice" ? (
        <ChoiceAnswer quiz={quiz} onAnswer={onAnswer} />
      ) : (
        <DateAnswer quiz={quiz} onAnswer={onAnswer} />
      )}
    </div>
  );
}

function ChoiceAnswer({
  quiz,
  onAnswer,
}: {
  quiz: ChoiceQuiz;
  onAnswer: (isCorrect: boolean) => void;
}) {
  return (
    <ul className="grid grid-cols-1 gap-3">
      {quiz.options.map((opt, i) => (
        <li key={i}>
          <button
            type="button"
            onClick={() => onAnswer(i === quiz.correctIndex)}
            className="w-full text-left flex items-center gap-3 p-4 rounded-2xl border border-pink-200/15 bg-white/5 hover:bg-white/10 hover:border-pink-300/40 active:scale-[0.98] transition"
          >
            <span className="flex items-center justify-center w-8 h-8 shrink-0 rounded-full border border-pink-200/25 bg-white/5 text-pink-100 font-semibold text-sm">
              {String.fromCharCode(65 + i)}
            </span>
            <span
              className="flex-1 text-sm md:text-base text-pink-50"
              dangerouslySetInnerHTML={{ __html: opt }}
            />
          </button>
        </li>
      ))}
    </ul>
  );
}

function DateAnswer({
  quiz,
  onAnswer,
}: {
  quiz: DateQuiz;
  onAnswer: (isCorrect: boolean) => void;
}) {
  const [value, setValue] = useState("");
  const canSubmit = value !== "";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    console.log("submit", value, quiz.correctDate);
    onAnswer(value === quiz.correctDate);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-2">
        <span className="text-xs md:text-sm text-pink-200/80 font-medium">
          Pilih tanggal
        </span>
        <input
          type="date"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          min="1990-01-01"
          max="2100-12-31"
          className="w-full p-3 rounded-xl border border-pink-200/25 bg-white/5 text-pink-50 focus:outline-none focus:border-pink-300/60 focus:bg-white/10 transition [color-scheme:dark]"
        />
      </label>

      <button
        type="submit"
        disabled={!canSubmit}
        className="self-center inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-white bg-gradient-to-r from-pink-400 to-rose-500 shadow-lg shadow-pink-500/30 hover:from-pink-300 hover:to-rose-400 active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <span>Submit Jawaban</span>
        <img
          src="/untuk-nia/icons/submit.svg"
          alt=""
          aria-hidden="true"
          className="w-4 h-4"
        />
      </button>
    </form>
  );
}

function FeedbackView({
  quiz,
  isCorrect,
  onRetry,
  onNext,
  isLast,
}: {
  quiz: Quiz;
  isCorrect: boolean;
  onRetry: () => void;
  onNext: () => void;
  isLast: boolean;
}) {
  const message = isCorrect ? quiz.feedback.correct : quiz.feedback.wrong;
  return (
    <div className="flex flex-col items-center text-center gap-5 py-4">
      <img
        src={
          isCorrect
            ? "/untuk-nia/icons/correct.svg"
            : "/untuk-nia/icons/wrong.svg"
        }
        alt=""
        aria-hidden="true"
        className="w-24 h-24"
      />
      <div>
        <p className="mt-2 text-sm md:text-base text-pink-100/90 max-w-sm">
          {message}
        </p>
      </div>

      <div className="flex flex-wrap gap-3 justify-center">
        {isCorrect ? (
          <button
            type="button"
            onClick={onNext}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-white bg-gradient-to-r from-pink-400 to-rose-500 shadow-lg shadow-pink-500/30 hover:from-pink-300 hover:to-rose-400 transition"
          >
            <span>{isLast ? "Selesai" : "Selanjutnya"}</span>
            <img
              src="/untuk-nia/icons/next.svg"
              alt=""
              aria-hidden="true"
              className="w-4 h-4"
            />
          </button>
        ) : (
          <button
            type="button"
            onClick={onRetry}
            className="px-5 py-2.5 rounded-full font-medium text-pink-50 bg-white/10 border border-pink-200/25 hover:bg-white/15 transition"
          >
            Coba Lagi
          </button>
        )}
      </div>
    </div>
  );
}

function ReviewView({
  quiz,
  onNext,
  isLast,
}: {
  quiz: Quiz;
  onNext: () => void;
  isLast: boolean;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <QuizTypeChip type={quiz.type} />
        <div className="flex items-center gap-2 text-emerald-200/90 text-sm font-medium">
          <img
            src="/untuk-nia/icons/check.svg"
            alt=""
            aria-hidden="true"
            className="w-5 h-5"
          />
        </div>
      </div>
      <div
        className="text-pink-50 text-base md:text-lg leading-relaxed [&_b]:text-pink-200 [&_i]:text-pink-200/80"
        dangerouslySetInnerHTML={{ __html: quiz.question }}
      />
      {quiz.type === "choice" ? (
        <ul className="grid grid-cols-1 gap-3">
          {quiz.options.map((opt, i) => {
            const isCorrect = i === quiz.correctIndex;
            return (
              <li key={i}>
                <div
                  className={`flex items-center gap-3 p-4 rounded-2xl border transition ${
                    isCorrect
                      ? "border-emerald-300/50 bg-emerald-400/10"
                      : "border-pink-200/10 bg-white/5 opacity-60"
                  }`}
                >
                  <span
                    className={`flex items-center justify-center w-8 h-8 shrink-0 rounded-full border font-semibold text-sm ${
                      isCorrect
                        ? "border-emerald-300/50 bg-emerald-400/20 text-emerald-100"
                        : "border-pink-200/25 bg-white/5 text-pink-100"
                    }`}
                  >
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span
                    className="flex-1 text-sm md:text-base text-pink-50"
                    dangerouslySetInnerHTML={{ __html: opt }}
                  />
                  {isCorrect && (
                    <img
                      src="/untuk-nia/icons/check.svg"
                      alt=""
                      aria-hidden="true"
                      className="w-5 h-5"
                    />
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="p-4 rounded-2xl border border-emerald-300/40 bg-emerald-400/10 text-emerald-100">
          <div className="text-xs uppercase tracking-wider text-emerald-200/70 mb-1">
            Jawaban
          </div>
          <div className="text-lg font-semibold">
            {formatCorrectDate(quiz.correctDate)}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={onNext}
        className="self-center inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-white bg-gradient-to-r from-pink-400 to-rose-500 shadow-lg shadow-pink-500/30 hover:from-pink-300 hover:to-rose-400 transition"
      >
        <span>{isLast ? "Selesai" : "Selanjutnya"}</span>
        <img
          src="/untuk-nia/icons/next.svg"
          alt=""
          aria-hidden="true"
          className="w-4 h-4"
        />
      </button>
    </div>
  );
}

function CelebrationView({
  isReview,
  onClose,
}: {
  isReview: boolean;
  onClose: () => void;
}) {
  return (
    <div className="flex flex-col items-center text-center gap-6 py-6">
      <img
        src="/untuk-nia/icons/celebrate.svg"
        alt=""
        aria-hidden="true"
        className="w-28 h-28 drop-shadow-lg"
      />
      <div>
        <h3 className="text-xl md:text-2xl font-semibold text-pink-100">
          {isReview ? "Kamu udah jawab semuanya ♥" : "Yeay, semua jawaban bener!"}
        </h3>
        <p className="mt-2 text-sm md:text-base text-pink-100/90 max-w-sm">
          {isReview
            ? "Kapan-kapan mampir lagi ya, mungkin aku tambahin quiz baru buat kamu."
            : "Kamu inget semuanya loh, aku terharu 🥺💕"}
        </p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="px-6 py-3 rounded-full font-semibold text-white bg-gradient-to-r from-pink-400 to-rose-500 shadow-lg shadow-pink-500/30 hover:from-pink-300 hover:to-rose-400 transition"
      >
        Tutup
      </button>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Quote feature
// ═════════════════════════════════════════════════════════════════════════════

function pickNextQuote(
  quotes: Quote[],
  seenIds: Set<string>,
): { quote: Quote; reset: boolean } | null {
  if (quotes.length === 0) return null;
  const unseen = quotes.find((q) => !seenIds.has(q.id));
  if (unseen) return { quote: unseen, reset: false };
  // Everything has been seen: start the cycle over from the first quote and
  // signal the caller to reset the seen set (no random pick).
  return { quote: quotes[0], reset: true };
}

export function QuoteButton({
  groups = [],
  seenCookie = DEFAULT_CONFIG.popups.seenCookiePrefix,
  cookieMaxAgeS = DEFAULT_CONFIG.popups.cookieMaxAgeS,
}: {
  groups?: QuoteGroup[];
  seenCookie?: string;
  cookieMaxAgeS?: number;
}) {
  // Same hydration guard as QuizButton — cookies + Date.now() are client only.
  const [mounted, setMounted] = useState(false);
  const pageLoadRef = useRef<number>(0);
  const [availableQuotes, setAvailableQuotes] = useState<Quote[]>([]);
  const available = availableQuotes.length > 0;
  const [seenIds, setSeenIds] = useState<Set<string>>(() => new Set());
  const [open, setOpen] = useState(false);
  const [currentQuote, setCurrentQuote] = useState<Quote | null>(null);

  const allSeen = useMemo(
    () =>
      availableQuotes.length > 0 &&
      availableQuotes.every((q) => seenIds.has(q.id)),
    [availableQuotes, seenIds],
  );

  useEffect(() => {
    pageLoadRef.current = Date.now();
    setSeenIds(readCookieIds(seenCookie));
    setMounted(true);
  }, [seenCookie]);

  useEffect(() => {
    if (!mounted) return;
    function check() {
      setAvailableQuotes(
        collectAvailableItems(
          groups,
          (g) => g.quotes,
          pageLoadRef.current,
          Date.now(),
        ),
      );
    }
    check();
    const id = setInterval(check, 1000);
    return () => clearInterval(id);
  }, [groups, mounted]);

  useEffect(() => {
    if (available) return;
    setOpen(false);
  }, [available]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  function handleOpen() {
    const seen = readCookieIds(seenCookie);
    const pick = pickNextQuote(availableQuotes, seen);
    if (!pick) return;
    // On a restart, clear the seen set so we begin counting from the first
    // quote again and keep finding the next unseen incrementally after that.
    const nextSeen = new Set(pick.reset ? [] : seen);
    nextSeen.add(pick.quote.id);
    setSeenIds(nextSeen);
    writeCookieIds(seenCookie, nextSeen, cookieMaxAgeS);
    setCurrentQuote(pick.quote);
    setOpen(true);
  }

  function handleClose() {
    setOpen(false);
    setCurrentQuote(null);
  }

  if (!mounted || !available) return null;

  return (
    <>
      <div className={allSeen ? "" : "nia-heart-pulse"}>
        <button
          type="button"
          onClick={handleOpen}
          aria-label="Buka Gombalan"
          className="relative flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-full text-white shadow-xl shadow-pink-500/40 bg-gradient-to-br from-rose-400 via-pink-500 to-fuchsia-600 hover:scale-110 active:scale-95 transition-transform focus:outline-none focus:ring-4 focus:ring-pink-300/50 nia-quiz-pulse"
        >
          <img
            src={QUOTE_BUTTON_ICON}
            alt=""
            aria-hidden="true"
            className="w-8 h-8 md:w-10 md:h-10 drop-shadow-md"
          />
          {allSeen ? (
            <img
              src="/untuk-nia/icons/check.svg"
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute -top-1 -right-1 w-5 h-5 drop-shadow-md"
            />
          ) : (
            <>
              <span className="pointer-events-none absolute -top-1 -right-1 w-3 h-3 rounded-full bg-yellow-300 shadow shadow-yellow-300/70 animate-ping" />
              <span className="pointer-events-none absolute -top-1 -right-1 w-3 h-3 rounded-full bg-yellow-300" />
            </>
          )}
        </button>
      </div>

      {open && currentQuote && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Gombalan"
          className="fixed inset-0 z-40 flex items-center justify-center px-4 py-8 bg-black/70 backdrop-blur-md nia-fade-in"
          onClick={handleClose}
        >
          <div
            className="relative w-full max-w-lg rounded-3xl bg-gradient-to-br from-pink-900/80 to-rose-950/80 border border-pink-300/20 shadow-2xl shadow-pink-500/20 overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <QuoteModalHeader onClose={handleClose} />
            <div
              key={currentQuote.id}
              className="flex-1 overflow-y-auto p-5 md:p-6 nia-scroll nia-fade-in"
            >
              <QuoteView quote={currentQuote} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function QuoteModalHeader({ onClose }: { onClose: () => void }) {
  return (
    <div className="shrink-0 flex items-center gap-3 px-5 md:px-6 py-4 border-b border-pink-300/10 bg-gradient-to-r from-pink-500/10 to-rose-500/10">
      <div className="flex-1 min-w-0">
        <h2 className="text-lg md:text-xl font-semibold text-pink-50 truncate">
          Pesan untuk kamu
        </h2>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Tutup"
        className="flex items-center justify-center w-9 h-9 rounded-full text-pink-100 hover:bg-white/10 transition"
      >
        <img
          src="/untuk-nia/icons/close.svg"
          alt=""
          aria-hidden="true"
          className="w-5 h-5"
        />
      </button>
    </div>
  );
}

function QuoteView({ quote }: { quote: Quote }) {
  return (
    <div className="flex flex-col items-center text-center py-8 gap-6">
      <img
        src={QUOTE_BUTTON_ICON}
        alt=""
        aria-hidden="true"
        className="w-14 h-14 opacity-80 drop-shadow"
      />
      <div
        className="text-pink-50 text-lg md:text-2xl leading-relaxed italic max-w-md [&_b]:text-pink-200 [&_i]:text-pink-200/80"
        dangerouslySetInnerHTML={{ __html: quote.text }}
      />
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Default export: renders both floating popup features
// ═════════════════════════════════════════════════════════════════════════════

export default function FloatingPopups() {
  const { config, ready } = useConfig();
  const loadedRef = useRef(false);
  const [quizGroups, setQuizGroups] = useState<QuizGroup[]>([]);
  const [quoteGroups, setQuoteGroups] = useState<QuoteGroup[]>([]);
  const cookieMaxAgeS = config.popups.cookieMaxAgeS;
  const seenCookie = config.popups.seenCookiePrefix;

  // Config comes from the shared provider (fetched once per session). Once it's
  // resolved, load the quiz/quote groups using the config-driven defaults. On
  // failure the buttons simply stay hidden (empty groups).
  useEffect(() => {
    if (!ready || loadedRef.current) return;
    loadedRef.current = true;

    let cancelled = false;
    (async () => {
      try {
        const { quizGroups, quoteGroups } = await fetchPopups({
          defaultWindowMs: config.popups.defaultWindowMs,
          optionsSeparator: config.popups.optionsSeparator,
        });
        if (cancelled) return;
        setQuizGroups(quizGroups);
        setQuoteGroups(quoteGroups);
      } catch {
        // Silent: no popups if the sheet can't be read.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, config]);

  // `flex-col-reverse` keeps the first child (quiz) anchored to the bottom and
  // stacks later children above it. Hidden buttons render `null`, so the flex
  // layout collapses the gap and the rest stay aligned to the bottom.
  return (
    <div className="fixed bottom-6 right-6 z-30 flex flex-col-reverse items-end gap-4">
      <QuizButton groups={quizGroups} cookieMaxAgeS={cookieMaxAgeS} />
      <QuoteButton
        groups={quoteGroups}
        seenCookie={seenCookie}
        cookieMaxAgeS={cookieMaxAgeS}
      />
    </div>
  );
}
