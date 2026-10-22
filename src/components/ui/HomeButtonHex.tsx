interface HomeButtonHexProps {
  onClick: () => void;
  className?: string;
}

export function HomeButtonHex({ onClick, className = '' }: HomeButtonHexProps) {
  return (
    <button
      id="back-home-button"
      className={`hex-home-btn ${className}`}
      onClick={onClick}
      type="button"
      aria-label="Back to Homepage"
    >
      <svg
        className="hex-home-svg"
        viewBox="0 0 300 74"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Top highlight bevel - Ice Cyan */}
          <linearGradient id="homeTopBevel" x1="150" y1="8" x2="150" y2="15" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="40%" stopColor="#e4fcff" />
            <stop offset="100%" stopColor="#7ae7f8" />
          </linearGradient>

          {/* Top-Left bevel */}
          <linearGradient id="homeTopLeftBevel" x1="14" y1="37" x2="42" y2="8" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#6be0f5" />
            <stop offset="60%" stopColor="#d8f9ff" />
            <stop offset="100%" stopColor="#ffffff" />
          </linearGradient>

          {/* Top-Right bevel */}
          <linearGradient id="homeTopRightBevel" x1="258" y1="8" x2="286" y2="37" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="45%" stopColor="#c8f5fc" />
            <stop offset="100%" stopColor="#68e0f5" />
          </linearGradient>

          {/* Bottom shadow bevel - Sapphire / Deep Teal */}
          <linearGradient id="homeBottomBevel" x1="150" y1="59" x2="150" y2="66" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0079a1" />
            <stop offset="50%" stopColor="#00597a" />
            <stop offset="100%" stopColor="#003d54" />
          </linearGradient>

          {/* Bottom-Left bevel */}
          <linearGradient id="homeBottomLeftBevel" x1="24" y1="37" x2="42" y2="66" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#008cb8" />
            <stop offset="55%" stopColor="#006082" />
            <stop offset="100%" stopColor="#00435c" />
          </linearGradient>

          {/* Bottom-Right bevel */}
          <linearGradient id="homeBottomRightBevel" x1="276" y1="37" x2="258" y2="66" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#008cb8" />
            <stop offset="55%" stopColor="#006082" />
            <stop offset="100%" stopColor="#00435c" />
          </linearGradient>

          {/* Inner Face Radiant Ice Sapphire */}
          <linearGradient id="homeInnerFace" x1="150" y1="15" x2="150" y2="59" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#dafaff" />
            <stop offset="28%" stopColor="#55e2f5" />
            <stop offset="68%" stopColor="#00a8c4" />
            <stop offset="100%" stopColor="#008099" />
          </linearGradient>

          {/* Inner Face Top Gloss reflection */}
          <linearGradient id="homeGloss" x1="150" y1="15" x2="150" y2="37" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
            <stop offset="60%" stopColor="#ffffff" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>

          {/* Glint Filter */}
          <filter id="homeGlintFilter" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Outer Shadow behind button */}
        <polygon
          points="14,37 42,8 258,8 286,37 258,66 42,66"
          fill="#011b24"
          opacity="0.65"
          transform="translate(0, 3)"
        />

        {/* Base Bevel Rim */}
        <polygon
          points="14,37 42,8 258,8 286,37 258,66 42,66"
          fill="#005e80"
          stroke="#00465f"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />

        {/* 3D Beveled Facets */}
        <polygon points="42,8 258,8 252,15 48,15" fill="url(#homeTopBevel)" />
        <polygon points="14,37 42,8 48,15 24,37" fill="url(#homeTopLeftBevel)" />
        <polygon points="258,8 286,37 276,37 252,15" fill="url(#homeTopRightBevel)" />
        <polygon points="258,66 42,66 48,59 252,59" fill="url(#homeBottomBevel)" />
        <polygon points="42,66 14,37 24,37 48,59" fill="url(#homeBottomLeftBevel)" />
        <polygon points="286,37 258,66 252,59 276,37" fill="url(#homeBottomRightBevel)" />

        {/* Ridge Highlights */}
        <line x1="42" y1="8" x2="48" y2="15" stroke="#ffffff" strokeWidth="1" opacity="0.85" />
        <line x1="258" y1="8" x2="252" y2="15" stroke="#ffffff" strokeWidth="1" opacity="0.85" />
        <line x1="14" y1="37" x2="24" y2="37" stroke="#e0fcff" strokeWidth="1.3" />
        <line x1="286" y1="37" x2="276" y2="37" stroke="#bdf7ff" strokeWidth="1.3" />
        <line x1="42" y1="66" x2="48" y2="59" stroke="#00354a" strokeWidth="1" opacity="0.5" />
        <line x1="258" y1="66" x2="252" y2="59" stroke="#00354a" strokeWidth="1" opacity="0.5" />

        {/* Specular Razor Edge Highlights */}
        <line x1="43" y1="8" x2="257" y2="8" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
        <line x1="15" y1="36" x2="42" y2="8" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="258" y1="8" x2="285" y2="36" stroke="#e2fbff" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="258" y1="66" x2="285" y2="38" stroke="#a6f4ff" strokeWidth="1.6" strokeLinecap="round" />

        {/* Inner Main Face */}
        <polygon points="24,37 48,15 252,15 276,37 252,59 48,59" fill="url(#homeInnerFace)" />

        {/* Inner Face Perimeter Groove */}
        <polygon
          points="24,37 48,15 252,15 276,37 252,59 48,59"
          fill="none"
          stroke="#006680"
          strokeWidth="0.9"
          opacity="0.4"
        />

        {/* Gloss Overlay */}
        <path d="M 24,37 L 48,15 L 252,15 L 276,37 Q 150,26 24,37 Z" fill="url(#homeGloss)" />

        {/* Sparkle Glints */}
        <circle cx="42" cy="8" r="2.8" fill="#ffffff" filter="url(#homeGlintFilter)" />
        <circle cx="258" cy="8" r="2.6" fill="#ffffff" filter="url(#homeGlintFilter)" />
        <circle cx="258" cy="66" r="2.2" fill="#c4f7ff" filter="url(#homeGlintFilter)" />

        {/* Center Content: Home Icon + BACK TO HOME Text */}
        <g>
          {/* Home Icon */}
          <g transform="translate(62, 27)">
            {/* Roof */}
            <path d="M1 9L10 2L19 9" fill="none" stroke="#022430" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            {/* Body */}
            <path d="M4 8V18H16V8" fill="none" stroke="#022430" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            {/* Door */}
            <rect x="8" y="12" width="4" height="6" fill="#022430" rx="0.5" />
          </g>

          {/* BACK TO HOME Text */}
          <text
            x="91"
            y="37"
            dominantBaseline="central"
            fontFamily="'Montserrat', 'Arial Black', -apple-system, system-ui, sans-serif"
            fontSize="15.5"
            fontWeight="900"
            fill="#022430"
            letterSpacing="1.5"
          >
            BACK TO HOME
          </text>
        </g>
      </svg>
    </button>
  );
}
