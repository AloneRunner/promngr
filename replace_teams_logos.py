
import re

file_path = r'c:\Users\kaano\OneDrive\Desktop\10\src\data\teams.ts'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Define the mapping of IDs to paths directly
logo_replacements = {
    'tr': '/assets/logos/leagues/tr.jpg',
    'ng': '/assets/logos/leagues/ng.png',
    'id': '/assets/logos/leagues/ucl.jpg', # Using placeholder as per file structure
    'en': '/assets/logos/leagues/en.jpg',
    'es': '/assets/logos/leagues/es.jpg',
    'it': '/assets/logos/leagues/it.jpg',
    'fr': '/assets/logos/leagues/fr.jpg',
    'de': '/assets/logos/leagues/de.jpg',
    'sa': '/assets/logos/leagues/saudi_logo.jpg',
    'us': '/assets/logos/leagues/usa_logo.jpg',
    'na': '/assets/logos/leagues/usa_logo.jpg', # North America ? Using USA
    'ar': '/assets/logos/leagues/liga-profesional.jpg',
    'cl': '/assets/logos/leagues/chile_logo.jpg',
    'co': '/assets/logos/leagues/colombia_logo.jpg',
    'uy': '/assets/logos/leagues/uruguay_logo.jpg',
    'cr': '/assets/logos/leagues/costarica_logo.jpg',
    'mx': '/assets/logos/leagues/mexico_logo.jpg',
    'jp': '/assets/logos/leagues/japan_logo.jpg',
    'kr': '/assets/logos/leagues/korea_logo.jpg',
    'in': '/assets/logos/leagues/india_logo.jpg',
    'ma': '/assets/logos/leagues/botola_logo.jpg',
    'eg': '/assets/logos/leagues/egypt_logo.jpg',
    'tn': '/assets/logos/leagues/tunisia_logo.jpg',
    'za': '/assets/logos/leagues/psl_logo.jpg',
    'car': '/assets/logos/leagues/caribbean_logo.jpg'
}

# Generic replacement function
def replace_logo(match):
    league_id = match.group(1)
    if league_id in logo_replacements:
        return f"logo: '{logo_replacements[league_id]}',"
    else:
        # Default placeholder for unknown
        return f"logo: '/assets/logos/leagues/ucl.jpg', // Placeholder for {league_id}"

# Look for patterns like:
# id: 'tr', ...
# logo: LEAGUE_LOGOS['tr'],

# We will iterate line by line to be safer, keeping track of current ID
new_lines = []
current_id = None

for line in content.split('\n'):
    # Check for ID definition
    id_match = re.search(r"id:\s*'([a-z]+)'", line)
    if id_match:
        current_id = id_match.group(1)
    
    # Check for logo definition
    if "logo: LEAGUE_LOGOS" in line and current_id:
        if current_id in logo_replacements:
            new_line = re.sub(r"logo: LEAGUE_LOGOS\['[^']+'\],?", f"logo: '{logo_replacements[current_id]}',", line)
            new_lines.append(new_line)
        else:
             # Fallback
            new_line = re.sub(r"logo: LEAGUE_LOGOS\['[^']+'\],?", f"logo: '/assets/logos/leagues/ucl.jpg',", line)
            new_lines.append(new_line)
    else:
        new_lines.append(line)

final_content = '\n'.join(new_lines)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(final_content)

print(f"Replaced logos in teams.ts")
