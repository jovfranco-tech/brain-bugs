import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ParentUser, ChildProfile, Screen, AvatarId, BugKind, WorldId } from '../types';
import {
  getCurrentParent, setCurrentParent, getCurrentChild, setCurrentChild,
  getChildren, saveParent, saveChild, findParentByEmail,
  setPassword, verifyPassword, generateId, getProgress, saveProgress,
  recordLevelComplete, addBadge, getTotalStars, getPuzzlesSolved,
  getCompletedWorlds, getChildById, deleteChild,
} from '../lib/storage';
import { WORLDS, getAllLevels } from '../data/worlds';
import { checkNewBadges } from '../data/badges';

// ─── Supabase integration point ───────────────────────────────
// To connect Supabase:
//   1. npm install @supabase/supabase-js
//   2. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local
//   3. Replace signUp/signIn/signOut bodies with supabase.auth.* calls
//   4. Replace localStorage calls with supabase.from('table').* calls
// All data models are designed to map 1:1 to Supabase tables.
const SUPABASE_ENABLED = !!(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
);
// TODO: if (SUPABASE_ENABLED) { const supabase = createClient(url, key); }

export interface VictoryData {
  levelId: string;
  worldId: WorldId;
  stars: number;
  moves: number;
  hintsUsed: number;
  newBadges: string[];
}

