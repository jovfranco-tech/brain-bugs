import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../contexts/AppContext';
import type { BugKind, WorldId } from '../types';
import BugSvg from '../components/BugSvg';
import BottomNav from '../components/BottomNav';
import { sound } from '../lib/sound';
import { BUG_COLORS, PIECE_DEFS } from '../data/characters';
import confetti from 'canvas-confetti';

// Standard kinds of bugs for pieces
const BUG_KINDS: BugKind[] = ['pip', 'bobo', 'zig', 'mo', 'rose'];

// Map kinds to nice names and icons
const BUG_INFO: Record<BugKind, { name: string; icon: string; shapeLabel: string }> = {
  pip: { name: 'Pip', icon: '🐛', shapeLabel: 'Línea de 3 celdas' },
  bobo: { name: 'Bobo', icon: '🦋', shapeLabel: 'Forma de L (3 celdas)' },
  zig: { name: 'Zig', icon: '🐞', shapeLabel: 'Zig-zag (4 celdas)' },
  mo: { name: 'Mo', icon: '🦗', shapeLabel: 'Cuadrado 2x2 (4 celdas)' },
  rose: { name: 'Rose', icon: '🌸', shapeLabel: 'Línea de 2 celdas' },
  coach: { name: 'Entrenador', icon: '🎓', shapeLabel: 'Línea vertical' },
};

// ─── Backtracking solver to check level solvability ───────────
function checkSolvability(
  cols: number,
  rows: number,
  blocked: [number, number][],
  locks: [number, number, BugKind][],
  selectedPieces: BugKind[]
): boolean {
  // 1. Quick size check
  const piecesSize = selectedPieces.reduce((sum, kind) => {
    if (kind === 'rose') return sum + 2;
    if (kind === 'zig' || kind === 'mo') return sum + 4;
    return sum + 3; // pip, bobo, coach
  }, 0);
  const playableSize = cols * rows - blocked.length;
  if (piecesSize !== playableSize) return false;
  if (selectedPieces.length === 0) return true;

  // 2. Initialize board state
  const board = Array.from({ length: rows }, () => Array(cols).fill(false));
  for (const [bc, br] of blocked) {
    if (br >= 0 && br < rows && bc >= 0 && bc < cols) {
      board[br][bc] = true;
    }
  }

  // Map of locks
  const lockMap: Record<string, BugKind> = {};
  for (const [lc, lr, kind] of locks) {
    lockMap[`${lc},${lr}`] = kind;
  }

  // Precompute unique rotated shapes for each selected piece
  const pieces = selectedPieces.map((kind) => {
    const baseShape = PIECE_DEFS[kind]?.baseShape || [];
    const unique: [number, number][][] = [];
    const seen = new Set<string>();

    let shape = baseShape;
    for (let r = 0; r < 4; r++) {
      const key = JSON.stringify(shape);
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(shape);
      }
      // Rotate shape clockwise
      shape = shape.map(([c, r]) => [-r, c] as [number, number]);
      const minC = Math.min(...shape.map(([c]) => c));
      const minR = Math.min(...shape.map(([, r]) => r));
      shape = shape.map(([c, r]) => [c - minC, r - minR]);
    }
    return { kind, shapes: unique };
  });

  let steps = 0;
  const maxSteps = 15000; // safety roof

  function backtrack(index: number): boolean {
    if (index === pieces.length) return true;
    steps++;
    if (steps > maxSteps) return false;

    const { kind, shapes } = pieces[index];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        for (const shape of shapes) {
          let fits = true;
          for (const [dc, dr] of shape) {
            const nc = c + dc;
            const nr = r + dr;
            if (nc < 0 || nc >= cols || nr < 0 || nr >= rows) {
              fits = false;
              break;
            }
            if (board[nr][nc]) {
              fits = false;
              break;
            }
            const cellLock = lockMap[`${nc},${nr}`];
            if (cellLock && cellLock !== kind) {
              fits = false;
              break;
            }
          }

          if (fits) {
            // Apply placement
            for (const [dc, dr] of shape) {
              board[r + dr][c + dc] = true;
            }

            // Recurse to next piece
            if (backtrack(index + 1)) return true;

            // Remove placement (backtrack)
            for (const [dc, dr] of shape) {
              board[r + dr][c + dc] = false;
            }
          }
        }
      }
    }
    return false;
  }

  return backtrack(0);
}

