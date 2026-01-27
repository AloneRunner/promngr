import re

# All teams with their tactics (taking the last occurrence for duplicates)
teams_data = {
    "Kawasaki Front": {
        "formation": "TacticType.T_4231",
        "style": "'Balanced'",
        "aggression": "'Normal'",
        "tempo": "'Slow'",
        "width": "'Balanced'",
        "defensiveLine": "'Balanced'",
        "passingStyle": "'Mixed'",
        "marking": "'Zonal'"
    },
    "Kayseri Stars": {
        "formation": "TacticType.T_4231",
        "style": "'Balanced'",
        "aggression": "'Normal'",
        "tempo": "'Normal'",
        "width": "'Wide'",
        "defensiveLine": "'Deep'",
        "passingStyle": "'Mixed'",
        "marking": "'Zonal'"
    },
    "Kingston Bay United": {
        "formation": "TacticType.T_433",
        "style": "'Counter'",
        "aggression": "'Normal'",
        "tempo": "'Fast'",
        "width": "'Wide'",
        "defensiveLine": "'Deep'",
        "passingStyle": "'Direct'",
        "marking": "'Zonal'"
    },
    "Kobe Crimsons": {
        "formation": "TacticType.T_433",
        "style": "'Balanced'",
        "aggression": "'Normal'",
        "tempo": "'Normal'",
        "width": "'Wide'",
        "defensiveLine": "'Balanced'",
        "passingStyle": "'Mixed'",
        "marking": "'Zonal'"
    },
    "Kocaeli Gulf": {
        "formation": "TacticType.T_4231",
        "style": "'Balanced'",
        "aggression": "'Aggressive'",
        "tempo": "'Normal'",
        "width": "'Wide'",
        "defensiveLine": "'Deep'",
        "passingStyle": "'LongBall'",
        "marking": "'Zonal'"
    },
    "Cathedral City": {
        "formation": "TacticType.T_4231",
        "style": "'Balanced'",
        "aggression": "'Normal'",
        "tempo": "'Normal'",
        "width": "'Balanced'",
        "defensiveLine": "'Balanced'",
        "passingStyle": "'Mixed'",
        "marking": "'Zonal'"
    },
    "Konya Green": {
        "formation": "TacticType.T_4231",
        "style": "'WingPlay'",
        "aggression": "'Normal'",
        "tempo": "'Normal'",
        "width": "'Wide'",
        "defensiveLine": "'Deep'",
        "passingStyle": "'Mixed'",
        "marking": "'Zonal'"
    },
    "Kyoto Sanga": {
        "formation": "TacticType.T_4231",
        "style": "'Balanced'",
        "aggression": "'Normal'",
        "tempo": "'Normal'",
        "width": "'Balanced'",
        "defensiveLine": "'Balanced'",
        "passingStyle": "'Mixed'",
        "marking": "'Zonal'"
    },
    "La Boca Xeneizes": {
        "formation": "TacticType.T_442",
        "style": "'Balanced'",
        "aggression": "'Aggressive'",
        "tempo": "'Slow'",
        "width": "'Balanced'",
        "defensiveLine": "'Balanced'",
        "passingStyle": "'Mixed'",
        "marking": "'ManToMan'"
    },
    "La Plata Lions": {
        "formation": "TacticType.T_4231",
        "style": "'Balanced'",
        "aggression": "'Aggressive'",
        "tempo": "'Normal'",
        "width": "'Balanced'",
        "defensiveLine": "'Balanced'",
        "passingStyle": "'Mixed'",
        "marking": "'Zonal'"
    },
    "La Plata Wolves": {
        "formation": "TacticType.T_442",
        "style": "'Counter'",
        "aggression": "'Aggressive'",
        "tempo": "'Fast'",
        "width": "'Wide'",
        "defensiveLine": "'Balanced'",
        "passingStyle": "'Direct'",
        "marking": "'Zonal'"
    },
    "Laguna Warriors": {
        "formation": "TacticType.T_4231",
        "style": "'Balanced'",
        "aggression": "'Normal'",
        "tempo": "'Normal'",
        "width": "'Wide'",
        "defensiveLine": "'Balanced'",
        "passingStyle": "'Mixed'",
        "marking": "'Zonal'"
    },
    "Lanus Granate": {
        "formation": "TacticType.T_4231",
        "style": "'Balanced'",
        "aggression": "'Normal'",
        "tempo": "'Normal'",
        "width": "'Balanced'",
        "defensiveLine": "'Deep'",
        "passingStyle": "'Mixed'",
        "marking": "'Zonal'"
    },
    "Canary Yellows": {
        "formation": "TacticType.T_4231",
        "style": "'Balanced'",
        "aggression": "'Normal'",
        "tempo": "'Slow'",
        "width": "'Wide'",
        "defensiveLine": "'Balanced'",
        "passingStyle": "'Mixed'",
        "marking": "'Zonal'"
    },
    "Latium Eagles": {
        "formation": "TacticType.T_433",
        "style": "'Balanced'",
        "aggression": "'Normal'",
        "tempo": "'Normal'",
        "width": "'Balanced'",
        "defensiveLine": "'Balanced'",
        "passingStyle": "'Mixed'",
        "marking": "'Zonal'"
    },
    "Lecce Wolves": {
        "formation": "TacticType.T_433",
        "style": "'Counter'",
        "aggression": "'Normal'",
        "tempo": "'Fast'",
        "width": "'Wide'",
        "defensiveLine": "'Balanced'",
        "passingStyle": "'Direct'",
        "marking": "'Zonal'"
    },
    "Yorkshire Whites": {
        "formation": "TacticType.T_4231",
        "style": "'HighPress'",
        "aggression": "'Aggressive'",
        "tempo": "'Fast'",
        "width": "'Balanced'",
        "defensiveLine": "'High'",
        "passingStyle": "'Direct'",
        "marking": "'Zonal'"
    },
    "Leipzig Bulls": {
        "formation": "TacticType.T_4231",
        "style": "'HighPress'",
        "aggression": "'Aggressive'",
        "tempo": "'Fast'",
        "width": "'Wide'",
        "defensiveLine": "'High'",
        "passingStyle": "'Mixed'",
        "marking": "'Zonal'"
    },
    "Lens Gold": {
        "formation": "TacticType.T_4231",
        "style": "'Balanced'",
        "aggression": "'Normal'",
        "tempo": "'Normal'",
        "width": "'Balanced'",
        "defensiveLine": "'Balanced'",
        "passingStyle": "'Mixed'",
        "marking": "'Zonal'"
    },
    "Leon Emeralds": {
        "formation": "TacticType.T_4231",
        "style": "'Balanced'",
        "aggression": "'Normal'",
        "tempo": "'Normal'",
        "width": "'Wide'",
        "defensiveLine": "'Balanced'",
        "passingStyle": "'Mixed'",
        "marking": "'Zonal'"
    },
    "Kolkata Mariners": {
        "formation": "TacticType.T_4231",
        "style": "'Balanced'",
        "aggression": "'Normal'",
        "tempo": "'Normal'",
        "width": "'Balanced'",
        "defensiveLine": "'Balanced'",
        "passingStyle": "'Mixed'",
        "marking": "'Zonal'"
    },
    "Mumbai Islanders": {
        "formation": "TacticType.T_433",
        "style": "'WingPlay'",
        "aggression": "'Normal'",
        "tempo": "'Fast'",
        "width": "'Wide'",
        "defensiveLine": "'Balanced'",
        "passingStyle": "'Mixed'",
        "marking": "'Zonal'"
    },
    "East Bengal Torch": {
        "formation": "TacticType.T_4231",
        "style": "'Balanced'",
        "aggression": "'Normal'",
        "tempo": "'Normal'",
        "width": "'Balanced'",
        "defensiveLine": "'Balanced'",
        "passingStyle": "'Mixed'",
        "marking": "'Zonal'"
    },
    "Kerala Tuskers": {
        "formation": "TacticType.T_433",
        "style": "'Balanced'",
        "aggression": "'Normal'",
        "tempo": "'Normal'",
        "width": "'Balanced'",
        "defensiveLine": "'Balanced'",
        "passingStyle": "'Mixed'",
        "marking": "'Zonal'"
    },
    "Goa Gaurs": {
        "formation": "TacticType.T_4231",
        "style": "'Balanced'",
        "aggression": "'Normal'",
        "tempo": "'Normal'",
        "width": "'Balanced'",
        "defensiveLine": "'Balanced'",
        "passingStyle": "'Mixed'",
        "marking": "'Zonal'"
    },
    "Bangalore Blues": {
        "formation": "TacticType.T_433",
        "style": "'Balanced'",
        "aggression": "'Normal'",
        "tempo": "'Normal'",
        "width": "'Balanced'",
        "defensiveLine": "'Balanced'",
        "passingStyle": "'Mixed'",
        "marking": "'Zonal'"
    },
    "Odisha Juggernauts": {
        "formation": "TacticType.T_433",
        "style": "'Balanced'",
        "aggression": "'Normal'",
        "tempo": "'Normal'",
        "width": "'Wide'",
        "defensiveLine": "'Balanced'",
        "passingStyle": "'Mixed'",
        "marking": "'Zonal'"
    },
    "Chennai Titans": {
        "formation": "TacticType.T_4231",
        "style": "'Balanced'",
        "aggression": "'Normal'",
        "tempo": "'Normal'",
        "width": "'Balanced'",
        "defensiveLine": "'Balanced'",
        "passingStyle": "'Mixed'",
        "marking": "'Zonal'"
    },
    "Highland United": {
        "formation": "TacticType.T_4231",
        "style": "'Balanced'",
        "aggression": "'Normal'",
        "tempo": "'Normal'",
        "width": "'Balanced'",
        "defensiveLine": "'Balanced'",
        "passingStyle": "'Mixed'",
        "marking": "'Zonal'"
    },
    "Steel City Red": {
        "formation": "TacticType.T_4231",
        "style": "'Balanced'",
        "aggression": "'Normal'",
        "tempo": "'Normal'",
        "width": "'Balanced'",
        "defensiveLine": "'Balanced'",
        "passingStyle": "'Mixed'",
        "marking": "'Zonal'"
    },
    "Punjab Lions": {
        "formation": "TacticType.T_442",
        "style": "'Counter'",
        "aggression": "'Normal'",
        "tempo": "'Normal'",
        "width": "'Narrow'",
        "defensiveLine": "'Deep'",
        "passingStyle": "'LongBall'",
        "marking": "'Zonal'"
    },
    "Kolkata Black-White": {
        "formation": "TacticType.T_442",
        "style": "'Balanced'",
        "aggression": "'Normal'",
        "tempo": "'Normal'",
        "width": "'Balanced'",
        "defensiveLine": "'Balanced'",
        "passingStyle": "'Mixed'",
        "marking": "'Zonal'"
    },
    "Delhi Capital": {
        "formation": "TacticType.T_433",
        "style": "'Balanced'",
        "aggression": "'Normal'",
        "tempo": "'Normal'",
        "width": "'Balanced'",
        "defensiveLine": "'Balanced'",
        "passingStyle": "'Mixed'",
        "marking": "'Zonal'"
    },
    "Varanasi Holy": {
        "formation": "TacticType.T_442",
        "style": "'Balanced'",
        "aggression": "'Normal'",
        "tempo": "'Normal'",
        "width": "'Balanced'",
        "defensiveLine": "'Balanced'",
        "passingStyle": "'Mixed'",
        "marking": "'Zonal'"
    },
    "Harras El Hodoud": {
        "formation": "TacticType.T_442",
        "style": "'Counter'",
        "aggression": "'Normal'",
        "tempo": "'Fast'",
        "width": "'Balanced'",
        "defensiveLine": "'Deep'",
        "passingStyle": "'Direct'",
        "marking": "'Zonal'"
    },
    "Hassania Agadir": {
        "formation": "TacticType.T_4141",
        "style": "'Balanced'",
        "aggression": "'Normal'",
        "tempo": "'Normal'",
        "width": "'Balanced'",
        "defensiveLine": "'Balanced'",
        "passingStyle": "'Mixed'",
        "marking": "'Zonal'"
    },
    "Heidenheim Red-Blue": {
        "formation": "TacticType.T_442",
        "style": "'Balanced'",
        "aggression": "'Normal'",
        "tempo": "'Normal'",
        "width": "'Balanced'",
        "defensiveLine": "'Balanced'",
        "passingStyle": "'LongBall'",
        "marking": "'Zonal'"
    },
    "Hiroshima Archers": {
        "formation": "TacticType.T_4231",
        "style": "'Balanced'",
        "aggression": "'Normal'",
        "tempo": "'Normal'",
        "width": "'Balanced'",
        "defensiveLine": "'Balanced'",
        "passingStyle": "'Mixed'",
        "marking": "'Zonal'"
    },
    "Hoffenheim FC": {
        "formation": "TacticType.T_4231",
        "style": "'Balanced'",
        "aggression": "'Normal'",
        "tempo": "'Normal'",
        "width": "'Balanced'",
        "defensiveLine": "'Balanced'",
        "passingStyle": "'Mixed'",
        "marking": "'Zonal'"
    },
    "Houston Space": {
        "formation": "TacticType.T_433",
        "style": "'Balanced'",
        "aggression": "'Normal'",
        "tempo": "'Slow'",
        "width": "'Balanced'",
        "defensiveLine": "'Balanced'",
        "passingStyle": "'Mixed'",
        "marking": "'Zonal'"
    },
    "Inter Lombardia": {
        "formation": "TacticType.T_352",
        "style": "'HighPress'",
        "aggression": "'Aggressive'",
        "tempo": "'Normal'",
        "width": "'Balanced'",
        "defensiveLine": "'High'",
        "passingStyle": "'Mixed'",
        "marking": "'Zonal'"
    },
    "Jeddah Tigers": {
        "formation": "TacticType.T_4231",
        "style": "'HighPress'",
        "aggression": "'Aggressive'",
        "tempo": "'Normal'",
        "width": "'Balanced'",
        "defensiveLine": "'High'",
        "passingStyle": "'Mixed'",
        "marking": "'Zonal'"
    },
    "Jeonju Motors": {
        "formation": "TacticType.T_4231",
        "style": "'HighPress'",
        "aggression": "'Normal'",
        "tempo": "'Fast'",
        "width": "'Wide'",
        "defensiveLine": "'High'",
        "passingStyle": "'Mixed'",
        "marking": "'Zonal'"
    },
    "Kansas City Wizards": {
        "formation": "TacticType.T_4231",
        "style": "'HighPress'",
        "aggression": "'Normal'",
        "tempo": "'Fast'",
        "width": "'Wide'",
        "defensiveLine": "'High'",
        "passingStyle": "'Direct'",
        "marking": "'Zonal'"
    },
    "Lille Dogs": {
        "formation": "TacticType.T_4231",
        "style": "'HighPress'",
        "aggression": "'Normal'",
        "tempo": "'Fast'",
        "width": "'Balanced'",
        "defensiveLine": "'High'",
        "passingStyle": "'Mixed'",
        "marking": "'Zonal'"
    },
    "Limache Red": {
        "formation": "TacticType.T_442",
        "style": "'Counter'",
        "aggression": "'Normal'",
        "tempo": "'Normal'",
        "width": "'Balanced'",
        "defensiveLine": "'Deep'",
        "passingStyle": "'LongBall'",
        "marking": "'Zonal'"
    },
    "Los Angeles Gold": {
        "formation": "TacticType.T_433",
        "style": "'HighPress'",
        "aggression": "'Normal'",
        "tempo": "'Fast'",
        "width": "'Wide'",
        "defensiveLine": "'High'",
        "passingStyle": "'Direct'",
        "marking": "'Zonal'"
    },
    "Lubumbashi Ravens": {
        "formation": "TacticType.T_4231",
        "style": "'Balanced'",
        "aggression": "'Normal'",
        "tempo": "'Normal'",
        "width": "'Wide'",
        "defensiveLine": "'Balanced'",
        "passingStyle": "'Mixed'",
        "marking": "'Zonal'"
    },
    "Lyon Kids": {
        "formation": "TacticType.T_433",
        "style": "'Balanced'",
        "aggression": "'Normal'",
        "tempo": "'Normal'",
        "width": "'Balanced'",
        "defensiveLine": "'Balanced'",
        "passingStyle": "'Mixed'",
        "marking": "'Zonal'"
    },
    "San Jose Purple": {
        "formation": "TacticType.T_4231",
        "style": "'Balanced'",
        "aggression": "'Normal'",
        "tempo": "'Normal'",
        "width": "'Balanced'",
        "defensiveLine": "'Deep'",
        "passingStyle": "'Direct'",
        "marking": "'Zonal'"
    },
    "Alajuela Lions": {
        "formation": "TacticType.T_433",
        "style": "'WingPlay'",
        "aggression": "'Normal'",
        "tempo": "'Normal'",
        "width": "'Wide'",
        "defensiveLine": "'Balanced'",
        "passingStyle": "'Mixed'",
        "marking": "'Zonal'"
    },
    "Heredia Red-Yellow": {
        "formation": "TacticType.T_4141",
        "style": "'Balanced'",
        "aggression": "'Aggressive'",
        "tempo": "'Normal'",
        "width": "'Balanced'",
        "defensiveLine": "'Balanced'",
        "passingStyle": "'Mixed'",
        "marking": "'Zonal'"
    },
    "Cartago Blues": {
        "formation": "TacticType.T_442",
        "style": "'Balanced'",
        "aggression": "'Normal'",
        "tempo": "'Normal'",
        "width": "'Balanced'",
        "defensiveLine": "'Balanced'",
        "passingStyle": "'Mixed'",
        "marking": "'Zonal'"
    },
    "San Carlos Bulls": {
        "formation": "TacticType.T_442",
        "style": "'Counter'",
        "aggression": "'Normal'",
        "tempo": "'Fast'",
        "width": "'Narrow'",
        "defensiveLine": "'Balanced'",
        "passingStyle": "'Direct'",
        "marking": "'Zonal'"
    },
    "San Isidro Warriors": {
        "formation": "TacticType.T_4231",
        "style": "'Counter'",
        "aggression": "'Normal'",
        "tempo": "'Fast'",
        "width": "'Balanced'",
        "defensiveLine": "'Deep'",
        "passingStyle": "'Direct'",
        "marking": "'Zonal'"
    },
    "Puntarenas Sharks": {
        "formation": "TacticType.T_442",
        "style": "'Counter'",
        "aggression": "'Normal'",
        "tempo": "'Normal'",
        "width": "'Wide'",
        "defensiveLine": "'Deep'",
        "passingStyle": "'Direct'",
        "marking": "'Zonal'"
    },
    "Sporting Jose": {
        "formation": "TacticType.T_4231",
        "style": "'Balanced'",
        "aggression": "'Normal'",
        "tempo": "'Normal'",
        "width": "'Balanced'",
        "defensiveLine": "'Balanced'",
        "passingStyle": "'Mixed'",
        "marking": "'Zonal'"
    },
    "Liberia Gold": {
        "formation": "TacticType.T_4231",
        "style": "'Balanced'",
        "aggression": "'Normal'",
        "tempo": "'Fast'",
        "width": "'Wide'",
        "defensiveLine": "'Balanced'",
        "passingStyle": "'Mixed'",
        "marking": "'Zonal'"
    },
    "Guadalupe Blue": {
        "formation": "TacticType.T_4231",
        "style": "'ParkTheBus'",
        "aggression": "'Normal'",
        "tempo": "'Slow'",
        "width": "'Narrow'",
        "defensiveLine": "'Deep'",
        "passingStyle": "'Mixed'",
        "marking": "'Zonal'"
    },
    "Central Coast Mariners": {
        "formation": "TacticType.T_433",
        "style": "'Balanced'",
        "aggression": "'Normal'",
        "tempo": "'Fast'",
        "width": "'Wide'",
        "defensiveLine": "'High'",
        "passingStyle": "'Mixed'",
        "marking": "'Zonal'"
    },
    "Challengers United": {
        "formation": "TacticType.T_442",
        "style": "'Counter'",
        "aggression": "'Normal'",
        "tempo": "'Normal'",
        "width": "'Balanced'",
        "defensiveLine": "'Deep'",
        "passingStyle": "'LongBall'",
        "marking": "'Zonal'"
    },
    "Charlotte Crowns": {
        "formation": "TacticType.T_433",
        "style": "'HighPress'",
        "aggression": "'Normal'",
        "tempo": "'Fast'",
        "width": "'Balanced'",
        "defensiveLine": "'High'",
        "passingStyle": "'Direct'",
        "marking": "'Zonal'"
    }
}

