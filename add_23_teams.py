import re

# Teams to add
teams_data = {
    "WS Wanderers": {
        "formation": "TacticType.T_4231",
        "style": "Counter",
        "aggression": "Normal",
        "tempo": "Fast",
        "width": "Wide",
        "defensiveLine": "Balanced",
        "passingStyle": "Direct",
        "marking": "Zonal"
    },
    "West Midlands Wolves": {
        "formation": "TacticType.T_343",
        "style": "HighPress",
        "aggression": "Aggressive",
        "tempo": "Fast",
        "width": "Wide",
        "defensiveLine": "High",
        "passingStyle": "Mixed",
        "marking": "ManToMan"
    },
    "Wolfsburg Green": {
        "formation": "TacticType.T_442",
        "style": "Balanced",
        "aggression": "Normal",
        "tempo": "Normal",
        "width": "Balanced",
        "defensiveLine": "Balanced",
        "passingStyle": "Mixed",
        "marking": "Zonal"
    },
    "Weymouth Wales FC": {
        "formation": "TacticType.T_442",
        "style": "ParkTheBus",
        "aggression": "Aggressive",
        "tempo": "Slow",
        "width": "Narrow",
        "defensiveLine": "Deep",
        "passingStyle": "LongBall",
        "marking": "ManToMan"
    },
    "East London Hammers": {
        "formation": "TacticType.T_4231",
        "style": "Counter",
        "aggression": "Aggressive",
        "tempo": "Fast",
        "width": "Wide",
        "defensiveLine": "Deep",
        "passingStyle": "Direct",
        "marking": "Zonal"
    },
    "Western United": {
        "formation": "TacticType.T_4231",
        "style": "Balanced",
        "aggression": "Normal",
        "tempo": "Normal",
        "width": "Balanced",
        "defensiveLine": "Balanced",
        "passingStyle": "Mixed",
        "marking": "Zonal"
    },
    "Western Tigers SC": {
        "formation": "TacticType.T_532",
        "style": "ParkTheBus",
        "aggression": "Aggressive",
        "tempo": "Slow",
        "width": "Narrow",
        "defensiveLine": "Deep",
        "passingStyle": "LongBall",
        "marking": "ManToMan"
    },
    "Wellington Phoenix": {
        "formation": "TacticType.T_442",
        "style": "WingPlay",
        "aggression": "Normal",
        "tempo": "Normal",
        "width": "Wide",
        "defensiveLine": "Balanced",
        "passingStyle": "Mixed",
        "marking": "Zonal"
    },
    "Wadi Degla": {
        "formation": "TacticType.T_433",
        "style": "Balanced",
        "aggression": "Normal",
        "tempo": "Normal",
        "width": "Balanced",
        "defensiveLine": "Balanced",
        "passingStyle": "Mixed",
        "marking": "Zonal"
    },
    "V-Varen Nagasaki": {
        "formation": "TacticType.T_4231",
        "style": "Counter",
        "aggression": "Normal",
        "tempo": "Fast",
        "width": "Wide",
        "defensiveLine": "Deep",
        "passingStyle": "Direct",
        "marking": "Zonal"
    },
    "Vitoria Foxes": {
        "formation": "TacticType.T_4231",
        "style": "ParkTheBus",
        "aggression": "Aggressive",
        "tempo": "Fast",
        "width": "Narrow",
        "defensiveLine": "Deep",
        "passingStyle": "LongBall",
        "marking": "ManToMan"
    },
    "Viña Gold": {
        "formation": "TacticType.T_433",
        "style": "Balanced",
        "aggression": "Normal",
        "tempo": "Normal",
        "width": "Balanced",
        "defensiveLine": "Balanced",
        "passingStyle": "Mixed",
        "marking": "Zonal"
    },
    "Villa Albiceleste": {
        "formation": "TacticType.T_442",
        "style": "ParkTheBus",
        "aggression": "Aggressive",
        "tempo": "Slow",
        "width": "Narrow",
        "defensiveLine": "Deep",
        "passingStyle": "LongBall",
        "marking": "ManToMan"
    },
    "Vigo Sky Blues": {
        "formation": "TacticType.T_442",
        "style": "Counter",
        "aggression": "Normal",
        "tempo": "Fast",
        "width": "Wide",
        "defensiveLine": "Balanced",
        "passingStyle": "Direct",
        "marking": "Zonal"
    },
    "Victoria Tigers": {
        "formation": "TacticType.T_4231",
        "style": "Balanced",
        "aggression": "Aggressive",
        "tempo": "Normal",
        "width": "Balanced",
        "defensiveLine": "Balanced",
        "passingStyle": "Mixed",
        "marking": "Zonal"
    },
    "Verona Mastiffs": {
        "formation": "TacticType.T_343",
        "style": "HighPress",
        "aggression": "Aggressive",
        "tempo": "Fast",
        "width": "Wide",
        "defensiveLine": "High",
        "passingStyle": "LongBall",
        "marking": "ManToMan"
    },
    "Venice Gondoliers": {
        "formation": "TacticType.T_352",
        "style": "WingPlay",
        "aggression": "Normal",
        "tempo": "Normal",
        "width": "Wide",
        "defensiveLine": "Balanced",
        "passingStyle": "Mixed",
        "marking": "Zonal"
    },
    "Velez Fort": {
        "formation": "TacticType.T_4231",
        "style": "HighPress",
        "aggression": "Aggressive",
        "tempo": "Fast",
        "width": "Balanced",
        "defensiveLine": "High",
        "passingStyle": "Mixed",
        "marking": "Zonal"
    },
    "Varela Hawks": {
        "formation": "TacticType.T_433",
        "style": "HighPress",
        "aggression": "Normal",
        "tempo": "Fast",
        "width": "Wide",
        "defensiveLine": "High",
        "passingStyle": "Direct",
        "marking": "Zonal"
    },
    "Vancouver Village": {
        "formation": "TacticType.T_343",
        "style": "Counter",
        "aggression": "Normal",
        "tempo": "Fast",
        "width": "Wide",
        "defensiveLine": "Balanced",
        "passingStyle": "Mixed",
        "marking": "Zonal"
    },
    "Vallecano Lightning": {
        "formation": "TacticType.T_4231",
        "style": "HighPress",
        "aggression": "Aggressive",
        "tempo": "Fast",
        "width": "Wide",
        "defensiveLine": "High",
        "passingStyle": "Direct",
        "marking": "ManToMan"
    },
    "Castilla Violet": {
        "formation": "TacticType.T_433",
        "style": "Balanced",
        "aggression": "Normal",
        "tempo": "Normal",
        "width": "Balanced",
        "defensiveLine": "Balanced",
        "passingStyle": "Mixed",
        "marking": "Zonal"
    },
    "Valencia Bats": {
        "formation": "TacticType.T_442",
        "style": "Counter",
        "aggression": "Aggressive",
        "tempo": "Fast",
        "width": "Narrow",
        "defensiveLine": "Deep",
        "passingStyle": "Direct",
        "marking": "Zonal"
    }
}

# Read constants.ts
with open('constants.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Check which teams already exist
existing_teams = []
new_teams = []

for team_name in teams_data.keys():
    if f'"{team_name}":' in content:
        existing_teams.append(team_name)
    else:
        new_teams.append(team_name)

print(f"Already exist: {len(existing_teams)}")
for team in existing_teams:
    print(f"  - {team}")

print(f"\nNew teams to add: {len(new_teams)}")
for team in new_teams:
    print(f"  - {team}")

# Generate the new entries
new_entries = []
for team_name in new_teams:
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

# Find insertion point (before "Lyon Kids" which is the last entry)
pattern = r'(    "Lyon Kids": \{[^}]+\})'
match = re.search(pattern, content, re.DOTALL)

if match:
    # Insert before Lyon Kids with proper formatting
    insertion_text = ",\n\n    // Additional Teams (V-W)\n" + ",\n".join(new_entries) + ",\n"
    
    # Replace
    new_content = content[:match.start()] + insertion_text + content[match.start():]
    
    # Write back
    with open('constants.ts', 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print(f"\n✅ Successfully added {len(new_teams)} teams!")
else:
    print("\n❌ Could not find insertion point!")
