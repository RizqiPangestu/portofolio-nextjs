"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { EventObject } from "../_data/events";

type Props = {
  items: EventObject[];
  minViewMs?: number;
  onFinish: () => void;
};

export default function ObjectCarousel({
  items,
  minViewMs = 5000,
  onFinish,
}: Props) {
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const tickRef = useRef<number | null>(null);
  const startTsRef = useRef<number | null>(null);
  const finishedRef = useRef(false);

  const current = items[index];
  const isLast = index >= items.length - 1;
  const unlocked = progress >= 100;
  const itemViewMs = current?.viewMs ?? minViewMs;

  useEffect(() => {
    setProgress(0);
    startTsRef.current = null;
  }, [index]);

  useEffect(() => {
    function step(ts: number) {
      if (startTsRef.current == null) startTsRef.current = ts;
      const elapsed = ts - startTsRef.current;
      const pct = Math.min(100, (elapsed / itemViewMs) * 100);
      setProgress(pct);
      if (pct < 100) {
        tickRef.current = requestAnimationFrame(step);
      }
    }
    tickRef.current = requestAnimationFrame(step);
    return () => {
      if (tickRef.current != null) cancelAnimationFrame(tickRef.current);
    };
  }, [index, itemViewMs]);

  function goNext() {
    if (!unlocked) return;
    if (isLast) {
      if (!finishedRef.current) {
        finishedRef.current = true;
        onFinish();
      }
      return;
    }
    setIndex((i) => Math.min(i + 1, items.length - 1));
  }

  if (!current) return null;

  return (
    <div className="relative w-full max-w-3xl mx-auto">
      <div className="flex flex-col rounded-3xl overflow-hidden backdrop-blur-md bg-white/5 border border-pink-200/30 shadow-[0_20px_60px_-20px_rgba(255,182,193,0.5)] max-h-[80vh]">
        <div className="flex flex-col md:flex-row min-h-0 flex-1">
          <div className="relative w-full md:w-2/5 h-56 md:h-auto md:self-stretch shrink-0 bg-pink-100/10 overflow-hidden">
            <Image
              key={`${current.id}-bg`}
              src={current.image}
              alt=""
              aria-hidden
              fill
              sizes="(max-width: 768px) 100vw, 320px"
              className="object-cover scale-100 blur-lg opacity-75"
              priority={index === 0}
            />
            <Image
              key={current.id}
              src={current.image}
              alt={current.title}
              fill
              sizes="(max-width: 768px) 100vw, 320px"
              className="relative object-contain nia-image-in"
              priority={index === 0}
            />
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto p-6 md:p-8 text-pink-50 nia-scroll">
            <h2 className="text-2xl md:text-3xl font-semibold mb-3 tracking-wide">
              {current.title}
            </h2>
            <div
              className="max-w-none text-pink-50/90 leading-relaxed [&_a]:text-pink-200 [&_a]:underline [&_i]:text-pink-200 [&_b]:text-white [&_p]:mb-3"
              dangerouslySetInnerHTML={{ __html: current.body }}
            />
          </div>
        </div>
        <div className="h-1 w-full bg-pink-200/10 shrink-0">
          <div
            key={index}
            className="h-full bg-gradient-to-r from-pink-300 to-rose-400"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="mt-6 flex items-center justify-center min-h-[44px]">
        {unlocked ? (
          <button
            onClick={goNext}
            className="nia-fade-in px-6 py-2.5 rounded-full bg-gradient-to-r from-pink-400 to-rose-400 text-white font-semibold tracking-wide shadow-lg hover:shadow-pink-300/40 hover:scale-[1.03] transition"
          >
            {isLast ? "Selesai" : "Selanjutnya"}
          </button>
        ) : (
          <div className="text-sm tracking-[0.4em] text-pink-200/50 tabular-nums select-none">
            {String(index + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}
          </div>
        )}
      </div>
    </div>
  );
}
