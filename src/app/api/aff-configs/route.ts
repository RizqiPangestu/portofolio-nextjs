import { NextRequest, NextResponse } from "next/server";

const TARGET_HEADER = "x-target-url";
const COOKIE_HEADER = "x-proxy-cookie";

function badRequest(message: string) {
  return NextResponse.json({ code: "ERROR", message }, { status: 400 });
}

async function proxy(req: NextRequest, method: "GET" | "POST" | "DELETE") {
  const target = req.headers.get(TARGET_HEADER);
  if (!target) {
    return badRequest(`Missing "${TARGET_HEADER}" header.`);
  }

  let targetUrl: URL;
  try {
    targetUrl = new URL(target);
  } catch {
    return badRequest("Invalid target URL.");
  }
  if (targetUrl.protocol !== "http:" && targetUrl.protocol !== "https:") {
    return badRequest("Target URL must use http or https.");
  }

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const cookie = req.headers.get(COOKIE_HEADER);
  if (cookie) headers["Cookie"] = cookie;

  const body = method === "GET" ? undefined : await req.text();

  try {
    const upstream = await fetch(targetUrl.toString(), {
      method,
      headers,
      body,
      cache: "no-store",
    });

    const text = await upstream.text();
    return new NextResponse(text, {
      status: upstream.status,
      headers: {
        "Content-Type":
          upstream.headers.get("Content-Type") ?? "application/json",
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        code: "ERROR",
        message:
          err instanceof Error
            ? `Upstream request failed: ${err.message}. Is your VPN on and the URL reachable from this machine?`
            : "Upstream request failed.",
      },
      { status: 502 }
    );
  }
}

export function GET(req: NextRequest) {
  return proxy(req, "GET");
}

export function POST(req: NextRequest) {
  return proxy(req, "POST");
}

export function DELETE(req: NextRequest) {
  return proxy(req, "DELETE");
}
