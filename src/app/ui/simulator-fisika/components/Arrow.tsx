"use client"

import React from 'react';

interface BulkyArrowProps {
  height?: number;         // total SVG height
  color?: string;          // fill color of the arrow
  direction?: 'right' | 'left' | 'up' | 'down'; // arrow direction
  shaftWidth?: number;     // thickness of the shaft
  shaftLength?: number;    // length of the shaft (excluding head)
  headWidth?: number;      // width of the arrowhead base
  headLength?: number;     // length of the arrowhead
}

const BulkyArrow: React.FC<BulkyArrowProps> = ({
  height = 80,
  color = '#0070f3',
  direction = 'right',
  shaftWidth = 12,
  shaftLength = 25,
  headWidth = 30,
  headLength = 30,
}) => {
  // Rotation degrees based on direction
  const rotationDegrees = {
    right: 0,
    down: 90,
    left: 180,
    up: 270,
  };

  // SVG total width and height depend on direction
  const svgWidth = direction === 'left' || direction === 'right' ? shaftLength + headLength : height;
  const svgHeight = direction === 'left' || direction === 'right' ? height : shaftLength + headLength;

  // Coordinates for shaft rectangle and arrowhead polygon (pointing right by default)
  // Shaft rectangle: starts at (0, centerY - shaftWidth/2)
  // Arrowhead polygon: points forming a triangle at the end of shaft

  const centerY = svgHeight / 2;

  // Shaft rectangle coords
  const shaftX = 0;
  const shaftY = centerY - shaftWidth / 2;

  // Arrowhead points (right-pointing)
  const arrowPoints = [
    [shaftLength, centerY - headWidth / 2], // top base
    [shaftLength + headLength, centerY],    // tip
    [shaftLength, centerY + headWidth / 2], // bottom base
  ]
    .map(point => point.join(','))
    .join(' ');

  return (
    <svg
      width={svgWidth}
      height={svgHeight}
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      fill={color}
      xmlns="http://www.w3.org/2000/svg"
      aria-label={`${direction} bulky arrow with shaft`}
      role="img"
      style={{ transform: `rotate(${rotationDegrees[direction]}deg)` }}
    >
      {/* Shaft rectangle */}
      <rect
        x={shaftX}
        y={shaftY}
        width={shaftLength}
        height={shaftWidth}
        fill={color}
        // rx={shaftWidth / 10} // rounded corners for bulkiness
        // ry={shaftWidth / 10}
      />
      {/* Arrowhead polygon */}
      <polygon points={arrowPoints} fill={color} />
    </svg>
  );
};

export default BulkyArrow;
