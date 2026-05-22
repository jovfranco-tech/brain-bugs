import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../contexts/AppContext';
import BugSvg from '../components/BugSvg';
import BottomNav from '../components/BottomNav';
import { sound } from '../lib/sound';
import confetti from 'canvas-confetti';

interface AccessoryItem {
  id: string;
  name: string;
  emoji: string;
  cost: number;
  description: string;
}

const ACCESSORIES: AccessoryItem[] = [
  { id: 'mustache', name: 'Bigote Clásico', emoji: '👨', cost: 50, description: 'Un bigote elegante para un bicho distinguido.' },
  { id: 'sunglasses', name: 'Gafas de Sol', emoji: '🕶️', cost: 80, description: '¡Súper cool! Protege a tu bicho del resplandor espacial.' },
  { id: 'tophat', name: 'Sombrero de Copa', emoji: '🎩', cost: 120, description: 'Un toque de magia y sofisticación para tu compañero.' },
  { id: 'crown', name: 'Corona Real', emoji: '👑', cost: 150, description: '¡Para la realeza de BRAIN BUGS! Brilla con orgullo.' },
];

export default function AccessoryStore() {
  const { currentChild, navigate, unlockAccessory, equipAccessory } = useApp();
  const [selectedId, setSelectedId] = useState<string>('mustache');

  if (!currentChild) return null;

  const xp = currentChild.totalXP ?? 0;
  const unlocked = currentChild.unlockedAccessories ?? [];
  const activeId = currentChild.activeAccessoryId ?? null;

  const selectedItem = ACCESSORIES.find((a) => a.id === selectedId) || ACCESSORIES[0];
  const isSelectedUnlocked = unlocked.includes(selectedItem.id);
  const isSelectedEquipped = activeId === selectedItem.id;

  const handleAction = () => {
    if (isSelectedUnlocked) {
      if (isSelectedEquipped) {
        // Unequip
        equipAccessory(currentChild.id, null);
        sound.playSnap();
      } else {
        // Equip
        equipAccessory(currentChild.id, selectedItem.id);
        sound.playSnap();
      }
    } else {
      // Purchase
      if (xp >= selectedItem.cost) {
        unlockAccessory(currentChild.id, selectedItem.id, selectedItem.cost);
        sound.playVictory();
        
        // Confetti celebration burst centered on showcase
        confetti({
          particleCount: 90,
          spread: 60,
          origin: { y: 0.35 }
        });
      } else {
        sound.playError();
      }
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'linear-gradient(180deg, #1C0F35 0%, #0F0926 100%)' }}>
      {/* Star Field background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-white animate-pulse"
            style={{
              left: `${(i * 37 + 12) % 100}%`,
              top: `${(i * 73 + 19) % 100}%`,
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-4 pt-14 pb-3 flex-shrink-0">
        <button
          onClick={() => navigate('home')}
          className="w-10 h-10 rounded-full flex items-center justify-center active:scale-90"
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M15 6l-6 6 6 6" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </button>
        <div className="flex flex-col items-center">
          <div
            className="font-bold text-white text-lg uppercase tracking-wider text-center"
            style={{ fontFamily: '"Fredoka",system-ui', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}
          >
            Estilo Bicho 🎩🕶️
          </div>
          <span className="text-white/40 text-xs font-semibold" style={{ fontFamily: '"Nunito",system-ui' }}>
            Personaliza tu bicho acompañante
          </span>
        </div>
        {/* XP Counter Pill */}
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
          style={{
            background: 'rgba(255, 200, 61, 0.15)',
            border: '1.5px solid rgba(255, 200, 61, 0.4)',
          }}
        >
          <span className="text-yellow-400 font-bold text-sm" style={{ fontFamily: '"Fredoka",system-ui' }}>
            {xp} XP
          </span>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col justify-center px-4 overflow-y-auto no-scrollbar relative z-10">
        {/* Showcase Stage */}
        <div className="relative flex flex-col items-center py-6 mb-5">
          <div
            className="w-48 h-48 rounded-full flex items-center justify-center relative overflow-hidden"
            style={{
              background: 'radial-gradient(circle, rgba(142,107,255,0.2) 0%, rgba(142,107,255,0) 70%)',
            }}
          >
            {/* Stage Pedestal */}
            <div
              className="absolute bottom-1 w-32 h-6 rounded-full blur-[2px]"
              style={{
                background: 'radial-gradient(ellipse at center, rgba(142,107,255,0.6) 0%, rgba(142,107,255,0) 80%)',
              }}
            />
            {/* Pedestal Magical Sparks */}
            {[...Array(8)].map((_, idx) => {
              const delay = idx * 0.45;
              const leftOffset = 25 + (idx * 17) % 50; // scatter around center
              const size = 3 + (idx * 3) % 5;
              const colors = ['#FFD55E', '#3FD09E', '#8E6BFF', '#5BC5FF', '#FF6FA8'];
              const color = colors[idx % colors.length];
              return (
                <div
                  key={idx}
                  className="absolute pointer-events-none"
                  style={{
                    bottom: '16px',
                    left: `${leftOffset}%`,
                    width: `${size}px`,
                    height: `${size}px`,
                    borderRadius: '50%',
                    background: color,
                    boxShadow: `0 0 6px ${color}`,
                    animation: `riseUp 3.2s ease-in-out infinite`,
                    animationDelay: `${delay}s`,
                  }}
                />
              );
            })}
            {/* Companion Bug with Live Preview of selected accessory (if unlocked) or currently equipped */}
            <motion.div
              animate={{ y: [-5, 5, -5] }}
              transition={{ repeat: Infinity, duration: 3.2, ease: "easeInOut" }}
              className="relative z-10 transform scale-110"
            >
              <BugSvg
                kind={currentChild.bugCompanion}
                size={112}
                animated
                accessoryId={isSelectedUnlocked ? selectedItem.id : activeId}
              />
            </motion.div>
          </div>

          {/* Locked Badge Overlay */}
          {!isSelectedUnlocked && (
            <div
              className="absolute top-4 right-1/4 bg-red-500/80 backdrop-blur-sm text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
              style={{ fontFamily: '"Fredoka",system-ui', boxShadow: '0 2px 8px rgba(232,65,24,0.4)' }}
            >
              <span>🔒 Bloqueado</span>
            </div>
          )}
        </div>

        {/* Selected Accessory Description Card */}
        <div
          className="p-4 rounded-3xl mb-5 text-center transition-all duration-300"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1.5px solid rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div className="text-3xl mb-1">{selectedItem.emoji}</div>
          <h3 className="text-white font-bold text-lg" style={{ fontFamily: '"Fredoka",system-ui' }}>
            {selectedItem.name}
          </h3>
          <p className="text-white/60 text-xs font-semibold mt-1 mb-4 px-2" style={{ fontFamily: '"Nunito",system-ui' }}>
            {selectedItem.description}
          </p>

          <button
            onClick={handleAction}
            className="w-full py-3.5 rounded-2xl font-bold text-lg active:scale-95 transition-all flex items-center justify-center gap-2"
            style={{
              background: isSelectedUnlocked
                ? isSelectedEquipped
                  ? 'rgba(255,255,255,0.1)'
                  : 'linear-gradient(180deg, #3FD09E, #1F9A6E)'
                : xp >= selectedItem.cost
                ? 'linear-gradient(180deg, #FFD55E, #FFB23A)'
                : 'rgba(255,255,255,0.05)',
              color: isSelectedUnlocked
                ? isSelectedEquipped
                  ? 'rgba(255,255,255,0.7)'
                  : '#fff'
                : xp >= selectedItem.cost
                ? '#231347'
                : 'rgba(255,255,255,0.25)',
              border: isSelectedUnlocked && isSelectedEquipped ? '1.5px solid rgba(255,255,255,0.2)' : 'none',
              boxShadow: !isSelectedUnlocked && xp >= selectedItem.cost
                ? '0 5px 0 #B97808'
                : isSelectedUnlocked && !isSelectedEquipped
                ? '0 5px 0 #187D59'
                : 'none',
              fontFamily: '"Fredoka",system-ui',
              cursor: (!isSelectedUnlocked && xp < selectedItem.cost) ? 'not-allowed' : 'pointer',
            }}
            disabled={!isSelectedUnlocked && xp < selectedItem.cost}
          >
            {isSelectedUnlocked ? (
              isSelectedEquipped ? 'Quitar Accesorio' : 'Equipar Accesorio'
            ) : (
              <>
                <span>Comprar por</span>
                <span className="font-extrabold">{selectedItem.cost} XP</span>
              </>
            )}
          </button>
          {!isSelectedUnlocked && xp < selectedItem.cost && (
            <p className="text-red-400 text-xs font-bold mt-2" style={{ fontFamily: '"Nunito",system-ui' }}>
              ⚠️ Te faltan {selectedItem.cost - xp} XP para poder comprar este accesorio.
            </p>
          )}
        </div>

        {/* Carousel Grid */}
        <div className="mb-4">
          <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-3 px-1" style={{ fontFamily: '"Nunito",system-ui' }}>
            Colección de Accesorios
          </p>
          <div className="grid grid-cols-4 gap-2">
            {ACCESSORIES.map((item) => {
              const isUnlocked = unlocked.includes(item.id);
              const isEquipped = activeId === item.id;
              const isSelected = selectedId === item.id;

              return (
                <motion.button
                  key={item.id}
                  onClick={() => {
                    setSelectedId(item.id);
                    sound.playDrag();
                  }}
                  whileHover={{ scale: 1.06, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="aspect-square flex flex-col items-center justify-center p-2 rounded-2xl relative border"
                  style={{
                    background: isSelected
                      ? 'rgba(142, 107, 255, 0.15)'
                      : 'rgba(255, 255, 255, 0.03)',
                    borderColor: isSelected
                      ? '#8E6BFF'
                      : isEquipped
                      ? '#3FD09E'
                      : 'rgba(255, 255, 255, 0.06)',
                  }}
                >
                  {/* Status Indicator */}
                  <div className="absolute top-1 right-1 text-xs">
                    {isEquipped ? '✅' : !isUnlocked ? '🔒' : ''}
                  </div>

                  <span className="text-2xl mb-1 leading-none">{item.emoji}</span>
                  <span
                    className="text-[9px] font-bold text-center leading-tight truncate w-full"
                    style={{
                      fontFamily: '"Fredoka",system-ui',
                      color: isSelected ? '#fff' : 'rgba(255,255,255,0.5)',
                    }}
                  >
                    {item.name.split(' ')[0]}
                  </span>
                  {!isUnlocked && (
                    <span className="text-[8px] font-extrabold text-yellow-500 mt-0.5 leading-none">
                      {item.cost} XP
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <BottomNav />
      
      <style>{`
        @keyframes riseUp {
          0% { transform: translateY(12px) scale(0.3); opacity: 0; }
          50% { opacity: 0.95; }
          100% { transform: translateY(-70px) scale(1.1); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
