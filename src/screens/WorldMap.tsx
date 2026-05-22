import React from 'react';
import { motion } from 'framer-motion';
import BottomNav from '../components/BottomNav';
import StarRating from '../components/StarRating';
import { useApp } from '../contexts/AppContext';
import { WORLDS } from '../data/worlds';
import { getProgress, getTotalStars } from '../lib/storage';
import type { WorldId } from '../types';

const ISLAND: Record<WorldId, { light: string; mid: string; dark: string; shadow: string }> = {
  meadow:  { light:'#9EECD0', mid:'#3FD09E', dark:'#1F9A6E', shadow:'#145E43' },
  crystal: { light:'#C8B4FF', mid:'#8E6BFF', dark:'#5A3BD1', shadow:'#3A259A' },
  robo:    { light:'#A8DDFF', mid:'#5BC5FF', dark:'#2890D0', shadow:'#145E8A' },
  ocean:   { light:'#8AD0FF', mid:'#2B86C5', dark:'#175882', shadow:'#0A2D45' },
  volcano: { light:'#FFA17F', mid:'#FF4E50', dark:'#D82D30', shadow:'#8C1518' },
  space:   { light:'#DDB7FF', mid:'#9A4BFF', dark:'#631BC4', shadow:'#3F0C85' },
};

function LevelNode({ number, stars, unlocked, isCurrent, onClick }: {
  number: number; stars: number; unlocked: boolean; isCurrent: boolean; onClick: () => void;
}) {
  const isDone = stars > 0;
  return (
    <button onClick={onClick} disabled={!unlocked}
      className="flex flex-col items-center gap-1 transition-transform active:scale-90"
      style={{ opacity: unlocked ? 1 : 0.48 }}>
      <div style={{
        width: isCurrent ? 54 : 48, height: isCurrent ? 54 : 48,
        borderRadius: '50%',
        background: isDone ? '#fff' : unlocked ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.28)',
        border: isCurrent ? '4px solid #FFC83D' : isDone ? '3px solid rgba(35,19,71,0.2)' : '2px solid rgba(35,19,71,0.15)',
        boxShadow: isCurrent ? '0 0 0 2px rgba(255,200,61,0.5), 0 6px 0 rgba(35,19,71,0.25)'
                 : isDone ? '0 5px 0 rgba(35,19,71,0.22)' : '0 3px 0 rgba(35,19,71,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: isCurrent ? 20 : 17, fontFamily: '"Fredoka",system-ui', fontWeight: 700,
        color: '#231347', transition: 'all 0.15s',
      }}>
        {unlocked ? number : '🔒'}
      </div>
      {unlocked && <StarRating stars={stars} size={11}/>}
    </button>
  );
}

