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

---

## 7. Immediate Next Steps / Roadmap

1. **In-Game LuLu 100 Riyal Voucher Pickup**:
   - Spawn a special rare 3D voucher pickup item along the track during runs that rewards the LuLu coupon when collected.
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
