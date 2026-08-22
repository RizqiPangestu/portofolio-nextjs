/**
 * Public origin for short links (`https://your.dns`).
 *
 * `new URL(request.url).origin` is the process bind address, which behind a
 * reverse proxy is often `http://localhost:8888` rather than the public DNS.
 *
 * Resolution order:
 * 1. SHORTENER_PUBLIC_ORIGIN (or NEXT_PUBLIC_SITE_URL)
 * 2. X-Forwarded-Proto + X-Forwarded-Host / Host
 * 3. request.url origin
 */
export function getPublicOrigin(request: Request): string {
  const fromEnv =
    process.env.SHORTENER_PUBLIC_ORIGIN?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) {
    try {
      return new URL(fromEnv).origin;
    } catch {
      /* fall through */
    }
  }

  const forwardedProto = request.headers
    .get("x-forwarded-proto")
    ?.split(",")[0]
    ?.trim();
  const forwardedHost = request.headers
    .get("x-forwarded-host")
    ?.split(",")[0]
    ?.trim();
  const host = forwardedHost || request.headers.get("host")?.trim();

  const url = new URL(request.url);
  const proto = forwardedProto || url.protocol.replace(":", "");
  if (host) return `${proto}://${host}`;
  return url.origin;
}
