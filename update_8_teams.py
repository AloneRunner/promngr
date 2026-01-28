import re

# Teams to update with specific changes
updates = {
    "Incheon United": {
        "formation": "TacticType.T_442",
        "style": "'Counter'",
        "aggression": "'Aggressive'",  # Changed from Normal
        "tempo": "'Fast'",
        "width": "'Balanced'",
        "defensiveLine": "'Deep'",
        "passingStyle": "'Direct'",
        "marking": "'Zonal'"
    },
    "Inter Lombardia": {
        "formation": "TacticType.T_352",
        "style": "'HighPress'",
        "aggression": "'Normal'",  # Changed from Aggressive
        "tempo": "'Normal'",
        "width": "'Balanced'",
        "defensiveLine": "'High'",
        "passingStyle": "'Mixed'",
        "marking": "'Zonal'"
    },
    "Ittihad Alexandria": {
        "formation": "TacticType.T_4231",
        "style": "'Counter'",
        "aggression": "'Aggressive'",  # Changed from Normal
        "tempo": "'Fast'",
        "width": "'Wide'",
        "defensiveLine": "'Deep'",
        "passingStyle": "'Direct'",
        "marking": "'Zonal'"
    },
    "Jeddah Tigers": {
        "formation": "TacticType.T_4231",
        "style": "'HighPress'",
        "aggression": "'Aggressive'",
        "tempo": "'Normal'",
        "width": "'Balanced'",
        "defensiveLine": "'High'",
        "passingStyle": "'Direct'",  # Changed from Mixed
        "marking": "'Zonal'"
    },
    "JEF United Chiba": {
        "formation": "TacticType.T_442",
        "style": "'Balanced'",  # Changed from Counter
        "aggression": "'Normal'",
        "tempo": "'Normal'",
        "width": "'Narrow'",
        "defensiveLine": "'Deep'",
        "passingStyle": "'Mixed'",  # Changed from LongBall
        "marking": "'Zonal'"
    },
    "Kansas City Wizards": {
        "formation": "TacticType.T_433",  # Changed from T_4231
        "style": "'HighPress'",
        "aggression": "'Normal'",
        "tempo": "'Fast'",
        "width": "'Wide'",
        "defensiveLine": "'High'",
        "passingStyle": "'Direct'",
        "marking": "'Zonal'"
    },
    "Heidenheim Red-Blue": {
        "formation": "TacticType.T_4231",
        "style": "'WingPlay'",  # Changed from Balanced
        "aggression": "'Normal'",
        "tempo": "'Normal'",
        "width": "'Wide'",  # Changed from Balanced
        "defensiveLine": "'Balanced'",
        "passingStyle": "'LongBall'",
        "marking": "'Zonal'"
    },
    "Hiroshima Archers": {
        "formation": "TacticType.T_343",  # Changed from T_4231
        "style": "'Balanced'",
        "aggression": "'Normal'",
        "tempo": "'Normal'",
        "width": "'Wide'",  # Changed from Balanced
        "defensiveLine": "'Balanced'",
        "passingStyle": "'Mixed'",
        "marking": "'Zonal'"
    }
}

# Read constants.ts
with open('constants.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Update each team
for team_name, tactics in updates.items():
    # Find and replace the team's tactic block
    pattern = rf'(    "{re.escape(team_name)}": \{{)[^}}]+(\}})'
    
    replacement_content = f'''    "{team_name}": {{
        formation: {tactics["formation"]},
        style: {tactics["style"]},
        aggression: {tactics["aggression"]},
        tempo: {tactics["tempo"]},
        width: {tactics["width"]},
        defensiveLine: {tactics["defensiveLine"]},
        passingStyle: {tactics["passingStyle"]},
        marking: {tactics["marking"]}
    '''
    
    content = re.sub(pattern, r'\1' + '\n' + replacement_content.split('{', 1)[1], content, flags=re.DOTALL)
    print(f"✅ Updated: {team_name}")

# Write back
with open('constants.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print(f"\n🎉 Successfully updated {len(updates)} teams!")
