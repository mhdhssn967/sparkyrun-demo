import { useEffect, useState } from 'react';
import type { LeaderboardEntry } from '../../types/customer';
import { popularApi, getQatarWeeklyCycle } from '../../services/popularApi';

interface LeaderboardPageProps {
  onBack?: () => void;
  onClose?: () => void;
}

// -------------------------------------------------------------
// Sleek Vector Icons matching the reference UI
// -------------------------------------------------------------
function ArrowLeftSvg({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M19 12H5m7 7l-7-7 7-7"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}


function CrownSvg({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M5 24h22l-2.5-12-5.5 5.5L16 6l-3 11.5L7.5 12 5 24z"
        fill="url(#crownGoldGrad)"
        stroke="#ffd600"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <circle cx="16" cy="5.5" r="2.2" fill="#ffe600" />
      <circle cx="7.5" cy="11.5" r="1.8" fill="#ffe600" />
      <circle cx="24.5" cy="11.5" r="1.8" fill="#ffe600" />
      <defs>
        <linearGradient id="crownGoldGrad" x1="5" y1="6" x2="27" y2="24" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffea75" />
          <stop offset="0.5" stopColor="#ffc107" />
          <stop offset="1" stopColor="#ff9800" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function CoinSvg({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="8" cy="8" r="7.5" fill="url(#coinGoldRef)" stroke="#ffd600" strokeWidth="0.8" />
      <circle cx="8" cy="8" r="5.5" fill="url(#coinInnerGoldRef)" />
      <path
        d="M8 4.5v7m-1.8-5.4c.3-.4 1-.6 1.8-.6 1.1 0 1.8.6 1.8 1.4 0 1.8-3.6 1.1-3.6 2.9 0 .8.6 1.4 1.8 1.4.8 0 1.4-.2 1.8-.6"
        stroke="#4a1500"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <defs>
        <linearGradient id="coinGoldRef" x1="1" y1="1" x2="15" y2="15" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffe600" />
          <stop offset="1" stopColor="#ff9800" />
        </linearGradient>
        <linearGradient id="coinInnerGoldRef" x1="3" y1="3" x2="13" y2="13" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fff176" />
          <stop offset="1" stopColor="#ffa000" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function getInitial(name: string): string {
  if (!name) return 'S';
  const clean = name.trim();
  return clean.charAt(0).toUpperCase() || 'S';
}

export function LeaderboardPage({ onBack, onClose }: LeaderboardPageProps) {
  const handleBack = onBack || onClose || (() => {});
  const [activeTab, setActiveTab] = useState<'weekly' | 'all_time'>('weekly');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [weeklyTimeLeft, setWeeklyTimeLeft] = useState<string>(() => getQatarWeeklyCycle().formattedTimeLeft);

  useEffect(() => {
    const updateCountdown = () => {
      setWeeklyTimeLeft(getQatarWeeklyCycle().formattedTimeLeft);
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    const fetchBoard = async () => {
      try {
        const data =
          activeTab === 'weekly'
            ? await popularApi.getWeeklyLeaderboard('popular-electricals-qatar')
            : await popularApi.getAllTimeLeaderboard('popular-electricals-qatar');

        if (isMounted) {
          setEntries(data);
          setIsLoading(false);
        }
      } catch {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchBoard();

    return () => {
      isMounted = false;
    };
  }, [activeTab]);

  // Top 3 Podium participants
  const top1 = entries[0];
  const top2 = entries[1];
  const top3 = entries[2];

  return (
    <div className="smooth-lb-viewport">
      {/* Subtle top ambient red glow */}
      <div className="smooth-lb-ambient-glow" />

      {/* Main Container */}
      <div className="smooth-lb-container">
        {/* Top Header Bar */}
        <header className="smooth-lb-header">
          <button
            type="button"
            className="smooth-lb-circle-btn"
            onClick={handleBack}
            aria-label="Go Back"
          >
            <ArrowLeftSvg className="smooth-lb-icon" />
          </button>

          <h1 className="smooth-lb-title">Leaderboard</h1>

          <div style={{ width: 40 }} />
        </header>

        {/* Capsule Segmented Tab Switcher (Weekly | All Time) */}
        <div className="smooth-lb-tabs-capsule">
          <button
            type="button"
            className={`smooth-lb-tab-pill ${activeTab === 'weekly' ? 'active' : ''}`}
            onClick={() => setActiveTab('weekly')}
          >
            Weekly
          </button>

          <button
            type="button"
            className={`smooth-lb-tab-pill ${activeTab === 'all_time' ? 'active' : ''}`}
            onClick={() => setActiveTab('all_time')}
          >
            All time
          </button>
        </div>

        {/* Weekly Countdown & Prize Banner (Only on Weekly tab) */}
        {activeTab === 'weekly' && (
          <div className="smooth-lb-weekly-banner">
            <div className="smooth-lb-weekly-header">
              <div className="smooth-lb-weekly-badge">
                <span className="smooth-lb-pulsing-dot" />
                <span>WEEKLY CHAMPION RACE</span>
              </div>
              <div className="smooth-lb-timer-pill" title="Resets Sunday at 12:00 AM Qatar Time (AST)">
                <span className="smooth-lb-timer-icon">⏱️</span>
                <span className="smooth-lb-timer-val">{weeklyTimeLeft} left</span>
              </div>
            </div>
            <div className="smooth-lb-weekly-reward">
              <span className="smooth-lb-gift-icon">🎁</span>
              <div className="smooth-lb-reward-text">
                <span className="smooth-lb-reward-label">Weekly #1 Grand Prize:</span>
                <span className="smooth-lb-reward-title">PET Gift Bag with T-Shirt, Watch and Book Case</span>
              </div>
            </div>
          </div>
        )}

        {/* Content Area */}
        {isLoading ? (
          <div className="smooth-lb-loading">
            <span className="smooth-lb-spinner">⚡</span>
            <span>Loading rankings...</span>
          </div>
        ) : entries.length === 0 ? (
          <div className="smooth-lb-empty">
            <span>No scores recorded yet. Be the first to run!</span>
          </div>
        ) : (
          <>
            {/* Top 3 Floating Circles Podium with Crown */}
            <div className="smooth-lb-podium">
              {/* Rank 2 (Left) */}
              <div className="smooth-podium-slot rank-2">
                <div className="smooth-avatar-wrapper">
                  <div className="smooth-avatar-circle circle-2">
                    <span className="smooth-avatar-initial">
                      {top2 ? getInitial(top2.displayName) : '2'}
                    </span>
                  </div>
                  <div className="smooth-rank-badge badge-2">2</div>
                </div>
                <div className="smooth-player-name" title={top2?.displayName || 'Empty'}>
                  {top2 ? (top2.isCurrentUser ? `${top2.displayName}(You)` : top2.displayName) : '---'}
                </div>
                {top2?.companyName && (
                  <div className="smooth-podium-company" title={top2.companyName}>
                    {top2.companyName}
                  </div>
                )}
                <div className="smooth-player-points">
                  <CoinSvg className="smooth-coin-icon" />
                  <span>{top2 ? `${top2.coins.toLocaleString()} points` : '0 points'}</span>
                </div>
              </div>

              {/* Rank 1 (Center - Largest with Crown) */}
              <div className="smooth-podium-slot rank-1">
                <div className="smooth-crown-wrap">
                  <CrownSvg className="smooth-crown-svg" />
                </div>
                <div className="smooth-avatar-wrapper">
                  <div className="smooth-avatar-circle circle-1">
                    <span className="smooth-avatar-initial initial-1">
                      {top1 ? getInitial(top1.displayName) : '1'}
                    </span>
                  </div>
                  <div className="smooth-rank-badge badge-1">1</div>
                </div>
                <div className="smooth-player-name name-1" title={top1?.displayName || 'Empty'}>
                  {top1 ? (top1.isCurrentUser ? `${top1.displayName}(You)` : top1.displayName) : '---'}
                </div>
                {top1?.companyName && (
                  <div className="smooth-podium-company" title={top1.companyName}>
                    {top1.companyName}
                  </div>
                )}
                <div className="smooth-player-points">
                  <CoinSvg className="smooth-coin-icon" />
                  <span>{top1 ? `${top1.coins.toLocaleString()} points` : '0 points'}</span>
                </div>
              </div>

              {/* Rank 3 (Right) */}
              <div className="smooth-podium-slot rank-3">
                <div className="smooth-avatar-wrapper">
                  <div className="smooth-avatar-circle circle-3">
                    <span className="smooth-avatar-initial">
                      {top3 ? getInitial(top3.displayName) : '3'}
                    </span>
                  </div>
                  <div className="smooth-rank-badge badge-3">3</div>
                </div>
                <div className="smooth-player-name" title={top3?.displayName || 'Empty'}>
                  {top3 ? (top3.isCurrentUser ? `${top3.displayName}(You)` : top3.displayName) : '---'}
                </div>
                {top3?.companyName && (
                  <div className="smooth-podium-company" title={top3.companyName}>
                    {top3.companyName}
                  </div>
                )}
                <div className="smooth-player-points">
                  <CoinSvg className="smooth-coin-icon" />
                  <span>{top3 ? `${top3.coins.toLocaleString()} points` : '0 points'}</span>
                </div>
              </div>
            </div>

            {/* Column Header Strip */}
            <div className="smooth-lb-table-head">
              <span className="th-rank">Rank</span>
              <span className="th-player">Player</span>
              <span className="th-points">{activeTab === 'all_time' ? 'Total / Best' : 'Points'}</span>
            </div>

            {/* List of cards (including top 3 on stands as well as in the list) */}
            <div className="smooth-lb-list">
              {entries.map((entry) => {
                const rankClass = entry.rank === 1 ? 'rank-top-1' : entry.rank === 2 ? 'rank-top-2' : entry.rank === 3 ? 'rank-top-3' : '';
                return (
                  <div
                    key={`${entry.customerId}-${entry.rank}`}
                    className={`smooth-lb-card ${rankClass} ${entry.isCurrentUser ? 'current-user-card' : ''}`}
                  >
                    <span className="smooth-card-rank">#{entry.rank}</span>

                    <div className="smooth-card-avatar-initial">
                      {getInitial(entry.displayName)}
                    </div>

                    <div className="smooth-card-player-info" style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
                      <div className="smooth-card-player-name">
                        {entry.isCurrentUser ? `${entry.displayName} (You)` : entry.displayName}
                      </div>
                      {entry.companyName && (
                        <div className="smooth-card-company" title={entry.companyName}>
                          🏢 {entry.companyName}
                        </div>
                      )}
                      {activeTab === 'all_time' && typeof entry.gamesPlayed === 'number' && (
                        <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px' }}>
                          {entry.gamesPlayed} {entry.gamesPlayed === 1 ? 'game' : 'games'} played • Best: {entry.bestScore?.toLocaleString() ?? entry.coins.toLocaleString()}
                        </div>
                      )}
                    </div>

                    <span className="smooth-card-points">
                      {entry.coins.toLocaleString()} <span style={{ fontSize: '11px', fontWeight: 600, color: '#6B7280' }}>pts</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Footer Back Action */}
        <div className="smooth-lb-footer">
          <button type="button" className="smooth-lb-back-cta" onClick={handleBack}>
            ← BACK TO HOME
          </button>
        </div>
      </div>
    </div>
  );
}

// Keep LeaderboardModal export as an alias for backward compatibility
export const LeaderboardModal = LeaderboardPage;
