
import { GALATASARAY_SQUAD } from './data/galatasaray';
import { FENERBAHCE_SQUAD } from './data/fenerbahce';
import { BESIKTAS_SQUAD } from './data/besiktas';
import { TRABZONSPOR_SQUAD } from './data/trabzonspor';
import { BASAKSEHIR_SQUAD } from './data/basaksehir';
import { SAMSUNSPOR_SQUAD } from './data/samsunspor';
import { KONYASPOR_SQUAD } from './data/konyaspor';
import { KASIMPASA_SQUAD } from './data/kasimpasa';
import { RIZESPOR_SQUAD } from './data/rizespor';
import { GAZIANTEP_SQUAD } from './data/gaziantep';
import { ANTALYASPOR_SQUAD } from './data/antalyaspor';
import { KAYSERISPOR_SQUAD } from './data/kayserispor';
import { ALANYASPOR_SQUAD } from './data/alanyaspor';
import { GOZTEPE_SQUAD } from './data/goztepe';
import { EYUPSPOR_SQUAD } from './data/eyupspor';
import { KARAGUMRUK_SQUAD } from './data/karagumruk';
import { KOCAELISPOR_SQUAD } from './data/kocaelispor';
import { GENCLERBIRLIGI_SQUAD } from './data/genclerbirligi';
import { TeamTactic, TacticType } from './types';

export const TICKET_PRICE = 50;

export const NAMES_DB: any = {
    'World': { first: ['John', 'David', 'Michael'], last: ['Smith', 'Johnson', 'Brown'] },
    'Turkey': { first: ['Ahmet', 'Mehmet', 'Ali'], last: ['Yılmaz', 'Demir', 'Kaya'] }
};

