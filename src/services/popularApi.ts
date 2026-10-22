import type {
  BrandReward,
  ClaimedVoucher,
  CustomerProfile,
  DailyDateWinnersGroup,
  LeaderboardEntry,
  LiveClaimEvent,
} from '../types/customer';

const STORAGE_KEY_CUSTOMER = 'popular_customer_profile';
const STORAGE_KEY_VOUCHERS = 'popular_claimed_vouchers';
const STORAGE_KEY_LOCAL_RUNS = 'popular_local_runs';

const API_BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) ||
  '/api';

/** Helper to mask a phone number for privacy: "+974 55123456" -> "+974 55***456" */
export function maskPhoneNumber(fullPhone: string): string {
  const parts = fullPhone.trim().split(' ');
  if (parts.length === 2) {
    const dial = parts[0];
    const num = parts[1];
    if (num.length >= 6) {
      const start = num.slice(0, 2);
      const end = num.slice(-3);
      return `${dial} ${start}***${end}`;
    }
  }
  if (fullPhone.length >= 8) {
    return `${fullPhone.slice(0, 5)}***${fullPhone.slice(-3)}`;
  }
  return fullPhone;
}

/** Returns the current date in Qatar AST (UTC+3) formatted as YYYY-MM-DD */
export function getQatarTodayDate(): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Qatar',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

