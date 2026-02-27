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
    guideMgmt_safe: "1. Temkinli (Safe)\nTop Çalma Gücü (effectiveDef): %15 Düşer (x0.85). Savunmacılar topa dalmak, ayak uzatmak yerine geri çekilip sadece pas açısı kapatmaya çalışır. Süratli rakip varsa içinden geçer.\nTackling Riski: En dip seviyededir (riskFactor = 0.6).\nOlaylar: Faul %6, Sarı %4, Kırmızı %0.2.\nNe Zaman Kullanılır: Ceza sahası etrafında tehlikeli yerlerden frikik/penaltı vermemek için.",
    guideMgmt_normal: "2. Normal (Normal)\nTop Çalma Gücü: Statik (x1.0). Oyuncu sadece kendi Tackling kalitesi kadar oynar.\nOlaylar: Faul %10, Sarı %8, Kırmızı %0.3.\nGizli 'Panik Faul': Yenik durumdaysan ve gol yiyorsan defans insiyatif alıp %40 güçle topa atlar ama faul riskini 2.5 kat zıplatır.",
    guideMgmt_aggressive: "3. Agresif (Aggressive)\nTop Çalma Gücü: %25 Artar (x1.25).\nTackling Riski: 2.2 katına çıkar.\nOlaylar: Faul %22, Sarı %14, Kırmızı %1.0.\nNe Zaman Kullanılır: Gegenpress yaparken takımı boğduğun anlarda.",
    guideMgmt_reckless: "4. Ölümüne / Kasap (Reckless)\nTop Çalma Gücü: %45 ARTAR (x1.45). Etten duvar olurlar.\nTackling Riski: İnanılmaz faul yaparlar (risk = 3.5).\nOlaylar: Faul %35, Sarı %25, Kırmızı %5.0 (Penaltıya eşit).\n'YILDIRMA ETKİSİ': Rakip forvete her sert girişte adamın moralini ve soğukkanlılığını gizlice ve kalıcı olarak ezer! Yıldızları döverek bezdirir.",

    guideAtt_att: "1. Hücum (Attacking)\nHücumda düz, cesur bireysel oynar. Şut İştahı: +60, Çalım: +50, Geri Pas: -50 ceza. Defans bile topla çıkar.",
    guideAtt_bal: "2. Dengeli (Balanced)\nEkstra buff/debuff yoktur. Her şey oyuncunun kendi zekasına (Decisions) bırakılır.",
    guideAtt_count: "3. Kontra Atak (Counter Attack)\nKendi sahasında sessizdir. Rakip yarı alana geçince Şut iştahı +140'a fırlar! Alan boşsa (+40 dribble). Dikine koşu paslarına %30 vizyon çarpanı gelir.",
    guideAtt_def: "4. Defansif (Defensive)\nSıfır risk. Defans topla çalım atamaz (-100). Sürekli geriye veya boşa güvenli pas atar (+80 pas). Kaleciyi oyalamaya çevirir.",
    guideAtt_poss: "5. Possession (Tiki-Taka)\nPas ve Geri Dönüş: +80 (Geri pas ödüllenir). Çalım Yasak: -15. Ancak Cambaz oyunculara özel +35 çalım serbestliği tanır!",

    guideAtt_risk_high: "1. Riskli Karar (Attacking Mentality)\nŞut İştahı: +25, Çalım +20, Geri Pas Cezası -10. Yenikken 70. dakikadan sonra GİZLİCE otomatik devreye girer!",
    guideAtt_risk_bal: "2. Dengeli Karar (Balanced Mentality)\n0 etki. Baskı (Pressure) ve Soğukkanlılık (Composure) ön plandadır.",
    guideAtt_risk_safe: "3. Temkinli Karar (Defensive Mentality)\nRiske girmez, zaman geçirir, şut atmaz. (Pas +25, Şut -20, Çalım -15).",

    guideWidth_nar: "1. Dar (Narrow)\nMerkeze sıkışık (%30 dar Y:34 eksen). Göbekten pas +15 çalım +10 tavan yapar ama kanattan çok ağır kontra yer.",
    guideWidth_bal: "2. Dengeli (Balanced)\nStandart konum (Katsayı 1.0).",
    guideWidth_wide: "3. Geniş (Wide)\nSahayı maksimum açar (%30 artış). Açıklar fırlamaya hazırdır (Çalım +20). Pas istatistiğin düşükse top rakipteyken araya çok çabuk girilir.",

    guidePass_short: "1. Kısa (Short): Paslaşma +50 bufflanır, şut ve çalım kesilir (-30). Sadece kale ağzında vururlar.",
    guidePass_mix: "2. Standart (Mix): Serbest",
    guidePass_dir: "3. Direkt (Direct): 2 saniye düşünmeden dikine +25 risk alır. Geri pas yasak (-50).",
    guidePass_long: "4. Uzun Top (Long Ball): Defans hiç topla çıkmaz (-20). Vurduğunu 50m ileri gönderir (+40 pas). Havadan şişirilir.",

    guideTempo_slow: "1. Yavaş (Slow): Düşünme zarı artar (+40 tick bekleme). Risksiz açılar beklenir.",
    guideTempo_norm: "2. Normal (Normal): Ortada.",
    guideTempo_fast: "3. Hızlı (Fast): 0 bekleme! Kondisyonu fena yakar, ayağı yavaş oyuncu panikten topu rakibe atar ama en seri kontraları çıkarır.",

    guideInst_work: "🛡️ Paslaşarak Gir: 20 metreden uzakta şuta cezası -50! Pas tavan +20 yapar.",
    guideInst_shoot: "🚀 Gördüğün Yerden Vur: 32 m'ye kadar kaleye girdiğinde +25 bonus. Önün açıksa +20 daha. Acımaz şut atar.",
    guideInst_roam: "🔄 Serbest Dolaş: Çalım +15 artar. Stoperler ileri gizli koşu, forvetler orta sahaya destek yapar. Disiplin %30 bozulur.",

    guideDef_pressStand: "Geride Karşıla (Stand Off): Forvetler top rakipteyken 30. metreye (defansın ağzına) gelir pas arası bekler.",
    guideDef_pressBal: "Dengeli (Balanced): Forvetler merkez çembere çekilir (45m).",
    guideDef_pressGegen: "Şok Pres (Gegenpress): Forvetler 55m'de (rakip defansında) kalır döner, takım YORGUNLUĞU katlanır.",

    guideDef_lineDeep: "Derin (Deep): Savunma çizgisi kalecinin kucağına (16m) kayar. Ara pas İMKANSIZ. Ama yay boş.",
    guideDef_lineNorm: "Normal (Norm): Çizgi 26m'de. Atletizm gerekir.",
    guideDef_lineHigh: "Önde (High): Çizgi 37m'de! Rakipleri ofsayt yapar ama kaleci yavaşsa havadan arkaya çok kolay kaçarlar.",

    guidePreset_1: "1. Gegenpress: Şok pres, direkt paslı hızlı tempo ile dar oyun. Genelde 4-2-3-1.",
    guidePreset_2: "2. Tiki-Taka: Normal pres, aşırı yavaş, kısa paslı dengeli genişlik. Pas ustasıyla 4-3-3.",
    guidePreset_3: "3. Total Futbol: Serbest dolaşım ile herkes saldırır savunur. Hızlı, dar. 4-3-3 ideal.",
    guidePreset_4: "4. Akıcı Kontra: Rakipten korkma, bekler ve hızlı fırla. Akışkan çalım ve şut bonusları ile. Geniş. 4-2-3-1.",
    guidePreset_5: "5. Hızlı Kontra: Savunmada darılışla rakibin açıklarını kollayan klasik direkt pas.",
    guidePreset_6: "6. Doldur Boşalt: Defanstan uzun şişir, uzun Kule forvet uzağı görsün. 4-4-2.",
    guidePreset_7: "7. Otobüs: Topun arkasına geç, alan savun, kaleciyle sakla 5-4-1.",
    guidePreset_8: "8. Kanat Oyunu: Çok geniş alanda kanat beklerinin yüksek tempolu hücumlarına bakar.",
    guidePreset_9: "9. Catenaccio: Kasıtlı rakip sakatlayan, rakip yıldızların moralini silen sert ama garantici kısa paslı savunma.",

    counterHighPress: 'Tehlike: Şok pres altındayız. Topu ayakta çok tutma (Tempo = Hızlı). Defans arkasındaki boşluklara "Uzun/Direkt Pas" ile sız!',
    counterPossession: 'Rakip topu vermiyor. Gegenpress ile boğ ya da tam tersi Derin Defans ("Geride Karşıla") ile sahanı kapat ve Kontraya çık.',
    counterCounter: 'Kontra arıyorlar. Savunma hattını çok öne ("High") çıkarma. "Temkinli" veya "Normal" agresiflikte kalarak kanatlara dikkat et.',
    counterDefensive: 'Otobüs çekiyorlar. Kesinlikle "Geniş" oyna, stoperleri iki yana aç. "Tempo" düşür, bıkmadan "Paslaşarak Gir" aramalıyız.',
    counterAttacking: 'Aşırı hücuma kalkıyorlar. Savunma arkasında dev boşluklar var. "Kontra" veya "Kanat Oyunu" ile arkaya uzun at, deparlı forvetler lazım!',
    counterBalanced: 'Taktikleri dengeli. Orta sahadaki ikili mücadeleleri kazanan fişi çeker. Takımın yıldızlarına dayalı standart oyununu oyna.'
};

