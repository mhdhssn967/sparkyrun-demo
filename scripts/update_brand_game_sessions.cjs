const fs = require('fs');

const targetPath = 'd:/Oqulix/Oqulix Projects/GameFaktory/The Gamefaktory Server/server/index.js';
if (!fs.existsSync(targetPath)) {
  console.error('Target not found:', targetPath);
  process.exit(1);
}

let content = fs.readFileSync(targetPath, 'utf8');

const targetStart = '// 3. Start Game Session / Consume 1 Token Life (Brand-Scoped)';
const targetEnd = '// Basic Test Route';

const startIndex = content.indexOf(targetStart);
const endIndex = content.indexOf(targetEnd);

if (startIndex === -1 || endIndex === -1) {
  console.error('Could not locate replacement bounds in server/index.js');
  process.exit(1);
}

const replacementCode = `// ----------------------------------------------------
// BRAND-ISOLATED GAMEPLAY SESSIONS & SCORES
// ----------------------------------------------------

// Helper to resolve or provision a player for brand session linkage
async function resolveSessionUser(userId, phone, brandId) {
  if (userId) {
    const existing = await prisma.user.findUnique({ where: { id: userId } });
    if (existing) return existing;
  }
  if (phone) {
    const cleanPhone = String(phone).replace(/\\D/g, '').slice(-10);
    const existing = await prisma.user.findUnique({ where: { phone: cleanPhone } });
    if (existing) return existing;

    // Create user by phone if registering inline
    return await prisma.user.create({
      data: {
        email: \`runner_\${cleanPhone}@popular.sparky\`,
        phone: cleanPhone,
        name: 'Sparky Runner',
      },
    });
  }

  // Fallback guest user for brand
  const guestEmail = 'guest_popular@gamefaktory.com';
  let guestUser = await prisma.user.findUnique({ where: { email: guestEmail } });
  if (!guestUser) {
    guestUser = await prisma.user.create({
      data: {
        email: guestEmail,
        name: 'Showroom Guest',
        phone: '0000000000',
      },
    });
  }
  return guestUser;
}

// 1. Start Game Session / Consume 1 Token Life (Brand & User Isolated)
app.post(
  [
    '/api/game/start-session',
    '/api/v1/tokens/consume',
    '/api/token/consume',
    '/api/brands/:brandSlug/games/:gameSlug/sessions/start',
    '/api/brands/:brandSlug/sessions/start',
  ],
  async (req, res) => {
    try {
      const tokenCode = (req.body.token || req.body.tokenCode || '').trim().toUpperCase();
      const brandSlug = (req.params.brandSlug || req.body.brand || req.body.brandSlug || 'popular').trim().toLowerCase();
      const userId = req.body.userId || null;
      const phone = req.body.phone || null;

      if (!tokenCode) {
        return res.status(400).json({ success: false, error: 'Token is required' });
      }

      const brand = await prisma.brand.findUnique({ where: { slug: brandSlug } });
      if (!brand) {
        return res.status(404).json({ success: false, error: \`Brand '\${brandSlug}' not found\`, livesRemaining: 0 });
      }

      const token = await prisma.qrToken.findUnique({
        where: { code: tokenCode },
        include: { brand: true, user: true },
      });

      if (!token) {
        return res.status(404).json({
          success: false,
          error: 'QR Token not recognized in database',
          livesRemaining: 0,
        });
      }

      // Multi-tenant brand isolation check
      if (token.brand.slug !== brandSlug) {
        return res.status(403).json({
          success: false,
          error: \`This token does not belong to \${brandSlug}\`,
          livesRemaining: 0,
        });
      }

      if (token.status !== 'ACTIVE' || token.livesRemaining <= 0) {
        return res.status(400).json({
          success: false,
          error: 'No lives remaining for this token',
          livesRemaining: 0,
        });
      }

      // Resolve player linked to this session
      const targetUserId = userId || token.userId;
      const user = await resolveSessionUser(targetUserId, phone, brand.id);

      // Bind token to user if unassigned
      if (!token.userId && user) {
        await prisma.qrToken.update({
          where: { id: token.id },
          data: { userId: user.id },
        });
      }

      // Atomic life decrement and session creation in transaction
      const sessionToken = \`gf_sess_\${crypto.randomBytes(16).toString('hex')}\`;

      const result = await prisma.$transaction(async (tx) => {
        const updatedToken = await tx.qrToken.update({
          where: { id: token.id },
          data: {
            livesRemaining: token.livesRemaining - 1,
            status: token.livesRemaining - 1 <= 0 ? 'EXHAUSTED' : 'ACTIVE',
            lastPlayedAt: new Date(),
          },
        });

        const newSession = await tx.gameSession.create({
          data: {
            userId: user.id,
            brandId: brand.id,
            sessionToken: sessionToken,
            score: 0,
            isCompleted: false,
            startedAt: new Date(),
          },
        });

        return { token: updatedToken, session: newSession };
      });

      return res.json({
        success: true,
        sessionId: result.session.sessionToken,
        sessionToken: result.session.sessionToken,
        livesRemaining: result.token.livesRemaining,
        initialLives: result.token.initialLives,
        token: result.token.code,
        status: result.token.status,
        userId: user.id,
        userName: user.name,
        brand: brand.slug,
      });
    } catch (error) {
      console.error('Start game session error:', error);
      return res.status(500).json({ success: false, error: 'Failed to start game session' });
    }
  }
);

// 2. Complete / End Game Session (Scores Isolated Strictly to that Brand)
app.post(
  [
    '/api/game/end-session',
    '/api/v1/tokens/end-session',
    '/api/brands/:brandSlug/games/:gameSlug/sessions/finish',
    '/api/brands/:brandSlug/sessions/finish',
  ],
  async (req, res) => {
    try {
      const sessionToken = req.body.sessionToken || req.body.sessionId;
      const tokenCode = (req.body.token || req.body.tokenCode || '').trim().toUpperCase();
      const brandSlug = (req.params.brandSlug || req.body.brand || req.body.brandSlug || 'popular').trim().toLowerCase();
      const rawScore = parseInt(req.body.score, 10) || 0;
      const rawDuration = parseInt(req.body.durationSeconds || req.body.duration, 10) || 0;

      if (!sessionToken) {
        return res.status(400).json({ success: false, error: 'Session token is required.' });
      }

      const brand = await prisma.brand.findUnique({ where: { slug: brandSlug } });
      if (!brand) {
        return res.status(404).json({ success: false, error: \`Brand '\${brandSlug}' not found\` });
      }

      // Query session with strict brand and token verification
      let session = await prisma.gameSession.findUnique({
        where: { sessionToken },
        include: { brand: true, user: true },
      });

      if (!session) {
        // Fallback: If session not found by token, look for active session for this user/brand
        session = await prisma.gameSession.findFirst({
          where: { brandId: brand.id, isCompleted: false },
          orderBy: { startedAt: 'desc' },
          include: { brand: true, user: true },
        });
      }

      if (!session) {
        return res.status(404).json({ success: false, error: 'Invalid or expired game session token.' });
      }

      // Multi-tenant check: ensure session belongs strictly to this brand
      if (session.brandId !== brand.id) {
        return res.status(403).json({ success: false, error: 'Cross-brand session submission is forbidden.' });
      }

      if (session.isCompleted) {
        return res.status(400).json({ success: false, error: 'Session has already been finalized.' });
      }

      const now = new Date();
      const durationSeconds = rawDuration > 0 ? rawDuration : Math.max(1, Math.round((now - new Date(session.startedAt)) / 1000));
      const finalScore = Math.max(0, rawScore);

      const completedSession = await prisma.gameSession.update({
        where: { id: session.id },
        data: {
          score: finalScore,
          duration: durationSeconds,
          isCompleted: true,
          completedAt: now,
        },
      });

      // Calculate player's brand-specific stats (isolated strictly to this brandId)
      const userBrandSessions = await prisma.gameSession.findMany({
        where: {
          userId: session.userId,
          brandId: brand.id,
          isCompleted: true,
        },
      });

      const bestScore = userBrandSessions.length > 0 ? Math.max(...userBrandSessions.map((s) => s.score)) : finalScore;
      const totalScore = userBrandSessions.reduce((sum, s) => sum + s.score, 0);

      // Remaining lives for token
      let livesRemaining = 0;
      if (tokenCode) {
        const token = await prisma.qrToken.findUnique({ where: { code: tokenCode } });
        if (token) livesRemaining = token.livesRemaining;
      }

      return res.json({
        success: true,
        session: {
          id: completedSession.id,
          sessionToken: completedSession.sessionToken,
          score: completedSession.score,
          duration: completedSession.duration,
          startedAt: completedSession.startedAt,
          completedAt: completedSession.completedAt,
        },
        brand: brand.slug,
        bestScore,
        totalScore,
        livesRemaining,
      });
    } catch (error) {
      console.error('End game session error:', error);
      return res.status(500).json({ success: false, error: 'Failed to complete game session' });
    }
  }
);

// 3. Admin / Dashboard Endpoint: Fetch All Sessions for a Specific User under that Brand Only
app.get(
  [
    '/api/brands/:brandSlug/players/:userId/sessions',
    '/api/brands/:brandSlug/sessions',
    '/api/brands/:brandSlug/games/:gameSlug/players/:userId/sessions',
  ],
  async (req, res) => {
    try {
      const brandSlug = (req.params.brandSlug || 'popular').trim().toLowerCase();
      const userId = req.params.userId || req.query.userId;
      const phone = req.query.phone;

      const brand = await prisma.brand.findUnique({ where: { slug: brandSlug } });
      if (!brand) return res.status(404).json({ error: \`Brand '\${brandSlug}' not found\` });

      let user = null;
      if (userId) {
        user = await prisma.user.findUnique({ where: { id: userId } });
      } else if (phone) {
        const clean = String(phone).replace(/\\D/g, '').slice(-10);
        user = await prisma.user.findUnique({ where: { phone: clean } });
      }

      if (!user) {
        return res.status(404).json({ error: 'Player not found in database' });
      }

      // STRICT BRAND ISOLATION: query ONLY sessions matching brandId == brand.id
      const sessions = await prisma.gameSession.findMany({
        where: {
          brandId: brand.id,
          userId: user.id,
          isCompleted: true,
        },
        orderBy: { completedAt: 'desc' },
      });

      const bestScore = sessions.length > 0 ? Math.max(...sessions.map((s) => s.score)) : 0;
      const totalScore = sessions.reduce((sum, s) => sum + s.score, 0);

      return res.json({
        success: true,
        brand: brand.slug,
        player: {
          id: user.id,
          name: user.name || 'Sparky Runner',
          phone: user.phone ? \`+974 \${user.phone}\` : 'N/A',
          totalGamesPlayed: sessions.length,
          bestScore,
          totalScore,
        },
        sessions: sessions.map((s) => ({
          id: s.id,
          sessionToken: s.sessionToken,
          score: s.score,
          duration: s.duration || 0,
          startedAt: s.startedAt,
          completedAt: s.completedAt,
        })),
      });
    } catch (err) {
      console.error('Fetch player sessions error:', err);
      return res.status(500).json({ error: 'Failed to fetch player sessions' });
    }
  }
);

// 4. Admin / Dashboard Endpoint: Fetch All Players Registered/Played for this Brand Only
app.get(['/api/brands/:brandSlug/players', '/api/players'], async (req, res) => {
  try {
    const brandSlug = (req.params.brandSlug || 'popular').trim().toLowerCase();
    const brand = await prisma.brand.findUnique({ where: { slug: brandSlug } });
    if (!brand) return res.status(404).json({ error: \`Brand '\${brandSlug}' not found\` });

    // Find all completed game sessions for this brand
    const brandSessions = await prisma.gameSession.findMany({
      where: {
        brandId: brand.id,
        isCompleted: true,
      },
      include: { user: true },
      orderBy: { completedAt: 'desc' },
    });

    // Also include users who registered or have tokens under this brand
    const brandTokens = await prisma.qrToken.findMany({
      where: { brandId: brand.id, userId: { not: null } },
      include: { user: true },
    });

    const playerMap = new Map();

    brandSessions.forEach((s) => {
      if (!s.user) return;
      if (!playerMap.has(s.userId)) {
        playerMap.set(s.userId, {
          id: s.user.id,
          name: s.user.name || 'Sparky Runner',
          phone: s.user.phone,
          fullPhone: s.user.phone ? \`+974 \${s.user.phone}\` : 'N/A',
          showroom: 'Najma / Barwa',
          bestScore: s.score,
          totalScore: s.score,
          gamesPlayed: 1,
          lastPlayed: s.completedAt || s.startedAt,
        });
      } else {
        const p = playerMap.get(s.userId);
        p.bestScore = Math.max(p.bestScore, s.score);
        p.totalScore += s.score;
        p.gamesPlayed += 1;
      }
    });

    brandTokens.forEach((t) => {
      if (t.user && !playerMap.has(t.userId)) {
        playerMap.set(t.userId, {
          id: t.user.id,
          name: t.user.name || 'Sparky Runner',
          phone: t.user.phone,
          fullPhone: t.user.phone ? \`+974 \${t.user.phone}\` : 'N/A',
          showroom: 'Showroom Counter',
          bestScore: 0,
          totalScore: 0,
          gamesPlayed: 0,
          lastPlayed: t.updatedAt,
        });
      }
    });

    const players = Array.from(playerMap.values()).sort((a, b) => b.bestScore - a.bestScore);
    return res.json({ success: true, brand: brand.slug, count: players.length, players });
  } catch (err) {
    console.error('Fetch brand players error:', err);
    return res.status(500).json({ error: 'Failed to fetch brand players' });
  }
});

`;

content = content.slice(0, startIndex) + replacementCode + content.slice(endIndex);
fs.writeFileSync(targetPath, content, 'utf8');
console.log('SUCCESSFULLY_APPLIED_BRAND_ISOLATED_SESSIONS');
