import re

# UNIQUE NEW TEAMS ONLY (filtered ~68 entries down to uniques)
new_teams = {
    # M-N Teams (New entries only)
    "Modern Sport": {
        "formation": "TacticType.T_4231",
        "style": "Counter",
        "aggression": "Normal",
        "tempo": "Fast",
        "width": "Wide",
        "defensiveLine": "Balanced",
        "passingStyle": "Direct",
        "marking": "Zonal"
    },
    "Mito HollyHock": {
        "formation": "TacticType.T_442",
        "style": "ParkTheBus",
        "aggression": "Normal",
        "tempo": "Slow",
        "width": "Narrow",
        "defensiveLine": "Deep",
        "passingStyle": "LongBall",
        "marking": "ManToMan"
    },
    "Mirassol Suns": {
        "formation": "TacticType.T_4231",
        "style": "Balanced",
        "aggression": "Normal",
        "tempo": "Normal",
        "width": "Balanced",
        "defensiveLine": "Balanced",
        "passingStyle": "Mixed",
        "marking": "Zonal"
    },
    "Miami Vice": {
        "formation": "TacticType.T_433",
        "style": "Balanced",
        "aggression": "Normal",
        "tempo": "Slow",
        "width": "Wide",
        "defensiveLine": "Balanced",
        "passingStyle": "Short",
        "marking": "Zonal"
    },
    "Mexico Eagles": {
        "formation": "TacticType.T_4231",
        "style": "HighPress",
        "aggression": "Aggressive",
        "tempo": "Fast",
        "width": "Wide",
        "defensiveLine": "High",
        "passingStyle": "Mixed",
        "marking": "Zonal"
    },
    "Mexico City Pumas": {
        "formation": "TacticType.T_442",
        "style": "Counter",
        "aggression": "Normal",
        "tempo": "Fast",
        "width": "Wide",
        "defensiveLine": "Balanced",
        "passingStyle": "Direct",
        "marking": "Zonal"
    },
    "Monza Speed": {
        "formation": "TacticType.T_352",
        "style": "Balanced",
        "aggression": "Normal",
        "tempo": "Normal",
        "width": "Balanced",
        "defensiveLine": "Balanced",
        "passingStyle": "Mixed",
        "marking": "ManToMan"
    },
    "Montreal Impact": {
        "formation": "TacticType.T_343",
        "style": "Counter",
        "aggression": "Aggressive",
        "tempo": "Fast",
        "width": "Wide",
        "defensiveLine": "Balanced",
        "passingStyle": "Direct",
        "marking": "Zonal"
    },
    "Montpellier Orange": {
        "formation": "TacticType.T_4231",
        "style": "Counter",
        "aggression": "Aggressive",
        "tempo": "Fast",
        "width": "Wide",
        "defensiveLine": "Balanced",
        "passingStyle": "Mixed",
        "marking": "Zonal"
    },
    "Montevideo Tricolor": {
        "formation": "TacticType.T_4231",
        "style": "HighPress",
        "aggression": "Aggressive",
        "tempo": "Normal",
        "width": "Wide",
        "defensiveLine": "High",
        "passingStyle": "Direct",
        "marking": "Zonal"
    },
    "Montevideo Tailors": {
        "formation": "TacticType.T_442",
        "style": "Balanced",
        "aggression": "Normal",
        "tempo": "Normal",
        "width": "Balanced",
        "defensiveLine": "Balanced",
        "passingStyle": "Mixed",
        "marking": "Zonal"
    },
    "Montevideo Pioneers": {
        "formation": "TacticType.T_442",
        "style": "Counter",
        "aggression": "Normal",
        "tempo": "Fast",
        "width": "Narrow",
        "defensiveLine": "Deep",
        "passingStyle": "Direct",
        "marking": "Zonal"
    },
    "Montevideo LightBlue": {
        "formation": "TacticType.T_433",
        "style": "Balanced",
        "aggression": "Normal",
        "tempo": "Normal",
        "width": "Wide",
        "defensiveLine": "Balanced",
        "passingStyle": "Short",
        "marking": "Zonal"
    },
    "Montevideo Coal": {
        "formation": "TacticType.T_4231",
        "style": "HighPress",
        "aggression": "Aggressive",
        "tempo": "Fast",
        "width": "Wide",
        "defensiveLine": "High",
        "passingStyle": "Direct",
        "marking": "Zonal"
    },
    "Monterrey Tigers": {
        "formation": "TacticType.T_4231",
        "style": "Balanced",
        "aggression": "Normal",
        "tempo": "Normal",
        "width": "Wide",
        "defensiveLine": "Balanced",
        "passingStyle": "Mixed",
        "marking": "Zonal"
    },
    "Monterrey Rays": {
        "formation": "TacticType.T_4231",
        "style": "WingPlay",
        "aggression": "Aggressive",
        "tempo": "Fast",
        "width": "Wide",
        "defensiveLine": "High",
        "passingStyle": "Mixed",
        "marking": "Zonal"
    },
    "Montego Bay Waves": {
        "formation": "TacticType.T_433",
        "style": "Counter",
        "aggression": "Normal",
        "tempo": "Fast",
        "width": "Wide",
        "defensiveLine": "Balanced",
        "passingStyle": "Direct",
        "marking": "Zonal"
    },
    "Nagoya Grampus": {
        "formation": "TacticType.T_343",
        "style": "Counter",
        "aggression": "Normal",
        "tempo": "Fast",
        "width": "Wide",
        "defensiveLine": "Balanced",
        "passingStyle": "Direct",
        "marking": "Zonal"
    },
    "Nantes Yellows": {
        "formation": "TacticType.T_532",
        "style": "Counter",
        "aggression": "Aggressive",
        "tempo": "Fast",
        "width": "Narrow",
        "defensiveLine": "Deep",
        "passingStyle": "Direct",
        "marking": "ManToMan"
    },
    "Nashville Music": {
        "formation": "TacticType.T_4231",
        "style": "Counter",
        "aggression": "Normal",
        "tempo": "Fast",
        "width": "Wide",
        "defensiveLine": "Deep",
        "passingStyle": "Direct",
        "marking": "Zonal"
    },
    "Necaxa Lightning": {
        "formation": "TacticType.T_532",
        "style": "ParkTheBus",
        "aggression": "Normal",
        "tempo": "Slow",
        "width": "Narrow",
        "defensiveLine": "Deep",
        "passingStyle": "LongBall",
        "marking": "ManToMan"
    },
    "NEOM SC": {
        "formation": "TacticType.T_4231",
        "style": "WingPlay",
        "aggression": "Normal",
        "tempo": "Normal",
        "width": "Wide",
        "defensiveLine": "Balanced",
        "passingStyle": "Mixed",
        "marking": "Zonal"
    },
    "New York City Blue": {
        "formation": "TacticType.T_433",
        "style": "Balanced",
        "aggression": "Normal",
        "tempo": "Normal",
        "width": "Wide",
        "defensiveLine": "Balanced",
        "passingStyle": "Mixed",
        "marking": "Zonal"
    },
    "New York Energy": {
        "formation": "TacticType.T_4231",
        "style": "HighPress",
        "aggression": "Aggressive",
        "tempo": "Fast",
        "width": "Balanced",
        "defensiveLine": "High",
        "passingStyle": "Direct",
        "marking": "Zonal"
    },
    "Newcastle Jets": {
        "formation": "TacticType.T_442",
        "style": "Counter",
        "aggression": "Normal",
        "tempo": "Fast",
        "width": "Wide",
        "defensiveLine": "Balanced",
        "passingStyle": "Direct",
        "marking": "Zonal"
    }
}

print(f"⚠️  AI REPETITION CONTINUES!")
print(f"Filtered from ~68 total entries to {len(new_teams)} UNIQUE teams\n")

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
    new_section = ",\n\n    // Additional Teams (M-N Batch)\n" + ",\n".join(new_entries) + "\n"
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
