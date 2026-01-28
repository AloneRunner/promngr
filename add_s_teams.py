import re
import json

# New teams data
new_teams = {
    "Wearside Black Cats": {
        "formation": "TacticType.T_343",
        "style": "HighPress",
        "aggression": "Aggressive",
        "tempo": "Normal",
        "width": "Wide",
        "defensiveLine": "High",
        "passingStyle": "Mixed",
        "marking": "Zonal"
    },
    "Stuttgart White-Reds": {
        "formation": "TacticType.T_4231",
        "style": "HighPress",
        "aggression": "Normal",
        "tempo": "Fast",
        "width": "Wide",
        "defensiveLine": "High",
        "passingStyle": "Direct",
        "marking": "Zonal"
    },
    "Alsace Blue": {
        "formation": "TacticType.T_532",
        "style": "Counter",
        "aggression": "Aggressive",
        "tempo": "Fast",
        "width": "Balanced",
        "defensiveLine": "Deep",
        "passingStyle": "Direct",
        "marking": "ManToMan"
    },
    "Hamburg Pirates": {
        "formation": "TacticType.T_343",
        "style": "HighPress",
        "aggression": "Aggressive",
        "tempo": "Fast",
        "width": "Wide",
        "defensiveLine": "High",
        "passingStyle": "Mixed",
        "marking": "Zonal"
    },
    "Stellenbosch FC": {
        "formation": "TacticType.T_433",
        "style": "Counter",
        "aggression": "Normal",
        "tempo": "Fast",
        "width": "Wide",
        "defensiveLine": "Balanced",
        "passingStyle": "Direct",
        "marking": "Zonal"
    },
    "St. Lucia Kings FC": {
        "formation": "TacticType.T_442",
        "style": "ParkTheBus",
        "aggression": "Normal",
        "tempo": "Slow",
        "width": "Narrow",
        "defensiveLine": "Deep",
        "passingStyle": "LongBall",
        "marking": "ManToMan"
    },
    "St. Louis Spirit": {
        "formation": "TacticType.T_442",
        "style": "HighPress",
        "aggression": "Aggressive",
        "tempo": "Fast",
        "width": "Balanced",
        "defensiveLine": "High",
        "passingStyle": "Direct",
        "marking": "Zonal"
    },
    "Soweto Chiefs": {
        "formation": "TacticType.T_4231",
        "style": "Balanced",
        "aggression": "Normal",
        "tempo": "Normal",
        "width": "Balanced",
        "defensiveLine": "Balanced",
        "passingStyle": "Mixed",
        "marking": "Zonal"
    },
    "Sousse Stars": {
        "formation": "TacticType.T_433",
        "style": "Balanced",
        "aggression": "Aggressive",
        "tempo": "Normal",
        "width": "Wide",
        "defensiveLine": "Balanced",
        "passingStyle": "Mixed",
        "marking": "Zonal"
    },
    "Smouha": {
        "formation": "TacticType.T_4231",
        "style": "Counter",
        "aggression": "Normal",
        "tempo": "Fast",
        "width": "Balanced",
        "defensiveLine": "Deep",
        "passingStyle": "Direct",
        "marking": "Zonal"
    },
    "Shimizu S-Pulse": {
        "formation": "TacticType.T_4231",
        "style": "Balanced",
        "aggression": "Normal",
        "tempo": "Normal",
        "width": "Balanced",
        "defensiveLine": "Balanced",
        "passingStyle": "Mixed",
        "marking": "Zonal"
    },
    "Shanghai Port": {
        "formation": "TacticType.T_4231",
        "style": "Balanced",
        "aggression": "Normal",
        "tempo": "Normal",
        "width": "Wide",
        "defensiveLine": "Balanced",
        "passingStyle": "Mixed",
        "marking": "Zonal"
    },
    "Seville GreenWhites": {
        "formation": "TacticType.T_4231",
        "style": "Balanced",
        "aggression": "Normal",
        "tempo": "Normal",
        "width": "Wide",
        "defensiveLine": "Balanced",
        "passingStyle": "Mixed",
        "marking": "Zonal"
    },
    "Nervion Red-Whites": {
        "formation": "TacticType.T_442",
        "style": "WingPlay",
        "aggression": "Aggressive",
        "tempo": "Fast",
        "width": "Wide",
        "defensiveLine": "Balanced",
        "passingStyle": "Direct",
        "marking": "Zonal"
    },
    "Serena Garnet": {
        "formation": "TacticType.T_442",
        "style": "Counter",
        "aggression": "Normal",
        "tempo": "Fast",
        "width": "Balanced",
        "defensiveLine": "Deep",
        "passingStyle": "LongBall",
        "marking": "ManToMan"
    },
    "Seoul City": {
        "formation": "TacticType.T_433",
        "style": "Balanced",
        "aggression": "Normal",
        "tempo": "Normal",
        "width": "Balanced",
        "defensiveLine": "Balanced",
        "passingStyle": "Mixed",
        "marking": "Zonal"
    },
    "Sekhukhune United": {
        "formation": "TacticType.T_451",
        "style": "ParkTheBus",
        "aggression": "Aggressive",
        "tempo": "Slow",
        "width": "Narrow",
        "defensiveLine": "Deep",
        "passingStyle": "LongBall",
        "marking": "ManToMan"
    },
    "Seattle Emeralds": {
        "formation": "TacticType.T_4231",
        "style": "Balanced",
        "aggression": "Normal",
        "tempo": "Normal",
        "width": "Balanced",
        "defensiveLine": "Balanced",
        "passingStyle": "Mixed",
        "marking": "Zonal"
    },
    "Sayago Green": {
        "formation": "TacticType.T_442",
        "style": "Counter",
        "aggression": "Aggressive",
        "tempo": "Fast",
        "width": "Narrow",
        "defensiveLine": "Deep",
        "passingStyle": "Direct",
        "marking": "ManToMan"
    },
    "Sassuolo Greenblacks": {
        "formation": "TacticType.T_433",
        "style": "WingPlay",
        "aggression": "Normal",
        "tempo": "Fast",
        "width": "Wide",
        "defensiveLine": "Balanced",
        "passingStyle": "Mixed",
        "marking": "Zonal"
    },
    "Saprissa": {
        "formation": "TacticType.T_343",
        "style": "Balanced",
        "aggression": "Aggressive",
        "tempo": "Normal",
        "width": "Wide",
        "defensiveLine": "High",
        "passingStyle": "Direct",
        "marking": "ManToMan"
    },
    "São Paulo Warriors": {
        "formation": "TacticType.T_433",
        "style": "Counter",
        "aggression": "Aggressive",
        "tempo": "Fast",
        "width": "Wide",
        "defensiveLine": "Balanced",
        "passingStyle": "Direct",
        "marking": "Zonal"
    },
    "São Paulo Tigers": {
        "formation": "TacticType.T_4231",
        "style": "WingPlay",
        "aggression": "Normal",
        "tempo": "Normal",
        "width": "Wide",
        "defensiveLine": "Balanced",
        "passingStyle": "Mixed",
        "marking": "Zonal"
    },
    "São Paulo Palms": {
        "formation": "TacticType.T_4231",
        "style": "HighPress",
        "aggression": "Aggressive",
        "tempo": "Fast",
        "width": "Balanced",
        "defensiveLine": "High",
        "passingStyle": "Direct",
        "marking": "Zonal"
    }
}

