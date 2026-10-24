import { useState } from 'react';
import { DashboardHome } from './DashboardHome';
import { DashboardPlayers } from './DashboardPlayers';
import { DashboardRewards } from './DashboardRewards';
import {
  IconHome,
  IconUsers,
  IconGift,
  IconGamepad,
  IconMenu,
} from './DashboardIcons';
import './dashboard.css';

interface PopularDashboardProps {
  onBackToGame: () => void;
}

export function PopularDashboard({ onBackToGame }: PopularDashboardProps) {
  const [activeTab, setActiveTab] = useState<'home' | 'players' | 'rewards'>('home');
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="pet-dash-container">
      {/* 1. SIDEBAR */}
      <aside className={`pet-sidebar ${isMobileOpen ? 'mobile-open' : ''}`}>
        <div className="pet-sidebar-header">
          <div className="pet-sidebar-brand">
            <img
              src="/pet_logo_red.png"
              alt="Popular Electricals"
              className="pet-brand-logo-img"
            />
            <div className="pet-brand-info">
              <span className="pet-brand-title">Popular Electricals</span>
              <span className="pet-brand-sub">Sparky Run</span>
            </div>
          </div>
        </div>

        <nav className="pet-sidebar-nav">
          <button
            type="button"
            className={`pet-nav-item ${activeTab === 'home' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('home');
              setIsMobileOpen(false);
            }}
          >
            <span className="pet-nav-icon">
              <IconHome />
            </span>
            <span>Home</span>
          </button>

          <button
            type="button"
            className={`pet-nav-item ${activeTab === 'players' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('players');
              setIsMobileOpen(false);
            }}
          >
            <span className="pet-nav-icon">
              <IconUsers />
            </span>
            <span>Players</span>
          </button>

          <button
            type="button"
            className={`pet-nav-item ${activeTab === 'rewards' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('rewards');
              setIsMobileOpen(false);
            }}
          >
            <span className="pet-nav-icon">
              <IconGift />
            </span>
            <span>Rewards</span>
          </button>
        </nav>
      </aside>

      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.3)',
            zIndex: 90,
          }}
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* 2. MAIN VIEWPORT */}
      <div className="pet-main-wrapper">
        <header className="pet-topbar">
          <div className="pet-topbar-left">
            <button
              type="button"
              className="pet-mobile-menu-btn"
              onClick={() => setIsMobileOpen(true)}
              aria-label="Toggle Menu"
            >
              <IconMenu />
            </button>
            <h1 className="pet-topbar-title">
              {activeTab === 'home' && 'Home'}
              {activeTab === 'players' && 'Players'}
              {activeTab === 'rewards' && 'Rewards'}
            </h1>
          </div>

          <div className="pet-topbar-right">
            <button
              type="button"
              className="pet-btn-launch-game"
              onClick={onBackToGame}
            >
              <IconGamepad />
              <span>Play Game</span>
            </button>
          </div>
        </header>

        <main className="pet-content">
          {activeTab === 'home' && (
            <DashboardHome onNavigateTab={(tab) => setActiveTab(tab)} />
          )}
          {activeTab === 'players' && <DashboardPlayers />}
          {activeTab === 'rewards' && <DashboardRewards />}
        </main>
      </div>
    </div>
  );
}
