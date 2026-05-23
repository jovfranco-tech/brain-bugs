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
import { auth, db, isFirebaseEnabled } from '../lib/firebase';
import { sound } from '../lib/sound';
import { TRANSLATIONS } from '../data/translations';

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User as FirebaseUser
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';

const FIREBASE_ENABLED = isFirebaseEnabled();

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
    unlockedAccessories: row.unlocked_accessories || [],
    activeAccessoryId: row.active_accessory_id || null,
    dailyTimeLimit: row.daily_time_limit || 0,
    themeColor: row.theme_color || 'purple',
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
    unlocked_accessories: c.unlockedAccessories || [],
    active_accessory_id: c.activeAccessoryId || null,
    daily_time_limit: c.dailyTimeLimit || 0,
    theme_color: c.themeColor || 'purple',
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
  createChildProfile: (data: { nickname: string; avatarId: AvatarId; bugCompanion: BugKind; ageRange?: string; themeColor?: 'purple' | 'blue' | 'yellow' | 'green' }) => ChildProfile;
  editChildProfile: (childId: string, data: Partial<Pick<ChildProfile, 'nickname' | 'avatarId' | 'bugCompanion' | 'ageRange' | 'themeColor'>>) => void;
  selectChild: (childId: string) => void;
  deleteChildProfile: (childId: string) => void;
  resetChildProgress: (childId: string) => void;
  updateChildThemeColor: (childId: string, color: 'purple' | 'blue' | 'yellow' | 'green') => void;
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
  unlockAccessory: (childId: string, accessoryId: string, costXP: number) => void;
  equipAccessory: (childId: string, accessoryId: string | null) => void;
  // Screen time control
  screenTimeRemaining: number | null;
  isScreenTimeLocked: boolean;
  updateChildTimeLimit: (childId: string, limitMinutes: number) => void;
  // i18n
  language: 'es' | 'en';
  setLanguage: (lang: 'es' | 'en') => void;
  t: (key: string) => string;
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
  const [screenTimeRemaining, setScreenTimeRemaining] = useState<number | null>(null);
  const [isScreenTimeLocked, setIsScreenTimeLocked] = useState(false);

  const [language, setLangState] = useState<'es' | 'en'>(() => {
    const saved = localStorage.getItem('bb_language');
    if (saved === 'en' || saved === 'es') return saved;
    const sysLang = navigator.language || '';
    return sysLang.startsWith('en') ? 'en' : 'es';
  });

  const setLanguage = useCallback((lang: 'es' | 'en') => {
    localStorage.setItem('bb_language', lang);
    setLangState(lang);
  }, []);

  const t = useCallback((key: string): string => {
    const dict = TRANSLATIONS[language] || TRANSLATIONS.es;
    return (dict as any)[key] || key;
  }, [language]);

  // Screen time countdown timer
  useEffect(() => {
    if (screenTimeRemaining === null || isScreenTimeLocked) return;
    if (screenTimeRemaining <= 0) {
      setIsScreenTimeLocked(true);
      return;
    }
    const timer = setInterval(() => {
      setScreenTimeRemaining(prev => {
        if (prev === null) return null;
        if (prev <= 1) {
          setIsScreenTimeLocked(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [screenTimeRemaining, isScreenTimeLocked]);

  // Initialize timer on load/profile select
  useEffect(() => {
    if (currentChildId) {
      const child = childrenList.find(c => c.id === currentChildId);
      if (child && child.dailyTimeLimit && child.dailyTimeLimit > 0) {
        setScreenTimeRemaining(child.dailyTimeLimit * 60);
        setIsScreenTimeLocked(false);
      } else {
        setScreenTimeRemaining(null);
        setIsScreenTimeLocked(false);
      }
    } else {
      setScreenTimeRemaining(null);
      setIsScreenTimeLocked(false);
    }
  }, [currentChildId, childrenList]);

  const currentChild = currentChildId ? (childrenList.find(c => c.id === currentChildId) ?? null) : null;

  // ─── Listen to Firebase auth changes reactively ──────────────
  useEffect(() => {
    if (!auth || !db) return;

    const syncSession = async (firebaseUser: FirebaseUser) => {
      setIsLoading(true);
      try {
        const parentDocRef = doc(db, 'parents', firebaseUser.uid);
        const parentDocSnap = await getDoc(parentDocRef);

        let dbParent: any = null;

        if (!parentDocSnap.exists()) {
          const newParent = {
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            display_name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Padre',
            created_at: new Date().toISOString(),
          };
          await setDoc(parentDocRef, newParent);
          dbParent = newParent;
        } else {
          dbParent = parentDocSnap.data();
        }

        // Query children collection in Firestore
        const childrenQuery = query(collection(db, 'children'), where('parent_id', '==', firebaseUser.uid));
        const childrenQuerySnap = await getDocs(childrenQuery);
        const dbChildren = childrenQuerySnap.docs.map(d => d.data());

        const childrenList = dbChildren ? dbChildren.map(mapChildToLocal) : [];

        if (childrenList.length > 0) {
          const progressMap = getProgressMap();
          
          // Get all children's progress docs in Firestore in parallel
          await Promise.all(
            childrenList.map(async (c) => {
              const progressDocRef = doc(db, 'progress', c.id);
              const progressDocSnap = await getDoc(progressDocRef);
              if (progressDocSnap.exists()) {
                const row = progressDocSnap.data();
                progressMap[c.id] = mapProgressToLocal(row);
              }
            })
          );
          
          saveProgressMap(progressMap);
        }

        const localParent = mapParentToLocal(dbParent);
        saveParent(localParent);
        setCurrentParent(localParent.id);

        const otherChildren = getAllChildren().filter(c => c.parentId !== localParent.id);
        saveAllChildren([...otherChildren, ...childrenList]);

        setParent(localParent);
        setChildrenList(childrenList);

        // Cambiar de pantalla al selector de niños si venimos de landing, login o signup
        setScreen((prevScreen) => {
          if (prevScreen === 'landing' || prevScreen === 'login' || prevScreen === 'signup') {
            return 'child-select';
          }
          return prevScreen;
        });
      } catch (err) {
        console.error('Error syncing Firebase session:', err);
      } finally {
        setIsLoading(false);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await syncSession(firebaseUser);
      } else {
        setParent(null);
        setChildrenList([]);
        setCCI(null);
        setCurrentParent(null);
        setCurrentChild(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // ─── Navigation ──────────────────────────────────────────────
  const navigate = useCallback((newScreen: Screen, params: Record<string, string> = {}) => {
    sound.playClick();
    setHistory(h => [...h, { screen, params: screenParams }]);
    setScreen(newScreen);
    setSP(params);
  }, [screen, screenParams]);

  const goBack = useCallback(() => {
    sound.playClick();
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
      if (auth && db) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;
        
        const p: ParentUser = {
          id: firebaseUser.uid,
          email: email.trim().toLowerCase(),
          displayName: displayName.trim(),
          createdAt: new Date().toISOString(),
        };

        // Save in Firestore parents collection
        await setDoc(doc(db, 'parents', p.id), {
          id: p.id,
          email: p.email,
          display_name: p.displayName,
          created_at: p.createdAt
        });
        
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
    } catch (error: any) {
      return { error: error.message };
    } finally { setIsLoading(false); }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      if (auth && db) {
        await signInWithEmailAndPassword(auth, email, password);
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
    } catch (error: any) {
      return { error: error.message };
    } finally { setIsLoading(false); }
  }, []);

  const signOut = useCallback(async () => {
    if (auth) {
      await firebaseSignOut(auth);
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
    nickname: string; avatarId: AvatarId; bugCompanion: BugKind; ageRange?: string; themeColor?: 'purple' | 'blue' | 'yellow' | 'green';
  }): ChildProfile => {
    if (!parent) throw new Error('No parent logged in');
    const child: ChildProfile = {
      id: generateId(), parentId: parent.id,
      nickname: data.nickname.trim(), avatarId: data.avatarId,
      bugCompanion: data.bugCompanion,
      ageRange: data.ageRange as ChildProfile['ageRange'],
      createdAt: new Date().toISOString(),
      totalStars: 0, totalXP: 0, currentLevel: 1, currentWorld: 'meadow',
      themeColor: data.themeColor || 'purple',
    };
    saveChild(child);
    setChildrenList(prev => [...prev, child]);

    if (db) {
      setDoc(doc(db, 'children', child.id), mapChildToDb(child))
        .catch(error => console.error('Error inserting child:', error));

      const initialProg: ProgressRecord = {
        childId: child.id, levelProgress: {}, badges: [], totalPlayTime: 0, sessions: [], activity: [],
      };
      setDoc(doc(db, 'progress', child.id), mapProgressToDb(initialProg))
        .catch(error => console.error('Error inserting progress:', error));
    }
    return child;
  }, [parent]);

  const editChildProfile = useCallback((
    childId: string,
    data: Partial<Pick<ChildProfile, 'nickname' | 'avatarId' | 'bugCompanion' | 'ageRange' | 'themeColor'>>,
  ) => {
    const child = getChildById(childId);
    if (child) {
      const updated = { ...child, ...data };
      saveChild(updated);
      setChildrenList(prev => prev.map(c => c.id === childId ? updated : c));

      if (db) {
        updateDoc(doc(db, 'children', childId), mapChildToDb(updated))
          .catch(error => console.error('Error updating child:', error));
      }
    }
  }, []);

  const updateChildThemeColor = useCallback((childId: string, color: 'purple' | 'blue' | 'yellow' | 'green') => {
    const child = getChildById(childId);
    if (child) {
      const updated: ChildProfile = {
        ...child,
        themeColor: color,
      };
      saveChild(updated);
      setChildrenList(prev => prev.map(c => c.id === childId ? updated : c));

      if (db) {
        updateDoc(doc(db, 'children', childId), mapChildToDb(updated))
          .catch(error => console.error('Error updating child theme color:', error));
      }
    }
  }, []);

  const selectChild = useCallback((childId: string) => {
    setCurrentChild(childId);
    setCCI(childId);
    setScreen('home');
    setHistory([]);
    sound.startMusic();
  }, []);


  const deleteChildProfile = useCallback((childId: string) => {
    deleteChild(childId);
    setChildrenList(prev => prev.filter(c => c.id !== childId));
    if (currentChildId === childId) {
      setCurrentChild(null);
      setCCI(null);
    }

    if (db) {
      deleteDoc(doc(db, 'children', childId))
        .catch(error => console.error('Error deleting child:', error));
      deleteDoc(doc(db, 'progress', childId))
        .catch(error => console.error('Error deleting progress:', error));
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
      totalStars: 0, totalXP: 0, currentLevel: 1, currentWorld: 'meadow',
      unlockedAccessories: [], activeAccessoryId: null
    };
    saveChild(updatedChild);
    setChildrenList(prev => prev.map(c => c.id === childId ? updatedChild : c));

    if (db) {
      setDoc(doc(db, 'progress', childId), mapProgressToDb(emptyProg))
        .catch(error => console.error('Error resetting progress:', error));
      updateDoc(doc(db, 'children', childId), mapChildToDb(updatedChild))
        .catch(error => console.error('Error resetting child stats:', error));
    }
  }, []);

  const unlockAccessory = useCallback((childId: string, accessoryId: string, costXP: number) => {
    const child = getChildById(childId);
    if (!child) return;

    if (child.totalXP < costXP) return;
    const unlocked = child.unlockedAccessories || [];
    if (unlocked.includes(accessoryId)) return;

    const updatedChild: ChildProfile = {
      ...child,
      totalXP: child.totalXP - costXP,
      unlockedAccessories: [...unlocked, accessoryId],
      activeAccessoryId: accessoryId,
    };

    saveChild(updatedChild);
    setChildrenList(prev => prev.map(c => c.id === childId ? updatedChild : c));

    if (db) {
      updateDoc(doc(db, 'children', childId), mapChildToDb(updatedChild))
        .catch(error => console.error('Error unlocking accessory:', error));
    }
  }, []);

  const equipAccessory = useCallback((childId: string, accessoryId: string | null) => {
    const child = getChildById(childId);
    if (!child) return;

    const updatedChild: ChildProfile = {
      ...child,
      activeAccessoryId: accessoryId,
    };

    saveChild(updatedChild);
    setChildrenList(prev => prev.map(c => c.id === childId ? updatedChild : c));

    if (db) {
      updateDoc(doc(db, 'children', childId), mapChildToDb(updatedChild))
        .catch(error => console.error('Error equipping accessory:', error));
    }
  }, []);

  const updateChildTimeLimit = useCallback((childId: string, limitMinutes: number) => {
    const child = getChildById(childId);
    if (child) {
      const updated: ChildProfile = {
        ...child,
        dailyTimeLimit: limitMinutes,
      };
      saveChild(updated);
      setChildrenList(prev => prev.map(c => c.id === childId ? updated : c));

      if (currentChildId === childId) {
        if (limitMinutes > 0) {
          setScreenTimeRemaining(limitMinutes * 60);
          setIsScreenTimeLocked(false);
        } else {
          setScreenTimeRemaining(null);
          setIsScreenTimeLocked(false);
        }
      }

      if (db) {
        updateDoc(doc(db, 'children', childId), mapChildToDb(updated))
          .catch(error => console.error('Error updating child time limit:', error));
      }
    }
  }, [currentChildId]);


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

    if (db) {
      const finalProg = getProgress(currentChildId);
      setDoc(doc(db, 'progress', currentChildId), mapProgressToDb(finalProg))
        .catch(error => console.error('Error saving progress:', error));
      updateDoc(doc(db, 'children', currentChildId), mapChildToDb(updatedChild))
        .catch(error => console.error('Error updating child stats:', error));
    }

    return uniqueNew;
  }, [currentChildId]);

  const value: AppContextValue = {
    parent, currentChild, children: childrenList, isLoading,
    signUp, signIn, signOut,
    createChildProfile, editChildProfile, selectChild, deleteChildProfile, resetChildProgress, updateChildThemeColor,
    screen, screenParams, navigate, goBack,
    getChildProgress, completeLevel, setCurrentLevel,
    victoryData, setVictoryData: setVD,
    unlockAccessory, equipAccessory,
    screenTimeRemaining, isScreenTimeLocked, updateChildTimeLimit,
    language, setLanguage, t
  };

  return <AppContext.Provider value={value}>{childNodes}</AppContext.Provider>;
}

export const THEME_PALETTES = {
  purple: { primary: '#8E6BFF', dark: '#5A3BD1', glow: 'rgba(142,107,255,0.4)', text: '#8E6BFF', bgGradient: 'linear-gradient(180deg,#8E6BFF,#5A3BD1)' },
  blue: { primary: '#5BC5FF', dark: '#2890D0', glow: 'rgba(91,197,255,0.4)', text: '#5BC5FF', bgGradient: 'linear-gradient(180deg,#5BC5FF,#2890D0)' },
  yellow: { primary: '#FFC83D', dark: '#B97808', glow: 'rgba(255,200,61,0.4)', text: '#FFC83D', bgGradient: 'linear-gradient(180deg,#FFC83D,#B97808)' },
  green: { primary: '#3FD09E', dark: '#1F9A6E', glow: 'rgba(63,208,158,0.4)', text: '#3FD09E', bgGradient: 'linear-gradient(180deg,#3FD09E,#1F9A6E)' },
};

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export { FIREBASE_ENABLED };
