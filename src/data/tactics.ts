import { TeamTactic, TacticType } from '../types';
export const TEAM_TACTICAL_PROFILES: Record<string, TeamTactic> = {
    // Default Tactic (Fallback)
    "Default": {
        formation: TacticType.T_442,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },

    "Aba Elephants": {
        formation: TacticType.T_442,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Abidjan Yellows": {
        formation: TacticType.T_433,
        style: 'HighPress',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Balanced',
        defensiveLine: 'High',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Adelaide United": {
        formation: TacticType.T_4231,
        style: 'WingPlay',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Al-Fateh": {
        formation: TacticType.T_4231,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Al-Fayha": {
        formation: TacticType.T_4231,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'Deep',
        passingStyle: 'LongBall',
        marking: 'ManToMan'
    },
    "Al-Hazem": {
        formation: TacticType.T_4231,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Al-Khaleej": {
        formation: TacticType.T_433,
        style: 'WingPlay',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Al-Kholood": {
        formation: TacticType.T_4231,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Slow',
        width: 'Narrow',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Al-Najma": {
        formation: TacticType.T_442,
        style: 'ParkTheBus',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Deep',
        passingStyle: 'LongBall',
        marking: 'ManToMan'
    },
    "Al-Okhdood": {
        formation: TacticType.T_4231,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Balanced',
        defensiveLine: 'Deep',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Al-Qadsiah": {
        formation: TacticType.T_433,
        style: 'HighPress',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'High',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Al-Riyadh": {
        formation: TacticType.T_4231,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Al-Taawoun": {
        formation: TacticType.T_4231,
        style: 'WingPlay',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Alajuelense": {
        formation: TacticType.T_433,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Alanya Sun": {
        formation: TacticType.T_4231,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Deep',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Algiers Reds": {
        formation: TacticType.T_4141,
        style: 'ParkTheBus',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Narrow',
        defensiveLine: 'Deep',
        passingStyle: 'LongBall',
        marking: 'ManToMan'
    },
    "Algiers Union": {
        formation: TacticType.T_4231,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "AmaZulu FC": {
        formation: TacticType.T_442,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Angers Black-Whites": {
        formation: TacticType.T_4231,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "London Cannons": {
        formation: TacticType.T_433,
        style: 'HighPress',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'High',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "AS FAR": {
        formation: TacticType.T_4141,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Birmingham Villans": {
        formation: TacticType.T_4231,
        style: 'HighPress',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Balanced',
        defensiveLine: 'High',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Bergamo United": {
        formation: TacticType.T_343,
        style: 'HighPress',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'High',
        passingStyle: 'Direct',
        marking: 'ManToMan'
    },
    "Atlanta Stripes": {
        formation: TacticType.T_4231,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Atlántico Blue Stars": {
        formation: TacticType.T_532,
        style: 'ParkTheBus',
        aggression: 'Normal',
        tempo: 'Slow',
        width: 'Narrow',
        defensiveLine: 'Deep',
        passingStyle: 'LongBall',
        marking: 'ManToMan'
    },
    "Auckland FC": {
        formation: TacticType.T_4231,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Augsburg Falcons": {
        formation: TacticType.T_442,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Balanced',
        defensiveLine: 'Deep',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Austin Verdes": {
        formation: TacticType.T_4231,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "AJ Burgundy": {
        formation: TacticType.T_4231,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Avellaneda Devils": {
        formation: TacticType.T_4141,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Narrow',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'ManToMan'
    },
    "Avellaneda Racers": {
        formation: TacticType.T_433,
        style: 'HighPress',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'High',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Avispa Fukuoka": {
        formation: TacticType.T_442,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Narrow',
        defensiveLine: 'Deep',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },

    "Apex Predators": {
        formation: TacticType.T_433,
        style: 'HighPress',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'High',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Omega Strikers": {
        formation: TacticType.T_442,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Istanbul Yellows": {
        formation: TacticType.T_4231,
        style: 'HighPress',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'High',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Galata Lions": {
        formation: TacticType.T_433,
        style: 'HighPress',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'High',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Istanbul Eagles": {
        formation: TacticType.T_4231,
        style: 'HighPress',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Trabzon Storm": {
        formation: TacticType.T_4231,
        style: 'WingPlay',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Basak City": {
        formation: TacticType.T_442,
        style: 'WingPlay',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Konya Green": {
        formation: TacticType.T_4231,
        style: 'WingPlay',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Wide',
        defensiveLine: 'Deep',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Rize Tea": {
        formation: TacticType.T_433,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Samsun Red": {
        formation: TacticType.T_4231,
        style: 'HighPress',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Antep Falcons": {
        formation: TacticType.T_4231,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Deep',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Eyup Violet": {
        formation: TacticType.T_4231,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Ankara Youth": {
        formation: TacticType.T_442,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Izmir Goz": {
        formation: TacticType.T_4231,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Karagumruk Black": {
        formation: TacticType.T_4231,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Kasimpasa Navy": {
        formation: TacticType.T_4231,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Kayseri Stars": {
        formation: TacticType.T_4231,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Wide',
        defensiveLine: 'Deep',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Kocaeli Gulf": {
        formation: TacticType.T_4231,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Wide',
        defensiveLine: 'Deep',
        passingStyle: 'LongBall',
        marking: 'Zonal'
    },
    // Global Giants Tactics
    "Manchester Skyblues": {
        formation: TacticType.T_433,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Wide',
        defensiveLine: 'High',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Merseyside Reds": {
        formation: TacticType.T_433,
        style: 'HighPress',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'High',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Madrid Blancos": {
        formation: TacticType.T_433,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Catalonia Blau": {
        formation: TacticType.T_433,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Slow',
        width: 'Wide',
        defensiveLine: 'High',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    // Italy Giants
    "Inter Lombardia": {
        formation: TacticType.T_352,
        style: 'HighPress',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'High',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Milano Devils": {
        formation: TacticType.T_4231,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Piemonte Zebras": {
        formation: TacticType.T_4231,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Slow',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Napoli Blues": {
        formation: TacticType.T_433,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'High',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    // Germany Giants
    "Munich Red": {
        formation: TacticType.T_4231,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'High',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    // France Giants
    "Paris Red-Blue": {
        formation: TacticType.T_433,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Wide',
        defensiveLine: 'High',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },

    // Alphabetically Added Teams (A-D)
    "Daejeon Hana Citizen": {
        formation: TacticType.T_4231,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Dallas Burn": {
        formation: TacticType.T_4231,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'High',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Damac FC": {
        formation: TacticType.T_4231,
        style: 'WingPlay',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Dammam Commandos": {
        formation: TacticType.T_433,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Dar Citizens": {
        formation: TacticType.T_4231,
        style: 'HighPress',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Balanced',
        defensiveLine: 'High',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Dar Lions": {
        formation: TacticType.T_4231,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Desert Miners": {
        formation: TacticType.T_442,
        style: 'ParkTheBus',
        aggression: 'Normal',
        tempo: 'Slow',
        width: 'Narrow',
        defensiveLine: 'Deep',
        passingStyle: 'LongBall',
        marking: 'Zonal'
    },
    "Difaâ El Jadidi": {
        formation: TacticType.T_4141,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Doha Sadd": {
        formation: TacticType.T_433,
        style: 'WingPlay',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'High',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Westphalia Yellows": {
        formation: TacticType.T_4231,
        style: 'HighPress',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Balanced',
        defensiveLine: 'High',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Banfield Drills": {
        formation: TacticType.T_442,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Deep',
        passingStyle: 'LongBall',
        marking: 'Zonal'
    },
    "Bank El Ahly": {
        formation: TacticType.T_4231,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Barbados Royal Club": {
        formation: TacticType.T_433,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Balanced',
        defensiveLine: 'Deep',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Barracas Truckers": {
        formation: TacticType.T_442,
        style: 'ParkTheBus',
        aggression: 'Normal',
        tempo: 'Slow',
        width: 'Narrow',
        defensiveLine: 'Deep',
        passingStyle: 'LongBall',
        marking: 'ManToMan'
    },
    "Barranquilla Sharks": {
        formation: TacticType.T_433,
        style: 'WingPlay',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Bucaramanga Leopards": {
        formation: TacticType.T_532,
        style: 'ParkTheBus',
        aggression: 'Normal',
        tempo: 'Slow',
        width: 'Narrow',
        defensiveLine: 'Deep',
        passingStyle: 'LongBall',
        marking: 'Zonal'
    },
    "Bucheon FC 1995": {
        formation: TacticType.T_442,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Bologna Redblues": {
        formation: TacticType.T_4231,
        style: 'HighPress',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Balanced',
        defensiveLine: 'High',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "London Blue Lions": {
        formation: TacticType.T_433,
        style: 'HighPress',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Balanced',
        defensiveLine: 'High',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Chicago Firemen": {
        formation: TacticType.T_4231,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Chillan Red": {
        formation: TacticType.T_433,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Cibao Orange FC": {
        formation: TacticType.T_433,
        style: 'WingPlay',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Cincinnati Royals": {
        formation: TacticType.T_4231,
        style: 'HighPress',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Balanced',
        defensiveLine: 'High',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Citadel Saints": {
        formation: TacticType.T_442,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Narrow',
        defensiveLine: 'Balanced',
        passingStyle: 'LongBall',
        marking: 'Zonal'
    },
    "City of Melbourne": {
        formation: TacticType.T_433,
        style: 'HighPress',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Balanced',
        defensiveLine: 'High',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Cleopatra FC": {
        formation: TacticType.T_442,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Club Africain": {
        formation: TacticType.T_4231,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "COD Meknès": {
        formation: TacticType.T_442,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Columbus Crew": {
        formation: TacticType.T_343,
        style: 'HighPress',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'High',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Como Lakers": {
        formation: TacticType.T_4231,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Slow',
        width: 'Narrow',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Concepción Purple": {
        formation: TacticType.T_442,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Deep',
        passingStyle: 'LongBall',
        marking: 'Zonal'
    },
    "Concepción Uni": {
        formation: TacticType.T_4231,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Balanced',
        defensiveLine: 'Deep',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Coquimbo Pirates": {
        formation: TacticType.T_442,
        style: 'ParkTheBus',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Deep',
        passingStyle: 'LongBall',
        marking: 'ManToMan'
    },
    "Cordoba Glory": {
        formation: TacticType.T_4231,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Cordoba Pirates": {
        formation: TacticType.T_442,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Deep',
        passingStyle: 'LongBall',
        marking: 'ManToMan'
    },
    "Cordoba Tall": {
        formation: TacticType.T_4231,
        style: 'HighPress',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'High',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Crystal Glaziers": {
        formation: TacticType.T_343,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Cucuta Border": {
        formation: TacticType.T_442,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Deep',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Curitiba Greens": {
        formation: TacticType.T_442,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Curitiba Storm": {
        formation: TacticType.T_433,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "San Jose Purple": {
        formation: TacticType.T_4231,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Deep',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Alajuela Lions": {
        formation: TacticType.T_433,
        style: 'WingPlay',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Heredia Red-Yellow": {
        formation: TacticType.T_4141,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Cartago Blues": {
        formation: TacticType.T_442,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "San Carlos Bulls": {
        formation: TacticType.T_442,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Narrow',
        defensiveLine: 'Balanced',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "San Isidro Warriors": {
        formation: TacticType.T_4231,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Balanced',
        defensiveLine: 'Deep',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Puntarenas Sharks": {
        formation: TacticType.T_442,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Wide',
        defensiveLine: 'Deep',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Sporting Jose": {
        formation: TacticType.T_4231,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Leverkusen Red": {
        formation: TacticType.T_343,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Wide',
        defensiveLine: 'High',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Liberia Gold": {
        formation: TacticType.T_4231,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Guadalupe Blue": {
        formation: TacticType.T_4231,
        style: 'ParkTheBus',
        aggression: 'Normal',
        tempo: 'Slow',
        width: 'Narrow',
        defensiveLine: 'Deep',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Central Coast Mariners": {
        formation: TacticType.T_433,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'High',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Cerezo Osaka": {
        formation: TacticType.T_4231,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Slow',
        width: 'Narrow',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Challengers United": {
        formation: TacticType.T_442,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Deep',
        passingStyle: 'LongBall',
        marking: 'Zonal'
    },
    "Chapecó Eagles": {
        formation: TacticType.T_4231,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Charlotte Crowns": {
        formation: TacticType.T_433,
        style: 'HighPress',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Balanced',
        defensiveLine: 'High',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Atlantico Blue Stars": {
        formation: TacticType.T_442,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Augsburg FC": {
        formation: TacticType.T_4231,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Deep',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Belém Lions": {
        formation: TacticType.T_442,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Deep',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Belo Horizonte Cruisers": {
        formation: TacticType.T_4231,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Slow',
        width: 'Narrow',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Belo Horizonte Miners": {
        formation: TacticType.T_4231,
        style: 'WingPlay',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Belvedere Blue": {
        formation: TacticType.T_433,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Bilbao Lions": {
        formation: TacticType.T_433,
        style: 'HighPress',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'High',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Bizerte Sharks": {
        formation: TacticType.T_442,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Balanced',
        defensiveLine: 'Deep',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Bochum Blue": {
        formation: TacticType.T_4231,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Deep',
        passingStyle: 'LongBall',
        marking: 'Zonal'
    },
    "Boedo Saints": {
        formation: TacticType.T_4231,
        style: 'ParkTheBus',
        aggression: 'Normal',
        tempo: 'Slow',
        width: 'Narrow',
        defensiveLine: 'Deep',
        passingStyle: 'LongBall',
        marking: 'ManToMan'
    },
    "Bogotá Blues": {
        formation: TacticType.T_433,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Bogotá Cardinals": {
        formation: TacticType.T_433,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Bogotá Fort": {
        formation: TacticType.T_532,
        style: 'ParkTheBus',
        aggression: 'Normal',
        tempo: 'Slow',
        width: 'Narrow',
        defensiveLine: 'Deep',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Bragança Bulls": {
        formation: TacticType.T_4231,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Bremen River": {
        formation: TacticType.T_4231,
        style: 'HighPress',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Balanced',
        defensiveLine: 'High',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Brest Pirates": {
        formation: TacticType.T_442,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Narrow',
        defensiveLine: 'Balanced',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Brighton Seagulls": {
        formation: TacticType.T_4231,
        style: 'HighPress',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Balanced',
        defensiveLine: 'High',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Brisbane Roar": {
        formation: TacticType.T_4231,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Buenos Aires Millionaires": {
        formation: TacticType.T_433,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Buenos Aires Storm": {
        formation: TacticType.T_4231,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Buriram Thunder": {
        formation: TacticType.T_433,
        style: 'WingPlay',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Cagliari Islanders": {
        formation: TacticType.T_442,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'Deep',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Cairo Knights": {
        formation: TacticType.T_4231,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Cairo Red Devils": {
        formation: TacticType.T_433,
        style: 'HighPress',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'High',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Calera Red": {
        formation: TacticType.T_532,
        style: 'ParkTheBus',
        aggression: 'Normal',
        tempo: 'Slow',
        width: 'Narrow',
        defensiveLine: 'Deep',
        passingStyle: 'LongBall',
        marking: 'Zonal'
    },
    "Cali Devils": {
        formation: TacticType.T_4231,
        style: 'WingPlay',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Cali Sugar": {
        formation: TacticType.T_4141,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Canary Yellows": {
        formation: TacticType.T_4231,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Slow',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Cape Town City": {
        formation: TacticType.T_433,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Casablanca Eagles": {
        formation: TacticType.T_4231,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Casablanca Reds": {
        formation: TacticType.T_433,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Castilla Violet": {
        formation: TacticType.T_4231,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Cavalier Town FC": {
        formation: TacticType.T_433,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Cavaly SC": {
        formation: TacticType.T_442,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Antalya Scorpions": {
        formation: TacticType.T_433,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "El Gouna": {
        formation: TacticType.T_4231,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "El Masry": {
        formation: TacticType.T_433,
        style: 'WingPlay',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "El Mokawloon": {
        formation: TacticType.T_442,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Deep',
        passingStyle: 'LongBall',
        marking: 'ManToMan'
    },
    "Enppi": {
        formation: TacticType.T_4231,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Espanyol Parrots": {
        formation: TacticType.T_442,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Deep',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Fagiano Okayama": {
        formation: TacticType.T_442,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Narrow',
        defensiveLine: 'Deep',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "FC Anyang": {
        formation: TacticType.T_442,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "FC Tokyo": {
        formation: TacticType.T_4231,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Florence Viola": {
        formation: TacticType.T_4231,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Frankfurt Eagles": {
        formation: TacticType.T_4231,
        style: 'HighPress',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Balanced',
        defensiveLine: 'High',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Freiburg Forest": {
        formation: TacticType.T_442,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Deep',
        passingStyle: 'LongBall',
        marking: 'Zonal'
    },
    "FUS Rabat": {
        formation: TacticType.T_4141,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Galaxy Stars": {
        formation: TacticType.T_4231,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Slow',
        width: 'Balanced',
        defensiveLine: 'High',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Gamba Osaka": {
        formation: TacticType.T_4231,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Gangwon FC": {
        formation: TacticType.T_433,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Gauchos Gold": {
        formation: TacticType.T_442,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Genoa Griffins": {
        formation: TacticType.T_352,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'ManToMan'
    },
    "Ghazl El Mahalla": {
        formation: TacticType.T_442,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Gimcheon Sangmu": {
        formation: TacticType.T_433,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Girona Reds": {
        formation: TacticType.T_433,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Slow',
        width: 'Wide',
        defensiveLine: 'High',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Giza Pyramids": {
        formation: TacticType.T_4231,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Slow',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Gladbach Foals": {
        formation: TacticType.T_4231,
        style: 'WingPlay',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Golden Arrows": {
        formation: TacticType.T_442,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Guadalajara Foxes": {
        formation: TacticType.T_433,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Guadalajara Goats": {
        formation: TacticType.T_4231,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'High',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Guyana Amazon FC": {
        formation: TacticType.T_433,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Balanced',
        defensiveLine: 'Deep',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Gwangju FC": {
        formation: TacticType.T_442,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Lancashire Clarets": {
        formation: TacticType.T_442,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Merseyside Blues": {
        formation: TacticType.T_442,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Deep',
        passingStyle: 'LongBall',
        marking: 'ManToMan'
    },
    "South Madrid Blues": {
        formation: TacticType.T_442,
        style: 'ParkTheBus',
        aggression: 'Normal',
        tempo: 'Slow',
        width: 'Narrow',
        defensiveLine: 'Deep',
        passingStyle: 'LongBall',
        marking: 'ManToMan'
    },
    "West London Whites": {
        formation: TacticType.T_4231,
        style: 'WingPlay',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },

    // Alphabetically Added Teams (I-K)
    "Ibague Gold": {
        formation: TacticType.T_4231,
        style: 'WingPlay',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Incheon United": {
        formation: TacticType.T_442,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Balanced',
        defensiveLine: 'Deep',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },

    "Ismaily SC": {
        formation: TacticType.T_4231,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Ittihad Alexandria": {
        formation: TacticType.T_4231,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'Deep',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Jardines Striped": {
        formation: TacticType.T_433,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Jeddah Green": {
        formation: TacticType.T_433,
        style: 'WingPlay',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'High',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Jeddah Tigers": {
        formation: TacticType.T_4231,
        style: 'HighPress',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'High',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "JEF United Chiba": {
        formation: TacticType.T_442,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Narrow',
        defensiveLine: 'Deep',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Jeju SK": {
        formation: TacticType.T_4231,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Jeonju Motors": {
        formation: TacticType.T_4231,
        style: 'HighPress',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'High',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Juarez Braves": {
        formation: TacticType.T_433,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'Deep',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Junin Warriors": {
        formation: TacticType.T_442,
        style: 'ParkTheBus',
        aggression: 'Normal',
        tempo: 'Slow',
        width: 'Narrow',
        defensiveLine: 'Deep',
        passingStyle: 'LongBall',
        marking: 'ManToMan'
    },

    "Kahraba Ismailia": {
        formation: TacticType.T_442,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Deep',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Kansas City Wizards": {
        formation: TacticType.T_433,
        style: 'HighPress',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'High',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },

    "Kashima Antlers": {
        formation: TacticType.T_4231,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Kashiwa Reysol": {
        formation: TacticType.T_4231,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },

    // Additional Teams (K-L)
    "Kawasaki Front": {
        formation: TacticType.T_4231,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Slow',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Kingston Bay United": {
        formation: TacticType.T_433,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'Deep',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Kobe Crimsons": {
        formation: TacticType.T_433,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Cathedral City": {
        formation: TacticType.T_4231,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Kyoto Sanga": {
        formation: TacticType.T_4231,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "La Boca Xeneizes": {
        formation: TacticType.T_442,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Slow',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'ManToMan'
    },
    "La Plata Lions": {
        formation: TacticType.T_4231,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "La Plata Wolves": {
        formation: TacticType.T_442,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Laguna Warriors": {
        formation: TacticType.T_4231,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Lanus Granate": {
        formation: TacticType.T_4231,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Deep',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Latium Eagles": {
        formation: TacticType.T_433,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Lecce Wolves": {
        formation: TacticType.T_433,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Yorkshire Whites": {
        formation: TacticType.T_4231,
        style: 'HighPress',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Balanced',
        defensiveLine: 'High',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Leipzig Bulls": {
        formation: TacticType.T_4231,
        style: 'HighPress',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'High',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Lens Gold": {
        formation: TacticType.T_4231,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Leon Emeralds": {
        formation: TacticType.T_4231,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Kolkata Mariners": {
        formation: TacticType.T_4231,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Mumbai Islanders": {
        formation: TacticType.T_433,
        style: 'WingPlay',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "East Bengal Torch": {
        formation: TacticType.T_4231,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Kerala Tuskers": {
        formation: TacticType.T_433,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Goa Gaurs": {
        formation: TacticType.T_4231,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Bangalore Blues": {
        formation: TacticType.T_433,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Odisha Juggernauts": {
        formation: TacticType.T_433,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Chennai Titans": {
        formation: TacticType.T_4231,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Highland United": {
        formation: TacticType.T_4231,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Steel City Red": {
        formation: TacticType.T_4231,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Punjab Lions": {
        formation: TacticType.T_442,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Narrow',
        defensiveLine: 'Deep',
        passingStyle: 'LongBall',
        marking: 'Zonal'
    },
    "Kolkata Black-White": {
        formation: TacticType.T_442,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Delhi Capital": {
        formation: TacticType.T_433,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Varanasi Holy": {
        formation: TacticType.T_442,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Harras El Hodoud": {
        formation: TacticType.T_442,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Balanced',
        defensiveLine: 'Deep',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Hassania Agadir": {
        formation: TacticType.T_4141,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Heidenheim Red-Blue": {
        formation: TacticType.T_4231,
        style: 'WingPlay',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'LongBall',
        marking: 'Zonal'
    },
    "Hiroshima Archers": {
        formation: TacticType.T_343,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Hoffenheim FC": {
        formation: TacticType.T_4231,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Houston Space": {
        formation: TacticType.T_433,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Slow',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Lille Dogs": {
        formation: TacticType.T_4231,
        style: 'HighPress',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Balanced',
        defensiveLine: 'High',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Limache Red": {
        formation: TacticType.T_442,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Deep',
        passingStyle: 'LongBall',
        marking: 'Zonal'
    },
    "Los Angeles Gold": {
        formation: TacticType.T_433,
        style: 'HighPress',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'High',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Lubumbashi Ravens": {
        formation: TacticType.T_4231,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },

    // Additional Teams (Y-Z)
    "Yellow Submarines": {
        formation: TacticType.T_442,
        style: 'Balanced',
        aggression: 'Safe',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Yokohama Mariners": {
        formation: TacticType.T_433,
        style: 'HighPress',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'High',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Zed FC": {
        formation: TacticType.T_4231,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },

    // Additional Teams (V-W)
    "WS Wanderers": {
        formation: TacticType.T_4231,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "West Midlands Wolves": {
        formation: TacticType.T_343,
        style: 'HighPress',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'High',
        passingStyle: 'Mixed',
        marking: 'ManToMan'
    },
    "Wolfsburg Green": {
        formation: TacticType.T_442,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Weymouth Wales FC": {
        formation: TacticType.T_442,
        style: 'ParkTheBus',
        aggression: 'Normal',
        tempo: 'Slow',
        width: 'Narrow',
        defensiveLine: 'Deep',
        passingStyle: 'LongBall',
        marking: 'ManToMan'
    },
    "East London Hammers": {
        formation: TacticType.T_4231,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'Deep',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Western United": {
        formation: TacticType.T_4231,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Western Tigers SC": {
        formation: TacticType.T_532,
        style: 'ParkTheBus',
        aggression: 'Normal',
        tempo: 'Slow',
        width: 'Narrow',
        defensiveLine: 'Deep',
        passingStyle: 'LongBall',
        marking: 'ManToMan'
    },
    "Wellington Phoenix": {
        formation: TacticType.T_442,
        style: 'WingPlay',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Wadi Degla": {
        formation: TacticType.T_433,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "V-Varen Nagasaki": {
        formation: TacticType.T_4231,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'Deep',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Vitoria Foxes": {
        formation: TacticType.T_4231,
        style: 'ParkTheBus',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Narrow',
        defensiveLine: 'Deep',
        passingStyle: 'LongBall',
        marking: 'ManToMan'
    },
    "Viña Gold": {
        formation: TacticType.T_433,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Villa Albiceleste": {
        formation: TacticType.T_442,
        style: 'ParkTheBus',
        aggression: 'Normal',
        tempo: 'Slow',
        width: 'Narrow',
        defensiveLine: 'Deep',
        passingStyle: 'LongBall',
        marking: 'ManToMan'
    },
    "Vigo Sky Blues": {
        formation: TacticType.T_442,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Victoria Tigers": {
        formation: TacticType.T_4231,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Verona Mastiffs": {
        formation: TacticType.T_343,
        style: 'HighPress',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'High',
        passingStyle: 'LongBall',
        marking: 'ManToMan'
    },
    "Venice Gondoliers": {
        formation: TacticType.T_352,
        style: 'WingPlay',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Velez Fort": {
        formation: TacticType.T_4231,
        style: 'HighPress',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Balanced',
        defensiveLine: 'High',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Varela Hawks": {
        formation: TacticType.T_433,
        style: 'HighPress',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'High',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Vancouver Village": {
        formation: TacticType.T_343,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Vallecano Lightning": {
        formation: TacticType.T_4231,
        style: 'HighPress',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'High',
        passingStyle: 'Direct',
        marking: 'ManToMan'
    },
    "Valencia Bats": {
        formation: TacticType.T_442,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Narrow',
        defensiveLine: 'Deep',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },

    // Additional Teams (T-U)
    "Bardo Green": {
        formation: TacticType.T_4231,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Deep',
        passingStyle: 'LongBall',
        marking: 'Zonal'
    },
    "Beja Storks": {
        formation: TacticType.T_451,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'Deep',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Ben Guerdane Riders": {
        formation: TacticType.T_442,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'ManToMan'
    },
    "Berlin Iron": {
        formation: TacticType.T_532,
        style: 'ParkTheBus',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Narrow',
        defensiveLine: 'Deep',
        passingStyle: 'LongBall',
        marking: 'ManToMan'
    },
    "Esperance Tunis": {
        formation: TacticType.T_433,
        style: 'HighPress',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'High',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Gabes Oasis": {
        formation: TacticType.T_4231,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Deep',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Kairouan Historic": {
        formation: TacticType.T_532,
        style: 'ParkTheBus',
        aggression: 'Normal',
        tempo: 'Slow',
        width: 'Narrow',
        defensiveLine: 'Deep',
        passingStyle: 'LongBall',
        marking: 'ManToMan'
    },
    "Marsa Beach": {
        formation: TacticType.T_4231,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'Deep',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Metlaoui Mines": {
        formation: TacticType.T_532,
        style: 'ParkTheBus',
        aggression: 'Normal',
        tempo: 'Slow',
        width: 'Narrow',
        defensiveLine: 'Deep',
        passingStyle: 'LongBall',
        marking: 'Zonal'
    },
    "Monastir Blue": {
        formation: TacticType.T_433,
        style: 'HighPress',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'High',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "North London Whites": {
        formation: TacticType.T_433,
        style: 'HighPress',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'High',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Omrane Build": {
        formation: TacticType.T_451,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'Deep',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Sfax Zebra": {
        formation: TacticType.T_442,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Soliman Future": {
        formation: TacticType.T_442,
        style: 'ParkTheBus',
        aggression: 'Normal',
        tempo: 'Slow',
        width: 'Narrow',
        defensiveLine: 'Deep',
        passingStyle: 'LongBall',
        marking: 'ManToMan'
    },
    "Sousse Stars": {
        formation: TacticType.T_4231,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Balanced',
        defensiveLine: 'Deep',
        passingStyle: 'Direct',
        marking: 'ManToMan'
    },
    "TS Galaxy": {
        formation: TacticType.T_4231,
        style: 'WingPlay',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Toronto Reds": {
        formation: TacticType.T_433,
        style: 'WingPlay',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Toulouse Violets": {
        formation: TacticType.T_343,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Trinbago Riders FC": {
        formation: TacticType.T_4231,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Balanced',
        defensiveLine: 'Deep',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Tucuman Giants": {
        formation: TacticType.T_442,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'Deep',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Tunis Gold": {
        formation: TacticType.T_433,
        style: 'HighPress',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'High',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Tunis Red-Whites": {
        formation: TacticType.T_433,
        style: 'WingPlay',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Tunja Checkers": {
        formation: TacticType.T_442,
        style: 'ParkTheBus',
        aggression: 'Normal',
        tempo: 'Slow',
        width: 'Narrow',
        defensiveLine: 'Deep',
        passingStyle: 'LongBall',
        marking: 'Zonal'
    },
    "Udine Friuli": {
        formation: TacticType.T_352,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'Deep',
        passingStyle: 'Direct',
        marking: 'ManToMan'
    },
    "Ulsan Tigers": {
        formation: TacticType.T_4231,
        style: 'WingPlay',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'High',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Union Touarga": {
        formation: TacticType.T_433,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Urawa Reds": {
        formation: TacticType.T_4231,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Zarzis Olive": {
        formation: TacticType.T_442,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Tokyo Verdy": {
        formation: TacticType.T_442,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Deep',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Toluca Devils": {
        formation: TacticType.T_4231,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Torino Bulls": {
        formation: TacticType.T_352,
        style: 'HighPress',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'ManToMan'
    },
    "SuperSport United": {
        formation: TacticType.T_433,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Sydney Sky Blues": {
        formation: TacticType.T_4231,
        style: 'WingPlay',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Tala'ea El Gaish": {
        formation: TacticType.T_4231,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'Deep',
        passingStyle: 'LongBall',
        marking: 'Zonal'
    },
    "Talcahuano Steel": {
        formation: TacticType.T_442,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Direct',
        marking: 'ManToMan'
    },
    "Tehran Reds": {
        formation: TacticType.T_4231,
        style: 'HighPress',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Balanced',
        defensiveLine: 'High',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Tijuana Dogs": {
        formation: TacticType.T_4231,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Lyon Kids": {
        formation: TacticType.T_433,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },

    // Additional Teams (S-Range)
    "Wearside Black Cats": {
        formation: TacticType.T_343,
        style: 'HighPress',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Wide',
        defensiveLine: 'High',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Stuttgart White-Reds": {
        formation: TacticType.T_4231,
        style: 'HighPress',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'High',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Alsace Blue": {
        formation: TacticType.T_532,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Balanced',
        defensiveLine: 'Deep',
        passingStyle: 'Direct',
        marking: 'ManToMan'
    },
    "Hamburg Pirates": {
        formation: TacticType.T_343,
        style: 'HighPress',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'High',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Stellenbosch FC": {
        formation: TacticType.T_433,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "St. Lucia Kings FC": {
        formation: TacticType.T_442,
        style: 'ParkTheBus',
        aggression: 'Normal',
        tempo: 'Slow',
        width: 'Narrow',
        defensiveLine: 'Deep',
        passingStyle: 'LongBall',
        marking: 'ManToMan'
    },
    "St. Louis Spirit": {
        formation: TacticType.T_442,
        style: 'HighPress',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Balanced',
        defensiveLine: 'High',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Soweto Chiefs": {
        formation: TacticType.T_4231,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Smouha": {
        formation: TacticType.T_4231,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Balanced',
        defensiveLine: 'Deep',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Shimizu S-Pulse": {
        formation: TacticType.T_4231,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Shanghai Port": {
        formation: TacticType.T_4231,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Seville GreenWhites": {
        formation: TacticType.T_4231,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Nervion Red-Whites": {
        formation: TacticType.T_442,
        style: 'WingPlay',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Serena Garnet": {
        formation: TacticType.T_442,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Balanced',
        defensiveLine: 'Deep',
        passingStyle: 'LongBall',
        marking: 'ManToMan'
    },
    "Seoul City": {
        formation: TacticType.T_433,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Sekhukhune United": {
        formation: TacticType.T_451,
        style: 'ParkTheBus',
        aggression: 'Normal',
        tempo: 'Slow',
        width: 'Narrow',
        defensiveLine: 'Deep',
        passingStyle: 'LongBall',
        marking: 'ManToMan'
    },
    "Seattle Emeralds": {
        formation: TacticType.T_4231,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Sayago Green": {
        formation: TacticType.T_442,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Narrow',
        defensiveLine: 'Deep',
        passingStyle: 'Direct',
        marking: 'ManToMan'
    },
    "Sassuolo Greenblacks": {
        formation: TacticType.T_433,
        style: 'WingPlay',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Saprissa": {
        formation: TacticType.T_343,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Wide',
        defensiveLine: 'High',
        passingStyle: 'Direct',
        marking: 'ManToMan'
    },
    "São Paulo Warriors": {
        formation: TacticType.T_433,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "São Paulo Tigers": {
        formation: TacticType.T_4231,
        style: 'WingPlay',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "São Paulo Palms": {
        formation: TacticType.T_4231,
        style: 'HighPress',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Balanced',
        defensiveLine: 'High',
        passingStyle: 'Direct',
        marking: 'Zonal'
    }
    ,

    // Additional Teams (S-T Batch + God Mode)
    "Santos Beach": {
        formation: TacticType.T_4231,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Santiago Chiefs": {
        formation: TacticType.T_433,
        style: 'HighPress',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'High',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Santiago Crusaders": {
        formation: TacticType.T_4231,
        style: 'WingPlay',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Santiago Scholars": {
        formation: TacticType.T_433,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Santiago Green": {
        formation: TacticType.T_442,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Balanced',
        defensiveLine: 'Deep',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Santiago Tricolor": {
        formation: TacticType.T_442,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Santiago Railways": {
        formation: TacticType.T_532,
        style: 'ParkTheBus',
        aggression: 'Normal',
        tempo: 'Slow',
        width: 'Narrow',
        defensiveLine: 'Deep',
        passingStyle: 'LongBall',
        marking: 'ManToMan'
    }
    ,

    // Additional Teams (R-S Batch)
    "Santa Fe Union": {
        formation: TacticType.T_532,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'Deep',
        passingStyle: 'Direct',
        marking: 'ManToMan'
    },
    "Sanfrecce Hiroshima": {
        formation: TacticType.T_343,
        style: 'HighPress',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Wide',
        defensiveLine: 'High',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "San Sebastian Blue": {
        formation: TacticType.T_433,
        style: 'HighPress',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Wide',
        defensiveLine: 'High',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "San Luis Athletics": {
        formation: TacticType.T_4231,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "San Juan Strikers": {
        formation: TacticType.T_442,
        style: 'ParkTheBus',
        aggression: 'Normal',
        tempo: 'Slow',
        width: 'Narrow',
        defensiveLine: 'Deep',
        passingStyle: 'LongBall',
        marking: 'ManToMan'
    },
    "San Jose Quakes": {
        formation: TacticType.T_4231,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Saint-Green": {
        formation: TacticType.T_433,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Saavedra Squids": {
        formation: TacticType.T_442,
        style: 'ParkTheBus',
        aggression: 'Normal',
        tempo: 'Slow',
        width: 'Narrow',
        defensiveLine: 'Deep',
        passingStyle: 'LongBall',
        marking: 'ManToMan'
    },
    "Salvador Victory": {
        formation: TacticType.T_433,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'Deep',
        passingStyle: 'Direct',
        marking: 'ManToMan'
    },
    "Salvador Bay": {
        formation: TacticType.T_433,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Salt Lake Royals": {
        formation: TacticType.T_4231,
        style: 'WingPlay',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Rosario Lepers": {
        formation: TacticType.T_4231,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Slow',
        width: 'Narrow',
        defensiveLine: 'Deep',
        passingStyle: 'Short',
        marking: 'ManToMan'
    },
    "Rosario Canallas": {
        formation: TacticType.T_4231,
        style: 'WingPlay',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Roma Gladiators": {
        formation: TacticType.T_343,
        style: 'HighPress',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'High',
        passingStyle: 'Direct',
        marking: 'ManToMan'
    }
    ,

    // Additional Teams (P-R Batch - Filtered)
    "Queretaro Roosters": {
        formation: TacticType.T_442,
        style: 'ParkTheBus',
        aggression: 'Normal',
        tempo: 'Slow',
        width: 'Narrow',
        defensiveLine: 'Deep',
        passingStyle: 'LongBall',
        marking: 'Zonal'
    },
    "Puebla Sashes": {
        formation: TacticType.T_532,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Deep',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Pretoria Brazilians": {
        formation: TacticType.T_433,
        style: 'HighPress',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Wide',
        defensiveLine: 'High',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Polokwane City": {
        formation: TacticType.T_442,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Direct',
        marking: 'ManToMan'
    },
    "Pohang Steelers": {
        formation: TacticType.T_4231,
        style: 'HighPress',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Philadelphia Union": {
        formation: TacticType.T_442,
        style: 'HighPress',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Narrow',
        defensiveLine: 'High',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Prado Bohemians": {
        formation: TacticType.T_4231,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Porto Alegre Reds": {
        formation: TacticType.T_4231,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Porto Alegre Blues": {
        formation: TacticType.T_4231,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Portland Timbers": {
        formation: TacticType.T_4231,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Port of Spain Warriors": {
        formation: TacticType.T_442,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Balanced',
        defensiveLine: 'Deep',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Port-au-Prince AC": {
        formation: TacticType.T_442,
        style: 'ParkTheBus',
        aggression: 'Normal',
        tempo: 'Slow',
        width: 'Narrow',
        defensiveLine: 'Deep',
        passingStyle: 'LongBall',
        marking: 'Zonal'
    },
    "Riyadh Youth": {
        formation: TacticType.T_4231,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Riyadh Knights": {
        formation: TacticType.T_4231,
        style: 'WingPlay',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'High',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Riyadh Blue Waves": {
        formation: TacticType.T_4231,
        style: 'HighPress',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'High',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Rionegro Eagles": {
        formation: TacticType.T_433,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Deep',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Rio Waves": {
        formation: TacticType.T_4231,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Slow',
        width: 'Narrow',
        defensiveLine: 'High',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Rio Star": {
        formation: TacticType.T_4231,
        style: 'HighPress',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'High',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Rio Sailors": {
        formation: TacticType.T_433,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Deep',
        passingStyle: 'LongBall',
        marking: 'ManToMan'
    },
    "Rio Flames": {
        formation: TacticType.T_4231,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Riestra Energizers": {
        formation: TacticType.T_532,
        style: 'ParkTheBus',
        aggression: 'Normal',
        tempo: 'Slow',
        width: 'Narrow',
        defensiveLine: 'Deep',
        passingStyle: 'LongBall',
        marking: 'ManToMan'
    },
    "Rancagua Celeste": {
        formation: TacticType.T_442,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Balanced',
        defensiveLine: 'Deep',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Brittany Red": {
        formation: TacticType.T_442,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    }
    ,

    // Additional Teams (O-Z Final Batch - Heavy Filter)
    "Orlando Lions": {
        formation: TacticType.T_4231,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Short',
        marking: 'Zonal'
    },
    "Orange Berkane": {
        formation: TacticType.T_433,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "O&M University": {
        formation: TacticType.T_541,
        style: 'ParkTheBus',
        aggression: 'Normal',
        tempo: 'Slow',
        width: 'Narrow',
        defensiveLine: 'Deep',
        passingStyle: 'LongBall',
        marking: 'ManToMan'
    },
    "Olympic Safi": {
        formation: TacticType.T_442,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Petrojet": {
        formation: TacticType.T_532,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Narrow',
        defensiveLine: 'Deep',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Perth Glory": {
        formation: TacticType.T_442,
        style: 'WingPlay',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Pereira Wolves": {
        formation: TacticType.T_352,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Balanced',
        defensiveLine: 'Deep',
        passingStyle: 'Direct',
        marking: 'ManToMan'
    },
    "Pedrenses Blue": {
        formation: TacticType.T_442,
        style: 'ParkTheBus',
        aggression: 'Normal',
        tempo: 'Slow',
        width: 'Narrow',
        defensiveLine: 'Deep',
        passingStyle: 'LongBall',
        marking: 'Zonal'
    },
    "Paternal Bugs": {
        formation: TacticType.T_343,
        style: 'HighPress',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'High',
        passingStyle: 'Mixed',
        marking: 'ManToMan'
    },
    "Pasto Volcano": {
        formation: TacticType.T_532,
        style: 'ParkTheBus',
        aggression: 'Normal',
        tempo: 'Slow',
        width: 'Narrow',
        defensiveLine: 'Deep',
        passingStyle: 'LongBall',
        marking: 'Zonal'
    },
    "Parque Violet": {
        formation: TacticType.T_433,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Short',
        marking: 'Zonal'
    },
    "Parma Crusaders": {
        formation: TacticType.T_4231,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Paris Blue": {
        formation: TacticType.T_4231,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Pamplona Bulls": {
        formation: TacticType.T_433,
        style: 'HighPress',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Wide',
        defensiveLine: 'High',
        passingStyle: 'Direct',
        marking: 'ManToMan'
    },
    "Palermo RedBlue": {
        formation: TacticType.T_442,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Deep',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Pachuca Gophers": {
        formation: TacticType.T_4231,
        style: 'HighPress',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'High',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Principality Red": {
        formation: TacticType.T_4231,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Pyramids FC": {
        formation: TacticType.T_4231,
        style: 'HighPress',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'High',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Reims Royals": {
        formation: TacticType.T_433,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Riviera Eagles": {
        formation: TacticType.T_4231,
        style: 'WingPlay',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Forest Archers": {
        formation: TacticType.T_4231,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'Deep',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "South Coast Cherries": {
        formation: TacticType.T_4231,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Soweto Pirates": {
        formation: TacticType.T_433,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Sydney FC": {
        formation: TacticType.T_4231,
        style: 'HighPress',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'High',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Tyneside Magpies": {
        formation: TacticType.T_433,
        style: 'HighPress',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'High',
        passingStyle: 'Direct',
        marking: 'ManToMan'
    },
    "Urawa Red Diamonds": {
        formation: TacticType.T_4231,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Vissel Kobe": {
        formation: TacticType.T_433,
        style: 'HighPress',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Wide',
        defensiveLine: 'High',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "West London Bees": {
        formation: TacticType.T_433,
        style: 'WingPlay',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Yokohama F. Marinos": {
        formation: TacticType.T_433,
        style: 'HighPress',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'High',
        passingStyle: 'Direct',
        marking: 'Zonal'
    }
    ,

    // Additional Teams (M-N Batch)
    "Modern Sport": {
        formation: TacticType.T_4231,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Mito HollyHock": {
        formation: TacticType.T_442,
        style: 'ParkTheBus',
        aggression: 'Normal',
        tempo: 'Slow',
        width: 'Narrow',
        defensiveLine: 'Deep',
        passingStyle: 'LongBall',
        marking: 'ManToMan'
    },
    "Mirassol Suns": {
        formation: TacticType.T_4231,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Miami Vice": {
        formation: TacticType.T_433,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Slow',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Short',
        marking: 'Zonal'
    },
    "Mexico Eagles": {
        formation: TacticType.T_4231,
        style: 'HighPress',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'High',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Mexico City Pumas": {
        formation: TacticType.T_442,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Monza Speed": {
        formation: TacticType.T_352,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'ManToMan'
    },
    "Montreal Impact": {
        formation: TacticType.T_343,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Montpellier Orange": {
        formation: TacticType.T_4231,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Montevideo Tricolor": {
        formation: TacticType.T_4231,
        style: 'HighPress',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Wide',
        defensiveLine: 'High',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Montevideo Tailors": {
        formation: TacticType.T_442,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Montevideo Pioneers": {
        formation: TacticType.T_442,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Narrow',
        defensiveLine: 'Deep',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Montevideo LightBlue": {
        formation: TacticType.T_433,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Short',
        marking: 'Zonal'
    },
    "Montevideo Coal": {
        formation: TacticType.T_4231,
        style: 'HighPress',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'High',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Monterrey Tigers": {
        formation: TacticType.T_4231,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Monterrey Rays": {
        formation: TacticType.T_4231,
        style: 'WingPlay',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'High',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Montego Bay Waves": {
        formation: TacticType.T_433,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Nagoya Grampus": {
        formation: TacticType.T_343,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Nantes Yellows": {
        formation: TacticType.T_532,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Narrow',
        defensiveLine: 'Deep',
        passingStyle: 'Direct',
        marking: 'ManToMan'
    },
    "Nashville Music": {
        formation: TacticType.T_4231,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'Deep',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Necaxa Lightning": {
        formation: TacticType.T_532,
        style: 'ParkTheBus',
        aggression: 'Normal',
        tempo: 'Slow',
        width: 'Narrow',
        defensiveLine: 'Deep',
        passingStyle: 'LongBall',
        marking: 'ManToMan'
    },
    "NEOM SC": {
        formation: TacticType.T_4231,
        style: 'WingPlay',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "New York City Blue": {
        formation: TacticType.T_433,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "New York Energy": {
        formation: TacticType.T_4231,
        style: 'HighPress',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Balanced',
        defensiveLine: 'High',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Newcastle Jets": {
        formation: TacticType.T_442,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Direct',
        marking: 'Zonal'
    }
    ,

    // FINAL 29 TEAMS - Completed!
    "Bogota Blues": {
        formation: TacticType.T_4231,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Bogota Cardinals": {
        formation: TacticType.T_442,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'Deep',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Bogota Fort": {
        formation: TacticType.T_532,
        style: 'ParkTheBus',
        aggression: 'Normal',
        tempo: 'Slow',
        width: 'Narrow',
        defensiveLine: 'Deep',
        passingStyle: 'LongBall',
        marking: 'ManToMan'
    },
    "Concepcion Purple": {
        formation: TacticType.T_433,
        style: 'HighPress',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'High',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Concepcion Uni": {
        formation: TacticType.T_4231,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Short',
        marking: 'Zonal'
    },
    "Hoffen Blue": {
        formation: TacticType.T_433,
        style: 'HighPress',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'High',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Mainz Carnival": {
        formation: TacticType.T_343,
        style: 'WingPlay',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Mallorca Islanders": {
        formation: TacticType.T_442,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'Deep',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Manchester Devils": {
        formation: TacticType.T_433,
        style: 'HighPress',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'High',
        passingStyle: 'Short',
        marking: 'Zonal'
    },
    "Marseille Blue": {
        formation: TacticType.T_433,
        style: 'WingPlay',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Madrid Indios": {
        formation: TacticType.T_4231,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Short',
        marking: 'Zonal'
    },
    "Ismaily": {
        formation: TacticType.T_442,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Balanced',
        defensiveLine: 'Deep',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Maghreb de Fès": {
        formation: TacticType.T_4231,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Jeju United": {
        formation: TacticType.T_4231,
        style: 'WingPlay',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Kawasaki Frontale": {
        formation: TacticType.T_433,
        style: 'HighPress',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'High',
        passingStyle: 'Short',
        marking: 'Zonal'
    },
    "Machida Zelvia": {
        formation: TacticType.T_442,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Balanced',
        defensiveLine: 'Deep',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Macarthur FC": {
        formation: TacticType.T_4231,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Melbourne City": {
        formation: TacticType.T_433,
        style: 'WingPlay',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Short',
        marking: 'Zonal'
    },
    "Melbourne Victory": {
        formation: TacticType.T_4231,
        style: 'HighPress',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'High',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Manizales White": {
        formation: TacticType.T_532,
        style: 'ParkTheBus',
        aggression: 'Normal',
        tempo: 'Slow',
        width: 'Narrow',
        defensiveLine: 'Deep',
        passingStyle: 'LongBall',
        marking: 'ManToMan'
    },
    "Mar del Plata Sharks": {
        formation: TacticType.T_442,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'Deep',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Medellin Green": {
        formation: TacticType.T_4231,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Medellin Red": {
        formation: TacticType.T_433,
        style: 'HighPress',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'High',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Melo Blue": {
        formation: TacticType.T_442,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Mendoza Blues": {
        formation: TacticType.T_442,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'Deep',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Mendoza Wines": {
        formation: TacticType.T_4231,
        style: 'Balanced',
        aggression: 'Normal',
        tempo: 'Normal',
        width: 'Balanced',
        defensiveLine: 'Balanced',
        passingStyle: 'Mixed',
        marking: 'Zonal'
    },
    "Maldonado RedGreen": {
        formation: TacticType.T_433,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Direct',
        marking: 'Zonal'
    },
    "Mazatlan Cannons": {
        formation: TacticType.T_532,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Narrow',
        defensiveLine: 'Deep',
        passingStyle: 'Direct',
        marking: 'ManToMan'
    },
    "Mexico City Cement": {
        formation: TacticType.T_532,
        style: 'Counter',
        aggression: 'Normal',
        tempo: 'Fast',
        width: 'Wide',
        defensiveLine: 'Balanced',
        passingStyle: 'Direct',
        marking: 'Zonal'
    }
};
