import type { Puzzle } from '../types';
import { makePiece } from './characters';

// ─── Piece cell counts: pip=3, bobo=3, zig=4, mo=4, rose=2, coach=3 ──
// Each puzzle: sum(piece cells) MUST equal (cols×rows − blocked.length)

// ─── World 1: Meadow Path (easy) ──────────────────────────────
// M1: 4×3=12. pip(3)+pip(3)+mo(4)+rose(2) = 12 ✓
const p1: Puzzle = {
  id:'meadow-1', name:'Primeros Pasos', description:'¡Llena el soleado parche de la pradera!',
  worldId:'meadow', difficulty:'easy', cols:4, rows:3, blockedCells:[],
  pieces:[makePiece('pip','_a'), makePiece('pip','_b'), makePiece('mo','_a'), makePiece('rose','_a')],
  hints:['Intenta colocar primero el bicho largo verde en la fila superior.', 'El cuadrado azul encaja perfectamente en una esquina.', '¡Rota una pieza con el botón si no cabe!'],
  maxMoves:8,
};

// M2: 5×3=15. mo(4)+zig(4)+pip(3)+rose(2)+rose(2) = 15 ✓
const p2: Puzzle = {
  id:'meadow-2', name:'Campo de Flores', description:'¡Ayuda a los bichitos a encontrar sus flores!',
  worldId:'meadow', difficulty:'easy', cols:5, rows:3, blockedCells:[],
  pieces:[makePiece('mo','_a'), makePiece('zig','_a'), makePiece('pip','_a'), makePiece('rose','_a'), makePiece('rose','_b')],
  hints:['Empieza por las piezas más grandes, son las más difíciles de encajar después.', 'El bicho con forma de S funciona muy bien en el centro.', 'Dos bichitos pequeños pueden llenar los huecos restantes.'],
  maxMoves:10,
};

// M3: 4×4=16. mo(4)+mo(4)+pip(3)+bobo(3)+rose(2) = 16 ✓
const p3: Puzzle = {
  id:'meadow-3', name:'Laberinto de la Pradera', description:'¡Un parche más difícil de llenar!',
  worldId:'meadow', difficulty:'easy', cols:4, rows:4, blockedCells:[],
  pieces:[makePiece('mo','_a'), makePiece('mo','_b'), makePiece('pip','_a'), makePiece('bobo','_a'), makePiece('rose','_a')],
  hints:['Dos bichos cuadrados ocupan la mitad del tablero; colócalos primero.', 'Intenta colocar los cuadrados en esquinas opuestas.', 'El bicho con forma de L y el bicho recto llenan el último hueco.'],
  maxMoves:10,
};

// M4: 5×4=20 blocked corners=[0,0][4,0][0,3][4,3] → 16. mo(4)+zig(4)+pip(3)+bobo(3)+rose(2)=16 ✓
const p4: Puzzle = {
  id:'meadow-4', name:'Salto de Esquina', description:'¡Cuidado con las esquinas embarradas!',
  worldId:'meadow', difficulty:'easy', cols:5, rows:4,
  blockedCells:[[0,0],[4,0],[0,3],[4,3]],
  pieces:[makePiece('mo','_a'), makePiece('zig','_a'), makePiece('pip','_a'), makePiece('bobo','_a'), makePiece('rose','_a')],
  hints:['Las cuatro esquinas están bloqueadas; planifica alrededor de ellas.', 'Trabaja desde los bordes hacia el centro.', 'Intenta rotar a Zig; ambas direcciones funcionan en diferentes lugares.'],
  maxMoves:12,
};

// M5: 6×3=18. mo(4)+mo(4)+pip(3)+pip(3)+rose(2)+rose(2) = 18 ✓
const p5: Puzzle = {
  id:'meadow-5', name:'Gran Extensión', description:'¡Llena toda la pista de la pradera!',
  worldId:'meadow', difficulty:'medium', cols:6, rows:3, blockedCells:[],
  pieces:[makePiece('mo','_a'), makePiece('mo','_b'), makePiece('pip','_a'), makePiece('pip','_b'), makePiece('rose','_a'), makePiece('rose','_b')],
  hints:['¡El tablero largo necesita piezas largas!', 'Dos cuadrados lado a lado cubren el centro perfectamente.', 'Los bichitos diminutos llenan los extremos restantes.'],
  maxMoves:12,
};

