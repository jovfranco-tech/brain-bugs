// ─── Core primitive types ─────────────────────────────────────
export type BugKind  = 'pip' | 'bobo' | 'zig' | 'mo' | 'rose' | 'coach';
export type AvatarId = 'buzzy' | 'pip' | 'bobo' | 'zig' | 'mo' | 'rose';
export type WorldId  = 'meadow' | 'crystal' | 'robo' | 'ocean' | 'volcano' | 'space';
export type Difficulty = 'easy' | 'medium' | 'hard';

// ─── Auth ─────────────────────────────────────────────────────
export interface AuthState {
  isAuthenticated: boolean;
  parent: ParentUser | null;
  isLoading: boolean;
  error: string | null;
  // Supabase-ready: session?: import('@supabase/supabase-js').Session | null;
}

// ─── Users ────────────────────────────────────────────────────
export interface ParentUser {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
  // Supabase-ready: avatarUrl?: string;
}

export interface ChildProfile {
  id: string;
  parentId: string;
  nickname: string;
  avatarId: AvatarId;
  bugCompanion: BugKind;
  ageRange?: '5-6' | '7-8' | '9+';
  createdAt: string;
  totalStars: number;
  totalXP: number;
  currentLevel: number;
  currentWorld: WorldId;
  unlockedAccessories?: string[];
  activeAccessoryId?: string | null;
  dailyTimeLimit?: number; // In minutes, optional/undefined if unlimited
}

// ─── World & Level ────────────────────────────────────────────
export interface World {
  id: WorldId;
  name: string;
  description: string;
  emoji: string;
  bgGradient: string;
  accentColor: string;
  levels: Level[];
  requiredStars: number;
}

export interface Level {
  id: string;
  worldId: WorldId;
  number: number;
  name: string;
  puzzleId: string;
  maxStars: 3;
  requiredStars: number;
}

// ─── Puzzle ───────────────────────────────────────────────────
export interface Puzzle {
  id: string;
  name: string;
  description: string;
  worldId: WorldId;
  difficulty: Difficulty;
  cols: number;
  rows: number;
  blockedCells: [number, number][]; // [col, row]
  bugLocks?: [number, number, BugKind][]; // Optional: [col, row, bugKind] lock
  pieces: PuzzlePiece[];
  hints: string[];
  maxMoves: number;
}

export interface PuzzlePiece {
  id: string;
  kind: BugKind;
  name: string;
  color: string;
  darkColor: string;
  lightColor: string;
  shape: [number, number][];  // [col, row] offsets from top-left of bounding box
}

// ─── Game state ───────────────────────────────────────────────
export interface BoardCell {
  col: number;
  row: number;
  blocked: boolean;
  pieceId: string | null;
  bugLock?: BugKind;
}

export interface Placement {
  pieceId: string;
  col: number;
  row: number;
  rotation: 0 | 1 | 2 | 3;
  shape: [number, number][];
}

export interface GameState {
  puzzle: Puzzle;
  board: BoardCell[][];
  placements: Placement[];
  availablePieces: string[];
  moves: number;
  hintsUsed: number;
  startedAt: number;
  solved: boolean;
}

// ─── Progress & Activity ──────────────────────────────────────
export interface LevelProgress {
  levelId: string;
  worldId: WorldId;
  stars: number;
  bestMoves: number;
  completedAt: string;
  hintsUsed: number;
}

export interface ActivityEvent {
  id: string;
  childId: string;
  type: 'level_complete' | 'badge_unlock' | 'world_unlock' | 'session_start' | 'session_end';
  payload: Record<string, unknown>;
  timestamp: string;
}

export interface SessionRecord {
  date: string;
  duration: number;     // seconds
  puzzlesSolved: number;
  starsEarned: number;
}

export interface ProgressRecord {
  childId: string;
  levelProgress: Record<string, LevelProgress>;
  badges: string[];
  totalPlayTime: number;   // seconds
  sessions: SessionRecord[];
  activity: ActivityEvent[];
}

export interface SkillMetric {
  id: 'logical_thinking' | 'problem_solving' | 'spatial_awareness' | 'persistence';
  name: string;
  description: string;
  value: number;  // 0–100
  color: string;
}

// ─── Badges ───────────────────────────────────────────────────
export interface Badge {
  id: string;
  name: string;
  description: string;
  condition: string;     // human-readable unlock hint
  emoji: string;
  color: string;
  darkColor: string;
  requiresStars?: number;
  requiresPuzzles?: number;
  requiresWorld?: WorldId;
}

// ─── Navigation ───────────────────────────────────────────────
export type Screen =
  | 'landing'
  | 'login'
  | 'signup'
  | 'child-select'
  | 'child-create'
  | 'home'
  | 'world-map'
  | 'level-select'
  | 'gameplay'
  | 'victory'
  | 'rewards'
  | 'parent-dashboard'
  | 'settings'
  | 'bug-lab'
  | 'accessory-store';

export interface NavState {
  screen: Screen;
  params: Record<string, string>;
}
