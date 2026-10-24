// Mock dataset for Popular Electricals & Trading Co. W.L.L (PET) Sparky Run Admin Dashboard

export interface DashboardPlayer {
  id: string;
  name: string;
  phone: string;
  fullPhone: string;
  area: string;
  showroom: 'Najma' | 'Barwa Village';
  bestScore: number;
  totalScore: number;
  totalCoins: number;
  tokensUsed: number;
  livesRemaining: number;
  rewardsClaimed: number;
  lastActive: string;
  registeredDate: string;
  status: 'VIP' | 'Top 10' | 'Active' | 'New';
  runs: {
    sessionId: string;
    score: number;
    coins: number;
    duration: string;
    date: string;
  }[];
}

export interface MerchandiseRewardItem {
  id: string;
  title: string;
  category: string;
  requiredPoints: number;
  isSurprisePickup?: boolean;
  stockTotal: number;
  stockClaimed: number;
  najmaStock: number;
  barwaStock: number;
  imageIcon: string;
}

export interface VoucherClaim {
  id: string;
  voucherCode: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  rewardTitle: string;
  pointsSpent: number;
  showroom: 'Najma' | 'Barwa Village';
  claimedAt: string;
  status: 'VERIFIED_HANDED_OVER' | 'PENDING_PICKUP';
}

export interface WeeklyWinnerRecord {
  weekKey: string;
  weekLabel: string;
  winnerName: string;
  score: number;
  prize: string;
  showroom: string;
  status: 'Awarded' | 'In Progress';
}

export interface TokenBatchRecord {
  batchId: string;
  batchName: string;
  sheetFormat: 'Portrait A3 (36 QRs)' | 'Landscape A3 (16 QRs)';
  showroom: 'Najma' | 'Barwa Village' | 'All Showrooms';
  totalTokens: number;
  claimedTokens: number;
  createdAt: string;
  status: 'Active' | 'Exhausted';
}

// -------------------------------------------------------------
// Realistic Mock Data
// -------------------------------------------------------------

