import React, { useState, useEffect } from 'react';
import StarRating from '../components/StarRating';
import BugSvg from '../components/BugSvg';
import BottomNav from '../components/BottomNav';
import { useApp } from '../contexts/AppContext';
import { BADGES, BADGE_MAP } from '../data/badges';
import { getProgress, getTotalStars, getPuzzlesSolved } from '../lib/storage';
import { getAllLevels } from '../data/worlds';
import { sound } from '../lib/sound';
import confetti from 'canvas-confetti';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, collection } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Confetti particle ────────────────────────────────────────
function Confetti({ count = 28 }: { count?: number }) {
  const colors = ['#FFC83D','#3FD09E','#8E6BFF','#FF7B5C','#5BC5FF','#FF6FA8'];
  return (
    <>
      {Array.from({length:count}).map((_,i) => {
        const x = Math.random()*100, delay = Math.random()*0.8, dur = 1.4+Math.random()*0.8;
        const color = colors[i % colors.length];
        const rot = Math.random()*360;
        return (
          <div key={i} className="absolute pointer-events-none"
            style={{
              left:`${x}%`, top:'-8px',
              width: 8+(i%3)*3, height: 8+(i%3)*3,
              background: color, borderRadius: i%3===0?'50%':i%3===1?'2px':'50% 0',
              transform:`rotate(${rot}deg)`,
              animation:`confettiFall ${dur}s ${delay}s ease-in forwards`,
              opacity:0,
            }}/>
        );
      })}
      <style>{`
        @keyframes confettiFall {
          0%   { opacity:1; transform:rotate(0deg) translateY(0px); }
          100% { opacity:0; transform:rotate(540deg) translateY(600px); }
        }
      `}</style>
    </>
  );
}

// ─── Achievement Medal Translation Helper ──────────────────────
export const getBadgeTranslation = (badgeId: string, language: 'es' | 'en') => {
  const translations: Record<string, Record<'es' | 'en', { name: string; description: string; condition: string }>> = {
    'first-solve': {
      es: {
        name: 'Primera Victoria',
        description: '¡Completaste tu primer rompecabezas de Brain Bugs!',
        condition: 'Completa cualquier rompecabezas',
      },
      en: {
        name: 'First Victory',
        description: 'You completed your first Brain Bugs puzzle!',
        condition: 'Complete any puzzle',
      }
    },
    'star-collector': {
      es: {
        name: 'Estrella de Persistencia',
        description: '¡Ganaste 5 estrellas! Tu persistencia está dando frutos.',
        condition: 'Colecciona 5 estrellas en total',
      },
      en: {
        name: 'Persistence Star',
        description: 'You earned 5 stars! Your persistence is paying off.',
        condition: 'Collect 5 stars in total',
      }
    },
    'perfect-solve': {
      es: {
        name: 'Buscador de Patrones',
        description: '¡Encontraste el patrón perfecto y resolviste un rompecabezas con 3 estrellas!',
        condition: 'Completa cualquier rompecabezas con 3 estrellas',
      },
      en: {
        name: 'Pattern Finder',
        description: 'You found the perfect pattern and solved a puzzle with 3 stars!',
        condition: 'Complete any puzzle with 3 stars',
      }
    },
    'meadow-master': {
      es: {
        name: 'Maestro de la Pradera',
        description: '¡Conquistaste los cinco rompecabezas de la Pradera!',
        condition: 'Completa los 5 niveles del Sendero de la Pradera',
      },
      en: {
        name: 'Meadow Master',
        description: 'You conquered all five Meadow puzzles!',
        condition: 'Complete all 5 Meadow Path levels',
      }
    },
    'crystal-explorer': {
      es: {
        name: 'Sin Pistas',
        description: '¡Resolviste un rompecabezas completamente por tu cuenta, sin usar pistas!',
        condition: 'Completa cualquier nivel sin usar pistas',
      },
      en: {
        name: 'No Hints Used',
        description: 'You solved a puzzle completely on your own, without using hints!',
        condition: 'Complete any level without using hints',
      }
    },
    'robo-pioneer': {
      es: {
        name: 'Novato del Giro',
        description: '¡Aprendiste a girar! Completaste 3 rompecabezas usando tu habilidad de rotar.',
        condition: 'Completa 3 rompecabezas',
      },
      en: {
        name: 'Rotation Rookie',
        description: 'You learned to rotate! You completed 3 puzzles using your rotation skill.',
        condition: 'Complete 3 puzzles',
      }
    },
    'star-master': {
      es: {
        name: 'Campeón de Brain Bugs',
        description: '¡Coleccionaste 20 estrellas! Eres un verdadero campeón de Brain Bugs.',
        condition: 'Colecciona 20 estrellas en total',
      },
      en: {
        name: 'Brain Bugs Champion',
        description: 'You collected 20 stars! You are a true Brain Bugs champion.',
        condition: 'Collect 20 stars in total',
      }
    },
    'speed-bug': {
      es: {
        name: 'Pensador de Esquinas',
        description: 'Pensar desde las esquinas: ¡has completado 5 rompecabezas!',
        condition: 'Completa 5 rompecabezas',
      },
      en: {
        name: 'Corner Thinker',
        description: 'Thinking from the corners: you have completed 5 puzzles!',
        condition: 'Complete 5 puzzles',
      }
    },
    'daily-challenge': {
      es: {
        name: 'Campeón Diario',
        description: '¡Completaste tu primer Desafío Diario de BRAIN BUGS y obtuviste doble XP!',
        condition: 'Resuelve un Desafío Diario',
      },
      en: {
        name: 'Daily Champion',
        description: 'You completed your first BRAIN BUGS Daily Challenge and earned double XP!',
        condition: 'Solve a Daily Challenge',
      }
    }
  };
  return translations[badgeId]?.[language] || translations[badgeId]?.['es'];
};

