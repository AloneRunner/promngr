import re

# Teams data - mix of new and updates
teams_data = {
    "Tijuana Dogs": {  # NEW
        "formation": "TacticType.T_4231",
        "style": "Balanced",
        "aggression": "Normal",
        "tempo": "Normal",
        "width": "Wide",
        "defensiveLine": "Balanced",
        "passingStyle": "Direct",
        "marking": "Zonal"
    },
    "Tehran Reds": {  # NEW
        "formation": "TacticType.T_4231",
        "style": "HighPress",
        "aggression": "Aggressive",
        "tempo": "Fast",
        "width": "Balanced",
        "defensiveLine": "High",
        "passingStyle": "Mixed",
        "marking": "Zonal"
    },
    "Talcahuano Steel": {  # NEW
        "formation": "TacticType.T_442",
        "style": "Counter",
        "aggression": "Aggressive",
        "tempo": "Fast",
        "width": "Balanced",
        "defensiveLine": "Balanced",
        "passingStyle": "Direct",
        "marking": "ManToMan"
    },
    "Tala'ea El Gaish": {  # NEW
        "formation": "TacticType.T_4231",
        "style": "Counter",
        "aggression": "Normal",
        "tempo": "Fast",
        "width": "Wide",
        "defensiveLine": "Deep",
        "passingStyle": "LongBall",
        "marking": "Zonal"
    },
    "Sydney Sky Blues": {  # NEW
        "formation": "TacticType.T_4231",
        "style": "WingPlay",
        "aggression": "Normal",
        "tempo": "Normal",
        "width": "Wide",
        "defensiveLine": "Balanced",
        "passingStyle": "Mixed",
        "marking": "Zonal"
    },
    "SuperSport United": {  # NEW
        "formation": "TacticType.T_433",
        "style": "Balanced",
        "aggression": "Aggressive",
        "tempo": "Normal",
        "width": "Balanced",
        "defensiveLine": "Balanced",
        "passingStyle": "Direct",
        "marking": "Zonal"
    },
    "Trinbago Riders FC": {  # UPDATE: width Wide -> Balanced, passingStyle Direct -> Mixed
        "formation": "TacticType.T_4231",
        "style": "Counter",
        "aggression": "Normal",
        "tempo": "Fast",
        "width": "Balanced",
        "defensiveLine": "Deep",
        "passingStyle": "Mixed",
        "marking": "Zonal"
    },
    "Trabzon Storm": {  # UPDATE: passingStyle Mixed -> Direct
        "formation": "TacticType.T_4231",
        "style": "WingPlay",
        "aggression": "Aggressive",
        "tempo": "Fast",
        "width": "Wide",
        "defensiveLine": "Balanced",
        "passingStyle": "Direct",
        "marking": "Zonal"
    },
    "Toulouse Violets": {  # UPDATE: defensiveLine Deep -> Balanced, passingStyle Direct -> Mixed
        "formation": "TacticType.T_343",
        "style": "Counter",
        "aggression": "Normal",
        "tempo": "Fast",
        "width": "Wide",
        "defensiveLine": "Balanced",
        "passingStyle": "Mixed",
        "marking": "Zonal"
    },
    "North London Whites": {  # UPDATE: formation T_4231 -> T_433
        "formation": "TacticType.T_433",
        "style": "HighPress",
        "aggression": "Aggressive",
        "tempo": "Fast",
        "width": "Wide",
        "defensiveLine": "High",
        "passingStyle": "Mixed",
        "marking": "Zonal"
    },
    "Toronto Reds": {
        "formation": "TacticType.T_433",
        "style": "WingPlay",
        "aggression": "Normal",
        "tempo": "Normal",
        "width": "Wide",
        "defensiveLine": "Balanced",
        "passingStyle": "Mixed",
        "marking": "Zonal"
    },
    "Torino Bulls": {  # UPDATE: tempo Fast -> Normal, width Wide -> Balanced
        "formation": "TacticType.T_352",
        "style": "HighPress",
        "aggression": "Aggressive",
        "tempo": "Normal",
        "width": "Balanced",
        "defensiveLine": "Balanced",
        "passingStyle": "Mixed",
        "marking": "ManToMan"
    },
    "Toluca Devils": {  # UPDATE: width Balanced -> Wide
        "formation": "TacticType.T_4231",
        "style": "Balanced",
        "aggression": "Normal",
        "tempo": "Fast",
        "width": "Wide",
        "defensiveLine": "Balanced",
        "passingStyle": "Mixed",
        "marking": "Zonal"
    },
    "Tokyo Verdy": {  # UPDATE: tempo Fast -> Normal
        "formation": "TacticType.T_442",
        "style": "Counter",
        "aggression": "Normal",
        "tempo": "Normal",
        "width": "Balanced",
        "defensiveLine": "Deep",
        "passingStyle": "Direct",
        "marking": "Zonal"
    }
}

# Read constants.ts
with open('constants.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Check which are new vs existing
existing_teams = []
new_teams = []

for team_name in teams_data.keys():
    if f'"{team_name}":' in content:
        existing_teams.append(team_name)
    else:
        new_teams.append(team_name)

print(f"Already exist: {len(existing_teams)}")
for team in sorted(existing_teams):
    print(f"  - {team}")

print(f"\nNew teams to add: {len(new_teams)}")
for team in sorted(new_teams):
    print(f"  - {team}")

# Add new teams first
new_entries = []
for team_name in sorted(new_teams):
    data = teams_data[team_name]
    entry = f'''    "{team_name}": {{
        formation: {data['formation']},
        style: '{data['style']}',
        aggression: '{data['aggression']}',
        tempo: '{data['tempo']}',
        width: '{data['width']}',
        defensiveLine: '{data['defensiveLine']}',
        passingStyle: '{data['passingStyle']}',
        marking: '{data['marking']}'
    }}'''
    new_entries.append(entry)

if new_entries:
    pattern = r'(    "Lyon Kids": \{[^}]+\})'
    match = re.search(pattern, content, re.DOTALL)
    
    if match:
        insertion_text = ",\n" + ",\n".join(new_entries) + ",\n"
        content = content[:match.start()] + insertion_text + content[match.start():]
        print(f"\n✅ Added {len(new_teams)} new teams!")

# Update existing teams
updates_made = 0
for team_name in existing_teams:
    if team_name in teams_data:
        data = teams_data[team_name]
        pattern = rf'    "{team_name}": \{{[^}}]+\}}'
        match = re.search(pattern, content, re.DOTALL)
        
        if match:
            new_entry = f'''    "{team_name}": {{
        formation: {data['formation']},
        style: '{data['style']}',
        aggression: '{data['aggression']}',
        tempo: '{data['tempo']}',
        width: '{data['width']}',
        defensiveLine: '{data['defensiveLine']}',
        passingStyle: '{data['passingStyle']}',
        marking: '{data['marking']}'
    }}'''
            content = content[:match.start()] + new_entry + content[match.end():]
            updates_made += 1
            print(f"✅ Updated {team_name}")

# Write back
with open('constants.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print(f"\n✅ Process complete! Added {len(new_teams)} teams, updated {updates_made} teams")
print(f"Total teams processed: {len(teams_data)}")
