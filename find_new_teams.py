# Teams that need to be ADDED (new ones user mentioned)
new_teams = {
    "Alajuelense": {
        "formation": "TacticType.T_433",
        "style": "'Balanced'",
        "aggression": "'Normal'",
        "tempo": "'Normal'",
        "width": "'Balanced'",
        "defensiveLine": "'Balanced'",
        "passingStyle": "'Mixed'",
        "marking": "'Zonal'"
    },
    "Algiers Reds": {
        "formation": "TacticType.T_4141",
        "style": "'ParkTheBus'",
        "aggression": "'Aggressive'",
        "tempo": "'Normal'",
        "width": "'Narrow'",
        "defensiveLine": "'Deep'",
        "passingStyle": "'LongBall'",
        "marking": "'ManToMan'"
    },
    "AmaZulu FC": {
        "formation": "TacticType.T_442",
        "style": "'Balanced'",
        "aggression": "'Aggressive'",
        "tempo": "'Normal'",
        "width": "'Balanced'",
        "defensiveLine": "'Balanced'",
        "passingStyle": "'Direct'",
        "marking": "'Zonal'"
    },
    "Augsburg Falcons": {
        "formation": "TacticType.T_442",
        "style": "'Counter'",
        "aggression": "'Aggressive'",
        "tempo": "'Fast'",
        "width": "'Balanced'",
        "defensiveLine": "'Deep'",
        "passingStyle": "'Direct'",
        "marking": "'Zonal'"
    },
    "AJ Burgundy": {
        "formation": "TacticType.T_4231",
        "style": "'Counter'",
        "aggression": "'Normal'",
        "tempo": "'Normal'",
        "width": "'Balanced'",
        "defensiveLine": "'Balanced'",
        "passingStyle": "'Direct'",
        "marking": "'Zonal'"
    },
    "Bilbao Lions": {
        "formation": "TacticType.T_433",
        "style": "'HighPress'",
        "aggression": "'Aggressive'",
        "tempo": "'Fast'",
        "width": "'Wide'",
        "defensiveLine": "'High'",
        "passingStyle": "'Direct'",
        "marking": "'Zonal'"
    },
    "Leverkusen Red": {
        "formation": "TacticType.T_343",
        "style": "'Balanced'",
        "aggression": "'Normal'",
        "tempo": "'Normal'",
        "width": "'Wide'",
        "defensiveLine": "'High'",
        "passingStyle": "'Mixed'",
        "marking": "'Zonal'"
    },
    "Munich Red": {
        "formation": "TacticType.T_4231",
        "style": "'HighPress'",
        "aggression": "'Normal'",
        "tempo": "'Fast'",
        "width": "'Wide'",
        "defensiveLine": "'High'",
        "passingStyle": "'Mixed'",
        "marking": "'Zonal'"
    }
}

# Check which ones are missing
import re

with open('constants.ts', 'r', encoding='utf-8') as f:
    content = f.read()

print("New teams to add:")
for team in new_teams.keys():
    pattern = f'"{re.escape(team)}"\\s*:'
    if not re.search(pattern, content):
        print(f"  ❌ MISSING: {team}")
    else:
        print(f"  ✅ EXISTS: {team}")
