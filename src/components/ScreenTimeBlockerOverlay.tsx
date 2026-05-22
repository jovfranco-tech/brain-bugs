import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../contexts/AppContext';
import { sound } from '../lib/sound';

export default function ScreenTimeBlockerOverlay() {
  const { currentChild, updateChildTimeLimit, navigate } = useApp();
  const [showParentVerification, setShowParentVerification] = useState(false);
  const [mathProblem, setMathProblem] = useState<{ num1: number; num2: number; answer: number } | null>(null);
  const [parentAnswer, setParentAnswer] = useState('');
  const [verificationError, setVerificationError] = useState('');
  const [verificationMode, setVerificationMode] = useState<'options' | 'math'>('options'); // 'options' shows after correct math, or 'math' shows verification

  const [stretchActive, setStretchActive] = useState(false);
  const [stretchSeconds, setStretchSeconds] = useState(10);
  const [stretchFinished, setStretchFinished] = useState(false);

  React.useEffect(() => {
    if (!stretchActive || stretchSeconds <= 0) {
      if (stretchActive && stretchSeconds === 0) {
        setStretchFinished(true);
      }
      return;
    }
    const timer = setTimeout(() => {
      setStretchSeconds(prev => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [stretchActive, stretchSeconds]);

  if (!currentChild) return null;

  const generateMathProblem = () => {
    const num1 = Math.floor(Math.random() * 8) + 3; // 3 to 10
    const num2 = Math.floor(Math.random() * 7) + 4; // 4 to 10
    setMathProblem({
      num1,
      num2,
      answer: num1 * num2,
    });
    setParentAnswer('');
    setVerificationError('');
    setVerificationMode('math');
    setShowParentVerification(true);
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mathProblem) return;

    if (parseInt(parentAnswer) === mathProblem.answer) {
      sound.playClick();
      setVerificationMode('options');
      setVerificationError('');
    } else {
      setVerificationError('Respuesta incorrecta. ¡Inténtalo de nuevo!');
      sound.playClick(); // play failure feedback
    }
  };

  const addTime = (minutes: number) => {
    sound.playClick();
    updateChildTimeLimit(currentChild.id, minutes);
    setShowParentVerification(false);
  };

  const goToDashboard = () => {
    sound.playClick();
    // Temporarily disable the lock by setting limit to 0 or we navigate directly
    // Let's set the time limit to 0 (unlimited) so the parent can configure it inside the dashboard,
    // or just add 15 minutes so they can access the dashboard.
    // Actually, setting to 0 (unlimited) or adding 15 min so they can navigate is great!
    updateChildTimeLimit(currentChild.id, 0); 
    navigate('parent-dashboard');
    setShowParentVerification(false);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center p-6 bg-gradient-to-br from-[#1E0F33] via-[#0D041A] to-[#120524]">
      {/* Dynamic light effects in background */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-purple-600/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-emerald-600/5 blur-3xl pointer-events-none" />

      {/* Main friendly message card */}
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="bg-[#24133D]/80 border border-[#3E1B6B] rounded-[32px] p-8 max-w-sm w-full text-center relative overflow-hidden backdrop-blur-md"
        style={{ boxShadow: '0 20px 50px rgba(0,0,0,0.5), inset 0 2px 10px rgba(255,255,255,0.05)' }}
      >
        {/* Animated sleeping bug icon */}
        <div className="relative w-36 h-36 mx-auto mb-6 flex items-center justify-center bg-gradient-to-br from-[#8E6BFF] to-[#5A3BD1] rounded-full" style={{ boxShadow: '0 8px 24px rgba(142,107,255,0.3)' }}>
          <motion.div 
            animate={{ 
              y: [0, -6, 0],
              rotate: [0, 2, -2, 0]
            }}
            transition={{ 
              repeat: Infinity, 
              duration: 4, 
              ease: "easeInOut" 
            }}
            className="text-7xl select-none"
          >
            😴
          </motion.div>
          {/* Animated ZZZs */}
          <motion.span 
            animate={{ y: [-10, -40], x: [0, 15], opacity: [0, 1, 0] }}
            transition={{ repeat: Infinity, duration: 2.5, delay: 0 }}
            className="absolute top-4 right-4 text-purple-200 font-bold text-xl select-none"
          >
            z
          </motion.span>
          <motion.span 
            animate={{ y: [-10, -45], x: [0, 20], opacity: [0, 1, 0] }}
            transition={{ repeat: Infinity, duration: 2.5, delay: 0.8 }}
            className="absolute top-2 right-10 text-purple-300 font-bold text-2xl select-none"
          >
            Z
          </motion.span>
          <motion.span 
            animate={{ y: [-10, -50], x: [0, 25], opacity: [0, 1, 0] }}
            transition={{ repeat: Infinity, duration: 2.5, delay: 1.5 }}
            className="absolute top-0 right-16 text-purple-400 font-bold text-3xl select-none"
          >
            Z
          </motion.span>
        </div>

        <h2 className="text-3xl font-bold mb-3 text-white" style={{ fontFamily: '"Fredoka",system-ui' }}>
          ¡Hora de descansar!
        </h2>

        <p className="text-purple-200 text-sm leading-relaxed mb-6 font-semibold" style={{ fontFamily: '"Nunito",system-ui' }}>
          Has jugado y aprendido muchísimo hoy, <strong>{currentChild.nickname}</strong>. Tu bicho compañero está cansado y necesita dormir un rato.
          <br /><br />
          🌳 ¡Aprovecha para estirar tus alas, jugar al aire libre y descansar tus ojos!
        </p>

        {/* Micro-pausa Activa Kid Stretching Exercise */}
        {!stretchActive ? (
          <button
            onClick={() => {
              sound.playClick();
              setStretchActive(true);
              setStretchSeconds(10);
              setStretchFinished(false);
            }}
            className="w-full mb-4 py-3 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-emerald-400 to-[#3FD09E] active:scale-95 transition-all shadow-md flex items-center justify-center gap-2"
            style={{ fontFamily: '"Fredoka",system-ui', boxShadow: '0 4px 0 #1F9A6E' }}
          >
            🦋 Hacer Estiramiento Activo
          </button>
        ) : (
          <div className="mb-6 p-4 rounded-2xl border bg-[#1E0F33]/90 border-emerald-500/30 flex flex-col items-center">
            <h4 className="text-sm font-bold text-emerald-400 mb-1" style={{ fontFamily: '"Fredoka",system-ui' }}>
              {stretchFinished ? '¡Excelente estiramiento! 🎉' : '¡Estira tus brazos hacia arriba! 🧘'}
            </h4>
            
            {!stretchFinished ? (
              <>
                <p className="text-[11px] text-purple-200 mb-3" style={{ fontFamily: '"Nunito",system-ui' }}>
                  Inhala profundo y estira tus brazos hacia el cielo como Rose...
                </p>
                <motion.div 
                  animate={{ scale: [1, 1.4, 1] }}
                  transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                  className="w-16 h-16 rounded-full bg-emerald-400/20 border-2 border-emerald-400 flex items-center justify-center text-2xl mb-3 shadow-lg select-none"
                >
                  🌬️
                </motion.div>
                <div className="text-xl font-bold text-amber-400" style={{ fontFamily: '"Fredoka",system-ui' }}>
                  {stretchSeconds}s
                </div>
              </>
            ) : (
              <>
                <p className="text-xs text-emerald-200 leading-snug font-semibold mt-1" style={{ fontFamily: '"Nunito",system-ui' }}>
                  ¡Tus ojos y tu cuerpo te lo agradecen! Ahora descansa tus alitas un momento.
                </p>
                <span className="text-4xl mt-3 select-none">✨🦋✨</span>
              </>
            )}
          </div>
        )}

        {/* Parent Escape Hatch Button */}
        <button
          onClick={generateMathProblem}
          className="py-2.5 px-6 rounded-2xl text-xs font-bold text-[#A78BFA] bg-[#1E0F33] border border-[#3E1B6B] hover:text-white hover:bg-[#2A174E] active:scale-95 transition-all"
          style={{ fontFamily: '"Fredoka",system-ui' }}
        >
          🔐 Control de Padres
        </button>
      </motion.div>

      {/* Parental verification modal overlay */}
      <AnimatePresence>
        {showParentVerification && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6 bg-black/80" onClick={() => setShowParentVerification(false)}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-[#1E0F33] border border-[#331C54] rounded-[28px] p-6 w-full max-w-xs text-center relative overflow-hidden"
              style={{ boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}
            >
              <div className="text-3xl mb-2">🔐</div>
              
              {verificationMode === 'math' && mathProblem && (
                <form onSubmit={handleVerify}>
                  <h3 className="text-lg font-bold text-white mb-2" style={{ fontFamily: '"Fredoka",system-ui' }}>
                    Área de Padres
                  </h3>
                  <p className="text-xs text-purple-300 font-semibold mb-4" style={{ fontFamily: '"Nunito",system-ui' }}>
                    Resuelve esta multiplicación para comprobar que eres un adulto:
                  </p>

                  <div className="text-3xl font-extrabold text-amber-400 mb-4 tracking-wider" style={{ fontFamily: '"Fredoka",system-ui' }}>
                    {mathProblem.num1} × {mathProblem.num2} = ?
                  </div>

                  <input
                    type="number"
                    pattern="[0-9]*"
                    inputMode="numeric"
                    value={parentAnswer}
                    onChange={e => setParentAnswer(e.target.value)}
                    placeholder="Resultado"
                    autoFocus
                    className="w-full py-3 px-4 rounded-xl text-center font-bold text-lg bg-[#2D174E] border border-[#3E1B6B] text-white focus:outline-none focus:border-[#8E6BFF] placeholder-purple-400/50 mb-3"
                  />

                  {verificationError && (
                    <div className="text-xs text-red-400 font-bold mb-3">
                      {verificationError}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowParentVerification(false)}
                      className="flex-1 py-3 rounded-xl font-bold bg-[#2D174E] text-[#D8B4FE] active:scale-95 transition-all text-xs"
                      style={{ fontFamily: '"Fredoka",system-ui' }}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-3 rounded-xl font-bold text-white bg-[#8E6BFF] active:scale-95 transition-all text-xs"
                      style={{ fontFamily: '"Fredoka",system-ui', boxShadow: '0 4px 0 #5A3BD1' }}
                    >
                      Verificar
                    </button>
                  </div>
                </form>
              )}

              {verificationMode === 'options' && (
                <div>
                  <h3 className="text-lg font-bold text-emerald-400 mb-2" style={{ fontFamily: '"Fredoka",system-ui' }}>
                    ¡Acceso Concedido!
                  </h3>
                  <p className="text-xs text-purple-200 font-semibold mb-5" style={{ fontFamily: '"Nunito",system-ui' }}>
                    ¿Qué te gustaría hacer con el tiempo de pantalla?
                  </p>

                  <div className="flex flex-col gap-2 mb-4">
                    <button
                      onClick={() => addTime(15)}
                      className="w-full py-3 px-4 rounded-xl font-bold bg-[#2D174E] text-white hover:bg-[#3D1F69] text-sm text-left flex items-center justify-between"
                      style={{ fontFamily: '"Fredoka",system-ui' }}
                    >
                      <span>⏱ Añadir 15 minutos</span>
                      <span className="text-amber-400 text-xs">Añadir</span>
                    </button>
                    <button
                      onClick={() => addTime(30)}
                      className="w-full py-3 px-4 rounded-xl font-bold bg-[#2D174E] text-white hover:bg-[#3D1F69] text-sm text-left flex items-center justify-between"
                      style={{ fontFamily: '"Fredoka",system-ui' }}
                    >
                      <span>⏱ Añadir 30 minutos</span>
                      <span className="text-amber-400 text-xs">Añadir</span>
                    </button>
                    <button
                      onClick={goToDashboard}
                      className="w-full py-3 px-4 rounded-xl font-bold bg-gradient-to-r from-[#8E6BFF] to-[#5A3BD1] text-white text-sm text-left flex items-center justify-between shadow-md"
                      style={{ fontFamily: '"Fredoka",system-ui' }}
                    >
                      <span>⚙️ Ir al Panel de Padres</span>
                      <span className="text-white text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-extrabold uppercase">Ver</span>
                    </button>
                  </div>

                  <button
                    onClick={() => setShowParentVerification(false)}
                    className="w-full py-2.5 rounded-xl font-bold bg-[#2D174E] text-[#D8B4FE] active:scale-95 transition-all text-xs"
                    style={{ fontFamily: '"Fredoka",system-ui' }}
                  >
                    Cerrar
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
