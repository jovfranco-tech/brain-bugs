import React from 'react';
import { useApp } from '../contexts/AppContext';
import type { Screen } from '../types';

interface TabItem { screen: Screen; label: string; icon: React.ReactNode; }

const TABS: TabItem[] = [
  {
    screen: 'world-map', label: 'Jugar',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" fill="#FFC83D"/>
        <path d="M10 8l6 4-6 4z" fill="#231347"/>
      </svg>
    ),
  },
  {
    screen: 'home', label: 'Inicio',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M3 12l9-9 9 9M5 10v9a1 1 0 001 1h4v-4h4v4h4a1 1 0 001-1v-9"
          stroke="#231347" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    screen: 'rewards', label: 'Medallas',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M12 2l2.4 4.9L20 8l-4 3.9.9 5.5L12 14.8 7.1 17.4 8 11.9 4 8l5.6-1.1z"
          stroke="#231347" strokeWidth="2" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    screen: 'parent-dashboard', label: 'Padres',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="#231347" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="12" cy="7" r="4" stroke="#231347" strokeWidth="2"/>
      </svg>
    ),
  },
];

export default function BottomNav() {
  const { screen, navigate } = useApp();

  return (
    <nav className="flex items-center justify-around px-2 py-2 bg-white rounded-3xl mx-3 mb-2"
      style={{ boxShadow:'0 -2px 20px rgba(35,19,71,0.07), 0 6px 0 rgba(35,19,71,0.11)', flexShrink: 0 }}>
      {TABS.map(tab => {
        const active = screen === tab.screen;
        return (
          <button
            key={tab.screen}
            onClick={() => { if (!active) navigate(tab.screen); }}
            className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl transition-all active:scale-90"
            style={{
              background: active ? 'linear-gradient(180deg,#FFF1B2,#FFE07A)' : 'transparent',
              boxShadow: active ? '0 4px 0 rgba(217,160,21,0.35)' : 'none',
              transform: active ? 'translateY(-3px)' : 'none',
              border: 'none',
            }}>
            <span className={`transition-transform ${active ? 'scale-110' : ''}`}>
              {tab.icon}
            </span>
            <span style={{
              fontFamily: '"Fredoka",system-ui', fontSize: 10,
              fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase',
              color: active ? '#231347' : 'rgba(35,19,71,0.45)',
            }}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
