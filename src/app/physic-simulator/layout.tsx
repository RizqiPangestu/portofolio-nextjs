import type { Metadata } from "next";
import "./physic-simulator.css"

export const metadata: Metadata = {
    title: "Physics Law Simulator",
    description: "",
};

export default function PhysicSimulatorLayout({
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