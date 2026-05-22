import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { WorldId, Puzzle, PuzzlePiece, Placement, BoardCell, BugKind } from '../types';
import { useApp, THEME_PALETTES } from '../contexts/AppContext';
import { PUZZLES } from '../data/puzzles';
import { applyRotation, shapeSize, makePiece } from '../data/characters';
import BugSvg from '../components/BugSvg';
import StarRating from '../components/StarRating';
import { sound } from '../lib/sound';
import confetti from 'canvas-confetti';

// ─── Board helpers ────────────────────────────────────────────
function buildEmptyBoard(puzzle: Puzzle): BoardCell[][] {
  return Array.from({ length: puzzle.rows }, (_, row) =>
    Array.from({ length: puzzle.cols }, (_, col) => {
      const lockEntry = puzzle.bugLocks?.find(([lc, lr]) => lc === col && lr === row);
      return {
        col, row,
        blocked: puzzle.blockedCells.some(([bc, br]) => bc === col && br === row),
        pieceId: null,
        bugLock: lockEntry ? lockEntry[2] : undefined,
      };
    })
  );
}

function isBoardSolved(board: BoardCell[][]): boolean {
  return board.flat().every(c => c.blocked || c.pieceId !== null);
}

function calcStars(moves: number, maxMoves: number): number {
  if (moves <= Math.ceil(maxMoves * 0.55)) return 3;
  if (moves <= maxMoves)                   return 2;
  return 1;
}

// ─── Piece tile SVG ───────────────────────────────────────────
function PieceTile({
  piece, rotation, cellSize, ghost = false,
}: {
  piece: PuzzlePiece; rotation: 0|1|2|3; cellSize: number; ghost?: boolean;
}) {
  const shape = applyRotation(piece.shape, rotation);
  const { cols: sc, rows: sr } = shapeSize(shape);
  const w = sc * cellSize;
  const h = sr * cellSize;
  const r = cellSize * 0.36;
  const pad = 2.5;
  const filterId = `sh-${piece.id}`;
  const gradId   = `g-${piece.id}`;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}
      style={{ display:'block', overflow:'visible', opacity: ghost ? 0.82 : 1 }}>
      <defs>
        <radialGradient id={gradId} cx="0.32" cy="0.28">
          <stop offset="0" stopColor={piece.lightColor}/>
          <stop offset="1" stopColor={piece.color}/>
        </radialGradient>
        <filter id={filterId} x="-25%" y="-25%" width="150%" height="150%">
          <feDropShadow dx="0" dy={ghost ? 4 : 2} stdDeviation={ghost ? 4 : 2.5}
            floodColor="rgba(0,0,0,0.32)" floodOpacity="1"/>
        </filter>
      </defs>
      <g filter={ghost ? undefined : `url(#${filterId})`}>
        {shape.map(([dc, dr], i) => (
          <rect key={i}
            x={dc*cellSize+pad} y={dr*cellSize+pad}
            width={cellSize-pad*2} height={cellSize-pad*2}
            rx={r} ry={r}
            fill={`url(#${gradId})`}
            stroke={piece.darkColor} strokeWidth="1.8" strokeOpacity="0.32"
          />
        ))}
        {/* Seamless connectors between adjacent cells */}
        {shape.map(([dc, dr], i) => {
          const right = shape.some(([c2,r2]) => c2===dc+1 && r2===dr);
          const down  = shape.some(([c2,r2]) => c2===dc   && r2===dr+1);
          return (
            <g key={`c${i}`}>
              {right && <rect x={dc*cellSize+cellSize-pad-2} y={dr*cellSize+pad+2}
                width={pad+4} height={cellSize-pad*2-4} fill={piece.color} rx={1}/>}
              {down  && <rect x={dc*cellSize+pad+2} y={dr*cellSize+cellSize-pad-2}
                width={cellSize-pad*2-4} height={pad+4} fill={piece.color} rx={1}/>}
            </g>
          );
        })}
      </g>
      {/* Bug face on first cell */}
      {(() => {
        const [fc, fr] = shape[0];
        const cx = fc*cellSize + cellSize/2;
        const cy = fr*cellSize + cellSize/2;
        const er = cellSize * 0.13;
        return (
          <g style={{ pointerEvents:'none' }}>
            <circle cx={cx-cellSize*0.17} cy={cy-cellSize*0.06} r={er} fill="#fff" opacity="0.92"/>
            <circle cx={cx+cellSize*0.17} cy={cy-cellSize*0.06} r={er} fill="#fff" opacity="0.92"/>
            <circle cx={cx-cellSize*0.13} cy={cy-cellSize*0.04} r={er*0.56} fill="#231347"/>
            <circle cx={cx+cellSize*0.21} cy={cy-cellSize*0.04} r={er*0.56} fill="#231347"/>
            <path d={`M ${cx-cellSize*0.14} ${cy+cellSize*0.14} Q ${cx} ${cy+cellSize*0.25} ${cx+cellSize*0.14} ${cy+cellSize*0.14}`}
              stroke="#231347" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
          </g>
        );
      })()}
    </svg>
  );
}

