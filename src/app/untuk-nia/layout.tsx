import type { Metadata } from "next";
import Navbar from "./_components/Navbar";
import Footer from "./_components/Footer";
import AudioProvider from "./_components/AudioProvider";
import { ConfigProvider } from "./_components/ConfigProvider";
import Decorations from "./_components/Decorations";
import FloatingPopups from "./_components/FloatingPopups";
import "./untuk-nia.css";

export const metadata: Metadata = {
  title: "Untuk Nia",
  description: "Halaman kecil yang dibuat khusus untuk Nia.",
};

export default function UntukNiaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ConfigProvider>
      <AudioProvider>
        <div className="relative min-h-screen flex flex-col overflow-x-hidden bg-[radial-gradient(ellipse_at_top,#3a0f2d_0%,#1a0712_40%,#08030a_100%)] text-pink-50">
          <Decorations />
          <Navbar />
          <main className="relative z-10 flex-1 flex flex-col w-full">
            {children}
          </main>
          <Footer />
          <FloatingPopups />
        </div>
      </AudioProvider>
    </ConfigProvider>
  );
}
