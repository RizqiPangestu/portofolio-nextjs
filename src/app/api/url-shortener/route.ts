import { NextResponse } from "next/server";
import { createUrlShortener } from "@/app/url-shortener/_lib/factory";

export async function POST(request: Request) {
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
      { error: 'Field "url" is required.' },
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

  const origin = new URL(request.url).origin;
  const shortener = createUrlShortener();
  const result = await shortener.shorten(parsed.toString(), { origin });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ short_url: result.shortUrl });
}
