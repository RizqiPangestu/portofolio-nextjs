import BulkyArrow from "./Arrow"

type EnergyBarProps = {
    barValue:number
}

export default function EnergyBar({barValue}:EnergyBarProps){
    return <div className="translate-y-9 w-full h-1/2">
        <div className="flex flex-row w-full">
            <div className="flex flex-col h-max w-full" 
                style={{ 
                    transform: `rotate(-90deg) translateX(${-200}px)`,
                    transformOrigin: 'left top'
                }}>
                <div className="text-center">
                    Energi Potensial
                </div>
                <BulkyArrow height={10} color="#000000" shaftWidth={1} shaftLength={185} headWidth={10} headLength={15}></BulkyArrow>
                <div className="flex flex-row h-10  bg-cyan-300 rounded-lg"
                    style={{ width: `${barValue}px` }}>
                </div>
                <div className="text-right text-sm"
                    style={{ 
                        width: `${barValue+50}px` ,
                        transform: `rotate(90deg) translateY(${ 70}px) translateX(${35}px)`,
                        transformOrigin: 'right bottom'
                    }}>
                    {barValue.toFixed(2)} J
                </div>
            </div>
        </div>
    </div>
}