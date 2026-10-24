import { useState, useEffect } from 'react';
import { IconArrowRight } from './DashboardIcons';
import { popularApi } from '../../services/popularApi';
import type { BrandPlayer, BrandPlayerSession } from '../../types/customer';
import { PlayerDetailsModal } from './PlayerDetailsModal';

interface DashboardHomeProps {
  onNavigateTab: (tab: 'home' | 'players' | 'rewards') => void;
}

export function DashboardHome({ onNavigateTab }: DashboardHomeProps) {
  const [players, setPlayers] = useState<BrandPlayer[]>([]);
  const [loading, setLoading] = useState(true);

  // Player Details Modal State
  const [selectedPlayer, setSelectedPlayer] = useState<BrandPlayer | null>(null);
  const [sessions, setSessions] = useState<BrandPlayerSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  useEffect(() => {
    popularApi
      .getBrandPlayers('popular-electricals-qatar')
      .then((data) => {
        setPlayers(data || []);
      })
      .catch(() => {
        setPlayers([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const totalPlayersCount = players.length;
  const totalGamesPlayed = players.reduce((sum, p) => sum + (p.gamesPlayed || 0), 0);

  // Sorted by highest score
  const allPlayers = [...players].sort((a, b) => b.bestScore - a.bestScore);

  // Open player modal instantly on home
  const handleOpenPlayerModal = async (player: BrandPlayer) => {
    setSelectedPlayer(player);
    setLoadingSessions(true);

    try {
      const res = await popularApi.getPlayerBrandSessions(player.id, 'popular-electricals-qatar');
      if (res && res.sessions) {
        setSessions(res.sessions);
      } else {
        setSessions([]);
      }
    } catch (err) {
      console.error('Failed to load player sessions:', err);
      setSessions([]);
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleCloseModal = () => {
    setSelectedPlayer(null);
    setSessions([]);
  };

  return (
    <div className="pet-dashboard-home">
      {/* 2 Minimal Metric Cards: Registered Players & Games Played */}
      <div className="pet-kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
        <div className="pet-kpi-card">
          <div className="pet-kpi-label">Total Registered Players</div>
          <div className="pet-kpi-value">{loading ? '...' : totalPlayersCount}</div>
          <div style={{ fontSize: '12px', color: '#10B981', fontWeight: 600 }}>Active in database</div>
        </div>

        <div className="pet-kpi-card">
          <div className="pet-kpi-label">Total Games Played</div>
          <div className="pet-kpi-value">{loading ? '...' : totalGamesPlayed}</div>
          <div style={{ fontSize: '12px', color: '#64748B' }}>Sparky Run sessions</div>
        </div>
      </div>

      {/* All Players Table */}
      <div className="pet-panel-card">
        <div className="pet-panel-header">
          <div>
            <div className="pet-panel-title">All Registered Players</div>
            <span style={{ fontSize: '13px', color: '#64748B' }}>
              Click on any player to instantly view their game session history
            </span>
          </div>
          {onNavigateTab && (
            <button
              type="button"
              className="pet-btn-action"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              onClick={() => onNavigateTab('players')}
            >
              <span>Players Tab</span>
              <IconArrowRight />
            </button>
          )}
        </div>

        <div className="pet-table-container">
          <table className="pet-table">
            <thead>
              <tr>
                <th style={{ width: '50px', textAlign: 'center' }}>#</th>
                <th>Name</th>
                <th>Phone Number</th>
                <th>Games Played</th>
                <th>Best Score</th>
                <th>Total Score</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: '#64748B' }}>
                    Loading players...
                  </td>
                </tr>
              ) : allPlayers.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: '#64748B' }}>
                    No players found yet.
                  </td>
                </tr>
              ) : (
                allPlayers.map((p, index) => (
                  <tr
                    key={p.id}
                    onClick={() => handleOpenPlayerModal(p)}
                    style={{ cursor: 'pointer' }}
                    title="Click to view game history"
                  >
                    <td style={{ textAlign: 'center', fontWeight: 700, color: '#94A3B8' }}>
                      #{index + 1}
                    </td>
                    <td style={{ fontWeight: 600, color: '#0F172A' }}>{p.name}</td>
                    <td style={{ color: '#475569' }}>{p.fullPhone}</td>
                    <td style={{ color: '#0F172A', fontWeight: 500 }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: '#F1F5F9',
                          fontSize: '12px',
                          fontWeight: 600,
                        }}
                      >
                        {p.gamesPlayed} {p.gamesPlayed === 1 ? 'game' : 'games'}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: '#ED1C24' }}>
                      {p.bestScore.toLocaleString()}
                    </td>
                    <td style={{ color: '#0F172A', fontWeight: 600 }}>
                      {p.totalScore.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Instant Player Modal (Clean: No Showroom / Brand / Game Clutter, Horizontal Date Cards) */}
      <PlayerDetailsModal
        player={selectedPlayer}
        sessions={sessions}
        loadingSessions={loadingSessions}
        onClose={handleCloseModal}
      />
    </div>
  );
}
