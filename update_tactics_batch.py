import re

# Updates to apply (team_name: new_tactics)
updates = {
    "Alanya Sun": {
        "formation": "TacticType.T_4231",
        "style": "'Counter'",
        "aggression": "'Normal'",
        "tempo": "'Normal'",
        "width": "'Balanced'",
        "defensiveLine": "'Deep'",
        "passingStyle": "'Direct'",
        "marking": "'Zonal'"
    },
    "Basak City": {
        "formation": "TacticType.T_442",
        "style": "'WingPlay'",
        "aggression": "'Normal'",
        "tempo": "'Normal'",
        "width": "'Wide'",
        "defensiveLine": "'Balanced'",
        "passingStyle": "'Mixed'",
        "marking": "'Zonal'"
    },
    "Dallas Burn": {
        "formation": "TacticType.T_4231",
        "style": "'Balanced'",
        "aggression": "'Normal'",
        "tempo": "'Fast'",
        "width": "'Wide'",
        "defensiveLine": "'High'",
        "passingStyle": "'Direct'",
        "marking": "'Zonal'"
    },
    "Dar Citizens": {
        "formation": "TacticType.T_4231",
        "style": "'HighPress'",
        "aggression": "'Normal'",
        "tempo": "'Fast'",
        "width": "'Balanced'",
        "defensiveLine": "'High'",
        "passingStyle": "'Mixed'",
        "marking": "'Zonal'"
    },
    "Belo Horizonte Cruisers": {
        "formation": "TacticType.T_4231",
        "style": "'Balanced'",
        "aggression": "'Normal'",
        "tempo": "'Slow'",
        "width": "'Narrow'",
        "defensiveLine": "'Balanced'",
        "passingStyle": "'Mixed'",
        "marking": "'Zonal'"
    },
    "Belo Horizonte Miners": {
        "formation": "TacticType.T_4231",
        "style": "'WingPlay'",
        "aggression": "'Aggressive'",
        "tempo": "'Normal'",
        "width": "'Wide'",
        "defensiveLine": "'Balanced'",
        "passingStyle": "'Mixed'",
        "marking": "'Zonal'"
    },
    "Belvedere Blue": {
        "formation": "TacticType.T_433",
        "style": "'Counter'",
        "aggression": "'Normal'",
        "tempo": "'Fast'",
        "width": "'Balanced'",
        "defensiveLine": "'Balanced'",
        "passingStyle": "'Direct'",
        "marking": "'Zonal'"
    },
    "Bochum Blue": {
        "formation": "TacticType.T_4231",
        "style": "'Counter'",
        "aggression": "'Aggressive'",
        "tempo": "'Normal'",
        "width": "'Balanced'",
        "defensiveLine": "'Deep'",
        "passingStyle": "'LongBall'",
        "marking": "'Zonal'"
    },
    "Boedo Saints": {
        "formation": "TacticType.T_4231",
        "style": "'ParkTheBus'",
        "aggression": "'Aggressive'",
        "tempo": "'Slow'",
        "width": "'Narrow'",
        "defensiveLine": "'Deep'",
        "passingStyle": "'LongBall'",
        "marking": "'ManToMan'"
    },
    "Bogotá Cardinals": {
        "formation": "TacticType.T_433",
        "style": "'Balanced'",
        "aggression": "'Aggressive'",
        "tempo": "'Normal'",
        "width": "'Balanced'",
        "defensiveLine": "'Balanced'",
        "passingStyle": "'Mixed'",
        "marking": "'Zonal'"
    },
    "Bogotá Fort": {
        "formation": "TacticType.T_532",
        "style": "'ParkTheBus'",
        "aggression": "'Normal'",
        "tempo": "'Slow'",
        "width": "'Narrow'",
        "defensiveLine": "'Deep'",
        "passingStyle": "'Mixed'",
        "marking": "'Zonal'"
    },
    "Cagliari Islanders": {
        "formation": "TacticType.T_442",
        "style": "'Counter'",
        "aggression": "'Aggressive'",
        "tempo": "'Fast'",
        "width": "'Wide'",
        "defensiveLine": "'Deep'",
        "passingStyle": "'Direct'",
        "marking": "'Zonal'"
    },
    "Cairo Red Devils": {
        "formation": "TacticType.T_433",
        "style": "'HighPress'",
        "aggression": "'Normal'",
        "tempo": "'Fast'",
        "width": "'Wide'",
        "defensiveLine": "'High'",
        "passingStyle": "'Mixed'",
        "marking": "'Zonal'"
    },
    "Calera Red": {
        "formation": "TacticType.T_532",
        "style": "'ParkTheBus'",
        "aggression": "'Normal'",
        "tempo": "'Slow'",
        "width": "'Narrow'",
        "defensiveLine": "'Deep'",
        "passingStyle": "'LongBall'",
        "marking": "'Zonal'"
    },
    "Cali Sugar": {
        "formation": "TacticType.T_4141",
        "style": "'Balanced'",
        "aggression": "'Aggressive'",
        "tempo": "'Normal'",
        "width": "'Balanced'",
        "defensiveLine": "'Balanced'",
        "passingStyle": "'Mixed'",
        "marking": "'Zonal'"
    },
    "Cape Town City": {
        "formation": "TacticType.T_433",
        "style": "'Balanced'",
        "aggression": "'Normal'",
        "tempo": "'Fast'",
        "width": "'Balanced'",
        "defensiveLine": "'Balanced'",
        "passingStyle": "'Mixed'",
        "marking": "'Zonal'"
    },
    "Cavalier Town FC": {
        "formation": "TacticType.T_433",
        "style": "'Counter'",
        "aggression": "'Normal'",
        "tempo": "'Fast'",
        "width": "'Wide'",
        "defensiveLine": "'Balanced'",
        "passingStyle": "'Direct'",
        "marking": "'Zonal'"
    },
    "Alajuela Lions": {
        "formation": "TacticType.T_433",
        "style": "'WingPlay'",
        "aggression": "'Normal'",
        "tempo": "'Normal'",
        "width": "'Wide'",
        "defensiveLine": "'Balanced'",
        "passingStyle": "'Mixed'",
        "marking": "'Zonal'"
    },
    "San Isidro Warriors": {
        "formation": "TacticType.T_4231",
        "style": "'Balanced'",
        "aggression": "'Normal'",
        "tempo": "'Normal'",
        "width": "'Balanced'",
        "defensiveLine": "'Balanced'",
        "passingStyle": "'Mixed'",
        "marking": "'Zonal'"
    },
    "Puntarenas Sharks": {
        "formation": "TacticType.T_442",
        "style": "'Counter'",
        "aggression": "'Normal'",
        "tempo": "'Normal'",
        "width": "'Wide'",
        "defensiveLine": "'Deep'",
        "passingStyle": "'Direct'",
        "marking": "'Zonal'"
    },
    "Guadalupe Blue": {
        "formation": "TacticType.T_4231",
        "style": "'ParkTheBus'",
        "aggression": "'Normal'",
        "tempo": "'Slow'",
        "width": "'Narrow'",
        "defensiveLine": "'Deep'",
        "passingStyle": "'Mixed'",
        "marking": "'Zonal'"
    },
    "Citadel Saints": {
        "formation": "TacticType.T_442",
        "style": "'Balanced'",
        "aggression": "'Normal'",
        "tempo": "'Normal'",
        "width": "'Narrow'",
        "defensiveLine": "'Balanced'",
        "passingStyle": "'LongBall'",
        "marking": "'Zonal'"
    },
    "Concepción Purple": {
        "formation": "TacticType.T_442",
        "style": "'Counter'",
        "aggression": "'Normal'",
        "tempo": "'Normal'",
        "width": "'Balanced'",
        "defensiveLine": "'Deep'",
        "passingStyle": "'LongBall'",
        "marking": "'Zonal'"
    },
    "Concepción Uni": {
        "formation": "TacticType.T_4231",
        "style": "'Counter'",
        "aggression": "'Normal'",
        "tempo": "'Fast'",
        "width": "'Balanced'",
        "defensiveLine": "'Deep'",
        "passingStyle": "'Direct'",
        "marking": "'Zonal'"
    },
    "Coquimbo Pirates": {
        "formation": "TacticType.T_442",
        "style": "'ParkTheBus'",
        "aggression": "'Normal'",
        "tempo": "'Normal'",
        "width": "'Balanced'",
        "defensiveLine": "'Deep'",
        "passingStyle": "'LongBall'",
        "marking": "'ManToMan'"
    },
    "Cordoba Pirates": {
        "formation": "TacticType.T_442",
        "style": "'Counter'",
        "aggression": "'Aggressive'",
        "tempo": "'Normal'",
        "width": "'Balanced'",
        "defensiveLine": "'Deep'",
        "passingStyle": "'LongBall'",
        "marking": "'ManToMan'"
    },
    "Cordoba Tall": {
        "formation": "TacticType.T_4231",
        "style": "'HighPress'",
        "aggression": "'Aggressive'",
        "tempo": "'Fast'",
        "width": "'Wide'",
        "defensiveLine": "'High'",
        "passingStyle": "'Direct'",
        "marking": "'Zonal'"
    },
    "Crystal Glaziers": {
        "formation": "TacticType.T_343",
        "style": "'Counter'",
        "aggression": "'Aggressive'",
        "tempo": "'Fast'",
        "width": "'Wide'",
        "defensiveLine": "'Balanced'",
        "passingStyle": "'Direct'",
        "marking": "'Zonal'"
    },
    "Heredia Red-Yellow": {
        "formation": "TacticType.T_4141",
        "style": "'Balanced'",
        "aggression": "'Aggressive'",
        "tempo": "'Normal'",
        "width": "'Balanced'",
        "defensiveLine": "'Balanced'",
        "passingStyle": "'Mixed'",
        "marking": "'Zonal'"
    },
    "Antep Falcons": {
        "formation": "TacticType.T_4231",
        "style": "'Balanced'",
        "aggression": "'Normal'",
        "tempo": "'Normal'",
        "width": "'Balanced'",
        "defensiveLine": "'Deep'",
        "passingStyle": "'Mixed'",
        "marking": "'Zonal'"
    },
    "Ankara Youth": {
        "formation": "TacticType.T_442",
        "style": "'Counter'",
        "aggression": "'Aggressive'",
        "tempo": "'Fast'",
        "width": "'Wide'",
        "defensiveLine": "'Balanced'",
        "passingStyle": "'Direct'",
        "marking": "'Zonal'"
    },
    "Curitiba Greens": {
        "formation": "TacticType.T_442",
        "style": "'Balanced'",
        "aggression": "'Normal'",
        "tempo": "'Normal'",
        "width": "'Balanced'",
        "defensiveLine": "'Balanced'",
        "passingStyle": "'Mixed'",
        "marking": "'Zonal'"
    },
    "Cibao Orange FC": {
        "formation": "TacticType.T_433",
        "style": "'WingPlay'",
        "aggression": "'Normal'",
        "tempo": "'Normal'",
        "width": "'Wide'",
        "defensiveLine": "'Balanced'",
        "passingStyle": "'Mixed'",
        "marking": "'Zonal'"
    },
    "Belém Lions": {
        "formation": "TacticType.T_442",
        "style": "'Balanced'",
        "aggression": "'Normal'",
        "tempo": "'Normal'",
        "width": "'Balanced'",
        "defensiveLine": "'Deep'",
        "passingStyle": "'Mixed'",
        "marking": "'Zonal'"
    },
    "Al-Fayha": {
        "formation": "TacticType.T_4231",
        "style": "'Counter'",
        "aggression": "'Aggressive'",
        "tempo": "'Fast'",
        "width": "'Wide'",
        "defensiveLine": "'Deep'",
        "passingStyle": "'LongBall'",
        "marking": "'ManToMan'"
    },
    "Galata Lions": {
        "formation": "TacticType.T_433",
        "style": "'HighPress'",
        "aggression": "'Aggressive'",
        "tempo": "'Fast'",
        "width": "'Wide'",
        "defensiveLine": "'High'",
        "passingStyle": "'Mixed'",
        "marking": "'Zonal'"
    }
}


# Read file
with open('constants.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Update each team
for team_name, tactics in updates.items():
    # Find the team block
    pattern = rf'("{re.escape(team_name)}":\s*\{{[^}}]*\}})'
    
    match = re.search(pattern, content, re.DOTALL)
    if match:
        old_block = match.group(1)
        
        # Build new block
        new_block = f'"{team_name}": {{\n'
        new_block += f'        formation: {tactics["formation"]},\n'
        new_block += f'        style: {tactics["style"]},\n'
        new_block += f'        aggression: {tactics["aggression"]},\n'
        new_block += f'        tempo: {tactics["tempo"]},\n'
        new_block += f'        width: {tactics["width"]},\n'
        new_block += f'        defensiveLine: {tactics["defensiveLine"]},\n'
        new_block += f'        passingStyle: {tactics["passingStyle"]},\n'
        new_block += f'        marking: {tactics["marking"]}\n'
        new_block += '    }'
        
        content = content.replace(old_block, new_block)
        print(f"✅ Updated: {team_name}")
    else:
        print(f"❌ NOT FOUND: {team_name}")

# Write back
with open('constants.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("\n✅ All updates completed!")
