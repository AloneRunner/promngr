import os
import re
import json

DATA_DIR = os.path.join(os.getcwd(), 'data')

SQUAD_TO_FILE = {
    'INTER_LOMBARDIA_SQUAD': 'inter.ts',
    'MILANO_DEVILS_SQUAD': 'milan.ts',
    'PIEMONTE_ZEBRAS_SQUAD': 'juventus.ts',
    'NAPOLI_BLUES_SQUAD': 'napoli.ts',
    'ROMA_GLADIATORS_SQUAD': 'roma.ts',
    'BERGAMO_UNITED_SQUAD': 'atalanta.ts',
    'LATIUM_EAGLES_SQUAD': 'lazio.ts',
    'FLORENCE_VIOLA_SQUAD': 'fiorentina.ts',
    'BOLOGNA_REDBLUES_SQUAD': 'bologna.ts',
    'TORINO_BULLS_SQUAD': 'torino.ts',
    'COMO_LAKERS_SQUAD': 'como.ts',
    'GENOA_GRIFFINS_SQUAD': 'genoa.ts',
    'UDINE_FRIULI_SQUAD': 'udinese.ts',
    'PARMA_CRUSADERS_SQUAD': 'parma.ts',
    'SASSUOLO_GREENBLACKS_SQUAD': 'sassuolo.ts',
    'LECCE_WOLVES_SQUAD': 'lecce.ts',
    'CAGLIARI_ISLANDERS_SQUAD': 'cagliari.ts',
    'VERONA_MASTIFFS_SQUAD': 'verona.ts',
    'MERSEYSIDE_REDS_SQUAD': 'liverpool.ts',
    'MANCHESTER_SKYBLUES_SQUAD': 'mancity.ts',
    'LONDON_CANNONS_SQUAD': 'arsenal.ts',
    'LONDON_BLUE_LIONS_SQUAD': 'chelsea.ts',
    'MANCHESTER_DEVILS_SQUAD': 'manunited.ts',
    'NORTH_LONDON_WHITES_SQUAD': 'tottenham.ts',
    'BIRMINGHAM_VILLANS_SQUAD': 'astonvilla.ts',
    'TYNESIDE_MAGPIES_SQUAD': 'newcastle.ts',
    'EAST_LONDON_HAMMERS_SQUAD': 'westham.ts',
    'BRIGHTON_SEAGULLS_SQUAD': 'brighton.ts'
}

def parse_js_array(content):
    """
    Parses JS array literal from file content to a list of dicts.
    This is a heuristic parser tailored for this specific data format.
    It expects 'export const NAME = [...]' format.
    """
    matches = {}
    pattern = r'export\s+const\s+(\w+)\s*=\s*(\[\s*\{[\s\S]*?\}\s*\]);'
    
    for match in re.finditer(pattern, content):
        squad_name = match.group(1)
        array_str = match.group(2)
        
        # 0. Strip comments
        array_str = re.sub(r'//.*', '', array_str)
        
        # Convert JS object literal to JSON
        # 1. Quote keys (e.g. ad: -> "ad":)
        json_str = re.sub(r'(\w+):', r'"\1":', array_str)
        # 2. Fix trailing commas
        json_str = re.sub(r',\s*\}', '}', json_str)
        json_str = re.sub(r',\s*\]', ']', json_str)
        # 3. Handling numeric values that might be unquoted? They are fine.
        # 4. Strings are already double quoted in provided text.
        
        try:
            data = json.loads(json_str)
            matches[squad_name] = data
        except json.JSONDecodeError as e:
            print(f"Failed to parse JSON for {squad_name}: {e}")
            # Fallback or manual extraction could go here
            continue
            
    return matches

def merge_squads(existing_data, new_data):
    """
    Merges new_data into existing_data.
    - Matches by 'ad' (name).
    - Preserves ALL keys from existing_data (like forma_no).
    - Updates keys present in new_data.
    - Adds new players.
    """
    merged_list = []
    existing_map = {p['ad']: p for p in existing_data}
    
    for new_player in new_data:
        name = new_player['ad']
        if name in existing_map:
            # Merge
            existing_player = existing_map[name]
            # Update values from new_player, keeping existing ones if not in new
            # We want to overwrite stats with new data, but keep forma_no
            merged_player = existing_player.copy()
            merged_player.update(new_player) 
            # Note: update overwrites existing keys. 
            # If new_player doesn't have forma_no, it won't be in new_player, so update() won't touch it in merged_player?
            # Wait, dictionary.update() adds/overwrites. 
            # If 'forma_no' is in existing_player but NOT in new_player, it stays! 
            # This is exactly what we want.
            merged_list.append(merged_player)
            del existing_map[name] # Remove so we know what's left
        else:
            # New player
            merged_list.append(new_player)
    
    # Optional: Keep players that were in existing but NOT in new?
    # The user instruction "eksikleri ona göre tamamalrsın" implies ADDING.
    # But "eski oyubncuları neden siliyortsun" implies KEEPING.
    # So yes, we should keep remaining existing players.
    # However, sometimes squad updates mean removing old players. 
    # But safer to KEEP for now unless user clears them.
    for remaining_player in existing_map.values():
        merged_list.append(remaining_player)
        
    return merged_list

def write_ts_file(filepath, squad_name, data):
    # Convert back to TS-like syntax (keys without quotes usually preferred, but quoted is valid JS)
    # The existing format uses unquoted keys. Let's try to mimic that for cleanliness?
    # Actually, valid JSON is valid JS. The user might prefer unquoted keys but I'll stick to JSON for reliability.
    # Or I can regex replace quotes on keys.
    
    json_output = json.dumps(data, indent=4, ensure_ascii=False)
    # Unquote keys: "key": -> key:
    ts_output = re.sub(r'"(\w+)":', r'\1:', json_output)
    
    file_content = f"\nexport const {squad_name} = {ts_output};\n"
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(file_content)

def process_patch_files():
    patch_files = [f for f in os.listdir(DATA_DIR) if f.startswith('patch_') and f.endswith('.js')]
    
    for patch_file in patch_files:
        print(f"Processing {patch_file}...")
        with open(os.path.join(DATA_DIR, patch_file), 'r', encoding='utf-8') as f:
            content = f.read()
            
        new_squads = parse_js_array(content)
        
        for squad_name, new_list in new_squads.items():
            if squad_name not in SQUAD_TO_FILE:
                print(f"Skipping unknown squad {squad_name}")
                continue
                
            target_filename = SQUAD_TO_FILE[squad_name]
            target_path = os.path.join(DATA_DIR, target_filename)
            
            existing_list = []
            if os.path.exists(target_path):
                with open(target_path, 'r', encoding='utf-8') as f:
                    existing_content = f.read()
                    parsed = parse_js_array(existing_content)
                    if squad_name in parsed:
                        existing_list = parsed[squad_name]
            
            merged = merge_squads(existing_list, new_list)
            
            print(f"Merging {squad_name} -> {target_filename} (Old: {len(existing_list)}, New: {len(new_list)}, Merged: {len(merged)})")
            write_ts_file(target_path, squad_name, merged)

if __name__ == "__main__":
    process_patch_files()
