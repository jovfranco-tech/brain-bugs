import React from 'react';
import { AppProvider, useApp } from './contexts/AppContext';
import Landing from './screens/Landing';
import AuthScreen from './screens/AuthScreen';
import ChildSelector from './screens/ChildSelector';
import HomeScreen from './screens/HomeScreen';
import WorldMap from './screens/WorldMap';
import Gameplay from './screens/Gameplay';
import { VictoryScreen, RewardsScreen, ParentDashboard, SettingsScreen } from './screens/OtherScreens';

function AppRouter() {
  const { screen } = useApp();
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
    default:                 return <Landing />;
  }
}

export default function App() {
  return (
    <AppProvider>
      <AppRouter />
    </AppProvider>
  );
}
