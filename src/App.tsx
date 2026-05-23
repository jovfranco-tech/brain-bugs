import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppProvider, useApp } from './contexts/AppContext';
import Landing from './screens/Landing';
import AuthScreen from './screens/AuthScreen';
import ChildSelector from './screens/ChildSelector';
import HomeScreen from './screens/HomeScreen';
import WorldMap from './screens/WorldMap';
import Gameplay from './screens/Gameplay';
import { VictoryScreen, RewardsScreen, ParentDashboard, SettingsScreen } from './screens/OtherScreens';
import BugLab from './screens/BugLab';
import AccessoryStore from './screens/AccessoryStore';
import ScreenTimeBlockerOverlay from './components/ScreenTimeBlockerOverlay';
import { sound } from './lib/sound';

function AppRouter() {
  const { screen, screenParams, isScreenTimeLocked, currentChild } = useApp();

  // Handle browser audio context unlock upon first user interaction
  useEffect(() => {
    const handleInteraction = () => {
      if (currentChild && sound.getMusicEnabled()) {
        sound.startMusic();
      }
    };
    window.addEventListener('click', handleInteraction, { once: true });
    window.addEventListener('pointerdown', handleInteraction, { once: true });
    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('pointerdown', handleInteraction);
    };
  }, [currentChild]);

  const renderScreen = () => {
    switch (screen) {
      case 'landing':          return <Landing />;
      case 'login':            return <AuthScreen mode="login" />;
      case 'signup':           return <AuthScreen mode="signup" />;
      case 'child-select':
      case 'child-create':     return <ChildSelector />;
      case 'home':             return <HomeScreen />;
      case 'world-map':
      case 'level-select':     return <WorldMap />;
      case 'gameplay':         return <Gameplay />;
      case 'victory':          return <VictoryScreen />;
      case 'rewards':          return <RewardsScreen />;
      case 'parent-dashboard': return <ParentDashboard />;
      case 'settings':         return <SettingsScreen />;
      case 'bug-lab':          return <BugLab />;
      case 'accessory-store':  return <AccessoryStore />;
      default:                 return <Landing />;
    }
  };

  return (
    <div className="w-screen h-screen min-h-screen flex items-center justify-center bg-[#090514] overflow-hidden select-none print:bg-transparent print:h-auto print:min-h-0 print:overflow-visible">
      {/* Background ambient glow behind the smartphone wrapper on desktop */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(88,38,187,0.12)_0%,transparent_70%)] pointer-events-none md:block hidden" />
      
      {/* Decorative desktop elements to make it look super premium */}
      <div className="absolute top-10 left-10 md:flex hidden flex-col gap-2 pointer-events-none">
        <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">BRAIN BUGS</h1>
        <p className="text-xs text-purple-300/40 font-mono">PORTFOLIO DEMO EDITION</p>
      </div>

      <div className="absolute bottom-10 right-10 md:flex hidden flex-col items-end gap-1 pointer-events-none text-right">
        <p className="text-xs text-purple-300/30">AI-Native Metacognitive Gamification</p>
        <p className="text-[10px] text-purple-300/20">Designed for ages 5-9 · Diagnostic Coach</p>
      </div>

      {/* The main phone frame container */}
      <div className="
        w-full h-full 
        md:w-[430px] md:h-[85vh] md:max-h-[900px] md:min-h-[700px]
        md:rounded-[48px] md:border-[12px] md:border-[#1a0f35] md:shadow-[0_24px_80px_rgba(0,0,0,0.85),inset_0_4px_12px_rgba(255,255,255,0.05)]
        md:ring-1 md:ring-purple-500/20
        flex flex-col relative overflow-hidden bg-black
        transition-all duration-300 ease-out
        print:w-full print:h-auto print:max-h-none print:min-h-0 print:rounded-none print:border-none print:shadow-none print:ring-0 print:relative
      ">
        {/* Notch / Dynamic Island placeholder for realistic phone look on desktop */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-2xl z-[9999] md:flex hidden items-center justify-center">
          <div className="w-12 h-1 bg-[#1a0f35] rounded-full absolute top-[6px]" />
          <div className="w-3.5 h-3.5 bg-[#0a0518] rounded-full border border-purple-950/40 absolute right-6 flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-blue-900/60 rounded-full" />
          </div>
        </div>

        {/* Screen Content Wrapper */}
        <div className="w-full h-full relative overflow-hidden flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${screen}_${JSON.stringify(screenParams)}`}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.22, ease: [0.34, 1.56, 0.64, 1] }}
              className="absolute inset-0 w-full h-full flex flex-col"
            >
              {renderScreen()}
            </motion.div>
          </AnimatePresence>
          {isScreenTimeLocked && <ScreenTimeBlockerOverlay />}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppRouter />
    </AppProvider>
  );
}


