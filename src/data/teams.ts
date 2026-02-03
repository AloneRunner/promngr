import { LeaguePreset } from '../types';
import { LEAGUE_LOGOS } from '../constants/logoMapping';

export const LEAGUE_PRESETS = [
    {
        id: 'tr', region: 'GROUP_B', name: 'Süper Lig', country: 'Turkey', foreignPlayerChance: 0.5, playerNationality: 'Turkey', matchFormat: 'double-round',
        logo: '/assets/logos/leagues/tr.jpg',
        flag: '🇹🇷',
        realTeams: [
            { name: "Galata Lions", city: "Istanbul", primaryColor: "#A90432", secondaryColor: "#FDB912", reputation: 7100, budget: 65000000, stadiumCapacity: 52000 },
            { name: "Istanbul Yellows", city: "Istanbul", primaryColor: "#002d72", secondaryColor: "#f4e04d", reputation: 7000, budget: 60000000, stadiumCapacity: 47000 },
            { name: "Istanbul Eagles", city: "Istanbul", primaryColor: "#000000", secondaryColor: "#ffffff", reputation: 6800, budget: 45000000, stadiumCapacity: 42000 },
            { name: "Trabzon Storm", city: "Trabzon", primaryColor: "#800000", secondaryColor: "#87CEEB", reputation: 6200, budget: 30000000, stadiumCapacity: 41000 },
            { name: "Basak City", city: "Istanbul", primaryColor: "#E25920", secondaryColor: "#182A4A", reputation: 5800, budget: 25000000, stadiumCapacity: 17000 },
            { name: "Samsun Red", city: "Samsun", primaryColor: "#CC0000", secondaryColor: "#FFFFFF", reputation: 5400, budget: 18000000, stadiumCapacity: 33000 },
            { name: "Konya Green", city: "Konya", primaryColor: "#008000", secondaryColor: "#FFFFFF", reputation: 5200, budget: 15000000, stadiumCapacity: 42000 },
            { name: "Kasimpasa Navy", city: "Istanbul", primaryColor: "#000080", secondaryColor: "#FFFFFF", reputation: 5000, budget: 12000000, stadiumCapacity: 14000 },
            { name: "Rize Tea", city: "Rize", primaryColor: "#008000", secondaryColor: "#0000FF", reputation: 4900, budget: 12000000, stadiumCapacity: 15000 },
            { name: "Antep Falcons", city: "Gaziantep", primaryColor: "#FF0000", secondaryColor: "#000000", reputation: 4800, budget: 11000000, stadiumCapacity: 35000 },
            { name: "Antalya Scorpions", city: "Antalya", primaryColor: "#FF0000", secondaryColor: "#FFFFFF", reputation: 5100, budget: 14000000, stadiumCapacity: 33000 },
            { name: "Kayseri Stars", city: "Kayseri", primaryColor: "#FFFF00", secondaryColor: "#FF0000", reputation: 4800, budget: 11000000, stadiumCapacity: 32000 },
            { name: "Alanya Sun", city: "Alanya", primaryColor: "#FFA500", secondaryColor: "#008000", reputation: 4900, budget: 12000000, stadiumCapacity: 10000 },
            { name: "Izmir Goz", city: "Izmir", primaryColor: "#FFFF00", secondaryColor: "#FF0000", reputation: 5200, budget: 15000000, stadiumCapacity: 20000 },
            { name: "Eyup Violet", city: "Istanbul", primaryColor: "#800080", secondaryColor: "#FFFF00", reputation: 5000, budget: 20000000, stadiumCapacity: 14500 }, // High budget scaling
            { name: "Karagumruk Black", city: "Istanbul", primaryColor: "#FF0000", secondaryColor: "#000000", reputation: 4700, budget: 10000000, stadiumCapacity: 15000 },
            { name: "Kocaeli Gulf", city: "Kocaeli", primaryColor: "#008000", secondaryColor: "#000000", reputation: 4600, budget: 9000000, stadiumCapacity: 34000 },
            { name: "Ankara Youth", city: "Ankara", primaryColor: "#FF0000", secondaryColor: "#000000", reputation: 4500, budget: 9000000, stadiumCapacity: 19000 }
        ]
    },
    {
        id: 'ng', region: 'GROUP_F', name: 'NPFL', country: 'Nigeria', foreignPlayerChance: 0.1, playerNationality: 'Nigeria',
        matchFormat: 'double-round',

        logo: '/assets/logos/leagues/npfl.jpg',
        flag: '🇳🇬',
        realTeams: [
            { name: "Rivers Utd", city: "Port Harcourt", primaryColor: "#0000FF", secondaryColor: "#FFFFFF", reputation: 4800, budget: 6000000, stadiumCapacity: 16000 },
            { name: "Nasarawa United", city: "Lafia", primaryColor: "#008000", secondaryColor: "#FFFFFF", reputation: 4600, budget: 4500000, stadiumCapacity: 5000 },
            { name: "Ikorodu City", city: "Lagos", primaryColor: "#FFFF00", secondaryColor: "#0000FF", reputation: 4500, budget: 4000000, stadiumCapacity: 10000 },
            { name: "Abia Warriors", city: "Umuahia", primaryColor: "#FF0000", secondaryColor: "#FFFFFF", reputation: 4400, budget: 3500000, stadiumCapacity: 5000 },
            { name: "Enugu Rangers", city: "Enugu", primaryColor: "#FF0000", secondaryColor: "#FFFFFF", reputation: 4700, budget: 5000000, stadiumCapacity: 22000 },
            { name: "Shooting Stars", city: "Ibadan", primaryColor: "#0000FF", secondaryColor: "#FFFFFF", reputation: 4600, budget: 4200000, stadiumCapacity: 10000 },
            { name: "Niger Tornadoes FC", city: "Minna", primaryColor: "#0000FF", secondaryColor: "#FFFF00", reputation: 4300, budget: 3000000, stadiumCapacity: 5000 },
            { name: "Bendel Insurance", city: "Benin City", primaryColor: "#008000", secondaryColor: "#FFFF00", reputation: 4400, budget: 3500000, stadiumCapacity: 12000 },
            { name: "Warri Wolves FC", city: "Warri", primaryColor: "#FFFF00", secondaryColor: "#008000", reputation: 4300, budget: 3200000, stadiumCapacity: 20000 },
            { name: "El-Kanemi Warriors", city: "Maiduguri", primaryColor: "#FFFF00", secondaryColor: "#FFFFFF", reputation: 4200, budget: 3000000, stadiumCapacity: 10000 },
            { name: "Katsina Utd", city: "Katsina", primaryColor: "#FFFF00", secondaryColor: "#008000", reputation: 4100, budget: 2800000, stadiumCapacity: 35000 },
            { name: "Enyimba", city: "Aba", primaryColor: "#0000FF", secondaryColor: "#FFFFFF", reputation: 5000, budget: 7000000, stadiumCapacity: 16000 },
            { name: "Bayelsa United FC", city: "Yenagoa", primaryColor: "#0000FF", secondaryColor: "#FFFF00", reputation: 4000, budget: 2500000, stadiumCapacity: 5000 },
            { name: "Wikki Tourists", city: "Bauchi", primaryColor: "#FFFF00", secondaryColor: "#0000FF", reputation: 3900, budget: 2000000, stadiumCapacity: 15000 },
            { name: "Barau FC", city: "Kano", primaryColor: "#FF0000", secondaryColor: "#FFFFFF", reputation: 3800, budget: 1800000, stadiumCapacity: 5000 },
            { name: "Plateau Utd", city: "Jos", primaryColor: "#FF0000", secondaryColor: "#FFFF00", reputation: 3900, budget: 2200000, stadiumCapacity: 44000 },
            { name: "Remo Stars", city: "Ikenne", primaryColor: "#87CEEB", secondaryColor: "#FFFF00", reputation: 4500, budget: 5500000, stadiumCapacity: 20000 },
            { name: "Kano Pillars FC", city: "Kano", primaryColor: "#008000", secondaryColor: "#FFFF00", reputation: 4700, budget: 4800000, stadiumCapacity: 16000 },
            { name: "Kwara United", city: "Ilorin", primaryColor: "#FF0000", secondaryColor: "#FFFFFF", reputation: 4000, budget: 2500000, stadiumCapacity: 18000 },
            { name: "Kun Khalifat FC", city: "Owerri", primaryColor: "#FFFFFF", secondaryColor: "#000000", reputation: 3500, budget: 1000000, stadiumCapacity: 3000 }
        ]
    },
    {
        id: 'id', region: 'GROUP_E', name: 'Liga 1', country: 'Indonesia', foreignPlayerChance: 0.3, playerNationality: 'Indonesia',
        matchFormat: 'double-round',

        logo: '/assets/logos/leagues/liga1.jpg',
        flag: '🇮🇩',
        realTeams: [
            { name: "Persib Bandung", city: "Bandung", primaryColor: "#0000FF", secondaryColor: "#FFFFFF", reputation: 5200, budget: 12000000, stadiumCapacity: 38000 },
            { name: "Persija Jakarta", city: "Jakarta", primaryColor: "#FF4500", secondaryColor: "#FFFFFF", reputation: 5100, budget: 11000000, stadiumCapacity: 77193 },
            { name: "Borneo FC", city: "Samarinda", primaryColor: "#FF8C00", secondaryColor: "#FFFFFF", reputation: 5000, budget: 10000000, stadiumCapacity: 16000 },
            { name: "Malut United", city: "Ternate", primaryColor: "#FF0000", secondaryColor: "#000000", reputation: 4800, budget: 8500000, stadiumCapacity: 10000 },
            { name: "Persita", city: "Tangerang", primaryColor: "#8A2BE2", secondaryColor: "#FFFFFF", reputation: 4700, budget: 8000000, stadiumCapacity: 30000 },
            { name: "Persebaya", city: "Surabaya", primaryColor: "#006400", secondaryColor: "#FFFFFF", reputation: 4900, budget: 9500000, stadiumCapacity: 46806 },
            { name: "PSIM", city: "Yogyakarta", primaryColor: "#0000FF", secondaryColor: "#FFFFFF", reputation: 4500, budget: 6000000, stadiumCapacity: 35000 },
            { name: "Persisam Putra", city: "Samarinda", primaryColor: "#FF8C00", secondaryColor: "#000000", reputation: 4600, budget: 7000000, stadiumCapacity: 16000 },
            { name: "Bhayangkara", city: "Jakarta", primaryColor: "#FFFF00", secondaryColor: "#FF0000", reputation: 4800, budget: 9000000, stadiumCapacity: 30000 },
            { name: "Dewa United", city: "Tangerang", primaryColor: "#000000", secondaryColor: "#FFD700", reputation: 4700, budget: 8500000, stadiumCapacity: 15000 },
            { name: "Persik", city: "Kediri", primaryColor: "#800080", secondaryColor: "#FFFF00", reputation: 4400, budget: 5000000, stadiumCapacity: 15000 },
            { name: "Arema", city: "Malang", primaryColor: "#0000FF", secondaryColor: "#FFFFFF", reputation: 4900, budget: 9000000, stadiumCapacity: 42000 },
            { name: "PSM Makassar", city: "Makassar", primaryColor: "#FF0000", secondaryColor: "#FFFFFF", reputation: 5000, budget: 10000000, stadiumCapacity: 15000 },
            { name: "Madura United", city: "Pamekasan", primaryColor: "#FF0000", secondaryColor: "#FFFFFF", reputation: 4600, budget: 7000000, stadiumCapacity: 15000 },
            { name: "PSBS Biak", city: "Biak", primaryColor: "#0000FF", secondaryColor: "#FFFF00", reputation: 4200, budget: 4000000, stadiumCapacity: 10000 },
            { name: "Persijap Jepara", city: "Jepara", primaryColor: "#FF0000", secondaryColor: "#000000", reputation: 4000, budget: 3000000, stadiumCapacity: 20000 },
            { name: "Semen Padang", city: "Padang", primaryColor: "#FF0000", secondaryColor: "#FFFF00", reputation: 4100, budget: 3500000, stadiumCapacity: 20000 },
            { name: "Persis Solo", city: "Surakarta", primaryColor: "#FF0000", secondaryColor: "#FFFFFF", reputation: 4300, budget: 5000000, stadiumCapacity: 20000 }
        ]
    },
    {
        id: 'en', region: 'GROUP_A', name: 'Premier League', country: 'England', foreignPlayerChance: 0.7, playerNationality: 'England', matchFormat: 'double-round',

        logo: '/assets/logos/leagues/en.jpg',
        flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
        realTeams: [
            { name: "Merseyside Reds", city: "Liverpool", primaryColor: "#C8102E", secondaryColor: "#F6EB61", reputation: 9000, budget: 150000000, stadiumCapacity: 61000 },
            { name: "Manchester Skyblues", city: "Manchester", primaryColor: "#6CABDD", secondaryColor: "#1C2C5B", reputation: 9200, budget: 180000000, stadiumCapacity: 53000 },
            { name: "London Cannons", city: "London", primaryColor: "#EF0107", secondaryColor: "#063672", reputation: 8900, budget: 130000000, stadiumCapacity: 60000 },
            { name: "London Blue Lions", city: "London", primaryColor: "#034694", secondaryColor: "#DBA111", reputation: 8700, budget: 120000000, stadiumCapacity: 40000 },
            { name: "Manchester Devils", city: "Manchester", primaryColor: "#DA291C", secondaryColor: "#FBE122", reputation: 8800, budget: 140000000, stadiumCapacity: 75000 },
            { name: "North London Whites", city: "London", primaryColor: "#FFFFFF", secondaryColor: "#132257", reputation: 8500, budget: 90000000, stadiumCapacity: 62000 },
            { name: "Tyneside Magpies", city: "Newcastle", primaryColor: "#000000", secondaryColor: "#FFFFFF", reputation: 8400, budget: 110000000, stadiumCapacity: 52000 },
            { name: "Birmingham Villans", city: "Birmingham", primaryColor: "#670E36", secondaryColor: "#95B600", reputation: 7500, budget: 70000000, stadiumCapacity: 42000 },
            { name: "East London Hammers", city: "London", primaryColor: "#7A263A", secondaryColor: "#1BB1E7", reputation: 7200, budget: 60000000, stadiumCapacity: 62000 },
            { name: "Brighton Seagulls", city: "Brighton", primaryColor: "#0057B8", secondaryColor: "#FFFFFF", reputation: 7100, budget: 55000000, stadiumCapacity: 32000 },
            { name: "West Midlands Wolves", city: "Wolverhampton", primaryColor: "#FDB913", secondaryColor: "#000000", reputation: 6800, budget: 50000000, stadiumCapacity: 32000 },
            { name: "Merseyside Blues", city: "Liverpool", primaryColor: "#003399", secondaryColor: "#FFFFFF", reputation: 6800, budget: 45000000, stadiumCapacity: 40000 },
            { name: "West London Whites", city: "London", primaryColor: "#FFFFFF", secondaryColor: "#000000", reputation: 6600, budget: 40000000, stadiumCapacity: 25000 },
            { name: "West London Bees", city: "London", primaryColor: "#E30613", secondaryColor: "#FFFFFF", reputation: 6500, budget: 35000000, stadiumCapacity: 17000 },
            { name: "Crystal Glaziers", city: "London", primaryColor: "#1B458F", secondaryColor: "#C4122E", reputation: 6500, budget: 35000000, stadiumCapacity: 26000 },
            { name: "Forest Archers", city: "Nottingham", primaryColor: "#DD0000", secondaryColor: "#FFFFFF", reputation: 6400, budget: 30000000, stadiumCapacity: 30000 },
            { name: "South Coast Cherries", city: "Bournemouth", primaryColor: "#DA291C", secondaryColor: "#000000", reputation: 6300, budget: 28000000, stadiumCapacity: 11000 },
            { name: "Wearside Black Cats", city: "Sunderland", primaryColor: "#FF0000", secondaryColor: "#000000", reputation: 6000, budget: 25000000, stadiumCapacity: 49000 },
            { name: "Yorkshire Whites", city: "Leeds", primaryColor: "#FFFFFF", secondaryColor: "#003399", reputation: 6200, budget: 30000000, stadiumCapacity: 37000 },
            { name: "Lancashire Clarets", city: "Burnley", primaryColor: "#6C1D45", secondaryColor: "#99D6EA", reputation: 6000, budget: 22000000, stadiumCapacity: 22000 }
        ]
    },
    {
        id: 'es', region: 'GROUP_A', name: 'La Liga', country: 'Spain', foreignPlayerChance: 0.6, playerNationality: 'Spain', matchFormat: 'double-round',

        logo: '/assets/logos/leagues/es.jpg',
        flag: '🇪🇸',
        realTeams: [
            { name: "Madrid Blancos", city: "Madrid", primaryColor: "#FFFFFF", secondaryColor: "#FEBE10", reputation: 9300, budget: 170000000, stadiumCapacity: 81044 },
            { name: "Catalonia Blau", city: "Barcelona", primaryColor: "#A50044", secondaryColor: "#004D98", reputation: 9100, budget: 110000000, stadiumCapacity: 99354 },
            { name: "Madrid Indios", city: "Madrid", primaryColor: "#CB3524", secondaryColor: "#1D2855", reputation: 8500, budget: 90000000, stadiumCapacity: 68456 },
            { name: "Nervion Red-Whites", city: "Seville", primaryColor: "#FFFFFF", secondaryColor: "#D4001F", reputation: 7000, budget: 60000000, stadiumCapacity: 43883 },
            { name: "Valencia Bats", city: "Valencia", primaryColor: "#FFFFFF", secondaryColor: "#000000", reputation: 6800, budget: 50000000, stadiumCapacity: 49430 },
            { name: "Mallorca Islanders", city: "Palma", primaryColor: "#E20613", secondaryColor: "#000000", reputation: 6200, budget: 30000000, stadiumCapacity: 23142 },
            { name: "Girona Reds", city: "Girona", primaryColor: "#CE1126", secondaryColor: "#FFFFFF", reputation: 6500, budget: 40000000, stadiumCapacity: 13450 },
            { name: "Vallecano Lightning", city: "Madrid", primaryColor: "#FFFFFF", secondaryColor: "#CE1126", reputation: 6000, budget: 25000000, stadiumCapacity: 14708 },
            { name: "Vitoria Foxes", city: "Vitoria-Gasteiz", primaryColor: "#005EB8", secondaryColor: "#FFFFFF", reputation: 5900, budget: 22000000, stadiumCapacity: 19840 },
            { name: "San Sebastian Blue", city: "San Sebastian", primaryColor: "#0067B1", secondaryColor: "#FFFFFF", reputation: 7200, budget: 65000000, stadiumCapacity: 39500 },
            { name: "Bilbao Lions", city: "Bilbao", primaryColor: "#EE2523", secondaryColor: "#FFFFFF", reputation: 7300, budget: 70000000, stadiumCapacity: 53289 },
            { name: "Seville GreenWhites", city: "Seville", primaryColor: "#0BB363", secondaryColor: "#FFFFFF", reputation: 6900, budget: 55000000, stadiumCapacity: 60721 },
            { name: "Yellow Submarines", city: "Villarreal", primaryColor: "#F5E216", secondaryColor: "#005187", reputation: 7100, budget: 60000000, stadiumCapacity: 23500 },
            { name: "Vigo Sky Blues", city: "Vigo", primaryColor: "#8AC3EE", secondaryColor: "#FFFFFF", reputation: 6200, budget: 35000000, stadiumCapacity: 29000 },
            { name: "Pamplona Bulls", city: "Pamplona", primaryColor: "#DA291C", secondaryColor: "#16315C", reputation: 6100, budget: 30000000, stadiumCapacity: 23576 },
            { name: "South Madrid Blues", city: "Getafe", primaryColor: "#005999", secondaryColor: "#FFFFFF", reputation: 6000, budget: 28000000, stadiumCapacity: 17000 },
            { name: "Espanyol Parrots", city: "Barcelona", primaryColor: "#007FC8", secondaryColor: "#FFFFFF", reputation: 6000, budget: 32000000, stadiumCapacity: 40000 },
            { name: "Challengers United", city: "Spain", primaryColor: "#000000", secondaryColor: "#FFFFFF", reputation: 5800, budget: 15000000, stadiumCapacity: 15000 },
            { name: "Canary Yellows", city: "Las Palmas", primaryColor: "#FFE400", secondaryColor: "#005BAC", reputation: 5900, budget: 18000000, stadiumCapacity: 32400 },
            { name: "Castilla Violet", city: "Valladolid", primaryColor: "#6A0DAD", secondaryColor: "#FFFFFF", reputation: 5800, budget: 15000000, stadiumCapacity: 28012 }
        ]
    },
    {
        id: 'it', region: 'GROUP_A', name: 'Italian Calcio', country: 'Italy', foreignPlayerChance: 0.6, playerNationality: 'Italy', matchFormat: 'double-round',

        logo: '/assets/logos/leagues/it.jpg',
        flag: '🇮🇹',
        realTeams: [
            { name: "Inter Lombardia", city: "Milan", primaryColor: "#001EA6", secondaryColor: "#000000", reputation: 9000, budget: 95000000, stadiumCapacity: 75817 },
            { name: "Milano Devils", city: "Milan", primaryColor: "#FB090B", secondaryColor: "#000000", reputation: 8800, budget: 70000000, stadiumCapacity: 75817 },
            { name: "Piemonte Zebras", city: "Turin", primaryColor: "#FFFFFF", secondaryColor: "#000000", reputation: 9100, budget: 110000000, stadiumCapacity: 41507 },
            { name: "Napoli Blues", city: "Naples", primaryColor: "#003090", secondaryColor: "#FFFFFF", reputation: 7800, budget: 60000000, stadiumCapacity: 54726 },
            { name: "Roma Gladiators", city: "Rome", primaryColor: "#8E1F2F", secondaryColor: "#F0BC42", reputation: 7600, budget: 55000000, stadiumCapacity: 70634 },
            { name: "Latium Eagles", city: "Rome", primaryColor: "#87D8F7", secondaryColor: "#FFFFFF", reputation: 7400, budget: 50000000, stadiumCapacity: 70634 },
            { name: "Bergamo United", city: "Bergamo", primaryColor: "#000000", secondaryColor: "#005CAB", reputation: 7500, budget: 45000000, stadiumCapacity: 21747 },
            { name: "Florence Viola", city: "Florence", primaryColor: "#482E92", secondaryColor: "#FFFFFF", reputation: 7000, budget: 40000000, stadiumCapacity: 43147 },
            { name: "Bologna Redblues", city: "Bologna", primaryColor: "#A21C26", secondaryColor: "#1A2F48", reputation: 6500, budget: 30000000, stadiumCapacity: 36462 },
            { name: "Torino Bulls", city: "Turin", primaryColor: "#8A1E03", secondaryColor: "#FFFFFF", reputation: 6200, budget: 25000000, stadiumCapacity: 27958 },
            { name: "Sassuolo Greenblacks", city: "Sassuolo", primaryColor: "#00A752", secondaryColor: "#000000", reputation: 6000, budget: 20000000, stadiumCapacity: 21525 },
            { name: "Udine Friuli", city: "Udine", primaryColor: "#FFFFFF", secondaryColor: "#000000", reputation: 5900, budget: 18000000, stadiumCapacity: 25144 },
            { name: "Genoa Griffins", city: "Genoa", primaryColor: "#A21C26", secondaryColor: "#001A4C", reputation: 6200, budget: 22000000, stadiumCapacity: 36599 },
            { name: "Lecce Wolves", city: "Lecce", primaryColor: "#FFF200", secondaryColor: "#DA291C", reputation: 5800, budget: 15000000, stadiumCapacity: 31533 },
            { name: "Verona Mastiffs", city: "Verona", primaryColor: "#003399", secondaryColor: "#FDB913", reputation: 5800, budget: 16000000, stadiumCapacity: 31045 },
            { name: "Parma Crusaders", city: "Parma", primaryColor: "#FFFFFF", secondaryColor: "#000000", reputation: 6100, budget: 25000000, stadiumCapacity: 22352 },
            { name: "Cagliari Islanders", city: "Cagliari", primaryColor: "#001A4C", secondaryColor: "#A21C26", reputation: 5700, budget: 18000000, stadiumCapacity: 16416 },
            { name: "Como Lakers", city: "Como", primaryColor: "#003B7E", secondaryColor: "#FFFFFF", reputation: 6000, budget: 22000000, stadiumCapacity: 13602 },
            { name: "Monza Speed", city: "Monza", primaryColor: "#F0F0F0", secondaryColor: "#E31837", reputation: 5900, budget: 16000000, stadiumCapacity: 15039 },
            { name: "Venice Gondoliers", city: "Venice", primaryColor: "#FF6600", secondaryColor: "#006633", reputation: 5800, budget: 12000000, stadiumCapacity: 11150 }
        ]
    },
    {
        id: 'fr', region: 'GROUP_A', name: 'Ligue 1', country: 'France', foreignPlayerChance: 0.7, playerNationality: 'France', matchFormat: 'double-round',

        logo: '/assets/logos/leagues/fr.jpg',
        flag: '🇫🇷',
        realTeams: [
            { name: "Paris Red-Blue", city: "Paris", primaryColor: "#004170", secondaryColor: "#DA291C", reputation: 9100, budget: 200000000, stadiumCapacity: 47929 },
            { name: "Marseille Blue", city: "Marseille", primaryColor: "#FFFFFF", secondaryColor: "#00AEEF", reputation: 8500, budget: 60000000, stadiumCapacity: 67394 },
            { name: "Lyon Kids", city: "Lyon", primaryColor: "#FFFFFF", secondaryColor: "#1B4793", reputation: 8300, budget: 55000000, stadiumCapacity: 59186 },
            { name: "Principality Red", city: "Monaco", primaryColor: "#E70014", secondaryColor: "#FFFFFF", reputation: 8400, budget: 70000000, stadiumCapacity: 18523 },
            { name: "Lille Dogs", city: "Lille", primaryColor: "#E01E13", secondaryColor: "#2D292A", reputation: 8200, budget: 50000000, stadiumCapacity: 50186 },
            { name: "Brittany Red", city: "Rennes", primaryColor: "#E51A25", secondaryColor: "#000000", reputation: 7900, budget: 40000000, stadiumCapacity: 29778 },
            { name: "Riviera Eagles", city: "Nice", primaryColor: "#DD0000", secondaryColor: "#000000", reputation: 7800, budget: 45000000, stadiumCapacity: 36178 },
            { name: "Lens Gold", city: "Lens", primaryColor: "#FDE100", secondaryColor: "#DA291C", reputation: 7800, budget: 35000000, stadiumCapacity: 38223 },
            { name: "Paris Blue", city: "Paris", primaryColor: "#1E3159", secondaryColor: "#FFFFFF", reputation: 7400, budget: 20000000, stadiumCapacity: 20000 },
            { name: "Nantes Yellows", city: "Nantes", primaryColor: "#FFF200", secondaryColor: "#00A650", reputation: 7500, budget: 25000000, stadiumCapacity: 35322 },
            { name: "Alsace Blue", city: "Strasbourg", primaryColor: "#0093E9", secondaryColor: "#FFFFFF", reputation: 7400, budget: 22000000, stadiumCapacity: 26280 },
            { name: "AJ Burgundy", city: "Auxerre", primaryColor: "#FFFFFF", secondaryColor: "#0055A4", reputation: 7000, budget: 15000000, stadiumCapacity: 18541 },
            { name: "Toulouse Violets", city: "Toulouse", primaryColor: "#7B3F9E", secondaryColor: "#FFFFFF", reputation: 7300, budget: 20000000, stadiumCapacity: 33150 },
            { name: "Reims Royals", city: "Reims", primaryColor: "#ED1C24", secondaryColor: "#FFFFFF", reputation: 7400, budget: 22000000, stadiumCapacity: 21684 },
            { name: "Montpellier Orange", city: "Montpellier", primaryColor: "#FF6600", secondaryColor: "#003366", reputation: 7300, budget: 18000000, stadiumCapacity: 32900 },
            { name: "Brest Pirates", city: "Brest", primaryColor: "#E2001A", secondaryColor: "#FFFFFF", reputation: 7800, budget: 40000000, stadiumCapacity: 15931 },
            { name: "Saint-Green", city: "Saint-Etienne", primaryColor: "#008000", secondaryColor: "#FFFFFF", reputation: 7200, budget: 16000000, stadiumCapacity: 41965 },
            { name: "Angers Black-Whites", city: "Angers", primaryColor: "#000000", secondaryColor: "#FFFFFF", reputation: 7000, budget: 14000000, stadiumCapacity: 18752 }
        ]
    },
    {
        id: 'de', region: 'GROUP_A', name: 'Bundesliga', country: 'Germany', foreignPlayerChance: 0.5, playerNationality: 'Germany', matchFormat: 'double-round',

        logo: '/assets/logos/leagues/de.jpg',
        flag: '🇩🇪',
        realTeams: [
            { name: "Munich Red", city: "Munich", primaryColor: "#DC052D", secondaryColor: "#FFFFFF", reputation: 9100, budget: 130000000, stadiumCapacity: 75024 },
            { name: "Westphalia Yellows", city: "Dortmund", primaryColor: "#FDE100", secondaryColor: "#000000", reputation: 8600, budget: 85000000, stadiumCapacity: 81365 },
            { name: "Leverkusen Red", city: "Leverkusen", primaryColor: "#E32219", secondaryColor: "#000000", reputation: 8500, budget: 75000000, stadiumCapacity: 30210 },
            { name: "Leipzig Bulls", city: "Leipzig", primaryColor: "#FFFFFF", secondaryColor: "#DD032F", reputation: 8300, budget: 90000000, stadiumCapacity: 47069 },
            { name: "Stuttgart White-Reds", city: "Stuttgart", primaryColor: "#FFFFFF", secondaryColor: "#E32219", reputation: 7900, budget: 45000000, stadiumCapacity: 60449 },
            { name: "Wolfsburg Green", city: "Wolfsburg", primaryColor: "#65B32E", secondaryColor: "#FFFFFF", reputation: 7600, budget: 50000000, stadiumCapacity: 30000 },
            { name: "Freiburg Forest", city: "Freiburg", primaryColor: "#FFFFFF", secondaryColor: "#000000", reputation: 7500, budget: 35000000, stadiumCapacity: 34700 },
            { name: "Hoffen Blue", city: "Sinsheim", primaryColor: "#005CAB", secondaryColor: "#FFFFFF", reputation: 7400, budget: 38000000, stadiumCapacity: 30150 },
            { name: "Berlin Iron", city: "Berlin", primaryColor: "#D4011D", secondaryColor: "#FDE100", reputation: 7300, budget: 28000000, stadiumCapacity: 22012 },
            { name: "Augsburg Falcons", city: "Augsburg", primaryColor: "#FFFFFF", secondaryColor: "#005D47", reputation: 7100, budget: 22000000, stadiumCapacity: 30660 },
            { name: "Cathedral City", city: "Cologne", primaryColor: "#FFFFFF", secondaryColor: "#D60019", reputation: 7300, budget: 30000000, stadiumCapacity: 50000 },
            { name: "Frankfurt Eagles", city: "Frankfurt", primaryColor: "#E1000F", secondaryColor: "#000000", reputation: 7800, budget: 45000000, stadiumCapacity: 51500 },
            { name: "Gladbach Foals", city: "Moenchengladbach", primaryColor: "#FFFFFF", secondaryColor: "#00603C", reputation: 7600, budget: 38000000, stadiumCapacity: 54057 },
            { name: "Bremen River", city: "Bremen", primaryColor: "#00A86B", secondaryColor: "#FFFFFF", reputation: 7500, budget: 32000000, stadiumCapacity: 42100 },
            { name: "Mainz Carnival", city: "Mainz", primaryColor: "#C3002F", secondaryColor: "#FFFFFF", reputation: 7300, budget: 28000000, stadiumCapacity: 33305 },
            { name: "Hamburg Pirates", city: "Hamburg", primaryColor: "#8B4513", secondaryColor: "#FFFFFF", reputation: 7200, budget: 25000000, stadiumCapacity: 29546 },
            { name: "Heidenheim Red-Blue", city: "Heidenheim", primaryColor: "#E30613", secondaryColor: "#0055A4", reputation: 6800, budget: 15000000, stadiumCapacity: 15000 },
            { name: "Bochum Blue", city: "Bochum", primaryColor: "#005BAC", secondaryColor: "#FFFFFF", reputation: 6700, budget: 12000000, stadiumCapacity: 27599 }
        ]
    },
    {
        id: 'ar', region: 'GROUP_D', name: 'Liga Profesional', country: 'Argentina', foreignPlayerChance: 0.3, playerNationality: 'Argentina',
        matchFormat: 'single-round', // Single round-robin: 30 teams play 29 matches each

        logo: '/assets/logos/leagues/liga-profesional.jpg',
        flag: '🇦🇷',
        realTeams: [
            { name: "Buenos Aires Millionaires", city: "Buenos Aires", primaryColor: "#FFFFFF", secondaryColor: "#DA291C", reputation: 8000, budget: 50000000, stadiumCapacity: 84500 },
            { name: "La Boca Xeneizes", city: "Buenos Aires", primaryColor: "#003090", secondaryColor: "#FDB913", reputation: 7900, budget: 45000000, stadiumCapacity: 54000 },
            { name: "Avellaneda Racers", city: "Avellaneda", primaryColor: "#87CEEB", secondaryColor: "#FFFFFF", reputation: 7500, budget: 30000000, stadiumCapacity: 51000 },
            { name: "Avellaneda Devils", city: "Avellaneda", primaryColor: "#DA291C", secondaryColor: "#FFFFFF", reputation: 7400, budget: 25000000, stadiumCapacity: 42000 },
            { name: "Boedo Saints", city: "Buenos Aires", primaryColor: "#003090", secondaryColor: "#DA291C", reputation: 7300, budget: 20000000, stadiumCapacity: 47000 },
            { name: "La Plata Lions", city: "La Plata", primaryColor: "#DA291C", secondaryColor: "#FFFFFF", reputation: 7200, budget: 18000000, stadiumCapacity: 32000 },
            { name: "Velez Fort", city: "Buenos Aires", primaryColor: "#FFFFFF", secondaryColor: "#003090", reputation: 7100, budget: 16000000, stadiumCapacity: 49000 },
            { name: "Rosario Canallas", city: "Rosario", primaryColor: "#003090", secondaryColor: "#FDB913", reputation: 7000, budget: 15000000, stadiumCapacity: 41000 },
            { name: "Rosario Lepers", city: "Rosario", primaryColor: "#000000", secondaryColor: "#DA291C", reputation: 7000, budget: 15000000, stadiumCapacity: 42000 },
            { name: "Cordoba Tall", city: "Córdoba", primaryColor: "#003090", secondaryColor: "#FFFFFF", reputation: 6900, budget: 14000000, stadiumCapacity: 57000 },
            { name: "Paternal Bugs", city: "Buenos Aires", primaryColor: "#DA291C", secondaryColor: "#FFFFFF", reputation: 6800, budget: 12000000, stadiumCapacity: 26000 },
            { name: "Lanus Granate", city: "Lanús", primaryColor: "#800000", secondaryColor: "#FFFFFF", reputation: 6800, budget: 13000000, stadiumCapacity: 47000 },
            { name: "Buenos Aires Storm", city: "Buenos Aires", primaryColor: "#FFFFFF", secondaryColor: "#DA291C", reputation: 6700, budget: 11000000, stadiumCapacity: 48000 },
            { name: "Varela Hawks", city: "Florencio Varela", primaryColor: "#FFFF00", secondaryColor: "#008000", reputation: 6600, budget: 10000000, stadiumCapacity: 18000 },
            { name: "La Plata Wolves", city: "La Plata", primaryColor: "#003090", secondaryColor: "#FFFFFF", reputation: 6500, budget: 9000000, stadiumCapacity: 21000 },
            { name: "Banfield Drills", city: "Banfield", primaryColor: "#008000", secondaryColor: "#FFFFFF", reputation: 6400, budget: 8500000, stadiumCapacity: 34000 },
            { name: "Cordoba Pirates", city: "Córdoba", primaryColor: "#87CEEB", secondaryColor: "#000000", reputation: 6400, budget: 9000000, stadiumCapacity: 30000 },
            { name: "Santa Fe Union", city: "Santa Fe", primaryColor: "#DA291C", secondaryColor: "#FFFFFF", reputation: 6300, budget: 8000000, stadiumCapacity: 26000 },
            { name: "Mendoza Wines", city: "Mendoza", primaryColor: "#003090", secondaryColor: "#FFFFFF", reputation: 6300, budget: 8000000, stadiumCapacity: 14000 },
            { name: "Mendoza Blues", city: "Mendoza", primaryColor: "#000080", secondaryColor: "#FFFFFF", reputation: 6300, budget: 8000000, stadiumCapacity: 40000 },
            { name: "Cordoba Glory", city: "Córdoba", primaryColor: "#DA291C", secondaryColor: "#FFFFFF", reputation: 6200, budget: 7500000, stadiumCapacity: 26000 },
            { name: "Tucuman Giants", city: "San Miguel de Tucumán", primaryColor: "#87CEEB", secondaryColor: "#FFFFFF", reputation: 6200, budget: 7000000, stadiumCapacity: 35000 },
            { name: "Saavedra Squids", city: "Vicente López", primaryColor: "#8B4513", secondaryColor: "#FFFFFF", reputation: 6100, budget: 7000000, stadiumCapacity: 28000 },
            { name: "Victoria Tigers", city: "Victoria", primaryColor: "#003090", secondaryColor: "#DA291C", reputation: 6100, budget: 7500000, stadiumCapacity: 26000 },
            { name: "Barracas Truckers", city: "Buenos Aires", primaryColor: "#DA291C", secondaryColor: "#FFFFFF", reputation: 6000, budget: 6000000, stadiumCapacity: 4000 },
            { name: "Junin Warriors", city: "Junín", primaryColor: "#008000", secondaryColor: "#FFFFFF", reputation: 6000, budget: 6000000, stadiumCapacity: 22000 },
            { name: "Santiago Railways", city: "Santiago del Estero", primaryColor: "#000000", secondaryColor: "#FFFFFF", reputation: 5900, budget: 5500000, stadiumCapacity: 30000 },
            { name: "Riestra Energizers", city: "Buenos Aires", primaryColor: "#000000", secondaryColor: "#FFFFFF", reputation: 5800, budget: 5000000, stadiumCapacity: 3000 },
            { name: "Citadel Saints", city: "San Miguel de Tucumán", primaryColor: "#DA291C", secondaryColor: "#FFFFFF", reputation: 6200, budget: 6500000, stadiumCapacity: 30000 },
            { name: "Mar del Plata Sharks", city: "Mar del Plata", primaryColor: "#FFFF00", secondaryColor: "#008000", reputation: 6000, budget: 6000000, stadiumCapacity: 35000 }
        ]
    },
    {
        id: 'br', region: 'GROUP_D', name: 'Série A', country: 'Brazil', foreignPlayerChance: 0.25, playerNationality: 'Brazil',
        matchFormat: 'double-round', // Brazilian Série A: 20 teams play 38 matches

        logo: '/assets/logos/leagues/ucl.jpg',
        flag: '🇧🇷',
        realTeams: [
            { name: "São Paulo Palms", city: "São Paulo", primaryColor: "#006400", secondaryColor: "#FFFFFF", reputation: 8500, budget: 110000000, stadiumCapacity: 43713 },
            { name: "Rio Flames", city: "Rio de Janeiro", primaryColor: "#DA291C", secondaryColor: "#000000", reputation: 8300, budget: 95000000, stadiumCapacity: 78838 },
            { name: "Belo Horizonte Cruisers", city: "Belo Horizonte", primaryColor: "#003399", secondaryColor: "#FFFFFF", reputation: 8100, budget: 80000000, stadiumCapacity: 61846 },
            { name: "Rio Sailors", city: "Rio de Janeiro", primaryColor: "#000000", secondaryColor: "#FFFFFF", reputation: 7900, budget: 60000000, stadiumCapacity: 78838 },
            { name: "Salvador Bay", city: "Salvador", primaryColor: "#003399", secondaryColor: "#DA291C", reputation: 7900, budget: 60000000, stadiumCapacity: 50025 },
            { name: "Rio Star", city: "Rio de Janeiro", primaryColor: "#000000", secondaryColor: "#FFFFFF", reputation: 7900, budget: 60000000, stadiumCapacity: 78838 },
            { name: "São Paulo Warriors", city: "São Paulo", primaryColor: "#000000", secondaryColor: "#FFFFFF", reputation: 7800, budget: 55000000, stadiumCapacity: 47605 },
            { name: "Santos Beach", city: "Santos", primaryColor: "#FFFFFF", secondaryColor: "#000000", reputation: 7800, budget: 50000000, stadiumCapacity: 16798 },
            { name: "Rio Waves", city: "Rio de Janeiro", primaryColor: "#800000", secondaryColor: "#008000", reputation: 7800, budget: 50000000, stadiumCapacity: 78838 },
            { name: "Porto Alegre Blues", city: "Porto Alegre", primaryColor: "#87CEEB", secondaryColor: "#000000", reputation: 7600, budget: 42000000, stadiumCapacity: 55662 },
            { name: "Belo Horizonte Miners", city: "Belo Horizonte", primaryColor: "#000000", secondaryColor: "#FFFFFF", reputation: 7600, budget: 42000000, stadiumCapacity: 61846 },
            { name: "São Paulo Tigers", city: "São Paulo", primaryColor: "#DA291C", secondaryColor: "#FFFFFF", reputation: 7500, budget: 40000000, stadiumCapacity: 66795 },
            { name: "Bragança Bulls", city: "Bragança Paulista", primaryColor: "#DA291C", secondaryColor: "#FFFFFF", reputation: 7400, budget: 48000000, stadiumCapacity: 17726 },
            { name: "Porto Alegre Reds", city: "Porto Alegre", primaryColor: "#DA291C", secondaryColor: "#FFFFFF", reputation: 7400, budget: 30000000, stadiumCapacity: 50128 },
            { name: "Curitiba Storm", city: "Curitiba", primaryColor: "#DA291C", secondaryColor: "#000000", reputation: 7200, budget: 22000000, stadiumCapacity: 42372 },
            { name: "Salvador Victory", city: "Salvador", primaryColor: "#DA291C", secondaryColor: "#000000", reputation: 7000, budget: 14000000, stadiumCapacity: 36393 },
            { name: "Curitiba Greens", city: "Curitiba", primaryColor: "#006400", secondaryColor: "#FFFFFF", reputation: 6900, budget: 13000000, stadiumCapacity: 40502 },
            { name: "Chapecó Eagles", city: "Chapecó", primaryColor: "#006400", secondaryColor: "#FFFFFF", reputation: 6800, budget: 7000000, stadiumCapacity: 22600 },
            { name: "Mirassol Suns", city: "Mirassol", primaryColor: "#FDB913", secondaryColor: "#008000", reputation: 7000, budget: 15000000, stadiumCapacity: 15000 },
            { name: "Belém Lions", city: "Belém", primaryColor: "#003399", secondaryColor: "#FFFFFF", reputation: 6800, budget: 9000000, stadiumCapacity: 16200 }
        ]
    },
    {
        id: 'na', region: 'GROUP_G', name: 'North American League', country: 'USA', foreignPlayerChance: 0.5, playerNationality: 'North America',
        matchFormat: 'single-round',

        logo: '/assets/logos/leagues/usa_logo.jpg',
        flag: '🇺🇸',
        realTeams: [
            { name: "Miami Vice", city: "Miami", primaryColor: "#F496BE", secondaryColor: "#000000", reputation: 6700, budget: 85000000, stadiumCapacity: 21000 }, // Messi & Friends
            { name: "Galaxy Stars", city: "Los Angeles", primaryColor: "#FFFFFF", secondaryColor: "#00245D", reputation: 6000, budget: 55000000, stadiumCapacity: 27000 },
            { name: "Seattle Emeralds", city: "Seattle", primaryColor: "#5D9732", secondaryColor: "#0033A0", reputation: 5800, budget: 40000000, stadiumCapacity: 68000 },
            { name: "Los Angeles Gold", city: "Los Angeles", primaryColor: "#000000", secondaryColor: "#C39E6C", reputation: 5900, budget: 50000000, stadiumCapacity: 22000 },
            { name: "New York City Blue", city: "New York", primaryColor: "#6CACE4", secondaryColor: "#00205B", reputation: 5700, budget: 45000000, stadiumCapacity: 30000 },
            { name: "New York Energy", city: "New York", primaryColor: "#ED1E36", secondaryColor: "#FFFFFF", reputation: 5500, budget: 38000000, stadiumCapacity: 25000 },
            { name: "Toronto Reds", city: "Toronto", primaryColor: "#AB1E2D", secondaryColor: "#3F4743", reputation: 5400, budget: 36000000, stadiumCapacity: 30000 },
            { name: "Atlanta Stripes", city: "Atlanta", primaryColor: "#80000A", secondaryColor: "#221F1F", reputation: 5600, budget: 40000000, stadiumCapacity: 71000 },
            { name: "Chicago Firemen", city: "Chicago", primaryColor: "#FF0000", secondaryColor: "#011D44", reputation: 5300, budget: 32000000, stadiumCapacity: 61500 },
            { name: "Vancouver Village", city: "Vancouver", primaryColor: "#00245E", secondaryColor: "#9CC2E5", reputation: 5200, budget: 30000000, stadiumCapacity: 22120 },
            { name: "Montreal Impact", city: "Montreal", primaryColor: "#0033A1", secondaryColor: "#000000", reputation: 5200, budget: 30000000, stadiumCapacity: 19619 },
            { name: "Philadelphia Union", city: "Philadelphia", primaryColor: "#071B2C", secondaryColor: "#B2985F", reputation: 5400, budget: 35000000, stadiumCapacity: 18500 },
            { name: "Columbus Crew", city: "Columbus", primaryColor: "#FEF200", secondaryColor: "#000000", reputation: 5500, budget: 36000000, stadiumCapacity: 20371 },
            { name: "Portland Timbers", city: "Portland", primaryColor: "#004812", secondaryColor: "#EAE70F", reputation: 5400, budget: 34000000, stadiumCapacity: 25218 },
            { name: "Salt Lake Royals", city: "Salt Lake City", primaryColor: "#B30838", secondaryColor: "#012B5C", reputation: 5200, budget: 32000000, stadiumCapacity: 20213 },
            { name: "Houston Space", city: "Houston", primaryColor: "#FF6B00", secondaryColor: "#000000", reputation: 5200, budget: 32000000, stadiumCapacity: 22039 },
            { name: "Dallas Burn", city: "Dallas", primaryColor: "#BF0D3E", secondaryColor: "#00205B", reputation: 5200, budget: 32000000, stadiumCapacity: 20500 },
            { name: "Kansas City Wizards", city: "Kansas City", primaryColor: "#91B0D5", secondaryColor: "#002A5C", reputation: 5300, budget: 33000000, stadiumCapacity: 18467 },
            { name: "San Jose Quakes", city: "San Jose", primaryColor: "#000000", secondaryColor: "#0067B1", reputation: 5100, budget: 30000000, stadiumCapacity: 18000 },
            { name: "Orlando Lions", city: "Orlando", primaryColor: "#612B9B", secondaryColor: "#FDE302", reputation: 5400, budget: 34000000, stadiumCapacity: 25500 },
            { name: "Cincinnati Royals", city: "Cincinnati", primaryColor: "#F05323", secondaryColor: "#171C2C", reputation: 5400, budget: 36000000, stadiumCapacity: 26000 },
            { name: "St. Louis Spirit", city: "St. Louis", primaryColor: "#E9004C", secondaryColor: "#0F1823", reputation: 5300, budget: 34000000, stadiumCapacity: 22500 },
            { name: "Nashville Music", city: "Nashville", primaryColor: "#ECE81A", secondaryColor: "#1F1646", reputation: 5300, budget: 35000000, stadiumCapacity: 30000 },
            { name: "Austin Verdes", city: "Austin", primaryColor: "#00B140", secondaryColor: "#000000", reputation: 5300, budget: 35000000, stadiumCapacity: 20738 },
            { name: "Charlotte Crowns", city: "Charlotte", primaryColor: "#0085CA", secondaryColor: "#000000", reputation: 5200, budget: 35000000, stadiumCapacity: 38000 }
        ]
    },
    {
        id: 'mx', region: 'GROUP_G', name: 'Liga MX', country: 'Mexico', foreignPlayerChance: 0.4, playerNationality: 'Mexico',
        matchFormat: 'double-round',

        logo: '/assets/logos/leagues/mexico_logo.jpg',
        flag: '🇲🇽',
        realTeams: [
            { name: "Toluca Devils", city: "Toluca", primaryColor: "#FF0000", secondaryColor: "#FFFFFF", reputation: 5400, budget: 35000000, stadiumCapacity: 25000 },
            { name: "Monterrey Tigers", city: "Monterrey", primaryColor: "#FDB913", secondaryColor: "#005596", reputation: 6000, budget: 55000000, stadiumCapacity: 42000 },
            { name: "Mexico City Cement", city: "Mexico City", primaryColor: "#00519E", secondaryColor: "#FFFFFF", reputation: 5800, budget: 45000000, stadiumCapacity: 87000 },
            { name: "Mexico Eagles", city: "Mexico City", primaryColor: "#F5E216", secondaryColor: "#001E62", reputation: 6000, budget: 50000000, stadiumCapacity: 87000 },
            { name: "Monterrey Rays", city: "Monterrey", primaryColor: "#092246", secondaryColor: "#FFFFFF", reputation: 5900, budget: 52000000, stadiumCapacity: 53500 },
            { name: "Guadalajara Goats", city: "Guadalajara", primaryColor: "#E30613", secondaryColor: "#002758", reputation: 6000, budget: 48000000, stadiumCapacity: 46000 },
            { name: "Tijuana Dogs", city: "Tijuana", primaryColor: "#FF0000", secondaryColor: "#000000", reputation: 5000, budget: 25000000, stadiumCapacity: 27000 },
            { name: "Juarez Braves", city: "Juárez", primaryColor: "#00FF00", secondaryColor: "#000000", reputation: 4800, budget: 20000000, stadiumCapacity: 19000 },
            { name: "Pachuca Gophers", city: "Pachuca", primaryColor: "#000080", secondaryColor: "#FFFFFF", reputation: 5300, budget: 30000000, stadiumCapacity: 27000 },
            { name: "Mexico City Pumas", city: "Mexico City", primaryColor: "#D4AF37", secondaryColor: "#000080", reputation: 5500, budget: 35000000, stadiumCapacity: 58000 },
            { name: "Laguna Warriors", city: "Torreón", primaryColor: "#008000", secondaryColor: "#FFFFFF", reputation: 5200, budget: 28000000, stadiumCapacity: 30000 },
            { name: "Queretaro Roosters", city: "Querétaro", primaryColor: "#000080", secondaryColor: "#000000", reputation: 4700, budget: 18000000, stadiumCapacity: 33000 },
            { name: "Necaxa Lightning", city: "Aguascalientes", primaryColor: "#FF0000", secondaryColor: "#FFFFFF", reputation: 4800, budget: 20000000, stadiumCapacity: 23000 },
            { name: "Guadalajara Foxes", city: "Guadalajara", primaryColor: "#FF0000", secondaryColor: "#000000", reputation: 5100, budget: 25000000, stadiumCapacity: 55000 },
            { name: "San Luis Athletics", city: "San Luis Potosí", primaryColor: "#FF0000", secondaryColor: "#FFFFFF", reputation: 4600, budget: 15000000, stadiumCapacity: 25000 },
            { name: "Mazatlan Cannons", city: "Mazatlán", primaryColor: "#800080", secondaryColor: "#FFFFFF", reputation: 4500, budget: 14000000, stadiumCapacity: 20000 },
            { name: "Leon Emeralds", city: "León", primaryColor: "#008000", secondaryColor: "#FFFFFF", reputation: 5200, budget: 30000000, stadiumCapacity: 31000 },
            { name: "Puebla Sashes", city: "Puebla", primaryColor: "#FFFFFF", secondaryColor: "#000080", reputation: 4800, budget: 20000000, stadiumCapacity: 51000 }
        ]
    },
    {
        id: 'sa', region: 'GROUP_E', name: 'Saudi Pro League', country: 'Saudi Arabia', foreignPlayerChance: 0.7, playerNationality: 'Saudi Arabia',
        matchFormat: 'double-round',

        logo: '/assets/logos/leagues/saudi_logo.jpg',
        flag: '🇸🇦',
        realTeams: [
            { name: "Riyadh Blue Waves", city: "Riyadh", primaryColor: "#0055A5", secondaryColor: "#FFFFFF", reputation: 8000, budget: 150000000, stadiumCapacity: 68000 },
            { name: "Riyadh Knights", city: "Riyadh", primaryColor: "#FFFF00", secondaryColor: "#0000CC", reputation: 7900, budget: 140000000, stadiumCapacity: 25000 },
            { name: "Jeddah Green", city: "Jeddah", primaryColor: "#006400", secondaryColor: "#FFFFFF", reputation: 7600, budget: 100000000, stadiumCapacity: 62000 },
            { name: "Jeddah Tigers", city: "Jeddah", primaryColor: "#FFF200", secondaryColor: "#000000", reputation: 7800, budget: 110000000, stadiumCapacity: 62000 },
            { name: "Riyadh Youth", city: "Riyadh", primaryColor: "#000000", secondaryColor: "#FFFFFF", reputation: 6900, budget: 45000000, stadiumCapacity: 22000 },
            { name: "Al-Qadsiah", city: "Khobar", primaryColor: "#800000", secondaryColor: "#FFFF00", reputation: 7400, budget: 85000000, stadiumCapacity: 15000 },
            { name: "Al-Taawoun", city: "Buraidah", primaryColor: "#FFFF00", secondaryColor: "#0000FF", reputation: 6500, budget: 35000000, stadiumCapacity: 25000 },
            { name: "Dammam Commandos", city: "Dammam", primaryColor: "#007A33", secondaryColor: "#C8102E", reputation: 6800, budget: 55000000, stadiumCapacity: 35000 },
            { name: "Al-Khaleej", city: "Saihat", primaryColor: "#FFFF00", secondaryColor: "#008000", reputation: 5500, budget: 22000000, stadiumCapacity: 10000 },
            { name: "NEOM SC", city: "Tabuk", primaryColor: "#000000", secondaryColor: "#FFFFFF", reputation: 6000, budget: 60000000, stadiumCapacity: 12000 },
            { name: "Al-Fateh", city: "Al-Hasa", primaryColor: "#009900", secondaryColor: "#FFFFFF", reputation: 5800, budget: 25000000, stadiumCapacity: 20000 },
            { name: "Al-Hazem", city: "Ar Rass", primaryColor: "#FF0000", secondaryColor: "#FFFF00", reputation: 5200, budget: 15000000, stadiumCapacity: 7000 },
            { name: "Al-Kholood", city: "Ar Rass", primaryColor: "#800000", secondaryColor: "#FFFFFF", reputation: 5100, budget: 12000000, stadiumCapacity: 7000 },
            { name: "Al-Fayha", city: "Al Majma'ah", primaryColor: "#FF6600", secondaryColor: "#0000FF", reputation: 5500, budget: 18000000, stadiumCapacity: 7000 },
            { name: "Damac FC", city: "Khamis Mushait", primaryColor: "#800000", secondaryColor: "#FFFF00", reputation: 5400, budget: 16000000, stadiumCapacity: 20000 },
            { name: "Al-Riyadh", city: "Riyadh", primaryColor: "#000000", secondaryColor: "#DF0024", reputation: 5300, budget: 14000000, stadiumCapacity: 15000 },
            { name: "Al-Okhdood", city: "Najran", primaryColor: "#87CEEB", secondaryColor: "#FFFFFF", reputation: 5200, budget: 13000000, stadiumCapacity: 15000 },
            { name: "Al-Najma", city: "Unaizah", primaryColor: "#008000", secondaryColor: "#FFFFFF", reputation: 4800, budget: 8000000, stadiumCapacity: 5000 }
        ]
    },
    {
        id: 'eg', region: 'GROUP_F', name: 'Egyptian Premier League', country: 'Egypt', foreignPlayerChance: 0.2, playerNationality: 'Egypt',
        matchFormat: 'double-round',

        logo: '/assets/logos/leagues/egypt_logo.jpg',
        flag: '🇪🇬',
        realTeams: [
            { name: "Cleopatra FC", city: "Giza", primaryColor: "#800000", secondaryColor: "#D4AF37", reputation: 5000, budget: 30000000, stadiumCapacity: 15000 },
            { name: "Pyramids FC", city: "Cairo", primaryColor: "#000080", secondaryColor: "#87CEEB", reputation: 5800, budget: 50000000, stadiumCapacity: 30000 },
            { name: "Cairo Red Devils", city: "Cairo", primaryColor: "#D21616", secondaryColor: "#FFFFFF", reputation: 6200, budget: 45000000, stadiumCapacity: 75000 },
            { name: "Wadi Degla", city: "Cairo", primaryColor: "#FFFF00", secondaryColor: "#000000", reputation: 4800, budget: 15000000, stadiumCapacity: 22000 },
            { name: "Cairo Knights", city: "Cairo", primaryColor: "#FFFFFF", secondaryColor: "#D21616", reputation: 6000, budget: 40000000, stadiumCapacity: 75000 },
            { name: "El Masry", city: "Port Said", primaryColor: "#008000", secondaryColor: "#FFFFFF", reputation: 5000, budget: 15000000, stadiumCapacity: 18000 },
            { name: "Zed FC", city: "Giza", primaryColor: "#000000", secondaryColor: "#00FF00", reputation: 4600, budget: 18000000, stadiumCapacity: 10000 },
            { name: "Enppi", city: "Cairo", primaryColor: "#000080", secondaryColor: "#FFFFFF", reputation: 4700, budget: 14000000, stadiumCapacity: 16000 },
            { name: "Smouha", city: "Alexandria", primaryColor: "#0000FF", secondaryColor: "#FFFFFF", reputation: 4800, budget: 13000000, stadiumCapacity: 22000 },
            { name: "Petrojet", city: "Suez", primaryColor: "#FF0000", secondaryColor: "#0000FF", reputation: 4500, budget: 10000000, stadiumCapacity: 27000 },
            { name: "El Gouna", city: "El Gouna", primaryColor: "#FFFFFF", secondaryColor: "#000000", reputation: 4400, budget: 9000000, stadiumCapacity: 12000 },
            { name: "Bank El Ahly", city: "Cairo", primaryColor: "#FFA500", secondaryColor: "#000000", reputation: 4500, budget: 16000000, stadiumCapacity: 18000 },
            { name: "Modern Sport", city: "Cairo", primaryColor: "#FF0000", secondaryColor: "#000000", reputation: 4600, budget: 15000000, stadiumCapacity: 12000 },
            { name: "Ghazl El Mahalla", city: "El Mahalla", primaryColor: "#00FFFF", secondaryColor: "#000000", reputation: 4300, budget: 6000000, stadiumCapacity: 20000 },
            { name: "El Mokawloon", city: "Cairo", primaryColor: "#FFFF00", secondaryColor: "#000000", reputation: 4400, budget: 8000000, stadiumCapacity: 35000 },
            { name: "Harras El Hodoud", city: "Alexandria", primaryColor: "#FF0000", secondaryColor: "#000000", reputation: 4200, budget: 5000000, stadiumCapacity: 22000 },
            { name: "Ismaily", city: "Ismailia", primaryColor: "#FFFF00", secondaryColor: "#0000FF", reputation: 4900, budget: 10000000, stadiumCapacity: 18500 },
            { name: "Ittihad Alexandria", city: "Alexandria", primaryColor: "#008000", secondaryColor: "#FFFFFF", reputation: 4800, budget: 11000000, stadiumCapacity: 22000 }
        ]
    },
    {
        id: 'jp', region: 'GROUP_E', name: 'J1 League', country: 'Japan', foreignPlayerChance: 0.3, playerNationality: 'Japan',
        matchFormat: 'double-round',

        logo: '/assets/logos/leagues/japan_logo.jpg',
        flag: '🇯🇵',
        realTeams: [
            { name: "Kashima Antlers", city: "Kashima", primaryColor: "#B50029", secondaryColor: "#000000", reputation: 5800, budget: 45000000, stadiumCapacity: 40728 },
            { name: "Gamba Osaka", city: "Suita", primaryColor: "#003399", secondaryColor: "#000000", reputation: 5700, budget: 42000000, stadiumCapacity: 39694 },
            { name: "Urawa Red Diamonds", city: "Saitama", primaryColor: "#E6002D", secondaryColor: "#000000", reputation: 6100, budget: 50000000, stadiumCapacity: 63700 }, // Existing
            { name: "Kawasaki Frontale", city: "Kawasaki", primaryColor: "#2EA7E0", secondaryColor: "#000000", reputation: 5950, budget: 48000000, stadiumCapacity: 26232 }, // Existing
            { name: "Yokohama F. Marinos", city: "Yokohama", primaryColor: "#003399", secondaryColor: "#E60012", reputation: 6050, budget: 52000000, stadiumCapacity: 72327 }, // Existing
            { name: "Vissel Kobe", city: "Kobe", primaryColor: "#950029", secondaryColor: "#FFFFFF", reputation: 6200, budget: 55000000, stadiumCapacity: 30132 }, // Existing
            { name: "Sanfrecce Hiroshima", city: "Hiroshima", primaryColor: "#3F186D", secondaryColor: "#FFFFFF", reputation: 5700, budget: 38000000, stadiumCapacity: 36894 }, // Existing -> Updated Data
            { name: "FC Tokyo", city: "Chofu", primaryColor: "#003399", secondaryColor: "#E60012", reputation: 5500, budget: 40000000, stadiumCapacity: 49970 },
            { name: "Cerezo Osaka", city: "Osaka", primaryColor: "#F49AC1", secondaryColor: "#00205B", reputation: 5500, budget: 38000000, stadiumCapacity: 24481 },
            { name: "Nagoya Grampus", city: "Nagoya", primaryColor: "#DA291C", secondaryColor: "#FDB913", reputation: 5400, budget: 35000000, stadiumCapacity: 45000 },
            { name: "Kashiwa Reysol", city: "Kashiwa", primaryColor: "#FFF200", secondaryColor: "#000000", reputation: 5200, budget: 30000000, stadiumCapacity: 15349 },
            { name: "Tokyo Verdy", city: "Chofu", primaryColor: "#006934", secondaryColor: "#FFFFFF", reputation: 5000, budget: 22000000, stadiumCapacity: 49970 },
            { name: "Machida Zelvia", city: "Machida", primaryColor: "#003399", secondaryColor: "#FFFFFF", reputation: 5100, budget: 25000000, stadiumCapacity: 15489 },
            { name: "Kyoto Sanga", city: "Kyoto", primaryColor: "#741B7C", secondaryColor: "#FFFFFF", reputation: 4900, budget: 20000000, stadiumCapacity: 21600 },
            { name: "Avispa Fukuoka", city: "Fukuoka", primaryColor: "#003399", secondaryColor: "#A4A8AC", reputation: 4900, budget: 18000000, stadiumCapacity: 22563 },
            { name: "JEF United Chiba", city: "Chiba", primaryColor: "#FFFF00", secondaryColor: "#009933", reputation: 4700, budget: 15000000, stadiumCapacity: 19781 },
            { name: "V-Varen Nagasaki", city: "Nagasaki", primaryColor: "#003399", secondaryColor: "#F26522", reputation: 4600, budget: 14000000, stadiumCapacity: 20246 },
            { name: "Shimizu S-Pulse", city: "Shizuoka", primaryColor: "#FFA500", secondaryColor: "#003399", reputation: 4800, budget: 25000000, stadiumCapacity: 20248 },
            { name: "Mito HollyHock", city: "Mito", primaryColor: "#003399", secondaryColor: "#FFFFFF", reputation: 4400, budget: 10000000, stadiumCapacity: 12000 },
            { name: "Fagiano Okayama", city: "Okayama", primaryColor: "#B50029", secondaryColor: "#003399", reputation: 4500, budget: 12000000, stadiumCapacity: 20000 }
        ]
    },
    {
        id: 'kr', region: 'GROUP_E', name: 'K League 1', country: 'South Korea', foreignPlayerChance: 0.3, playerNationality: 'South Korea',
        matchFormat: 'double-round',

        logo: '/assets/logos/leagues/korea_logo.jpg',
        flag: '🇰🇷',
        realTeams: [
            { name: "Ulsan Tigers", city: "Ulsan", primaryColor: "#003280", secondaryColor: "#FFCC00", reputation: 5900, budget: 45000000, stadiumCapacity: 44102 }, // Existing (Updated Name)
            { name: "Jeonju Motors", city: "Jeonju", primaryColor: "#009900", secondaryColor: "#000080", reputation: 6000, budget: 48000000, stadiumCapacity: 42477 }, // Existing
            { name: "Pohang Steelers", city: "Pohang", primaryColor: "#000000", secondaryColor: "#FF0000", reputation: 5700, budget: 35000000, stadiumCapacity: 17443 }, // Existing
            { name: "Seoul City", city: "Seoul", primaryColor: "#000000", secondaryColor: "#FF0000", reputation: 5600, budget: 38000000, stadiumCapacity: 66704 }, // Existing
            { name: "Daejeon Hana Citizen", city: "Daejeon", primaryColor: "#4B0082", secondaryColor: "#800000", reputation: 5400, budget: 32000000, stadiumCapacity: 40535 },
            { name: "Gimcheon Sangmu", city: "Gimcheon", primaryColor: "#FF0000", secondaryColor: "#000000", reputation: 5300, budget: 15000000, stadiumCapacity: 25000 },
            { name: "Gangwon FC", city: "Gangwon", primaryColor: "#FF6600", secondaryColor: "#FFFFFF", reputation: 5200, budget: 18000000, stadiumCapacity: 13500 },
            { name: "Jeju United", city: "Seogwipo", primaryColor: "#FF6600", secondaryColor: "#000000", reputation: 5300, budget: 20000000, stadiumCapacity: 29791 },
            { name: "Incheon United", city: "Incheon", primaryColor: "#0000FF", secondaryColor: "#000000", reputation: 5100, budget: 18000000, stadiumCapacity: 20891 },
            { name: "Gwangju FC", city: "Gwangju", primaryColor: "#FFFF00", secondaryColor: "#DA291C", reputation: 5200, budget: 16000000, stadiumCapacity: 10007 },
            { name: "FC Anyang", city: "Anyang", primaryColor: "#4B0082", secondaryColor: "#FFFFFF", reputation: 4800, budget: 12000000, stadiumCapacity: 17143 },
            { name: "Bucheon FC 1995", city: "Bucheon", primaryColor: "#FF0000", secondaryColor: "#000000", reputation: 4700, budget: 10000000, stadiumCapacity: 34456 }
        ]
    },
    {
        id: 'au', region: 'GROUP_E', name: 'A-League Men', country: 'Australia', foreignPlayerChance: 0.4, playerNationality: 'Australia',
        matchFormat: 'double-round',

        logo: '/assets/logos/leagues/aleague_logo.jpg',
        flag: '🇦🇺',
        realTeams: [
            { name: "Central Coast Mariners", city: "Gosford", primaryColor: "#FFFF00", secondaryColor: "#000080", reputation: 5300, budget: 15000000, stadiumCapacity: 20059 },
            { name: "Wellington Phoenix", city: "Wellington", primaryColor: "#FFFF00", secondaryColor: "#000000", reputation: 5000, budget: 12000000, stadiumCapacity: 34500 },
            { name: "Auckland FC", city: "Auckland", primaryColor: "#000000", secondaryColor: "#0000FF", reputation: 4800, budget: 20000000, stadiumCapacity: 25000 },
            { name: "Sydney FC", city: "Sydney", primaryColor: "#87CEEB", secondaryColor: "#000080", reputation: 5500, budget: 25000000, stadiumCapacity: 45500 }, // Existing
            { name: "Melbourne Victory", city: "Melbourne", primaryColor: "#000080", secondaryColor: "#FFFFFF", reputation: 5600, budget: 28000000, stadiumCapacity: 30050 }, // Existing
            { name: "Melbourne City", city: "Melbourne", primaryColor: "#87CEEB", secondaryColor: "#FFFFFF", reputation: 5700, budget: 40000000, stadiumCapacity: 30050 }, // Existing (Corrected Name)
            { name: "Macarthur FC", city: "Campbelltown", primaryColor: "#FFFFFF", secondaryColor: "#000000", reputation: 4900, budget: 14000000, stadiumCapacity: 17500 },
            { name: "WS Wanderers", city: "Parramatta", primaryColor: "#FF0000", secondaryColor: "#000000", reputation: 5400, budget: 22000000, stadiumCapacity: 30000 },
            { name: "Adelaide United", city: "Adelaide", primaryColor: "#FF0000", secondaryColor: "#000000", reputation: 5200, budget: 16000000, stadiumCapacity: 16500 },
            { name: "Brisbane Roar", city: "Brisbane", primaryColor: "#FFA500", secondaryColor: "#000000", reputation: 5100, budget: 15000000, stadiumCapacity: 52500 },
            { name: "Western United", city: "Melbourne", primaryColor: "#008000", secondaryColor: "#000000", reputation: 4800, budget: 14000000, stadiumCapacity: 15000 },
            { name: "Newcastle Jets", city: "Newcastle", primaryColor: "#0000FF", secondaryColor: "#D4AF37", reputation: 4700, budget: 10000000, stadiumCapacity: 33000 },
            { name: "Perth Glory", city: "Perth", primaryColor: "#800080", secondaryColor: "#FFFFFF", reputation: 4800, budget: 13000000, stadiumCapacity: 20500 },


        ]
    },

    {
        id: 'car', region: 'GROUP_H', name: 'Caribbean Super League', country: 'Jamaica', foreignPlayerChance: 0.5, playerNationality: 'Caribbean',
        matchFormat: 'double-round',

        logo: '/assets/logos/leagues/caribbean_logo.jpg',
        flag: '🏳️',
        realTeams: [
            // Jamaica
            { name: "Kingston Bay United", city: "Kingston", primaryColor: "#000000", secondaryColor: "#FFFF00", reputation: 5500, budget: 5000000, stadiumCapacity: 35000 },
            { name: "Montego Bay Waves", city: "Montego Bay", primaryColor: "#0000FF", secondaryColor: "#FFFFFF", reputation: 5300, budget: 4500000, stadiumCapacity: 20000 },
            { name: "St. Lucia Kings FC", city: "Castries", primaryColor: "#000080", secondaryColor: "#FFFF00", reputation: 5000, budget: 3500000, stadiumCapacity: 15000 },
            { name: "Cavalier Town FC", city: "Kingston", primaryColor: "#FFFFFF", secondaryColor: "#000000", reputation: 5200, budget: 4000000, stadiumCapacity: 10000 },
            // Trinidad & Tobago
            { name: "Port of Spain Warriors", city: "Port of Spain", primaryColor: "#FF0000", secondaryColor: "#000000", reputation: 3900, budget: 2200000, stadiumCapacity: 23000 },
            { name: "Trinbago Riders FC", city: "Port of Spain", primaryColor: "#800080", secondaryColor: "#FFFFFF", reputation: 4000, budget: 2500000, stadiumCapacity: 25000 },
            { name: "San Juan Strikers", city: "San Juan", primaryColor: "#008000", secondaryColor: "#FFFF00", reputation: 3500, budget: 1000000, stadiumCapacity: 8000 },
            // Dominican Republic
            { name: "Cibao Orange FC", city: "Santiago", primaryColor: "#FFA500", secondaryColor: "#000000", reputation: 4100, budget: 2800000, stadiumCapacity: 10000 },
            { name: "O&M University", city: "Santo Domingo", primaryColor: "#000080", secondaryColor: "#D4AF37", reputation: 3600, budget: 1200000, stadiumCapacity: 15000 },
            { name: "Atlántico Blue Stars", city: "Puerto Plata", primaryColor: "#0000FF", secondaryColor: "#FFFFFF", reputation: 3500, budget: 900000, stadiumCapacity: 5000 },
            // Haiti
            { name: "Port-au-Prince AC", city: "Port-au-Prince", primaryColor: "#0000FF", secondaryColor: "#FFFFFF", reputation: 3700, budget: 800000, stadiumCapacity: 15000 },
            { name: "Cavaly SC", city: "Léogâne", primaryColor: "#FF0000", secondaryColor: "#FFFFFF", reputation: 3600, budget: 600000, stadiumCapacity: 10000 },
            // Barbados
            { name: "Barbados Royal Club", city: "Bridgetown", primaryColor: "#0000FF", secondaryColor: "#FFFF00", reputation: 3400, budget: 500000, stadiumCapacity: 12000 },
            { name: "Weymouth Wales FC", city: "Bridgetown", primaryColor: "#008000", secondaryColor: "#FFFFFF", reputation: 3400, budget: 450000, stadiumCapacity: 8000 },
            // Guyana
            { name: "Guyana Amazon FC", city: "Georgetown", primaryColor: "#008000", secondaryColor: "#FFFF00", reputation: 3500, budget: 600000, stadiumCapacity: 15000 },
            { name: "Western Tigers SC", city: "Georgetown", primaryColor: "#000000", secondaryColor: "#FDB913", reputation: 3400, budget: 500000, stadiumCapacity: 5000 }
        ]
    },
    {
        id: 'co', region: 'GROUP_D', name: 'Liga BetPlay (Colombia)', country: 'Colombia', foreignPlayerChance: 0.2, playerNationality: 'Colombia',
        matchFormat: 'double-round',

        logo: '/assets/logos/leagues/colombia_logo.jpg',
        flag: '🇨🇴',
        realTeams: [
            { name: "Medellin Green", city: "Medellin", primaryColor: "#008000", secondaryColor: "#FFFFFF", reputation: 5200, budget: 15000000, stadiumCapacity: 40000 },
            { name: "Bogota Blues", city: "Bogota", primaryColor: "#0000FF", secondaryColor: "#FFFFFF", reputation: 5100, budget: 14000000, stadiumCapacity: 36000 },
            { name: "Cali Devils", city: "Cali", primaryColor: "#FF0000", secondaryColor: "#FFFFFF", reputation: 5000, budget: 12000000, stadiumCapacity: 35000 },
            { name: "Barranquilla Sharks", city: "Barranquilla", primaryColor: "#FF0000", secondaryColor: "#FFFFFF", reputation: 4900, budget: 13000000, stadiumCapacity: 46000 },
            { name: "Bogota Cardinals", city: "Bogota", primaryColor: "#FF0000", secondaryColor: "#FFFFFF", reputation: 4800, budget: 10000000, stadiumCapacity: 36000 },
            { name: "Medellin Red", city: "Medellin", primaryColor: "#FF0000", secondaryColor: "#0000FF", reputation: 4800, budget: 10000000, stadiumCapacity: 40000 },
            { name: "Cali Sugar", city: "Cali", primaryColor: "#008000", secondaryColor: "#FFFFFF", reputation: 4700, budget: 9000000, stadiumCapacity: 52000 },
            { name: "Ibague Gold", city: "Ibague", primaryColor: "#800000", secondaryColor: "#FFD700", reputation: 4600, budget: 8000000, stadiumCapacity: 28000 },
            { name: "Manizales White", city: "Manizales", primaryColor: "#FFFFFF", secondaryColor: "#000000", reputation: 4500, budget: 7000000, stadiumCapacity: 28000 },
            { name: "Bucaramanga Leopards", city: "Bucaramanga", primaryColor: "#FFFF00", secondaryColor: "#008000", reputation: 4400, budget: 6000000, stadiumCapacity: 25000 },
            { name: "Pereira Wolves", city: "Pereira", primaryColor: "#FFFF00", secondaryColor: "#FF0000", reputation: 4400, budget: 6000000, stadiumCapacity: 30000 },
            { name: "Pasto Volcano", city: "Pasto", primaryColor: "#FF0000", secondaryColor: "#FFFF00", reputation: 4300, budget: 5000000, stadiumCapacity: 20000 },
            { name: "Bogota Fort", city: "Bogota", primaryColor: "#0000FF", secondaryColor: "#FFFFFF", reputation: 4200, budget: 4000000, stadiumCapacity: 8000 },
            { name: "Rionegro Eagles", city: "Rionegro", primaryColor: "#DAA520", secondaryColor: "#000000", reputation: 4300, budget: 5000000, stadiumCapacity: 10000 },
            { name: "Cucuta Border", city: "Cucuta", primaryColor: "#FF0000", secondaryColor: "#000000", reputation: 4400, budget: 5500000, stadiumCapacity: 40000 },
            { name: "Tunja Checkers", city: "Tunja", primaryColor: "#000000", secondaryColor: "#FFFFFF", reputation: 4200, budget: 4000000, stadiumCapacity: 20000 }
        ]
    },
    {
        id: 'cl', region: 'GROUP_D', name: 'Campeonato Nacional (Chile)', country: 'Chile', foreignPlayerChance: 0.3, playerNationality: 'Chile',
        matchFormat: 'double-round',

        logo: '/assets/logos/leagues/chile_logo.jpg',
        flag: '🇨🇱',
        realTeams: [
            { name: "Santiago Chiefs", city: "Santiago", primaryColor: "#FFFFFF", secondaryColor: "#000000", reputation: 6600, budget: 28000000, stadiumCapacity: 47000 },
            { name: "Santiago Scholars", city: "Santiago", primaryColor: "#0000FF", secondaryColor: "#FF0000", reputation: 6500, budget: 25000000, stadiumCapacity: 48000 },
            { name: "Santiago Crusaders", city: "Santiago", primaryColor: "#FFFFFF", secondaryColor: "#0000FF", reputation: 6200, budget: 18000000, stadiumCapacity: 14000 },
            { name: "Desert Miners", city: "El Salvador", primaryColor: "#FFA500", secondaryColor: "#000000", reputation: 4700, budget: 9000000, stadiumCapacity: 12000 },
            { name: "Santiago Green", city: "Santiago", primaryColor: "#008000", secondaryColor: "#FFFFFF", reputation: 4600, budget: 8000000, stadiumCapacity: 12000 },
            { name: "Viña Gold", city: "Viña del Mar", primaryColor: "#FFD700", secondaryColor: "#0000FF", reputation: 4600, budget: 7500000, stadiumCapacity: 22000 },
            { name: "Coquimbo Pirates", city: "Coquimbo", primaryColor: "#FFFF00", secondaryColor: "#000000", reputation: 4500, budget: 7000000, stadiumCapacity: 18000 },
            { name: "Talcahuano Steel", city: "Talcahuano", primaryColor: "#000000", secondaryColor: "#0000FF", reputation: 4500, budget: 6500000, stadiumCapacity: 10000 },
            { name: "Calera Red", city: "La Calera", primaryColor: "#FF0000", secondaryColor: "#FFFFFF", reputation: 4400, budget: 6000000, stadiumCapacity: 9000 },
            { name: "Serena Garnet", city: "La Serena", primaryColor: "#800000", secondaryColor: "#FFFFFF", reputation: 4300, budget: 5000000, stadiumCapacity: 18000 },
            { name: "Rancagua Celeste", city: "Rancagua", primaryColor: "#00FFFF", secondaryColor: "#000000", reputation: 4600, budget: 8000000, stadiumCapacity: 13000 },
            { name: "Santiago Tricolor", city: "Santiago", primaryColor: "#FF0000", secondaryColor: "#008000", reputation: 4600, budget: 8500000, stadiumCapacity: 8000 },
            { name: "Chillan Red", city: "Chillán", primaryColor: "#FF0000", secondaryColor: "#FFFFFF", reputation: 4500, budget: 7000000, stadiumCapacity: 12000 },
            { name: "Concepcion Purple", city: "Concepción", primaryColor: "#800080", secondaryColor: "#FFFFFF", reputation: 4300, budget: 5000000, stadiumCapacity: 30000 },
            { name: "Concepcion Uni", city: "Concepción", primaryColor: "#FFFF00", secondaryColor: "#0000FF", reputation: 4400, budget: 6000000, stadiumCapacity: 30000 },
            { name: "Limache Red", city: "Limache", primaryColor: "#FF0000", secondaryColor: "#000000", reputation: 4200, budget: 4000000, stadiumCapacity: 5000 }
        ]
    },
    {
        id: 'uy', region: 'GROUP_D', name: 'Campeonato Uruguayo', country: 'Uruguay', foreignPlayerChance: 0.2, playerNationality: 'Uruguay',
        matchFormat: 'double-round',

        logo: '/assets/logos/leagues/uruguay_logo.jpg',
        flag: '🇺🇾',
        realTeams: [
            { name: "Montevideo Tricolor", city: "Montevideo", primaryColor: "#FFFFFF", secondaryColor: "#000080", reputation: 6800, budget: 30000000, stadiumCapacity: 34000 },
            { name: "Montevideo Coal", city: "Montevideo", primaryColor: "#FFFF00", secondaryColor: "#000000", reputation: 6800, budget: 30000000, stadiumCapacity: 40000 },
            { name: "Belvedere Blue", city: "Montevideo", primaryColor: "#000000", secondaryColor: "#0000FF", reputation: 4900, budget: 14000000, stadiumCapacity: 10000 },
            { name: "Parque Violet", city: "Montevideo", primaryColor: "#800080", secondaryColor: "#FFFFFF", reputation: 4800, budget: 12000000, stadiumCapacity: 12000 },
            { name: "Jardines Striped", city: "Montevideo", primaryColor: "#FFFFFF", secondaryColor: "#000000", reputation: 4700, budget: 10000000, stadiumCapacity: 18000 },
            { name: "Prado Bohemians", city: "Montevideo", primaryColor: "#FFFFFF", secondaryColor: "#000000", reputation: 4600, budget: 9000000, stadiumCapacity: 11000 },
            { name: "Montevideo Tailors", city: "Montevideo", primaryColor: "#FF0000", secondaryColor: "#008000", reputation: 4500, budget: 8000000, stadiumCapacity: 5000 },
            { name: "Montevideo Pioneers", city: "Montevideo", primaryColor: "#0000FF", secondaryColor: "#FF0000", reputation: 4200, budget: 5000000, stadiumCapacity: 5000 },
            { name: "Montevideo LightBlue", city: "Montevideo", primaryColor: "#00BFFF", secondaryColor: "#FFFFFF", reputation: 4600, budget: 15000000, stadiumCapacity: 14000 }, // City Group
            { name: "Villa Albiceleste", city: "Montevideo", primaryColor: "#0000FF", secondaryColor: "#FFFFFF", reputation: 4500, budget: 6000000, stadiumCapacity: 25000 },
            { name: "Melo Blue", city: "Melo", primaryColor: "#0000FF", secondaryColor: "#FFFFFF", reputation: 4400, budget: 5000000, stadiumCapacity: 8000 },
            { name: "Palermo RedBlue", city: "Montevideo", primaryColor: "#FF0000", secondaryColor: "#0000FF", reputation: 4300, budget: 4000000, stadiumCapacity: 8000 },
            { name: "Maldonado RedGreen", city: "Maldonado", primaryColor: "#FF0000", secondaryColor: "#008000", reputation: 4500, budget: 7000000, stadiumCapacity: 22000 },
            { name: "Pedrenses Blue", city: "Las Piedras", primaryColor: "#0000FF", secondaryColor: "#FFFFFF", reputation: 4300, budget: 4500000, stadiumCapacity: 12000 },
            { name: "Gauchos Gold", city: "Montevideo", primaryColor: "#FFFF00", secondaryColor: "#FF0000", reputation: 4400, budget: 5500000, stadiumCapacity: 8000 },
            { name: "Sayago Green", city: "Montevideo", primaryColor: "#008000", secondaryColor: "#FFFFFF", reputation: 4500, budget: 6500000, stadiumCapacity: 8000 }
        ]
    },
    {
        id: 'tn', region: 'GROUP_G', name: 'Ligue 1 Pro', country: 'Tunisia', foreignPlayerChance: 0.3, playerNationality: 'Tunisia',
        matchFormat: 'double-round',

        logo: '/assets/logos/leagues/tunisia_logo.jpg',
        flag: '🇹🇳',
        realTeams: [
            { name: "Tunis Gold", city: "Tunis", primaryColor: "#FFD700", secondaryColor: "#FF0000", reputation: 6000, budget: 15000000, stadiumCapacity: 60000 },
            { name: "Tunis Red-Whites", city: "Tunis", primaryColor: "#FF0000", secondaryColor: "#FFFFFF", reputation: 5800, budget: 12000000, stadiumCapacity: 60000 },
            { name: "Sousse Stars", city: "Sousse", primaryColor: "#FF0000", secondaryColor: "#FFFFFF", reputation: 5600, budget: 10000000, stadiumCapacity: 28000 },
            { name: "Sfax Zebra", city: "Sfax", primaryColor: "#000000", secondaryColor: "#FFFFFF", reputation: 5500, budget: 9000000, stadiumCapacity: 18000 },
            { name: "Monastir Blue", city: "Monastir", primaryColor: "#0000FF", secondaryColor: "#FFFFFF", reputation: 5200, budget: 7000000, stadiumCapacity: 20000 },
            { name: "Bardo Green", city: "Tunis", primaryColor: "#008000", secondaryColor: "#FF0000", reputation: 5300, budget: 8000000, stadiumCapacity: 15000 },
            { name: "Bizerte Sharks", city: "Bizerte", primaryColor: "#FFFF00", secondaryColor: "#000000", reputation: 4800, budget: 5000000, stadiumCapacity: 15000 },
            { name: "Beja Storks", city: "Beja", primaryColor: "#FF0000", secondaryColor: "#FFFFFF", reputation: 4600, budget: 4000000, stadiumCapacity: 10000 },
            { name: "Metlaoui Mines", city: "Metlaoui", primaryColor: "#FFD700", secondaryColor: "#FF0000", reputation: 4500, budget: 3500000, stadiumCapacity: 8000 },
            { name: "Ben Guerdane Riders", city: "Ben Guerdane", primaryColor: "#FFFF00", secondaryColor: "#000000", reputation: 4400, budget: 3000000, stadiumCapacity: 5000 },
            { name: "Marsa Beach", city: "La Marsa", primaryColor: "#008000", secondaryColor: "#FFFF00", reputation: 4500, budget: 3500000, stadiumCapacity: 6000 },
            { name: "Zarzis Olive", city: "Zarzis", primaryColor: "#FFFF00", secondaryColor: "#0000FF", reputation: 4300, budget: 2500000, stadiumCapacity: 7000 },
            { name: "Kairouan Historic", city: "Kairouan", primaryColor: "#008000", secondaryColor: "#FFFFFF", reputation: 4200, budget: 2000000, stadiumCapacity: 15000 },
            { name: "Omrane Build", city: "Tunis", primaryColor: "#0000FF", secondaryColor: "#FFFFFF", reputation: 4000, budget: 1500000, stadiumCapacity: 3000 },
            { name: "Soliman Future", city: "Soliman", primaryColor: "#008000", secondaryColor: "#FFFFFF", reputation: 4100, budget: 1800000, stadiumCapacity: 3000 },
            { name: "Gabes Oasis", city: "Gabès", primaryColor: "#008000", secondaryColor: "#FF0000", reputation: 4100, budget: 1800000, stadiumCapacity: 10000 }
        ]
    },
    {
        id: 'cr', region: 'GROUP_H', name: 'Primera División', country: 'Costa Rica', foreignPlayerChance: 0.3, playerNationality: 'Costa Rica',
        matchFormat: 'double-round',

        logo: '/assets/logos/leagues/costarica_logo.jpg',
        flag: '🏳️',
        realTeams: [
            { name: "San Jose Purple", city: "San José", primaryColor: "#800080", secondaryColor: "#FFFFFF", reputation: 5500, budget: 8000000, stadiumCapacity: 23112 },
            { name: "Alajuela Lions", city: "Alajuela", primaryColor: "#FF0000", secondaryColor: "#000000", reputation: 5400, budget: 7500000, stadiumCapacity: 17895 },
            { name: "Heredia Red-Yellow", city: "Heredia", primaryColor: "#FF0000", secondaryColor: "#FFFF00", reputation: 5300, budget: 7000000, stadiumCapacity: 8700 },
            { name: "Cartago Blues", city: "Cartago", primaryColor: "#0000FF", secondaryColor: "#FFFFFF", reputation: 5000, budget: 5000000, stadiumCapacity: 13500 },
            { name: "San Carlos Bulls", city: "San Carlos", primaryColor: "#FF0000", secondaryColor: "#0000FF", reputation: 4800, budget: 4000000, stadiumCapacity: 5600 },
            { name: "San Isidro Warriors", city: "San Isidro", primaryColor: "#0000FF", secondaryColor: "#FFFFFF", reputation: 4600, budget: 3000000, stadiumCapacity: 6000 },
            { name: "Puntarenas Sharks", city: "Puntarenas", primaryColor: "#FFA500", secondaryColor: "#000000", reputation: 4500, budget: 2500000, stadiumCapacity: 4105 },
            { name: "Sporting Jose", city: "San José", primaryColor: "#000000", secondaryColor: "#FFFFFF", reputation: 4400, budget: 2000000, stadiumCapacity: 3000 },
            { name: "Liberia Gold", city: "Liberia", primaryColor: "#FFFF00", secondaryColor: "#000000", reputation: 4300, budget: 1800000, stadiumCapacity: 6500 },
            { name: "Guadalupe Blue", city: "San José", primaryColor: "#0000FF", secondaryColor: "#FFFF00", reputation: 4200, budget: 1500000, stadiumCapacity: 2000 }
        ]
    },
    {
        id: 'in', region: 'GROUP_G', name: 'Indian Super League', country: 'India', foreignPlayerChance: 0.4, playerNationality: 'India',
        matchFormat: 'double-round',

        logo: '/assets/logos/leagues/india_logo.jpg',
        flag: '🏳️',
        realTeams: [
            { name: "Kolkata Mariners", city: "Kolkata", primaryColor: "#006400", secondaryColor: "#800000", reputation: 5200, budget: 12000000, stadiumCapacity: 85000 },
            { name: "Mumbai Islanders", city: "Mumbai", primaryColor: "#87CEEB", secondaryColor: "#FFFFFF", reputation: 5300, budget: 15000000, stadiumCapacity: 18000 }, // City Group
            { name: "East Bengal Torch", city: "Kolkata", primaryColor: "#FF0000", secondaryColor: "#FFFF00", reputation: 5100, budget: 10000000, stadiumCapacity: 85000 },
            { name: "Kerala Tuskers", city: "Kochi", primaryColor: "#FFFF00", secondaryColor: "#0000FF", reputation: 5200, budget: 11000000, stadiumCapacity: 60000 },
            { name: "Goa Gaurs", city: "Goa", primaryColor: "#FFA500", secondaryColor: "#0000FF", reputation: 5000, budget: 9000000, stadiumCapacity: 19000 },
            { name: "Bangalore Blues", city: "Bengaluru", primaryColor: "#0000FF", secondaryColor: "#FFFFFF", reputation: 5100, budget: 11500000, stadiumCapacity: 25810 },
            { name: "Odisha Juggernauts", city: "Bhubaneswar", primaryColor: "#800080", secondaryColor: "#000000", reputation: 4900, budget: 8500000, stadiumCapacity: 15000 },
            { name: "Chennai Titans", city: "Chennai", primaryColor: "#0000FF", secondaryColor: "#FFFF00", reputation: 4800, budget: 8000000, stadiumCapacity: 40000 },
            { name: "Highland United", city: "Guwahati", primaryColor: "#FFFFFF", secondaryColor: "#FF0000", reputation: 4700, budget: 7000000, stadiumCapacity: 25000 },
            { name: "Steel City Red", city: "Jamshedpur", primaryColor: "#FF0000", secondaryColor: "#0000FF", reputation: 4700, budget: 7500000, stadiumCapacity: 24424 },
            { name: "Punjab Lions", city: "Mohali", primaryColor: "#FFA500", secondaryColor: "#FFFFFF", reputation: 4600, budget: 6000000, stadiumCapacity: 26000 },
            { name: "Kolkata Black-White", city: "Kolkata", primaryColor: "#000000", secondaryColor: "#FFFFFF", reputation: 4500, budget: 5000000, stadiumCapacity: 15000 },
            { name: "Delhi Capital", city: "New Delhi", primaryColor: "#0000FF", secondaryColor: "#FFFFFF", reputation: 4400, budget: 4500000, stadiumCapacity: 20000 },
            { name: "Varanasi Holy", city: "Varanasi", primaryColor: "#FFA500", secondaryColor: "#000000", reputation: 4300, budget: 4000000, stadiumCapacity: 12000 }
        ]
    },
    {
        id: 'ru', region: 'GROUP_C', name: 'Russian Premier League', country: 'Russia', foreignPlayerChance: 0.4, playerNationality: 'Russia',
        matchFormat: 'double-round',

        logo: '/assets/logos/leagues/russian.jpg',
        flag: '🇷🇺',
        realTeams: [
            { name: "Krasnodar Bulls", city: "Krasnodar", primaryColor: "#006400", secondaryColor: "#000000", reputation: 6500, budget: 45000000, stadiumCapacity: 35000 },
            { name: "St. Petersburg Lions", city: "St. Petersburg", primaryColor: "#41B6E6", secondaryColor: "#FFFFFF", reputation: 7000, budget: 80000000, stadiumCapacity: 68000 },
            { name: "Moscow Trains", city: "Moscow", primaryColor: "#008000", secondaryColor: "#FF0000", reputation: 6200, budget: 40000000, stadiumCapacity: 27000 },
            { name: "Moscow Army", city: "Moscow", primaryColor: "#FF0000", secondaryColor: "#0000FF", reputation: 6300, budget: 42000000, stadiumCapacity: 30000 },
            { name: "Kaliningrad Amber", city: "Kaliningrad", primaryColor: "#0000FF", secondaryColor: "#FFFFFF", reputation: 5000, budget: 15000000, stadiumCapacity: 35000 },
            { name: "Moscow Gladiators", city: "Moscow", primaryColor: "#FF0000", secondaryColor: "#FFFFFF", reputation: 6600, budget: 50000000, stadiumCapacity: 45000 },
            { name: "Kazan Ruby", city: "Kazan", primaryColor: "#800000", secondaryColor: "#008000", reputation: 5800, budget: 25000000, stadiumCapacity: 45000 },
            { name: "Grozny Wolves", city: "Grozny", primaryColor: "#008000", secondaryColor: "#FFFFFF", reputation: 5500, budget: 20000000, stadiumCapacity: 30000 },
            { name: "Tolyatti Steel", city: "Tolyatti", primaryColor: "#FF0000", secondaryColor: "#000000", reputation: 4800, budget: 12000000, stadiumCapacity: 10000 },
            { name: "Moscow Police", city: "Moscow", primaryColor: "#0000FF", secondaryColor: "#FFFFFF", reputation: 6000, budget: 35000000, stadiumCapacity: 26000 },
            { name: "Rostov Yellow-Blue", city: "Rostov", primaryColor: "#FFFF00", secondaryColor: "#0000FF", reputation: 5700, budget: 22000000, stadiumCapacity: 45000 },
            { name: "Samara Wings", city: "Samara", primaryColor: "#87CEEB", secondaryColor: "#FFFFFF", reputation: 5400, budget: 18000000, stadiumCapacity: 44000 },
            { name: "Makhachkala Blue", city: "Makhachkala", primaryColor: "#0000FF", secondaryColor: "#FFFFFF", reputation: 4900, budget: 10000000, stadiumCapacity: 15000 },
            { name: "Nizhny Novgorod", city: "Nizhny Novgorod", primaryColor: "#0000FF", secondaryColor: "#87CEEB", reputation: 5000, budget: 14000000, stadiumCapacity: 44000 },
            { name: "Orenburg Gas", city: "Orenburg", primaryColor: "#0000FF", secondaryColor: "#FFFFFF", reputation: 4800, budget: 11000000, stadiumCapacity: 7500 },
            { name: "Sochi Leopards", city: "Sochi", primaryColor: "#0000FF", secondaryColor: "#FFFFFF", reputation: 5100, budget: 16000000, stadiumCapacity: 45000 }
        ]
    },
    {
        id: 'dz', region: 'GROUP_F', name: 'Ligue 1 Algeria', country: 'Algeria', foreignPlayerChance: 0.1, playerNationality: 'Algeria',
        matchFormat: 'double-round',

        logo: '/assets/logos/leagues/ligue1algeria.jpg',
        flag: '🇩🇿',
        realTeams: [
            { name: "Algiers Dean", city: "Algiers", primaryColor: "#008000", secondaryColor: "#FF0000", reputation: 5500, budget: 10000000, stadiumCapacity: 64000 },
            { name: "Belouizdad Chabab", city: "Algiers", primaryColor: "#FF0000", secondaryColor: "#FFFFFF", reputation: 5600, budget: 12000000, stadiumCapacity: 20000 },
            { name: "Algiers Union", city: "Algiers", primaryColor: "#000000", secondaryColor: "#FF0000", reputation: 5400, budget: 9000000, stadiumCapacity: 17000 },
            { name: "Ben Aknoun Star", city: "Algiers", primaryColor: "#FF0000", secondaryColor: "#000000", reputation: 4500, budget: 4000000, stadiumCapacity: 10000 },
            { name: "Oran Mouloudia", city: "Oran", primaryColor: "#FF0000", secondaryColor: "#FFFFFF", reputation: 5000, budget: 7000000, stadiumCapacity: 40000 },
            { name: "Constantine Club", city: "Constantine", primaryColor: "#008000", secondaryColor: "#000000", reputation: 5100, budget: 7500000, stadiumCapacity: 35000 },
            { name: "Akbou Olympique", city: "Akbou", primaryColor: "#0000FF", secondaryColor: "#FFFFFF", reputation: 4600, budget: 4500000, stadiumCapacity: 5000 },
            { name: "Kabylie Lions", city: "Tizi Ouzou", primaryColor: "#FFFF00", secondaryColor: "#008000", reputation: 5700, budget: 11000000, stadiumCapacity: 50000 },
            { name: "Rouissat", city: "Rouissat", primaryColor: "#008000", secondaryColor: "#FFFFFF", reputation: 4200, budget: 3000000, stadiumCapacity: 5000 },
            { name: "Saoura Eagles", city: "Bechar", primaryColor: "#FFFF00", secondaryColor: "#008000", reputation: 4900, budget: 6000000, stadiumCapacity: 20000 },
            { name: "Khenchela USM", city: "Khenchela", primaryColor: "#000000", secondaryColor: "#FFFFFF", reputation: 4400, budget: 3500000, stadiumCapacity: 5000 },
            { name: "Setif Black Eagles", city: "Setif", primaryColor: "#000000", secondaryColor: "#FFFFFF", reputation: 5300, budget: 8500000, stadiumCapacity: 25000 },
            { name: "Chlef Lions", city: "Chlef", primaryColor: "#FF0000", secondaryColor: "#FFFFFF", reputation: 4700, budget: 5000000, stadiumCapacity: 18000 },
            { name: "Paradou AC", city: "Algiers", primaryColor: "#FFFF00", secondaryColor: "#0000FF", reputation: 4800, budget: 5500000, stadiumCapacity: 10000 },
            { name: "Mostaganem ES", city: "Mostaganem", primaryColor: "#008000", secondaryColor: "#FFFFFF", reputation: 4300, budget: 3200000, stadiumCapacity: 15000 },
            { name: "El Bayadh MC", city: "El Bayadh", primaryColor: "#0000FF", secondaryColor: "#FFFFFF", reputation: 4100, budget: 2800000, stadiumCapacity: 5000 }
        ]
    },
    {
        id: 'pt', region: 'GROUP_G', name: 'Primeira Liga', country: 'Portugal', foreignPlayerChance: 0.5, playerNationality: 'Portugal',
        matchFormat: 'double-round',

        logo: '/assets/logos/leagues/primeiraligaportugal.jpg',
        flag: '🇵🇹',
        realTeams: [
            { name: "Oporto Dragons", city: "Porto", primaryColor: "#0000FF", secondaryColor: "#FFFFFF", reputation: 7800, budget: 60000000, stadiumCapacity: 50000 },
            { name: "Lisbon Lions", city: "Lisbon", primaryColor: "#008000", secondaryColor: "#FFFFFF", reputation: 7700, budget: 55000000, stadiumCapacity: 50000 },
            { name: "Lisbon Eagles", city: "Lisbon", primaryColor: "#FF0000", secondaryColor: "#FFFFFF", reputation: 7900, budget: 65000000, stadiumCapacity: 64000 },
            { name: "Braga Warriors", city: "Braga", primaryColor: "#FF0000", secondaryColor: "#FFFFFF", reputation: 7200, budget: 25000000, stadiumCapacity: 30000 },
            { name: "Barcelos Roosters", city: "Barcelos", primaryColor: "#FF0000", secondaryColor: "#0000FF", reputation: 5500, budget: 8000000, stadiumCapacity: 12000 },
            { name: "Moreira Canons", city: "Moreira de Conegos", primaryColor: "#008000", secondaryColor: "#FFFFFF", reputation: 5400, budget: 7000000, stadiumCapacity: 6000 },
            { name: "Famalicao Blue", city: "Famalicao", primaryColor: "#0000FF", secondaryColor: "#FFFFFF", reputation: 5600, budget: 9000000, stadiumCapacity: 5000 },
            { name: "Guimaraes Castle", city: "Guimaraes", primaryColor: "#FFFFFF", secondaryColor: "#000000", reputation: 6000, budget: 12000000, stadiumCapacity: 30000 },
            { name: "Estoril Canaries", city: "Estoril", primaryColor: "#FFFF00", secondaryColor: "#0000FF", reputation: 5300, budget: 6000000, stadiumCapacity: 8000 },
            { name: "Alverca FC", city: "Alverca", primaryColor: "#0000FF", secondaryColor: "#FF0000", reputation: 5000, budget: 4000000, stadiumCapacity: 7000 },
            { name: "Madeira Nacional", city: "Funchal", primaryColor: "#000000", secondaryColor: "#FFFFFF", reputation: 5200, budget: 5000000, stadiumCapacity: 5000 },
            { name: "Vila do Conde", city: "Vila do Conde", primaryColor: "#008000", secondaryColor: "#FFFFFF", reputation: 5400, budget: 7500000, stadiumCapacity: 9000 },
            { name: "Amadora Star", city: "Amadora", primaryColor: "#FF0000", secondaryColor: "#008000", reputation: 5100, budget: 4500000, stadiumCapacity: 9000 },
            { name: "Azores Red", city: "Ponta Delgada", primaryColor: "#FF0000", secondaryColor: "#FFFFFF", reputation: 5200, budget: 5500000, stadiumCapacity: 10000 },
            { name: "Arouca Wolves", city: "Arouca", primaryColor: "#FFFF00", secondaryColor: "#0000FF", reputation: 5000, budget: 4000000, stadiumCapacity: 5000 },
            { name: "Lisbon Geese", city: "Lisbon", primaryColor: "#000000", secondaryColor: "#FFFFFF", reputation: 4900, budget: 3500000, stadiumCapacity: 5000 },
            { name: "Tondela Gold", city: "Tondela", primaryColor: "#FFFF00", secondaryColor: "#008000", reputation: 4800, budget: 3000000, stadiumCapacity: 5000 },
            { name: "Aves Red", city: "Vila das Aves", primaryColor: "#FF0000", secondaryColor: "#FFFFFF", reputation: 4700, budget: 2500000, stadiumCapacity: 5000 }
        ]
    },
    {
        id: 'nl', region: 'GROUP_B', name: 'Eredivisie', country: 'Netherlands', foreignPlayerChance: 0.4, playerNationality: 'Netherlands',
        matchFormat: 'double-round',

        logo: '/assets/logos/leagues/eredivisie.jpg',
        flag: '🇳🇱',
        realTeams: [
            { name: "Eindhoven Lamps", city: "Eindhoven", primaryColor: "#FF0000", secondaryColor: "#FFFFFF", reputation: 7500, budget: 50000000, stadiumCapacity: 35000 },
            { name: "Rotterdam Port", city: "Rotterdam", primaryColor: "#FF0000", secondaryColor: "#FFFFFF", reputation: 7400, budget: 45000000, stadiumCapacity: 51000 },
            { name: "Amsterdam Lancers", city: "Amsterdam", primaryColor: "#FF0000", secondaryColor: "#FFFFFF", reputation: 7600, budget: 55000000, stadiumCapacity: 55000 },
            { name: "Nijmegen Emperors", city: "Nijmegen", primaryColor: "#FF0000", secondaryColor: "#008000", reputation: 6000, budget: 12000000, stadiumCapacity: 12500 },
            { name: "Alkmaar Cheese", city: "Alkmaar", primaryColor: "#FF0000", secondaryColor: "#FFFFFF", reputation: 6800, budget: 25000000, stadiumCapacity: 19000 },
            { name: "Rotterdam Castle", city: "Rotterdam", primaryColor: "#FF0000", secondaryColor: "#FFFFFF", reputation: 5800, budget: 10000000, stadiumCapacity: 11000 },
            { name: "Groningen Green", city: "Groningen", primaryColor: "#008000", secondaryColor: "#FFFFFF", reputation: 6200, budget: 15000000, stadiumCapacity: 22000 },
            { name: "Enschede Reds", city: "Enschede", primaryColor: "#FF0000", secondaryColor: "#FFFFFF", reputation: 6500, budget: 18000000, stadiumCapacity: 30000 },
            { name: "Sittard Gold", city: "Sittard", primaryColor: "#FFFF00", secondaryColor: "#008000", reputation: 5500, budget: 7000000, stadiumCapacity: 12000 },
            { name: "Friesland Hearts", city: "Heerenveen", primaryColor: "#0000FF", secondaryColor: "#FFFFFF", reputation: 6000, budget: 14000000, stadiumCapacity: 26000 },
            { name: "Utrecht Dom", city: "Utrecht", primaryColor: "#FF0000", secondaryColor: "#FFFFFF", reputation: 6300, budget: 16000000, stadiumCapacity: 23000 },
            { name: "Zwolle Bluefingers", city: "Zwolle", primaryColor: "#0000FF", secondaryColor: "#FFFFFF", reputation: 5600, budget: 8000000, stadiumCapacity: 14000 },
            { name: "Kralingen Red-Black", city: "Rotterdam", primaryColor: "#000000", secondaryColor: "#FF0000", reputation: 5400, budget: 6000000, stadiumCapacity: 4500 },
            { name: "Deventer Eagles", city: "Deventer", primaryColor: "#FF0000", secondaryColor: "#FFFF00", reputation: 5700, budget: 9000000, stadiumCapacity: 10000 },
            { name: "Volendam Fish", city: "Volendam", primaryColor: "#FFA500", secondaryColor: "#000000", reputation: 5200, budget: 5000000, stadiumCapacity: 7000 },
            { name: "Velsen White", city: "Velsen", primaryColor: "#FFFFFF", secondaryColor: "#000000", reputation: 5000, budget: 4000000, stadiumCapacity: 3000 },
            { name: "Breda Yellow-Black", city: "Breda", primaryColor: "#FFFF00", secondaryColor: "#000000", reputation: 5300, budget: 5500000, stadiumCapacity: 19000 },
            { name: "Almelo Black-White", city: "Almelo", primaryColor: "#000000", secondaryColor: "#FFFFFF", reputation: 5500, budget: 7500000, stadiumCapacity: 12000 }
        ]
    },
    {
        id: 'be', region: 'GROUP_B', name: 'Belgian Pro League', country: 'Belgium', foreignPlayerChance: 0.5, playerNationality: 'Belgium',
        matchFormat: 'double-round',

        logo: '/assets/logos/leagues/belgian.jpg',
        flag: '🇧🇪',
        realTeams: [
            { name: "Brussels Union", city: "Brussels", primaryColor: "#FFFF00", secondaryColor: "#0000FF", reputation: 6800, budget: 25000000, stadiumCapacity: 9000 },
            { name: "Sint-Truiden Canaries", city: "Sint-Truiden", primaryColor: "#FFFF00", secondaryColor: "#0000FF", reputation: 5800, budget: 10000000, stadiumCapacity: 14000 },
            { name: "Bruges Black-Blue", city: "Bruges", primaryColor: "#000000", secondaryColor: "#0000FF", reputation: 7200, budget: 40000000, stadiumCapacity: 29000 },
            { name: "Brussels Purple", city: "Brussels", primaryColor: "#800080", secondaryColor: "#FFFFFF", reputation: 7000, budget: 35000000, stadiumCapacity: 21000 },
            { name: "Gent Buffalos", city: "Ghent", primaryColor: "#0000FF", secondaryColor: "#FFFFFF", reputation: 6700, budget: 22000000, stadiumCapacity: 20000 },
            { name: "Mechelen Yellow-Red", city: "Mechelen", primaryColor: "#FFFF00", secondaryColor: "#FF0000", reputation: 6000, budget: 12000000, stadiumCapacity: 16000 },
            { name: "Charleroi Zebras", city: "Charleroi", primaryColor: "#000000", secondaryColor: "#FFFFFF", reputation: 5900, budget: 11000000, stadiumCapacity: 15000 },
            { name: "Liege Reds", city: "Liege", primaryColor: "#FF0000", secondaryColor: "#FFFFFF", reputation: 6600, budget: 20000000, stadiumCapacity: 27000 },
            { name: "Antwerp Great Old", city: "Antwerp", primaryColor: "#FF0000", secondaryColor: "#FFFFFF", reputation: 6800, budget: 24000000, stadiumCapacity: 16000 },
            { name: "Waregem Farmers", city: "Waregem", primaryColor: "#FF0000", secondaryColor: "#008000", reputation: 5600, budget: 9000000, stadiumCapacity: 12000 },
            { name: "Genk Smurfs", city: "Genk", primaryColor: "#0000FF", secondaryColor: "#FFFFFF", reputation: 6700, budget: 23000000, stadiumCapacity: 23000 },
            { name: "Westerlo Cocks", city: "Westerlo", primaryColor: "#FFFF00", secondaryColor: "#0000FF", reputation: 5500, budget: 8500000, stadiumCapacity: 8000 },
            { name: "La Louviere Wolves", city: "La Louvière", primaryColor: "#008000", secondaryColor: "#FFFFFF", reputation: 5000, budget: 5000000, stadiumCapacity: 12000 },
            { name: "Leuven White", city: "Leuven", primaryColor: "#FFFFFF", secondaryColor: "#000000", reputation: 5400, budget: 8000000, stadiumCapacity: 10000 },
            { name: "Bruges Green-Black", city: "Bruges", primaryColor: "#008000", secondaryColor: "#000000", reputation: 5700, budget: 9500000, stadiumCapacity: 29000 },
            { name: "Denderleeuw Blue", city: "Denderleeuw", primaryColor: "#0000FF", secondaryColor: "#000000", reputation: 4800, budget: 4000000, stadiumCapacity: 6000 }
        ]
    },
    {
        id: 'my', region: 'GROUP_H', name: 'Liga Super Malaysia', country: 'Malaysia', foreignPlayerChance: 0.2, playerNationality: 'Malaysia',
        matchFormat: 'double-round',

        logo: '/assets/logos/leagues/ligasupermaysia.jpg',
        flag: '🇲🇾',
        realTeams: [
            { name: "Johor Southern Tigers", city: "Johor Bahru", primaryColor: "#0000FF", secondaryColor: "#FF0000", reputation: 6000, budget: 20000000, stadiumCapacity: 40000 },
            { name: "Kuching City", city: "Kuching", primaryColor: "#FFFFFF", secondaryColor: "#008000", reputation: 4500, budget: 3000000, stadiumCapacity: 20000 },
            { name: "Selangor Red Giants", city: "Shah Alam", primaryColor: "#FF0000", secondaryColor: "#FFFF00", reputation: 5500, budget: 10000000, stadiumCapacity: 25000 },
            { name: "Kuala Lumpur City", city: "Kuala Lumpur", primaryColor: "#FF0000", secondaryColor: "#FFFFFF", reputation: 5200, budget: 8000000, stadiumCapacity: 18000 },
            { name: "Terengganu Turtles", city: "Kuala Terengganu", primaryColor: "#000000", secondaryColor: "#FFFFFF", reputation: 5300, budget: 9000000, stadiumCapacity: 50000 },
            { name: "Brunei Crown", city: "Bandar Seri Begawan", primaryColor: "#FFFF00", secondaryColor: "#000000", reputation: 4800, budget: 6000000, stadiumCapacity: 28000 },
            { name: "Penang Panthers", city: "George Town", primaryColor: "#0000FF", secondaryColor: "#FFFF00", reputation: 4700, budget: 5000000, stadiumCapacity: 20000 },
            { name: "Negeri Deers", city: "Seremban", primaryColor: "#FFFF00", secondaryColor: "#000000", reputation: 4600, budget: 4500000, stadiumCapacity: 45000 },
            { name: "Immigration FC", city: "Putrajaya", primaryColor: "#FF0000", secondaryColor: "#0000FF", reputation: 4000, budget: 2000000, stadiumCapacity: 5000 },
            { name: "Kelantan Green", city: "Kota Bharu", primaryColor: "#008000", secondaryColor: "#FFFFFF", reputation: 4200, budget: 2500000, stadiumCapacity: 30000 },
            { name: "Sabah Rhinos", city: "Kota Kinabalu", primaryColor: "#FF0000", secondaryColor: "#FFFFFF", reputation: 5400, budget: 9500000, stadiumCapacity: 35000 },
            { name: "Melaka Mousedeer", city: "Melaka", primaryColor: "#008000", secondaryColor: "#FFFFFF", reputation: 4100, budget: 2200000, stadiumCapacity: 40000 },
            { name: "Police Blue", city: "Kuala Lumpur", primaryColor: "#0000FF", secondaryColor: "#FFFFFF", reputation: 4300, budget: 3500000, stadiumCapacity: 18000 }
        ]
    },
    {
        id: 'ke', region: 'GROUP_H', name: 'Kenya Premier League', country: 'Kenya', foreignPlayerChance: 0.1, playerNationality: 'Kenya',
        matchFormat: 'double-round',

        logo: '/assets/logos/leagues/kenyapremier.jpg',
        flag: '🏳️',
        realTeams: [
            { name: "Gor Mahia Green", city: "Nairobi", primaryColor: "#008000", secondaryColor: "#FFFFFF", reputation: 5200, budget: 5000000, stadiumCapacity: 30000 },
            { name: "AFC Leopards", city: "Nairobi", primaryColor: "#0000FF", secondaryColor: "#FFFFFF", reputation: 5100, budget: 4500000, stadiumCapacity: 30000 },
            { name: "Kakamega Homeboyz", city: "Kakamega", primaryColor: "#FFFF00", secondaryColor: "#000000", reputation: 4800, budget: 3000000, stadiumCapacity: 10000 },
            { name: "Shabana FC", city: "Kisii", primaryColor: "#FF0000", secondaryColor: "#FFFFFF", reputation: 4500, budget: 2000000, stadiumCapacity: 5000 },
            { name: "Kenya Police FC", city: "Nairobi", primaryColor: "#0000FF", secondaryColor: "#FFFFFF", reputation: 4900, budget: 3500000, stadiumCapacity: 15000 },
            { name: "KCB Bankers", city: "Nairobi", primaryColor: "#008000", secondaryColor: "#FFFFFF", reputation: 4700, budget: 2800000, stadiumCapacity: 5000 },
            { name: "Murang'a Seal", city: "Murang'a", primaryColor: "#FFFF00", secondaryColor: "#000000", reputation: 4600, budget: 2500000, stadiumCapacity: 5000 },
            { name: "Bandari Dockers", city: "Mombasa", primaryColor: "#0000FF", secondaryColor: "#FFFFFF", reputation: 4800, budget: 3200000, stadiumCapacity: 10000 },
            { name: "Tusker Brewers", city: "Nairobi", primaryColor: "#FFFF00", secondaryColor: "#000000", reputation: 5000, budget: 4000000, stadiumCapacity: 15000 },
            { name: "Nairobi United", city: "Nairobi", primaryColor: "#000000", secondaryColor: "#FFFFFF", reputation: 4200, budget: 1500000, stadiumCapacity: 5000 },
            { name: "Posta Rangers", city: "Eldoret", primaryColor: "#FF0000", secondaryColor: "#FFFFFF", reputation: 4400, budget: 1800000, stadiumCapacity: 5000 },
            { name: "Mathare Slum Boys", city: "Nairobi", primaryColor: "#FFFF00", secondaryColor: "#008000", reputation: 4300, budget: 1600000, stadiumCapacity: 5000 },
            { name: "Mara Sugar", city: "Narok", primaryColor: "#FFFFFF", secondaryColor: "#000000", reputation: 4100, budget: 1200000, stadiumCapacity: 3000 },
            { name: "Ulinzi Soldiers", city: "Nakuru", primaryColor: "#FF0000", secondaryColor: "#FFFFFF", reputation: 4600, budget: 2400000, stadiumCapacity: 10000 },
            { name: "APS Bomet", city: "Bomet", primaryColor: "#008000", secondaryColor: "#FFFFFF", reputation: 4000, budget: 1000000, stadiumCapacity: 3000 },
            { name: "Bidco United", city: "Thika", primaryColor: "#0000FF", secondaryColor: "#FFFFFF", reputation: 4100, budget: 1400000, stadiumCapacity: 5000 },
            { name: "Sofapaka Family", city: "Nairobi", primaryColor: "#0000FF", secondaryColor: "#FFFFFF", reputation: 4300, budget: 1700000, stadiumCapacity: 5000 },
            { name: "Kariobangi Sharks", city: "Nairobi", primaryColor: "#FFFF00", secondaryColor: "#008000", reputation: 4400, budget: 1900000, stadiumCapacity: 5000 }
        ]
    },
    {
        id: 'sn', region: 'GROUP_F', name: 'Senegal Premier League', country: 'Senegal', foreignPlayerChance: 0.1, playerNationality: 'Senegal',
        matchFormat: 'double-round',

        logo: '/assets/logos/leagues/senegal.jpg',
        flag: '🇸🇳',
        realTeams: [
            { name: "Goree Islanders", city: "Dakar", primaryColor: "#0000FF", secondaryColor: "#FFFFFF", reputation: 5000, budget: 3000000, stadiumCapacity: 5000 },
            { name: "Casa Sports", city: "Ziguinchor", primaryColor: "#008000", secondaryColor: "#FFFFFF", reputation: 4900, budget: 2800000, stadiumCapacity: 10000 },
            { name: "AJEL Rufisque", city: "Rufisque", primaryColor: "#FF0000", secondaryColor: "#FFFFFF", reputation: 4600, budget: 1500000, stadiumCapacity: 5000 },
            { name: "Pikine AS", city: "Pikine", primaryColor: "#008000", secondaryColor: "#FF0000", reputation: 4800, budget: 2200000, stadiumCapacity: 15000 },
            { name: "Teungueth FC", city: "Rufisque", primaryColor: "#0000FF", secondaryColor: "#FFFFFF", reputation: 5100, budget: 3500000, stadiumCapacity: 5000 },
            { name: "Dakar Sacre-Coeur", city: "Dakar", primaryColor: "#0000FF", secondaryColor: "#FFFF00", reputation: 4700, budget: 2000000, stadiumCapacity: 3000 },
            { name: "Jaraaf Dakar", city: "Dakar", primaryColor: "#008000", secondaryColor: "#FFFFFF", reputation: 5200, budget: 4000000, stadiumCapacity: 10000 },
            { name: "Generation Foot", city: "Dakar", primaryColor: "#800000", secondaryColor: "#FFFFFF", reputation: 5000, budget: 3200000, stadiumCapacity: 5000 },
            { name: "Wally Daan", city: "Thies", primaryColor: "#FFA500", secondaryColor: "#000000", reputation: 4400, budget: 1200000, stadiumCapacity: 3000 },
            { name: "Stade Mbour", city: "Mbour", primaryColor: "#FF0000", secondaryColor: "#FFFFFF", reputation: 4500, budget: 1400000, stadiumCapacity: 5000 },
            { name: "Sonacos Oil", city: "Diourbel", primaryColor: "#FFFF00", secondaryColor: "#000000", reputation: 4300, budget: 1000000, stadiumCapacity: 5000 },
            { name: "US Ouakam", city: "Dakar", primaryColor: "#FF0000", secondaryColor: "#FFFFFF", reputation: 4600, budget: 1800000, stadiumCapacity: 5000 },
            { name: "ASC HLM", city: "Dakar", primaryColor: "#0000FF", secondaryColor: "#FFFFFF", reputation: 4200, budget: 900000, stadiumCapacity: 3000 },
            { name: "Linguere St-Louis", city: "Saint-Louis", primaryColor: "#0000FF", secondaryColor: "#FFFF00", reputation: 4500, budget: 1600000, stadiumCapacity: 5000 },
            { name: "Guediawaye FC", city: "Guediawaye", primaryColor: "#FFFF00", secondaryColor: "#0000FF", reputation: 4700, budget: 2100000, stadiumCapacity: 5000 },
            { name: "Camberene", city: "Dakar", primaryColor: "#008000", secondaryColor: "#FFFFFF", reputation: 4000, budget: 800000, stadiumCapacity: 2000 }
        ]
    },
    {
        id: 'ma', region: 'GROUP_F', name: 'Morocco Botola Pro', country: 'Morocco', foreignPlayerChance: 0.15, playerNationality: 'Morocco',
        matchFormat: 'double-round',

        logo: '/assets/logos/leagues/botola_logo.jpg',
        flag: '🇲🇦',
        realTeams: [
            { name: "Casablanca Eagles", city: "Casablanca", primaryColor: "#008000", secondaryColor: "#FFFFFF", reputation: 6500, budget: 12000000, stadiumCapacity: 45000 },
            { name: "Casablanca Reds", city: "Casablanca", primaryColor: "#FF0000", secondaryColor: "#FFFFFF", reputation: 6400, budget: 11000000, stadiumCapacity: 45000 },
            { name: "AS FAR", city: "Rabat", primaryColor: "#000000", secondaryColor: "#FFFFFF", reputation: 6300, budget: 10000000, stadiumCapacity: 40000 },
            { name: "FUS Rabat", city: "Rabat", primaryColor: "#FF0000", secondaryColor: "#FFFFFF", reputation: 5800, budget: 5000000, stadiumCapacity: 15000 },
            { name: "Berkane Oranges", city: "Berkane", primaryColor: "#FFA500", secondaryColor: "#000000", reputation: 6000, budget: 7000000, stadiumCapacity: 10000 },
            { name: "Fez Tigers", city: "Fez", primaryColor: "#FFFF00", secondaryColor: "#000000", reputation: 5500, budget: 4000000, stadiumCapacity: 45000 },
            { name: "Agadir Gazelles", city: "Agadir", primaryColor: "#FF0000", secondaryColor: "#FFFFFF", reputation: 5200, budget: 3500000, stadiumCapacity: 45000 },
            { name: "Tanger Blue", city: "Tanger", primaryColor: "#0000FF", secondaryColor: "#FFFFFF", reputation: 5300, budget: 3800000, stadiumCapacity: 45000 },
            { name: "Safi Sharks", city: "Safi", primaryColor: "#0000FF", secondaryColor: "#FF0000", reputation: 5000, budget: 3000000, stadiumCapacity: 15000 },
            { name: "Tetouan Doves", city: "Tetouan", primaryColor: "#FF0000", secondaryColor: "#FFFFFF", reputation: 4900, budget: 2800000, stadiumCapacity: 15000 },
            { name: "Zemamra Hawks", city: "Zemamra", primaryColor: "#FFFF00", secondaryColor: "#0000FF", reputation: 4600, budget: 2000000, stadiumCapacity: 10000 },
            { name: "Soualem Youth", city: "Soualem", primaryColor: "#0000FF", secondaryColor: "#FFFFFF", reputation: 4500, budget: 1500000, stadiumCapacity: 5000 },
            { name: "Touarga Union", city: "Rabat", primaryColor: "#FFFF00", secondaryColor: "#008000", reputation: 4700, budget: 2200000, stadiumCapacity: 5000 },
            { name: "Mohammedia Flowers", city: "Mohammedia", primaryColor: "#FF0000", secondaryColor: "#000000", reputation: 4800, budget: 2500000, stadiumCapacity: 10000 },
            { name: "Berrechid Hariz", city: "Berrechid", primaryColor: "#008000", secondaryColor: "#FFFFFF", reputation: 4400, budget: 1200000, stadiumCapacity: 5000 },
            { name: "Oujda Moloudia", city: "Oujda", primaryColor: "#008000", secondaryColor: "#FFFFFF", reputation: 4600, budget: 1800000, stadiumCapacity: 35000 }
        ]
    },
    {
        id: 'za', region: 'GROUP_F', name: 'South Africa PSL', country: 'South Africa', foreignPlayerChance: 0.2, playerNationality: 'South Africa',
        matchFormat: 'double-round',

        logo: '/assets/logos/leagues/psl_logo.jpg',
        flag: '🇿🇦',
        realTeams: [
            { name: "Pretoria Brazilians", city: "Pretoria", primaryColor: "#FFFF00", secondaryColor: "#0000FF", reputation: 6800, budget: 25000000, stadiumCapacity: 50000 },
            { name: "Soweto Pirates", city: "Soweto", primaryColor: "#000000", secondaryColor: "#FFFFFF", reputation: 6500, budget: 15000000, stadiumCapacity: 40000 },
            { name: "Soweto Chiefs", city: "Soweto", primaryColor: "#FFFF00", secondaryColor: "#000000", reputation: 6400, budget: 14000000, stadiumCapacity: 90000 },
            { name: "SuperSport United", city: "Pretoria", primaryColor: "#0000FF", secondaryColor: "#FFFFFF", reputation: 6000, budget: 8000000, stadiumCapacity: 25000 },
            { name: "Cape Town City", city: "Cape Town", primaryColor: "#0000FF", secondaryColor: "#FFFF00", reputation: 5800, budget: 7000000, stadiumCapacity: 55000 },
            { name: "Stellenbosch FC", city: "Stellenbosch", primaryColor: "#800000", secondaryColor: "#FFFFFF", reputation: 5700, budget: 6000000, stadiumCapacity: 20000 },
            { name: "Sekhukhune Porcupines", city: "Polokwane", primaryColor: "#FF0000", secondaryColor: "#FFFFFF", reputation: 5500, budget: 5000000, stadiumCapacity: 45000 },
            { name: "Galaxy Rockets", city: "Nelspruit", primaryColor: "#FF0000", secondaryColor: "#000000", reputation: 5200, budget: 4000000, stadiumCapacity: 40000 },
            { name: "Durban Warriors", city: "Durban", primaryColor: "#008000", secondaryColor: "#FFFFFF", reputation: 5400, budget: 4500000, stadiumCapacity: 10000 },
            { name: "Durban Arrows", city: "Durban", primaryColor: "#008000", secondaryColor: "#FFFF00", reputation: 5000, budget: 3500000, stadiumCapacity: 10000 },
            { name: "Chilli Boys", city: "Gqeberha", primaryColor: "#FF0000", secondaryColor: "#FFFFFF", reputation: 4800, budget: 3000000, stadiumCapacity: 40000 },
            { name: "Royal Kings", city: "Pietermaritzburg", primaryColor: "#000000", secondaryColor: "#FFFF00", reputation: 4900, budget: 3200000, stadiumCapacity: 12000 },
            { name: "Natal Rich Boys", city: "Richards Bay", primaryColor: "#0000FF", secondaryColor: "#FFFFFF", reputation: 4500, budget: 2500000, stadiumCapacity: 8000 },
            { name: "Polokwane Rise", city: "Polokwane", primaryColor: "#FF7F00", secondaryColor: "#000000", reputation: 4600, budget: 2800000, stadiumCapacity: 45000 },
            { name: "Cape Town Spurs", city: "Cape Town", primaryColor: "#FF0000", secondaryColor: "#FFFFFF", reputation: 4400, budget: 2000000, stadiumCapacity: 55000 },
            { name: "Marumo Gallants", city: "Polokwane", primaryColor: "#0000FF", secondaryColor: "#FFFFFF", reputation: 4300, budget: 1800000, stadiumCapacity: 45000 }
        ]
    },
    {
        id: 'ci', region: 'GROUP_H', name: 'Ivory Coast Premier', country: 'Ivory Coast', foreignPlayerChance: 0.1, playerNationality: 'Ivory Coast',
        matchFormat: 'double-round',

        logo: '/assets/logos/leagues/ivory.jpg',
        flag: '🇨🇮',
        realTeams: [
            { name: "Abidjan Yellows", city: "Abidjan", primaryColor: "#FFFF00", secondaryColor: "#000000", reputation: 5200, budget: 3500000, stadiumCapacity: 30000 }, // ASEC
            { name: "San Pedro FC", city: "San Pedro", primaryColor: "#FFA500", secondaryColor: "#000000", reputation: 4800, budget: 2500000, stadiumCapacity: 8000 },
            { name: "Mouna", city: "Akoupe", primaryColor: "#FFFF00", secondaryColor: "#0000FF", reputation: 4200, budget: 1000000, stadiumCapacity: 3000 },
            { name: "Abobo Olympic", city: "Abidjan", primaryColor: "#0000FF", secondaryColor: "#FFFFFF", reputation: 4100, budget: 900000, stadiumCapacity: 4000 },
            { name: "Korhogo Club", city: "Korhogo", primaryColor: "#FF0000", secondaryColor: "#000000", reputation: 4300, budget: 1200000, stadiumCapacity: 5000 },
            { name: "Tchologo", city: "Ferkessedougou", primaryColor: "#008000", secondaryColor: "#FFFFFF", reputation: 4000, budget: 800000, stadiumCapacity: 3000 },
            { name: "Abidjan Stadium", city: "Abidjan", primaryColor: "#0000FF", secondaryColor: "#FF0000", reputation: 4900, budget: 2800000, stadiumCapacity: 10000 }, // Stade d'Abidjan
            { name: "Army Club", city: "Yamoussoukro", primaryColor: "#FFA500", secondaryColor: "#000000", reputation: 5000, budget: 3000000, stadiumCapacity: 5000 }, // SOA
            { name: "Adjame Green", city: "Abidjan", primaryColor: "#008000", secondaryColor: "#FFFFFF", reputation: 4600, budget: 1800000, stadiumCapacity: 4000 }, // Stella Club
            { name: "AFAD Djekanou", city: "Abidjan", primaryColor: "#0000FF", secondaryColor: "#FFFFFF", reputation: 4700, budget: 2000000, stadiumCapacity: 4000 },
            { name: "ISCA", city: "Abidjan", primaryColor: "#FF0000", secondaryColor: "#FFFFFF", reputation: 4000, budget: 850000, stadiumCapacity: 3000 },
            { name: "SOL Abobo", city: "Abidjan", primaryColor: "#000000", secondaryColor: "#FFFFFF", reputation: 4400, budget: 1300000, stadiumCapacity: 3000 },
            { name: "Bouake City", city: "Bouake", primaryColor: "#0000FF", secondaryColor: "#FFFFFF", reputation: 4500, budget: 1500000, stadiumCapacity: 25000 },
            { name: "Zoman", city: "Abidjan", primaryColor: "#800080", secondaryColor: "#FFFFFF", reputation: 4100, budget: 950000, stadiumCapacity: 3000 },
            { name: "Racing Abidjan", city: "Abidjan", primaryColor: "#0000FF", secondaryColor: "#FFFFFF", reputation: 4800, budget: 2200000, stadiumCapacity: 5000 },
            { name: "Agboville", city: "Agboville", primaryColor: "#008000", secondaryColor: "#FFFFFF", reputation: 3900, budget: 700000, stadiumCapacity: 2000 }
        ]
    },
    {
        id: 'ro', region: 'GROUP_C', name: 'Romania SuperLiga', country: 'Romania', foreignPlayerChance: 0.35, playerNationality: 'Romania',
        matchFormat: 'double-round',

        logo: '/assets/logos/leagues/romania.jpg',
        flag: '🇷🇴',
        realTeams: [
            { name: "Craiova Uni", city: "Craiova", primaryColor: "#0000FF", secondaryColor: "#FFFFFF", reputation: 6200, budget: 9000000, stadiumCapacity: 30000 }, // CS U Craiova
            { name: "Rapid Bucharest", city: "Bucharest", primaryColor: "#800000", secondaryColor: "#FFFFFF", reputation: 6400, budget: 11000000, stadiumCapacity: 14000 },
            { name: "Dinamo Bucharest", city: "Bucharest", primaryColor: "#FF0000", secondaryColor: "#FFFFFF", reputation: 6300, budget: 10000000, stadiumCapacity: 15000 },
            { name: "Arges Pitesti", city: "Pitesti", primaryColor: "#800080", secondaryColor: "#FFFFFF", reputation: 5500, budget: 4000000, stadiumCapacity: 15000 },
            { name: "Botosani", city: "Botosani", primaryColor: "#FF0000", secondaryColor: "#FFFFFF", reputation: 5200, budget: 3000000, stadiumCapacity: 7000 },
            { name: "Otelul Galati", city: "Galati", primaryColor: "#FF0000", secondaryColor: "#0000FF", reputation: 5600, budget: 4500000, stadiumCapacity: 13000 },
            { name: "Cluj University", city: "Cluj-Napoca", primaryColor: "#000000", secondaryColor: "#FFFFFF", reputation: 5800, budget: 5500000, stadiumCapacity: 30000 }, // U Cluj
            { name: "Cluj Railway", city: "Cluj-Napoca", primaryColor: "#800000", secondaryColor: "#FFFFFF", reputation: 6600, budget: 14000000, stadiumCapacity: 23000 }, // CFR Cluj
            { name: "Arad", city: "Arad", primaryColor: "#FF0000", secondaryColor: "#FFFFFF", reputation: 5400, budget: 3800000, stadiumCapacity: 12000 }, // UTA Arad
            { name: "Farul", city: "Constanta", primaryColor: "#0000FF", secondaryColor: "#FFFFFF", reputation: 6500, budget: 12000000, stadiumCapacity: 15000 },
            { name: "Bucharest Star", city: "Bucharest", primaryColor: "#FF0000", secondaryColor: "#0000FF", reputation: 7000, budget: 18000000, stadiumCapacity: 55000 }, // FCSB
            { name: "Petrolul", city: "Ploiesti", primaryColor: "#FFFF00", secondaryColor: "#0000FF", reputation: 5700, budget: 5000000, stadiumCapacity: 15000 },
            { name: "Slobozia", city: "Slobozia", primaryColor: "#FFFF00", secondaryColor: "#0000FF", reputation: 4800, budget: 2000000, stadiumCapacity: 5000 },
            { name: "Csikszereda", city: "Miercurea Ciuc", primaryColor: "#FF0000", secondaryColor: "#000000", reputation: 4700, budget: 1800000, stadiumCapacity: 4000 },
            { name: "Hermannstadt", city: "Sibiu", primaryColor: "#FFFFFF", secondaryColor: "#FF0000", reputation: 5300, budget: 3500000, stadiumCapacity: 12000 },
            { name: "Metaloglobus", city: "Bucharest", primaryColor: "#FFFF00", secondaryColor: "#0000FF", reputation: 4500, budget: 1500000, stadiumCapacity: 3000 }
        ]
    },
    {
        id: 'sco', region: 'GROUP_B', name: 'Scotland Premiership', country: 'Scotland', foreignPlayerChance: 0.4, playerNationality: 'Scotland',
        matchFormat: 'double-round',

        logo: '/assets/logos/leagues/scotland.jpg',
        flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
        realTeams: [
            { name: "Glasgow Celts", city: "Glasgow", primaryColor: "#008000", secondaryColor: "#FFFFFF", reputation: 7500, budget: 35000000, stadiumCapacity: 60000 },
            { name: "Glasgow Rangers", city: "Glasgow", primaryColor: "#0000FF", secondaryColor: "#FFFFFF", reputation: 7400, budget: 30000000, stadiumCapacity: 50000 },
            { name: "Edinburgh Hearts", city: "Edinburgh", primaryColor: "#800000", secondaryColor: "#FFFFFF", reputation: 6500, budget: 8000000, stadiumCapacity: 20000 },
            { name: "Edinburgh Hibs", city: "Edinburgh", primaryColor: "#008000", secondaryColor: "#FFFFFF", reputation: 6400, budget: 7500000, stadiumCapacity: 20000 },
            { name: "Aberdeen", city: "Aberdeen", primaryColor: "#FF0000", secondaryColor: "#FFFFFF", reputation: 6600, budget: 9000000, stadiumCapacity: 20000 },
            { name: "Motherwell", city: "Motherwell", primaryColor: "#FFA500", secondaryColor: "#800000", reputation: 5800, budget: 4000000, stadiumCapacity: 13000 },
            { name: "Dundee United", city: "Dundee", primaryColor: "#FFA500", secondaryColor: "#000000", reputation: 6000, budget: 5000000, stadiumCapacity: 14000 },
            { name: "Dundee", city: "Dundee", primaryColor: "#0000FF", secondaryColor: "#FFFFFF", reputation: 5600, budget: 3500000, stadiumCapacity: 11000 },
            { name: "Saint Mirren", city: "Paisley", primaryColor: "#000000", secondaryColor: "#FFFFFF", reputation: 5700, budget: 3800000, stadiumCapacity: 8000 },
            { name: "Kilmarnock", city: "Kilmarnock", primaryColor: "#0000FF", secondaryColor: "#FFFFFF", reputation: 5900, budget: 4500000, stadiumCapacity: 15000 },
            { name: "Dingwall", city: "Dingwall", primaryColor: "#000080", secondaryColor: "#FFFFFF", reputation: 5400, budget: 2500000, stadiumCapacity: 6500 },
            { name: "Perth", city: "Perth", primaryColor: "#0000FF", secondaryColor: "#FFFFFF", reputation: 5200, budget: 2200000, stadiumCapacity: 10000 }
        ]
    },
    {
        id: 'at', region: 'GROUP_B', name: 'Austria Bundesliga', country: 'Austria', foreignPlayerChance: 0.3, playerNationality: 'Austria',
        matchFormat: 'double-round',

        logo: '/assets/logos/leagues/austria.jpg',
        flag: '🇦🇹',
        realTeams: [
            { name: "Salzburg", city: "Salzburg", primaryColor: "#FFFFFF", secondaryColor: "#FF0000", reputation: 7600, budget: 45000000, stadiumCapacity: 30000 },
            { name: "Sturm Graz", city: "Graz", primaryColor: "#000000", secondaryColor: "#FFFFFF", reputation: 7000, budget: 15000000, stadiumCapacity: 16000 },
            { name: "Linz", city: "Linz", primaryColor: "#FFFFFF", secondaryColor: "#000000", reputation: 6800, budget: 12000000, stadiumCapacity: 19000 },
            { name: "Rapid Vienna", city: "Vienna", primaryColor: "#008000", secondaryColor: "#FFFFFF", reputation: 6900, budget: 14000000, stadiumCapacity: 28000 },
            { name: "Austria Vienna", city: "Vienna", primaryColor: "#800080", secondaryColor: "#FFFFFF", reputation: 6700, budget: 11000000, stadiumCapacity: 17000 },
            { name: "Wolfsberg", city: "Wolfsberg", primaryColor: "#FFFFFF", secondaryColor: "#000000", reputation: 6200, budget: 7000000, stadiumCapacity: 7000 },
            { name: "Hartberg", city: "Hartberg", primaryColor: "#0000FF", secondaryColor: "#FFFFFF", reputation: 5900, budget: 5000000, stadiumCapacity: 5000 },
            { name: "Klagenfurt", city: "Klagenfurt", primaryColor: "#800080", secondaryColor: "#000000", reputation: 5800, budget: 4500000, stadiumCapacity: 30000 },
            { name: "Grazer", city: "Graz", primaryColor: "#FF0000", secondaryColor: "#FFFFFF", reputation: 5600, budget: 4000000, stadiumCapacity: 15000 },
            { name: "Altach", city: "Altach", primaryColor: "#000000", secondaryColor: "#FFFFFF", reputation: 5500, budget: 3500000, stadiumCapacity: 8000 },
            { name: "Wattens", city: "Wattens", primaryColor: "#008000", secondaryColor: "#FFFFFF", reputation: 5400, budget: 3200000, stadiumCapacity: 5000 },
            { name: "Linz Blue", city: "Linz", primaryColor: "#0000FF", secondaryColor: "#FFFFFF", reputation: 5300, budget: 3000000, stadiumCapacity: 6000 }
        ]
    },
    {
        id: 'ch', region: 'GROUP_A', name: 'Switzerland Super League', country: 'Switzerland', foreignPlayerChance: 0.35, playerNationality: 'Switzerland',
        matchFormat: 'double-round',

        logo: '/assets/logos/leagues/switzerland.jpg',
        flag: '🇨🇭',
        realTeams: [
            { name: "Bern", city: "Bern", primaryColor: "#FFFF00", secondaryColor: "#000000", reputation: 7400, budget: 25000000, stadiumCapacity: 32000 },
            { name: "Basel", city: "Basel", primaryColor: "#FF0000", secondaryColor: "#0000FF", reputation: 7200, budget: 22000000, stadiumCapacity: 38000 },
            { name: "Lugano", city: "Lugano", primaryColor: "#000000", secondaryColor: "#FFFFFF", reputation: 6800, budget: 15000000, stadiumCapacity: 6000 },
            { name: "Geneva", city: "Geneva", primaryColor: "#800000", secondaryColor: "#FFFFFF", reputation: 6700, budget: 14000000, stadiumCapacity: 30000 },
            { name: "Saint Gallen", city: "St Gallen", primaryColor: "#008000", secondaryColor: "#FFFFFF", reputation: 6600, budget: 12000000, stadiumCapacity: 19000 },
            { name: "Zurich", city: "Zurich", primaryColor: "#FFFFFF", secondaryColor: "#0000FF", reputation: 6900, budget: 16000000, stadiumCapacity: 26000 },
            { name: "Lucerne", city: "Luzern", primaryColor: "#0000FF", secondaryColor: "#FFFFFF", reputation: 6400, budget: 9000000, stadiumCapacity: 16000 },
            { name: "Winterthur", city: "Winterthur", primaryColor: "#FF0000", secondaryColor: "#FFFFFF", reputation: 5800, budget: 5000000, stadiumCapacity: 9000 },
            { name: "Zurich Grass", city: "Zurich", primaryColor: "#0000FF", secondaryColor: "#FFFFFF", reputation: 6200, budget: 8000000, stadiumCapacity: 26000 },
            { name: "Lausanne", city: "Lausanne", primaryColor: "#0000FF", secondaryColor: "#FFFFFF", reputation: 6000, budget: 7000000, stadiumCapacity: 12000 },
            { name: "Yverdon", city: "Yverdon", primaryColor: "#008000", secondaryColor: "#FFFFFF", reputation: 5700, budget: 4500000, stadiumCapacity: 6000 },
            { name: "Sion", city: "Sion", primaryColor: "#FF0000", secondaryColor: "#FFFFFF", reputation: 6300, budget: 8500000, stadiumCapacity: 14000 }
        ]
    },
    {
        id: 'gr', region: 'GROUP_B', name: 'Greece Super League', country: 'Greece', foreignPlayerChance: 0.4, playerNationality: 'Greece',
        matchFormat: 'double-round',

        logo: '/assets/logos/leagues/greece.jpg',
        flag: '🇬🇷',
        realTeams: [
            { name: "Piraeus", city: "Piraeus", primaryColor: "#FF0000", secondaryColor: "#FFFFFF", reputation: 7500, budget: 40000000, stadiumCapacity: 32000 },
            { name: "Thessaloniki", city: "Thessaloniki", primaryColor: "#000000", secondaryColor: "#FFFFFF", reputation: 7400, budget: 35000000, stadiumCapacity: 29000 },
            { name: "Athens AE", city: "Athens", primaryColor: "#FFFF00", secondaryColor: "#000000", reputation: 7400, budget: 35000000, stadiumCapacity: 31000 },
            { name: "Athens P", city: "Athens", primaryColor: "#008000", secondaryColor: "#FFFFFF", reputation: 7300, budget: 32000000, stadiumCapacity: 16000 },
            { name: "Thessaloniki Aris", city: "Thessaloniki", primaryColor: "#FFFF00", secondaryColor: "#000000", reputation: 6800, budget: 12000000, stadiumCapacity: 22000 },
            { name: "Volos", city: "Volos", primaryColor: "#FF0000", secondaryColor: "#0000FF", reputation: 6000, budget: 6000000, stadiumCapacity: 22000 },
            { name: "Peristeri", city: "Peristeri", primaryColor: "#0000FF", secondaryColor: "#FFFFFF", reputation: 6100, budget: 6500000, stadiumCapacity: 10000 },
            { name: "Tripoli", city: "Tripoli", primaryColor: "#FFFF00", secondaryColor: "#0000FF", reputation: 6000, budget: 6000000, stadiumCapacity: 7000 },
            { name: "Heraklion", city: "Heraklion", primaryColor: "#000000", secondaryColor: "#FFFFFF", reputation: 5900, budget: 5500000, stadiumCapacity: 9000 },
            { name: "Agrinio", city: "Agrinio", primaryColor: "#FFFF00", secondaryColor: "#0000FF", reputation: 5700, budget: 4500000, stadiumCapacity: 7000 },
            { name: "Lamia", city: "Lamia", primaryColor: "#0000FF", secondaryColor: "#FFFFFF", reputation: 5500, budget: 3500000, stadiumCapacity: 5000 },
            { name: "Ioannina", city: "Ioannina", primaryColor: "#0000FF", secondaryColor: "#FFFFFF", reputation: 5600, budget: 4000000, stadiumCapacity: 7000 },
            { name: "Kifisia", city: "Athens", primaryColor: "#0000FF", secondaryColor: "#FFFFFF", reputation: 5400, budget: 3000000, stadiumCapacity: 4000 },
            { name: "Panserraikos", city: "Serres", primaryColor: "#FF0000", secondaryColor: "#FFFFFF", reputation: 5500, budget: 3500000, stadiumCapacity: 9000 }
        ]
    },
    {
        id: 'hr', region: 'GROUP_C', name: 'SuperSport HNL', country: 'Croatia', foreignPlayerChance: 0.4, playerNationality: 'Croatia',
        matchFormat: 'double-round',

        logo: '/assets/logos/leagues/supersport.jpg',
        flag: '🇭🇷',
        realTeams: [
            { name: "Zagreb Blue", city: "Zagreb", primaryColor: "#0000FF", secondaryColor: "#FFFFFF", reputation: 6800, budget: 15000000, stadiumCapacity: 35000 },
            { name: "Split White", city: "Split", primaryColor: "#FFFFFF", secondaryColor: "#0000FF", reputation: 6600, budget: 12000000, stadiumCapacity: 34000 },
            { name: "Rijeka", city: "Rijeka", primaryColor: "#FFFFFF", secondaryColor: "#0000FF", reputation: 6400, budget: 8000000, stadiumCapacity: 8000 },
            { name: "Osijek", city: "Osijek", primaryColor: "#FFFFFF", secondaryColor: "#0000FF", reputation: 6200, budget: 7000000, stadiumCapacity: 13000 },
            { name: "Varazdin", city: "Varazdin", primaryColor: "#FFA500", secondaryColor: "#000000", reputation: 5500, budget: 3500000, stadiumCapacity: 10000 },
            { name: "Lokomotiva", city: "Zagreb", primaryColor: "#0000FF", secondaryColor: "#FFFFFF", reputation: 5800, budget: 4500000, stadiumCapacity: 5000 },
            { name: "Istra 1961", city: "Pula", primaryColor: "#FFFF00", secondaryColor: "#008000", reputation: 5400, budget: 3000000, stadiumCapacity: 9000 },
            { name: "Gorica", city: "Velika Gorica", primaryColor: "#FF0000", secondaryColor: "#000000", reputation: 5300, budget: 2800000, stadiumCapacity: 5000 },
            { name: "Slaven Belupo", city: "Koprivnica", primaryColor: "#0000FF", secondaryColor: "#FFFFFF", reputation: 5200, budget: 2500000, stadiumCapacity: 3000 },
            { name: "Vukovar 91", city: "Vukovar", primaryColor: "#0000FF", secondaryColor: "#FFFFFF", reputation: 5000, budget: 2000000, stadiumCapacity: 3000 }
        ]
    },
    {
        id: 'rs', region: 'GROUP_C', name: 'SuperLiga', country: 'Serbia', foreignPlayerChance: 0.3, playerNationality: 'Serbia',
        matchFormat: 'double-round',

        logo: '/assets/logos/leagues/superligaserbia.jpg',
        flag: '🇷🇸',
        realTeams: [
            { name: "Belgrade Red", city: "Belgrade", primaryColor: "#FF0000", secondaryColor: "#FFFFFF", reputation: 6900, budget: 20000000, stadiumCapacity: 53000 },
            { name: "Belgrade Black", city: "Belgrade", primaryColor: "#000000", secondaryColor: "#FFFFFF", reputation: 6700, budget: 15000000, stadiumCapacity: 30000 },
            { name: "Vojvodina", city: "Novi Sad", primaryColor: "#FF0000", secondaryColor: "#FFFFFF", reputation: 6000, budget: 6000000, stadiumCapacity: 14000 },
            { name: "Cukaricki", city: "Belgrade", primaryColor: "#FFFFFF", secondaryColor: "#000000", reputation: 5800, budget: 5000000, stadiumCapacity: 4000 },
            { name: "TSC Backa", city: "Backa Topola", primaryColor: "#0000FF", secondaryColor: "#FFFFFF", reputation: 5900, budget: 5500000, stadiumCapacity: 4500 },
            { name: "Radnicki Nis", city: "Nis", primaryColor: "#FF0000", secondaryColor: "#FFFFFF", reputation: 5500, budget: 3500000, stadiumCapacity: 18000 },
            { name: "Novi Pazar", city: "Novi Pazar", primaryColor: "#0000FF", secondaryColor: "#FFFFFF", reputation: 5400, budget: 3000000, stadiumCapacity: 10000 },
            { name: "Radnicki 1923", city: "Kragujevac", primaryColor: "#FF0000", secondaryColor: "#000000", reputation: 5300, budget: 2800000, stadiumCapacity: 15000 },
            { name: "Vozdovac", city: "Belgrade", primaryColor: "#FFFFFF", secondaryColor: "#FF0000", reputation: 5200, budget: 2500000, stadiumCapacity: 5000 },
            { name: "Mladost", city: "Lucani", primaryColor: "#0000FF", secondaryColor: "#FFFFFF", reputation: 5100, budget: 2200000, stadiumCapacity: 8000 },
            { name: "Spartak", city: "Subotica", primaryColor: "#0000FF", secondaryColor: "#FFFFFF", reputation: 5000, budget: 2000000, stadiumCapacity: 13000 },
            { name: "Napredak", city: "Krusevac", primaryColor: "#FF0000", secondaryColor: "#FFFFFF", reputation: 4900, budget: 1800000, stadiumCapacity: 10000 },
            { name: "Javor", city: "Ivanjica", primaryColor: "#FFFFFF", secondaryColor: "#FF0000", reputation: 4800, budget: 1600000, stadiumCapacity: 3000 },
            { name: "IMT", city: "Belgrade", primaryColor: "#FF0000", secondaryColor: "#000000", reputation: 4700, budget: 1500000, stadiumCapacity: 2000 },
            { name: "Zeleznicar", city: "Pancevo", primaryColor: "#FFFFFF", secondaryColor: "#0000FF", reputation: 4600, budget: 1400000, stadiumCapacity: 2000 },
            { name: "OFK Belgrade", city: "Belgrade", primaryColor: "#0000FF", secondaryColor: "#FFFFFF", reputation: 5600, budget: 4000000, stadiumCapacity: 19000 }
        ]
    },
    {
        id: 'cz', region: 'GROUP_C', name: 'Fortuna Liga', country: 'Czechia', foreignPlayerChance: 0.3, playerNationality: 'Czechia',
        matchFormat: 'double-round',

        logo: '/assets/logos/leagues/fortuna.jpg',
        flag: '🏳️',
        realTeams: [
            { name: "Prague Red", city: "Prague", primaryColor: "#FF0000", secondaryColor: "#FFFFFF", reputation: 7000, budget: 25000000, stadiumCapacity: 19000 },
            { name: "Prague Maroon", city: "Prague", primaryColor: "#800000", secondaryColor: "#FFFFFF", reputation: 6900, budget: 22000000, stadiumCapacity: 18000 },
            { name: "Plzen", city: "Plzen", primaryColor: "#FF0000", secondaryColor: "#0000FF", reputation: 6500, budget: 12000000, stadiumCapacity: 11000 },
            { name: "Ostrava", city: "Ostrava", primaryColor: "#0000FF", secondaryColor: "#FFFFFF", reputation: 6000, budget: 6000000, stadiumCapacity: 15000 },
            { name: "Mlada Boleslav", city: "Mlada Boleslav", primaryColor: "#0000FF", secondaryColor: "#FFFFFF", reputation: 5800, budget: 5000000, stadiumCapacity: 5000 },
            { name: "Slovacko", city: "Uherske Hradiste", primaryColor: "#0000FF", secondaryColor: "#FFFFFF", reputation: 5700, budget: 4500000, stadiumCapacity: 8000 },
            { name: "Liberec", city: "Liberec", primaryColor: "#0000FF", secondaryColor: "#FFFFFF", reputation: 5600, budget: 4000000, stadiumCapacity: 9900 },
            { name: "Olomouc", city: "Olomouc", primaryColor: "#0000FF", secondaryColor: "#FFFFFF", reputation: 5500, budget: 3500000, stadiumCapacity: 12000 },
            { name: "Hradec Kralove", city: "Hradec Kralove", primaryColor: "#000000", secondaryColor: "#FFFFFF", reputation: 5400, budget: 3000000, stadiumCapacity: 9000 },
            { name: "Teplice", city: "Teplice", primaryColor: "#FFFF00", secondaryColor: "#0000FF", reputation: 5300, budget: 2800000, stadiumCapacity: 18000 },
            { name: "Bohemians", city: "Prague", primaryColor: "#008000", secondaryColor: "#FFFFFF", reputation: 5200, budget: 2500000, stadiumCapacity: 6000 },
            { name: "Jablonec", city: "Jablonec", primaryColor: "#008000", secondaryColor: "#FFFFFF", reputation: 5100, budget: 2200000, stadiumCapacity: 6000 },
            { name: "Pardubice", city: "Pardubice", primaryColor: "#FF0000", secondaryColor: "#FFFFFF", reputation: 5000, budget: 2000000, stadiumCapacity: 4000 },
            { name: "Karvina", city: "Karvina", primaryColor: "#008000", secondaryColor: "#FFFFFF", reputation: 4900, budget: 1800000, stadiumCapacity: 4800 },
            { name: "Zlin", city: "Zlin", primaryColor: "#FFFF00", secondaryColor: "#0000FF", reputation: 4800, budget: 1600000, stadiumCapacity: 5000 },
            { name: "Dukla", city: "Prague", primaryColor: "#FF0000", secondaryColor: "#FFFF00", reputation: 4700, budget: 1500000, stadiumCapacity: 8000 }
        ]
    },
    {
        id: 'pl', region: 'GROUP_C', name: 'Ekstraklasa', country: 'Poland', foreignPlayerChance: 0.35, playerNationality: 'Poland',
        matchFormat: 'double-round',

        logo: '/assets/logos/leagues/eksraklasa.jpg',
        flag: '🇵🇱',
        realTeams: [
            { name: "Warsaw Poland", city: "Warsaw", primaryColor: "#FFFFFF", secondaryColor: "#000000", reputation: 6400, budget: 12000000, stadiumCapacity: 31000 },
            { name: "Poznan Blue", city: "Poznan", primaryColor: "#0000FF", secondaryColor: "#FFFFFF", reputation: 6300, budget: 10000000, stadiumCapacity: 43000 },
            { name: "Rakow", city: "Czestochowa", primaryColor: "#FF0000", secondaryColor: "#0000FF", reputation: 6500, budget: 11000000, stadiumCapacity: 5500 },
            { name: "Szczecin", city: "Szczecin", primaryColor: "#000080", secondaryColor: "#800000", reputation: 6000, budget: 7000000, stadiumCapacity: 21000 },
            { name: "Jagiellonia", city: "Bialystok", primaryColor: "#FFFF00", secondaryColor: "#FF0000", reputation: 6500, budget: 8500000, stadiumCapacity: 22000 },
            { name: "Zabrze", city: "Zabrze", primaryColor: "#FFFFFF", secondaryColor: "#FF0000", reputation: 5900, budget: 5000000, stadiumCapacity: 24000 },
            { name: "Slask", city: "Wroclaw", primaryColor: "#008000", secondaryColor: "#FFFFFF", reputation: 5800, budget: 4500000, stadiumCapacity: 45000 },
            { name: "Cracovia", city: "Krakow", primaryColor: "#FF0000", secondaryColor: "#FFFFFF", reputation: 5700, budget: 4000000, stadiumCapacity: 15000 },
            { name: "Lubin", city: "Lubin", primaryColor: "#FFA500", secondaryColor: "#008000", reputation: 5600, budget: 3500000, stadiumCapacity: 16000 },
            { name: "Piast", city: "Gliwice", primaryColor: "#0000FF", secondaryColor: "#FF0000", reputation: 5500, budget: 3200000, stadiumCapacity: 10000 },
            { name: "Radomiak", city: "Radom", primaryColor: "#008000", secondaryColor: "#FFFFFF", reputation: 5400, budget: 3000000, stadiumCapacity: 4000 },
            { name: "Widzew", city: "Lodz", primaryColor: "#FF0000", secondaryColor: "#FFFFFF", reputation: 5500, budget: 3500000, stadiumCapacity: 18000 },
            { name: "Korona", city: "Kielce", primaryColor: "#FFFF00", secondaryColor: "#FF0000", reputation: 5200, budget: 2500000, stadiumCapacity: 15000 },
            { name: "Plock", city: "Plock", primaryColor: "#0000FF", secondaryColor: "#FFFFFF", reputation: 5100, budget: 2200000, stadiumCapacity: 10000 },
            { name: "Gdansk", city: "Gdansk", primaryColor: "#008000", secondaryColor: "#FFFFFF", reputation: 5300, budget: 2800000, stadiumCapacity: 41000 },
            { name: "Katowice", city: "Katowice", primaryColor: "#FFFF00", secondaryColor: "#000000", reputation: 5000, budget: 2000000, stadiumCapacity: 7000 },
            { name: "Motor", city: "Lublin", primaryColor: "#FFFF00", secondaryColor: "#0000FF", reputation: 4900, budget: 1800000, stadiumCapacity: 15000 },
            { name: "Arka", city: "Gdynia", primaryColor: "#FFFF00", secondaryColor: "#0000FF", reputation: 4800, budget: 1600000, stadiumCapacity: 15000 }
        ]
    },
    {
        id: 'gh', region: 'GROUP_H', name: 'Premier League', country: 'Ghana', foreignPlayerChance: 0.1, playerNationality: 'Ghana',
        matchFormat: 'double-round',

        logo: '/assets/logos/leagues/ghana.jpg',
        flag: '🇬🇭',
        realTeams: [
            { name: "Medeama", city: "Tarkwa", primaryColor: "#FFFF00", secondaryColor: "#800080", reputation: 4500, budget: 3000000, stadiumCapacity: 10000 },
            { name: "Aduana Stars", city: "Dormaa Ahenkro", primaryColor: "#008000", secondaryColor: "#FFFFFF", reputation: 4600, budget: 3200000, stadiumCapacity: 5000 },
            { name: "Porcupine Warriors", city: "Kumasi", primaryColor: "#FF0000", secondaryColor: "#FFFFFF", reputation: 5000, budget: 5000000, stadiumCapacity: 40000 },
            { name: "Accra Hearts", city: "Accra", primaryColor: "#FF0000", secondaryColor: "#FFFF00", reputation: 4900, budget: 4800000, stadiumCapacity: 40000 },
            { name: "Samartex", city: "Samreboi", primaryColor: "#008000", secondaryColor: "#FFFFFF", reputation: 4400, budget: 2500000, stadiumCapacity: 7000 },
            { name: "Gold Stars", city: "Bibiani", primaryColor: "#FFFF00", secondaryColor: "#000000", reputation: 4300, budget: 2200000, stadiumCapacity: 5000 },
            { name: "Heart of Lions", city: "Kpando", primaryColor: "#0000FF", secondaryColor: "#FFFFFF", reputation: 4200, budget: 2000000, stadiumCapacity: 5000 },
            { name: "Nations FC", city: "Kumasi", primaryColor: "#FFA500", secondaryColor: "#FFFFFF", reputation: 4100, budget: 1800000, stadiumCapacity: 12000 },
            { name: "Dreams FC", city: "Accra", primaryColor: "#008000", secondaryColor: "#FFFFFF", reputation: 4000, budget: 1500000, stadiumCapacity: 5000 },
            { name: "Bechem Utd", city: "Bechem", primaryColor: "#008000", secondaryColor: "#FFFFFF", reputation: 4200, budget: 2100000, stadiumCapacity: 5000 },
            { name: "Karela United", city: "Aiyinase", primaryColor: "#008000", secondaryColor: "#FF0000", reputation: 4100, budget: 1900000, stadiumCapacity: 5000 },
            { name: "All Blacks", city: "Swedru", primaryColor: "#000000", secondaryColor: "#FFFFFF", reputation: 3800, budget: 1200000, stadiumCapacity: 5000 },
            { name: "Vision FC", city: "Accra", primaryColor: "#0000FF", secondaryColor: "#FFFFFF", reputation: 3700, budget: 1000000, stadiumCapacity: 3000 },
            { name: "Berekum Chelsea", city: "Berekum", primaryColor: "#0000FF", secondaryColor: "#FFFFFF", reputation: 4300, budget: 2300000, stadiumCapacity: 5000 },
            { name: "Holy Stars", city: "Aiyinase", primaryColor: "#008000", secondaryColor: "#FFFF00", reputation: 3600, budget: 900000, stadiumCapacity: 3000 },
            { name: "Young Apostles", city: "Wenchi", primaryColor: "#0000FF", secondaryColor: "#FFFFFF", reputation: 3500, budget: 850000, stadiumCapacity: 2000 },
            { name: "Legon Cities", city: "Accra", primaryColor: "#FF0000", secondaryColor: "#000000", reputation: 3400, budget: 850000, stadiumCapacity: 7000 },
            { name: "Nsoatreman", city: "Nsoatre", primaryColor: "#008000", secondaryColor: "#FFFFFF", reputation: 3500, budget: 900000, stadiumCapacity: 2000 }
        ]
    },
    {
        id: 'cn', region: 'GROUP_E', name: 'Chinese Super League', country: 'China', foreignPlayerChance: 0.4, playerNationality: 'China',
        matchFormat: 'double-round',

        logo: '/assets/logos/leagues/china.jpg',
        flag: '🇨🇳',
        realTeams: [
            { name: "Shanghai Port", city: "Shanghai", primaryColor: "#E60012", secondaryColor: "#FFFFFF", reputation: 6500, budget: 40000000, stadiumCapacity: 37000 },
            { name: "Shanghai Shenhua", city: "Shanghai", primaryColor: "#0055A5", secondaryColor: "#FFFFFF", reputation: 6200, budget: 35000000, stadiumCapacity: 33060 },
            { name: "Chengdu Rongcheng", city: "Chengdu", primaryColor: "#FF0000", secondaryColor: "#FFFFFF", reputation: 6000, budget: 30000000, stadiumCapacity: 40000 },
            { name: "Beijing Guoan", city: "Beijing", primaryColor: "#008000", secondaryColor: "#FFFF00", reputation: 6100, budget: 32000000, stadiumCapacity: 68000 },
            { name: "Shandong Taishan", city: "Jinan", primaryColor: "#FF6600", secondaryColor: "#FFFFFF", reputation: 5900, budget: 28000000, stadiumCapacity: 56808 },
            { name: "Tianjin Jinmen Tiger", city: "Tianjin", primaryColor: "#4169E1", secondaryColor: "#FFFFFF", reputation: 5500, budget: 22000000, stadiumCapacity: 54696 },
            { name: "Zhejiang FC", city: "Hangzhou", primaryColor: "#008000", secondaryColor: "#FFFFFF", reputation: 5600, budget: 24000000, stadiumCapacity: 51971 },
            { name: "Henan FC", city: "Zhengzhou", primaryColor: "#FFOO00", secondaryColor: "#008000", reputation: 5400, budget: 20000000, stadiumCapacity: 29860 },
            { name: "Changchun Yatai", city: "Changchun", primaryColor: "#FF0000", secondaryColor: "#FFFFFF", reputation: 5200, budget: 18000000, stadiumCapacity: 38500 },
            { name: "Qingdao West Coast", city: "Qingdao", primaryColor: "#FFFF00", secondaryColor: "#0000FF", reputation: 4800, budget: 15000000, stadiumCapacity: 20000 },
            { name: "Wuhan Three Towns", city: "Wuhan", primaryColor: "#0000FF", secondaryColor: "#FFFFFF", reputation: 5700, budget: 25000000, stadiumCapacity: 54000 },
            { name: "Qingdao Hainiu", city: "Qingdao", primaryColor: "#FFA500", secondaryColor: "#0000FF", reputation: 4900, budget: 16000000, stadiumCapacity: 45000 },
            { name: "Cangzhou Mighty Lions", city: "Cangzhou", primaryColor: "#0000FF", secondaryColor: "#FFFFFF", reputation: 4800, budget: 14000000, stadiumCapacity: 31836 },
            { name: "Shenzhen City", city: "Shenzhen", primaryColor: "#0000FF", secondaryColor: "#FFFF00", reputation: 5000, budget: 18000000, stadiumCapacity: 60334 },
            { name: "Meizhou Hakka", city: "Meizhou", primaryColor: "#FF0000", secondaryColor: "#FFFFFF", reputation: 4700, budget: 12000000, stadiumCapacity: 27000 },
            { name: "Nantong Zhiyun", city: "Nantong", primaryColor: "#0000FF", secondaryColor: "#FFFFFF", reputation: 4600, budget: 10000000, stadiumCapacity: 32244 }
        ]
    },
    {
        id: 'py', region: 'GROUP_D', name: 'Primera División', country: 'Paraguay', foreignPlayerChance: 0.3, playerNationality: 'Paraguay',
        matchFormat: 'double-round',

        logo: '/assets/logos/leagues/paraguay.jpg',
        flag: '🇵🇾',
        realTeams: [
            { name: "Olimpia Asuncion", city: "Asunción", primaryColor: "#FFFFFF", secondaryColor: "#000000", reputation: 6200, budget: 8000000, stadiumCapacity: 22000 },
            { name: "Cerro Porteno", city: "Asunción", primaryColor: "#000080", secondaryColor: "#FF0000", reputation: 6100, budget: 7500000, stadiumCapacity: 45000 },
            { name: "Libertad Asuncion", city: "Asunción", primaryColor: "#000000", secondaryColor: "#FFFFFF", reputation: 6000, budget: 10000000, stadiumCapacity: 10100 },
            { name: "Club Guarani", city: "Asunción", primaryColor: "#FFFF00", secondaryColor: "#000000", reputation: 5800, budget: 6000000, stadiumCapacity: 5000 },
            { name: "Nacional Asuncion", city: "Asunción", primaryColor: "#FFFFFF", secondaryColor: "#000080", reputation: 5700, budget: 5500000, stadiumCapacity: 4434 },
            { name: "Sportivo Luqueno", city: "Luque", primaryColor: "#FFFF00", secondaryColor: "#0000FF", reputation: 5600, budget: 5000000, stadiumCapacity: 26974 },
            { name: "Sportivo Ameliano", city: "Asunción", primaryColor: "#0000FF", secondaryColor: "#FFFFFF", reputation: 5000, budget: 3000000, stadiumCapacity: 5000 },
            { name: "Sportivo Trinidense", city: "Asunción", primaryColor: "#FFFF00", secondaryColor: "#0000FF", reputation: 4900, budget: 2800000, stadiumCapacity: 3000 },
            { name: "Club 2 de Mayo", city: "Pedro Juan Caballero", primaryColor: "#0000FF", secondaryColor: "#FFFFFF", reputation: 4800, budget: 2500000, stadiumCapacity: 25000 },
            { name: "Tacuary FC", city: "Asunción", primaryColor: "#FFFFFF", secondaryColor: "#000000", reputation: 4700, budget: 2200000, stadiumCapacity: 4000 },
            { name: "General Caballero JLM", city: "Mallorquín", primaryColor: "#FF0000", secondaryColor: "#FFFF00", reputation: 4600, budget: 2000000, stadiumCapacity: 10130 },
            { name: "Sol de America", city: "Villa Elisa", primaryColor: "#0000FF", secondaryColor: "#FFFFFF", reputation: 5200, budget: 4000000, stadiumCapacity: 10000 }
        ]
    },
    {
        id: 'ec', region: 'GROUP_G', name: 'Liga Pro', country: 'Ecuador', foreignPlayerChance: 0.3, playerNationality: 'Ecuador',
        matchFormat: 'double-round',

        logo: '/assets/logos/leagues/ecuador.jpg',
        flag: '🇪🇨',
        realTeams: [
            { name: "LDU Quito", city: "Quito", primaryColor: "#FFFFFF", secondaryColor: "#000080", reputation: 6300, budget: 12000000, stadiumCapacity: 41575 },
            { name: "Independiente del Valle", city: "Sangolquí", primaryColor: "#000000", secondaryColor: "#0000FF", reputation: 6500, budget: 15000000, stadiumCapacity: 12000 },
            { name: "Guayaquil Sun", city: "Guayaquil", primaryColor: "#FFFF00", secondaryColor: "#000000", reputation: 6400, budget: 11000000, stadiumCapacity: 57267 },
            { name: "CS Emelec", city: "Guayaquil", primaryColor: "#0000FF", secondaryColor: "#C0C0C0", reputation: 6200, budget: 10000000, stadiumCapacity: 40000 },
            { name: "SD Aucas", city: "Quito", primaryColor: "#FFFF00", secondaryColor: "#FF0000", reputation: 5800, budget: 7000000, stadiumCapacity: 18799 },
            { name: "Uni Catolica EC", city: "Quito", primaryColor: "#0000FF", secondaryColor: "#FFFFFF", reputation: 5700, budget: 6000000, stadiumCapacity: 35742 },
            { name: "El Nacional", city: "Quito", primaryColor: "#FF0000", secondaryColor: "#0000FF", reputation: 5900, budget: 5000000, stadiumCapacity: 35742 },
            { name: "Delfin SC", city: "Manta", primaryColor: "#FFFF00", secondaryColor: "#0000FF", reputation: 5500, budget: 4500000, stadiumCapacity: 21000 },
            { name: "Deportivo Cuenca", city: "Cuenca", primaryColor: "#FF0000", secondaryColor: "#000000", reputation: 5400, budget: 4000000, stadiumCapacity: 16500 },
            { name: "Macara", city: "Ambato", primaryColor: "#0000FF", secondaryColor: "#FFFFFF", reputation: 5300, budget: 3500000, stadiumCapacity: 16467 },
            { name: "Orense SC", city: "Machala", primaryColor: "#008000", secondaryColor: "#FFFFFF", reputation: 5100, budget: 3000000, stadiumCapacity: 16100 },
            { name: "Mushuc Runa", city: "Ambato", primaryColor: "#FF0000", secondaryColor: "#008000", reputation: 5000, budget: 2500000, stadiumCapacity: 8200 },
            { name: "Libertad FC", city: "Loja", primaryColor: "#FFA500", secondaryColor: "#FFFFFF", reputation: 4600, budget: 1500000, stadiumCapacity: 14935 },
            { name: "Tecnico Universitario", city: "Ambato", primaryColor: "#FF0000", secondaryColor: "#FFFFFF", reputation: 4900, budget: 2000000, stadiumCapacity: 16467 },
            { name: "Cumbaya FC", city: "Quito", primaryColor: "#0000FF", secondaryColor: "#FFFFFF", reputation: 4500, budget: 1200000, stadiumCapacity: 35742 },
            { name: "Imbabura SC", city: "Ibarra", primaryColor: "#0000FF", secondaryColor: "#FFFF00", reputation: 4400, budget: 1000000, stadiumCapacity: 17300 }
        ]
    },
];



