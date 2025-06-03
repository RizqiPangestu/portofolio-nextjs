import PullArrowSVG from "../ui/simulator-fisika/components/PullArrowSVG";
import SpringSVG from "../ui/simulator-fisika/components/SpringSVG";
import Wall from "../ui/simulator-fisika/components/wall";

type HookesLawProps = {
    width: number
    height: number
    coils: number
    springConstant: number
    force: number
}

export default function HookesLaw({width,height,coils,springConstant,force}:HookesLawProps){
    const translateX = force
    const strokes = springConstant / 100
    return <div>
    <div className='flex flex-row w-full h-full'> 
      <Wall></Wall>
      <SpringSVG width={width+translateX} height={height} coils={coils} strokeColor="#0070f3" strokeWidth={strokes} />
      <div className="" style={{ filter: 'drop-shadow(0 1px 1px #333)' }}>
        <PullArrowSVG width={width} height={height} translateX={translateX}></PullArrowSVG>
      </div>
    </div>
  </div>
}