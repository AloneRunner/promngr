import re

# FILTERED UNIQUE NEW TEAMS ONLY (removed ~70 duplicates from AI output)
new_teams = {
    # O Teams
    "Orlando Lions": {
        "formation": "TacticType.T_4231",
        "style": "Balanced",
        "aggression": "Normal",
        "tempo": "Normal",
        "width": "Balanced",
        "defensiveLine": "Balanced",
        "passingStyle": "Short",
        "marking": "Zonal"
    },
    "Orange Berkane": {
        "formation": "TacticType.T_433",
        "style": "Counter",
        "aggression": "Aggressive",
        "tempo": "Fast",
        "width": "Wide",
        "defensiveLine": "Balanced",
        "passingStyle": "Direct",
        "marking": "Zonal"
    },
    "O&M University": {
        "formation": "TacticType.T_541",
        "style": "ParkTheBus",
        "aggression": "Normal",
        "tempo": "Slow",
        "width": "Narrow",
        "defensiveLine": "Deep",
        "passingStyle": "LongBall",
        "marking": "ManToMan"
    },
    "Olympic Safi": {
        "formation": "TacticType.T_442",
        "style": "Balanced",
        "aggression": "Normal",
        "tempo": "Normal",
        "width": "Balanced",
        "defensiveLine": "Balanced",
        "passingStyle": "Mixed",
        "marking": "Zonal"
    },
    # P Teams
    "Petrojet": {
        "formation": "TacticType.T_532",
        "style": "Counter",
        "aggression": "Normal",
        "tempo": "Normal",
        "width": "Narrow",
        "defensiveLine": "Deep",
        "passingStyle": "Direct",
        "marking": "Zonal"
    },
    "Perth Glory": {
        "formation": "TacticType.T_442",
        "style": "WingPlay",
        "aggression": "Normal",
        "tempo": "Fast",
        "width": "Wide",
        "defensiveLine": "Balanced",
        "passingStyle": "Mixed",
        "marking": "Zonal"
    },
    "Pereira Wolves": {
        "formation": "TacticType.T_352",
        "style": "Counter",
        "aggression": "Aggressive",
        "tempo": "Fast",
        "width": "Balanced",
        "defensiveLine": "Deep",
        "passingStyle": "Direct",
        "marking": "ManToMan"
    },
    "Pedrenses Blue": {
        "formation": "TacticType.T_442",
        "style": "ParkTheBus",
        "aggression": "Normal",
        "tempo": "Slow",
        "width": "Narrow",
        "defensiveLine": "Deep",
        "passingStyle": "LongBall",
        "marking": "Zonal"
    },
    "Paternal Bugs": {
        "formation": "TacticType.T_343",
        "style": "HighPress",
        "aggression": "Aggressive",
        "tempo": "Fast",
        "width": "Wide",
        "defensiveLine": "High",
        "passingStyle": "Mixed",
        "marking": "ManToMan"
    },
    "Pasto Volcano": {
        "formation": "TacticType.T_532",
        "style": "ParkTheBus",
        "aggression": "Aggressive",
        "tempo": "Slow",
        "width": "Narrow",
        "defensiveLine": "Deep",
        "passingStyle": "LongBall",
        "marking": "Zonal"
    },
    "Parque Violet": {
        "formation": "TacticType.T_433",
        "style": "Balanced",
        "aggression": "Normal",
        "tempo": "Normal",
        "width": "Balanced",
        "defensiveLine": "Balanced",
        "passingStyle": "Short",
        "marking": "Zonal"
    },
    "Parma Crusaders": {
        "formation": "TacticType.T_4231",
        "style": "Counter",
        "aggression": "Normal",
        "tempo": "Fast",
        "width": "Wide",
        "defensiveLine": "Balanced",
        "passingStyle": "Direct",
        "marking": "Zonal"
    },
    "Paris Blue": {
        "formation": "TacticType.T_4231",
        "style": "Balanced",
        "aggression": "Normal",
        "tempo": "Normal",
        "width": "Balanced",
        "defensiveLine": "Balanced",
        "passingStyle": "Mixed",
        "marking": "Zonal"
    },
    "Pamplona Bulls": {
        "formation": "TacticType.T_433",
        "style": "HighPress",
        "aggression": "Aggressive",
        "tempo": "Normal",
        "width": "Wide",
        "defensiveLine": "High",
        "passingStyle": "Direct",
        "marking": "ManToMan"
    },
    "Palermo RedBlue": {
        "formation": "TacticType.T_442",
        "style": "Counter",
        "aggression": "Normal",
        "tempo": "Normal",
        "width": "Balanced",
        "defensiveLine": "Deep",
        "passingStyle": "Direct",
        "marking": "Zonal"
    },
    "Pachuca Gophers": {
        "formation": "TacticType.T_4231",
        "style": "HighPress",
        "aggression": "Aggressive",
        "tempo": "Fast",
        "width": "Wide",
        "defensiveLine": "High",
        "passingStyle": "Mixed",
        "marking": "Zonal"
    },
    "Principality Red": {
        "formation": "TacticType.T_4231",
        "style": "Balanced",
        "aggression": "Normal",
        "tempo": "Normal",
        "width": "Balanced",
        "defensiveLine": "Balanced",
        "passingStyle": "Mixed",
        "marking": "Zonal"
    },
    "Pyramids FC": {
        "formation": "TacticType.T_4231",
        "style": "HighPress",
        "aggression": "Aggressive",
        "tempo": "Fast",
        "width": "Wide",
        "defensiveLine": "High",
        "passingStyle": "Mixed",
        "marking": "Zonal"
    },
    # R Teams (new only, most already exist)
    "Reims Royals": {
        "formation": "TacticType.T_433",
        "style": "Balanced",
        "aggression": "Normal",
        "tempo": "Normal",
        "width": "Balanced",
        "defensiveLine": "Balanced",
        "passingStyle": "Mixed",
        "marking": "Zonal"
    },
    "Riviera Eagles": {
        "formation": "TacticType.T_4231",
        "style": "WingPlay",
        "aggression": "Normal",
        "tempo": "Fast",
        "width": "Wide",
        "defensiveLine": "Balanced",
        "passingStyle": "Direct",
        "marking": "Zonal"
    },
    # S Teams (Forest Archers is actually F, not S)
    "Forest Archers": {
        "formation": "TacticType.T_4231",
        "style": "Counter",
        "aggression": "Aggressive",
        "tempo": "Fast",
        "width": "Wide",
        "defensiveLine": "Deep",
        "passingStyle": "Direct",
        "marking": "Zonal"
    },
    "South Coast Cherries": {
        "formation": "TacticType.T_4231",
        "style": "Balanced",
        "aggression": "Normal",
        "tempo": "Normal",
        "width": "Wide",
        "defensiveLine": "Balanced",
        "passingStyle": "Mixed",
        "marking": "Zonal"
    },
    "Soweto Pirates": {
        "formation": "TacticType.T_433",
        "style": "Counter",
        "aggression": "Aggressive",
        "tempo": "Fast",
        "width": "Wide",
        "defensiveLine": "Balanced",
        "passingStyle": "Direct",
        "marking": "Zonal"
    },
    "Sydney FC": {
        "formation": "TacticType.T_4231",
        "style": "HighPress",
        "aggression": "Aggressive",
        "tempo": "Fast",
        "width": "Wide",
        "defensiveLine": "High",
        "passingStyle": "Mixed",
        "marking": "Zonal"
    },
    # T Teams
    "Tyneside Magpies": {
        "formation": "TacticType.T_433",
        "style": "HighPress",
        "aggression": "Aggressive",
        "tempo": "Fast",
        "width": "Wide",
        "defensiveLine": "High",
        "passingStyle": "Direct",
        "marking": "ManToMan"
    },
    # U Teams
    "Urawa Red Diamonds": {
        "formation": "TacticType.T_4231",
        "style": "Balanced",
        "aggression": "Normal",
        "tempo": "Normal",
        "width": "Balanced",
        "defensiveLine": "Balanced",
        "passingStyle": "Mixed",
        "marking": "Zonal"
    },
    # V Teams (all seem new)
    "Vissel Kobe": {
        "formation": "TacticType.T_433",
        "style": "HighPress",
        "aggression": "Aggressive",
        "tempo": "Normal",
        "width": "Wide",
        "defensiveLine": "High",
        "passingStyle": "Mixed",
        "marking": "Zonal"
    },
    # W Teams
    "West London Bees": {
        "formation": "TacticType.T_433",
        "style": "WingPlay",
        "aggression": "Normal",
        "tempo": "Normal",
        "width": "Wide",
        "defensiveLine": "Balanced",
        "passingStyle": "Mixed",
        "marking": "Zonal"
    },
    # Y Teams
    "Yokohama F. Marinos": {
        "formation": "TacticType.T_433",
        "style": "HighPress",
        "aggression": "Aggressive",
        "tempo": "Fast",
        "width": "Wide",
        "defensiveLine": "High",
        "passingStyle": "Direct",
        "marking": "Zonal"
    }
}

