export interface CountryCode {
  code: string;
  dialCode: string;
  name: string;
  flag: string;
  digits: number;
}

export interface CustomerProfile {
  id: string;
  name: string;
  countryCode: string; // e.g. "+974"
  phone: string; // e.g. "55123456"
  fullPhone: string; // e.g. "+974 55123456"
  consent: boolean;
  registeredAt: string;
  bestScore: number;
  totalCoins: number;
}

export interface LeaderboardEntry {
  rank: number;
  customerId: string;
  displayName: string;
  maskedPhone: string; // e.g. "+974 55***456"
  score: number;
  coins: number;
  date: string; // "YYYY-MM-DD" in Qatar AST
  dateDisplay: string; // "Today 10:45 AM" or "21 Oct 2026"
  timestamp: number;
  isCurrentUser?: boolean;
}

export interface BrandReward {
  id: string;
  title: string;
  desc: string;
  discountValue: string; // e.g. "10% OFF"
  terms: string;
  requiredDistance: number;
  requiredCoins: number;
  icon: string;
  isSurprise?: boolean;
}

export interface ClaimedVoucher {
  id: string;
  rewardId: string;
  rewardTitle: string;
  voucherCode: string; // e.g. "POP-8492-QAT"
  discountValue: string;
  claimedAt: string;
  status: 'active' | 'redeemed';
  customerName: string;
  customerPhone: string;
}

export interface LiveClaimEvent {
  id: string;
  customerName: string;
  maskedPhone: string;
  rewardTitle: string;
  timeAgo: string;
  timestamp: number;
}

export interface WeeklyWinner {
  name: string;
  score: number;
  prize: string;
}

export interface WeeklyWinnersGroup {
  weekKey: string;
  weekLabel: string;
  weekNumber: number;
  winner: WeeklyWinner;
}

export interface DailyDateWinner {
  rank: number;
  name: string;
  prize: string;
}

export interface DailyDateWinnersGroup {
  dateKey: string;
  dateLabel: string;
  winners: DailyDateWinner[];
}

export const SUPPORTED_COUNTRIES: CountryCode[] = [
  { code: 'QA', dialCode: '+974', name: 'Qatar', flag: '🇶🇦', digits: 8 },
  { code: 'SA', dialCode: '+966', name: 'Saudi Arabia', flag: '🇸🇦', digits: 9 },
  { code: 'AE', dialCode: '+971', name: 'United Arab Emirates', flag: '🇦🇪', digits: 9 },
  { code: 'KW', dialCode: '+965', name: 'Kuwait', flag: '🇰🇼', digits: 8 },
  { code: 'BH', dialCode: '+973', name: 'Bahrain', flag: '🇧🇭', digits: 8 },
  { code: 'OM', dialCode: '+968', name: 'Oman', flag: '🇴🇲', digits: 8 },
  { code: 'IN', dialCode: '+91', name: 'India', flag: '🇮🇳', digits: 10 },
  { code: 'PK', dialCode: '+92', name: 'Pakistan', flag: '🇵🇰', digits: 10 },
  { code: 'PH', dialCode: '+63', name: 'Philippines', flag: '🇵🇭', digits: 10 },
  { code: 'GB', dialCode: '+44', name: 'United Kingdom', flag: '🇬🇧', digits: 10 },
  { code: 'US', dialCode: '+1', name: 'United States', flag: '🇺🇸', digits: 10 },
];