function WorldCard({ world, totalStars, levelProgress, onSelectLevel }: {
  world: typeof WORLDS[0];
  totalStars: number;
  levelProgress: Record<string, { stars: number }>;
  onSelectLevel: (levelId: string) => void;
}) {
  const c = ISLAND[world.id];
  const isUnlocked = totalStars >= world.requiredStars;
  const worldStars = world.levels.reduce((s,l) => s + (levelProgress[l.id]?.stars ?? 0), 0);
  const maxWorldStars = world.levels.length * 3;
  const pct = Math.round(worldStars / maxWorldStars * 100);

  // Which level is "current" = first incomplete unlocked level
  const firstIncomplete = world.levels.find(l =>
    totalStars >= l.requiredStars && !(levelProgress[l.id]?.stars)
  );

  const worldIndex = WORLDS.findIndex(w => w.id === world.id);
  const floatDuration = 3.5 + (worldIndex % 3) * 0.7; // beautiful stagger durations so islands float naturally out of sync

  return (
    <motion.div
      className="mx-4 mb-5"
      animate={{ y: [-4, 4, -4] }}
      transition={{
        repeat: Infinity,
        duration: floatDuration,
        ease: "easeInOut",
      }}
    >
      <div className="rounded-3xl overflow-hidden" style={{
        background: isUnlocked
          ? `linear-gradient(160deg,${c.light} 0%,${c.mid} 55%,${c.dark} 100%)`
          : 'linear-gradient(160deg,#9AA0B0,#6A7080)',
        boxShadow: `0 8px 0 ${isUnlocked ? c.shadow : '#3A3F50'}, 0 12px 24px rgba(35,19,71,0.18)`,
      }}>
        {/* World header */}
        <div className="flex items-start justify-between px-5 pt-4 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span style={{fontSize:26}}>{world.emoji}</span>
              <div>
                <h3 className="text-white font-bold text-xl leading-tight"
                  style={{fontFamily:'"Fredoka",system-ui', textShadow:'0 2px 0 rgba(0,0,0,0.2)'}}>
                  {world.name}
                </h3>
                <p className="text-white/75 text-xs font-semibold" style={{fontFamily:'"Nunito",system-ui'}}>
                  {isUnlocked ? world.description : `Desbloquea con ${world.requiredStars} ⭐`}
                </p>
              </div>
            </div>

            {/* Progress bar */}
            {isUnlocked && (
              <div className="mt-2 w-36">
                <div className="h-2 rounded-full overflow-hidden" style={{background:'rgba(0,0,0,0.2)'}}>
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{width:`${pct}%`, background:'rgba(255,255,255,0.85)'}}/>
                </div>
                <p className="text-white/65 text-xs mt-0.5 font-bold" style={{fontFamily:'"Nunito",system-ui'}}>
                  {worldStars}/{maxWorldStars} ★  ·  {pct}%
                </p>
              </div>
            )}
          </div>

          {!isUnlocked && (
            <div className="flex flex-col items-center gap-0.5 mt-1">
              <span style={{fontSize:30}}>🔒</span>
              <span className="text-white/70 text-xs font-bold" style={{fontFamily:'"Nunito",system-ui'}}>
                Faltan {world.requiredStars}★
              </span>
            </div>
          )}
        </div>

        {/* Level nodes */}
        {isUnlocked ? (
          <div className="flex justify-around px-4 pb-5 pt-1">
            {world.levels.map(level => (
              <LevelNode
                key={level.id}
                number={level.number}
                stars={levelProgress[level.id]?.stars ?? 0}
                unlocked={totalStars >= level.requiredStars}
                isCurrent={firstIncomplete?.id === level.id}
                onClick={() => onSelectLevel(level.id)}
              />
            ))}
          </div>
        ) : (
          <div className="px-5 pb-5">
            <div className="bg-black/15 rounded-2xl py-3 px-4">
              <p className="text-white/70 text-sm font-semibold text-center" style={{fontFamily:'"Nunito",system-ui'}}>
                ¡Resuelve más rompecabezas en los mundos anteriores para desbloquear! 🌟
              </p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function WorldMap() {
  const { currentChild, navigate } = useApp();
  if (!currentChild) return null;

  const progress = getProgress(currentChild.id);
  const totalStars = getTotalStars(progress);

  const handleSelectLevel = (levelId: string) => {
    for (const world of WORLDS) {
      const level = world.levels.find(l => l.id === levelId);
      if (level) {
        navigate('gameplay', { levelId, worldId: world.id });
        return;
      }
    }
  };

  return (
    <div className="flex flex-col h-full"
      style={{ background:'linear-gradient(180deg,#7CC7FF 0%,#5BB0FF 40%,#4D9CE5 100%)' }}>

      {/* Subtle Glowing Stardust Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(15)].map((_, i) => {
          const x = (i * 37) % 100;
          const delay = i * 0.4;
          const scale = 0.4 + (i % 3) * 0.3;
          return (
            <motion.div
              key={`star-particle-${i}`}
              initial={{ opacity: 0.1, y: '110vh' }}
              animate={{
                opacity: [0.1, 0.7, 0.1],
                y: '-10vh',
                x: [`${x}vw`, `${x + (i % 2 === 0 ? 5 : -5)}vw`]
              }}
              transition={{
                duration: 15 + (i % 5) * 4,
                repeat: Infinity,
                delay: -delay,
                ease: 'linear'
              }}
              className="absolute text-yellow-100 font-bold"
              style={{
                fontSize: `${scale * 12}px`,
                filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.8))'
              }}
            >
              ✨
            </motion.div>
          );
        })}
      </div>

      {/* Animated Clouds */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          initial={{ x: '-150%' }}
          animate={{ x: '120vw' }}
          transition={{
            repeat: Infinity,
            duration: 35,
            ease: "linear",
          }}
          className="absolute top-36 w-24 h-6 rounded-full bg-white opacity-70"
        />
        <motion.div
          initial={{ x: '-150%' }}
          animate={{ x: '120vw' }}
          transition={{
            repeat: Infinity,
            duration: 52,
            ease: "linear",
            delay: -22,
          }}
          className="absolute top-44 w-16 h-5 rounded-full bg-white opacity-50"
        />
        <motion.div
          initial={{ x: '-150%' }}
          animate={{ x: '120vw' }}
          transition={{
            repeat: Infinity,
            duration: 62,
            ease: "linear",
            delay: -45,
          }}
          className="absolute top-28 w-20 h-5 rounded-full bg-white opacity-60"
        />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-14 pb-4 relative z-10 flex-shrink-0">
        <button onClick={() => navigate('home')}
          className="w-10 h-10 rounded-full flex items-center justify-center active:scale-90"
          style={{ background:'rgba(255,255,255,0.2)', border:'1px solid rgba(255,255,255,0.3)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M15 6l-6 6 6 6" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        </button>

        <div className="font-bold text-white text-lg uppercase tracking-widest"
          style={{fontFamily:'"Fredoka",system-ui', textShadow:'0 2px 0 rgba(0,0,0,0.2)'}}>
          Mapa del Mundo
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
          style={{background:'rgba(255,255,255,0.2)', border:'1px solid rgba(255,255,255,0.3)'}}>
          <span className="text-base">⭐</span>
          <span className="text-white font-bold" style={{fontFamily:'"Fredoka",system-ui'}}>{totalStars}</span>
        </div>
      </div>

      {/* Star chip */}
      <div className="flex justify-center mb-4 flex-shrink-0">
        <div className="px-4 py-1.5 rounded-full"
          style={{background:'rgba(255,255,255,0.88)', backdropFilter:'blur(6px)', boxShadow:'0 3px 0 rgba(35,19,71,0.1)'}}>
          <span className="font-bold text-ink text-sm" style={{fontFamily:'"Fredoka",system-ui'}}>
            ⭐ {totalStars} / {WORLDS.reduce((s,w)=>s+w.levels.length*3,0)} estrellas obtenidas
          </span>
        </div>
      </div>

      {/* Worlds */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-4">
        {WORLDS.map(world => (
          <WorldCard
            key={world.id}
            world={world}
            totalStars={totalStars}
            levelProgress={progress.levelProgress}
            onSelectLevel={handleSelectLevel}
          />
        ))}
      </div>

      <BottomNav/>
    </div>
  );
}
