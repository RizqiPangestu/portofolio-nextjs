export type UrlShortenerProviderName = "http" | "gsheet";

export type ShortenResult =
  | { ok: true; shortUrl: string }
  | { ok: false; error: string; status: number };

export type ResolveResult =
  | { ok: true; type: "redirect"; location: string; status: number }
  | {
      ok: true;
      type: "body";
      body: ReadableStream<Uint8Array> | null;
      status: number;
      headers: Headers;
    }
  | { ok: false; error: string; status: number };

export type UrlShortener = {
  shorten(originalUrl: string, ctx: { origin: string }): Promise<ShortenResult>;
  resolve(urlId: string, request: Request): Promise<ResolveResult>;
};
