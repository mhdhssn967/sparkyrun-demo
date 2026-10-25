interface SecondaryHexButtonProps {
  variant: 'leaderboard' | 'rewards';
  onClick: () => void;
  className?: string;
}

export function SecondaryHexButton({ variant, onClick, className = '' }: SecondaryHexButtonProps) {
  const isLeaderboard = variant === 'leaderboard';
  const label = isLeaderboard ? 'LEADERBOARD' : 'REWARDS';
  const idPrefix = `sec_${variant}_`;

  return (
    <button
      id={`home-${variant}-button`}
      className={`sec-hex-btn sec-hex-${variant} ${className}`}
      onClick={onClick}
      type="button"
      aria-label={label}
    >
      <svg
        className="sec-hex-svg"
        viewBox="0 0 250 88"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Top highlight bevel */}
          <linearGradient id={`${idPrefix}topBevel`} x1="125" y1="8" x2="125" y2="16" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="35%" stopColor="#fffab0" />
            <stop offset="100%" stopColor="#ffdc35" />
          </linearGradient>

          {/* Top-Left bevel */}
          <linearGradient id={`${idPrefix}topLeftBevel`} x1="10" y1="44" x2="38" y2="8" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffeb5e" />
            <stop offset="60%" stopColor="#fffbb8" />
            <stop offset="100%" stopColor="#ffffff" />
          </linearGradient>

          {/* Top-Right bevel */}
          <linearGradient id={`${idPrefix}topRightBevel`} x1="212" y1="8" x2="240" y2="44" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="45%" stopColor="#fff398" />
            <stop offset="100%" stopColor="#ffd836" />
          </linearGradient>

          {/* Bottom shadow bevel */}
          <linearGradient id={`${idPrefix}bottomBevel`} x1="125" y1="72" x2="125" y2="80" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ff9a00" />
            <stop offset="50%" stopColor="#ea6500" />
            <stop offset="100%" stopColor="#cf4400" />
          </linearGradient>

          {/* Bottom-Left bevel */}
          <linearGradient id={`${idPrefix}bottomLeftBevel`} x1="18" y1="44" x2="38" y2="80" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffa800" />
            <stop offset="55%" stopColor="#ee6e00" />
            <stop offset="100%" stopColor="#d24600" />
          </linearGradient>

          {/* Bottom-Right bevel */}
          <linearGradient id={`${idPrefix}bottomRightBevel`} x1="232" y1="44" x2="212" y2="80" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffa000" />
            <stop offset="55%" stopColor="#ec6700" />
            <stop offset="100%" stopColor="#cc4000" />
          </linearGradient>

          {/* Inner Face Radiant Gold */}
          <linearGradient id={`${idPrefix}innerFace`} x1="125" y1="16" x2="125" y2="72" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fffb54" />
            <stop offset="28%" stopColor="#ffdf22" />
            <stop offset="68%" stopColor="#ffba00" />
            <stop offset="100%" stopColor="#ff9600" />
          </linearGradient>

          {/* Inner Face Top Gloss reflection */}
          <linearGradient id={`${idPrefix}gloss`} x1="125" y1="16" x2="125" y2="44" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
            <stop offset="60%" stopColor="#ffffff" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>

          {/* Glint Filter */}
          <filter id={`${idPrefix}glintFilter`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Outer Shadow behind button */}
        <polygon
          points="10,44 38,8 212,8 240,44 212,80 38,80"
          fill="#400311"
          opacity="0.65"
          transform="translate(0, 3)"
        />

        {/* Base Bevel Rim */}
        <polygon
          points="10,44 38,8 212,8 240,44 212,80 38,80"
          fill="#d04800"
          stroke="#b83800"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />

        {/* 3D Beveled Facets */}
        {/* Top Bevel */}
        <polygon points="38,8 212,8 206,16 44,16" fill={`url(#${idPrefix}topBevel)`} />

        {/* Top-Left Bevel */}
        <polygon points="10,44 38,8 44,16 18,44" fill={`url(#${idPrefix}topLeftBevel)`} />

        {/* Top-Right Bevel */}
        <polygon points="212,8 240,44 232,44 206,16" fill={`url(#${idPrefix}topRightBevel)`} />

        {/* Bottom Bevel */}
        <polygon points="212,80 38,80 44,72 206,72" fill={`url(#${idPrefix}bottomBevel)`} />

        {/* Bottom-Left Bevel */}
        <polygon points="38,80 10,44 18,44 44,72" fill={`url(#${idPrefix}bottomLeftBevel)`} />

        {/* Bottom-Right Bevel */}
        <polygon points="240,44 212,80 206,72 232,44" fill={`url(#${idPrefix}bottomRightBevel)`} />

        {/* Ridge Highlights */}
        <line x1="38" y1="8" x2="44" y2="16" stroke="#ffffff" strokeWidth="1" opacity="0.8" />
        <line x1="212" y1="8" x2="206" y2="16" stroke="#ffffff" strokeWidth="1" opacity="0.8" />
        <line x1="10" y1="44" x2="18" y2="44" stroke="#fff4a0" strokeWidth="1.2" />
        <line x1="240" y1="44" x2="232" y2="44" stroke="#ffd950" strokeWidth="1.2" />
        <line x1="38" y1="80" x2="44" y2="72" stroke="#992e00" strokeWidth="1" opacity="0.5" />
        <line x1="212" y1="80" x2="206" y2="72" stroke="#992e00" strokeWidth="1" opacity="0.5" />

        {/* Specular Edge Highlights */}
        <line x1="39" y1="8" x2="211" y2="8" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="11" y1="43" x2="38" y2="8" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" />
        <line x1="212" y1="8" x2="239" y2="43" stroke="#fff6a8" strokeWidth="1.4" strokeLinecap="round" />
        <line x1="212" y1="80" x2="239" y2="45" stroke="#ffeb85" strokeWidth="1.6" strokeLinecap="round" />

        {/* Inner Main Face */}
        <polygon points="18,44 44,16 206,16 232,44 206,72 44,72" fill={`url(#${idPrefix}innerFace)`} />

        {/* Inner Chisel Line */}
        <polygon
          points="18,44 44,16 206,16 232,44 206,72 44,72"
          fill="none"
          stroke="#cc7300"
          strokeWidth="0.8"
          opacity="0.4"
        />

        {/* Gloss Overlay */}
        <path d="M 18,44 L 44,16 L 206,16 L 232,44 Q 125,32 18,44 Z" fill={`url(#${idPrefix}gloss)`} />

        {/* Sparkle Glints */}
        <circle cx="38" cy="8" r="2.8" fill="#ffffff" filter={`url(#${idPrefix}glintFilter)`} />
        <circle cx="212" cy="8" r="2.5" fill="#ffffff" filter={`url(#${idPrefix}glintFilter)`} />
        <circle cx="212" cy="80" r="2.2" fill="#fff7b0" filter={`url(#${idPrefix}glintFilter)`} />

        {/* Center Content: Icon + Label (Clean & Centered) */}
        {isLeaderboard ? (
          /* Leaderboard Trophy Icon + Text */
          <g>
            {/* Trophy Icon */}
            <g transform="translate(46, 32)">
              {/* Cup bowl */}
              <path d="M3 2h12v6c0 3.3-2.7 6-6 6s-6-2.7-6-6V2z" fill="#62021c" />
              {/* Left handle */}
              <path d="M3 4.5H0.5c0 3 1.8 5 3.5 5V4.5z" fill="#62021c" />
              {/* Right handle */}
              <path d="M15 4.5h2.5c0 3-1.8 5-3.5 5V4.5z" fill="#62021c" />
              {/* Stem */}
              <rect x="8" y="13" width="2" height="5" fill="#62021c" />
              {/* Base */}
              <path d="M5 18h8l1.2 3.5H3.8L5 18z" fill="#62021c" />
            </g>

            {/* LEADERBOARD Text */}
            <text
              x="74"
              y="44"
              dominantBaseline="central"
              fontFamily="'Montserrat', 'Arial Black', -apple-system, system-ui, sans-serif"
              fontSize="15"
              fontWeight="900"
              fill="#62021c"
              letterSpacing="1.2"
            >
              LEADERBOARD
            </text>
          </g>
        ) : (
          /* Rewards Gift Icon + Text */
          <g>
            {/* Rewards Gift Box Icon */}
            <g transform="translate(66, 32)">
              {/* Box body */}
              <rect x="1.5" y="7" width="16" height="13" rx="1.5" fill="#62021c" />
              {/* Lid */}
              <rect x="0.5" y="4" width="18" height="3.5" rx="1.2" fill="#62021c" />
              {/* Vertical yellow ribbon */}
              <rect x="8.2" y="4" width="3" height="16" fill="#ffe54c" />
              {/* Horizontal yellow ribbon */}
              <rect x="0.5" y="5.2" width="18" height="1.6" fill="#ffe54c" />
              {/* Bow loops */}
              <path
                d="M7 4C5 4 5 1.5 7.5 1.5C9.5 1.5 10 3.5 10 4C10 3.5 10.5 1.5 12.5 1.5C15 1.5 15 4 13 4"
                fill="none"
                stroke="#ffe54c"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </g>

            {/* REWARDS Text */}
            <text
              x="96"
              y="44"
              dominantBaseline="central"
              fontFamily="'Montserrat', 'Arial Black', -apple-system, system-ui, sans-serif"
              fontSize="16"
              fontWeight="900"
              fill="#62021c"
              letterSpacing="1.6"
            >
              REWARDS
            </text>
          </g>
        )}
      </svg>
    </button>
  );
}
