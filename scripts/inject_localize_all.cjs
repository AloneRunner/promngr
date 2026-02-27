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
    // Basics
    guideBasicsTitle: "🎮 Oyuna Giriş & Temel Bilgiler",
    guideBasicsP1: "⚽ Sen bu oyunda takımın <strong>Menajerisin</strong>. Maç motoru 'Live Match Engine' teknolojisi ile çalışır. Arka planda zar atılmaz! Her saniye (50ms tick'lerle) sahadaki 22 oyuncunun nerede durduğuna, nereye koştuğuna ve pas açısına oyuncu özelliklerine göre tek tek karar verilir.",
    guideBasicsP2: "📅 Her hafta bir lig maçı oynanır. Ligde ilk 2 sıradaki takımlar Şampiyonlar Ligine, 3. ve 4. sıradakiler Avrupa Ligine gider.",
    guideBasicsP3: "📊 <strong>Kulüp Yönetimi (Board Confidence):</strong> Yönetimin sana olan güvenidir. %30'un altına düşerse <strong class='text-red-400'>KOVULURSUNUZ!</strong> Galibiyetler, kupa zaferleri güveni uçururken, derbilerde ezilmek ve iflas etmek dibe çeker.",
    // Attributes
    guideAttrTitle: "👤 Oyuncu Özellikleri (Motor İçindeki Gerçek Etkileri)",
    guideAttrDesc: "Maç motoru tam 14 farklı istatistiği kullanarak şutların direkten dönmesine veya pasların adrese teslim olmasına karar verir. İşte özellikleri motor içindeki formüllerine göre açıklamaları:",
    guideTechTitle: "Teknik Özellikler",
    guideAttrFinishing: "Şut çekildiğinde topun kalenin neresine gideceğini belirler. Ayrıca plase veya aşırtma yapabilme ihtimalini yükseltir.",
    guideAttrPassing: "Pas isabet oranıdır ve pas hızını belirler. Pas değeri düşükse top yavaş gider ve defans araya girer.",
    guideAttrDribbling: "Rakibi geçme zarını atar, oyuncunun topla ne kadar hızlı dönebildiğini belirler.",
    guideAttrTackling: "Rakibe müdahale yapıp topu temiz alma gücü. Düşük yetenek + yüksek agresiflik oyuncunu kırmızı kart mıknatısına çevirir.",
    guideAttrGk: "Topu kurtarma refleksidir. Kaleciler ayrıca Positioning ve Composure kullanır.",
    guidePhysTitle: "Fiziksel Özellikler",
    guideAttrSpeed: "Topsuz alanda depar gücüdür. Kontratağa çıkarken maksimum 'Sprint Hızı'nı belirler.",
    guideAttrStamina: "Dayanıklılık. Dakika 70'den sonra Stamina düşerse tüm özellikler %40'a varan oranlarda cezalandırılır.",
    guideAttrStrength: "İkili mücadele zarını atar, topu ayağında saklama gücüdür.",
    guideAttrCondition: "Maça çıkarkenki kondisyon durumudur. %60 kondisyonla başlayan oyuncu ilk yarı bitmeden sürünür.",
    guideMentalTitle: "Zihinsel Özellikler",
    guideAttrDecisions: "Yapay Zeka Beynidir! Pas, şut veya çalım için 'matematiksel optimum' kararını bulma zekasıdır.",
    guideAttrPositioning: "Ofsayta düşmeme, boş alana sızma veya top rakipteyken pas açısını kapatma becerisidir.",
    guideAttrVision: "Görüş radarıdır. Görüşü yüksek oyuncu 50 metreden arkaya sarkan forveti görebilir.",
    guideAttrComposure: "Soğukkanlılık. Pres altındayken veya kaleciyle 1v1 kalınca Finishing cezasını silen özelliktir.",
    guideAttrAggression: "İkili mücadele isteğidir. Presi artırır ama faul/kart riskini de logaritmik olarak yükseltir.",
    // Playstyles
    guideStylesTitle: "✨ Oyuncu Tarzları (Kritik 20 X-Faktör)",
    guideStylesDesc: "Sadece aşağıdaki 'Kritik 20' yetenek motorda doğrudan mekanik tetikleyicidir.",
    guideS_Gk: "🧤 Kaleciler",
    guideS_Gk1: "Yakın mesafe şutları çıkarma şansını zıplatır.",
    guideS_Gk2: "Defansın arkasına atılan paslara kalesini terkedip süpürmeye çıkar.",
    guideS_Gk3: "Sadece penaltılarda köşeyi tahmin etme oranını ciddi artırır.",
    guideS_Def: "🛡️ Savunma ve Direnç",
    guideS_Def1: "Atılan pasların arasına girme menzilini ve hızını artırır.",
    guideS_Def2: "Omuz omuzalarda oyuncunun ayakta kalmasını sağlar.",
    guideS_Def3: "Dakika 80 olsa dahi Stamina sıfırlanmaz, yorulma cezası yemez.",
    guideS_Def4: "Rakip Gegenpress yaparken zihni bulanmaz, hata oranını düşürür.",
    guideS_Move: "🏃‍♂️ Hareket ve Top Tekniği",
    guideS_Move1: "Koşu sırasında maksimum ivmeye ulaşma süresini kısaltır.",
    guideS_Move2: "Çalım atarken rakibin savunma zarını ekarte ederek geçme başarısını iyileştirir.",
    guideS_Move3: "Havadan veya sert gelen uzun topu pamuk gibi önüne alır.",
    guideS_Pass: "🎯 Pas ve Oyun Kurma",
    guideS_Pass1: "Yerden atılan defans delici ara pasların isabetini artırır.",
    guideS_Pass2: "Vizyon radarını açar; 50 metre ilerideki adama pas çıkarabilir.",
    guideS_Pass3: "Duran toplarda kavis oranını artırarak frikik gol şansını roketler.",
    guideS_Shoot: "⚽ Şut ve Bitiricilik",
    guideS_Shoot1: "Şutlara kavis basarak kalecinin uzanma mesafesini aşmasını sağlar.",
    guideS_Shoot2: "Mesafe umursamaksızın topa inanılmaz bir mermi hızı katar.",
    guideS_Shoot3: "1v1 kalınca aşırtma algoritmasını daha sık tetikler.",
    guideS_Shoot4: "Kafa toplarında ekstra sıçrama gücü ekler.",
    guideS_Shoot5: "Ceza sahası dışından çekilen füzelerin kaleyi bulmasına bonus verir.",
    guideS_Men: "🧠 Zihinsel Roller",
    guideS_Men1: "Atak gelişirken görünmez şekilde ceza sahasına 2. forvet gibi dalar.",
    guideS_Men2: "Defansa hiç yardım etmez, kontra atmak için ofsayt çizgisinde bekler.",

    // Tactical Board
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

    // Finance
    guideFinanceTitle: "💵 Finans Sistemi, İtibar ve Lig",
    guideFinanceDesc: "Batarsan, yönetimin sana olan sabrı anında biter.",
    guideF_Eco: "💸 Ekonomi Neden Etkilenir?",
    guideF_Eco1: "<strong>Maaşlar (Wages):</strong> Kadrodaki her adam sana haftalık borç yazar.",
    guideF_Eco2: "<strong>Bilet Gelirleri:</strong> İç sahadaki maçlarda para kazanırsın. Stadyum kapasiten bunu böler/çarpar. Tesis geliştirmek şarttır.",
    guideF_Eco3: "<strong>Sponsor & Yayın:</strong> Ligin kalitesine ve takımın Ligdeki puan sırasına göre verilen paradır.",
    guideF_Eco4: "<strong>Avrupa Kupaları:</strong> Avrupa maçları kazanmak muazzam primler (Win Bonus) öder.",
    guideF_Rep: "📈 İtibar (Reputation) Nedir?",
    guideF_Rep1: "İtibar kulübünün markasıdır. Oyuncu 'Bu takıma gelmem' diyorsa itibar yetmiyordur.",
    guideF_Rep2: "Avrupa şampiyonlukları, lig maçları kazanmak ve yıldız oyuncular almak itibarınızı artırır.",

    // Tips
    guideTipsTitle: "💡 Kritik Menajer Tavsiyeleri",
    guideTipsDo: "✅ MUTLAKA YAPIN",
    guideTipsDo1: "• Her pozisyon için yedeğiniz olsun. Yorulan adam performanstan düşer ve sakatlanır.",
    guideTipsDo2: "• Rakip <strong>'Gegenpress'</strong> yapıyorsa, <strong>'Uzun Top + Geniş (Wide)'</strong> oyna. Presi kırıp defansın arkasına sarkarsın!",
    guideTipsDo3: "• Takımı <strong>'Motivasyon'</strong> antrenmanlarıyla mutlu tut.",
    guideTipsDont: "❌ ASLA YAPMAYIN",
    guideTipsDont1: "• 'Kaleciyi Defansta Oynatmak': %80 hata payıyla oynamaya başlar.",
    guideTipsDont2: "• 'Ölümüne Pres + Yüksek Çizgi + Yavaş Defans': Kontrataklarda delik deşik ederler.",
    guideTipsDont3: "• 'Kısa Pas (Tiki Taka) + Tekniksiz Takım': Ceza sahasında paslaşırken gol yersin."
};

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

    // Tactical Board
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

    // Finance
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

    // Tips
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

