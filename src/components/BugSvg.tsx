import React, { useState, useEffect } from 'react';
import type { BugKind } from '../types';
import { BUG_COLORS } from '../data/characters';

interface BugSvgProps {
  kind: BugKind;
  size?: number;
  className?: string;
  animated?: boolean;
  accessoryId?: string | null;
  expression?: 'normal' | 'blink' | 'wink' | 'stars';
}


function Eyes({ cx1, cx2, cy, r = 7, expression = 'normal' }: { cx1: number; cx2: number; cy: number; r?: number; expression?: 'normal' | 'blink' | 'wink' | 'stars' }) {
  const pr = r * 0.56;
  
  if (expression === 'blink') {
    return (
      <g>
        <path d={`M ${cx1 - r} ${cy} Q ${cx1} ${cy + r * 0.4} ${cx1 + r} ${cy}`} stroke="#231347" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <path d={`M ${cx2 - r} ${cy} Q ${cx2} ${cy + r * 0.4} ${cx2 + r} ${cy}`} stroke="#231347" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      </g>
    );
  }

  if (expression === 'wink') {
    return (
      <g>
        <circle cx={cx1} cy={cy} r={r} fill="#fff"/>
        <circle cx={cx1+0.8} cy={cy+0.5} r={pr} fill="#231347"/>
        <circle cx={cx1+1.8} cy={cy-1.5} r={pr*0.42} fill="#fff"/>
        <path d={`M ${cx2 - r} ${cy} Q ${cx2} ${cy + r * 0.4} ${cx2 + r} ${cy}`} stroke="#231347" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      </g>
    );
  }

  if (expression === 'stars') {
    return (
      <g>
        <circle cx={cx1} cy={cy} r={r} fill="#fff"/>
        <circle cx={cx2} cy={cy} r={r} fill="#fff"/>
        <text x={cx1} y={cy + r * 0.35} fontSize={r * 1.8} textAnchor="middle" dominantBaseline="middle">⭐</text>
        <text x={cx2} y={cy + r * 0.35} fontSize={r * 1.8} textAnchor="middle" dominantBaseline="middle">⭐</text>
      </g>
    );
  }

  return (
    <g>
      <circle cx={cx1} cy={cy} r={r} fill="#fff"/>
      <circle cx={cx2} cy={cy} r={r} fill="#fff"/>
      <circle cx={cx1+0.8} cy={cy+0.5} r={pr} fill="#231347"/>
      <circle cx={cx2+0.8} cy={cy+0.5} r={pr} fill="#231347"/>
      <circle cx={cx1+1.8} cy={cy-1.5} r={pr*0.42} fill="#fff"/>
      <circle cx={cx2+1.8} cy={cy-1.5} r={pr*0.42} fill="#fff"/>
    </g>
  );
}

function Smile({ x, y, w = 10 }: { x: number; y: number; w?: number }) {
  return (
    <path d={`M ${x-w/2} ${y} Q ${x} ${y+w*0.6} ${x+w/2} ${y}`}
      stroke="#231347" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
  );
}

function Accessory({ id }: { id: string }) {
  if (id === 'crown') {
    return (
      <g transform="translate(50, 27) scale(0.9) translate(-18, -15)">
        <polygon points="5,15 10,2 18,10 26,2 31,15" fill="#FFD55E" stroke="#B97808" strokeWidth="2.2" strokeLinejoin="round"/>
        <circle cx="10" cy="2" r="2.5" fill="#E84118"/>
        <circle cx="18" cy="10" r="2" fill="#00A8FF"/>
        <circle cx="26" cy="2" r="2.5" fill="#E84118"/>
        <rect x="8" y="12" width="20" height="3" fill="#E84118" rx="1"/>
      </g>
    );
  }
  if (id === 'sunglasses') {
    return (
      <g transform="translate(50, 54) scale(0.95) translate(-25, -8)">
        <ellipse cx="14" cy="8" rx="10" ry="7" fill="#2F3640" stroke="#1E272E" strokeWidth="1.5"/>
        <path d="M 6 6 Q 10 4 14 7" stroke="#FFF" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.6"/>
        <ellipse cx="36" cy="8" rx="10" ry="7" fill="#2F3640" stroke="#1E272E" strokeWidth="1.5"/>
        <path d="M 28 6 Q 32 4 36 7" stroke="#FFF" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.6"/>
        <rect x="20" y="5" width="10" height="2.5" fill="#1E272E" rx="0.5"/>
        <path d="M 4 8 L 0 5" stroke="#1E272E" strokeWidth="2" strokeLinecap="round"/>
        <path d="M 46 8 L 50 5" stroke="#1E272E" strokeWidth="2" strokeLinecap="round"/>
      </g>
    );
  }
  if (id === 'tophat') {
    return (
      <g transform="translate(50, 27) scale(0.95) translate(-20, -22)">
        <ellipse cx="20" cy="20" rx="18" ry="4" fill="#2F3640"/>
        <path d="M 8 20 L 10 3 L 30 3 L 32 20 Z" fill="#2F3640" stroke="#1E272E" strokeWidth="1"/>
        <path d="M 8.8 19 L 9.3 14 L 30.7 14 L 31.2 19 Z" fill="#E84118"/>
      </g>
    );
  }
  if (id === 'mustache') {
    return (
      <g transform="translate(50, 62) scale(0.95) translate(-20, -5)">
        <path d="M 20 6 C 15 2 10 2 4 6 C 0 8 0 11 3 10 C 10 8 15 10 20 7 C 25 10 30 8 37 10 C 40 11 40 8 36 6 C 30 2 25 2 20 6 Z" fill="#4A3728" stroke="#2C1D11" strokeWidth="1.2"/>
      </g>
    );
  }
  return null;
}

