"use client"

import HookesLaw, { HookesLawParallel } from "./hookes-law";

export default function SimulatorFisika(){
    const width = 480
    const height = 80
    const springCoils = 10
    
    return <div className="flex flex-col gap-8">
        <div>
            <h2 className="text-xl text-bold">Introduction</h2>
            <div className={`flex flex-col w-full h-[${height*2}px] gap-2`}>
                <HookesLaw width={width} height={height} coils={springCoils}></HookesLaw>
                <HookesLaw width={width} height={height} coils={springCoils}></HookesLaw>
            </div>
        </div>
        <div>
            <h2 className="text-xl text-bold">System</h2>
            <HookesLawParallel width={width} height={height} coils={springCoils}></HookesLawParallel>
        </div>
    </div>
}