export const MOCK_PLAYERS: DashboardPlayer[] = [
  {
    id: 'pop_cust_01',
    name: 'Ravi Subramanian',
    phone: '5512 8940',
    fullPhone: '+974 5512 8940',
    area: 'Najma Commercial Area',
    showroom: 'Najma',
    bestScore: 92400,
    totalScore: 284500,
    totalCoins: 4850,
    tokensUsed: 4,
    livesRemaining: 2,
    rewardsClaimed: 3,
    lastActive: '12 mins ago',
    registeredDate: '14 Oct 2026',
    status: 'VIP',
    runs: [
      { sessionId: 'sess-8491', score: 92400, coins: 1420, duration: '4m 12s', date: 'Today, 2:15 PM' },
      { sessionId: 'sess-8312', score: 78200, coins: 1100, duration: '3m 45s', date: 'Yesterday' },
      { sessionId: 'sess-7901', score: 64100, coins: 950, duration: '3m 10s', date: '21 Oct 2026' },
    ],
  },
  {
    id: 'pop_cust_02',
    name: 'Mohammed Al-Kuwari',
    phone: '3349 1022',
    fullPhone: '+974 3349 1022',
    area: 'Al Wakrah',
    showroom: 'Barwa Village',
    bestScore: 84500,
    totalScore: 212000,
    totalCoins: 3940,
    tokensUsed: 3,
    livesRemaining: 1,
    rewardsClaimed: 2,
    lastActive: '28 mins ago',
    registeredDate: '16 Oct 2026',
    status: 'Top 10',
    runs: [
      { sessionId: 'sess-9021', score: 84500, coins: 1250, duration: '3m 58s', date: 'Today, 1:40 PM' },
      { sessionId: 'sess-8841', score: 71200, coins: 980, duration: '3m 20s', date: 'Yesterday' },
    ],
  },
  {
    id: 'pop_cust_03',
    name: 'Fatima Al-Thani',
    phone: '6618 4390',
    fullPhone: '+974 6618 4390',
    area: 'Doha Corniche',
    showroom: 'Najma',
    bestScore: 78900,
    totalScore: 195400,
    totalCoins: 3200,
    tokensUsed: 3,
    livesRemaining: 3,
    rewardsClaimed: 2,
    lastActive: '1 hour ago',
    registeredDate: '17 Oct 2026',
    status: 'Top 10',
    runs: [
      { sessionId: 'sess-9112', score: 78900, coins: 1150, duration: '3m 40s', date: 'Today, 1:00 PM' },
    ],
  },
  {
    id: 'pop_cust_04',
    name: 'Tariq Mansoor',
    phone: '5023 7741',
    fullPhone: '+974 5023 7741',
    area: 'Barwa Village Block 4',
    showroom: 'Barwa Village',
    bestScore: 68400,
    totalScore: 146000,
    totalCoins: 2850,
    tokensUsed: 2,
    livesRemaining: 0,
    rewardsClaimed: 1,
    lastActive: '2 hours ago',
    registeredDate: '18 Oct 2026',
    status: 'Active',
    runs: [
      { sessionId: 'sess-8742', score: 68400, coins: 890, duration: '3m 05s', date: 'Today, 11:30 AM' },
    ],
  },
  {
    id: 'pop_cust_05',
    name: 'Ahmed Bin Salem',
    phone: '7790 3125',
    fullPhone: '+974 7790 3125',
    area: 'Al Mansoura',
    showroom: 'Najma',
    bestScore: 61200,
    totalScore: 129000,
    totalCoins: 2400,
    tokensUsed: 2,
    livesRemaining: 2,
    rewardsClaimed: 1,
    lastActive: '3 hours ago',
    registeredDate: '19 Oct 2026',
    status: 'Active',
    runs: [
      { sessionId: 'sess-8541', score: 61200, coins: 810, duration: '2m 50s', date: 'Today, 10:15 AM' },
    ],
  },
  {
    id: 'pop_cust_06',
    name: 'Pradeep Sharma',
    phone: '5588 2309',
    fullPhone: '+974 5588 2309',
    area: 'Industrial Area',
    showroom: 'Najma',
    bestScore: 54800,
    totalScore: 118400,
    totalCoins: 2150,
    tokensUsed: 2,
    livesRemaining: 1,
    rewardsClaimed: 1,
    lastActive: '5 hours ago',
    registeredDate: '20 Oct 2026',
    status: 'Active',
    runs: [
      { sessionId: 'sess-8219', score: 54800, coins: 740, duration: '2m 35s', date: 'Today, 8:45 AM' },
    ],
  },
  {
    id: 'pop_cust_07',
    name: 'Abdullah Al-Kuwari',
    phone: '3311 9084',
    fullPhone: '+974 3311 9084',
    area: 'Al Wakrah East',
    showroom: 'Barwa Village',
    bestScore: 48900,
    totalScore: 94000,
    totalCoins: 1820,
    tokensUsed: 1,
    livesRemaining: 0,
    rewardsClaimed: 1,
    lastActive: 'Yesterday',
    registeredDate: '21 Oct 2026',
    status: 'Active',
    runs: [
      { sessionId: 'sess-7912', score: 48900, coins: 690, duration: '2m 15s', date: 'Yesterday' },
    ],
  },
  {
    id: 'pop_cust_08',
    name: 'Jassim Al-Emadi',
    phone: '6645 1928',
    fullPhone: '+974 6645 1928',
    area: 'Old Airport Road',
    showroom: 'Najma',
    bestScore: 36500,
    totalScore: 72000,
    totalCoins: 1450,
    tokensUsed: 1,
    livesRemaining: 2,
    rewardsClaimed: 0,
    lastActive: 'Yesterday',
    registeredDate: '22 Oct 2026',
    status: 'New',
    runs: [
      { sessionId: 'sess-7640', score: 36500, coins: 520, duration: '1m 55s', date: 'Yesterday' },
    ],
  },
  {
    id: 'pop_cust_09',
    name: 'Suresh Kumar',
    phone: '5019 4482',
    fullPhone: '+974 5019 4482',
    area: 'Barwa Village Shop 9',
    showroom: 'Barwa Village',
    bestScore: 29800,
    totalScore: 59600,
    totalCoins: 1100,
    tokensUsed: 1,
    livesRemaining: 1,
    rewardsClaimed: 0,
    lastActive: '2 days ago',
    registeredDate: '21 Oct 2026',
    status: 'New',
    runs: [
      { sessionId: 'sess-7401', score: 29800, coins: 410, duration: '1m 40s', date: '21 Oct 2026' },
    ],
  },
  {
    id: 'pop_cust_10',
    name: 'Khalid Al-Hajri',
    phone: '7722 0914',
    fullPhone: '+974 7722 0914',
    area: 'Doha Al Jadeed',
    showroom: 'Najma',
    bestScore: 18400,
    totalScore: 36800,
    totalCoins: 780,
    tokensUsed: 1,
    livesRemaining: 0,
    rewardsClaimed: 0,
    lastActive: '3 days ago',
    registeredDate: '20 Oct 2026',
    status: 'New',
    runs: [
      { sessionId: 'sess-7104', score: 18400, coins: 290, duration: '1m 20s', date: '20 Oct 2026' },
    ],
  },
];

