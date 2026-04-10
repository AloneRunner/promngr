/**
 * Builds a believable online bot catalog directly from src/data squad files.
 * Run from project root: node server/gen_bots_attrs.js
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const DATA_DIR = path.join(__dirname, '../src/data');
const TEAM_META_PATH = path.join(DATA_DIR, 'teams.ts');
const BOT_DATA_PATH = path.join(__dirname, 'bot_data.json');
const MAX_BOTS_PER_LEAGUE = 4;

const POSITION_ROLE_MAP = {
  KL: ['GK'],
  GK: ['GK'],
  STP: ['CB'],
  SW: ['CB'],
  SLB: ['LB', 'LWB'],
  SĞB: ['RB', 'RWB'],
  LB: ['LB', 'LWB'],
  RB: ['RB', 'RWB'],
  MDO: ['DM', 'CM'],
  DM: ['DM', 'CM'],
  CDM: ['DM', 'CM'],
  MO: ['CM', 'CAM'],
  CM: ['CM', 'DM'],
  MOO: ['CAM', 'CM'],
  CAM: ['CAM', 'CM'],
  MS: ['CAM', 'ST'],
  RM: ['RW', 'CM'],
  LM: ['LW', 'CM'],
  SĞK: ['RW', 'LW'],
  SLK: ['LW', 'RW'],
  SĞO: ['RW', 'CAM'],
  SLO: ['LW', 'CAM'],
  RW: ['RW', 'LW'],
  LW: ['LW', 'RW'],
  CF: ['ST', 'CAM'],
  SS: ['ST', 'CAM'],
  SNT: ['ST'],
  ST: ['ST'],
};

const SLOT_FAMILY = {
  GK: 'GK',
  CB: 'DEF',
  LB: 'DEF',
  RB: 'DEF',
  LWB: 'DEF',
  RWB: 'DEF',
  DM: 'MID',
  CM: 'MID',
  CAM: 'MID',
  LW: 'FWD',
  RW: 'FWD',
  ST: 'FWD',
};

const FORMATIONS = {
  '4-3-3': ['GK', 'RB', 'CB', 'CB', 'LB', 'CM', 'CM', 'CAM', 'RW', 'LW', 'ST'],
  '4-2-3-1': ['GK', 'RB', 'CB', 'CB', 'LB', 'DM', 'CM', 'RW', 'CAM', 'LW', 'ST'],
  '4-4-2': ['GK', 'RB', 'CB', 'CB', 'LB', 'RW', 'CM', 'CM', 'LW', 'ST', 'ST'],
  '3-5-2': ['GK', 'CB', 'CB', 'CB', 'RWB', 'CM', 'DM', 'CM', 'LWB', 'ST', 'ST'],
  '4-1-4-1': ['GK', 'RB', 'CB', 'CB', 'LB', 'DM', 'RW', 'CM', 'CM', 'LW', 'ST'],
  '5-3-2': ['GK', 'RWB', 'CB', 'CB', 'CB', 'LWB', 'CM', 'DM', 'CAM', 'ST', 'ST'],
};

const BENCH_ROLE_ORDER = ['GK', 'CB', 'LB', 'RB', 'DM', 'CM', 'CAM', 'LW', 'RW', 'ST'];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function safeObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function firstNumber(...values) {
  for (const value of values.flat()) {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return numeric;
  }
  return undefined;
}

function averageDefined(...values) {
  const numbers = values.flat().map(Number).filter(Number.isFinite);
  if (numbers.length === 0) return undefined;
  return numbers.reduce((sum, number) => sum + number, 0) / numbers.length;
}

function slugify(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function extractExportedArray(filePath, exportNameHint) {
  const content = fs.readFileSync(filePath, 'utf8');
  const regex = exportNameHint
    ? new RegExp(`export const ${exportNameHint}\\s*=\\s*(\\[[\\s\\S]*?\\]);`)
    : /export const \w+\s*=\s*(\[[\s\S]*?\]);/;
  const match = content.match(regex);
  if (!match) return null;
  try {
    return vm.runInNewContext(match[1], {}, { timeout: 1000 });
  } catch {
    return null;
  }
}

function getRoles(rawPosition) {
  const normalized = String(rawPosition || 'CM').toUpperCase();
  return POSITION_ROLE_MAP[normalized] || ['CM'];
}

function mapAttributes(player) {
  const ana = safeObject(player.ana_ozellikler);
  const det = safeObject(player.detaylar);
  const roles = getRoles(player.mevki);
  const overall = firstNumber(player.reyting, 70) || 70;
  const isGoalkeeper = roles[0] === 'GK';
  const isDefender = SLOT_FAMILY[roles[0]] === 'DEF';
  const isMidfielder = SLOT_FAMILY[roles[0]] === 'MID';

  if (isGoalkeeper) {
    const goalkeeping = averageDefined(det.refleks, det.ucma, det.vurus, det.pozisyon, det.reaksiyon, overall) || overall;
    const passing = averageDefined(det.kisa_pas, det.uzun_pas, det.vizyon, ana.pas, overall - 12) || overall - 12;
    return {
      finishing: 20,
      passing: clamp(passing, 20, 99),
      tackling: 20,
      dribbling: clamp(averageDefined(det.top_kontrol, det.ceviklik, 24) || 24, 20, 70),
      goalkeeping: clamp(goalkeeping + 1, 45, 99),
      speed: clamp(averageDefined(det.sprint, det.hizlanma, ana.hiz, overall - 16) || overall - 16, 20, 99),
      stamina: clamp(averageDefined(det.dayaniklilik, ana.fizik, overall - 10) || overall - 10, 25, 99),
      strength: clamp(averageDefined(det.guc, ana.fizik, overall - 8) || overall - 8, 25, 99),
      positioning: clamp(averageDefined(det.pozisyon, det.reaksiyon, goalkeeping) || goalkeeping, 30, 99),
      aggression: clamp(averageDefined(det.agresiflik, 28) || 28, 10, 75),
      composure: clamp(averageDefined(det.sogukkanlilik, det.reaksiyon, 65) || 65, 25, 99),
      vision: clamp(averageDefined(det.vizyon, det.uzun_pas, 52) || 52, 20, 99),
      leadership: clamp(averageDefined(det.liderlik, det.caliskanlik, 58) || 58, 20, 99),
      decisions: clamp(averageDefined(det.reaksiyon, det.pozisyon, det.vizyon, 64) || 64, 20, 99),
    };
  }

  const finishing = averageDefined(det.bitiricilik, det.sut_gucu, ana.sut, det.uzaktan_sut, isDefender ? overall - 28 : overall - 6);
  const passing = averageDefined(det.kisa_pas, det.uzun_pas, det.vizyon, det.yaraticilik, ana.pas, overall - 8);
  const tackling = averageDefined(det.ayakta_mudahale, det.top_kesme, det.top_kapma, det.defansif_farkindalik, det.markaj, ana.defans, isDefender ? overall : overall - 22);
  const dribbling = averageDefined(det.dribbling, det.dripling, det.top_kontrol, det.ceviklik, ana.dribbling, overall - 8);
  const speed = averageDefined(det.sprint, det.hizlanma, ana.hiz, overall - 6);
  const stamina = averageDefined(det.dayaniklilik, ana.fizik, overall - 7);
  const strength = averageDefined(det.guc, det.ziplama, ana.fizik, overall - 8);
  const positioning = averageDefined(det.pozisyon, det.defansif_farkindalik, isMidfielder ? passing : finishing, overall - 5);
  const aggression = averageDefined(det.agresiflik, det.caliskanlik, isDefender ? overall - 4 : 60);
  const composure = averageDefined(det.sogukkanlilik, det.reaksiyon, det.top_kontrol, 66);
  const vision = averageDefined(det.vizyon, det.yaraticilik, det.kisa_pas, ana.pas, isMidfielder ? overall : overall - 12);
  const leadership = averageDefined(det.liderlik, det.caliskanlik, det.agresiflik, 58);
  const decisions = averageDefined(det.reaksiyon, det.vizyon, det.pozisyon, 65);

  return {
    finishing: clamp(finishing || overall - 6, 20, 99),
    passing: clamp(passing || overall - 8, 20, 99),
    tackling: clamp(tackling || overall - 10, 20, 99),
    dribbling: clamp(dribbling || overall - 8, 20, 99),
    goalkeeping: 5,
    speed: clamp(speed || overall - 6, 20, 99),
    stamina: clamp(stamina || overall - 7, 20, 99),
    strength: clamp(strength || overall - 8, 20, 99),
    positioning: clamp(positioning || overall - 5, 20, 99),
    aggression: clamp(aggression || 60, 20, 99),
    composure: clamp(composure || 66, 20, 99),
    vision: clamp(vision || overall - 10, 20, 99),
    leadership: clamp(leadership || 58, 20, 99),
    decisions: clamp(decisions || 65, 20, 99),
  };
}

function getTeamMeta() {
  const presets = extractExportedArray(TEAM_META_PATH, 'LEAGUE_PRESETS');
  const map = new Map();
  if (!Array.isArray(presets)) return map;

  for (const league of presets) {
    const teams = Array.isArray(league.realTeams) ? league.realTeams : [];
    for (const team of teams) {
      map.set(team.name, {
        leagueId: league.id,
        leagueName: league.name,
        country: league.country,
        region: league.region,
        reputation: team.reputation,
        budget: team.budget,
        city: team.city,
        primaryColor: team.primaryColor,
        secondaryColor: team.secondaryColor,
      });
    }
  }

  return map;
}

function buildPlayerRecord(player, index) {
  const name = String(player.ad || `Player ${index + 1}`).trim();
  const roles = getRoles(player.mevki);
  const attributes = mapAttributes(player);
  return {
    name,
    overall: clamp(firstNumber(player.reyting, 70) || 70, 45, 99),
    age: clamp(firstNumber(player.yas, 24) || 24, 16, 40),
    nationality: player.uyruk || null,
    rawPosition: player.mevki || 'CM',
    roles,
    playStyles: Array.isArray(player.oyun_tarzlari) ? player.oyun_tarzlari.filter(Boolean).slice(0, 5) : [],
    attributes,
  };
}

function getRoleFit(player, slot) {
  if (slot === 'GK') return player.roles.includes('GK') ? 40 : -1000;
  if (player.roles.includes(slot)) return 40;

  const slotFamily = SLOT_FAMILY[slot];
  const playerFamilies = player.roles.map((role) => SLOT_FAMILY[role]);
  if (playerFamilies.includes(slotFamily)) return 24;

  const neighbors = {
    CB: ['DM', 'LB', 'RB'],
    LB: ['LWB', 'LW', 'CB'],
    RB: ['RWB', 'RW', 'CB'],
    LWB: ['LB', 'LW', 'CM'],
    RWB: ['RB', 'RW', 'CM'],
    DM: ['CM', 'CB'],
    CM: ['DM', 'CAM', 'LW', 'RW'],
    CAM: ['CM', 'ST', 'LW', 'RW'],
    LW: ['RW', 'CAM', 'ST'],
    RW: ['LW', 'CAM', 'ST'],
    ST: ['CAM', 'LW', 'RW'],
  };

  if ((neighbors[slot] || []).some((role) => player.roles.includes(role))) return 12;
  return 0;
}

function scorePlayerForSlot(player, slot) {
  const fit = getRoleFit(player, slot);
  if (fit < -500) return fit;

  let score = fit * 10 + player.overall * 2;
  if (slot === 'GK') score += player.attributes.goalkeeping * 1.5;
  if (['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(slot)) score += player.attributes.tackling + player.attributes.positioning * 0.5;
  if (['DM', 'CM', 'CAM'].includes(slot)) score += player.attributes.passing + player.attributes.vision * 0.8;
  if (['LW', 'RW', 'ST'].includes(slot)) score += player.attributes.finishing + player.attributes.dribbling * 0.7 + player.attributes.speed * 0.6;
  return score;
}

function assignFormation(players, formation) {
  const slots = FORMATIONS[formation];
  const orderedSlots = slots
    .map((slot, index) => ({
      slot,
      index,
      naturalCount: players.filter((player) => getRoleFit(player, slot) >= 24).length,
    }))
    .sort((left, right) => left.naturalCount - right.naturalCount || left.index - right.index);

  const used = new Set();
  const assignments = new Array(slots.length);
  let totalScore = 0;

  for (const slotInfo of orderedSlots) {
    const candidate = players
      .filter((player) => !used.has(player.name))
      .map((player) => ({ player, score: scorePlayerForSlot(player, slotInfo.slot) }))
      .sort((left, right) => right.score - left.score)[0];

    if (!candidate) continue;

    used.add(candidate.player.name);
    assignments[slotInfo.index] = {
      player: candidate.player,
      position: slotInfo.slot,
      lineup: 'STARTING',
      lineupIndex: slotInfo.index,
      score: candidate.score,
    };
    totalScore += candidate.score;
  }

  const starters = assignments.filter(Boolean);
  return { starters, totalScore };
}

function selectBestFormation(players) {
  return Object.keys(FORMATIONS)
    .map((formation) => ({ formation, ...assignFormation(players, formation) }))
    .sort((left, right) => right.totalScore - left.totalScore)[0];
}

function buildBench(players, usedNames) {
  const remaining = players.filter((player) => !usedNames.has(player.name));
  const bench = [];
  const used = new Set();

  const keeper = remaining.find((player) => player.roles.includes('GK'));
  if (keeper) {
    bench.push(keeper);
    used.add(keeper.name);
  }

  for (const role of BENCH_ROLE_ORDER) {
    if (bench.length >= 7) break;
    const candidate = remaining
      .filter((player) => !used.has(player.name))
      .map((player) => ({ player, score: scorePlayerForSlot(player, role) }))
      .sort((left, right) => right.score - left.score)[0];
    if (!candidate) continue;
    bench.push(candidate.player);
    used.add(candidate.player.name);
  }

  for (const player of remaining.sort((left, right) => right.overall - left.overall)) {
    if (bench.length >= 7) break;
    if (used.has(player.name)) continue;
    bench.push(player);
    used.add(player.name);
  }

  return bench.slice(0, 7).map((player, index) => ({
    player,
    position: player.roles[0] || 'CM',
    lineup: 'BENCH',
    lineupIndex: 11 + index,
  }));
}

function inferCountry(players, meta) {
  if (meta?.country) return meta.country;
  const counts = new Map();
  players.forEach((player) => {
    if (!player.nationality) return;
    counts.set(player.nationality, (counts.get(player.nationality) || 0) + 1);
  });
  return [...counts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] || 'Unknown';
}

function inferTactics(starters, formation, overall) {
  const average = (key) => averageDefined(...starters.map((entry) => entry.player.attributes[key])) || overall;
  const averageSpeed = average('speed');
  const averagePassing = average('passing');
  const averageVision = average('vision');
  const averageAggression = average('aggression');
  const averageTackling = average('tackling');
  const averageStamina = average('stamina');
  const averageFinishing = average('finishing');
  const averageDribbling = average('dribbling');
  const wideAttackers = starters.filter((entry) => ['LW', 'RW', 'LWB', 'RWB'].includes(entry.position)).length;
  const strikers = starters.filter((entry) => entry.position === 'ST').length;

  let style = 'Balanced';
  if (averagePassing >= 81 && averageVision >= 79) style = 'Possession';
  else if (averageAggression >= 78 && averageTackling >= 77 && averageStamina >= 78) style = 'HighPress';
  else if (averageSpeed >= 82 && averageFinishing >= 76) style = 'Counter';
  else if (averageFinishing >= 79 && averagePassing < 74) style = 'Direct';

  let attackPlan = 'AUTO';
  if (wideAttackers >= 2 && averagePassing >= 74) attackPlan = 'WIDE_CROSS';
  else if (averagePassing >= 83 && averageVision >= 81) attackPlan = 'THIRD_MAN';
  else if (averageSpeed >= 84) attackPlan = 'DIRECT_CHANNEL';
  else if (averageDribbling >= 82) attackPlan = 'CUTBACK';

  return {
    formation,
    style,
    aggression: averageAggression >= 78 ? 'High' : averageAggression <= 58 ? 'Low' : 'Normal',
    tempo: averageSpeed >= 80 ? 'High' : averagePassing >= 82 && averageSpeed <= 70 ? 'Low' : 'Normal',
    width: wideAttackers >= 2 ? 'Wide' : strikers >= 2 ? 'Normal' : 'Narrow',
    defensiveLine: averageSpeed >= 79 && averageTackling >= 75 ? 'High' : averageSpeed <= 67 ? 'Low' : 'Medium',
    passingStyle: averagePassing >= 81 ? 'Short' : averagePassing >= 74 ? 'Mixed' : 'Direct',
    marking: averageAggression >= 82 && averageTackling >= 80 ? 'ManMark' : 'Zonal',
    mentality: overall >= 83 ? 'Attacking' : overall <= 71 ? 'Defensive' : 'Balanced',
    pressingIntensity: averageStamina >= 79 && averageAggression >= 74 ? 'High' : averageStamina <= 66 ? 'Low' : 'Balanced',
    attackPlan,
  };
}

function createManagerName(rawSquad, index) {
  const ranked = [...rawSquad].sort((left, right) => {
    const leftLead = firstNumber(safeObject(left.detaylar).liderlik, safeObject(left.detaylar).caliskanlik, left.yas, left.reyting) || 0;
    const rightLead = firstNumber(safeObject(right.detaylar).liderlik, safeObject(right.detaylar).caliskanlik, right.yas, right.reyting) || 0;
    return rightLead - leftLead;
  });
  const source = ranked[0]?.ad || `Manager ${index + 1}`;
  const parts = String(source).trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}. ${parts[parts.length - 1]}`;
  return `Coach ${parts[0] || index + 1}`;
}

function estimateBotElo(averageOverall, meta) {
  const reputation = firstNumber(meta?.reputation, 4500) || 4500;
  return clamp(900 + (averageOverall - 68) * 24 + reputation / 55, 920, 1600);
}

function buildSnapshotSquad(starters, bench) {
  return [...starters, ...bench].map((entry) => ({
    name: entry.player.name,
    ovr: entry.player.overall,
    position: entry.position,
    lineup: entry.lineup,
    lineupIndex: entry.lineupIndex,
    playStyles: entry.player.playStyles,
    nationality: entry.player.nationality,
    age: entry.player.age,
    attributes: entry.player.attributes,
  }));
}

function getSquadFiles() {
  return fs.readdirSync(DATA_DIR)
    .filter((file) => file.endsWith('.ts') && file !== 'teams.ts')
    .map((file) => ({ file, fullPath: path.join(DATA_DIR, file) }));
}

function buildBotFromSquad(rawSquad, meta, fileName, index) {
  if (!Array.isArray(rawSquad) || rawSquad.length < 14) return null;
  const teamName = rawSquad[0]?.takim;
  if (!teamName) return null;

  const players = rawSquad.map(buildPlayerRecord).sort((left, right) => right.overall - left.overall);
  const bestFormation = selectBestFormation(players);
  if (!bestFormation || bestFormation.starters.length < 11) return null;

  const usedNames = new Set(bestFormation.starters.map((entry) => entry.player.name));
  const bench = buildBench(players, usedNames);
  const averageOverall = clamp(averageDefined(...bestFormation.starters.map((entry) => entry.player.overall)) || 70, 45, 99);
  const country = inferCountry(players, meta);
  const tactics = inferTactics(bestFormation.starters, bestFormation.formation, averageOverall);

  return {
    id: `bot-${slugify(fileName.replace(/\.ts$/i, ''))}`,
    managerName: createManagerName(rawSquad, index),
    teamName,
    nationality: country,
    country,
    leagueId: meta?.leagueId || slugify(country || 'misc'),
    leagueName: meta?.leagueName || `${country} League`,
    city: meta?.city || teamName,
    primaryColor: meta?.primaryColor || '#1f2937',
    secondaryColor: meta?.secondaryColor || '#e5e7eb',
    reputation: firstNumber(meta?.reputation, averageOverall * 80) || averageOverall * 80,
    formation: bestFormation.formation,
    tactics,
    avg: averageOverall,
    elo: estimateBotElo(averageOverall, meta),
    sourceFile: fileName,
    squad: buildSnapshotSquad(bestFormation.starters, bench),
  };
}

function pickSpread(list, count) {
  if (list.length <= count) return list;
  const indices = new Set();
  for (let step = 0; step < count; step += 1) {
    indices.add(Math.round((step * (list.length - 1)) / Math.max(1, count - 1)));
  }
  return [...indices].sort((left, right) => left - right).map((index) => list[index]);
}

function main() {
  const teamMeta = getTeamMeta();
  const allBots = [];

  for (const { file, fullPath } of getSquadFiles()) {
    const rawSquad = extractExportedArray(fullPath);
    if (!Array.isArray(rawSquad) || rawSquad.length === 0 || !rawSquad[0]?.takim) continue;
    const bot = buildBotFromSquad(rawSquad, teamMeta.get(rawSquad[0].takim), file, allBots.length);
    if (bot) allBots.push(bot);
  }

  const groupedByLeague = new Map();
  for (const bot of allBots) {
    const groupKey = bot.leagueId || `misc-${slugify(bot.country || 'unknown')}`;
    if (!groupedByLeague.has(groupKey)) groupedByLeague.set(groupKey, []);
    groupedByLeague.get(groupKey).push(bot);
  }

  const finalBots = [];
  for (const bots of groupedByLeague.values()) {
    const sorted = [...bots].sort((left, right) => {
      const leftScore = left.avg * 10 + left.reputation / 100;
      const rightScore = right.avg * 10 + right.reputation / 100;
      return rightScore - leftScore || left.teamName.localeCompare(right.teamName);
    });
    finalBots.push(...pickSpread(sorted, MAX_BOTS_PER_LEAGUE));
  }

  finalBots.sort((left, right) => right.elo - left.elo || left.teamName.localeCompare(right.teamName));
  fs.writeFileSync(BOT_DATA_PATH, JSON.stringify(finalBots, null, 2));

  const leagueCount = new Set(finalBots.map((bot) => bot.leagueId)).size;
  const countryCount = new Set(finalBots.map((bot) => bot.country)).size;
  console.log(`Built ${finalBots.length} online bots from ${allBots.length} squad files.`);
  console.log(`Coverage: ${leagueCount} leagues, ${countryCount} countries.`);
  console.log(`Output written to ${BOT_DATA_PATH}`);
}

main();