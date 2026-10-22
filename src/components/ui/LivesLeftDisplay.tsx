interface LivesLeftDisplayProps {
  livesLeft?: number;
  maxLives?: number;
  className?: string;
}

export function LivesLeftDisplay({
  livesLeft = 2,
  maxLives = 3,
  className = '',
}: LivesLeftDisplayProps) {
  return (
    <div
      className={`home-lives-capsule ${className}`}
      title={`${livesLeft} of ${maxLives} Lives Remaining`}
    >
      <span className="home-lives-title">LIVES LEFT</span>

      <div className="home-lives-hearts-row" aria-label={`${livesLeft} lives left`}>
        {Array.from({ length: maxLives }).map((_, i) => {
          const isFilled = i < livesLeft;
          return (
            <div
              key={i}
              className={`home-heart-wrapper ${isFilled ? 'filled' : 'empty'}`}
              title={isFilled ? `Life ${i + 1} (Active)` : `Life ${i + 1} (Empty)`}
            >
              <svg
                viewBox="0 0 512 512"
                className="home-heart-svg"
                width="22"
                height="22"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient id={`homeLiveHeartGrad_${i}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ff5277" />
                    <stop offset="45%" stopColor="#ff1744" />
                    <stop offset="100%" stopColor="#a80724" />
                  </linearGradient>
                </defs>
                <path
                  d="M47.6 300.4L228.3 469.1c7.5 7 17.4 10.9 27.7 10.9s20.2-3.9 27.7-10.9L464.4 300.4c30.4-28.3 47.6-68 47.6-109.5v-5.8c0-69.9-50.5-129.5-119.4-141C347 36.5 300.6 51.4 268 84L256 96 244 84c-32.6-32.6-79-47.5-124.6-39.9C50.5 55.6 0 115.2 0 185.1v5.8c0 41.5 17.2 81.2 47.6 109.5z"
                  fill={isFilled ? `url(#homeLiveHeartGrad_${i})` : 'rgba(15, 3, 6, 0.75)'}
                  stroke={isFilled ? '#ffffff' : 'rgba(255, 255, 255, 0.45)'}
                  strokeWidth={isFilled ? '24' : '22'}
                  strokeLinejoin="round"
                />
                {isFilled && (
                  <ellipse
                    cx="165"
                    cy="165"
                    rx="45"
                    ry="25"
                    transform="rotate(-28 165 165)"
                    fill="rgba(255, 255, 255, 0.65)"
                  />
                )}
              </svg>
            </div>
          );
        })}
      </div>
    </div>
  );
}
