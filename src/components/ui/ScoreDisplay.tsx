import { useEffect, useRef, useState } from 'react';
import { useGameState } from '../../game/state';

export function ScoreDisplay() {
  const coins = useGameState((s) => s.coins);
  const lives = useGameState((s) => s.lives);
  const magnetTime = useGameState((s) => s.magnetTime);
  const magnetActive = useGameState((s) => s.magnetActive);
  const turboTime = useGameState((s) => s.turboTime);
  const turboActive = useGameState((s) => s.turboActive);
  const [pulse, setPulse] = useState(false);
  const prevCoins = useRef(coins);

  useEffect(() => {
    if (coins > prevCoins.current) {
      setPulse(true);
      const timer = setTimeout(() => setPulse(false), 220);
      prevCoins.current = coins;
      return () => clearTimeout(timer);
    }
    prevCoins.current = coins;
  }, [coins]);

  return (
    <div className="gameplay-hud-container">
      {/* Top Left: Sparky Profile Pill */}
      <div className="hud-profile-pill">
        <div className="hud-avatar-circle">
          <img
            src="/image.png"
            alt="Sparky"
            className="hud-avatar-img"
            width={48}
            height={48}
            draggable={false}
          />
        </div>
        <div className="hud-profile-details">
          <span className="hud-player-name">Sparky</span>
          <div className="hud-hearts-row">
            {Array.from({ length: 3 }).map((_, i) => (
              <svg
                key={i}
                className={`hud-heart-icon ${i < lives ? 'active' : 'depleted'}`}
                viewBox="0 0 512 512"
                width="16"
                height="16"
              >
                <defs>
                  <linearGradient id={`heartGrad_${i}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ff4b6e" />
                    <stop offset="100%" stopColor="#d90429" />
                  </linearGradient>
                </defs>
                <path
                  d="M47.6 300.4L228.3 469.1c7.5 7 17.4 10.9 27.7 10.9s20.2-3.9 27.7-10.9L464.4 300.4c30.4-28.3 47.6-68 47.6-109.5v-5.8c0-69.9-50.5-129.5-119.4-141C347 36.5 300.6 51.4 268 84L256 96 244 84c-32.6-32.6-79-47.5-124.6-39.9C50.5 55.6 0 115.2 0 185.1v5.8c0 41.5 17.2 81.2 47.6 109.5z"
                  fill={i < lives ? `url(#heartGrad_${i})` : 'rgba(255, 255, 255, 0.25)'}
                  stroke="#ffffff"
                  strokeWidth="24"
                  strokeLinejoin="round"
                />
              </svg>
            ))}
          </div>
        </div>
      </div>

      {/* Top Right Column: Gold Coin Collection Pill & Magnet Progress Bar HUD */}
      <div className="hud-right-col">
        <div className={`hud-coin-pill ${pulse ? 'coin-pulse' : ''}`}>
          <div className="hud-coin-badge">
            <svg viewBox="0 0 40 40" width="34" height="34" className="hud-coin-svg">
              <defs>
                {/* Shiny 3D Gold Gradients */}
                <radialGradient id="coinFaceGlow" cx="35%" cy="30%" r="70%">
                  <stop offset="0%" stopColor="#fffbeb" />
                  <stop offset="25%" stopColor="#fde047" />
                  <stop offset="65%" stopColor="#eab308" />
                  <stop offset="100%" stopColor="#ca8a04" />
                </radialGradient>
                <linearGradient id="coinRimGrad" x1="0.2" y1="0" x2="0.8" y2="1">
                  <stop offset="0%" stopColor="#fef08a" />
                  <stop offset="35%" stopColor="#facc15" />
                  <stop offset="70%" stopColor="#d97706" />
                  <stop offset="100%" stopColor="#92400e" />
                </linearGradient>
                <linearGradient id="coinInnerGroove" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#92400e" />
                  <stop offset="100%" stopColor="#fef08a" />
                </linearGradient>
                <linearGradient id="coinStarGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="40%" stopColor="#fef08a" />
                  <stop offset="100%" stopColor="#d97706" />
                </linearGradient>
                <filter id="goldCoinGlow" x="-25%" y="-25%" width="150%" height="150%">
                  <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#f59e0b" floodOpacity="0.8" />
                </filter>
              </defs>

              <g filter="url(#goldCoinGlow)">
                {/* Outer Golden Beveled Rim */}
                <circle cx="20" cy="20" r="16.5" fill="url(#coinRimGrad)" stroke="#fef08a" strokeWidth="0.8" />

                {/* Inner Recessed Bevel Groove */}
                <circle cx="20" cy="20" r="13.8" fill="none" stroke="url(#coinInnerGroove)" strokeWidth="1.2" />

                {/* Main Face Disc */}
                <circle cx="20" cy="20" r="12.6" fill="url(#coinFaceGlow)" />

                {/* Concentric Milled Ring Accent */}
                <circle cx="20" cy="20" r="10.8" fill="none" stroke="rgba(255, 255, 255, 0.45)" strokeWidth="0.6" strokeDasharray="1.5 1.5" />

                {/* Embossed Center Star Crest Shadow */}
                <path
                  d="M20 12 L22.4 17.2 L28 17.8 L23.8 21.7 L25 27.2 L20 24.3 L15 27.2 L16.2 21.7 L12 17.8 L17.6 17.2 Z"
                  fill="#78350f"
                  transform="translate(0, 0.8)"
                  opacity="0.6"
                />
                {/* Embossed Star Face */}
                <path
                  d="M20 12 L22.4 17.2 L28 17.8 L23.8 21.7 L25 27.2 L20 24.3 L15 27.2 L16.2 21.7 L12 17.8 L17.6 17.2 Z"
                  fill="url(#coinStarGrad)"
                  stroke="#ffffff"
                  strokeWidth="0.5"
                  strokeLinejoin="round"
                />

                {/* Specular Rim Arc Highlight */}
                <path
                  d="M10 13 A14 14 0 0 1 27 7.5"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  opacity="0.9"
                />

                {/* Sparkle Glint Star on Top Left Rim */}
                <path
                  d="M11 9 L11.8 6.5 L12.6 9 L15 9.8 L12.6 10.6 L11.8 13 L11 10.6 L8.5 9.8 Z"
                  fill="#ffffff"
                  opacity="0.95"
                />
              </g>
            </svg>
          </div>
          <span className="hud-coin-count">{coins}</span>
        </div>

        {/* Magnet Power-Up Timer Progress Bar HUD */}
        {magnetActive && (
          <div className={`hud-magnet-pill ${magnetTime < 2.5 ? 'magnet-warning' : ''}`}>
            <div className="hud-magnet-badge">
              <img
                src="/assets/magnet.svg"
                alt="Magnet"
                className="hud-magnet-icon-img"
                width={22}
                height={22}
                draggable={false}
              />
            </div>
            <div className="hud-magnet-track">
              <div
                className="hud-magnet-fill"
                style={{ width: `${Math.min(100, Math.max(0, (magnetTime / 10) * 100))}%` }}
              />
            </div>
          </div>
        )}

        {/* Turbo Lightning Power-Up Timer Progress Bar HUD */}
        {turboActive && (
          <div className={`hud-turbo-pill ${turboTime < 2.5 ? 'turbo-warning' : ''}`}>
            <div className="hud-turbo-badge">
              <img
                src="/assets/powerup.svg"
                alt="Turbo"
                className="hud-turbo-icon-img"
                width={22}
                height={22}
                draggable={false}
              />
            </div>
            <div className="hud-turbo-track">
              <div
                className="hud-turbo-fill"
                style={{ width: `${Math.min(100, Math.max(0, (turboTime / 10) * 100))}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
