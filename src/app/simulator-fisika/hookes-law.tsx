"use client"

import PullArrowSVG from "../ui/simulator-fisika/components/PullArrowSVG";
import SpringSVG from "../ui/simulator-fisika/components/SpringSVG";
import {useEffect, useState } from "react";
import BulkyArrow from "../ui/simulator-fisika/components/Arrow";
import ParabolaGraph from "../ui/simulator-fisika/components/Parabola";
import EnergyBar from "../ui/simulator-fisika/components/EnergyBar";
import Wall from "../ui/simulator-fisika/components/Wall";

type SliderProps = {
  setValue: (value: number) => void;
  value: number
  min: number
  max: number
  step: number
  text: string
  unit: string
  toFixed?: number
}

function Slider({ value, setValue,min,max,step,text,unit, toFixed }:SliderProps){
  const minRulerValue = 0
  const maxRulerValue = 10
  // Generate tick values including min, max, and middle
  const ticks = [minRulerValue, Math.floor((minRulerValue + maxRulerValue) / 2), maxRulerValue];

  return <div className="bg-gray-300  w-[360px] lg:w-[360px] rounded-lg p-5 pt-1">
      <p className="mb-1 text-sm lg:text-lg">{text}: {toFixed==0?(value):(value.toFixed(toFixed))} {unit}</p>
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

type VisualBoardProps = {
  showSpringForce: (value: boolean) => void;
  isSpringForceChecked: boolean
  showAppliedForce: (value: boolean) => void;
  isAppliedForceChecked: boolean
  showDisplacement: (value: boolean) => void;
  isDisplacementChecked: boolean
  showEquilibrium: (value: boolean) => void;
  isEquilibriumChecked: boolean
}

function VisualBoard({
  showSpringForce,
  isSpringForceChecked,
  showAppliedForce,
  isAppliedForceChecked,
  showDisplacement,
  isDisplacementChecked,
  showEquilibrium,
  isEquilibriumChecked,
}:VisualBoardProps){
  return <div className="bg-gray-300  w-[240px] lg:w-[240px] rounded-lg p-3 px-5">
    <div className="flex flex-col gap-2">
      <label className="flex gap-1">
        <input 
          className="accent-purple-300" 
          type="checkbox"
          checked={isSpringForceChecked}
          onChange={(e) => {showSpringForce(e.target.checked)}}
        />
        Spring Force
      </label>
      <label className="flex gap-1">
        <input 
          className="accent-pink-300" 
          type="checkbox"
          checked={isAppliedForceChecked}
          onChange={(e) => {showAppliedForce(e.target.checked)}}
        />
        Applied Force
      </label>
      <label className="flex gap-1">
        <input 
          className="accent-green-300" 
          type="checkbox"
          checked={isDisplacementChecked}
          onChange={(e) => {showDisplacement(e.target.checked)}}
        />
        Displacement
      </label>
      <label className="flex gap-1">
        <input 
          className="accent-blue-300" 
          type="checkbox"
          checked={isEquilibriumChecked}
          onChange={(e) => {showEquilibrium(e.target.checked)}}
        />
        Equilibrium
      </label>
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

    const [isSpringForceChecked,showSpringForce]= useState<boolean>(false)
    const [isAppliedForceChecked,showAppliedForce]= useState<boolean>(false)
    const [isDisplacementChecked,showDisplacement]= useState<boolean>(false)
    const [isEquilibriumChecked,showEquilibrium]= useState<boolean>(false)

    useEffect(() => {
      setDistance(forceConstant / springConstant);
    }, [forceConstant, springConstant]);

    return <div className="w-full relative p-5">
    <VisualBoard 
      showSpringForce={showSpringForce}
      isSpringForceChecked={isSpringForceChecked}
      showAppliedForce={showAppliedForce}
      isAppliedForceChecked={isAppliedForceChecked}
      showDisplacement={showDisplacement}
      isDisplacementChecked={isDisplacementChecked}
      showEquilibrium={showEquilibrium}
      isEquilibriumChecked={isEquilibriumChecked}
    ></VisualBoard>
    <div className={`flex flex-row items-center relative`} style={{ height: `${2.5*height}px` }}> 
      <div className="relative left-0 z-[1]">
        <Wall height={height*2}></Wall>
      </div>
      <div className="flex flex-col h-full justify-center relative">
        <div className="absolute top-0 right-0">
          {isSpringForceChecked && (
            <div className="flex flex-col">
              <p className="text-center text-sm">F = {forceConstant} N</p>
              {(forceConstant != 0) && (
                <div className="self-end">
                  <BulkyArrow direction="left" color="#007F00" height={25} headWidth={20} shaftWidth={10} shaftLength={15+forceConstant}/>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex flex-row w-full h-full items-center">
          <SpringSVG width={width+(distance*200)} height={height} coils={coils} strokeColor="#0070f3" strokeWidth={springConstant / 100} />
        </div>
        <div className="absolute h-full"  style={{ width: `${width+40}px` }}>
          <div className="flex flex-row items-center justify-end h-full w-full">
            {isEquilibriumChecked && (
              <div className="right-0 border-l-2 border-dashed h-3/5 border-green-500"></div>
            )}
            {isDisplacementChecked && (
              <div className="absolute flex flex-col right-0 bottom-0" 
                style={{ transform: `translateX(${width+40}px)`, width: `${width+40}px` }}>
                {(forceConstant != 0) ? (
                  <div className="" >
                    <BulkyArrow direction="right" color="#0070f3" height={25} headWidth={20} shaftWidth={10} shaftLength={distance*200}/>
                    <p className="text-sm">D = {distance.toFixed(3)} m</p>
                  </div>
                ):(
                  <p className="text text-sm">D = 0 m</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="flex flex-col h-full w-full justify-center relative">
        {isAppliedForceChecked && (
          <div className="absolute top-0">
            <p className="text-center text-sm">F = {forceConstant} N</p>
            {(forceConstant != 0) && (
              <BulkyArrow direction="right" color="#0070f3" height={25} headWidth={20} shaftWidth={10} shaftLength={15+forceConstant}/>
            )}
          </div>
        )}
        <PullArrowSVG height={height} translateX={forceConstant}></PullArrowSVG>
      </div>
    </div>
    
    <div className="flex flex-row gap-4 p-4">
      <Slider 
        value={springConstant} 
        setValue={setSpringConstant} 
        min={100}
        max={1000} 
        step={10} 
        text="Spring Constant"
        unit="N/m"/>
      <Slider 
        value={forceConstant} 
        setValue={setForceConstant} 
        min={0}
        max={100} 
        step={5} 
        text="Applied Force"
        unit="N"/>
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

  const [isSpringForceChecked,showSpringForce]= useState<boolean>(false)
  const [isAppliedForceChecked,showAppliedForce]= useState<boolean>(false)
  const [isDisplacementChecked,showDisplacement]= useState<boolean>(false)
  const [isEquilibriumChecked,showEquilibrium]= useState<boolean>(false)

  useEffect(() => {
    const newDistance = forceConstant / (springConstant1 + springConstant2);
    setDistance(newDistance);
    setSpringForce1(springConstant1*newDistance)
    setSpringForce2(springConstant2*newDistance)
  }, [forceConstant, springConstant1, springConstant2]);

  return <div className="w-full relative p-5">
    <VisualBoard 
      showSpringForce={showSpringForce}
      isSpringForceChecked={isSpringForceChecked}
      showAppliedForce={showAppliedForce}
      isAppliedForceChecked={isAppliedForceChecked}
      showDisplacement={showDisplacement}
      isDisplacementChecked={isDisplacementChecked}
      showEquilibrium={showEquilibrium}
      isEquilibriumChecked={isEquilibriumChecked}
    ></VisualBoard>
  <div className={`flex flex-row items-center relative`} style={{ height: `${5*height}px` }}> 
    <div className="relative left-0 z-[1]">
      <Wall height={height*4.5}></Wall>
    </div>
    <div className="flex flex-col h-full justify-center relative">
      <div className="absolute top-0 right-0 flex flex-col">
        {isSpringForceChecked && (
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
        )}
      </div>
      <div className="flex flex-col gap-16">
        <SpringSVG width={width+(distance*200)} height={height} coils={coils} strokeColor="#0070f3" strokeWidth={springConstant1 / 100} />
        <SpringSVG width={width+(distance*200)} height={height} coils={coils} strokeColor="#0070f3" strokeWidth={springConstant2 / 100} />
      </div>
      <div className="absolute right-0 border-4 h-full border-black translate-x-1/2 z-[1]" style={{height: `${height*2}px` }}></div>
      <div className="absolute h-3/4"  style={{ width: `${width+40}px` }}>
        <div className="flex flex-row items-center justify-end h-full w-full">
          {isEquilibriumChecked && (
            <div className="right-0 border-l-2 border-dashed h-3/5 border-green-500"></div>
          )}
          {isDisplacementChecked && (
            <div className="absolute flex flex-col right-0 bottom-0" 
              style={{ transform: `translateX(${width+40}px)`, width: `${width+40}px` }}>
              {(forceConstant != 0) ? (
                <div className="" >
                  <BulkyArrow direction="right" color="#0070f3" height={25} headWidth={20} shaftWidth={10} shaftLength={distance*200}/>
                  <p className="text-sm">D = {distance.toFixed(3)} m</p>
                </div>
              ):(
                <p className="text text-sm">D = 0 m</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
    <div className="flex flex-col h-full w-full justify-center relative">
      {isAppliedForceChecked && (
        <div className="absolute top-6">
          <p className="text-center text-sm">F = {forceConstant} N</p>
          {(forceConstant != 0) && (
            <BulkyArrow direction="right" color="#0070f3" height={25} headWidth={20} shaftWidth={10} shaftLength={15+forceConstant}/>
          )}
        </div>
      )}
      <PullArrowSVG height={height} translateX={forceConstant}></PullArrowSVG>
    </div>
  </div>
  
  <div className="flex flex-row gap-4 p-4 items-center">
    <div className="flex flex-col gap-4">
      <Slider 
        value={springConstant1} 
        setValue={setSpringConstant1} 
        min={200}
        max={600} 
        step={10} 
        text="Spring Constant"
        unit="N/m"/>
      <Slider 
        value={springConstant2} 
        setValue={setSpringConstant2} 
        min={200}
        max={600} 
        step={10} 
        text="Spring Constant"
        unit="N/m"/>
    </div>
    <Slider 
        value={forceConstant} 
        setValue={setForceConstant} 
        min={0}
        max={100} 
        step={5} 
        text="Applied Force"
        unit="N"/>
  </div>
</div>
}

export function HookesLawSeries({width,height,coils}:HookesLawProps){
  const [springConstant1,setSpringConstant1] = useState<number>(200)
  const [springConstant2,setSpringConstant2] = useState<number>(200)
  const [forceConstant,setForceConstant] = useState<number>(0)
  const [distance,setDistance] = useState<number>(0)

  const [isSpringForceChecked,showSpringForce]= useState<boolean>(false)
  const [isAppliedForceChecked,showAppliedForce]= useState<boolean>(false)
  const [isDisplacementChecked,showDisplacement]= useState<boolean>(false)
  const [isEquilibriumChecked,showEquilibrium]= useState<boolean>(false)

  useEffect(() => {
    const distance1 = forceConstant / springConstant1;
    const distance2 = forceConstant / springConstant2
    setDistance(distance1+distance2);
  }, [forceConstant, springConstant1, springConstant2]);

  return <div className="w-full relative p-5">
  <VisualBoard 
    showSpringForce={showSpringForce}
    isSpringForceChecked={isSpringForceChecked}
    showAppliedForce={showAppliedForce}
    isAppliedForceChecked={isAppliedForceChecked}
    showDisplacement={showDisplacement}
    isDisplacementChecked={isDisplacementChecked}
    showEquilibrium={showEquilibrium}
    isEquilibriumChecked={isEquilibriumChecked}
  ></VisualBoard>
  <div className={`flex flex-row items-center relative`} style={{ height: `${2.5*height}px` }}> 
    <div className="relative left-0 z-[1]">
      <Wall height={height*2}></Wall>
    </div>
    <div className="flex flex-col h-full justify-center relative">
      <div className="absolute top-0 right-0 flex flex-col">
        {isSpringForceChecked && (
          <div>
            {(forceConstant != 0) ? (
              <div className="flex flex-col">
                <p className="text-center text-sm">F2 = {forceConstant} N</p>
                <div className="self-end">
                  <BulkyArrow direction="left" color="#007F00" height={25} headWidth={20} shaftWidth={10} shaftLength={15+forceConstant}/>
                </div>
              </div>
            ) : (
              <p className="text-center text-sm">F2 = 0 N</p>
            )}
          </div>
        )}
      </div>
      <div className="flex flex-row h-full items-center">
        {isSpringForceChecked && (
          <div className="flex flex-row w-full absolute top-0 justify-center">
            <div className="">
              <p className="text-center text-sm">F1 = {forceConstant} N</p>
              {(forceConstant != 0) && (
                <div className="flex justify-end">
                  <BulkyArrow direction="left" color="#F070f3" height={25} headWidth={20} shaftWidth={10} shaftLength={15+forceConstant}/>
                </div>
              )}
            </div>
            <div className="">
              <p className="text-center text-sm">F2 = {forceConstant} N</p>
              {(forceConstant != 0) && (
                <BulkyArrow direction="right" color="#007F00" height={25} headWidth={20} shaftWidth={10} shaftLength={15+forceConstant}/>
              )}
            </div>
          </div>
        )}
        <SpringSVG width={width+(distance*200)} height={height} coils={coils} strokeColor="#0070f3" strokeWidth={springConstant1 / 100} />
        <SpringSVG width={width+(distance*200)} height={height} coils={coils} strokeColor="#0070f3" strokeWidth={springConstant2 / 100} />
      </div>
      <div className="absolute h-full"  style={{ width: `${2*(width+40)}px` }}>
        <div className="flex flex-row items-center justify-end h-full w-full">
          {isEquilibriumChecked && (
            <div className="right-0 border-l-2 border-dashed h-3/5 border-green-500"></div>
          )}
          {isDisplacementChecked && (
            <div className="absolute flex flex-col right-0 bottom-0" 
              style={{ transform: `translateX(${width+40}px)`, width: `${width+40}px` }}>
              {(forceConstant != 0) ? (
                <div className="" >
                  <BulkyArrow direction="right" color="#0070f3" height={25} headWidth={20} shaftWidth={10} shaftLength={distance*200+distance*200}/>
                  <p className="text-sm">D = {distance.toFixed(3)} m</p>
                </div>
              ):(
                <p className="text text-sm">D = 0 m</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
    <div className="flex flex-col h-full w-full justify-center relative">
      {isAppliedForceChecked && (
        <div className="absolute top-0">
          <p className="text-center text-sm">F = {forceConstant} N</p>
          {(forceConstant != 0) && (
            <BulkyArrow direction="right" color="#0070f3" height={25} headWidth={20} shaftWidth={10} shaftLength={15+forceConstant}/>
          )}
        </div>
      )}
      <PullArrowSVG height={height} translateX={forceConstant}></PullArrowSVG>
    </div>
  </div>
  
  <div className="flex flex-row gap-4 p-4 items-center">
    <div className="flex flex-col gap-4">
      <Slider 
        value={springConstant1} 
        setValue={setSpringConstant1} 
        min={200}
        max={600} 
        step={10} 
        text="Spring Constant"
        unit="N/m"/>
      <Slider 
        value={springConstant2} 
        setValue={setSpringConstant2} 
        min={200}
        max={600} 
        step={10} 
        text="Spring Constant"
        unit="N/m"/>
    </div>
    <Slider 
        value={forceConstant} 
        setValue={setForceConstant} 
        min={0}
        max={100} 
        step={5} 
        text="Applied Force"
        unit="N"/>
  </div>
</div>
}

export function HookesLawEnergy({width,height,coils}:HookesLawProps){
  const [springConstant,setSpringConstant] = useState<number>(200)
  const [forceConstant,setForceConstant] = useState<number>(0)
  const [distance,setDistance] = useState<number>(0)
  const [energyPotential,setEnergyPotential] = useState<number>(0)

  const [isSpringForceChecked,showSpringForce]= useState<boolean>(false)
  const [isAppliedForceChecked,showAppliedForce]= useState<boolean>(false)
  const [isDisplacementChecked,showDisplacement]= useState<boolean>(false)
  const [isEquilibriumChecked,showEquilibrium]= useState<boolean>(false)

  useEffect(() => {
    setForceConstant(springConstant * distance)
    setEnergyPotential(1/2 * springConstant * distance * distance)
  }, [distance, springConstant]);

  return <div className="w-full h-full flex flex-col relative gap-4 p-5">
    <VisualBoard 
      showSpringForce={showSpringForce}
      isSpringForceChecked={isSpringForceChecked}
      showAppliedForce={showAppliedForce}
      isAppliedForceChecked={isAppliedForceChecked}
      showDisplacement={showDisplacement}
      isDisplacementChecked={isDisplacementChecked}
      showEquilibrium={showEquilibrium}
      isEquilibriumChecked={isEquilibriumChecked}
    ></VisualBoard>
  <div className="flex flex-row">
    <div className="absolute" style={{ height: `${width/2}px`, width: `${width/2}px`}}>
      <EnergyBar barValue={energyPotential}></EnergyBar>
    </div>
    <div className="w-full">
      <ParabolaGraph 
      width={width} 
      height={width} 
      scale={10} 
      a={springConstant/2000}
      xBall={distance*10}
      xBallValue={distance}
      yBallValue={energyPotential}
      />
    </div>
  </div>
  <div className="flex flex-col">
    <div className={`flex flex-row items-center relative`} style={{ height: `${2.5*height}px` }}> 
      <div className="relative left-0 z-[1]">
        <Wall height={height*2}></Wall>
      </div>
      <div className="flex flex-col h-full justify-center relative">
        <div className="absolute top-0 right-0">
          {isSpringForceChecked && (
            <div className="flex flex-col">
              <p className="text-center text-sm">F = {forceConstant.toFixed(1)} N</p>
              {(forceConstant != 0) && (
                <div className="self-end">
                  <BulkyArrow direction="left" color="#007F00" height={25} headWidth={20} shaftWidth={10} shaftLength={Math.abs(forceConstant)/2}/>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex flex-row w-full h-full items-center">
          <SpringSVG width={width+(distance*200)} height={height} coils={coils} strokeColor="#0070f3" strokeWidth={springConstant / 100} />
        </div>
        <div className="absolute h-full"  style={{ width: `${width+40}px` }}>
          <div className="flex flex-row items-center justify-end h-full w-full">
            {isEquilibriumChecked && (
              <div className="right-0 border-l-2 border-dashed h-3/5 border-green-500"></div>
            )}
            {isDisplacementChecked && (
              <div className="absolute flex flex-col right-0 bottom-0" 
                style={{ transform: `translateX(${width+40}px)`, width: `${width+40}px` }}>
                {(forceConstant != 0) ? (
                  <div className="" >
                    <BulkyArrow direction="right" color="#0070f3" height={25} headWidth={20} shaftWidth={10} shaftLength={distance*200}/>
                    <p className="text-sm">D = {distance.toFixed(3)} m</p>
                  </div>
                ):(
                  <p className="text text-sm">D = 0 m</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="flex flex-col h-full w-full justify-center relative">
        {isAppliedForceChecked && (
          <div className="absolute top-0">
            <p className="text-center text-sm">F = {forceConstant.toFixed(1)} N</p>
            {(forceConstant != 0) && (
              <BulkyArrow direction="right" color="#0070f3" height={25} headWidth={20} shaftWidth={10} shaftLength={Math.abs(forceConstant)/2}/>
            )}
          </div>
        )}
        <PullArrowSVG height={height} translateX={forceConstant}></PullArrowSVG>
      </div>
    </div>
    
    <div className="flex flex-row gap-4 p-4">
    <Slider 
          value={springConstant} 
          setValue={setSpringConstant} 
          min={100}
          max={400} 
          step={10} 
          text="Spring Constant"
          unit="N/m"/>
      <Slider 
          value={distance} 
          setValue={setDistance} 
          min={0}
          max={1} 
          step={0.05} 
          text="Displacement"
          unit="m"
          toFixed={3}/>
    </div>
  </div>
</div>
}