export default function BugLab() {
  const { currentChild, navigate } = useApp();
  
  // XP Check
  const childXP = currentChild?.totalXP ?? 0;
  const isLocked = childXP < 50;

  // Grid Config State
  const [cols, setCols] = useState<number>(5);
  const [rows, setRows] = useState<number>(5);
  const [blocked, setBlocked] = useState<[number, number][]>([]);
  const [locks, setLocks] = useState<[number, number, BugKind][]>([]);
  
  // Available pieces in custom level inventory
  const [selectedPieces, setSelectedPieces] = useState<BugKind[]>(['pip', 'bobo']);
  
  // Editor mode: 'obstacle' or 'lock'
  const [editMode, setEditMode] = useState<'obstacle' | 'lock'>('obstacle');
  const [selectedLockKind, setSelectedLockKind] = useState<BugKind>('pip');

  // Input code state for importing
  const [importCode, setImportCode] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Re-build empty grid bounds
  const cells = useMemo(() => {
    const arr = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        arr.push({ c, r });
      }
    }
    return arr;
  }, [cols, rows]);

  // Reactive Solvability Evaluation
  const isSolvable = useMemo(() => {
    if (selectedPieces.length === 0) return false;
    return checkSolvability(cols, rows, blocked, locks, selectedPieces);
  }, [cols, rows, blocked, locks, selectedPieces]);

  if (!currentChild) return null;

  // Helper: Encode level configuration to base64
  const generateLevelCode = (): string => {
    const levelData = {
      c: cols,
      r: rows,
      b: blocked,
      l: locks,
      p: selectedPieces,
    };
    const jsonStr = JSON.stringify(levelData);
    const base64 = btoa(unescape(encodeURIComponent(jsonStr)));
    return 'custom-' + base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  };

  // Helper: Decode level configuration from base64
  const loadLevelFromCode = (code: string): boolean => {
    if (!code.startsWith('custom-')) {
      setErrorMsg('Código no válido. Debe empezar por "custom-"');
      sound.playError();
      return false;
    }
    let base64 = code.substring(7).replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) base64 += '=';
    try {
      const jsonStr = decodeURIComponent(escape(atob(base64)));
      const data = JSON.parse(jsonStr);
      if (typeof data.c === 'number' && typeof data.r === 'number') {
        setCols(data.c);
        setRows(data.r);
        setBlocked(data.b || []);
        setLocks(data.l || []);
        setSelectedPieces(data.p || []);
        setErrorMsg('');
        sound.playSnap();
        return true;
      }
    } catch (e) {
      console.error(e);
    }
    setErrorMsg('Error al descifrar el código. Está corrupto.');
    sound.playError();
    return false;
  };

  const handleCellClick = (c: number, r: number) => {
    sound.playSnap();
    if (editMode === 'obstacle') {
      // Toggle blocked cell
      const isBlocked = blocked.some(([bc, br]) => bc === c && br === r);
      if (isBlocked) {
        setBlocked(blocked.filter(([bc, br]) => !(bc === c && br === r)));
      } else {
        // Remove any lock on this cell and block it
        setLocks(locks.filter(([lc, lr]) => !(lc === c && lr === r)));
        setBlocked([...blocked, [c, r]]);
      }
    } else {
      // Toggle lock cell
      const existingLock = locks.find(([lc, lr]) => lc === c && lr === r);
      if (existingLock) {
        if (existingLock[2] === selectedLockKind) {
          // Remove lock
          setLocks(locks.filter(([lc, lr]) => !(lc === c && lr === r)));
        } else {
          // Cycle or set to selected kind
          setLocks(locks.map(([lc, lr, k]) => (lc === c && lr === r ? [lc, lr, selectedLockKind] : [lc, lr, k])));
        }
      } else {
        // Remove any blocked state and add lock
        setBlocked(blocked.filter(([bc, br]) => !(bc === c && br === r)));
        setLocks([...locks, [c, r, selectedLockKind]]);
      }
    }
  };

  const togglePieceSelection = (kind: BugKind) => {
    sound.playSnap();
    if (selectedPieces.includes(kind)) {
      setSelectedPieces(selectedPieces.filter(p => p !== kind));
    } else {
      setSelectedPieces([...selectedPieces, kind]);
    }
  };

  const handleCopyCode = () => {
    if (!isSolvable) return;
    if (selectedPieces.length === 0) {
      setErrorMsg('⚠️ Debes incluir al menos un bicho en el inventario.');
      sound.playError();
      return;
    }
    const code = generateLevelCode();
    navigator.clipboard.writeText(code).then(() => {
      setCopySuccess(true);
      sound.playVictory();
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  const handlePlayLevel = () => {
    if (!isSolvable) return;
    if (selectedPieces.length === 0) {
      setErrorMsg('⚠️ Añade al menos un bicho para poder jugar.');
      sound.playError();
      return;
    }
    const code = generateLevelCode();
    navigate('gameplay', { levelId: code, worldId: 'meadow' });
  };

  const handleGridSizeChange = (newCols: number, newRows: number) => {
    sound.playSnap();
    setCols(newCols);
    setRows(newRows);
    setBlocked([]);
    setLocks([]);
  };

  const handleGenerateProceduralLevel = () => {
    sound.playClick();
    const allPieces: BugKind[] = ['pip', 'bobo', 'zig', 'mo', 'rose'];
    const pieceSizes: Record<BugKind, number> = {
      rose: 2,
      pip: 3,
      bobo: 3,
      coach: 3,
      zig: 4,
      mo: 4
    };

    const newCols = 5;
    const newRows = 5;

    let success = false;
    let attempts = 0;

    while (!success && attempts < 80) {
      attempts++;
      const numPieces = 3 + Math.floor(Math.random() * 3); // 3, 4, 5
      const selected: BugKind[] = [];
      let totalSize = 0;

      for (let i = 0; i < numPieces; i++) {
        const randPiece = allPieces[Math.floor(Math.random() * allPieces.length)];
        selected.push(randPiece);
        totalSize += pieceSizes[randPiece];
      }

      if (totalSize >= 12 && totalSize <= 22) {
        const blockCount = 25 - totalSize;
        const blockedCells: [number, number][] = [];
        const allCoords: [number, number][] = [];

        for (let r = 0; r < newRows; r++) {
          for (let c = 0; c < newCols; c++) {
            allCoords.push([c, r]);
          }
        }

        const shuffled = [...allCoords].sort(() => Math.random() - 0.5);
        for (let b = 0; b < blockCount; b++) {
          blockedCells.push(shuffled[b]);
        }

        const solvable = checkSolvability(newCols, newRows, blockedCells, [], selected);
        if (solvable) {
          setCols(newCols);
          setRows(newRows);
          setBlocked(blockedCells);
          setLocks([]);
          setSelectedPieces(selected);
          success = true;
          
          confetti({
            particleCount: 60,
            spread: 50,
            origin: { y: 0.6 }
          });
          break;
        }
      }
    }

    if (!success) {
      setCols(5);
      setRows(5);
      setBlocked([[2,2], [0,0], [4,4], [0,4], [4,0], [1,2], [3,2], [2,1], [2,3]]);
      setSelectedPieces(['pip', 'bobo', 'zig', 'rose', 'rose']);
      setLocks([]);
    }
  };

  // 🔒 Locked View for XP gate
  if (isLocked) {
    return (
      <div className="flex flex-col h-full overflow-hidden" style={{ background: 'linear-gradient(180deg, #1A0D2E 0%, #0C0518 100%)' }}>
        <div className="relative z-10 flex items-center justify-between px-4 pt-14 pb-3 flex-shrink-0">
          <button
            onClick={() => navigate('home')}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 border border-white/10"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M15 6l-6 6 6 6" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </button>
          <div className="font-bold text-white text-lg uppercase tracking-wider" style={{ fontFamily: '"Fredoka",system-ui' }}>
            Lab de Bichos 🔬
          </div>
          <div className="w-10" />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center z-10">
          <div
            className="w-24 h-24 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-5xl mb-6 relative overflow-hidden"
            style={{ boxShadow: '0 8px 32px rgba(142,107,255,0.15)' }}
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 to-transparent" />
            <span>🔒</span>
          </div>
          <h2 className="text-white text-2xl font-bold mb-3" style={{ fontFamily: '"Fredoka",system-ui' }}>
            Laboratorio Cerrado
          </h2>
          <p className="text-white/60 text-sm font-semibold max-w-sm mb-6 leading-relaxed" style={{ fontFamily: '"Nunito",system-ui' }}>
            ¡Hola, científico en entrenamiento! El **Laboratorio de Bichos** es una zona de experimentos de élite. Se desbloquea al alcanzar los <span className="text-yellow-400 font-extrabold">50 XP</span> resolviendo rompecabezas.
          </p>
          <div className="bg-yellow-500/15 border border-yellow-500/25 px-4 py-3 rounded-2xl mb-8 flex items-center gap-3">
            <span className="text-2xl">⚡</span>
            <div className="text-left">
              <div className="text-yellow-400 text-xs font-bold" style={{ fontFamily: '"Fredoka",system-ui' }}>Tú tienes:</div>
              <div className="text-white text-sm font-extrabold">{childXP} / 50 XP</div>
            </div>
          </div>
          <button
            onClick={() => navigate('world-map')}
            className="px-8 py-3.5 rounded-2xl font-bold text-lg text-ink transition-transform active:scale-95"
            style={{
              background: 'linear-gradient(180deg, #FFD55E, #FFB23A)',
              fontFamily: '"Fredoka",system-ui',
              boxShadow: '0 6px 0 #B97808',
            }}
          >
            ¡GANAR XP AHORA! ▶
          </button>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'linear-gradient(180deg, #1C0F35 0%, #0F0926 100%)' }}>
      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-4 pt-14 pb-3 flex-shrink-0 border-b border-white/5">
        <button
          onClick={() => navigate('home')}
          className="w-10 h-10 rounded-full flex items-center justify-center active:scale-90"
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M15 6l-6 6 6 6" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </button>
        <div className="flex flex-col items-center">
          <div
            className="font-bold text-white text-lg uppercase tracking-wider text-center"
            style={{ fontFamily: '"Fredoka",system-ui', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}
          >
            Bug Lab 🔬
          </div>
          <span className="text-white/40 text-[10px] font-semibold" style={{ fontFamily: '"Nunito",system-ui' }}>
            Creador y editor de rompecabezas
          </span>
        </div>
        <button
          onClick={handlePlayLevel}
          disabled={!isSolvable}
          className="px-4 py-1.5 rounded-full text-xs font-bold text-ink active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none"
          style={{
            background: isSolvable ? 'linear-gradient(180deg, #3FD09E, #1F9A6E)' : 'rgba(255,255,255,0.08)',
            fontFamily: '"Fredoka",system-ui',
            color: '#fff',
            boxShadow: isSolvable ? '0 3px 0 #125B41' : 'none',
          }}
        >
          ▶ JUGAR
        </button>
      </div>

      {/* Editor Content Area */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-6 space-y-4 relative z-10">
        
        {/* Step 1: Grid Size selector */}
        <div className="pt-3">
          <div className="flex justify-between items-center mb-2 px-1">
            <span className="text-white/40 text-xs font-bold uppercase tracking-wider" style={{ fontFamily: '"Nunito",system-ui' }}>
              1. Tamaño de la Grilla
            </span>
            <span className="text-white/60 text-xs font-bold">{cols}x{rows} celdas</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[[4,4], [5,5], [6,6]].map(([c, r]) => {
              const active = cols === c && rows === r;
              return (
                <button
                  key={`${c}x${r}`}
                  onClick={() => handleGridSizeChange(c, r)}
                  className="py-2.5 rounded-xl font-bold text-xs border transition-all active:scale-95"
                  style={{
                    background: active ? 'rgba(142, 107, 255, 0.15)' : 'rgba(255,255,255,0.03)',
                    borderColor: active ? '#8E6BFF' : 'rgba(255,255,255,0.08)',
                    color: active ? '#fff' : 'rgba(255,255,255,0.5)',
                    fontFamily: '"Fredoka",system-ui',
                  }}
                >
                  {c} x {r}
                </button>
              );
            })}
          </div>
          <button
            onClick={handleGenerateProceduralLevel}
            className="w-full mt-2.5 py-3 rounded-xl font-bold text-xs text-white transition-all active:scale-95 flex items-center justify-center gap-1.5"
            style={{
              background: 'linear-gradient(135deg, #8E6BFF, #6D44FF)',
              boxShadow: '0 3px 0 #4C26C9',
              fontFamily: '"Fredoka",system-ui',
            }}
          >
            🎲 Generación Inteligente (Procedural)
          </button>
        </div>

        {/* Dynamic Solvability Warn Banner */}
        {!isSolvable && selectedPieces.length > 0 && (
          <div className="bg-red-500/15 border border-red-500/25 p-3 rounded-2xl flex items-center gap-3">
            <span className="text-xl">⚠️</span>
            <p className="text-red-300 text-xs font-bold leading-relaxed text-left" style={{ fontFamily: '"Nunito",system-ui' }}>
              ¡Uy! Este rompecabezas no se puede resolver en su estado actual. Mueve algunas piedras, cambia los bichos o ajusta las cerraduras para habilitarlo.
            </p>
          </div>
        )}

        {/* Step 2: Interactive grid canvas */}
        <div>
          <div className="flex justify-between items-center mb-2 px-1">
            <span className="text-white/40 text-xs font-bold uppercase tracking-wider" style={{ fontFamily: '"Nunito",system-ui' }}>
              2. Diseña el Tablero
            </span>
            <div className="flex gap-1.5">
              <button
                onClick={() => setEditMode('obstacle')}
                className="px-3 py-1 rounded-full text-[10px] font-bold border transition-all"
                style={{
                  background: editMode === 'obstacle' ? 'rgba(255,123,92,0.18)' : 'transparent',
                  borderColor: editMode === 'obstacle' ? '#FF7B5C' : 'rgba(255,255,255,0.1)',
                  color: editMode === 'obstacle' ? '#FF7B5C' : 'rgba(255,255,255,0.4)',
                  fontFamily: '"Fredoka",system-ui',
                }}
              >
                🪨 Obstáculo
              </button>
              <button
                onClick={() => setEditMode('lock')}
                className="px-3 py-1 rounded-full text-[10px] font-bold border transition-all"
                style={{
                  background: editMode === 'lock' ? 'rgba(91,197,255,0.18)' : 'transparent',
                  borderColor: editMode === 'lock' ? '#5BC5FF' : 'rgba(255,255,255,0.1)',
                  color: editMode === 'lock' ? '#5BC5FF' : 'rgba(255,255,255,0.4)',
                  fontFamily: '"Fredoka",system-ui',
                }}
              >
                🔒 Cerradura
              </button>
            </div>
          </div>

          {/* Submenu for lock selection */}
          {editMode === 'lock' && (
            <div className="flex gap-1.5 p-2 rounded-xl bg-white/5 border border-white/10 mb-2 overflow-x-auto no-scrollbar">
              {BUG_KINDS.map((kind) => {
                const isSel = selectedLockKind === kind;
                const c = BUG_COLORS[kind];
                return (
                  <button
                    key={kind}
                    onClick={() => setSelectedLockKind(kind)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-bold flex-shrink-0"
                    style={{
                      background: isSel ? `${c.color}25` : 'transparent',
                      borderColor: isSel ? c.color : 'rgba(255,255,255,0.06)',
                      color: isSel ? '#fff' : 'rgba(255,255,255,0.4)',
                    }}
                  >
                    <span>{BUG_INFO[kind].icon}</span>
                    <span>{BUG_INFO[kind].name}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Grid Blueprint */}
          <div className="flex justify-center">
            <div
              className="p-2.5 rounded-3xl"
              style={{
                background: 'linear-gradient(145deg, #1A0D3C, #0F0827)',
                border: '1.5px solid rgba(255, 255, 255, 0.05)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${cols}, 46px)`,
                  gap: '4px',
                }}
              >
                {cells.map(({ c, r }) => {
                  const isBlocked = blocked.some(([bc, br]) => bc === c && br === r);
                  const lock = locks.find(([lc, lr]) => lc === c && lr === r);

                  return (
                    <button
                      key={`${c},${r}`}
                      onClick={() => handleCellClick(c, r)}
                      style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '10px',
                        background: isBlocked
                          ? '#FF7B5C'
                          : lock
                          ? 'rgba(91,197,255,0.12)'
                          : 'rgba(255,255,255,0.05)',
                        border: isBlocked
                          ? '2px solid #C73000'
                          : lock
                          ? `2px solid ${BUG_COLORS[lock[2]].color}`
                          : '1px solid rgba(255,255,255,0.08)',
                        boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)',
                      }}
                      className="flex items-center justify-center relative active:scale-95 transition-all"
                    >
                      {isBlocked && <span className="text-lg">🪨</span>}
                      {lock && (
                        <div className="flex flex-col items-center">
                          <span className="text-xs absolute -top-1 font-bold text-blue-300 scale-75">🔒</span>
                          <BugSvg kind={lock[2]} size={30} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <p className="text-white/35 text-[10px] text-center font-bold mt-2 leading-none" style={{ fontFamily: '"Nunito",system-ui' }}>
            Toca las celdas para colocar {editMode === 'obstacle' ? 'obstáculos de piedra' : 'cerraduras específicas de bicho'}
          </p>
        </div>

        {/* Step 3: Piece Selector */}
        <div>
          <span className="text-white/40 text-xs font-bold uppercase tracking-wider block mb-2 px-1" style={{ fontFamily: '"Nunito",system-ui' }}>
            3. Inventario de Bichos disponibles
          </span>
          <div className="space-y-1.5">
            {BUG_KINDS.map((kind) => {
              const isIncluded = selectedPieces.includes(kind);
              const info = BUG_INFO[kind];
              const c = BUG_COLORS[kind];

              return (
                <button
                  key={kind}
                  onClick={() => togglePieceSelection(kind)}
                  className="w-full flex items-center justify-between p-2.5 rounded-2xl border transition-all active:scale-98"
                  style={{
                    background: isIncluded ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.2)',
                    borderColor: isIncluded ? c.color : 'rgba(255,255,255,0.05)',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                      style={{ background: isIncluded ? `${c.color}20` : 'rgba(255,255,255,0.05)' }}
                    >
                      <BugSvg kind={kind} size={30} />
                    </div>
                    <div className="text-left">
                      <div className="text-white font-bold text-sm" style={{ fontFamily: '"Fredoka",system-ui' }}>
                        {info.name}
                      </div>
                      <div className="text-white/40 text-[10px] font-semibold" style={{ fontFamily: '"Nunito",system-ui' }}>
                        {info.shapeLabel}
                      </div>
                    </div>
                  </div>
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs border font-bold"
                    style={{
                      borderColor: isIncluded ? c.color : 'rgba(255,255,255,0.15)',
                      background: isIncluded ? c.color : 'transparent',
                      color: isIncluded ? '#231347' : 'transparent',
                    }}
                  >
                    ✓
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 4: Share / Load levels block */}
        <div
          className="p-4 rounded-3xl"
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1.5px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <span className="text-white/45 text-[10px] font-bold uppercase tracking-wider block mb-2" style={{ fontFamily: '"Nunito",system-ui' }}>
            Compartir / Importar Nivel
          </span>

          {/* Copy custom level code */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={handleCopyCode}
              disabled={!isSolvable}
              className="flex-1 py-3 rounded-xl font-bold text-xs active:scale-95 transition-all text-center flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:pointer-events-none"
              style={{
                background: copySuccess
                  ? 'linear-gradient(180deg, #3FD09E, #1F9A6E)'
                  : 'rgba(255,255,255,0.08)',
                color: '#fff',
                fontFamily: '"Fredoka",system-ui',
              }}
            >
              <span>{copySuccess ? '✓ Código Copiado' : '📋 Copiar Código'}</span>
            </button>
            <button
              onClick={handlePlayLevel}
              disabled={!isSolvable}
              className="flex-1 py-3 rounded-xl font-bold text-xs active:scale-95 transition-all text-center disabled:opacity-40 disabled:pointer-events-none"
              style={{
                background: isSolvable ? 'linear-gradient(180deg, #FFD55E, #FFB23A)' : 'rgba(255,255,255,0.08)',
                color: isSolvable ? '#231347' : '#fff',
                fontFamily: '"Fredoka",system-ui',
                boxShadow: isSolvable ? '0 4px 0 #B97808' : 'none',
              }}
            >
              ▶ JUGAR NIVEL
            </button>
          </div>

          {/* Import custom level code */}
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Pega el código de nivel de tu amigo..."
              value={importCode}
              onChange={(e) => setImportCode(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none focus:border-purple-400"
              style={{ fontFamily: '"Nunito",system-ui' }}
            />
            <button
              onClick={() => {
                if (loadLevelFromCode(importCode)) {
                  setImportCode('');
                }
              }}
              disabled={!importCode.trim()}
              className="w-full py-2.5 rounded-xl font-bold text-xs bg-purple-600 active:scale-95 transition-all disabled:opacity-40"
              style={{
                color: '#fff',
                fontFamily: '"Fredoka",system-ui',
              }}
            >
              📥 Cargar Nivel
            </button>
          </div>

          {/* Errors and alerts */}
          <AnimatePresence>
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-red-400 text-[10px] font-bold mt-2 text-center"
                style={{ fontFamily: '"Nunito",system-ui' }}
              >
                {errorMsg}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>

      {/* Navigation */}
      <BottomNav />
    </div>
  );
}
