"use client"

import { useState } from "react";
import HookesLaw from "./hookes-law";

type SpringSliderProps = {
    setValue: (value: number) => void;
    value: number
}

function SpringSlider({ value, setValue }:SpringSliderProps){
    const min = 100
    const max = 1000
    const step = 10;
  
    const minRulerValue = 1
    const maxRulerValue = 10
    // Generate tick values including min, max, and middle
    const ticks = [minRulerValue, Math.floor((minRulerValue + maxRulerValue) / 2), maxRulerValue];

    return <div className="bg-gray-300 w-1/2 lg:w-1/4 rounded-lg p-2">
        <p className="mb-1 text-sm lg:text-lg">Spring Constant: {value} N/m</p>
        {/* Ruler container */}
        <input 
            type="range" 
            min={min}
            max={max}
            value={value} 
            step={step}
            onChange={(e) => setValue(Number(e.target.value))}
            className="w-full"
        />
        <div className="relative h-2">
            {/* Full ruler line */}
            <div className="absolute top-3 left-0 right-0 h-0.5 bg-gray-700" />
            {/* Tick marks */}
            {Array.from({ length: maxRulerValue - minRulerValue + 1 }, (_, i) => {
            const tickValue = minRulerValue + i;
            const leftPercent = ((tickValue - minRulerValue) / (maxRulerValue - minRulerValue)) * 100;
            const isMajorTick = ticks.includes(tickValue);
            return (
                <div
                    key={tickValue}
                    className={`absolute bottom-0 w-px bg-gray-700`}
                    style={{
                        height: isMajorTick ? '16px' : '8px',
                        left: `${leftPercent}%`,
                        transform: 'translateX(-50%)',
                    }}
                    >
                    {isMajorTick && (
                        <div className="absolute top-5 w-max text-xs text-gray-900 -translate-x-1/2">
                        {Math.round(((tickValue-minRulerValue)/(maxRulerValue-minRulerValue) * (max-min)) + min)}
                        </div>
                    )}
                </div>
            );
            })}
        </div>
    </div>
}

type ForceSliderProps = {
    setValue: (value: number) => void;
    value: number
}

function ForceSlider({ value, setValue }:ForceSliderProps){
    const min = 0
    const max = 100
    const step = 5;

    const minRulerValue = 0
    const maxRulerValue = 10
    // Generate tick values including min, max, and middle
    const ticks = [minRulerValue, Math.floor((minRulerValue + maxRulerValue) / 2), maxRulerValue];

    return <div className="bg-gray-300 w-1/2 lg:w-1/4 rounded-lg p-2">
        <p className="mb-1 text-sm lg:text-lg">Applied Force: {value} N</p>
        <div>
            <input 
            type="range" 
            min={min}
            max={max}
            value={value} 
            step={step}
            onChange={(e) => setValue(Number(e.target.value))}
            className="w-full"
        />
        <div className="relative h-2">
            <div className="absolute top-3 left-0 right-0 h-0.5 bg-gray-700" />

            {Array.from({ length: maxRulerValue - minRulerValue + 1}, (_, i) => {
            const tickValue = minRulerValue + i;
            const leftPercent = ((tickValue - minRulerValue) / (maxRulerValue - minRulerValue)) * 100;
            const isMajorTick = ticks.includes(tickValue);
            return (
                <div
                    key={tickValue}
                    className={`absolute bottom-0 w-px bg-gray-700`}
                    style={{
                        height: isMajorTick ? '16px' : '8px',
                        left: `${leftPercent}%`,
                    }}
                    >
                    {isMajorTick && (
                        <div className="absolute top-5 w-max text-xs text-gray-900 -translate-x-1/2">
                        {((tickValue-minRulerValue)/(maxRulerValue-minRulerValue) * (max-min)) + min}
                        </div>
                    )}
                </div>
            );
            })}
        </div>
        </div>
    </div>
}

export default function SimulatorFisika(){
    const width = 480
    const height = 80
    const springCoils = 12

    const [springConstant,setSpringConstant] = useState<number>(200)
    const [forceConstant,setForceConstant] = useState<number>(0)
    
    return <div className="flex flex-col">
        <HookesLaw width={width} height={height} coils={springCoils} springConstant={springConstant} force={forceConstant}></HookesLaw>
        <div className="flex flex-row gap-4 p-4 w-full h-40">
            <SpringSlider value={springConstant} setValue={setSpringConstant}></SpringSlider>
            <ForceSlider value={forceConstant} setValue={setForceConstant}></ForceSlider>
        </div>
    </div>
}