const en = {
    guideMgmt_safe: "1. Safe\nEffective Defense: Falls by 15% (x0.85). Defenders back off to block passing lanes rather than tackle. Fast dribblers will bypass easily.\nTackling Risk: Lowest (riskFactor = 0.6).\nEvents: Foul 6%, Yellow 4%, Red 0.2%.\nWhen to use: Avoiding dangerous free-kicks/penalties.",
    guideMgmt_normal: "2. Normal\nEffective Defense: Static (x1.0).\nEvents: Foul 10%, Yellow 8%, Red 0.3%.\nSecret feature 'Panic Foul': If trailing and a striker is breaking away <=25m, defenders get +40% tackle power but 2.5x foul risk to stop at all costs.",
    guideMgmt_aggressive: "3. Aggressive\nEffective Defense: Rises 25% (x1.25).\nTackling Risk: 2.2x multiplier.\nEvents: Foul 22%, Yellow 14%, Red 1.0%.\nWhen to use: Gegenpressing and suffocating opponents.",
    guideMgmt_reckless: "4. Reckless (Butcher!)\nEffective Defense: Huge 45% BOOST.\nTackling Risk: Massive fouls (risk = 3.5).\nEvents: Foul 35%, Yellow 25%, Red 5.0% (Penalty range).\n'INTIMIDATION': Hard tackles permanently debuff the opponent striker's Composure & Morale!",

    guideAtt_att: "1. Attacking\nDirect and courageous. Shoot: +60, Dribble: +50, Backpass penalty: -50. Defenders advance.",
    guideAtt_bal: "2. Balanced\nNo buffs/debuffs. Relies entirely on player's Decisions and attributes.",
    guideAtt_count: "3. Counter Attack\nDeadly. In attacking third, shoot score jumps +140! Wide open space adds +40 dribble. Through balls get 30% vision multiplier.",
    guideAtt_def: "4. Defensive\nZero risk. Defenders cannot dribble (-100). Safe passing rewarded (+80).",
    guideAtt_poss: "5. Possession (Tiki-Taka)\nBackpass rewarded (+80). Dribbling strictly penalized (-15) EXCEPT for players with >85 Dribbling skill who get a +35 freedom buff.",

    guideAtt_risk_high: "1. Attacking Mentality\nShoot: +25, Dribble: +20, Backpass: -10. Automatically activates secretly if you are losing after 70th min!",
    guideAtt_risk_bal: "2. Balanced Mentality\nNeutral focus on Composure.",
    guideAtt_risk_safe: "3. Defensive Mentality\nTime wasting, low risk. (Pass +25, Shoot -20, Dribble -15).",

    guideWidth_nar: "1. Narrow\nLimits players to the center. Short passes & central dribbling excel, vulnerable to wing counters.",
    guideWidth_bal: "2. Balanced\nStandard width.",
    guideWidth_wide: "3. Wide\nMaximum pitch width. Dribbling thrives, but poor passing stats lead to easy interceptions.",

    guidePass_short: "1. Short: Passing +50 buff, shooting -30. Patience required.",
    guidePass_mix: "2. Mixed: Balanced AI.",
    guidePass_dir: "3. Direct: Forces vertical passes (+25). Backpass punished (-50).",
    guidePass_long: "4. Long Ball: Defenders yeet 50m forward balls (+40 pass). Striker strength needed.",

    guideTempo_slow: "1. Slow: High decision delay, patient.",
    guideTempo_norm: "2. Normal: Standard speed.",
    guideTempo_fast: "3. Fast: Zero wait ticks! Max counters, extreme stamina drain. Low skill players will panic pass.",

    guideInst_work: "🛡️ Work Ball Into Box: Prevents shooting outside 20m (-50 penalty). Box passes +20.",
    guideInst_shoot: "🚀 Shoot On Sight: Shoots eagerly within 32m (+25). Open spaces add +20.",
    guideInst_roam: "🔄 Roam: Chaos +15 dribble. Formation discipline drops by 30%.",

    guideDef_pressStand: "Stand Off: Forwards drop back to 30m away to defend deep.",
    guideDef_pressBal: "Balanced: Forwards hold 45m.",
    guideDef_pressGegen: "Gegenpress: Forwards lock high at 55m, immense stamina drain.",

    guideDef_lineDeep: "Deep Line (16m): Prevents through-balls entirely.",
    guideDef_lineNorm: "Normal Line (26m).",
    guideDef_lineHigh: "High Line (37m): Traps opponents, but extremely vulnerable to fast forwards.",

    guidePreset_1: "1. Gegenpress: High press, direct pass, narrow.",
    guidePreset_2: "2. Tiki-Taka: Slow, short, wide possession.",
    guidePreset_3: "3. Total Football: Free roam, fast, high line.",
    guidePreset_4: "4. Fluid Counter: Draw in, rapid wide attack.",
    guidePreset_5: "5. Rapid Counter: Deep block, direct pass.",
    guidePreset_6: "6. Route One: Target man long balls.",
    guidePreset_7: "7. Park The Bus: 5-4-1 deep defense.",
    guidePreset_8: "8. Wing Play: Wide fast wings.",
    guidePreset_9: "9. Catenaccio: Reckless dirty tackling, deep block.",

    counterHighPress: 'Danger: Extreme pressing! Don\'t hold the ball (Fast Tempo). Exploit spaces behind their high line with "Direct/Long Passes"!',
    counterPossession: 'They monopolize possession. Choke them with Gegenpress or do the opposite: use "Stand Off" (Deep Block) and hunt them on Counters.',
    counterCounter: 'Counter-attack alert. Do NOT play a "High" defensive line. Use "Safe" or "Normal" tackling and watch your flanks.',
    counterDefensive: 'They parked the bus! Exploit wide areas, tell your team to play "Wide". Drop tempo and relentlessly "Work Ball Into Box" to break the lock.',
    counterAttacking: 'Extreme attack detected. Huge gaps behind their defenders! Use "Counter" or "Wing Play" + Long passing for your fast forwards!',
    counterBalanced: 'Their setup is balanced. Midfield brawls will decide this match. Rely on your star players and stick to your core strengths.'
};

