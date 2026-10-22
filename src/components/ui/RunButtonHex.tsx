interface RunButtonHexProps {
  onClick: () => void;
  className?: string;
}

export function RunButtonHex({ onClick, className = '' }: RunButtonHexProps) {
  return (
    <button
      id="run-game-button"
      className={`hex-run-btn ${className}`}
      onClick={onClick}
      type="button"
      aria-label="Run Game"
    >
      <svg
        className="hex-run-svg"
        viewBox="0 0 440 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Top highlight bevel */}
          <linearGradient id="runTopBevel" x1="220" y1="20" x2="220" y2="30" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="35%" stopColor="#fffab0" />
            <stop offset="100%" stopColor="#ffdc35" />
          </linearGradient>

          {/* Top-Left angled bevel */}
          <linearGradient id="runTopLeftBevel" x1="75" y1="60" x2="115" y2="20" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffeb5e" />
            <stop offset="60%" stopColor="#fffbb8" />
            <stop offset="100%" stopColor="#ffffff" />
          </linearGradient>

          {/* Top-Right angled bevel */}
          <linearGradient id="runTopRightBevel" x1="325" y1="20" x2="365" y2="60" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="45%" stopColor="#fff398" />
            <stop offset="100%" stopColor="#ffd836" />
          </linearGradient>

          {/* Bottom shadow bevel */}
          <linearGradient id="runBottomBevel" x1="220" y1="90" x2="220" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ff9a00" />
            <stop offset="50%" stopColor="#ea6500" />
            <stop offset="100%" stopColor="#cf4400" />
          </linearGradient>

          {/* Bottom-Left angled bevel */}
          <linearGradient id="runBottomLeftBevel" x1="89" y1="60" x2="115" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffa800" />
            <stop offset="55%" stopColor="#ee6e00" />
            <stop offset="100%" stopColor="#d24600" />
          </linearGradient>

          {/* Bottom-Right angled bevel */}
          <linearGradient id="runBottomRightBevel" x1="351" y1="60" x2="325" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffa000" />
            <stop offset="55%" stopColor="#ec6700" />
            <stop offset="100%" stopColor="#cc4000" />
          </linearGradient>

          {/* Inner Face Radiant Gold */}
          <linearGradient id="runInnerFace" x1="220" y1="30" x2="220" y2="90" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fffb54" />
            <stop offset="26%" stopColor="#ffdf22" />
            <stop offset="68%" stopColor="#ffba00" />
            <stop offset="100%" stopColor="#ff9600" />
          </linearGradient>

          {/* Top gloss reflection arc */}
          <linearGradient id="runGlossReflection" x1="220" y1="30" x2="220" y2="60" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
            <stop offset="55%" stopColor="#ffffff" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>

          {/* Speed streaks */}
          <linearGradient id="runStreakTopLeft" x1="20" y1="56" x2="64" y2="56" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffe638" stopOpacity="0.15" />
            <stop offset="50%" stopColor="#fff666" />
            <stop offset="100%" stopColor="#ffea35" />
          </linearGradient>

          <linearGradient id="runStreakBottomLeft" x1="48" y1="69" x2="66" y2="69" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ff9800" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#ffa726" />
          </linearGradient>

          <linearGradient id="runStreakTopRight" x1="376" y1="56" x2="420" y2="56" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffea35" />
            <stop offset="50%" stopColor="#fff666" />
            <stop offset="100%" stopColor="#ffe638" stopOpacity="0.15" />
          </linearGradient>

          <linearGradient id="runStreakBottomRight" x1="374" y1="69" x2="392" y2="69" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffa726" />
            <stop offset="100%" stopColor="#ff9800" stopOpacity="0.2" />
          </linearGradient>

          {/* Glint Filter */}
          <filter id="runGlintFilter" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="runSpeedBlur" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3.5" />
          </filter>
        </defs>

        {/* Ambient gold background aura */}
        <ellipse cx="220" cy="60" rx="160" ry="42" fill="#ffb700" opacity="0.35" filter="url(#runSpeedBlur)" />

        {/* Left Speed Streaks */}
        <line x1="24" y1="56" x2="62" y2="56" stroke="#ffb300" strokeWidth="12" strokeLinecap="round" opacity="0.45" filter="url(#runSpeedBlur)" />
        <line x1="20" y1="56" x2="64" y2="56" stroke="url(#runStreakTopLeft)" strokeWidth="5.5" strokeLinecap="round" />
        <line x1="48" y1="69" x2="66" y2="69" stroke="url(#runStreakBottomLeft)" strokeWidth="4" strokeLinecap="round" />

        {/* Right Speed Streaks */}
        <line x1="378" y1="56" x2="416" y2="56" stroke="#ffb300" strokeWidth="12" strokeLinecap="round" opacity="0.45" filter="url(#runSpeedBlur)" />
        <line x1="376" y1="56" x2="420" y2="56" stroke="url(#runStreakTopRight)" strokeWidth="5.5" strokeLinecap="round" />
        <line x1="374" y1="69" x2="392" y2="69" stroke="url(#runStreakBottomRight)" strokeWidth="4" strokeLinecap="round" />

        {/* Outer Shadow */}
        <polygon
          points="75,60 115,20 325,20 365,60 325,100 115,100"
          fill="#400311"
          opacity="0.75"
          transform="translate(0, 4.5)"
        />

        {/* Button Base Rim */}
        <polygon
          points="75,60 115,20 325,20 365,60 325,100 115,100"
          fill="#d04800"
          stroke="#b83800"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />

        {/* 3D Beveled Facets */}
        <polygon points="115,20 325,20 321,30 119,30" fill="url(#runTopBevel)" />
        <polygon points="75,60 115,20 119,30 89,60" fill="url(#runTopLeftBevel)" />
        <polygon points="325,20 365,60 351,60 321,30" fill="url(#runTopRightBevel)" />
        <polygon points="325,100 115,100 119,90 321,90" fill="url(#runBottomBevel)" />
        <polygon points="115,100 75,60 89,60 119,90" fill="url(#runBottomLeftBevel)" />
        <polygon points="365,60 325,100 321,90 351,60" fill="url(#runBottomRightBevel)" />

        {/* Ridge Highlights */}
        <line x1="115" y1="20" x2="119" y2="30" stroke="#ffffff" strokeWidth="1.2" opacity="0.85" />
        <line x1="325" y1="20" x2="321" y2="30" stroke="#ffffff" strokeWidth="1.2" opacity="0.85" />
        <line x1="75" y1="60" x2="89" y2="60" stroke="#fff4a0" strokeWidth="1.5" />
        <line x1="365" y1="60" x2="351" y2="60" stroke="#ffd950" strokeWidth="1.5" />
        <line x1="115" y1="100" x2="119" y2="90" stroke="#992e00" strokeWidth="1.2" opacity="0.6" />
        <line x1="325" y1="100" x2="321" y2="90" stroke="#992e00" strokeWidth="1.2" opacity="0.6" />

        {/* Specular Razor Highlights */}
        <line x1="116" y1="20" x2="324" y2="20" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" />
        <line x1="76" y1="59" x2="115" y2="20" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
        <line x1="325" y1="20" x2="364" y2="59" stroke="#fff6a8" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="325" y1="100" x2="364" y2="61" stroke="#ffeb85" strokeWidth="2" strokeLinecap="round" />

        {/* Inner Main Face */}
        <polygon points="89,60 119,30 321,30 351,60 321,90 119,90" fill="url(#runInnerFace)" />

        {/* Inner Face Perimeter Groove */}
        <polygon
          points="89,60 119,30 321,30 351,60 321,90 119,90"
          fill="none"
          stroke="#cc7300"
          strokeWidth="1.2"
          opacity="0.45"
        />

        {/* Gloss Overlay */}
        <path d="M 89,60 L 119,30 L 321,30 L 351,60 Q 220,44 89,60 Z" fill="url(#runGlossReflection)" />

        {/* Sparkle Glints */}
        <circle cx="115" cy="20" r="3.6" fill="#ffffff" filter="url(#runGlintFilter)" />
        <circle cx="325" cy="20" r="3.4" fill="#ffffff" filter="url(#runGlintFilter)" />
        <circle cx="325" cy="100" r="2.8" fill="#fff7b0" filter="url(#runGlintFilter)" />

        {/* Center Content: RUN Text */}
        <text
          x="220"
          y="60"
          textAnchor="middle"
          dominantBaseline="central"
          fontFamily="'Montserrat', 'Arial Black', -apple-system, system-ui, sans-serif"
          fontSize="40"
          fontWeight="900"
          fill="#62021c"
          letterSpacing="4"
        >
          RUN
        </text>
      </svg>
    </button>
  );
}
