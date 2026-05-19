import React, { useState, useEffect } from 'react';
import StarRating from '../components/StarRating';
import BugSvg from '../components/BugSvg';
import BottomNav from '../components/BottomNav';
import { useApp } from '../contexts/AppContext';
import { BADGES, BADGE_MAP } from '../data/badges';
import { getProgress, getTotalStars, getPuzzlesSolved } from '../lib/storage';
import { getAllLevels } from '../data/worlds';

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

// ─── Victory Screen ───────────────────────────────────────────
export function VictoryScreen() {
  const { navigate, victoryData, currentChild, getChildProgress } = useApp();
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (victoryData?.stars === 3) setShowConfetti(true);
  }, []);

  if (!victoryData) { navigate('world-map'); return null; }
  const { stars, moves, hintsUsed, newBadges, levelId } = victoryData;

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

  const levelLabel = levelId
    .replace('meadow-l','Nivel Pradera ')
    .replace('crystal-l','Nivel Cueva ')
    .replace('robo-l','Nivel Arrecife ');

  const msgMap = { 3:'🎉 ¡Perfecto! ¡Qué gran mente!', 2:'⭐ ¡Excelente trabajo! ¡Casi perfecto!', 1:'✅ ¡Resuelto! ¡Sigue practicando!' };
  const headline = msgMap[stars as 1|2|3] ?? '¡Lo lograste!';
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
          style={{fontFamily:'"Fredoka",system-ui', textShadow:'0 2px 0 rgba(0,0,0,0.25)'}}>
          {headline}
        </div>
        <div className="text-yellow-200/80 text-sm font-semibold mb-6" style={{fontFamily:'"Nunito",system-ui'}}>
          ¡{levelLabel} completado!
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
            {currentChild && <BugSvg kind={currentChild.bugCompanion} size={88} animated/>}
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
            { label:'Movimientos', value:moves, icon:'👣', good: moves<=12 },
            { label:'Pistas usadas', value:hintsUsed, icon:'💡', good: hintsUsed===0 },
            { label:'Estrellas',      value:stars,   icon:'⭐', good: stars===3 },
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
              🏆 ¡Nueva medalla desbloqueada!
            </div>
            {newBadges.map(bid => {
              const b = BADGE_MAP[bid];
              if (!b) return null;
              return (
                <div key={bid} className="flex items-center gap-3 mb-2 last:mb-0">
                  <span className="text-2xl">{b.emoji}</span>
                  <div>
                    <div className="font-bold text-white text-sm" style={{fontFamily:'"Fredoka",system-ui'}}>{b.name}</div>
                    <div className="text-xs text-white/60" style={{fontFamily:'"Nunito",system-ui'}}>{b.description}</div>
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
              💡 ¡Vuelve a jugar este nivel usando menos movimientos para ganar 3 estrellas!
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
            SIGUIENTE NIVEL →
          </button>
          <button onClick={() => navigate('world-map')}
            className="w-full py-3 rounded-2xl font-bold active:scale-95 text-sm"
            style={{background:'rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.75)', fontFamily:'"Fredoka",system-ui'}}>
            Volver al mapa
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Rewards Screen ───────────────────────────────────────────
export function RewardsScreen() {
  const { navigate, currentChild } = useApp();
  const [selectedBadge, setSelectedBadge] = useState<string | null>(null);

  if (!currentChild) return null;
  const progress = getProgress(currentChild.id);
  const totalStars = getTotalStars(progress);
  const puzzlesSolved = getPuzzlesSolved(progress);
  const xp = totalStars * 10;
  const xpToNextLevel = 100;
  const xpProgress = (xp % xpToNextLevel) / xpToNextLevel * 100;
  const level = Math.floor(xp / xpToNextLevel) + 1;

  const selected = selectedBadge ? BADGE_MAP[selectedBadge] : null;

  return (
    <div className="flex flex-col h-full" style={{background:'linear-gradient(180deg,#4A2BAE 0%,#3A2A9A 40%,#251A6B 100%)'}}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-14 pb-3 flex-shrink-0">
        <button onClick={()=>navigate('home')}
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{background:'rgba(255,255,255,0.12)'}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M15 6l-6 6 6 6" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        </button>
        <div className="font-bold text-white text-lg uppercase tracking-widest" style={{fontFamily:'"Fredoka",system-ui'}}>
          Medallas y Recompensas
        </div>
        <div className="w-10"/>
      </div>

      {/* XP bar */}
      <div className="mx-4 mb-3 p-4 rounded-2xl flex-shrink-0" style={{background:'rgba(255,255,255,0.1)'}}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-white font-bold text-sm" style={{fontFamily:'"Fredoka",system-ui'}}>Nivel {level}</span>
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
          { label:'Estrellas',   value:totalStars,       icon:'⭐' },
          { label:'Rompecabezas', value:puzzlesSolved,     icon:'🧩' },
          { label:'Medallas',  value:progress.badges.length, icon:'🏆' },
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
          Colección ({progress.badges.length}/{BADGES.length})
        </p>
        <div className="grid grid-cols-3 gap-3">
          {BADGES.map(badge => {
            const earned = progress.badges.includes(badge.id);
            return (
              <button key={badge.id}
                onClick={() => earned && setSelectedBadge(badge.id)}
                className="flex flex-col items-center p-3 rounded-2xl transition-all active:scale-95"
                style={{
                  background: earned ? `${badge.color}1A` : 'rgba(255,255,255,0.05)',
                  border: earned ? `2px solid ${badge.color}55` : '2px solid rgba(255,255,255,0.08)',
                  opacity: earned ? 1 : 0.45,
                  cursor: earned ? 'pointer' : 'default',
                }}>
                <div style={{fontSize:32, lineHeight:1, marginBottom:4, transform: earned ? 'scale(1.08)' : 'scale(0.88)'}}>
                  {earned ? badge.emoji : '🔒'}
                </div>
                <div className="text-center text-white font-bold leading-tight" style={{fontFamily:'"Fredoka",system-ui', fontSize:11}}>
                  {badge.name}
                </div>
                {!earned && (
                  <div className="text-center text-white/35 mt-1 leading-tight" style={{fontFamily:'"Nunito",system-ui', fontSize:9}}>
                    {badge.condition}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Badge detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60" onClick={()=>setSelectedBadge(null)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-xs text-center" onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:56, lineHeight:1}} className="mb-3">{selected.emoji}</div>
            <h3 className="text-xl font-bold text-ink mb-1" style={{fontFamily:'"Fredoka",system-ui'}}>{selected.name}</h3>
            <p className="text-sm text-ink/60 font-semibold mb-5" style={{fontFamily:'"Nunito",system-ui'}}>{selected.description}</p>
            <button onClick={()=>setSelectedBadge(null)}
              className="w-full py-3 rounded-2xl font-bold text-white"
              style={{background:selected.color, fontFamily:'"Fredoka",system-ui', boxShadow:`0 4px 0 ${selected.darkColor}`}}>
              ¡Genial! 🎉
            </button>
          </div>
        </div>
      )}

      <BottomNav/>
    </div>
  );
}

// ─── Parent Dashboard ─────────────────────────────────────────
export function ParentDashboard() {
  const { navigate, parent, children, currentChild, resetChildProgress, signOut } = useApp();
  const [viewId, setViewId] = useState(currentChild?.id ?? children[0]?.id ?? '');
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

  const skills = [
    {label:'Pensamiento lógico', value:Math.min(100, puzzlesSolved*9+totalStars*2), color:'#8E6BFF'},
    {label:'Resolución de problemas',  value:Math.min(100, puzzlesSolved*7+totalStars*3), color:'#3FD09E'},
    {label:'Conciencia espacial',value:Math.min(100, puzzlesSolved*8+totalStars*2), color:'#FF7B5C'},
    {label:'Persistencia',      value:Math.min(100, (progress?.badges.length??0)*14+puzzlesSolved*5), color:'#FFC83D'},
  ];

  const AVATAR_MAP: Record<string, { bg: string; emoji: string }> = {
    buzzy:{bg:'#FFD55E',emoji:'🐝'}, pip:{bg:'#3FD09E',emoji:'🐛'},
    bobo:{bg:'#8E6BFF',emoji:'🦋'}, zig:{bg:'#FFC83D',emoji:'🐞'},
    mo:{bg:'#5BC5FF',emoji:'🦗'},    rose:{bg:'#FF6FA8',emoji:'🌸'},
  };

  return (
    <div className="flex flex-col h-full" style={{background:'#F4F2FA'}}>
      {/* Header */}
      <div className="bg-white px-4 pt-14 pb-3 flex items-center justify-between"
        style={{boxShadow:'0 2px 12px rgba(35,19,71,0.06)'}}>
        <button onClick={()=>navigate('home')}
          className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M15 6l-6 6 6 6" stroke="#231347" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        </button>
        <div style={{fontFamily:'"Fredoka",system-ui'}} className="font-bold text-ink text-base uppercase tracking-widest">
          Panel de Padres
        </div>
        <button onClick={()=>navigate('settings')}
          className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
          ⚙️
        </button>
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
                    background: viewId===c.id ? '#8E6BFF' : '#fff',
                    color: viewId===c.id ? '#fff' : '#231347',
                    boxShadow: viewId===c.id ? '0 3px 0 #5A3BD1' : '0 2px 0 rgba(35,19,71,0.1)',
                  }}>
                  <span style={{fontSize:16}}>{av.emoji}</span> {c.nickname}
                </button>
              );
            })}
          </div>
        )}

        {child && (() => {
          const av = AVATAR_MAP[child.avatarId] ?? AVATAR_MAP.buzzy;
          const worldLabelMap = { meadow: 'Pradera', crystal: 'Cueva', robo: 'Arrecife' };
          const worldLabel = worldLabelMap[child.currentWorld as 'meadow'|'crystal'|'robo'] || child.currentWorld;
          return (
            <div className="mt-3 p-4 rounded-2xl bg-white flex items-center gap-4"
              style={{boxShadow:'0 4px 0 rgba(35,19,71,0.08)'}}>
              <div className="w-16 h-16 rounded-2xl text-3xl flex items-center justify-center"
                style={{background:av.bg, boxShadow:'0 3px 0 rgba(35,19,71,0.15)', fontSize:28, flexShrink:0}}>
                {av.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-ink text-xl" style={{fontFamily:'"Fredoka",system-ui'}}>{child.nickname}</div>
                <div className="text-xs text-ink/50 font-semibold mb-2" style={{fontFamily:'"Nunito",system-ui'}}>
                  Nivel {child.currentLevel} · Mundo {worldLabel}
                </div>
                <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                  <div className="h-full rounded-full"
                    style={{width:`${Math.min(100,(totalStars%20)*5)}%`, background:'linear-gradient(90deg,#8E6BFF,#5A3BD1)', transition:'width 0.6s'}}/>
                </div>
                <div className="text-xs text-ink/40 mt-0.5 font-bold" style={{fontFamily:'"Nunito",system-ui'}}>
                  {child.totalXP} XP
                </div>
              </div>
            </div>
          );
        })()}

        {/* Key metrics */}
        <p className="text-xs font-bold uppercase tracking-wide text-ink/40 mt-5 mb-2" style={{fontFamily:'"Nunito",system-ui'}}>Resumen</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            {icon:'⭐', label:'Estrellas ganadas',    value:totalStars,    color:'#FFC83D', dark:'#B97808'},
            {icon:'🧩', label:'Resueltos',  value:puzzlesSolved, color:'#3FD09E', dark:'#1F9A6E'},
            {icon:'👣', label:'Movimientos prom.',      value:avgMoves||'—', color:'#8E6BFF', dark:'#5A3BD1'},
            {icon:'💡', label:'Pistas usadas',      value:totalHints,    color:'#FF7B5C', dark:'#C73000'},
            {icon:'🏆', label:'Medallas ganadas',  value:progress?.badges.length??0, color:'#FF6FA8', dark:'#C73C77'},
            {icon:'🌍', label:'Mundos visitados', value:['meadow','crystal','robo'].filter(w=>
              Object.keys(progress?.levelProgress??{}).some(l=>l.startsWith(w))).length, color:'#5BC5FF', dark:'#2890D0'},
          ].map(m => (
            <div key={m.label} className="rounded-2xl p-3.5 bg-white flex items-center gap-3"
              style={{boxShadow:'0 2px 0 rgba(35,19,71,0.07)'}}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                style={{background:m.color+'1A', boxShadow:`inset 0 -2px 0 ${m.dark}22`}}>
                {m.icon}
              </div>
              <div>
                <div className="text-xl font-bold text-ink" style={{fontFamily:'"Fredoka",system-ui'}}>{m.value}</div>
                <div className="text-xs font-bold text-ink/45" style={{fontFamily:'"Nunito",system-ui'}}>{m.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Skills */}
        <p className="text-xs font-bold uppercase tracking-wide text-ink/40 mt-5 mb-2" style={{fontFamily:'"Nunito",system-ui'}}>Habilidades en enfoque</p>
        <div className="bg-white rounded-2xl p-4 space-y-4" style={{boxShadow:'0 3px 0 rgba(35,19,71,0.07)'}}>
          {skills.map(s => (
            <div key={s.label}>
              <div className="flex justify-between mb-1.5">
                <span className="text-sm font-bold text-ink" style={{fontFamily:'"Nunito",system-ui'}}>{s.label}</span>
                <span className="text-sm font-bold" style={{color:s.color, fontFamily:'"Nunito",system-ui'}}>{s.value}%</span>
              </div>
              <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700"
                  style={{width:`${s.value}%`, background:s.color}}/>
              </div>
            </div>
          ))}
          {puzzlesSolved === 0 && (
            <p className="text-xs text-ink/35 italic text-center" style={{fontFamily:'"Nunito",system-ui'}}>
              ¡Las habilidades crecen a medida que se resuelven rompecabezas!
            </p>
          )}
        </div>

        {/* Recent activity */}
        {progress && Object.keys(progress.levelProgress).length > 0 && (
          <>
            <p className="text-xs font-bold uppercase tracking-wide text-ink/40 mt-5 mb-2" style={{fontFamily:'"Nunito",system-ui'}}>Actividad reciente</p>
            <div className="bg-white rounded-2xl overflow-hidden" style={{boxShadow:'0 3px 0 rgba(35,19,71,0.07)'}}>
              {Object.entries(progress.levelProgress).slice(-5).reverse().map(([lid,lp],i,arr) => (
                <div key={lid} className="flex items-center gap-3 px-4 py-3"
                  style={{borderBottom: i<arr.length-1 ? '1px solid #F0EEF6' : 'none'}}>
                  <span className="text-2xl">{lid.includes('meadow')?'🌿':lid.includes('crystal')?'💎':'🤖'}</span>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-ink" style={{fontFamily:'"Nunito",system-ui'}}>
                      {lid.replace('meadow-l','Pradera ').replace('crystal-l','Cueva ').replace('robo-l','Arrecife ')}
                    </div>
                    <StarRating stars={lp.stars} size={12}/>
                  </div>
                  <span className="text-xs text-ink/35 font-bold" style={{fontFamily:'"Nunito",system-ui'}}>
                    {new Date(lp.completedAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Parent tools */}
        <p className="text-xs font-bold uppercase tracking-wide text-ink/40 mt-5 mb-2" style={{fontFamily:'"Nunito",system-ui'}}>Herramientas de padres</p>
        <div className="bg-white rounded-2xl overflow-hidden" style={{boxShadow:'0 3px 0 rgba(35,19,71,0.07)'}}>
          {[
            {icon:'👥', label:'Gestionar perfiles',  sub:'Añade, edita o elimina perfiles de niños', action:()=>navigate('child-select')},
            {icon:'🔄', label:'Restablecer progreso',    sub:'Borra todas las estrellas y medallas de este perfil', action:()=>setConfirmReset(true), danger:true},
            {icon:'⏱',  label:'Tiempo en pantalla',       sub:'Próximamente en la siguiente actualización', action:()=>{}, disabled:true},
            {icon:'🔒', label:'Seguridad y privacidad',  sub:'Ver política de datos infantiles', action:()=>navigate('settings')},
          ].map((t,i,arr) => (
            <button key={t.label} onClick={t.action} disabled={t.disabled}
              className="flex items-center gap-3 w-full px-4 py-3.5 text-left transition-colors"
              style={{
                borderBottom: i<arr.length-1 ? '1px solid #F0EEF6' : 'none',
                opacity: t.disabled ? 0.45 : 1,
              }}>
              <span className="text-xl w-8 text-center">{t.icon}</span>
              <div className="flex-1">
                <div className={`font-bold text-sm ${t.danger ? 'text-red-600' : 'text-ink'}`} style={{fontFamily:'"Nunito",system-ui'}}>{t.label}</div>
                <div className="text-xs text-ink/45" style={{fontFamily:'"Nunito",system-ui'}}>{t.sub}</div>
              </div>
              {!t.disabled && (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                  <path d="M9 6l6 6-6 6" stroke="rgba(35,19,71,0.3)" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
              )}
            </button>
          ))}
        </div>

        {/* Safety note */}
        <div className="mt-4 p-4 rounded-2xl" style={{background:'rgba(63,208,158,0.08)', border:'1px solid rgba(63,208,158,0.2)'}}>
          <p className="text-xs font-semibold text-mint-dark leading-relaxed" style={{fontFamily:'"Nunito",system-ui', color:'#1F7A5A'}}>
            🔒 BRAIN BUGS recopila datos mínimos de los niños: solo un apodo, avatar y rango de edad opcional. No se requiere correo electrónico ni información personal de los niños. Todo el contenido está diseñado especialmente para edades de 5 a 9 años.
          </p>
        </div>

        <button onClick={signOut}
          className="w-full mt-4 py-3 rounded-2xl font-bold text-center text-red-500"
          style={{fontFamily:'"Fredoka",system-ui', background:'#FFF0F0', boxShadow:'0 3px 0 rgba(200,0,0,0.07)'}}>
          Cerrar sesión
        </button>
        <div className="h-6"/>
      </div>

      {/* Reset confirmation */}
      {confirmReset && child && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/55">
          <div className="bg-white rounded-3xl p-6 w-full max-w-xs text-center">
            <div className="text-4xl mb-3">⚠️</div>
            <h3 className="text-lg font-bold text-ink mb-2" style={{fontFamily:'"Fredoka",system-ui'}}>¿Restablecer a {child.nickname}?</h3>
            <p className="text-sm text-ink/60 font-semibold mb-5" style={{fontFamily:'"Nunito",system-ui'}}>
              Todas las estrellas, medallas y el progreso de nivel se borrarán permanentemente.
            </p>
            <div className="flex gap-2">
              <button onClick={()=>setConfirmReset(false)}
                className="flex-1 py-3 rounded-2xl font-bold bg-gray-100 text-ink active:scale-95"
                style={{fontFamily:'"Fredoka",system-ui'}}>Cancelar</button>
              <button onClick={()=>{ resetChildProgress(child.id); setConfirmReset(false); }}
                className="flex-1 py-3 rounded-2xl font-bold text-white bg-red-500 active:scale-95"
                style={{fontFamily:'"Fredoka",system-ui', boxShadow:'0 4px 0 #B02020'}}>Restablecer</button>
            </div>
          </div>
        </div>
      )}

      <BottomNav/>
    </div>
  );
}

// ─── Settings Screen ──────────────────────────────────────────
export function SettingsScreen() {
  const { navigate, parent, signOut } = useApp();
  return (
    <div className="flex flex-col h-full" style={{background:'#F4F2FA'}}>
      <div className="bg-white px-4 pt-14 pb-3 flex items-center justify-between"
        style={{boxShadow:'0 2px 12px rgba(35,19,71,0.06)'}}>
        <button onClick={()=>navigate('parent-dashboard')}
          className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M15 6l-6 6 6 6" stroke="#231347" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        </button>
        <div style={{fontFamily:'"Fredoka",system-ui'}} className="font-bold text-ink text-base uppercase tracking-widest">Ajustes</div>
        <div className="w-10"/>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-5 space-y-4">
        <div className="bg-white rounded-2xl p-4" style={{boxShadow:'0 3px 0 rgba(35,19,71,0.07)'}}>
          <p className="font-bold text-ink mb-0.5" style={{fontFamily:'"Fredoka",system-ui'}}>👤 Cuenta</p>
          <p className="text-sm font-bold text-ink/60" style={{fontFamily:'"Nunito",system-ui'}}>{parent?.displayName}</p>
          <p className="text-xs text-ink/35 font-semibold" style={{fontFamily:'"Nunito",system-ui'}}>{parent?.email}</p>
        </div>

        <div className="bg-white rounded-2xl p-4" style={{boxShadow:'0 3px 0 rgba(35,19,71,0.07)'}}>
          <p className="font-bold text-ink mb-2" style={{fontFamily:'"Fredoka",system-ui'}}>🔒 Seguridad y Privacidad Infantil</p>
          <p className="text-sm text-ink/55 font-semibold leading-relaxed" style={{fontFamily:'"Nunito",system-ui'}}>
            BRAIN BUGS está diseñado con la privacidad infantil como prioridad. Los perfiles de niños requieren únicamente un apodo, avatar y rango de edad opcional. No se recopilan correos electrónicos, números de teléfono ni información personal de los niños.
          </p>
          <p className="text-sm text-ink/55 font-semibold leading-relaxed mt-2" style={{fontFamily:'"Nunito",system-ui'}}>
            Todo el contenido de los rompecabezas está diseñado a mano y revisado para que sea apropiado según la edad (de 5 a 9 años). No contiene anuncios, compras dentro de la aplicación ni intercambio de datos con terceros.
          </p>
          <div className="mt-3 p-3 rounded-xl" style={{background:'rgba(63,208,158,0.08)', border:'1px solid rgba(63,208,158,0.2)'}}>
            <p className="text-xs font-bold" style={{color:'#1F7A5A', fontFamily:'"Nunito",system-ui'}}>
              ✓ Diseño compatible con COPPA · ✓ Sin información personal infantil · ✓ Sin rastreadores de terceros
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4" style={{boxShadow:'0 3px 0 rgba(35,19,71,0.07)'}}>
          <p className="font-bold text-ink mb-1" style={{fontFamily:'"Fredoka",system-ui'}}>ℹ️ Acerca de BRAIN BUGS</p>
          <p className="text-sm text-ink/55 font-semibold" style={{fontFamily:'"Nunito",system-ui'}}>Versión 1.1.0 · ¡Piensa. Conecta. Resuelve. Crece!</p>
          <p className="text-xs text-ink/35 mt-1" style={{fontFamily:'"Nunito",system-ui'}}>MVP — El Bug Coach es determinista, no es IA en vivo. La autenticación usa localStorage a menos que Firebase esté configurado.</p>
        </div>

        <button onClick={signOut}
          className="w-full py-4 rounded-2xl font-bold text-center text-red-500"
          style={{fontFamily:'"Fredoka",system-ui', background:'#FFF0F0', boxShadow:'0 3px 0 rgba(200,0,0,0.07)'}}>
          Cerrar sesión
        </button>
      </div>
      <BottomNav/>
    </div>
  );
}
