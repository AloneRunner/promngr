import re

# Read the file
with open('constants.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix formatting issues
# 1. Remove extra blank line after team name opening brace
content = re.sub(r'(    "\w[^"]*": \{)\r?\n\r?\n(\s+formation:)', r'\1\n\2', content)

# 2. Fix closing braces that are on separate lines
content = re.sub(r"(marking: '[^']+\')\r?\n\s+,", r'\1\n    },', content)

# Write back
with open('constants.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Fixed formatting issues in constants.ts")
