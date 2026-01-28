import re

# Read the file
with open('constants.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

print("Scanning for stray commas...")
fixed_count = 0

for i in range(len(lines)):
    # Check for lines that are just a comma (with optional whitespace)
    if re.match(r'^\s*,\s*$', lines[i]):
        print(f"Found stray comma at line {i+1}: {lines[i].strip()}")
        lines[i] = ''  # Remove the line entirely
        fixed_count += 1

# Write back
with open('constants.ts', 'w', encoding='utf-8') as f:
    f.writelines(lines)

print(f"\n✅ Fixed {fixed_count} stray commas!")