const es = {
    ...en,
    counterHighPress: '¡Peligro! Oponente con presión muy alta. No retengas el balón. Juega pases directos para superar líneas.',
    counterPossession: 'Nos quitan el balón. Usa presión Gegenpress para ahogar, o retírate y juega al contraataque defensivo.',
    counterCounter: 'Buscan el contraataque. No adelantes mucho la línea defensiva. Mantén entradas normales o seguras.',
    counterDefensive: 'El rival ha puesto el autobús. Juega por bandas ("Ancho"), baja el ritmo y busca pacientemente los huecos.',
    counterAttacking: 'Muy ofensivos, dejan espacios atrás. ¡El contraataque o el balones largos por bandas destrozarán su defensa!',
    counterBalanced: 'Táctica equilibrada. El partido se decidirá en el centro del campo y por talento individual.'
};

const fr = {
    ...en,
    counterHighPress: 'Danger: Pressing intense. Ne gardez pas la balle, passez en tempo rapide et lancez des passes longues pour sauter les lignes !',
    counterPossession: 'Ils confisquent le ballon. Utilisez le Gegenpress pour les étouffer, ou reculez défensivement pour jouer le contre.',
    counterCounter: 'Alerte Contre-Attaque. Ne montez pas trop votre ligne défensive et ne soyez pas trop agressif sur les tacles.',
    counterDefensive: 'L\'adversaire parque le bus. Étirez leur défense en jouant "Large", soyez patient avec "Jouer dans la surface".',
    counterAttacking: 'Système très offensif avec de grandes brèches derrière. Contrez leurs attaques et jouez de longs ballons aux attaquants !',
    counterBalanced: 'L\'adversaire est équilibré. S\'appuyer sur vos qualités fondamentales fera la différence au milieu de terrain.'
};

