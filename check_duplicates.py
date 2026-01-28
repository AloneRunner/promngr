import re
from collections import Counter

with open('constants.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Find all team names in TEAM_TACTICAL_PROFILES
pattern = r'^\s*"([^"]+)"\s*:\s*\{'
matches = re.findall(pattern, content, re.MULTILINE)

# Count occurrences
counter = Counter(matches)

# Find duplicates
duplicates = {name: count for name, count in counter.items() if count > 1}

if duplicates:
    print("Duplicate team names found:")
    for name, count in duplicates.items():
        print(f"  {name}: {count} times")
else:
    print("No duplicates found!")
