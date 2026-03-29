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
  nationality?: string;
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

export async function registerPlayer(username: string, teamName: string, nationality?: string): Promise<MPPlayer | null> {
  try {
    const res = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId: getOrCreatePlayerId(), username, teamName, nationality }),
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
  awayScore: number,
  matchType: 'ranked' | 'challenge' = 'ranked'
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
        matchType,
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

// ─── Challenge Types ──────────────────────────────────────────────────────────

export interface MPChallenge {
  id: number;
  challenger_id: string;
  challenged_id: string;
  status: string;
  created_at: string;
  challenger_name: string;
  challenger_team: string;
  challenger_elo: number;
  challenged_name: string;
  challenged_team: string;
  challenged_elo: number;
  // opponent snapshot (challenger's data)
  formation?: string;
  tactics?: Record<string, unknown>;
  squad?: unknown[];
  avg_ovr?: number;
}

export async function sendChallenge(challengedId: string): Promise<{ ok?: boolean; error?: string; eloDiff?: number }> {
  try {
    const res = await fetch(`${API_URL}/challenge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challengerId: getOrCreatePlayerId(), challengedId }),
    });
    return res.json();
  } catch {
    return { error: 'Network error' };
  }
}

export async function getChallenges(): Promise<MPChallenge[]> {
  try {
    const res = await fetch(`${API_URL}/challenges/${getOrCreatePlayerId()}`);
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function acceptChallenge(challengeId: number): Promise<{ ok?: boolean; opponent?: MPOpponent; error?: string }> {
  try {
    const res = await fetch(`${API_URL}/challenge/${challengeId}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId: getOrCreatePlayerId() }),
    });
    return res.json();
  } catch {
    return { error: 'Network error' };
  }
}

export async function declineChallenge(challengeId: number): Promise<void> {
  try {
    await fetch(`${API_URL}/challenge/${challengeId}/decline`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId: getOrCreatePlayerId() }),
    });
  } catch {}
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