/** Formats a timestamp into human-readable Qatar time display */
export function formatQatarDateDisplay(timestamp: number): string {
  const today = getQatarTodayDate();
  const entryDate = new Date(timestamp).toLocaleDateString('en-CA', {
    timeZone: 'Asia/Qatar',
  });

  const timeStr = new Date(timestamp).toLocaleTimeString('en-US', {
    timeZone: 'Asia/Qatar',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  if (entryDate === today) {
    return `Today ${timeStr}`;
  }

  const dateStr = new Date(timestamp).toLocaleDateString('en-GB', {
    timeZone: 'Asia/Qatar',
    day: 'numeric',
    month: 'short',
  });
  return `${dateStr} ${timeStr}`;
}

// -------------------------------------------------------------
// Official Merchandise Rewards Catalogue for Popular Electricals Qatar
// -------------------------------------------------------------
export const POPULAR_BRAND_REWARDS: BrandReward[] = [
  {
    id: 'pop-reward-keychain',
    title: 'Keychain',
    desc: 'Official Popular Electricals Sparky Keychain',
    discountValue: 'KEYCHAIN',
    terms: 'Claim at Popular Electricals showroom counter with verified SMS/phone confirmation.',
    requiredDistance: 0,
    requiredCoins: 7000,
    icon: '🔑',
  },
  {
    id: 'pop-reward-keychain-cap',
    title: 'Keychain + Cap',
    desc: 'Sparky Keychain + Official Cap',
    discountValue: 'KEYCHAIN + CAP',
    terms: 'Claim at Popular Electricals showroom counter with verified SMS/phone confirmation.',
    requiredDistance: 0,
    requiredCoins: 10000,
    icon: '🧢',
  },
  {
    id: 'pop-reward-keychain-pen',
    title: 'Keychain + Pen',
    desc: 'Sparky Keychain + Executive Pen',
    discountValue: 'KEYCHAIN + PEN',
    terms: 'Claim at Popular Electricals showroom counter with verified SMS/phone confirmation.',
    requiredDistance: 0,
    requiredCoins: 16000,
    icon: '✒️',
  },
  {
    id: 'pop-reward-diary',
    title: 'Diary',
    desc: 'Popular Electricals Executive Diary',
    discountValue: 'DIARY',
    terms: 'Claim at Popular Electricals showroom counter with verified SMS/phone confirmation.',
    requiredDistance: 0,
    requiredCoins: 20000,
    icon: '📔',
  },
  {
    id: 'pop-reward-shirt',
    title: 'Shirt',
    desc: 'Popular Electricals Official Shirt',
    discountValue: 'SHIRT',
    terms: 'Claim at Popular Electricals showroom counter with verified SMS/phone confirmation.',
    requiredDistance: 0,
    requiredCoins: 30000,
    icon: '👕',
  },
];

// Baseline Qatar Leaderboard entries for Today and Global
const SEED_LEADERBOARD: Omit<LeaderboardEntry, 'rank'>[] = [
  {
    customerId: 'cust-101',
    displayName: 'Salem Al-Kuwari',
    maskedPhone: '+974 55***891',
    score: 4820,
    coins: 384,
    date: getQatarTodayDate(),
    dateDisplay: 'Today 10:45 AM',
    timestamp: Date.now() - 1000 * 60 * 35,
  },
  {
    customerId: 'cust-102',
    displayName: 'Mohammed Al-Thani',
    maskedPhone: '+974 66***412',
    score: 3950,
    coins: 310,
    date: getQatarTodayDate(),
    dateDisplay: 'Today 09:20 AM',
    timestamp: Date.now() - 1000 * 60 * 120,
  },
  {
    customerId: 'cust-103',
    displayName: 'Tariq Mansoor',
    maskedPhone: '+974 33***778',
    score: 3140,
    coins: 245,
    date: getQatarTodayDate(),
    dateDisplay: 'Today 11:05 AM',
    timestamp: Date.now() - 1000 * 60 * 15,
  },
  {
    customerId: 'cust-104',
    displayName: 'Rashid Khan',
    maskedPhone: '+974 77***903',
    score: 2680,
    coins: 215,
    date: getQatarTodayDate(),
    dateDisplay: 'Today 08:50 AM',
    timestamp: Date.now() - 1000 * 60 * 180,
  },
  {
    customerId: 'cust-105',
    displayName: 'Fahad Al-Marri',
    maskedPhone: '+974 50***231',
    score: 2240,
    coins: 180,
    date: getQatarTodayDate(),
    dateDisplay: 'Today 07:15 AM',
    timestamp: Date.now() - 1000 * 60 * 240,
  },
  {
    customerId: 'cust-106',
    displayName: 'Abdullah Q.',
    maskedPhone: '+974 55***670',
    score: 1890,
    coins: 140,
    date: '2026-10-21',
    dateDisplay: '21 Oct 04:30 PM',
    timestamp: Date.now() - 1000 * 60 * 60 * 18,
  },
  {
    customerId: 'cust-107',
    displayName: 'Jassim Al-Sulaiti',
    maskedPhone: '+974 66***119',
    score: 1650,
    coins: 125,
    date: '2026-10-20',
    dateDisplay: '20 Oct 07:10 PM',
    timestamp: Date.now() - 1000 * 60 * 60 * 42,
  },
];

// Baseline Simulated Live Claims Feed
const SEED_LIVE_CLAIMS: LiveClaimEvent[] = [
  {
    id: 'claim-seed-1',
    customerName: 'Hamad Al-Kuwari',
    maskedPhone: '+974 55***119',
    rewardTitle: '10% Off Home Lighting & Switches',
    timeAgo: '4m ago',
    timestamp: Date.now() - 1000 * 60 * 4,
  },
  {
    id: 'claim-seed-2',
    customerName: 'Fatima Al-Nuaimi',
    maskedPhone: '+974 66***482',
    rewardTitle: 'Popular Sparky LED Gift Pack',
    timeAgo: '14m ago',
    timestamp: Date.now() - 1000 * 60 * 14,
  },
  {
    id: 'claim-seed-3',
    customerName: 'Ravi Subramanian',
    maskedPhone: '+974 33***805',
    rewardTitle: '5% Off Storewide Voucher',
    timeAgo: '26m ago',
    timestamp: Date.now() - 1000 * 60 * 26,
  },
  {
    id: 'claim-seed-4',
    customerName: 'Nasser Al-Hajri',
    maskedPhone: '+974 50***944',
    rewardTitle: '15% Off VIP Store Voucher',
    timeAgo: '42m ago',
    timestamp: Date.now() - 1000 * 60 * 42,
  },
];

// -------------------------------------------------------------
// API Service Class
// -------------------------------------------------------------
class PopularApiService {
  // 1. Customer Registration & Local State
  getCustomerProfile(): CustomerProfile | null {
    try {
      const data = localStorage.getItem(STORAGE_KEY_CUSTOMER);
      if (!data) return null;
      return JSON.parse(data) as CustomerProfile;
    } catch {
      return null;
    }
  }

  isCustomerRegistered(): boolean {
    const profile = this.getCustomerProfile();
    return !!(profile && profile.name && profile.phone && profile.consent);
  }

  async checkCustomerByPhone(countryCode: string, phone: string): Promise<CustomerProfile | null> {
    const cleanPhone = phone.trim().replace(/\D/g, '');
    const fullPhone = `${countryCode} ${cleanPhone}`;

    // 1. Attempt Express backend lookup on DigitalOcean droplet
    try {
      const res = await fetch(
        `${API_BASE_URL}/customer/lookup?phone=${encodeURIComponent(fullPhone)}&clean=${cleanPhone}`,
      );
      if (res.ok) {
        const data = await res.json();
        if (data && data.name) {
          try {
            localStorage.setItem(STORAGE_KEY_CUSTOMER, JSON.stringify(data));
          } catch {
            /* ignore */
          }
          return data as CustomerProfile;
        }
      }
    } catch {
      /* offline / droplet fallback */
    }

    // 2. Check local active profile
    const current = this.getCustomerProfile();
    if (
      current &&
      (current.phone.replace(/\D/g, '') === cleanPhone || current.fullPhone === fullPhone)
    ) {
      return current;
    }

    // 3. Check persistent registered users registry in localStorage
    try {
      const raw = localStorage.getItem('popular_registered_users');
      if (raw) {
        const users: CustomerProfile[] = JSON.parse(raw);
        const match = users.find(
          (u) => u.phone.replace(/\D/g, '') === cleanPhone || u.fullPhone === fullPhone,
        );
        if (match) {
          localStorage.setItem(STORAGE_KEY_CUSTOMER, JSON.stringify(match));
          return match;
        }
      }
    } catch {
      /* ignore */
    }

    return null;
  }

  async registerCustomer(params: {
    name: string;
    countryCode: string;
    phone: string;
    consent: boolean;
  }): Promise<CustomerProfile> {
    const cleanPhone = params.phone.trim().replace(/\D/g, '');
    const fullPhone = `${params.countryCode} ${cleanPhone}`;
    const profile: CustomerProfile = {
      id: `pop_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: params.name.trim(),
      countryCode: params.countryCode,
      phone: cleanPhone,
      fullPhone,
      consent: params.consent,
      registeredAt: new Date().toISOString(),
      bestScore: 0,
      totalCoins: 0,
    };

    // Save locally
    try {
      localStorage.setItem(STORAGE_KEY_CUSTOMER, JSON.stringify(profile));
      const raw = localStorage.getItem('popular_registered_users');
      const users: CustomerProfile[] = raw ? JSON.parse(raw) : [];
      const idx = users.findIndex((u) => u.fullPhone === fullPhone || u.phone === cleanPhone);
      if (idx >= 0) users[idx] = profile;
      else users.push(profile);
      localStorage.setItem('popular_registered_users', JSON.stringify(users));
    } catch {
      /* ignore storage error */
    }

    // Attempt Express Backend Sync (fire & forget with graceful fallback)
    try {
      await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
    } catch {
      // Backend not yet deployed on droplet; continues smoothly on client
    }

    return profile;
  }

  // 2. Score Submission
  async submitScore(
    score: number,
    coins: number,
  ): Promise<{ rankToday: number; rankGlobal: number }> {
    const profile = this.getCustomerProfile();
    const today = getQatarTodayDate();
    const timestamp = Date.now();

    // Update customer lifetime records
    if (profile) {
      profile.bestScore = Math.max(profile.bestScore, score);
      profile.totalCoins += coins;
      try {
        localStorage.setItem(STORAGE_KEY_CUSTOMER, JSON.stringify(profile));
      } catch {
        /* ignore */
      }
    }

    // Save local run entry
    const localEntry: Omit<LeaderboardEntry, 'rank'> = {
      customerId: profile ? profile.id : 'guest',
      displayName: profile ? profile.name : 'You',
      maskedPhone: profile ? maskPhoneNumber(profile.fullPhone) : '+974 55***000',
      score,
      coins,
      date: today,
      dateDisplay: formatQatarDateDisplay(timestamp),
      timestamp,
      isCurrentUser: true,
    };

    try {
      const runsRaw = localStorage.getItem(STORAGE_KEY_LOCAL_RUNS);
      const runs: Omit<LeaderboardEntry, 'rank'>[] = runsRaw ? JSON.parse(runsRaw) : [];
      runs.unshift(localEntry);
      // Keep last 40 runs
      if (runs.length > 40) runs.length = 40;
      localStorage.setItem(STORAGE_KEY_LOCAL_RUNS, JSON.stringify(runs));
    } catch {
      /* ignore */
    }

    // Attempt backend POST
    try {
      await fetch(`${API_BASE_URL}/scores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: profile?.id,
          name: profile?.name,
          phone: profile?.fullPhone,
          score,
          coins,
          date: today,
          timestamp,
        }),
      });
    } catch {
      /* offline / droplet fallback */
    }

    // Calculate ranking against today and global pools
    const todayBoard = await this.getTodayLeaderboard();
    const globalBoard = await this.getGlobalLeaderboard();

    const rankToday = todayBoard.findIndex((e) => e.isCurrentUser) + 1 || 1;
    const rankGlobal = globalBoard.findIndex((e) => e.isCurrentUser) + 1 || 1;

    return { rankToday, rankGlobal };
  }

  // 3. Leaderboard Queries
  async getTodayLeaderboard(): Promise<LeaderboardEntry[]> {
    const today = getQatarTodayDate();
    const currentProfile = this.getCustomerProfile();

    // Try Express backend first
    try {
      const res = await fetch(`${API_BASE_URL}/leaderboard/today?date=${today}`);
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json) && json.length > 0) return json;
      }
    } catch {
      /* fallback below */
    }

    // Combine seed with local customer runs
    const localRuns: Omit<LeaderboardEntry, 'rank'>[] = [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY_LOCAL_RUNS);
      if (raw) {
        const parsed = JSON.parse(raw) as Omit<LeaderboardEntry, 'rank'>[];
        localRuns.push(...parsed);
      }
    } catch {
      /* ignore */
    }

    // Filter to runs matching Qatar today date
    const allTodayRuns = [...localRuns, ...SEED_LEADERBOARD].filter((r) => r.date === today);

    // Group by customer and take best score
    const bestByCustomer = new Map<string, Omit<LeaderboardEntry, 'rank'>>();
    for (const r of allTodayRuns) {
      const key = r.customerId;
      const existing = bestByCustomer.get(key);
      if (!existing || r.score > existing.score) {
        bestByCustomer.set(key, r);
      }
    }

    // Sort descending by score
    const sorted = Array.from(bestByCustomer.values()).sort((a, b) => b.score - a.score);

    return sorted.map((entry, idx) => ({
      ...entry,
      rank: idx + 1,
      isCurrentUser: currentProfile ? entry.customerId === currentProfile.id : entry.customerId === 'guest',
    }));
  }

  async getGlobalLeaderboard(): Promise<LeaderboardEntry[]> {
    const currentProfile = this.getCustomerProfile();

    // Try Express backend
    try {
      const res = await fetch(`${API_BASE_URL}/leaderboard/global`);
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json) && json.length > 0) return json;
      }
    } catch {
      /* fallback below */
    }

    // Combine seed with local customer runs
    const localRuns: Omit<LeaderboardEntry, 'rank'>[] = [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY_LOCAL_RUNS);
      if (raw) {
        const parsed = JSON.parse(raw) as Omit<LeaderboardEntry, 'rank'>[];
        localRuns.push(...parsed);
      }
    } catch {
      /* ignore */
    }

    const allRuns = [...localRuns, ...SEED_LEADERBOARD];
    const bestByCustomer = new Map<string, Omit<LeaderboardEntry, 'rank'>>();
    for (const r of allRuns) {
      const key = r.customerId;
      const existing = bestByCustomer.get(key);
      if (!existing || r.score > existing.score) {
        bestByCustomer.set(key, r);
      }
    }

    const sorted = Array.from(bestByCustomer.values()).sort((a, b) => b.score - a.score);

    return sorted.map((entry, idx) => ({
      ...entry,
      rank: idx + 1,
      isCurrentUser: currentProfile ? entry.customerId === currentProfile.id : entry.customerId === 'guest',
    }));
  }

  // 4. Rewards Catalogue & Vouchers
  getBrandRewards(): BrandReward[] {
    return POPULAR_BRAND_REWARDS;
  }

  getClaimedVouchers(): ClaimedVoucher[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_VOUCHERS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  async claimReward(rewardId: string): Promise<ClaimedVoucher> {
    const profile = this.getCustomerProfile();
    const reward = POPULAR_BRAND_REWARDS.find((r) => r.id === rewardId);
    if (!reward) throw new Error('Reward not found');

    // Generate authentic voucher code: POP-XXXX-QAT
    const randCode = Math.floor(1000 + Math.random() * 9000);
    const voucherCode = `POP-${randCode}-QAT`;

    const voucher: ClaimedVoucher = {
      id: `vouch_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      rewardId: reward.id,
      rewardTitle: reward.title,
      voucherCode,
      discountValue: reward.discountValue,
      claimedAt: new Date().toISOString(),
      status: 'active',
      customerName: profile ? profile.name : 'Valued Customer',
      customerPhone: profile ? profile.fullPhone : '+974 55123456',
    };

    // Save to local vouchers
    const vouchers = this.getClaimedVouchers();
    vouchers.unshift(voucher);
    try {
      localStorage.setItem(STORAGE_KEY_VOUCHERS, JSON.stringify(vouchers));
    } catch {
      /* ignore */
    }

    // Add to local live claims feed
    try {
      const feedRaw = localStorage.getItem('popular_live_claims_feed');
      const feed: LiveClaimEvent[] = feedRaw ? JSON.parse(feedRaw) : [...SEED_LIVE_CLAIMS];
      feed.unshift({
        id: `event_${Date.now()}`,
        customerName: profile ? profile.name : 'Popular Customer',
        maskedPhone: profile ? maskPhoneNumber(profile.fullPhone) : '+974 55***000',
        rewardTitle: reward.title,
        timeAgo: 'Just now',
        timestamp: Date.now(),
      });
      localStorage.setItem('popular_live_claims_feed', JSON.stringify(feed.slice(0, 20)));
    } catch {
      /* ignore */
    }

    // Backend sync attempt
    try {
      await fetch(`${API_BASE_URL}/rewards/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(voucher),
      });
    } catch {
      /* ignore */
    }

    return voucher;
  }

  // 5. Live Feed of Community Claims
  async getLiveClaimsFeed(): Promise<LiveClaimEvent[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/rewards/feed`);
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json) && json.length > 0) return json;
      }
    } catch {
      /* fallback below */
    }

    try {
      const raw = localStorage.getItem('popular_live_claims_feed');
      if (raw) {
        return JSON.parse(raw);
      }
    } catch {
      /* ignore */
    }

    return SEED_LIVE_CLAIMS;
  }

  // 6. Daily Winners by Previous Dates (3 winners per date)
  async getPreviousDailyWinners(): Promise<DailyDateWinnersGroup[]> {
    const seedPool: { rank: number; name: string; prize: string }[][] = [
      [
        { rank: 1, name: 'Salem Al-Kuwari', prize: 'Keychain + Cap' },
        { rank: 2, name: 'Fatima Al-Nuaimi', prize: 'Keychain' },
        { rank: 3, name: 'Nasser Al-Hajri', prize: 'Keychain' },
      ],
      [
        { rank: 1, name: 'Mohammed Al-Thani', prize: 'Shirt' },
        { rank: 2, name: 'Ravi Subramanian', prize: 'Diary' },
        { rank: 3, name: 'Aisha Al-Kuwari', prize: 'Keychain + Pen' },
      ],
      [
        { rank: 1, name: 'Tariq Mansoor', prize: 'Diary' },
        { rank: 2, name: 'Sara Al-Mohannadi', prize: 'Keychain + Cap' },
        { rank: 3, name: 'Rashid Khan', prize: 'Keychain' },
      ],
      [
        { rank: 1, name: 'Fahad Al-Marri', prize: 'Shirt' },
        { rank: 2, name: 'Abdullah Q.', prize: 'Keychain + Pen' },
        { rank: 3, name: 'Jassim Al-Sulaiti', prize: 'Keychain' },
      ],
    ];

    const todayDate = new Date();
    const groups: DailyDateWinnersGroup[] = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    for (let i = 1; i <= 4; i++) {
      const d = new Date(todayDate);
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().slice(0, 10);
      const dayNum = d.getDate();
      const monthStr = monthNames[d.getMonth()];
      const yearStr = d.getFullYear();
      const dateLabel = i === 1 ? `${dayNum} ${monthStr} ${yearStr} (Yesterday)` : `${dayNum} ${monthStr} ${yearStr}`;

      groups.push({
        dateKey,
        dateLabel,
        winners: seedPool[(i - 1) % seedPool.length],
      });
    }

    return groups;
  }
}

export const popularApi = new PopularApiService();
