import type { ParentUser, ChildProfile, ProgressRecord, LevelProgress, WorldId } from '../types';

const KEY = {
  PARENTS:   'bb_parents',
  CUR_P:     'bb_current_parent',
  CHILDREN:  'bb_children',
  CUR_C:     'bb_current_child',
  PROGRESS:  'bb_progress',
  PASSWORDS: 'bb_passwords',
};

// ─── Generic helpers ──────────────────────────────────────────
function load<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v ? (JSON.parse(v) as T) : fallback; }
  catch { return fallback; }
}
function save<T>(key: string, data: T): void {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
}

// ─── Parents ──────────────────────────────────────────────────
export function getParents(): ParentUser[] { return load<ParentUser[]>(KEY.PARENTS, []); }

export function saveParent(p: ParentUser): void {
  const list = getParents();
  const idx = list.findIndex(x => x.id === p.id);
  idx >= 0 ? (list[idx] = p) : list.push(p);
  save(KEY.PARENTS, list);
}

export function findParentByEmail(email: string): ParentUser | undefined {
  return getParents().find(p => p.email.toLowerCase() === email.toLowerCase());
}

export function getCurrentParent(): ParentUser | null {
  const id = localStorage.getItem(KEY.CUR_P);
  return id ? (getParents().find(p => p.id === id) ?? null) : null;
}

export function setCurrentParent(id: string | null): void {
  id ? localStorage.setItem(KEY.CUR_P, id) : localStorage.removeItem(KEY.CUR_P);
}

// ─── Children ─────────────────────────────────────────────────
export function getAllChildren(): ChildProfile[] { return load<ChildProfile[]>(KEY.CHILDREN, []); }

export function getChildren(parentId: string): ChildProfile[] {
  return getAllChildren().filter(c => c.parentId === parentId);
}

export function getChildById(id: string): ChildProfile | null {
  return getAllChildren().find(c => c.id === id) ?? null;
}

export function saveChild(child: ChildProfile): void {
  const list = getAllChildren();
  const idx = list.findIndex(c => c.id === child.id);
  idx >= 0 ? (list[idx] = child) : list.push(child);
  save(KEY.CHILDREN, list);
}

export function deleteChild(id: string): void {
  save(KEY.CHILDREN, getAllChildren().filter(c => c.id !== id));
}

export function getCurrentChild(): string | null {
  return localStorage.getItem(KEY.CUR_C);
}

export function setCurrentChild(id: string | null): void {
  id ? localStorage.setItem(KEY.CUR_C, id) : localStorage.removeItem(KEY.CUR_C);
}

// ─── Progress ─────────────────────────────────────────────────
function getProgressMap(): Record<string, ProgressRecord> {
  return load<Record<string, ProgressRecord>>(KEY.PROGRESS, {});
}

const EMPTY_PROGRESS = (childId: string): ProgressRecord => ({
  childId, levelProgress: {}, badges: [], totalPlayTime: 0, sessions: [], activity: [],
});

/** Returns a ProgressRecord, ensuring `activity` field exists for records saved before v0.3.0. */
export function getProgress(childId: string): ProgressRecord {
  const stored = getProgressMap()[childId];
  if (!stored) return EMPTY_PROGRESS(childId);
  // Migrate old records that lack the `activity` field
  return { ...stored, activity: stored.activity ?? [] };
}

export function saveProgress(p: ProgressRecord): void {
  const map = getProgressMap();
  map[p.childId] = p;
  save(KEY.PROGRESS, map);
}

export function recordLevelComplete(
  childId: string,
  levelId: string,
  worldId: WorldId,
  stars: number,
  moves: number,
  hintsUsed: number,
): LevelProgress {
  const progress = getProgress(childId);
  const existing = progress.levelProgress[levelId];
  const entry: LevelProgress = {
    levelId,
    worldId,
    stars:     existing ? Math.max(existing.stars, stars) : stars,
    bestMoves: existing ? Math.min(existing.bestMoves, moves) : moves,
    completedAt: new Date().toISOString(),
    hintsUsed,
  };
  progress.levelProgress[levelId] = entry;
  saveProgress(progress);
  return entry;
}

export function addBadge(childId: string, badgeId: string): void {
  const progress = getProgress(childId);
  if (!progress.badges.includes(badgeId)) {
    progress.badges.push(badgeId);
    saveProgress(progress);
  }
}

// ─── Stats helpers ────────────────────────────────────────────
export function getTotalStars(p: ProgressRecord): number {
  return Object.values(p.levelProgress).reduce((s, lp) => s + lp.stars, 0);
}

export function getPuzzlesSolved(p: ProgressRecord): number {
  return Object.values(p.levelProgress).filter(lp => lp.stars > 0).length;
}

export function getCompletedWorlds(
  p: ProgressRecord,
  worlds: { id: string; levels: { id: string }[] }[],
): string[] {
  return worlds
    .filter(w => w.levels.every(l => (p.levelProgress[l.id]?.stars ?? 0) > 0))
    .map(w => w.id);
}

// ─── Mock auth (localStorage) ─────────────────────────────────
// NOTE: Intentionally minimal obfuscation (base64 + salt) for demo/MVP.
// Replace with supabase.auth.* for any real deployment.
export function hashPassword(password: string): string {
  return btoa(unescape(encodeURIComponent(password + 'bb_2024_salt')));
}

export function setPassword(parentId: string, password: string): void {
  const map = load<Record<string, string>>(KEY.PASSWORDS, {});
  map[parentId] = hashPassword(password);
  save(KEY.PASSWORDS, map);
}

export function verifyPassword(parentId: string, password: string): boolean {
  const map = load<Record<string, string>>(KEY.PASSWORDS, {});
  return map[parentId] === hashPassword(password);
}

// ─── Utilities ────────────────────────────────────────────────
export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
