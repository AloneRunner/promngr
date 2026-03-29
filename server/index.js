const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('railway.internal')
    ? false
    : { rejectUnauthorized: false }
});

// ─── DB INIT ────────────────────────────────────────────────────────────────

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS players (
      player_id   VARCHAR(36) PRIMARY KEY,
      username    VARCHAR(100) NOT NULL DEFAULT 'Manager',
      team_name   VARCHAR(100) NOT NULL DEFAULT 'My Team',
      nationality VARCHAR(10) DEFAULT NULL,
      elo         INTEGER NOT NULL DEFAULT 1000,
      wins        INTEGER NOT NULL DEFAULT 0,
      losses      INTEGER NOT NULL DEFAULT 0,
      draws       INTEGER NOT NULL DEFAULT 0,
      created_at  TIMESTAMP DEFAULT NOW(),
      updated_at  TIMESTAMP DEFAULT NOW()
    );
    ALTER TABLE players ADD COLUMN IF NOT EXISTS nationality VARCHAR(10) DEFAULT NULL;

    CREATE TABLE IF NOT EXISTS team_snapshots (
      player_id   VARCHAR(36) PRIMARY KEY REFERENCES players(player_id) ON DELETE CASCADE,
      formation   VARCHAR(20),
      tactics     JSONB,
      squad       JSONB,
      avg_ovr     FLOAT DEFAULT 70,
      updated_at  TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS matches (
      id              SERIAL PRIMARY KEY,
      home_player_id  VARCHAR(36) REFERENCES players(player_id),
      away_player_id  VARCHAR(36) REFERENCES players(player_id),
      home_score      INTEGER,
      away_score      INTEGER,
      home_elo_change INTEGER DEFAULT 0,
      away_elo_change INTEGER DEFAULT 0,
      played_at       TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS challenges (
      id              SERIAL PRIMARY KEY,
      challenger_id   VARCHAR(36) REFERENCES players(player_id) ON DELETE CASCADE,
      challenged_id   VARCHAR(36) REFERENCES players(player_id) ON DELETE CASCADE,
      status          VARCHAR(20) DEFAULT 'pending',
      created_at      TIMESTAMP DEFAULT NOW(),
      expires_at      TIMESTAMP DEFAULT NOW() + INTERVAL '24 hours',
      UNIQUE(challenger_id, challenged_id)
    );
  `);
  console.log('DB tables ready.');
  await seedBots();
}

// ─── BOT SEED ────────────────────────────────────────────────────────────────

async function seedBots() {
  const bots = [
    { id: 'bot-001', username: 'IronDefense FC', teamName: 'IronDefense FC', elo: 980, ovr: 68 },
    { id: 'bot-002', username: 'Golden Eagles', teamName: 'Golden Eagles',   elo: 1020, ovr: 72 },
    { id: 'bot-003', username: 'Red Storm',      teamName: 'Red Storm',       elo: 1050, ovr: 75 },
    { id: 'bot-004', username: 'Blue Lions',     teamName: 'Blue Lions',      elo: 1100, ovr: 78 },
    { id: 'bot-005', username: 'Silver Wolves',  teamName: 'Silver Wolves',   elo: 960,  ovr: 70 },
    { id: 'bot-006', username: 'Dark Knights',   teamName: 'Dark Knights',    elo: 1150, ovr: 82 },
    { id: 'bot-007', username: 'Phoenix Rising', teamName: 'Phoenix Rising',  elo: 900,  ovr: 65 },
    { id: 'bot-008', username: 'Thunder Hawks',  teamName: 'Thunder Hawks',   elo: 1080, ovr: 76 },
    { id: 'bot-009', username: 'Emerald City FC','teamName': 'Emerald City FC', elo: 1200, ovr: 85 },
    { id: 'bot-010', username: 'White Tigers',   teamName: 'White Tigers',    elo: 850,  ovr: 62 },
  ];

  for (const bot of bots) {
    // Upsert player
    await pool.query(`
      INSERT INTO players (player_id, username, team_name, elo, wins, losses, draws)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (player_id) DO NOTHING
    `, [bot.id, bot.username, bot.teamName, bot.elo,
        Math.floor(Math.random() * 20), Math.floor(Math.random() * 15), Math.floor(Math.random() * 10)]);

    // Bot squad (11 generic players)
    const squad = Array.from({ length: 11 }, (_, i) => ({
      id: `${bot.id}-p${i}`, name: `Player ${i + 1}`,
      ovr: bot.ovr + Math.floor(Math.random() * 6) - 3,
      position: ['GK','CB','CB','LB','RB','CM','CM','CAM','LW','RW','ST'][i],
    }));

    await pool.query(`
      INSERT INTO team_snapshots (player_id, formation, tactics, squad, avg_ovr)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (player_id) DO NOTHING
    `, [bot.id, '4-3-3', '{}', JSON.stringify(squad), bot.ovr]);
  }
  console.log('Bot players seeded.');
}

// ─── ELO HELPER ─────────────────────────────────────────────────────────────

function calcElo(winnerElo, loserElo, draw = false) {
  const eloDiff = Math.abs(winnerElo - loserElo);
  // ELO farkı 400+ ise güçlü taraf kazanırsa puan yok, kaybederse tam ceza
  const K = 30;
  const expected = 1 / (1 + Math.pow(10, (loserElo - winnerElo) / 400));
  const score = draw ? 0.5 : 1;
  let change = Math.round(K * (score - expected));
  // Çok güçlü kazanırsa (expected > 0.85) sıfırla — farming önlemi
  if (!draw && expected > 0.85) change = 0;
  return change;
}

// ─── ROUTES ─────────────────────────────────────────────────────────────────

// POST /api/register  — oyuncu kayıt / profil güncelle
app.post('/api/register', async (req, res) => {
  const { playerId, username, teamName, nationality } = req.body;
  if (!playerId) return res.status(400).json({ error: 'playerId required' });

  try {
    await pool.query(`
      INSERT INTO players (player_id, username, team_name, nationality)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (player_id) DO UPDATE
        SET username    = EXCLUDED.username,
            team_name   = EXCLUDED.team_name,
            nationality = COALESCE(EXCLUDED.nationality, players.nationality),
            updated_at  = NOW()
    `, [playerId, username || 'Manager', teamName || 'My Team', nationality || null]);

    const { rows } = await pool.query('SELECT * FROM players WHERE player_id = $1', [playerId]);
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

// POST /api/snapshot  — kadro/taktik anlık görüntüsünü kaydet
app.post('/api/snapshot', async (req, res) => {
  const { playerId, formation, tactics, squad, avgOvr } = req.body;
  if (!playerId || !squad) return res.status(400).json({ error: 'playerId and squad required' });

  try {
    // Oyuncu yoksa otomatik oluştur
    await pool.query(`
      INSERT INTO players (player_id) VALUES ($1)
      ON CONFLICT DO NOTHING
    `, [playerId]);

    await pool.query(`
      INSERT INTO team_snapshots (player_id, formation, tactics, squad, avg_ovr)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (player_id) DO UPDATE
        SET formation  = EXCLUDED.formation,
            tactics    = EXCLUDED.tactics,
            squad      = EXCLUDED.squad,
            avg_ovr    = EXCLUDED.avg_ovr,
            updated_at = NOW()
    `, [playerId, formation || '4-3-3', tactics || {}, JSON.stringify(squad), avgOvr || 70]);

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

// GET /api/matchmaking/:playerId  — OVR'ye yakın rakip bul
app.get('/api/matchmaking/:playerId', async (req, res) => {
  const { playerId } = req.params;

  try {
    // Kendi OVR'sini al
    const self = await pool.query(
      'SELECT avg_ovr FROM team_snapshots WHERE player_id = $1',
      [playerId]
    );

    const myOvr = self.rows[0]?.avg_ovr || 70;
    const ovrRange = 10; // ±10 OVR tolerans (beta: geniş tutuyoruz)

    // Kendisi hariç, OVR yakın, son 7 gün içinde aktif birini bul
    const { rows } = await pool.query(`
      SELECT p.player_id, p.username, p.team_name, p.elo,
             s.formation, s.tactics, s.squad, s.avg_ovr
      FROM team_snapshots s
      JOIN players p ON p.player_id = s.player_id
      WHERE s.player_id != $1
        AND s.avg_ovr BETWEEN $2 AND $3
        AND s.updated_at > NOW() - INTERVAL '7 days'
      ORDER BY RANDOM()
      LIMIT 1
    `, [playerId, myOvr - ovrRange, myOvr + ovrRange]);

    if (rows.length === 0) {
      // OVR eşleşmesi yoksa herkesten random seç
      const fallback = await pool.query(`
        SELECT p.player_id, p.username, p.team_name, p.elo,
               s.formation, s.tactics, s.squad, s.avg_ovr
        FROM team_snapshots s
        JOIN players p ON p.player_id = s.player_id
        WHERE s.player_id != $1
        ORDER BY RANDOM()
        LIMIT 1
      `, [playerId]);

      if (fallback.rows.length === 0) {
        return res.status(404).json({ error: 'No opponents found yet. Try again later!' });
      }
      return res.json(fallback.rows[0]);
    }

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

// POST /api/match/result  — maç sonucunu kaydet, ELO güncelle
app.post('/api/match/result', async (req, res) => {
  const { homePlayerId, awayPlayerId, homeScore, awayScore } = req.body;
  if (!homePlayerId || !awayPlayerId) return res.status(400).json({ error: 'Both player IDs required' });

  try {
    const homePl = await pool.query('SELECT elo FROM players WHERE player_id = $1', [homePlayerId]);
    const awayPl = await pool.query('SELECT elo FROM players WHERE player_id = $1', [awayPlayerId]);

    if (!homePl.rows[0] || !awayPl.rows[0]) {
      return res.status(404).json({ error: 'Player not found' });
    }

    const homeElo = homePl.rows[0].elo;
    const awayElo = awayPl.rows[0].elo;
    const isDraw = homeScore === awayScore;
    const homeWon = homeScore > awayScore;

    let homeChange, awayChange;
    if (isDraw) {
      homeChange = calcElo(homeElo, awayElo, true);
      awayChange = calcElo(awayElo, homeElo, true);
    } else if (homeWon) {
      homeChange = calcElo(homeElo, awayElo, false);
      awayChange = -calcElo(awayElo, homeElo, false);
    } else {
      homeChange = -calcElo(homeElo, awayElo, false);
      awayChange = calcElo(awayElo, homeElo, false);
    }

    // ELO güncelle
    await pool.query(`
      UPDATE players SET
        elo = GREATEST(100, elo + $2),
        wins = wins + $3,
        draws = draws + $4,
        losses = losses + $5,
        updated_at = NOW()
      WHERE player_id = $1
    `, [homePlayerId, homeChange,
        homeWon ? 1 : 0,
        isDraw ? 1 : 0,
        !homeWon && !isDraw ? 1 : 0]);

    await pool.query(`
      UPDATE players SET
        elo = GREATEST(100, elo + $2),
        wins = wins + $3,
        draws = draws + $4,
        losses = losses + $5,
        updated_at = NOW()
      WHERE player_id = $1
    `, [awayPlayerId, awayChange,
        !homeWon && !isDraw ? 1 : 0,
        isDraw ? 1 : 0,
        homeWon ? 1 : 0]);

    // Maç kaydı
    await pool.query(`
      INSERT INTO matches (home_player_id, away_player_id, home_score, away_score, home_elo_change, away_elo_change)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [homePlayerId, awayPlayerId, homeScore, awayScore, homeChange, awayChange]);

    res.json({ homeEloChange: homeChange, awayEloChange: awayChange });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

// GET /api/leaderboard  — en iyi 50 oyuncu
app.get('/api/leaderboard', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT player_id, username, team_name, nationality, elo, wins, draws, losses
      FROM players
      WHERE (wins + draws + losses) > 0
      ORDER BY elo DESC
      LIMIT 50
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

// GET /api/profile/:playerId
app.get('/api/profile/:playerId', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT player_id, username, team_name, nationality, elo, wins, draws, losses FROM players WHERE player_id = $1',
      [req.params.playerId]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Player not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'DB error' });
  }
});

