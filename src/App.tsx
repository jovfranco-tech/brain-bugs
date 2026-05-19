import React from 'react';
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

function AppRouter() {
  const { screen } = useApp();

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
          key={screen}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="absolute inset-0 w-full h-full"
        >
          {renderScreen()}
        </motion.div>
      </AnimatePresence>
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

