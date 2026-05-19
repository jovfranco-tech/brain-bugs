import React, { useState } from 'react';
import BrainBugsLogo from '../components/BrainBugsLogo';
import { useApp } from '../contexts/AppContext';

interface AuthScreenProps {
  mode: 'login' | 'signup';
}

export default function AuthScreen({ mode }: AuthScreenProps) {
  const { signIn, signUp, navigate, isLoading } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const isLogin = mode === 'login';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password || (!isLogin && !displayName)) {
      setError('Por favor, completa todos los campos.');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    const result = isLogin
      ? await signIn(email, password)
      : await signUp(email, password, displayName);
    if (result?.error) setError(result.error);
  };

  const inputClass = `w-full px-4 py-3.5 rounded-2xl border-2 border-transparent focus:border-grape outline-none transition-colors text-ink font-semibold placeholder:text-ink/30 text-base`;
  const inputStyle = {
    fontFamily: '"Nunito", system-ui',
    background: '#F6F4FB',
    boxShadow: 'inset 0 2px 4px rgba(35,19,71,0.06)',
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto no-scrollbar"
      style={{ background: 'linear-gradient(180deg, #EDE8FF 0%, #FFF7EA 100%)' }}>

      {/* Header */}
      <div className="flex flex-col items-center pt-12 pb-6 px-6">
        <BrainBugsLogo size={26} stacked={false} />
        <h2 className="mt-6 text-2xl font-bold text-ink"
          style={{ fontFamily: '"Fredoka", system-ui' }}>
          {isLogin ? '¡Bienvenido de nuevo! 👋' : 'Crear Cuenta de Padres'}
        </h2>
        <p className="mt-1 text-sm text-ink/60 font-semibold" style={{ fontFamily: '"Nunito", system-ui' }}>
          {isLogin ? 'Inicia sesión para continuar la aventura' : 'Los padres se registran — ¡los niños juegan!'}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex-1 px-6 flex flex-col gap-4">
        {!isLogin && (
          <div>
            <label className="block text-xs font-bold text-ink/60 uppercase tracking-wide mb-2 ml-1"
              style={{ fontFamily: '"Nunito", system-ui' }}>Tu nombre</label>
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="ej. Sara"
              className={inputClass}
              style={inputStyle}
              autoComplete="name"
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-ink/60 uppercase tracking-wide mb-2 ml-1"
            style={{ fontFamily: '"Nunito", system-ui' }}>Correo electrónico</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="padre@correo.com"
            className={inputClass}
            style={inputStyle}
            autoComplete="email"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-ink/60 uppercase tracking-wide mb-2 ml-1"
            style={{ fontFamily: '"Nunito", system-ui' }}>Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder={isLogin ? '••••••••' : 'Al menos 6 caracteres'}
            className={inputClass}
            style={inputStyle}
            autoComplete={isLogin ? 'current-password' : 'new-password'}
          />
        </div>

        {error && (
          <div className="px-4 py-3 rounded-2xl text-sm font-bold"
            style={{ background: '#FFEEEE', color: '#CC3333', fontFamily: '"Nunito", system-ui' }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-4 rounded-3xl text-white font-bold text-xl mt-2 transition-all active:scale-95 disabled:opacity-60"
          style={{
            background: isLoading ? '#9B85FF' : 'linear-gradient(180deg, #A07AFF, #7B52F2)',
            fontFamily: '"Fredoka", system-ui',
            boxShadow: '0 6px 0 #5A3BD1',
            letterSpacing: 1,
          }}>
          {isLoading ? '...' : isLogin ? 'INICIAR SESIÓN' : 'CREAR CUENTA'}
        </button>

        <div className="text-center pb-8 mt-2">
          <span className="text-sm text-ink/50 font-semibold" style={{ fontFamily: '"Nunito", system-ui' }}>
            {isLogin ? '¿No tienes una cuenta? ' : '¿Ya tienes una cuenta? '}
          </span>
          <button
            type="button"
            onClick={() => navigate(isLogin ? 'signup' : 'login')}
            className="text-sm font-bold text-grape underline"
            style={{ fontFamily: '"Nunito", system-ui' }}>
            {isLogin ? 'Regístrate' : 'Inicia sesión'}
          </button>
        </div>
      </form>

      {/* Back */}
      <button onClick={() => navigate('landing')}
        className="absolute top-4 left-4 w-10 h-10 rounded-full bg-white/70 flex items-center justify-center"
        style={{ boxShadow: '0 3px 0 rgba(35,19,71,0.12)' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M15 6l-6 6 6 6" stroke="#231347" strokeWidth="2.5" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  );
}
