import React from 'react';
import BrainBugsLogo from '../components/BrainBugsLogo';
import BugSvg from '../components/BugSvg';
import BottomNav from '../components/BottomNav';
import { useApp } from '../contexts/AppContext';
import type { AvatarId } from '../types';
import { getProgress, getTotalStars } from '../lib/storage';

const AVATAR: Record<AvatarId, { bg: string; emoji: string }> = {
  buzzy:{bg:'#FFD55E',emoji:'🐝'}, pip:{bg:'#3FD09E',emoji:'🐛'},
  bobo:{bg:'#8E6BFF',emoji:'🦋'}, zig:{bg:'#FFC83D',emoji:'🐞'},
  mo:{bg:'#5BC5FF',emoji:'🦗'},    rose:{bg:'#FF6FA8',emoji:'🌸'},
};

function NavPill({ icon, label, sub, color, onClick }: {
  icon: React.ReactNode; label: string; sub?: string; color: string; onClick: () => void;
}) {
  return (
    <button onClick={onClick}
      className="flex items-center gap-3 w-full px-4 py-3.5 rounded-2xl bg-white active:scale-98 transition-transform text-left"
      style={{boxShadow:'0 5px 0 rgba(35,19,71,0.14)'}}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{background:color, boxShadow:'inset 0 -3px 0 rgba(0,0,0,0.14)'}}>
        {icon}
      </div>
      <div className="flex-1">
        <div className="font-bold text-ink text-base" style={{fontFamily:'"Fredoka",system-ui'}}>{label}</div>
        {sub && <div className="text-xs text-ink/45 font-semibold" style={{fontFamily:'"Nunito",system-ui'}}>{sub}</div>}
      </div>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path d="M9 6l6 6-6 6" stroke="rgba(35,19,71,0.35)" strokeWidth="2.5" strokeLinecap="round"/>
      </svg>
    </button>
  );
}