# Function to generate tactic entry
def generate_tactic_entry(team_name, tactics):
    return f'''    "{team_name}": {{
        formation: {tactics["formation"]},
        style: {tactics["style"]},
        aggression: {tactics["aggression"]},
        tempo: {tactics["tempo"]},
        width: {tactics["width"]},
        defensiveLine: {tactics["defensiveLine"]},
        passingStyle: {tactics["passingStyle"]},
        marking: {tactics["marking"]}
    }}'''

# Read constants.ts
with open('constants.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Check which teams already exist
existing_teams = []
new_teams = []
updated_teams = []

for team_name in teams_data.keys():
    # Search for the team in the tactical profiles section
    pattern = rf'    "{re.escape(team_name)}": \{{'
    if re.search(pattern, content):
        existing_teams.append(team_name)
    else:
        new_teams.append(team_name)

print(f"Found {len(existing_teams)} existing teams to update")
print(f"Found {len(new_teams)} new teams to add")

# Update existing teams
for team_name in existing_teams:
    tactics = teams_data[team_name]
    # Find and replace the team's tactic block
    pattern = rf'(    "{re.escape(team_name)}": \{{)[^}}]+(\}})'
    
    replacement_content = f'''    "{team_name}": {{
        formation: {tactics["formation"]},
        style: {tactics["style"]},
        aggression: {tactics["aggression"]},
        tempo: {tactics["tempo"]},
        width: {tactics["width"]},
        defensiveLine: {tactics["defensiveLine"]},
        passingStyle: {tactics["passingStyle"]},
        marking: {tactics["marking"]}
    '''
    
    content = re.sub(pattern, r'\1' + '\n' + replacement_content.split('{', 1)[1], content, flags=re.DOTALL)
    updated_teams.append(team_name)
    print(f"Updated: {team_name}")

# Add new teams before the closing brace of TEAM_TACTICAL_PROFILES
# Find the line with the closing brace (should be before "export const LEAGUE_PRESETS")
insertion_point = content.rfind('\n};\n\nexport const LEAGUE_PRESETS')

if insertion_point != -1:
    new_entries = []
    for team_name in new_teams:
        tactics = teams_data[team_name]
        entry = generate_tactic_entry(team_name, tactics) + ','
        new_entries.append(entry)
        print(f"Added: {team_name}")
    
    # Insert all new entries
    if new_entries:
        new_content = ',\n\n    // Additional Teams (K-L)\n' + '\n'.join(new_entries)
        content = content[:insertion_point] + new_content + content[insertion_point:]

# Write back
with open('constants.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print(f"\n✅ Complete!")
print(f"Updated: {len(updated_teams)} teams")
print(f"Added: {len(new_teams)} new teams")
print(f"Total processed: {len(teams_data)} teams")
