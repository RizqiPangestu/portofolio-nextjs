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

  for (let x = 0; x <= width; x += 2) {
    const y = height / 2 + Math.sin(x * frequency) * amplitude;
    points.push(`${x},${y}`);
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

  // Parse start point
  const [startXStr, startYStr] = points[0].split(',');
  const startX = Number(startXStr);
  const startY = Number(startYStr);

  // Parse end point
  const [endXStr, endYStr] = points[points.length - 1].split(',');
  const endX = Number(endXStr);
  const endY = Number(endYStr);

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
      <polyline
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        points={points.join(' ')}
        style={{ filter: 'drop-shadow(0 1px 1px #333)' }}
      />

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