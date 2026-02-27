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
    // Game Guide Sections
    guideBasicsTitle: "🎮 Oyuna Giriş & Temel Bilgiler",
    guideBasicsP1: "⚽ Sen bu oyunda takımın <strong>Menajerisin</strong>. Maç motoru 'Live Match Engine' teknolojisi ile çalışır. Arka planda zar atılmaz! Her saniye (50ms tick'lerle) sahadaki 22 oyuncunun nerede durduğuna, nereye koştuğuna ve pas açısına oyuncu özelliklerine göre tek tek karar verilir.",
    guideBasicsP2: "📅 Her hafta bir lig maçı oynanır. Ligde ilk 2 sıradaki takımlar Şampiyonlar Ligine, 3. ve 4. sıradakiler Avrupa Ligine gider.",
    guideBasicsP3: "📊 <strong>Kulüp Yönetimi (Board Confidence):</strong> Yönetimin sana olan güvenidir. %30'un altına düşerse <strong class='text-red-400'>KOVULURSUNUZ!</strong> Galibiyetler, kupa zaferleri güveni uçururken, derbilerde ezilmek ve iflas etmek dibe çeker.",

    guideAttrTitle: "👤 Oyuncu Özellikleri (Motor İçindeki Gerçek Etkileri)",
    guideAttrDesc: "Maç motoru tam 14 farklı istatistiği kullanarak şutların direkten dönmesine veya pasların adrese teslim olmasına karar verir. İşte özellikleri motor içindeki formüllerine göre açıklamaları:",
    guideTechTitle: "Teknik Özellikler",
    guideAttrFinishing: "Şut çekildiğinde topun kalenin neresine (köşelere mi yoksa auta veya kalecinin üstüne mi) gideceğini belirler. Ayrıca plase veya aşırtma yapabilme ihtimalini yükseltir.",
    guideAttrPassing: "Pas isabet oranıdır. Ayrıca pas hızını belirler. Pas değeri düşük adamın attığı ara pasları yerküreye çarparak (yavaş) gider ve defans araya kolayca girer.",
    guideAttrDribbling: "Rakip üzerine gelirken onu geçme (çalım atma) zarını atar, aynı zamanda oyuncunun topla ne kadar hızlı dönebildiğini (turn speed) belirler.",
    guideAttrTackling: "Savunmada rakibe müdahale yapıp topu temiz alma gücü. Düşük Tackling değeri yüksek Agresiflik ile birleşirse oyuncun Kasap gibi oynar ve kırmızı kart görür.",
    guideAttrGk: "Topu kurtarma refleksidir. Kaleciler ayrıca Positioning ve Composure kullanır.",

    guidePhysTitle: "Fiziksel Özellikler",
    guideAttrSpeed: "Motorda topsuz alanda depar gücüdür. Kontratağa çıkarken maksimum 'Sprint Hızı'nı belirler. Dikkat: Sürekli koşan oyuncunun Condition (Kondisyon) değeri maçtan maça erir.",
    guideAttrStamina: "Maç içerisindeki oksijeni taşıma kapasitesi. Dakika 70'den sonra Stamina düşerse tüm Teknik ve Zihinsel özellikleri %40'a varan oranlarda cezalandırılır. Yorulan adamı oyunda tutmak hatadır.",
    guideAttrStrength: "İkili mücadele zarını atar, oyuncunun topu ayağında saklama gücüdür.",
    guideAttrCondition: "Maça çıkarkenki form durumudur. Dinlenmeyen adam %60 kondisyonla maça başlarsa ilk yarı bitmeden sürünür.",

    guideMentalTitle: "Zihinsel Özellikler",
    guideAttrDecisions: "Yapay Zeka Beynidir! Oyuncu bir saniye içinde pas mı, şut mu atacak, çalıma mı girecek bunun 'matematiksel optimum' kararını bulma zekasıdır.",
    guideAttrPositioning: "Ofsayta düşmeme, rakip boş alan bulduğunda oraya sızma (Hücum) veya top rakipteyken pas açısını kapatma (Savunma) becerisidir.",
    guideAttrVision: "Boştaki takım arkadaşını hesaplayabilme (radar) menzilidir. Görüşü yüksek olan adam 50 metreden arkaya sarkan forveti görüp topu şişirebilir.",
    guideAttrComposure: "Rakip pres altındayken veya kaleciyle 1v1 kalınca Finishing (Bitirme) cezasını silen mucizevi özelliktir. Soğukkanlı adam panik yapmaz.",
    guideAttrAggression: "İkili mücadele isteğidir. Pres yoğunluğunu artırır ama faul/kart riskini de logaritmik olarak yükseltir.",

    guideStylesTitle: "✨ Oyuncu Tarzları (Kritik 20 X-Faktör)",
    guideStylesDesc: "Sadece aşağıdaki 'Kritik 20' yetenek motorda (X/Y eksen matematiklerinde) tetikleyicidir.",
    guideS_Gk: "🧤 Kaleciler",
    guideS_Gk1: "Yakın mesafe (ceza sahası içi) şutları çıkarma şansını zıplatır.",
    guideS_Gk2: "Defansın arkasına atılan paslara kalesini terkedip süpürmeye çıkar (Sweeper Keeper).",
    guideS_Gk3: "Sadece penaltılarda köşeyi tahmin etme oranını ciddi artırır.",
    guideS_Def: "🛡️ Savunma ve Direnç",
    guideS_Def1: "Atılan pasların arasına girme (Interception) menzilini ve hızını artırır.",
    guideS_Def2: "İkili mücadele ve omuz omuzalarda adamın ayakta kalmasını sağlar.",
    guideS_Def3: "Dakika 80 olsa dahi Stamina sıfırlanmaz, yorulma cezası yemez sürekli efor koyar.",
    guideS_Def4: "Rakip Gegenpress yaparken zihni bulanmaz, baskı altında hata oranını düşürür.",
    guideS_Move: "🏃‍♂️ Hareket ve Top Tekniği",
    guideS_Move1: "Koşu sırasında maksimum ivmeye ulaşma süresini kısaltır (Depar Ustası).",
    guideS_Move2: "Çalım atarken rakibin savunma zarını ekarte ederek geçme başarısını garantiler.",
    guideS_Move3: "Havadan veya sert gelen uzun topu pamuk gibi önüne alır. Rakibe kaptırmaz.",
    guideS_Pass: "🎯 Pas ve Oyun Kurma",
    guideS_Pass1: "Yerden atılan defans delici 'ara pasların' (Through Ball) isabetini artırır.",
    guideS_Pass2: "Vizyon radarını açar; 50 metre ilerideki defans arkasına sarkan adama pas çıkarabilir.",
    guideS_Pass3: "Duran toplarda kavis oranını artırarak, frikik/korner gol şansını roketler.",
    guideS_Shoot: "⚽ Şut ve Bitiricilik",
    guideS_Shoot1: "Şutlara kavis (Curve) basarak kalecinin uzanma mesafesini ve barajı aşmasını sağlar.",
    guideS_Shoot2: "Mesafe umursamaksızın topa inanılmaz bir mermi hızı katar.",
    guideS_Shoot3: "Kaleci açılmışsa veya forvet 1v1 kaldıysa aşırtma algoritmasını daha sık tetikler.",
    guideS_Shoot4: "Kafa toplarında ekstra sıçrama gücü ekler. Uzun santrfor veya defans için ölümcüldür.",
    guideS_Shoot5: "Ceza sahası dışından çekilen füzelerin kaleyi bulmasına ciddi isabet bonusu verir.",
    guideS_Men: "🧠 Zihinsel Roller",
    guideS_Men1: "Orta saha da olsa, atak gelişirken görünmez şekilde ceza sahasına 2. forvet gibi dalar.",
    guideS_Men2: "Defansa sıfır yardım eder, kontra atmak için bekler (Ofsayt kırma pusucusu).",

    // Missing values that may have broken UI
    pressGegen: "Gegenpress (Şok Pres)",
    tacticNarrow: "Dar",
    tacticBalanced: "Dengeli",
    tacticWide: "Geniş",
    tacticShort: "Kısa",
    tacticDirect: "Direkt",
    tacticLongBall: "Uzun Top"
};

