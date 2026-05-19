import type { Puzzle } from '../types';
import { makePiece } from './characters';

// ─── Piece cell counts: pip=3, bobo=3, zig=4, mo=4, rose=2, coach=3 ──
// Each puzzle: sum(piece cells) MUST equal (cols×rows − blocked.length)

// ─── World 1: Meadow Path (easy) ──────────────────────────────
// M1: 4×3=12. pip(3)+pip(3)+mo(4)+rose(2) = 12 ✓
const p1: Puzzle = {
  id:'meadow-1', name:'First Steps', description:'Fill the sunny meadow patch!',
  worldId:'meadow', difficulty:'easy', cols:4, rows:3, blockedCells:[],
  pieces:[makePiece('pip','_a'), makePiece('pip','_b'), makePiece('mo','_a'), makePiece('rose','_a')],
  hints:['Try the long green bug across the top row first.','The blue square fits snugly in a corner.','Rotate a piece with the button — it might fit!'],
  maxMoves:8,
};

// M2: 5×3=15. mo(4)+zig(4)+pip(3)+rose(2)+rose(2) = 15 ✓
const p2: Puzzle = {
  id:'meadow-2', name:'Flower Field', description:'Help the bugs find their flower spots!',
  worldId:'meadow', difficulty:'easy', cols:5, rows:3, blockedCells:[],
  pieces:[makePiece('mo','_a'), makePiece('zig','_a'), makePiece('pip','_a'), makePiece('rose','_a'), makePiece('rose','_b')],
  hints:['Start with the biggest pieces — they are hardest to fit later.','The S-shaped bug works well in the middle.','Two small bugs can fill the leftover gaps.'],
  maxMoves:10,
};

// M3: 4×4=16. mo(4)+mo(4)+pip(3)+bobo(3)+rose(2) = 16 ✓
const p3: Puzzle = {
  id:'meadow-3', name:'Meadow Maze', description:'A trickier patch to fill!',
  worldId:'meadow', difficulty:'easy', cols:4, rows:4, blockedCells:[],
  pieces:[makePiece('mo','_a'), makePiece('mo','_b'), makePiece('pip','_a'), makePiece('bobo','_a'), makePiece('rose','_a')],
  hints:['Two square bugs take up half the board — place them first.','Try the squares in opposite corners.','The L-shaped bug and the straight bug fill the last gap.'],
  maxMoves:10,
};

// M4: 5×4=20 blocked corners=[0,0][4,0][0,3][4,3] → 16. mo(4)+zig(4)+pip(3)+bobo(3)+rose(2)=16 ✓
const p4: Puzzle = {
  id:'meadow-4', name:'Corner Hop', description:'Watch out for the muddy corners!',
  worldId:'meadow', difficulty:'easy', cols:5, rows:4,
  blockedCells:[[0,0],[4,0],[0,3],[4,3]],
  pieces:[makePiece('mo','_a'), makePiece('zig','_a'), makePiece('pip','_a'), makePiece('bobo','_a'), makePiece('rose','_a')],
  hints:['The four corners are blocked — plan around them.','Work from the edges inward.','Try rotating Zig — both directions work in different spots.'],
  maxMoves:12,
};

// M5: 6×3=18. mo(4)+mo(4)+pip(3)+pip(3)+rose(2)+rose(2) = 18 ✓
const p5: Puzzle = {
  id:'meadow-5', name:'Long Stretch', description:'Fill the whole meadow runway!',
  worldId:'meadow', difficulty:'medium', cols:6, rows:3, blockedCells:[],
  pieces:[makePiece('mo','_a'), makePiece('mo','_b'), makePiece('pip','_a'), makePiece('pip','_b'), makePiece('rose','_a'), makePiece('rose','_b')],
  hints:['The long board needs long pieces!','Two squares side by side cover the centre perfectly.','The tiny bugs fill the remaining ends.'],
  maxMoves:12,
};

