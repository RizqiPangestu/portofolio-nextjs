import type { Metadata } from "next";
import "./simulator-fisika.css"

export const metadata: Metadata = {
    title: "Simulator Fisika",
    description: "",
};

export default function SimulatorFisikaLayout({
    children,
  }: Readonly<{
    children: React.ReactNode;
  }>) {
    return (
      <html lang="en">
        <body
          className={`antialiased`}
        >
          {children}
        </body>
      </html>
    );
  }