
import { TeamTactic, TacticType, TacticalMatchRecord } from '../types';

export type PresetKey = 'Gegenpress' | 'CounterAttack' | 'ParkTheBus' | 'WingPlay' | 'Catenaccio' | 'TikiTaka' | 'TotalFootball' | 'FluidCounter' | 'RouteOne';

export interface TacticalPreset {
    name: string;
    description: string;
    tactic: Partial<TeamTactic>;
}

export const TACTICAL_PRESETS: Record<PresetKey, TacticalPreset> = {
    'Gegenpress': {
        name: 'Gegenpress',
        description: 'High intensity pressing to win the ball back immediately.',
        tactic: {
            style: 'Attacking',
            aggression: 'Aggressive',
            tempo: 'Fast',
            width: 'Balanced',
            defensiveLine: 'High',
            passingStyle: 'Mixed',
            marking: 'Zonal',
            pressingIntensity: 'Gegenpress',
            instructions: ['RoamFromPosition', 'ShootOnSight']
        }
    },
    'TikiTaka': {
        name: 'Tiki-Taka',
        description: 'Extreme possession game. Short passing and movement.',
        tactic: {
            style: 'Possession',
            aggression: 'Normal',
            tempo: 'Slow',
            width: 'Normal',
            defensiveLine: 'High',
            passingStyle: 'Short',
            marking: 'Zonal',
            pressingIntensity: 'HighPress',
            instructions: ['WorkBallIntoBox']
        }
    },
    'TotalFootball': {
        name: 'Total Football',
        description: 'Fluid movement where every player attacks and defends.',
        tactic: {
            style: 'Attacking',
            aggression: 'Aggressive',
            tempo: 'Fast',
            width: 'Wide',
            defensiveLine: 'High',
            passingStyle: 'Short',
            marking: 'Zonal',
            pressingIntensity: 'HighPress',
            instructions: ['RoamFromPosition', 'WorkBallIntoBox']
        }
    },
    'FluidCounter': {
        name: 'Fluid Counter',
        description: 'Draw them in, then hit them with pace and movement.',
        tactic: {
            style: 'Counter',
            aggression: 'Normal',
            tempo: 'Fast',
            width: 'Balanced',
            defensiveLine: 'Deep',
            passingStyle: 'Mixed',
            marking: 'Zonal',
            pressingIntensity: 'Balanced',
            instructions: ['RoamFromPosition']
        }
    },
    'RouteOne': {
        name: 'Route One',
        description: 'The quickest way to goal is a straight line. Long balls to the target man.',
        tactic: {
            style: 'Direct',
            aggression: 'Aggressive',
            tempo: 'Fast',
            width: 'Narrow',
            defensiveLine: 'Deep',
            passingStyle: 'LongBall',
            marking: 'Man',
            pressingIntensity: 'StandOff',
            instructions: ['ShootOnSight']
        }
    },
    'CounterAttack': {
        name: 'Rapid Counter',
        description: 'Soak up pressure and break fast with direct passing.',
        tactic: {
            style: 'Counter',
            aggression: 'Aggressive',
            tempo: 'Fast',
            width: 'Wide',
            defensiveLine: 'Deep',
            passingStyle: 'Direct',
            marking: 'Zonal',
            pressingIntensity: 'Balanced',
            instructions: ['ShootOnSight']
        }
    },
    'ParkTheBus': {
        name: 'Park The Bus',
        description: 'Defend with everyone behind the ball. Frustrate the opponent.',
        tactic: {
            style: 'Defensive',
            aggression: 'Safe',
            tempo: 'Slow',
            width: 'Narrow',
            defensiveLine: 'Deep',
            passingStyle: 'LongBall',
            marking: 'Man',
            pressingIntensity: 'StandOff',
            instructions: []
        }
    },
    'WingPlay': {
        name: 'Wing Play',
        description: 'Get the ball wide and cross it into the box.',
        tactic: {
            style: 'Balanced',
            aggression: 'Normal',
            tempo: 'Normal',
            width: 'Wide',
            defensiveLine: 'Balanced',
            passingStyle: 'Mixed',
            marking: 'Zonal',
            pressingIntensity: 'Balanced',
            instructions: ['WorkBallIntoBox']
        }
    },
    'Catenaccio': {
        name: 'Catenaccio',
        description: 'Classic Italian defense. Very strong defensive organization.',
        tactic: {
            style: 'Defensive',
            aggression: 'Aggressive',
            tempo: 'Slow',
            width: 'Narrow',
            defensiveLine: 'Deep',
            passingStyle: 'LongBall',
            marking: 'Man',
            pressingIntensity: 'StandOff',
            instructions: []
        }
    }
};

