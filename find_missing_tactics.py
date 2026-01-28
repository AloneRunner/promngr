import re

# Read constants.ts
with open('constants.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Extract all team names from LEAGUE_PRESETS
league_presets_match = re.search(r'export const LEAGUE_PRESETS = \[(.*?)\];', content, re.DOTALL)
if league_presets_match:
    league_data = league_presets_match.group(1)
    # Find all team names
    team_names_in_leagues = re.findall(r'name: "([^"]+)"', league_data)
    team_names_in_leagues = list(set(team_names_in_leagues))  # Remove duplicates
    team_names_in_leagues.sort()

# Extract all team names from TEAM_TACTICAL_PROFILES
tactical_profiles_match = re.search(r'export const TEAM_TACTICAL_PROFILES.*?= \{(.*?)\};', content, re.DOTALL)
if tactical_profiles_match:
    tactical_data = tactical_profiles_match.group(1)
    team_names_in_tactics = re.findall(r'"([^"]+)": \{', tactical_data)
    team_names_in_tactics = list(set(team_names_in_tactics))  # Remove duplicates
    team_names_in_tactics.sort()

# Find teams that are in leagues but not in tactical profiles
missing_tactics = []
for team in team_names_in_leagues:
    if team not in team_names_in_tactics:
        missing_tactics.append(team)

missing_tactics.sort()

print(f"Total teams in leagues: {len(team_names_in_leagues)}")
print(f"Total teams with tactics: {len(team_names_in_tactics)}")
print(f"Missing tactical profiles: {len(missing_tactics)}\n")

if missing_tactics:
    print("=== TEAMS MISSING TACTICAL PROFILES ===\n")
    for i, team in enumerate(missing_tactics, 1):
        print(f"{i}. {team}")
else:
    print("✅ All teams have tactical profiles!")

# Also check for teams in tactics but not in leagues (shouldn't happen but good to check)
extra_tactics = []
for team in team_names_in_tactics:
    if team not in team_names_in_leagues:
        extra_tactics.append(team)

if extra_tactics:
    print(f"\n⚠️ Found {len(extra_tactics)} teams with tactics but not in leagues:")
    for team in sorted(extra_tactics):
        print(f"  - {team}")
