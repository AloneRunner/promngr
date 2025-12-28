#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
EA Sports FC 26 Data Parser
Parses EA data and converts to game format with name modifications
"""

import re
import json

# Name transformation rules (similar to Turkish league strategy)
PLAYER_NAME_TRANSFORMS = {
    # Common first names
    "Mohamed": "Mohammed",
    "Kylian": "Kilian",
    "Virgil": "Virgilio",
    "Jude": "Judah",
    "Erling": "Erlend",
    "Harry": "Harrison",
    "Robert": "Roberto",
    "Alexander": "Alexandre",
    "Lamine": "Lamino",
    "Federico": "Frederico",
    "Bruno": "Breno",
    "Florian": "Floriano",
    "Antoine": "Antonio",
    "Marcus": "Marco",
    "Jamal": "Jamaal",
    "Gabriel": "Gabriele",
    "Bukayo": "Bukari",
    "Cole": "Kole",
    "Kevin": "Kelvin",
    "Frenkie": "Frankie",
    "Declan": "Deklan",
    "Martin": "Martinho",
    "Jules": "Julio",
    "Julián": "Julian",
    "David": "Davide",
    "Michael": "Miguel",
    "Joshua": "Josue",
    "Thomas": "Thiago",
    "William": "Willian",
    
    # Common last names - slight variations
    "Salah": "Sultan",
    "Mbappé": "M'Bappe",
    "Haaland": "Hallund", 
    "van Dijk": "van Dyck",
    "Bellingham": "Bellford",
    "Kane": "Kaine",
    "Lewandowski": "Lewandoski",
    "Isak": "Isaak",
    "Musiala": "Musial",
    "Saka": "Sakho",
    "Palmer": "Palmeiro",
    "Bastoni": "Bastone",
    "Guirassy": "Guirassy",
    "De Bruyne": "De Bruyns",
    "de Jong": "de Jongh",
    "Caicedo": "Caiceda",
    "Rice": "Ryce",
    "Koundé": "Kounde",
    "Fernandes": "Fernandez",
    "Tah": "Taha",
    "Mac Allister": "MacAlister",
    "Ødegaard": "Odegard",
    "Raya": "Rayos",
    "Gyökeres": "Gyokeres",
    "Barella": "Barello",
    "Rüdiger": "Rudiger",
    "Olise": "Olisé",
    "Alexander-Arnold": "Alexander-Arnold", # Keep this one
    "Dias": "Diaz",
    "Dybala": "Dyballa",
    "Guimarães": "Guimaraes",
    "Konaté": "Konate",
    "Çalhanoğlu": "Calhanoglu",
    "Tonali": "Tonale",
    "Williams": "Williamson",
    "Reijnders": "Reynders",
    "ter Stegen": "ter Steegen",
    "Kobel": "Kobell",
    "Dimarco": "Di Marco",
    "McTominay": "McTominay",
    "Gravenberch": "Gravenberg",
    "Martínez": "Martinez",
    "Griezmann": "Griesman",
    "Mbeumo": "M'Beumo",
    "Thuram": "Thurram",
    "Díaz": "Diaz",
    "Schlotterbeck": "Schlotter",
    "Foden": "Fodin",
    "Tielemans": "Tieleman",
    "Xhaka": "Xhakha",
    "Rodrygo": "Rodrygo",
    "Dani Olmo": "Daniel Olmo",
    "Upamecano": "Upamecano",
    "Schick": "Schicker",
    "Bremer": "Bremmer",
}

# Team name transforms (city-based like Turkish league)
TEAM_TRANSFORMS = {
    # Premier League
    "Liverpool": "Liverpool FC",
    "Manchester City": "Manchester City FC", 
    "Arsenal": "Arsenal FC",
    "Chelsea": "Chelsea FC",
    "Man Utd": "Manchester United FC",
    "Newcastle Utd": "Newcastle FC",
    "Spurs": "Tottenham FC",
    "Aston Villa": "Aston FC",
    "Brighton": "Brighton FC",
    "West Ham": "West Ham FC",
    "Everton": "Everton FC",
    "Nott. Forest": "Nottingham FC",
    "Fulham": "Fulham FC",
    "Brentford": "Brentford FC",
    "Wolves": "Wolverhampton FC",
    "Crystal Palace": "Crystal FC",
    "AFC Bournemouth": "Bournemouth FC",
    "Leeds United": "Leeds FC",
    "Burnley": "Burnley FC",
    "Sunderland": "Sunderland AFC",
    
    # La Liga
    "Real Madrid": "Real Madrid CF",
    "FC Barcelona": "Barcelona FC",
    "Atlético de Madrid": "Atletico Madrid",
    "Athletic Club": "Athletic Bilbao",
    "Real Sociedad": "Real Sociedad CF",
    "Villarreal CF": "Villarreal FC",
    "Real Betis": "Betis Sevilla",
    "Sevilla FC": "Sevilla FC",
    "Valencia CF": "Valencia FC",
    "Celta": "Celta Vigo",
    "Rayo Vallecano": "Rayo Madrid",
    "Getafe CF": "Getafe FC",
    "Girona FC": "Girona FC",
    "RCD Mallorca": "Mallorca FC",
    "RCD Espanyol": "Espanyol Barcelona",
    "CA Osasuna": "Osasuna FC",
    "D. Alavés": "Alaves FC",
    "Real Oviedo": "Oviedo FC",
    "Levante UD": "Levante FC",
    "Elche CF": "Elche FC",
    
    # Serie A
    "Lombardia FC": "Lombardia FC",  # Already renamed (Inter)
    "Milano FC": "Milano FC",  # Already renamed (AC Milan)
    "Bergamo Calcio": "Bergamo Calcio",  # Already renamed (Atalanta)
    "Juventus": "Juventus FC",
    "SSC Napoli": "Napoli FC",
    "AS Roma": "Roma FC",
    "Latium": "Lazio FC",  # Latium is Latin for Lazio
    "Fiorentina": "Fiorentina FC",
    "Torino": "Torino FC",
    "Bologna": "Bologna FC",
    "Genoa": "Genoa FC",
    "Udinese": "Udinese FC",
    "Lecce": "Lecce FC",
    "Cagliari": "Cagliari FC",
    "Hellas Verona": "Verona FC",
    "Como": "Como FC",
    "Parma": "Parma FC",
    "Sassuolo": "Sassuolo FC",
    "Cremonese": "Cremona FC",
    "Pisa": "Pisa FC",
    
    # Bundesliga
    "FC Bayern München": "Bayern Munich",
    "Borussia Dortmund": "Dortmund FC",
    "RB Leipzig": "Leipzig FC",
    "Leverkusen": "Bayer Leverkusen",
    "VfB Stuttgart": "Stuttgart FC",
    "Frankfurt": "Eintracht Frankfurt",
    "SC Freiburg": "Freiburg FC",
    "Union Berlin": "Union Berlin FC",
    "M'gladbach": "Monchengladbach FC",
    "VfL Wolfsburg": "Wolfsburg FC",
    "SV Werder Bremen": "Bremen FC",
    "TSG Hoffenheim": "Hoffenheim FC",
    "1. FSV Mainz 05": "Mainz FC",
    "FC Augsburg": "Augsburg FC",
    "1. FC Köln": "Koln FC",
    "Heidenheim": "Heidenheim FC",
    "FC St. Pauli": "St. Pauli FC",
    "Hamburger SV": "Hamburg SV",
}

# League detection from team names
LEAGUE_TEAMS = {
    "Premier League": ["Liverpool", "Manchester City", "Arsenal", "Chelsea", "Man Utd", "Newcastle Utd", 
                       "Spurs", "Aston Villa", "Brighton", "West Ham", "Everton", "Nott. Forest",
                       "Fulham", "Brentford", "Wolves", "Crystal Palace", "AFC Bournemouth", 
                       "Leeds United", "Burnley", "Sunderland"],
    
    "La Liga": ["Real Madrid", "FC Barcelona", "Atlético de Madrid", "Athletic Club", "Real Sociedad",
                "Villarreal CF", "Real Betis", "Sevilla FC", "Valencia CF", "Celta", "Rayo Vallecano",
                "Getafe CF", "Girona FC", "RCD Mallorca", "RCD Espanyol", "CA Osasuna", "D. Alavés",
                "Real Oviedo", "Levante UD", "Elche CF"],
    
    "Serie A": ["Lombardia FC", "Milano FC", "Bergamo Calcio", "Juventus", "SSC Napoli", "AS Roma",
                "Latium", "Fiorentina", "Torino", "Bologna", "Genoa", "Udinese", "Lecce", "Cagliari",
                "Hellas Verona", "Como", "Parma", "Sassuolo", "Cremonese", "Pisa"],
    
    "Bundesliga": ["FC Bayern München", "Borussia Dortmund", "RB Leipzig", "Leverkusen", "VfB Stuttgart",
                   "Frankfurt", "SC Freiburg", "Union Berlin", "M'gladbach", "VfL Wolfsburg",
                   "SV Werder Bremen", "TSG Hoffenheim", "1. FSV Mainz 05", "FC Augsburg", "1. FC Köln",
                   "Heidenheim", "FC St. Pauli", "Hamburger SV"]
}

def transform_name(name):
    """Transform a player name with small variations"""
    # Split name into parts
    parts = name.split()
    transformed_parts = []
    
    for part in parts:
        # Check if we have a rule for this part
        if part in PLAYER_NAME_TRANSFORMS:
            transformed_parts.append(PLAYER_NAME_TRANSFORMS[part])
        else:
            # Small automatic transformations
            # Add 'i' to some names ending in 'o'
            if part.endswith('o') and len(part) > 4 and part not in transformed_parts:
                transformed_parts.append(part + 'ni')
            # Change 'ph' to 'f'
            elif 'ph' in part.lower():
                transformed_parts.append(part.replace('ph', 'f').replace('Ph', 'F'))
            # Keep original if no rule
            else:
                transformed_parts.append(part)
    
    return ' '.join(transformed_parts)

def get_league_from_team(team_name):
    """Determine league from team name"""
    for league, teams in LEAGUE_TEAMS.items():
        if team_name in teams:
            return league
    return "Unknown"

def transform_team(team_name):
    """Transform team name"""
    return TEAM_TRANSFORMS.get(team_name, team_name)

def parse_player_row(row_text):
    """Parse a single player row from EA data"""
    # Example row: "1\nMohamed Salah\nMısır\nLiverpool\nSĞO\n91\n89\n88\n86\n90\n45\n76"
    parts = row_text.strip().split('\n')
    
    if len(parts) < 12:
        return None
    
    try:
        rank = parts[0]
        name = parts[1]
        country = parts[2]
        team = parts[3]
        position = parts[4]
        rating = int(parts[5])
        speed = int(parts[6])
        shooting = int(parts[7])
        passing = int(parts[8])
        dribbling = int(parts[9])
        defending = int(parts[10])
        physical = int(parts[11])
        
        # Transform name and team
        transformed_name = transform_name(name)
        transformed_team = transform_team(team)
        league = get_league_from_team(team)
        
        # Estimate age based on rating (rough heuristic)
        if rating >= 88:
            age = 28  # Prime
        elif rating >= 83:
            age = 26  # Young peak
        elif rating >= 78:
            age = 24  # Rising star
        else:
            age = 22  # Young
            
        return {
            'name': transformed_name,
            'original_name': name,
            'team': transformed_team,
            'country': country,
            'position': position,
            'rating': rating,
            'age': age,
            'league': league,
            'stats': {
                'hiz': speed,
                'sut': shooting,
                'pas': passing,
                'dribbling': dribbling,
                'defans': defending,
                'fizik': physical
            }
        }
    except (ValueError, IndexError) as e:
        return None

# I'll continue this in the next file...
print("Parser ready!")
