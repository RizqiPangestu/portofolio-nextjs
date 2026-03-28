"use client";

import { useState } from "react";

export default function UrlShortener() {
  const [originalUrl, setOriginalUrl] = useState("");
  const [shortUrl, setShortUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setShortUrl(null);
    setCopied(false);
    setLoading(true);
    try {
      const res = await fetch("/api/url-shortener", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: originalUrl.trim() }),
      });
      const data: unknown = await res.json().catch(() => null);
      const errMsg =
        data &&
        typeof data === "object" &&
        typeof (data as { error?: unknown }).error === "string"
          ? (data as { error: string }).error
          : null;
      if (!res.ok) {
        setError(errMsg || "Something went wrong. Please try again.");
        return;
      }
      const short =
        data &&
        typeof data === "object" &&
        typeof (data as { short_url?: unknown }).short_url === "string"
          ? (data as { short_url: string }).short_url
          : null;
      if (!short) {
        setError("Unexpected response from server.");
        return;
      }
      setShortUrl(short);
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!shortUrl) return;
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy to clipboard.");
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0f1419] text-zinc-100">
      <div
        className="pointer-events-none absolute inset-0 opacity-80"
        aria-hidden
      >
        <div className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-violet-600/30 blur-[100px]" />
        <div className="absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-cyan-500/25 blur-[90px]" />
        <div className="absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-fuchsia-500/20 blur-[80px]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-6 py-16">
        <div className="mb-10 w-full text-center">
          <p className="inline-flex max-w-md items-start gap-2 rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-left text-sm leading-relaxed text-amber-100/95 shadow-lg shadow-amber-900/20 ring-1 ring-amber-400/10">
            <span className="mt-0.5 shrink-0 text-base" aria-hidden>
              ⏱
            </span>
            <span>
              This URL has TTL, will be refreshed everytime it used.
            </span>
          </p>
        </div>

        <div className="w-full rounded-3xl border border-white/10 bg-zinc-900/55 p-8 shadow-2xl shadow-black/40 backdrop-blur-xl">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              URL Shortener
            </h1>
            <p className="mt-2 text-sm text-zinc-400">
              Paste a long link and get a compact shareable URL.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label
                htmlFor="original-url"
                className="text-xs font-medium uppercase tracking-wider text-zinc-500"
              >
                Original URL
              </label>
              <input
                id="original-url"
                name="url"
                type="url"
                inputMode="url"
                autoComplete="url"
                placeholder="https://example.com/very/long/path"
                value={originalUrl}
                onChange={(e) => setOriginalUrl(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/35 px-4 py-3.5 text-base text-zinc-100 outline-none ring-0 transition placeholder:text-zinc-600 focus:border-violet-500/50 focus:bg-black/45 focus:shadow-[0_0_0_3px_rgba(139,92,246,0.2)]"
                required
              />
            </div>

            <div className="flex flex-col gap-4">
              <button
                type="submit"
                disabled={loading || !originalUrl.trim()}
                className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-3.5 text-center text-sm font-semibold text-white shadow-lg shadow-violet-900/40 transition hover:from-violet-500 hover:to-fuchsia-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400 disabled:cursor-not-allowed disabled:opacity-45"
              >
                {loading ? "Shortening…" : "Generate shortened URL"}
              </button>

              {error && (
                <p
                  role="alert"
                  className="rounded-lg border border-red-500/30 bg-red-950/50 px-3 py-2 text-center text-sm text-red-200"
                >
                  {error}
                </p>
              )}

              {shortUrl && (
                <div className="rounded-xl border border-emerald-500/25 bg-emerald-950/35 p-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-emerald-400/90">
                    Your short link
                  </p>
                  <p className="mt-2 break-all font-mono text-sm text-emerald-100">
                    {shortUrl}
                  </p>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="mt-3 w-full rounded-lg border border-emerald-500/40 bg-emerald-900/40 py-2 text-sm font-medium text-emerald-100 transition hover:bg-emerald-800/50"
                  >
                    {copied ? "Copied!" : "Copy to clipboard"}
                  </button>
                </div>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