const en = {
    guideBasicsTitle: "🎮 Intro & Core Basics",
    guideBasicsP1: "⚽ You are the <strong>Manager</strong>. The match uses 'Live Match Engine' tech. No simple dice rolls! Every 50ms, all 22 players decide coordinates, runs, and passing angles based strictly on their attributes.",
    guideBasicsP2: "📅 Play one league match per week. The top 2 teams go to the Champions League, 3rd and 4th go to the Europa League.",
    guideBasicsP3: "📊 <strong>Board Confidence:</strong> The board's trust in you. If it drops below 30%, you will be <strong class='text-red-400'>FIRED!</strong> Wins boost it, derby losses and bankruptcy destroy it.",

    guideAttrTitle: "👤 Attributes (Real Engine Impact)",
    guideAttrDesc: "The engine uses exactly 14 stats to calculate shots hitting the crossbar or passes landing perfectly. Here is how they work:",
    guideTechTitle: "Technical",
    guideAttrFinishing: "Determines shot trajectory (corners, wide, or right at the GK). Increases chances of successful chips and curved shots.",
    guideAttrPassing: "Passing accuracy and ball travel speed. Low passing means the ball drags on the grass and is easily intercepted.",
    guideAttrDribbling: "Calculates takeoff chance against a defender and limits the player's turning speed with the ball.",
    guideAttrTackling: "The power to cleanly steal the ball. Low tackling combined with high aggression makes your player a 'Butcher' (red card magnet).",
    guideAttrGk: "Shot-stopping reflex limit. GKs also heavily rely on Positioning and Composure.",

    guidePhysTitle: "Physical",
    guideAttrSpeed: "Off-the-ball sprint capability. Max sprint speed during counters. Note: Running relentlessly drains Condition.",
    guideAttrStamina: "Oxygen capacity. If Stamina plummets after min 70, technical and mental stats suffer up to a 40% penalty!",
    guideAttrStrength: "Physical duel success rate and ability to shield the ball.",
    guideAttrCondition: "Pre-match fitness. Starting a match below 60% condition means the player will collapse before half-time.",

    guideMentalTitle: "Mental",
    guideAttrDecisions: "The AI Brain! The intelligence to calculate the 'mathematical optimum' between passing, shooting, or dribbling every second.",
    guideAttrPositioning: "Offside avoidance, finding pockets of space (Attack), or blocking passing lanes (Defense).",
    guideAttrVision: "Radar range. High vision allows a player to spot a sprinting forward 50 meters away.",
    guideAttrComposure: "A miracle stat that negates finishing penalties when 1v1 with the GK or under heavy pressing. Calm players don't panic.",
    guideAttrAggression: "Duel eagerness. Increases pressing intensity but raises foul/card risks exponentially.",

    guideStylesTitle: "✨ Playstyles (Critical 20 X-Factors)",
    guideStylesDesc: "These 'Critical 20' traits directly alter mathematical formulas in the engine.",
    guideS_Gk: "🧤 Goalkeepers",
    guideS_Gk1: "Cat-like: Boosts close-range save probability.",
    guideS_Gk2: "Sweeper: Charges out of the box to intercept through-balls.",
    guideS_Gk3: "Penalty Saver: Significantly increases the chance to guess the correct corner.",
    guideS_Def: "🛡️ Defense & Resistance",
    guideS_Def1: "Interceptor: Increases range and speed of cutting passing lanes.",
    guideS_Def2: "Rock: Guarantees staying on feet during shoulder-to-shoulder duels.",
    guideS_Def3: "Relentless: Stamina never hits zero, immune to the 80th-minute fatigue penalty.",
    guideS_Def4: "Press Resistant: Ignores mental debuffs when opponents use Gegenpress.",
    guideS_Move: "🏃‍♂️ Movement & Technique",
    guideS_Move1: "Rapid: Reaches top acceleration instantly.",
    guideS_Move2: "Trickster: Bypasses the defender's tackling dice roll during dribbles.",
    guideS_Move3: "First Touch: Instantly controls long balls without losing momentum.",
    guideS_Pass: "🎯 Passing & Playmaking",
    guideS_Pass1: "Incisive Pass: Boosts the success rate of deep ground through-balls.",
    guideS_Pass2: "Maestro: Radar is fully unlocked; can execute 50-meter lobbed assists.",
    guideS_Pass3: "Dead Ball Specialist: Increases curve on free-kicks, rocketing goal chances.",
    guideS_Shoot: "⚽ Shooting & Finishing",
    guideS_Shoot1: "Finesse: Curves the shot, extending beyond the GK's reach.",
    guideS_Shoot2: "Rocket: Adds immense bullet velocity to the ball regardless of distance.",
    guideS_Shoot3: "Lob: Forces the chip logic more frequently when 1v1.",
    guideS_Shoot4: "Aerial Threat: Extra jumping power. Deadly on corners.",
    guideS_Shoot5: "Long Ranger: Massive accuracy bonus for shots outside the box.",
    guideS_Men: "🧠 Mental Roles",
    guideS_Men1: "Shadow Striker: Invades the box like a 2nd forward from the midfield.",
    guideS_Men2: "Poacher: Zero defensive work, waits on the offside line for counters.",

    pressGegen: "Gegenpress",
    tacticNarrow: "Narrow",
    tacticBalanced: "Bal",
    tacticWide: "Wide",
    tacticShort: "Short",
    tacticDirect: "Direct",
    tacticLongBall: "Long Ball"
};