// ─── Bug Coach state machine ──────────────────────────────────
function coachHint(
  puzzle: Puzzle,
  available: string[],
  placements: Placement[],
  moves: number,
  hintsUsed: number,
  failCount: number,
): string {
  const total   = puzzle.pieces.length;
  const placed  = total - available.length;
  const frac    = placed / total;

  // Solved
  if (available.length === 0 && placements.length === total)
    return "¡Todos los bichos colocados! ¡Presiona Comprobar para terminar! 🎉";

  // Just started
  if (moves === 0 && placed === 0)
    return puzzle.hints[0] ?? "¡Agarra primero el bicho más grande, necesita más espacio!";

  // Repeated failures — be more specific
  if (failCount >= 3)
    return "Ese lugar parece atascado. ¡Intenta en un área diferente del tablero! 🔄";
  if (failCount === 2)
    return "¡Casi! Rota la pieza — a veces un giro de 90° hace toda la diferencia.";
  if (failCount === 1)
    return "¡Uy! Esa celda está bloqueada u ocupada. Intenta cerca o rota la pieza primero.";

  // Too many hints
  if (hintsUsed >= 3)
    return "Tómate tu tiempo. Mira el espacio vacío e imagina qué bicho cabe ahí.";

  // Near completion
  if (available.length === 1)
    return "¡Solo queda un bicho! ¡Busca el hueco exacto que llena! Ya casi lo tienes 💪";
  if (frac >= 0.7)
    return "¡Gran progreso! Observa el espacio que queda y busca el bicho adecuado.";

  // Mid-puzzle hints
  if (frac >= 0.4 && frac < 0.7)
    return puzzle.hints[Math.min(1, puzzle.hints.length-1)] ?? "¡Piensa en las esquinas, son las que más limitan las opciones!";

  // Early moves
  if (moves > 0 && moves < 4)
    return "¡Buen comienzo! Busca el siguiente bicho más grande para colocar.";

  // General hints from puzzle data
  const hintIdx = Math.min(Math.floor(hintsUsed), puzzle.hints.length - 1);
  return puzzle.hints[hintIdx] ?? "Una pieza a la vez — ¡lo estás haciendo genial!";
}

function decodeLevelCode(code: string): any {
  if (!code.startsWith('custom-')) return null;
  let base64 = code.substring(7).replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) base64 += '=';
  try {
    const jsonStr = decodeURIComponent(escape(atob(base64)));
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("Failed to decode level code", e);
    return null;
  }
}

// Particle interface
interface Particle {
  id: number;
  startX: number;
  startY: number;
  destX: number;
  destY: number;
  color: string;
  emoji: string;
  size: number;
}

interface AmbientParticle {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
}

