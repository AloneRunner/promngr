const fs = require('fs');
const path = require('path');

const newTrKeys = {
    // 1. Training Center
    trainingBalancedDesc: "Genel kondisyonu ve formu korur.",
    trainingAttackingDesc: "Bitiriciliği ve pası artırır. Savunmayı düşürür.",
    trainingDefendingDesc: "Top kapmayı ve pozisyon almayı artırır. Hücumu düşürür.",
    trainingPhysicalDesc: "Hız ve gücü artırır. Yüksek yorgunluk riski.",
    trainingTechnicalDesc: "Dripling, vizyon ve top kontrolünü artırır.",
    trainingPositionBasedDesc: "Her oyuncu kendi pozisyonuna göre çalışır.",
    trainingActive: "AKTİF",
    trainingMechanicDesc: "Yenilenme ve gelişimi dengeleyin. Ağır antrenman oyuncuları daha hızlı geliştirir ama kondisyonu düşürür.",

    // 2. Transfer Market
    transferWindowOpen: "Transfer Dönemi Açık",
    dbPlayersCount: "DB: {count} Oyuncu",
    filterAll: "Tümü",
    filterGK: "KL",
    filterDEF: "DF",
    filterMID: "OS",
    filterFWD: "FV",
    statusListed: "Listede",
    statusNotListed: "Satılık Değil",
    statusFree: "Serbest",
    interestedPlayersOnly: "Sadece İlgilenen Oyuncular",
    hasAttribute: "Şu Özelliğe Sahip...",
    playerInfo: "Oyuncu Bilgisi",

    // 3. Match Screen (Live Match & Stats)
    liveStats: "Canlı İstatistikler",
    possession: "Topla Oynama",
    shots: "Şut",
    shotsOnTarget: "İsabetli",
    matchEventFreeKick: "Serbest Vuruş",
    matchEventBuildUp: "Savunmadan Çıkıyor",
    matchEventKickoff: "Santra",

    // 4. Manager Profile & Cups
    managerProfile: "Menajer Profili",
    currentTeam: "Mevcut Takım",
    weeklySalaryWord: "Haftalık Maaş",
    seasonWord: "Sezon",
    leagueTitleMatch: "Lig Şampiyonluğu",
    championsLeague: "Şampiyonlar Ligi",
    europaLeague: "Avrupa Ligi",
    careerHistory: "Kariyer Geçmişi",
    noCareerHistory: "Henüz kariyer geçmişi yok. İlk sezonunu tamamla!",
    cupPrizeInfo: "Kupa Ödül Bilgisi",
    roundOf16ToQF: "Son 16 → Çeyrek Final",
    qfToSf: "Çeyrek Final → Yarı Final",
    sfToFinal: "Yarı Final → Final",
    totalPrizeLabel: "Toplam",

    // 5. Player Details & Finance UI
    playingInStartingXI: "İlk 11'de Oynuyor",
    lastMoraleChanges: "Son Moral Değişiklikleri:",
    badFormAlert: "Kötü form",
    statusLabel: "Durum",
    nameLabel: "İsim",
    attrSpd: "Hız",
    attrSht: "Şut",
    attrPas: "Pas",
    attrDri: "Dri",
    attrDef: "Top",
    ticketSales: "Bilet Gelirleri",
    sponsorIncome: "Sponsor",
    winBonus: "Kazanma Primi",
    safeBankFinancial: "SafeBank Financial",

    // 6. Player Styles (X-Factor) Names
    styleCatReflexes: "Kedi Refleksi",
    styleSweeper: "Süpürücü",
    stylePenaltySaver: "Penaltı Canavarı",
    styleInterceptor: "Kesici",
    styleRock: "Kaya",
    styleRelentless: "Yorulmaz",
    stylePressResistant: "Prese Dayanıklı",
    styleRapid: "Fırtına",
    styleTrickster: "Cambaz",
    styleFirstTouch: "İlk Dokunuş",
    styleIncisivePass: "Delici Pas",
    styleMaestro: "Maestro",
    styleDeadBall: "Usta Ayak",
    styleFinesse: "Plaseci",
    styleRocket: "Füze",
    styleLob: "Aşırtma Ustası",
    styleAerialThreat: "Hava Topu Hakimi",
    styleLongRanger: "Uzun Mesafe Şutörü",
    styleShadowStriker: "Gölge Forvet",
    stylePoacher: "Fırsatçı",

    // League names
    italianCalcio: "İtalya Ligi",
    ligue1: "Ligue 1",
    eredivisie: "Eredivisie",
    belgianProLeague: "Belçika Pro Ligi",
    scotlandPremiership: "İskoçya Premiership",
    austriaBundesliga: "Avusturya Bundesliga",
    greeceSuperLeague: "Yunanistan Süper Ligi",
    russianPremierLeague: "Rusya Premier Ligi",
    romaniaSuperLiga: "Romanya SuperLiga",
    superSportHNL: "Hırvatistan HNL",
    superLiga: "Sırbistan SuperLiga",
    fortunaLiga: "Çekya Fortuna Liga",
    ekstraklasa: "Polonya Ekstraklasa",
    ligaProfesional: "Arjantin Liga Profesional",
    serieA: "Brezilya Série A",
    ligaBetPlay: "Kolombiya Liga BetPlay",
    campeonatoNacional: "Şili Campeonato Nacional",
    campeonatoUruguayo: "Uruguay Şampiyonası",
    primeraDivision: "Primera División",
    liga1: "Liga 1",
    saudiProLeague: "Suudi Pro Ligi",
    j1League: "J1 League",
    kLeague1: "K League 1",
    aLeagueMen: "A-League Men",
    chineseSuperLeague: "Çin Süper Ligi",
    npfl: "Nijerya NPFL",
    egyptianPremierLeague: "Mısır Premier Ligi",
    ligue1Algeria: "Cezayir Ligue 1",
    senegalPremierLeague: "Senegal Premier Ligi",
    moroccoBotolaPro: "Fas Botola Pro",
    southAfricaPSL: "Güney Afrika PSL",
    northAmericanLeague: "Kuzey Amerika Ligi",
    ligaMX: "Liga MX",
    ligue1Pro: "Gine Ligue 1 Pro",
    indianSuperLeague: "Hindistan Süper Ligi",
    primeiraLiga: "Portekiz Primeira Liga",
    ligaPro: "Ekvador Liga Pro",
    caribbeanSuperLeague: "Karayipler Süper Ligi",
    ligaSuperMalaysia: "Malezya Süper Ligi",
    kenyaPremierLeague: "Kenya Premier Ligi",
    ivoryCoastPremier: "Fildişi Sahili Premier Ligi",

    // Quick Fixes
    statusActive: "Aktif",
};

const filePath = path.join(__dirname, '..', `locales`, `tr.ts`);
let content = fs.readFileSync(filePath, 'utf8');

let newKeys = "";
for (let key in newTrKeys) {
    const regex = new RegExp(`^\\s*${key}:.*$`, 'm');
    if (content.match(regex)) {
        content = content.replace(regex, `    ${key}: ${JSON.stringify(newTrKeys[key])},`);
    } else {
        newKeys += `    ${key}: ${JSON.stringify(newTrKeys[key])},\n`;
    }
}

const targetString = `export const TR_TRANSLATIONS = {`;
if (content.includes(targetString)) {
    content = content.replace(targetString, targetString + '\n' + newKeys);
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Updated locals/tr.ts');
