import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { ParentUser, ChildProfile, Screen, AvatarId, BugKind, WorldId, ProgressRecord } from '../types';
import {
  getCurrentParent, setCurrentParent, getCurrentChild, setCurrentChild,
  getChildren, saveParent, saveChild, findParentByEmail,
  setPassword, verifyPassword, generateId, getProgress, saveProgress,
  recordLevelComplete, addBadge, getTotalStars, getPuzzlesSolved,
  getCompletedWorlds, getChildById, deleteChild, getAllChildren,
  saveAllChildren, getProgressMap, saveProgressMap,
} from '../lib/storage';
import { WORLDS, getAllLevels } from '../data/worlds';
import { checkNewBadges } from '../data/badges';
import { supabase, isSupabaseEnabled } from '../lib/supabase';

const SUPABASE_ENABLED = isSupabaseEnabled();

// ─── SQL to App type mappers ─────────────────────────────────
function mapParentToLocal(row: any): ParentUser {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    createdAt: row.created_at,
  };
}

function mapChildToLocal(row: any): ChildProfile {
  return {
    id: row.id,
    parentId: row.parent_id,
    nickname: row.nickname,
    avatarId: row.avatar_id as AvatarId,
    bugCompanion: row.bug_companion as BugKind,
    ageRange: row.age_range || undefined,
    createdAt: row.created_at,
    totalStars: row.total_stars,
    totalXP: row.total_xp,
    currentLevel: row.current_level,
    currentWorld: row.current_world as WorldId,
  };
}

function mapChildToDb(c: ChildProfile) {
  return {
    id: c.id,
    parent_id: c.parentId,
    nickname: c.nickname,
    avatar_id: c.avatarId,
    bug_companion: c.bugCompanion,
    age_range: c.ageRange || null,
    created_at: c.createdAt,
    total_stars: c.totalStars,
    total_xp: c.totalXP,
    current_level: c.currentLevel,
    current_world: c.currentWorld,
  };
}

function mapProgressToLocal(row: any): ProgressRecord {
  return {
    childId: row.child_id,
    levelProgress: row.level_progress,
    badges: row.badges,
    totalPlayTime: row.total_play_time,
    sessions: row.sessions,
    activity: row.activity,
  };
}