// ─── Main Gameplay Screen ─────────────────────────────────────
export default function Gameplay() {
  const { navigate, screenParams, currentChild, completeLevel, setVictoryData } = useApp();
  const { levelId = '', worldId = '' } = screenParams;

  const theme = THEME_PALETTES[currentChild?.themeColor || 'purple'] || THEME_PALETTES.purple;

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(() => {
    return localStorage.getItem('brain_bugs_auto_speak') === 'true';
  });
  const [ambientParticles, setAmbientParticles] = useState<AmbientParticle[]>([]);
  const [nightMode, setNightMode] = useState(() => {
    return localStorage.getItem('brain_bugs_night_mode') === 'true';
  });

  const toggleNightMode = useCallback(() => {
    sound.playClick();
    setNightMode(prev => {
      const next = !prev;
      localStorage.setItem('brain_bugs_night_mode', String(next));
      return next;
    });
  }, []);

  const speakText = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      // Remove emojis or special symbols so speech sounds clean
      const cleanText = text.replace(/[🎉💡👣⭐🏆🧼🤖💎🌊🌋🚀✨🔴💥💨😴⚙️🔒⏱👥🔄]/g, '').trim();
      if (!cleanText) {
        setIsSpeaking(false);
        return;
      }
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'es-ES';
      
      const storedPitch = localStorage.getItem('brain_bugs_tts_pitch');
      const storedRate = localStorage.getItem('brain_bugs_tts_rate');
      utterance.pitch = storedPitch ? parseFloat(storedPitch) : 1.35;
      utterance.rate = storedRate ? parseFloat(storedRate) : 1.0;
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    }
  }, []);

  // Cancel speech on unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const toggleAutoSpeak = useCallback(() => {
    sound.playClick();
    setAutoSpeak(prev => {
      const next = !prev;
      localStorage.setItem('brain_bugs_auto_speak', String(next));
      if (!next && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      }
      return next;
    });
  }, []);

  const puzzle = useMemo(() => {
    if (!levelId) return null;

    if (levelId.startsWith('custom-')) {
      const data = decodeLevelCode(levelId);
      if (!data) return null;

      const customPieces = (data.p || []).map((kind: string, idx: number) =>
        makePiece(kind as BugKind, `-${idx}`)
      );

      return {
        id: levelId,
        name: 'Laboratorio de Bichos',
        description: '¡Nivel personalizado creado en el Bug Lab!',
        worldId: 'meadow' as WorldId,
        difficulty: 'medium' as const,
        cols: data.c || 5,
        rows: data.r || 5,
        blockedCells: data.b || [],
        bugLocks: data.l || [],
        pieces: customPieces,
        hints: ['¡Intenta resolver este nivel personalizado!', 'Coloca las piezas más grandes primero.'],
        maxMoves: Math.max(5, customPieces.length * 2 + 1),
      } as Puzzle;
    }

    if (levelId.startsWith('daily-')) {
      const seedStr = levelId.replace('daily-', '');
      const seed = parseInt(seedStr, 10) || 1;
      const keys = Object.keys(PUZZLES).filter(k => !k.startsWith('daily-'));
      const index = seed % keys.length;
      const baseId = keys[index];
      const base = PUZZLES[baseId];
      if (!base) return null;
      return {
        ...base,
        id: levelId,
        name: 'Desafío Diario',
        description: '¡Completa este rompecabezas especial de hoy para ganar +20 XP y una medalla especial!',
      };
    }

    const parts = levelId.split('-');
    if (parts.length < 2) return null;
    const baseId = `${parts[0]}-${parts[1].replace('l', '')}`;
    return PUZZLES[baseId] || null;
  }, [levelId]);

  // ── Game state ──────────────────────────────────────────────
  const [board,        setBoard]       = useState<BoardCell[][]>(() => puzzle ? buildEmptyBoard(puzzle) : []);
  const [placements,   setPlacements]  = useState<Placement[]>([]);
  const [available,    setAvailable]   = useState<string[]>(() => puzzle?.pieces.map(p => p.id) ?? []);
  const [selected,     setSelected]    = useState<string | null>(() => puzzle?.pieces[0]?.id ?? null);
  const [rotations,    setRotations]   = useState<Record<string, 0|1|2|3>>({});
  const [moves,        setMoves]       = useState(0);
  const [hintsUsed,    setHintsUsed]   = useState(0);
  const [coachMsg,     setCoachMsg]    = useState('');
  const [shakeId,      setShakeId]     = useState<string | null>(null);
  const [failCount,    setFailCount]   = useState(0); // consecutive failed placements
  const [solved,       setSolved]      = useState(false);
  const [solveGlow,    setSolveGlow]   = useState(false);

  // Particle bursts state
  const [particles, setParticles] = useState<Particle[]>([]);
  const [trailParticles, setTrailParticles] = useState<{
    id: number;
    x: number;
    y: number;
    size: number;
    color: string;
    angle: number;
    emoji: string;
  }[]>([]);

  // ── Drag state ──────────────────────────────────────────────
  const [dragPieceId, setDragPieceId] = useState<string | null>(null);
  const [ghostPos,    setGhostPos]    = useState({ x: 0, y: 0 });
  const [hoverCell,   setHoverCell]   = useState<{ col: number; row: number } | null>(null);
  const [boardRect,   setBoardRect]   = useState<DOMRect | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  // Generate ambient particles
  useEffect(() => {
    if (!puzzle) return;
    const initial: AmbientParticle[] = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 6 + (worldId === 'ocean' ? 6 : 4),
      speed: Math.random() * 0.12 + 0.04,
      opacity: Math.random() * 0.4 + 0.1,
    }));
    setAmbientParticles(initial);
  }, [levelId, worldId, puzzle]);

  // Animate ambient particles upward
  useEffect(() => {
    if (ambientParticles.length === 0) return;
    const interval = setInterval(() => {
      setAmbientParticles(prev => prev.map(p => {
        let newY = p.y - p.speed;
        if (newY < -5) {
          return {
            ...p,
            x: Math.random() * 100,
            y: 105,
            size: Math.random() * 6 + (worldId === 'ocean' ? 6 : 4),
            speed: Math.random() * 0.12 + 0.04,
            opacity: Math.random() * 0.4 + 0.1,
          };
        }
        return { ...p, y: newY };
      }));
    }, 45);
    return () => clearInterval(interval);
  }, [ambientParticles.length, worldId]);

  // Auto-read coach message when it changes
  useEffect(() => {
    if (autoSpeak && coachMsg) {
      speakText(coachMsg);
    }
  }, [coachMsg, autoSpeak, speakText]);

  const getRotation = (id: string): 0|1|2|3 => (rotations[id] ?? 0) as 0|1|2|3;

  const CELL_SIZE = puzzle
    ? Math.min(Math.floor((340 - 12) / puzzle.cols), Math.floor(248 / puzzle.rows), 56)
    : 44;

  // Initialize board rect when dragging
  useEffect(() => {
    if (boardRef.current && dragPieceId) {
      setBoardRect(boardRef.current.getBoundingClientRect());
    }
  }, [dragPieceId]);

  // Initial coach message
  useEffect(() => {
    if (puzzle) setCoachMsg(puzzle.hints[0] ?? "¡Empieza con el bicho más grande!");
  }, [puzzle]);

  // Update coach when state changes
  useEffect(() => {
    if (!puzzle || solved) return;
    setCoachMsg(coachHint(puzzle, available, placements, moves, hintsUsed, failCount));
  }, [moves, hintsUsed, failCount, available.length, solved]);

  // Particle spawner helper
  const spawnParticles = useCallback((startX: number, startY: number) => {
    const newParticles: Particle[] = [];
    const emojis = ['✨', '🔴', '⭐', '💥', '💨'];
    const colors = ['#FF5050', '#FF7B5C', '#FFD55E', '#8E6BFF'];
    for (let i = 0; i < 14; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * 80 + 40;
      newParticles.push({
        id: Date.now() + i + Math.random(),
        startX,
        startY,
        destX: Math.cos(angle) * distance,
        destY: Math.sin(angle) * distance + 30, // gravity curve effect
        color: colors[Math.floor(Math.random() * colors.length)],
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        size: Math.floor(Math.random() * 10) + 12,
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
  }, []);

  // ── Placement logic ──────────────────────────────────────────
  const tryPlace = useCallback((pieceId: string, col: number, row: number): boolean => {
    if (solved || !puzzle) return false;
    const piece = puzzle.pieces.find(p => p.id === pieceId);
    if (!piece) return false;
    const rot   = getRotation(pieceId);
    const shape = applyRotation(piece.shape, rot);

    // Validate every cell of the piece
    for (const [dc, dr] of shape) {
      const c = col + dc, r = row + dr;
      if (c < 0 || c >= puzzle.cols || r < 0 || r >= puzzle.rows) return false;
      if (board[r]?.[c]?.blocked)  return false;
      if (board[r]?.[c]?.pieceId)  return false;
      if (board[r]?.[c]?.bugLock && board[r]?.[c]?.bugLock !== piece.kind) return false;
    }

    // Apply placement
    const newBoard = board.map(row => row.map(cell => ({ ...cell })));
    for (const [dc, dr] of shape) newBoard[row+dr][col+dc].pieceId = pieceId;

    const newAvail = available.filter(id => id !== pieceId);
    setBoard(newBoard);
    setPlacements(p => [...p, { pieceId, col, row, rotation: rot, shape }]);
    setAvailable(newAvail);
    setMoves(m => m + 1);
    setFailCount(0);
    setSelected(newAvail[0] ?? null);

    // Play snap sound on successful placement
    sound.playSnap();

    // Auto-detect win
    if (isBoardSolved(newBoard)) {
      setSolved(true);
      setSolveGlow(true);
      sound.playVictory();
      
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });

      const stars = calcStars(moves + 1, puzzle.maxMoves);
      setCoachMsg("¡Rompecabezas resuelto! ¡Increíble trabajo! 🎉");
      setTimeout(() => {
        const badges = completeLevel(levelId, worldId as WorldId, stars, moves + 1, hintsUsed);
        setVictoryData({ levelId, worldId: worldId as WorldId, stars, moves: moves + 1, hintsUsed, newBadges: badges });
        navigate('victory');
      }, 900);
    }
    return true;
  }, [solved, puzzle, board, available, rotations, moves, hintsUsed, levelId, worldId]);

  // ── Drag handling ────────────────────────────────────────────
  const getCellFromPoint = useCallback((clientX: number, clientY: number) => {
    if (!boardRef.current || !puzzle) return null;
    const rect = boardRef.current.getBoundingClientRect();
    const col = Math.floor((clientX - rect.left) / CELL_SIZE);
    const row = Math.floor((clientY - rect.top)  / CELL_SIZE);
    if (col < 0 || col >= puzzle.cols || row < 0 || row >= puzzle.rows) return null;
    return { col, row };
  }, [puzzle, CELL_SIZE]);

  const onPiecePointerDown = useCallback((e: React.PointerEvent, pieceId: string) => {
    if (solved) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragPieceId(pieceId);
    setSelected(pieceId);
    setGhostPos({ x: e.clientX, y: e.clientY });
    sound.playDrag();
  }, [solved]);

  const onContainerPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragPieceId) return;
    setGhostPos({ x: e.clientX, y: e.clientY });
    setHoverCell(getCellFromPoint(e.clientX, e.clientY));

    if (Math.random() < 0.45) {
      const colors = ['#FFD55E', '#3FD09E', '#8E6BFF', '#5BC5FF', '#FF6FA8'];
      const emojis = ['✨', '⭐', '💫', '🌟'];
      const size = Math.floor(Math.random() * 8) + 8;
      const newParticle = {
        id: Date.now() + Math.random(),
        x: e.clientX,
        y: e.clientY,
        size,
        color: colors[Math.floor(Math.random() * colors.length)],
        angle: Math.random() * Math.PI * 2,
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
      };
      setTrailParticles(prev => [...prev, newParticle].slice(-40));
    }
  }, [dragPieceId, getCellFromPoint]);

  const triggerShake = useCallback((pieceId: string, clientX?: number, clientY?: number) => {
    sound.playError();
    setShakeId(pieceId);
    setFailCount(n => n + 1);
    if (clientX !== undefined && clientY !== undefined) {
      spawnParticles(clientX, clientY);
    }
    setTimeout(() => setShakeId(null), 420);
  }, [spawnParticles]);

  const endDrag = useCallback((e: React.PointerEvent) => {
    if (!dragPieceId) return;
    const cell = getCellFromPoint(e.clientX, e.clientY);
    if (cell) {
      const ok = tryPlace(dragPieceId, cell.col, cell.row);
      if (!ok) triggerShake(dragPieceId, e.clientX, e.clientY);
    } else {
      triggerShake(dragPieceId, e.clientX, e.clientY);
    }
    setDragPieceId(null);
    setHoverCell(null);
  }, [dragPieceId, getCellFromPoint, tryPlace, triggerShake]);

  const onBoardClick = useCallback((e: React.MouseEvent, col: number, row: number) => {
    if (!selected || dragPieceId || solved) return;
    const ok = tryPlace(selected, col, row);
    if (!ok) triggerShake(selected, e.clientX, e.clientY);
  }, [selected, dragPieceId, solved, tryPlace, triggerShake]);

  // ── Controls ──────────────────────────────────────────────────
  const rotatePiece = useCallback(() => {
    if (!selected) return;
    sound.playRotate();
    setRotations(r => ({ ...r, [selected]: (((r[selected] ?? 0) + 1) % 4) as 0|1|2|3 }));
    setFailCount(0);
    setCoachMsg("¡Rotado! Ahora intenta colocarlo en el tablero.");
  }, [selected]);

  const resetPuzzle = useCallback(() => {
    if (!puzzle) return;
    setBoard(buildEmptyBoard(puzzle));
    setPlacements([]);
    setAvailable(puzzle.pieces.map(p => p.id));
    setSelected(puzzle.pieces[0]?.id ?? null);
    setRotations({});
    setMoves(0);
    setFailCount(0);
    setSolved(false);
    setSolveGlow(false);
    setCoachMsg("¡Nuevo comienzo! " + (puzzle.hints[0] ?? "¡Tú puedes con esto!"));
  }, [puzzle]);

  const askHint = useCallback(() => {
    if (!puzzle) return;
    const newCount = hintsUsed + 1;
    setHintsUsed(newCount);
    const idx = Math.min(newCount - 1, puzzle.hints.length - 1);
    setCoachMsg("💡 " + (puzzle.hints[idx] ?? "¡Piensa en las esquinas, son las que más limitan las opciones!"));
  }, [hintsUsed, puzzle]);

  const checkSolution = useCallback(() => {
    if (!puzzle) return;
    if (isBoardSolved(board)) {
      setSolved(true);
      sound.playVictory();

      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });

      const stars = calcStars(moves, puzzle.maxMoves);
      setCoachMsg("¡Rompecabezas resuelto! ¡Lo lograste! 🎉");
      const badges = completeLevel(levelId, worldId as WorldId, stars, moves, hintsUsed);
      setVictoryData({ levelId, worldId: worldId as WorldId, stars, moves, hintsUsed, newBadges: badges });
      navigate('victory');
    } else if (available.length > 0) {
      setCoachMsg(`¡Aún faltan ${available.length} bicho${available.length !== 1 ? 's' : ''} por colocar!`);
    } else {
      setCoachMsg("Algunas celdas podrían estar superpuestas — intenta reiniciar y colocar con más cuidado.");
    }

  }, [puzzle, board, moves, hintsUsed, available.length, levelId, worldId]);

  // ── Preview validity ──────────────────────────────────────────
  const previewData = useMemo(() => {
    if (!hoverCell || !dragPieceId || !puzzle) return { cells: new Set<string>(), valid: false };
    const piece = puzzle.pieces.find(p => p.id === dragPieceId);
    if (!piece) return { cells: new Set<string>(), valid: false };
    const shape = applyRotation(piece.shape, getRotation(dragPieceId));
    let valid = true;
    const cells = new Set<string>();
    for (const [dc, dr] of shape) {
      const c = hoverCell.col + dc, r = hoverCell.row + dr;
      const key = `${c},${r}`;
      cells.add(key);
      if (c < 0 || c >= puzzle.cols || r < 0 || r >= puzzle.rows) valid = false;
      else if (board[r]?.[c]?.blocked || board[r]?.[c]?.pieceId)  valid = false;
      else if (board[r]?.[c]?.bugLock && board[r]?.[c]?.bugLock !== piece.kind) valid = false;
    }
    return { cells, valid };
  }, [hoverCell, dragPieceId, puzzle, rotations, board]);

  // ── Early exit if no puzzle ───────────────────────────────────
  if (!puzzle) {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-4" style={{ background:'#231347' }}>
        <p className="text-white text-lg font-bold" style={{ fontFamily:'"Fredoka",system-ui' }}>
          Rompecabezas no encontrado
        </p>
        <button onClick={() => navigate('world-map')}
          className="px-6 py-3 rounded-2xl bg-grape text-white font-bold"
          style={{ fontFamily:'"Fredoka",system-ui' }}>
          Volver al mapa
        </button>
      </div>
    );
  }

  // ── Ghost piece dimensions ────────────────────────────────────
  const dragPiece  = dragPieceId ? puzzle.pieces.find(p => p.id === dragPieceId) : null;
  const dragRot    = dragPieceId ? getRotation(dragPieceId) : 0;
  const dragShape  = dragPiece ? applyRotation(dragPiece.shape, dragRot) : [];
  const ghostW     = dragPiece ? (Math.max(...dragShape.map(([c]) => c)) + 1) * CELL_SIZE : 0;
  const ghostH     = dragPiece ? (Math.max(...dragShape.map(([,r]) => r)) + 1) * CELL_SIZE : 0;

  // Snapped coordinates math logic
  const ghostTargetPos = useMemo(() => {
    if (hoverCell && boardRect && dragPiece) {
      return {
        x: boardRect.left + hoverCell.col * CELL_SIZE,
        y: boardRect.top + hoverCell.row * CELL_SIZE,
        snapped: true
      };
    }
    return {
      x: ghostPos.x - ghostW / 2,
      y: ghostPos.y - ghostH / 2,
      snapped: false
    };
  }, [hoverCell, boardRect, ghostPos, ghostW, ghostH, CELL_SIZE, dragPiece]);

  const starPreview = moves > 0 ? calcStars(moves + 1, puzzle.maxMoves) : 3;
  const levelLabel = levelId.startsWith('daily-')
    ? 'Desafío Diario'
    : levelId
        .replace('meadow-l', 'Pradera ')
        .replace('crystal-l', 'Cueva ')
        .replace('robo-l',    'Arrecife ')
        .replace('ocean-l',   'Océano ')
        .replace('volcano-l', 'Volcán ')
        .replace('space-l',   'Espacio ');

  return (
    <div
      className="flex flex-col h-full overflow-hidden select-none transition-colors duration-500"
      style={{
        background: nightMode 
          ? 'linear-gradient(180deg,#0E0620 0%,#090414 60%,#040209 100%)' 
          : 'linear-gradient(180deg,#2B1A6A 0%,#1C1148 60%,#110A30 100%)',
        touchAction: dragPieceId ? 'none' : 'auto',
      }}
      onPointerMove={onContainerPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      {/* ── Ambient themed particles ─────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {ambientParticles.map(p => {
          let style: React.CSSProperties = {
            position: 'absolute',
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            opacity: nightMode ? p.opacity * 0.35 : p.opacity,
            transition: 'top 0.05s linear',
          };

          if (worldId === 'ocean') {
            return (
              <div
                key={p.id}
                style={{
                  ...style,
                  borderRadius: '50%',
                  border: '1px solid rgba(147, 197, 253, 0.45)',
                  background: 'rgba(191, 219, 254, 0.15)',
                }}
              />
            );
          } else if (worldId === 'volcano') {
            return (
              <div
                key={p.id}
                style={{
                  ...style,
                  borderRadius: '50%',
                  background: 'linear-gradient(to top, #EF4444, #F97316)',
                  boxShadow: '0 0 8px #F97316',
                  filter: 'blur(0.5px)',
                }}
              />
            );
          } else {
            // Space / standard stars
            return (
              <div
                key={p.id}
                className="animate-pulse"
                style={{
                  ...style,
                  borderRadius: '50%',
                  background: '#FFF',
                  boxShadow: '0 0 6px rgba(255, 255, 255, 0.8)',
                }}
              />
            );
          }
        })}
      </div>

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="relative z-20 flex items-center justify-between px-4 pt-14 pb-2 flex-shrink-0">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('world-map')}
            className="w-10 h-10 rounded-full flex items-center justify-center active:scale-90"
            style={{ background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.18)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M15 6l-6 6 6 6" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </button>
          
          <button onClick={toggleNightMode}
            className="w-10 h-10 rounded-full flex items-center justify-center active:scale-90 text-lg transition-all"
            style={{ 
              background: nightMode ? theme.glow : 'rgba(255,255,255,0.12)', 
              border: nightMode ? `1px solid ${theme.primary}` : '1px solid rgba(255,255,255,0.18)' 
            }}
            title={nightMode ? "Activar modo día" : "Activar modo noche"}
          >
            {nightMode ? '🌙' : '☀️'}
          </button>
        </div>

        <div className="flex flex-col items-center">
          <div className="px-5 py-1.5 rounded-full text-ink text-sm font-bold tracking-widest uppercase flex items-center gap-1.5"
            style={{ background:'linear-gradient(180deg,#FFD55E,#FFB23A)', fontFamily:'"Fredoka",system-ui', boxShadow:'0 3px 0 #B97808' }}>
            <span>{levelLabel}</span>
            <button
              onClick={() => speakText(`${levelLabel}. ${puzzle.name}`)}
              className="text-xs bg-white/20 hover:bg-white/35 active:scale-90 p-0.5 rounded-full"
              title="Escuchar título"
            >
              🔊
            </button>
          </div>
          <div className="text-white/45 text-xs mt-1 font-semibold" style={{ fontFamily:'"Nunito",system-ui' }}>
            {puzzle.name}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-white font-bold text-lg leading-none" style={{ fontFamily:'"Fredoka",system-ui' }}>{moves}</span>
            <span className="text-white/38 text-xs font-bold" style={{ fontFamily:'"Nunito",system-ui' }}>MOVIMIENTOS</span>
          </div>
          <StarRating stars={starPreview} size={13}/>
        </div>
      </div>

      {/* ── Board ──────────────────────────────────────────── */}
      <div className="flex justify-center mb-2 flex-shrink-0 relative z-10">
        <div className="relative rounded-3xl p-1.5"
          style={{
            background: 'linear-gradient(145deg,#1A0A3A,#0D0620)',
            boxShadow: 'inset 0 4px 16px rgba(0,0,0,0.6), 0 8px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)',
          }}>
          <div
            ref={boardRef}
            style={{
              display: 'grid',
              width: CELL_SIZE * puzzle.cols,
              height: CELL_SIZE * puzzle.rows,
              gridTemplateColumns: `repeat(${puzzle.cols}, ${CELL_SIZE}px)`,
              position: 'relative',
            }}>
            {/* Grid cells */}
            {board.flat().map(cell => {
              const key = `${cell.col},${cell.row}`;
              const inPreview = previewData.cells.has(key);
              return (
                <div key={key} style={{ width:CELL_SIZE, height:CELL_SIZE, padding:3 }}
                  onClick={(e) => !cell.blocked && !cell.pieceId && onBoardClick(e, cell.col, cell.row)}>
                  <div style={{
                    width:'100%', height:'100%',
                    borderRadius: CELL_SIZE * 0.28,
                    background: cell.blocked
                      ? 'rgba(0,0,0,0.55)'
                      : inPreview
                        ? previewData.valid ? 'rgba(63,208,158,0.38)' : 'rgba(255,80,80,0.32)'
                        : cell.pieceId ? 'transparent' : nightMode ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.055)',
                    boxShadow: cell.blocked ? 'none'
                      : inPreview ? `inset 0 0 0 2.5px ${previewData.valid ? '#3FD09E' : '#FF5050'}, 0 0 10px ${previewData.valid ? 'rgba(63,208,158,0.2)' : 'rgba(255,80,80,0.15)'}`
                      : 'inset 0 3px 6px rgba(0,0,0,0.48), 0 0 0 1px rgba(255,255,255,0.03)',
                    cursor: cell.blocked || cell.pieceId ? 'default' : 'pointer',
                    transition: 'background 0.07s, box-shadow 0.07s',
                    position: 'relative',
                  }}>
                    {cell.bugLock && !cell.pieceId && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                        <BugSvg kind={cell.bugLock} size={CELL_SIZE * 0.65} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Placed pieces */}
            {placements.map(pl => {
              const piece = puzzle.pieces.find(p => p.id === pl.pieceId)!;
              return (
                <motion.div
                  key={pl.pieceId}
                  initial={{ scale: 0.7, rotate: -6, opacity: 0 }}
                  animate={{ scale: 1, rotate: 0, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 15 }}
                  className="absolute pointer-events-none z-10"
                  style={{ left: pl.col * CELL_SIZE, top: pl.row * CELL_SIZE, originX: 0.5, originY: 0.5 }}
                >
                  <PieceTile piece={piece} rotation={pl.rotation} cellSize={CELL_SIZE}/>
                </motion.div>
              );
            })}

            {/* Solve glow */}
            {solveGlow && (
              <div className="absolute inset-0 rounded-2xl z-20 pointer-events-none"
                style={{ background:'rgba(63,208,158,0.38)', animation:'solveGlow 0.5s ease-out 2' }}/>
            )}
          </div>
        </div>
      </div>

      {/* ── Piece Tray ─────────────────────────────────────── */}
      <div className="relative z-10 mx-3 mb-2 flex-shrink-0">
        <div className="flex items-start justify-center gap-2 flex-wrap p-3 rounded-2xl"
          style={{
            background: 'rgba(255,255,255,0.07)', minHeight: 90,
            border: '1px solid rgba(255,255,255,0.1)',
          }}>
          {puzzle.pieces.map(piece => {
            const isAvail  = available.includes(piece.id);
            const isSel    = selected === piece.id;
            const isDrag   = dragPieceId === piece.id;
            const isShake  = shakeId === piece.id;
            const rot      = getRotation(piece.id);
            if (!isAvail) return null;

            return (
              <motion.div
                key={piece.id}
                onPointerDown={e => onPiecePointerDown(e, piece.id)}
                onClick={() => !isDrag && setSelected(isSel ? null : piece.id)}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                animate={isShake ? { x: [-8, 8, -6, 6, -4, 4, 0] } : { scale: 1 }}
                transition={isShake ? { duration: 0.4 } : { type: 'spring', stiffness: 400, damping: 25 }}
                className={`relative flex items-center justify-center rounded-xl cursor-pointer transition-all ${
                  isSel && !isDrag ? 'animate-glow-pulse' : ''
                }`}
                style={{
                  padding: 6, minWidth: 52, minHeight: 70,
                  background: isSel && !isDrag 
                    ? theme.glow
                    : 'transparent',
                  border: isSel && !isDrag ? `2px solid ${theme.primary}` : '2px solid transparent',
                  opacity: isDrag ? 0.28 : 1,
                  touchAction: 'none',
                }}
              >
                <PieceTile piece={piece} rotation={rot} cellSize={28}/>
                {isSel && !isDrag && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 animate-arrow-bob"
                    style={{ width:0, height:0,
                             borderLeft:'5px solid transparent', borderRight:'5px solid transparent',
                             borderBottom:`7px solid ${theme.primary}` }}/>
                )}
              </motion.div>
            );
          })}

          {available.length === 0 && !solved && (
            <p className="text-white/50 text-sm font-bold m-auto" style={{ fontFamily:'"Fredoka",system-ui' }}>
              ¡Todos los bichos colocados! Pulsa Comprobar ✓
            </p>
          )}
        </div>

        {/* Tray instructions */}
        <div className="flex justify-between px-1 mt-1">
          <span className="text-white/35 text-xs font-bold" style={{ fontFamily:'"Nunito",system-ui' }}>
            Toca para seleccionar · Arrastra al tablero
          </span>
          <span className="text-white/35 text-xs font-bold" style={{ fontFamily:'"Nunito",system-ui' }}>
            Restan {available.length}/{puzzle.pieces.length}
          </span>
        </div>
      </div>

      {/* ── Bug Coach ──────────────────────────────────────── */}
      <div className={`relative z-10 mx-3 mb-2 flex items-center gap-3 p-3 rounded-2xl flex-shrink-0 transition-all duration-300 ${
        nightMode 
          ? 'bg-[#180A2D] border border-[#2D174E]/60 text-purple-100' 
          : 'bg-white text-ink'
      }`}
        style={{ 
          boxShadow: nightMode ? '0 4px 0 rgba(0,0,0,0.45)' : '0 4px 0 rgba(0,0,0,0.22)',
          minHeight: 62 
        }}>
        <div className="flex-shrink-0 relative">
          <motion.div
            animate={isSpeaking ? {
              scale: [1, 1.08, 0.96, 1.06, 1],
              rotate: [0, 1.5, -1.5, 1.5, 0],
            } : {}}
            transition={{
              repeat: Infinity,
              duration: 1.2,
              ease: "easeInOut"
            }}
          >
            <BugSvg kind="coach" size={46} expression={isSpeaking ? 'stars' : 'normal'}/>
          </motion.div>
          <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-mint border-2 border-white"
            style={{ background:'#3FD09E' }}/>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="text-xs font-bold uppercase tracking-widest transition-colors duration-300"
                style={{ color: nightMode ? '#C0A0FF' : '#FF8A4C', fontFamily:'"Fredoka",system-ui', fontSize:10 }}>
                ENTRENADOR BUG
              </div>
              {isSpeaking && (
                <div className="flex items-end gap-0.5 h-3 px-1">
                  <div className="w-0.5 bg-[#FF8A4C] rounded-full animate-wave-bar-1 animate-pulse" style={{ height: '100%', minHeight: '4px' }} />
                  <div className="w-0.5 bg-[#FF8A4C] rounded-full animate-wave-bar-2 animate-pulse" style={{ height: '60%', minHeight: '4px' }} />
                  <div className="w-0.5 bg-[#FF8A4C] rounded-full animate-wave-bar-3 animate-pulse" style={{ height: '80%', minHeight: '4px' }} />
                </div>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={toggleAutoSpeak}
                className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded transition-all active:scale-95 flex items-center gap-0.5 ${
                  autoSpeak 
                    ? 'bg-orange-500 text-white shadow-sm' 
                    : nightMode
                      ? 'bg-purple-950/50 text-purple-300 border border-purple-800/40'
                      : 'bg-orange-50/70 text-[#FF8A4C] border border-orange-200/50'
                }`}
                style={{ fontFamily: '"Fredoka",system-ui' }}
                title={autoSpeak ? "Auto-voz activada" : "Activar auto-voz"}
              >
                <span>📢</span>
                <span>{autoSpeak ? "Auto-Voz: SI" : "Auto-Voz"}</span>
              </button>
              <button
                onClick={() => speakText(coachMsg)}
                className={`text-[9px] font-extrabold hover:scale-105 active:scale-95 px-1.5 py-0.5 rounded flex items-center gap-0.5 ${
                  nightMode
                    ? 'bg-purple-900/60 text-purple-200 hover:bg-purple-800/70'
                    : 'bg-orange-100 text-[#FF8A4C]'
                }`}
                style={{ fontFamily: '"Fredoka",system-ui' }}
                title="Escuchar entrenador"
              >
                <span>🔊</span><span>Leer</span>
              </button>
            </div>
          </div>
          <p className={`text-sm font-bold leading-snug transition-colors duration-300 ${nightMode ? 'text-purple-100' : 'text-ink'}`} style={{ fontFamily:'"Nunito",system-ui' }}>
            {coachMsg}
          </p>
        </div>
      </div>

      {/* ── Controls ───────────────────────────────────────── */}
      <div className="relative z-10 flex items-center justify-around px-4 pb-5 flex-shrink-0">
        <CtrlBtn color="#FF7B5C" dark="#C73000" label="Reiniciar" onClick={resetPuzzle}
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M4 4v6h6M20 20v-6h-6M20 10a8 8 0 00-14.6-3M4 14a8 8 0 0014.6 3"
              stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>}/>
        <CtrlBtn color="#3FD09E" dark="#1F9A6E" label="Rotar" onClick={rotatePiece} disabled={!selected || solved}
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M21 12a9 9 0 01-15.5 6.3M3 12a9 9 0 0115.5-6.3" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
            <path d="M19 3l2 3-3 1M5 21l-2-3 3-1" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>}/>
        <CtrlBtn color="#FFC83D" dark="#B97808" label="Comprobar" big onClick={checkSolution}
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M4 12l5 5L20 6" stroke="#231347" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>}/>
        <CtrlBtn color={theme.primary} dark={theme.dark} label="Pista" onClick={askHint} disabled={solved}
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M9 18h6M10 21h4M12 3a6 6 0 00-4 10.5c1 1 1.5 1.7 1.5 3v.5h5V16.5c0-1.3.5-2 1.5-3A6 6 0 0012 3z"
              stroke="#fff" strokeWidth="2.2" strokeLinejoin="round"/>
          </svg>}/>
      </div>

      {/* ── Drag ghost ─────────────────────────────────────── */}
      {dragPiece && (
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ 
            scale: ghostTargetPos.snapped ? 1.0 : 1.1, 
            opacity: 0.92, 
            x: ghostTargetPos.x, 
            y: ghostTargetPos.y 
          }}
          transition={{ type: 'spring', stiffness: 500, damping: 28 }}
          className="fixed z-50 pointer-events-none"
          style={{ left: 0, top: 0, width: ghostW, height: ghostH }}
        >
          <PieceTile piece={dragPiece} rotation={dragRot} cellSize={CELL_SIZE} ghost/>
        </motion.div>
      )}

      {/* ── Particle bursts ────────────────────────────────── */}
      <AnimatePresence>
        {particles.map(p => (
          <motion.div
            key={p.id}
            initial={{ x: p.startX, y: p.startY, opacity: 1, scale: 0.5 }}
            animate={{ 
              x: p.startX + p.destX, 
              y: p.startY + p.destY, 
              opacity: 0, 
              scale: [0.5, 1.3, 0] 
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.65, ease: "easeOut" }}
            onAnimationComplete={() => {
              setParticles(prev => prev.filter(item => item.id !== p.id));
            }}
            className="fixed pointer-events-none z-[9999]"
            style={{ 
              fontSize: p.size,
              color: p.color,
              textShadow: '0 2px 4px rgba(0,0,0,0.5)'
            }}
          >
            {p.emoji}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* ── Trail particles ────────────────────────────────── */}
      <AnimatePresence>
        {trailParticles.map(tp => (
          <motion.div
            key={tp.id}
            initial={{ x: tp.x - tp.size/2, y: tp.y - tp.size/2, opacity: 1, scale: 0.6 }}
            animate={{ 
              x: tp.x - tp.size/2 + Math.cos(tp.angle) * 16, 
              y: tp.y - tp.size/2 + Math.sin(tp.angle) * 16 + 12, 
              opacity: 0, 
              scale: [0.6, 1.2, 0] 
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            onAnimationComplete={() => {
              setTrailParticles(prev => prev.filter(item => item.id !== tp.id));
            }}
            className="fixed pointer-events-none z-[9999]"
            style={{ 
              fontSize: tp.size,
              color: tp.color,
              textShadow: '0 1px 2px rgba(0,0,0,0.3)',
            }}
          >
            {tp.emoji}
          </motion.div>
        ))}
      </AnimatePresence>

      <style>{`
        @keyframes solveGlow {
          0%   { opacity:0; }
          50%  { opacity:1; }
          100% { opacity:0; }
        }
        @keyframes waveBar {
          0%, 100% { transform: scaleY(0.4); }
          50% { transform: scaleY(1.4); }
        }
        @keyframes arrowBob {
          0%, 100% { transform: translate(-50%, 0); }
          50% { transform: translate(-50%, -4px); }
        }
        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 6px ${theme.glow}, inset 0 0 3px rgba(255,255,255,0.15); }
          50% { box-shadow: 0 0 14px ${theme.primary}, inset 0 0 6px ${theme.glow}; }
        }
        .animate-wave-bar-1 { animation: waveBar 0.5s ease-in-out infinite; transform-origin: bottom; }
        .animate-wave-bar-2 { animation: waveBar 0.75s ease-in-out infinite 0.12s; transform-origin: bottom; }
        .animate-wave-bar-3 { animation: waveBar 0.65s ease-in-out infinite 0.22s; transform-origin: bottom; }
        .animate-arrow-bob { animation: arrowBob 1.2s ease-in-out infinite; }
        .animate-glow-pulse { animation: glowPulse 1.8s ease-in-out infinite; }
      `}</style>
    </div>
  );
}

// ─── Control button component ─────────────────────────────────
function CtrlBtn({ icon, label, color, dark, big, disabled, onClick }: {
  icon: React.ReactNode; label: string; color: string; dark: string;
  big?: boolean; disabled?: boolean; onClick: () => void;
}) {
  const size = big ? 66 : 54;
  return (
    <button onClick={onClick} disabled={disabled}
      className="flex flex-col items-center gap-1 transition-transform active:scale-90 active:translate-y-0.5"
      style={{ opacity: disabled ? 0.38 : 1, border:'none', background:'transparent', padding:0,
               cursor: disabled ? 'default' : 'pointer' }}>
      <div className="flex items-center justify-center rounded-full"
        style={{
          width:size, height:size, background:color,
          boxShadow: `0 5px 0 ${dark}, inset 0 -3px 0 rgba(0,0,0,0.16), inset 0 2px 0 rgba(255,255,255,0.25)`,
        }}>
        {icon}
      </div>
      <span className="text-white font-bold uppercase tracking-wide"
        style={{ fontFamily:'"Fredoka",system-ui', fontSize:10, letterSpacing:1 }}>
        {label}
      </span>
    </button>
  );
}
