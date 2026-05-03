import PhysicSimulator from "./physic-simulator";

export default function PhysicSimulatorPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <header className="mb-10 border-b border-neutral-200 pb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
          Hooke&apos;s Law Simulator
        </h1>
        <p className="mt-3 max-w-2xl text-pretty text-sm leading-relaxed text-neutral-600 sm:text-base">
          Adjust spring constants and applied force to see displacement, internal spring forces, and
          energy in single-spring, series, and parallel arrangements.
        </p>
      </header>
      <PhysicSimulator />
    </main>
  );
}
