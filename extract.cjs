const fs = require('fs');

const txt = fs.readFileSync('locales/en.ts', 'utf8');
const lines = txt.split('\n');
const missing = {};
for (const line of lines) {
    const match = line.match(/^(\s*)([a-zA-Z0-9_]+)\s*:\s*(['"`])TODO_TR:\s*(.*?)(['"`]),?\s*(\/\/.*)?$/);
    if (match) {
        missing[match[2]] = match[4];
    }
}
fs.writeFileSync('missing.json', JSON.stringify(missing, null, 2));
console.log('Done, keys extracted: ' + Object.keys(missing).length);
