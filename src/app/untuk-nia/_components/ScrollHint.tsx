"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const SCROLL_HIDE_PX = 48;

export default function ScrollHint() {
  const [visible, setVisible] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    function onScroll() {
      setVisible(window.scrollY <= SCROLL_HIDE_PX);
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!mounted) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-hidden={!visible}
      className={`pointer-events-none fixed bottom-6 left-1/2 z-40 -translate-x-1/2 transition-all duration-500 ease-out ${
        visible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-3 pointer-events-none"
      }`}
    >
      <div className="nia-heart-pulse flex items-center gap-2.5 rounded-full border border-pink-300/40 bg-pink-300/20 px-4 py-2.5 shadow-[0_8px_32px_rgba(236,72,153,0.25)] backdrop-blur-md">
        <span className="text-[0.65rem] md:text-xs uppercase tracking-[0.28em] text-rose-100">
          Scroll down
        </span>
        <Image
          src="/untuk-nia/icons/bottom.png"
          alt=""
          width={18}
          height={18}
          className="opacity-90"
          aria-hidden
        />
      </div>
    </div>
  );
}
