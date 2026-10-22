import { toggleMute, useIsMuted } from '../../game/audio';

export function MuteButton() {
  const muted = useIsMuted();

  return (
    <button
      type="button"
      className="audio-toggle-btn"
      onClick={(e) => {
        e.currentTarget.blur();
        toggleMute();
      }}
      aria-label={muted ? 'Unmute BGM' : 'Mute BGM'}
      title={muted ? 'Unmute BGM' : 'Mute BGM'}
    >
      {muted ? (
        // Speaker with X / Muted icon
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="audio-icon">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" />
          <line x1="22" y1="9" x2="16" y2="15" />
          <line x1="16" y1="9" x2="22" y2="15" />
        </svg>
      ) : (
        // Speaker with audio waves
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="audio-icon">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        </svg>
      )}
    </button>
  );
}
