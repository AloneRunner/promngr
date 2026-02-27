const fs = require('fs');
const path = require('path');

const locales = [
    { lang: 'tr', varConf: 'TR_TRANSLATIONS' },
    { lang: 'en', varConf: 'EN_TRANSLATIONS' },
    { lang: 'es', varConf: 'ES_TRANSLATIONS' },
    { lang: 'fr', varConf: 'FR_TRANSLATIONS' },
    { lang: 'id', varConf: 'ID_TRANSLATIONS' }
];

const tr = {
    width: "Genişlik",
    tacticNarrow: "Dar",
    tacticBalanced: "Denge",
    tacticWide: "Geniş",
    passingStyle: "Pas Stili",
    tacticShort: "Kısa",
    tacticDirect: "Direkt",
    tacticLongBall: "Uzun Top",
    tempo: "Tempo",
    tempoSlow: "Yavaş",
    tempoFast: "Hızlı",
    instructions: "Oyuncu Talimatları",
    instrWorkBall: "Paslaşarak Gir",
    instrShootSight: "Gördüğün Yerden Vur",
    instrRoam: "Serbest Dolaş",
    pressingIntensity: "Pres Yoğunluğu",
    pressStandOff: "Geride Karşıla (Otobüs)",
    pressBalanced: "Dengeli",
    pressHigh: "Yüksek Pres",
    pressGegen: "Gegenpress (Şok Pres)",
    defensiveLine: "Defans Hattı",
    tacticDeep: "Derin",
    tacticHigh: "Önde"
};

const en = {
    width: "Width",
    tacticNarrow: "Narrow",
    tacticBalanced: "Bal",
    tacticWide: "Wide",
    passingStyle: "Passing Style",
    tacticShort: "Short",
    tacticDirect: "Direct",
    tacticLongBall: "Long",
    tempo: "Tempo",
    tempoSlow: "Slow",
    tempoFast: "Fast",
    instructions: "Player Instructions",
    instrWorkBall: "Work Ball Into Box",
    instrShootSight: "Shoot On Sight",
    instrRoam: "Roam From Position",
    pressingIntensity: "Pressing Intensity",
    pressStandOff: "Stand Off (Deep Block)",
    pressBalanced: "Balanced",
    pressHigh: "High Press",
    pressGegen: "Gegenpress",
    defensiveLine: "Defensive Line",
    tacticDeep: "Deep",
    tacticHigh: "High"
};

const es = {
    width: "Ancho",
    tacticNarrow: "Estrecho",
    tacticBalanced: "Bal",
    tacticWide: "Ancho",
    passingStyle: "Estilo de Pase",
    tacticShort: "Corto",
    tacticDirect: "Directo",
    tacticLongBall: "Largo",
    tempo: "Ritmo",
    tempoSlow: "Lento",
    tempoFast: "Rápido",
    instructions: "Instrucciones",
    instrWorkBall: "Pase al Área",
    instrShootSight: "Tirar al Ver",
    instrRoam: "Moverse Libre",
    pressingIntensity: "Intensidad de Presión",
    pressStandOff: "Esperar Atrás",
    pressBalanced: "Equilibrado",
    pressHigh: "Presión Alta",
    pressGegen: "Gegenpress",
    defensiveLine: "Línea Defensiva",
    tacticDeep: "Profunda",
    tacticHigh: "Adelantada"
};

const fr = {
    width: "Largeur",
    tacticNarrow: "Étroit",
    tacticBalanced: "Bal",
    tacticWide: "Large",
    passingStyle: "Style de Passe",
    tacticShort: "Court",
    tacticDirect: "Direct",
    tacticLongBall: "Long",
    tempo: "Rythme",
    tempoSlow: "Lent",
    tempoFast: "Rapide",
    instructions: "Consignes",
    instrWorkBall: "Conserver le Ballon",
    instrShootSight: "Tirer à Vue",
    instrRoam: "Déroger",
    pressingIntensity: "Intensité Pressing",
    pressStandOff: "Attendre Bas",
    pressBalanced: "Équilibré",
    pressHigh: "Pressing Haut",
    pressGegen: "Gegenpress",
    defensiveLine: "Ligne Défensive",
    tacticDeep: "Basse",
    tacticHigh: "Haute"
};

const id = {
    width: "Lebar Lapangan",
    tacticNarrow: "Sempit",
    tacticBalanced: "Seimbang",
    tacticWide: "Lebar",
    passingStyle: "Gaya Umpan",
    tacticShort: "Pendek",
    tacticDirect: "Langsung",
    tacticLongBall: "Melambung",
    tempo: "Tempo",
    tempoSlow: "Lambat",
    tempoFast: "Cepat",
    instructions: "Instruksi Pemain",
    instrWorkBall: "Umpan ke Kotak",
    instrShootSight: "Tembak Langsung",
    instrRoam: "Jelajah Bebas",
    pressingIntensity: "Intensitas Pressing",
    pressStandOff: "Tunggu Belakang",
    pressBalanced: "Seimbang",
    pressHigh: "Pressing Tinggi",
    pressGegen: "Gegenpress",
    defensiveLine: "Garis Pertahanan",
    tacticDeep: "Dalam",
    tacticHigh: "Tinggi"
};

const translations = { tr, en, es, fr, id };

locales.forEach(localeInfo => {
    const filePath = path.join(__dirname, '..', `locales`, `${localeInfo.lang}.ts`);
    let content = fs.readFileSync(filePath, 'utf8');

    const trans = translations[localeInfo.lang];
    let newKeys = "";

    for (let key in trans) {
        if (!content.includes(`${key}:`)) {
            newKeys += `    ${key}: ${JSON.stringify(trans[key])},\n`;
        }
    }

    if (newKeys.length > 0) {
        const targetString = `export const ${localeInfo.varConf} = {`;
        if (content.includes(targetString)) {
            content = content.replace(targetString, targetString + '\n' + newKeys);
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`Updated ${localeInfo.lang}.ts with missing tactic UI translations.`);
        } else {
            console.warn(`Could not find export block in ${localeInfo.lang}.ts`);
        }
    }
});