// --- REAL WORLD TACTICAL PROFILES ---
export const TEAM_TACTICAL_PROFILES: Record<string, TeamTactic> = {
    "Fenerbahçe": { 
        formation: TacticType.T_4231, 
        style: 'HighPress', 
        aggression: 'Aggressive', 
        tempo: 'Fast', 
        width: 'Wide', 
        defensiveLine: 'High', 
        passingStyle: 'Direct', 
        marking: 'Zonal' 
    },
    "Galatasaray": { 
        formation: TacticType.T_433, 
        style: 'Possession', 
        aggression: 'Normal', 
        tempo: 'Normal', 
        width: 'Wide', 
        defensiveLine: 'Balanced', 
        passingStyle: 'Mixed', 
        marking: 'Zonal' 
    },
    "Beşiktaş": { 
        formation: TacticType.T_4231, 
        style: 'HighPress', 
        aggression: 'Aggressive', 
        tempo: 'Normal', 
        width: 'Balanced', 
        defensiveLine: 'Balanced', 
        passingStyle: 'Direct', 
        marking: 'Man Mark' 
    },
    "Trabzonspor": { 
        formation: TacticType.T_433, 
        style: 'Counter', 
        aggression: 'Normal', 
        tempo: 'Fast', 
        width: 'Wide', 
        defensiveLine: 'Balanced', 
        passingStyle: 'Direct', 
        marking: 'Zonal' 
    },
    "Başakşehir": { 
        formation: TacticType.T_4231, 
        style: 'Possession', 
        aggression: 'Safe', 
        tempo: 'Slow', 
        width: 'Balanced', 
        defensiveLine: 'Balanced', 
        passingStyle: 'Short', 
        marking: 'Zonal' 
    },
    "Konyaspor": { 
        formation: TacticType.T_442, 
        style: 'Defensive', 
        aggression: 'Aggressive', 
        tempo: 'Slow', 
        width: 'Narrow', 
        defensiveLine: 'Deep', 
        passingStyle: 'Direct', 
        marking: 'Man Mark' 
    },
    "Çaykur Rizespor": { 
        formation: TacticType.T_433, 
        style: 'Counter', 
        aggression: 'Normal', 
        tempo: 'Fast', 
        width: 'Wide', 
        defensiveLine: 'Balanced', 
        passingStyle: 'Mixed', 
        marking: 'Zonal' 
    },
    "Samsunspor": { 
        formation: TacticType.T_4231, 
        style: 'HighPress', 
        aggression: 'Aggressive', 
        tempo: 'Fast', 
        width: 'Wide', 
        defensiveLine: 'Balanced', 
        passingStyle: 'Direct', 
        marking: 'Zonal' 
    },
    "Gaziantep": { 
        formation: TacticType.T_532, 
        style: 'ParkTheBus', 
        aggression: 'Aggressive', 
        tempo: 'Slow', 
        width: 'Narrow', 
        defensiveLine: 'Deep', 
        passingStyle: 'LongBall', 
        marking: 'Man Mark' 
    },
    "Alanyaspor": { 
        formation: TacticType.T_4231, 
        style: 'Possession', 
        aggression: 'Normal', 
        tempo: 'Normal', 
        width: 'Wide', 
        defensiveLine: 'Balanced', 
        passingStyle: 'Short', 
        marking: 'Zonal' 
    },
    "Antalyaspor": { 
        formation: TacticType.T_433, 
        style: 'Counter', 
        aggression: 'Normal', 
        tempo: 'Fast', 
        width: 'Wide', 
        defensiveLine: 'Balanced', 
        passingStyle: 'Mixed', 
        marking: 'Zonal' 
    },
    "Eyüpspor": { 
        formation: TacticType.T_4231, 
        style: 'Possession', 
        aggression: 'Normal', 
        tempo: 'Normal', 
        width: 'Balanced', 
        defensiveLine: 'Balanced', 
        passingStyle: 'Short', 
        marking: 'Zonal' 
    },
    "Gençlerbirliği": { 
        formation: TacticType.T_442, 
        style: 'Balanced', 
        aggression: 'Normal', 
        tempo: 'Normal', 
        width: 'Balanced', 
        defensiveLine: 'Balanced', 
        passingStyle: 'Mixed', 
        marking: 'Zonal' 
    },
    "Göztepe": { 
        formation: TacticType.T_4231, 
        style: 'Counter', 
        aggression: 'Aggressive', 
        tempo: 'Normal', 
        width: 'Wide', 
        defensiveLine: 'Balanced', 
        passingStyle: 'Direct', 
        marking: 'Zonal' 
    },
    "Karagümrük": { 
        formation: TacticType.T_433, 
        style: 'Possession', 
        aggression: 'Normal', 
        tempo: 'Normal', 
        width: 'Wide', 
        defensiveLine: 'High', 
        passingStyle: 'Short', 
        marking: 'Zonal' 
    },
    "Kasımpaşa": { 
        formation: TacticType.T_4231, 
        style: 'Counter', 
        aggression: 'Normal', 
        tempo: 'Fast', 
        width: 'Wide', 
        defensiveLine: 'Balanced', 
        passingStyle: 'Direct', 
        marking: 'Zonal' 
    },
    "Kayserispor": { 
        formation: TacticType.T_4231, 
        style: 'Defensive', 
        aggression: 'Aggressive', 
        tempo: 'Normal', 
        width: 'Narrow', 
        defensiveLine: 'Balanced', 
        passingStyle: 'Mixed', 
        marking: 'Man Mark' 
    },
    "Kocaelispor": { 
        formation: TacticType.T_442, 
        style: 'ParkTheBus', 
        aggression: 'Normal', 
        tempo: 'Slow', 
        width: 'Narrow', 
        defensiveLine: 'Deep', 
        passingStyle: 'LongBall', 
        marking: 'Zonal' 
    }
};

