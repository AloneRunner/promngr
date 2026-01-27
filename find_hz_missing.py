import os
import re

# Get all team files from data folder
data_dir = "data"
team_files = [f for f in os.listdir(data_dir) if f.endswith('.ts') and not f.startswith('costa_rica') and not f.startswith('india') and not f.startswith('tunisia')]

# Extract team names from filenames (H-Z range)
h_z_teams = []
for filename in team_files:
    # Remove .ts extension
    name = filename[:-3]
    # Convert snake_case to Title Case
    title = ' '.join(word.capitalize() for word in name.split('_'))
    
    # Only H-Z range
    if title[0].upper() >= 'H':
        h_z_teams.append(title)

h_z_teams.sort()

# Check which ones are in constants.ts
with open('constants.ts', 'r', encoding='utf-8') as f:
    constants_content = f.read()

missing_teams = []
existing_teams = []

for team in h_z_teams:
    # Try to find the team name in constants
    pattern = f'"{re.escape(team)}"\\s*:'
    if re.search(pattern, constants_content):
        existing_teams.append(team)
    else:
        missing_teams.append(team)

print(f"Total H-Z teams in data folder: {len(h_z_teams)}")
print(f"\n✅ Already in constants.ts: {len(existing_teams)}")
print(f"❌ Missing from constants.ts: {len(missing_teams)}\n")

if missing_teams:
    print("🔴 MISSING TEAMS (H-Z):")
    for i, team in enumerate(missing_teams, 1):
        print(f"  {i}. {team}")
