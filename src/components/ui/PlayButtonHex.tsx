interface PlayButtonHexProps {
  onClick: () => void;
  className?: string;
}

export function PlayButtonHex({ onClick, className = '' }: PlayButtonHexProps) {
  return (
    <button
      id="play-game-button"
      className={`hex-play-btn ${className}`}
      onClick={onClick}
      type="button"
      aria-label="Play Game"
    >
      <svg
        className="hex-play-svg"
        viewBox="0 0 440 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Top highlight bevel gradient */}
          <linearGradient id="topBevel" x1="220" y1="20" x2="220" y2="30" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="35%" stopColor="#fffab0" />
            <stop offset="100%" stopColor="#ffdc35" />
          </linearGradient>

          {/* Top-Left angled bevel */}
          <linearGradient id="topLeftBevel" x1="75" y1="60" x2="115" y2="20" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffeb5e" />
            <stop offset="60%" stopColor="#fffbb8" />
            <stop offset="100%" stopColor="#ffffff" />
          </linearGradient>

          {/* Top-Right angled bevel */}
          <linearGradient id="topRightBevel" x1="325" y1="20" x2="365" y2="60" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="45%" stopColor="#fff398" />
            <stop offset="100%" stopColor="#ffd836" />
          </linearGradient>

          {/* Bottom shadow bevel gradient */}
          <linearGradient id="bottomBevel" x1="220" y1="90" x2="220" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ff9a00" />
            <stop offset="50%" stopColor="#ea6500" />
            <stop offset="100%" stopColor="#cf4400" />
          </linearGradient>

          {/* Bottom-Left angled bevel */}
          <linearGradient id="bottomLeftBevel" x1="89" y1="60" x2="115" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffa800" />
            <stop offset="55%" stopColor="#ee6e00" />
            <stop offset="100%" stopColor="#d24600" />
          </linearGradient>

          {/* Bottom-Right angled bevel */}
          <linearGradient id="bottomRightBevel" x1="351" y1="60" x2="325" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffa000" />
            <stop offset="55%" stopColor="#ec6700" />
            <stop offset="100%" stopColor="#cc4000" />
          </linearGradient>

          {/* Main golden yellow-to-orange inner face gradient */}
          <linearGradient id="innerFace" x1="220" y1="30" x2="220" y2="90" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fffb54" />
            <stop offset="26%" stopColor="#ffdf22" />
            <stop offset="68%" stopColor="#ffba00" />
            <stop offset="100%" stopColor="#ff9600" />
          </linearGradient>

          {/* Top gloss reflection arc */}
          <linearGradient id="glossReflection" x1="220" y1="30" x2="220" y2="60" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
            <stop offset="55%" stopColor="#ffffff" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>

          {/* Speed streak gradients */}
          <linearGradient id="streakTopLeft" x1="20" y1="56" x2="64" y2="56" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffe638" stopOpacity="0.15" />
            <stop offset="50%" stopColor="#fff666" />
            <stop offset="100%" stopColor="#ffea35" />
          </linearGradient>

          <linearGradient id="streakBottomLeft" x1="48" y1="69" x2="66" y2="69" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ff9800" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#ffa726" />
          </linearGradient>

          <linearGradient id="streakTopRight" x1="376" y1="56" x2="420" y2="56" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffea35" />
            <stop offset="50%" stopColor="#fff666" />
            <stop offset="100%" stopColor="#ffe638" stopOpacity="0.15" />
          </linearGradient>

          <linearGradient id="streakBottomRight" x1="374" y1="69" x2="392" y2="69" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffa726" />
            <stop offset="100%" stopColor="#ff9800" stopOpacity="0.2" />
          </linearGradient>

          {/* Sparkle Glint Glow Filter */}
          <filter id="glintFilter" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Speed blur filter */}
          <filter id="speedBlur" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3.5" />
          </filter>
        </defs>

        {/* Ambient gold background aura */}
        <ellipse cx="220" cy="60" rx="160" ry="42" fill="#ffb700" opacity="0.35" filter="url(#speedBlur)" />

        {/* Left Speed Streaks */}
        {/* Ambient speed glow on left */}
        <line x1="24" y1="56" x2="62" y2="56" stroke="#ffb300" strokeWidth="12" strokeLinecap="round" opacity="0.45" filter="url(#speedBlur)" />
        {/* Main top left streak */}
        <line x1="20" y1="56" x2="64" y2="56" stroke="url(#streakTopLeft)" strokeWidth="5.5" strokeLinecap="round" />
        {/* Shorter lower left streak */}
        <line x1="48" y1="69" x2="66" y2="69" stroke="url(#streakBottomLeft)" strokeWidth="4" strokeLinecap="round" />

        {/* Right Speed Streaks */}
        {/* Ambient speed glow on right */}
        <line x1="378" y1="56" x2="416" y2="56" stroke="#ffb300" strokeWidth="12" strokeLinecap="round" opacity="0.45" filter="url(#speedBlur)" />
        {/* Main top right streak */}
        <line x1="376" y1="56" x2="420" y2="56" stroke="url(#streakTopRight)" strokeWidth="5.5" strokeLinecap="round" />
        {/* Shorter lower right streak */}
        <line x1="374" y1="69" x2="392" y2="69" stroke="url(#streakBottomRight)" strokeWidth="4" strokeLinecap="round" />

        {/* Outer Shadow behind button */}
        <polygon
          points="75,60 115,20 325,20 365,60 325,100 115,100"
          fill="#400311"
          opacity="0.75"
          transform="translate(0, 4.5)"
        />

        {/* Button Base Rim / Foundation */}
        <polygon
          points="75,60 115,20 325,20 365,60 325,100 115,100"
          fill="#d04800"
          stroke="#b83800"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />

        {/* 3D Beveled Facets */}
        {/* Top Bevel */}
        <polygon points="115,20 325,20 321,30 119,30" fill="url(#topBevel)" />

        {/* Top-Left Bevel */}
        <polygon points="75,60 115,20 119,30 89,60" fill="url(#topLeftBevel)" />

        {/* Top-Right Bevel */}
        <polygon points="325,20 365,60 351,60 321,30" fill="url(#topRightBevel)" />

        {/* Bottom Bevel */}
        <polygon points="325,100 115,100 119,90 321,90" fill="url(#bottomBevel)" />

        {/* Bottom-Left Bevel */}
        <polygon points="115,100 75,60 89,60 119,90" fill="url(#bottomLeftBevel)" />

        {/* Bottom-Right Bevel */}
        <polygon points="365,60 325,100 321,90 351,60" fill="url(#bottomRightBevel)" />

        {/* Crystal Bevel Ridge Highlights */}
        <line x1="115" y1="20" x2="119" y2="30" stroke="#ffffff" strokeWidth="1.2" opacity="0.85" />
        <line x1="325" y1="20" x2="321" y2="30" stroke="#ffffff" strokeWidth="1.2" opacity="0.85" />
        <line x1="75" y1="60" x2="89" y2="60" stroke="#fff4a0" strokeWidth="1.5" />
        <line x1="365" y1="60" x2="351" y2="60" stroke="#ffd950" strokeWidth="1.5" />
        <line x1="115" y1="100" x2="119" y2="90" stroke="#992e00" strokeWidth="1.2" opacity="0.6" />
        <line x1="325" y1="100" x2="321" y2="90" stroke="#992e00" strokeWidth="1.2" opacity="0.6" />

        {/* Outer Specular Razor Highlights */}
        {/* Top Edge */}
        <line x1="116" y1="20" x2="324" y2="20" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" />
        {/* Top-Left Slant */}
        <line x1="76" y1="59" x2="115" y2="20" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
        {/* Top-Right Slant */}
        <line x1="325" y1="20" x2="364" y2="59" stroke="#fff6a8" strokeWidth="1.8" strokeLinecap="round" />
        {/* Bottom-Right Specular Edge (visible in reference image) */}
        <line x1="325" y1="100" x2="364" y2="61" stroke="#ffeb85" strokeWidth="2" strokeLinecap="round" />

        {/* Inner Main Face */}
        <polygon points="89,60 119,30 321,30 351,60 321,90 119,90" fill="url(#innerFace)" />

        {/* Inner Face Perimeter Groove/Chisel Line */}
        <polygon
          points="89,60 119,30 321,30 351,60 321,90 119,90"
          fill="none"
          stroke="#cc7300"
          strokeWidth="1.2"
          opacity="0.45"
        />

        {/* Gloss Overlay on upper half of inner face */}
        <path d="M 89,60 L 119,30 L 321,30 L 351,60 Q 220,44 89,60 Z" fill="url(#glossReflection)" />

        {/* Corner Specular Glints (Crystal Sparkles) */}
        <circle cx="115" cy="20" r="3.6" fill="#ffffff" filter="url(#glintFilter)" />
        <circle cx="325" cy="20" r="3.4" fill="#ffffff" filter="url(#glintFilter)" />
        <circle cx="325" cy="100" r="2.8" fill="#fff7b0" filter="url(#glintFilter)" />

        {/* Center Content: Maroon Play Triangle + Maroon PLAY text */}
        {/* Play Triangle with rounded corners */}
        <polygon
          points="146,45 171,60 146,75"
          fill="#62021c"
          stroke="#62021c"
          strokeWidth="4.5"
          strokeLinejoin="round"
        />

        {/* PLAY text */}
        <text
          x="188"
          y="60"
          dominantBaseline="central"
          fontFamily="'Montserrat', 'Arial Black', -apple-system, system-ui, sans-serif"
          fontSize="35"
          fontWeight="900"
          fill="#62021c"
          letterSpacing="2.5"
        >
          PLAY
        </text>
      </svg>
    </button>
  );
}