export default function HomeScreen() {
  const { currentChild, navigate } = useApp();
  if (!currentChild) return null;

  const av = AVATAR[currentChild.avatarId] ?? AVATAR.buzzy;
  const progress = getProgress(currentChild.id);
  const totalStars = getTotalStars(progress);
  const puzzlesSolved = Object.values(progress.levelProgress).filter(l => l.stars > 0).length;

  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  const dailyId = `daily-${seed}`;
  const isDailySolved = !!progress.levelProgress[dailyId]?.stars;

  const handlePlayDaily = () => {
    navigate('gameplay', { levelId: dailyId, worldId: 'meadow' });
  };

  return (
    <div className="relative flex flex-col h-full overflow-hidden">
      {/* Sky background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0" style={{background:'linear-gradient(180deg,#C8EAFF 0%,#D8F5C2 55%,#A8D978 100%)'}}/>
        {/* Sun glow */}
        <div className="absolute -top-8 -right-8 w-48 h-48 rounded-full pointer-events-none"
          style={{background:'radial-gradient(circle,rgba(255,220,100,0.7) 0%,rgba(255,220,100,0) 65%)'}}/>
        {/* Clouds */}
        <div className="absolute top-16 left-2 w-24 h-6 rounded-full bg-white opacity-75"/>
        <div className="absolute top-24 left-10 w-16 h-5 rounded-full bg-white opacity-55"/>
        {/* Hills */}
        <svg viewBox="0 0 430 280" preserveAspectRatio="none" className="absolute bottom-16 w-full h-60 pointer-events-none">
          <path d="M0 120 Q 108 40 216 110 T 430 70 L 430 280 L 0 280 Z" fill="#88C862"/>
          <path d="M0 200 Q 140 130 285 190 T 430 175 L 430 280 L 0 280 Z" fill="#5FAE3C"/>
          {/* Flowers */}
          {[[30,215],[90,190],[180,210],[260,185],[340,215],[390,200]].map(([x,y],i) => (
            <g key={i} transform={`translate(${x},${y})`}>
              <circle cx="0" cy="-8" r="4" fill={['#FFD55E','#FF7B5C','#FF6FA8','#8E6BFF'][i%4]}/>
              <rect x="-1" y="-4" width="2" height="8" fill="#4A9A2A" rx="1"/>
            </g>
          ))}
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col overflow-hidden">
        {/* Header bar */}
        <div className="flex items-center justify-between px-4 pt-14 pb-2">
          {/* Avatar chip */}
          <button onClick={() => navigate('child-select')}
            className="flex items-center gap-2 px-3 py-2 rounded-2xl active:scale-95"
            style={{background:'rgba(255,255,255,0.75)', backdropFilter:'blur(8px)', boxShadow:'0 3px 0 rgba(35,19,71,0.1)'}}>
            <div className="w-7 h-7 rounded-full text-base flex items-center justify-center"
              style={{background:av.bg, fontSize:16}}>
              {av.emoji}
            </div>
            <div>
              <span className="text-sm font-bold text-ink" style={{fontFamily:'"Fredoka",system-ui'}}>
                {currentChild.nickname}
              </span>
              <span className="text-ink/40 text-xs ml-1.5">▼</span>
            </div>
          </button>

          {/* Star counter */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl"
            style={{background:'rgba(255,255,255,0.75)', backdropFilter:'blur(8px)', boxShadow:'0 3px 0 rgba(35,19,71,0.1)'}}>
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="M12 2l3.1 6.3L22 9.3l-5 4.9L18.2 22 12 18.6 5.8 22 7 14.2l-5-4.9 6.9-1z"
                fill="#FFC83D" stroke="#D9A015" strokeWidth="1.5"/>
            </svg>
            <span className="font-bold text-ink text-sm" style={{fontFamily:'"Fredoka",system-ui'}}>{totalStars}</span>
          </div>
        </div>

        {/* Logo area */}
        <div className="flex flex-col items-center mt-2 mb-1">
          <BrainBugsLogo size={28} stacked/>
          <p className="text-ink/55 text-sm font-medium mt-1.5" style={{fontFamily:'"Fredoka",system-ui', letterSpacing:0.4}}>
            ¡Piensa · Conecta · Resuelve · Crece!
          </p>
        </div>

        {/* Mascot bug */}
        <div className="absolute top-32 left-1 z-0 animate-float" style={{animationDelay:'0.2s'}}>
          <BugSvg kind={currentChild.bugCompanion} size={72}/>
        </div>
        <div className="absolute top-48 right-1 z-0 animate-float" style={{animationDelay:'1.1s'}}>
          <BugSvg kind="pip" size={54}/>
        </div>
        <div className="absolute top-38 right-16 z-0 animate-float" style={{animationDelay:'0.6s'}}>
          <BugSvg kind="rose" size={42}/>
        </div>

        {/* Quick stats */}
        {puzzlesSolved > 0 && (
          <div className="flex justify-center gap-4 mb-1 mt-2">
            {[
              {label:'Rompecabezas', value:puzzlesSolved},
              {label:'Estrellas', value:totalStars},
              {label:'Medallas', value:progress.badges.length},
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className="font-bold text-ink/80 text-lg" style={{fontFamily:'"Fredoka",system-ui'}}>{s.value}</div>
                <div className="text-xs text-ink/45 font-bold" style={{fontFamily:'"Nunito",system-ui'}}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Daily Challenge Card */}
        <div className="mx-4 mt-2 mb-1">
          <button onClick={handlePlayDaily}
            className="w-full flex items-center justify-between p-3.5 rounded-3xl active:scale-98 transition-all text-left"
            style={{
              background: isDailySolved
                ? 'linear-gradient(135deg, #E6FBF3 0%, #CCF5E6 100%)'
                : 'linear-gradient(135deg, #FFF6E6 0%, #FFE9CC 100%)',
              border: isDailySolved
                ? '2px solid #3FD09E'
                : '2px solid #FFA229',
              boxShadow: isDailySolved
                ? '0 6px 0 #1F9A6E, 0 8px 20px rgba(31,154,110,0.15)'
                : '0 6px 0 #E08518, 0 8px 20px rgba(224,133,24,0.15)',
            }}>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: isDailySolved
                    ? 'linear-gradient(180deg, #3FD09E 0%, #1F9A6E 100%)'
                    : 'linear-gradient(180deg, #FFA229 0%, #E08518 100%)',
                  boxShadow: 'inset 0 -3px 0 rgba(0,0,0,0.18)',
                }}>
                <span className="text-2xl">{isDailySolved ? '🏆' : '📅'}</span>
              </div>
              <div>
                <span className="px-2 py-0.5 rounded-full text-white font-bold uppercase"
                  style={{
                    background: isDailySolved ? '#3FD09E' : '#FF4E50',
                    fontSize: 8,
                    letterSpacing: 0.8,
                  }}>
                  {isDailySolved ? '¡Completado!' : '¡Doble XP!'}
                </span>
                <h4 className="font-bold text-ink text-base mt-0.5 leading-tight" style={{ fontFamily: '"Fredoka",system-ui' }}>
                  Desafío Diario
                </h4>
                <p className="text-xs text-ink/65 font-medium leading-none" style={{ fontFamily: '"Nunito",system-ui' }}>
                  {isDailySolved ? '¡Buen trabajo! Ganaste +20 XP hoy.' : '¡Completa hoy para +20 XP y medalla!'}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm"
              style={{
                background: isDailySolved ? 'rgba(63,208,158,0.15)' : 'rgba(255,162,41,0.15)',
                color: isDailySolved ? '#1F9A6E' : '#FFA229',
              }}>
              {isDailySolved ? '✓' : '▶'}
            </div>
          </button>
        </div>

        {/* Nav buttons */}
        <div className="flex flex-col gap-2.5 px-4 mt-3">
          {/* PLAY button */}
          <button onClick={() => navigate('world-map')}
            className="w-full py-5 rounded-3xl text-ink font-bold text-3xl tracking-widest flex items-center justify-center gap-2.5 active:scale-95 transition-transform"
            style={{
              background:'linear-gradient(180deg,#FFD55E 0%,#FFB23A 100%)',
              fontFamily:'"Fredoka",system-ui',
              boxShadow:'0 9px 0 #B97808, inset 0 -4px 0 rgba(255,255,255,0.18), inset 0 3px 0 rgba(255,255,255,0.42)',
              textShadow:'0 2px 0 rgba(0,0,0,0.16)', color:'#231347',
            }}>
            <svg width="24" height="24" viewBox="0 0 24 24"><path d="M6 4l14 8-14 8z" fill="#231347"/></svg>
            ¡JUGAR!
          </button>

          <div className="grid grid-cols-2 gap-2.5">
            <NavPill label="Mapa del Mundo" sub="3 mundos · 15 niveles" color="#5BC5FF" onClick={() => navigate('world-map')}
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" fill="#fff" opacity="0.9"/><path d="M3 12h18M12 3a14 14 0 010 18" stroke="#2890D0" strokeWidth="1.8"/></svg>}/>
            <NavPill label="Medallas" sub={`${progress.badges.length} medallas`} color="#FFC83D" onClick={() => navigate('rewards')}
              icon={<svg width="20" height="20" viewBox="0 0 24 24"><path d="M12 2l2.4 4.9L20 8l-4 3.9.9 5.5L12 14.8 7.1 17.4 8 11.9 4 8l5.6-1.1z" fill="#fff"/></svg>}/>
          </div>
        </div>
      </div>

      <div className="relative z-20">
        <BottomNav/>
      </div>
    </div>
  );
}
