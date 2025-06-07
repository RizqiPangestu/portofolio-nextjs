"use client"

import Wall from "../ui/simulator-fisika/components/wall";
import HookesLaw from "./hookes-law";

export default function SimulatorFisika(){
    const width = 480
    const height = 80
    const springCoils = 10
    
    return <div className={`flex flex-col w-full h-[${height*2}px] gap-8`}>
        <HookesLaw width={width} height={height} coils={springCoils}></HookesLaw>
        <HookesLaw width={width} height={height} coils={springCoils}></HookesLaw>
    </div>
}