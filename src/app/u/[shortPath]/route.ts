import { NextResponse } from "next/server";
import { createUrlShortener } from "@/app/url-shortener/_lib/factory";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ shortPath: string }> },
) {
  const { shortPath } = await context.params;
  if (!shortPath?.trim()) {
    return NextResponse.json({ error: "Missing short path." }, { status: 400 });
  }

  const shortener = createUrlShortener();
  const result = await shortener.resolve(shortPath.trim(), request);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  if (result.type === "redirect") {
    return NextResponse.redirect(result.location, result.status);
  }

  return new NextResponse(result.body, {
    status: result.status,
    headers: result.headers,
  });
}
