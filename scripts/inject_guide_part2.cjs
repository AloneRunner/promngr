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
    // Missing translation values
    guideGameGuideDesc: "Canlı Maç Motoru (Live Match Engine) anatomisi, Taktiklerin arka plan işleyişi ve Ekonomi formülleri.",
    guideTacticsTitle: "🎯 Taktik Tahtası (Oyun Planı İşleyişi)",
    guideTacticsDesc: "Taktikleriniz, motorda oyuncuların (X,Y) koordinatlarına saniyede 20 kere gönderilen hareket emirlerini değiştirir.",
    guideT_Defense: "🛡️ TEMEL (Savunma Şiddeti)",
    guideT_Attack: "🔥 HÜCUM (Atak Felsefesi)",
    guideT_Mentality: "🧠 Karar Tarzı (Mentality)",
    guideT_Width: "📏 Genişlik (Width)",
    guideT_PassTempo: "⚽ Pas Stili & ⏱️ Tempo",
    guideT_Instructions: "🎯 Hücum Talimatları (Instructions)",
    guideT_DefLinePress: "🧱 DEFANS (Yerleşim ve Pres)",
    guideT_PressIntensity: "🔥 Pres Yoğunluğu",
    guideT_DefLine: "📏 Defans Hattı",
    guideT_Presets: "⭐ HAZIR TAKTİKSEL AYARLAR",

    guideFinanceTitle: "💵 Finans Sistemi, İtibar ve Lig",
    guideFinanceDesc: "Batarsan, yönetimin sana olan sabrı anında biter.",
    guideF_Eco: "💸 Ekonomi Neden Etkilenir?",
    guideF_Eco1: "<strong>Maaşlar (Wages):</strong> Kadrodaki her adam sana haftalık borç yazar.",
    guideF_Eco2: "<strong>Bilet Gelirleri:</strong> İç sahada oynadığın maçlarda para kazanırsın. Stadyum kapasiten bunu çarpana böler. Tesislerini yükseltmek zenginlik anahtarıdır.",
    guideF_Eco3: "<strong>Sponsor & Yayın Hakları:</strong> Ligin kalitesine ve takımın Ligdeki puan tablosu sırasına göre verilen paradır.",
    guideF_Eco4: "<strong>Avrupa Kupaları:</strong> Şampiyonlar ligi (Avrupa grupları vb.) maçları kazanmak muazzam primler öder.",
    guideF_Rep: "📈 İtibar (Reputation) Nedir?",
    guideF_Rep1: "İtibar kulübünün markasıdır. Bir oyuncuyu transfer ederken, oyuncu 'Ben bu çöp takıma gelmem' diyorsa itibarınız yetmiyordur!",
    guideF_Rep2: "Avrupa maçları kazanarak, lig şampiyonu olarak veya yıldız transfer ederek itibarınız 5 yıldıza kadar çıkar.",

    guideTipsTitle: "💡 Kritik Menajer Tavsiyeleri",
    guideTipsDo: "✅ MUTLAKA YAPIN",
    guideTipsDo1: "• Her pozisyon için yedeğiniz olsun. Oyuncular yorulunca performansı dibe vurur, sakatlanırlar.",
    guideTipsDo2: "• Rakip <strong>'Gegenpress'</strong> yapıyorsa, <strong>'Direct/Uzun Top + Genişlik (Wide)'</strong> oyna. Presi direkt kırıp defans arkasına sarkarsın!",
    guideTipsDo3: "• Takımı <strong>'Motivasyon'</strong> antrenmanları ile mutlu tut, mutsuz adamın şutu direğe patlar!",
    guideTipsDont: "❌ ASLA YAPMAYIN",
    guideTipsDont1: "• 'Kaleciyi Defansta Oynatmak': %80 hata payıyla oynamaya başlar, her maç 5 yersiniz.",
    guideTipsDont2: "• 'Ölümüne Pres + Yüksek Çizgi + Yavaş Defans': Seni kontrataklarda delik deşik ederler.",
    guideTipsDont3: "• 'Kısa Pas (Tiki Taka) + Zemini/Taktiksel Anlayışı Bozuk Takım': Kendi ceza sahanda paslaşırken topu kaybedip bedava gol yersin."
};

