import type { Metadata } from "next";

import "./physic-simulator.css";

export const metadata: Metadata = {
  title: "Hooke's Law Simulator",
  description:
    "Interactive spring physics: Hooke's law, springs in series and parallel, and elastic potential energy.",
  openGraph: {
    title: "Hooke's Law Simulator",
    description:
      "Explore spring force, displacement, and elastic energy with interactive diagrams.",
  },
};

export default function PhysicSimulatorLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="physic-simulator-route">
      {children}
    </div>
  );
}
