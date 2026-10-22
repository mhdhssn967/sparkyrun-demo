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
        viewBox="0 0 250 66"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Top highlight bevel */}
          <linearGradient id={`${idPrefix}topBevel`} x1="125" y1="7" x2="125" y2="13" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="35%" stopColor="#fffab0" />
            <stop offset="100%" stopColor="#ffdc35" />
          </linearGradient>

          {/* Top-Left bevel */}
          <linearGradient id={`${idPrefix}topLeftBevel`} x1="10" y1="33" x2="34" y2="7" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffeb5e" />
            <stop offset="60%" stopColor="#fffbb8" />
            <stop offset="100%" stopColor="#ffffff" />
          </linearGradient>

          {/* Top-Right bevel */}
          <linearGradient id={`${idPrefix}topRightBevel`} x1="216" y1="7" x2="240" y2="33" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="45%" stopColor="#fff398" />
            <stop offset="100%" stopColor="#ffd836" />
          </linearGradient>

          {/* Bottom shadow bevel */}
          <linearGradient id={`${idPrefix}bottomBevel`} x1="125" y1="53" x2="125" y2="59" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ff9a00" />
            <stop offset="50%" stopColor="#ea6500" />
            <stop offset="100%" stopColor="#cf4400" />
          </linearGradient>

          {/* Bottom-Left bevel */}
          <linearGradient id={`${idPrefix}bottomLeftBevel`} x1="19" y1="33" x2="34" y2="59" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffa800" />
            <stop offset="55%" stopColor="#ee6e00" />
            <stop offset="100%" stopColor="#d24600" />
          </linearGradient>

          {/* Bottom-Right bevel */}
          <linearGradient id={`${idPrefix}bottomRightBevel`} x1="231" y1="33" x2="216" y2="59" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffa000" />
            <stop offset="55%" stopColor="#ec6700" />
            <stop offset="100%" stopColor="#cc4000" />
          </linearGradient>

          {/* Inner Face Radiant Gold */}
          <linearGradient id={`${idPrefix}innerFace`} x1="125" y1="13" x2="125" y2="53" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fffb54" />
            <stop offset="28%" stopColor="#ffdf22" />
            <stop offset="68%" stopColor="#ffba00" />
            <stop offset="100%" stopColor="#ff9600" />
          </linearGradient>

          {/* Inner Face Top Gloss reflection */}
          <linearGradient id={`${idPrefix}gloss`} x1="125" y1="13" x2="125" y2="33" gradientUnits="userSpaceOnUse">
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
          points="10,33 34,7 216,7 240,33 216,59 34,59"
          fill="#400311"
          opacity="0.65"
          transform="translate(0, 2.5)"
        />

        {/* Base Bevel Rim */}
        <polygon
          points="10,33 34,7 216,7 240,33 216,59 34,59"
          fill="#d04800"
          stroke="#b83800"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />

        {/* 3D Beveled Facets */}
        {/* Top Bevel */}
        <polygon points="34,7 216,7 211,13 39,13" fill={`url(#${idPrefix}topBevel)`} />

        {/* Top-Left Bevel */}
        <polygon points="10,33 34,7 39,13 19,33" fill={`url(#${idPrefix}topLeftBevel)`} />

        {/* Top-Right Bevel */}
        <polygon points="216,7 240,33 231,33 211,13" fill={`url(#${idPrefix}topRightBevel)`} />

        {/* Bottom Bevel */}
        <polygon points="216,59 34,59 39,53 211,53" fill={`url(#${idPrefix}bottomBevel)`} />

        {/* Bottom-Left Bevel */}
        <polygon points="34,59 10,33 19,33 39,53" fill={`url(#${idPrefix}bottomLeftBevel)`} />

        {/* Bottom-Right Bevel */}
        <polygon points="240,33 216,59 211,53 231,33" fill={`url(#${idPrefix}bottomRightBevel)`} />

        {/* Ridge Highlights */}
        <line x1="34" y1="7" x2="39" y2="13" stroke="#ffffff" strokeWidth="1" opacity="0.8" />
        <line x1="216" y1="7" x2="211" y2="13" stroke="#ffffff" strokeWidth="1" opacity="0.8" />
        <line x1="10" y1="33" x2="19" y2="33" stroke="#fff4a0" strokeWidth="1.2" />
        <line x1="240" y1="33" x2="231" y2="33" stroke="#ffd950" strokeWidth="1.2" />
        <line x1="34" y1="59" x2="39" y2="53" stroke="#992e00" strokeWidth="1" opacity="0.5" />
        <line x1="216" y1="59" x2="211" y2="53" stroke="#992e00" strokeWidth="1" opacity="0.5" />

        {/* Specular Edge Highlights */}
        <line x1="35" y1="7" x2="215" y2="7" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="11" y1="32" x2="34" y2="7" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" />
        <line x1="216" y1="7" x2="239" y2="32" stroke="#fff6a8" strokeWidth="1.4" strokeLinecap="round" />
        <line x1="216" y1="59" x2="239" y2="34" stroke="#ffeb85" strokeWidth="1.6" strokeLinecap="round" />

        {/* Inner Main Face */}
        <polygon points="19,33 39,13 211,13 231,33 211,53 39,53" fill={`url(#${idPrefix}innerFace)`} />

        {/* Inner Chisel Line */}
        <polygon
          points="19,33 39,13 211,13 231,33 211,53 39,53"
          fill="none"
          stroke="#cc7300"
          strokeWidth="0.8"
          opacity="0.4"
        />

        {/* Gloss Overlay */}
        <path d="M 19,33 L 39,13 L 211,13 L 231,33 Q 125,23 19,33 Z" fill={`url(#${idPrefix}gloss)`} />

        {/* Sparkle Glints */}
        <circle cx="34" cy="7" r="2.5" fill="#ffffff" filter={`url(#${idPrefix}glintFilter)`} />
        <circle cx="216" cy="7" r="2.3" fill="#ffffff" filter={`url(#${idPrefix}glintFilter)`} />
        <circle cx="216" cy="59" r="2" fill="#fff7b0" filter={`url(#${idPrefix}glintFilter)`} />

        {/* Center Content: Icon + Label (Clean & Centered) */}
        {isLeaderboard ? (
          /* Leaderboard Trophy Icon + Text */
          <g>
            {/* Trophy Icon */}
            <g transform="translate(50, 24)">
              {/* Cup bowl */}
              <path d="M3 2h10v5c0 2.8-2.2 5-5 5s-5-2.2-5-5V2z" fill="#62021c" />
              {/* Left handle */}
              <path d="M3 4H0.5c0 2.5 1.5 4 3 4V4z" fill="#62021c" />
              {/* Right handle */}
              <path d="M13 4h2.5c0 2.5-1.5 4-3 4V4z" fill="#62021c" />
              {/* Stem */}
              <rect x="7" y="11" width="2" height="4" fill="#62021c" />
              {/* Base */}
              <path d="M4 15h8l1 3H3l1-3z" fill="#62021c" />
            </g>

            {/* LEADERBOARD Text */}
            <text
              x="74"
              y="33"
              dominantBaseline="central"
              fontFamily="'Montserrat', 'Arial Black', -apple-system, system-ui, sans-serif"
              fontSize="14.5"
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
            <g transform="translate(70, 24)">
              {/* Box body */}
              <rect x="1.5" y="6" width="14" height="11" rx="1.2" fill="#62021c" />
              {/* Lid */}
              <rect x="0.5" y="3.5" width="16" height="3" rx="1" fill="#62021c" />
              {/* Vertical yellow ribbon */}
              <rect x="7.2" y="3.5" width="2.5" height="13.5" fill="#ffe54c" />
              {/* Horizontal yellow ribbon */}
              <rect x="0.5" y="4.5" width="16" height="1.4" fill="#ffe54c" />
              {/* Bow loops */}
              <path
                d="M6 3.5C4.5 3.5 4.5 1.2 6.5 1.2C8 1.2 8.5 3 8.5 3.5C8.5 3 9 1.2 10.5 1.2C12.5 1.2 12.5 3.5 11 3.5"
                fill="none"
                stroke="#ffe54c"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </g>

            {/* REWARDS Text */}
            <text
              x="96"
              y="33"
              dominantBaseline="central"
              fontFamily="'Montserrat', 'Arial Black', -apple-system, system-ui, sans-serif"
              fontSize="15.5"
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
