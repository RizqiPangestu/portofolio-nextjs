"use client";

import { useEffect, useState } from "react";

/** 25 January 2026 18:15 UTC+07:00 */
const START_MS = new Date("2026-01-25T18:15:00+07:00").getTime();

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function splitElapsed(ms: number) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  return { days, hours, minutes, seconds };
}

type UnitProps = {
  value: string;
  label: string;
};

function Unit({ value, label }: UnitProps) {
  return (
    <div className="flex flex-col items-center min-w-[3.25rem] md:min-w-[4.5rem]">
      <span className="text-2xl md:text-4xl font-light tracking-wider text-white drop-shadow-[0_0_14px_rgba(255,182,193,0.55)] tabular-nums">
        {value}
      </span>
      <span className="mt-1 text-[0.65rem] md:text-xs uppercase tracking-[0.2em] text-pink-200/70">
        {label}
      </span>
    </div>
  );
}

function Divider() {
  return (
    <span
      className="self-start mt-1 md:mt-2 text-pink-300/70 text-xl md:text-3xl font-light animate-pulse"
      aria-hidden
    >
      :
    </span>
  );
}

export default function ElapsedTime() {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const { days, hours, minutes, seconds } = splitElapsed(
    now === null ? 0 : now - START_MS,
  );

  return (
    <div className="relative flex flex-col items-center justify-center text-center select-none">
      {/* soft glow backdrop */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(255,105,180,0.18)_0%,transparent_70%)] blur-2xl scale-125"
        aria-hidden
      />

      {/* decorative corners */}
      <span
        className="pointer-events-none absolute -top-3 left-1/2 -translate-x-[7.5rem] md:-translate-x-[11rem] text-pink-300/50 text-sm nia-heart-pulse"
        aria-hidden
      >
        ♡
      </span>
      <span
        className="pointer-events-none absolute -top-3 left-1/2 translate-x-[6.5rem] md:translate-x-[10rem] text-pink-300/50 text-sm nia-heart-pulse"
        style={{ animationDelay: "0.8s" }}
        aria-hidden
      >
        ♡
      </span>

      <div className="flex items-center gap-2 md:gap-3 text-pink-200/40 text-[0.6rem] md:text-xs tracking-[0.35em] uppercase">
        <span className="h-px w-6 md:w-10 bg-gradient-to-r from-transparent to-pink-300/50" />
        <span>been together for</span>
        <span className="h-px w-6 md:w-10 bg-gradient-to-l from-transparent to-pink-300/50" />
      </div>

      {/* <p className="mt-2 text-xs md:text-sm text-pink-100/60 italic">
        25 Januari 2026 · 18:15
      </p> */}

      <div
        className="mt-5 flex items-start justify-center gap-1.5 md:gap-3"
        aria-live="polite"
        aria-label={`${days} Days ${pad(hours)} Hours ${pad(minutes)} Minutes ${pad(seconds)} Seconds`}
      >
        <Unit value={String(days).padStart(2, "0")} label="Days" />
        <Divider />
        <Unit value={pad(hours)} label="Hours" />
        <Divider />
        <Unit value={pad(minutes)} label="Minutes" />
        <Divider />
        <Unit value={pad(seconds)} label="Seconds" />
      </div>

      {/* bottom sparkle line */}
      <div
        className="mt-6 flex items-center gap-2 text-pink-300/40"
        aria-hidden
      >
        <span className="h-px w-8 md:w-14 bg-gradient-to-r from-transparent to-pink-300/40" />
        <span className="text-[0.55rem] tracking-widest">✦</span>
        <span className="h-px w-8 md:w-14 bg-gradient-to-l from-transparent to-pink-300/40" />
      </div>
    </div>
  );
}
