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
      match_type      VARCHAR(20) DEFAULT 'ranked',
      played_at       TIMESTAMP DEFAULT NOW()
    );
    ALTER TABLE matches ADD COLUMN IF NOT EXISTS match_type VARCHAR(20) DEFAULT 'ranked';

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
  // İlk açılışta 20 bot maçı simüle et — leaderboard canlı görünsün
  await simulateBotMatches(20);
  // Her 30 dakikada 8 bot maçı simüle et
  setInterval(() => simulateBotMatches(8), 30 * 60 * 1000);
}

// ─── BOT SEED ────────────────────────────────────────────────────────────────

const BOT_DATA = require('./bot_data.json');

// Bot initial ELO map — used to restore correct ELOs on reset
const BOT_INITIAL_ELO = {};
BOT_DATA.forEach(b => { BOT_INITIAL_ELO[b.id] = b.elo; });

const BOT_FORMATIONS = ['4-3-3', '4-2-3-1', '4-4-2', '3-5-2', '4-1-4-1', '5-3-2'];

async function seedBots() {
  for (const bot of BOT_DATA) {
    const formation = BOT_FORMATIONS[Math.floor(Math.random() * BOT_FORMATIONS.length)];
    const wins  = Math.floor(Math.random() * 30) + 10;
    const draws = Math.floor(Math.random() * 10) + 2;
    const losses= Math.floor(Math.random() * 20) + 5;

    // Insert only if not exists — reset-elo handles restoring ELO separately
    await pool.query(`
      INSERT INTO players (player_id, username, team_name, elo, wins, draws, losses)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (player_id) DO NOTHING
    `, [bot.id, bot.teamName, bot.teamName, bot.elo, wins, draws, losses]);

    await pool.query(`
      INSERT INTO team_snapshots (player_id, formation, tactics, squad, avg_ovr)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (player_id) DO UPDATE
        SET formation = EXCLUDED.formation, squad = EXCLUDED.squad, avg_ovr = EXCLUDED.avg_ovr
    `, [bot.id, formation, JSON.stringify({ style: 'HighPress' }), JSON.stringify(bot.squad), bot.avg]);
  }
  console.log(`Bot players seeded: ${BOT_DATA.length} bots.`);
}

// ─── BOT VS BOT SIMULATION ──────────────────────────────────────────────────

