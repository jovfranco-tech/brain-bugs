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
    <div className="w-full h-full relative overflow-hidden bg-black">
      <AnimatePresence mode="wait">
        <motion.div
          key={`${screen}_${JSON.stringify(screenParams)}`}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.22, ease: [0.34, 1.56, 0.64, 1] }}
          className="absolute inset-0 w-full h-full"
        >
          {renderScreen()}
        </motion.div>
      </AnimatePresence>
      {isScreenTimeLocked && <ScreenTimeBlockerOverlay />}
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


