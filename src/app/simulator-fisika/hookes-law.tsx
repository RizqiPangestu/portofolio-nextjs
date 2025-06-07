"use client"

import PullArrowSVG from "../ui/simulator-fisika/components/PullArrowSVG";
import SpringSVG from "../ui/simulator-fisika/components/SpringSVG";
import Wall from "../ui/simulator-fisika/components/wall";
import { use, useEffect, useState } from "react";
import BulkyArrow from "../ui/simulator-fisika/components/Arrow";

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

type HookesLawProps = {
    width: number
    height: number
    coils: number
}

export default function HookesLaw({width,height,coils}:HookesLawProps){
    const [springConstant,setSpringConstant] = useState<number>(200)
    const [forceConstant,setForceConstant] = useState<number>(0)
    const [distance,setDistance] = useState<number>(0)

    useEffect(() => {
      setDistance(forceConstant / springConstant);
    }, [forceConstant, springConstant]);

    return <div className="w-full relative">
    <div className={`flex flex-row items-center relative`} style={{ height: `${2.5*height}px` }}> 
      <Wall height={height*2}></Wall>
      <div className="flex flex-col h-full justify-center relative">
        <div className="absolute top-0 right-0">
          <p className="text-center text-sm">F = {forceConstant} N</p>
          {(forceConstant != 0) && (
            <BulkyArrow direction="left" color="#007F00" height={25} headWidth={20} shaftWidth={10} shaftLength={15+forceConstant}/>
          )}
        </div>
        <SpringSVG width={width+(distance*200)} height={height} coils={coils} strokeColor="#0070f3" strokeWidth={springConstant / 100} />
        <div className="absolute" 
          style={{ width: `${width+30 + 12}px`, height: `${height}px` }}>
          <div className="absolute right-0 border-l-1 border-dashed h-full border-green-500"></div>
        </div>
      </div>
      <div className="flex flex-col h-full w-full justify-center relative">
        <div className="absolute top-0">
          <p className="text-center text-sm">F = {forceConstant} N</p>
          {(forceConstant != 0) && (
            <BulkyArrow direction="right" color="#0070f3" height={25} headWidth={20} shaftWidth={10} shaftLength={15+forceConstant}/>
          )}
        </div>
        <PullArrowSVG height={height} translateX={forceConstant}></PullArrowSVG>
      </div>
      <div className="absolute bottom-0"
        style={{ left: `${width+30+15}px`}}>
          {(forceConstant != 0) ? (
            <div>
              <BulkyArrow direction="right" color="#0070f3" height={25} headWidth={20} shaftWidth={10} shaftLength={15+forceConstant}/>
              <p className="text-center text-sm">D = {distance.toFixed(3)} m</p>
            </div>
          ):(
            <p className="text-center text-sm">D = 0 m</p>
          )}
        </div>
    </div>
    
    <div className="flex flex-row gap-4 p-4 w-full h-40">
      <SpringSlider value={springConstant} setValue={setSpringConstant}></SpringSlider>
      <ForceSlider value={forceConstant} setValue={setForceConstant}></ForceSlider>
    </div>
  </div>
}