export const MOCK_REWARDS_CATALOGUE: MerchandiseRewardItem[] = [
  {
    id: 'pop-reward-keychain',
    title: 'Keychain / Pen / Cap',
    category: 'Showroom Accessories',
    requiredPoints: 5000,
    stockTotal: 300,
    stockClaimed: 84,
    najmaStock: 120,
    barwaStock: 96,
    imageIcon: '🧢',
  },
  {
    id: 'pop-reward-diary',
    title: 'Executive Brand Diary',
    category: 'Corporate Stationery',
    requiredPoints: 10000,
    stockTotal: 150,
    stockClaimed: 42,
    najmaStock: 65,
    barwaStock: 43,
    imageIcon: '📖',
  },
  {
    id: 'pop-reward-diary-box',
    title: 'Premium Diary Box Set',
    category: 'Executive Gift Sets',
    requiredPoints: 16000,
    stockTotal: 100,
    stockClaimed: 29,
    najmaStock: 45,
    barwaStock: 26,
    imageIcon: '🎁',
  },
  {
    id: 'pop-reward-watch-shirt',
    title: 'Exclusive Watch / T-Shirt',
    category: 'Apparel & Timepieces',
    requiredPoints: 30000,
    stockTotal: 80,
    stockClaimed: 18,
    najmaStock: 35,
    barwaStock: 27,
    imageIcon: '⌚',
  },
  {
    id: 'pop-reward-lulu-voucher',
    title: 'LuLu 100 QAR Coupon',
    category: 'In-Game Rare Track Pickup',
    requiredPoints: 0,
    isSurprisePickup: true,
    stockTotal: 50,
    stockClaimed: 14,
    najmaStock: 20,
    barwaStock: 16,
    imageIcon: '🎟️',
  },
];

