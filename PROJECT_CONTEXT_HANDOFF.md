# ⚡ Popular Sparky (Sparky Run) — Master Project Context & Handoff Guide

> **Quick Instructions for New Chat:**  
> Provide or reference this file at the start of any new session. It contains the complete architectural map, current progress, file navigation guide, business rules, and immediate next steps.

---

## 1. Project Overview & Business Goals

### What is this project?
**Sparky Run** is an endless 3D web-based runner game built for **Popular Electricals & Trading Co. W.L.L (PET)**, a leading electrical trading company in Qatar (showrooms in Najma and Barwa Village).

### Primary Business Objectives:
1. **Showroom Footfall & Marketing Engagement**: Customers at Popular Electricals showrooms scan physical QR codes (printed on A3 flyer sheets, standees, or receipts) to unlock **3 gameplays per token**.
2. **Customer Profiles & Lead Capture**: Before playing, customers register their Name, Mobile Number, and Qatar ID / Showroom Area.
3. **Gamified Rewards & Store Merchandise**:
   - **5,000 pts**: Keychain OR Pen OR Cap
   - **10,000 pts**: Diary
   - **16,000 pts**: Diary Box
   - **30,000 pts**: Watch OR T-Shirt
   - **In-Game Surprise Gift**: LuLu 100 Riyal Voucher Coupon (spawns inside the run track itself, not based on score).
   - **Weekly High Scorer**: Strictly **1 Weekly Winner** awarded the **PET Gift Bag** (T-Shirt, Watch, Book Case).
4. **Multi-Token Lifetime Cumulative Scoring**:
   - Each customer can use multiple QR tokens over time.
   - Every run score accumulates into a lifetime **Total Score** (`totalScore`) alongside a personal **Best Score** (`bestScore`), driving global leaderboard rank.

---

## 2. Core Brand Identity & Theme Rules

* **Brand Colors**:
  * **Popular Red**: `#ED1C24` (Primary brand accent, glowing rings, CTA gradients, laser lines).
  * **Crisp Clean White**: `#FFFFFF` (Card chasses, modal backgrounds, text panels).
  * **Slate / Charcoal Typography**: `#111827`, `#374151`, `#4B5563`.
* **Visual Aesthetic**: Sleek light-mode glassmorphism with red drop-shadows and subtle red ambient atmospheric glows.
* **CRITICAL CONSTRAINT**: **DO NOT ALTER THE 3D GAMEPLAY VIEW.**
  The 3D Three.js runner canvas, running track, obstacle physics, coin collecting, and in-game HUD must remain strictly preserved unless explicitly instructed.

---

## 3. Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend Framework** | React 19, TypeScript, Vite |
| **3D Engine** | Three.js (`0.186.1`), `@react-three/fiber`, `@react-three/drei` |
| **Styling** | Vanilla CSS with custom tokens in `src/styles/global.css` |
| **Audio** | HTML5 Audio (`bgm.mp3`, `coin.mp3`) + Web Audio API synthesizer |
| **QR Engine** | `jsQR` (real-time camera frame decoding), `qrcode` (SVG/Canvas generation) |
| **PDF Generation** | `jspdf` (High-DPI print-ready A3 sheets) |
| **Backend Server** | Node.js + Express in `D:\Oqulix\Oqulix Projects\GameFaktory\The Gamefaktory Server\server` |
| **Database & ORM** | PostgreSQL managed via **Prisma ORM** (`schema.prisma`) |

---

## 4. "Where to Edit" Quick-Reference Map

Use this directory map whenever a specific feature or UI component needs changes:

