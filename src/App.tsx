import { useState, useEffect } from 'react';
import { GameCanvas } from './components/game/GameCanvas';
import { GameUI } from './components/game/GameUI';
import { SplashScreen } from './components/ui/SplashScreen';
import { PopularDashboard } from './components/dashboard/PopularDashboard';
import './index.css';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<'game' | 'dashboard'>(() => {
    if (typeof window === 'undefined') return 'game';
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    const search = window.location.search.toLowerCase();
    return (
      path.startsWith('/dashboard') ||
      hash.startsWith('#/dashboard') ||
      search.includes('view=dashboard')
    )
      ? 'dashboard'
      : 'game';
  });

  useEffect(() => {
    const handleNavigation = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      const search = window.location.search.toLowerCase();
      const isDash =
        path.startsWith('/dashboard') ||
        hash.startsWith('#/dashboard') ||
        search.includes('view=dashboard');
      setCurrentRoute(isDash ? 'dashboard' : 'game');
    };

    window.addEventListener('popstate', handleNavigation);
    window.addEventListener('hashchange', handleNavigation);
    return () => {
      window.removeEventListener('popstate', handleNavigation);
      window.removeEventListener('hashchange', handleNavigation);
    };
  }, []);

  const navigateTo = (route: 'game' | 'dashboard') => {
    if (route === 'dashboard') {
      window.history.pushState({}, '', '/dashboard');
    } else {
      window.history.pushState({}, '', '/');
    }
    setCurrentRoute(route);
  };

  if (currentRoute === 'dashboard') {
    return <PopularDashboard onBackToGame={() => navigateTo('game')} />;
  }

  return (
    <div className="app">
      <GameCanvas />
      <GameUI />
      <SplashScreen />
    </div>
  );
}