export const LEAGUE_PRESETS = [
    { 
        id: 'tr', name: 'Süper Lig', country: 'Turkey', foreignPlayerChance: 0.5, playerNationality: 'Turkey',
        realTeams: [
            { name: "Galatasaray", city: "Istanbul", primaryColor: "#A90432", secondaryColor: "#FDB912", reputation: 8000, budget: 50000000 },
            { name: "Fenerbahçe", city: "Istanbul", primaryColor: "#002d72", secondaryColor: "#f4e04d", reputation: 7800, budget: 45000000 },
            { name: "Beşiktaş", city: "Istanbul", primaryColor: "#000000", secondaryColor: "#ffffff", reputation: 7600, budget: 35000000 },
            { name: "Trabzonspor", city: "Trabzon", primaryColor: "#800000", secondaryColor: "#87CEEB", reputation: 7000, budget: 25000000 },
            { name: "Başakşehir", city: "Istanbul", primaryColor: "#E25920", secondaryColor: "#182A4A", reputation: 6500, budget: 20000000 },
            { name: "Samsunspor", city: "Samsun", primaryColor: "#CC0000", secondaryColor: "#FFFFFF", reputation: 6000, budget: 15000000 },
            { name: "Konyaspor", city: "Konya", primaryColor: "#008000", secondaryColor: "#FFFFFF", reputation: 6000, budget: 12000000 },
            { name: "Kasımpaşa", city: "Istanbul", primaryColor: "#000080", secondaryColor: "#FFFFFF", reputation: 5800, budget: 10000000 },
            { name: "Çaykur Rizespor", city: "Rize", primaryColor: "#008000", secondaryColor: "#0000FF", reputation: 5800, budget: 10000000 },
            { name: "Gaziantep", city: "Gaziantep", primaryColor: "#FF0000", secondaryColor: "#000000", reputation: 5700, budget: 9000000 },
            { name: "Antalyaspor", city: "Antalya", primaryColor: "#FF0000", secondaryColor: "#FFFFFF", reputation: 5900, budget: 11000000 },
            { name: "Kayserispor", city: "Kayseri", primaryColor: "#FFFF00", secondaryColor: "#FF0000", reputation: 5700, budget: 9500000 },
            { name: "Alanyaspor", city: "Alanya", primaryColor: "#FFA500", secondaryColor: "#008000", reputation: 5800, budget: 10000000 },
            { name: "Göztepe", city: "Izmir", primaryColor: "#FFFF00", secondaryColor: "#FF0000", reputation: 5800, budget: 10000000 },
            { name: "Eyüpspor", city: "Istanbul", primaryColor: "#800080", secondaryColor: "#FFFF00", reputation: 5600, budget: 8500000 },
            { name: "Karagümrük", city: "Istanbul", primaryColor: "#FF0000", secondaryColor: "#000000", reputation: 5600, budget: 9000000 },
            { name: "Kocaelispor", city: "Kocaeli", primaryColor: "#008000", secondaryColor: "#000000", reputation: 5500, budget: 8000000 },
            { name: "Gençlerbirliği", city: "Ankara", primaryColor: "#FF0000", secondaryColor: "#000000", reputation: 5500, budget: 8000000 }
        ]
    },
    { id: 'en', name: 'Premier League', country: 'England', foreignPlayerChance: 0.7, playerNationality: 'England', realTeams: [] },
    { id: 'es', name: 'La Liga', country: 'Spain', foreignPlayerChance: 0.6, playerNationality: 'Spain', realTeams: [] }
];

export const REAL_PLAYERS: any[] = [
    ...GALATASARAY_SQUAD, ...FENERBAHCE_SQUAD, ...BESIKTAS_SQUAD, ...TRABZONSPOR_SQUAD,
    ...BASAKSEHIR_SQUAD, ...SAMSUNSPOR_SQUAD, ...KONYASPOR_SQUAD, ...KASIMPASA_SQUAD,
    ...RIZESPOR_SQUAD, ...GAZIANTEP_SQUAD, ...ANTALYASPOR_SQUAD, ...KAYSERISPOR_SQUAD,
    ...ALANYASPOR_SQUAD, ...GOZTEPE_SQUAD, ...EYUPSPOR_SQUAD, ...KARAGUMRUK_SQUAD,
    ...KOCAELISPOR_SQUAD, ...GENCLERBIRLIGI_SQUAD
];

