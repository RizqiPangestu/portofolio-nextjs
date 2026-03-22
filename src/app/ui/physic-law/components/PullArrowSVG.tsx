"use client"

import BulkyArrow from "./Arrow";
import SvgCircle from "./Circle";


interface PullArrowSVGProps {
    height: number;
    translateX: number;
}

const PullArrowSVG: React.FC<PullArrowSVGProps> = ({
    height = 80,
}) => {
    const radius = 30
    return <div className={`flex flex-row relative h-full items-center`}  style={{ filter: 'drop-shadow(0 1px 1px #333)' }}>
        <SvgCircle r={radius/2} fill="#0070f3" stroke="green"/>
        <div className="absolute" style={{ transform: `translateX(${radius-3}px)`}}>
            <BulkyArrow direction="right" color="#0070f3" height={height}/>
        </div>
    </div>
}

export default PullArrowSVG;