// Helper to apply preset
export const applyPreset = (currentTactic: TeamTactic, presetKey: PresetKey): TeamTactic => {
    const preset = TACTICAL_PRESETS[presetKey];
    return {
        ...currentTactic,
        ...preset.tactic,
        // Ensure we don't accidentally overwrite formation unless we want to enforce it (we generally don't for presets)
    };
};

// Helper: Check if current tactic matches a preset
export const detectPreset = (tactic: TeamTactic): PresetKey | 'Custom' => {
    for (const [key, preset] of Object.entries(TACTICAL_PRESETS)) {
        const p = preset.tactic;
        if (
            tactic.style === p.style &&
            tactic.aggression === p.aggression &&
            tactic.tempo === p.tempo &&
            tactic.width === p.width &&
            tactic.defensiveLine === p.defensiveLine &&
            tactic.passingStyle === p.passingStyle &&
            tactic.marking === p.marking &&
            tactic.pressingIntensity === p.pressingIntensity &&
            // Check instructions (arrays need manual comparison)
            tactic.instructions.length === (p.instructions?.length || 0) &&
            (p.instructions || []).every(i => tactic.instructions.includes(i))
        ) {
            return key as PresetKey;
        }
    }
    return 'Custom';
};

export interface TacticWarning {
    type: 'WARNING' | 'CRITICAL';
    message: string;
}

export const validateTactic = (tactic: TeamTactic): TacticWarning[] => {
    const warnings: TacticWarning[] = [];

    // Example 1: High Press but Deep Line (Gaps in midfield)
    // Check PressingIntensity HighPress or Gegenpress
    if ((tactic.pressingIntensity === 'HighPress' || tactic.pressingIntensity === 'Gegenpress') && tactic.defensiveLine === 'Deep') {
        warnings.push({
            type: 'CRITICAL',
            message: 'High Press with Deep Line creates massive gaps in midfield!'
        });
    }

    // Example 3: Park The Bus (StandOff) with High Line (Suicide)
    if (tactic.pressingIntensity === 'StandOff' && tactic.defensiveLine === 'High') {
        warnings.push({
            type: 'CRITICAL',
            message: 'Cannot play Stand Off defense with a High Defensive Line!'
        });
    }

    // Example 4: Counter Attack with Slow Tempo
    if (tactic.style === 'Counter' && tactic.tempo === 'Slow') {
        warnings.push({
            type: 'WARNING',
            message: 'Counter Attacks require Fast Tempo to be effective.'
        });
    }

    // === NEW VALIDATIONS ===

    // Possession vs Passing Style
    if (tactic.style === 'Possession' && (tactic.passingStyle === 'LongBall' || tactic.passingStyle === 'Direct')) {
        warnings.push({
            type: 'WARNING',
            message: 'Possession style works best with Short or Mixed passing, not Long Ball.'
        });
    }

    // Direct/RouteOne vs Short Passing
    if (tactic.style === 'Direct' && tactic.passingStyle === 'Short') {
        warnings.push({
            type: 'WARNING',
            message: 'Direct style contradicts Short passing. Try Mixed or Long Ball.'
        });
    }

    // Defensive vs Gegenpress
    if (tactic.style === 'Defensive' && tactic.pressingIntensity === 'Gegenpress') {
        warnings.push({
            type: 'WARNING',
            message: 'Defensive shape is hard to maintain with Gegenpressing.'
        });
    }

    // Tiki-Taka specificish check (Possession + Safe Aggression?)
    // Maybe checking if they selected TikiTaka traits but screwed it up?
    // "Total Football" usually needs smart players, but that's hard to validate here.

    // High Line vs Slow Defenders (This would require player data, which we don't have here trivially)

    return warnings;
};

