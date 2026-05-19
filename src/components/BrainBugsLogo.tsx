import React from 'react';

const LETTER_COLORS = ['#8E6BFF','#8E6BFF','#8E6BFF','#8E6BFF','#8E6BFF'];
const BUGS_COLORS  = ['#3FD09E','#FFC83D','#3FD09E','#FF7B5C'];

interface LetterProps {
  ch: string;
  color: string;
  rotate?: number;
  size?: number;
  dotEyes?: boolean;
}

function LogoLetter({ ch, color, rotate = 0, size = 38, dotEyes = false }: LetterProps) {
  return (
    <div style={{
      position: 'relative',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: size, height: size * 1.05,
      background: color, color: '#fff',
      fontFamily: '"Fredoka", system-ui', fontWeight: 700, fontSize: size * 0.68,
      borderRadius: size * 0.3,
      transform: `rotate(${rotate}deg)`,
      boxShadow: `inset 0 -${size*0.12}px 0 rgba(0,0,0,0.2), 0 ${size*0.08}px 0 rgba(0,0,0,0.2)`,
      lineHeight: 1, flexShrink: 0,
    }}>
      <span style={{ marginTop: -size * 0.05 }}>{ch}</span>
      {dotEyes && (
        <svg width={size * 0.52} height={size * 0.52} viewBox="0 0 100 100"
          style={{ position:'absolute', top:-size*0.18, left:'50%', transform:'translateX(-50%)' }}>
          <circle cx="22" cy="50" r="14" fill="#231347"/>
          <circle cx="78" cy="50" r="14" fill="#231347"/>
          <circle cx="22" cy="50" r="5" fill="#fff"/>
          <circle cx="78" cy="50" r="5" fill="#fff"/>
          <line x1="22" y1="36" x2="16" y2="14" stroke="#231347" strokeWidth="4" strokeLinecap="round"/>
          <line x1="78" y1="36" x2="84" y2="14" stroke="#231347" strokeWidth="4" strokeLinecap="round"/>
          <circle cx="16" cy="12" r="5" fill="#FF7B5C"/>
          <circle cx="84" cy="12" r="5" fill="#FFC83D"/>
        </svg>
      )}
    </div>
  );
}

interface BrainBugsLogoProps {
  size?: number;
  stacked?: boolean;
  className?: string;
}

export default function BrainBugsLogo({ size = 32, stacked = true, className = '' }: BrainBugsLogoProps) {
  const brain = 'BRAIN'.split('');
  const bugs  = 'BUGS'.split('');
  const gap = size * 0.1;

  if (!stacked) {
    return (
      <div className={`flex items-end ${className}`} style={{ gap: size * 0.08 }}>
        {brain.map((ch, i) => (
          <LogoLetter key={`b${i}`} ch={ch} color={LETTER_COLORS[i]} size={size} rotate={i%2?2:-2} />
        ))}
        <div style={{ width: size * 0.35 }} />
        {bugs.map((ch, i) => (
          <LogoLetter key={`g${i}`} ch={ch} color={BUGS_COLORS[i]} size={size*1.04}
            rotate={i===0?-3:i===bugs.length-1?3:(i%2?-2:2)} dotEyes={i===1} />
        ))}
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center ${className}`} style={{ gap }}>
      <div className="flex" style={{ gap: size * 0.08 }}>
        {brain.map((ch, i) => (
          <LogoLetter key={`b${i}`} ch={ch} color={LETTER_COLORS[i]} size={size}
            rotate={i===0?-4:i===brain.length-1?4:(i%2?2:-2)} />
        ))}
      </div>
      <div className="flex" style={{ gap: size * 0.08 }}>
        {bugs.map((ch, i) => (
          <LogoLetter key={`g${i}`} ch={ch} color={BUGS_COLORS[i]} size={size * 1.08}
            rotate={i===0?-3:i===bugs.length-1?3:(i%2?-2:2)} dotEyes={i===1} />
        ))}
      </div>
    </div>
  );
}
