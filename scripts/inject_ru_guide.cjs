const fs = require('fs');
const path = require('path');

const locales = [
    { lang: 'tr', varConf: 'TR_TRANSLATIONS' },
    { lang: 'en', varConf: 'EN_TRANSLATIONS' },
    { lang: 'es', varConf: 'ES_TRANSLATIONS' },
    { lang: 'fr', varConf: 'FR_TRANSLATIONS' },
    { lang: 'id', varConf: 'ID_TRANSLATIONS' },
    { lang: 'ru', varConf: 'RU_TRANSLATIONS' }
];

const en = {
    // Basics
    guideBasicsTitle: "🎮 Intro & Core Basics",
    guideBasicsP1: "⚽ You are the <strong>Manager</strong>. The match uses 'Live Match Engine' tech. No simple dice rolls! Every 50ms, all 22 players decide coordinates, runs, and passing angles based strictly on their attributes.",
    guideBasicsP2: "📅 Play one league match per week. The top 2 teams go to the Champions League, 3rd and 4th go to the Europa League.",
    guideBasicsP3: "📊 <strong>Board Confidence:</strong> The board's trust in you. If it drops below 30%, you will be <strong class='text-red-400'>FIRED!</strong> Wins boost it, derby losses and bankruptcy destroy it.",
    // Attributes
    guideAttrTitle: "👤 Attributes (Real Engine Impact)",
    guideAttrDesc: "The engine uses exactly 14 stats to calculate shots hitting the crossbar or passes landing perfectly. Here is how they work:",
    guideTechTitle: "Technical",
    guideAttrFinishing: "Determines shot trajectory (corners, wide, or right at the GK). Increases chances of successful chips and curved shots.",
    guideAttrPassing: "Passing accuracy and ball travel speed. Low passing means the ball drags on the grass and is easily intercepted.",
    guideAttrDribbling: "Calculates takeoff chance against a defender and limits the player's turning speed with the ball.",
    guideAttrTackling: "The power to cleanly steal the ball. Low tackling combined with high aggression makes your player a red card magnet.",
    guideAttrGk: "Shot-stopping reflex limit. GKs also heavily rely on Positioning and Composure.",
    guidePhysTitle: "Physical",
    guideAttrSpeed: "Off-the-ball sprint capability. Max sprint speed during counters.",
    guideAttrStamina: "Oxygen capacity. If Stamina plummets after min 70, technical and mental stats suffer up to a 40% penalty!",
    guideAttrStrength: "Physical duel success rate and ability to shield the ball.",
    guideAttrCondition: "Pre-match fitness. Starting a match below 60% condition means the player will collapse before half-time.",
    guideMentalTitle: "Mental",
    guideAttrDecisions: "The AI Brain! The intelligence to calculate the 'mathematical optimum' between passing, shooting, or dribbling every second.",
    guideAttrPositioning: "Offside avoidance, finding pockets of space (Attack), or blocking passing lanes (Defense).",
    guideAttrVision: "Radar range. High vision allows a player to spot a sprinting forward 50 meters away.",
    guideAttrComposure: "A miracle stat that negates finishing penalties when 1v1 with the GK or under heavy pressing.",
    guideAttrAggression: "Duel eagerness. Increases pressing intensity but raises foul/card risks exponentially.",
    // Playstyles
    guideStylesTitle: "✨ Playstyles (Critical 20 X-Factors)",
    guideStylesDesc: "These traits directly alter mathematical formulas in the match engine.",
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
    guideGameGuideDesc: "Live Match Engine anatomy, Tactics engine mechanics and Economy formulas.",
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
    guideF_Eco2: "<strong>Ticket Sales:</strong> Earn money during home games. Capacity is the multiplier. Facilities are the key to wealth.",
    guideF_Eco3: "<strong>Sponsors & TV:</strong> Money given based on your league's quality and your team's table position.",
    guideF_Eco4: "<strong>European Cups:</strong> Winning European matches pays out huge Win Bonuses.",
    guideF_Rep: "📈 What is Reputation?",
    guideF_Rep1: "Reputation is your club's brand. If a player refuses to join, your reputation is too low!",
    guideF_Rep2: "Winning European trophies or league titles will boost your reputation up to 5 stars.",
    guideTipsTitle: "💡 Critical Manager Tips",
    guideTipsDo: "✅ MUST DO",
    guideTipsDo1: "• Have a backup for every position. Tired players perform poorly and get injured.",
    guideTipsDo2: "• If the opponent uses <strong>'Gegenpress'</strong>, play <strong>'Direct/Long Ball + Wide Width'</strong> to break the press!",
    guideTipsDo3: "• Keep the squad happy with <strong>Motivate</strong> training.",
    guideTipsDont: "❌ NEVER DO",
    guideTipsDont1: "• 'Playing a GK as a Defender': They will make huge mistakes.",
    guideTipsDont2: "• 'Reckless Press + High Line + Slow Defenders': You will be destroyed on counter-attacks.",
    guideTipsDont3: "• 'Short Passing (Tiki Taka) + Low Skill Team': You will lose the ball in your own penalty box."
};

