import type { Metadata } from "next";
import UrlShortener from "../ui/url-shortener/url-shortener";
import { getShortenerProviderName } from "./_lib/provider";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "URL Shortener | Rizqi Pangestu",
  description:
    "Shorten long URLs using Google Sheets or an external shortener service.",
};

export default function UrlShortenerPage() {
  return <UrlShortener provider={getShortenerProviderName()} />;
}
