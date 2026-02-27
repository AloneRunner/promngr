import fs from 'fs';
import path from 'path';

// Define the 20 Core Playstyles we want to keep
const CORE_PLAYSTYLES = [
    // GoalKeepers
    "Kedi Refleks", "Ortaya Çıkan", "Penaltı Canavarı",

    // Defense & Resistance
    "Top Kesici", "Kaya", "Amansız", "Baskıya Dayanıklı",

    // Movement & Tech
    "Seri", "Top Cambazı", "İlk Dokunuş",

    // Passing & Playmaking
    "Keskin Pas", "Maestro", "Ölü Top Uzmanı",

    // Shooting & Finishing
    "Plase Şut", "Roket", "Aşırtma", "Hava Hakimi", "Uzaktan Şutör",

    // Roles & AI
    "Gizli Forvet", "İleride Bekleyen"
];

// Mapping dictionary from OLD -> NEW (Core) playstyles
const PLAYSTYLE_MAPPING: Record<string, string> = {
    // GK
    "Libero Kaleci": "Ortaya Çıkan",
    "Kaleden Çıkma": "Ortaya Çıkan",
    "Çizgi Kalecisi": "Kedi Refleks",
    "Uzağa Fırlatma": "Ortaya Çıkan",
    "Uzağa Erişme": "Ortaya Çıkan",
    "Kedi": "Kedi Refleks",
    "Dev": "Kedi Refleks",
    "Lider Kaleci": "Kedi Refleks",
    "Oyun Kurucu Kaleci": "Maestro",

    // Defense
    "Savaşçı": "Kaya",
    "Savaşçı Bek": "Kaya",
    "Savaşçı Kanat": "Amansız",
    "Sert Müdahale": "Kaya",
    "Temiz Müdahale": "Top Kesici",
    "Kayarak Müdahale": "Kaya",
    "Mücadeleci": "Amansız",
    "Defans Lideri": "Kaya",
    "Defans Şefi": "Kaya",
    "Jokey": "Top Kesici",
    "Kırıcı": "Kaya",
    "Çapa": "Kaya",
    "Demir Adam": "Amansız",
    "Kaya Gibi": "Kaya",
    "Kaplan": "Top Kesici",
    "Ayı": "Kaya",
    "Aslan": "Kaya",
    "Güçlü Defans": "Kaya",
    "Güçlü Bek": "Kaya",
    "Hızlı Stoper": "Seri",
    "Stoper": "Kaya",
    "Modern Stoper": "Maestro",
    "Oyun Kurucu Stoper": "Maestro",
    "Top Dağıtan Stoper": "Maestro",
    "Pasör Stoper": "Maestro",
    "Yapıcı Stoper": "Maestro",
    "Teknik Stoper": "Maestro",
    "Kule Stoper": "Hava Hakimi",
    "Defansif Orta Saha": "Top Kesici",
    "Süpürücü": "Top Kesici",
    "Libero": "Top Kesici",

    // Stamina/Resistance
    "Motor": "Amansız",
    "Çalışkan": "Amansız",
    "Çalışkan Kanat": "Amansız",
    "Dinamo": "Amansız",
    "Kutu Kutu": "Amansız",
    "Kutuya Kutu": "Amansız",
    "Box-to-Box": "Amansız",
    "Çift Yönlü": "Amansız",
    "İki Yönlü": "Amansız",
    "İki Yönlü Bek": "Amansız",

    // Movement/Dribbling
    "Çabuk Adım": "Seri",
    "Hızlı": "Seri",
    "Hızlı Bek": "Seri",
    "Hızlı Forvet": "Seri",
    "Hızlı Kanat": "Seri",
    "Hız Canavarı": "Seri",
    "Süratli": "Seri",
    "Fişek": "Seri",
    "Sprint Ustası": "Seri",
    "Atletik": "Seri",
    "Dribling Ustası": "Top Cambazı",
    "Driblingçi": "Top Cambazı",
    "Dripling Ustası": "Top Cambazı",
    "Teknik Driplingci": "Top Cambazı",
    "Top Süren": "Top Cambazı",
    "Top Süren Bek": "Top Cambazı",
    "Top Süren Stoper": "Top Cambazı",
    "Çalımlı": "Top Cambazı",
    "Sihirbaz": "Top Cambazı",

    // Technique/Pass/Playmaking
    "Teknik": "İlk Dokunuş",
    "Teknik Bek": "İlk Dokunuş",
    "Mestro": "Maestro", // typo fallback
    "Oyun Kurucu": "Maestro",
    "Oyun Kurucu Bek": "Maestro",
    "Oyun Kurucu Kanat": "Maestro",
    "Orta Saha Maestrosu": "Maestro",
    "Orkestra Şefi": "Maestro",
    "Regista": "Maestro",
    "Pas Ustası": "Keskin Pas",
    "İnce Pas": "Keskin Pas",
    "Kesme Pas": "Keskin Pas",
    "Çapraz Pasör": "Maestro",
    "Uzun Pas": "Maestro",
    "Uzun Pasçı": "Maestro",
    "Uzun Topla Pas": "Maestro",
    "Uzun Top": "Maestro",
    "Pasör": "Keskin Pas",
    "Yaratıcı": "Maestro",
    "Yaratıcı Kanat": "Maestro",
    "Asist Kralı": "Maestro",
    "Asistçi Bek": "Maestro",
    "Orta Açma Ustası": "Maestro",
    "Orta Uzmanı": "Maestro",
    "Erken Orta": "Maestro",

    // Shooting/Finishing
    "Kuvvetli Şut": "Roket",
    "Sert Şut": "Roket",
    "Alçak Sert Şut": "Roket",
    "Keskin Şut": "Roket",
    "Şutör Kanat": "Uzaktan Şutör",
    "Uzaktan Şutçu": "Uzaktan Şutör",
    "Uzaktan Şut": "Uzaktan Şutör",
    "Uzaktan Vuruş": "Uzaktan Şutör",
    "Direk Dibine": "Plase Şut",
    "Frikik Ustası": "Ölü Top Uzmanı",
    "Frikik Uzmanı": "Ölü Top Uzmanı",
    "Frikikçi": "Ölü Top Uzmanı",
    "Serbest Vuruş Uzmanı": "Ölü Top Uzmanı",
    "Duran Top": "Ölü Top Uzmanı",
    "Duran Top Ustası": "Ölü Top Uzmanı",
    "Duran Top Uzmanı": "Ölü Top Uzmanı",
    "Penaltı Ustası": "Penaltı Canavarı",
    "Penaltı Uzmanı": "Penaltı Canavarı",
    "Penaltıcı": "Penaltı Canavarı",
    "Aşırtma Şut": "Aşırtma",
    "Bitirici": "Plase Şut",
    "Golcü": "İleride Bekleyen",
    "Golcü Kanat": "Gizli Forvet",
    "Gol Makinesi": "Plase Şut",
    "Kral": "Plase Şut",
    "Hassas Kafa Vuruşu": "Hava Hakimi",
    "Hava Hakimiyeti": "Hava Hakimi",
    "Hava Hakimi Kanat": "Hava Hakimi",

    // Roles/Physical
    "Güçlü": "Kaya",
    "Güçlü Forvet": "Kaya",
    "Güçlü Kanat": "Kaya",
    "Tank": "Kaya",
    "Tank Kanat": "Kaya",
    "Kule Santrafor": "Hava Hakimi",
    "Hedef Adam": "Hava Hakimi",
    "Hedef Santrafor": "Hava Hakimi",
    "Çok Yönlü": "Top Kesici",
    "Joker": "Top Kesici",
    "Sahte 9": "Maestro",

    // Random / Ignore / Remove (Mapping to null/empty so they get deleted)
    "Lider": "",
    "Kaptan": "",
    "Tecrübeli": "",
    "Veteran": "",
    "Deneyimli": "",
    "Harika Çocuk": "",
    "Geleceğin Yıldızı": "",
    "Genç Yetenek": "",
    "Yıldız Aday": "",
    "Yıldız": "",
    "Efsane": "",
    "Ulusal Kahraman": "",
    "Süper Yedek": "",
    "Kurtarıcı": "",
    "İstikrarlı": "",
    "Sırtı Dönük Oyun": "",
    "Sezgili": "",
    "Ezber Bozan": "",
    "Bire Bir": "",
    "Birebir": "",
    "Defansif Oyun Kurucu": "",
    "Tiki Taka": "",
    "Trivela": "",
    "Çift Ayak": "",
    "Ters Ayaklı Kanat": "",
    "İçe Kateden": "",
    "İçe Kat Eden": "",
    "Bindiren Bek": "",
    "Bindiren": "",
    "Ofansif Bek": "",
    "Dengeli Bek": "",
    "Hücumcu Bek": "",
    "Kanat Oyuncusu": "",
    "Kanat Yıldızı": "",
    "Kanat Forvet": "",
    "Komple Forvet": "",
    "Fırsatçı": "İleride Bekleyen",
    "Fırsatçı Golcü": "İleride Bekleyen"
};

