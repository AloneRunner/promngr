import re

# User's new teams
new_teams = [
    "Kolkata Mariners",
    "Mumbai Islanders", 
    "East Bengal Torch",
    "Kerala Tuskers",
    "Goa Gaurs",
    "Bangalore Blues",
    "Odisha Juggernauts",
    "Chennai Titans",
    "Highland United",
    "Steel City Red",
    "Punjab Lions",
    "Kolkata Black-White",
    "Delhi Capital",
    "Varanasi Holy",
    "Harras El Hodoud",
    "Hassania Agadir",
    "Heidenheim Red-Blue",
    "Hiroshima Archers",
    "Hoffenheim FC",
    "Houston Space"
]

# Check which are in constants.ts
with open('constants.ts', 'r', encoding='utf-8') as f:
    content = f.read()

missing = []
existing = []

for team in new_teams:
    pattern = f'"{re.escape(team)}"\\s*:'
    if re.search(pattern, content):
        existing.append(team)
    else:
        missing.append(team)

print(f"✅ Already in file: {len(existing)}")
print(f"❌ Missing: {len(missing)}\n")

if missing:
    print("Teams to add:")
    for team in sorted(missing):
        print(f"  - {team}")
