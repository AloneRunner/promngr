
import re

file_path = "src/data/teams.ts"

# Emoji map for flags (add more as needed or use a library if available, but manual map is safer for now)
# Used generic flags for some to ensure generic fallback if needed, but trying to be specific.
COUNTRY_FLAGS = {
    'Turkey': '🇹🇷',
    'Nigeria': '🇳🇬',
    'Indonesia': '🇮🇩',
    'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    'Spain': '🇪🇸',
    'Italy': '🇮🇹',
    'Germany': '🇩🇪',
    'France': '🇫🇷',
    'Netherlands': '🇳🇱',
    'Portugal': '🇵🇹',
    'Brazil': '🇧🇷',
    'Argentina': '🇦🇷',
    'USA': '🇺🇸',
    'Saudi Arabia': '🇸🇦',
    'Russia': '🇷🇺',
    'Ukraine': '🇺🇦',
    'Belgium': '🇧🇪',
    'Greece': '🇬🇷',
    'Scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
    'Austria': '🇦🇹',
    'Switzerland': '🇨🇭',
    'Denmark': '🇩🇰',
    'Norway': '🇳🇴',
    'Sweden': '🇸🇪',
    'Poland': '🇵🇱',
    'Croatia': '🇭🇷',
    'Serbia': '🇷🇸',
    'Czech Republic': '🇨🇿',
    'Romania': '🇷🇴',
    'Bulgaria': '🇧🇬',
    'Hungary': '🇭🇺',
    'Slovakia': '🇸🇰',
    'Slovenia': '🇸🇮',
    'Azerbaijan': '🇦🇿',
    'Kazakhstan': '🇰🇿',
    'China': '🇨🇳',
    'Japan': '🇯🇵',
    'South Korea': '🇰🇷',
    'Australia': '🇦🇺',
    'Mexico': '🇲🇽',
    'Colombia': '🇨🇴',
    'Chile': '🇨🇱',
    'Uruguay': '🇺🇾',
    'Paraguay': '🇵🇾',
    'Peru': '🇵🇪',
    'Ecuador': '🇪🇨',
    'Venezuela': '🇻🇪',
    'Bolivia': '🇧🇴',
    'Egypt': '🇪🇬',
    'Morocco': '🇲🇦',
    'Tunisia': '🇹🇳',
    'Algeria': '🇩🇿',
    'South Africa': '🇿🇦',
    'Ghana': '🇬🇭',
    'Cameroon': '🇨🇲',
    'Ivory Coast': '🇨🇮',
    'Senegal': '🇸🇳',
    'Iran': '🇮🇷',
    'Qatar': '🇶🇦',
    'UAE': '🇦🇪',
    'Thailand': '🇹🇭',
    'Vietnam': '🇻🇳',
    'Malaysia': '🇲🇾',
    'Canada': '🇨🇦'
}

def get_flag(country):
    return COUNTRY_FLAGS.get(country, '🏳️')

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. IDENTIFY PARTS
# We have a broken top section.
# We have "Galata Lions" which starts the Teams for TR.
# We have "{ id: 'ng'" which starts the NEXT league.

# Find start of Galata Lions
idx_teams_tr = content.find('{ name: "Galata Lions"')
if idx_teams_tr == -1:
    print("CRITICAL: Galata Lions not found.")
    exit(1)

# Find start of Nigeria (or whatever describes the next league)
# We look for the CLOSING of the teams array "]" followed by "}," and then "{ id: 'ng'"
# But because of the mess, it might be safer to search for "{ id: 'ng'" AFTER Galata Lions.
idx_ng = content.find("id: 'ng',", idx_teams_tr)
if idx_ng == -1:
    # Try finding the start of the object containing ng
    idx_ng = content.find("{", idx_teams_tr + 1000) # heuristic
    # Actually, let's look for the pattern defined in the file view.
    # Line 66: {
    # Line 67: id: 'ng'
    pass

# Let's split using a regex that finds league definitions.
# Pattern: optional whitespace, {, whitespace, id: 'code'
league_split_pattern = re.compile(r",\s*\{\s*id: '(\w+)'")

