"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { audioConfig } from "../_data/audio";
import type { EventAudioConfig } from "../_data/events";

type AudioContextValue = {
  playEvent: (cfg: EventAudioConfig) => void;
  stopEvent: () => void;
};

const noop = () => {};
const AudioCtx = createContext<AudioContextValue>({
  playEvent: noop,
  stopEvent: noop,
});

export function useEventAudio(): AudioContextValue {
  return useContext(AudioCtx);
}

// If the download stalls or fails, still show the "tap to start" prompt after
// this long so the user is never stuck on the progress bar.
const LOADING_TIMEOUT_MS = 15000;

// loading  → downloading the track (progress bar)
// ready    → buffered enough; waiting for the user to tap (autoplay policy)
// done     → user tapped; overlay dismissed and music playing
type Phase = "loading" | "ready" | "done";

export default function AudioProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const mainRef = useRef<HTMLAudioElement | null>(null);
  const eventRef = useRef<HTMLAudioElement | null>(null);
  const hasInteractedRef = useRef(false);
  const eventActiveRef = useRef(false);

  // `phase` drives the full-screen loader (see the `Phase` type above).
  // `progress` (0–100) animates the download bar.
  const [phase, setPhase] = useState<Phase>(
    audioConfig.enabled ? "loading" : "done",
  );
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!audioConfig.enabled) {
      setPhase("done");
      return;
    }

    const m = mainRef.current;
    if (!m) return;

    m.loop = audioConfig.loop;
    m.volume = audioConfig.volume;

    // Download finished (or errored/timed out): stop the progress bar and ask
    // the user to tap. We do NOT auto-dismiss — the tap is the user gesture the
    // browser requires before audio can play with sound.
    const markReady = () => {
      setProgress(100);
      setPhase((p) => (p === "loading" ? "ready" : p));
    };

    const updateProgress = () => {
      try {
        const { duration, buffered } = m;
        if (duration > 0 && buffered.length > 0) {
          const pct = Math.min(
            100,
            Math.round((buffered.end(buffered.length - 1) / duration) * 100),
          );
          setProgress((p) => (pct > p ? pct : p));
        }
      } catch {
        // `buffered` can throw before any range exists — ignore.
      }
    };

    const onProgress = () => updateProgress();
    const onCanPlayThrough = () => markReady();
    const onError = () => markReady();

    m.addEventListener("progress", onProgress);
    m.addEventListener("loadeddata", onProgress);
    m.addEventListener("canplaythrough", onCanPlayThrough);
    m.addEventListener("error", onError);

    // Kick off the download now — after hydration — so it doesn't compete with
    // the page's JS (which would delay interactivity). If the file was already
    // buffered before listeners attached, jump straight to the tap prompt.
    m.preload = "auto";
    try {
      m.load();
    } catch {
      // no-op
    }
    if (m.readyState >= 4 /* HAVE_ENOUGH_DATA */) markReady();

    const timeout = setTimeout(markReady, LOADING_TIMEOUT_MS);

    // The tap (or key/touch) is the user gesture that unlocks audio playback
    // with sound and dismisses the overlay.
    const unlock = () => {
      hasInteractedRef.current = true;
      setPhase("done");
      const mm = mainRef.current;
      const ee = eventRef.current;
      if (mm && !eventActiveRef.current) {
        mm.muted = false;
        if (mm.paused) mm.play().catch(() => {});
      }
      if (ee && !ee.paused) ee.muted = false;
    };
    const opts = { once: true, capture: true } as const;
    window.addEventListener("pointerdown", unlock, opts);
    window.addEventListener("keydown", unlock, opts);
    window.addEventListener("touchstart", unlock, opts);

    return () => {
      clearTimeout(timeout);
      m.removeEventListener("progress", onProgress);
      m.removeEventListener("loadeddata", onProgress);
      m.removeEventListener("canplaythrough", onCanPlayThrough);
      m.removeEventListener("error", onError);
      window.removeEventListener("pointerdown", unlock, opts);
      window.removeEventListener("keydown", unlock, opts);
      window.removeEventListener("touchstart", unlock, opts);
    };
  }, []);

  useEffect(() => {
    if (phase === "done") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [phase]);

  const playEvent = useCallback((cfg: EventAudioConfig) => {
    if (!audioConfig.enabled) return;
    const m = mainRef.current;
    const e = eventRef.current;
    if (!e) return;

    eventActiveRef.current = true;
    if (m) m.pause();

    e.src = cfg.src;
    e.loop = cfg.loop ?? true;
    e.volume = cfg.volume ?? 1;
    e.muted = !hasInteractedRef.current;
    try {
      e.currentTime = 0;
    } catch {
      // no-op
    }
    e.play().catch(() => {
      eventActiveRef.current = false;
      if (m) m.play().catch(() => {});
    });
  }, []);

  const stopEvent = useCallback(() => {
    if (!audioConfig.enabled) return;
    const m = mainRef.current;
    const e = eventRef.current;
    eventActiveRef.current = false;

    if (e) {
      e.pause();
      e.removeAttribute("src");
      e.load();
    }
    if (m) {
      m.play().catch(() => {});
    }
  }, []);

  return (
    <AudioCtx.Provider value={{ playEvent, stopEvent }}>
      {audioConfig.enabled && (
        <>
          <audio ref={mainRef} src={audioConfig.src} preload="none" aria-hidden />
          <audio ref={eventRef} preload="none" aria-hidden />
          <div
            role="status"
            aria-live="polite"
            aria-label={phase === "ready" ? "Tap layar untuk mulai" : "Menyiapkan halaman"}
            className={`fixed inset-0 z-[90] flex items-center justify-center bg-black/70 backdrop-blur-md transition-opacity duration-500 ease-out ${
              phase === "done" ? "opacity-0 pointer-events-none" : "opacity-100"
            }`}
          >
            <div className="flex flex-col items-center text-center text-pink-50 select-none px-6 gap-7">
              <div className="text-5xl md:text-6xl nia-heart-pulse">
                <span className="text-pink-300">🩷 Hi Sayang 🩷</span>
              </div>

              

              {phase === "loading" ? (
                <div className="flex w-64 max-w-[72vw] flex-col items-center gap-2.5">
                  <div className="flex items-end gap-2">
                    <span
                      className="nia-heart-bounce text-2xl"
                      style={{ animationDelay: "0ms" }}
                    >
                      💗
                    </span>
                    <span
                      className="nia-heart-bounce text-2xl"
                      style={{ animationDelay: "160ms" }}
                    >
                      💗
                    </span>
                    <span
                      className="nia-heart-bounce text-2xl"
                      style={{ animationDelay: "320ms" }}
                    >
                      💗
                    </span>
                  </div>
                  
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-pink-200/20">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-pink-400 to-rose-400 transition-[width] duration-300 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              ) : (
                <p className="animate-pulse text-sm md:text-base font-medium tracking-widest text-pink-100/90">
                  sentuh layar
                </p>
              )}
            </div>
          </div>
        </>
      )}
      {children}
    </AudioCtx.Provider>
  );
}
