import type { ResolveResult, ShortenResult, UrlShortener } from "./types";

const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

function getShortenerOrigin(): string | null {
  const serviceHost = process.env.SHORTENER_SERVICE_HOST?.trim();
  if (!serviceHost) return null;
  try {
    return new URL(serviceHost).origin;
  } catch {
    return null;
  }
}

function extractShortUrl(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const o = data as Record<string, unknown>;
  const top = [o.shortUrl, o.short_url, o.link, o.shortLink];
  for (const c of top) {
    if (typeof c === "string" && c.trim()) return c.trim();
  }
  const nested = o.data;
  if (nested && typeof nested === "object") {
    const d = nested as Record<string, unknown>;
    for (const c of [d.shortUrl, d.short_url, d.link]) {
      if (typeof c === "string" && c.trim()) return c.trim();
    }
  }
  return null;
}

export const httpShortener: UrlShortener = {
  async shorten(originalUrl): Promise<ShortenResult> {
    const serviceHost = process.env.SHORTENER_SERVICE_HOST?.trim();
    if (!serviceHost) {
      return {
        ok: false,
        error: "Server misconfiguration: SHORTENER_SERVICE_HOST is not set.",
        status: 503,
      };
    }

    let upstream: Response;
    try {
      upstream = await fetch(`${serviceHost}/shorten`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: originalUrl }),
      });
    } catch {
      return {
        ok: false,
        error: "Could not reach the URL shortener service.",
        status: 502,
      };
    }

    const text = await upstream.text();
    let json: unknown;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      return {
        ok: false,
        error: "Shortener service returned non-JSON.",
        status: 502,
      };
    }

    if (!upstream.ok) {
      let message = `Shortener service error (${upstream.status}).`;
      if (
        json &&
        typeof json === "object" &&
        typeof (json as { error?: unknown }).error === "string"
      ) {
        message = (json as { error: string }).error;
      }
      return { ok: false, error: message, status: upstream.status };
    }

    const shortUrl = extractShortUrl(json);
    if (!shortUrl) {
      return {
        ok: false,
        error: "Shortener response did not include a short URL.",
        status: 502,
      };
    }

    return { ok: true, shortUrl };
  },

  async resolve(urlId, request): Promise<ResolveResult> {
    const origin = getShortenerOrigin();
    if (!origin) {
      return {
        ok: false,
        error: "URL shortener service is not configured.",
        status: 503,
      };
    }

    const upstream = `${origin}/u/${encodeURIComponent(urlId)}`;

    const forwardHeaders = new Headers();
    const ua = request.headers.get("user-agent");
    if (ua) forwardHeaders.set("user-agent", ua);
    const accept = request.headers.get("accept");
    if (accept) forwardHeaders.set("accept", accept);

    let res: Response;
    try {
      res = await fetch(upstream, {
        method: "GET",
        redirect: "manual",
        headers: forwardHeaders,
      });
    } catch {
      return {
        ok: false,
        error: "Could not reach the URL shortener service.",
        status: 502,
      };
    }

    if (REDIRECT_STATUSES.has(res.status)) {
      const loc = res.headers.get("location");
      if (!loc) {
        return {
          ok: false,
          error: "Invalid redirect from shortener service.",
          status: 502,
        };
      }
      return {
        ok: true,
        type: "redirect",
        location: new URL(loc, upstream).toString(),
        status: res.status,
      };
    }

    if (res.status >= 200 && res.status < 300) {
      const headers = new Headers(res.headers);
      headers.delete("content-encoding");
      headers.delete("transfer-encoding");
      return {
        ok: true,
        type: "body",
        body: res.body,
        status: res.status,
        headers,
      };
    }

    return {
      ok: false,
      error: `Shortener returned ${res.status}.`,
      status: 502,
    };
  },
};
