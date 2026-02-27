import fs from 'fs';
import path from 'path';

const FILES_TO_UPDATE = [
    'services/MatchEngine.ts',
    'services/ikincimotor.ts',
    'services/ucuncumotor.ts',
    'services/dorduncumotor.ts'
];

const REPLACEMENTS: Array<{ regex: RegExp, substitute: string }> = [
    // 1. Clean up "Style+" variations across any engine code
    { regex: /\|\|\s*[a-zA-Z_0-9\[\]]+\.playStyles\?\.includes\(".*?\+"\)/g, substitute: "" },     // Remove || p.playStyles?.includes("...+")
    { regex: /\|\|\s*[a-zA-Z_0-9\[\]]+\.playStyles\?\.includes\('.*?\+'\)/g, substitute: "" },      // Same for single quotes

    // 2. GK
    { regex: /"Kedi Refleks\+"/g, substitute: "\"Kedi Refleks\"" },
    { regex: /"Dev"/g, substitute: "\"Kedi Refleks\"" },
    { regex: /"Birebir"/g, substitute: "\"Kedi Refleks\"" },
    { regex: /"Ortaya Çıkan\+"/g, substitute: "\"Ortaya Çıkan\"" },
    { regex: /"Uzağa Fırlatma\+"/g, substitute: "\"Ortaya Çıkan\"" },
    { regex: /"Uzağa Fırlatma"/g, substitute: "\"Ortaya Çıkan\"" },
    { regex: /"Libero Kaleci"/g, substitute: "\"Ortaya Çıkan\"" },

    // 3. DEFENSE / STRESS
    { regex: /"Engel\+"/g, substitute: "\"Engel\"" },
    { regex: /"Kayarak Müdahale\+"/g, substitute: "\"Kaya\"" },
    { regex: /"Kayarak Müdahale"/g, substitute: "\"Kaya\"" },
    { regex: /"Savaşçı"/g, substitute: "\"Kaya\"" },
    { regex: /"Mücadeleci"/g, substitute: "\"Amansız\"" },
    { regex: /"Top Kesici\+"/g, substitute: "\"Top Kesici\"" },
    { regex: /"Baskıya Dayanıklı\+"/g, substitute: "\"Baskıya Dayanıklı\"" },
    { regex: /"Sezgili\+"/g, substitute: "\"Top Kesici\"" },
    { regex: /"Sezgili"/g, substitute: "\"Top Kesici\"" },

    // 4. MOVEMENT & TECH
    { regex: /"Seri\+"/g, substitute: "\"Seri\"" },
    { regex: /"Çabuk Adım\+"/g, substitute: "\"Seri\"" },
    { regex: /"Çabuk Adım"/g, substitute: "\"Seri\"" },
    { regex: /"Top Cambazı\+"/g, substitute: "\"Top Cambazı\"" },
    { regex: /"İlk Dokunuş\+"/g, substitute: "\"İlk Dokunuş\"" },
    { regex: /"Teknik\+"/g, substitute: "\"İlk Dokunuş\"" },
    { regex: /"Teknik"/g, substitute: "\"İlk Dokunuş\"" },

    // 5. PASSING / VISION
    { regex: /"Keskin Pas\+"/g, substitute: "\"Keskin Pas\"" },
    { regex: /"Uzun Topla Pas\+"/g, substitute: "\"Maestro\"" },
    { regex: /"Uzun Topla Pas"/g, substitute: "\"Maestro\"" },
    { regex: /"Yaratıcı\+"/g, substitute: "\"Maestro\"" },
    { regex: /"Yaratıcı"/g, substitute: "\"Maestro\"" },
    { regex: /"Orkestra Şefi"/g, substitute: "\"Maestro\"" },
    { regex: /"Ezber Bozan\+"/g, substitute: "\"Maestro\"" },
    { regex: /"Ezber Bozan"/g, substitute: "\"Maestro\"" },

    // 6. FINISHING
    { regex: /"Plase Şut\+"/g, substitute: "\"Plase Şut\"" },
    { regex: /"Kuvvetli Şut\+"/g, substitute: "\"Roket\"" },
    { regex: /"Kuvvetli Şut"/g, substitute: "\"Roket\"" },
    { regex: /"Uzaktan Şut\+"/g, substitute: "\"Uzaktan Şutör\"" },
    { regex: /"Uzaktan Şut"/g, substitute: "\"Uzaktan Şutör\"" },
    { regex: /"Hassas Kafa Vuruşu\+"/g, substitute: "\"Hava Hakimi\"" },
    { regex: /"Hassas Kafa Vuruşu"/g, substitute: "\"Hava Hakimi\"" },
    { regex: /"Hava Hakimi\+"/g, substitute: "\"Hava Hakimi\"" },
    { regex: /"Aşırtma\+"/g, substitute: "\"Aşırtma\"" },
    { regex: /"Akrobatik\+"/g, substitute: "\"Aşırtma\"" },
    { regex: /"Akrobatik"/g, substitute: "\"Aşırtma\"" },
    { regex: /"Ölü Top Uzmanı\+"/g, substitute: "\"Ölü Top Uzmanı\"" },

    // 7. ROLES
    { regex: /"Gizli Forvet\+"/g, substitute: "\"Gizli Forvet\"" },
    { regex: /"İleride Bekleyen\+"/g, substitute: "\"İleride Bekleyen\"" },
    { regex: /"Box-to-Box"/g, substitute: "\"Amansız\"" },
    { regex: /"Amansız\+"/g, substitute: "\"Amansız\"" },
    { regex: /"Sırtı Dönük Oyun"/g, substitute: "\"İleride Bekleyen\"" },
    { regex: /"False 9"/g, substitute: "\"Gizli Forvet\"" },
    { regex: /"Serbest"/g, substitute: "\"Gizli Forvet\"" },
    { regex: /"Bağlantı"/g, substitute: "\"Maestro\"" },

    // Clean up ugly remnants (e.g., empty OR pairs created by our deletions)
    { regex: /\|\|\s*p\.playStyles\?\.includes\(""\)/g, substitute: "" },
    { regex: /\|\|\s*gk\.playStyles\?\.includes\(""\)/g, substitute: "" },
    { regex: /\|\|\s*carrier\.playStyles\?\.includes\(""\)/g, substitute: "" },
    { regex: /\|\|\s*tm\.playStyles\?\.includes\(""\)/g, substitute: "" }
];

