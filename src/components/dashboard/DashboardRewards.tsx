interface WeeklyWinner {
  id: string;
  week: string;
  name: string;
  phone: string;
  score: number;
  prize: string;
}

interface SpecialGiftWinner {
  id: string;
  date: string;
  name: string;
  phone: string;
  gift: string;
  code: string;
  showroom: string;
}

const MOCK_WEEKLY_WINNERS: WeeklyWinner[] = [
  { id: 'w1', week: '14 Oct – 20 Oct 2026', name: 'Ravi Subramanian', phone: '+974 5512 8940', score: 92400, prize: 'PET Gift Bag' },
  { id: 'w2', week: '07 Oct – 13 Oct 2026', name: 'Ali Al-Hammadi', phone: '+974 3349 1022', score: 87100, prize: 'PET Gift Bag' },
  { id: 'w3', week: '30 Sep – 06 Oct 2026', name: 'Fahad Al-Marri', phone: '+974 6618 4390', score: 81500, prize: 'PET Gift Bag' },
  { id: 'w4', week: '23 Sep – 29 Sep 2026', name: 'Sultan Al-Kuwari', phone: '+974 5023 7741', score: 76800, prize: 'PET Gift Bag' },
  { id: 'w5', week: '16 Sep – 22 Sep 2026', name: 'Ahmed Bin Salem', phone: '+974 7790 3125', score: 72300, prize: 'PET Gift Bag' },
];

const MOCK_SPECIAL_GIFT_WINNERS: SpecialGiftWinner[] = [
  { id: 'g1', date: '23 Oct 2026', name: 'Mohammed Al-Kuwari', phone: '+974 3349 1022', gift: 'LuLu 100 QAR Voucher', code: 'LULU-8921-QA', showroom: 'Barwa Village' },
  { id: 'g2', date: '22 Oct 2026', name: 'Fatima Al-Thani', phone: '+974 6618 4390', gift: 'LuLu 100 QAR Voucher', code: 'LULU-7714-QA', showroom: 'Najma' },
  { id: 'g3', date: '21 Oct 2026', name: 'Pradeep Sharma', phone: '+974 5588 2309', gift: 'LuLu 100 QAR Voucher', code: 'LULU-6409-QA', showroom: 'Najma' },
  { id: 'g4', date: '19 Oct 2026', name: 'Tariq Mansoor', phone: '+974 5023 7741', gift: 'LuLu 100 QAR Voucher', code: 'LULU-5182-QA', showroom: 'Barwa Village' },
  { id: 'g5', date: '17 Oct 2026', name: 'Jassim Al-Emadi', phone: '+974 6645 1928', gift: 'LuLu 100 QAR Voucher', code: 'LULU-4033-QA', showroom: 'Najma' },
];

export function DashboardRewards() {
  return (
    <div className="pet-dashboard-rewards">
      {/* 1. Weekly Winners Table */}
      <div className="pet-panel-card" style={{ marginBottom: '24px' }}>
        <div className="pet-panel-header">
          <div className="pet-panel-title">Weekly Winners</div>
          <span style={{ fontSize: '13px', color: '#64748B' }}>1 winner per week (PET Gift Bag)</span>
        </div>

        <div className="pet-table-container">
          <table className="pet-table">
            <thead>
              <tr>
                <th>Week</th>
                <th>Name</th>
                <th>Phone Number</th>
                <th>Score</th>
                <th>Prize</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_WEEKLY_WINNERS.map((w) => (
                <tr key={w.id}>
                  <td style={{ color: '#64748B' }}>{w.week}</td>
                  <td style={{ fontWeight: 600, color: '#0F172A' }}>{w.name}</td>
                  <td style={{ color: '#475569' }}>{w.phone}</td>
                  <td style={{ fontWeight: 700, color: '#ED1C24' }}>{w.score.toLocaleString()}</td>
                  <td>
                    <span className="pet-badge verified">{w.prize}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Special Gift Winners (LuLu 100 Riyal Voucher) Table */}
      <div className="pet-panel-card">
        <div className="pet-panel-header">
          <div className="pet-panel-title">Special Gift Winners (In-Game Voucher)</div>
          <span style={{ fontSize: '13px', color: '#64748B' }}>LuLu 100 QAR Track Pickups</span>
        </div>

        <div className="pet-table-container">
          <table className="pet-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Name</th>
                <th>Phone Number</th>
                <th>Voucher Code</th>
                <th>Showroom</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_SPECIAL_GIFT_WINNERS.map((g) => (
                <tr key={g.id}>
                  <td style={{ color: '#64748B' }}>{g.date}</td>
                  <td style={{ fontWeight: 600, color: '#0F172A' }}>{g.name}</td>
                  <td style={{ color: '#475569' }}>{g.phone}</td>
                  <td>
                    <code style={{ background: '#FEE2E2', color: '#ED1C24', padding: '3px 8px', borderRadius: '4px', fontSize: '12px' }}>
                      {g.code}
                    </code>
                  </td>
                  <td style={{ color: '#475569' }}>{g.showroom}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
