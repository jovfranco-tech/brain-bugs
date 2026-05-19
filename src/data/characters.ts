import type { PuzzlePiece, BugKind } from '../types';

// ─── Bug color palette ────────────────────────────────────────
export const BUG_COLORS: Record<BugKind, { color: string; dark: string; light: string }> = {
  pip:   { color: '#3FD09E', dark: '#1F9A6E', light: '#A4ECD0' },
  bobo:  { color: '#8E6BFF', dark: '#5A3BD1', light: '#CDB9FF' },
  zig:   { color: '#FFC83D', dark: '#D9A015', light: '#FFE39E' },
  mo:    { color: '#5BC5FF', dark: '#2890D0', light: '#C0E6FB' },
  coach: { color: '#FF8A4C', dark: '#D45F22', light: '#FFBE99' },
  rose:  { color: '#FF6FA8', dark: '#C73C77', light: '#FFB6D2' },
};

// ─── Piece definitions ────────────────────────────────────────
// Shapes: [col, row] offsets from top-left of bounding box
export const PIECE_DEFS: Record<BugKind, { name: string; baseShape: [number, number][] }> = {
  pip:   { name: 'Pip',   baseShape: [[0,0],[1,0],[2,0]] },           // straight 3
  bobo:  { name: 'Bobo',  baseShape: [[0,0],[0,1],[1,1]] },           // J-shape 3
  zig:   { name: 'Zig',   baseShape: [[0,0],[1,0],[1,1],[2,1]] },     // S-shape 4
  mo:    { name: 'Mo',    baseShape: [[0,0],[1,0],[0,1],[1,1]] },     // 2×2 square 4
  rose:  { name: 'Rose',  baseShape: [[0,0],[1,0]] },                 // domino 2
  coach: { name: 'Coach', baseShape: [[0,0],[0,1],[0,2]] },           // vertical 3
};

// Build a PuzzlePiece from a kind + unique id suffix
export function makePiece(kind: BugKind, suffix: string = ''): PuzzlePiece {
  const def = PIECE_DEFS[kind];
  const col = BUG_COLORS[kind];
  return {
    id: `${kind}${suffix}`,
    kind,
    name: def.name,
    color: col.color,
    darkColor: col.dark,
    lightColor: col.light,
    shape: def.baseShape,
  };
}

// ─── Rotation helpers ─────────────────────────────────────────
export function rotateCW(shape: [number, number][]): [number, number][] {
  // 90° clockwise: [c,r] → [maxR-r, c]  (after normalization)
  const rotated = shape.map(([c, r]) => [-r, c] as [number, number]);
  const minC = Math.min(...rotated.map(([c]) => c));
  const minR = Math.min(...rotated.map(([, r]) => r));
  return rotated.map(([c, r]) => [c - minC, r - minR]);
}

export function applyRotation(shape: [number, number][], rotation: 0|1|2|3): [number, number][] {
  let s = shape;
  for (let i = 0; i < rotation; i++) s = rotateCW(s);
  return s;
}

export function shapeSize(shape: [number, number][]): { cols: number; rows: number } {
  const maxC = Math.max(...shape.map(([c]) => c));
  const maxR = Math.max(...shape.map(([, r]) => r));
  return { cols: maxC + 1, rows: maxR + 1 };
}
