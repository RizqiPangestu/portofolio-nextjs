import type { Metadata } from "next";
import TextCompare from "../ui/text-compare/text-compare";

export const metadata: Metadata = {
  title: "Text Compare",
  description:
    "Compare two text snippets side by side in plain-text or key-value mode.",
};

export default function Page() {
  return <TextCompare />;
}