# We want to reconstruct TR manually, then process the rest.
# Extract TR teams:
# From "Galata Lions" to the end of that array.
# The array ends before the next league starts.
# We can find the next league start index.
match_next = league_split_pattern.search(content, idx_teams_tr)
if match_next:
    idx_next_league = match_next.start()
    tr_teams_block = content[idx_teams_tr:idx_next_league]
    # Check if it has the closing bracket of the teams array ']' and closing of object '}'
    # The regex matches ", { id: ...", so the previous char is likely '}' or whitespace.
    # We need to be careful about closing the TR object.
    
    # Let's assume tr_teams_block contains the teams content.
    # We need to make sure we close the `realTeams` array and the `tr` object.
    # The original file likely had `] \n },`.
    
    # Strip trailing comma/whitespace from tr_teams_block to be safe, we will close manually.
    tr_teams_block = tr_teams_block.strip()
    if tr_teams_block.endswith("},"):
        tr_teams_block = tr_teams_block[:-2]
    if tr_teams_block.endswith("}"):
        tr_teams_block = tr_teams_block[:-1]
    if tr_teams_block.endswith("]"):
        tr_teams_block = tr_teams_block[:-1]
        
    # Valid tr_teams_block should end with last team object
    
    rest_of_content = content[match_next.start():] # Specific encoding? match index is global?
    # search() returns index in the string.
else:
    print("Could not find next league after TR.")
    exit(1)

# HEADER
new_content = """import { LeaguePreset } from '../types';
import { LEAGUE_LOGOS } from '../constants/logoMapping';

export const LEAGUE_PRESETS = [
    {
        id: 'tr', region: 'GROUP_B', name: 'Süper Lig', country: 'Turkey', foreignPlayerChance: 0.5, playerNationality: 'Turkey', matchFormat: 'double-round',
        logo: LEAGUE_LOGOS['tr'],
        flag: '🇹🇷',
        realTeams: [
            """ + tr_teams_block + """
        ]
    }"""

# PROCESS REST
# We need to iterate over all matches of league definitions in `rest_of_content`
# and inject logo/flag.
# This is tricky with simple regex substitution because we need variable inputs (id, country).

# Strategy: Split `rest_of_content` by league boundaries, process each, join back.
# `rest_of_content` starts with ", { id: 'ng', ..."

matches = list(league_split_pattern.finditer(rest_of_content))
# We can reconstruct by slicing.
processed_leagues = []

last_idx = 0
for i, match in enumerate(matches):
    start = match.start()
    # End is the start of next match or end of string
    end = matches[i+1].start() if i+1 < len(matches) else len(rest_of_content)
    
    league_block = rest_of_content[start:end]
    # league_block starts with ", { id: 'ng'"
    
    # Extract ID and Country
    id_match = re.search(r"id: '(\w+)'", league_block)
    country_match = re.search(r"country: '([^']+)'", league_block)
    
    if id_match:
        lid = id_match.group(1)
        # Inject LOGO
        # Remove existing logo line if any (harcoded or not)
        league_block = re.sub(r"\s+logo:.*?,", "", league_block)
        
        # Inject Flag if missing
        league_block = re.sub(r"\s+flag:.*?,", "", league_block)
        
        # Prepare injection string
        injection = f"\n        logo: LEAGUE_LOGOS['{lid}'],"
        if country_match:
            cntry = country_match.group(1)
            flg = get_flag(cntry)
            injection += f"\n        flag: '{flg}',"
            
        # Insert after id/region line (usually first line of object)
        # We look for the first comma after id? or just after `id: '...',`
        # Let's insert before `realTeams: [` to be safe and consistent.
        if "realTeams: [" in league_block:
            league_block = league_block.replace("realTeams: [", f"{injection}\n        realTeams: [")
        else:
            # Fallback
            pass
            
    processed_leagues.append(league_block)

final_content = new_content + "".join(processed_leagues) + "\n];"

# Write
with open(file_path, "w", encoding="utf-8") as f:
    f.write(final_content)

print(f"Repaired teams.ts and injected flags for {len(processed_leagues) + 1} leagues.")