export const analyzeUserHistory = (
    history: TacticalMatchRecord[],
    formationFilter?: string,
    styleFilter?: string
) => {
    // 0. Safety check
    if (!history || !Array.isArray(history)) {
        return {
            bestFormation: null,
            bestFormationWinRate: 0,
            bestFormationMatches: 0,
            bestStyle: null,
            bestStyleWinRate: 0,
            bestStyleMatches: 0
        };
    }

    // 1. Filter relevant matches
    let relevantMatches = history;
    if (formationFilter) {
        // Look for matches where OPPONENT used this formation
        relevantMatches = relevantMatches.filter(m =>
            (m.isUserHome ? m.awayTactic?.formation : m.homeTactic?.formation) === formationFilter
        );
    }
    if (styleFilter) {
        relevantMatches = relevantMatches.filter(m =>
            (m.isUserHome ? m.awayTactic?.style : m.homeTactic?.style) === styleFilter
        );
    }

    if (relevantMatches.length === 0) {
        return {
            bestFormation: null,
            bestFormationWinRate: 0,
            bestFormationMatches: 0,
            bestStyle: null,
            bestStyleWinRate: 0,
            bestStyleMatches: 0
        };
    }

    // 2. Analyze Performance by USER Tactic used
    const formationStats: Record<string, { wins: number, draws: number, total: number }> = {};
    const styleStats: Record<string, { wins: number, draws: number, total: number }> = {};

    relevantMatches.forEach(m => {
        const userTactic = m.userFinalTactic || (m.isUserHome ? m.homeTactic : m.awayTactic);
        const userWon = m.userWon;
        const isDraw = !userWon && m.homeGoals === m.awayGoals;

        // Formation
        if (!formationStats[userTactic.formation]) formationStats[userTactic.formation] = { wins: 0, draws: 0, total: 0 };
        formationStats[userTactic.formation].total++;
        if (userWon) formationStats[userTactic.formation].wins++;
        if (isDraw) formationStats[userTactic.formation].draws++;

        // Style
        // Ensure style exists (fallback to Balanced)
        const style = userTactic.style || 'Balanced';
        if (!styleStats[style]) styleStats[style] = { wins: 0, draws: 0, total: 0 };
        styleStats[style].total++;
        if (userWon) styleStats[style].wins++;
        if (isDraw) styleStats[style].draws++;
    });

    // Helper to calculate score
    const calculateScore = (wins: number, draws: number, total: number) => {
        if (total === 0) return 0;
        const points = (wins * 3) + (draws * 1);
        const ppm = points / total;
        // Logarithmic bonus for experience (more matches = more reliable)
        // log2(2) = 1, log2(5) = 2.3, log2(10) = 3.3
        const experienceBonus = Math.log2(total + 1);
        return ppm * experienceBonus;
    };

    // 3. Find Best
    const sortedFormations = Object.entries(formationStats)
        .map(([key, val]) => ({
            key,
            winRate: (val.wins / val.total) * 100,
            total: val.total,
            score: calculateScore(val.wins, val.draws, val.total)
        }))
        .sort((a, b) => b.score - a.score || b.total - a.total);

    const sortedStyles = Object.entries(styleStats)
        .map(([key, val]) => ({
            key,
            winRate: (val.wins / val.total) * 100,
            total: val.total,
            score: calculateScore(val.wins, val.draws, val.total)
        }))
        .sort((a, b) => b.score - a.score || b.total - a.total);

    const bestFormationData = sortedFormations[0];
    const bestStyleData = sortedStyles[0];

    return {
        bestFormation: bestFormationData ? bestFormationData.key : null,
        bestFormationWinRate: bestFormationData ? Math.round(bestFormationData.winRate) : 0,
        bestFormationMatches: bestFormationData ? bestFormationData.total : 0,
        bestStyle: bestStyleData ? bestStyleData.key : null,
        bestStyleWinRate: bestStyleData ? Math.round(bestStyleData.winRate) : 0,
        bestStyleMatches: bestStyleData ? bestStyleData.total : 0
    };
};
