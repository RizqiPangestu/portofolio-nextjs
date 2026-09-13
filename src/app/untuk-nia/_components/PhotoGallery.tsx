"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  fetchPhotoGallery,
  type PhotoGalleryItem,
} from "../_data/photoGallery";

function GalleryRow({
  item,
  index,
}: {
  item: PhotoGalleryItem;
  index: number;
}) {
  return (
    <li className="relative">
      <figure
        className="nia-fade-in flex min-h-[8.5rem] flex-row items-stretch overflow-hidden rounded-2xl border border-pink-200/30 bg-white/5 backdrop-blur-md shadow-[0_20px_60px_-20px_rgba(255,182,193,0.45)]"
        style={{ animationDelay: `${index * 120}ms` }}
      >
        <div className="relative w-[42%] shrink-0 min-h-[8.5rem] bg-pink-100/10">
          <Image
            src={item.image}
            alt={item.caption || `Kenangan ${index + 1}`}
            // fill
            // sizes="(max-width: 768px) 40vw, 280px"
            // className="object-cover nia-image-in"
            width={1200}
            height={1600}
            sizes="(max-width: 768px) 92vw, 512px"
            className="h-auto w-full object-contain nia-image-in"
            priority={index === 0}
          />
        </div>
        <figcaption className="flex min-w-0 flex-1 flex-col justify-center px-4 py-4 md:px-6 md:py-5 text-left">
          <span className="block text-[0.65rem] md:text-xs uppercase tracking-[0.25em] text-pink-300/70">
            {String(index + 1).padStart(2, "0")}
          </span>
          {item.caption ? (
            <p className="mt-1.5 text-sm md:text-base text-pink-100/65 leading-relaxed italic">
              {item.caption}
            </p>
          ) : null}
        </figcaption>
      </figure>
    </li>
  );
}

export default function PhotoGallery() {
  const [items, setItems] = useState<PhotoGalleryItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const loaded = await fetchPhotoGallery();
        if (!cancelled) setItems(loaded);
      } catch {
        // Silent: if the sheet can't be read, hide the section.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="relative w-full max-w-xl mx-auto flex flex-col items-center text-center select-none">
      <div
        className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(255,105,180,0.12)_0%,transparent_70%)] blur-2xl scale-110"
        aria-hidden
      />

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
        <span>Photo Gallery</span>
        <span className="h-px w-6 md:w-10 bg-gradient-to-l from-transparent to-pink-300/50" />
      </div>

      <ol className="relative mt-10 w-full space-y-10">
        {items.map((item, index) => (
          <GalleryRow
            key={`${item.image}-${index}`}
            item={item}
            index={index}
          />
        ))}
      </ol>

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
