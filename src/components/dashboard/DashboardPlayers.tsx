import { useState, useMemo, useEffect } from 'react';
import { IconSearch, IconCoin } from './DashboardIcons';
import { popularApi } from '../../services/popularApi';
import type { BrandPlayer, BrandPlayerSession } from '../../types/customer';
import { PlayerDetailsModal } from './PlayerDetailsModal';

export function DashboardPlayers() {
  const [search, setSearch] = useState('');
  const [playersList, setPlayersList] = useState<BrandPlayer[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState<BrandPlayer | null>(null);
  const [sessions, setSessions] = useState<BrandPlayerSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  // Fetch real players of Popular Electricals Qatar from PostgreSQL database
  useEffect(() => {
    setLoadingPlayers(true);
    popularApi
      .getBrandPlayers('popular-electricals-qatar')
      .then((realPlayers) => {
        setPlayersList(realPlayers || []);
      })
      .catch((err) => {
        console.error('Failed to fetch Popular players:', err);
        setPlayersList([]);
      })
      .finally(() => {
        setLoadingPlayers(false);
      });
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return playersList;
    const q = search.toLowerCase().trim();
    return playersList.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.fullPhone.replace(/\s+/g, '').includes(q.replace(/\s+/g, '')) ||
        (p.showroom && p.showroom.toLowerCase().includes(q))
    );
  }, [search, playersList]);

  // Open player details modal and fetch all games played by this user under Popular Electricals Qatar
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
    <div className="pet-dashboard-players">
      <div className="pet-panel-card">
        <div className="pet-panel-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div className="pet-panel-title">Popular Electricals Players</div>
            <span style={{ fontSize: '13px', color: '#64748B' }}>
              {loadingPlayers
                ? 'Loading players from database...'
                : `${filtered.length} customers registered for Sparky Run`}
            </span>
          </div>

          <div style={{ minWidth: '240px', position: 'relative' }}>
            <span
              style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94A3B8',
                display: 'flex',
              }}
            >
              <IconSearch />
            </span>
            <input
              type="text"
              className="pet-search-input"
              style={{ padding: '8px 14px 8px 34px' }}
              placeholder="Search by name, phone (+974)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="pet-table-container">
          <table className="pet-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone Number</th>
                <th>Showroom</th>
                <th>Games Played</th>
                <th>Best Score (Coins)</th>
                <th>Total Score (Coins)</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loadingPlayers ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: '#64748B' }}>
                    Loading players from database...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: '#64748B' }}>
                    No players found for Popular Electricals.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => handleOpenPlayerModal(p)}
                    style={{ cursor: 'pointer', transition: 'background-color 0.15s ease' }}
                    title="Click to view full game history"
                  >
                    <td style={{ fontWeight: 600, color: '#0F172A' }}>{p.name}</td>
                    <td style={{ color: '#475569' }}>{p.fullPhone}</td>
                    <td style={{ color: '#475569' }}>{p.showroom || 'Najma / Barwa'}</td>
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
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <span>{p.bestScore.toLocaleString()}</span>
                        <IconCoin style={{ width: 13, height: 13 }} />
                      </span>
                    </td>
                    <td style={{ color: '#0F172A', fontWeight: 600 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <span>{p.totalScore.toLocaleString()}</span>
                        <IconCoin style={{ width: 13, height: 13, color: '#64748B' }} />
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="pet-btn-action"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenPlayerModal(p);
                        }}
                      >
                        View Games
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Details & All Games Played Modal (Clean: No Showroom/Brand clutter, Horizontal Date Cards) */}
      <PlayerDetailsModal
        player={selectedPlayer}
        sessions={sessions}
        loadingSessions={loadingSessions}
        onClose={handleCloseModal}
      />
    </div>
  );
}
