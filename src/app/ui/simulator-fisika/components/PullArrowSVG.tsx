import BulkyArrow from "./Arrow";
import SvgCircle from "./Circle";


interface PullArrowSVGProps {
    height: number;
    width: number;
    translateX: number;
}

const PullArrowSVG: React.FC<PullArrowSVGProps> = ({
    height = 80,
    width = 150,
}) => {
    const radius = 30
    return <div className={`flex flex-row h-${height} w-${width}`} style={{ transform: `translateX(${0}px)`}}>
        <SvgCircle height={height} r={radius/2} fill="#0070f3" stroke="green"/>
        <div className="absolute" style={{ transform: `translateX(${radius-3}px)`}}>
            <BulkyArrow direction="right" color="#0070f3" height={height}/>
        </div>
    </div>
}

export default PullArrowSVG;