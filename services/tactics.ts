import { TacticalMatchRecord } from '../types';

// === HISTORICAL ANALYSIS ENGINE ===
// Analyzes user's past match performance to give personalized tactical advice

export interface HistoricalAnalysis {
    // Best performing tactics for the user
    bestFormation: string | null;
    bestFormationWinRate: number;
    bestFormationMatches: number;

    bestStyle: string | null;
    bestStyleWinRate: number;
    bestStyleMatches: number;

    // All stats by formation
    formationStats: Record<string, { wins: number; total: number; winRate: number }>;
    styleStats: Record<string, { wins: number; total: number; winRate: number }>;

    // Total matches analyzed
    totalMatches: number;
}

/**
 * Analyzes the user's tactical history against a specific opponent type.
 * Returns win rates for formations and styles the user has ACTUALLY used.
 * 
 * @param history - Full tactical match history
 * @param opponentFormation - Filter by opponent's formation (optional)
 * @param opponentStyle - Filter by opponent's style (optional)
 */
export function analyzeUserHistory(
    history: TacticalMatchRecord[],
    opponentFormation?: string,
    opponentStyle?: string
): HistoricalAnalysis {
    // Filter matches by opponent type if specified
    let relevantMatches = history;

    if (opponentFormation) {
        relevantMatches = relevantMatches.filter(m => {
            const oppTactic = m.isUserHome ? m.awayTactic : m.homeTactic;
            return oppTactic.formation === opponentFormation;
        });
    }

    if (opponentStyle) {
        relevantMatches = relevantMatches.filter(m => {
            const oppTactic = m.isUserHome ? m.awayTactic : m.homeTactic;
            return oppTactic.style === opponentStyle;
        });
    }

    // Group by user's formation
    const formationStats: Record<string, { wins: number; total: number; winRate: number }> = {};
    const styleStats: Record<string, { wins: number; total: number; winRate: number }> = {};

    for (const match of relevantMatches) {
        const userTactic = match.isUserHome ? match.homeTactic : match.awayTactic;
        const userFormation = userTactic.formation;
        const userStyle = userTactic.style || 'Balanced';

        // Formation stats
        if (!formationStats[userFormation]) {
            formationStats[userFormation] = { wins: 0, total: 0, winRate: 0 };
        }
        formationStats[userFormation].total++;
        if (match.userWon) formationStats[userFormation].wins++;

        // Style stats
        if (!styleStats[userStyle]) {
            styleStats[userStyle] = { wins: 0, total: 0, winRate: 0 };
        }
        styleStats[userStyle].total++;
        if (match.userWon) styleStats[userStyle].wins++;
    }

    // Calculate win rates
    for (const key of Object.keys(formationStats)) {
        const stat = formationStats[key];
        stat.winRate = stat.total > 0 ? Math.round((stat.wins / stat.total) * 100) : 0;
    }
    for (const key of Object.keys(styleStats)) {
        const stat = styleStats[key];
        stat.winRate = stat.total > 0 ? Math.round((stat.wins / stat.total) * 100) : 0;
    }

    // Find best performing tactics (minimum 3 matches for reliability)
    let bestFormation: string | null = null;
    let bestFormationWinRate = 0;
    let bestFormationMatches = 0;

    for (const [formation, stat] of Object.entries(formationStats)) {
        if (stat.total >= 3 && stat.winRate > bestFormationWinRate) {
            bestFormation = formation;
            bestFormationWinRate = stat.winRate;
            bestFormationMatches = stat.total;
        }
    }

    let bestStyle: string | null = null;
    let bestStyleWinRate = 0;
    let bestStyleMatches = 0;

    for (const [style, stat] of Object.entries(styleStats)) {
        if (stat.total >= 3 && stat.winRate > bestStyleWinRate) {
            bestStyle = style;
            bestStyleWinRate = stat.winRate;
            bestStyleMatches = stat.total;
        }
    }

    return {
        bestFormation,
        bestFormationWinRate,
        bestFormationMatches,
        bestStyle,
        bestStyleWinRate,
        bestStyleMatches,
        formationStats,
        styleStats,
        totalMatches: relevantMatches.length
    };
}

/**
 * Get overall stats from all matches (not filtered by opponent)
 */
export function getOverallStats(history: TacticalMatchRecord[]): HistoricalAnalysis {
    return analyzeUserHistory(history);
}
