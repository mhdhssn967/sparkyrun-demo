import type {
  BrandPlayer,
  BrandPlayerSession,
  BrandReward,
  ClaimedVoucher,
  CustomerProfile,
  DailyDateWinnersGroup,
  LeaderboardEntry,
  LiveClaimEvent,
  QrToken,
  StartSessionResponse,
  EndSessionResponse,
  TokenVerificationResult,
  WeeklyWinnersGroup,
} from '../types/customer';

const STORAGE_KEY_CUSTOMER = 'popular_customer_profile';
const STORAGE_KEY_VOUCHERS = 'popular_claimed_vouchers';
const STORAGE_KEY_LOCAL_RUNS = 'popular_local_runs';
const STORAGE_KEY_ACTIVE_TOKEN = 'popular_active_token';
const STORAGE_KEY_ACTIVE_SESSION = 'popular_active_session';
const STORAGE_KEY_TOKENS = 'popular_tokens';

import { API_BASE_URL } from '../config/api';
import { checkMobileNumber, registerPlayer, getSavedPlayer } from './authService';

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
    desc: 'Sparky Keychain, Executive Pen, or Official Popular Cap',
    discountValue: 'KEYCHAIN / PEN / CAP',
    terms: 'Claim at Popular Electricals showroom counter with verified SMS/phone confirmation.',
    requiredDistance: 0,
    requiredCoins: 500,
    icon: '',
  },
  {
    id: 'pop-reward-pen',
    title: 'Pen',
    desc: 'Sparky Keychain, Executive Pen, or Official Popular Cap',
    discountValue: 'KEYCHAIN / PEN / CAP',
    terms: 'Claim at Popular Electricals showroom counter with verified SMS/phone confirmation.',
    requiredDistance: 0,
    requiredCoins: 1000,
    icon: '',
  },
  {
    id: 'pop-reward-Cap',
    title: 'Cap',
    desc: 'Sparky Keychain, Executive Pen, or Official Popular Cap',
    discountValue: 'KEYCHAIN / PEN / CAP',
    terms: 'Claim at Popular Electricals showroom counter with verified SMS/phone confirmation.',
    requiredDistance: 0,
    requiredCoins: 2000,
    icon: '',
  },
  {
    id: 'pop-reward-diary',
    title: 'Diary',
    desc: 'Popular Electricals Executive Diary',
    discountValue: 'DIARY',
    terms: 'Claim at Popular Electricals showroom counter with verified SMS/phone confirmation.',
    requiredDistance: 0,
    requiredCoins: 3000,
    icon: '',
  },
  {
    id: 'pop-reward-diary-box',
    title: 'Diary Box',
    desc: 'Premium Popular Electricals Diary Box Set',
    discountValue: 'DIARY BOX',
    terms: 'Claim at Popular Electricals showroom counter with verified SMS/phone confirmation.',
    requiredDistance: 0,
    requiredCoins: 5000,
    icon: '',
  },
  {
    id: 'pop-reward-tshirt',
    title: 'T-Shirt',
    desc: 'Popular Electricals Exclusive Watch or Official Brand T-Shirt',
    discountValue: 'WATCH / T-SHIRT',
    terms: 'Claim at Popular Electricals showroom counter with verified SMS/phone confirmation.',
    requiredDistance: 0,
    requiredCoins: 6000,
    icon: '',
  },
  {
    id: 'pop-reward-watch',
    title: 'Watch',
    desc: 'Popular Electricals Exclusive Watch or Official Brand T-Shirt',
    discountValue: 'WATCH / T-SHIRT',
    terms: 'Claim at Popular Electricals showroom counter with verified SMS/phone confirmation.',
    requiredDistance: 0,
    requiredCoins: 10000,
    icon: '',
  },
  {
    id: 'pop-reward-surprise-lulu',
    title: 'LuLu 100 Riyal Voucher Coupon',
    desc: '100 Riyal voucher will be in the game, play to get it in the game',
    discountValue: '100 QAR VOUCHER',
    terms: '100 Riyal voucher will be in the game, play to get it in the game. Redeemable at LuLu Hypermarket Qatar.',
    requiredDistance: 0,
    requiredCoins: 0,
    icon: '',
    isSurprise: true,
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
      if (data) return JSON.parse(data) as CustomerProfile;

      // Fallback: check saved player session from Better Auth
      const savedPlayer = getSavedPlayer();
      if (savedPlayer) {
        const profile: CustomerProfile = {
          id: savedPlayer.id,
          name: savedPlayer.name,
          countryCode: '+974',
          phone: savedPlayer.phone,
          fullPhone: `+974 ${savedPlayer.phone}`,
          consent: true,
          registeredAt: savedPlayer.createdAt || new Date().toISOString(),
          bestScore: 0,
          totalCoins: 0,
        };
        try {
          localStorage.setItem(STORAGE_KEY_CUSTOMER, JSON.stringify(profile));
        } catch {
          /* ignore */
        }
        return profile;
      }
      return null;
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

    // 1. Attempt GameFaktory Backend login check via Better Auth
    try {
      const authRes = await checkMobileNumber(cleanPhone);
      if (authRes.success && authRes.exists && authRes.user) {
        const profile: CustomerProfile = {
          id: authRes.user.id,
          name: authRes.user.name,
          countryCode,
          phone: cleanPhone,
          fullPhone,
          consent: true,
          registeredAt: authRes.user.createdAt || new Date().toISOString(),
          bestScore: 0,
          totalCoins: 0,
        };
        try {
          localStorage.setItem(STORAGE_KEY_CUSTOMER, JSON.stringify(profile));
          localStorage.setItem('gf_player_session', JSON.stringify(authRes.user));
        } catch {
          /* ignore */
        }
        return profile;
      }
    } catch {
      /* offline / network fallback below */
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

    let backendUserId = `pop_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    let createdAt = new Date().toISOString();

    // 1. Register with PostgreSQL backend via Better Auth User schema
    try {
      const regRes = await registerPlayer(cleanPhone, params.name);
      if (regRes.success && regRes.user) {
        backendUserId = regRes.user.id;
        if (regRes.user.createdAt) createdAt = regRes.user.createdAt;
      }
    } catch {
      // Offline / fallback continues smoothly
    }

    const profile: CustomerProfile = {
      id: backendUserId,
      name: params.name.trim(),
      countryCode: params.countryCode,
      phone: cleanPhone,
      fullPhone,
      consent: params.consent,
      registeredAt: createdAt,
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
      profile.totalScore = (profile.totalScore || 0) + score;
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
      await fetch(`${API_BASE_URL}/api/scores`, {
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
  async getWeeklyLeaderboard(brandSlug = 'popular-electricals-qatar'): Promise<LeaderboardEntry[]> {
    const currentProfile = this.getCustomerProfile();
    const today = getQatarTodayDate();
    const timestamp = Date.now();

    // 1. Fetch live Weekly leaderboard from backend
    try {
      const res = await fetch(`${API_BASE_URL}/api/leaderboard/weekly?brand=${encodeURIComponent(brandSlug)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.leaderboard)) {
          return data.leaderboard.map((item: any, idx: number) => {
            const isCurrent = currentProfile
              ? (item.userId && item.userId === currentProfile.id) ||
                (item.phone && currentProfile.phone && item.phone.replace(/\D/g, '') === currentProfile.phone.replace(/\D/g, '')) ||
                (item.name && currentProfile.name && item.name.trim().toLowerCase() === currentProfile.name.trim().toLowerCase())
              : false;

            return {
              rank: item.rank || idx + 1,
              customerId: item.userId || item.id || `weekly_${idx + 1}`,
              displayName: item.name || 'Anonymous Runner',
              maskedPhone: item.phone ? maskPhoneNumber(item.phone) : '+974 55***000',
              score: Number(item.score) || 0,
              coins: Number(item.score) || 0,
              date: today,
              dateDisplay: formatQatarDateDisplay(timestamp),
              timestamp,
              isCurrentUser: isCurrent,
            };
          });
        }
      }
    } catch (err) {
      console.warn('Failed to fetch live weekly leaderboard:', err);
    }

    // Fallback: local customer run cache
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

  // Backward-compatible alias for getTodayLeaderboard
  async getTodayLeaderboard(brandSlug = 'popular-electricals-qatar'): Promise<LeaderboardEntry[]> {
    return this.getWeeklyLeaderboard(brandSlug);
  }

  async getAllTimeLeaderboard(brandSlug = 'popular-electricals-qatar'): Promise<LeaderboardEntry[]> {
    const currentProfile = this.getCustomerProfile();
    const today = getQatarTodayDate();
    const timestamp = Date.now();

    // 1. Fetch live All-Time leaderboard from backend
    try {
      const res = await fetch(`${API_BASE_URL}/api/leaderboard/all-time?brand=${encodeURIComponent(brandSlug)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.leaderboard)) {
          return data.leaderboard.map((item: any, idx: number) => {
            const isCurrent = currentProfile
              ? (item.userId && item.userId === currentProfile.id) ||
                (item.phone && currentProfile.phone && item.phone.replace(/\D/g, '') === currentProfile.phone.replace(/\D/g, '')) ||
                (item.name && currentProfile.name && item.name.trim().toLowerCase() === currentProfile.name.trim().toLowerCase())
              : false;

            // All-Time leaderboard is ranked by cumulative totalScore
            const totalPoints = Number(item.totalScore ?? item.score ?? 0);
            const bestPts = Number(item.bestScore ?? item.score ?? 0);

            return {
              rank: item.rank || idx + 1,
              customerId: item.userId || item.id || `alltime_${idx + 1}`,
              displayName: item.name || 'Anonymous Runner',
              maskedPhone: item.phone ? maskPhoneNumber(item.phone) : '+974 55***000',
              score: totalPoints,
              coins: totalPoints,
              totalScore: totalPoints,
              bestScore: bestPts,
              gamesPlayed: Number(item.gamesPlayed) || 1,
              date: today,
              dateDisplay: formatQatarDateDisplay(timestamp),
              timestamp,
              isCurrentUser: isCurrent,
            };
          });
        }
      }
    } catch (err) {
      console.warn('Failed to fetch live all-time leaderboard:', err);
    }

    // Fallback: local customer run cache
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
    const totalByCustomer = new Map<string, Omit<LeaderboardEntry, 'rank'>>();
    for (const r of allRuns) {
      const key = r.customerId;
      const existing = totalByCustomer.get(key);
      if (!existing) {
        totalByCustomer.set(key, { ...r });
      } else {
        existing.score += r.score;
        existing.coins += r.coins;
      }
    }

    const sorted = Array.from(totalByCustomer.values()).sort((a, b) => b.score - a.score);
    return sorted.map((entry, idx) => ({
      ...entry,
      rank: idx + 1,
      isCurrentUser: currentProfile ? entry.customerId === currentProfile.id : entry.customerId === 'guest',
    }));
  }

  // Backward-compatible alias for getGlobalLeaderboard
  async getGlobalLeaderboard(brandSlug = 'popular-electricals-qatar'): Promise<LeaderboardEntry[]> {
    return this.getAllTimeLeaderboard(brandSlug);
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
      await fetch(`${API_BASE_URL}/api/rewards/claim`, {
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
      const res = await fetch(`${API_BASE_URL}/api/rewards/feed`);
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

  // 6. Weekly Winners by Previous Weeks (Only 1 Winner per week - High Scorer awarded PET Gift Bag)
  async getPreviousWeeklyWinners(): Promise<WeeklyWinnersGroup[]> {
    const seedWeeklyWinners: WeeklyWinnersGroup[] = [
      {
        weekKey: 'week-2026-42',
        weekLabel: '14 Oct – 20 Oct 2026 (Last Week)',
        weekNumber: 42,
        winner: {
          name: 'Salem Al-Kuwari',
          score: 84320,
          prize: 'PET Gift Bag (T-Shirt, Watch, Book Case)',
        },
      },
      {
        weekKey: 'week-2026-41',
        weekLabel: '07 Oct – 13 Oct 2026',
        weekNumber: 41,
        winner: {
          name: 'Fatima Al-Nuaimi',
          score: 79150,
          prize: 'PET Gift Bag (T-Shirt, Watch, Book Case)',
        },
      },
      {
        weekKey: 'week-2026-40',
        weekLabel: '30 Sep – 06 Oct 2026',
        weekNumber: 40,
        winner: {
          name: 'Mohammed Al-Thani',
          score: 92400,
          prize: 'PET Gift Bag (T-Shirt, Watch, Book Case)',
        },
      },
      {
        weekKey: 'week-2026-39',
        weekLabel: '23 Sep – 29 Sep 2026',
        weekNumber: 39,
        winner: {
          name: 'Ravi Subramanian',
          score: 74800,
          prize: 'PET Gift Bag (T-Shirt, Watch, Book Case)',
        },
      },
    ];

    return seedWeeklyWinners;
  }

  // Backward compatibility alias for daily winners
  async getPreviousDailyWinners(): Promise<DailyDateWinnersGroup[]> {
    const weekly = await this.getPreviousWeeklyWinners();
    return weekly.map((w) => ({
      dateKey: w.weekKey,
      dateLabel: w.weekLabel,
      winners: [{ rank: 1, name: w.winner.name, prize: w.winner.prize }],
    }));
  }

  // =============================================================
  // 7. QR Token & Gameplay Session Lifecycle
  // =============================================================

  /**
   * Reads ?token= or ?t= from the current window URL (e.g. sparkyrun.gamefaktory.com/?token=122ERF).
   * Stores it as active token, strips it cleanly from the address bar, and returns the token string.
   */
  extractTokenFromUrl(): string | null {
    if (typeof window === 'undefined') return null;
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token') || urlParams.get('t');
      if (token && token.trim().length > 0) {
        const cleanToken = token.trim().toUpperCase();
        this.setActiveToken(cleanToken);

        // Clean query parameter from browser address bar without reload
        const url = new URL(window.location.href);
        url.searchParams.delete('token');
        url.searchParams.delete('t');
        const cleanUrl = url.pathname + (url.search ? url.search : '') + url.hash;
        window.history.replaceState({}, document.title, cleanUrl);
        return cleanToken;
      }
    } catch {
      /* ignore URL parsing failure */
    }

    return this.getActiveToken();
  }

  /**
   * Gets the currently active QR token code, or null if no token is scanned.
   */
  getActiveToken(): string | null {
    try {
      const stored =
        sessionStorage.getItem(STORAGE_KEY_ACTIVE_TOKEN) ||
        localStorage.getItem(STORAGE_KEY_ACTIVE_TOKEN);
      if (stored && stored.trim().length > 0) {
        return stored.trim().toUpperCase();
      }
    } catch {
      /* ignore */
    }
    return null;
  }

  /**
   * Clears the active QR token from storage.
   */
  clearActiveToken(): void {
    try {
      sessionStorage.removeItem(STORAGE_KEY_ACTIVE_TOKEN);
      localStorage.removeItem(STORAGE_KEY_ACTIVE_TOKEN);
    } catch {
      /* ignore */
    }
  }

  // Pre-seeded authorized showroom tokens (matching backend PostgreSQL seeds)
  readonly SEED_AUTHORIZED_TOKENS: Record<string, { initialLives: number; label: string }> = {
    '122ERF': { initialLives: 3, label: 'Official Showroom QR' },
    'PET-9XK2-MP8A': { initialLives: 3, label: 'Najma Showroom Flyer' },
    'PET-BARWA-01': { initialLives: 3, label: 'Barwa Village Counter' },
    'PET-NAJMA-02': { initialLives: 3, label: 'Najma Counter QR' },
    'PET-VIP-2026': { initialLives: 3, label: 'VIP Customer Pass' },
    'PET-DEMO-VIP3': { initialLives: 3, label: 'Showroom Trial Pass' },
  };

  /**
   * Sets the active QR token in session and local storage.
   */
  setActiveToken(tokenCode: string): void {
    const clean = tokenCode.trim().toUpperCase();
    try {
      sessionStorage.setItem(STORAGE_KEY_ACTIVE_TOKEN, clean);
      localStorage.setItem(STORAGE_KEY_ACTIVE_TOKEN, clean);
    } catch {
      /* ignore */
    }
  }

  /**
   * Retrieves a local token record only if it exists in the database registry.
   * Returns null if token is unknown/unrecognized.
   */
  private getLocalToken(tokenCode: string): QrToken | null {
    const clean = tokenCode.trim().toUpperCase();
    try {
      const raw = localStorage.getItem(STORAGE_KEY_TOKENS);
      const tokens: Record<string, QrToken> = raw ? JSON.parse(raw) : {};
      if (tokens[clean]) {
        return tokens[clean];
      }

      // Check if it's an authorized seed token in the database catalogue
      const seed = this.SEED_AUTHORIZED_TOKENS[clean];
      if (seed) {
        const newToken: QrToken = {
          tokenCode: clean,
          initialLives: seed.initialLives,
          livesRemaining: seed.initialLives,
          status: 'ACTIVE',
          createdAt: new Date().toISOString(),
        };
        tokens[clean] = newToken;
        localStorage.setItem(STORAGE_KEY_TOKENS, JSON.stringify(tokens));
        return newToken;
      }

      // Not recognized in database!
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Verifies the token against the PostgreSQL backend API or database registry.
   * Unrecognized/fake tokens return { valid: false, livesRemaining: 0 }.
   */
  async verifyToken(tokenCode?: string | null): Promise<TokenVerificationResult> {
    const active = tokenCode || this.getActiveToken();
    if (!active) {
      return {
        valid: false,
        livesRemaining: 0,
        message: 'No QR token scanned. Please scan a showroom QR code to play.',
      };
    }
    const code = active.trim().toUpperCase();

    // 1. Backend network check attempt (real PostgreSQL database check)
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/token/verify?token=${encodeURIComponent(code)}&brand=popular`,
      );
      if (res.ok) {
        const data = await res.json();
        const tokenObj: QrToken = {
          tokenCode: data.token || code,
          initialLives: typeof data.initialLives === 'number' ? data.initialLives : 3,
          livesRemaining: typeof data.livesRemaining === 'number' ? data.livesRemaining : 0,
          status: data.status || (data.livesRemaining > 0 ? 'ACTIVE' : 'EXHAUSTED'),
          createdAt: new Date().toISOString(),
        };
        try {
          const raw = localStorage.getItem(STORAGE_KEY_TOKENS);
          const tokens: Record<string, QrToken> = raw ? JSON.parse(raw) : {};
          tokens[code] = tokenObj;
          localStorage.setItem(STORAGE_KEY_TOKENS, JSON.stringify(tokens));
        } catch {
          /* ignore */
        }
        return {
          valid: Boolean(data.valid),
          token: tokenObj,
          livesRemaining: typeof data.livesRemaining === 'number' ? data.livesRemaining : 0,
          message: data.message || (data.valid ? 'Token verified' : 'All 3 lives exhausted for this QR token'),
        };
      }
      if (res.status === 404) {
        const localSeed = this.SEED_AUTHORIZED_TOKENS[code];
        if (!localSeed) {
          const errData = await res.json().catch(() => null);
          return {
            valid: false,
            livesRemaining: 0,
            message:
              errData?.error ||
              'Token not recognized in database. Please scan an authentic showroom QR code.',
          };
        }
      } else if (res.status === 403) {
        const errData = await res.json().catch(() => null);
        return {
          valid: false,
          livesRemaining: 0,
          message:
            errData?.error ||
            'This token does not belong to Popular Electricals.',
        };
      }
    } catch {
      /* fallback to local database registry below */
    }

    // 2. Local database check
    const localToken = this.getLocalToken(code);
    if (!localToken) {
      return {
        valid: false,
        livesRemaining: 0,
        message: 'Invalid QR Token. Not found in Popular Electricals database.',
      };
    }

    return {
      valid: localToken.status !== 'REVOKED',
      token: localToken,
      livesRemaining: localToken.livesRemaining,
      message:
        localToken.livesRemaining > 0
          ? 'Token verified'
          : 'All 3 lives exhausted for this QR token',
    };
  }

  /**
   * Retrieves remaining lives for the given token (defaults to active token).
   */
  async getTokenLives(tokenCode?: string): Promise<number> {
    const res = await this.verifyToken(tokenCode);
    return res.livesRemaining;
  }

  /**
   * Starts a new game session:
   * 1. Checks that token has lives_remaining > 0
   * 2. Decrements 1 life in the database
   * 3. Issues a unique sessionId and records start timestamp
   */
  async startGameSession(tokenCode?: string): Promise<StartSessionResponse> {
    const active = tokenCode || this.getActiveToken();
    if (!active) {
      return {
        success: false,
        livesRemaining: 0,
        error: 'No QR token found. Please scan a QR code to play.',
      };
    }
    const code = active.trim().toUpperCase();
    const customer = this.getCustomerProfile();
    const customerId = customer?.id || 'guest_' + Date.now();
    const userId = customer?.id;
    const phone = customer?.phone;

    // Attempt backend start-session
    try {
      const res = await fetch(`${API_BASE_URL}/api/game/start-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: code,
          tokenCode: code,
          brand: 'popular',
          brandSlug: 'popular',
          gameSlug: 'sparky-run',
          customerId,
          userId,
          phone,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.sessionId) {
          this.setActiveSession({
            sessionId: data.sessionId,
            tokenCode: code,
            startedAt: Date.now(),
          });
          // Synchronize cached token lives immediately
          try {
            const raw = localStorage.getItem(STORAGE_KEY_TOKENS);
            const tokens: Record<string, QrToken> = raw ? JSON.parse(raw) : {};
            if (tokens[code]) {
              tokens[code].livesRemaining = data.livesRemaining;
              if (data.livesRemaining <= 0) tokens[code].status = 'EXHAUSTED';
            } else {
              tokens[code] = {
                tokenCode: code,
                initialLives: typeof data.initialLives === 'number' ? data.initialLives : 3,
                livesRemaining: data.livesRemaining,
                status: data.livesRemaining <= 0 ? 'EXHAUSTED' : 'ACTIVE',
                createdAt: new Date().toISOString(),
              };
            }
            localStorage.setItem(STORAGE_KEY_TOKENS, JSON.stringify(tokens));
          } catch {
            /* ignore */
          }
          return {
            success: true,
            sessionId: data.sessionId,
            livesRemaining: data.livesRemaining,
          };
        }
      } else if (res.status === 400 || res.status === 403 || res.status === 404) {
        const errData = await res.json().catch(() => null);
        return {
          success: false,
          livesRemaining: typeof errData?.livesRemaining === 'number' ? errData.livesRemaining : 0,
          error: errData?.error || 'No lives remaining for this QR token.',
        };
      }
    } catch {
      /* fallback to local transaction below */
    }

    // Local database check fallback
    const localToken = this.getLocalToken(code);
    if (!localToken) {
      return {
        success: false,
        livesRemaining: 0,
        error: 'Invalid QR Token. Token not recognized in Popular Electricals database.',
      };
    }

    if (localToken.livesRemaining <= 0) {
      return {
        success: false,
        livesRemaining: 0,
        error: 'No lives remaining for this token. Scan a new QR code to play!',
      };
    }

    // Decrement 1 life
    localToken.livesRemaining = Math.max(0, localToken.livesRemaining - 1);
    if (localToken.livesRemaining === 0) {
      localToken.status = 'EXHAUSTED';
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY_TOKENS);
      const tokens: Record<string, QrToken> = raw ? JSON.parse(raw) : {};
      tokens[code] = localToken;
      localStorage.setItem(STORAGE_KEY_TOKENS, JSON.stringify(tokens));
    } catch {
      /* ignore */
    }

    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    this.setActiveSession({
      sessionId,
      tokenCode: code,
      startedAt: Date.now(),
    });

    return {
      success: true,
      sessionId,
      livesRemaining: localToken.livesRemaining,
    };
  }

  /**
   * Stores active in-progress game session in sessionStorage.
   */
  private setActiveSession(session: { sessionId: string; tokenCode: string; startedAt: number }): void {
    try {
      sessionStorage.setItem(STORAGE_KEY_ACTIVE_SESSION, JSON.stringify(session));
    } catch {
      /* ignore */
    }
  }

  /**
   * Retrieves active in-progress session if any.
   */
  getActiveSession(): { sessionId: string; tokenCode: string; startedAt: number } | null {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY_ACTIVE_SESSION);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  /**
   * Clears the active session after completion.
   */
  clearActiveSession(): void {
    try {
      sessionStorage.removeItem(STORAGE_KEY_ACTIVE_SESSION);
    } catch {
      /* ignore */
    }
  }

  /**
   * Ends a game session:
   * 1. Validates session ID and anti-cheat constraints (max 25 coins / second)
   * 2. Updates customer lifetime high score (best_score), cumulative total_score, and total_coins
   * 3. Syncs with backend and leaderboard
   */
  async endGameSession(
    sessionId: string,
    score: number,
    coins: number,
    durationSeconds: number,
  ): Promise<EndSessionResponse> {
    const active = this.getActiveSession();
    const tokenCode = active?.tokenCode || this.getActiveToken() || '';
    const customer = this.getCustomerProfile();
    const customerId = customer?.id || 'guest';
    const userId = customer?.id;
    const phone = customer?.phone;

    // Anti-cheat plausibility verification: max 25 coins per second (with buffer for super coin)
    const maxPlausibleCoins = Math.max(25, Math.ceil(durationSeconds * 25));
    const isPlausible = coins <= maxPlausibleCoins;
    const verifiedCoins = isPlausible ? coins : maxPlausibleCoins;

    // Backend network end-session attempt
    try {
      const res = await fetch(`${API_BASE_URL}/api/game/end-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          sessionToken: sessionId,
          token: tokenCode,
          tokenCode,
          brand: 'popular',
          brandSlug: 'popular',
          gameSlug: 'sparky-run',
          customerId,
          userId,
          phone,
          score,
          coins: verifiedCoins,
          durationSeconds,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        this.clearActiveSession();
        return {
          success: true,
          isNewHighScore: data.isNewHighScore,
          bestScore: data.bestScore,
          totalScore: data.totalScore,
          totalCoins: data.totalCoins,
          livesRemaining: data.livesRemaining,
          rankToday: data.rankToday,
          rankGlobal: data.rankGlobal,
        };
      }
    } catch {
      /* fallback below */
    }

    // Local database update
    const previousBest = customer?.bestScore || 0;
    const isNewHighScore = score > previousBest;

    if (customer) {
      customer.bestScore = Math.max(previousBest, score);
      customer.totalScore = (customer.totalScore || 0) + score;
      customer.totalCoins = (customer.totalCoins || 0) + verifiedCoins;
      try {
        localStorage.setItem(STORAGE_KEY_CUSTOMER, JSON.stringify(customer));
      } catch {
        /* ignore */
      }
    }

    // Submit to leaderboard registry
    const ranking = await this.submitScore(score, verifiedCoins);

    // Get current remaining lives
    const localToken = tokenCode ? this.getLocalToken(tokenCode) : null;
    this.clearActiveSession();

    return {
      success: true,
      isNewHighScore,
      bestScore: customer ? customer.bestScore : score,
      totalScore: customer ? customer.totalScore : score,
      totalCoins: customer ? customer.totalCoins : verifiedCoins,
      livesRemaining: localToken ? localToken.livesRemaining : 0,
      rankToday: ranking.rankToday,
      rankGlobal: ranking.rankGlobal,
    };
  }

  /**
   * Authenticates dashboard administrator with strict brand isolation.
   */
  async adminLogin(
    identifier: string,
    password: string,
    brandSlug = 'popular-electricals-qatar'
  ): Promise<{ success: boolean; token: string; user: any; message?: string }> {
    const res = await fetch(`${API_BASE_URL}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: identifier.trim(),
        password,
        brandSlug,
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Invalid credentials or unauthorized brand');
    }

    return data;
  }

  /**
   * Fetches all registered players under a brand (default: 'popular-electricals-qatar') from PostgreSQL.
   */
  async getBrandPlayers(brandSlug = 'popular-electricals-qatar'): Promise<BrandPlayer[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/brands/${brandSlug}/players`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.players)) {
          return data.players;
        }
      }
    } catch {
      /* fallback below */
    }
    return [];
  }

  /**
   * Fetches all game sessions played by a specific user strictly under that brand.
   */
  async getPlayerBrandSessions(
    userId: string,
    brandSlug = 'popular-electricals-qatar'
  ): Promise<{ player: any; sessions: BrandPlayerSession[] } | null> {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/brands/${brandSlug}/players/${encodeURIComponent(userId)}/sessions`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          return {
            player: data.player,
            sessions: data.sessions || [],
          };
        }
      }
    } catch {
      /* fallback below */
    }
    return null;
  }
}

export const popularApi = new PopularApiService();
