
import re

file_path = r'c:\Users\kaano\OneDrive\Desktop\10\src\data\teams.ts'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Expanded and verified mapping based on directory scan
logo_replacements = {
    # Existing / Confirmed
    'tr': '/assets/logos/leagues/tr.jpg',
    'en': '/assets/logos/leagues/en.jpg',
    'es': '/assets/logos/leagues/es.jpg',
    'it': '/assets/logos/leagues/it.jpg',
    'fr': '/assets/logos/leagues/fr.jpg',
    'de': '/assets/logos/leagues/de.jpg',
    
    # User Uploaded / Discovered
    'ng': '/assets/logos/leagues/npfl.jpg',        # NPFL
    'id': '/assets/logos/leagues/liga1.jpg',       # Liga 1
    'ru': '/assets/logos/leagues/russian.jpg',     # Russian Premier
    'dz': '/assets/logos/leagues/ligue1algeria.jpg', # Ligue 1 Algeria
    'pt': '/assets/logos/leagues/primeiraligaportugal.jpg', # Primeira Liga
    'nl': '/assets/logos/leagues/eredivisie.jpg',  # Eredivisie
    'be': '/assets/logos/leagues/belgian.jpg',     # Belgian Pro League
    'my': '/assets/logos/leagues/ligasupermaysia.jpg', # Liga Super Malaysia (typo matched)
    'ke': '/assets/logos/leagues/kenyapremier.jpg', # Kenya Premier
    'sn': '/assets/logos/leagues/senegal.jpg',     # Senegal Premier
    'ci': '/assets/logos/leagues/ivory.jpg',       # Ivory Coast
    'ro': '/assets/logos/leagues/romania.jpg',     # Romania SuperLiga
    'sco': '/assets/logos/leagues/scotland.jpg',   # Scotland Premiership
    'at': '/assets/logos/leagues/austria.jpg',     # Austria Bundesliga
    'ch': '/assets/logos/leagues/switzerland.jpg', # Switzerland Super League
    'gr': '/assets/logos/leagues/greece.jpg',      # Greece Super League
    'hr': '/assets/logos/leagues/supersport.jpg',  # SuperSport HNL
    'rs': '/assets/logos/leagues/superligaserbia.jpg', # SuperLiga Serbia
    'cz': '/assets/logos/leagues/fortuna.jpg',     # Fortuna Liga
    'pl': '/assets/logos/leagues/eksraklasa.jpg',  # Ekstraklasa
    'gh': '/assets/logos/leagues/ghana.jpg',       # Ghana Premier
    'cn': '/assets/logos/leagues/china.jpg',       # Chinese Super League
    'py': '/assets/logos/leagues/paraguay.jpg',    # Paraguay Primera division
    'ec': '/assets/logos/leagues/ecuador.jpg',     # Ecuador Liga Pro

    # Previously existing
    'sa': '/assets/logos/leagues/saudi_logo.jpg',
    'us': '/assets/logos/leagues/usa_logo.jpg',
    'na': '/assets/logos/leagues/usa_logo.jpg',
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
    'car': '/assets/logos/leagues/caribbean_logo.jpg',
    'au': '/assets/logos/leagues/aleague_logo.jpg'
}

# Read file
lines = content.split('\n')
new_lines = []
current_id = None

for line in lines:
    # Track current league ID
    id_match = re.search(r"id:\s*'([a-z]+)'", line)
    if id_match:
        current_id = id_match.group(1)
    
    # Replace logo line if we are inside a league object
    if "logo:" in line and current_id:
        if current_id in logo_replacements:
            # Handle both 'logo: LEAGUE_LOGOS...' and 'logo: '/assets...' to be safe
            new_line = re.sub(r"logo:\s*[^,]+,", f"logo: '{logo_replacements[current_id]}',", line)
            new_lines.append(new_line)
        else:
            new_lines.append(line)
    else:
        new_lines.append(line)

final_content = '\n'.join(new_lines)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(final_content)

print("Updated teams.ts with verified logo files.")
