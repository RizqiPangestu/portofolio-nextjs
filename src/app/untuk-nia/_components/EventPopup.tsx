"use client";

import { useEffect, useRef, useState } from "react";
import ObjectCarousel from "./ObjectCarousel";
import Decorations from "./Decorations";
import { useEventAudio } from "./AudioProvider";
import { useConfig } from "./ConfigProvider";
import { type Event, fetchEvents } from "../_data/events";

function hasEventCookie(id: string, prefix: string): boolean {
  if (typeof document === "undefined") return false;
  const needle = `${prefix}${id}=`;
  return document.cookie.split("; ").some((c) => c.startsWith(needle));
}

function setEventCookie(id: string, maxAgeS: number, prefix: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${prefix}${id}=1; path=/; max-age=${maxAgeS}; SameSite=Lax`;
}

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

export default function EventPopup({
  events: eventsProp,
}: {
  events?: Event[];
}) {
  const pageLoadRef = useRef<number>(Date.now());
  const firedRef = useRef<Set<string>>(new Set());
  const loadedRef = useRef(false);
  const [events, setEvents] = useState<Event[]>(eventsProp ?? []);
  const { config, ready } = useConfig();
  const [activeEvent, setActiveEvent] = useState<Event | null>(null);
  const { playEvent, stopEvent } = useEventAudio();

  // Config comes from the shared provider (fetched once per session). Once it's
  // resolved, load events from the Sheet using the config-driven defaults.
  useEffect(() => {
    if (eventsProp) {
      setEvents(eventsProp);
      return;
    }
    if (!ready || loadedRef.current) return;
    loadedRef.current = true;

    let cancelled = false;
    (async () => {
      try {
        const loaded = await fetchEvents({
          defaultViewMs: config.events.defaultViewMs,
          audioVolume: config.events.audioVolume,
        });
        if (!cancelled) setEvents(loaded);
      } catch {
        // Silent: if the sheet can't be read, simply show no popups.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [eventsProp, ready, config]);

  useEffect(() => {
    function tick() {
      if (activeEvent) return;
      const now = Date.now();
      for (const ev of events) {
        if (firedRef.current.has(ev.id)) continue;
        if (ev.cookie.enabled && hasEventCookie(ev.id, config.events.sendCookiePrefix)) {
          firedRef.current.add(ev.id);
          continue;
        }
        const triggerMs = resolveTriggerEpochMs(ev.triggerAt, pageLoadRef.current);
        if (triggerMs == null) continue;
        const windowMs = ev.windowMs ?? config.events.defaultWindowMs;
        if (now >= triggerMs && now < triggerMs + windowMs) {
          firedRef.current.add(ev.id);
          setActiveEvent(ev);
          return;
        }
      }
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [events, activeEvent, config]);

  useEffect(() => {
    if (!activeEvent) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [activeEvent]);

  useEffect(() => {
    if (!activeEvent?.audio) return;
    playEvent(activeEvent.audio);
    return () => stopEvent();
  }, [activeEvent, playEvent, stopEvent]);

  if (!activeEvent) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Pesan: ${activeEvent.id}`}
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8 bg-black/70 backdrop-blur-md nia-fade-in"
    >
      {activeEvent.decorations && (
        <Decorations
          layers={activeEvent.decorations}
          className="z-[55] pointer-events-none"
        />
      )}

      <div className="relative z-[60] w-full max-w-3xl">
        <ObjectCarousel
          items={activeEvent.items}
          minViewMs={config.events.carouselMinViewMs}
          onFinish={() => {
            if (activeEvent.cookie.enabled) {
              setEventCookie(
                activeEvent.id,
                activeEvent.cookie.maxAgeS,
                config.events.sendCookiePrefix,
              );
            }
            setActiveEvent(null);
          }}
        />
      </div>
    </div>
  );
}
