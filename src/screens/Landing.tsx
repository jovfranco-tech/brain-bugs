import React from 'react';
import BrainBugsLogo from '../components/BrainBugsLogo';
import BugSvg from '../components/BugSvg';
import { useApp } from '../contexts/AppContext';

export default function Landing() {
  const { navigate } = useApp();

  return (
    <div className="relative flex flex-col h-full overflow-hidden select-none"
      style={{ background: 'linear-gradient(180deg,#C8EAFF 0%,#D8F5C2 50%,#84C660 100%)' }}>

      {/* Sun */}
      <div className="absolute -top-10 -right-10 w-52 h-52 rounded-full pointer-events-none"
        style={{ background:'radial-gradient(circle,rgba(255,220,90,0.75) 0%,rgba(255,220,90,0) 65%)' }}/>

      {/* Clouds */}
      <div className="absolute top-14 left-3 w-28 h-7 rounded-full bg-white opacity-80"/>
      <div className="absolute top-22 left-14 w-20 h-5 rounded-full bg-white opacity-60"/>
      <div className="absolute top-12 right-10 w-20 h-6 rounded-full bg-white opacity-65"/>

      {/* Hills */}
      <svg viewBox="0 0 430 300" preserveAspectRatio="none"
        className="absolute bottom-20 w-full h-64 pointer-events-none">
        <path d="M0 140 Q 108 55 216 120 T 430 80 L 430 300 L 0 300 Z" fill="#7BBD56"/>
        <path d="M0 210 Q 145 140 290 200 T 430 185 L 430 300 L 0 300 Z" fill="#5EA338"/>
        {/* Flowers */}
        {[[28,220],[72,198],[130,215],[205,198],[275,210],[340,200],[400,218]].map(([x,y],i)=>(
          <g key={i} transform={`translate(${x},${y})`}>
            <circle cx="0" cy="-9" r="4.5" fill={['#FFD55E','#FF7B5C','#FF6FA8','#8E6BFF','#5BC5FF'][i%5]}/>
            <rect x="-1.2" y="-5" width="2.4" height="9" fill="#3A8C20" rx="1"/>
          </g>
        ))}
      </svg>

      {/* Floating bugs */}
      <div className="absolute top-36 left-3 animate-float" style={{animationDelay:'0s'}}>
        <BugSvg kind="bobo" size={64} animated/>
      </div>
      <div className="absolute top-48 right-5 animate-float" style={{animationDelay:'0.9s'}}>
        <BugSvg kind="zig" size={56} animated/>
      </div>
      <div className="absolute top-72 left-16 animate-float" style={{animationDelay:'0.4s'}}>
        <BugSvg kind="pip" size={48} animated/>
      </div>
      <div className="absolute top-60 right-16 animate-float" style={{animationDelay:'1.3s'}}>
        <BugSvg kind="rose" size={42} animated/>
      </div>

      {/* Logo + tagline */}
      <div className="relative z-10 flex flex-col items-center pt-20 px-4">
        <BrainBugsLogo size={34} stacked/>
        <p className="mt-3 text-ink/65 text-base font-semibold tracking-wide"
          style={{fontFamily:'"Fredoka",system-ui'}}>
          Think · Connect · Solve · Grow!
        </p>
        <div className="mt-2 px-4 py-1.5 rounded-full"
          style={{background:'rgba(255,255,255,0.55)', backdropFilter:'blur(6px)'}}>
          <p className="text-xs font-bold text-ink/60" style={{fontFamily:'"Nunito",system-ui'}}>
            Spatial puzzles · Ages 5–9 · Parent-safe
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="absolute bottom-0 left-0 right-0 z-10 px-5 pb-12 flex flex-col gap-3">
        <button
          onClick={() => navigate('signup')}
          className="w-full py-5 rounded-3xl font-bold text-2xl tracking-widest active:scale-95 transition-transform"
          style={{
            background:'linear-gradient(180deg,#FFD55E 0%,#FFB23A 100%)',
            fontFamily:'"Fredoka",system-ui', color:'#231347',
            boxShadow:'0 9px 0 #B97808, inset 0 -4px 0 rgba(255,255,255,0.18), inset 0 3px 0 rgba(255,255,255,0.42)',
            textShadow:'0 2px 0 rgba(0,0,0,0.14)',
            letterSpacing:2,
          }}>
          GET STARTED
        </button>

        <button
          onClick={() => navigate('login')}
          className="w-full py-4 rounded-3xl font-bold text-lg active:scale-95 transition-transform"
          style={{
            background:'rgba(255,255,255,0.85)', backdropFilter:'blur(8px)',
            fontFamily:'"Fredoka",system-ui', color:'#231347',
            boxShadow:'0 6px 0 rgba(35,19,71,0.12)',
          }}>
          I already have an account
        </button>

        <p className="text-center text-xs text-ink/40 font-semibold" style={{fontFamily:'"Nunito",system-ui'}}>
          Parent account required · No ads · No tracking
        </p>
      </div>
    </div>
  );
}
