import SvgCircle from "./Circle"

type PlotProps = {
    width: number
    height: number
    xValue: number
    yValue: number
    gradien:number
    maxXValue:number
    minXValue:number
}


export default function Plot({width,height,xValue, yValue,gradien,maxXValue,minXValue}:PlotProps){
    const midX = width/2
    const midY = height/2

    const yArrow = `${midX - 5} ${45}, ${midX} ${30}, ${midX + 5} ${45}`
    const xArrow = `${width-15} ${midY-5}, ${width} ${midY}, ${width-15} ${midY + 5}`

    const ballCx = midX + xValue*midX
    const ballCy = midY - xValue*gradien*midX

    const forceY2 = midY * (1-gradien)

    return (
        <div>
          <svg width={width+200} height={height+20} className="">
            {/* X axis */}
            <polygon points={xArrow} fill="#d1d5db"/>
            <line x1={0} y1={midY} x2={width} y2={midY} stroke="#d1d5db" />
            <text x={width+5} y={midY + 5} className="text-sm fill-gray-700">Perpindahan {xValue.toFixed(3)} (m)</text>
            {/* Y axis */}
            <polygon points={yArrow} fill="#d1d5db"/>
            <line x1={midX} y1={30} x2={midX} y2={height} stroke="#d1d5db" />
            <text x={midX - 60} y={20} className="text-sm fill-gray-700">Gaya Tarik {yValue.toFixed(2)} (J)</text>
            <line x1={0} y1={midY} x2={width} y2={midY} stroke="#d1d5db" />
            
            {/* Force axis */}
            <line x1={midX} y1={midY} x2={width} y2={forceY2} stroke="#3b82f6" strokeWidth={2}/>
            <line x1={midX} y1={midY} x2={0} y2={height- forceY2} stroke="#3b82f6" strokeWidth={2}/>

            {/* Ball axis */}
            <line x1={midX} y1={(ballCy)} x2={ballCx} y2={(ballCy)} stroke="#000000" strokeDasharray={5} />
            <text x={width / 2 - 70} y={(ballCy)} className="text-sm fill-gray-700">{yValue.toFixed(2)} (J)</text>
            <line x1={ballCx} y1={(midY)} x2={ballCx} y2={(ballCy)} stroke="#000000" strokeDasharray={5} />
            <text x={ballCx} y={(midY + 20)} className="text-sm fill-gray-700">{xValue.toFixed(3)} (m)</text>
            <SvgCircle r={10} cx={ballCx} cy={(ballCy)} width={width*2} height={height} fill="#0070f3" stroke="green"></SvgCircle>
          </svg> 
        </div>
    )
}