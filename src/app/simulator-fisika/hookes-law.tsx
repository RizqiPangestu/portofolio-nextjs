"use client"

import PullArrowSVG from "../ui/simulator-fisika/components/PullArrowSVG";
import SpringSVG from "../ui/simulator-fisika/components/SpringSVG";
import Wall from "../ui/simulator-fisika/components/wall";
import {useEffect, useState } from "react";
import BulkyArrow from "../ui/simulator-fisika/components/Arrow";

type SpringSliderProps = {
  setValue: (value: number) => void;
  value: number 
  minConst: number
  maxConst: number
}

function SpringSlider({ value, setValue, minConst, maxConst }:SpringSliderProps){
  const step = 10;
  const minRulerValue = 1
  const maxRulerValue = 10
  // Generate tick values including min, max, and middle
  const ticks = [minRulerValue, Math.floor((minRulerValue + maxRulerValue) / 2), maxRulerValue];

  return <div className="bg-gray-300 w-[360px] lg:w-[360px] rounded-lg p-5 pt-1">
      <p className="mb-1 text-sm lg:text-lg">Spring Constant: {value} N/m</p>
      {/* Ruler container */}
      <input 
          type="range" 
          min={minConst}
          max={maxConst}
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
                      {Math.round(((tickValue-minRulerValue)/(maxRulerValue-minRulerValue) * (maxConst-minConst)) + minConst)}
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

  return <div className="bg-gray-300  w-[360px] lg:w-[360px] rounded-lg p-5 pt-1">
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
      <div className="relative left-0 z-[1]">
        <Wall height={height*2}></Wall>
      </div>
      <div className="flex flex-col h-full justify-center relative">
        <div className="absolute top-0 right-0">
          <div className="flex flex-col">
            <p className="text-center text-sm">F = {forceConstant} N</p>
            {(forceConstant != 0) && (
              <div className="self-end">
                <BulkyArrow direction="left" color="#007F00" height={25} headWidth={20} shaftWidth={10} shaftLength={15+forceConstant}/>
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-row w-full h-full items-center">
          <SpringSVG width={width+(distance*200)} height={height} coils={coils} strokeColor="#0070f3" strokeWidth={springConstant / 100} />
        </div>
        <div className="absolute h-full"  style={{ width: `${width+40}px` }}>
          <div className="flex flex-row items-center justify-end h-full w-full">
            <div className="right-0 border-l-2 border-dashed h-3/5 border-green-500"></div>
            <div className="absolute flex flex-col right-0 bottom-0" 
              style={{ transform: `translateX(${width+40}px)`, width: `${width+40}px` }}>
              {(forceConstant != 0) ? (
                <div className="" >
                  <BulkyArrow direction="right" color="#0070f3" height={25} headWidth={20} shaftWidth={10} shaftLength={15+forceConstant}/>
                  <p className="text-sm">D = {distance.toFixed(3)} m</p>
                </div>
              ):(
                <p className="text text-sm">D = 0 m</p>
              )}
            </div>
          </div>
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
    </div>
    
    <div className="flex flex-row gap-4 p-4">
      <SpringSlider value={springConstant} setValue={setSpringConstant} minConst={100} maxConst={1000}></SpringSlider>
      <ForceSlider value={forceConstant} setValue={setForceConstant}></ForceSlider>
    </div>
  </div>
}

export function HookesLawParallel({width,height,coils}:HookesLawProps){
  const [springConstant1,setSpringConstant1] = useState<number>(200)
  const [springConstant2,setSpringConstant2] = useState<number>(200)
  const [forceConstant,setForceConstant] = useState<number>(0)
  const [springForce1,setSpringForce1] = useState<number>(0)
  const [springForce2,setSpringForce2] = useState<number>(0)
  const [distance,setDistance] = useState<number>(0)

  useEffect(() => {
    const newDistance = forceConstant / (springConstant1 + springConstant2);
    setDistance(newDistance);
    setSpringForce1(springConstant1*newDistance)
    setSpringForce2(springConstant2*newDistance)
  }, [forceConstant, springConstant1, springConstant2]);

  return <div className="w-full relative">
  <div className={`flex flex-row items-center relative`} style={{ height: `${5*height}px` }}> 
    <div className="relative left-0 z-[1]">
      <Wall height={height*4.5}></Wall>
    </div>
    <div className="flex flex-col h-full justify-center relative">
      <div className="absolute top-0 right-0 flex flex-col">
        <div>
          {(forceConstant != 0) ? (
            <div className="flex flex-col">
              <p className="text-center text-sm">F1 = {springForce1.toFixed(3)} N</p>
              <div className="self-end">
                <BulkyArrow direction="left" color="#007F00" height={25} headWidth={20} shaftWidth={10} shaftLength={15+forceConstant}/>
              </div>
            </div>
          ) : (
            <p className="text-center text-sm">F1 = 0 N</p>
          )}
        </div>
        <div>
          {(forceConstant != 0) ? (
            <div className="flex flex-col">
              <p className="text-center text-sm">F2 = {springForce2.toFixed(3)} N</p>
              <div className="self-end">
                <BulkyArrow direction="left" color="#007F00" height={25} headWidth={20} shaftWidth={10} shaftLength={15+forceConstant}/>
              </div>
            </div>
          ): (
            <p className="text-center text-sm translate-y-6">F2 = 0 N</p>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-16">
        <SpringSVG width={width+(distance*200)} height={height} coils={coils} strokeColor="#0070f3" strokeWidth={springConstant1 / 100} />
        <SpringSVG width={width+(distance*200)} height={height} coils={coils} strokeColor="#0070f3" strokeWidth={springConstant2 / 100} />
      </div>
      <div className="absolute right-0 border-4 h-full border-black translate-x-1/2 z-[1]" style={{height: `${height*2}px` }}></div>
      <div className="absolute h-3/4"  style={{ width: `${width+40}px` }}>
        <div className="flex flex-row items-center justify-end h-full w-full">
          <div className="right-0 border-l-2 border-dashed h-3/5 border-green-500"></div>
          <div className="absolute flex flex-col right-0 bottom-0" 
            style={{ transform: `translateX(${width+40}px)`, width: `${width+40}px` }}>
            {(forceConstant != 0) ? (
              <div className="" >
                <BulkyArrow direction="right" color="#0070f3" height={25} headWidth={20} shaftWidth={10} shaftLength={15+forceConstant}/>
                <p className="text-sm">D = {distance.toFixed(3)} m</p>
              </div>
            ):(
              <p className="text text-sm">D = 0 m</p>
            )}
          </div>
        </div>
      </div>
    </div>
    <div className="flex flex-col h-full w-full justify-center relative">
      <div className="absolute top-6">
        <p className="text-center text-sm">F = {forceConstant} N</p>
        {(forceConstant != 0) && (
          <BulkyArrow direction="right" color="#0070f3" height={25} headWidth={20} shaftWidth={10} shaftLength={15+forceConstant}/>
        )}
      </div>
      <PullArrowSVG height={height} translateX={forceConstant}></PullArrowSVG>
    </div>
  </div>
  
  <div className="flex flex-row gap-4 p-4 items-center">
    <div className="flex flex-col gap-4">
      <SpringSlider value={springConstant1} setValue={setSpringConstant1} minConst={200} maxConst={600}></SpringSlider>
      <SpringSlider value={springConstant2} setValue={setSpringConstant2} minConst={200} maxConst={600}></SpringSlider>
    </div>
    <ForceSlider value={forceConstant} setValue={setForceConstant}></ForceSlider>
  </div>
</div>
}

export function HookesLawSeries({width,height,coils}:HookesLawProps){
  const [springConstant1,setSpringConstant1] = useState<number>(200)
  const [springConstant2,setSpringConstant2] = useState<number>(200)
  const [forceConstant,setForceConstant] = useState<number>(0)
  const [distance,setDistance] = useState<number>(0)

  useEffect(() => {
    const distance1 = forceConstant / springConstant1;
    const distance2 = forceConstant / springConstant2
    setDistance(distance1+distance2);
  }, [forceConstant, springConstant1, springConstant2]);

  return <div className="w-full relative">
  <div className={`flex flex-row items-center relative`} style={{ height: `${2.5*height}px` }}> 
    <div className="relative left-0 z-[1]">
      <Wall height={height*2}></Wall>
    </div>
    <div className="flex flex-col h-full justify-center relative">
      <div className="absolute top-0 right-0 flex flex-col">
        <div>
          {(forceConstant != 0) ? (
            <div className="flex flex-col">
              <p className="text-center text-sm">F2 = {forceConstant} N</p>
              <div className="self-end">
                <BulkyArrow direction="left" color="#007F00" height={25} headWidth={20} shaftWidth={10} shaftLength={15+forceConstant}/>
              </div>
            </div>
          ) : (
            <p className="text-center text-sm">F1 = 0 N</p>
          )}
        </div>
      </div>
      <div className="flex flex-row h-full items-center">
      {/* style={{ transform: `translateX(${width}px)` }} */}
        <div className="flex flex-row w-full absolute top-0 justify-center">
          <div className="">
            <p className="text-center text-sm">F1 = {forceConstant} N</p>
            {(forceConstant != 0) && (
              <BulkyArrow direction="left" color="#F070f3" height={25} headWidth={20} shaftWidth={10} shaftLength={15+forceConstant}/>
            )}
          </div>
          <div className="">
            <p className="text-center text-sm">F2 = {forceConstant} N</p>
            {(forceConstant != 0) && (
              <BulkyArrow direction="right" color="#007F00" height={25} headWidth={20} shaftWidth={10} shaftLength={15+forceConstant}/>
            )}
          </div>
        </div>
        <SpringSVG width={width+(distance*200)} height={height} coils={coils} strokeColor="#0070f3" strokeWidth={springConstant1 / 100} />
        <SpringSVG width={width+(distance*200)} height={height} coils={coils} strokeColor="#0070f3" strokeWidth={springConstant2 / 100} />
      </div>
      <div className="absolute h-full"  style={{ width: `${2*(width+40)}px` }}>
        <div className="flex flex-row items-center justify-end h-full w-full">
          <div className="right-0 border-l-2 border-dashed h-3/5 border-green-500"></div>
          <div className="absolute flex flex-col right-0 bottom-0" 
            style={{ transform: `translateX(${width+40}px)`, width: `${width+40}px` }}>
            {(forceConstant != 0) ? (
              <div className="" >
                <BulkyArrow direction="right" color="#0070f3" height={25} headWidth={20} shaftWidth={10} shaftLength={15+forceConstant}/>
                <p className="text-sm">D = {distance.toFixed(3)} m</p>
              </div>
            ):(
              <p className="text text-sm">D = 0 m</p>
            )}
          </div>
        </div>
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
  </div>
  
  <div className="flex flex-row gap-4 p-4 items-center">
    <div className="flex flex-col gap-4">
      <SpringSlider value={springConstant1} setValue={setSpringConstant1} minConst={200} maxConst={600}></SpringSlider>
      <SpringSlider value={springConstant2} setValue={setSpringConstant2} minConst={200} maxConst={600}></SpringSlider>
    </div>
    <ForceSlider value={forceConstant} setValue={setForceConstant}></ForceSlider>
  </div>
</div>
}