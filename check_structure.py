import re

with open('constants.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the TEAM_TACTICAL_PROFILES section
start_marker = 'export const TEAM_TACTICAL_PROFILES'
end_marker = 'export const LEAGUE_PRESETS'

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx == -1 or end_idx == -1:
    print("❌ Could not find markers")
    exit(1)

# Extract just the tactical profiles section
tactics_section = content[start_idx:end_idx]

# Count braces
open_braces = tactics_section.count('{')
close_braces = tactics_section.count('}')

print(f"Opening braces: {open_braces}")
print(f"Closing braces: {close_braces}")
print(f"Difference: {open_braces - close_braces}")

# Find team entries that might be malformed
lines = tactics_section.split('\n')
in_team = False
team_name = None
brace_count = 0

for i, line in enumerate(lines):
    # Check for team name (string key)
    match = re.search(r'"([^"]+)"\s*:\s*\{', line)
    if match:
        if in_team and brace_count != 0:
            print(f"⚠️ Line {i}: Previous team '{team_name}' not properly closed (brace_count={brace_count})")
        team_name = match.group(1)
        in_team = True
        brace_count = 1
        continue
    
    if in_team:
        brace_count += line.count('{')
        brace_count -= line.count('}')
        
        if brace_count == 0:
            in_team = False

if in_team:
    print(f"⚠️ Last team '{team_name}' not properly closed")

print("\n✅ Structure check complete!")