export const TRANSLATIONS: Record<string, any> = {
    en: {
        dashboard: "Dashboard", news: "News", squad: "Squad", training: "Training", market: "Market", club: "Club", standings: "Standings", matchDay: "Match Day",
        managerWelcome: "Welcome back, Manager of {name}", dashboardDesc: "Your team is awaiting your instructions.",
        playNextMatch: "Play Next Match", quickDerby: "Quick Derby", boardConfidence: "Board Confidence", boardMessage: "We are pleased with your progress.",
        inbox: "Inbox", noMessages: "No new messages.", week: "Week",
        tactics: "Tactics", formation: "Formation", aggression: "Aggression",
        startingXI: "Starting XI", bench: "Bench", reserves: "Reserves",
        pos: "Pos", team: "Team", age: "Age", value: "Value", wage: "Wage",
        playFriendly: "Play Friendly", selectTeam: "Select Team",
        welcomeTitle: "Welcome, Manager", welcomeDesc: "The club has high expectations.", signContract: "Sign Contract",
        finances: "Finances", facilities: "Facilities", youthAcademy: "Youth Academy", resign: "Resign",
        clubBudget: "Club Budget", projectedWeekly: "Projected Weekly Balance",
        lastWeekReport: "Last Week Report", income: "Income", expenses: "Expenses",
        stadium: "Stadium", condition: "Condition", level: "Level", maintenance: "Maintenance",
        infrastructure: "Infrastructure", trainingCenter: "Training Center", academy: "Academy",
        scoutReport: "Scout Report", promotePlayer: "Promote", academyEmpty: "No candidates available.",
        efficiency: "Efficiency", coachNote: "Coach's Note",
        rec: "Rec", grw: "Grw", intensityLight: "Light", intensityNormal: "Normal", intensityHeavy: "Heavy",
        onTarget: "On Target", xg: "xG", selectBenchFirst: "Select a bench player first.", pitch: "Pitch",
        matchStatusAttack: "Attacking", matchStatusDefense: "Defending", kickoff: "Kickoff",
        fullTime: "Full Time", initializing: "Initializing...",
        goals: "Goals", assists: "Assists", apps: "Apps",
        leagueTable: "League Table", topScorers: "Top Scorers", topAssists: "Top Assists",
        champion: "Champion", pts: "Pts", p: "P", w: "W", d: "D", l: "L", gd: "GD",
        buy: "Buy", soldFor: "sold for", offerAccepted: "Offer accepted.", offerReceived: "Transfer Offer",
        acceptOffer: "Accept", rejectOffer: "Reject",
        renewContract: "Renew Contract", contractExtended: "Contract Extended", notEnoughFunds: "Not enough funds.",
        successfullySigned: "Successfully signed", promotedToSenior: "promoted to senior squad.",
        assistantManager: "Assistant Manager", clubHealth: "Club Health", squadReady: "Squad is ready.",
        criticalIssues: "Critical Issues", warnings: "Warnings", suggestions: "Suggestions", autoFix: "Auto Fix", close: "Close",
        worldRankings: "World Rankings", globalDb: "Global Player Database", searchPlayer: "Search Player...",
        rank: "Rank", nat: "Nat", ovrInfo: "OVR is weighted by position.",
        base: "Base", attack: "Attack", defense: "Defense",
        width: "Width", passingStyle: "Passing Style", tempo: "Tempo", defensiveLine: "Defensive Line", marking: "Marking",
        tacticNarrow: "Narrow", tacticWide: "Wide", tacticShort: "Short", tacticDirect: "Direct", tacticDeep: "Deep", tacticHigh: "High", tacticZonal: "Zonal", tacticManMark: "Man Mark",
        clickHelp: "Click player to swap/select", dragHelp: "Drag to adjust position", autoSortHelp: "Auto-Sort to fix positions",
        selected: "Selected", selectToStart: "Select players to start",
        sponsorTitle: "Select Sponsor", sponsorSelect: "Choose a main sponsor for the season.", weeklyIncome: "Weekly Income", winBonus: "Win Bonus",
        attributes: "Attributes", technical: "Technical", physical: "Physical", mental: "Mental",
        scoutSummary: "Scout Summary", contract: "Contract", yearsLeft: "Years Left", transferList: "Transfer List", removeFromList: "Remove from List",
        injured: "Injured", suspended: "Suspended",
        leagueTurkey: "Süper Lig", leagueEngland: "Premier League", leagueSpain: "La Liga", selectLeague: "Select League", reputation: "Reputation",
        startNewSeason: "Starting New Season", startMatch: "Start Match",
        resignConfirm: "Are you sure you want to resign? Progress will be lost.",
        weeklyReport: "Weekly Report",
        trainingReport: "Training Report",
        unhappyPlayer: "Unhappy Player",
        unhappyPlayerDesc: "{name} is unhappy with the lack of game time.",
        trainingIntensityReport: "Team trained with {intensity} intensity. Recovery: +{recovery}%",
        financeReport: "Finance Report",
        financeReportProfit: "This week the club budget closed with €{amount} profit.",
        financeReportLoss: "This week the club budget closed with €{amount} loss.",
        currentBalance: "Current balance: €{amount}",
        completeSquad: "Complete Squad",
        gameGuide: "Game Guide"
    },
    tr: {
        dashboard: "Panel", news: "Haberler", squad: "Kadro", training: "Antrenman", market: "Pazar", club: "Kulüp", standings: "Puan Durumu", matchDay: "Maç Günü",
        managerWelcome: "Tekrar Hoşgeldin, {name} Teknik Direktörü", dashboardDesc: "Takımın talimatlarını bekliyor.",
        playNextMatch: "Sonraki Maçı Oyna", quickDerby: "Hızlı Derbi", boardConfidence: "Yönetim Güveni", boardMessage: "Gidişattan memnunuz.",
        inbox: "Gelen Kutusu", noMessages: "Yeni mesaj yok.", week: "Hafta",
        tactics: "Taktikler", formation: "Diziliş", aggression: "Agresiflik",
        startingXI: "İlk 11", bench: "Yedekler", reserves: "Rezerv",
        pos: "Poz", team: "Takım", age: "Yaş", value: "Değer", wage: "Maaş",
        playFriendly: "Dostluk Maçı", selectTeam: "Takım Seç",
        welcomeTitle: "Hoşgeldin Hocam", welcomeDesc: "Kulübün beklentileri yüksek.", signContract: "Sözleşme İmzala",
        finances: "Finans", facilities: "Tesisler", youthAcademy: "Altyapı", resign: "İstifa Et",
        clubBudget: "Kulüp Bütçesi", projectedWeekly: "Tahmini Haftalık Bakiye",
        lastWeekReport: "Geçen Haftanın Raporu", income: "Gelir", expenses: "Gider",
        stadium: "Stadyum", condition: "Durum", level: "Seviye", maintenance: "Bakım",
        infrastructure: "Altyapı", trainingCenter: "Antrenman Merkezi", academy: "Akademi",
        scoutReport: "Gözlemci Raporu", promotePlayer: "A Takıma Çıkar", academyEmpty: "Aday oyuncu yok.",
        efficiency: "Verimlilik", coachNote: "Antrenör Notu",
        rec: "Din", grw: "Gel", intensityLight: "Hafif", intensityNormal: "Normal", intensityHeavy: "Ağır",
        onTarget: "İsabetli", xg: "Gol Beklentisi", selectBenchFirst: "Önce yedek oyuncu seçin.", pitch: "Saha",
        matchStatusAttack: "Hücum", matchStatusDefense: "Savunma", kickoff: "Başlama Vuruşu",
        fullTime: "Maç Sonu", initializing: "Hazırlanıyor...",
        goals: "Gol", assists: "Asist", apps: "Maç",
        leagueTable: "Puan Durumu", topScorers: "Gol Krallığı", topAssists: "Asist Krallığı",
        champion: "Şampiyon", pts: "P", p: "O", w: "G", d: "B", l: "M", gd: "AV",
        buy: "Satın Al", soldFor: "satıldı:", offerAccepted: "Teklif kabul edildi.", offerReceived: "Transfer Teklifi",
        acceptOffer: "Kabul Et", rejectOffer: "Reddet",
        renewContract: "Sözleşme Yenile", contractExtended: "Sözleşme Uzatıldı", notEnoughFunds: "Yetersiz bakiye.",
        successfullySigned: "Başarıyla transfer edildi:", promotedToSenior: "A takıma yükseldi:",
        assistantManager: "Yardımcı Antrenör", clubHealth: "Kulüp Sağlığı", squadReady: "Kadro hazır.",
        criticalIssues: "Kritik Sorunlar", warnings: "Uyarılar", suggestions: "Öneriler", autoFix: "Otomatik Düzelt", close: "Kapat",
        worldRankings: "Dünya Sıralaması", globalDb: "Küresel Oyuncu Veritabanı", searchPlayer: "Oyuncu Ara...",
        rank: "Sıra", nat: "uyr", ovrInfo: "Reyting pozisyona göredir.",
        base: "Temel", attack: "Hücum", defense: "Savunma",
        width: "Genişlik", passingStyle: "Pas Stili", tempo: "Tempo", defensiveLine: "Defans Hattı", marking: "Markaj",
        tacticNarrow: "Dar", tacticWide: "Geniş", tacticShort: "Kısa", tacticDirect: "Direkt", tacticDeep: "Derin", tacticHigh: "Önde", tacticZonal: "Alan", tacticManMark: "Adam Adama",
        clickHelp: "Değiştirmek için tıkla", dragHelp: "Pozisyonu sürükle", autoSortHelp: "Otomatik diziliş",
        selected: "Seçilen", selectToStart: "Başlamak için oyuncu seç",
        sponsorTitle: "Sponsor Seçimi", sponsorSelect: "Sezonluk ana sponsorunu seç.", weeklyIncome: "Haftalık Gelir", winBonus: "Galibiyet Primi",
        attributes: "Özellikler", technical: "Teknik", physical: "Fiziksel", mental: "Zihinsel",
        scoutSummary: "Gözlemci Özeti", contract: "Sözleşme", yearsLeft: "Yıl Kaldı", transferList: "Transfer Listesi", removeFromList: "Listeden Çıkar",
        injured: "Sakat", suspended: "Cezalı",
        leagueTurkey: "Süper Lig", leagueEngland: "Premier League", leagueSpain: "La Liga", selectLeague: "Lig Seçin", reputation: "İtibar",
        startNewSeason: "Yeni Sezon Başlıyor", startMatch: "Maçı Başlat",
        resignConfirm: "İstifa etmek istediğine emin misin? İlerleme kaybolacak.",
        weeklyReport: "Haftalık Rapor",
        trainingReport: "Antrenman Raporu",
        unhappyPlayer: "Mutsuz Oyuncu",
        unhappyPlayerDesc: "{name} az süre aldığı için mutsuz.",
        trainingIntensityReport: "Takım {intensity} yoğunlukta çalıştı. Yenilenme: +%{recovery}",
        financeReport: "Finansal Rapor",
        financeReportProfit: "Bu hafta kulüp ekonomisi €{amount} kar ile kapattı.",
        financeReportLoss: "Bu hafta kulüp ekonomisi €{amount} zarar ile kapattı.",
        currentBalance: "Mevcut bakiye: €{amount}",
        completeSquad: "Kadro Tamamla",
        gameGuide: "Oyun Rehberi"
    }
};
