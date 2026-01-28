import re

# Teams to update/add
teams_data = {
    "Ibague Gold": {
        "formation": "TacticType.T_4231",
        "style": "'WingPlay'",
        "aggression": "'Normal'",
        "tempo": "'Normal'",
        "width": "'Wide'",
        "defensiveLine": "'Balanced'",
        "passingStyle": "'Mixed'",
        "marking": "'Zonal'"
    },
    "Incheon United": {
        "formation": "TacticType.T_442",
        "style": "'Counter'",
        "aggression": "'Normal'",
        "tempo": "'Fast'",
        "width": "'Balanced'",
        "defensiveLine": "'Deep'",
        "passingStyle": "'Direct'",
        "marking": "'Zonal'"
    },
    "Inter Lombardia": {
        "formation": "TacticType.T_352",
        "style": "'Balanced'",
        "aggression": "'Aggressive'",
        "tempo": "'Normal'",
        "width": "'Balanced'",
        "defensiveLine": "'High'",
        "passingStyle": "'Mixed'",
        "marking": "'Zonal'"
    },
    "Ismaily SC": {
        "formation": "TacticType.T_4231",
        "style": "'Balanced'",
        "aggression": "'Normal'",
        "tempo": "'Normal'",
        "width": "'Balanced'",
        "defensiveLine": "'Balanced'",
        "passingStyle": "'Mixed'",
        "marking": "'Zonal'"
    },
    "Ittihad Alexandria": {
        "formation": "TacticType.T_4231",
        "style": "'Counter'",
        "aggression": "'Normal'",
        "tempo": "'Fast'",
        "width": "'Wide'",
        "defensiveLine": "'Deep'",
        "passingStyle": "'Direct'",
        "marking": "'Zonal'"
    },
    "Jardines Striped": {
        "formation": "TacticType.T_433",
        "style": "'Balanced'",
        "aggression": "'Normal'",
        "tempo": "'Normal'",
        "width": "'Wide'",
        "defensiveLine": "'Balanced'",
        "passingStyle": "'Mixed'",
        "marking": "'Zonal'"
    },
    "Jeddah Green": {
        "formation": "TacticType.T_433",
        "style": "'WingPlay'",
        "aggression": "'Normal'",
        "tempo": "'Fast'",
        "width": "'Wide'",
        "defensiveLine": "'High'",
        "passingStyle": "'Mixed'",
        "marking": "'Zonal'"
    },
    "Jeddah Tigers": {
        "formation": "TacticType.T_4231",
        "style": "'Balanced'",
        "aggression": "'Aggressive'",
        "tempo": "'Normal'",
        "width": "'Balanced'",
        "defensiveLine": "'Balanced'",
        "passingStyle": "'Mixed'",
        "marking": "'Zonal'"
    },
    "JEF United Chiba": {
        "formation": "TacticType.T_442",
        "style": "'Counter'",
        "aggression": "'Normal'",
        "tempo": "'Normal'",
        "width": "'Narrow'",
        "defensiveLine": "'Deep'",
        "passingStyle": "'LongBall'",
        "marking": "'Zonal'"
    },
    "Jeju SK": {
        "formation": "TacticType.T_4231",
        "style": "'Balanced'",
        "aggression": "'Normal'",
        "tempo": "'Normal'",
        "width": "'Balanced'",
        "defensiveLine": "'Balanced'",
        "passingStyle": "'Mixed'",
        "marking": "'Zonal'"
    },
    "Jeonju Motors": {
        "formation": "TacticType.T_4231",
        "style": "'HighPress'",
        "aggression": "'Normal'",
        "tempo": "'Normal'",
        "width": "'Wide'",
        "defensiveLine": "'High'",
        "passingStyle": "'Mixed'",
        "marking": "'Zonal'"
    },
    "Juarez Braves": {
        "formation": "TacticType.T_433",
        "style": "'Counter'",
        "aggression": "'Normal'",
        "tempo": "'Fast'",
        "width": "'Wide'",
        "defensiveLine": "'Deep'",
        "passingStyle": "'Direct'",
        "marking": "'Zonal'"
    },
    "Junin Warriors": {
        "formation": "TacticType.T_442",
        "style": "'ParkTheBus'",
        "aggression": "'Aggressive'",
        "tempo": "'Slow'",
        "width": "'Narrow'",
        "defensiveLine": "'Deep'",
        "passingStyle": "'LongBall'",
        "marking": "'ManToMan'"
    },
    "Piemonte Zebras": {
        "formation": "TacticType.T_4231",
        "style": "'Balanced'",
        "aggression": "'Normal'",
        "tempo": "'Slow'",
        "width": "'Balanced'",
        "defensiveLine": "'Balanced'",
        "passingStyle": "'Mixed'",
        "marking": "'Zonal'"
    },
    "Kahraba Ismailia": {
        "formation": "TacticType.T_442",
        "style": "'Counter'",
        "aggression": "'Normal'",
        "tempo": "'Normal'",
        "width": "'Balanced'",
        "defensiveLine": "'Deep'",
        "passingStyle": "'Direct'",
        "marking": "'Zonal'"
    },
    "Kansas City Wizards": {
        "formation": "TacticType.T_433",
        "style": "'HighPress'",
        "aggression": "'Normal'",
        "tempo": "'Fast'",
        "width": "'Wide'",
        "defensiveLine": "'High'",
        "passingStyle": "'Direct'",
        "marking": "'Zonal'"
    },
    "Karagumruk Black": {
        "formation": "TacticType.T_4231",
        "style": "'Balanced'",
        "aggression": "'Normal'",
        "tempo": "'Normal'",
        "width": "'Balanced'",
        "defensiveLine": "'Balanced'",
        "passingStyle": "'Mixed'",
        "marking": "'Zonal'"
    },
    "Kashima Antlers": {
        "formation": "TacticType.T_4231",
        "style": "'Balanced'",
        "aggression": "'Normal'",
        "tempo": "'Normal'",
        "width": "'Balanced'",
        "defensiveLine": "'Balanced'",
        "passingStyle": "'Mixed'",
        "marking": "'Zonal'"
    },
    "Kashiwa Reysol": {
        "formation": "TacticType.T_4231",
        "style": "'Counter'",
        "aggression": "'Normal'",
        "tempo": "'Fast'",
        "width": "'Wide'",
        "defensiveLine": "'Balanced'",
        "passingStyle": "'Mixed'",
        "marking": "'Zonal'"
    },
    "Kasimpasa Navy": {
        "formation": "TacticType.T_4231",
        "style": "'Counter'",
        "aggression": "'Normal'",
        "tempo": "'Fast'",
        "width": "'Wide'",
        "defensiveLine": "'Balanced'",
        "passingStyle": "'Direct'",
        "marking": "'Zonal'"
    }
}

