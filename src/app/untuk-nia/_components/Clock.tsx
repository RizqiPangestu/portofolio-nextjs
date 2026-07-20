"use client";

import { useEffect, useState } from "react";

const dayNames = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
];

const monthNames = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

export default function Clock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!now) {
    return (
      <div className="flex flex-col items-center justify-center text-center select-none">
        <div className="text-5xl md:text-7xl font-light tracking-widest text-pink-100/80">
          --:--:--
        </div>
      </div>
    );
  }

  const hh = pad(now.getHours());
  const mm = pad(now.getMinutes());
  const ss = pad(now.getSeconds());
  const dateLine = `${dayNames[now.getDay()]}, ${now.getDate()} ${
    monthNames[now.getMonth()]
  } ${now.getFullYear()}`;

  return (
    <div className="flex flex-col items-center justify-center text-center select-none">
      <div className="text-6xl md:text-8xl font-light tracking-widest text-white drop-shadow-[0_0_20px_rgba(255,182,193,0.6)] tabular-nums">
        <span>{hh}</span>
        <span className="text-pink-300 animate-pulse">:</span>
        <span>{mm}</span>
        <span className="text-pink-300 animate-pulse">:</span>
        <span>{ss}</span>
      </div>
      <div className="mt-4 text-base md:text-lg text-pink-100/80 italic">
        {dateLine}
      </div>
    </div>
  );
}
