"use client"

import SvgCircle from "./Circle";

type ParaboleGraphProps = {
    width: number
    height: number
    scale:number
    a:number
    xBall: number
    xBallValue:number
    yBallValue: number
}

export default function ParabolaGraph({width,height,scale,a,xBall,xBallValue,yBallValue}:ParaboleGraphProps){
    const midX = width/2
    const midY = height/2

    let points = ""
    for (let x = -scale; x <= scale; x += 0.1) {
      points += `${midX + x * scale},${midY - a * x * x * scale} `
    }

    const yArrow = `${midX - 5} ${45}, ${midX} ${30}, ${midX + 5} ${45}`
    const xArrow = `${width-15} ${midY-5}, ${width} ${midY}, ${width-15} ${midY + 5}`

    const ballCx = midX + xBall*scale
    const ballCy = midY - a*xBall*xBall*scale

    return (
        <div>
          <svg width={width+200} height={midY+20} className="">
            {/* X axis */}
            <polygon points={xArrow} fill="#d1d5db"/>
            <line x1={0} y1={midY} x2={width} y2={midY} stroke="#d1d5db" />
            <text x={width+5} y={midY + 5} className="text-sm fill-gray-700">Perpindahan {xBallValue.toFixed(3)} (m)</text>
            {/* Y axis */}
            <polygon points={yArrow} fill="#d1d5db"/>
            <line x1={midX} y1={30} x2={midX} y2={midY} stroke="#d1d5db" />
            <text x={midX - 60} y={20} className="text-sm fill-gray-700">Energi Potensial {yBallValue.toFixed(2)} (J)</text>

            {/* Ball axis */}
            <line x1={midX} y1={ballCy} x2={ballCx} y2={ballCy} stroke="#000000" strokeDasharray={5} />
            <text x={midX - 70} y={ballCy} className="text-sm fill-gray-700">{yBallValue.toFixed(2)} (J)</text>
            <line x1={ballCx} y1={midY} x2={ballCx} y2={ballCy} stroke="#000000" strokeDasharray={5} />
            <text x={ballCx} y={midY + 15} className="text-sm fill-gray-700">{xBallValue.toFixed(3)} (m)</text>
            <SvgCircle r={10} cx={ballCx} cy={ballCy} width={width} height={height} fill="#0070f3" stroke="green"></SvgCircle>

            {/* Parabola */}
            <polyline
              fill="none"
              stroke="#3b82f6"
              strokeWidth={2}
              points={points}
            />
          </svg> 
        </div>
      );
}