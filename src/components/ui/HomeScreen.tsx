import { useState, useEffect } from 'react';
import { setGameState } from '../../game/state';
import { resetRunSession } from '../../game/engine';
import { requestFullscreen } from '../../utils/fullscreen';
import { PlayButtonHex } from './PlayButtonHex';
import { LivesLeftDisplay } from './LivesLeftDisplay';
import { SecondaryHexButton } from './SecondaryHexButton';
import { LeaderboardPage } from './LeaderboardModal';
import { RewardsPage } from './RewardsModal';
import { CustomerRegistrationModal } from './CustomerRegistrationModal';
import { popularApi } from '../../services/popularApi';
import type { CustomerProfile } from '../../types/customer';

export function HomeScreen() {
  const [activePage, setActivePage] = useState<'home' | 'leaderboard' | 'rewards'>('home');
  const [activeModal, setActiveModal] = useState<'qr' | null>(null);
  const [customer, setCustomer] = useState<CustomerProfile | null>(() =>
    popularApi.getCustomerProfile(),
  );
  const [showRegModal, setShowRegModal] = useState<boolean>(() => !popularApi.isCustomerRegistered());
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);

  // Player Stats for 3D Top-Left Badge (Global Rank, Best Score, Total Score)
  const [playerStats, setPlayerStats] = useState(() => {
    const cust = popularApi.getCustomerProfile();
    const best = cust?.bestScore || 0;
    let total = best;
    try {
      const runsRaw = localStorage.getItem('popular_local_runs');
      if (runsRaw) {
        const runs = JSON.parse(runsRaw);
        if (Array.isArray(runs) && runs.length > 0) {
          total = runs.reduce(
            (sum: number, r: { score?: number }) => sum + (Number(r.score) || 0),
            0,
          );
        }
      }
    } catch {
      /* ignore */
    }
    return {
      globalRank: 1,
      bestScore: best,
      totalScore: total,
    };
  });

  useEffect(() => {
    let isMounted = true;
    async function loadStats() {
      try {
        const globalBoard = await popularApi.getGlobalLeaderboard();
        const cust = popularApi.getCustomerProfile();
        const best = cust?.bestScore || 0;
        let rank = 1;
        const currentEntry = globalBoard.find((e) => e.isCurrentUser);
        if (currentEntry) {
          rank = currentEntry.rank;
        } else if (best > 0) {
          const higherScores = globalBoard.filter((e) => e.score > best).length;
          rank = higherScores + 1;
        } else {
          rank = globalBoard.length > 0 ? globalBoard.length : 1;
        }

        let total = best;
        try {
          const runsRaw = localStorage.getItem('popular_local_runs');
          if (runsRaw) {
            const runs = JSON.parse(runsRaw);
            if (Array.isArray(runs) && runs.length > 0) {
              total = runs.reduce(
                (sum: number, r: { score?: number }) => sum + (Number(r.score) || 0),
                0,
              );
            }
          }
        } catch {
          /* ignore */
        }

        if (isMounted) {
          setPlayerStats({
            globalRank: rank,
            bestScore: best,
            totalScore: total,
          });
        }
      } catch {
        /* fallback */
      }
    }
    loadStats();
    return () => {
      isMounted = false;
    };
  }, [customer]);

  const handlePlayGame = () => {
    // Enforce mandatory registration before first run
    if (!popularApi.isCustomerRegistered()) {
      setShowRegModal(true);
      return;
    }
    requestFullscreen();
    resetRunSession();
    setGameState({ status: 'menu' });
  };

  const handleCustomerRegistered = (profile: CustomerProfile) => {
    setCustomer(profile);
    setShowRegModal(false);
    setIsEditingProfile(false);
    // User transitions directly to the Home screen (does not auto-start game)
  };

  // const playerLevel = Math.max(1, Math.min(99, Math.floor((playerStats.bestScore || 0) / 300) + 1));
  // const levelDisplay = `LEVEL ${playerLevel.toString().padStart(2, '0')}`;

  // If viewing Leaderboard or Rewards as a separate page
  if (activePage === 'leaderboard') {
    return <LeaderboardPage onBack={() => setActivePage('home')} />;
  }

  if (activePage === 'rewards') {
    return <RewardsPage onBack={() => setActivePage('home')} />;
  }

  return (
    <div className="home-page">
      {/* Ambient background atmosphere */}
      <div className="home-ambient-glow" />

      {/* Top Bar: 3D Sparky Player Profile Badge (Top-Left) */}
      <header className="home-top-bar">
        {/* Top-Left: 3D Sparky Player Badge */}
        <div
          className="home-player-badge"
          onClick={() => (customer ? setIsEditingProfile(true) : setShowRegModal(true))}
          role="button"
          tabIndex={0}
          title={customer ? 'Click to Edit Customer Profile' : 'Click to Register Profile'}
        >
          {/* Circular Avatar Ring with Sparky Head */}
          <div className="home-player-avatar-ring">
            <img
              src="/image.png"
              alt="Sparky Head"
              className="home-player-avatar-img"
              draggable={false}
            />
          </div>

          {/* Connected Status Chassis */}
          <div className="home-player-chassis">
            <div className="home-player-name-row">
              <span className="home-player-name">
                {customer?.name ? customer.name.toUpperCase() : 'SPARKY RUNNER'}
              </span>
              <span className="home-player-edit-icon">✏️</span>
            </div>

            {/* Level Pill matching reference */}
            
          </div>
        </div>
      </header>

      {/* Center Hero Section with Logo, Play Button, Stats, and Secondary Actions */}
      <main className="home-hero">
        {/* PET Popular Electricals Logo placed above Sparky Run logo */}
        <div className="home-top-brand">
          <img
            src="/pet_logo_red.png"
            alt="PET Popular Electricals & Trading Co. W.L.L"
            className="home-top-pet-logo"
            width={329}
            height={263}
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/bannerimages/image.png';
            }}
          />
        </div>

        <h1 className="home-logo-heading">
          <img
            src="/sparky_run.webp"
            alt="Sparky Run"
            className="home-logo-img"
            width={1378}
            height={835}
            draggable={false}
          />
        </h1>

        <PlayButtonHex onClick={handlePlayGame} />

        {/* Lives Left UI (2 of 3 lives for now) */}
        <LivesLeftDisplay livesLeft={2} maxLives={3} />

        {/* 3D Stats Row between Play button and Secondary buttons */}
        <div className="home-hero-stats-row">
          <div className="home-hero-stat-card" title="Global Leaderboard Rank">
            <span className="hero-stat-label">RANK</span>
            <span className="hero-stat-val">#{playerStats.globalRank}</span>
          </div>

          <div className="home-hero-stat-card" title="Personal Best Score">
            <span className="hero-stat-label">BEST</span>
            <span className="hero-stat-val">{playerStats.bestScore.toLocaleString()}</span>
          </div>

          <div className="home-hero-stat-card" title="Lifetime Cumulative Score">
            <span className="hero-stat-label">TOTAL</span>
            <span className="hero-stat-val">{playerStats.totalScore.toLocaleString()}</span>
          </div>
        </div>

        {/* Secondary Action Buttons: Leaderboard (Left) and Rewards (Right) */}
        <div className="home-secondary-row">
          <SecondaryHexButton
            variant="leaderboard"
            onClick={() => setActivePage('leaderboard')}
          />
          <SecondaryHexButton
            variant="rewards"
            onClick={() => setActivePage('rewards')}
          />
        </div>
      </main>

      {/* Mandatory Onboarding / Edit Profile Modal */}
      {(showRegModal || isEditingProfile) && (
        <CustomerRegistrationModal
          onRegistered={handleCustomerRegistered}
          initialProfile={customer}
          canClose={isEditingProfile}
          onClose={() => setIsEditingProfile(false)}
        />
      )}

      {/* In-Store QR Code Modal for sharing / counter scan */}
      {activeModal === 'qr' && (
        <div className="home-modal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="home-modal-card qr-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="home-modal-header">
              <div className="home-modal-title-row">
                <span className="home-modal-icon">📱</span>
                <div>
                  <h2 className="home-modal-title">IN-STORE QR CODE</h2>
                  <div className="home-modal-brand-tag">POPULAR ELECTRICALS • QATAR</div>
                </div>
              </div>
              <button
                type="button"
                className="home-modal-close-btn"
                onClick={() => setActiveModal(null)}
              >
                ✕
              </button>
            </div>

            <div className="qr-modal-body">
              <div className="qr-image-frame">
                <img
                  src="/qr-code.svg"
                  alt="Popular Sparky QR Code"
                  className="qr-display-img"
                  width={240}
                  height={240}
                />
              </div>
              <h3 className="qr-scan-title">Scan to Play & Win Store Prizes</h3>
              <p className="qr-scan-desc">
                Invite friends or customers in Popular Electricals Qatar showrooms to scan, run, and redeem in-store rewards!
              </p>
              <div className="qr-url-badge">popular-sparky.vercel.app</div>
            </div>

            <div className="home-modal-footer">
              <button
                type="button"
                className="home-modal-action-btn"
                onClick={() => setActiveModal(null)}
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