async function simulateBotMatches(count = 8) {
  try {
    const { rows: botPlayers } = await pool.query(
      `SELECT player_id, elo FROM players WHERE player_id LIKE 'bot-%' ORDER BY RANDOM() LIMIT $1`,
      [count * 2]
    );
    if (botPlayers.length < 2) return;

    const pairs = [];
    for (let i = 0; i + 1 < botPlayers.length; i += 2) {
      pairs.push([botPlayers[i], botPlayers[i + 1]]);
    }

    for (const [home, away] of pairs) {
      // ELO-weighted random result
      const expected = 1 / (1 + Math.pow(10, (away.elo - home.elo) / 400));
      const r = Math.random();
      let homeScore, awayScore;
      if (r < expected * 0.55) {
        homeScore = Math.floor(Math.random() * 3) + 1;
        awayScore = Math.floor(Math.random() * homeScore);
      } else if (r < expected * 0.55 + 0.22) {
        homeScore = Math.floor(Math.random() * 3) + 1;
        awayScore = homeScore;
      } else {
        awayScore = Math.floor(Math.random() * 3) + 1;
        homeScore = Math.floor(Math.random() * awayScore);
      }

      const isDraw = homeScore === awayScore;
      const homeWon = homeScore > awayScore;
      const homeChange = isDraw ? calcElo(home.elo, away.elo, true)
        : homeWon ? calcElo(home.elo, away.elo, false) : -calcElo(home.elo, away.elo, false);
      const awayChange = isDraw ? calcElo(away.elo, home.elo, true)
        : !homeWon ? calcElo(away.elo, home.elo, false) : -calcElo(away.elo, home.elo, false);

      await pool.query(`
        UPDATE players SET
          elo = GREATEST(100, elo + $2),
          wins = wins + $3, draws = draws + $4, losses = losses + $5
        WHERE player_id = $1
      `, [home.player_id, homeChange, homeWon?1:0, isDraw?1:0, (!homeWon&&!isDraw)?1:0]);

      await pool.query(`
        UPDATE players SET
          elo = GREATEST(100, elo + $2),
          wins = wins + $3, draws = draws + $4, losses = losses + $5
        WHERE player_id = $1
      `, [away.player_id, awayChange, (!homeWon&&!isDraw)?1:0, isDraw?1:0, homeWon?1:0]);

      await pool.query(`
        INSERT INTO matches (home_player_id, away_player_id, home_score, away_score, home_elo_change, away_elo_change, match_type)
        VALUES ($1, $2, $3, $4, $5, $6, 'bot')
      `, [home.player_id, away.player_id, homeScore, awayScore, homeChange, awayChange]);
    }
    console.log(`Bot sim: ${pairs.length} matches played.`);
  } catch (err) {
    console.error('Bot sim error:', err.message);
  }
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
    const ovrRange = 12;

    const humanCols = `p.player_id, p.username, p.team_name, p.elo, s.formation, s.tactics, s.squad, s.avg_ovr`;

    // 1) Gerçek oyuncu — OVR yakın, son 7 gün aktif
    const human = await pool.query(`
      SELECT ${humanCols} FROM team_snapshots s
      JOIN players p ON p.player_id = s.player_id
      WHERE s.player_id != $1
        AND p.player_id NOT LIKE 'bot-%'
        AND s.avg_ovr BETWEEN $2 AND $3
        AND s.updated_at > NOW() - INTERVAL '7 days'
      ORDER BY RANDOM() LIMIT 1
    `, [playerId, myOvr - ovrRange, myOvr + ovrRange]);
    if (human.rows.length > 0) return res.json(human.rows[0]);

    // 2) Gerçek oyuncu — OVR fark yok, son 30 gün aktif
    const humanAny = await pool.query(`
      SELECT ${humanCols} FROM team_snapshots s
      JOIN players p ON p.player_id = s.player_id
      WHERE s.player_id != $1
        AND p.player_id NOT LIKE 'bot-%'
        AND s.updated_at > NOW() - INTERVAL '30 days'
      ORDER BY RANDOM() LIMIT 1
    `, [playerId]);
    if (humanAny.rows.length > 0) return res.json(humanAny.rows[0]);

    // 3) Bot — OVR yakın
    const { rows } = await pool.query(`
      SELECT ${humanCols} FROM team_snapshots s
      JOIN players p ON p.player_id = s.player_id
      WHERE s.player_id != $1
        AND p.player_id LIKE 'bot-%'
        AND s.avg_ovr BETWEEN $2 AND $3
      ORDER BY RANDOM() LIMIT 1
    `, [playerId, myOvr - ovrRange, myOvr + ovrRange]);

    if (rows.length === 0) {
      // 4) Bot — herhangi
      const fallback = await pool.query(`
        SELECT ${humanCols} FROM team_snapshots s
        JOIN players p ON p.player_id = s.player_id
        WHERE s.player_id != $1 AND p.player_id LIKE 'bot-%'
        ORDER BY RANDOM() LIMIT 1
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
  const { homePlayerId, awayPlayerId, homeScore, awayScore, matchType } = req.body;
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
      INSERT INTO matches (home_player_id, away_player_id, home_score, away_score, home_elo_change, away_elo_change, match_type)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [homePlayerId, awayPlayerId, homeScore, awayScore, homeChange, awayChange, matchType || 'ranked']);

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
         OR player_id NOT LIKE 'bot-%'
      ORDER BY elo DESC
      LIMIT 100
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

// ─── DIRECT MATCH ────────────────────────────────────────────────────────────

const DAILY_DIRECT_LIMIT = 3;

// POST /api/direct-match/:opponentId  — istediğin rakibe direkt meydan oku (günde 3)
app.post('/api/direct-match/:opponentId', async (req, res) => {
  const { playerId } = req.body;
  const { opponentId } = req.params;
  if (!playerId) return res.status(400).json({ error: 'playerId required' });

  try {
    // Günlük limit kontrolü
    const { rows: limitRows } = await pool.query(`
      SELECT COUNT(*) FROM matches
      WHERE (home_player_id = $1 OR away_player_id = $1)
        AND match_type = 'direct'
        AND played_at > NOW() - INTERVAL '24 hours'
    `, [playerId]);
    if (parseInt(limitRows[0].count) >= DAILY_DIRECT_LIMIT) {
      return res.status(429).json({
        error: `Günlük ${DAILY_DIRECT_LIMIT} direkt maç hakkın doldu. Yarın tekrar dene!`,
        limitReached: true
      });
    }

    // Rakip snapshot'ı getir
    const { rows } = await pool.query(`
      SELECT p.player_id, p.username, p.team_name, p.elo, p.nationality,
             s.formation, s.tactics, s.squad, s.avg_ovr
      FROM players p
      LEFT JOIN team_snapshots s ON s.player_id = p.player_id
      WHERE p.player_id = $1
    `, [opponentId]);
    if (!rows[0]) return res.status(404).json({ error: 'Opponent not found' });

    res.json({ ok: true, opponent: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

// ─── LEGACY CHALLENGE (artık kullanılmıyor, backward compat) ─────────────────

// POST /api/challenge  — eski sistem (devre dışı)
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
const DAILY_CHALLENGE_LIMIT = 3;

app.post('/api/challenge/:id/accept', async (req, res) => {
  const { playerId } = req.body;
  const challengeId = req.params.id;
  try {
    const { rows } = await pool.query(
      `SELECT * FROM challenges WHERE id = $1 AND challenged_id = $2 AND status = 'pending'`,
      [challengeId, playerId]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Challenge not found' });

    // Günlük limit kontrolü — her iki oyuncu için de
    const checkLimit = async (pid) => {
      const r = await pool.query(`
        SELECT COUNT(*) FROM matches
        WHERE (home_player_id = $1 OR away_player_id = $1)
          AND match_type = 'challenge'
          AND played_at > NOW() - INTERVAL '24 hours'
      `, [pid]);
      return parseInt(r.rows[0].count);
    };

    const [acceptorCount, challengerCount] = await Promise.all([
      checkLimit(playerId),
      checkLimit(rows[0].challenger_id),
    ]);

    if (acceptorCount >= DAILY_CHALLENGE_LIMIT) {
      return res.status(429).json({ error: `Günlük ${DAILY_CHALLENGE_LIMIT} meydan okuma limitine ulaştın. Yarın tekrar dene!`, limitReached: true });
    }
    if (challengerCount >= DAILY_CHALLENGE_LIMIT) {
      return res.status(429).json({ error: 'Rakibin bugün limitini doldurdu. Yarın tekrar dene!', limitReached: true });
    }

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
  const expectedKey = (process.env.ADMIN_KEY || '').trim();
  if (!expectedKey || adminKey.trim() !== expectedKey) {
    return res.status(401).json({ error: 'Unauthorized', hint: !expectedKey ? 'ADMIN_KEY env not set' : 'key mismatch' });
  }
  try {
    // Gerçek oyuncuları sıfırla
    await pool.query(`
      UPDATE players SET elo = 1000, wins = 0, losses = 0, draws = 0, updated_at = NOW()
      WHERE player_id NOT LIKE 'bot-%'
    `);
    // Botları initial ELO'larına döndür
    for (const [botId, initialElo] of Object.entries(BOT_INITIAL_ELO)) {
      const wins  = Math.floor(Math.random() * 30) + 10;
      const draws = Math.floor(Math.random() * 10) + 2;
      const losses= Math.floor(Math.random() * 20) + 5;
      await pool.query(`
        UPDATE players SET elo = $2, wins = $3, draws = $4, losses = $5, updated_at = NOW()
        WHERE player_id = $1
      `, [botId, initialElo, wins, draws, losses]);
    }
    await pool.query(`DELETE FROM matches`);
    await pool.query(`DELETE FROM challenges`);
    // Sıfırdan bot simülasyonu başlat
    await simulateBotMatches(20);
    res.json({ ok: true, message: 'ELO reset complete. Bots restored. New season started!' });
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
