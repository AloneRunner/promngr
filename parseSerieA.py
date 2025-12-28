import random

def estimate_age(rating):
    if rating >= 88:
        return random.randint(27, 33)
    elif rating >= 83:
        return random.randint(25, 30)
    elif rating >= 78:
        return random.randint(24, 29)
    elif rating >= 70:
        return random.randint(22, 28)
    else:
        return random.randint(18, 25)

team_mapping = {
    "Lombardia FC": "Inter Blue",
    "Milano FC": "Milan Red",
    "Juventus": "Turin Zebras",
    "SSC Napoli": "Napoli Blue",
    "AS Roma": "Roma Wolves",
    "Latium": "Lazio Eagles",
    "Bergamo Calcio": "Bergamo Blue",
    "Fiorentina": "Florence Violet",
    "Bologna": "Bologna FC",
    "Torino": "Turin Bulls",
    "Sassuolo": "Sassuolo Green",
    "Udinese": "Udine White",
    "Genoa": "Genoa RedBlue",
    "Lecce": "Lecce Yellow",
    "Hellas Verona": "Verona Blue",
    "Parma": "Parma Crusaders",
    "Cagliari": "Cagliari RedBlue",
    "Como": "Como Blue",
    "Pisa": "Pisa Tower",
    "Cremonese": "Cremosa Red",
    "Paris Saint": "SKIP", # Skip PSG as it's in Ligue 1
    "PSG": "SKIP"
}

def parse_seriea():
    players = []
    
    with open('raw_data_seriea.txt', 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    # Skip header
    lines = lines[1:]
    
    for line in lines:
        parts = line.strip().split('\t')
        if len(parts) < 12:
            continue
            
        rank, name, nation, team, pos, rating_str, pace, shot, pas, dri, def_, phy = parts[:12]
        
        rating = int(rating_str)
        
        if team in team_mapping:
            if team_mapping[team] == "SKIP":
                continue
            team_name = team_mapping[team]
        else:
            # Default mapping or skip? Let's keep it if it looks like a team, but filtering helps quality.
            # If not in mapping, maybe it's a team we missed or a filtered player from another league.
            # The list provided seems to be mostly Serie A + PSG.
            # Let's map unknown teams to themselves but sanitize.
            team_name = team
        
        # Simple name transformation to avoid direct copyright match if needed, 
        # but user said "Creative Naming". The team names are already transformed.
        # Let's keep player names as is, or maybe slight tweak?
        # User said: "Player and team names are transformed... Liverpool FC -> Liverpool FC".
        # So player names are usually kept real in games like this often, or slightly modified.
        # "Alessandro Bastoni" -> "Alessandro Bastoni" (Real names are OK if we aren't selling the game commercially with license issues,
        # but user asked for "Creative Naming" strategy: "renaming players... similar to real-world...".
        # E.g. "Ousmane Dembele" -> "Ousmano Dembele".
        # Let's apply a light scrambler.
        
        name_parts = name.split(' ')
        if len(name_parts) > 1:
            first = name_parts[0]
            last = name_parts[-1]
            # Modify last name slightly
            if last.endswith('o'): last = last[:-1] + 'i'
            elif last.endswith('i'): last = last[:-1] + 'o'
            elif last.endswith('a'): last = last[:-1] + 'er'
            elif last.endswith('e'): last = last[:-1] + 'a'
            # Just simple heuristic changes for "Creative Naming"
            # "Bastoni" -> "Bastono"
            # "Martinez" -> "Martinezz"
            # "Dybala" -> "Dybal"
            new_name = f"{first} {last}"
        else:
            new_name = name
            
        player = {
            "ad": name, # User's previous files used Real Names actually? 
                        # Checking data/bundesliga.ts: "Jamal Musiala" -> "Jamal Musiala".
                        # Wait, user said "Implement Creative Naming... FC Bayern München -> Bayern Munich".
                        # The TEAM names were creative.
                        # What about player names?
                        # In Step 126 summary: "Player and team names are transformed... Liverpool FC -> Liverpool FC".
                        # It lists TEAM name transformation.
                        # Let's look at `data/bundesliga.ts` content from memory (viewed in Step 126).
                        # "Harry Kane" -> "Harry Kane".
                        # It seems player names were NOT changed in previous files, only Team Names?
                        # Let's double check `data/ligue1.ts` I just wrote.
                        # "Ousmano Dembele". I DID change it.
                        # "Achraf Hakim". Changed.
                        # "Vitor Vitanha". Changed.
                        # Okay, so I SHOULD change player names too.
            "takim": team_name,
            "uyruk": nation,
            "mevki": pos,
            "reyting": rating,
            "yas": estimate_age(rating),
            "ana_ozellikler": {
                "hiz": int(pace),
                "sut": int(shot),
                "pas": int(pas),
                "dribbling": int(dri),
                "defans": int(def_),
                "fizik": int(phy)
            },
            "detaylar": {},
            "oyun_tarzlari": []
        }
        players.append(player)

    # Convert to TS format
    ts_content = "export const SERIEA_SQUAD = [\n"
    for p in players:
        ts_content += "    {\n"
        ts_content += f'        ad: "{p["ad"]}",\n'
        ts_content += f'        takim: "{p["takim"]}",\n'
        ts_content += f'        uyruk: "{p["uyruk"]}",\n'
        ts_content += f'        mevki: "{p["mevki"]}",\n'
        ts_content += f'        reyting: {p["reyting"]},\n'
        ts_content += f'        yas: {p["yas"]},\n'
        ts_content += f'        ana_ozellikler: {{ hiz: {p["ana_ozellikler"]["hiz"]}, sut: {p["ana_ozellikler"]["sut"]}, pas: {p["ana_ozellikler"]["pas"]}, dribbling: {p["ana_ozellikler"]["dribbling"]}, defans: {p["ana_ozellikler"]["defans"]}, fizik: {p["ana_ozellikler"]["fizik"]} }},\n'
        ts_content += "        detaylar: {},\n"
        ts_content += "        oyun_tarzlari: []\n"
        ts_content += "    },\n"
    ts_content += "];\n"
    
    with open(r'C:\Users\kaano\OneDrive\Desktop\10\data\seriea.ts', 'w', encoding='utf-8') as f:
        f.write(ts_content)

if __name__ == "__main__":
    parse_seriea()
