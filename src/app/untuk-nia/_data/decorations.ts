/**
 * Animated background decorations.
 *
 * Each layer spawns one decoration `every intervalMs` while the page is
 * visible. The decoration fades in, performs its movement, then fades out.
 *
 * Layer fields:
 *  - effect    : visual type
 *  - intervalMs: milliseconds between spawns
 *  - durationMs: total lifetime of a single decoration (fade in + visible + fade out)
 *  - position  : where to spawn (`random`, `center`, `top`, `bottom`, or fixed { x, y } in %)
 *  - size      : decoration size in px (number) OR a range tuple [min, max]
 *  - movement  : 'static' | 'float' | 'drift' | 'spin' | 'rise' | 'twinkle' | 'burst'
 *  - content   : (only for 'emoji') array of emojis to pick randomly
 *  - color     : (only for 'firework'|'sparkle'|'spiral') CSS color or array
 *
 * Every layer in this list runs automatically — just remove a layer to turn
 * it off.
 */

export type DecorationEffect = "firework" | "emoji" | "sparkle" | "spiral";

export type DecorationMovement =
  | "static"
  | "float"
  | "drift"
  | "spin"
  | "rise"
  | "twinkle"
  | "burst";

export type DecorationPosition =
  | "random"
  | "center"
  | "top"
  | "bottom"
  | { x: number; y: number };

export type DecorationLayer = {
  id: string;
  effect: DecorationEffect;
  intervalMs: number;
  durationMs: number;
  position: DecorationPosition;
  size: number | [number, number];
  movement: DecorationMovement;
  content?: string[];
  color?: string | string[];
};

export const decorationLayers: DecorationLayer[] = [
  {
    id: "hearts",
    effect: "emoji",
    intervalMs: 1400,
    durationMs: 3800,
    position: "random",
    size: [22, 38],
    movement: "rise",
    content: ["💖", "💕", "💗", "💞", "🌸"],
  },
  {
    id: "sparkles",
    effect: "sparkle",
    intervalMs: 200,
    durationMs: 2000,
    position: "random",
    size: [3, 5],
    movement: "twinkle",
    color: ["#ffd1e8", "#ffeef6", "#fff3a8"],
  },
  {
    id: "fireworks",
    effect: "firework",
    intervalMs: 4200,
    durationMs: 1400,
    position: "random",
    size: 120,
    movement: "burst",
    color: ["#ff7eb6", "#ffd166", "#a0f0ff", "#c8b6ff"],
  },
  {
    id: "spiral",
    effect: "spiral",
    intervalMs: 5000,
    durationMs: 3000,
    position: "random",
    size: 100,
    movement: "spin",
    color: "#ffb3d1",
  },
];
