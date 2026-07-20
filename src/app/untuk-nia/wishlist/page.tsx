import type { Metadata } from "next";
import WishlistChecklist from "../_components/WishlistChecklist";

export const metadata: Metadata = {
  title: "wishlist · untuk nia",
};

export default function WishlistPage() {
  return (
    <section className="relative w-full py-10">
      <WishlistChecklist />
    </section>
  );
}
