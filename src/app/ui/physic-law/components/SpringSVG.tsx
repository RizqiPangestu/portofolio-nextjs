"use client"

import React from 'react';

interface SpringSVGProps {
  width?: number;
  height?: number;
  coils?: number;
  strokeColor?: string;
  strokeWidth?: number;
}

const SpringSVG: React.FC<SpringSVGProps> = ({
  width = 400,
  height = 80,
  coils = 4,
  strokeColor = '#555',
  strokeWidth = 3,
}) => {
  let points: string[] = [];
  const amplitude = height / 2.5;
  const frequency = (2 * Math.PI * coils) / width;

  const startX = 0;
  const startY = height / 2 + Math.sin(startX * frequency) * amplitude;
  const endX = width;
  const endY = height / 2 + Math.sin(endX * frequency) * amplitude;

  const springElement: React.ReactElement[] = [];
  let color: string = "#007F00"
  let isFront: boolean = false;
  let previousY: number = 0
  let previousX: number = 0

  const frontSpringElements: React.ReactElement[] = [];
  const backSpringElements: React.ReactElement[] = [];
  for (let x = 0; x <= width; x += 2) {
    const y = height / 2 + Math.sin(x * frequency) * amplitude;
    if (isFront){
      color = "#04FF04" // terang
    }else{
      color = "#007F00"
    }
    
    if (isFront && y>previousY){
      points.push(`${x},${y}`);
      frontSpringElements.push(<polyline
        key={x}
        fill="none"
        // stroke={strokeColor}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        points={points.join(' ')}
        className='drop-shadow-[0px_0px_4px_#DDDDDD]'
      />)
      points = [`${previousX},${previousY}`]
      isFront = !isFront
    }else if (!isFront && y<=previousY){
      points.push(`${x},${y}`);
      backSpringElements.push(<polyline
        key={x}
        fill="none"
        // stroke={strokeColor}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        points={points.join(' ')}
        className='drop-shadow-[0px_1px_2px_#666666]'
      />)
      points = [`${previousX},${previousY}`]
      isFront = !isFront
    }

    points.push(`${x},${y}`);
    previousY = y
    previousX = x
  }

  
  const fixedEndY = height / 2; // fixed Y for the end point
  
  // Adjust last point's Y coordinate
  points = points.map((point, index) => {
    if (index === points.length - 1) {
      const [xStr] = point.split(',');
      return `${xStr},${fixedEndY}`;
    }
    return point;
  });

  springElement.push(<polyline
    key={-1}
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinejoin="round"
    points={points.join(' ')}
    style={{ filter: 'drop-shadow(0 1px 1px #333)' }}
  />,...backSpringElements, ...frontSpringElements);

  const lineLength = 20; // adjust as needed
  return (
    <svg width={width+(lineLength*2)} height={height} role="img" aria-label="Spring coil" overflow="visible"  style={{ transform:`translateX(${lineLength}px)`}}>
      {/* Straight line at the start */}
      <line
        x1={startX - lineLength}
        y1={startY}
        x2={startX}
        y2={startY}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        style={{ filter: 'drop-shadow(0 0px 1px #333)' }}
      />

      {/* The sine wave polyline */}
      {springElement}

      {/* Straight line at the end */}
      <line
        x1={endX}
        y1={endY} 
        x2={endX + lineLength}
        y2={endY}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        style={{ filter: 'drop-shadow(0 0px 1px #333)' }}
      />
    </svg>
  );
};

export default SpringSVG;