| If you need to edit / look into... | Primary File Path | What It Handles |
| :--- | :--- | :--- |
| **Home Screen Layout & Flow** | `src/components/ui/HomeScreen.tsx` | Logo, stats row, play button, lives capsule, scan CTA, modals. |
| **Big Hexagonal Play Button** | `src/components/ui/PlayButtonHex.tsx` | 3D SVG bevel button, disabled grayscale state, pulse animations. |
| **Lives Left Display (Hearts)** | `src/components/ui/LivesLeftDisplay.tsx` | 3 vector heart containers (symmetrical SVG paths) with pulse. |
| **Live Camera QR Scanner Modal** | `src/components/ui/QrScannerModal.tsx` | Real-time camera viewfinder via `jsQR`, laser sweep, auto verification. |
| **A3 Print Sheet PDF Generator** | `src/utils/a3SheetGenerator.ts`<br>`scripts/generate_portrait_a3_pdf.cjs` | 4x9 grid (36 coupons), `SARKPNG.png` coordinate mapping, crop marks. |
| **Coupon Artwork Template** | `public/SARKPNG.png`<br>`public/Popular_Sparky_A3_Test_Sheet.pdf` | High-res 1530x1028 coupon card with QR white space. |
| **Customer Registration / Onboarding** | `src/components/ui/CustomerRegistrationModal.tsx` | Form modal for customer name, mobile, Qatar area/ID. |
| **Leaderboard (Daily & All-Time)** | `src/components/ui/LeaderboardModal.tsx` | Tabbed rankings, Top-3 floating podiums, current player rank card. |
| **Rewards Hub & Weekly Winners** | `src/components/ui/RewardsModal.tsx` | 5 merchandise milestone cards, 1 weekly winner card with calendar icon. |
| **Game Over Screen** | `src/components/ui/GameOverScreen.tsx` | Run stats, distance, coins, lives countdown, retry/home buttons. |
| **In-Game HUD** | `src/components/ui/ScoreDisplay.tsx` | Distance meter, coin counter, heart containers, magnet/turbo timers. |
| **Frontend API & Local/Server Sync** | `src/services/popularApi.ts` | Token verification, session start/end, anti-cheat checks, local persistence. |
| **API Specification Documentation** | `QR_TOKEN_API_SPECIFICATION.md` | Full REST payload contracts for Express & PostgreSQL. |
| **Master Game Loop & Physics** | `src/game/engine.ts` | Speed curve, procedural generation, obstacle collision, coin magnets. |
| **Sparky 3D Model & Bones** | `src/components/game/CharacterModel.tsx`<br>`src/components/game/Player.tsx` | Sparky 3D GLTF model, running/jumping/rolling animations, lane damping. |
| **3D Track & Bending Shader** | `src/components/game/Track.tsx`<br>`src/shaders/bendMaterial.ts` | Curved horizon world shader, lane tracks, roadside scenery. |
| **Coins & Powerups** | `src/components/game/Crystals.tsx`<br>`src/components/game/Magnets.tsx`<br>`src/components/game/Powerups.tsx` | 3D spinning gold coins, U-magnet pickups, turbo lightning bolts. |
| **All Global Styles & Tokens** | `src/styles/global.css` | 5,500+ lines of CSS tokens, animations, responsive breakpoints. |
| **The Gamefaktory Server** | `D:\Oqulix\Oqulix Projects\GameFaktory\The Gamefaktory Server\server` | `prisma/schema.prisma`, `index.js` (PostgreSQL endpoints). |
| **Project Change Trackers** | `project tracker.md`<br>`project tracker..md` | **MANDATORY**: Keep both files 100% synchronized with every change. |

---

## 5. Key Architecture Patterns & Rules

### A. Server-Authoritative 3-Life QR Tokens
1. **Token Ingestion**:
   - Customer arrives via URL (`?token=122ERF` or `?t=...`) or scans in-app via the camera QR scanner.
   - Tokens are validated against the database / authorized list (e.g. `122ERF`, `PET-9XK2-MP8A`, `PET-BARWA-01`, `PET-NAJMA-02`, `PET-VIP-2026`). Fake arbitrary strings are strictly rejected.
2. **Session Lifecycle**:
   - Clicking **PLAY** starts a session via `popularApi.startGameSession(token)`.
   - Decrements 1 life in the database (from 3 down to 0).
   - Generates a cryptographically random session ID.
   - When the run ends, `popularApi.endGameSession(...)` verifies the matching session ID and audits score.
3. **Anti-Cheat Velocity Guard**:
   - Max coin collection velocity bound: $\le 25\text{ coins / second}$. Submissions violating physical probability are flagged.
4. **Token Gating on Home Screen**:
   - If `activeToken` is missing, invalid, or has 0 lives left:
     - The **Play Button** is **disabled** (`grayscale(0.88)`, `opacity(0.48)`, `cursor: not-allowed`).
     - Directly below the hearts, a pulsing button appears: **"📷 You have no lives left, click to scan token ➔"**.
   - If user has $> 0$ lives, the scan button is **hidden**, hearts indicate remaining lives, and the Play button is fully enabled.

### B. In-Game Camera QR Scanner (`QrScannerModal.tsx`)
- Pure auto-scanning camera viewfinder via `navigator.mediaDevices.getUserMedia` and `jsQR`.
- 4 chamfered Popular Red corner brackets + animated laser sweep line.
- Automatically isolates token code from full URLs (`https://sparkyrun.gamefaktory.com/?token=...`) or raw codes.
- Immediate validation against the database; on success, awards 3 lives and unlocks the Play button.
- Clean camera permission fallback notice. No manual code inputs or image upload clutter.

### C. A3 Print Sheet Generator (`a3SheetGenerator.ts`)
- Template: `public/SARKPNG.png` (1530 × 1028 px).
- White QR Box Coordinates:
  - Width: 294 px (X: 1174 to 1468, CenterX: 1321).
  - Height: 275 px (Y: 312 to 587, CenterY: 450).
  - Embedded QR: $240 \times 240\text{ px}$ centered at $(1201, 330)$, leaving quiet zone margins on all sides directly above the red *"SCAN TO PLAY"* badge.
- Sheet Format: **Portrait A3 (`297 mm × 420 mm`)** with a **4 × 9 grid (36 coupons per sheet)**. Each coupon is $69\text{ mm} \times 44.5\text{ mm}$ with cutting crop marks.
- Quick test download button: `🖨️ TEST A3 SHEET` located in the top-right header of `HomeScreen.tsx`.

---

## 6. Current Implementation Status (Milestones 1 – 71)

