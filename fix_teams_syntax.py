import re
import os

file_path = r'c:\Users\kaano\OneDrive\Desktop\10\src\data\teams.ts'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix double closing brackets for arrays
# The pattern we saw was:
# ...
#             { name: ... }
#         ]
#     
#         ]
#     },
#
# We want to remove one of the ']'
# Look for: "]\s+]" and replace with "]"
# But be careful not to break legitimate [[...]] which is rare here.
# The indentation suggests the second one is the extra one or the first one.
# Let's replace "]\s+]\s*}," with "]\n    },"

# Using a robust regex
# Match ']' followed by whitespace, then ']', then whitespace, then '},'
# Replace effectively removing one ']'

new_content = re.sub(r'\]\s*\]\s*\},', ']\n    },', content)

# Check if any changes made
if content == new_content:
    print("No double brackets found matching the pattern.")
else:
    print("Fixed double brackets.")

# Also check for any keys for LEAGUE_LOGOS to print them out
keys = re.findall(r"LEAGUE_LOGOS\['([^']+)'\]", new_content)
unique_keys = sorted(list(set(keys)))
print(f"Found logo keys: {unique_keys}")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

# Update logoMapping.ts with found keys
logo_mapping_path = r'c:\Users\kaano\OneDrive\Desktop\10\src\constants\logoMapping.ts'
mapping_content = "export const LEAGUE_LOGOS: Record<string, string> = {\n"
for key in unique_keys:
    mapping_content += f"    '{key}': '',\n"
mapping_content += "};\n"

with open(logo_mapping_path, 'w', encoding='utf-8') as f:
    f.write(mapping_content)
    print("Updated logoMapping.ts with keys.")