// ─── World 2: Crystal Cave (medium) ──────────────────────────
// C1: 5×4=20. mo(4)+mo(4)+zig(4)+pip(3)+coach(3)+rose(2) = 20 ✓
const p6: Puzzle = {
  id:'crystal-1', name:'Entrada de la Cueva', description:'Cristales por todas partes, ¡camina con cuidado!',
  worldId:'crystal', difficulty:'medium', cols:5, rows:4, blockedCells:[],
  pieces:[makePiece('mo','_a'), makePiece('mo','_b'), makePiece('zig','_a'), makePiece('pip','_a'), makePiece('coach','_a'), makePiece('rose','_a')],
  hints:['Seis piezas para veinte celdas; piensa un paso por delante.', 'Intenta colocar la forma de S horizontalmente primero.', '¡Coach encaja perfectamente en una columna alta!'],
  maxMoves:14,
};

// C2: 5×4=20 blocked [1,0][3,0][1,3][3,3] → 16. mo(4)+mo(4)+pip(3)+bobo(3)+rose(2)=16 ✓
const p7: Puzzle = {
  id:'crystal-2', name:'Cuadrícula de Cristal', description:'¡Los cristales bloquean el camino!',
  worldId:'crystal', difficulty:'medium', cols:5, rows:4,
  blockedCells:[[1,0],[3,0],[1,3],[3,3]],
  pieces:[makePiece('mo','_a'), makePiece('mo','_b'), makePiece('pip','_a'), makePiece('bobo','_a'), makePiece('rose','_a')],
  hints:['Cuatro cristales bloquean las esquinas; úsalos para guiar la colocación.', 'Los bichos cuadrados funcionan bien en la zona central abierta.', 'La forma de L llena un hueco incómodo en el borde.'],
  maxMoves:12,
};

// C3: 4×5=20. mo(4)+mo(4)+zig(4)+pip(3)+bobo(3)+rose(2) = 20 ✓
const p8: Puzzle = {
  id:'crystal-3', name:'Caverna Profunda', description:'¡Adéntrate más en la cueva de cristal!',
  worldId:'crystal', difficulty:'medium', cols:4, rows:5, blockedCells:[],
  pieces:[makePiece('mo','_a'), makePiece('mo','_b'), makePiece('zig','_a'), makePiece('pip','_a'), makePiece('bobo','_a'), makePiece('rose','_a')],
  hints:['¡Un tablero alto! Piensa en colocaciones verticales.', 'Rotar el bicho recto verticalmente cubre una columna completa.', 'Las formas de L llenan muy bien las esquinas difíciles.'],
  maxMoves:14,
};

// C4: 6×4=24. mo(4)×3+zig(4)+pip(3)+bobo(3)+rose(2) = 24 ✓
const p9: Puzzle = {
  id:'crystal-4', name:'Cámara de Gemas', description:'¡La cámara de cristal más grande hasta ahora!',
  worldId:'crystal', difficulty:'medium', cols:6, rows:4, blockedCells:[],
  pieces:[makePiece('mo','_a'), makePiece('mo','_b'), makePiece('mo','_c'), makePiece('zig','_a'), makePiece('pip','_a'), makePiece('bobo','_a'), makePiece('rose','_a')],
  hints:['¡Siete piezas! Comienza con los tres cuadrados.', 'Tres cuadrados en fila cubren doce celdas perfectamente.', 'La forma de S y la forma de L cubren el área restante.'],
  maxMoves:16,
};

// C5: 5×4=20 blocked [0,0][4,0][0,3][4,3] → 16. mo(4)+zig(4)+pip(3)+bobo(3)+rose(2) = 16 ✓
const p10: Puzzle = {
  id:'crystal-5', name:'Corazón de Cristal', description:'¡Encuentra el patrón oculto en los cristales!',
  worldId:'crystal', difficulty:'hard', cols:5, rows:4,
  blockedCells:[[0,0],[4,0],[0,3],[4,3]],
  pieces:[makePiece('mo','_a'), makePiece('zig','_a'), makePiece('pip','_a'), makePiece('bobo','_a'), makePiece('rose','_a')],
  hints:['Esquinas bloqueadas de nuevo; el centro necesita una planificación cuidadosa.', 'Intenta colocar la forma de S cerca de la fila superior.', 'La forma de L llena los lugares incómodos cerca de las esquinas.'],
  maxMoves:14,
};