const fr = {
    guideBasicsTitle: "🎮 Intro & Bases du Jeu",
    guideBasicsP1: "⚽ Vous êtes le <strong>Manager</strong>. Le match utilise le 'Live Match Engine'. Pas de simples lancers de dés ! Chaque 50ms, les 22 joueurs décident de leurs coordonnées, courses et passes selon leurs attributs.",
    guideBasicsP2: "📅 Un match de ligue par semaine. Les 2 premiers vont en Ligue des Champions, les 3ème et 4ème en Europa League.",
    guideBasicsP3: "📊 <strong>Confiance du CA :</strong> Si elle tombe sous 30%, vous serez <strong class='text-red-400'>VIRÉ !</strong> Les victoires l'augmentent, la faillite la détruit.",
    // Attributes
    guideAttrTitle: "👤 Attributs (Impact Moteur Réel)",
    guideAttrDesc: "Le moteur utilise 14 statistiques pour calculer les tirs et les passes. Voici comment elles fonctionnent :",
    guideTechTitle: "Technique",
    guideAttrFinishing: "Détermine la trajectoire du tir. Augmente les chances de lobs réussis.",
    guideAttrPassing: "Précision et vitesse des passes. Une stat faible signifie des passes lentes facilement interceptées.",
    guideAttrDribbling: "Calcule la chance de dribbler un défenseur et la vitesse de rotation avec le ballon.",
    guideAttrTackling: "Capacité à voler proprement le ballon. Tacle faible + Agression = Aimant à carton rouge.",
    guideAttrGk: "Limite de réflexe pour arrêter les tirs.",
    guidePhysTitle: "Physique",
    guideAttrSpeed: "Vitesse de sprint sans ballon. Vitesse max lors des contre-attaques.",
    guideAttrStamina: "Capacité en oxygène. Si elle chute après la 70e minute, les stats baissent de 40% !",
    guideAttrStrength: "Taux de réussite des duels physiques et capacité à protéger le ballon.",
    guideAttrCondition: "Forme avant match. Sous 60%, le joueur s'écroulera avant la mi-temps.",
    guideMentalTitle: "Mental",
    guideAttrDecisions: "L'Intelligence Artificielle ! Capacité à faire le choix 'mathématique optimum'.",
    guideAttrPositioning: "Éviter le hors-jeu, trouver des espaces libres ou bloquer les lignes de passes.",
    guideAttrVision: "Portée du radar. Permet de voir un attaquant sprinter à 50 mètres.",
    guideAttrComposure: "Sang-froid. Annule les malus de finition en 1v1 ou sous forte pression.",
    guideAttrAggression: "Désir de duel. Augmente le pressing mais explose le risque de fautes/cartons.",
    // Playstyles
    guideStylesTitle: "✨ Styles de Jeu (Les 20 Facteurs X)",
    guideStylesDesc: "Ces 20 traits modifient directement les formules du moteur.",
    guideS_Gk: "🧤 Gardiens de but",
    guideS_Gk1: "Réflexes de Chat : Boost les arrêts à bout portant.",
    guideS_Gk2: "Libéro : Sort de sa surface pour intercepter les passes en profondeur.",
    guideS_Gk3: "Tueur de Penalty : Augmente sérieusement la chance de trouver le bon côté.",
    guideS_Def: "🛡️ Défense",
    guideS_Def1: "Intercepteur : Augmente la portée de coupure des lignes de passes.",
    guideS_Def2: "Roc : Reste toujours debout lors des duels physiques.",
    guideS_Def3: "Infatigable : L'Endurance ne tombe jamais à zéro.",
    guideS_Def4: "Résistant à la Pression : Ignore les malus quand l'adversaire fait un Gegenpress.",
    guideS_Move: "🏃‍♂️ Mouvement",
    guideS_Move1: "Rapide : Atteint l'accélération maximale instantanément.",
    guideS_Move2: "Dribbleur: Contourne le jet de dé du défenseur lors des dribbles.",
    guideS_Move3: "Première Touche : Contrôle instantanément les longs ballons.",
    guideS_Pass: "🎯 Passes",
    guideS_Pass1: "Passe Incisive : Boost les passes au sol en profondeur.",
    guideS_Pass2: "Maestro : Radar totalement débloqué pour les passes de 50 mètres.",
    guideS_Pass3: "Balles Arrêtées : Augmente l'effet sur les coups francs.",
    guideS_Shoot: "⚽ Tirs",
    guideS_Shoot1: "Finesse : Effet enroulé sur le tir.",
    guideS_Shoot2: "Roquette : Balle ultra rapide quelle que soit la distance.",
    guideS_Shoot3: "Lob : Force la logique du lob en 1v1.",
    guideS_Shoot4: "Menace Aérienne : Puissance de saut supplémentaire.",
    guideS_Shoot5: "Tir Lointain : Bonus massif pour les tirs de loin.",
    guideS_Men: "🧠 Rôles Mentaux",
    guideS_Men1: "Ombre : Envahit la surface comme 2ème attaquant.",
    guideS_Men2: "Renard : Zéro défense, attend le hors-jeu pour les contres.",

    // Tactical Board
    guideGameGuideDesc: "Anatomie du Live Match Engine, mécaniques des tactiques et économie.",
    guideTacticsTitle: "🎯 Tableau Tactique (Mécaniques)",
    guideTacticsDesc: "Vos tactiques modifient les ordres envoyés 20 fois par seconde aux (X,Y).",
    guideT_Defense: "🛡️ BASE (Agressivité Défensive)",
    guideT_Attack: "🔥 ATTAQUE (Philosophie)",
    guideT_Mentality: "🧠 Décision (Mentalité)",
    guideT_Width: "📏 Largeur",
    guideT_PassTempo: "⚽ Style de Passe & ⏱️ Tempo",
    guideT_Instructions: "🎯 Instructions Joueurs",
    guideT_DefLinePress: "🧱 DÉFENSE (Bloc et Pressing)",
    guideT_PressIntensity: "🔥 Intensité du Pressing",
    guideT_DefLine: "📏 Ligne Défensive",
    guideT_Presets: "⭐ PRÉSETS TACTIQUES",

    // Finance
    guideFinanceTitle: "💵 Finances, Réputation & Ligues",
    guideFinanceDesc: "Si vous faites faillite, c'est la fin.",
    guideF_Eco: "💸 L'économie",
    guideF_Eco1: "<strong>Salaires:</strong> Chaque joueur coûte de l'argent par semaine.",
    guideF_Eco2: "<strong>Billets:</strong> Gagnez à domicile. Les installations sont clés.",
    guideF_Eco3: "<strong>Sponsors/TV:</strong> Argent selon la ligue et le classement.",
    guideF_Eco4: "<strong>Europe:</strong> Gagner des matchs rapporte d'énormes bonus.",
    guideF_Rep: "📈 Qu'est-ce que la Réputation ?",
    guideF_Rep1: "La marque du club. Sans réputation, personne ne vient.",
    guideF_Rep2: "Gagner la Ligue ou l'Europe augmente la réputation jusqu'à 5 étoiles.",

    // Tips
    guideTipsTitle: "💡 Astuces de Manager",
    guideTipsDo: "✅ À FAIRE",
    guideTipsDo1: "• Ayez un remplaçant pour chaque poste.",
    guideTipsDo2: "• Face au <strong>'Gegenpress'</strong>, jouez <strong>'Direct + Large'</strong> pour casser la pression !",
    guideTipsDo3: "• Gardez l'équipe heureuse via l'entraînement <strong>Motivation</strong>.",
    guideTipsDont: "❌ NE JAMAIS FAIRE",
    guideTipsDont1: "• Gardien en Défense : Vous allez prendre 5 buts.",
    guideTipsDont2: "• Pressing Fou + Ligne Haute + Défenseurs Lents : Destruction par contre-attaques.",
    guideTipsDont3: "• Tiki Taka avec une mauvaise équipe : Perte de balle dans votre surface."
};