export const DERBY_RIVALS: Record<string, string[]> = {
    // --- TURKEY ---
    'Galata Lions': ['Istanbul Yellows', 'Istanbul Eagles', 'Trabzon Storm'],
    'Istanbul Yellows': ['Galata Lions', 'Istanbul Eagles', 'Trabzon Storm'],
    'Istanbul Eagles': ['Galata Lions', 'Istanbul Yellows', 'Trabzon Storm'],
    'Trabzon Storm': ['Galata Lions', 'Istanbul Yellows', 'Istanbul Eagles'],

    // --- ENGLAND ---
    'Merseyside Reds': ['Merseyside Blues', 'Manchester Devils', 'Manchester Skyblues'],
    'Manchester Devils': ['Manchester Skyblues', 'Merseyside Reds', 'Yorkshire Whites'],
    'Manchester Skyblues': ['Manchester Devils', 'Merseyside Reds'],
    'London Cannons': ['North London Whites', 'London Blue Lions'],
    'North London Whites': ['London Cannons', 'London Blue Lions'],
    'London Blue Lions': ['London Cannons', 'North London Whites'],

    // --- SPAIN ---
    'Madrid Blancos': ['Madrid Indios', 'Catalonia Blau'],
    'Catalonia Blau': ['Madrid Blancos', 'Espanyol Parrots'],
    'Madrid Indios': ['Madrid Blancos'],
    'Seville GreenWhites': ['Nervion Red-Whites'],
    'Nervion Red-Whites': ['Seville GreenWhites'],
    'San Sebastian Blue': ['Bilbao Lions'],
    'Bilbao Lions': ['San Sebastian Blue'],

    // --- ITALY ---
    'Inter Lombardia': ['Milano Devils', 'Piemonte Zebras'],
    'Milano Devils': ['Inter Lombardia', 'Piemonte Zebras'],
    'Piemonte Zebras': ['Inter Lombardia', 'Milano Devils', 'Torino Bulls'],
    'Torino Bulls': ['Piemonte Zebras'],
    'Roma Gladiators': ['Latium Eagles'],
    'Latium Eagles': ['Roma Gladiators'],
    'Genoa Griffins': ['Sampdoria Blue'],

    // --- GERMANY ---
    'Munich Red': ['Westphalia Yellows', 'Berlin Iron'], // Klassiker
    'Westphalia Yellows': ['Munich Red', 'Bochum Blue'], // Ruhr derbisi (Schalke yoksa Bochum)
    'Hamburg Pirates': ['Bremen River'], // Nordderby

    // --- FRANCE ---
    'Paris Red-Blue': ['Marseille Blue'], // Le Classique
    'Marseille Blue': ['Paris Red-Blue', 'Lyon Kids'],
    'Lyon Kids': ['Saint-Green', 'Marseille Blue'], // Rhone-Alpes Derby

    // --- ARGENTINA ---
    'Buenos Aires Millionaires': ['La Boca Xeneizes', 'Avellaneda Racers', 'Avellaneda Devils', 'Boedo Saints'],
    'La Boca Xeneizes': ['Buenos Aires Millionaires', 'Avellaneda Racers', 'Avellaneda Devils', 'Boedo Saints'],
    'Avellaneda Racers': ['Avellaneda Devils', 'La Boca Xeneizes', 'Buenos Aires Millionaires'],
    'Avellaneda Devils': ['Avellaneda Racers', 'La Boca Xeneizes', 'Buenos Aires Millionaires'],
    'Rosario Canallas': ['Rosario Lepers'],
    'Rosario Lepers': ['Rosario Canallas'],
    'La Plata Lions': ['La Plata Wolves'],
    'La Plata Wolves': ['La Plata Lions'],

    // --- BRAZIL ---
    'São Paulo Palms': ['São Paulo Warriors', 'São Paulo Tigers', 'Santos Beach'],
    'São Paulo Warriors': ['São Paulo Palms', 'São Paulo Tigers', 'Santos Beach'],
    'São Paulo Tigers': ['São Paulo Palms', 'São Paulo Warriors', 'Santos Beach'],
    'Santos Beach': ['São Paulo Palms', 'São Paulo Warriors', 'São Paulo Tigers'],
    'Rio Flames': ['Rio Sailors', 'Rio Star', 'Rio Waves'],
    'Rio Sailors': ['Rio Flames', 'Rio Star', 'Rio Waves'],
    'Rio Star': ['Rio Flames', 'Rio Sailors', 'Rio Waves'],
    'Rio Waves': ['Rio Flames', 'Rio Sailors', 'Rio Star'],
    'Porto Alegre Blues': ['Porto Alegre Reds'],
    'Porto Alegre Reds': ['Porto Alegre Blues'],
    'Belo Horizonte Cruisers': ['Belo Horizonte Miners'],
    'Belo Horizonte Miners': ['Belo Horizonte Cruisers'],
    'Curitiba Storm': ['Curitiba Greens'],
    'Curitiba Greens': ['Curitiba Storm'],

    // --- SAUDI ARABIA (Fake Names Updated) ---
    'Riyadh Blue Waves': ['Riyadh Knights', 'Jeddah Tigers', 'Jeddah Green', 'Riyadh Youth'],
    'Riyadh Knights': ['Riyadh Blue Waves', 'Jeddah Tigers', 'Riyadh Youth'],
    'Jeddah Tigers': ['Riyadh Blue Waves', 'Riyadh Knights', 'Jeddah Green'],
    'Jeddah Green': ['Jeddah Tigers', 'Riyadh Blue Waves'],

    // --- EGYPT (Fake Names Updated) ---
    'Cairo Red Devils': ['Cairo Knights', 'Pyramids FC'],
    'Cairo Knights': ['Cairo Red Devils', 'Pyramids FC'],
    'Pyramids FC': ['Cairo Red Devils', 'Cairo Knights'],
    'Ittihad Alexandria': ['Smouha', 'Harras El Hodoud'], // Alexandria Derby

    // --- MOROCCO (Fake Names Updated) ---
    'Casablanca Eagles': ['Casablanca Reds', 'AS FAR'],
    'Casablanca Reds': ['Casablanca Eagles', 'AS FAR'],
    'AS FAR': ['Casablanca Eagles', 'Casablanca Reds', 'FUS Rabat'],
    'FUS Rabat': ['AS FAR'],

    // --- SOUTH AFRICA (Fake Names Updated) ---
    'Pretoria Brazilians': ['Soweto Pirates', 'Soweto Chiefs', 'SuperSport United'], // Pretoria Derby
    'Soweto Pirates': ['Soweto Chiefs', 'Pretoria Brazilians'], // Soweto Derby
    'Soweto Chiefs': ['Soweto Pirates', 'Pretoria Brazilians'],
    'SuperSport United': ['Pretoria Brazilians'],

    // --- JAPAN ---
    'Urawa Red Diamonds': ['Gamba Osaka', 'FC Tokyo'],
    'Gamba Osaka': ['Cerezo Osaka', 'Urawa Red Diamonds'], // Osaka Derby
    'Cerezo Osaka': ['Gamba Osaka'],
    'FC Tokyo': ['Tokyo Verdy', 'Kawasaki Frontale'], // Tokyo Derby & Tamagawa Classico
    'Tokyo Verdy': ['FC Tokyo'],
    'Kawasaki Frontale': ['FC Tokyo', 'Yokohama F. Marinos'],
    'Yokohama F. Marinos': ['Kawasaki Frontale'],

    // --- SOUTH KOREA (Fake Names Updated) ---
    'Seoul City': ['Ulsan Tigers', 'Jeonju Motors', 'Incheon United'], // Gyeongin Derby (Incheon)
    'Ulsan Tigers': ['Jeonju Motors', 'Seoul City', 'Pohang Steelers'],
    'Jeonju Motors': ['Ulsan Tigers', 'Seoul City'],
    'Pohang Steelers': ['Ulsan Tigers'], // Donghaean Derby
    'Incheon United': ['Seoul City'],

    // --- AUSTRALIA ---
    'Sydney FC': ['WS Wanderers', 'Melbourne Victory'], // Sydney Derby & The Big Blue
    'WS Wanderers': ['Sydney FC'],
    'Melbourne Victory': ['Melbourne City', 'Sydney FC', 'Adelaide United'], // Melbourne Derby & The Big Blue & Original Rivalry
    'Melbourne City': ['Melbourne Victory'],
    'Adelaide United': ['Melbourne Victory'],

    // --- USA ---
    'Los Angeles Gold': ['Galaxy Stars'], // El Trafico
    'Galaxy Stars': ['Los Angeles Gold', 'San Jose Quakes'],
    'New York City Blue': ['New York Energy'], // Hudson River Derby
    'New York Energy': ['New York City Blue'],
    'Seattle Emeralds': ['Portland Timbers', 'Vancouver Village'], // Cascadia Cup
    'Portland Timbers': ['Seattle Emeralds', 'Vancouver Village'],
    'Vancouver Village': ['Seattle Emeralds', 'Portland Timbers'],
    'Miami Vice': ['Orlando Lions'], // Florida Derby
    'Orlando Lions': ['Miami Vice'],

    // --- MEXICO ---
    'Mexico Eagles': ['Guadalajara Goats', 'Mexico City Pumas', 'Mexico City Cement'], // Super Clasico & Capital Derbies
    'Guadalajara Goats': ['Mexico Eagles', 'Guadalajara Foxes'], // Tapatio Derby
    'Guadalajara Foxes': ['Guadalajara Goats'],
    'Monterrey Tigers': ['Monterrey Rays'], // Regio Derby
    'Monterrey Rays': ['Monterrey Tigers'],
    'Mexico City Cement': ['Mexico Eagles', 'Mexico City Pumas'],
    'Mexico City Pumas': ['Mexico Eagles', 'Mexico City Cement'],

    // --- CHILE ---
    'Santiago Chiefs': ['Santiago Scholars', 'Santiago Crusaders'], // Superclásico
    'Santiago Scholars': ['Santiago Chiefs', 'Santiago Crusaders'], // Universitario
    'Santiago Crusaders': ['Santiago Chiefs', 'Santiago Scholars'],

    // --- URUGUAY ---
    'Montevideo Coal': ['Montevideo Tricolor'], // Superclásico Uruguayo
    'Montevideo Tricolor': ['Montevideo Coal'],

    // --- CARIBBEAN ---
    'Kingston Bay United': ['Montego Bay Waves', 'Cavalier Town FC'], // Jamaica Derby
    'Montego Bay Waves': ['Kingston Bay United', 'Cavalier Town FC'],
    'Cavalier Town FC': ['Kingston Bay United', 'Montego Bay Waves'],
    'Port of Spain Warriors': ['Trinbago Riders FC'], // Trinidad Derby
    'Trinbago Riders FC': ['Port of Spain Warriors'],
    'Cibao Orange FC': ['O&M University'], // Dominican Derby
    'O&M University': ['Cibao Orange FC'],
    'Port-au-Prince AC': ['Cavaly SC'], // Haiti Derby
    'Cavaly SC': ['Port-au-Prince AC'],

    // --- COLOMBIA ---
    'Medellin Green': ['Medellin Red', 'Cali Devils', 'Bogota Blues'], // El Clásico Paisa & Others
    'Medellin Red': ['Medellin Green'],
    'Bogota Blues': ['Bogota Cardinals', 'Medellin Green', 'Cali Sugar'], // Clásico Capitalino
    'Bogota Cardinals': ['Bogota Blues'],
    'Cali Sugar': ['Cali Devils', 'Bogota Blues'], // Clásico Vallecaucano
    'Cali Devils': ['Cali Sugar', 'Medellin Green']
};