function mapProgressToDb(p: ProgressRecord) {
  return {
    child_id: p.childId,
    level_progress: p.levelProgress,
    badges: p.badges,
    total_play_time: p.totalPlayTime,
    sessions: p.sessions,
    activity: p.activity,
  };
}

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
  const [parent, setParent]             = useState<ParentUser | null>(() => getCurrentParent());
  const [childrenList, setChildrenList] = useState<ChildProfile[]>(() => parent ? getChildren(parent.id) : []);
  const [currentChildId, setCCI]        = useState<string | null>(() => getCurrentChild());
  const [isLoading, setIsLoading]       = useState(false);
  const [screen, setScreen]             = useState<Screen>(() => {
    if (!getCurrentParent()) return 'landing';
    if (!getCurrentChild())  return 'child-select';
    return 'home';
  });
  const [screenParams, setSP]           = useState<Record<string, string>>({});
  const [history, setHistory]           = useState<Array<{ screen: Screen; params: Record<string, string> }>>([]);
  const [victoryData, setVD]            = useState<VictoryData | null>(null);

  const currentChild = currentChildId ? (childrenList.find(c => c.id === currentChildId) ?? null) : null;

  // ─── Listen to Supabase auth changes reactively ──────────────
  useEffect(() => {
    if (!supabase) return;

    const syncSession = async (user: any) => {
      setIsLoading(true);
      try {
        let { data: dbParent } = await supabase
          .from('parents')
          .select('*')
          .eq('id', user.id)
          .single();

        if (!dbParent) {
          const newParent = {
            id: user.id,
            email: user.email || '',
            display_name: user.user_metadata?.displayName || user.email?.split('@')[0] || 'Padre',
            created_at: new Date().toISOString(),
          };
          await supabase.from('parents').insert(newParent);
          dbParent = newParent;
        }

        const { data: dbChildren } = await supabase
          .from('children')
          .select('*')
          .eq('parent_id', user.id);

        const childrenList = dbChildren ? dbChildren.map(mapChildToLocal) : [];

        if (childrenList.length > 0) {
          const childIds = childrenList.map(c => c.id);
          const { data: dbProgress } = await supabase
            .from('progress')
            .select('*')
            .in('child_id', childIds);

          if (dbProgress) {
            const progressMap = getProgressMap();
            dbProgress.forEach(row => {
              progressMap[row.child_id] = mapProgressToLocal(row);
            });
            saveProgressMap(progressMap);
          }
        }

        const localParent = mapParentToLocal(dbParent);
        saveParent(localParent);
        setCurrentParent(localParent.id);

        const otherChildren = getAllChildren().filter(c => c.parentId !== localParent.id);
        saveAllChildren([...otherChildren, ...childrenList]);

        setParent(localParent);
        setChildrenList(childrenList);
      } catch (err) {
        console.error('Error syncing Supabase session:', err);
      } finally {
        setIsLoading(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await syncSession(session.user);
      } else {
        setParent(null);
        setChildrenList([]);
        setCCI(null);
        setCurrentParent(null);
        setCurrentChild(null);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        syncSession(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

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
    try {
      if (supabase) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { displayName } }
        });
        if (error) return { error: error.message };
        if (data.user) {
          const p: ParentUser = {
            id: data.user.id,
            email: email.trim().toLowerCase(),
            displayName: displayName.trim(),
            createdAt: new Date().toISOString(),
          };
          await supabase.from('parents').insert({
            id: p.id,
            email: p.email,
            display_name: p.displayName,
            created_at: p.createdAt
          });
        }
        return {};
      } else {
        await new Promise(r => setTimeout(r, 350));
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
        setChildrenList([]);
        setScreen('child-select');
        return {};
      }
    } finally { setIsLoading(false); }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      if (supabase) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return { error: error.message };
        return {};
      } else {
        await new Promise(r => setTimeout(r, 350));
        const found = findParentByEmail(email.trim());
        if (!found || !verifyPassword(found.id, password)) {
          return { error: 'Invalid email or password.' };
        }
        setCurrentParent(found.id);
        setParent(found);
        setChildrenList(getChildren(found.id));
        setScreen('child-select');
        return {};
      }
    } finally { setIsLoading(false); }
  }, []);

  const signOut = useCallback(async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setCurrentParent(null);
    setCurrentChild(null);
    setParent(null);
    setChildrenList([]);
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
    setChildrenList(prev => [...prev, child]);

    if (supabase) {
      supabase.from('children').insert(mapChildToDb(child))
        .then(({ error }) => { if (error) console.error('Error inserting child:', error); });

      const initialProg: ProgressRecord = {
        childId: child.id, levelProgress: {}, badges: [], totalPlayTime: 0, sessions: [], activity: [],
      };
      supabase.from('progress').insert(mapProgressToDb(initialProg))
        .then(({ error }) => { if (error) console.error('Error inserting progress:', error); });
    }
    return child;
  }, [parent]);

  const editChildProfile = useCallback((
    childId: string,
    data: Partial<Pick<ChildProfile, 'nickname' | 'avatarId' | 'bugCompanion' | 'ageRange'>>,
  ) => {
    const child = getChildById(childId);
    if (child) {
      const updated = { ...child, ...data };
      saveChild(updated);
      setChildrenList(prev => prev.map(c => c.id === childId ? updated : c));

      if (supabase) {
        supabase.from('children').update(mapChildToDb(updated)).eq('id', childId)
          .then(({ error }) => { if (error) console.error('Error updating child:', error); });
      }
    }
  }, []);

  const selectChild = useCallback((childId: string) => {
    setCurrentChild(childId);
    setCCI(childId);
    setScreen('home');
    setHistory([]);
  }, []);

  const deleteChildProfile = useCallback((childId: string) => {
    deleteChild(childId);
    setChildrenList(prev => prev.filter(c => c.id !== childId));
    if (currentChildId === childId) {
      setCurrentChild(null);
      setCCI(null);
    }

    if (supabase) {
      supabase.from('children').delete().eq('id', childId)
        .then(({ error }) => { if (error) console.error('Error deleting child:', error); });
    }
  }, [currentChildId]);

  const resetChildProgress = useCallback((childId: string) => {
    const child = getChildById(childId);
    if (!child) return;

    const emptyProg = {
      childId, levelProgress: {}, badges: [],
      totalPlayTime: 0, sessions: [], activity: [],
    };
    saveProgress(emptyProg);

    const updatedChild: ChildProfile = {
      ...child,
      totalStars: 0, totalXP: 0, currentLevel: 1, currentWorld: 'meadow'
    };
    saveChild(updatedChild);
    setChildrenList(prev => prev.map(c => c.id === childId ? updatedChild : c));

    if (supabase) {
      supabase.from('progress').upsert(mapProgressToDb(emptyProg))
        .then(({ error }) => { if (error) console.error('Error resetting progress:', error); });
      supabase.from('children').update(mapChildToDb(updatedChild)).eq('id', childId)
        .then(({ error }) => { if (error) console.error('Error resetting child stats:', error); });
    }
  }, []);

  // ─── Game progress ────────────────────────────────────────────
  const getChildProgress = useCallback((childId?: string) => {
    const id = childId ?? currentChildId;
    if (!id) throw new Error('No child selected');
    return getProgress(id);
  }, [currentChildId]);

  const setCurrentLevel = useCallback((_levelId: string, _worldId: WorldId) => {
    // stored in screenParams via navigate()
  }, []);

  const completeLevel = useCallback((
    levelId: string, worldId: WorldId,
    stars: number, moves: number, hintsUsed: number,
  ): string[] => {
    if (!currentChildId) return [];

    const preBadges = getProgress(currentChildId).badges.slice();

    recordLevelComplete(currentChildId, levelId, worldId, stars, moves, hintsUsed);

    const child = getChildById(currentChildId);
    if (!child) return [];

    const isDaily = levelId.startsWith('daily-');

    const updated = getProgress(currentChildId);
    const totalStarsEarned = getTotalStars(updated);
    const puzzlesSolved    = getPuzzlesSolved(updated);
    const completedWorlds  = getCompletedWorlds(updated, WORLDS);

    const candidates = checkNewBadges(preBadges, totalStarsEarned, puzzlesSolved, completedWorlds);

    if (stars === 3 && !preBadges.includes('perfect-solve'))   candidates.push('perfect-solve');
    if (stars > 0  && !preBadges.includes('first-solve'))      candidates.push('first-solve');
    if (hintsUsed === 0 && stars > 0 && !preBadges.includes('crystal-explorer')) candidates.push('crystal-explorer');
    if (isDaily && stars > 0 && !preBadges.includes('daily-challenge')) candidates.push('daily-challenge');

    const uniqueNew = [...new Set(candidates)].filter(bid => !preBadges.includes(bid));
    uniqueNew.forEach(bid => addBadge(currentChildId, bid));

    const allLevels = getAllLevels();
    const curLevelIdx = allLevels.findIndex(l => l.id === levelId);
    const nextLevel = allLevels[curLevelIdx + 1];

    const xpGain = isDaily ? 20 : (stars * 10);

    const updatedChild: ChildProfile = {
      ...child,
      totalStars: totalStarsEarned,
      totalXP: (child.totalXP ?? 0) + xpGain,
    };
    if (nextLevel && totalStarsEarned >= nextLevel.requiredStars && !isDaily) {
      updatedChild.currentLevel = nextLevel.number;
      updatedChild.currentWorld = nextLevel.worldId;
    }
    saveChild(updatedChild);

    setChildrenList(prev => prev.map(c => c.id === currentChildId ? updatedChild : c));

    if (supabase) {
      const finalProg = getProgress(currentChildId);
      supabase.from('progress').upsert(mapProgressToDb(finalProg))
        .then(({ error }) => { if (error) console.error('Error saving progress:', error); });
      supabase.from('children').update(mapChildToDb(updatedChild)).eq('id', currentChildId)
        .then(({ error }) => { if (error) console.error('Error updating child stats:', error); });
    }

    return uniqueNew;
  }, [currentChildId]);

  const value: AppContextValue = {
    parent, currentChild, children: childrenList, isLoading,
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

export { SUPABASE_ENABLED };
