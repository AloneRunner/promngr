const fs = require('fs');

function parseLocales(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    let map = new Map();
    for (const line of lines) {
        const match = line.match(/^(\s*)([a-zA-Z0-9_]+)\s*:\s*(["'`])([\s\S]*?)(["'`]),?\s*(?:\/\/(.*))?$/);
        if (match) {
            map.set(match[2], line);
        } else {
            const multilineMatch = line.match(/^\s*([a-zA-Z0-9_]+)\s*:/);
            if (multilineMatch) {
                // This is a naive regex, might not catch multiline perfectly. 
                // For simplicity, we can do a better parser if needed.
            }
        }
    }
    return map;
}

// Better parser: Use eval/Function to load the object.
// But we want to preserve comments and order.
// Let's use TS/babel or a regex that preserves order.

function alignLocales(basePath, targetPath) {
    const baseContent = fs.readFileSync(basePath, 'utf-8');
    const targetContent = fs.readFileSync(targetPath, 'utf-8');

    // Extract target key-values using full regex
    const targetMap = new Map();
    const regex = /^\s*([a-zA-Z0-9_]+)\s*:\s*(["'`])(.*?)(\2)(,?)\s*$/gm;
    let match;
    while ((match = regex.exec(targetContent)) !== null) {
        targetMap.set(match[1], match[3]);
    }

    // Now process base content line by line, replacing values if they exist in targetMap
    // If not, put a TODO.
    const newLines = [];
    const baseLines = baseContent.split('\n');

    // We also need to rename TR_TRANSLATIONS to EN_TRANSLATIONS etc.
    let lang = targetPath.match(/([a-z]+)\.ts/)[1].toUpperCase();

    let insideObject = false;

    for (let line of baseLines) {
        if (line.includes('export const TR_TRANSLATIONS = {')) {
            newLines.push(`export const ${lang}_TRANSLATIONS = {`);
            insideObject = true;
            continue;
        }

        const propMatch = line.match(/^(\s*)([a-zA-Z0-9_]+)\s*:\s*(["'`])(.*?)(\3)(,?)(.*)$/);
        if (propMatch && insideObject) {
            const spaces = propMatch[1];
            const key = propMatch[2];
            const quote = propMatch[3];
            const trValue = propMatch[4];
            const comma = propMatch[6];
            const trailing = propMatch[7];

            if (targetMap.has(key)) {
                // Key exists in target, use its value
                let existingVal = targetMap.get(key);
                // escape unescaped quotes if needed, but since we parsed it, it might just drop in seamlessly.
                // however, targetMap.get(key) has escaped values.
                newLines.push(`${spaces}${key}: ${quote}${existingVal}${quote}${comma}${trailing}`);
            } else {
                newLines.push(`${spaces}${key}: ${quote}TODO_TR: ${trValue}${quote}${comma}${trailing}`);
            }
        } else {
            newLines.push(line);
        }
    }

    fs.writeFileSync(targetPath, newLines.join('\n'), 'utf-8');
    console.log(`Aligned ${targetPath}`);
}

alignLocales('locales/tr.ts', 'locales/en.ts');
alignLocales('locales/tr.ts', 'locales/es.ts');
alignLocales('locales/tr.ts', 'locales/fr.ts');
alignLocales('locales/tr.ts', 'locales/id.ts');
alignLocales('locales/tr.ts', 'locales/ru.ts');