export default function BugSvg({ kind, size = 80, className = '', animated = false, accessoryId = null, expression }: BugSvgProps) {
  const [isBlinking, setIsBlinking] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsBlinking(true);
      const timeout = setTimeout(() => {
        setIsBlinking(false);
      }, 150);
      return () => clearTimeout(timeout);
    }, 4000 + Math.random() * 2000);

    return () => clearInterval(interval);
  }, []);

  const activeExpression = expression || (isBlinking ? 'blink' : 'normal');

  const c = BUG_COLORS[kind];
  const anim = animated ? 'animate-float' : '';

  const defs = (id: string) => (
    <defs>
      <radialGradient id={id} cx="0.38" cy="0.32">
        <stop offset="0" stopColor={c.light}/>
        <stop offset="1" stopColor={c.color}/>
      </radialGradient>
    </defs>
  );

  if (kind === 'pip') return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={`${anim} ${className}`}>
      {defs('pip-g')}
      <line x1="36" y1="38" x2="29" y2="22" stroke={c.dark} strokeWidth="2.8" strokeLinecap="round"/>
      <line x1="50" y1="36" x2="50" y2="18" stroke={c.dark} strokeWidth="2.8" strokeLinecap="round"/>
      <circle cx="29" cy="20" r="3.5" fill={c.dark}/>
      <circle cx="50" cy="16" r="3.5" fill={c.dark}/>
      <ellipse cx="76" cy="62" rx="18" ry="16" fill={c.color}/>
      <ellipse cx="50" cy="57" rx="21" ry="20" fill="url(#pip-g)"/>
      <ellipse cx="76" cy="62" rx="18" ry="16" fill="none" stroke={c.dark} strokeWidth="1.5" opacity="0.25"/>
      <Eyes cx1={43} cx2={57} cy={53} expression={activeExpression}/>
      <Smile x={50} y={66} w={11}/>
      <ellipse cx="38" cy="64" rx="3.5" ry="2.2" fill="#FF8AB0" opacity="0.5"/>
      <ellipse cx="62" cy="64" rx="3.5" ry="2.2" fill="#FF8AB0" opacity="0.5"/>
      {accessoryId && <Accessory id={accessoryId}/>}
    </svg>
  );

  if (kind === 'bobo') return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={`${anim} ${className}`}>
      {defs('bobo-g')}
      <line x1="38" y1="28" x2="32" y2="13" stroke={c.dark} strokeWidth="2.8" strokeLinecap="round"/>
      <line x1="62" y1="28" x2="68" y2="13" stroke={c.dark} strokeWidth="2.8" strokeLinecap="round"/>
      <circle cx="32" cy="11" r="4" fill={c.color}/>
      <circle cx="68" cy="11" r="4" fill={c.color}/>
      <ellipse cx="22" cy="58" rx="10" ry="14" fill="#fff" opacity="0.65" transform="rotate(-20 22 58)"/>
      <ellipse cx="78" cy="58" rx="10" ry="14" fill="#fff" opacity="0.65" transform="rotate(20 78 58)"/>
      <circle cx="50" cy="58" r="27" fill="url(#bobo-g)"/>
      <circle cx="40" cy="73" r="3.5" fill={c.dark} opacity="0.4"/>
      <circle cx="62" cy="75" r="2.8" fill={c.dark} opacity="0.4"/>
      <circle cx="68" cy="60" r="2" fill={c.dark} opacity="0.4"/>
      <Eyes cx1={42} cx2={58} cy={52} r={7.5} expression={activeExpression}/>
      <Smile x={50} y={66} w={13}/>
      {accessoryId && <Accessory id={accessoryId}/>}
    </svg>
  );

  if (kind === 'zig') return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={`${anim} ${className}`}>
      {defs('zig-g')}
      <defs><clipPath id="zig-clip"><ellipse cx="50" cy="60" rx="30" ry="25"/></clipPath></defs>
      <line x1="36" y1="38" x2="30" y2="22" stroke={c.dark} strokeWidth="2.8" strokeLinecap="round"/>
      <line x1="64" y1="38" x2="70" y2="22" stroke={c.dark} strokeWidth="2.8" strokeLinecap="round"/>
      <circle cx="30" cy="20" r="3.2" fill="#231347"/>
      <circle cx="70" cy="20" r="3.2" fill="#231347"/>
      <ellipse cx="50" cy="60" rx="30" ry="25" fill="url(#zig-g)"/>
      <g clipPath="url(#zig-clip)">
        <rect x="40" y="35" width="11" height="60" fill={c.dark} opacity="0.8" transform="rotate(20 50 60)"/>
      </g>
      <Eyes cx1={42} cx2={58} cy={55} expression={activeExpression}/>
      <Smile x={50} y={69} w={11}/>
      {accessoryId && <Accessory id={accessoryId}/>}
    </svg>
  );

  if (kind === 'mo') return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={`${anim} ${className}`}>
      {defs('mo-g')}
      <line x1="40" y1="34" x2="36" y2="18" stroke={c.dark} strokeWidth="2.8" strokeLinecap="round"/>
      <line x1="60" y1="34" x2="64" y2="18" stroke={c.dark} strokeWidth="2.8" strokeLinecap="round"/>
      <circle cx="36" cy="16" r="3.2" fill={c.dark}/>
      <circle cx="64" cy="16" r="3.2" fill={c.dark}/>
      <ellipse cx="50" cy="62" rx="28" ry="24" fill="url(#mo-g)"/>
      <circle cx="35" cy="70" r="3" fill="#fff" opacity="0.8"/>
      <circle cx="64" cy="76" r="3.5" fill="#fff" opacity="0.8"/>
      <circle cx="60" cy="55" r="2" fill="#fff" opacity="0.8"/>
      <Eyes cx1={42} cx2={58} cy={54} expression={activeExpression}/>
      <Smile x={50} y={68} w={12}/>
      {accessoryId && <Accessory id={accessoryId}/>}
    </svg>
  );

  if (kind === 'coach') return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={`${anim} ${className}`}>
      {defs('coach-g')}
      <line x1="38" y1="32" x2="34" y2="20" stroke={c.dark} strokeWidth="2.8" strokeLinecap="round"/>
      <line x1="62" y1="32" x2="66" y2="20" stroke={c.dark} strokeWidth="2.8" strokeLinecap="round"/>
      <circle cx="34" cy="19" r="3.2" fill={c.dark}/>
      <circle cx="66" cy="19" r="3.2" fill={c.dark}/>
      <circle cx="50" cy="58" r="27" fill="url(#coach-g)"/>
      {/* graduation cap */}
      <rect x="33" y="27" width="34" height="7" rx="2" fill="#231347"/>
      <polygon points="50,17 70,27 50,33 30,27" fill="#231347"/>
      <circle cx="50" cy="19" r="2.8" fill="#FFC83D"/>
      <Eyes cx1={42} cx2={58} cy={56} expression={activeExpression}/>
      <Smile x={50} y={70} w={13}/>
      <ellipse cx="36" cy="66" rx="3" ry="2" fill="#FF6F88" opacity="0.5"/>
      <ellipse cx="64" cy="66" rx="3" ry="2" fill="#FF6F88" opacity="0.5"/>
      {accessoryId && <Accessory id={accessoryId}/>}
    </svg>
  );

  // rose
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={`${anim} ${className}`}>
      {defs('rose-g')}
      <line x1="40" y1="34" x2="34" y2="18" stroke={c.dark} strokeWidth="2.8" strokeLinecap="round"/>
      <line x1="60" y1="34" x2="66" y2="18" stroke={c.dark} strokeWidth="2.8" strokeLinecap="round"/>
      <circle cx="34" cy="16" r="3.2" fill={c.dark}/>
      <circle cx="66" cy="16" r="3.2" fill={c.dark}/>
      <ellipse cx="50" cy="59" rx="26" ry="24" fill="url(#rose-g)"/>
      <Eyes cx1={42} cx2={58} cy={54} expression={activeExpression}/>
      <Smile x={50} y={66} w={11}/>
      {accessoryId && <Accessory id={accessoryId}/>}
    </svg>
  );
}

// Small inline bug face for piece tiles
export function BugFace({ color, size = 32 }: { color: string; size?: number }) {
  const s = size;
  return (
    <svg width={s} height={s} viewBox="0 0 40 40">
      <circle cx="20" cy="20" r="18" fill={color} opacity="0.9"/>
      {/* eyes */}
      <circle cx="14" cy="18" r="4" fill="#fff"/>
      <circle cx="26" cy="18" r="4" fill="#fff"/>
      <circle cx="15" cy="18" r="2" fill="#231347"/>
      <circle cx="27" cy="18" r="2" fill="#231347"/>
      {/* smile */}
      <path d="M 13 24 Q 20 30 27 24" stroke="#231347" strokeWidth="2" strokeLinecap="round" fill="none"/>
    </svg>
  );
}
