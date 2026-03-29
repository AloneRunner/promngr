import { Player } from '../types';

export const uuid = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

export const assignJerseyNumber = (player: Player, teamPlayers: Player[]): number => {
    const usedNumbers = new Set(teamPlayers.filter(p => p.id !== player.id && p.jerseyNumber).map(p => p.jerseyNumber!));

    // Kendi numarası boşsa kullan
    if (player.jerseyNumber && !usedNumbers.has(player.jerseyNumber)) return player.jerseyNumber;

    // Pozisyona göre tercih
    const preferred = player.position === 'GK' ? [1, 12, 23] :
        player.position === 'FWD' ? [9, 10, 11, 7] :
            player.position === 'MID' ? [8, 10, 6, 5] :
                [2, 3, 4, 5];

    for (const num of preferred) {
        if (!usedNumbers.has(num)) return num;
    }

    // Boş numara bul
    for (let i = 1; i <= 99; i++) {
        if (!usedNumbers.has(i)) return i;
    }
    return 99;
};

export const migrateJerseyNumbers = (gameState: any): any => {
    // Eski save dosyalarında forma numarası olmayan oyunculara numara atar
    const players = gameState.players.map((p: Player) => {
        if (!p.jerseyNumber && p.teamId !== 'FREE_AGENT') {
            const teamPlayers = gameState.players.filter((tp: Player) => tp.teamId === p.teamId);
            return { ...p, jerseyNumber: assignJerseyNumber(p, teamPlayers) };
        }
        return p;
    });
    return { ...gameState, players };
};

export const getMaskedAttribute = (
    attributeValue: number,
    _scoutLevel?: number,
    _isOwnTeam?: boolean,
    _playerId?: string,
    _scoutingTalent?: number,
    _scoutAdvisor?: number
): number => {
    return attributeValue;
};

export const getMaskedValue = (
    exactValue: number, 
    scoutLevel: number, 
    isOwnTeam: boolean,
    playerId: string
): string => {
    if (isOwnTeam || scoutLevel >= 5) return `€${(exactValue / 1000000).toFixed(1)}M`;

    let hash = 0;
    for (let i = 0; i < playerId.length; i++) {
        hash = ((hash << 5) - hash) + playerId.charCodeAt(i);
        hash |= 0; 
    }
    const seededRandom = Math.abs(hash) / 2147483647; 

    let variancePercent;
    switch (scoutLevel) {
        case 1: variancePercent = 0.40; break;
        case 2: variancePercent = 0.25; break;
        case 3: variancePercent = 0.15; break;
        case 4: variancePercent = 0.05; break;
        default: variancePercent = 0.40;
    }

    const offsetPercentage = (seededRandom * 2 * variancePercent) - variancePercent;
    let predictedValue = exactValue * (1 + offsetPercentage);
    
    const rangeStart = Math.max(0.1, predictedValue * (1 - variancePercent / 2));
    const rangeEnd = predictedValue * (1 + variancePercent / 2);

    return `€${(rangeStart / 1000000).toFixed(1)}M - €${(rangeEnd / 1000000).toFixed(1)}M`;
};

export const getMaskedWage = (
    exactWage: number,
    scoutLevel: number,
    isOwnTeam: boolean,
    playerId: string
): string => {
    if (isOwnTeam || scoutLevel >= 5) return `€${Math.floor(exactWage).toLocaleString()}/h`;

    let hash = 0;
    for (let i = 0; i < playerId.length; i++) {
        hash = ((hash << 5) - hash) + playerId.charCodeAt(i);
        hash |= 0; 
    }
    const seededRandom = Math.abs(hash) / 2147483647; 

    let variancePercent;
    switch (scoutLevel) {
        case 1: variancePercent = 0.30; break;
        case 2: variancePercent = 0.20; break;
        case 3: variancePercent = 0.10; break;
        case 4: variancePercent = 0.05; break;
        default: variancePercent = 0.30;
    }

    const offsetPercentage = (seededRandom * 2 * variancePercent) - variancePercent;
    let predictedWage = exactWage * (1 + offsetPercentage);

    const rangeStart = Math.max(0, predictedWage * (1 - variancePercent / 2));
    const rangeEnd = predictedWage * (1 + variancePercent / 2);

    const rs = Math.round(rangeStart / 10) * 10;
    const re = Math.round(rangeEnd / 10) * 10;

    return `€${rs.toLocaleString()} - €${re.toLocaleString()}/h`;
};

export const getLocalizedPlaystyle = (style: string, t: any): string => {
    switch (style) {
        case "Kedi Refleks": return t.styleCatReflexes || style;
        case "Ortaya Çıkan": return t.styleSweeper || style;
        case "Penaltı Canavarı": return t.stylePenaltySaver || style;
        case "Top Kesici": return t.styleInterceptor || style;
        case "Kaya": return t.styleRock || style;
        case "Amansız": return t.styleRelentless || style;
        case "Baskıya Dayanıklı": return t.stylePressResistant || style;
        case "Seri": return t.styleRapid || style;
        case "Top Cambazı": return t.styleTrickster || style;
        case "İlk Dokunuş": return t.styleFirstTouch || style;
        case "Keskin Pas": return t.styleIncisivePass || style;
        case "Maestro": return t.styleMaestro || style;
        case "Ölü Top Uzmanı": return t.styleDeadBall || style;
        case "Plase Şut": return t.styleFinesse || style;
        case "Roket": return t.styleRocket || style;
        case "Aşırtma": return t.styleLob || style;
        case "Hava Hakimi": return t.styleAerialThreat || style;
        case "Uzaktan Şutör": return t.styleLongRanger || style;
        case "Gizli Forvet": return t.styleShadowStriker || style;
        case "İleride Bekleyen": return t.stylePoacher || style;
        default: return style;
    }
};
