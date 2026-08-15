import { importantDates, type ImportantDate } from "../_data/importantDates";

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

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return `${d} ${monthNames[m - 1]} ${y}`;
}

function DateNode({ item, index }: { item: ImportantDate; index: number }) {
  return (
    <li className="relative pl-10 md:pl-12">
      {/* timeline node */}
      <span
        className="absolute left-0 top-1.5 flex h-5 w-5 items-center justify-center"
        aria-hidden
      >
        <span className="absolute inset-0 rounded-full bg-pink-400/25 blur-[6px]" />
        <span className="relative h-2.5 w-2.5 rounded-full bg-gradient-to-br from-pink-200 to-rose-400 shadow-[0_0_12px_rgba(255,182,193,0.7)]" />
      </span>

      <div
        className="nia-fade-in"
        style={{ animationDelay: `${index * 120}ms` }}
      >
        <time
          dateTime={item.date}
          className="block text-[0.65rem] md:text-xs uppercase tracking-[0.25em] text-pink-300/70"
        >
          {formatDate(item.date)}
        </time>
        <h3 className="mt-1.5 text-lg md:text-xl font-light tracking-wide text-white drop-shadow-[0_0_12px_rgba(255,182,193,0.35)]">
          {item.title}
        </h3>
        <p className="mt-1.5 text-sm md:text-base text-pink-100/65 leading-relaxed italic">
          {item.description}
        </p>
      </div>
    </li>
  );
}

export default function ImportantDates() {
  return (
    <div className="relative w-full max-w-lg mx-auto flex flex-col items-center text-center select-none">
      {/* soft glow */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(255,105,180,0.12)_0%,transparent_70%)] blur-2xl scale-110"
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

      {/* section header — matches ElapsedTime style */}
      <div className="flex items-center gap-2 md:gap-3 text-pink-200/40 text-[0.6rem] md:text-xs tracking-[0.35em] uppercase">
        <span className="h-px w-6 md:w-10 bg-gradient-to-r from-transparent to-pink-300/50" />
        <span>Important Dates</span>
        <span className="h-px w-6 md:w-10 bg-gradient-to-l from-transparent to-pink-300/50" />
      </div>

      <ol className="relative mt-10 w-full text-left space-y-10">
        {/* vertical timeline line */}
        <span
          className="pointer-events-none absolute left-[9px] top-2 bottom-2 w-px bg-gradient-to-b from-pink-300/50 via-pink-300/20 to-transparent"
          aria-hidden
        />

        {importantDates.map((item, index) => (
          <DateNode key={`${item.title}-${item.date}`} item={item} index={index} />
        ))}
      </ol>

      {/* bottom flourish */}
      <div
        className="mt-12 flex items-center gap-2 text-pink-300/40"
        aria-hidden
      >
        <span className="h-px w-8 md:w-14 bg-gradient-to-r from-transparent to-pink-300/40" />
        <span className="text-[0.55rem] tracking-widest">✦</span>
        <span className="h-px w-8 md:w-14 bg-gradient-to-l from-transparent to-pink-300/40" />
      </div>
    </div>
  );
}
