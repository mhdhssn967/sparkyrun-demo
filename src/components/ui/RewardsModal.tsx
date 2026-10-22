import { useEffect, useState } from 'react';
import type {
  BrandReward,
  ClaimedVoucher,
  CustomerProfile,
  WeeklyWinnersGroup,
} from '../../types/customer';
import { popularApi, POPULAR_BRAND_REWARDS } from '../../services/popularApi';
import { useGameState } from '../../game/state';

interface RewardsPageProps {
  onBack?: () => void;
  onClose?: () => void;
}

// -------------------------------------------------------------
// Sleek Vector Icons matching Leaderboard UI
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

function CalendarSvg({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#ED1C24" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 2v4M8 2v4M3 10h18" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CoinSvg({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="8" cy="8" r="7.5" fill="url(#coinGoldRefRw)" stroke="#ffd600" strokeWidth="0.8" />
      <circle cx="8" cy="8" r="5.5" fill="url(#coinInnerGoldRefRw)" />
      <path
        d="M8 4.5v7m-1.8-5.4c.3-.4 1-.6 1.8-.6 1.1 0 1.8.6 1.8 1.4 0 1.8-3.6 1.1-3.6 2.9 0 .8.6 1.4 1.8 1.4.8 0 1.4-.2 1.8-.6"
        stroke="#4a1500"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <defs>
        <linearGradient id="coinGoldRefRw" x1="1" y1="1" x2="15" y2="15" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffe600" />
          <stop offset="1" stopColor="#ff9800" />
        </linearGradient>
        <linearGradient id="coinInnerGoldRefRw" x1="3" y1="3" x2="13" y2="13" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fff176" />
          <stop offset="1" stopColor="#ffa000" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function RewardsPage({ onBack, onClose }: RewardsPageProps) {
  const handleBack = onBack || onClose || (() => {});
  const [activeTab, setActiveTab] = useState<'rewards' | 'weekly_winners'>('rewards');
  const [rewards] = useState<BrandReward[]>(POPULAR_BRAND_REWARDS);
  const [vouchers, setVouchers] = useState<ClaimedVoucher[]>([]);
  const [weeklyWinners, setWeeklyWinners] = useState<WeeklyWinnersGroup[]>([]);
  const [isLoadingWinners, setIsLoadingWinners] = useState(false);
  const [activeVoucherModal, setActiveVoucherModal] = useState<ClaimedVoucher | null>(null);
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [isClaiming, setIsClaiming] = useState<string | null>(null);

  const totalSessionCoins = useGameState((s) => s.coins);
  const userCoins = Math.max(customer?.totalCoins ?? 0, totalSessionCoins);

  useEffect(() => {
    let isMounted = true;
    setCustomer(popularApi.getCustomerProfile());
    setVouchers(popularApi.getClaimedVouchers());

    setIsLoadingWinners(true);
    popularApi
      .getPreviousWeeklyWinners()
      .then((groups) => {
        if (isMounted) {
          setWeeklyWinners(groups);
          setIsLoadingWinners(false);
        }
      })
      .catch(() => {
        if (isMounted) setIsLoadingWinners(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleClaim = async (reward: BrandReward) => {
    setIsClaiming(reward.id);
    try {
      const voucher = await popularApi.claimReward(reward.id);
      const updatedVouchers = popularApi.getClaimedVouchers();
      setVouchers(updatedVouchers);

      const updatedGroups = await popularApi.getPreviousWeeklyWinners();
      setWeeklyWinners(updatedGroups);

      setActiveVoucherModal(voucher);
    } catch {
      // Error claiming
    } finally {
      setIsClaiming(null);
    }
  };

  return (
    <div className="smooth-lb-viewport">
      {/* Subtle top ambient red glow */}
      <div className="smooth-lb-ambient-glow" />

      {/* Main Container */}
      <div className="smooth-lb-container">
        {/* Top Header Bar matching Leaderboard style */}
        <header className="smooth-lb-header">
          <button
            type="button"
            className="smooth-lb-circle-btn"
            onClick={handleBack}
            aria-label="Go Back"
          >
            <ArrowLeftSvg className="smooth-lb-icon" />
          </button>

          {/* Just one word title: Rewards */}
          <h1 className="smooth-lb-title">Rewards</h1>

          {/* Balance Pill on Top-Right */}
          <div className="smooth-rewards-balance-pill" title="Your Coins">
            <CoinSvg className="smooth-coin-icon" />
            <span>{userCoins.toLocaleString()}</span>
          </div>
        </header>

        {/* Capsule Segmented Tab Switcher (Rewards | Weekly Winners) */}
        <div className="smooth-lb-tabs-capsule">
          <button
            type="button"
            className={`smooth-lb-tab-pill ${activeTab === 'rewards' ? 'active' : ''}`}
            onClick={() => setActiveTab('rewards')}
          >
            Rewards
          </button>

          <button
            type="button"
            className={`smooth-lb-tab-pill ${activeTab === 'weekly_winners' ? 'active' : ''}`}
            onClick={() => setActiveTab('weekly_winners')}
          >
            Weekly Winners
          </button>
        </div>

        {/* Content Area - Tab 1: Redeem Rewards with Points & Progress Bar */}
        {activeTab === 'rewards' && (
          <div className="smooth-rewards-list">
            {rewards.map((item) => {
              const isClaimed = vouchers.some((v) => v.rewardId === item.id);

              // LuLu 100 Riyal Surprise Gift found inside the game itself
              if (item.isSurprise) {
                return (
                  <div
                    key={item.id}
                    className="smooth-reward-card surprise-gift-card"
                  >
                    <div className="smooth-reward-info">
                      <div className="smooth-reward-header-row">
                        <span className="smooth-reward-title">{item.title}</span>
                      </div>
                      <div className="smooth-reward-ingame-hint">
                        100 Riyal voucher will be in the game, play to get it in the game
                      </div>
                    </div>

                    <div className="smooth-reward-action">
                      <button
                        type="button"
                        className="smooth-reward-btn btn-claim"
                        onClick={handleBack}
                        title="Play game to get the voucher"
                      >
                        Play ➔
                      </button>
                    </div>
                  </div>
                );
              }

              const isEligible = userCoins >= item.requiredCoins;
              const progressPct = Math.min(100, Math.floor((userCoins / item.requiredCoins) * 100));

              return (
                <div
                  key={item.id}
                  className={`smooth-reward-card ${
                    isClaimed ? 'claimed' : isEligible ? 'ready' : 'locked'
                  }`}
                >
                  <div className="smooth-reward-info">
                    <div className="smooth-reward-header-row">
                      <span className="smooth-reward-title">{item.title}</span>
                      <span className="smooth-reward-progress-text">
                        {userCoins.toLocaleString()} / {item.requiredCoins.toLocaleString()}
                      </span>
                    </div>

                    {/* Clean Progress Bar showing limit to reach */}
                    <div className="smooth-reward-progress-track">
                      <div
                        className="smooth-reward-progress-fill"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>

                  <div className="smooth-reward-action">
                    {isClaimed ? (
                      <button
                        type="button"
                        className="smooth-reward-btn btn-view"
                        onClick={() => {
                          const v = vouchers.find((vch) => vch.rewardId === item.id);
                          if (v) setActiveVoucherModal(v);
                        }}
                      >
                        View ✓
                      </button>
                    ) : isEligible ? (
                      <button
                        type="button"
                        className="smooth-reward-btn btn-claim"
                        disabled={isClaiming === item.id}
                        onClick={() => handleClaim(item)}
                      >
                        {isClaiming === item.id ? 'Claiming...' : 'Claim'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="smooth-reward-btn btn-locked"
                        disabled
                      >
                        🔒 Claim
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Content Area - Tab 2: Weekly Winners (Decluttered with Date in White + Name & Points) */}
        {activeTab === 'weekly_winners' && (
          <div className="smooth-weekly-winners-container">
            {isLoadingWinners ? (
              <div className="smooth-lb-loading">
                <span className="smooth-lb-spinner">⚡</span>
                <span>Loading weekly winners...</span>
              </div>
            ) : weeklyWinners.length === 0 ? (
              <div className="smooth-lb-empty">
                <span>No previous weekly winners recorded yet.</span>
              </div>
            ) : (
              weeklyWinners.map((group) => {
                const isUserWinner = Boolean(
                  customer?.name && group.winner.name.toLowerCase() === customer.name.toLowerCase()
                );

                return (
                  <div
                    key={group.weekKey}
                    className={`smooth-weekly-winner-card ${
                      isUserWinner ? 'current-user-card' : ''
                    }`}
                  >
                    {/* Date row: Date icon with date in white color */}
                    <div className="smooth-weekly-date-row">
                      <CalendarSvg className="smooth-calendar-svg" />
                      <span className="smooth-weekly-date-text">{group.weekLabel}</span>
                    </div>

                    {/* Below it: Name of person who won & points */}
                    <div className="smooth-weekly-winner-row">
                      <span className="smooth-weekly-winner-name">
                        {isUserWinner ? `${group.winner.name} (You)` : group.winner.name}
                      </span>
                      <span className="smooth-weekly-points">
                        {group.winner.score.toLocaleString()} PTS
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Footer Back Action */}
        <div className="smooth-lb-footer">
          <button type="button" className="smooth-lb-back-cta" onClick={handleBack}>
            ← BACK TO HOME
          </button>
        </div>

        {/* Cashier Barcode Dialog Modal */}
        {activeVoucherModal && (
          <div
            className="voucher-overlay-backdrop"
            onClick={() => setActiveVoucherModal(null)}
          >
            <div
              className="voucher-modal-dialog"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="voucher-modal-header">
                <div className="voucher-dialog-badge">OFFICIAL STORE VOUCHER</div>
                <button
                  type="button"
                  className="home-modal-close-btn"
                  onClick={() => setActiveVoucherModal(null)}
                >
                  ✕
                </button>
              </div>

              <div className="voucher-dialog-body">
                <div className="voucher-dialog-discount">{activeVoucherModal.discountValue}</div>
                <div className="voucher-dialog-title">{activeVoucherModal.rewardTitle}</div>

                <div className="voucher-code-box">
                  <div className="voucher-code-label">VOUCHER CODE</div>
                  <div className="voucher-code-text">{activeVoucherModal.voucherCode}</div>
                </div>

                {/* Simulated Barcode for Checkout */}
                <div className="voucher-barcode-container">
                  <div className="voucher-barcode-lines">
                    {Array.from({ length: 36 }).map((_, i) => (
                      <span
                        key={i}
                        className="barcode-bar"
                        style={{
                          width: `${(i % 3) + 1.5}px`,
                          marginRight: `${(i % 2) + 1.2}px`,
                        }}
                      />
                    ))}
                  </div>
                  <div className="voucher-barcode-digits">{activeVoucherModal.voucherCode}</div>
                </div>

                <div className="voucher-verification-card">
                  <div className="verification-row">
                    <span className="verif-label">Customer:</span>
                    <span className="verif-val">{activeVoucherModal.customerName || customer?.name || 'Customer'}</span>
                  </div>
                  <div className="verification-row">
                    <span className="verif-label">Phone:</span>
                    <span className="verif-val highlight">{activeVoucherModal.customerPhone}</span>
                  </div>
                </div>

                <p className="voucher-instructions">
                  📍 Present this screen at any Popular Electricals branch in Qatar to redeem.
                </p>
              </div>

              <button
                type="button"
                className="voucher-close-action-btn"
                onClick={() => setActiveVoucherModal(null)}
              >
                DONE
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Keep RewardsModal export as an alias for backward compatibility
export const RewardsModal = RewardsPage;
