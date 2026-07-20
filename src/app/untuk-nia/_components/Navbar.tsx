"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/untuk-nia", label: "Home" },
  { href: "/untuk-nia/wishlist", label: "Wishlist" },
];

export default function Navbar() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-30 w-full bg-gradient-to-b from-black/60 to-black/20 backdrop-blur-md border-b border-pink-200/15">
      <div className="max-w-5xl mx-auto h-16 px-5 flex items-center justify-end">
        <nav className="flex items-center gap-1 md:gap-3">
          {links.map((l) => {
            const active =
              l.href === "/untuk-nia"
                ? pathname === "/untuk-nia"
                : pathname?.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`px-3 md:px-4 py-2 rounded-full text-sm md:text-base transition ${
                  active
                    ? "bg-gradient-to-r from-pink-400 to-rose-400 text-white shadow-md shadow-pink-500/30"
                    : "text-pink-100/80 hover:text-white hover:bg-white/10"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
