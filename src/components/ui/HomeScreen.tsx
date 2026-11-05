import { useState, useEffect } from 'react';
import { setGameState } from '../../game/state';
import { resetRunSession } from '../../game/engine';
import { requestFullscreen } from '../../utils/fullscreen';
import { PlayButtonHex } from './PlayButtonHex';
import { SecondaryHexButton } from './SecondaryHexButton';
import { LeaderboardPage } from './LeaderboardModal';
import { CustomerRegistrationModal } from './CustomerRegistrationModal';
import { popularApi } from '../../services/popularApi';
import type { CustomerProfile } from '../../types/customer';

export function HomeScreen() {
  const [activePage, setActivePage] = useState<'home' | 'leaderboard'>('home');
  const [customer, setCustomer] = useState<CustomerProfile | null>(() =>
    popularApi.getCustomerProfile(),
  );
  const [showRegModal, setShowRegModal] = useState<boolean>(() => !popularApi.isCustomerRegistered());

  // Player Stats for Top-Left Badge & Hero Stats (Rank, Best, Total)
  const [playerStats, setPlayerStats] = useState<{
    globalRank: number | null;
    bestScore: number;
    totalScore: number;
  }>(() => {
    const cust = popularApi.getCustomerProfile();
    const best = cust?.bestScore || 0;
    let total = cust?.totalScore || best;
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
      globalRank: (best > 0 || total > 0) ? 1 : null,
      bestScore: best,
      totalScore: total,
    };
  });

  useEffect(() => {
    let isMounted = true;
    async function loadStats() {
      try {
        const cust = popularApi.getCustomerProfile();
        const brandStats = await popularApi.getPlayerBrandStats(
          cust?.id || cust?.phone,
          'popular-electricals-qatar',
        );

        const globalBoard = await popularApi.getAllTimeLeaderboard('popular-electricals-qatar');
        const best = brandStats.highestScore;
        const total = brandStats.totalPoints;
        const gamesPlayed = brandStats.gamesPlayed ?? 0;

        let rank: number | null = null;
        if (gamesPlayed > 0 || total > 0 || best > 0) {
          const currentEntry = globalBoard.find((e) => e.isCurrentUser);
          if (currentEntry) {
            rank = currentEntry.rank;
          } else if (total > 0) {
            const higherScores = globalBoard.filter((e) => (e.totalScore ?? e.coins) > total).length;
            rank = higherScores + 1;
          } else if (best > 0) {
            const higherScores = globalBoard.filter((e) => e.coins > best).length;
            rank = higherScores + 1;
          } else {
            rank = globalBoard.length > 0 ? globalBoard.length + 1 : 1;
          }
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
  }, [customer, activePage]);

  const handlePlayGame = () => {
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
    popularApi.getPlayerBrandStats(profile.id || profile.phone, 'popular-electricals-qatar').then((stats) => {
      setPlayerStats((prev) => ({
        ...prev,
        bestScore: stats.highestScore,
        totalScore: stats.totalPoints,
      }));
    });
  };

  if (activePage === 'leaderboard') {
    return <LeaderboardPage onBack={() => setActivePage('home')} />;
  }

  return (
    <div className="home-page">
      {/* Ambient background atmosphere */}
      <div className="home-ambient-glow" />

      {/* Top Bar: Sparky Player Profile Badge (Top-Left) */}
      <header className="home-top-bar">
        <div
          className="home-player-badge"
          onClick={() => setShowRegModal(true)}
          role="button"
          tabIndex={0}
          title={customer ? `Registered Runner: ${customer.name} (Click to switch)` : 'Click to Register Profile'}
        >
          <div className="home-player-avatar-ring">
            <img
              src="/image.png"
              alt="Sparky Head"
              className="home-player-avatar-img"
              draggable={false}
            />
          </div>

          <div className="home-player-chassis">
            <div className="home-player-name-row">
              <span className="home-player-name">
                {customer?.name ? customer.name.toUpperCase() : 'SPARKY RUNNER'}
              </span>
            </div>
            {customer?.phone && (
              <span className="home-player-company">
                📱 {customer.countryCode ? `${customer.countryCode} ` : ''}{customer.phone}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Center Hero Section */}
      <main className="home-hero">
        <div className="home-top-brand">
          <img
            src="/pet_logo_white.png"
            alt="PET Popular Electricals & Trading Co. W.L.L"
            className="home-top-pet-logo"
            width={329}
            height={263}
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/image.png';
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

        {/* Stats Row: Rank, Best, Total */}
        <div className="home-hero-stats-row">
          <div className="home-hero-stat-card" title="Leaderboard Rank">
            <span className="hero-stat-label">RANK</span>
            <span className="hero-stat-val">
              {playerStats.globalRank !== null ? `#${playerStats.globalRank}` : '—'}
            </span>
          </div>

          <div className="home-hero-stat-card" title="Personal Best Score">
            <span className="hero-stat-label">BEST</span>
            <span className="hero-stat-val">{playerStats.bestScore.toLocaleString()}</span>
          </div>

          <div className="home-hero-stat-card" title="Total Lifetime Score">
            <span className="hero-stat-label">TOTAL</span>
            <span className="hero-stat-val">{playerStats.totalScore.toLocaleString()}</span>
          </div>
        </div>

        {/* Play Button - Always clickable! */}
        <PlayButtonHex onClick={handlePlayGame} disabled={false} />

        {/* Secondary Action: Leaderboard */}
        <div className="home-secondary-row" style={{ justifyContent: 'center' }}>
          <SecondaryHexButton
            variant="leaderboard"
            onClick={() => setActivePage('leaderboard')}
          />
        </div>
      </main>

      {/* Registration Modal */}
      {showRegModal && (
        <CustomerRegistrationModal
          onRegistered={handleCustomerRegistered}
          initialProfile={customer}
          canClose={Boolean(customer)}
          onClose={() => setShowRegModal(false)}
        />
      )}
    </div>
  );
}
