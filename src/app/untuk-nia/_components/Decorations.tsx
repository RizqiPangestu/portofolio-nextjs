"use client";

import { useEffect, useRef, useState } from "react";
import {
  type DecorationLayer,
  type DecorationPosition,
  decorationLayers,
} from "../_data/decorations";

type Spawn = {
  key: string;
  layer: DecorationLayer;
  x: number;
  y: number;
  size: number;
  color: string;
  emoji?: string;
};

function pickPosition(pos: DecorationPosition): { x: number; y: number } {
  if (pos === "random") {
    return { x: Math.random() * 90 + 5, y: Math.random() * 80 + 10 };
  }
  if (pos === "center") return { x: 50, y: 50 };
  if (pos === "top") return { x: Math.random() * 90 + 5, y: 10 };
  if (pos === "bottom") return { x: Math.random() * 90 + 5, y: 85 };
  return { x: pos.x, y: pos.y };
}

function pickSize(size: number | [number, number]): number {
  if (Array.isArray(size)) {
    const [a, b] = size;
    return a + Math.random() * (b - a);
  }
  return size;
}

function pickColor(color?: string | string[]): string {
  if (!color) return "#ffd1e8";
  if (Array.isArray(color)) {
    return color[Math.floor(Math.random() * color.length)];
  }
  return color;
}

function pickEmoji(content?: string[]): string {
  if (!content || content.length === 0) return "💖";
  return content[Math.floor(Math.random() * content.length)];
}

export default function Decorations({
  layers = decorationLayers,
  className = "z-0",
}: {
  layers?: DecorationLayer[];
  className?: string;
}) {
  const [spawns, setSpawns] = useState<Spawn[]>([]);
  const counterRef = useRef(0);

  useEffect(() => {
    const intervals: ReturnType<typeof setInterval>[] = [];
    for (const layer of layers) {
      const id = setInterval(() => {
        const { x, y } = pickPosition(layer.position);
        const spawn: Spawn = {
          key: `${layer.id}-${counterRef.current++}`,
          layer,
          x,
          y,
          size: pickSize(layer.size),
          color: pickColor(layer.color),
          emoji: layer.effect === "emoji" ? pickEmoji(layer.content) : undefined,
        };
        setSpawns((prev) => [...prev, spawn]);
        setTimeout(() => {
          setSpawns((prev) => prev.filter((s) => s.key !== spawn.key));
        }, layer.durationMs + 200);
      }, layer.intervalMs);
      intervals.push(id);
    }
    return () => intervals.forEach((i) => clearInterval(i));
  }, [layers]);

  return (
    <div
      className={`pointer-events-none fixed inset-0 overflow-hidden ${className}`}
      aria-hidden
    >
      {spawns.map((s) => (
        <DecorationItem key={s.key} spawn={s} />
      ))}
    </div>
  );
}

function DecorationItem({ spawn }: { spawn: Spawn }) {
  const { layer, x, y, size, color, emoji } = spawn;

  const movementAnim: Record<string, string> = {
    static: "nia-decor-static",
    float: "nia-decor-float",
    drift: "nia-decor-drift",
    spin: "nia-decor-spin",
    rise: "nia-decor-rise",
    twinkle: "nia-decor-twinkle",
    burst: "nia-decor-burst",
  };
  const animName = movementAnim[layer.movement] || "nia-decor-static";

  const baseStyle: React.CSSProperties = {
    position: "absolute",
    left: `${x}%`,
    top: `${y}%`,
    width: size,
    height: size,
    animation: `${animName} ${layer.durationMs}ms ease-out forwards`,
    willChange: "transform, opacity",
  };

  if (layer.effect === "emoji") {
    return (
      <div
        style={{ ...baseStyle, fontSize: size, lineHeight: 1 }}
        className="select-none"
      >
        {emoji}
      </div>
    );
  }

  if (layer.effect === "sparkle") {
    return (
      <div
        style={{
          ...baseStyle,
          background: color,
          borderRadius: "50%",
          boxShadow: `0 0 ${size * 2}px ${size / 2}px ${color}`,
        }}
      />
    );
  }

  if (layer.effect === "firework") {
    return (
      <div style={baseStyle}>
        <FireworkBurst color={color} size={size} />
      </div>
    );
  }

  if (layer.effect === "spiral") {
    return (
      <div style={baseStyle}>
        <SpiralSwirl color={color} size={size} />
      </div>
    );
  }

  return null;
}

function FireworkBurst({ color, size }: { color: string; size: number }) {
  const rays = 12;
  const items = Array.from({ length: rays }).map((_, i) => {
    const angle = (i / rays) * 360;
    return (
      <span
        key={i}
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: size * 0.6,
          height: 2,
          background: `linear-gradient(90deg, ${color}, transparent)`,
          transform: `translate(0, -1px) rotate(${angle}deg)`,
          transformOrigin: "0 50%",
          borderRadius: 2,
        }}
      />
    );
  });
  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <span
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: size * 0.18,
          height: size * 0.18,
          background: color,
          borderRadius: "50%",
          transform: "translate(-50%, -50%)",
          boxShadow: `0 0 ${size * 0.6}px ${size * 0.2}px ${color}`,
        }}
      />
      {items}
    </div>
  );
}

function SpiralSwirl({ color, size }: { color: string; size: number }) {
  const turns = 3.5;
  const segments = 220;
  const cx = 50;
  const cy = 50;
  const rMax = 44;
  let d = "";
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const angle = t * turns * 2 * Math.PI - Math.PI / 2;
    const r = t * rMax;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    d += `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)} `;
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      style={{ filter: `drop-shadow(0 0 6px ${color})` }}
    >
      <path
        d={d.trim()}
        fill="none"
        stroke={color}
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray="1 1"
        strokeDashoffset="1"
      >
        <animate
          attributeName="stroke-dashoffset"
          from="1"
          to="0"
          dur="1.6s"
          fill="freeze"
        />
      </path>
    </svg>
  );
}
