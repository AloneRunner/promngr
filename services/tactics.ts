
import { TeamTactic, TacticType, TacticalMatchRecord } from '../types';

export type PresetKey = 'Gegenpress' | 'TikiTaka' | 'CounterAttack' | 'ParkTheBus' | 'WingPlay' | 'Catenaccio';

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
            style: 'HighPress',
            aggression: 'Aggressive',
            tempo: 'Fast',
            width: 'Balanced',
            defensiveLine: 'High',
            passingStyle: 'Mixed',
            marking: 'Zonal' // Defaulting to Zonal as specific marking type isn't fully in UI yet but good for backend
        }
    },
    'TikiTaka': {
        name: 'Tiki-Taka',
        description: 'Patient, short passing game focused on retaining possession.',
        tactic: {
            style: 'Possession',
            aggression: 'Normal',
            tempo: 'Slow',
            width: 'Narrow',
            defensiveLine: 'High',
            passingStyle: 'Short',
            marking: 'Zonal'
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
            marking: 'Zonal'
        }
    },
    'ParkTheBus': {
        name: 'Park The Bus',
        description: 'Defend with everyone behind the ball. Frustrate the opponent.',
        tactic: {
            style: 'ParkTheBus',
            aggression: 'Safe',
            tempo: 'Slow',
            width: 'Narrow',
            defensiveLine: 'Deep',
            passingStyle: 'Direct',
            marking: 'Man'
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
            marking: 'Zonal'
        }
    },
    'Catenaccio': {
        name: 'Catenaccio',
        description: 'Classic Italian defense. Very strong defensive organization.',
        tactic: {
            style: 'Defensive', // Note: Needs to map to available styles or 'Balanced' if 'Defensive' isn't exact
            aggression: 'Aggressive',
            tempo: 'Slow',
            width: 'Narrow',
            defensiveLine: 'Deep',
            passingStyle: 'Mixed',
            marking: 'Man'
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

export interface TacticWarning {
    type: 'WARNING' | 'CRITICAL';
    message: string;
}

export const validateTactic = (tactic: TeamTactic): TacticWarning[] => {
    const warnings: TacticWarning[] = [];

    // Example 1: High Press but Deep Line (Gaps in midfield)
    if (tactic.style === 'HighPress' && tactic.defensiveLine === 'Deep') {
        warnings.push({
            type: 'CRITICAL',
            message: 'High Press with Deep Line creates massive gaps in midfield!'
        });
    }

    // Example 2: Possession (Short Passing) but Fast Tempo (Rush mistakes)
    if (tactic.style === 'Possession' && tactic.tempo === 'Fast') {
        warnings.push({
            type: 'WARNING',
            message: 'Possession style works best with slower tempo to retain control.'
        });
    }

    // Example 3: Park The Bus with High Line (Suicide)
    if (tactic.style === 'ParkTheBus' && tactic.defensiveLine === 'High') {
        warnings.push({
            type: 'CRITICAL',
            message: 'Cannot Park the Bus with a High Defensive Line!'
        });
    }

    // Example 4: Counter Attack with Slow Tempo
    if (tactic.style === 'Counter' && tactic.tempo === 'Slow') {
        warnings.push({
            type: 'WARNING',
            message: 'Counter Attacks require Fast Tempo to be effective.'
        });
    }

    return warnings;
};

export const analyzeUserHistory = (
    history: TacticalMatchRecord[],
    formationFilter?: string,
    styleFilter?: string
) => {
    // 1. Filter relevant matches
    let relevantMatches = history;
    if (formationFilter) {
        // Look for matches where OPPONENT used this formation
        relevantMatches = relevantMatches.filter(m =>
            (m.isUserHome ? m.awayTactic.formation : m.homeTactic.formation) === formationFilter
        );
    }
    if (styleFilter) {
        relevantMatches = relevantMatches.filter(m =>
            (m.isUserHome ? m.awayTactic.style : m.homeTactic.style) === styleFilter
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
    const formationStats: Record<string, { wins: number, total: number }> = {};
    const styleStats: Record<string, { wins: number, total: number }> = {};

    relevantMatches.forEach(m => {
        const userTactic = m.isUserHome ? m.homeTactic : m.awayTactic;
        const userWon = m.userWon;

        // Formation
        if (!formationStats[userTactic.formation]) formationStats[userTactic.formation] = { wins: 0, total: 0 };
        formationStats[userTactic.formation].total++;
        if (userWon) formationStats[userTactic.formation].wins++;

        // Style
        if (!styleStats[userTactic.style]) styleStats[userTactic.style] = { wins: 0, total: 0 };
        styleStats[userTactic.style].total++;
        if (userWon) styleStats[userTactic.style].wins++;
    });

    // 3. Find Best
    const sortedFormations = Object.entries(formationStats)
        .map(([key, val]) => ({ key, winRate: (val.wins / val.total) * 100, total: val.total }))
        .sort((a, b) => b.winRate - a.winRate || b.total - a.total);

    const sortedStyles = Object.entries(styleStats)
        .map(([key, val]) => ({ key, winRate: (val.wins / val.total) * 100, total: val.total }))
        .sort((a, b) => b.winRate - a.winRate || b.total - a.total);

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
