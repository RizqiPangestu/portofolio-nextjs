"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { audioSrcFrom, type AudioConfig } from "../_data/audio";
import { useConfig } from "./ConfigProvider";

type AudioPhase = "loading" | "ready" | "done";

type AudioContextValue = {
  playEvent: (cfg: AudioConfig) => void;
  stopEvent: () => void;
  /** Current intro overlay phase. Event popups must wait until `"done"`. */
  phase: AudioPhase;
};

const noop = () => {};
const AudioCtx = createContext<AudioContextValue>({
  playEvent: noop,
  stopEvent: noop,
  phase: "done",
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
type Phase = AudioPhase;

export default function AudioProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const mainRef = useRef<HTMLAudioElement | null>(null);
  const eventRef = useRef<HTMLAudioElement | null>(null);
  const hasInteractedRef = useRef(false);
  const eventActiveRef = useRef(false);

  // The track URL is configurable from the Google Sheet ("audio.src"); the rest
  // of the audio behavior stays fixed in `audioConfig`. Wait for the config to
  // resolve before downloading so we fetch the configured file, not the default.
  const { config, ready } = useConfig();

  // `phase` drives the full-screen loader (see the `Phase` type above).
  // `progress` (0–100) animates the download bar.
  const [phase, setPhase] = useState<Phase>("loading");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Hold on the loader until the config (which carries the track URL) is
    // resolved so we don't start downloading the wrong file.
    if (!ready) return;

    const m = mainRef.current;
    if (!m) return;

    const audio = audioSrcFrom(config.audio.src, 1);
    const src = audio?.src?? "";

    m.loop = audio?.loop?? true;
    m.volume = audio?.volume?? 1;

    let cancelled = false;
    const controller = new AbortController();

    // Point the element at the real URL (NOT a blob URL). iOS Safari can't
    // reliably play blob-URL media — it needs a real resource that supports
    // HTTP range requests — so a blob src plays on desktop but stays silent on
    // iPhone. The streamed fetch below is only for the progress bar; it also
    // warms the HTTP cache so this src loads instantly on tap.
    m.src = src;
    m.preload = "auto";

    // Download finished (or errored/timed out): stop the progress bar and ask
    // the user to tap. We do NOT auto-dismiss — the tap is the user gesture the
    // browser requires before audio can play with sound.
    const markReady = () => {
      if (cancelled) return;
      setProgress(100);
      setPhase((p) => (p === "loading" ? "ready" : p));
    };

    // Stream the file to report *byte-accurate* progress (the media element's
    // `buffered` is time-based and buffers in bursts, so it's a poor signal).
    // We only count bytes — the element plays from the real URL above.
    const download = async () => {
      try {
        const res = await fetch(src, { signal: controller.signal });
        if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

        const total = Number(res.headers.get("Content-Length")) || 0;
        const reader = res.body.getReader();
        let received = 0;

        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            received += value.length;
            // Cap at 99% until we flip to "ready"; markReady sets 100.
            if (total > 0 && !cancelled) {
              setProgress(Math.min(99, Math.round((received / total) * 100)));
            }
          }
        }
      } catch {
        // Network/abort failure is non-fatal: the element still has the real
        // src and can load it on tap.
      } finally {
        markReady();
      }
    };

    void download();

    // Safety net: never leave the user stuck on the progress bar.
    const timeout = setTimeout(markReady, LOADING_TIMEOUT_MS);

    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(timeout);
    };
  }, [ready, config.audio.src]);

  // Only listen for the unlock gesture once the track is ready. While the
  // download is still in progress ("loading"), taps are ignored so the user
  // can't dismiss the loader early.
  useEffect(() => {
    if (phase !== "ready") return;

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
      window.removeEventListener("pointerdown", unlock, opts);
      window.removeEventListener("keydown", unlock, opts);
      window.removeEventListener("touchstart", unlock, opts);
    };
  }, [phase]);

  useEffect(() => {
    if (phase === "done") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [phase]);

  const playEvent = useCallback((cfg: AudioConfig) => {
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
    <AudioCtx.Provider value={{ playEvent, stopEvent, phase }}>
          <audio ref={mainRef} preload="none" aria-hidden />
          <audio ref={eventRef} preload="none" aria-hidden />
          <div
            role="status"
            aria-live="polite"
            aria-label={phase === "ready" ? "Tap layar untuk mulai" : "Menyiapkan halaman"}
            className={`fixed inset-0 z-[90] flex items-center justify-center bg-black transition-opacity duration-500 ease-out ${
              phase === "done" ? "opacity-0 pointer-events-none" : "opacity-100"
            }`}
          >
            <div className="flex flex-col items-center text-center text-pink-50 select-none px-6 gap-7">
              <div className="text-5xl md:text-6xl nia-heart-pulse">
                <span className="text-pink-300">🩷 Hi Sayang 🩷</span>
              </div>

              
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
                  
                  <div className="h-1.5 w-full rounded-full bg-pink-200/20">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-pink-400 to-rose-400 transition-[width] duration-300 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              {phase === "loading" ? (
                <p className="text-sm md:text-base font-medium tracking-widest text-pink-100/90"> Tunggu yaa...</p>
              ) : (
                <p className="animate-pulse text-sm md:text-base font-medium tracking-widest text-pink-100/90">Sentuh Layar</p>
              )}
            </div>
          </div>
      {children}
    </AudioCtx.Provider>
  );
}