// ─── World 3: Robo Reef (hard) ────────────────────────────────
// R1: 6×4=24. mo+mo+zig+zig+pip+bobo+rose = 4+4+4+4+3+3+2 = 24 ✓
const p11: Puzzle = {
  id:'robo-1', name:'Entrada al Arrecife', description:'¡Bienvenidos al brillante Arrecife Robot!',
  worldId:'robo', difficulty:'hard', cols:6, rows:4, blockedCells:[],
  pieces:[makePiece('mo','_a'), makePiece('mo','_b'), makePiece('zig','_a'), makePiece('zig','_b'), makePiece('pip','_a'), makePiece('bobo','_a'), makePiece('rose','_a')],
  hints:['Dos formas de S encajan perfectamente en un área de 4×2.', 'Llena una mitad del arrecife y luego la otra.', 'Busca dónde la forma de L puede llenar una esquina difícil.'],
  maxMoves:16,
};

// R2: 4×6=24. mo+mo+zig+zig+pip+bobo+rose = 24 ✓
const p12: Puzzle = {
  id:'robo-2', name:'Torre de Coral', description:'¡Construye la torre de coral bien alta!',
  worldId:'robo', difficulty:'hard', cols:4, rows:6, blockedCells:[],
  pieces:[makePiece('mo','_a'), makePiece('mo','_b'), makePiece('zig','_a'), makePiece('zig','_b'), makePiece('pip','_a'), makePiece('bobo','_a'), makePiece('rose','_a')],
  hints:['Una torre alta: piensa en apilar, no en extender.', 'Rotar las piezas verticalmente es la clave aquí.', 'Comienza desde abajo y construye hacia arriba.'],
  maxMoves:16,
};

// R3: 5×5=25. mo+mo+zig+pip+pip+bobo+rose+rose = 4+4+4+3+3+3+2+2 = 25 ✓
const p13: Puzzle = {
  id:'robo-3', name:'Cuadrícula de Burbujas', description:'¡Llena la cuadrícula de burbujas perfecta de 5×5!',
  worldId:'robo', difficulty:'hard', cols:5, rows:5, blockedCells:[],
  pieces:[makePiece('mo','_a'), makePiece('mo','_b'), makePiece('zig','_a'), makePiece('pip','_a'), makePiece('pip','_b'), makePiece('bobo','_a'), makePiece('rose','_a'), makePiece('rose','_b')],
  hints:['¡Ocho piezas para un 5×5! Ve sección por sección.', 'Los dos bichos rectos cubren una columna completa cuando están verticales.', 'Los bichitos pequeños son útiles para llenar los huecos restantes.'],
  maxMoves:20,
};

// R4: 5×4=20 blocked [2,1][2,2] → 18. mo+mo+zig+pip+bobo = 4+4+4+3+3 = 18 ✓
const p14: Puzzle = {
  id:'robo-4', name:'Núcleo de Robot', description:'¡Trabaja alrededor del núcleo del robot!',
  worldId:'robo', difficulty:'hard', cols:5, rows:4,
  blockedCells:[[2,1],[2,2]],
  pieces:[makePiece('mo','_a'), makePiece('mo','_b'), makePiece('zig','_a'), makePiece('pip','_a'), makePiece('bobo','_a')],
  hints:['El centro bloqueado divide el tablero; trata cada lado por separado.', 'Dos cuadrados, uno a cada lado del hueco, anclan el diseño.', 'La forma de S conecta el área del hueco de manera excelente.'],
  maxMoves:14,
};

// R5: 6×4=24. mo+mo+zig+pip+pip+bobo+coach = 4+4+4+3+3+3+3 = 24 ✓
const p15: Puzzle = {
  id:'robo-5', name:'Circuito Final', description:'¡El último desafío del Arrecife Robot!',
  worldId:'robo', difficulty:'hard', cols:6, rows:4, blockedCells:[],
  pieces:[makePiece('mo','_a'), makePiece('mo','_b'), makePiece('zig','_a'), makePiece('pip','_a'), makePiece('pip','_b'), makePiece('bobo','_a'), makePiece('coach','_a')],
  hints:['Tu último rompecabezas: usa cada habilidad que hayas aprendido.', 'Mezcla colocaciones verticales y horizontales para una cobertura máxima.', '¡Tres bichos rectos colocados verticalmente cubren un área completa de 3×3!'],
  maxMoves:18,
};

export const PUZZLES: Record<string, Puzzle> = {
  'meadow-1':p1, 'meadow-2':p2, 'meadow-3':p3, 'meadow-4':p4, 'meadow-5':p5,
  'crystal-1':p6, 'crystal-2':p7, 'crystal-3':p8, 'crystal-4':p9, 'crystal-5':p10,
  'robo-1':p11, 'robo-2':p12, 'robo-3':p13, 'robo-4':p14, 'robo-5':p15,
};

export default PUZZLES;