const es = {
    guideBasicsTitle: "🎮 Intro y Conceptos Clave",
    guideBasicsP1: "⚽ Eres el <strong>Mánager</strong>. El partido usa el 'Live Match Engine'. Nada de simples dados; cada 50ms los 22 jugadores deciden qué hacer según sus atributos.",
    guideBasicsP2: "📅 Un partido por semana. Los 2 primeros van a Champions, 3º y 4º a Europa League.",
    guideBasicsP3: "📊 <strong>Confianza de la Directiva:</strong> Si cae debajo del 30%, ¡estás <strong class='text-red-400'>DESPEDIDO!</strong>",
    guideAttrTitle: "👤 Atributos (Impacto Real)",
    guideAttrDesc: "El motor usa 14 estadísticas para cada tiro y pase. Así funcionan:",
    guideTechTitle: "Técnica",
    guideAttrFinishing: "Trayectoria del tiro. Mejora los tiros con efecto y vaselinas.",
    guideAttrPassing: "Precisión y velocidad de pase. Pases lentos son interceptados fácil.",
    guideAttrDribbling: "Velocidad de giro y éxito en el regate.",
    guideAttrTackling: "Corte de balón. Mucha agresividad y poco corte = Tarjeta Roja.",
    guideAttrGk: "Reflejo para atajar. Los porteros también usan Posicionamiento y Compostura.",
    guidePhysTitle: "Física",
    guideAttrSpeed: "Velocidad de sprint sin balón para contraataques.",
    guideAttrStamina: "Capacidad de oxígeno. Si baja al minuto 70, ¡penalización del 40% en todo!",
    guideAttrStrength: "Fuerza para proteger el balón y duelos cuerpo a cuerpo.",
    guideAttrCondition: "Forma física inicial. Menos de 60% = agotamiento en el primer tiempo.",
    guideMentalTitle: "Mental",
    guideAttrDecisions: "¡El cerebro IA! Calcular el óptimo entre pasar, tirar o correr.",
    guideAttrPositioning: "Evitar fuera de juego y tapar líneas de pase defensivas.",
    guideAttrVision: "Rango del radar. Permite ver delanteros a 50 metros.",
    guideAttrComposure: "Compostura. Evita que el jugador entre en pánico al tirar frente al portero.",
    guideAttrAggression: "Aumenta la presión, pero sube el riesgo de faltas.",
    guideStylesTitle: "✨ Estilos de Juego (20 Factores Críticos)",
    guideStylesDesc: "Modifican directamente las fórmulas matemáticas del simulador.",
    guideS_Gk: "🧤 Porteros", guideS_Gk1: "Felino.", guideS_Gk2: "Líbero.", guideS_Gk3: "Para-penaltis.",
    guideS_Def: "🛡️ Defensa", guideS_Def1: "Interceptor.", guideS_Def2: "Roca.", guideS_Def3: "Incansable.", guideS_Def4: "Resistente a la presión.",
    guideS_Move: "🏃‍♂️ Movimiento", guideS_Move1: "Rápido.", guideS_Move2: "Regateador.", guideS_Move3: "Primer Toque.",
    guideS_Pass: "🎯 Pases", guideS_Pass1: "Pase Incisivo.", guideS_Pass2: "Maestro.", guideS_Pass3: "A balón parado.",
    guideS_Shoot: "⚽ Tiros", guideS_Shoot1: "Calidad.", guideS_Shoot2: "Misil.", guideS_Shoot3: "Vaselina.", guideS_Shoot4: "Amenaza aérea.", guideS_Shoot5: "Cañonero.",
    guideS_Men: "🧠 Mentales", guideS_Men1: "Segundo Delantero.", guideS_Men2: "Cazagoles.",

    guideGameGuideDesc: "Anatomía del motor de partidos en vivo, tácticas y fórmulas económicas.",
    guideTacticsTitle: "🎯 Pizarra Táctica (Mecánicas)",
    guideTacticsDesc: "Atención: Las tácticas cambian el comportamiento del motor de simulación 20 veces por segundo.",
    guideT_Defense: "🛡️ DEFENSA", guideT_Attack: "🔥 ATAQUE", guideT_Mentality: "🧠 Mentalidad",
    guideT_Width: "📏 Amplitud", guideT_PassTempo: "⚽ Pase y Tempo", guideT_Instructions: "🎯 Instrucciones",
    guideT_DefLinePress: "🧱 LÍNEA D., PRESIÓN", guideT_PressIntensity: "Presión", guideT_DefLine: "Línea D.", guideT_Presets: "⭐ TÁCTICAS PRECARGADAS",

    guideFinanceTitle: "💵 Finanzas, Reputación y Ligas",
    guideFinanceDesc: "La bancarrota te llevará al despido.",
    guideF_Eco: "💸 ¿Qué afecta a la economía?",
    guideF_Eco1: "<strong>Salarios:</strong> Gasto semanal.", guideF_Eco2: "<strong>Entradas:</strong> Las taquillas del estadio.",
    guideF_Eco3: "<strong>Sponsors:</strong> Por la Liga.", guideF_Eco4: "<strong>Europa:</strong> Grandes bonos.",
    guideF_Rep: "📈 Reputación", guideF_Rep1: "Jugadores rechazarán fichar si es baja.", guideF_Rep2: "Gana Europa para subir a 5 estrellas.",

    guideTipsTitle: "💡 Consejos de Mánager",
    guideTipsDo: "✅ HAZLO", guideTipsDo1: "Rotación de plantilla para fatiga.", guideTipsDo2: "Pase Largo contra Gegenpress.", guideTipsDo3: "Entrena Motivación.",
    guideTipsDont: "❌ NUNCA", guideTipsDont1: "Portero en defensa.", guideTipsDont2: "Línea alta con defensores lentos.", guideTipsDont3: "Tiki Taka con jugadores malos."
};

