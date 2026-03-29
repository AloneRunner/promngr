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
      elo         INTEGER NOT NULL DEFAULT 1000,
      wins        INTEGER NOT NULL DEFAULT 0,
      losses      INTEGER NOT NULL DEFAULT 0,
      draws       INTEGER NOT NULL DEFAULT 0,
      created_at  TIMESTAMP DEFAULT NOW(),
      updated_at  TIMESTAMP DEFAULT NOW()
    );

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
  const K = 30;
  const expected = 1 / (1 + Math.pow(10, (loserElo - winnerElo) / 400));
  const score = draw ? 0.5 : 1;
  const change = Math.round(K * (score - expected));
  return change;
}

// ─── ROUTES ─────────────────────────────────────────────────────────────────

// POST /api/register  — oyuncu kayıt / profil güncelle
app.post('/api/register', async (req, res) => {
  const { playerId, username, teamName } = req.body;
  if (!playerId) return res.status(400).json({ error: 'playerId required' });

  try {
    await pool.query(`
      INSERT INTO players (player_id, username, team_name)
      VALUES ($1, $2, $3)
      ON CONFLICT (player_id) DO UPDATE
        SET username  = EXCLUDED.username,
            team_name = EXCLUDED.team_name,
            updated_at = NOW()
    `, [playerId, username || 'Manager', teamName || 'My Team']);

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
      SELECT player_id, username, team_name, elo, wins, draws, losses
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
      'SELECT player_id, username, team_name, elo, wins, draws, losses FROM players WHERE player_id = $1',
      [req.params.playerId]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Player not found' });
    res.json(rows[0]);
  } catch (err) {
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