const dataDir = path.join(process.cwd(), 'src', 'data');

function cleanPlaystyles(playStyleArray: string[]): string[] {
    const newStyles = new Set<string>();

    for (let style of playStyleArray) {
        // Remove trailing '+' if it exists
        if (style.endsWith('+')) {
            style = style.slice(0, -1);
        }

        // Clean formatting
        style = style.trim();

        if (CORE_PLAYSTYLES.includes(style)) {
            newStyles.add(style);
        } else if (PLAYSTYLE_MAPPING[style]) {
            newStyles.add(PLAYSTYLE_MAPPING[style]);
        } else if (PLAYSTYLE_MAPPING[style] === "") {
            // Deliberately mapped to nothing (ignored feature)
        } else {
            console.log(`[WARNING] Unmapped playstyle found: "${style}". Removing it.`);
        }
    }

    // Return as array, bounded to MAX 5 playstyles to not make players completely broken
    return Array.from(newStyles).slice(0, 5);
}

function processFile(filePath: string) {
    let content = fs.readFileSync(filePath, 'utf-8');

    // Regex to match: oyun_tarzlari: ["Plase Şut", "Top Cambazı", "Teknik+"]
    const regex = /oyun_tarzlari:\s*\[(.*?)\]/g;

    const newContent = content.replace(regex, (match, arrayContent) => {
        if (!arrayContent.trim()) {
            return `oyun_tarzlari: []`;
        }

        // Extract items (e.g. "Seri", "Top Cambazı")
        const items = arrayContent.split(',').map((it: string) => it.trim().replace(/^['"]|['"]$/g, ''));

        const cleanedItems = cleanPlaystyles(items);

        // Format back
        const formattedString = cleanedItems.map((st: string) => `"${st}"`).join(', ');
        return `oyun_tarzlari: [${formattedString}]`;
    });

    if (content !== newContent) {
        fs.writeFileSync(filePath, newContent, 'utf-8');
        console.log(`Updated: ${path.basename(filePath)}`);
    }
}

// Read all TS files in src/data
const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.ts'));

console.log(`Starting to refactor ${files.length} data files...`);
files.forEach(file => {
    processFile(path.join(dataDir, file));
});
console.log('Playstyle refactor COMPLETED successfully!');