print(f"⚠️  MASSIVE AI REPETITION DETECTED!")
print(f"Filtered from ~95 total entries to {len(new_teams)} UNIQUE teams\n")

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

print(f"✅ Teams to add: {len(teams_to_add)}")
print(f"⏭️  Teams to skip (already exist): {len(teams_to_skip)}")

if teams_to_skip:
    print("\nSkipping (already exist):")
    for team in sorted(teams_to_skip):
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
    # Find the insertion point
    league_presets_pos = content.find('export const LEAGUE_PRESETS')
    
    if league_presets_pos == -1:
        print("❌ Could not find LEAGUE_PRESETS")
        exit(1)
    
    closing_brace_pos = content.rfind('};\n', 0, league_presets_pos)
    
    if closing_brace_pos == -1:
        print("❌ Could not find closing brace")
        exit(1)
    
    # Insert new entries
    new_section = ",\n\n    // Additional Teams (O-Z Final Batch - Heavy Filter)\n" + ",\n".join(new_entries) + "\n"
    new_content = content[:closing_brace_pos] + new_section + content[closing_brace_pos:]
    
    # Write back
    with open('constants.ts', 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print(f"\n✅ Added {len(teams_to_add)} new teams!")
    if teams_to_add:
        print("\nAdded teams:")
        for team in sorted(teams_to_add):
            print(f"  + {team}")
else:
    print("\n⚠️ No new teams to add!")
