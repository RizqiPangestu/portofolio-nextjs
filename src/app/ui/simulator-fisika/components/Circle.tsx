import React from 'react';

interface SvgCircleProps {
  r: number;                // radius of the circle
  cx?: number;
  cy?: number;
  width?:number;
  height?:number;
  fill?: string;            // fill color (default: 'none')
  stroke?: string;          // stroke color (default: 'black')
  strokeWidth?: number;     // stroke width (default: 1)
  opacity?: number;         // opacity (default: 1)
}

const SvgCircle: React.FC<SvgCircleProps> = ({
  r,
  cx=0,
  cy=0,
  width=0,
  height=0,
  fill = 'none',
  stroke = 'black',
  strokeWidth = 0,
  opacity = 1,
}) => {
  return (
    <svg width={width==0?r*2:width} height={height==0?r*2:height} xmlns="http://www.w3.org/2000/svg" role="img" aria-label="SVG Circle">
      <circle
        cx={cx==0?r:cx}
        cy={cy==0?r:cy}
        r={r}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        opacity={opacity}
      />
    </svg>
  );
};

export default SvgCircle;