const en = {
    // Missing translation values
    guideGameGuideDesc: "Live Match Engine anatomy, Tactics engine math and Economy formulas.",
    guideTacticsTitle: "🎯 Tactics Board (Engine Mechanics)",
    guideTacticsDesc: "Your tactics alter the commands sent to players' (X,Y) coordinates 20 times per second.",
    guideT_Defense: "🛡️ CORE (Defense Aggression)",
    guideT_Attack: "🔥 ATTACK (Attacking Philosophy)",
    guideT_Mentality: "🧠 Decision Making (Mentality)",
    guideT_Width: "📏 Pitch Width",
    guideT_PassTempo: "⚽ Passing Style & ⏱️ Tempo",
    guideT_Instructions: "🎯 Player Instructions",
    guideT_DefLinePress: "🧱 DEFENSE (Block and Press)",
    guideT_PressIntensity: "🔥 Pressing Intensity",
    guideT_DefLine: "📏 Defensive Line",
    guideT_Presets: "⭐ TACTICAL PRESETS",

    guideFinanceTitle: "💵 Finances, Reputation & Leagues",
    guideFinanceDesc: "If you go bankrupt, the board will fire you immediately.",
    guideF_Eco: "💸 How is the Economy calculations made?",
    guideF_Eco1: "<strong>Wages:</strong> Every player on your roster subtracts from your weekly balance.",
    guideF_Eco2: "<strong>Ticket Sales:</strong> Earn money during home games. Stadium capacity is the multiplier. Upgrading facilities is the key to wealth.",
    guideF_Eco3: "<strong>Sponsors & TV Rights:</strong> Money given based on your league's quality and your team's table position.",
    guideF_Eco4: "<strong>European Cups:</strong> Winning Champions League/Europa League matches pays out huge Win Bonuses.",
    guideF_Rep: "📈 What is Reputation?",
    guideF_Rep1: "Reputation is your club's brand. If a player refuses to join your 'trash team', your reputation is too low!",
    guideF_Rep2: "Winning European trophies, league titles, or signing global stars will boost your reputation up to 5 stars.",

    guideTipsTitle: "💡 Critical Manager Tips",
    guideTipsDo: "✅ MUST DO",
    guideTipsDo1: "• Have a backup for every position. When players tire, their performance tanks and they get injured.",
    guideTipsDo2: "• If the opponent uses <strong>'Gegenpress'</strong>, play <strong>'Direct/Long Ball + Wide Width'</strong>. You will break the press immediately and exploit the space behind!",
    guideTipsDo3: "• Keep the squad happy with <strong>Motivate</strong> training. An unhappy player's shot will hit the crossbar!",
    guideTipsDont: "❌ NEVER DO",
    guideTipsDont1: "• 'Playing a GK as a Defender': They will make 80% more mistakes and you will concede 5 goals.",
    guideTipsDont2: "• 'Reckless Press + High Line + Slow Defenders': Opposing forwards will destroy you on counter-attacks.",
    guideTipsDont3: "• 'Short Passing (Tiki Taka) + Low Skill Team': You will lose the ball inside your own penalty box."
};

const es = {
    ...en,
    guideGameGuideDesc: "Anatomía del Live Match Engine, matemáticas del motor de Tácticas y fórmulas de Economía.",
    guideTacticsTitle: "🎯 Pizarra Táctica (Mecánicas)",
    guideFinanceTitle: "💵 Finanzas, Reputación y Ligas",
    guideTipsTitle: "💡 Consejos Críticos de Mánager"
};
const fr = {
    ...en,
    guideGameGuideDesc: "Anatomie du Live Match Engine, mathématiques des Tactiques et formules de l'Économie.",
    guideTacticsTitle: "🎯 Tableau Tactique (Mécaniques)",
    guideFinanceTitle: "💵 Finances, Réputation & Ligues",
    guideTipsTitle: "💡 Astuces Critiques du Manager"
};
const id = {
    ...en,
    guideGameGuideDesc: "Anatomi Live Match Engine, matematika Mesin Taktik dan rumus Ekonomi.",
    guideTacticsTitle: "🎯 Papan Taktik (Mekanik Mesin)",
    guideFinanceTitle: "💵 Keuangan, Reputasi & Liga",
    guideTipsTitle: "💡 Tips Manajer Kritis"
};

const translations = { tr, en, es, fr, id };

locales.forEach(localeInfo => {
    const filePath = path.join(__dirname, '..', `locales`, `${localeInfo.lang}.ts`);
    let content = fs.readFileSync(filePath, 'utf8');

    const trans = Object.assign({}, en, translations[localeInfo.lang]);

    let newKeys = "";
    for (let key in trans) {
        const regex = new RegExp(`^\\s*${key}:.*$`, 'm');
        if (content.match(regex)) {
            content = content.replace(regex, `    ${key}: ${JSON.stringify(trans[key])},`);
        } else {
            newKeys += `    ${key}: ${JSON.stringify(trans[key])},\n`;
        }
    }

    if (newKeys.length > 0) {
        const targetString = `export const ${localeInfo.varConf} = {`;
        if (content.includes(targetString)) {
            content = content.replace(targetString, targetString + '\n' + newKeys);
        }
    }

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${localeInfo.lang}.ts with the rest of the guide translations.`);
});
