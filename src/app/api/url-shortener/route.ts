import { NextResponse } from "next/server";

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

export async function POST(request: Request) {
  const serviceUrl = process.env.URL_SHORTENER_SERVICE_URL;
  if (!serviceUrl?.trim()) {
    return NextResponse.json(
      {
        error:
          "Server misconfiguration: URL_SHORTENER_SERVICE_URL is not set.",
      },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Expected JSON object." }, { status: 400 });
  }

  const url = (body as { url?: unknown }).url;
  if (typeof url !== "string" || !url.trim()) {
    return NextResponse.json(
      { error: "Field \"url\" is required." },
      { status: 400 },
    );
  }

  let parsed: URL;
  try {
    parsed = new URL(url.trim());
  } catch {
    return NextResponse.json(
      { error: "Please enter a valid URL (include http:// or https://)." },
      { status: 400 },
    );
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return NextResponse.json(
      { error: "Only http and https URLs are allowed." },
      { status: 400 },
    );
  }

  let upstream: Response;
  try {
    upstream = await fetch(serviceUrl.trim(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: parsed.toString() }),
    });
  } catch {
    return NextResponse.json(
      { error: "Could not reach the URL shortener service." },
      { status: 502 },
    );
  }

  const text = await upstream.text();
  let json: unknown;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    return NextResponse.json(
      {
        error: "Shortener service returned non-JSON.",
        detail: text.slice(0, 200),
      },
      { status: 502 },
    );
  }

  if (!upstream.ok) {
    const message =
      (json &&
        typeof json === "object" &&
        typeof (json as { error?: unknown }).error === "string" &&
        (json as { error: string }).error) ||
      `Shortener service error (${upstream.status}).`;
    return NextResponse.json({ error: message }, { status: upstream.status });
  }

  const shortUrl = extractShortUrl(json);
  if (!shortUrl) {
    return NextResponse.json(
      { error: "Shortener response did not include a short URL." },
      { status: 502 },
    );
  }

  return NextResponse.json({ short_url: shortUrl });
}
