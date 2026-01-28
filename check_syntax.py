import re

# Read the constants.ts file
with open('constants.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the TEAM_TACTICAL_PROFILES section
start = content.find('export const TEAM_TACTICAL_PROFILES')
end = content.find('export const LEAGUE_PRESETS', start)

if start == -1 or end == -1:
    print("Could not find TEAM_TACTICAL_PROFILES section")
    exit(1)

section = content[start:end]
lines = section.split('\n')

# Track braces
open_braces = 0
close_braces = 0
in_team_def = False
team_name = ""
issues = []

for i, line in enumerate(lines, 1):
    # Count braces
    open_braces += line.count('{')
    close_braces += line.count('}')
    
    # Check for team definitions
    if '"' in line and ':' in line and '{' in line:
        team_name = line.split('"')[1] if len(line.split('"')) > 1 else "unknown"
        in_team_def = True
    
    #Check for missing opening brace
    if re.match(r'\s+(formation|style|aggression|tempo|width|defensiveLine|passingStyle|marking):', line):
        if not in_team_def:
            issues.append(f"Line {i}: Property outside of team definition - {line.strip()}")
    
    # Check for closing brace
    if '},' in line:
        in_team_def = False

print(f"Total opening braces: {open_braces}")
print(f"Total closing braces: {close_braces}")
print(f"Difference: {open_braces - close_braces}")
print()

if issues:
    print("Found issues:")
    for issue in issues[:20]:  # Show first 20 issues
        print(issue)
else:
    print("No structural issues found!")

# Look for the specific problem around "Kingston Bay United"
for i, line in enumerate(lines):
    if "Kingston Bay United" in line:
        print(f"\nContext around Kingston Bay United (line {i+1}):")
        for j in range(max(0, i-5), min(len(lines), i+15)):
            print(f"{j+1}: {lines[j]}")
        break
