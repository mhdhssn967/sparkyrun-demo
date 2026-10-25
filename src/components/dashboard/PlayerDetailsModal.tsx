import { IconClose, IconClock, IconCoin } from './DashboardIcons';
import type { BrandPlayer, BrandPlayerSession } from '../../types/customer';

interface PlayerDetailsModalProps {
  player: BrandPlayer | null;
  sessions: BrandPlayerSession[];
  loadingSessions: boolean;
  onClose: () => void;
}

function formatDuration(seconds?: number): string {
  if (!seconds || seconds <= 0) return '0s';
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

function formatTime(isoStr?: string): string {
  if (!isoStr) return '';
  try {
    const d = new Date(isoStr);
    return d.toLocaleTimeString('en-GB', {
      timeZone: 'Asia/Qatar',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '';
  }
}

interface DateSessionGroup {
  dateStr: string;
  games: BrandPlayerSession[];
}

function groupSessionsByDate(sessions: BrandPlayerSession[]): DateSessionGroup[] {
  const groups: { [key: string]: BrandPlayerSession[] } = {};

  sessions.forEach((s) => {
    const rawDate = s.completedAt || s.startedAt;
    let dateKey = 'Other Sessions';
    if (rawDate) {
      try {
        const d = new Date(rawDate);
        dateKey = d.toLocaleDateString('en-GB', {
          timeZone: 'Asia/Qatar',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });
      } catch {
        dateKey = String(rawDate).split('T')[0] || 'Other Sessions';
      }
    }

    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(s);
  });

  return Object.keys(groups).map((dateStr) => ({
    dateStr,
    games: groups[dateStr],
  }));
}

export function PlayerDetailsModal({
  player,
  sessions,
  loadingSessions,
  onClose,
}: PlayerDetailsModalProps) {
  if (!player) return null;

  const groupedSessions = groupSessionsByDate(sessions);

  return (
    <div className="pet-modal-overlay" onClick={onClose}>
      <div className="pet-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header: Only Name and Phone Number (No showroom, brand, game clutter) */}
        <div className="pet-modal-header">
          <div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>
              {player.name}
            </div>
            <div style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>
              {player.fullPhone}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#64748B',
              cursor: 'pointer',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              borderRadius: '6px',
            }}
            aria-label="Close modal"
          >
            <IconClose />
          </button>
        </div>

        {/* Modal Body */}
        <div className="pet-modal-body">
          {/* Summary Cards: Only Games Played, Best Score, Total Score */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px',
              marginBottom: '20px',
            }}
          >
            <div
              style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                padding: '12px 14px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  color: '#64748B',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                }}
              >
                Games Played
              </div>
              <div
                style={{
                  fontSize: '22px',
                  fontWeight: 800,
                  color: '#0F172A',
                  marginTop: '4px',
                }}
              >
                {player.gamesPlayed}
              </div>
            </div>

            <div
              style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                padding: '12px 14px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  color: '#64748B',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                }}
              >
                Best Score
              </div>
              <div
                style={{
                  fontSize: '22px',
                  fontWeight: 800,
                  color: '#ED1C24',
                  marginTop: '4px',
                }}
              >
                {player.bestScore.toLocaleString()}
              </div>
            </div>

            <div
              style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                padding: '12px 14px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  color: '#64748B',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                }}
              >
                Total Score
              </div>
              <div
                style={{
                  fontSize: '22px',
                  fontWeight: 800,
                  color: '#0F172A',
                  marginTop: '4px',
                }}
              >
                {player.totalScore.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Sessions Display: Horizontal Cards Grouped by Date */}
          <div>
            {loadingSessions ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '36px',
                  color: '#64748B',
                  fontSize: '13px',
                }}
              >
                Loading games history...
              </div>
            ) : sessions.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '36px',
                  color: '#64748B',
                  fontSize: '13px',
                  background: '#F8FAFC',
                  borderRadius: '8px',
                  border: '1px dashed #CBD5E1',
                }}
              >
                No game sessions recorded yet for this player.
              </div>
            ) : (
              groupedSessions.map((group) => (
                <div key={group.dateStr} className="pet-date-group">
                  {/* Date Heading */}
                  <div className="pet-date-header">
                    <span className="pet-date-dot" />
                    <span>{group.dateStr}</span>
                    <span className="pet-date-count">
                      ({group.games.length} {group.games.length === 1 ? 'game' : 'games'})
                    </span>
                  </div>

                  {/* Horizontal Cards for each game */}
                  <div className="pet-game-card-list">
                    {group.games.map((g, idx) => {
                      const overallIndex = sessions.length - sessions.indexOf(g);
                      return (
                        <div
                          key={g.id || idx}
                          className="pet-game-card-horizontal"
                        >
                          {/* Left: Game Number and Time */}
                          <div className="pet-game-card-left">
                            <div className="pet-game-card-num">
                              #{overallIndex}
                            </div>
                            <div>
                              <div className="pet-game-card-title">
                                Game Session #{overallIndex}
                              </div>
                              <div className="pet-game-card-time">
                                <IconClock style={{ width: '12px', height: '12px', color: '#94A3B8' }} />
                                <span>{formatTime(g.completedAt || g.startedAt)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Right: Duration & Score */}
                          <div className="pet-game-card-right">
                            <div className="pet-game-stat">
                              <div className="pet-game-stat-label">
                                Duration
                              </div>
                              <div className="pet-game-stat-val">
                                {formatDuration(g.duration)}
                              </div>
                            </div>

                            <div className="pet-game-stat" style={{ minWidth: '70px' }}>
                              <div className="pet-game-stat-label">
                                Score
                              </div>
                              <div className="pet-game-stat-val score" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <span>{g.score.toLocaleString()}</span>
                                <IconCoin style={{ width: 13, height: 13 }} />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid var(--pet-border)',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <button
            type="button"
            className="pet-btn-action"
            onClick={onClose}
            style={{ padding: '8px 20px', fontSize: '13px' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
