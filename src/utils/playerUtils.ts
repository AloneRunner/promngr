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