async function run() {
    for (const relPath of FILES_TO_UPDATE) {
        const fullPath = path.join(process.cwd(), relPath);
        if (!fs.existsSync(fullPath)) continue;

        let content = fs.readFileSync(fullPath, 'utf8');
        let original = content;

        for (const replacement of REPLACEMENTS) {
            content = content.replace(replacement.regex, replacement.substitute);
        }

        // Remove trailing or leading logic operators if they were left danging by regex
        content = content.replace(/\(\s*\|\|/g, '(');
        content = content.replace(/\|\|\s*\)/g, ')');

        // Additional edge case: if statement purely left with an empty condition because we stripped the "+ " trait
        // Just leaving the base string so it shouldn't happen, but cleaning anyway
        content = content.replace(/includes\("Kedi Refleks"\)\s*\|\|\s*gk\.playStyles\?\.includes\("Kedi Refleks"\)/g, "includes(\"Kedi Refleks\")");
        content = content.replace(/includes\("Ortaya Çıkan"\)\s*\|\|\s*p\.playStyles\?\.includes\("Ortaya Çıkan"\)/g, "includes(\"Ortaya Çıkan\")");
        content = content.replace(/includes\("Amansız"\)\s*\|\|\s*p\.playStyles\?\.includes\("Amansız"\)/g, "includes(\"Amansız\")");
        content = content.replace(/includes\("Roket"\)\s*\|\|\s*p\.playStyles\?\.includes\("Roket"\)/g, "includes(\"Roket\")");
        content = content.replace(/includes\("Top Cambazı"\)\s*\|\|\s*p\.playStyles\?\.includes\("Top Cambazı"\)/g, "includes(\"Top Cambazı\")");
        content = content.replace(/includes\("Seri"\)\s*\|\|\s*p\.playStyles\?\.includes\("Seri"\)/g, "includes(\"Seri\")");
        content = content.replace(/includes\("İlk Dokunuş"\)\s*\|\|\s*p\.playStyles\?\.includes\("İlk Dokunuş"\)/g, "includes(\"İlk Dokunuş\")");
        content = content.replace(/includes\("Keskin Pas"\)\s*\|\|\s*carrier\.playStyles\?\.includes\("Keskin Pas"\)/g, "includes(\"Keskin Pas\")");
        content = content.replace(/includes\("Maestro"\)\s*\|\|\s*carrier\.playStyles\?\.includes\("Maestro"\)/g, "includes(\"Maestro\")");
        content = content.replace(/includes\("Aşırtma"\)\s*\|\|\s*p\.playStyles\?\.includes\("Aşırtma"\)/g, "includes(\"Aşırtma\")");
        content = content.replace(/includes\("Plase Şut"\)\s*\|\|\s*p\.playStyles\?\.includes\("Plase Şut"\)/g, "includes(\"Plase Şut\")");
        content = content.replace(/includes\("Ölü Top Uzmanı"\)\s*\|\|\s*p\.playStyles\?\.includes\("Ölü Top Uzmanı"\)/g, "includes(\"Ölü Top Uzmanı\")");
        content = content.replace(/includes\("Hava Hakimi"\)\s*\|\|\s*p\.playStyles\?\.includes\("Hava Hakimi"\)/g, "includes(\"Hava Hakimi\")");
        content = content.replace(/includes\("Uzaktan Şutör"\)\s*\|\|\s*p\.playStyles\?\.includes\("Uzaktan Şutör"\)/g, "includes(\"Uzaktan Şutör\")");

        if (original !== content) {
            fs.writeFileSync(fullPath, content, 'utf8');
            console.log(`Successfully refactored PlayStyles in: ${relPath}`);
        } else {
            console.log(`No refactoring needed for: ${relPath}`);
        }
    }
}

run();