const id = {
    // Indo Fallback that translates basically the structure to real strings so the game isn't buggy.
    guideBasicsTitle: "🎮 Dasar & Fundamental",
    guideBasicsP1: "⚽ Anda adalah <strong>Manajer</strong>. Mesin Live Match bukan melempar dadu, tapi murni stat.",
    guideBasicsP2: "📅 Liga seminggu sekali. 2 teratas ke Liga Champions.",
    guideBasicsP3: "📊 <strong>Kepercayaan:</strong> Di bawah 30% berarti <strong class='text-red-400'>DIPECAT!</strong>",
    guideAttrTitle: "👤 Atribut (Efek Nyata)",
    guideAttrDesc: "Mesin menggunakan 14 statistik. Berikut detailnya:",
    guideTechTitle: "Teknis", guideAttrFinishing: "Akurasi tembakan.", guideAttrPassing: "Akurasi umpan.", guideAttrDribbling: "Kelihaian melewati lawan.", guideAttrTackling: "Memotong bola.", guideAttrGk: "Refleks kiper.",
    guidePhysTitle: "Fisik", guideAttrSpeed: "Kecepatan berlari.", guideAttrStamina: "Kapasitas bernapas (Oksigen).", guideAttrStrength: "Kekuatan badan.", guideAttrCondition: "Kondisi match.",
    guideMentalTitle: "Mental", guideAttrDecisions: "Pengambilan keputusan cerdas.", guideAttrPositioning: "Menghindari offside.", guideAttrVision: "Melihat jangkauan umpan.", guideAttrComposure: "Ketenangan eksekusi.", guideAttrAggression: "Tingkat agresif.",
    guideStylesTitle: "✨ Gaya Bermain (20 X-Factor)",
    guideStylesDesc: "Skill ini mengubah jalannya mesin laga secara langsung.",
    guideS_Gk: "🧤 Kiper", guideS_Gk1: "Kucing.", guideS_Gk2: "Penyapu.", guideS_Gk3: "Penyelamat Penalti.",
    guideS_Def: "🛡️ Bertahan", guideS_Def1: "Pencegat.", guideS_Def2: "Batu.", guideS_Def3: "Tanpa Lelah.", guideS_Def4: "Tahan Press.",
    guideS_Move: "🏃‍♂️ Pergerakan", guideS_Move1: "Cepat.", guideS_Move2: "Pengecoh.", guideS_Move3: "Sentuhan Pertama.",
    guideS_Pass: "🎯 Mengumpan", guideS_Pass1: "Trobosan.", guideS_Pass2: "Maestro.", guideS_Pass3: "Spesialis Mati.",
    guideS_Shoot: "⚽ Tembakan", guideS_Shoot1: "Plesing.", guideS_Shoot2: "Roket.", guideS_Shoot3: "Lob.", guideS_Shoot4: "Sundulan Maut.", guideS_Shoot5: "Jarak Jauh.",
    guideS_Men: "🧠 Mental Roles", guideS_Men1: "Shadow Striker.", guideS_Men2: "Poacher (Target Man).",

    guideGameGuideDesc: "Anatomi Match Engine, taktik, dan ekonomi permainan.",
    guideTacticsTitle: "🎯 Papan Taktik (Mekanisme)",
    guideTacticsDesc: "Taktik memandu kecerdasan AI dalam 20 tick per detik.",
    guideT_Defense: "🛡️ PERTAHANAN", guideT_Attack: "🔥 PENYERANGAN", guideT_Mentality: "🧠 Mentalitas",
    guideT_Width: "📏 Lebar Pitch", guideT_PassTempo: "⚽ Umpan & Tempo", guideT_Instructions: "🎯 Instruksi Pemain",
    guideT_DefLinePress: "🧱 BLOK & PRESTING", guideT_PressIntensity: "Intensitas Press", guideT_DefLine: "Garis Belakang", guideT_Presets: "⭐ TEMPLATE TAKTIK",

    guideFinanceTitle: "💵 Keuangan & Liga",
    guideFinanceDesc: "Kalau klub bangkrut, Anda dipecat.",
    guideF_Eco: "💸 Dampak Ekonomi",
    guideF_Eco1: "<strong>Gaji:</strong> Beban Mingguan.", guideF_Eco2: "<strong>Tiket:</strong> Pemasukan dari stadion lokal.", guideF_Eco3: "<strong>TV:</strong> Hadiah dari liga.", guideF_Eco4: "<strong>Eropa:</strong> Cuan berlimpah.",
    guideF_Rep: "📈 Reputasi Klub", guideF_Rep1: "Kalau reputasi busuk, pemain bintang menolak masuk!", guideF_Rep2: "Naikkan hingga 5 bintang dengan juara eropa.",

    guideTipsTitle: "💡 Tips untuk Manajer",
    guideTipsDo: "✅ LAKUKAN", guideTipsDo1: "Rotasi skuad inti.", guideTipsDo2: "Pakai Long Ball melawan Gegenpress.", guideTipsDo3: "Set latihan Motivasi.",
    guideTipsDont: "❌ JANGAN", guideTipsDont1: "Kiper jadi Bek.", guideTipsDont2: "Press tinggi plus bek lambat.", guideTipsDont3: "Tiki taka dengan tim pemula."
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
    console.log(`Updated localized content exclusively for ${localeInfo.lang}.ts`);
});