// ─── CHALLENGE / DIRECT MATCH ────────────────────────────────────────────────

// POST /api/challenge  — meydan oku
app.post('/api/challenge', async (req, res) => {
  const { challengerId, challengedId } = req.body;
  if (!challengerId || !challengedId) return res.status(400).json({ error: 'Both IDs required' });
  if (challengerId === challengedId) return res.status(400).json({ error: 'Cannot challenge yourself' });

  try {
    // Anti-spam: max 3 bekleyen davet
    const pending = await pool.query(
      `SELECT COUNT(*) FROM challenges WHERE challenger_id = $1 AND status = 'pending' AND expires_at > NOW()`,
      [challengerId]
    );
    if (parseInt(pending.rows[0].count) >= 3) {
      return res.status(429).json({ error: 'Max 3 pending challenges at a time' });
    }

    // Aynı kişiye 24 saatte bir davet
    const recent = await pool.query(
      `SELECT id FROM challenges WHERE challenger_id = $1 AND challenged_id = $2 AND created_at > NOW() - INTERVAL '24 hours'`,
      [challengerId, challengedId]
    );
    if (recent.rows.length > 0) {
      return res.status(429).json({ error: 'Already challenged this player recently' });
    }

    // ELO fark kontrolü — 500+ ise davet engelle
    const [chRow, cdRow] = await Promise.all([
      pool.query('SELECT elo FROM players WHERE player_id = $1', [challengerId]),
      pool.query('SELECT elo FROM players WHERE player_id = $1', [challengedId]),
    ]);
    if (!chRow.rows[0] || !cdRow.rows[0]) return res.status(404).json({ error: 'Player not found' });
    const eloDiff = Math.abs(chRow.rows[0].elo - cdRow.rows[0].elo);
    if (eloDiff > 500) {
      return res.status(400).json({ error: 'ELO difference too large (>500)', eloDiff });
    }

    await pool.query(`
      INSERT INTO challenges (challenger_id, challenged_id)
      VALUES ($1, $2)
      ON CONFLICT (challenger_id, challenged_id) DO UPDATE
        SET status = 'pending', created_at = NOW(), expires_at = NOW() + INTERVAL '24 hours'
    `, [challengerId, challengedId]);

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

// GET /api/challenges/:playerId  — bekleyen davetleri getir (gelen + giden)
app.get('/api/challenges/:playerId', async (req, res) => {
  const { playerId } = req.params;
  try {
    // Süresi dolmuş davetleri temizle
    await pool.query(`DELETE FROM challenges WHERE expires_at < NOW()`);

    const { rows } = await pool.query(`
      SELECT c.id, c.challenger_id, c.challenged_id, c.status, c.created_at,
             p1.username AS challenger_name, p1.team_name AS challenger_team, p1.elo AS challenger_elo,
             p2.username AS challenged_name, p2.team_name AS challenged_team, p2.elo AS challenged_elo,
             s.formation, s.tactics, s.squad, s.avg_ovr
      FROM challenges c
      JOIN players p1 ON p1.player_id = c.challenger_id
      JOIN players p2 ON p2.player_id = c.challenged_id
      LEFT JOIN team_snapshots s ON s.player_id = c.challenger_id
      WHERE (c.challenger_id = $1 OR c.challenged_id = $1)
        AND c.status = 'pending'
        AND c.expires_at > NOW()
      ORDER BY c.created_at DESC
    `, [playerId]);

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

// POST /api/challenge/:id/accept  — daveti kabul et (maç başlar)
app.post('/api/challenge/:id/accept', async (req, res) => {
  const { playerId } = req.body;
  const challengeId = req.params.id;
  try {
    const { rows } = await pool.query(
      `SELECT * FROM challenges WHERE id = $1 AND challenged_id = $2 AND status = 'pending'`,
      [challengeId, playerId]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Challenge not found' });

    // Challenger snapshot'ını getir (rakip verisi olarak)
    const snap = await pool.query(`
      SELECT p.username, p.team_name, p.elo, p.nationality,
             s.formation, s.tactics, s.squad, s.avg_ovr
      FROM players p
      LEFT JOIN team_snapshots s ON s.player_id = p.player_id
      WHERE p.player_id = $1
    `, [rows[0].challenger_id]);

    await pool.query(`UPDATE challenges SET status = 'accepted' WHERE id = $1`, [challengeId]);

    res.json({ ok: true, opponent: { ...snap.rows[0], player_id: rows[0].challenger_id } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

// POST /api/challenge/:id/decline
app.post('/api/challenge/:id/decline', async (req, res) => {
  const { playerId } = req.body;
  try {
    await pool.query(
      `UPDATE challenges SET status = 'declined' WHERE id = $1 AND challenged_id = $2`,
      [req.params.id, playerId]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'DB error' });
  }
});

// POST /api/admin/reset-elo  — sezon sıfırlama (admin key gerekli)
app.post('/api/admin/reset-elo', async (req, res) => {
  const { adminKey } = req.body;
  if (adminKey !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    await pool.query(`
      UPDATE players SET elo = 1000, wins = 0, losses = 0, draws = 0, updated_at = NOW()
      WHERE player_id NOT LIKE 'bot-%'
    `);
    await pool.query(`DELETE FROM matches`);
    res.json({ ok: true, message: 'ELO reset complete. New season started!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});
// Health check
app.get('/', (req, res) => res.json({ status: 'ok', version: '1.0.0' }));

// ─── START ───────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3000;
initDB().then(() => {
  app.listen(PORT, () => console.log(`Football Manager API running on port ${PORT}`));
}).catch(err => {
  console.error('Failed to init DB:', err);
  process.exit(1);
});
