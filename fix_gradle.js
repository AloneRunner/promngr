const fs = require('fs');
const path = require('path');

console.log('Starting Gradle fix...');

function walk(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            if (file !== 'build' && file !== '.gradle') walk(filePath);
        } else if (file.endsWith('.gradle')) {
            let content = fs.readFileSync(filePath, 'utf8');
            let original = content;
            // Replacements
            // 1. Java Version
            content = content.replace(/JavaVersion\.VERSION_21/g, 'JavaVersion.VERSION_17');
            // 2. lintOptions (deprecated) -> lint
            // Be careful not to replace it if it's already 'lint {' but strict replace 'lintOptions' is fine
            content = content.replace(/lintOptions/g, 'lint');
            // 3. Ghost Gradle version
            content = content.replace(/8\.13\.0/g, '8.7.3');

            if (content !== original) {
                fs.writeFileSync(filePath, content, 'utf8');
                console.log('Fixed:', filePath);
            }
        }
    });
}

walk('android');
// Also try to fix node_modules if possible, though mostly read-only
try {
    walk('node_modules/@capacitor/android');
} catch (e) {
    console.log('Could not fix node_modules (permission or path)', e.message);
}

console.log('Done fixing gradle files.');