interface AppContextValue {
  // Auth
  parent: ParentUser | null;
  currentChild: ChildProfile | null;
  children: ChildProfile[];
  isLoading: boolean;
  signUp: (email: string, password: string, displayName: string) => Promise<{ error?: string }>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => void;
  // Child management
  createChildProfile: (data: { nickname: string; avatarId: AvatarId; bugCompanion: BugKind; ageRange?: string }) => ChildProfile;
  editChildProfile: (childId: string, data: Partial<Pick<ChildProfile, 'nickname' | 'avatarId' | 'bugCompanion' | 'ageRange'>>) => void;
  selectChild: (childId: string) => void;
  deleteChildProfile: (childId: string) => void;
  resetChildProgress: (childId: string) => void;
  // Navigation
  screen: Screen;
  screenParams: Record<string, string>;
  navigate: (screen: Screen, params?: Record<string, string>) => void;
  goBack: () => void;
  // Game
  getChildProgress: (childId?: string) => ReturnType<typeof getProgress>;
  completeLevel: (levelId: string, worldId: WorldId, stars: number, moves: number, hintsUsed: number) => string[];
  setCurrentLevel: (levelId: string, worldId: WorldId) => void;
  victoryData: VictoryData | null;
  setVictoryData: (d: VictoryData | null) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children: childNodes }: { children: React.ReactNode }) {
  const [parent, setParent]       = useState<ParentUser | null>(() => getCurrentParent());
  const [currentChildId, setCCI]  = useState<string | null>(() => getCurrentChild());
  const [isLoading, setIsLoading] = useState(false);
  const [screen, setScreen]       = useState<Screen>(() => {
    if (!getCurrentParent()) return 'landing';
    if (!getCurrentChild())  return 'child-select';
    return 'home';
  });
  const [screenParams, setSP]     = useState<Record<string, string>>({});
  const [history, setHistory]     = useState<Array<{ screen: Screen; params: Record<string, string> }>>([]);
  const [victoryData, setVD]      = useState<VictoryData | null>(null);

  const children: ChildProfile[] = parent ? getChildren(parent.id) : [];
  const currentChild = currentChildId ? getChildById(currentChildId) : null;

  // ─── Navigation ──────────────────────────────────────────────
  const navigate = useCallback((newScreen: Screen, params: Record<string, string> = {}) => {
    setHistory(h => [...h, { screen, params: screenParams }]);
    setScreen(newScreen);
    setSP(params);
  }, [screen, screenParams]);

  const goBack = useCallback(() => {
    const prev = history[history.length - 1];
    if (prev) {
      setScreen(prev.screen);
      setSP(prev.params);
      setHistory(h => h.slice(0, -1));
    }
  }, [history]);

  // ─── Auth ─────────────────────────────────────────────────────
  const signUp = useCallback(async (email: string, password: string, displayName: string) => {
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 350)); // simulate network
    try {
      // TODO (Supabase): const { error } = await supabase.auth.signUp({ email, password, options: { data: { displayName } } })
      if (findParentByEmail(email)) return { error: 'An account with this email already exists.' };
      if (password.length < 6)      return { error: 'Password must be at least 6 characters.' };
      const p: ParentUser = {
        id: generateId(), email: email.trim().toLowerCase(),
        displayName: displayName.trim(), createdAt: new Date().toISOString(),
      };
      saveParent(p);
      setPassword(p.id, password);
      setCurrentParent(p.id);
      setParent(p);
      setScreen('child-select');
      return {};
    } finally { setIsLoading(false); }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 350));
    try {
      // TODO (Supabase): const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      const found = findParentByEmail(email.trim());
      if (!found || !verifyPassword(found.id, password)) {
        return { error: 'Invalid email or password.' };
      }
      setCurrentParent(found.id);
      setParent(found);
      setScreen('child-select');
      return {};
    } finally { setIsLoading(false); }
  }, []);

  const signOut = useCallback(() => {
    // TODO (Supabase): await supabase.auth.signOut()
    setCurrentParent(null);
    setCurrentChild(null);
    setParent(null);
    setCCI(null);
    setScreen('landing');
    setHistory([]);
  }, []);

  // ─── Child profiles ───────────────────────────────────────────
  const createChildProfile = useCallback((data: {
    nickname: string; avatarId: AvatarId; bugCompanion: BugKind; ageRange?: string;
  }): ChildProfile => {
    if (!parent) throw new Error('No parent logged in');
    const child: ChildProfile = {
      id: generateId(), parentId: parent.id,
      nickname: data.nickname.trim(), avatarId: data.avatarId,
      bugCompanion: data.bugCompanion,
      ageRange: data.ageRange as ChildProfile['ageRange'],
      createdAt: new Date().toISOString(),
      totalStars: 0, totalXP: 0, currentLevel: 1, currentWorld: 'meadow',
    };
    saveChild(child);
    return child;
  }, [parent]);

  const editChildProfile = useCallback((
    childId: string,
    data: Partial<Pick<ChildProfile, 'nickname' | 'avatarId' | 'bugCompanion' | 'ageRange'>>,
  ) => {
    const child = getChildById(childId);
    if (child) saveChild({ ...child, ...data });
  }, []);

  const selectChild = useCallback((childId: string) => {
    setCurrentChild(childId);
    setCCI(childId);
    setScreen('home');
    setHistory([]);
  }, []);

  const deleteChildProfile = useCallback((childId: string) => {
    deleteChild(childId);
    if (currentChildId === childId) {
      setCurrentChild(null);
      setCCI(null);
    }
  }, [currentChildId]);

  const resetChildProgress = useCallback((childId: string) => {
    const child = getChildById(childId);
    if (!child) return;
    saveProgress({
      childId, levelProgress: {}, badges: [],
      totalPlayTime: 0, sessions: [], activity: [],
    });
    saveChild({ ...child, totalStars: 0, totalXP: 0, currentLevel: 1, currentWorld: 'meadow' });
  }, []);

  // ─── Game progress ────────────────────────────────────────────
  const getChildProgress = useCallback((childId?: string) => {
    const id = childId ?? currentChildId;
    if (!id) throw new Error('No child selected');
    return getProgress(id);
  }, [currentChildId]);

  const setCurrentLevel = useCallback((_levelId: string, _worldId: WorldId) => {
    // stored in screenParams via navigate() — kept for API compatibility
  }, []);

  const completeLevel = useCallback((
    levelId: string, worldId: WorldId,
    stars: number, moves: number, hintsUsed: number,
  ): string[] => {
    if (!currentChildId) return [];

    const preBadges = getProgress(currentChildId).badges.slice();

    // Persist level completion (preserves best stars/moves)
    recordLevelComplete(currentChildId, levelId, worldId, stars, moves, hintsUsed);

    const child = getChildById(currentChildId);
    if (!child) return [];

    const updated = getProgress(currentChildId);
    const totalStarsEarned = getTotalStars(updated);
    const puzzlesSolved    = getPuzzlesSolved(updated);
    const completedWorlds  = getCompletedWorlds(updated, WORLDS);

    // Collect new badges
    const candidates = checkNewBadges(preBadges, totalStarsEarned, puzzlesSolved, completedWorlds);

    // Externally-triggered badge conditions
    if (stars === 3 && !preBadges.includes('perfect-solve'))   candidates.push('perfect-solve');
    if (stars > 0  && !preBadges.includes('first-solve'))      candidates.push('first-solve');
    if (hintsUsed === 0 && stars > 0 && !preBadges.includes('crystal-explorer')) candidates.push('crystal-explorer');

    const uniqueNew = [...new Set(candidates)].filter(bid => !preBadges.includes(bid));
    uniqueNew.forEach(bid => addBadge(currentChildId, bid));

    // Advance child's currentLevel / currentWorld pointer
    const allLevels = getAllLevels();
    const curLevelIdx = allLevels.findIndex(l => l.id === levelId);
    const nextLevel = allLevels[curLevelIdx + 1];
    const updatedChild: ChildProfile = {
      ...child,
      totalStars: totalStarsEarned,
      totalXP: totalStarsEarned * 10,
    };
    if (nextLevel && totalStarsEarned >= nextLevel.requiredStars) {
      updatedChild.currentLevel = nextLevel.number;
      updatedChild.currentWorld = nextLevel.worldId;
    }
    saveChild(updatedChild);

    return uniqueNew;
  }, [currentChildId]);

  const value: AppContextValue = {
    parent, currentChild, children, isLoading,
    signUp, signIn, signOut,
    createChildProfile, editChildProfile, selectChild, deleteChildProfile, resetChildProgress,
    screen, screenParams, navigate, goBack,
    getChildProgress, completeLevel, setCurrentLevel,
    victoryData, setVictoryData: setVD,
  };

  return <AppContext.Provider value={value}>{childNodes}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

// Re-export for convenience
export { SUPABASE_ENABLED };
