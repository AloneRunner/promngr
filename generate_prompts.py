import re
import os

teams_file_path = r'C:\Users\kaano\OneDrive\Desktop\10\src\data\teams.ts'
output_file_path = r'C:\Users\kaano\OneDrive\Desktop\10\generated_missing_prompts.md'

with open(teams_file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# League regex
league_pattern = re.compile(r"id:\s*['\"](\w+)['\"].*?name:\s*['\"](.*?)['\"].*?country:\s*['\"](.*?)['\"].*?realTeams:\s*\[(.*?)\s*\]", re.DOTALL)
# Team regex
team_pattern = re.compile(r"name:\s*[\"'](.*?)[\"'].*?primaryColor:\s*[\"'](.*?)[\"'].*?secondaryColor:\s*[\"'](.*?)[\"']", re.DOTALL)

flags = {
    'pt': '🇵🇹', 'mx': '🇲🇽', 'na': '🇺🇸', 'ma': '🇲🇦', 'dz': '🇩🇿', 'eg': '🇪🇬',
    'kr': '🇰🇷', 'jp': '🇯🇵', 'sa': '🇸🇦', 'uy': '🇺🇾', 'cl': '🇨🇱', 'co': '🇨🇴',
    'ru': '🇷🇺', 'be': '🇧🇪', 'nl': '🇳🇱', 'ke': '🇰🇪', 'my': '🇲🇾', 'sn': '🇸🇳',
    'au': '🇦🇺'
}

missing_leagues = ['pt', 'mx', 'na', 'ma', 'dz', 'eg', 'kr', 'jp', 'sa', 'uy', 'cl', 'co', 'ru', 'be', 'nl', 'ke', 'my', 'sn', 'au']

output = ""

for league_match in league_pattern.finditer(content):
    lid = league_match.group(1)
    if lid not in missing_leagues:
        continue
    
    name = league_match.group(2)
    country = league_match.group(3)
    teams_text = league_match.group(4)
    flag = flags.get(lid, '🏳️')
    
    print(f"Processing {name} ({lid})")
    output += f"\n---\n\n## {flag} {name} ({country})\n\n| Team Name | Prompt |\n|:---|:---|\n"
    
    for team_match in team_pattern.finditer(teams_text):
        team_name = team_match.group(1)
        primary = team_match.group(2)
        secondary = team_match.group(3)
        
        icon = 'shield'
        lower_name = team_name.lower()
        if 'lion' in lower_name: icon = 'lion head'
        elif 'tiger' in lower_name: icon = 'tiger head'
        elif 'eagle' in lower_name: icon = 'eagle'
        elif 'dragon' in lower_name: icon = 'dragon'
        elif 'warrior' in lower_name: icon = 'warrior'
        elif 'wolf' in lower_name: icon = 'wolf head'
        elif 'pirate' in lower_name: icon = 'pirate skull'
        elif 'star' in lower_name: icon = 'star'
        elif 'sun' in lower_name: icon = 'sun'
        elif 'bull' in lower_name: icon = 'bull head'
        elif 'ship' in lower_name or 'sailor' in lower_name: icon = 'sailing ship'
        elif 'anchor' in lower_name: icon = 'anchor'
        elif 'train' in lower_name or 'railway' in lower_name: icon = 'locomotive'
        elif 'knight' in lower_name: icon = 'knight helmet'
        elif 'devil' in lower_name: icon = 'devil head'
        elif 'tower' in lower_name: icon = 'tower silhouette'
        elif 'mountain' in lower_name: icon = 'mountain peak'
        elif 'wave' in lower_name: icon = 'ocean wave'
        elif 'shark' in lower_name: icon = 'shark head'
        elif 'cat' in lower_name: icon = 'cat head'
        elif 'dog' in lower_name: icon = 'dog head'
        elif 'bird' in lower_name: icon = 'bird silhouette'
        elif 'rooster' in lower_name: icon = 'rooster'
        elif 'canary' in lower_name: icon = 'canary bird'
        elif 'puma' in lower_name: icon = 'puma head'
        elif 'leopard' in lower_name: icon = 'leopard head'
        elif 'horse' in lower_name: icon = 'horse head'
        elif 'camel' in lower_name: icon = 'camel'
        elif 'elephant' in lower_name: icon = 'elephant'
        elif 'fox' in lower_name: icon = 'fox head'
        elif 'castle' in lower_name: icon = 'castle fortress'
        elif 'crown' in lower_name: icon = 'crown'
        elif 'steel' in lower_name: icon = 'steel beam or anvil'
        elif 'miner' in lower_name: icon = 'pickaxes or miner lamp'
        
        output += f"| **{team_name}** | A modern esports logo for a football club named '{team_name}'. Main icon: A stylized {icon}. Colors: {primary} and {secondary}. Style: Modern, sleek vector, premium feel, white background. |\n"

with open(output_file_path, 'w', encoding='utf-8') as f:
    f.write(output)

print(f"Done! Saved to {output_file_path}")
