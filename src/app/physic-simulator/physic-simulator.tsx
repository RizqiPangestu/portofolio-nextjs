"use client";

import HookesLaw, {
  HookesLawEnergy,
  HookesLawParallel,
  HookesLawSeries,
} from "./hookes-law";

const BOARD_WIDTH = 480;
const BOARD_HEIGHT = 80;
const SPRING_COILS = 10;

export default function PhysicSimulator() {
  return (
    <div className="flex flex-col gap-10 sm:gap-12">
      <section
        aria-labelledby="phys-sim-basic-heading"
        className="rounded-2xl border border-neutral-200 bg-neutral-50/80 p-5 shadow-sm sm:p-6"
      >
        <h2
          id="phys-sim-basic-heading"
          className="mb-6 text-lg font-semibold text-neutral-900"
        >
          I. Basic
        </h2>
        <div className="overflow-x-auto">
          <HookesLaw width={BOARD_WIDTH} height={BOARD_HEIGHT} coils={SPRING_COILS} />
        </div>
      </section>

      <section
        aria-labelledby="phys-sim-system-heading"
        className="rounded-2xl border border-neutral-200 bg-neutral-50/80 p-5 shadow-sm sm:p-6"
      >
        <h2
          id="phys-sim-system-heading"
          className="mb-6 text-lg font-semibold text-neutral-900"
        >
          II. Parallel &amp; Series Systems
        </h2>
        <div className="flex flex-col gap-10">
          <div className="overflow-x-auto">
            <h3 className="mb-3 text-lg font-bold text-neutral-700">
              Parallel
            </h3>
            <HookesLawParallel
              width={BOARD_WIDTH}
              height={BOARD_HEIGHT}
              coils={SPRING_COILS}
            />
          </div>
          <div className="overflow-x-auto">
            <h3 className="mb-3 text-lg font-bold text-neutral-700">
              Series
            </h3>
            <HookesLawSeries
              width={BOARD_WIDTH * 0.8}
              height={BOARD_HEIGHT}
              coils={SPRING_COILS * 0.8}
            />
          </div>
        </div>
      </section>

      <section
        aria-labelledby="phys-sim-energy-heading"
        className="rounded-2xl border border-neutral-200 bg-neutral-50/80 p-5 shadow-sm sm:p-6"
      >
        <h2
          id="phys-sim-energy-heading"
          className="mb-6 text-lg font-semibold text-neutral-900"
        >
          III. Energy
        </h2>
        <div className="overflow-x-auto">
          <HookesLawEnergy width={BOARD_WIDTH} height={BOARD_HEIGHT} coils={SPRING_COILS} />
        </div>
      </section>
    </div>
  );
}