const es = {
    ...en,
    guideBasicsTitle: "🎮 Conceptos Básicos",
    guideAttrTitle: "👤 Atributos (Efecto Real)",
    pressGegen: "Gegenpress",
    tacticShort: "Corto",
    tacticDirect: "Directo",
    tacticLongBall: "Largo"
};
const fr = {
    ...en,
    guideBasicsTitle: "🎮 Les Bases du Jeu",
    guideAttrTitle: "👤 Attributs (Impact Moteur)",
    pressGegen: "Gegenpress",
    tacticShort: "Court",
    tacticDirect: "Direct",
    tacticLongBall: "Long"
};
const id = {
    ...en,
    guideBasicsTitle: "🎮 Dasar Pemainan",
    guideAttrTitle: "👤 Atribut (Efek Nyata)",
    pressGegen: "Gegenpress",
    tacticShort: "Pendek",
    tacticDirect: "Langsung",
    tacticLongBall: "Melambung"
};
// Add fallback overrides to ensure they are definitely in the object

const translations = { tr, en, es, fr, id };

locales.forEach(localeInfo => {
    const filePath = path.join(__dirname, '..', `locales`, `${localeInfo.lang}.ts`);
    let content = fs.readFileSync(filePath, 'utf8');

    const trans = Object.assign({}, en, translations[localeInfo.lang]); // fallback to EN for missing keys

    let newKeys = "";
    for (let key in trans) {
        // We completely overwrite or inject
        // Using a regex to replace if exists, otherwise inject
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
    console.log(`Updated ${localeInfo.lang}.ts with deep guide translations.`);
});