print(f"Processing {len(new_teams)} teams...")

# Read the file
with open('constants.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Find existing teams
existing_teams = set(re.findall(r'"([^"]+)"\s*:\s*\{[^}]*formation:', content))

# Check which teams already exist
teams_to_add = []
teams_to_skip = []

for team_name, tactics in new_teams.items():
    if team_name in existing_teams:
        teams_to_skip.append(team_name)
    else:
        teams_to_add.append(team_name)

print(f"\n✅ Teams to add: {len(teams_to_add)}")
print(f"⏭️  Teams to skip (already exist): {len(teams_to_skip)}")

if teams_to_skip:
    print("\nSkipping:")
    for team in teams_to_skip:
        print(f"  - {team}")

# Generate the new entries
new_entries = []
for team_name in teams_to_add:
    tactics = new_teams[team_name]
    entry = f'''    "{team_name}": {{
        formation: {tactics['formation']},
        style: '{tactics['style']}',
        aggression: '{tactics['aggression']}',
        tempo: '{tactics['tempo']}',
        width: '{tactics['width']}',
        defensiveLine: '{tactics['defensiveLine']}',
        passingStyle: '{tactics['passingStyle']}',
        marking: '{tactics['marking']}'
    }}'''
    new_entries.append(entry)

if new_entries:
    # Find the insertion point - before the closing brace of TEAM_TACTICAL_PROFILES
    # Look for "};\n\nexport const LEAGUE_PRESETS"
    league_presets_pos = content.find('export const LEAGUE_PRESETS')
    
    if league_presets_pos == -1:
        print("❌ Could not find LEAGUE_PRESETS")
        exit(1)
    
    # Find the closing brace before LEAGUE_PRESETS
    closing_brace_pos = content.rfind('};\n', 0, league_presets_pos)
    
    if closing_brace_pos == -1:
        print("❌ Could not find closing brace")
        exit(1)
    
    # Insert new entries before the closing brace and semicolon
    new_section = ",\n\n    // Additional Teams (S-Range)\n" + ",\n".join(new_entries) + "\n"
    new_content = content[:closing_brace_pos] + new_section + content[closing_brace_pos:]
    
    # Write back
    with open('constants.ts', 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print(f"\n✅ Added {len(teams_to_add)} new teams!")
    print("\nAdded teams:")
    for team in teams_to_add:
        print(f"  + {team}")
else:
    print("\n⚠️ No new teams to add!")