const ru = {
    guideBasicsTitle: "🎮 Введение и Основы",
    guideBasicsP1: "⚽ Вы <strong>Менеджер</strong>. В игре используется 'Live Match Engine'. Никаких бросков кубиков! Каждые 50 мс все 22 игрока решают, куда бежать и как пасовать, основываясь строго на своих характеристиках.",
    guideBasicsP2: "📅 Играйте один матч лиги в неделю. Первые 2 команды выходят в Лигу Чемпионов, 3-я и 4-я - в Лигу Европы.",
    guideBasicsP3: "📊 <strong>Доверие Руководства:</strong> Если оно упадет ниже 30%, вас <strong class='text-red-400'>УВОЛЯТ!</strong> Победы повышают его, а поражения в дерби и банкротство - уничтожают.",
    guideAttrTitle: "👤 Характеристики (Влияние в Игре)",
    guideAttrDesc: "Движок использует ровно 14 характеристик для расчета ударов в перекладину или идеальных пасов. Вот как они работают:",
    guideTechTitle: "Техника",
    guideAttrFinishing: "Определяет траекторию удара. Повышает шансы на успешные перебросы и удары с подкруткой.",
    guideAttrPassing: "Точность и скорость паса. Низкий пас означает, что мяч медленно катится по траве и его легко перехватить.",
    guideAttrDribbling: "Рассчитывает шанс успеха при обводке защитника и ограничивает скорость разворота с мячом.",
    guideAttrTackling: "Способность чисто отобрать мяч. Низкий отбор в сочетании с высокой агрессией делает игрока магнитом для красных карточек.",
    guideAttrGk: "Предел рефлексов для отражения ударов. Вратари также сильно полагаются на Позицию и Хладнокровие.",
    guidePhysTitle: "Физика",
    guideAttrSpeed: "Скорость бега без мяча. Максимальная скорость спринта при контратаках.",
    guideAttrStamina: "Запас кислорода. Если выносливость падает после 70-й минуты, характеристики снижаются до 40%!",
    guideAttrStrength: "Успешность физической борьбы и способность закрывать мяч корпусом.",
    guideAttrCondition: "Предматчевая форма. Игрок с формой ниже 60% рухнет без сил еще до перерыва.",
    guideMentalTitle: "Психология",
    guideAttrDecisions: "Мозг ИИ! Умение вычислять 'математический оптимум' между пасом, ударом и ведением каждую секунду.",
    guideAttrPositioning: "Избегание офсайдов, поиск свободного пространства (в атаке) или перекрытие линий паса (в защите).",
    guideAttrVision: "Радиус радара. Высокое видение позволяет заметить нападающего в 50 метрах.",
    guideAttrComposure: "Хладнокровие. Чудо-параметр, который отменяет штрафы за точность при выходе 1 на 1 или под жестким прессингом.",
    guideAttrAggression: "Желание бороться. Повышает прессинг, но экспоненциально увеличивает риск фолов и карточек.",
    guideStylesTitle: "✨ Стили Игры (Критические 20 Х-Факторов)",
    guideStylesDesc: "Эти особенности напрямую изменяют формулы в движке матча.",
    guideS_Gk: "🧤 Вратари",
    guideS_Gk1: "Кошка: Повышает вероятность сейва с близкого расстояния.",
    guideS_Gk2: "Чистильщик: Выходит из штрафной для перехвата проникающих пасов.",
    guideS_Gk3: "Гроза Пенальти: Значительно повышает шанс угадать правильный угол.",
    guideS_Def: "🛡️ Защита",
    guideS_Def1: "Перехватчик: Увеличивает дальность и скорость перекрытия линий паса.",
    guideS_Def2: "Скала: Гарантирует устойчивость в борьбе плечом к плечу.",
    guideS_Def3: "Неутомимый: Выносливость никогда не падает до нуля.",
    guideS_Def4: "Стойкий к Прессингу: Игнорирует негативные эффекты при Гегенпрессинге соперника.",
    guideS_Move: "🏃‍♂️ Движение и Техника",
    guideS_Move1: "Быстрый: Мгновенно достигает максимального ускорения.",
    guideS_Move2: "Трюкач: Обходит бросок кубика защитника при обводке.",
    guideS_Move3: "Первое Касание: Мгновенно контролирует длинные передачи.",
    guideS_Pass: "🎯 Пасы",
    guideS_Pass1: "Разрезающий Пас: Повышает успешность глубоких пасов низом.",
    guideS_Pass2: "Маэстро: Радар полностью разблокирован, может отдавать голевые пасы на 50 метров.",
    guideS_Pass3: "Мастер Стандартов: Сильно закручивает штрафные, повышая шанс гола.",
    guideS_Shoot: "⚽ Удары",
    guideS_Shoot1: "На Исполнение: Закручивает мяч за пределы досягаемости вратаря.",
    guideS_Shoot2: "Пушка: Придает мячу огромную скорость независимо от дистанции.",
    guideS_Shoot3: "Парашют: Чаще использует переброс вратаря в ситуациях 1 на 1.",
    guideS_Shoot4: "Угроза в Воздухе: Дополнительная сила прыжка на угловых.",
    guideS_Shoot5: "Дальний Удар: Огромный бонус к точности при ударах из-за штрафной.",
    guideS_Men: "🧠 Ментальные Роли",
    guideS_Men1: "Теневой Нападающий: Врывается в штрафную как второй форвард.",
    guideS_Men2: "Браконьер: Ноль помощи в защите, ждет на линии офсайда для контр.",
    guideGameGuideDesc: "Анатомия Live Match Engine, механика тактики и экономики.",
    guideTacticsTitle: "🎯 Тактическая Доска (В Игре)",
    guideTacticsDesc: "Ваши тактики на 100% меняют алгоритм поведения команды 20 раз в секунду.",
    guideT_Defense: "🛡️ ОСНОВА (Агрессия Защиты)",
    guideT_Attack: "🔥 АТАКА (Философия)",
    guideT_Mentality: "🧠 Принятие Решений (Менталитет)",
    guideT_Width: "📏 Ширина Поля",
    guideT_PassTempo: "⚽ Стиль Паса и ⏱️ Темп",
    guideT_Instructions: "🎯 Инструкции Игрокам",
    guideT_DefLinePress: "🧱 ЗАЩИТА (Блок и Прессинг)",
    guideT_PressIntensity: "🔥 Интенсивность Прессинга",
    guideT_DefLine: "📏 Линия Защиты",
    guideT_Presets: "⭐ ТАКТИЧЕСКИЕ ПРЕСЕТЫ",
    guideFinanceTitle: "💵 Финансы, Репутация и Лиги",
    guideFinanceDesc: "Обанкротьтесь — и совет директоров вас уволит.",
    guideF_Eco: "💸 Экономика",
    guideF_Eco1: "<strong>Зарплаты:</strong> Состав съедает огромную часть денег еженедельно.",
    guideF_Eco2: "<strong>Билеты:</strong> Зарабатывайте дома. Инфраструктура — ключ к успеху.",
    guideF_Eco3: "<strong>Спонсоры и ТВ:</strong> Зависит от вашей лиги и уровня.",
    guideF_Eco4: "<strong>Еврокубки:</strong> Невероятные бонусы за победы в турнирах.",
    guideF_Rep: "📈 Репутация клуба",
    guideF_Rep1: "Она решает всё. Игроки не перейдут в неизвестный клуб.",
    guideF_Rep2: "Побеждайте в Европе, чтобы расти до 5 звезд.",
    guideTipsTitle: "💡 Критические Советы",
    guideTipsDo: "✅ ОБЯЗАТЕЛЬНО",
    guideTipsDo1: "• Всегда держите ротацию. Уставшие игроки получают травмы.",
    guideTipsDo2: "• Соперник играет <strong>'Гегенпрессинг'</strong>? Жмите <strong>'Длинный Пас + Широко'</strong> и разбивайте их.",
    guideTipsDo3: "• Поднимайте мораль парням тренировками.",
    guideTipsDont: "❌ НИКОГДА",
    guideTipsDont1: "• 'Вратарь в Защите': Приведет к миллиону ошибок.",
    guideTipsDont2: "• 'Агрессия + Высокая Линия + Медленные защитники': Смерть от контратак.",
    guideTipsDont3: "• 'Тики-Така + Слабый состав': Приведет к перехватам в своей вратарской."
};

const translations = { ru }; // We only need to deeply update RU for this specific run since TR,EN,ES,FR,ID are properly set above and before, but let's just push RU safely without rewriting all EN fallback, just standard assign.

locales.forEach(localeInfo => {
    if (localeInfo.lang !== 'ru') return; // Only process RU this time since others are pristine now. 

    const filePath = path.join(__dirname, '..', `locales`, `${localeInfo.lang}.ts`);
    if (!fs.existsSync(filePath)) {
        console.log('File not found:', filePath); return;
    }
    let content = fs.readFileSync(filePath, 'utf8');

    const trans = Object.assign({}, en, translations[localeInfo.lang] || {});

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
    console.log(`Updated localized content exclusively for ${localeInfo.lang}.ts`);
});
