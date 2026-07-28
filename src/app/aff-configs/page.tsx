import type { Metadata } from "next";
import AffConfigs from "./aff-configs";

export const metadata: Metadata = {
  title: "Aff Configs | Rizqi Pangestu",
  description: "Dashboard to view, create and delete application configs.",
};

export default function AffConfigsPage() {
  return <AffConfigs />;
}
