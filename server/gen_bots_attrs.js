/**
 * Generates bot_data.json with full player attributes mapped from src/data/*.ts files.
 * Run from project root: node server/gen_bots_attrs.js
 */
const fs = require('fs');
const path = require('path');

// ─── Position mapping: Turkish → Standard ────────────────────────────────────
const POS_MAP = {
  KL: 'GK',
  STP: 'CB', SLB: 'LB', SĞB: 'RB',
  MDO: 'CM', MO: 'CM', MS: 'CAM',
  SĞK: 'RW', SLK: 'LW',
  SĞO: 'RW', SLO: 'LW',
  SNT: 'ST', CF: 'ST',
};

// ─── Attribute mapping: Turkish data → PlayerAttributes ──────────────────────
function mapAttrs(player) {
  const ana = player.ana_ozellikler || {};
  const det = player.detaylar || {};
  const ovr = player.reyting || 70;
  const pos = player.mevki || '';
  const isGK = pos === 'KL';
  const isDEF = ['STP', 'SLB', 'SĞB'].includes(pos);
  const isMID = ['MDO', 'MO', 'MS', 'SĞK', 'SLK', 'SĞO', 'SLO'].includes(pos);

  if (isGK) {
    const gkBase = det.refleks || det.reaksiyon || ovr;
    return {
      finishing: 20,
      passing: det.uzun_topu_firlat || det.kisa_pas || Math.round(ana.hiz * 0.6 + 20),
      tackling: 20,
      dribbling: 20,
      goalkeeping: Math.min(99, Math.round((gkBase + ovr) / 2 + 2)),
      speed: ana.hiz || 60,
      stamina: det.dayaniklilik || ana.fizik || 72,
      strength: det.guc || ana.fizik || 72,
      positioning: det.pozisyon || ovr,
      aggression: 30,
      composure: det.sogukkanlilik || 65,
      vision: 50,
      leadership: 55,
      decisions: det.reaksiyon || 65,
    };
  }

  return {
    finishing: det.bitiricilik || ana.sut || (isDEF ? 30 : isMID ? 55 : ovr - 2),
    passing: det.kisa_pas || ana.pas || (isDEF ? ovr - 8 : ovr - 3),
    tackling: det.ayakta_mudahale || ana.defans || (isDEF ? ovr + 3 : isMID ? ovr - 10 : 35),
    dribbling: det.dribbling || det.top_kontrol || ana.dribbling || (isMID ? ovr : ovr - 5),
    goalkeeping: 5,
    speed: det.sprint || ana.hiz || ovr - 4,
    stamina: det.dayaniklilik || ana.fizik || ovr - 5,
    strength: det.guc || ana.fizik || ovr - 6,
    positioning: det.pozisyon || (isDEF ? ovr : isMID ? ovr - 3 : ovr + 2),
    aggression: det.agresiflik || (isDEF ? ovr - 3 : 60),
    composure: det.sogukkanlilik || 65,
    vision: det.vizyon || ana.pas || (isMID ? ovr + 2 : ovr - 8),
    leadership: det.caliskanlik || 58,
    decisions: det.reaksiyon || 65,
  };
}

// ─── Read all data files and build teamName → squad map ──────────────────────
const DATA_DIR = path.join(__dirname, '../src/data');
const teamSquadMap = {};

const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.ts'));
for (const file of files) {
  try {
    const content = fs.readFileSync(path.join(DATA_DIR, file), 'utf8');
    // Strip export const X = ... to get raw array (first export only)
    const match = content.match(/export const \w+ = (\[[\s\S]*?\n\]);/);
    if (!match) continue;
    let squad;
    try {
      // eslint-disable-next-line no-eval
      squad = eval(match[1]);
    } catch { continue; }
    if (!Array.isArray(squad) || squad.length === 0) continue;
    const teamName = squad[0]?.takim;
    if (teamName) {
      teamSquadMap[teamName] = squad;
    }
  } catch {}
}

console.log(`Loaded ${Object.keys(teamSquadMap).length} teams from data files`);

// ─── Standard position order for forcing 11-player lineup ────────────────────
const STANDARD_POSITIONS = ['GK','CB','CB','LB','RB','CM','CM','CAM','LW','RW','ST'];
const BENCH_POSITIONS    = ['GK','CB','CM','CM','LW','ST','ST'];

