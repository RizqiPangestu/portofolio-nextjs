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
    let points = ""
    for (let x = -scale; x <= scale; x += 0.1) {
      points += `${width / 2 + x * scale},${height / 2 - a * x * x * scale} `
    }

    const yArrow = `${width/2 - 5} ${45}, ${width/2} ${30}, ${width/2 + 5} ${45}`
    const xArrow = `${width-15} ${height/2-5}, ${width} ${height/2}, ${width-15} ${height/2 + 5}`

    return (
        <div>
          <svg width={width*2} height={height/2+20} className="">
            {/* X axis */}
            <polygon points={xArrow} fill="#d1d5db"/>
            <line x1={0} y1={height / 2} x2={width} y2={height / 2} stroke="#d1d5db" />
            <text x={width+5} y={height / 2 + 5} className="text-sm fill-gray-700">Displacement {xBallValue.toFixed(3)} (m)</text>
            {/* Y axis */}
            <polygon points={yArrow} fill="#d1d5db"/>
            <line x1={width / 2} y1={30} x2={width / 2} y2={height/2} stroke="#d1d5db" />
            <text x={width / 2 - 60} y={20} className="text-sm fill-gray-700">Potential Energy {yBallValue.toFixed(2)} (J)</text>

            {/* Ball axis */}
            <SvgCircle r={10} cx={(width/2) + xBall*scale} cy={(height/2) - a*xBall*xBall*scale} width={width} height={height} fill="#0070f3" stroke="green"></SvgCircle>
            <line x1={0} y1={height / 2} x2={width} y2={height / 2} stroke="#d1d5db" />

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