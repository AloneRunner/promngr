const API_URL = 'https://promngr-production.up.railway.app/api';

// ─── Player ID (UUID) ────────────────────────────────────────────────────────

export function getOrCreatePlayerId(): string {
  let id = localStorage.getItem('mp_player_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('mp_player_id', id);
  }
  return id;
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface MPPlayer {
  player_id: string;
  username: string;
  team_name: string;
  elo: number;
  wins: number;
  losses: number;
  draws: number;
}

export interface MPOpponent {
  player_id: string;
  username: string;
  team_name: string;
  elo: number;
  formation: string;
  tactics: Record<string, unknown>;
  squad: unknown[];
  avg_ovr: number;
}

export interface MatchResult {
  homeEloChange: number;
  awayEloChange: number;
}

// ─── API Calls ───────────────────────────────────────────────────────────────

export async function registerPlayer(username: string, teamName: string): Promise<MPPlayer | null> {
  try {
    const res = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId: getOrCreatePlayerId(), username, teamName }),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function syncTeamSnapshot(
  formation: string,
  tactics: Record<string, unknown>,
  squad: unknown[],
  avgOvr: number
): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/snapshot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playerId: getOrCreatePlayerId(),
        formation,
        tactics,
        squad,
        avgOvr,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function findOpponent(): Promise<MPOpponent | null> {
  try {
    const res = await fetch(`${API_URL}/matchmaking/${getOrCreatePlayerId()}`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function submitMatchResult(
  awayPlayerId: string,
  homeScore: number,
  awayScore: number
): Promise<MatchResult | null> {
  try {
    const res = await fetch(`${API_URL}/match/result`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        homePlayerId: getOrCreatePlayerId(),
        awayPlayerId,
        homeScore,
        awayScore,
      }),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function getLeaderboard(): Promise<MPPlayer[]> {
  try {
    const res = await fetch(`${API_URL}/leaderboard`);
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function getMyProfile(): Promise<MPPlayer | null> {
  try {
    const res = await fetch(`${API_URL}/profile/${getOrCreatePlayerId()}`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}
