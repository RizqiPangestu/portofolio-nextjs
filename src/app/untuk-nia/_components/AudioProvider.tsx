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

export default function AudioProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const mainRef = useRef<HTMLAudioElement | null>(null);
  const eventRef = useRef<HTMLAudioElement | null>(null);
  const hasInteractedRef = useRef(false);
  const eventActiveRef = useRef(false);
  const [needsUnlock, setNeedsUnlock] = useState(audioConfig.enabled);

  useEffect(() => {
    if (!audioConfig.enabled) return;

    const m = mainRef.current;
    if (m) {
      m.loop = audioConfig.loop;
      m.volume = audioConfig.volume;
      m.muted = true;
      m.play().catch(() => {});
    }

    function unlock() {
      if (hasInteractedRef.current) return;
      hasInteractedRef.current = true;
      setNeedsUnlock(false);

      const mm = mainRef.current;
      const ee = eventRef.current;

      if (mm) {
        mm.muted = false;
        if (!eventActiveRef.current && mm.paused) {
          mm.play().catch(() => {});
        }
      }
      if (ee && !ee.paused) {
        ee.muted = false;
      }
    }

    const opts = { once: true, capture: true } as const;
    window.addEventListener("pointerdown", unlock, opts);
    window.addEventListener("keydown", unlock, opts);
    window.addEventListener("touchstart", unlock, opts);

    return () => {
      window.removeEventListener("pointerdown", unlock, opts);
      window.removeEventListener("keydown", unlock, opts);
      window.removeEventListener("touchstart", unlock, opts);
    };
  }, []);

  useEffect(() => {
    if (!needsUnlock) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [needsUnlock]);

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
          <audio
            ref={mainRef}
            src={audioConfig.src}
            preload="auto"
            aria-hidden
          />
          <audio ref={eventRef} preload="auto" aria-hidden />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Tap anywhere to start"
            className={`fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-md transition-opacity duration-500 ease-out ${
              needsUnlock
                ? "opacity-100"
                : "opacity-0 pointer-events-none"
            }`}
          >
            <div className="flex flex-col items-center text-center text-pink-50 select-none px-6">
              <div className="text-5xl md:text-6xl nia-heart-pulse">
                <div className="text-pink-300">🩷 Hi Sayang 🩷</div>
              </div>
            </div>
          </div>
        </>
      )}
      {children}
    </AudioCtx.Provider>
  );
}
