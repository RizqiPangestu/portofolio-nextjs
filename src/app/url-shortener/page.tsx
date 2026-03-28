import type { Metadata } from "next";
import UrlShortener from "../ui/url-shortener/url-shortener";

export const metadata: Metadata = {
  title: "URL Shortener | Rizqi Pangestu",
  description: "Shorten long URLs using an external shortener service.",
};

export default function UrlShortenerPage() {
  return <UrlShortener />;
}