// ─── World 2: Crystal Cave (medium) ──────────────────────────
// C1: 5×4=20. mo(4)+mo(4)+zig(4)+pip(3)+coach(3)+rose(2) = 20 ✓
const p6: Puzzle = {
  id:'crystal-1', name:'Cave Entrance', description:'Crystals everywhere — step carefully!',
  worldId:'crystal', difficulty:'medium', cols:5, rows:4, blockedCells:[],
  pieces:[makePiece('mo','_a'), makePiece('mo','_b'), makePiece('zig','_a'), makePiece('pip','_a'), makePiece('coach','_a'), makePiece('rose','_a')],
  hints:['Six pieces for twenty cells — think one step ahead.','Try placing the S-shape horizontally first.','Coach fits perfectly in a tall column!'],
  maxMoves:14,
};

// C2: 5×4=20 blocked [1,0][3,0][1,3][3,3] → 16. mo(4)+mo(4)+pip(3)+bobo(3)+rose(2)=16 ✓
const p7: Puzzle = {
  id:'crystal-2', name:'Crystal Grid', description:'The crystals block the path!',
  worldId:'crystal', difficulty:'medium', cols:5, rows:4,
  blockedCells:[[1,0],[3,0],[1,3],[3,3]],
  pieces:[makePiece('mo','_a'), makePiece('mo','_b'), makePiece('pip','_a'), makePiece('bobo','_a'), makePiece('rose','_a')],
  hints:['Four crystals block the corners — use that to guide placement.','Square bugs work well in the open centre area.','The L-shape fills an awkward edge gap.'],
  maxMoves:12,
};

// C3: 4×5=20. mo(4)+mo(4)+zig(4)+pip(3)+bobo(3)+rose(2) = 20 ✓
const p8: Puzzle = {
  id:'crystal-3', name:'Deep Cavern', description:'Go deeper into the crystal cave!',
  worldId:'crystal', difficulty:'medium', cols:4, rows:5, blockedCells:[],
  pieces:[makePiece('mo','_a'), makePiece('mo','_b'), makePiece('zig','_a'), makePiece('pip','_a'), makePiece('bobo','_a'), makePiece('rose','_a')],
  hints:['A tall board! Think about vertical placements.','Rotating the straight bug vertically covers a full column.','The L-shapes fill the awkward corners nicely.'],
  maxMoves:14,
};

// C4: 6×4=24. mo(4)×3+zig(4)+pip(3)+bobo(3)+rose(2) = 24 ✓
const p9: Puzzle = {
  id:'crystal-4', name:'Gem Chamber', description:'The biggest crystal chamber yet!',
  worldId:'crystal', difficulty:'medium', cols:6, rows:4, blockedCells:[],
  pieces:[makePiece('mo','_a'), makePiece('mo','_b'), makePiece('mo','_c'), makePiece('zig','_a'), makePiece('pip','_a'), makePiece('bobo','_a'), makePiece('rose','_a')],
  hints:['Seven pieces! Start with the three squares.','Three squares in a row cover twelve cells perfectly.','The S-shape and L-shape cover the remaining area.'],
  maxMoves:16,
};

// C5: 5×4=20 blocked [0,0][4,0][0,3][4,3] → 16. mo(4)+zig(4)+pip(3)+bobo(3)+rose(2) = 16 ✓
const p10: Puzzle = {
  id:'crystal-5', name:'Crystal Heart', description:'Find the hidden pattern in the crystals!',
  worldId:'crystal', difficulty:'hard', cols:5, rows:4,
  blockedCells:[[0,0],[4,0],[0,3],[4,3]],
  pieces:[makePiece('mo','_a'), makePiece('zig','_a'), makePiece('pip','_a'), makePiece('bobo','_a'), makePiece('rose','_a')],
  hints:['Corners blocked again — the centre needs careful planning.','Try placing the S-shape near the top row.','The L-shape fills the awkward spots near the corners.'],
  maxMoves:14,
};