# Teams that don't exist yet in constants.ts
missing_teams = ["Ismaily SC", "Jeju SK", "Kahraba Ismailia"]

# Read constants.ts
with open('constants.ts', 'r', encoding='utf-8') as f:
    content = f.read()

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

# Update existing teams
for team_name, tactics in teams_data.items():
    if team_name not in missing_teams:
        # Find the team's tactic block
        pattern = rf'    "{re.escape(team_name)}": \{{[^}}]+\}}'
        replacement = generate_tactic_entry(team_name, tactics)
        content = re.sub(pattern, replacement, content, flags=re.DOTALL)
        print(f"Updated: {team_name}")

# Add missing teams - we need to find the right alphabetical positions
# Ismaily SC should go after "Ismail Sky" or similar
# Jeju SK should go after "JEF United Chiba"
# Kahraba Ismailia should go after "Kansas City Wizards" but before "Karagumruk Black"

# Let's add these manually to the correct positions
for team_name in missing_teams:
    if team_name == "Ismaily SC":
        # Add after Incheon United but before Inter Lombardia
        pattern = r'(    "Incheon United": \{[^}]+\},)\n'
        replacement = f'\\1\n{generate_tactic_entry(team_name, teams_data[team_name])},\n'
        content = re.sub(pattern, replacement, content, flags=re.DOTALL)
    elif team_name == "Jeju SK":
        # Add after JEF United Chiba but before Jeonju Motors
        pattern = r'(    "JEF United Chiba": \{[^}]+\},)\n'
        replacement = f'\\1\n{generate_tactic_entry(team_name, teams_data[team_name])},\n'
        content = re.sub(pattern, replacement, content, flags=re.DOTALL)
    elif team_name == "Kahraba Ismailia":
        # Add after Kansas City Wizards but before Karagumruk Black
        pattern = r'(    "Kansas City Wizards": \{[^}]+\},)\n'
        replacement = f'\\1\n{generate_tactic_entry(team_name, teams_data[team_name])},\n'
        content = re.sub(pattern, replacement, content, flags=re.DOTALL)
    print(f"Added: {team_name}")

# Write back
with open('constants.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("\nAll team tactics have been updated successfully!")
print(f"Total teams processed: {len(teams_data)}")
print(f"New teams added: {len(missing_teams)}")
