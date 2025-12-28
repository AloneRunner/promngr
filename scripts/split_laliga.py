import os
import re

DATA_DIR = os.path.join(os.getcwd(), 'data')
LALIGA_FILE = os.path.join(DATA_DIR, 'laliga.ts')

# Map of Prefix to Filename
PREFIX_TO_FILE = {
    'MADRID_BLANCOS': 'madrid_blancos.ts',
    'CATALONIA_BLAUGRANA': 'catalonia_blaugrana.ts',
    'MADRID_INDIOS': 'madrid_indios.ts',
    'BILBAO_LIONS': 'bilbao_lions.ts',
    'SAN_SEBASTIAN': 'san_sebastian.ts',
    'YELLOW_SUBMARINES': 'yellow_submarines.ts',
    'SEVILLE_GREENWHITES': 'seville_greenwhites.ts',
    'GIRONA_REDS': 'girona_reds.ts',
    'SEVILLA_NERVION': 'sevilla_nervion.ts',
    'VALENCIA_BATS': 'valencia_bats.ts',
    'VIGO_SKY_BLUES': 'vigo_sky_blues.ts',
    'VALLECANO_LIGHTNING': 'vallecano_lightning.ts',
    'MALLORCA_ISLANDERS': 'mallorca_islanders.ts',
    'PAMPLONA_BULLS': 'pamplona_bulls.ts',
    'GETAFE_BLUES': 'getafe_blues.ts',
    'VITORIA_FOXES': 'vitoria_foxes.ts',
    'ESPANYOL_PARROTS': 'espanyol_parrots.ts',
    'CHALLENGERS_UNITED': 'challengers_united.ts'
}

def split_laliga():
    if not os.path.exists(LALIGA_FILE):
        print(f"File not found: {LALIGA_FILE}")
        return

    with open(LALIGA_FILE, 'r', encoding='utf-8') as f:
        content = f.read()

    # Regex to find exports
    # It captures: export const NAME = [...];
    # We need to handle nested brackets for objects inside the array.
    # A simple regex matching balanced brackets is hard.
    # Instead, we can split by "export const" and process chunks.
    
    chunks = content.split('export const ')
    
    file_contents = {k: [] for k in PREFIX_TO_FILE.values()}
    
    # Skip the first chunk (imports/comments before first export)
    for chunk in chunks[1:]:
        # Extract Variable Name
        match = re.match(r'(\w+)\s*=', chunk)
        if not match:
            continue
            
        var_name = match.group(1)
        full_export = f"export const {chunk}" 
        # Note: 'chunk' is everything after 'export const ' so we prepend it back
        
        # Identify which file it belongs to
        target_file = None
        for prefix, filename in PREFIX_TO_FILE.items():
            if var_name.startswith(prefix):
                target_file = filename
                break
        
        if target_file:
            # We want to preserve the content exactly, but we need to ensure valid syntax.
            # The split removed 'export const '.
            
            # Remove trailing newlines/junk from the previous split if any?
            # Actually, the split approach is risky if there's other code.
            # Assuming the file is JUST exports.
            
            # Let's try to verify the end of the statement.
            # It usually ends with ];
            
            file_contents[target_file].append(full_export)
        else:
            print(f"Warning: Could not match {var_name} to a file.")

    # Write files
    for filename, exports in file_contents.items():
        if not exports:
            continue
            
        path = os.path.join(DATA_DIR, filename)
        print(f"Writing {path}...")
        with open(path, 'w', encoding='utf-8') as f:
            f.write("\n\n".join(exports))

if __name__ == "__main__":
    split_laliga()