// ─── World 3: Robo Reef (hard) ────────────────────────────────
// R1: 6×4=24. mo+mo+zig+zig+pip+bobo+rose = 4+4+4+4+3+3+2 = 24 ✓
const p11: Puzzle = {
  id:'robo-1', name:'Reef Entry', description:'Welcome to the glowing Robo Reef!',
  worldId:'robo', difficulty:'hard', cols:6, rows:4, blockedCells:[],
  pieces:[makePiece('mo','_a'), makePiece('mo','_b'), makePiece('zig','_a'), makePiece('zig','_b'), makePiece('pip','_a'), makePiece('bobo','_a'), makePiece('rose','_a')],
  hints:['Two S-shapes tile beautifully in a 4×2 area.','Fill one half of the reef, then the other.','Look for where the L-shape can fill a tricky corner.'],
  maxMoves:16,
};

// R2: 4×6=24. mo+mo+zig+zig+pip+bobo+rose = 24 ✓
const p12: Puzzle = {
  id:'robo-2', name:'Coral Tower', description:'Build the coral tower high!',
  worldId:'robo', difficulty:'hard', cols:4, rows:6, blockedCells:[],
  pieces:[makePiece('mo','_a'), makePiece('mo','_b'), makePiece('zig','_a'), makePiece('zig','_b'), makePiece('pip','_a'), makePiece('bobo','_a'), makePiece('rose','_a')],
  hints:['A tall tower — think about stacking, not spreading.','Rotating pieces vertically is the key here.','Start from the bottom and build upwards.'],
  maxMoves:16,
};

// R3: 5×5=25. mo+mo+zig+pip+pip+bobo+rose+rose = 4+4+4+3+3+3+2+2 = 25 ✓
const p13: Puzzle = {
  id:'robo-3', name:'Bubble Grid', description:'Fill the perfect 5×5 bubble grid!',
  worldId:'robo', difficulty:'hard', cols:5, rows:5, blockedCells:[],
  pieces:[makePiece('mo','_a'), makePiece('mo','_b'), makePiece('zig','_a'), makePiece('pip','_a'), makePiece('pip','_b'), makePiece('bobo','_a'), makePiece('rose','_a'), makePiece('rose','_b')],
  hints:['Eight pieces for a 5×5! Take it section by section.','The two straight bugs cover a full column when vertical.','Small bugs are useful for filling leftover gaps.'],
  maxMoves:20,
};

// R4: 5×4=20 blocked [2,1][2,2] → 18. mo+mo+zig+pip+bobo = 4+4+4+3+3 = 18 ✓
const p14: Puzzle = {
  id:'robo-4', name:'Robot Core', description:"Work around the robot's core unit!",
  worldId:'robo', difficulty:'hard', cols:5, rows:4,
  blockedCells:[[2,1],[2,2]],
  pieces:[makePiece('mo','_a'), makePiece('mo','_b'), makePiece('zig','_a'), makePiece('pip','_a'), makePiece('bobo','_a')],
  hints:['The blocked centre splits the board — treat each side separately.','Two squares, one on each side of the gap, anchor the layout.','The S-shape bridges the gap area beautifully.'],
  maxMoves:14,
};

// R5: 6×4=24. mo+mo+zig+pip+pip+bobo+coach = 4+4+4+3+3+3+3 = 24 ✓
const p15: Puzzle = {
  id:'robo-5', name:'Final Circuit', description:'The ultimate Robo Reef challenge!',
  worldId:'robo', difficulty:'hard', cols:6, rows:4, blockedCells:[],
  pieces:[makePiece('mo','_a'), makePiece('mo','_b'), makePiece('zig','_a'), makePiece('pip','_a'), makePiece('pip','_b'), makePiece('bobo','_a'), makePiece('coach','_a')],
  hints:['Your final puzzle — use every skill you have learned.','Mix vertical and horizontal placements for maximum coverage.','Three straight bugs placed vertically cover an entire 3×3 area!'],
  maxMoves:18,
};

export const PUZZLES: Record<string, Puzzle> = {
  'meadow-1':p1, 'meadow-2':p2, 'meadow-3':p3, 'meadow-4':p4, 'meadow-5':p5,
  'crystal-1':p6, 'crystal-2':p7, 'crystal-3':p8, 'crystal-4':p9, 'crystal-5':p10,
  'robo-1':p11, 'robo-2':p12, 'robo-3':p13, 'robo-4':p14, 'robo-5':p15,
};

export default PUZZLES;
