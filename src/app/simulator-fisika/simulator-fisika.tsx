"use client"

import HookesLaw, { HookesLawEnergy, HookesLawParallel, HookesLawSeries } from "./hookes-law";

export default function SimulatorFisika(){
    const width = 480
    const height = 80
    const springCoils = 10
    
    return <div className="flex flex-col gap-8 px-5">
        <div>
            <h2 className="text-xl font-bold">I. Dasar</h2>
            <HookesLaw width={width} height={height} coils={springCoils}></HookesLaw>
            <HookesLaw width={width} height={height} coils={springCoils}></HookesLaw>
        </div>
        <div>
            <h2 className="text-xl font-bold">II. Sistem</h2>
            <HookesLawParallel width={width} height={height} coils={springCoils}></HookesLawParallel>
            <HookesLawSeries width={width*0.8} height={height} coils={springCoils*0.8}></HookesLawSeries>
        </div>
        <div>
            <h2 className="text-xl font-bold">III. Energi</h2>
            <HookesLawEnergy width={width} height={height} coils={springCoils}></HookesLawEnergy>
        </div>
    </div>
}