* [x] **Milestones 1–51**: 3D character animations, lane controls, coins, magnetic attraction, turbo lightning, curved horizon shaders, sound effects.
* [x] **Milestone 52**: Weekly Winners & Merchandise Rewards (5k, 10k, 16k, 30k tiers, LuLu voucher, 1 weekly winner PET gift bag).
* [x] **Milestone 53**: Decluttered Rewards page and streamlined Weekly Winners card layout.
* [x] **Milestone 54**: Full Brand Conversion to Pure White and Popular Red (`#ED1C24`) light theme across Login, Home, Leaderboard, and Rewards.
* [x] **Milestone 55**: QR Token Authentication, Server-Authoritative 3-Life Sessions, Anti-Cheat & Cumulative Score Engine (`QR_TOKEN_API_SPECIFICATION.md`).
* [x] **Milestone 56**: Play Button Token Gate & Live Camera QR Scanner Modal (`QrScannerModal.tsx`).
* [x] **Milestone 57**: Removed redundant lives pill; show "You have no lives left, click to scan token" strictly when lives = 0; streamlined scanner to pure auto camera.
* [x] **Milestone 58**: Relocated stats row (RANK, BEST, TOTAL) directly above the Play button and below the Sparky Run logo.
* [x] **Milestone 59**: Analyzed `SARKPNG.png` and created A3 sheet print generator with pixel-perfect QR placement.
* [x] **Milestone 60**: Reconfigured A3 sheet generator to **Portrait A3 (4x9 grid = 36 coupons per sheet)** with in-game download button.
* [x] **Milestone 61**: Implemented Multi-Tenant Brand-Isolated QR Tokens & Live Backend Integration. PostgreSQL `QrToken` model synced via Prisma with `brandId` and `gameSlug`. Seeded `popular` brand and official test tokens (`122ERF`, `PET-9XK2-MP8A`, `PET-BARWA-01`, `PET-NAJMA-02`, `PET-VIP-2026`, `PET-DEMO-VIP3`). Express endpoints `/api/v1/tokens/verify`, `/api/token/verify`, and `/api/v1/tokens/batch-create` verified live on port 5000 with cross-brand 403 isolation. Configured Vite proxy and frontend `popularApi.ts` client.
* [x] **Milestone 62**: Responsive Admin Dashboard for Popular Electricals (`/dashboard`). Configured route-based mounting in `App.tsx` with pushState and `#` support. Designed in official Popular Red (`#ED1C24`) and White light theme with official PET logo. Built 3 side panels: **Home** (Showroom footfall for Najma & Barwa, KPI cards, token life health, live customer feed), **Players** (CRM table with search, showroom filters, tier badges, interactive run audit modal), and **Rewards** (Merchandise stock tracker, counter cashier verification portal with 'Verify & Hand Over' action, and Weekly High Scorer Hall of Fame). Added 1-click header navigation.
* [x] **Milestone 63**: Switchable Backend Authentication (Mobile Number & Name) via Better Auth & PostgreSQL. Created `.env` and `.env.production` with centralized `src/config/api.ts`. Built `src/services/authService.ts` (`checkMobileNumber` via `POST /api/login`, `registerPlayer` via `POST /api/register`). Wired into `CustomerRegistrationModal.tsx` and `popularApi.ts` preserving all existing UI, styling, and 3D scenes 100%. Verified live registration and login against PostgreSQL backend.
* [x] **Milestone 64**: Normalized API Route Endpoints (`/api`) & Fixed QR Token Lives Verification (`PET-VIP-2026`). Resolved 404 error where `verifyToken` called `/token/verify` instead of `/api/token/verify`. Updated `popularApi.ts` to consistently prefix `/api` across all backend calls, construct full `QrToken` cache in `localStorage`, and return `livesRemaining: 3` for valid tokens. Preserved 3D gameplay view 100%.
* [x] **Milestone 65**: Streamlined Top-Right Header (Token Code Display) & Server-Authoritative Life Decrement Engine. Replaced dashboard and print buttons in `HomeScreen.tsx` with a clean `.home-top-token-badge` displaying the active token code (`TOKEN: PET-VIP-2026`). Implemented `POST /api/game/start-session` (and `/api/v1/tokens/consume`) in `server/index.js` which atomically decrements `livesRemaining = livesRemaining - 1` in PostgreSQL and marks the token `EXHAUSTED` at 0 lives. Verified 4-step decrement sequence (3 -> 2 -> 1 -> 0 lives) and reset `PET-VIP-2026` to 3 lives for immediate gameplay.
* [x] **Milestone 66**: Brand-Isolated Game Sessions & Score Recording Engine with Admin Sessions Audit. Segregated all gameplay runs strictly by brand in PostgreSQL: `POST /api/game/start-session` (creates `GameSession` linked to `brandId = brand.id`, decrements QR token life) and `POST /api/game/end-session` (verifies session, records score/duration, calculates brand-isolated best score and cumulative total score). Verified 100% brand isolation against PostgreSQL: sessions recorded for `popular` (`sparky-run`) return 0 sessions for other brands (`railrolls`). Added `GET /api/brands/:brandSlug/players` and `GET /api/brands/:brandSlug/players/:userId/sessions`. Enhanced `DashboardPlayers.tsx` to load live database players and provided an interactive 'Inspect' drawer/modal displaying all sessions (Date/Time in Qatar AST, Score, Duration, and Status).
* [x] **Milestone 67**: Coins Collected as Authoritative Gameplay Score. Clarified that the authoritative gameplay score is the **coins collected** (not distance/run meters). Updated `GameOverScreen.tsx` to submit `coins` as the authoritative score to `endGameSession` and `submitScore`, updated local best calculation in `engine.ts` (`Math.max(coins, best)`), updated `GameOverScreen` big score display to prominently feature coins (`🪙`) with secondary distance display, and updated `server/index.js` `end-session` endpoint to store `req.body.coins` into `GameSession.score`. Verified live against PostgreSQL.
* [x] **Milestone 68**: Streamlined GameOver Screen: Pure Coins, Homepage Heart-Like Lives Left & Essential Actions. Stripped all subtitles (`Best`, `Total`, `Run`), rank banners, and keyboard hints from `GameOverScreen.tsx`. Embedded `LivesLeftDisplay` featuring the white pill, red accent borders, and 3 SVG glowing hearts. Disabled Enter/Space restart listeners in `useKeyboardControls.ts` and retained strictly **'Run again'** (if lives > 0) and **'Back to home'**.
* [x] **Milestone 69**: Direct PostgreSQL Player Fetching & Interactive Brand Game History Modal. Overhauled `DashboardPlayers.tsx` to fetch exclusively from `GET /api/brands/popular/players`, displaying actual registered players (Hussain, Rashid) with exact games played, best coins score, and cumulative total. Clicking any player row or 'View Games' opens a comprehensive modal displaying player identity, phone, showroom, brand chips, and a full game history table showing every session (#, Qatar AST Date/Time, Coins/Score, Duration, Status). Connected `DashboardHome.tsx` to display real registered player count, total games played, and real high scorers from PostgreSQL.
* [x] **Milestone 70**: Instant Player Modal on Dashboard Home with Clean Metrics and Date-Grouped Horizontal Cards. Overhauled player interaction from Dashboard Home: clicking any player row opens their modal immediately without switching to the Players tab. Purged all unnecessary metadata (showroom, brand, game name). Displayed strictly Player Name & Phone Number in the header, 3 essential summary cards (Games Played, Best Score, Total Score), and grouped all played games under bold date headings (`23 Oct 2026`) rendered as sleek horizontal cards showing game session number, time (Qatar AST), duration, and score (🪙). Extracted into a shared `PlayerDetailsModal.tsx` for 100% design consistency across Dashboard Home and Players views. Verified cleanly with TypeScript and Vite build.
* [x] **Milestone 71**: Side Panel Red & White Brand Theme Overhaul (`dashboard.css`). Converted the dashboard side panel (`.pet-sidebar`) from full white (`#FFFFFF`) to the official Popular Red (`var(--pet-red)` `#ED1C24`). Configured the header with crisp white text (`#FFFFFF`) and 80% opacity subtitle (`rgba(255, 255, 255, 0.82)`). Unselected tabs display clean semi-transparent white text and icons (`rgba(255, 255, 255, 0.88)`), while the active selected tab renders as an elevated crisp white card (`background: #FFFFFF`) with bold red text (`#ED1C24`) and icon, eliminating the plain all-white side panel appearance.
* [x] **Milestone 72**: Admin Login Protection & Brand Scoping for `/dashboard`. Protected `/dashboard` with an Admin Auth Gate modal (`AdminLoginModal.tsx`) requiring registered Email/Username and Password (`admin@sparkyrun.com`). Connected `popularApi.adminLogin` against GameFaktory backend (`POST /api/admin/login`) with strict multi-tenant brand isolation (`brandSlug: 'popular-electricals-qatar'`). Stored session in `sessionStorage` (`gf_admin_token`, `gf_admin_user`) for automatic persistence across page refreshes. Scoped player roster, KPIs, and session audits strictly to `popular-electricals-qatar`. Added a header `[ Logout ]` button (`IconLogout`) that immediately clears `sessionStorage` and returns to the Admin Auth Gate.
* [x] **Milestone 73**: Live Weekly & All-Time Leaderboard Integration (`GET /api/leaderboard/weekly`, `GET /api/leaderboard/all-time`). Connected `LeaderboardModal.tsx` and `popularApi.ts` to live GameFaktory backend endpoints with `brand=popular-electricals-qatar`. Weekly tab displays players ranked by single highest score for the current week (Sunday to Saturday), while All-Time tab displays players ranked by cumulative total points across all runs, accompanied by their personal best and games played count. Highlighted the active logged-in player with "(You)" badges and smooth animations. Fallbacks preserved for offline resiliency. Verified via live curl probe, TypeScript type checking, and Vite production build.
* [x] **Milestone 74**: Live Brand-Scoped Player Stats Integration (`GET /api/player/stats?brand=...`). Implemented `popularApi.getPlayerBrandStats` querying the backend endpoint with phone, userId, or token code. Synchronized personal `highestScore` (Best) and `totalPoints` (Cumulative Total) in real time: on initial mount in `HomeScreen.tsx`, immediately upon registration or login in `handleCustomerRegistered`, and when game runs finish in `GameOverScreen.tsx`. Robust local fallback preserved for seamless offline play. Verified with `npx tsc --noEmit` and production build.
* [x] **Milestone 75**: Unranked State for New Players (`RANK —`). Updated `HomeScreen.tsx` to detect when a player has completed 0 games and has 0 score (`gamesPlayed === 0 && totalPoints === 0 && highestScore === 0`). Instead of assigning a misleading `#1` or generic tail rank `#51`, the Home Screen displays an unranked dash (`RANK —`) with the tooltip *"Play a game to get ranked on the leaderboard!"*. As soon as the player finishes their first run, their live global rank (`#1`, `#2`, etc.) unlocks and displays automatically. Validated cleanly with `npx tsc --noEmit`.
* [x] **Milestone 76**: Secure Backend-Authoritative Reward Coupon Creation, Balance Deduction & Cashier Redemption (`/dashboard`).
  - **Zero Trust Security**: The frontend does not generate coupon codes or dictate coin deductions. Instead, `popularApi.claimReward` sends only the user's intent (`brandSlug: 'popular-electricals-qatar'`, `rewardId`, `phone`, `userId`) to `POST /api/coupons/claim`. The backend verifies the player's lifetime earned coins from PostgreSQL `GameSession` records, calculates available balance, generates the cryptographically unique coupon code (`PET-XXXX-QAT`), saves the record as `PENDING`, and returns the created coupon along with the new remaining balance.
  - **Player Active Pending Vouchers**: Added `popularApi.getPendingVouchers` (`GET /api/coupons/pending?brand=...&phone=...`). Only shows pending/active vouchers with barcodes; once redeemed by cashier, coupons automatically disappear from player view.
  - **Cashier Redemption Table in Dashboard**: In `DashboardRewards.tsx`, added a live "Customer Store Coupons & Redemption" management table with filter tabs (`Pending`, `Redeemed`, `All`), displaying unique coupon codes (`PET-XXXX-QAT`), customer name, phone, redeemed coins, and a one-click **"Redeem Coupon"** cashier action calling `POST /api/coupons/redeem`.
  - Passed `npx tsc --noEmit` with zero errors.
* [x] **Milestone 77**: Full Backend Server Authority Alignment (`5d672e3`).
  - Connected zero-trust claim intent (`brandSlug`, `rewardId`, `phone`, `userId`) against `POST /api/coupons/claim`.
  - Added pending vouchers retrieval (`GET /api/coupons/pending`) and cashier redemption table in `/dashboard` (`POST /api/coupons/redeem`).
* [x] **Milestone 78**: Official Reward Coin Scheme Restoration.
  - Set the exact merchandise reward costs and individual item IDs requested:
    - `rw_keychain`: **1,000 Coins** → Keychain
    - `rw_pen`: **1,500 Coins** → Pen
    - `rw_cap`: **1,500 Coins** → Cap
    - `rw_diary`: **2,000 Coins** → Diary
    - `rw_diary_box`: **4,000 Coins** → Diary Box
    - `rw_watch`: **6,000 Coins** → Watch
    - `rw_shirt`: **8,000 Coins** → T-Shirt
    - `pop-reward-surprise-lulu`: In-Game LuLu 100 QAR Voucher Surprise Gift
  - Validated with `npx tsc --noEmit` (0 errors).
* [x] **Milestone 79**: Clean Voucher Details Modal, Repeatable Claims & Floating Animated Homepage Reward Button.
  - **Clean Voucher Dialog (`VoucherDetailsModal.tsx`)**: Removed the simulated barcode entirely. Cleanly displays the Official Reward Code (`PET-XXXX-QAT`), Customer Name, Phone Number, Coins Used (`🪙 X,XXX Coins`), and Redemption Status. Includes tab switching if a player holds multiple active vouchers.
  - **Repeatable Claims UI**: Restored the classic claim button behavior in `RewardsModal.tsx`. If a user accumulates enough coins, they can claim the same reward repeatedly without being locked out by a "View" button.
  - **"Your Claimed Rewards" Section**: Added an active vouchers drawer directly below the instructions in the Rewards tab with clickable cards to inspect any active voucher.
  - **Homepage Floating Pulsing & Shaking Button**: Added `.home-floating-reward-pill` to `HomeScreen.tsx` that floats, pulses, and shakes at the bottom-right whenever the player holds active pending vouchers (`activeVouchers.length > 0`), opening the coupon details immediately when clicked.
  - Verified with `npx tsc --noEmit` (0 errors).
* [x] **Milestone 80**: Spendable Total Score & Leaderboard Coin Deduction Mechanism.
  - Clarified and implemented the spendable leaderboard mechanism: whenever a player redeems a reward (e.g. 1,000 for Keychain), their `totalScore` decreases on both their profile and the All-Time Leaderboard.
  - Updated `getAllTimeLeaderboard` in `popularApi.ts` to deduct `totalClaimedDeduction` from the player's cumulative score so their leaderboard rank drops accordingly. If their score reaches 0, their rank becomes unranked (`RANK —`) until they play more runs and collect fresh coins.
  - Formulated backend instructions for `GET /api/leaderboard/all-time` SQL aggregation so PostgreSQL ranks players by net spendable points (`SUM(GameSession.score) - SUM(RewardCoupon.redeemedCoins)`).
* [x] **Milestone 81**: Weekly Leaderboard Sunday 12:00 AM Qatar Time Reset & Live Time Left Prize Banner.
  - Aligned the weekly competition reset strictly to **Sunday 12:00 AM Qatar Time (AST, UTC+3)** (= Saturday 21:00 UTC).
  - Added `getQatarWeeklyCycle()` in [popularApi.ts](file:///d:/Oqulix/Oqulix%20Projects/GameFaktory/doha-dash/popular-sparky/src/services/popularApi.ts) calculating exact live ms, days, hours, minutes, and seconds until the next Qatar Sunday reset.
  - Added a prominent live-updating banner in [LeaderboardModal.tsx](file:///d:/Oqulix/Oqulix%20Projects/GameFaktory/doha-dash/popular-sparky/src/components/ui/LeaderboardModal.tsx) (`.smooth-lb-weekly-banner`) on the **Weekly** tab displaying:
    - Pulsing red dot with `WEEKLY CHAMPION RACE`.
    - Live countdown pill: `⏱️ Xd Xh Xm left` (updating every second).
    - Gift badge: `🎁 Weekly #1 Grand Prize: PET Gift Bag with T-Shirt, Watch and Book Case`.
  - Added modern glassmorphic styling and subtle micro-animations in [global.css](file:///d:/Oqulix/Oqulix%20Projects/GameFaktory/doha-dash/popular-sparky/src/styles/global.css).
  - Validated cleanly with `npx tsc --noEmit` (0 errors).
* [x] **Milestone 82**: Dashboard Rewards Overhaul — Search Toolbar & Modern Card Grid.
  - Removed outdated hardcoded mock tables (`MOCK_WEEKLY_WINNERS` and `MOCK_SPECIAL_GIFT_WINNERS`) from [DashboardRewards.tsx](file:///d:/Oqulix/Oqulix%20Projects/GameFaktory/doha-dash/popular-sparky/src/components/dashboard/DashboardRewards.tsx).
  - Converted the plain table layout into a responsive grid of interactive reward cards (`.pet-coupon-cards-grid`, `.pet-coupon-card`).
  - Implemented real-time search filtering across **Customer Name**, **Phone Number**, **Reward ID** (e.g. `rw_keychain`), and **Voucher Code** (e.g. `PET-XXXX-QAT`).
  - Added visual states for `PENDING` (rose border, prominent red voucher code, and 1-click Cashier "Mark as Redeemed" button) vs. `REDEEMED` (soft gray chassis with completed timestamp badge).
* [x] **Milestone 83**: Live Weekly Winners API Integration & Champion Highlight Banner.
  - Tested and connected backend endpoint `GET /api/leaderboard/weekly/winners?brand=popular-electricals-qatar`. Verified the live demo record in PostgreSQL (`hussain`, 1,250 points, `18 Oct - 24 Oct 2026`).
  - Added typed interface `WeeklyWinnerRecord` and `fetchWeeklyWinners()` function in [popularApi.ts](file:///d:/Oqulix/Oqulix%20Projects/GameFaktory/doha-dash/popular-sparky/src/services/popularApi.ts).
  - Wired `getPreviousWeeklyWinners()` to fetch from the live database endpoint with graceful fallback for offline/preview environments.
  - Added amber champion card (`.smooth-champion-highlight-card`) to the Weekly tab in [LeaderboardModal.tsx](file:///d:/Oqulix/Oqulix%20Projects/GameFaktory/doha-dash/popular-sparky/src/components/ui/LeaderboardModal.tsx) showcasing `🏆 Last Week's Champion (18 Oct - 24 Oct 2026)` with winner name, prize title, and winning score (`1,250 PTS`).
* [x] **Milestone 85**: SweetAlert2 Integration for Cashier Redemption.
  - Installed `sweetalert2` dependency.
  - Replaced native `window.confirm` and `alert` in [DashboardRewards.tsx](file:///d:/Oqulix/Oqulix%20Projects/GameFaktory/doha-dash/popular-sparky/src/components/dashboard/DashboardRewards.tsx) with branded SweetAlert2 dialogs:
    - **Confirmation Modal**: Detailed card displaying the Voucher Code, Reward Item, Customer Name, and Customer Phone with Popular Red confirm button (`✓ Yes, Mark Redeemed`) and Cancel option.
    - **Success Toast**: Auto-dismissing success alert with a 3-second progress timer confirming redemption.
    - **Error Alert**: Graceful error handling dialog if network or server updates fail.
* [x] **Milestone 86**: 3D LuLu 100 QAR In-Game Special Coupon Pickup.
  - Built custom 3D [LuluGiftPickup.tsx](file:///d:/Oqulix/Oqulix%20Projects/GameFaktory/doha-dash/popular-sparky/src/components/game/LuluGiftPickup.tsx) component integrated into the Three.js runner scene:
    - **Visuals**: Procedural red card chassis with gold borders, cutline notch, bold `PET GIFT SPECIAL` brand logo, and `LuLu 100 QAR SHOPPING VOUCHER` insignia.
    - **Dynamic Animations**: Continuous Y-axis 3D rotation, subtle multi-axis wobble tilt, energetic high-frequency tremor/shake (`sin(8t)`), floating elevation bounce, and counter-rotating golden starburst light rays (`raysMat` with additive blending).
    - **Aura**: Expanding pulsing golden energy ring on the ground.
  - **Dynamic Backend Pacing**: Removed temporary start placement. The 3D LuLu voucher now only renders when the backend explicitly authorizes `sessionRes.luluGift.eligible === true` at the backend-dictated distance (e.g. $700\text{m}$) with its single-use `voucherToken`.
  - **Single Winner Per Week Enforcement**: Guaranteed strictly one winner per week by backend transaction locking (`POST /api/rewards/claim-lulu` in `WeeklySpecialGift`).
* [x] **Milestone 87**: Homescreen Polish — Non-Editable Profile Badge & Clean Camera Icon.
  - Removed the pencil icon (`✏️`) from the player badge in [HomeScreen.tsx](file:///d:/Oqulix/Oqulix%20Projects/GameFaktory/doha-dash/popular-sparky/src/components/ui/HomeScreen.tsx).
  - Locked player profile identity after initial registration (prevents tampering or arbitrary name edits).
  - Replaced the generic emoji (`📷`) on the "You have no lives left, click to scan token" CTA pill with a crisp, modern SVG camera icon.
  - Validated cleanly with `npx tsc --noEmit` (0 errors).
* [x] **Milestone 88**: Professional Vector SVG Icons across Admin Dashboard.
  - Replaced all raw unicode emojis with crisp, lightweight SVG icons in [DashboardIcons.tsx](file:///d:/Oqulix/Oqulix%20Projects/GameFaktory/doha-dash/popular-sparky/src/components/dashboard/DashboardIcons.tsx):
    - `IconCoin`: Clean coin vector replacing `🪙` in player score tables, game session history modals, and coupon coin chips.
    - `IconTicket`: Ticket voucher vector replacing `🎟️` in empty-state coupon notifications.
    - `IconRefresh`: Circular arrows vector replacing `↻` on refresh action buttons and loading states.
    - `IconSearch`: Magnifying glass vector replacing `🔍` in coupon search toolbars.
    - `IconGift`: Gift box vector replacing `🎁` on coupon card headers.
    - `IconAlert`: Warning triangle/circle vector replacing `⚠️` in admin authentication alert gates.
  - Checked [DashboardRewards.tsx](file:///d:/Oqulix/Oqulix%20Projects/GameFaktory/doha-dash/popular-sparky/src/components/dashboard/DashboardRewards.tsx), [DashboardPlayers.tsx](file:///d:/Oqulix/Oqulix%20Projects/GameFaktory/doha-dash/popular-sparky/src/components/dashboard/DashboardPlayers.tsx), [PlayerDetailsModal.tsx](file:///d:/Oqulix/Oqulix%20Projects/GameFaktory/doha-dash/popular-sparky/src/components/dashboard/PlayerDetailsModal.tsx), and [AdminLoginModal.tsx](file:///d:/Oqulix/Oqulix%20Projects/GameFaktory/doha-dash/popular-sparky/src/components/dashboard/AdminLoginModal.tsx).
* [x] **Milestone 89**: Removed Duplicate Champion Card from Leaderboard View.
  - Removed the Last Week's Champion highlight card (`.smooth-champion-highlight-card`) from [LeaderboardModal.tsx](file:///d:/Oqulix/Oqulix%20Projects/GameFaktory/doha-dash/popular-sparky/src/components/ui/LeaderboardModal.tsx), streamlining the view so only the clean Weekly Countdown & Prize Banner and Top 3 Podium are visible.
  - Preserved past weekly champion records in [RewardsModal.tsx](file:///d:/Oqulix/Oqulix%20Projects/GameFaktory/doha-dash/popular-sparky/src/components/ui/RewardsModal.tsx) where store merchandise and weekly prizes belong.
* [x] **Milestone 90**: Updated A3 Front & Back Printing Sheets with New Showroom Artwork.
  - Replaced the coupon artwork template with `public/QR FRONT.png` (1530 × 1028 px).
  - Detected and mapped exact coordinates of the new white QR box:
    - Bounds: $X \in [1006, 1468]$ (Width = 463 px, CenterX = 1237), $Y \in [262, 724]$ (Height = 463 px, CenterY = 493).
    - QR Code: Scaled to 380 × 380 px, centered at $(1047, 303)$ with 41.5 px uniform quiet zone margins on all sides.
  - Generated matching front and back print-ready A3 PDFs (297mm × 420mm, 4 cols × 9 rows = 36 coupons each, 69mm × 44.5mm per coupon, 1.2mm gutters, guillotine corner tick marks):
    - Front sheet: [public/Popular_Sparky_A3_Test_Sheet.pdf](file:///d:/Oqulix/Oqulix%20Projects/GameFaktory/doha-dash/popular-sparky/public/Popular_Sparky_A3_Test_Sheet.pdf)
    - Back sheet: [public/Popular_Sparky_A3_Back_Sheet.pdf](file:///d:/Oqulix/Oqulix%20Projects/GameFaktory/doha-dash/popular-sparky/public/Popular_Sparky_A3_Back_Sheet.pdf) (built using `public/QR TOken back.png`)
  - Updated in-browser and build script engines: [a3SheetGenerator.ts](file:///d:/Oqulix/Oqulix%20Projects/GameFaktory/doha-dash/popular-sparky/src/utils/a3SheetGenerator.ts) and [scripts/generate_portrait_a3_pdf.cjs](file:///d:/Oqulix/Oqulix%20Projects/GameFaktory/doha-dash/popular-sparky/scripts/generate_portrait_a3_pdf.cjs).
  - Verified with `npx tsc --noEmit` (0 errors).
* [x] **Milestone 91**: Dedicated Tokens Page in Admin Dashboard with Dynamic Multi-Page A3 PDF Generator.
  - Added dedicated **Tokens** navigation tab in [PopularDashboard.tsx](file:///d:/Oqulix/Oqulix%20Projects/GameFaktory/doha-dash/popular-sparky/src/components/dashboard/PopularDashboard.tsx) using vector `<IconQrCode />`.
  - Built comprehensive [DashboardTokens.tsx](file:///d:/Oqulix/Oqulix%20Projects/GameFaktory/doha-dash/popular-sparky/src/components/dashboard/DashboardTokens.tsx):
    - **A3 Page Calculator**: Select number of pages ($1, 2, 5, 10$ or custom up to $20$), calculating exact coupon counts ($N \times 36$).
    - **Batch Creation Engine**: Communicates with backend `POST /api/brands/:brandSlug/tokens/batch-create` to generate unique `PET-XXXX-YYYY` codes registered in PostgreSQL with 3 initial lives.
    - **Client-Side High-Res A3 PDF Stamping**: Iterates through each unique token, generates individual $380 \times 380\text{ px}$ QR bitmaps pointing to `https://sparkyrun.gamefaktory.com/?token=PET-XXXX-YYYY&brand=popular-electricals-qatar`, composites them onto `QR FRONT.png` with corner cutting tick marks across multi-page A3 documents, and triggers instant download.
    - **Back Sheet Download CTA**: One-click download of the matching `Popular_Sparky_A3_Back_Sheet.pdf` for double-sided showroom printing.
    - **Live Token Audit Table**: Searchable and filterable (`ALL` vs `ACTIVE` vs `SCANNED`) table listing all tokens in the database, attached customer name/phone, and remaining lives.
  - Verified with `npx tsc --noEmit` (0 errors).
* [x] **Milestone 93**: Secondary Hex Button Height & Thickness Redesign.
  - **Secondary Hex Buttons (Leaderboard & Rewards)**:
    - Redesigned the vector SVG geometry in [SecondaryHexButton.tsx](file:///d:/Oqulix/Oqulix%20Projects/GameFaktory/doha-dash/popular-sparky/src/components/ui/SecondaryHexButton.tsx): increased aspect ratio and coordinate space from `viewBox="0 0 250 66"` to `viewBox="0 0 250 88"` (+33.3% vertical thickness).
    - Recalculated all 3D beveled polygon facets, base rims, shadow layers, chisel lines, and gold specular gradients to match the taller profile.
    - Repositioned and resized the trophy and gift box SVG icons and typography centered vertically at `y="44"`.
    - In [global.css](file:///d:/Oqulix/Oqulix%20Projects/GameFaktory/doha-dash/popular-sparky/src/styles/global.css), increased `.sec-hex-svg` height to `72px` (max-height `80px`), max-width to `195px`, and row width to `390px`.
  - **Homepage Stats (RANK, BEST, TOTAL) Visibility**:
    - Resolved vertical viewport overflow and clipping on `.home-page` container by enabling `overflow-y: auto; -webkit-overflow-scrolling: touch;`.
    - Tightened `.home-hero` vertical rhythm: reduced `gap` from `18px` to `12px`, reduced `.home-top-pet-logo` margins (`margin-top: -10px`, max-width `136px`), and capped `.home-logo-img` height to `max-height: 24vh`.
    - Guaranteed all hero elements (`.home-hero-stats-row` showing RANK, BEST, and TOTAL cards, Play Button, Lives Left capsule, Scan QR CTA, and Secondary Buttons) are immediately visible without clipping across all viewport heights.
* [x] **Milestone 97**: Qatar Cultural & National Elements Integrated into 3D World.
  - Generated authentic high-resolution national flag asset [public/qatar_flag.png](file:///d:/Oqulix/Oqulix%20Projects/GameFaktory/doha-dash/popular-sparky/public/qatar_flag.png) (exact 28:11 aspect ratio, white serrated 9-point border, and official maroon `#8A1538`).
  - Added `flagQatar` banner instance kind and textures across [types/index.ts](file:///d:/Oqulix/Oqulix%20Projects/GameFaktory/doha-dash/popular-sparky/src/types/index.ts), [constants.ts](file:///d:/Oqulix/Oqulix%20Projects/GameFaktory/doha-dash/popular-sparky/src/game/constants.ts), and [Environment.tsx](file:///d:/Oqulix/Oqulix%20Projects/GameFaktory/doha-dash/popular-sparky/src/components/game/Environment.tsx).
  - Integrated in [chunkGenerator.ts](file:///d:/Oqulix/Oqulix%20Projects/GameFaktory/doha-dash/popular-sparky/src/game/chunkGenerator.ts):
    - **Boulevard Ceremonial Flagpoles**: Tall silver flagpoles (7.8m) with golden sphere finials and fluttering Qatar national flags lining both sides of the boulevard.
    - **Highway Mega-Billboards**: Added grand twin-column Qatar national flag displays alongside commercial brand hoardings.
  - Successfully validated via full production build `npm run build` (0 TypeScript errors, bundle verified).

---

## 7. Immediate Next Steps / Roadmap

1. **Production Monitoring**:
   - Monitor live player sessions during weekly cycles as the dynamic curve triggers the LuLu voucher pickup.
2. **Weekly High Scorer Automation**:
   - Schedule or query the top weekly scorer for the PET Gift Bag award.

---

## 8. Development Commands Reference

Run from `d:\Oqulix\Oqulix Projects\GameFaktory\doha-dash\popular-sparky`:
```bash
# Start Vite Development Server
cmd /c npm run dev

# Run TypeScript Validation
cmd /c npx tsc --noEmit

# Build Production Bundle
cmd /c npm run build
```
*(Always use `cmd /c` prefix for npm/npx commands in Windows PowerShell environments).*
