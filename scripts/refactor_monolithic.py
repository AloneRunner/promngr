import os
import re
import json

DATA_DIR = os.path.join(os.getcwd(), 'data')

def sanitize_filename(name):
    # Lowercase, replace spaces with underscores, remove special chars
    s = name.lower()
    s = re.sub(r'[^a-z0-9\s]', '', s)
    s = re.sub(r'\s+', '_', s)
    return s

def sanitize_varname(name):
    # Uppercase, underscore
    s = name.upper()
    s = re.sub(r'[^A-Z0-9\s]', '', s)
    s = re.sub(r'\s+', '_', s)
    return s

def process_file(filename, array_name):
    filepath = os.path.join(DATA_DIR, filename)
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        return

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Extract the array content
    # Assuming "export const NAME = [" ... "];"
    # This is a bit fragile if there are complex nested structures with [ or ].
    # But looking at the files, they are simple objects.
    
    # Let's use a simpler approach: splitting by objects { ... }
    # Find the start of the array
    start_marker = f'export const {array_name} = ['
    start_idx = content.find(start_marker)
    if start_idx == -1:
        print("Array start not found")
        return
    
    array_content = content[start_idx + len(start_marker):]
    # Find the end (last ];)
    end_idx = array_content.rfind('];')
    if end_idx != -1:
        array_content = array_content[:end_idx]
    
    # Split by "takim:" to identify blocks? No, that's unreliable.
    # Let's regex for objects.
    # Matches { ... } spanning multiple lines. Non-greedy.
    # Caveat: Nested braces will break this.
    # The data seems flat (no nested objects except ana_ozellikler/detaylar which are small).
    # Actually, ana_ozellikler is { ... }.
    
    # Better approach: Iterate line by line and build objects.
    
    lines = array_content.split('\n')
    current_team = None
    teams_data = {} # { team_name: [lines] }
    
    current_obj_lines = []
    in_object = False
    
    # Regex to find 'takim: "Name"'
    takim_pattern = re.compile(r'takim:\s*"([^"]+)"')
    
    for line in lines:
        line_stripped = line.strip()
        if line_stripped == '{':
            in_object = True
            current_obj_lines = [line]
            current_team = None
        elif line_stripped.startswith('},') or line_stripped == '}':
            if in_object:
                current_obj_lines.append(line)
                if current_team:
                    if current_team not in teams_data:
                        teams_data[current_team] = []
                    teams_data[current_team].append("\n".join(current_obj_lines))
                in_object = False
        elif in_object:
            current_obj_lines.append(line)
            match = takim_pattern.search(line)
            if match:
                current_team = match.group(1)
                
    # Now write files
    generated_files = []
    
    for team, objects in teams_data.items():
        if not team: continue
        
        filename = sanitize_filename(team) + ".ts"
        varname = sanitize_varname(team) + "_SQUAD"
        
        file_content = f"export const {varname} = [\n"
        file_content += ",\n".join(objects)
        file_content += "\n];\n"
        
        out_path = os.path.join(DATA_DIR, filename)
        with open(out_path, 'w', encoding='utf-8') as f:
            f.write(file_content)
            
        print(f"Created {filename} for {team}")
        generated_files.append((filename, varname))
        
    return generated_files

if __name__ == "__main__":
    print("--- Processing Ligue 1 ---")
    files_l1 = process_file('ligue1.ts', 'LIGUE1_SQUAD')
    
    print("\n--- Processing Bundesliga ---")
    files_de = process_file('bundesliga.ts', 'BUNDESLIGA_SQUAD')
    
    print("\n--- CONSTANTS.TS SNIPPETS ---")
    if files_l1:
        for f, v in files_l1:
            print(f"import {{ {v} }} from './data/{f.replace('.ts', '')}';")
    if files_de:
        for f, v in files_de:
            print(f"import {{ {v} }} from './data/{f.replace('.ts', '')}';")
            
    print("\n--- SPREAD SNIPPETS ---")
    if files_l1:
        print("... " + ", ...".join([v for f, v in files_l1]) + ",")
    if files_de:
        print("... " + ", ...".join([v for f, v in files_de]) + ",")