export const MOCK_RECENT_CLAIMS: VoucherClaim[] = [
  {
    id: 'claim-101',
    voucherCode: 'POP-7429-QAT',
    customerId: 'pop_cust_01',
    customerName: 'Ravi Subramanian',
    customerPhone: '+974 5512 8940',
    rewardTitle: 'Executive Watch / T-Shirt',
    pointsSpent: 30000,
    showroom: 'Najma',
    claimedAt: 'Today, 2:18 PM',
    status: 'VERIFIED_HANDED_OVER',
  },
  {
    id: 'claim-102',
    voucherCode: 'POP-9041-QAT',
    customerId: 'pop_cust_02',
    customerName: 'Mohammed Al-Kuwari',
    customerPhone: '+974 3349 1022',
    rewardTitle: 'Premium Diary Box Set',
    pointsSpent: 16000,
    showroom: 'Barwa Village',
    claimedAt: 'Today, 1:45 PM',
    status: 'PENDING_PICKUP',
  },
  {
    id: 'claim-103',
    voucherCode: 'POP-6218-QAT',
    customerId: 'pop_cust_03',
    customerName: 'Fatima Al-Thani',
    customerPhone: '+974 6618 4390',
    rewardTitle: 'Executive Brand Diary',
    pointsSpent: 10000,
    showroom: 'Najma',
    claimedAt: 'Today, 1:04 PM',
    status: 'VERIFIED_HANDED_OVER',
  },
  {
    id: 'claim-104',
    voucherCode: 'POP-4820-QAT',
    customerId: 'pop_cust_04',
    customerName: 'Tariq Mansoor',
    customerPhone: '+974 5023 7741',
    rewardTitle: 'Keychain / Pen / Cap',
    pointsSpent: 5000,
    showroom: 'Barwa Village',
    claimedAt: 'Today, 11:35 AM',
    status: 'VERIFIED_HANDED_OVER',
  },
  {
    id: 'claim-105',
    voucherCode: 'POP-3319-QAT',
    customerId: 'pop_cust_05',
    customerName: 'Ahmed Bin Salem',
    customerPhone: '+974 7790 3125',
    rewardTitle: 'Keychain / Pen / Cap',
    pointsSpent: 5000,
    showroom: 'Najma',
    claimedAt: 'Today, 10:20 AM',
    status: 'PENDING_PICKUP',
  },
  {
    id: 'claim-106',
    voucherCode: 'POP-1980-LULU',
    customerId: 'pop_cust_02',
    customerName: 'Mohammed Al-Kuwari',
    customerPhone: '+974 3349 1022',
    rewardTitle: 'LuLu 100 QAR Coupon',
    pointsSpent: 0,
    showroom: 'Barwa Village',
    claimedAt: 'Yesterday, 6:15 PM',
    status: 'VERIFIED_HANDED_OVER',
  },
];

export const MOCK_WEEKLY_WINNERS: WeeklyWinnerRecord[] = [
  {
    weekKey: 'week-2026-42',
    weekLabel: '14 Oct – 20 Oct 2026',
    winnerName: 'Ravi Subramanian',
    score: 92400,
    prize: 'PET Grand Gift Bag (T-Shirt, Watch, Book Case)',
    showroom: 'Najma Showroom',
    status: 'Awarded',
  },
  {
    weekKey: 'week-2026-41',
    weekLabel: '07 Oct – 13 Oct 2026',
    winnerName: 'Ali Al-Hammadi',
    score: 87100,
    prize: 'PET Grand Gift Bag (T-Shirt, Watch, Book Case)',
    showroom: 'Barwa Village Showroom',
    status: 'Awarded',
  },
  {
    weekKey: 'week-2026-40',
    weekLabel: '30 Sep – 06 Oct 2026',
    winnerName: 'Fahad Al-Marri',
    score: 81500,
    prize: 'PET Grand Gift Bag (T-Shirt, Watch, Book Case)',
    showroom: 'Najma Showroom',
    status: 'Awarded',
  },
  {
    weekKey: 'week-2026-39',
    weekLabel: '23 Sep – 29 Sep 2026',
    winnerName: 'Sultan Al-Kuwari',
    score: 76800,
    prize: 'PET Grand Gift Bag (T-Shirt, Watch, Book Case)',
    showroom: 'Barwa Village Showroom',
    status: 'Awarded',
  },
];

export const MOCK_TOKEN_BATCHES: TokenBatchRecord[] = [
  {
    batchId: 'BATCH-NAJMA-04',
    batchName: 'Najma Counter A3 Sheet #04',
    sheetFormat: 'Portrait A3 (36 QRs)',
    showroom: 'Najma',
    totalTokens: 36,
    claimedTokens: 34,
    createdAt: '22 Oct 2026',
    status: 'Active',
  },
  {
    batchId: 'BATCH-BARWA-02',
    batchName: 'Barwa Village Cashier Sheet #02',
    sheetFormat: 'Portrait A3 (36 QRs)',
    showroom: 'Barwa Village',
    totalTokens: 36,
    claimedTokens: 31,
    createdAt: '21 Oct 2026',
    status: 'Active',
  },
  {
    batchId: 'BATCH-VIP-01',
    batchName: 'VIP Customer Pass Set',
    sheetFormat: 'Portrait A3 (36 QRs)',
    showroom: 'All Showrooms',
    totalTokens: 36,
    claimedTokens: 18,
    createdAt: '19 Oct 2026',
    status: 'Active',
  },
];