// ─── Victory Screen ───────────────────────────────────────────
export function VictoryScreen() {
  const { navigate, victoryData, currentChild, getChildProgress, language, t } = useApp();
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (victoryData) {
      if (victoryData.stars === 3) {
        setShowConfetti(true);
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 }
        });
      } else {
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.6 }
        });
      }
    }
  }, []);

  useEffect(() => {
    if (!victoryData) {
      navigate('world-map');
    }
  }, [victoryData, navigate]);

  if (!victoryData) {
    return (
      <div className="flex items-center justify-center h-full bg-[#110A30] text-white">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-t-purple-500 border-purple-200 rounded-full animate-spin mx-auto mb-3" style={{ borderTopColor: '#8E6BFF' }} />
          <p className="text-sm font-semibold" style={{ fontFamily: '"Fredoka",system-ui' }}>Cargando mapa...</p>
        </div>
      </div>
    );
  }
  const { stars, moves, hintsUsed, newBadges = [], levelId } = victoryData;

  // Find the next level to play
  const allLevels = getAllLevels();
  const curIdx = allLevels.findIndex(l => l.id === levelId);
  const nextLevel = allLevels[curIdx + 1] ?? null;
  const totalStarsNow = (() => {
    try { return getTotalStars(getChildProgress()); } catch { return 0; }
  })();
  const nextLevelUnlocked = nextLevel && totalStarsNow >= nextLevel.requiredStars;

  const goNext = () => {
    if (nextLevelUnlocked && nextLevel) {
      navigate('gameplay', { levelId: nextLevel.id, worldId: nextLevel.worldId });
    } else {
      navigate('world-map');
    }
  };

  const levelLabel = levelId.startsWith('daily-')
    ? t('dailyChallenge')
    : levelId.startsWith('custom-')
      ? (language === 'en' ? 'Custom Level' : 'Nivel Personalizado')
      : language === 'en'
        ? levelId
            .replace('meadow-l','Meadow Level ')
            .replace('crystal-l','Cave Level ')
            .replace('robo-l','Reef Level ')
            .replace('ocean-l', 'Ocean Level ')
            .replace('volcano-l', 'Volcano Level ')
            .replace('space-l', 'Space Level ')
        : levelId
            .replace('meadow-l','Nivel Pradera ')
            .replace('crystal-l','Nivel Cueva ')
            .replace('robo-l','Nivel Arrecife ')
            .replace('ocean-l', 'Nivel Océano ')
            .replace('volcano-l', 'Nivel Volcán ')
            .replace('space-l', 'Nivel Espacio ');

  const msgMap = language === 'en' ? {
    3: '🎉 Perfect! What a great mind!',
    2: '⭐ Excellent work! Almost perfect!',
    1: '✅ Solved! Keep practicing!'
  } : {
    3:'🎉 ¡Perfecto! ¡Qué gran mente!',
    2:'⭐ ¡Excelente trabajo! ¡Casi perfecto!',
    1:'✅ ¡Resuelto! ¡Sigue practicando!'
  };
  const headline = msgMap[stars as 1|2|3] ?? (language === 'en' ? 'You did it!' : '¡Lo lograste!');
  const bgColor  = stars===3 ? 'linear-gradient(180deg,#5A3BD1,#3A2A9A,#251A6B)' : 'linear-gradient(180deg,#2B1A6A,#1C1148,#110A30)';
  const hexFill  = stars===3 ? '#FFD55E' : stars===2 ? '#5BC5FF' : '#3FD09E';
  const hexDark  = stars===3 ? '#B97808' : stars===2 ? '#2890D0' : '#1F9A6E';

  return (
    <div className="flex flex-col h-full items-center overflow-hidden relative"
      style={{background:bgColor}}>
      {showConfetti && <Confetti/>}

      {/* Stars bg glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(20)].map((_,i) => (
          <div key={i} className="absolute w-1 h-1 rounded-full bg-white"
            style={{left:`${(i*71+20)%100}%`, top:`${(i*97)%80}%`, opacity:0.3+(i%3)*0.12}}/>
        ))}
        {stars===3 && (
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full"
            style={{background:'radial-gradient(circle,rgba(255,200,61,0.45) 0%,rgba(255,200,61,0) 65%)'}}/>
        )}
      </div>

      <div className="relative z-10 flex flex-col items-center w-full px-5 pt-16 pb-8 overflow-y-auto no-scrollbar">
        {/* Headline */}
        <div className="text-white font-bold text-2xl text-center mb-0.5"
          style={{fontFamily:'"Fredoka",system-ui', textShadow:'0 4px 12px rgba(35,19,71,0.25)'}}>
          {headline}
        </div>
        <div className="text-yellow-200/80 text-sm font-semibold mb-6" style={{fontFamily:'"Nunito",system-ui'}}>
          {language === 'en' ? `${levelLabel} Completed!` : `¡${levelLabel} completado!`}
        </div>

        {/* Hex badge with bug */}
        <div className="relative w-40 h-44 flex items-center justify-center mb-5 animate-bounce-in">
          <svg width="160" height="185" viewBox="0 0 160 185">
            <defs>
              <linearGradient id="hvg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor={hexFill+'CC'}/>
                <stop offset="1" stopColor={hexFill}/>
              </linearGradient>
            </defs>
            <polygon points="80,4 156,44 156,124 80,164 4,124 4,44"
              fill="url(#hvg)" stroke={hexDark} strokeWidth="5" strokeLinejoin="round"/>
            <polygon points="80,16 144,52 144,116 80,152 16,116 16,52"
              fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2"/>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            {currentChild && <BugSvg kind={currentChild.bugCompanion} size={88} animated accessoryId={currentChild.activeAccessoryId}/>}
          </div>
          {stars === 3 && (
            <div className="absolute -top-2 -right-2 text-2xl animate-bounce">🏆</div>
          )}
        </div>

        {/* Star rating */}
        <div className="flex gap-2 mb-6">
          <StarRating stars={stars} size={44} animated/>
        </div>

        {/* Stats row */}
        <div className="w-full flex gap-3 mb-5">
          {[
            { label: language === 'en' ? 'Moves' : 'Movimientos', value:moves, icon:'👣', good: moves<=12 },
            { label: language === 'en' ? 'Hints Used' : 'Pistas usadas', value:hintsUsed, icon:'💡', good: hintsUsed===0 },
            { label: language === 'en' ? 'Stars' : 'Estrellas',      value:stars,   icon:'⭐', good: stars===3 },
          ].map(s => (
            <div key={s.label} className="flex-1 rounded-2xl p-3 text-center"
              style={{background:s.good?'rgba(63,208,158,0.18)':'rgba(255,255,255,0.1)',
                      border: s.good ? '1px solid rgba(63,208,158,0.35)' : '1px solid transparent'}}>
              <div className="text-lg mb-0.5">{s.icon}</div>
              <div className="text-2xl font-bold text-white" style={{fontFamily:'"Fredoka",system-ui'}}>{s.value}</div>
              <div className="text-xs font-bold text-white/55 mt-0.5 uppercase tracking-wide" style={{fontFamily:'"Nunito",system-ui'}}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* New badges */}
        {newBadges.length > 0 && (
          <div className="w-full p-4 rounded-2xl mb-5" style={{background:'rgba(255,200,61,0.12)',border:'1px solid rgba(255,200,61,0.28)'}}>
            <div className="text-xs font-bold uppercase tracking-widest text-yellow-300 mb-3" style={{fontFamily:'"Nunito",system-ui'}}>
              {language === 'en' ? '🏆 New medal unlocked!' : '🏆 ¡Nueva medalla desbloqueada!'}
            </div>
            {newBadges.map(bid => {
              const b = BADGE_MAP[bid];
              if (!b) return null;
              const trans = getBadgeTranslation(bid, language);
              return (
                <div key={bid} className="flex items-center gap-3 mb-2 last:mb-0">
                  <span className="text-2xl">{b.emoji}</span>
                  <div>
                    <div className="font-bold text-white text-sm" style={{fontFamily:'"Fredoka",system-ui'}}>{trans?.name || b.name}</div>
                    <div className="text-xs text-white/60" style={{fontFamily:'"Nunito",system-ui'}}>{trans?.description || b.description}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Hint if not perfect */}
        {stars < 3 && (
          <div className="w-full p-3 rounded-2xl mb-5 text-center" style={{background:'rgba(255,255,255,0.07)'}}>
            <p className="text-white/70 text-xs font-semibold" style={{fontFamily:'"Nunito",system-ui'}}>
              {language === 'en'
                ? '💡 Play this level again using fewer moves to earn 3 stars!'
                : '💡 ¡Vuelve a jugar este nivel usando menos movimientos para ganar 3 estrellas!'}
            </p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex flex-col gap-3 w-full">
          <button onClick={goNext}
            className="w-full py-4 rounded-3xl font-bold text-xl active:scale-95 transition-transform"
            style={{
              background:'linear-gradient(180deg,#FFD55E,#FFB23A)',
              fontFamily:'"Fredoka",system-ui', color:'#231347',
              boxShadow:'0 7px 0 #B97808', letterSpacing:1,
            }}>
            {language === 'en' ? 'NEXT LEVEL →' : 'SIGUIENTE NIVEL →'}
          </button>
          <button onClick={() => navigate('world-map')}
            className="w-full py-3 rounded-2xl font-bold active:scale-95 text-sm transition-all"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.04))',
              color: 'rgba(255,255,255,0.85)',
              border: '1px solid rgba(255,255,255,0.18)',
              boxShadow: '0 4px 15px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.2)',
              backdropFilter: 'blur(5px)',
              fontFamily: '"Fredoka",system-ui'
            }}>
            {language === 'en' ? 'Back to Map' : 'Volver al mapa'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Rewards Screen ───────────────────────────────────────────
export function RewardsScreen() {
  const { navigate, currentChild, language, t } = useApp();
  const [selectedBadge, setSelectedBadge] = useState<string | null>(null);

  useEffect(() => {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 }
    });
  }, []);

  if (!currentChild) return null;
  const progress = getProgress(currentChild.id);
  const totalStars = getTotalStars(progress);
  const puzzlesSolved = getPuzzlesSolved(progress);
  const xp = totalStars * 10;
  const xpToNextLevel = 100;
  const xpProgress = (xp % xpToNextLevel) / xpToNextLevel * 100;
  const level = Math.floor(xp / xpToNextLevel) + 1;

  const selected = selectedBadge ? BADGE_MAP[selectedBadge] : null;
  const selectedTrans = selected ? getBadgeTranslation(selected.id, language) : null;

  return (
    <div className="flex flex-col h-full" style={{background:'linear-gradient(180deg,#4A2BAE 0%,#3A2A9A 40%,#251A6B 100%)'}}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-14 pb-3 flex-shrink-0">
        <button onClick={()=>navigate('home')}
          className="w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05))',
            border: '1px solid rgba(255,255,255,0.2)',
            boxShadow: '0 4px 10px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.25)',
            backdropFilter: 'blur(4px)'
          }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M15 6l-6 6 6 6" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        </button>
        <div className="font-bold text-white text-lg uppercase tracking-widest" 
          style={{
            fontFamily:'"Fredoka",system-ui',
            textShadow: '0 2px 8px rgba(35,19,71,0.2)'
          }}>
          {language === 'en' ? 'Medals & Rewards' : 'Medallas y Recompensas'}
        </div>
        <div className="w-10"/>
      </div>

      {/* XP bar */}
      <div className="mx-4 mb-3 p-4 rounded-2xl flex-shrink-0" style={{background:'rgba(255,255,255,0.1)'}}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-white font-bold text-sm" style={{fontFamily:'"Fredoka",system-ui'}}>{language === 'en' ? `Level ${level}` : `Nivel ${level}`}</span>
          <span className="text-white/60 text-xs font-bold" style={{fontFamily:'"Nunito",system-ui'}}>{xp % xpToNextLevel}/{xpToNextLevel} XP</span>
        </div>
        <div className="h-3 rounded-full overflow-hidden" style={{background:'rgba(255,255,255,0.15)'}}>
          <div className="h-full rounded-full transition-all duration-700"
            style={{width:`${xpProgress}%`, background:'linear-gradient(90deg,#FFD55E,#FF8A4C)'}}/>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex gap-2 px-4 mb-4 flex-shrink-0">
        {[
          { label: language === 'en' ? 'Stars' : 'Estrellas',   value:totalStars,       icon:'⭐' },
          { label: language === 'en' ? 'Puzzles' : 'Rompecabezas', value:puzzlesSolved,     icon:'🧩' },
          { label: language === 'en' ? 'Medals' : 'Medallas',  value:progress.badges.length, icon:'🏆' },
        ].map(s => (
          <div key={s.label} className="flex-1 rounded-2xl p-3 text-center" style={{background:'rgba(255,255,255,0.1)'}}>
            <div className="text-xl mb-0.5">{s.icon}</div>
            <div className="text-2xl font-bold text-white" style={{fontFamily:'"Fredoka",system-ui'}}>{s.value}</div>
            <div className="text-xs font-bold uppercase text-white/50 mt-0.5" style={{fontFamily:'"Nunito",system-ui'}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Badge grid */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-4">
        <p className="text-white/45 text-xs font-bold uppercase tracking-widest mb-3" style={{fontFamily:'"Nunito",system-ui'}}>
          {language === 'en' ? `Collection (${progress.badges.length}/${BADGES.length})` : `Colección (${progress.badges.length}/${BADGES.length})`}
        </p>
        <div className="grid grid-cols-3 gap-3">
          {BADGES.map(badge => {
            const earned = progress.badges.includes(badge.id);
            const trans = getBadgeTranslation(badge.id, language);
            return (
              <button key={badge.id}
                onClick={() => {
                  if (earned) {
                    setSelectedBadge(badge.id);
                    confetti({
                      particleCount: 30,
                      spread: 40,
                      origin: { y: 0.6 }
                    });
                  }
                }}
                className="flex flex-col items-center p-3 rounded-2xl transition-all active:scale-95"
                style={{
                  background: earned ? `${badge.color}1A` : 'rgba(255,255,255,0.05)',
                  border: earned ? `2px solid ${badge.color}55` : '2px solid rgba(255,255,255,0.08)',
                  boxShadow: earned ? `0 0 16px ${badge.color}4D, inset 0 0 8px ${badge.color}26` : 'none',
                  opacity: earned ? 1 : 0.45,
                  cursor: earned ? 'pointer' : 'default',
                }}>
                <div style={{fontSize:32, lineHeight:1, marginBottom:4, transform: earned ? 'scale(1.08)' : 'scale(0.88)'}}>
                  {earned ? badge.emoji : '🔒'}
                </div>
                <div className="text-center text-white font-bold leading-tight" style={{fontFamily:'"Fredoka",system-ui', fontSize:11}}>
                  {trans?.name || badge.name}
                </div>
                {!earned && (
                  <div className="text-center text-white/35 mt-1 leading-tight" style={{fontFamily:'"Nunito",system-ui', fontSize:9}}>
                    {trans?.condition || badge.condition}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Badge detail modal */}
      {selected && selectedTrans && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60" onClick={()=>setSelectedBadge(null)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-xs text-center" onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:56, lineHeight:1}} className="mb-3">{selected.emoji}</div>
            <h3 className="text-xl font-bold text-ink mb-1" style={{fontFamily:'"Fredoka",system-ui'}}>{selectedTrans.name}</h3>
            <p className="text-sm text-ink/60 font-semibold mb-5" style={{fontFamily:'"Nunito",system-ui'}}>{selectedTrans.description}</p>
            <button onClick={()=>setSelectedBadge(null)}
              className="w-full py-3 rounded-2xl font-bold text-white"
              style={{background:selected.color, fontFamily:'"Fredoka",system-ui', boxShadow:`0 4px 0 ${selected.darkColor}`}}>
              {language === 'en' ? 'Awesome! 🎉' : '¡Genial! 🎉'}
            </button>
          </div>
        </div>
      )}

      <BottomNav/>
    </div>
  );
}

const TUTORIAL_SLIDES = [
  {
    title: "🧩 ¿Qué es el AI Coach?",
    desc: "Un asistente inteligente que analiza en tiempo real cómo juega tu hijo. Evalúa su heurística de resolución y diseña dinámicas fuera de pantalla personalizadas.",
    icon: "🧠",
    badge: "GENERAL",
    color: "from-indigo-500 to-purple-600"
  },
  {
    title: "📐 Lógica y Orientación",
    desc: "Mide cómo percibe las formas tridimensionales. Un niño que rota piezas con calma demuestra habilidades de planificación geométrica y lógica predictiva avanzada.",
    icon: "📐",
    badge: "COGNICIÓN",
    color: "from-pink-500 to-purple-600"
  },
  {
    title: "💪 Resiliencia y Tolerancia",
    desc: "Analiza la persistencia ante la frustración. El equilibrio entre el esfuerzo independiente y la solicitud inteligente de pistas muestra madurez emocional.",
    icon: "💪",
    badge: "HABILIDADES",
    color: "from-blue-500 to-indigo-600"
  },
  {
    title: "🎲 Aprendizaje del Mundo Real",
    desc: "¡El juego físico refuerza el digital! Te recomendamos actividades semanales (como Tangrams o preguntas lógicas) para conectar la pantalla con el tacto.",
    icon: "🌍",
    badge: "CONSEJO",
    color: "from-emerald-500 to-teal-600"
  }
];

// ─── Parent Dashboard ─────────────────────────────────────────
export function ParentDashboard() {
  const { navigate, parent, children, currentChild, resetChildProgress, signOut, updateChildTimeLimit, language, t } = useApp();
  const [viewId, setViewId] = useState(currentChild?.id ?? children[0]?.id ?? '');

  const handleTriggerPrint = () => {
    sound.playClick();
    document.body.classList.add('print-puzzle-active');
    setTimeout(() => {
      window.print();
      document.body.classList.remove('print-puzzle-active');
    }, 100);
  };

  const handleTriggerReportPrint = () => {
    sound.playClick();
    document.body.classList.add('print-report-active');
    setTimeout(() => {
      window.print();
      document.body.classList.remove('print-report-active');
    }, 100);
  };
  const child = children.find(c=>c.id===viewId) ?? currentChild;
  const progress = child ? getProgress(child.id) : null;
  const totalStars  = progress ? getTotalStars(progress) : 0;
  const puzzlesSolved = progress ? getPuzzlesSolved(progress) : 0;
  const avgMoves = progress && puzzlesSolved > 0
    ? Math.round(Object.values(progress.levelProgress).reduce((s,l)=>s+l.bestMoves,0)/puzzlesSolved)
    : 0;
  const totalHints = progress
    ? Object.values(progress.levelProgress).reduce((s,l)=>s+l.hintsUsed,0) : 0;
  const [confirmReset, setConfirmReset] = useState(false);
  const [showScreenTime, setShowScreenTime] = useState(false);

  const [challengeTarget, setChallengeTarget] = useState<number>(50);
  const [challengeReward, setChallengeReward] = useState<string>("¡Una tarde de helados y películas!");
  const [savingChallenge, setSavingChallenge] = useState(false);
  const [showSavedToast, setShowSavedToast] = useState(false);

  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [tutorialStep, setTutorialStep] = useState(0);

  useEffect(() => {
    sound.playStoreOpen();
  }, []);

  useEffect(() => {
    const parentId = parent?.id || 'guest';
    const localTarget = localStorage.getItem(`bb_challenge_target_${parentId}`);
    const localReward = localStorage.getItem(`bb_challenge_reward_${parentId}`);
    if (localTarget) setChallengeTarget(parseInt(localTarget, 10));
    if (localReward) setChallengeReward(localReward);

    if (parent?.id && db) {
      getDoc(doc(db, 'parents', parent.id)).then(snap => {
        if (snap.exists()) {
          const data = snap.data();
          if (data.challengeTarget !== undefined) {
            setChallengeTarget(data.challengeTarget);
            localStorage.setItem(`bb_challenge_target_${parent.id}`, String(data.challengeTarget));
          }
          if (data.challengeReward !== undefined) {
            setChallengeReward(data.challengeReward);
            localStorage.setItem(`bb_challenge_reward_${parent.id}`, data.challengeReward);
          }
        }
      }).catch(err => console.warn("Error fetching parent challenge:", err));
    }
  }, [parent]);

  const handleSaveChallenge = async (newTarget: number, newReward: string) => {
    sound.playClick();
    setSavingChallenge(true);
    
    const parentId = parent?.id || 'guest';
    localStorage.setItem(`bb_challenge_target_${parentId}`, String(newTarget));
    localStorage.setItem(`bb_challenge_reward_${parentId}`, newReward);

    if (parent?.id && db) {
      try {
        await setDoc(doc(db, 'parents', parent.id), {
          challengeTarget: newTarget,
          challengeReward: newReward,
        }, { merge: true });
      } catch (err) {
        console.error("Error saving challenge to Firestore:", err);
      }
    }
    setSavingChallenge(false);
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 2000);
  };

  const handleSendEmailReport = async () => {
    if (!parent?.email) return;
    sound.playClick();
    setSendingEmail(true);
    setEmailStatus(null);

    const totalFamilyStars = children.reduce((sum, c) => sum + getTotalStars(getProgress(c.id)), 0);

    const reportHtml = language === 'en' ? `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #F4F2FA; border-radius: 24px; color: #231347;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #8E6BFF; font-size: 28px; margin: 0; font-family: sans-serif;">BRAIN BUGS 🧠</h1>
          <p style="font-size: 14px; color: #7B7193; margin: 4px 0 0 0;">Smart Cognitive Progress Report</p>
        </div>
        
        <div style="background-color: #ffffff; padding: 20px; border-radius: 20px; margin-bottom: 20px; box-shadow: 0 4px 10px rgba(0,0,0,0.03);">
          <h2 style="font-size: 18px; margin-top: 0; color: #8E6BFF; border-bottom: 2px solid #F4F2FA; padding-bottom: 8px; font-family: sans-serif;">Player Summary: ${child?.nickname}</h2>
          <table style="width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 14px;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #7B7193;">Stars Earned:</td>
              <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #FFC83D;">⭐ ${totalStars}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #7B7193;">Current Level:</td>
              <td style="padding: 8px 0; text-align: right; font-weight: bold;">${child?.currentLevel}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #7B7193;">Puzzles Solved:</td>
              <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #3FD09E;">🧩 ${puzzlesSolved}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #7B7193;">Average Moves:</td>
              <td style="padding: 8px 0; text-align: right; font-weight: bold;">${avgMoves || '—'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #7B7193;">Hints Used:</td>
              <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #FF7B5C;">💡 ${totalHints}</td>
            </tr>
          </table>
        </div>

        <div style="background-color: #ffffff; padding: 20px; border-radius: 20px; margin-bottom: 20px; box-shadow: 0 4px 10px rgba(0,0,0,0.03);">
          <h2 style="font-size: 18px; margin-top: 0; color: #8E6BFF; border-bottom: 2px solid #F4F2FA; padding-bottom: 8px; font-family: sans-serif;">Focus Skills Analysis</h2>
          ${skills.map(s => `
            <div style="margin-bottom: 12px;">
              <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: bold; margin-bottom: 4px;">
                <span>${s.label}</span>
                <span style="color: ${s.color};">${s.value}%</span>
              </div>
              <div style="height: 8px; background-color: #F4F2FA; border-radius: 4px; overflow: hidden;">
                <div style="height: 100%; background-color: ${s.color}; width: ${s.value}%;"></div>
              </div>
            </div>
          `).join('')}
        </div>

        <div style="background-color: #ffffff; padding: 20px; border-radius: 20px; margin-bottom: 20px; box-shadow: 0 4px 10px rgba(0,0,0,0.03);">
          <h2 style="font-size: 18px; margin-top: 0; color: #8E6BFF; border-bottom: 2px solid #F4F2FA; padding-bottom: 8px; font-family: sans-serif;">🤖 AI Coach Diagnosis</h2>
          <p style="font-size: 13px; font-weight: bold; margin-bottom: 4px; color: #231347;">📐 Spatial Logic & Rotation:</p>
          <p style="font-size: 13px; color: #665C7A; line-height: 1.5; margin: 0 0 12px 0;">
            ${puzzlesSolved === 0 
              ? 'Not enough play data yet. Solve levels to evaluate.'
              : puzzlesSolved >= 10 
              ? 'Advanced Development: Demonstrates an exceptional ability to predict spatial orientation and rotate bugs without physically trial-and-erroring too many times.'
              : 'Exploration Phase: Absorbing three-dimensional shape constraints. Shows patience when trying turns in corners.'}
          </p>
          <p style="font-size: 13px; font-weight: bold; margin-bottom: 4px; color: #231347;">💪 Cognitive Resilience (Error Tolerance):</p>
          <p style="font-size: 13px; color: #665C7A; line-height: 1.5; margin: 0 0 12px 0;">
            ${puzzlesSolved === 0 
              ? 'Completing levels will reveal habits of overcoming obstacles.'
              : totalHints === 0 
              ? 'Outstanding Autonomy: Solves all challenges independently without relying on hints, demonstrating high confidence in difficult problems.'
              : totalHints > puzzlesSolved * 1.5 
              ? 'Strategic Search: Uses hints as a proactive learning tool to overcome frustrations, a great adaptivity trait.'
              : 'Healthy Balance: Attempts to solve independently first and resorts to short hints only when experiencing complex blocks.'}
          </p>
        </div>

        <div style="background-color: #8E6BFF; padding: 20px; border-radius: 20px; color: #ffffff; text-align: center;">
          <h3 style="font-size: 16px; margin: 0 0 8px 0; font-family: sans-serif;">🎮 Recommended Off-Screen Activities</h3>
          <p style="font-size: 12px; margin: 0; line-height: 1.5; opacity: 0.9;">
            Visit your Parents Panel inside the application to see suggested dynamics like physical Tangram, metacognition questions, or three-dimensional wooden puzzles.
          </p>
        </div>
      </div>
    ` : `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #F4F2FA; border-radius: 24px; color: #231347;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #8E6BFF; font-size: 28px; margin: 0; font-family: sans-serif;">BRAIN BUGS 🧠</h1>
          <p style="font-size: 14px; color: #7B7193; margin: 4px 0 0 0;">Reporte Inteligente de Progreso Cognitivo</p>
        </div>
        
        <div style="background-color: #ffffff; padding: 20px; border-radius: 20px; margin-bottom: 20px; box-shadow: 0 4px 10px rgba(0,0,0,0.03);">
          <h2 style="font-size: 18px; margin-top: 0; color: #8E6BFF; border-bottom: 2px solid #F4F2FA; padding-bottom: 8px; font-family: sans-serif;">Resumen del Jugador: ${child?.nickname}</h2>
          <table style="width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 14px;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #7B7193;">Estrellas Ganadas:</td>
              <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #FFC83D;">⭐ ${totalStars}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #7B7193;">Nivel Actual:</td>
              <td style="padding: 8px 0; text-align: right; font-weight: bold;">${child?.currentLevel}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #7B7193;">Rompecabezas Resueltos:</td>
              <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #3FD09E;">🧩 ${puzzlesSolved}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #7B7193;">Movimientos Promedio:</td>
              <td style="padding: 8px 0; text-align: right; font-weight: bold;">${avgMoves || '—'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #7B7193;">Pistas Utilizadas:</td>
              <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #FF7B5C;">💡 ${totalHints}</td>
            </tr>
          </table>
        </div>

        <div style="background-color: #ffffff; padding: 20px; border-radius: 20px; margin-bottom: 20px; box-shadow: 0 4px 10px rgba(0,0,0,0.03);">
          <h2 style="font-size: 18px; margin-top: 0; color: #8E6BFF; border-bottom: 2px solid #F4F2FA; padding-bottom: 8px; font-family: sans-serif;">Análisis de Habilidades Focus</h2>
          ${skills.map(s => `
            <div style="margin-bottom: 12px;">
              <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: bold; margin-bottom: 4px;">
                <span>${s.label}</span>
                <span style="color: ${s.color};">${s.value}%</span>
              </div>
              <div style="height: 8px; background-color: #F4F2FA; border-radius: 4px; overflow: hidden;">
                <div style="height: 100%; background-color: ${s.color}; width: ${s.value}%;"></div>
              </div>
            </div>
          `).join('')}
        </div>

        <div style="background-color: #ffffff; padding: 20px; border-radius: 20px; margin-bottom: 20px; box-shadow: 0 4px 10px rgba(0,0,0,0.03);">
          <h2 style="font-size: 18px; margin-top: 0; color: #8E6BFF; border-bottom: 2px solid #F4F2FA; padding-bottom: 8px; font-family: sans-serif;">🤖 Diagnóstico del AI Coach</h2>
          <p style="font-size: 13px; font-weight: bold; margin-bottom: 4px; color: #231347;">📐 Lógica y Rotación Espacial:</p>
          <p style="font-size: 13px; color: #665C7A; line-height: 1.5; margin: 0 0 12px 0;">
            ${puzzlesSolved === 0 
              ? 'Aún no hay datos de juego suficientes. Resuelve niveles para evaluar.'
              : puzzlesSolved >= 10 
              ? 'Desarrollo Avanzado: Demuestra una habilidad excepcional para predecir la orientación espacial y rotar bichos sin ensayar físicamente demasiadas veces.'
              : 'Fase de Exploración: Está asimilando las restricciones de forma tridimensional. Muestra paciencia al ensayar giros en las esquinas.'}
          </p>
          <p style="font-size: 13px; font-weight: bold; margin-bottom: 4px; color: #231347;">💪 Resiliencia Cognitiva (Tolerancia al Error):</p>
          <p style="font-size: 13px; color: #665C7A; line-height: 1.5; margin: 0 0 12px 0;">
            ${puzzlesSolved === 0 
              ? 'Completar niveles revelará los hábitos de superación ante obstáculos.'
              : totalHints === 0 
              ? 'Autonomía Sobresaliente: Resuelve todos los retos de forma independiente sin apoyarse en pistas, lo que demuestra alta confianza ante problemas difíciles.'
              : totalHints > puzzlesSolved * 1.5 
              ? 'Búsqueda Estratégica: Utiliza las pistas como herramienta proactiva de aprendizaje para superar frustraciones, un gran rasgo de adaptabilidad.'
              : 'Equilibrio Saludable: Intenta resolver de forma autónoma primero y acude a pistas cortas solo en bloqueos complejos.'}
          </p>
        </div>

        <div style="background-color: #8E6BFF; padding: 20px; border-radius: 20px; color: #ffffff; text-align: center;">
          <h3 style="font-size: 16px; margin: 0 0 8px 0; font-family: sans-serif;">🎮 Actividades Recomendadas Fuera de Pantalla</h3>
          <p style="font-size: 12px; margin: 0; line-height: 1.5; opacity: 0.9;">
            Visita tu Panel de Padres en la aplicación para ver dinámicas sugeridas como Tangram físico, preguntas de metacognición o rompecabezas tridimensionales de madera.
          </p>
        </div>
      </div>
    `;

    if (db) {
      try {
        await setDoc(doc(collection(db, 'mail')), {
          to: [parent.email],
          message: {
            subject: language === 'en' ? `Brain Bugs Progress Report - ${child?.nickname || 'Child'}` : `Reporte de Progreso de Brain Bugs - ${child?.nickname || 'Hijo'}`,
            html: reportHtml,
          },
          createdAt: new Date().toISOString(),
        });
        setEmailStatus({ type: 'success', message: language === 'en' ? `Report sent successfully to ${parent.email}! Check your inbox.` : `¡Reporte enviado con éxito a ${parent.email}! Revisa tu buzón.` });
      } catch (err) {
        console.error("Error writing to mail collection:", err);
        setEmailStatus({ type: 'error', message: language === 'en' ? 'Could not save to Firestore. Showing local simulation.' : 'No se pudo guardar en Firestore. Mostrando simulación local.' });
        setTimeout(() => {
          setEmailStatus({ type: 'success', message: language === 'en' ? `[Simulation] Report sent successfully to ${parent.email}.` : `[Simulación] Reporte enviado con éxito a ${parent.email}.` });
        }, 1200);
      }
    } else {
      setTimeout(() => {
        setEmailStatus({ type: 'success', message: language === 'en' ? `[Simulation] Report sent successfully to ${parent.email}.` : `[Simulación] Reporte enviado con éxito a ${parent.email}.` });
      }, 1000);
    }
    setSendingEmail(false);
  };

  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('bb_parent_dark_mode') === 'true';
  });

  const toggleDarkMode = () => {
    sound.playClick();
    const nextVal = !isDarkMode;
    setIsDarkMode(nextVal);
    localStorage.setItem('bb_parent_dark_mode', String(nextVal));
  };

  const skills = [
    {label: language === 'en' ? 'Logical Thinking' : 'Pensamiento lógico', value:Math.min(100, puzzlesSolved*9+totalStars*2), color:'#8E6BFF'},
    {label: language === 'en' ? 'Problem Solving' : 'Resolución de problemas',  value:Math.min(100, puzzlesSolved*7+totalStars*3), color:'#3FD09E'},
    {label: language === 'en' ? 'Spatial Awareness' : 'Conciencia espacial',value:Math.min(100, puzzlesSolved*8+totalStars*2), color:'#FF7B5C'},
    {label: language === 'en' ? 'Persistence' : 'Persistencia',      value:Math.min(100, (progress?.badges.length??0)*14+puzzlesSolved*5), color:'#FFC83D'},
  ];

  const AVATAR_MAP: Record<string, { bg: string; emoji: string }> = {
    buzzy:{bg:'#FFD55E',emoji:'🐝'}, pip:{bg:'#3FD09E',emoji:'🐛'},
    bobo:{bg:'#8E6BFF',emoji:'🦋'}, zig:{bg:'#FFC83D',emoji:'🐞'},
    mo:{bg:'#5BC5FF',emoji:'🦗'},    rose:{bg:'#FF6FA8',emoji:'🌸'},
  };

  return (
    <div className="flex flex-col h-full transition-colors duration-300" style={{background: isDarkMode ? '#0D041A' : '#F4F2FA'}}>
      {/* Header */}
      <div className="px-4 pt-14 pb-3 flex items-center justify-between transition-colors duration-300"
        style={{
          background: isDarkMode ? '#140824' : 'white',
          boxShadow: isDarkMode ? '0 2px 12px rgba(0,0,0,0.4)' : '0 2px 12px rgba(35,19,71,0.06)',
          borderBottom: isDarkMode ? '1px solid #23123D' : 'none'
        }}>
        <button onClick={()=>navigate('home')}
          className="w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95"
          style={{
            background: isDarkMode 
              ? 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))' 
              : 'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.5))',
            border: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(142,107,255,0.15)',
            boxShadow: isDarkMode 
              ? '0 4px 10px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05)' 
              : '0 4px 10px rgba(142,107,255,0.05), inset 0 1px 0 rgba(255,255,255,0.9)',
            backdropFilter: 'blur(4px)'
          }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M15 6l-6 6 6 6" stroke={isDarkMode ? '#fff' : '#231347'} strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        </button>
        <div style={{
          fontFamily:'"Fredoka",system-ui', 
          color: isDarkMode ? '#fff' : '#231347',
          textShadow: isDarkMode ? '0 2px 8px rgba(0,0,0,0.5)' : '0 2px 8px rgba(35,19,71,0.1)'
        }} className="font-bold text-base uppercase tracking-widest">
          {t('parentDashboard')}
        </div>
        <div className="flex gap-2">
          {/* Dark mode button */}
          <button onClick={toggleDarkMode} className="w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all active:scale-95"
            style={{
              background: isDarkMode 
                ? 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))' 
                : 'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.5))',
              border: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(142,107,255,0.15)',
              boxShadow: isDarkMode 
                ? '0 4px 10px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05)' 
                : '0 4px 10px rgba(142,107,255,0.05), inset 0 1px 0 rgba(255,255,255,0.9)',
              backdropFilter: 'blur(4px)'
            }}>
            {isDarkMode ? '🌙' : '☀️'}
          </button>
          <button onClick={()=>navigate('settings')}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95"
            style={{
              background: isDarkMode 
                ? 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))' 
                : 'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.5))',
              border: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(142,107,255,0.15)',
              boxShadow: isDarkMode 
                ? '0 4px 10px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05)' 
                : '0 4px 10px rgba(142,107,255,0.05), inset 0 1px 0 rgba(255,255,255,0.9)',
              backdropFilter: 'blur(4px)'
            }}>
            ⚙️
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-4">
        {/* Child tabs */}
        {children.length > 0 && (
          <div className="flex gap-2 mt-4 mb-1 overflow-x-auto no-scrollbar">
            {children.map(c => {
              const av = AVATAR_MAP[c.avatarId] ?? AVATAR_MAP.buzzy;
              return (
                <button key={c.id} onClick={()=>setViewId(c.id)}
                  className="flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-bold flex-shrink-0 transition-all active:scale-95"
                  style={{
                    fontFamily:'"Fredoka",system-ui',
                    background: viewId===c.id ? '#8E6BFF' : isDarkMode ? '#1E0F33' : '#fff',
                    color: viewId===c.id ? '#fff' : isDarkMode ? '#D8B4FE' : '#231347',
                    boxShadow: viewId===c.id ? '0 3px 0 #5A3BD1' : isDarkMode ? '0 2px 0 #05010B' : '0 2px 0 rgba(35,19,71,0.1)',
                    border: viewId===c.id ? 'none' : isDarkMode ? '1px solid #331C54' : 'none',
                  }}>
                  <span style={{fontSize:16}}>{av.emoji}</span> {c.nickname}
                </button>
              );
            })}
          </div>
        )}

        {child && (() => {
          const av = AVATAR_MAP[child.avatarId] ?? AVATAR_MAP.buzzy;
          const worldLabelMap = language === 'en'
            ? { meadow: 'Meadow', crystal: 'Cave', robo: 'Reef', ocean: 'Ocean', volcano: 'Volcano', space: 'Space' }
            : { meadow: 'Pradera', crystal: 'Cueva', robo: 'Arrecife', ocean: 'Océano', volcano: 'Volcán', space: 'Espacio' };
          const worldLabel = worldLabelMap[child.currentWorld as 'meadow'|'crystal'|'robo'|'ocean'|'volcano'|'space'] || child.currentWorld;
          return (
            <div className="mt-3 p-4 rounded-2xl flex items-center gap-4 transition-colors"
              style={{
                background: isDarkMode ? '#1E0F33' : '#fff',
                boxShadow: isDarkMode ? '0 4px 0 rgba(0,0,0,0.3)' : '0 4px 0 rgba(35,19,71,0.08)',
                border: isDarkMode ? '1px solid #331C54' : 'none',
              }}>
              <div className="w-16 h-16 rounded-2xl text-3xl flex items-center justify-center"
                style={{background:av.bg, boxShadow:'0 3px 0 rgba(35,19,71,0.15)', fontSize:28, flexShrink:0}}>
                {av.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-xl" style={{fontFamily:'"Fredoka",system-ui', color: isDarkMode ? '#fff' : '#231347'}}>{child.nickname}</div>
                <div className="text-xs font-semibold mb-2" style={{fontFamily:'"Nunito",system-ui', color: isDarkMode ? '#A78BFA' : 'rgba(35,19,71,0.5)'}}>
                  {language === 'en' ? `Level ${child.currentLevel} · World ${worldLabel}` : `Nivel ${child.currentLevel} · Mundo ${worldLabel}`}
                </div>
                <div className="h-2.5 rounded-full overflow-hidden" style={{ background: isDarkMode ? '#140824' : '#F4F2FA' }}>
                  <div className="h-full rounded-full"
                    style={{width:`${Math.min(100,(totalStars%20)*5)}%`, background:'linear-gradient(90deg,#8E6BFF,#5A3BD1)', transition:'width 0.6s'}}/>
                </div>
                <div className="text-xs mt-0.5 font-bold" style={{fontFamily:'"Nunito",system-ui', color: isDarkMode ? '#8B5CF6' : 'rgba(35,19,71,0.4)'}}>
                  {child.totalXP} XP
                </div>
              </div>
            </div>
          );
        })()}

        {/* Key metrics */}
        <p className="text-xs font-bold uppercase tracking-wide mt-5 mb-2" style={{fontFamily:'"Nunito",system-ui', color: isDarkMode ? '#A78BFA' : 'rgba(35,19,71,0.4)'}}>
          {language === 'en' ? 'Summary' : 'Resumen'}
        </p>
        <div className="grid grid-cols-2 gap-2">
          {[
            {icon:'⭐', label: language === 'en' ? 'Stars earned' : 'Estrellas ganadas',    value:totalStars,    color:'#FFC83D', dark:'#B97808'},
            {icon:'🧩', label: language === 'en' ? 'Solved' : 'Resueltos',  value:puzzlesSolved, color:'#3FD09E', dark:'#1F9A6E'},
            {icon:'👣', label: language === 'en' ? 'Avg. moves' : 'Movimientos prom.',      value:avgMoves||'—', color:'#8E6BFF', dark:'#5A3BD1'},
            {icon:'💡', label: language === 'en' ? 'Hints used' : 'Pistas usadas',      value:totalHints,    color:'#FF7B5C', dark:'#C73000'},
            {icon:'🏆', label: language === 'en' ? 'Medals earned' : 'Medallas ganadas',  value:progress?.badges.length??0, color:'#FF6FA8', dark:'#C73C77'},
            {icon:'🌍', label: language === 'en' ? 'Worlds visited' : 'Mundos visitados', value:['meadow','crystal','robo','ocean','volcano','space'].filter(w=>
              Object.keys(progress?.levelProgress??{}).some(l=>l.startsWith(w))).length, color:'#5BC5FF', dark:'#2890D0'},
          ].map(m => (
            <div key={m.label} className="rounded-2xl p-3.5 flex items-center gap-3 transition-colors"
              style={{
                background: isDarkMode ? '#1E0F33' : '#fff',
                boxShadow: isDarkMode ? '0 2px 0 rgba(0,0,0,0.2)' : '0 2px 0 rgba(35,19,71,0.07)',
                border: isDarkMode ? '1px solid #331C54' : 'none',
              }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                style={{background:m.color+'1A', boxShadow:`inset 0 -2px 0 ${m.dark}22`}}>
                {m.icon}
              </div>
              <div>
                <div className="text-xl font-bold" style={{fontFamily:'"Fredoka",system-ui', color: isDarkMode ? '#fff' : '#231347'}}>{m.value}</div>
                <div className="text-xs font-bold" style={{fontFamily:'"Nunito",system-ui', color: isDarkMode ? '#A78BFA' : 'rgba(35,19,71,0.45)'}}>{m.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Skills */}
        <p className="text-xs font-bold uppercase tracking-wide mt-5 mb-2" style={{fontFamily:'"Nunito",system-ui', color: isDarkMode ? '#A78BFA' : 'rgba(35,19,71,0.4)'}}>Habilidades en enfoque</p>
        <div className="rounded-2xl p-4 space-y-4 transition-colors"
          style={{
            background: isDarkMode ? '#1E0F33' : '#fff',
            boxShadow: isDarkMode ? '0 3px 0 rgba(0,0,0,0.2)' : '0 3px 0 rgba(35,19,71,0.07)',
            border: isDarkMode ? '1px solid #331C54' : 'none',
          }}>
          {skills.map(s => (
            <div key={s.label}>
              <div className="flex justify-between mb-1.5">
                <span className="text-sm font-bold" style={{fontFamily:'"Nunito",system-ui', color: isDarkMode ? '#fff' : '#231347'}}>{s.label}</span>
                <span className="text-sm font-bold" style={{color:s.color, fontFamily:'"Nunito",system-ui'}}>{s.value}%</span>
              </div>
              <div className="h-2.5 rounded-full overflow-hidden" style={{ background: isDarkMode ? '#140824' : '#gray-100' }}>
                <div className="h-full rounded-full transition-all duration-700"
                  style={{width:`${s.value}%`, background:s.color}}/>
              </div>
            </div>
          ))}
          {puzzlesSolved === 0 && (
            <p className="text-xs italic text-center" style={{fontFamily:'"Nunito",system-ui', color: isDarkMode ? '#A78BFA/60' : 'rgba(35,19,71,0.35)'}}>
              ¡Las habilidades crecen a medida que se resuelven rompecabezas!
            </p>
          )}
        </div>

        {/* Reto Familiar Cooperativo */}
        <p className="text-xs font-bold uppercase tracking-wide mt-5 mb-2" style={{fontFamily:'"Nunito",system-ui', color: isDarkMode ? '#A78BFA' : 'rgba(35,19,71,0.4)'}}>🎯 Reto Familiar Cooperativo</p>
        <div className="rounded-3xl p-5 flex flex-col gap-4 relative overflow-hidden transition-colors"
          style={{
            background: isDarkMode ? '#1E0F33' : '#fff',
            border: isDarkMode ? '1px solid #331C54' : 'none',
            boxShadow: isDarkMode ? '0 8px 30px rgba(0,0,0,0.3), 0 3px 0 rgba(0,0,0,0.4)' : '0 8px 30px rgba(142,107,255,0.06), 0 3px 0 rgba(35,19,71,0.07)',
          }}>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-xl flex-shrink-0">
              🏆
            </div>
            <div>
              <h4 className="font-bold text-base" style={{fontFamily:'"Fredoka",system-ui', color: isDarkMode ? '#fff' : '#231347'}}>Meta y Recompensa Familiar</h4>
              <p className="text-[10px] font-bold text-amber-500" style={{fontFamily:'"Nunito",system-ui'}}>TRABAJO EN EQUIPO</p>
            </div>
          </div>

          <div className="space-y-3 mt-1">
            <div>
              <span className="text-xs font-bold" style={{fontFamily:'"Nunito",system-ui', color: isDarkMode ? '#A78BFA' : 'rgba(35,19,71,0.6)'}}>1. Elegir Meta de Estrellas Combinadas:</span>
              <div className="flex gap-2 mt-1.5 overflow-x-auto no-scrollbar">
                {[25, 50, 75, 100, 150].map(starsVal => (
                  <button
                    key={starsVal}
                    onClick={() => {
                      setChallengeTarget(starsVal);
                      sound.playSnap();
                    }}
                    className="flex-1 py-2 px-3 rounded-xl font-bold text-xs transition-all active:scale-95 text-center flex-shrink-0 min-w-[50px]"
                    style={{
                      fontFamily: '"Fredoka",system-ui',
                      background: challengeTarget === starsVal ? '#FFC83D' : (isDarkMode ? '#24133D' : '#F4F2FA'),
                      color: challengeTarget === starsVal ? '#231347' : (isDarkMode ? '#D8B4FE' : '#231347'),
                      border: challengeTarget === starsVal ? 'none' : (isDarkMode ? '1px solid #3E1B6B' : '1px solid rgba(0,0,0,0.05)'),
                    }}
                  >
                    ⭐ {starsVal}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="text-xs font-bold" style={{fontFamily:'"Nunito",system-ui', color: isDarkMode ? '#A78BFA' : 'rgba(35,19,71,0.6)'}}>2. Definir Recompensa Familiar:</span>
              <input
                type="text"
                value={challengeReward}
                onChange={(e) => setChallengeReward(e.target.value)}
                placeholder="Ej. ¡Una tarde de helados y películas!"
                className="w-full mt-1.5 p-3 rounded-2xl text-xs font-semibold focus:outline-none transition-colors border"
                style={{
                  background: isDarkMode ? '#24133D' : '#F4F2FA',
                  color: isDarkMode ? '#white' : '#231347',
                  borderColor: isDarkMode ? '#3E1B6B' : 'rgba(35,19,71,0.1)',
                }}
              />
            </div>

            {/* Combined progress status */}
            {(() => {
              const totalFamilyStars = children.reduce((sum, c) => sum + getTotalStars(getProgress(c.id)), 0);
              const progressPct = Math.min(100, Math.round((totalFamilyStars / challengeTarget) * 100));
              const isChallengeMet = totalFamilyStars >= challengeTarget;
              return (
                <div className="p-3.5 rounded-2xl mt-2 border"
                  style={{
                    background: isDarkMode ? '#140824' : '#FFFBEB',
                    borderColor: isDarkMode ? '#331C54' : '#FDE68A',
                  }}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold" style={{fontFamily:'"Fredoka",system-ui', color: isDarkMode ? '#D8B4FE' : '#B45309'}}>
                      Progreso del Reto: {totalFamilyStars} / {challengeTarget} ⭐
                    </span>
                    <span className="text-xs font-extrabold" style={{fontFamily:'"Fredoka",system-ui', color: isChallengeMet ? '#10B981' : '#B45309'}}>
                      {isChallengeMet ? '🔓 ¡Completado!' : `${progressPct}%`}
                    </span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: isDarkMode ? '#05010B' : '#FEF3C7' }}>
                    <div className="h-full rounded-full"
                      style={{
                        width: `${progressPct}%`,
                        background: isChallengeMet
                          ? 'linear-gradient(90deg, #10B981, #059669)'
                          : 'linear-gradient(90deg, #FCD34D, #F59E0B)',
                        transition: 'width 0.5s ease-out'
                      }}
                    />
                  </div>
                  <p className="text-[10px] mt-1.5 font-bold italic" style={{fontFamily:'"Nunito",system-ui', color: isDarkMode ? '#A78BFA/70' : 'rgba(35,19,71,0.5)'}}>
                    {isChallengeMet 
                      ? '🎉 ¡Enhorabuena! El reto ha sido superado por el esfuerzo combinado de los niños.' 
                      : '💡 Las estrellas ganadas por todos los niños suman para desbloquear este premio.'}
                  </p>
                </div>
              );
            })()}

            <button
              onClick={() => handleSaveChallenge(challengeTarget, challengeReward)}
              disabled={savingChallenge}
              className="w-full mt-2 py-3 rounded-2xl font-bold text-xs text-white transition-all active:scale-95 flex items-center justify-center gap-2"
              style={{
                fontFamily: '"Fredoka",system-ui',
                background: showSavedToast ? '#10B981' : 'linear-gradient(90deg, #8E6BFF, #5A3BD1)',
                boxShadow: showSavedToast ? '0 3px 0 #059669' : '0 3px 0 #3E1B6B',
              }}
            >
              {showSavedToast ? '✓ ¡Guardado con éxito! 🎉' : savingChallenge ? 'Guardando...' : '💾 Guardar Reto Familiar'}
            </button>
          </div>
        </div>

        {/* AI Coach Premium Report */}
        <p className="text-xs font-bold uppercase tracking-wide mt-5 mb-2" style={{fontFamily:'"Nunito",system-ui', color: isDarkMode ? '#A78BFA' : 'rgba(35,19,71,0.4)'}}>🤖 AI Coach: Reporte de Inteligencia y Desarrollo</p>
        <div className="rounded-3xl p-5 flex flex-col gap-4 relative overflow-hidden transition-colors"
          style={{
            background: isDarkMode ? '#1E0F33' : '#fff',
            border: isDarkMode ? '1px solid #3E1B6B' : '1px solid #F3E8FF',
            boxShadow: isDarkMode ? '0 8px 30px rgba(0,0,0,0.3), 0 3px 0 rgba(0,0,0,0.4)' : '0 8px 30px rgba(142,107,255,0.06), 0 3px 0 rgba(35,19,71,0.07)',
          }}>
          
          <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-purple-500/5 blur-xl pointer-events-none" />
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 flex items-center justify-center text-xl flex-shrink-0">
              💡
            </div>
            <div>
              <h4 className="font-bold text-base" style={{fontFamily:'"Fredoka",system-ui', color: isDarkMode ? '#fff' : '#231347'}}>Análisis Cognitivo Escrito</h4>
              <p className="text-[10px] font-bold" style={{fontFamily:'"Nunito",system-ui', color: isDarkMode ? '#A78BFA' : 'rgba(35,19,71,0.4)'}}>METRICAS DE HEURÍSTICA DE JUEGO</p>
            </div>
          </div>

          <div className="space-y-3.5 mt-1">
            {/* Logic Analysis */}
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-xs">📐</span>
                <span className="text-xs font-bold text-ink" style={{fontFamily:'"Nunito",system-ui', color: isDarkMode ? '#fff' : '#231347'}}>Lógica y Rotación Espacial:</span>
              </div>
              <p className="text-xs leading-relaxed pl-5" style={{fontFamily:'"Nunito",system-ui', color: isDarkMode ? '#C0A0FF' : 'rgba(35,19,71,0.65)'}}>
                {puzzlesSolved === 0 
                  ? 'Aún no hay datos de juego suficientes. Resuelve niveles para evaluar.'
                  : puzzlesSolved >= 10 
                  ? 'Desarrollo Avanzado: Demuestra una habilidad excepcional para predecir la orientación espacial y rotar bichos sin ensayar físicamente demasiadas veces.'
                  : 'Fase de Exploración: Está asimilando las restricciones de forma tridimensional. Muestra paciencia al ensayar giros en las esquinas.'}
              </p>
            </div>

            {/* Resilience Analysis */}
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-xs">💪</span>
                <span className="text-xs font-bold text-ink" style={{fontFamily:'"Nunito",system-ui', color: isDarkMode ? '#fff' : '#231347'}}>Resiliencia Cognitiva (Tolerancia al Error):</span>
              </div>
              <p className="text-xs leading-relaxed pl-5" style={{fontFamily:'"Nunito",system-ui', color: isDarkMode ? '#C0A0FF' : 'rgba(35,19,71,0.65)'}}>
                {puzzlesSolved === 0 
                  ? 'Completar niveles revelará los hábitos de superación ante obstáculos.'
                  : totalHints === 0 
                  ? 'Autonomía Sobresaliente: Resuelve todos los retos de forma independiente sin apoyarse en pistas, lo que demuestra alta confianza ante problemas difíciles.'
                  : totalHints > puzzlesSolved * 1.5 
                  ? 'Búsqueda Estratégica: Utiliza las pistas como herramienta proactiva de aprendizaje para superar frustraciones, un gran rasgo de adaptabilidad.'
                  : 'Equilibrio Saludable: Intenta resolver de forma autónoma primero y acude a pistas cortas solo en bloqueos complejos.'}
              </p>
            </div>

            {/* Off-screen recommendation plan */}
            <div className="p-4 rounded-2xl mt-2 relative border"
              style={{
                background: isDarkMode ? '#24133D' : '#F5F3FF',
                borderColor: isDarkMode ? '#3E1B6B' : '#E9D5FF',
              }}>
              <button
                onClick={() => {
                  if ('speechSynthesis' in window) {
                    window.speechSynthesis.cancel();
                    const text = "Plan de Actividad Fuera de Pantalla. Uno. Tangrams o Bloques Físicos. Jugar a replicar siluetas para trasladar la manipulación digital al tacto real. Dos. Preguntas de Metacognición. Pregúntale cómo decidió que una pieza cabía en un rincón para fomentar su verbalización lógica. Tres. Rompecabezas de Encaje.";
                    const utterance = new SpeechSynthesisUtterance(text);
                    utterance.lang = 'es-ES';
                    window.speechSynthesis.speak(utterance);
                  }
                }}
                className="absolute top-2.5 right-2.5 text-xs bg-purple-100 hover:bg-purple-200 active:scale-95 p-1 rounded-full text-purple-700"
                title="Escuchar plan semanal"
              >
                🔊
              </button>
              
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-sm">🎲</span>
                <span className="text-xs font-bold text-purple-700" style={{fontFamily:'"Fredoka",system-ui'}}>Plan de Actividad Fuera de Pantalla (Semanal)</span>
              </div>
              <ul className="space-y-1.5 pl-4 list-disc text-xs leading-relaxed" style={{fontFamily:'"Nunito",system-ui', color: isDarkMode ? '#C0A0FF' : 'rgba(35,19,71,0.75)'}}>
                <li>
                  <strong>Tangrams o Bloques Físicos:</strong> Jugar a replicar siluetas del Tangram para trasladar la manipulación digital a una experiencia de tacto real tridimensional.
                </li>
                <li>
                  <strong>Preguntas de Metacognición:</strong> Cuando jueguen juntos, hazle la pregunta: <em>"¿Cómo decidiste que Rose cabía exactamente en esa esquina?"</em> Esto estimula la verbalización lógica.
                </li>
                <li>
                  <strong>Rompecabezas de Encaje:</strong> Fortalecer el razonamiento espacial con juegos clásicos de apilar o laberintos físicos de bolitas.
                </li>
              </ul>
            </div>

            {/* Email & PDF Report Buttons */}
            <div className="mt-2 border-t pt-3.5 flex flex-col gap-2" style={{ borderColor: isDarkMode ? '#3E1B6B' : '#E9D5FF' }}>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleSendEmailReport}
                  disabled={sendingEmail || !parent?.email}
                  className="py-3 rounded-2xl font-bold text-xs transition-all active:scale-95 flex items-center justify-center gap-1.5"
                  style={{
                    fontFamily: '"Fredoka",system-ui',
                    background: isDarkMode ? '#3A1C6A' : '#F5F3FF',
                    color: isDarkMode ? '#E9D5FF' : '#8E6BFF',
                    border: isDarkMode ? '1px solid #5C32A5' : '1px solid #E9D5FF',
                  }}
                >
                  {sendingEmail ? 'Enviando...' : '📨 Enviar Correo'}
                </button>
                
                <button
                  onClick={handleTriggerReportPrint}
                  className="py-3 rounded-2xl font-bold text-xs transition-all active:scale-95 flex items-center justify-center gap-1.5"
                  style={{
                    fontFamily: '"Fredoka",system-ui',
                    background: 'linear-gradient(90deg, #8E6BFF, #5A3BD1)',
                    color: '#ffffff',
                    boxShadow: isDarkMode ? '0 3px 0 #3E1B6B' : '0 3px 0 #5A3BD1',
                  }}
                >
                  🖨️ Descargar PDF
                </button>
              </div>

              {emailStatus && (
                <div 
                  className={`mt-2 p-3 rounded-xl text-center text-xs font-semibold border ${
                    emailStatus.type === 'success' 
                      ? (isDarkMode ? 'bg-emerald-950/30 border-emerald-900/50 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700') 
                      : (isDarkMode ? 'bg-red-950/30 border-red-900/50 text-red-400' : 'bg-red-50 border-red-200 text-red-700')
                  }`}
                  style={{ fontFamily: '"Nunito",system-ui' }}
                >
                  {emailStatus.message}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Tutorial Carousel */}
        <p className="text-xs font-bold uppercase tracking-wide mt-5 mb-2" style={{fontFamily:'"Nunito",system-ui', color: isDarkMode ? '#A78BFA' : 'rgba(35,19,71,0.4)'}}>📚 Guía de Interpretación del AI Coach</p>
        <div className="rounded-3xl p-5 relative overflow-hidden transition-colors flex flex-col gap-4"
          style={{
            background: isDarkMode ? '#1E0F33' : 'white',
            border: isDarkMode ? '1px solid #3E1B6B' : '1px solid #F3E8FF',
            boxShadow: isDarkMode ? '0 8px 30px rgba(0,0,0,0.3), 0 3px 0 rgba(0,0,0,0.4)' : '0 8px 30px rgba(142,107,255,0.06), 0 3px 0 rgba(35,19,71,0.07)',
          }}>
          
          <AnimatePresence mode="wait">
            <motion.div
              key={tutorialStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="flex items-start gap-4 min-h-[100px]"
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${TUTORIAL_SLIDES[tutorialStep].color} flex items-center justify-center text-3xl text-white shadow-lg flex-shrink-0`}>
                {TUTORIAL_SLIDES[tutorialStep].icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[9px] font-extrabold tracking-wider uppercase px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300">
                    {TUTORIAL_SLIDES[tutorialStep].badge}
                  </span>
                  <span className="text-[10px] font-bold text-ink/40">Diapositiva {tutorialStep + 1} de 4</span>
                </div>
                <h4 className="font-bold text-sm mb-1" style={{fontFamily:'"Fredoka",system-ui', color: isDarkMode ? '#fff' : '#231347'}}>
                  {TUTORIAL_SLIDES[tutorialStep].title}
                </h4>
                <p className="text-xs leading-relaxed" style={{fontFamily:'"Nunito",system-ui', color: isDarkMode ? '#C0A0FF' : 'rgba(35,19,71,0.65)'}}>
                  {TUTORIAL_SLIDES[tutorialStep].desc}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-between border-t pt-3" style={{ borderColor: isDarkMode ? '#2D1452' : '#F4F2FA' }}>
            {/* Dots */}
            <div className="flex gap-1.5">
              {[0, 1, 2, 3].map((idx) => (
                <button
                  key={idx}
                  onClick={() => { sound.playClick(); setTutorialStep(idx); }}
                  className={`h-2 rounded-full transition-all duration-300 ${tutorialStep === idx ? 'w-5 bg-purple-500' : 'w-2 bg-purple-200 dark:bg-purple-950/40'}`}
                  aria-label={`Ir al paso ${idx + 1}`}
                />
              ))}
            </div>

            {/* Nav Buttons */}
            <div className="flex gap-2">
              <button
                disabled={tutorialStep === 0}
                onClick={() => {
                  sound.playClick();
                  setTutorialStep(s => Math.max(0, s - 1));
                }}
                className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition-all flex items-center justify-center border ${
                  tutorialStep === 0 
                    ? 'opacity-40 cursor-not-allowed border-transparent text-ink/30' 
                    : 'active:scale-95 text-purple-600 dark:text-purple-300 border-purple-200 dark:border-purple-900/50 hover:bg-purple-50 dark:hover:bg-purple-950/20'
                }`}
                style={{ fontFamily: '"Fredoka",system-ui' }}
              >
                Anterior
              </button>
              <button
                onClick={() => {
                  sound.playClick();
                  if (tutorialStep < 3) {
                    setTutorialStep(s => s + 1);
                  } else {
                    setTutorialStep(0); // Loop back
                  }
                }}
                className="px-3 py-1.5 rounded-xl font-bold text-[11px] text-white transition-all active:scale-95 flex items-center justify-center"
                style={{
                  fontFamily: '"Fredoka",system-ui',
                  background: 'linear-gradient(135deg, #8E6BFF, #6D44FF)',
                  boxShadow: '0 2px 0 #4C26C9'
                }}
              >
                {tutorialStep === 3 ? 'Comenzar' : 'Siguiente'}
              </button>
            </div>
          </div>
        </div>

        {/* Recent activity */}
        {progress && Object.keys(progress.levelProgress).length > 0 && (
          <>
            <p className="text-xs font-bold uppercase tracking-wide mt-5 mb-2" style={{fontFamily:'"Nunito",system-ui', color: isDarkMode ? '#A78BFA' : 'rgba(35,19,71,0.4)'}}>Actividad reciente</p>
            <div className="rounded-2xl overflow-hidden transition-colors"
              style={{
                background: isDarkMode ? '#1E0F33' : '#fff',
                boxShadow: isDarkMode ? '0 3px 0 rgba(0,0,0,0.2)' : '0 3px 0 rgba(35,19,71,0.07)',
                border: isDarkMode ? '1px solid #331C54' : 'none',
              }}>
              {Object.entries(progress.levelProgress).slice(-5).reverse().map(([lid,lp],i,arr) => (
                <div key={lid} className="flex items-center gap-3 px-4 py-3"
                  style={{borderBottom: i<arr.length-1 ? (isDarkMode ? '1px solid #2A174E' : '1px solid #F0EEF6') : 'none'}}>
                  <span className="text-2xl">{lid.includes('meadow')?'🌿':lid.includes('crystal')?'💎':lid.includes('robo')?'🤖':lid.includes('ocean')?'🌊':lid.includes('volcano')?'🌋':'🚀'}</span>
                  <div className="flex-1">
                    <div className="text-sm font-bold" style={{fontFamily:'"Nunito",system-ui', color: isDarkMode ? '#white' : '#231347'}}>
                      {lid.replace('meadow-l','Pradera ').replace('crystal-l','Cueva ').replace('robo-l','Arrecife ').replace('ocean-l','Océano ').replace('volcano-l','Volcán ').replace('space-l','Espacio ')}
                    </div>
                    <StarRating stars={lp.stars} size={12}/>
                  </div>
                  <span className="text-xs font-bold" style={{fontFamily:'"Nunito",system-ui', color: isDarkMode ? '#purple-300/60' : 'rgba(35,19,71,0.35)'}}>
                    {new Date(lp.completedAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Parent tools */}
        <p className="text-xs font-bold uppercase tracking-wide mt-5 mb-2" style={{fontFamily:'"Nunito",system-ui', color: isDarkMode ? '#A78BFA' : 'rgba(35,19,71,0.4)'}}>
          {language === 'en' ? 'Parent Tools' : 'Herramientas de padres'}
        </p>
        <div className="rounded-2xl overflow-hidden transition-colors"
          style={{
            background: isDarkMode ? '#1E0F33' : '#fff',
            boxShadow: isDarkMode ? '0 3px 0 rgba(0,0,0,0.2)' : '0 3px 0 rgba(35,19,71,0.07)',
            border: isDarkMode ? '1px solid #331C54' : 'none',
          }}>
          {[
            {icon:'👥', label: language === 'en' ? 'Manage profiles' : 'Gestionar perfiles',  sub: language === 'en' ? 'Add, edit, or delete child profiles' : 'Añade, edita o elimina perfiles de niños', action:()=>navigate('child-select'), disabled: false},
            {icon:'🖨️', label: language === 'en' ? 'Print physical puzzle' : 'Imprimir rompecabezas físico', sub: language === 'en' ? 'Download a paper Tangram template to cut out and play' : 'Descarga en papel una plantilla de Tangram para recortar y jugar', action:()=>handleTriggerPrint(), disabled: false},
            {icon:'🔄', label: language === 'en' ? 'Reset progress' : 'Restablecer progreso',    sub: language === 'en' ? 'Clear all stars and medals for this profile' : 'Borra todas las estrellas y medallas de este perfil', action:()=>setConfirmReset(true), danger:true, disabled: false},
            {icon:'⏱',  label: language === 'en' ? 'Screen time' : 'Tiempo en pantalla',       sub: child?.dailyTimeLimit ? (language === 'en' ? `Active limit: ${child.dailyTimeLimit} minutes` : `Límite activo: ${child.dailyTimeLimit} minutos`) : (language === 'en' ? 'No active daily limit (Tap to configure)' : 'Sin límite diario activo (Toca para configurar)'), action:()=>setShowScreenTime(true), disabled: false},
            {icon:'🔒', label: language === 'en' ? 'Safety & privacy' : 'Seguridad y privacidad',  sub: language === 'en' ? 'View child data policy' : 'Ver política de datos infantiles', action:()=>navigate('settings'), disabled: false},
          ].map((t,i,arr) => (
            <button key={t.label} onClick={t.action} disabled={t.disabled}
              className="flex items-center gap-3 w-full px-4 py-3.5 text-left transition-colors active:bg-purple-100/10"
              style={{
                borderBottom: i<arr.length-1 ? (isDarkMode ? '1px solid #2A174E' : '1px solid #F0EEF6') : 'none',
                opacity: t.disabled ? 0.45 : 1,
              }}>
              <span className="text-xl w-8 text-center">{t.icon}</span>
              <div className="flex-1">
                <div className={`font-bold text-sm ${t.danger ? 'text-red-600' : (isDarkMode ? 'text-white' : 'text-ink')}`} style={{fontFamily:'"Nunito",system-ui'}}>{t.label}</div>
                <div className="text-xs" style={{fontFamily:'"Nunito",system-ui', color: isDarkMode ? '#A78BFA' : 'rgba(35,19,71,0.45)'}}>{t.sub}</div>
              </div>
              {!t.disabled && (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                  <path d="M9 6l6 6-6 6" stroke={isDarkMode ? '#8B5CF6' : 'rgba(35,19,71,0.3)'} strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
              )}
            </button>
          ))}
        </div>

        {/* Safety note */}
        <div className="mt-4 p-4 rounded-2xl"
          style={{
            background: isDarkMode ? 'rgba(63,208,158,0.04)' : 'rgba(63,208,158,0.08)',
            border: isDarkMode ? '1px solid rgba(63,208,158,0.12)' : '1px solid rgba(63,208,158,0.2)'
          }}>
          <p className="text-xs font-semibold leading-relaxed" style={{fontFamily:'"Nunito",system-ui', color: isDarkMode ? '#34D399' : '#1F7A5A'}}>
            {language === 'en'
              ? '🔒 BRAIN BUGS collects minimal child data: only a nickname, avatar, and optional age range. No child email or personal information is required. All content is specially designed for ages 5 to 9.'
              : '🔒 BRAIN BUGS recopila datos mínimos de los niños: solo un apodo, avatar y rango de edad opcional. No se requiere correo electrónico ni información personal de los niños. Todo el contenido está diseñado especialmente para edades de 5 a 9 años.'}
          </p>
        </div>

        <button onClick={signOut}
          className="w-full mt-4 py-3 rounded-2xl font-bold text-center transition-all active:scale-95"
          style={{
            fontFamily:'"Fredoka",system-ui',
            background: isDarkMode ? '#330808' : '#FFF0F0',
            color: '#EF4444',
            border: isDarkMode ? '1px solid #581C1C' : 'none',
            boxShadow: isDarkMode ? 'none' : '0 3px 0 rgba(200,0,0,0.07)'
          }}>
          {t('exit')}
        </button>
        <div className="h-6"/>
      </div>

      {/* Screen Time Limit Setting Modal */}
      {showScreenTime && child && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60" onClick={() => setShowScreenTime(false)}>
          <div className="rounded-3xl p-6 w-full max-w-xs text-center border transition-all" onClick={e => e.stopPropagation()}
            style={{
              background: isDarkMode ? '#1E0F33' : '#white',
              backgroundColor: isDarkMode ? '#1E0F33' : '#white',
              color: isDarkMode ? '#white' : '#231347',
              borderColor: isDarkMode ? '#331C54' : '#E9D5FF',
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            }}>
            <div className="text-4xl mb-3">⏱</div>
            <h3 className="text-xl font-bold mb-1" style={{ fontFamily: '"Fredoka",system-ui', color: isDarkMode ? '#white' : '#231347' }}>
              {language === 'en' ? 'Daily Time Limit' : 'Límite de Tiempo Diario'}
            </h3>
            <p className="text-xs font-semibold mb-4" style={{ fontFamily: '"Nunito",system-ui', color: isDarkMode ? '#A78BFA' : 'rgba(35,19,71,0.5)' }}>
              {language === 'en'
                ? `Set the maximum time that ${child.nickname} can play per day.`
                : `Establece el tiempo máximo que ${child.nickname} puede jugar al día.`}
            </p>

            <div className="flex flex-col gap-2 mb-6">
              {[
                { label: language === 'en' ? '🔓 No limit' : '🔓 Sin límite', value: 0 },
                { label: language === 'en' ? '⏱ 15 minutes' : '⏱ 15 minutos', value: 15 },
                { label: language === 'en' ? '⏱ 30 minutes' : '⏱ 30 minutos', value: 30 },
                { label: language === 'en' ? '⏱ 45 minutes' : '⏱ 45 minutos', value: 45 },
                { label: language === 'en' ? '⏱ 60 minutes' : '⏱ 60 minutos', value: 60 },
              ].map(opt => {
                const active = (child.dailyTimeLimit ?? 0) === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => {
                      updateChildTimeLimit(child.id, opt.value);
                      sound.playSnap();
                    }}
                    className="w-full py-3 px-4 rounded-xl font-bold transition-all text-left flex items-center justify-between"
                    style={{
                      fontFamily: '"Fredoka",system-ui',
                      background: active
                        ? 'linear-gradient(180deg,#8E6BFF,#5A3BD1)'
                        : isDarkMode ? '#2D174E' : '#F4F2FA',
                      color: active ? '#fff' : isDarkMode ? '#D8B4FE' : '#231347',
                      border: active ? 'none' : '1px solid transparent',
                    }}
                  >
                    <span>{opt.label}</span>
                    {active && <span className="text-white font-bold">✓</span>}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setShowScreenTime(false)}
              className="w-full py-3 rounded-2xl font-bold text-white transition-all active:scale-95"
              style={{
                background: 'linear-gradient(180deg,#3FD09E,#1F9A6E)',
                fontFamily: '"Fredoka",system-ui',
                boxShadow: '0 4px 0 #156B4D',
              }}
            >
              {language === 'en' ? 'Save Changes! 🌟' : '¡Guardar Cambios! 🌟'}
            </button>
          </div>
        </div>
      )}

      {/* Reset confirmation */}
      {confirmReset && child && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/55">
          <div className="rounded-3xl p-6 w-full max-w-xs text-center border"
            style={{
              background: isDarkMode ? '#1E0F33' : '#white',
              backgroundColor: isDarkMode ? '#1E0F33' : '#white',
              borderColor: isDarkMode ? '#331C54' : 'transparent',
              color: isDarkMode ? '#white' : '#231347',
            }}>
            <div className="text-4xl mb-3">⚠️</div>
            <h3 className="text-lg font-bold mb-2" style={{fontFamily:'"Fredoka",system-ui', color: isDarkMode ? '#white' : '#231347'}}>
              {language === 'en' ? `Reset ${child.nickname}?` : `¿Restablecer a ${child.nickname}?`}
            </h3>
            <p className="text-sm font-semibold mb-5" style={{fontFamily:'"Nunito",system-ui', color: isDarkMode ? '#A78BFA' : 'rgba(35,19,71,0.6)'}}>
              {language === 'en'
                ? 'All stars, medals, and level progress will be permanently erased.'
                : 'Todas las estrellas, medallas y el progreso de nivel se borrarán permanentemente.'}
            </p>
            <div className="flex gap-2">
              <button onClick={()=>setConfirmReset(false)}
                className="flex-1 py-3 rounded-2xl font-bold active:scale-95 transition-all"
                style={{
                  fontFamily:'"Fredoka",system-ui',
                  background: isDarkMode ? '#2D174E' : '#E5E7EB',
                  color: isDarkMode ? '#D8B4FE' : '#231347'
                }}>
                {language === 'en' ? 'Cancel' : 'Cancelar'}
              </button>
              <button onClick={()=>{ resetChildProgress(child.id); setConfirmReset(false); }}
                className="flex-1 py-3 rounded-2xl font-bold text-white bg-red-500 active:scale-95"
                style={{fontFamily:'"Fredoka",system-ui', boxShadow:'0 4px 0 #B02020'}}>
                {language === 'en' ? 'Reset' : 'Restablecer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Printable Area */}
      <div id="printable-puzzle-area" className="hidden print:block p-8 font-sans text-black bg-white" style={{ background: 'white', color: 'black' }}>
        <div className="text-center border-b-2 border-black pb-4 mb-6">
          <h1 className="text-3xl font-extrabold tracking-wider" style={{ fontFamily: '"Segoe UI", sans-serif' }}>
            {language === 'en' ? '🧠 BRAIN BUGS: Physical Puzzle' : '🧠 BRAIN BUGS: Rompecabezas Físico'}
          </h1>
          <p className="text-sm font-semibold text-gray-600 mt-1">
            {language === 'en' ? 'Logical stimulation plan & tactile spatial reasoning' : 'Plan de estimulación lógica y razonamiento espacial táctil'}
          </p>
        </div>

        <div className="mb-6 bg-gray-50 border border-gray-200 p-4 rounded-xl">
          <h3 className="text-base font-bold text-gray-800 mb-1">
            {language === 'en' ? '📢 Parent Instructions:' : '📢 Instrucciones para Padres:'}
          </h3>
          <ol className="list-decimal pl-5 text-xs text-gray-600 space-y-1">
            {language === 'en' ? (
              <>
                <li><strong>Cut out the pieces</strong> (the bugs) located in the dashed rectangle below.</li>
                <li>Place the pieces in the empty board cells trying to <strong>fill the entire grid</strong> without overlapping.</li>
                <li><strong>Respect obstacles:</strong> cells marked as dark stone (🪨) must remain empty.</li>
                <li><strong>Respect locks:</strong> if a cell has a bug icon, it must be occupied by that specific bug piece type.</li>
              </>
            ) : (
              <>
                <li><strong>Recorta las piezas</strong> (los bichos) que se encuentran en el recuadro inferior con líneas punteadas.</li>
                <li>Coloca las piezas en las celdas vacías del tablero intentando <strong>llenar toda la grilla</strong> sin superponerlas.</li>
                <li><strong>Respeta los obstáculos:</strong> las celdas marcadas como piedra oscura (🪨) deben permanecer vacías.</li>
                <li><strong>Respeta las cerraduras:</strong> si una celda tiene un dibujo de bicho, esa celda debe ser ocupada por ese tipo específico de pieza.</li>
              </>
            )}
          </ol>
        </div>

        <div className="flex flex-col items-center mb-8">
          <h4 className="text-lg font-bold text-gray-800 mb-4">
            {language === 'en' ? `🧩 Coordinate Board (${child?.nickname})` : `🧩 Tablero de Coordenadas (${child?.nickname})`}
          </h4>
          
          {/* Printable 5x5 Grid */}
          <div className="grid grid-cols-5 gap-1.5 p-3 bg-gray-100 border-2 border-gray-400 rounded-xl" style={{ width: '320px', height: '320px', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)' }}>
            {[...Array(25)].map((_, idx) => {
              const r = Math.floor(idx / 5);
              const c = idx % 5;
              // Hardcoded block coordinates for printing a standard solvable logic layout
              const isBlocked = (c === 0 && r === 0) || (c === 4 && r === 4) || (c === 2 && r === 2) || (c === 0 && r === 4);
              return (
                <div
                  key={`print-cell-${idx}`}
                  className={`border border-gray-300 rounded flex flex-col items-center justify-center relative font-bold text-[10px]`}
                  style={{
                    backgroundColor: isBlocked ? '#1F2937' : '#FFFFFF',
                    color: isBlocked ? '#FFFFFF' : '#9CA3AF',
                    border: '1px solid #D1D5DB',
                    aspectRatio: '1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {isBlocked ? (
                    <span className="text-lg">🪨</span>
                  ) : (
                    <span>{String.fromCharCode(65 + c)}{r + 1}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Piece Cut-outs Block */}
        <div className="border-2 border-dashed border-gray-400 p-5 rounded-2xl bg-white mt-8">
          <h4 className="text-base font-extrabold text-gray-800 border-b border-gray-300 pb-2 mb-4 text-center">
            {language === 'en' ? '✂️ Logical Bug Cut-outs (Physical Tangram)' : '✂️ Recortables de Bichos Lógicos (Tangram Físico)'}
          </h4>
          <p className="text-[11px] text-gray-500 text-center mb-6">
            {language === 'en' ? 'Cut carefully along the dashed lines to get the physical play tokens.' : 'Recorta cuidadosamente por las líneas de trazos para obtener las fichas de manipulación real.'}
          </p>
          
          <div className="flex justify-around items-center" style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
            {/* Piece 1: Rose (2 cells) */}
            <div className="border border-dashed border-gray-400 p-3 rounded flex flex-col items-center bg-gray-50" style={{ width: '80px', border: '1px dashed #9CA3AF', padding: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span className="text-2xl mb-1">🌸</span>
              <span className="text-[10px] font-bold text-gray-700">{language === 'en' ? 'Rose (2 cells)' : 'Rose (2 celdas)'}</span>
              <div className="flex gap-0.5 mt-2" style={{ display: 'flex', gap: '2px', marginTop: '8px' }}>
                <div className="w-4 h-4 border border-gray-300 bg-pink-100 rounded" style={{ width: '16px', height: '16px', border: '1px solid #D1D5DB', backgroundColor: '#FCE7F3' }}/>
                <div className="w-4 h-4 border border-gray-300 bg-pink-100 rounded" style={{ width: '16px', height: '16px', border: '1px solid #D1D5DB', backgroundColor: '#FCE7F3' }}/>
              </div>
            </div>

            {/* Piece 2: Pip (3 cells) */}
            <div className="border border-dashed border-gray-400 p-3 rounded flex flex-col items-center bg-gray-50" style={{ width: '80px', border: '1px dashed #9CA3AF', padding: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span className="text-2xl mb-1">🐛</span>
              <span className="text-[10px] font-bold text-gray-700">{language === 'en' ? 'Pip (3 cells)' : 'Pip (3 celdas)'}</span>
              <div className="flex gap-0.5 mt-2" style={{ display: 'flex', gap: '2px', marginTop: '8px' }}>
                <div className="w-4 h-4 border border-gray-300 bg-emerald-100 rounded" style={{ width: '16px', height: '16px', border: '1px solid #D1D5DB', backgroundColor: '#D1FAE5' }}/>
                <div className="w-4 h-4 border border-gray-300 bg-emerald-100 rounded" style={{ width: '16px', height: '16px', border: '1px solid #D1D5DB', backgroundColor: '#D1FAE5' }}/>
                <div className="w-4 h-4 border border-gray-300 bg-emerald-100 rounded" style={{ width: '16px', height: '16px', border: '1px solid #D1D5DB', backgroundColor: '#D1FAE5' }}/>
              </div>
            </div>

            {/* Piece 3: Bobo (3 cells L) */}
            <div className="border border-dashed border-gray-400 p-3 rounded flex flex-col items-center bg-gray-50" style={{ width: '80px', border: '1px dashed #9CA3AF', padding: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span className="text-2xl mb-1">🦋</span>
              <span className="text-[10px] font-bold text-gray-700">{language === 'en' ? 'Bobo (L - 3 c)' : 'Bobo (L - 3 c)'}</span>
              <div className="flex flex-col items-start mt-2" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginTop: '8px' }}>
                <div className="flex gap-0.5" style={{ display: 'flex', gap: '2px' }}>
                  <div className="w-4 h-4 border border-gray-300 bg-purple-100 rounded" style={{ width: '16px', height: '16px', border: '1px solid #D1D5DB', backgroundColor: '#F3E8FF' }}/>
                  <div className="w-4 h-4 border border-gray-300 bg-purple-100 rounded" style={{ width: '16px', height: '16px', border: '1px solid #D1D5DB', backgroundColor: '#F3E8FF' }}/>
                </div>
                <div className="w-4 h-4 border border-gray-300 bg-purple-100 rounded" style={{ width: '16px', height: '16px', border: '1px solid #D1D5DB', backgroundColor: '#F3E8FF', marginTop: '2px' }}/>
              </div>
            </div>

            {/* Piece 4: Zig (4 cells Z) */}
            <div className="border border-dashed border-gray-400 p-3 rounded flex flex-col items-center bg-gray-50" style={{ width: '80px', border: '1px dashed #9CA3AF', padding: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span className="text-2xl mb-1">🐞</span>
              <span className="text-[10px] font-bold text-gray-700">{language === 'en' ? 'Zig (Z - 4 c)' : 'Zig (Z - 4 c)'}</span>
              <div className="flex flex-col items-center mt-2" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '8px' }}>
                <div className="flex gap-0.5" style={{ display: 'flex', gap: '2px' }}>
                  <div className="w-4 h-4 border border-gray-300 bg-amber-100 rounded" style={{ width: '16px', height: '16px', border: '1px solid #D1D5DB', backgroundColor: '#FEF3C7' }}/>
                  <div className="w-4 h-4 border border-gray-300 bg-amber-100 rounded" style={{ width: '16px', height: '16px', border: '1px solid #D1D5DB', backgroundColor: '#FEF3C7' }}/>
                </div>
                <div className="flex gap-0.5" style={{ display: 'flex', gap: '2px', marginLeft: '16px', marginTop: '2px' }}>
                  <div className="w-4 h-4 border border-gray-300 bg-amber-100 rounded" style={{ width: '16px', height: '16px', border: '1px solid #D1D5DB', backgroundColor: '#FEF3C7' }}/>
                  <div className="w-4 h-4 border border-gray-300 bg-amber-100 rounded" style={{ width: '16px', height: '16px', border: '1px solid #D1D5DB', backgroundColor: '#FEF3C7' }}/>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="text-center mt-12 border-t pt-4 text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
          {language === 'en'
            ? '© BRAIN BUGS Co. · Designed to stimulate Reasoning & Cognitive Development in a fun & offline way'
            : '© BRAIN BUGS Co. · Diseñado para estimular el Razonamiento y Desarrollo Cognitivo de forma divertida y offline'}
        </div>
      </div>

      {/* Hidden Printable AI Coach Report */}
      <div id="printable-coach-report" className="hidden print:block p-8 font-sans text-black bg-white" style={{ background: 'white', color: 'black' }}>
        <div className="text-center border-b-2 border-black pb-4 mb-6">
          <h1 className="text-3xl font-extrabold tracking-wider" style={{ fontFamily: '"Segoe UI", sans-serif' }}>
            {language === 'en' ? '🤖 BRAIN BUGS: Intelligence & Development Report' : '🤖 BRAIN BUGS: Reporte de Inteligencia y Desarrollo'}
          </h1>
          <p className="text-sm font-semibold text-gray-600 mt-1">
            {language === 'en' ? 'Game Heuristics Analysis & Weekly Pedagogical Plan' : 'Análisis de Heurística de Juego & Plan Pedagógico Semanal'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6 text-sm border-b pb-4" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', borderBottom: '1px solid #000', paddingBottom: '16px', marginBottom: '24px' }}>
          <div>
            <p><strong>{language === 'en' ? 'Parent/Guardian:' : 'Padre/Tutor:'}</strong> {parent?.displayName || 'Padre/Madre'} ({parent?.email || 'N/A'})</p>
            <p><strong>{language === 'en' ? 'Child Profile:' : 'Perfil del Niño:'}</strong> {child?.nickname}</p>
          </div>
          <div className="text-right" style={{ textAlign: 'right' }}>
            <p><strong>{language === 'en' ? 'Date of Issue:' : 'Fecha de Emisión:'}</strong> {new Date().toLocaleDateString(language === 'en' ? 'en-US' : 'es-ES')}</p>
            <p><strong>{language === 'en' ? 'Cognitive Development:' : 'Desarrollo Cognitivo:'}</strong> {language === 'en' ? 'Spatial Reasoning & Resilience' : 'Razonamiento Espacial y Resiliencia'}</p>
          </div>
        </div>

        {/* Stats Table */}
        <div className="mb-6" style={{ marginBottom: '24px' }}>
          <h3 className="text-base font-bold text-gray-800 mb-2 border-b pb-1" style={{ borderBottom: '1px solid #E5E7EB', paddingBottom: '4px', marginBottom: '8px' }}>
            {language === 'en' ? '📊 Cumulative Statistics' : '📊 Estadísticas Acumuladas'}
          </h3>
          <table className="w-full text-left text-xs border border-collapse" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ backgroundColor: '#F3F4F6' }}>
                <th className="p-2 border" style={{ padding: '8px', border: '1px solid #D1D5DB' }}>{language === 'en' ? 'Metric' : 'Métrica'}</th>
                <th className="p-2 border text-right" style={{ padding: '8px', border: '1px solid #D1D5DB', textAlign: 'right' }}>{language === 'en' ? 'Value' : 'Valor'}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-2 border" style={{ padding: '8px', border: '1px solid #D1D5DB' }}>{language === 'en' ? 'Puzzles Completed' : 'Rompecabezas Completados'}</td>
                <td className="p-2 border text-right" style={{ padding: '8px', border: '1px solid #D1D5DB', textAlign: 'right' }}>{puzzlesSolved}</td>
              </tr>
              <tr>
                <td className="p-2 border" style={{ padding: '8px', border: '1px solid #D1D5DB' }}>{language === 'en' ? 'Stars Earned' : 'Estrellas Ganadas'}</td>
                <td className="p-2 border text-right" style={{ padding: '8px', border: '1px solid #D1D5DB', textAlign: 'right' }}>{totalStars} ⭐</td>
              </tr>
              <tr>
                <td className="p-2 border" style={{ padding: '8px', border: '1px solid #D1D5DB' }}>{language === 'en' ? 'Hints Requested' : 'Pistas Solicitadas'}</td>
                <td className="p-2 border text-right" style={{ padding: '8px', border: '1px solid #D1D5DB', textAlign: 'right' }}>{totalHints}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Cognitive Heuristics Analysis */}
        <div className="mb-6" style={{ marginBottom: '24px' }}>
          <h3 className="text-base font-bold text-gray-800 mb-2 border-b pb-1" style={{ borderBottom: '1px solid #E5E7EB', paddingBottom: '4px', marginBottom: '8px' }}>
            {language === 'en' ? '📐 Cognitive Heuristic Analysis' : '📐 Análisis Heurístico Cognitivo'}
          </h3>
          
          <div className="space-y-4" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <p className="text-xs font-bold text-gray-700" style={{ fontWeight: 'bold', color: '#374151' }}>
                {language === 'en' ? '1. Spatial Orientation & Logic:' : '1. Orientación Espacial y Lógica:'}
              </p>
              <p className="text-xs text-gray-600 mt-0.5 leading-relaxed" style={{ color: '#4B5563', lineHeight: '1.6' }}>
                {puzzlesSolved === 0 
                  ? (language === 'en' ? 'Not enough play data yet. Solve levels to evaluate.' : 'Aún no hay datos de juego suficientes. Resuelve niveles para evaluar.')
                  : puzzlesSolved >= 10 
                  ? (language === 'en' ? 'Advanced Development: Demonstrates an exceptional ability to predict spatial orientation and rotate bugs without physically trial-and-erroring too many times.' : 'Desarrollo Avanzado: Demuestra una habilidad excepcional para predecir la orientación espacial y rotar bichos sin ensayar físicamente demasiadas veces.')
                  : (language === 'en' ? 'Exploration Phase: Absorbing three-dimensional shape constraints. Shows patience when trying turns in corners.' : 'Fase de Exploración: Está asimilando las restricciones de forma tridimensional. Muestra paciencia al ensayar giros en las esquinas.')}
              </p>
            </div>

            <div>
              <p className="text-xs font-bold text-gray-700" style={{ fontWeight: 'bold', color: '#374151' }}>
                {language === 'en' ? '2. Cognitive Resilience (Error Tolerance):' : '2. Resiliencia Cognitiva (Tolerancia al Error):'}
              </p>
              <p className="text-xs text-gray-600 mt-0.5 leading-relaxed" style={{ color: '#4B5563', lineHeight: '1.6' }}>
                {puzzlesSolved === 0 
                  ? (language === 'en' ? 'Completing levels will reveal habits of overcoming obstacles.' : 'Completar niveles revelará los hábitos de superación ante obstáculos.')
                  : totalHints === 0 
                  ? (language === 'en' ? 'Outstanding Autonomy: Solves all challenges independently without relying on hints, demonstrating high confidence in difficult problems.' : 'Autonomía Sobresaliente: Resuelve todos los retos de forma independiente sin apoyarse en pistas, lo que demuestra alta confianza ante problemas difíciles.')
                  : totalHints > puzzlesSolved * 1.5 
                  ? (language === 'en' ? 'Strategic Search: Uses hints as a proactive learning tool to overcome frustrations, a great adaptivity trait.' : 'Búsqueda Estratégica: Utiliza las pistas como herramienta proactiva de aprendizaje para superar frustraciones, un gran rasgo de adaptabilidad.')
                  : (language === 'en' ? 'Healthy Balance: Attempts to solve independently first and resorts to short hints only when experiencing complex blocks.' : 'Equilibrio Saludable: Intenta resolver de forma autónoma primero y acude a pistas cortas solo en bloqueo complejo.')}
              </p>
            </div>
          </div>
        </div>

        {/* Off-screen recommendation list */}
        <div className="mb-6 bg-gray-50 border border-gray-200 p-4 rounded-xl" style={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB', padding: '16px', borderRadius: '12px' }}>
          <h3 className="text-sm font-bold text-gray-800 mb-2" style={{ fontWeight: 'bold', color: '#1F2937', marginBottom: '8px' }}>
            {language === 'en' ? '🎲 Off-Screen Activity Plan (Weekly)' : '🎲 Plan de Actividad Fuera de Pantalla (Semanal)'}
          </h3>
          <ul className="list-disc pl-5 text-xs text-gray-600 space-y-2" style={{ listStyleType: 'disc', paddingLeft: '20px' }}>
            <li style={{ marginBottom: '8px' }}>
              <strong>{language === 'en' ? 'Tangrams or Physical Blocks:' : 'Tangrams o Bloques Físicos:'}</strong>{' '}
              {language === 'en' ? 'Play reproducing Tangram silhouettes to transfer digital manipulation into a real three-dimensional tactile experience.' : 'Jugar a replicar siluetas del Tangram para trasladar la manipulación digital a una experiencia de tacto real tridimensional.'}
            </li>
            <li style={{ marginBottom: '8px' }}>
              <strong>{language === 'en' ? 'Metacognition Questions:' : 'Preguntas de Metacognición:'}</strong>{' '}
              {language === 'en' ? 'When playing together, ask them: "How did you decide that Rose fit exactly in that corner?" This stimulates logical verbalization.' : 'Cuando jueguen juntos, hazle la pregunta: "¿Cómo decidiste que Rose cabía exactamente en esa esquina?" Esto estimula la verbalización lógica.'}
            </li>
            <li style={{ marginBottom: '8px' }}>
              <strong>{language === 'en' ? 'Shape Sorting Puzzles:' : 'Rompecabezas de Encaje:'}</strong>{' '}
              {language === 'en' ? 'Strengthen spatial reasoning with classic stacking games or physical marble mazes.' : 'Fortalecer el razonamiento espacial con juegos clásicos de apilar o laberintos físicos de bolitas.'}
            </li>
          </ul>
        </div>

        <div className="text-center mt-12 border-t pt-4 text-[10px] text-gray-400 font-semibold uppercase tracking-wider" style={{ textAlign: 'center', borderTop: '1px solid #E5E7EB', paddingTop: '16px', marginTop: '48px', fontSize: '10px', color: '#9CA3AF' }}>
          {language === 'en'
            ? '© BRAIN BUGS Co. · Designed to stimulate Reasoning & Cognitive Development in a fun & offline way'
            : '© BRAIN BUGS Co. · Diseñado para estimular el Razonamiento y Desarrollo Cognitivo de forma divertida y offline'}
        </div>
      </div>

      <BottomNav/>
    </div>
  );
}

// ─── Settings Screen ──────────────────────────────────────────
export function SettingsScreen() {
  const { navigate, parent, signOut, language, setLanguage, t } = useApp();
  const [musicEnabled, setMusicEnabled] = useState(() => sound.getMusicEnabled());
  const [sfxEnabled, setSfxEnabled] = useState(() => sound.getSfxEnabled());

  const [ttsProfile, setTtsProfile] = useState(() => {
    return localStorage.getItem('brain_bugs_tts_profile') || 'bicho';
  });

  const handleSelectProfile = (profile: string, pitch: number, rate: number) => {
    sound.playClick();
    setTtsProfile(profile);
    localStorage.setItem('brain_bugs_tts_profile', profile);
    localStorage.setItem('brain_bugs_tts_pitch', String(pitch));
    localStorage.setItem('brain_bugs_tts_rate', String(rate));
    
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const profileNames: Record<string, Record<string, string>> = {
        bicho: {
          es: "¡Hola! Soy tu amigo bicho espacial.",
          en: "Hello! I am your space bug friend."
        },
        estandar: {
          es: "Hola. Estoy listo para entrenar contigo.",
          en: "Hello. I am ready to train with you."
        },
        robot: {
          es: "Iniciando sistema de lógica cognitiva.",
          en: "Starting cognitive logic system."
        }
      };
      const textToSpeak = profileNames[profile][language] || profileNames[profile]['es'];
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = language === 'en' ? 'en-US' : 'es-ES';
      utterance.pitch = pitch;
      utterance.rate = rate;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="flex flex-col h-full" style={{background:'#F4F2FA'}}>
      <div className="bg-white px-4 pt-14 pb-3 flex items-center justify-between"
        style={{boxShadow:'0 2px 12px rgba(35,19,71,0.06)'}}>
        <button onClick={()=>navigate('parent-dashboard')}
          className="w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.5))',
            border: '1px solid rgba(142,107,255,0.15)',
            boxShadow: '0 4px 10px rgba(142,107,255,0.05), inset 0 1px 0 rgba(255,255,255,0.9)',
            backdropFilter: 'blur(4px)'
          }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M15 6l-6 6 6 6" stroke="#231347" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        </button>
        <div style={{
          fontFamily:'"Fredoka",system-ui',
          textShadow: '0 2px 8px rgba(35,19,71,0.1)'
        }} className="font-bold text-ink text-base uppercase tracking-widest">{t('settings')}</div>
        <div className="w-10"/>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-5 space-y-4">
        {/* Sonido y Música Card */}
        <div className="bg-white rounded-2xl p-4" style={{boxShadow:'0 3px 0 rgba(35,19,71,0.07)'}}>
          <p className="font-bold text-ink mb-3" style={{fontFamily:'"Fredoka",system-ui'}}>🔊 {language === 'en' ? 'Sound & Music' : 'Sonido y Música'}</p>
          
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <div>
              <p className="text-sm font-bold text-ink" style={{fontFamily:'"Fredoka",system-ui'}}>{language === 'en' ? 'Background Music' : 'Música de Fondo'}</p>
              <p className="text-xs text-ink/50 font-semibold" style={{fontFamily:'"Nunito",system-ui'}}>{language === 'en' ? 'Soft focus melody' : 'Melodía suave de concentración'}</p>
            </div>
            <button
              onClick={() => {
                const newVal = !musicEnabled;
                setMusicEnabled(newVal);
                sound.setMusicEnabled(newVal);
              }}
              className={`w-12 h-7 rounded-full transition-colors duration-200 relative flex items-center px-1 focus:outline-none ${
                musicEnabled ? 'bg-emerald-400' : 'bg-gray-300'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                  musicEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between py-2 pt-3">
            <div>
              <p className="text-sm font-bold text-ink" style={{fontFamily:'"Fredoka",system-ui'}}>{language === 'en' ? 'Sound Effects (SFX)' : 'Efectos de Sonido (SFX)'}</p>
              <p className="text-xs text-ink/50 font-semibold" style={{fontFamily:'"Nunito",system-ui'}}>{language === 'en' ? 'Interactive feedback' : 'Retroalimentación interactiva'}</p>
            </div>
            <button
              onClick={() => {
                const newVal = !sfxEnabled;
                setSfxEnabled(newVal);
                sound.setSfxEnabled(newVal);
                if (newVal) {
                  sound.playSnap();
                }
              }}
              className={`w-12 h-7 rounded-full transition-colors duration-200 relative flex items-center px-1 focus:outline-none ${
                sfxEnabled ? 'bg-emerald-400' : 'bg-gray-300'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                  sfxEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Idioma Selector Card */}
        <div className="bg-white rounded-2xl p-4" style={{boxShadow:'0 3px 0 rgba(35,19,71,0.07)'}}>
          <p className="font-bold text-ink mb-3" style={{fontFamily:'"Fredoka",system-ui'}}>🌐 {t('language')}</p>
          <div className="flex gap-2">
            {[
              { id: 'es', label: 'Español 🇪🇸' },
              { id: 'en', label: 'English 🇺🇸' }
            ].map(langOption => {
              const active = language === langOption.id;
              return (
                <button
                  key={langOption.id}
                  onClick={() => {
                    sound.playClick();
                    setLanguage(langOption.id as 'es' | 'en');
                  }}
                  className="flex-1 py-3 px-4 rounded-xl font-bold transition-all text-center border"
                  style={{
                    fontFamily: '"Fredoka",system-ui',
                    background: active ? 'linear-gradient(180deg,#8E6BFF,#5A3BD1)' : '#F4F2FA',
                    color: active ? '#fff' : '#231347',
                    borderColor: active ? 'transparent' : 'rgba(35,19,71,0.05)',
                  }}
                >
                  {langOption.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Perfil de Voz TTS Card */}
        <div className="bg-white rounded-2xl p-4" style={{boxShadow:'0 3px 0 rgba(35,19,71,0.07)'}}>
          <p className="font-bold text-ink mb-1" style={{fontFamily:'"Fredoka",system-ui'}}>🗣️ {language === 'en' ? 'AI Coach Voice Profile' : 'Perfil de Voz del AI Coach'}</p>
          <p className="text-xs text-ink/50 font-semibold mb-4" style={{fontFamily:'"Nunito",system-ui'}}>{language === 'en' ? 'Choose the voice style of the smart narrator' : 'Elige el estilo de voz del narrador inteligente'}</p>
          
          <div className="flex flex-col gap-2">
            {[
              { id: 'bicho', label: language === 'en' ? '👽 Space Bug' : '👽 Bicho Espacial', sub: language === 'en' ? 'Child-like, high-pitched and playful voice' : 'Voz infantil, aguda y juguetona', pitch: 1.35, rate: 1.0 },
              { id: 'estandar', label: language === 'en' ? '🧠 Standard Coach' : '🧠 Entrenador Estándar', sub: language === 'en' ? 'Natural and balanced voice' : 'Voz natural y equilibrada', pitch: 1.0, rate: 1.0 },
              { id: 'robot', label: language === 'en' ? '🤖 Logic Robot' : '🤖 Robot de Lógica', sub: language === 'en' ? 'Technological and paced voice' : 'Voz tecnológica y pausada', pitch: 0.6, rate: 0.85 },
            ].map(prof => {
              const active = ttsProfile === prof.id;
              return (
                <button
                  key={prof.id}
                  onClick={() => handleSelectProfile(prof.id, prof.pitch, prof.rate)}
                  className="w-full py-3 px-4 rounded-xl font-bold transition-all text-left flex items-center justify-between border"
                  style={{
                    fontFamily: '"Fredoka",system-ui',
                    background: active
                      ? 'linear-gradient(180deg,#8E6BFF,#5A3BD1)'
                      : '#F4F2FA',
                    color: active ? '#fff' : '#231347',
                    borderColor: active ? 'transparent' : 'rgba(35,19,71,0.05)',
                  }}
                >
                  <div className="text-left">
                    <span className="text-sm block">{prof.label}</span>
                    <span className={`text-[10px] block font-semibold ${active ? 'text-white/70' : 'text-ink/40'}`} style={{ fontFamily: '"Nunito",system-ui' }}>{prof.sub}</span>
                  </div>
                  {active && <span className="text-white font-bold">✓</span>}
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4" style={{boxShadow:'0 3px 0 rgba(35,19,71,0.07)'}}>
          <p className="font-bold text-ink mb-0.5" style={{fontFamily:'"Fredoka",system-ui'}}>👤 {language === 'en' ? 'Account' : 'Cuenta'}</p>
          <p className="text-sm font-bold text-ink/60" style={{fontFamily:'"Nunito",system-ui'}}>{parent?.displayName}</p>
          <p className="text-xs text-ink/35 font-semibold" style={{fontFamily:'"Nunito",system-ui'}}>{parent?.email}</p>
        </div>

        <div className="bg-white rounded-2xl p-4" style={{boxShadow:'0 3px 0 rgba(35,19,71,0.07)'}}>
          <p className="font-bold text-ink mb-2" style={{fontFamily:'"Fredoka",system-ui'}}>🔒 {language === 'en' ? 'Child Safety & Privacy' : 'Seguridad y Privacidad Infantil'}</p>
          <p className="text-sm text-ink/55 font-semibold leading-relaxed" style={{fontFamily:'"Nunito",system-ui'}}>
            {language === 'en'
              ? 'BRAIN BUGS is designed with child privacy as a priority. Child profiles only require a nickname, avatar, and optional age range. No emails, phone numbers, or personal information of children are collected.'
              : 'BRAIN BUGS está diseñado con la privacidad infantil como prioridad. Los perfiles de niños requieren únicamente un apodo, avatar y rango de edad opcional. No se recopilan correos electrónicos, números de teléfono ni información personal de los niños.'}
          </p>
          <p className="text-sm text-ink/55 font-semibold leading-relaxed mt-2" style={{fontFamily:'"Nunito",system-ui'}}>
            {language === 'en'
              ? 'All puzzle content is hand-designed and reviewed to be age-appropriate (ages 5 to 9). It contains no ads, in-app purchases, or third-party data sharing.'
              : 'Todo el contenido de los rompecabezas está diseñado a mano y revisado para que sea apropiado según la edad (de 5 a 9 años). No contiene anuncios, compras dentro de la aplicación ni intercambio de datos con terceros.'}
          </p>
          <div className="mt-3 p-3 rounded-xl" style={{background:'rgba(63,208,158,0.08)', border:'1px solid rgba(63,208,158,0.2)'}}>
            <p className="text-xs font-bold" style={{color:'#1F7A5A', fontFamily:'"Nunito",system-ui'}}>
              {language === 'en'
                ? '✓ COPPA compliant design · ✓ No personal child info · ✓ No third-party trackers'
                : '✓ Diseño compatible con COPPA · ✓ Sin información personal infantil · ✓ Sin rastreadores de terceros'}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4" style={{boxShadow:'0 3px 0 rgba(35,19,71,0.07)'}}>
          <p className="font-bold text-ink mb-1" style={{fontFamily:'"Fredoka",system-ui'}}>ℹ️ {language === 'en' ? 'About BRAIN BUGS' : 'Acerca de BRAIN BUGS'}</p>
          <p className="text-sm text-ink/55 font-semibold" style={{fontFamily:'"Nunito",system-ui'}}>
            {language === 'en' ? 'Version 1.1.0 · Think. Connect. Solve. Grow!' : 'Versión 1.1.0 · ¡Piensa. Conecta. Resuelve. Crece!'}
          </p>
          <p className="text-xs text-ink/35 mt-1" style={{fontFamily:'"Nunito",system-ui'}}>
            {language === 'en'
              ? 'MVP — The Bug Coach is deterministic, not live AI. Authentication uses localStorage unless Firebase is configured.'
              : 'MVP — El Bug Coach es determinista, no es IA en vivo. La autenticación usa localStorage a menos que Firebase esté configurado.'}
          </p>
        </div>

        <button onClick={signOut}
          className="w-full py-4 rounded-2xl font-bold text-center text-red-500"
          style={{fontFamily:'"Fredoka",system-ui', background:'#FFF0F0', boxShadow:'0 3px 0 rgba(200,0,0,0.07)'}}>
          {t('exit')}
        </button>
      </div>
      <BottomNav/>
    </div>
  );
}

