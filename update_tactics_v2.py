
import os

file_path = 'constants.ts'

if os.path.exists(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    new_content = content.replace("style: 'Possession'", "style: 'Balanced'")
    new_content = new_content.replace("passingStyle: 'Short'", "passingStyle: 'Mixed'")

    if content != new_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print("Successfully updated constants.ts")
    else:
        print("No changes needed in constants.ts (already updated or no matches found)")
else:
    print(f"Error: {file_path} not found")
