# Teams A-D List from User (72 teams total)
teams_list = [
    "Aba Elephants",
    "Abidjan Yellows", 
    "Adelaide United",
    "Al-Fateh",
    "Al-Fayha",
    "Al-Hazem",
    "Al-Khaleej",
    "Al-Kholood",
    "Al-Najma",
    "Al-Okhdood",
    "Al-Qadsiah",
    "Al-Riyadh",
    "Al-Taawoun",
    "Algiers Union",
    "Alajuela Lions",
    "Angers Black-Whites",
    "AS FAR",
    "Atlanta Stripes",
    "Atlantico Blue Stars",
    "Auckland FC",
    "Augsburg FC",
    "Austin Verdes",
    "Avellaneda Devils",
    "Avellaneda Racers",
    "Avispa Fukuoka",
    "Banfield Drills",
    "Bank El Ahly",
    "Barbados Royal Club",
    "Barracas Truckers",
    "Barranquilla Sharks",
    "Belém Lions",
    "Belo Horizonte Cruisers",
    "Belo Horizonte Miners",
    "Belvedere Blue",
    "Bergamo United",
    "Birmingham Villans",
    "Bizerte Sharks",
    "Bochum Blue",
    "Boedo Saints",
    "Bogotá Blues",
    "Bogotá Cardinals",
    "Bogotá Fort",
    "Bologna Redblues",
    "Bragança Bulls",
    "Bremen River",
    "Brest Pirates",
    "Brighton Seagulls",
    "Brisbane Roar",
    "Bucaramanga Leopards",
    "Bucheon FC 1995",
    "Buenos Aires Millionaires",
    "Buenos Aires Storm",
    "Buriram Thunder",
    "Cagliari Islanders",
    "Cairo Knights",
    "Cairo Red Devils",
    "Calera Red",
    "Cali Devils",
    "Cali Sugar",
    "Canary Yellows",
    "Cape Town City",
    "Cartago Blues",
    "Casablanca Eagles",
    "Casablanca Reds",
    "Castilla Violet",
    "Catalonia Blau",
    "Cavalier Town FC",
    "Cavaly SC",
    "Central Coast Mariners",
    "Cerezo Osaka",
    "Challengers United",
    "Chapecó Eagles",
    "Charlotte Crowns",
    "Chicago Firemen",
    "Chillan Red",
    "Cibao Orange FC",
    "Cincinnati Royals",
    "Citadel Saints",
    "City of Melbourne",
    "Cleopatra FC",
    "Club Africain",
    "COD Meknès",
    "Columbus Crew",
    "Como Lakers",
    "Concepción Purple",
    "Concepción Uni",
    "Coquimbo Pirates",
    "Cordoba Glory",
    "Cordoba Pirates",
    "Cordoba Tall",
    "Crystal Glaziers",
    "Cucuta Border",
    "Curitiba Greens",
    "Curitiba Storm",
    "Daejeon Hana Citizen",
    "Dallas Burn",
    "Damac FC",
    "Dammam Commandos",
    "Dar Citizens",
    "Dar Lions",
    "Desert Miners",
    "Difaâ El Jadidi",
    "Doha Sadd",
]

print(f"Total teams in list: {len(teams_list)}")

# Check which ones are in constants.ts
import re

with open('constants.ts', 'r', encoding='utf-8') as f:
    content = f.read()

found = []
missing = []

for team in teams_list:
    pattern = f'"{re.escape(team)}"\\s*:'
    if re.search(pattern, content):
        found.append(team)
    else:
        missing.append(team)

print(f"\nFound in constants.ts: {len(found)}")
print(f"Missing from constants.ts: {len(missing)}")

if missing:
    print("\nMissing teams:")
    for team in missing:
        print(f"  - {team}")
