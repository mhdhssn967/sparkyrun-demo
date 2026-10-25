import { useState, useEffect } from 'react';
import { setGameState, runtime } from '../../game/state';
import { resetRunSession } from '../../game/engine';
import { requestFullscreen } from '../../utils/fullscreen';
import { PlayButtonHex } from './PlayButtonHex';
import { LivesLeftDisplay } from './LivesLeftDisplay';
import { SecondaryHexButton } from './SecondaryHexButton';
import { LeaderboardPage } from './LeaderboardModal';
import { RewardsPage } from './RewardsModal';
import { CustomerRegistrationModal } from './CustomerRegistrationModal';
import { QrScannerModal } from './QrScannerModal';
import { VoucherDetailsModal } from './VoucherDetailsModal';
import { popularApi } from '../../services/popularApi';
import type { CustomerProfile, ClaimedVoucher } from '../../types/customer';

export function HomeScreen() {
  const [activePage, setActivePage] = useState<'home' | 'leaderboard' | 'rewards'>('home');
  const [activeModal, setActiveModal] = useState<'qr' | null>(null);
  const [showScannerModal, setShowScannerModal] = useState<boolean>(false);
  const [customer, setCustomer] = useState<CustomerProfile | null>(() =>
    popularApi.getCustomerProfile(),
  );
  const [showRegModal, setShowRegModal] = useState<boolean>(() => !popularApi.isCustomerRegistered());

  // Active Pending Vouchers for floating reward button
  const [activeVouchers, setActiveVouchers] = useState<ClaimedVoucher[]>([]);
  const [activeVoucherModal, setActiveVoucherModal] = useState<ClaimedVoucher | null>(null);

  // QR Token & Database Lives State
  const [activeToken, setActiveToken] = useState<string | null>(() => {
    return popularApi.extractTokenFromUrl() || popularApi.getActiveToken();
  });
  const [tokenVerification, setTokenVerification] = useState<{
    valid: boolean;
    livesRemaining: number;
    message?: string;
  }>({ valid: false, livesRemaining: 0 });
  const [tokenLives, setTokenLives] = useState<number>(0);

  // Sync lives and verification for active token on mount & whenever activeToken changes
  useEffect(() => {
    let isMounted = true;
    popularApi.verifyToken(activeToken).then((res) => {
      if (isMounted) {
        setTokenVerification(res);
        setTokenLives(res.livesRemaining);
      }
    });

    // Check for any active claimed reward coupons
    popularApi.getPendingVouchers('popular-electricals-qatar').then((vouchers) => {
      if (isMounted) {
        setActiveVouchers(vouchers);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [activeToken, activePage]);

  // Player Stats for 3D Top-Left Badge (Global Rank, Best Score, Total Score)
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
    const hasPlayed = (best > 0 || total > 0);
    return {
      globalRank: hasPlayed ? 1 : null,
      bestScore: best,
      totalScore: total,
    };
  });

  useEffect(() => {
    let isMounted = true;
    async function loadStats() {
      try {
        const cust = popularApi.getCustomerProfile();
        // 1. Fetch brand-scoped player stats (Highest Score, Cumulative Total Points, Games Played)
        const brandStats = await popularApi.getPlayerBrandStats(
          cust?.id || cust?.phone,
          'popular-electricals-qatar'
        );

        // 2. Fetch All-Time leaderboard to compute accurate rank
        const globalBoard = await popularApi.getAllTimeLeaderboard('popular-electricals-qatar');
        const best = brandStats.highestScore;
        const total = brandStats.totalPoints;
        const gamesPlayed = brandStats.gamesPlayed ?? 0;

        let rank: number | null = null;

        // If player has never completed a game session or has 0 score, keep rank unranked (null)
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
  }, [customer]);

  const canPlay = Boolean(activeToken && tokenVerification.valid && tokenLives > 0);

  const handlePlayGame = async () => {
    // Enforce mandatory registration before first run
    if (!popularApi.isCustomerRegistered()) {
      setShowRegModal(true);
      return;
    }

    // If no token or invalid or no lives left, open scanner directly
    if (!activeToken || !tokenVerification.valid || tokenLives <= 0) {
      setShowScannerModal(true);
      return;
    }

    // Start database-authoritative game session (decrements 1 life)
    const sessionRes = await popularApi.startGameSession(activeToken);
    if (!sessionRes.success) {
      setTokenLives(sessionRes.livesRemaining);
      setShowScannerModal(true);
      return;
    }

    // If backend authorized a LuLu gift opportunity for this lucky session, configure on track
    if (sessionRes.luluGift?.eligible) {
      const spawnD = sessionRes.luluGift.spawnDistance || 700;
      runtime.luluGifts = [
        {
          id: 77701,
          lane: 0,
          d: spawnD,
          y: 1.25,
          collected: false,
          collectAnim: 0,
          voucherToken: sessionRes.luluGift.voucherToken,
        },
      ];
    } else {
      runtime.luluGifts = [];
    }

    setTokenLives(sessionRes.livesRemaining);
    requestFullscreen();
    resetRunSession();
    // Re-apply luluGift after reset if eligible
    if (sessionRes.luluGift?.eligible) {
      runtime.luluGifts = [
        {
          id: 77701,
          lane: 0,
          d: sessionRes.luluGift.spawnDistance || 700,
          y: 1.25,
          collected: false,
          collectAnim: 0,
          voucherToken: sessionRes.luluGift.voucherToken,
        },
      ];
    }
    setGameState({ status: 'menu' });
  };



  const handleCustomerRegistered = (profile: CustomerProfile) => {
    setCustomer(profile);
    setShowRegModal(false);
    // Immediately fetch and update player brand stats for the newly logged in user
    popularApi.getPlayerBrandStats(profile.id || profile.phone, 'popular-electricals-qatar').then((stats) => {
      setPlayerStats((prev) => ({
        ...prev,
        bestScore: stats.highestScore,
        totalScore: stats.totalPoints,
      }));
    });
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
          onClick={() => (!customer ? setShowRegModal(true) : undefined)}
          role={!customer ? 'button' : undefined}
          tabIndex={!customer ? 0 : undefined}
          title={customer ? `Registered Runner: ${customer.name}` : 'Click to Register Profile'}
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
            </div>
          </div>
        </div>

        {/* Top-Right: Active QR Token / Coupon Code Display */}
        <div className="home-top-token-wrap">
          {activeToken ? (
            <div className="home-top-token-badge" title={`Active Coupon Code: ${activeToken}`}>
              <span className="home-top-token-label">COUPON</span>
              <span className="home-top-token-code">{activeToken}</span>
            </div>
          ) : (
            <div className="home-top-token-badge home-top-token-empty" title="No coupon scanned">
              <span className="home-top-token-label">COUPON</span>
              <span className="home-top-token-none">NO COUPON</span>
            </div>
          )}
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

        {/* 3D Stats Row: Rank, Best, Total above Play button, below Sparky Run logo */}
        <div className="home-hero-stats-row">
          <div className="home-hero-stat-card" title={playerStats.globalRank ? `Global Leaderboard Rank #${playerStats.globalRank}` : 'Play a game to get ranked on the leaderboard!'}>
            <span className="hero-stat-label">RANK</span>
            <span className="hero-stat-val">
              {playerStats.globalRank !== null ? `#${playerStats.globalRank}` : '—'}
            </span>
          </div>

          <div className="home-hero-stat-card" title="Personal Best Score">
            <span className="hero-stat-label">BEST</span>
            <span className="hero-stat-val">{playerStats.bestScore.toLocaleString()}</span>
          </div>

          <div className="home-hero-stat-card" title="Lifetime Cumulative Score across All Runs">
            <span className="hero-stat-label">TOTAL</span>
            <span className="hero-stat-val">{playerStats.totalScore.toLocaleString()}</span>
          </div>
        </div>

        {/* Play Button - Disabled when no valid token or 0 lives */}
        <PlayButtonHex onClick={handlePlayGame} disabled={!canPlay} />

        {/* Server-Authoritative Lives Left UI (3 lives per QR token) */}
        <LivesLeftDisplay livesLeft={tokenVerification.valid ? tokenLives : 0} maxLives={3} />

        {/* Only if 0 lives: prompt user that they have no lives left and click to scan token */}
        {(!activeToken || !tokenVerification.valid || tokenLives <= 0) && (
          <button
            type="button"
            id="home-scan-qr-cta"
            className="home-scan-qr-cta-btn pulse-highlight"
            onClick={() => setShowScannerModal(true)}
            aria-label="You have no lives left, click to scan token"
          >
            <span className="scan-qr-cta-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </span>
            <span className="scan-qr-cta-label">You have no lives left, click to scan token</span>
            <span className="scan-qr-cta-arrow">➔</span>
          </button>
        )}

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

      {/* Floating Animated Reward Button (Appears if user has any active pending vouchers) */}
      {activeVouchers.length > 0 && (
        <button
          type="button"
          className="home-floating-reward-pill floating-reward-animate"
          onClick={() => setActiveVoucherModal(activeVouchers[0])}
          title={`You have ${activeVouchers.length} pending reward voucher${activeVouchers.length > 1 ? 's' : ''}! Tap to view.`}
        >
          <span className="floating-reward-gift-icon">🎁</span>
          <div className="floating-reward-text-col">
            <span className="floating-reward-badge-tag">CLAIMED REWARD</span>
            <span className="floating-reward-title-txt">
              {activeVouchers[0].rewardTitle}
              {activeVouchers.length > 1 ? ` (+${activeVouchers.length - 1} more)` : ''}
            </span>
          </div>
          <span className="floating-reward-arrow">➔</span>
        </button>
      )}

      {/* Mandatory Onboarding Registration Modal */}
      {showRegModal && (
        <CustomerRegistrationModal
          onRegistered={handleCustomerRegistered}
          initialProfile={customer}
          canClose={false}
          onClose={() => {}}
        />
      )}

      {/* Standalone Clean Voucher Dialog (No Barcode, shows Name, Phone, Code, Score used) */}
      {activeVoucherModal && (
        <VoucherDetailsModal
          voucher={activeVoucherModal}
          allVouchers={activeVouchers}
          onSelectVoucher={(v) => setActiveVoucherModal(v)}
          onClose={() => setActiveVoucherModal(null)}
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
      {/* Live High-Tech QR Scanner Modal */}
      {showScannerModal && (
        <QrScannerModal
          onClose={() => setShowScannerModal(false)}
          onSuccess={(token, lives) => {
            setActiveToken(token);
            setTokenLives(lives);
            setTokenVerification({ valid: true, livesRemaining: lives });
          }}
        />
      )}
    </div>
  );
}