const id = {
    ...en,
    counterHighPress: 'Bahaya: Pressing sangat kuat. Lewati penjagaan mereka dengan tempo cepat dan umpan panjang.',
    counterPossession: 'Mereka menguasai bola. Lawan dengan Gegenpress untuk mencekik, atau mainkan pertahanan dalam (Stand Off) dan Serang Balik.',
    counterCounter: 'Ancaman Serangan Balik. Jangan naikkan garis pertahanan terlalu tinggi. Kurangi agresivitas.',
    counterDefensive: 'Lawan bertahan sangat dalam! Manfaatkan permainan sayap yang lebar (Wide). Rendahkan tempo dan cari celah (Work Ball Into Box).',
    counterAttacking: 'Mereka menyerang total dan meninggalkan celah besar di belakang pertahanan. Serangan balik atau sayap akan menghancurkan mereka!',
    counterBalanced: 'Tim lawan sangat seimbang. Pertandingan akan ditentukan oleh duel individu di lini tengah.'
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
        // Find the export block: 'export const TR_TRANSLATIONS = {'
        const targetString = `export const ${localeInfo.varConf} = {`;
        if (content.includes(targetString)) {
            content = content.replace(targetString, targetString + '\n' + newKeys);
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`Updated ${localeInfo.lang}.ts with new translations.`);
        } else {
            console.warn(`Could not find export block in ${localeInfo.lang}.ts`);
        }
    }
});