function buildSquadFromData(rawSquad) {
  // Map Turkish positions to standard
  const mapped = rawSquad.map(p => ({
    ...p,
    stdPos: POS_MAP[p.mevki] || 'CM',
  }));

  // Sort: GK first, then by OVR desc
  mapped.sort((a, b) => {
    if (a.stdPos === 'GK' && b.stdPos !== 'GK') return -1;
    if (b.stdPos === 'GK' && a.stdPos !== 'GK') return 1;
    return (b.reyting || 0) - (a.reyting || 0);
  });

  // Assign standard positions for starters
  const squad = [];
  const used = new Set();

  // Pick 1 GK
  const gks = mapped.filter(p => p.stdPos === 'GK');
  const outfield = mapped.filter(p => p.stdPos !== 'GK');

  const starters = [];
  if (gks.length > 0) {
    starters.push({ player: gks[0], assignedPos: 'GK', lineupIndex: 0 });
    used.add(gks[0]);
  }

  // Fill remaining 10 spots greedily
  const posNeeded = STANDARD_POSITIONS.slice(1); // skip GK
  let lineupIndex = 1;
  for (const pos of posNeeded) {
    // Find best available outfield player not yet used
    const candidate = outfield.find(p => !used.has(p));
    if (candidate) {
      starters.push({ player: candidate, assignedPos: pos, lineupIndex });
      used.add(candidate);
    }
    lineupIndex++;
  }

  // Bench: 7 more
  const benchCandidates = mapped.filter(p => !used.has(p)).slice(0, 7);
  const bench = benchCandidates.map((p, i) => ({
    player: p,
    assignedPos: BENCH_POSITIONS[i] || 'CM',
    lineupIndex: 11 + i,
  }));

  const allSlots = [...starters, ...bench];
  return allSlots.map(({ player, assignedPos, lineupIndex }, i) => ({
    name: player.ad || `Player ${i + 1}`,
    ovr: player.reyting || 70,
    position: assignedPos,
    lineup: lineupIndex < 11 ? 'STARTING' : 'BENCH',
    lineupIndex,
    playStyles: player.oyun_tarzlari || [],
    attributes: mapAttrs({ ...player, mevki: Object.keys(POS_MAP).find(k => POS_MAP[k] === assignedPos) || player.mevki }),
  }));
}

// ─── Load existing bot_data.json ──────────────────────────────────────────────
const BOT_DATA_PATH = path.join(__dirname, 'bot_data.json');
const bots = JSON.parse(fs.readFileSync(BOT_DATA_PATH, 'utf8'));

// ─── Update each bot with real data if available ──────────────────────────────
let enriched = 0;
let fallback = 0;

for (const bot of bots) {
  const realSquad = teamSquadMap[bot.teamName];

  if (realSquad) {
    // Use real player data
    bot.squad = buildSquadFromData(realSquad);
    bot.avg = Math.round(bot.squad.filter(p => p.lineup === 'STARTING').reduce((s, p) => s + p.ovr, 0) / 11) || bot.avg;
    enriched++;
    console.log(`✓ ${bot.teamName} — ${bot.squad.length} players from real data`);
  } else {
    // Enrich existing squad with position-based attributes
    const mapped = bot.squad.map((p, i) => {
      const ovr = p.ovr || bot.avg || 70;
      const pos = p.position || 'CM';
      const isGK = pos === 'GK';
      const isDEF = ['CB','LB','RB','CDM'].includes(pos);
      const isMID = ['CM','CAM'].includes(pos);

      if (!p.attributes) {
        p.attributes = isGK ? {
          finishing: 20, passing: 55, tackling: 20, dribbling: 20,
          goalkeeping: ovr + 2, speed: ovr - 10, stamina: ovr - 5,
          strength: ovr - 5, positioning: ovr, aggression: 30,
          composure: 65, vision: 50, leadership: 55, decisions: 65,
        } : {
          finishing: isDEF ? 30 : isMID ? 55 : ovr - 2,
          passing: isDEF ? ovr - 8 : isMID ? ovr + 2 : ovr - 5,
          tackling: isDEF ? ovr + 3 : isMID ? ovr - 10 : 35,
          dribbling: isMID ? ovr : isDEF ? ovr - 10 : ovr - 3,
          goalkeeping: 5, speed: ovr - 3, stamina: ovr - 4,
          strength: ovr - 5, positioning: isDEF ? ovr + 2 : ovr - 2,
          aggression: isDEF ? ovr - 3 : 58, composure: 63,
          vision: isMID ? ovr + 3 : ovr - 8, leadership: 58, decisions: 65,
        };
      }
      return p;
    });
    bot.squad = mapped;
    fallback++;
    console.log(`~ ${bot.teamName} — position-based attributes (no data file)`);
  }
}

fs.writeFileSync(BOT_DATA_PATH, JSON.stringify(bots, null, 2));
console.log(`\nDone! ${enriched} enriched from data, ${fallback} using position fallback.`);
console.log(`Total bots: ${bots.length}`);
