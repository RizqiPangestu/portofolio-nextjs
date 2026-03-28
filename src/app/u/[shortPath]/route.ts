import { NextResponse } from "next/server";

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

export async function GET(
  request: Request,
  context: { params: Promise<{ shortPath: string }> },
) {
  const { shortPath } = await context.params;
  if (!shortPath?.trim()) {
    return NextResponse.json({ error: "Missing short path." }, { status: 400 });
  }

  const origin = getShortenerOrigin();
  if (!origin) {
    return NextResponse.json(
      { error: "URL shortener service is not configured." },
      { status: 503 },
    );
  }

  const upstream = `${origin}/u/${encodeURIComponent(shortPath)}`;

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
    return NextResponse.json(
      { error: "Could not reach the URL shortener service." },
      { status: 502 },
    );
  }

  if (REDIRECT_STATUSES.has(res.status)) {
    const loc = res.headers.get("location");
    if (!loc) {
      return NextResponse.json(
        { error: "Invalid redirect from shortener service." },
        { status: 502 },
      );
    }
    const absolute = new URL(loc, upstream).toString();
    return NextResponse.redirect(absolute, res.status);
  }

  if (res.status >= 200 && res.status < 300) {
    const headers = new Headers(res.headers);
    headers.delete("content-encoding");
    headers.delete("transfer-encoding");
    return new NextResponse(res.body, {
      status: res.status,
      headers,
    });
  }

  return NextResponse.json(
    { error: `Shortener returned ${res.status}.` },
    { status: 502 },
  );
}
