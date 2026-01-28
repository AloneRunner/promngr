import re

# All teams from the latest batch
teams_data = {
    "Toronto Reds": {
        "formation": "TacticType.T_433",
        "style": "WingPlay",
        "aggression": "Normal",
        "tempo": "Normal",  # UPDATED from Fast
        "width": "Wide",
        "defensiveLine": "Balanced",
        "passingStyle": "Mixed",
        "marking": "Zonal"
    },
    "Torino Bulls": {  # NEW
        "formation": "TacticType.T_352",
        "style": "HighPress",
        "aggression": "Aggressive",
        "tempo": "Fast",
        "width": "Wide",
        "defensiveLine": "High",
        "passingStyle": "Direct",
        "marking": "ManToMan"
    },
    "Toluca Devils": {  # NEW
        "formation": "TacticType.T_4231",
        "style": "Balanced",
        "aggression": "Normal",
        "tempo": "Fast",
        "width": "Balanced",
        "defensiveLine": "Balanced",
        "passingStyle": "Mixed",
        "marking": "Zonal"
    },
    "Tokyo Verdy": {  # NEW
        "formation": "TacticType.T_442",
        "style": "Counter",
        "aggression": "Normal",
        "tempo": "Fast",
        "width": "Balanced",
        "defensiveLine": "Deep",
        "passingStyle": "Direct",
        "marking": "Zonal"
    },
    "Urawa Reds": {
        "formation": "TacticType.T_4231",
        "style": "Balanced",
        "aggression": "Normal",
        "tempo": "Normal",
        "width": "Balanced",
        "defensiveLine": "Balanced",
        "passingStyle": "Mixed",
        "marking": "Zonal"
    },
    "Union Touarga": {
        "formation": "TacticType.T_433",
        "style": "Counter",
        "aggression": "Normal",
        "tempo": "Fast",
        "width": "Wide",
        "defensiveLine": "Balanced",
        "passingStyle": "Direct",
        "marking": "Zonal"
    },
    "Berlin Iron": {
        "formation": "TacticType.T_532",
        "style": "ParkTheBus",
        "aggression": "Aggressive",
        "tempo": "Normal",
        "width": "Narrow",
        "defensiveLine": "Deep",
        "passingStyle": "LongBall",
        "marking": "ManToMan"
    },
    "Ulsan Tigers": {
        "formation": "TacticType.T_4231",
        "style": "WingPlay",
        "aggression": "Aggressive",
        "tempo": "Fast",
        "width": "Wide",
        "defensiveLine": "High",
        "passingStyle": "Mixed",
        "marking": "Zonal"
    },
    "Udine Friuli": {
        "formation": "TacticType.T_352",
        "style": "Counter",  # UPDATED from WingPlay
        "aggression": "Aggressive",  # UPDATED from Normal
        "tempo": "Fast",
        "width": "Wide",
        "defensiveLine": "Deep",  # UPDATED from Balanced
        "passingStyle": "Direct",
        "marking": "ManToMan"
    },
    "Tunja Checkers": {
        "formation": "TacticType.T_442",
        "style": "ParkTheBus",
        "aggression": "Normal",
        "tempo": "Slow",
        "width": "Narrow",
        "defensiveLine": "Deep",
        "passingStyle": "LongBall",
        "marking": "Zonal"
    },
    "Tunis Gold": {
        "formation": "TacticType.T_433",
        "style": "HighPress",
        "aggression": "Aggressive",
        "tempo": "Fast",
        "width": "Wide",
        "defensiveLine": "High",
        "passingStyle": "Mixed",
        "marking": "Zonal"
    },
    "Tunis Red-Whites": {
        "formation": "TacticType.T_433",
        "style": "WingPlay",
        "aggression": "Aggressive",  # UPDATED from Normal
        "tempo": "Fast",
        "width": "Wide",
        "defensiveLine": "Balanced",
        "passingStyle": "Direct",
        "marking": "Zonal"
    },
    "Sousse Stars": {
        "formation": "TacticType.T_4231",
        "style": "Counter",
        "aggression": "Aggressive",
        "tempo": "Fast",
        "width": "Balanced",
        "defensiveLine": "Deep",
        "passingStyle": "Direct",
        "marking": "ManToMan"
    },
    "Sfax Zebra": {
        "formation": "TacticType.T_442",
        "style": "Balanced",
        "aggression": "Normal",
        "tempo": "Normal",
        "width": "Balanced",
        "defensiveLine": "Balanced",
        "passingStyle": "Mixed",
        "marking": "Zonal"
    },
    "Monastir Blue": {
        "formation": "TacticType.T_433",
        "style": "HighPress",
        "aggression": "Aggressive",
        "tempo": "Fast",
        "width": "Wide",
        "defensiveLine": "High",
        "passingStyle": "Direct",
        "marking": "Zonal"
    },
    "Bardo Green": {
        "formation": "TacticType.T_4231",
        "style": "Counter",
        "aggression": "Normal",
        "tempo": "Normal",
        "width": "Balanced",
        "defensiveLine": "Deep",
        "passingStyle": "LongBall",
        "marking": "Zonal"
    },
    "Bizerte Sharks": {
        "formation": "TacticType.T_442",
        "style": "ParkTheBus",
        "aggression": "Aggressive",
        "tempo": "Slow",
        "width": "Narrow",
        "defensiveLine": "Deep",
        "passingStyle": "LongBall",
        "marking": "ManToMan"
    },
    "Beja Storks": {
        "formation": "TacticType.T_451",
        "style": "Counter",
        "aggression": "Normal",
        "tempo": "Fast",
        "width": "Wide",
        "defensiveLine": "Deep",
        "passingStyle": "Direct",
        "marking": "Zonal"
    },
    "Metlaoui Mines": {
        "formation": "TacticType.T_532",
        "style": "ParkTheBus",
        "aggression": "Normal",
        "tempo": "Slow",
        "width": "Narrow",
        "defensiveLine": "Deep",
        "passingStyle": "LongBall",
        "marking": "Zonal"
    },
    "Ben Guerdane Riders": {
        "formation": "TacticType.T_442",
        "style": "Balanced",
        "aggression": "Aggressive",
        "tempo": "Normal",
        "width": "Balanced",
        "defensiveLine": "Balanced",
        "passingStyle": "Mixed",
        "marking": "ManToMan"
    },
    "Marsa Beach": {
        "formation": "TacticType.T_4231",
        "style": "Counter",
        "aggression": "Normal",
        "tempo": "Fast",
        "width": "Wide",
        "defensiveLine": "Deep",
        "passingStyle": "Direct",
        "marking": "Zonal"
    },
    "Zarzis Olive": {
        "formation": "TacticType.T_442",
        "style": "Balanced",
        "aggression": "Normal",
        "tempo": "Normal",
        "width": "Balanced",
        "defensiveLine": "Balanced",
        "passingStyle": "Mixed",
        "marking": "Zonal"
    },
    "Kairouan Historic": {
        "formation": "TacticType.T_532",
        "style": "ParkTheBus",
        "aggression": "Normal",
        "tempo": "Slow",
        "width": "Narrow",
        "defensiveLine": "Deep",
        "passingStyle": "LongBall",
        "marking": "ManToMan"
    },
    "Omrane Build": {
        "formation": "TacticType.T_451",
        "style": "Counter",
        "aggression": "Normal",
        "tempo": "Fast",
        "width": "Wide",
        "defensiveLine": "Deep",
        "passingStyle": "Direct",
        "marking": "Zonal"
    },
    "Soliman Future": {
        "formation": "TacticType.T_442",
        "style": "ParkTheBus",
        "aggression": "Normal",
        "tempo": "Slow",
        "width": "Narrow",
        "defensiveLine": "Deep",
        "passingStyle": "LongBall",
        "marking": "ManToMan"
    },
    "Gabes Oasis": {
        "formation": "TacticType.T_4231",
        "style": "Counter",
        "aggression": "Aggressive",
        "tempo": "Normal",
        "width": "Balanced",
        "defensiveLine": "Deep",
        "passingStyle": "Mixed",
        "marking": "Zonal"
    },
    "Trinbago Riders FC": {
        "formation": "TacticType.T_4231",
        "style": "Counter",
        "aggression": "Normal",
        "tempo": "Fast",
        "width": "Wide",
        "defensiveLine": "Deep",
        "passingStyle": "Direct",
        "marking": "Zonal"
    },
    "TS Galaxy": {
        "formation": "TacticType.T_4231",
        "style": "WingPlay",
        "aggression": "Normal",
        "tempo": "Fast",
        "width": "Wide",
        "defensiveLine": "Balanced",
        "passingStyle": "Direct",
        "marking": "Zonal"
    },
    "Tucuman Giants": {
        "formation": "TacticType.T_442",
        "style": "Counter",
        "aggression": "Aggressive",
        "tempo": "Fast",
        "width": "Wide",
        "defensiveLine": "Deep",
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
    "Valencia Bats": {
        "formation": "TacticType.T_442",
        "style": "Counter",
        "aggression": "Aggressive",
        "tempo": "Fast",
        "width": "Narrow",
        "defensiveLine": "Deep",
        "passingStyle": "Direct",
        "marking": "Zonal"
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
    "Trabzon Storm": {
        "formation": "TacticType.T_4231",
        "style": "WingPlay",
        "aggression": "Aggressive",
        "tempo": "Fast",
        "width": "Wide",
        "defensiveLine": "Balanced",
        "passingStyle": "Mixed",
        "marking": "Zonal"
    },
    "Toulouse Violets": {
        "formation": "TacticType.T_343",
        "style": "Counter",
        "aggression": "Normal",
        "tempo": "Fast",
        "width": "Wide",
        "defensiveLine": "Deep",
        "passingStyle": "Direct",
        "marking": "Zonal"
    },
    "North London Whites": {
        "formation": "TacticType.T_4231",
        "style": "HighPress",
        "aggression": "Aggressive",
        "tempo": "Fast",
        "width": "Wide",
        "defensiveLine": "High",
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
    }
}

# Read constants.ts
with open('constants.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Separate into existing and new teams
existing_teams = []
new_teams = []
teams_to_update = ["Toronto Reds", "Udine Friuli", "Tunis Red-Whites"]  # Teams with known updates

for team_name in teams_data.keys():
    if f'"{team_name}":' in content:
        existing_teams.append(team_name)
    else:
        new_teams.append(team_name)

print(f"Already exist: {len(existing_teams)}")
print(f"New teams to add: {len(new_teams)}")
for team in sorted(new_teams):
    print(f"  - {team}")

# First, add new teams
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
    # Find insertion point
    pattern = r'(    "Lyon Kids": \{[^}]+\})'
    match = re.search(pattern, content, re.DOTALL)
    
    if match:
        insertion_text = ",\n" + ",\n".join(new_entries) + ",\n"
        content = content[:match.start()] + insertion_text + content[match.start():]
        print(f"\n✅ Added {len(new_teams)} new teams!")

# Now update existing teams
updates_made = 0
for team_name in teams_to_update:
    if team_name in teams_data:
        data = teams_data[team_name]
        # Find the team entry
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
