import React from 'react';

interface SvgCircleProps {
  r: number;                // radius of the circle
  fill?: string;            // fill color (default: 'none')
  stroke?: string;          // stroke color (default: 'black')
  strokeWidth?: number;     // stroke width (default: 1)
  opacity?: number;         // opacity (default: 1)
}

const SvgCircle: React.FC<SvgCircleProps> = ({
  r,
  fill = 'none',
  stroke = 'black',
  strokeWidth = 0,
  opacity = 1,
}) => {
  return (
    <svg width={r*2} height={r*2} xmlns="http://www.w3.org/2000/svg" role="img" aria-label="SVG Circle">
      <circle
        cx={r}
        cy={r}
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