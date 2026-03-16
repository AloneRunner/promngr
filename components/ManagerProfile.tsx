import React from 'react';
import { GameState, ManagerCourseKey, ManagerStaffRoleKey, ManagerTalentKey, Team } from '../types';
import { getTeamLogo } from '../logoMapping';
import { getManagerGameplayEffects, getManagerPersonalStaffWeeklyCost, getManagerStaffLevelCap, getManagerTalentLevelCap } from '../services/engine';

interface ManagerProfileProps {
    gameState: GameState;
    userTeam: Team;
    lang: 'tr' | 'en' | 'es' | 'fr' | 'ru' | 'id';
    t: any;
    onBack: () => void;
    onUpgradeTalent: (talentKey: ManagerTalentKey) => void;
    onResetTalents: () => void;
    onPurchaseCourse: (courseKey: ManagerCourseKey) => void;
    onUpgradeStaff: (roleKey: ManagerStaffRoleKey) => void;
}

// Format money (e.g., €1,250,000 -> €1.25M)
const formatMoney = (amount: number): string => {
    if (amount >= 1000000) return `€${(amount / 1000000).toFixed(2)}M`;
    if (amount >= 1000) return `€${(amount / 1000).toFixed(0)}K`;
    return `€${amount}`;
};

const replaceTokens = (template: string, replacements: Record<string, string | number>) =>
    Object.entries(replacements).reduce(
        (text, [key, value]) => text.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value)),
        template,
    );

const MANAGER_UI_COPY = {
    tr: {
        reputation: 'İtibar', skillPoints: 'Yetenek Puanı', personalBalance: 'Kişisel Bakiye', weeklyStaffCost: 'Haftalık Ekip Maliyeti',
        wins: 'Galibiyet', draws: 'Beraberlik', losses: 'Mağlubiyet', levelShort: 'Sv.', current: 'Mevcut', target: 'Hedef', reward: 'Ödül',
        repShort: 'İtibar', minLevel: 'Min Seviye', nextCost: 'Sonraki Maliyet', balance: 'Bakiye', talentTree: 'Yetenek Ağacı',
        talentTreeDesc: 'Seviye atladıkça kazandığın puanları burada harcayıp menajer bonuslarını özelleştirirsin.',
        resetTalents: 'Sıfırla (€250K)', insufficientBalance: 'Yetersiz Bakiye', buyCourse: 'Kursu Al', hireUpgrade: 'İşe Al / Yükselt',
        activeBonuses: 'Aktif Bonuslar', archetype: 'Arketip', homeNationConfidence: 'Yerel Ülke Güveni', transferNegotiation: 'Transfer Pazarlığı',
        scoutingKnowledge: 'Scout Bilgisi', boardHandling: 'Yönetim İdaresi', boardRiskControl: 'Yönetim Risk Kontrolü', playerDevelopment: 'Oyuncu Gelişimi', youthDiscovery: 'Genç Keşfi',
        levelAdvantage: 'Seviyenin Şu Anki Etkisi', levelAdvantageDesc: 'Her seviye pasif olarak transfer iknasını, altyapı keşfini, oyuncu gelişimini ve yönetim güveni kontrolünü güçlendirir.',
        talentCapInfo: 'Şu an dal başına maksimum seviye: {cap}/5. Seviye arttıkça üst katmanlar açılır.',
        careerEarnings: 'Kariyer kazancı: {amount}. Haftalık maaş kişisel bakiyene otomatik eklenir.',
        careerSpending: 'Toplam harcama: {amount}. Kişisel ekip maaşı her hafta bakiyenden düşülür.',
        seasonObjectives: 'Sezon Hedefleri', seasonObjectivesDesc: 'Yönetim beklentilerini burada takip edersin. Tamamlarsan para, XP ve itibar kazanırsın.',
        pending: 'BEKLİYOR', completed: 'TAMAMLANDI', failed: 'BAŞARISIZ',
        objectiveLeagueContinental: 'Avrupa hedefini yakala', objectiveLeagueTopHalf: 'İlk yarıda bitir', objectiveLeagueSurvival: 'Küme hattından uzak dur',
        objectiveLeagueDesc: 'Ligi {target}. sırada veya daha yukarıda bitir.', objectiveBoardTitle: 'Yönetimi yanında tut',
        objectiveBoardDesc: 'Sezonu {target} veya üzeri yönetim güveni ile tamamla.', objectiveBudgetTitle: 'Kulüp bütçesini koru',
        objectiveBudgetDesc: 'Sezon sonunda kulüp bütçesinde en az {target} kalsın.', objectiveBudgetWarning: 'Transfer harcamaları ve sezon içi giderler bu hedefi bozabilir; bütçe planlaması artık daha önemli.',
        managerCourses: 'Menajer Kursları', managerCoursesDesc: 'Kişisel bakiyen ile kurs alıp menajerini daha hızlı geliştirebilirsin.',
        personalStaff: 'Kişisel Ekip', personalStaffDesc: 'Kendi ekibini kur. Kulüp değişse bile bu ekip seninle büyür.', staffCap: 'Ekip Limiti',
        max: 'MAKS', trophyWord: 'kupa', buyCourseLocked: 'Sv. {level}',
        talents: {
            leadership: { title: 'Liderlik', description: 'Yönetim güveni artışlarını güçlendirir, düşüşleri azaltır.', effect: '+{value}% yönetim kazancı' },
            negotiation: { title: 'Pazarlık', description: 'Transfer iknasını ve maaş pazarlığını güçlendirir.', effect: '+{value}% transfer etkisi' },
            development: { title: 'Gelişim', description: 'Oyuncu gelişimini ve menajer XP verimini artırır.', effect: '+{value}% oyuncu gelişimi' },
            scouting: { title: 'Scout', description: 'Genç keşif oranını ve potansiyel kalitesini artırır.', effect: '+{value}% genç keşfi' },
        },
        courses: {
            PRO_LICENSE: { title: 'Pro Lisans', description: 'Bonus XP ve +1 bedava yetenek puanı kazandırır.' },
            LEADERSHIP_SEMINAR: { title: 'Liderlik Semineri', description: 'Yetenek puanı harcamadan 1 Liderlik seviyesi ekler.' },
            NEGOTIATION_SUMMIT: { title: 'Pazarlık Zirvesi', description: '1 Pazarlık seviyesi ekler ve anlaşma gücünü artırır.' },
            SCOUTING_TOUR: { title: 'Scout Turu', description: '1 Scout seviyesi ekler ve genç oyuncu bilgisini artırır.' },
            DEVELOPMENT_WORKSHOP: { title: 'Gelişim Atölyesi', description: '1 Gelişim seviyesi ekler.' },
        },
        staff: {
            scoutAdvisor: { title: 'Scout Danışmanı', description: 'Scout erişimini ve genç alım kalitesini yükseltir.', effect: '+{value}% genç keşfi' },
            developmentCoach: { title: 'Gelişim Koçu', description: 'Oyuncu gelişimini ve öğrenme verimini artırır.', effect: '+{value}% gelişim' },
            contractLawyer: { title: 'Sözleşme Avukatı', description: 'Maaş ve transfer görüşmelerinde avantaj sağlar.', effect: '+{value}% transfer gücü' },
        },
        archetypes: { TACTICIAN: 'Taktisyen', MOTIVATOR: 'Motivatör', NEGOTIATOR: 'Pazarlıkçı', SCOUT: 'Scout' },
    },
    en: {
        reputation: 'Reputation', skillPoints: 'Skill Points', personalBalance: 'Personal Balance', weeklyStaffCost: 'Weekly Staff Cost',
        wins: 'Wins', draws: 'Draws', losses: 'Losses', levelShort: 'Lv.', current: 'Current', target: 'Target', reward: 'Reward',
        repShort: 'Rep', minLevel: 'Min Level', nextCost: 'Next Cost', balance: 'Balance', talentTree: 'Talent Tree',
        talentTreeDesc: 'Spend the points you earn on level-up here to customize your manager bonuses.',
        resetTalents: 'Reset (€250K)', insufficientBalance: 'Insufficient Balance', buyCourse: 'Buy Course', hireUpgrade: 'Hire / Upgrade',
        activeBonuses: 'Active Bonuses', archetype: 'Archetype', homeNationConfidence: 'Home Nation Confidence', transferNegotiation: 'Transfer Negotiation',
        scoutingKnowledge: 'Scouting Knowledge', boardHandling: 'Board Handling', boardRiskControl: 'Board Risk Control', playerDevelopment: 'Player Development', youthDiscovery: 'Youth Discovery',
        levelAdvantage: 'Level Advantage Right Now', levelAdvantageDesc: 'Every level passively strengthens transfer persuasion, youth discovery, player development and board confidence control.',
        talentCapInfo: 'Current maximum per branch: {cap}/5. Higher levels unlock the upper tiers.',
        careerEarnings: 'Career earnings: {amount}. Your weekly salary is added to your personal balance automatically.',
        careerSpending: 'Total spending: {amount}. Personal staff wages are deducted from your balance every week.',
        seasonObjectives: 'Season Objectives', seasonObjectivesDesc: 'Track the board expectations here. Completing them grants money, XP and reputation.',
        pending: 'PENDING', completed: 'COMPLETED', failed: 'FAILED',
        objectiveLeagueContinental: 'Secure continental qualification', objectiveLeagueTopHalf: 'Finish in the top half', objectiveLeagueSurvival: 'Stay clear of the relegation fight',
        objectiveLeagueDesc: 'Finish the league in position {target} or better.', objectiveBoardTitle: 'Keep the board on your side',
        objectiveBoardDesc: 'Finish the season with board confidence at {target} or above.', objectiveBudgetTitle: 'Protect the club finances',
        objectiveBudgetDesc: 'Finish the season with at least {target} remaining in the club budget.', objectiveBudgetWarning: 'Transfer spending and seasonal expenses can break this target, so board planning matters more now.',
        managerCourses: 'Manager Courses', managerCoursesDesc: 'Use your personal balance to buy courses and develop your manager faster.',
        personalStaff: 'Personal Staff', personalStaffDesc: 'Build your own crew. This staff grows with you even when you change clubs.', staffCap: 'Staff Cap',
        max: 'MAX', trophyWord: 'trophies', buyCourseLocked: 'Lv. {level}',
        talents: {
            leadership: { title: 'Leadership', description: 'Board confidence gains improve and confidence losses hurt less.', effect: '+{value}% board gain' },
            negotiation: { title: 'Negotiation', description: 'Stronger transfer persuasion and better salary leverage.', effect: '+{value}% transfer pull' },
            development: { title: 'Development', description: 'Improves player growth and manager XP efficiency.', effect: '+{value}% player growth' },
            scouting: { title: 'Scouting', description: 'Better youth discovery rate and youth potential quality.', effect: '+{value}% youth discovery' },
        },
        courses: {
            PRO_LICENSE: { title: 'Pro License', description: 'Gain bonus XP and +1 free skill point.' },
            LEADERSHIP_SEMINAR: { title: 'Leadership Seminar', description: 'Adds 1 Leadership rank without using a skill point.' },
            NEGOTIATION_SUMMIT: { title: 'Negotiation Summit', description: 'Adds 1 Negotiation rank and strengthens deal-making.' },
            SCOUTING_TOUR: { title: 'Scouting Tour', description: 'Adds 1 Scouting rank and expands youth knowledge.' },
            DEVELOPMENT_WORKSHOP: { title: 'Development Workshop', description: 'Adds 1 Development rank for better growth.' },
        },
        staff: {
            scoutAdvisor: { title: 'Scout Advisor', description: 'Adds global scouting reach and improves youth recruitment quality.', effect: '+{value}% youth discovery' },
            developmentCoach: { title: 'Development Coach', description: 'Improves player development and raises manager learning efficiency.', effect: '+{value}% development' },
            contractLawyer: { title: 'Contract Lawyer', description: 'Helps with salary leverage and contract or transfer negotiations.', effect: '+{value}% transfer leverage' },
        },
        archetypes: { TACTICIAN: 'Tactician', MOTIVATOR: 'Motivator', NEGOTIATOR: 'Negotiator', SCOUT: 'Scout' },
    },
    es: {
        reputation: 'Reputación', skillPoints: 'Puntos de Habilidad', personalBalance: 'Saldo Personal', weeklyStaffCost: 'Costo Semanal del Staff', wins: 'Victorias', draws: 'Empates', losses: 'Derrotas', levelShort: 'Nv.', current: 'Actual', target: 'Objetivo', reward: 'Recompensa', repShort: 'Rep', minLevel: 'Nivel Mín.', nextCost: 'Siguiente Costo', balance: 'Saldo', talentTree: 'Árbol de Talentos', talentTreeDesc: 'Gasta aquí los puntos de nivel para personalizar los bonos del mánager.', resetTalents: 'Resetear (€250K)', insufficientBalance: 'Saldo Insuficiente', buyCourse: 'Comprar Curso', hireUpgrade: 'Contratar / Mejorar', activeBonuses: 'Bonos Activos', archetype: 'Arquetipo', homeNationConfidence: 'Confianza Nacional', transferNegotiation: 'Negociación', scoutingKnowledge: 'Conocimiento de Scouting', boardHandling: 'Gestión de la Directiva', boardRiskControl: 'Control de Riesgo', playerDevelopment: 'Desarrollo', youthDiscovery: 'Descubrimiento Juvenil', levelAdvantage: 'Ventaja Actual del Nivel', levelAdvantageDesc: 'Cada nivel mejora de forma pasiva la persuasión, el scouting juvenil, el desarrollo y el control de la confianza.', talentCapInfo: 'Máximo actual por rama: {cap}/5. Los niveles altos desbloquean más.', careerEarnings: 'Ganancias de carrera: {amount}. El salario semanal se añade automáticamente a tu saldo.', careerSpending: 'Gasto total: {amount}. El sueldo del staff se descuenta cada semana.', seasonObjectives: 'Objetivos de Temporada', seasonObjectivesDesc: 'Sigue aquí las expectativas de la directiva. Completarlas da dinero, XP y reputación.', pending: 'PENDIENTE', completed: 'COMPLETADO', failed: 'FALLADO', objectiveLeagueContinental: 'Asegura competición continental', objectiveLeagueTopHalf: 'Termina en la mitad alta', objectiveLeagueSurvival: 'Aléjate del descenso', objectiveLeagueDesc: 'Termina la liga en la posición {target} o mejor.', objectiveBoardTitle: 'Mantén a la directiva contigo', objectiveBoardDesc: 'Termina la temporada con confianza de la directiva de {target} o más.', objectiveBudgetTitle: 'Protege las finanzas del club', objectiveBudgetDesc: 'Termina la temporada con al menos {target} en el presupuesto del club.', objectiveBudgetWarning: 'El gasto en fichajes y los gastos de temporada pueden romper este objetivo.', managerCourses: 'Cursos del Mánager', managerCoursesDesc: 'Usa tu saldo personal para comprar cursos y mejorar más rápido.', personalStaff: 'Staff Personal', personalStaffDesc: 'Construye tu propio equipo. Te acompaña aunque cambies de club.', staffCap: 'Límite de Staff', max: 'MÁX', trophyWord: 'trofeos', buyCourseLocked: 'Nv. {level}', talents: { leadership: { title: 'Liderazgo', description: 'Mejora las ganancias de confianza y reduce las pérdidas.', effect: '+{value}% ganancia de confianza' }, negotiation: { title: 'Negociación', description: 'Mejora la persuasión de fichajes y el apalancamiento salarial.', effect: '+{value}% tirón de fichajes' }, development: { title: 'Desarrollo', description: 'Mejora el crecimiento del jugador y la eficiencia de XP.', effect: '+{value}% desarrollo' }, scouting: { title: 'Scouting', description: 'Mejora el descubrimiento juvenil y la calidad del potencial.', effect: '+{value}% descubrimiento juvenil' } }, courses: { PRO_LICENSE: { title: 'Licencia Pro', description: 'Gana XP extra y +1 punto de habilidad.' }, LEADERSHIP_SEMINAR: { title: 'Seminario de Liderazgo', description: 'Añade 1 rango de Liderazgo sin gastar punto.' }, NEGOTIATION_SUMMIT: { title: 'Cumbre de Negociación', description: 'Añade 1 rango de Negociación y mejora acuerdos.' }, SCOUTING_TOUR: { title: 'Gira de Scouting', description: 'Añade 1 rango de Scouting.' }, DEVELOPMENT_WORKSHOP: { title: 'Taller de Desarrollo', description: 'Añade 1 rango de Desarrollo.' } }, staff: { scoutAdvisor: { title: 'Asesor Scout', description: 'Amplía el alcance del scouting y la calidad juvenil.', effect: '+{value}% descubrimiento juvenil' }, developmentCoach: { title: 'Coach de Desarrollo', description: 'Mejora el desarrollo y la eficiencia de aprendizaje.', effect: '+{value}% desarrollo' }, contractLawyer: { title: 'Abogado Contractual', description: 'Ayuda en salarios y negociaciones.', effect: '+{value}% fuerza de negociación' } }, archetypes: { TACTICIAN: 'Táctico', MOTIVATOR: 'Motivador', NEGOTIATOR: 'Negociador', SCOUT: 'Scout' } },
    fr: {
        reputation: 'Réputation', skillPoints: 'Points de Compétence', personalBalance: 'Solde Personnel', weeklyStaffCost: 'Coût Hebdo du Staff', wins: 'Victoires', draws: 'Nuls', losses: 'Défaites', levelShort: 'Niv.', current: 'Actuel', target: 'Objectif', reward: 'Récompense', repShort: 'Réput.', minLevel: 'Niveau Min', nextCost: 'Coût Suivant', balance: 'Solde', talentTree: 'Arbre de Talents', talentTreeDesc: 'Dépense ici tes points gagnés au niveau supérieur pour personnaliser tes bonus.', resetTalents: 'Réinitialiser (€250K)', insufficientBalance: 'Solde Insuffisant', buyCourse: 'Acheter', hireUpgrade: 'Recruter / Améliorer', activeBonuses: 'Bonus Actifs', archetype: 'Archétype', homeNationConfidence: 'Confiance Nationale', transferNegotiation: 'Négociation de Transfert', scoutingKnowledge: 'Connaissance du Scoutisme', boardHandling: 'Gestion du Conseil', boardRiskControl: 'Contrôle du Risque', playerDevelopment: 'Développement des Joueurs', youthDiscovery: 'Détection des Jeunes', levelAdvantage: 'Avantage du Niveau', levelAdvantageDesc: 'Chaque niveau améliore passivement la persuasion, la détection des jeunes, le développement et la confiance du conseil.', talentCapInfo: 'Maximum actuel par branche : {cap}/5. Les niveaux supérieurs débloquent plus.', careerEarnings: 'Gains de carrière : {amount}. Le salaire hebdo est ajouté automatiquement.', careerSpending: 'Dépenses totales : {amount}. Le staff personnel est payé chaque semaine.', seasonObjectives: 'Objectifs de Saison', seasonObjectivesDesc: 'Suis ici les attentes du conseil. Les réussir donne argent, XP et réputation.', pending: 'EN COURS', completed: 'RÉUSSI', failed: 'ÉCHOUÉ', objectiveLeagueContinental: 'Assurer l’Europe', objectiveLeagueTopHalf: 'Finir dans la première moitié', objectiveLeagueSurvival: 'Éviter la relégation', objectiveLeagueDesc: 'Finir le championnat à la place {target} ou mieux.', objectiveBoardTitle: 'Garder le conseil avec toi', objectiveBoardDesc: 'Terminer la saison avec une confiance du conseil de {target} ou plus.', objectiveBudgetTitle: 'Protéger les finances du club', objectiveBudgetDesc: 'Terminer la saison avec au moins {target} dans le budget du club.', objectiveBudgetWarning: 'Les transferts et les dépenses saisonnières peuvent casser cet objectif.', managerCourses: 'Cours du Manager', managerCoursesDesc: 'Utilise ton solde personnel pour progresser plus vite.', personalStaff: 'Staff Personnel', personalStaffDesc: 'Construis ta propre équipe. Elle te suit même après un changement de club.', staffCap: 'Limite du Staff', max: 'MAX', trophyWord: 'trophées', buyCourseLocked: 'Niv. {level}', talents: { leadership: { title: 'Leadership', description: 'Améliore les gains de confiance et réduit les pertes.', effect: '+{value}% gain du conseil' }, negotiation: { title: 'Négociation', description: 'Améliore la persuasion et les salaires.', effect: '+{value}% influence transfert' }, development: { title: 'Développement', description: 'Améliore la croissance des joueurs et l’XP manager.', effect: '+{value}% développement' }, scouting: { title: 'Scoutisme', description: 'Améliore la détection des jeunes.', effect: '+{value}% détection jeune' } }, courses: { PRO_LICENSE: { title: 'Licence Pro', description: 'Gain d’XP bonus et +1 point gratuit.' }, LEADERSHIP_SEMINAR: { title: 'Séminaire Leadership', description: 'Ajoute 1 niveau de Leadership.' }, NEGOTIATION_SUMMIT: { title: 'Sommet Négociation', description: 'Ajoute 1 niveau de Négociation.' }, SCOUTING_TOUR: { title: 'Tournée de Scoutisme', description: 'Ajoute 1 niveau de Scoutisme.' }, DEVELOPMENT_WORKSHOP: { title: 'Atelier Développement', description: 'Ajoute 1 niveau de Développement.' } }, staff: { scoutAdvisor: { title: 'Conseiller Scout', description: 'Améliore la portée du scoutisme et la qualité des jeunes.', effect: '+{value}% détection jeune' }, developmentCoach: { title: 'Coach Développement', description: 'Améliore le développement des joueurs.', effect: '+{value}% développement' }, contractLawyer: { title: 'Avocat Contractuel', description: 'Aide dans les négociations salariales et de transfert.', effect: '+{value}% levier transfert' } }, archetypes: { TACTICIAN: 'Tacticien', MOTIVATOR: 'Motivateur', NEGOTIATOR: 'Négociateur', SCOUT: 'Scout' } },
    ru: {
        reputation: 'Репутация', skillPoints: 'Очки Навыков', personalBalance: 'Личный Баланс', weeklyStaffCost: 'Еженедельная Стоимость Штаба', wins: 'Победы', draws: 'Ничьи', losses: 'Поражения', levelShort: 'Ур.', current: 'Текущее', target: 'Цель', reward: 'Награда', repShort: 'Реп.', minLevel: 'Мин. уровень', nextCost: 'След. стоимость', balance: 'Баланс', talentTree: 'Дерево Талантов', talentTreeDesc: 'Трать очки уровня здесь, чтобы настраивать бонусы менеджера.', resetTalents: 'Сброс (€250K)', insufficientBalance: 'Недостаточно Средств', buyCourse: 'Купить Курс', hireUpgrade: 'Нанять / Улучшить', activeBonuses: 'Активные Бонусы', archetype: 'Архетип', homeNationConfidence: 'Доверие Родной Страны', transferNegotiation: 'Переговоры по Трансферам', scoutingKnowledge: 'Скаутские Знания', boardHandling: 'Работа с Советом', boardRiskControl: 'Контроль Рисков', playerDevelopment: 'Развитие Игроков', youthDiscovery: 'Поиск Молодёжи', levelAdvantage: 'Преимущество Уровня', levelAdvantageDesc: 'Каждый уровень пассивно усиливает убеждение, поиск молодёжи, развитие игроков и контроль доверия совета.', talentCapInfo: 'Текущий максимум по ветке: {cap}/5. Более высокие уровни открывают больше.', careerEarnings: 'Доход за карьеру: {amount}. Недельная зарплата автоматически добавляется на личный баланс.', careerSpending: 'Общие траты: {amount}. Зарплата личного штаба списывается каждую неделю.', seasonObjectives: 'Цели Сезона', seasonObjectivesDesc: 'Здесь отслеживаются ожидания совета. За выполнение дают деньги, XP и репутацию.', pending: 'В ПРОЦЕССЕ', completed: 'ВЫПОЛНЕНО', failed: 'ПРОВАЛЕНО', objectiveLeagueContinental: 'Добиться еврокубков', objectiveLeagueTopHalf: 'Финишировать в верхней половине', objectiveLeagueSurvival: 'Избежать борьбы за вылет', objectiveLeagueDesc: 'Завершить сезон на позиции {target} или выше.', objectiveBoardTitle: 'Сохрани поддержку совета', objectiveBoardDesc: 'Заверши сезон с доверием совета не ниже {target}.', objectiveBudgetTitle: 'Защити финансы клуба', objectiveBudgetDesc: 'Заверши сезон, оставив в бюджете клуба минимум {target}.', objectiveBudgetWarning: 'Траты на трансферы и расходы по сезону могут сорвать эту цель.', managerCourses: 'Курсы Менеджера', managerCoursesDesc: 'Используй личный баланс, чтобы быстрее развивать менеджера.', personalStaff: 'Личный Штаб', personalStaffDesc: 'Собери собственную команду. Она растет вместе с тобой даже при смене клуба.', staffCap: 'Лимит Штаба', max: 'МАКС', trophyWord: 'трофеев', buyCourseLocked: 'Ур. {level}', talents: { leadership: { title: 'Лидерство', description: 'Улучшает рост доверия и смягчает потери.', effect: '+{value}% рост доверия' }, negotiation: { title: 'Переговоры', description: 'Усиливает убеждение в трансферах и зарплате.', effect: '+{value}% влияние на трансфер' }, development: { title: 'Развитие', description: 'Улучшает рост игроков и эффективность XP.', effect: '+{value}% развитие' }, scouting: { title: 'Скаутинг', description: 'Улучшает поиск молодёжи и потенциал.', effect: '+{value}% поиск молодёжи' } }, courses: { PRO_LICENSE: { title: 'Pro Лицензия', description: 'Бонусный XP и +1 бесплатное очко.' }, LEADERSHIP_SEMINAR: { title: 'Семинар Лидерства', description: 'Добавляет 1 уровень лидерства.' }, NEGOTIATION_SUMMIT: { title: 'Саммит Переговоров', description: 'Добавляет 1 уровень переговоров.' }, SCOUTING_TOUR: { title: 'Скаутский Тур', description: 'Добавляет 1 уровень скаутинга.' }, DEVELOPMENT_WORKSHOP: { title: 'Семинар Развития', description: 'Добавляет 1 уровень развития.' } }, staff: { scoutAdvisor: { title: 'Советник-Скаут', description: 'Улучшает охват скаутинга и качество молодёжи.', effect: '+{value}% поиск молодёжи' }, developmentCoach: { title: 'Тренер Развития', description: 'Улучшает развитие игроков.', effect: '+{value}% развитие' }, contractLawyer: { title: 'Контрактный Юрист', description: 'Помогает в переговорах по зарплате и трансферам.', effect: '+{value}% рычаг трансфера' } }, archetypes: { TACTICIAN: 'Тактик', MOTIVATOR: 'Мотиватор', NEGOTIATOR: 'Переговорщик', SCOUT: 'Скаут' } },
    id: {
        reputation: 'Reputasi', skillPoints: 'Poin Skill', personalBalance: 'Saldo Pribadi', weeklyStaffCost: 'Biaya Staf Mingguan', wins: 'Menang', draws: 'Imbang', losses: 'Kalah', levelShort: 'Lv.', current: 'Saat Ini', target: 'Target', reward: 'Hadiah', repShort: 'Rep', minLevel: 'Level Min', nextCost: 'Biaya Berikutnya', balance: 'Saldo', talentTree: 'Pohon Talenta', talentTreeDesc: 'Gunakan poin level-up di sini untuk menyesuaikan bonus manajer.', resetTalents: 'Reset (€250K)', insufficientBalance: 'Saldo Tidak Cukup', buyCourse: 'Beli Kursus', hireUpgrade: 'Rekrut / Tingkatkan', activeBonuses: 'Bonus Aktif', archetype: 'Arketipe', homeNationConfidence: 'Kepercayaan Negara Asal', transferNegotiation: 'Negosiasi Transfer', scoutingKnowledge: 'Pengetahuan Scouting', boardHandling: 'Hubungan Dewan', boardRiskControl: 'Kontrol Risiko Dewan', playerDevelopment: 'Perkembangan Pemain', youthDiscovery: 'Penemuan Bakat Muda', levelAdvantage: 'Keunggulan Level Saat Ini', levelAdvantageDesc: 'Setiap level secara pasif meningkatkan persuasi transfer, penemuan pemain muda, perkembangan pemain, dan kontrol kepercayaan dewan.', talentCapInfo: 'Maksimum saat ini per cabang: {cap}/5. Level lebih tinggi membuka tingkat berikutnya.', careerEarnings: 'Pendapatan karier: {amount}. Gaji mingguan otomatis masuk ke saldo pribadi.', careerSpending: 'Total pengeluaran: {amount}. Gaji staf pribadi dipotong setiap minggu.', seasonObjectives: 'Objektif Musim', seasonObjectivesDesc: 'Pantau target dewan di sini. Menyelesaikannya memberi uang, XP, dan reputasi.', pending: 'PENDING', completed: 'SELESAI', failed: 'GAGAL', objectiveLeagueContinental: 'Amankan tiket kontinental', objectiveLeagueTopHalf: 'Finis di papan atas', objectiveLeagueSurvival: 'Jauhi zona degradasi', objectiveLeagueDesc: 'Akhiri liga di posisi {target} atau lebih baik.', objectiveBoardTitle: 'Pertahankan dukungan dewan', objectiveBoardDesc: 'Akhiri musim dengan kepercayaan dewan minimal {target}.', objectiveBudgetTitle: 'Lindungi keuangan klub', objectiveBudgetDesc: 'Akhiri musim dengan sisa minimal {target} di anggaran klub.', objectiveBudgetWarning: 'Belanja transfer dan biaya musiman bisa menggagalkan target ini.', managerCourses: 'Kursus Manajer', managerCoursesDesc: 'Gunakan saldo pribadi untuk membeli kursus dan berkembang lebih cepat.', personalStaff: 'Staf Pribadi', personalStaffDesc: 'Bangun timmu sendiri. Staf ini ikut berkembang bersamamu walau pindah klub.', staffCap: 'Batas Staf', max: 'MAX', trophyWord: 'trofi', buyCourseLocked: 'Lv. {level}', talents: { leadership: { title: 'Kepemimpinan', description: 'Meningkatkan kenaikan kepercayaan dewan dan mengurangi penurunan.', effect: '+{value}% kenaikan dewan' }, negotiation: { title: 'Negosiasi', description: 'Transfer lebih meyakinkan dan leverage gaji lebih baik.', effect: '+{value}% daya tarik transfer' }, development: { title: 'Pengembangan', description: 'Meningkatkan perkembangan pemain dan efisiensi XP.', effect: '+{value}% perkembangan' }, scouting: { title: 'Scouting', description: 'Meningkatkan penemuan dan kualitas talenta muda.', effect: '+{value}% penemuan muda' } }, courses: { PRO_LICENSE: { title: 'Lisensi Pro', description: 'Dapatkan bonus XP dan +1 poin skill gratis.' }, LEADERSHIP_SEMINAR: { title: 'Seminar Kepemimpinan', description: 'Menambah 1 tingkat Kepemimpinan.' }, NEGOTIATION_SUMMIT: { title: 'KTT Negosiasi', description: 'Menambah 1 tingkat Negosiasi.' }, SCOUTING_TOUR: { title: 'Tur Scouting', description: 'Menambah 1 tingkat Scouting.' }, DEVELOPMENT_WORKSHOP: { title: 'Workshop Pengembangan', description: 'Menambah 1 tingkat Pengembangan.' } }, staff: { scoutAdvisor: { title: 'Penasihat Scout', description: 'Menambah jangkauan scouting dan kualitas rekrut muda.', effect: '+{value}% penemuan muda' }, developmentCoach: { title: 'Pelatih Pengembangan', description: 'Meningkatkan perkembangan pemain.', effect: '+{value}% perkembangan' }, contractLawyer: { title: 'Pengacara Kontrak', description: 'Membantu negosiasi gaji dan transfer.', effect: '+{value}% leverage transfer' } }, archetypes: { TACTICIAN: 'Taktisi', MOTIVATOR: 'Motivator', NEGOTIATOR: 'Negosiator', SCOUT: 'Scout' } },
} as const;

const MANAGER_UI_META = {
    tr: { managerProfileTitle: 'Menajer Profili', currentTeam: 'Mevcut Takım', unknownTeam: 'Bilinmeyen Takım', defaultManagerName: 'Menajer', managerProgress: 'Menajer Gelişimi', matches: 'Maçlar', xpShort: 'XP', spShort: 'YP', upgrade: '+ Yükselt' },
    en: { managerProfileTitle: 'Manager Profile', currentTeam: 'Current Team', unknownTeam: 'Unknown Team', defaultManagerName: 'Manager', managerProgress: 'Manager Progress', matches: 'Matches', xpShort: 'XP', spShort: 'SP', upgrade: '+ Upgrade' },
    es: { managerProfileTitle: 'Perfil del Mánager', currentTeam: 'Equipo Actual', unknownTeam: 'Equipo Desconocido', defaultManagerName: 'Mánager', managerProgress: 'Progreso del Mánager', matches: 'Partidos', xpShort: 'XP', spShort: 'PH', upgrade: '+ Mejorar' },
    fr: { managerProfileTitle: 'Profil du Manager', currentTeam: 'Club Actuel', unknownTeam: 'Club Inconnu', defaultManagerName: 'Manager', managerProgress: 'Progression du Manager', matches: 'Matchs', xpShort: 'XP', spShort: 'PC', upgrade: '+ Ameliorer' },
    ru: { managerProfileTitle: 'Профиль Менеджера', currentTeam: 'Текущий Клуб', unknownTeam: 'Неизвестный Клуб', defaultManagerName: 'Менеджер', managerProgress: 'Прогресс Менеджера', matches: 'Матчи', xpShort: 'XP', spShort: 'ОН', upgrade: '+ Улучшить' },
    id: { managerProfileTitle: 'Profil Manajer', currentTeam: 'Tim Saat Ini', unknownTeam: 'Tim Tidak Diketahui', defaultManagerName: 'Manajer', managerProgress: 'Progres Manajer', matches: 'Laga', xpShort: 'XP', spShort: 'PS', upgrade: '+ Tingkatkan' },
} as const;

// Cup prize info - function to get localized cup data
const getCupPrizes = (t: any, gameState: GameState) => {
    const prizes: any = {};

    if (gameState.europeanCup || true) {
        prizes.championsLeague = {
            name: t.championsLeagueLabel || 'Champions League',
            rounds: [
                { round: t.groupWinLabel || 'Group Win', prize: 1200000 },
                { round: t.groupDrawLabel || 'Group Draw', prize: 400000 },
                { round: t.roundOf16ToQF || t.roundOf16ToQFLabel || 'Round of 16 Qualification', prize: 4500000 },
                { round: t.qfToSf || t.qfToSFLabel || 'Quarter-Final Qualification', prize: 5500000 },
                { round: t.sfToFinal || t.sfToFinalLabel || 'Semi-Final Qualification', prize: 6500000 },
                { round: t.championshipLabel || 'Final Winner', prize: 10000000 }
            ],
            total: 26500000,
            note: t.cupPrizeGateNote || 'Knockout progression total. Group results and gate receipts are added separately.'
        };
    }

    if (gameState.europaLeague) {
        prizes.uefaCup = {
            name: t.europaLeagueLabel || 'Europa League',
            rounds: [
                { round: t.groupWinLabel || 'Group Win', prize: 480000 },
                { round: t.groupDrawLabel || 'Group Draw', prize: 160000 },
                { round: t.roundOf16ToQF || t.roundOf16ToQFLabel || 'Round of 16 Qualification', prize: 1800000 },
                { round: t.qfToSf || t.qfToSFLabel || 'Quarter-Final Qualification', prize: 2200000 },
                { round: t.sfToFinal || t.sfToFinalLabel || 'Semi-Final Qualification', prize: 2600000 },
                { round: t.championshipLabel || 'Final Winner', prize: 4000000 }
            ],
            total: 10600000,
            note: t.cupPrizeGateNote || 'Knockout progression total. Group results and gate receipts are added separately.'
        };
    }

    if (gameState.superCup) {
        prizes.superCup = {
            name: t.superCupLabel || 'Super Cup',
            rounds: [
                { round: t.superCupWinnerLabel || 'Winner', prize: 4000000 },
                { round: t.superCupRunnerUpLabel || 'Runner-Up', prize: 2000000 }
            ],
            total: 6000000,
            note: t.superCupPrizeNote || 'Single-match prize pool.'
        };
    }

    return prizes;
};

export const ManagerProfile: React.FC<ManagerProfileProps> = ({ gameState, userTeam, lang, t, onBack, onUpgradeTalent, onResetTalents, onPurchaseCourse, onUpgradeStaff }) => {
    const ui = {
        ...MANAGER_UI_COPY.en,
        ...(MANAGER_UI_COPY[lang] || MANAGER_UI_COPY.en),
        ...MANAGER_UI_META[lang],
    };
    const managerProfile = gameState.managerProfile;
    const managerEffects = getManagerGameplayEffects(managerProfile);
    const rating = gameState.managerRating || 50;
    const salary = gameState.managerSalary || 50000;
    const trophies = gameState.managerTrophies || {
        leagueTitles: 0, championsLeagueTitles: 0, uefaCupTitles: 0, superCupTitles: 0
    };
    const careerHistory = gameState.managerCareerHistory || [];
    const personalBalance = managerProfile?.personalBalance || 0;
    const lifetimeEarnings = managerProfile?.lifetimeEarnings || 0;
    const lifetimeSpent = managerProfile?.lifetimeSpent || 0;
    const talentLevelCap = getManagerTalentLevelCap(managerProfile?.level || 1);
    const staffLevelCap = getManagerStaffLevelCap(managerProfile?.level || 1);
    const weeklyStaffCost = getManagerPersonalStaffWeeklyCost(managerProfile);
    const archetypeLabel = managerProfile?.archetype ? ui.archetypes[managerProfile.archetype] : ui.archetypes.TACTICIAN;

    // Calculate total trophies
    const totalTrophies = trophies.leagueTitles + trophies.championsLeagueTitles +
        trophies.uefaCupTitles + trophies.superCupTitles;

    // Rating color
    const getRatingColor = (r: number) => {
        if (r >= 80) return 'text-green-400';
        if (r >= 60) return 'text-yellow-400';
        if (r >= 40) return 'text-orange-400';
        return 'text-red-400';
    };

    const talentCards: Array<{
        key: ManagerTalentKey;
        title: string;
        description: string;
        level: number;
        effectLabel: string;
    }> = [
            {
                key: 'leadership',
                title: ui.talents.leadership.title,
                description: ui.talents.leadership.description,
                level: managerProfile?.talents?.leadership || 0,
                effectLabel: replaceTokens(ui.talents.leadership.effect, { value: Math.round(((managerProfile?.talents?.leadership || 0) * 5)) }),
            },
            {
                key: 'negotiation',
                title: ui.talents.negotiation.title,
                description: ui.talents.negotiation.description,
                level: managerProfile?.talents?.negotiation || 0,
                effectLabel: replaceTokens(ui.talents.negotiation.effect, { value: (managerProfile?.talents?.negotiation || 0) * 3 }),
            },
            {
                key: 'development',
                title: ui.talents.development.title,
                description: ui.talents.development.description,
                level: managerProfile?.talents?.development || 0,
                effectLabel: replaceTokens(ui.talents.development.effect, { value: Math.round((managerProfile?.talents?.development || 0) * 1.2) }),
            },
            {
                key: 'scouting',
                title: ui.talents.scouting.title,
                description: ui.talents.scouting.description,
                level: managerProfile?.talents?.scouting || 0,
                effectLabel: replaceTokens(ui.talents.scouting.effect, { value: Math.round((managerProfile?.talents?.scouting || 0) * 0.4) }),
            },
        ];

    const courses: Array<{
        key: ManagerCourseKey;
        title: string;
        description: string;
        cost: number;
        minLevel: number;
    }> = [
            { key: 'PRO_LICENSE', title: ui.courses.PRO_LICENSE.title, description: ui.courses.PRO_LICENSE.description, cost: 350000, minLevel: 2 },
            { key: 'LEADERSHIP_SEMINAR', title: ui.courses.LEADERSHIP_SEMINAR.title, description: ui.courses.LEADERSHIP_SEMINAR.description, cost: 150000, minLevel: 2 },
            { key: 'NEGOTIATION_SUMMIT', title: ui.courses.NEGOTIATION_SUMMIT.title, description: ui.courses.NEGOTIATION_SUMMIT.description, cost: 180000, minLevel: 3 },
            { key: 'SCOUTING_TOUR', title: ui.courses.SCOUTING_TOUR.title, description: ui.courses.SCOUTING_TOUR.description, cost: 180000, minLevel: 3 },
            { key: 'DEVELOPMENT_WORKSHOP', title: ui.courses.DEVELOPMENT_WORKSHOP.title, description: ui.courses.DEVELOPMENT_WORKSHOP.description, cost: 180000, minLevel: 3 },
        ];

    const personalStaffCards: Array<{
        key: ManagerStaffRoleKey;
        title: string;
        description: string;
        level: number;
        nextCost: number;
        effectLabel: string;
    }> = [
            {
                key: 'scoutAdvisor',
                title: ui.staff.scoutAdvisor.title,
                description: ui.staff.scoutAdvisor.description,
                level: managerProfile?.personalStaff?.scoutAdvisor || 0,
                nextCost: 120000 * ((managerProfile?.personalStaff?.scoutAdvisor || 0) + 1),
                effectLabel: replaceTokens(ui.staff.scoutAdvisor.effect, { value: Math.round((managerProfile?.personalStaff?.scoutAdvisor || 0) * 0.45) }),
            },
            {
                key: 'developmentCoach',
                title: ui.staff.developmentCoach.title,
                description: ui.staff.developmentCoach.description,
                level: managerProfile?.personalStaff?.developmentCoach || 0,
                nextCost: 140000 * ((managerProfile?.personalStaff?.developmentCoach || 0) + 1),
                effectLabel: replaceTokens(ui.staff.developmentCoach.effect, { value: Math.round((managerProfile?.personalStaff?.developmentCoach || 0) * 1.4) }),
            },
            {
                key: 'contractLawyer',
                title: ui.staff.contractLawyer.title,
                description: ui.staff.contractLawyer.description,
                level: managerProfile?.personalStaff?.contractLawyer || 0,
                nextCost: 160000 * ((managerProfile?.personalStaff?.contractLawyer || 0) + 1),
                effectLabel: replaceTokens(ui.staff.contractLawyer.effect, { value: Math.round((managerProfile?.personalStaff?.contractLawyer || 0) * 2.5) }),
            },
        ];

    const getObjectiveTitle = (objective: any) => {
        if (objective.type === 'LEAGUE_POSITION') {
            if (objective.targetValue <= 4) return ui.objectiveLeagueContinental;
            if (objective.targetValue <= 9) return ui.objectiveLeagueTopHalf;
            return ui.objectiveLeagueSurvival;
        }
        if (objective.type === 'BOARD_CONFIDENCE') return ui.objectiveBoardTitle;
        return ui.objectiveBudgetTitle;
    };

    const getObjectiveDescription = (objective: any) => {
        if (objective.type === 'LEAGUE_POSITION') return replaceTokens(ui.objectiveLeagueDesc, { target: objective.targetValue });
        if (objective.type === 'BOARD_CONFIDENCE') return replaceTokens(ui.objectiveBoardDesc, { target: objective.targetValue });
        return replaceTokens(ui.objectiveBudgetDesc, { target: formatMoney(objective.targetValue) });
    };

    const getObjectiveStatusLabel = (status: string) => status === 'COMPLETED' ? ui.completed : status === 'FAILED' ? ui.failed : ui.pending;

    return (
        <div className="h-full overflow-y-auto overflow-x-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-3 py-3 sm:p-4">
            {/* Header */}
            <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
                <button
                    onClick={onBack}
                    className="flex w-fit items-center gap-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 
                             rounded-lg text-white transition-colors"
                >
                    <span>←</span>
                    <span>{t.back || 'Geri'}</span>
                </button>
                <h1 className="max-w-full text-xl font-bold text-white sm:text-2xl sm:text-center">👔 {t.managerProfile || t.managerProfileTitle || ui.managerProfileTitle}</h1>
                <div className="hidden w-20 shrink-0 sm:block"></div>
            </div>

            <div className="mx-auto max-w-5xl space-y-4 sm:space-y-6">
                {/* Profile Card */}
                <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 rounded-2xl p-4 sm:p-6 
                              border border-slate-600/30 backdrop-blur-sm">
                    <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-6">
                        {/* Avatar */}
                        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-3xl sm:h-24 sm:w-24 sm:text-4xl">
                            👔
                        </div>

                        <div className="min-w-0 flex-1">
                            <div className="text-gray-400 text-sm">{t.managerProfile || t.managerProfileTitle || ui.managerProfileTitle}</div>
                            <div className="mt-1 break-words text-xl font-bold text-white sm:text-2xl">
                                {managerProfile?.displayName || ui.defaultManagerName}
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2 text-xs">
                                <span className="px-2 py-1 rounded-full bg-slate-700/70 text-slate-200">
                                    {managerProfile?.nationality || 'England'}
                                </span>
                                <span className="px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-300">
                                    {ui.levelShort} {managerProfile?.level || 1}
                                </span>
                                <span className="px-2 py-1 rounded-full bg-blue-500/15 text-blue-300">
                                    {archetypeLabel}
                                </span>
                            </div>

                            <div className="text-gray-400 text-sm">{t.currentTeam || t.currentTeamLabel || ui.currentTeam}</div>
                            <div className="mt-1 flex flex-wrap items-center gap-3">
                                <img
                                    src={getTeamLogo(userTeam?.name || '')}
                                    alt={userTeam?.name || 'Team'}
                                    className="w-8 h-8 object-contain"
                                    onError={(e) => {
                                        const fallback = (userTeam?.name || 'T')[0];
                                        (e.target as HTMLImageElement).outerHTML = `<span class="text-xl font-bold" style="color: ${userTeam?.primaryColor || '#fff'}">${fallback}</span>`;
                                    }}
                                />
                                <span className="min-w-0 break-words text-lg font-bold text-white sm:text-xl">{userTeam?.name || ui.unknownTeam}</span>
                            </div>

                            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
                                <div className="min-w-0 rounded-xl bg-slate-900/25 p-3">
                                    <div className="text-gray-400 text-sm">{ui.reputation}</div>
                                    <div className={`text-lg font-bold sm:text-2xl ${getRatingColor(rating)}`}>
                                        ⭐ {managerProfile?.reputation || rating}/100
                                    </div>
                                </div>
                                <div className="min-w-0 rounded-xl bg-slate-900/25 p-3">
                                    <div className="text-gray-400 text-sm">{ui.xpShort}</div>
                                    <div className="break-words text-lg font-bold text-sky-400 sm:text-2xl">
                                        {managerProfile?.xp || 0}/{managerProfile?.xpToNextLevel || 500}
                                    </div>
                                </div>
                                <div className="min-w-0 rounded-xl bg-slate-900/25 p-3">
                                    <div className="text-gray-400 text-sm">{ui.skillPoints}</div>
                                    <div className="text-lg font-bold text-violet-400 sm:text-2xl">
                                        {managerProfile?.skillPoints || 0}
                                    </div>
                                </div>
                                <div className="min-w-0 rounded-xl bg-slate-900/25 p-3">
                                    <div className="text-gray-400 text-sm">{t.weeklySalaryWord || t.weeklySalaryLabel || 'Weekly Salary'}</div>
                                    <div className="break-words text-lg font-bold text-green-400 sm:text-2xl">
                                        {formatMoney(salary)}
                                    </div>
                                </div>
                                <div className="min-w-0 rounded-xl bg-slate-900/25 p-3">
                                    <div className="text-gray-400 text-sm">{ui.personalBalance}</div>
                                    <div className="break-words text-lg font-bold text-amber-300 sm:text-2xl">
                                        {formatMoney(personalBalance)}
                                    </div>
                                </div>
                                <div className="min-w-0 rounded-xl bg-slate-900/25 p-3">
                                    <div className="text-gray-400 text-sm">{ui.weeklyStaffCost}</div>
                                    <div className="break-words text-lg font-bold text-rose-300 sm:text-2xl">
                                        {formatMoney(weeklyStaffCost)}
                                    </div>
                                </div>
                                <div className="min-w-0 rounded-xl bg-slate-900/25 p-3 col-span-2 sm:col-span-1">
                                    <div className="text-gray-400 text-sm">{t.seasonWord || t.seasonLabel || 'Season'}</div>
                                    <div className="text-lg font-bold text-white sm:text-2xl">
                                        {gameState.currentSeason}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-5 rounded-xl bg-slate-900/50 border border-slate-700/60 p-4 sm:mt-6">
                        <div className="flex items-center justify-between text-xs uppercase tracking-wider text-slate-400 mb-2">
                            <span>{t.managerProgress || ui.managerProgress}</span>
                            <span>{ui.levelShort} {managerProfile?.level || 1}</span>
                        </div>
                        <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-sky-500 to-emerald-400"
                                style={{ width: `${Math.max(4, Math.min(100, ((managerProfile?.xp || 0) / Math.max(1, managerProfile?.xpToNextLevel || 500)) * 100))}%` }}
                            />
                        </div>
                        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <div className="bg-slate-800/60 rounded-lg p-3">
                                <div className="text-slate-500 text-xs mb-1">{t.matches || ui.matches}</div>
                                <div className="text-white font-bold">{managerProfile?.careerStats.matchesManaged || 0}</div>
                            </div>
                            <div className="bg-slate-800/60 rounded-lg p-3">
                                <div className="text-slate-500 text-xs mb-1">{ui.wins}</div>
                                <div className="text-emerald-400 font-bold">{managerProfile?.careerStats.wins || 0}</div>
                            </div>
                            <div className="bg-slate-800/60 rounded-lg p-3">
                                <div className="text-slate-500 text-xs mb-1">{ui.draws}</div>
                                <div className="text-yellow-400 font-bold">{managerProfile?.careerStats.draws || 0}</div>
                            </div>
                            <div className="bg-slate-800/60 rounded-lg p-3">
                                <div className="text-slate-500 text-xs mb-1">{ui.losses}</div>
                                <div className="text-red-400 font-bold">{managerProfile?.careerStats.losses || 0}</div>
                            </div>
                        </div>
                        <div className="mt-3 rounded-lg border border-slate-700 bg-slate-800/40 p-3 text-sm text-slate-300">
                            {replaceTokens(ui.careerEarnings, { amount: formatMoney(lifetimeEarnings) }).split(formatMoney(lifetimeEarnings))[0]}<span className="font-bold text-white">{formatMoney(lifetimeEarnings)}</span>{replaceTokens(ui.careerEarnings, { amount: formatMoney(lifetimeEarnings) }).split(formatMoney(lifetimeEarnings))[1]}
                        </div>
                        <div className="mt-3 rounded-lg border border-slate-700 bg-slate-800/40 p-3 text-sm text-slate-300">
                            {replaceTokens(ui.careerSpending, { amount: formatMoney(lifetimeSpent) }).split(formatMoney(lifetimeSpent))[0]}<span className="font-bold text-white">{formatMoney(lifetimeSpent)}</span>{replaceTokens(ui.careerSpending, { amount: formatMoney(lifetimeSpent) }).split(formatMoney(lifetimeSpent))[1]}
                        </div>

                        {managerProfile && (
                            <div className="mt-4 rounded-xl border border-slate-700 bg-slate-800/40 p-4">
                                <div className="text-xs uppercase tracking-wider text-slate-500 mb-3 font-bold">{ui.activeBonuses}</div>
                                <div className="grid grid-cols-1 gap-2 text-sm lg:grid-cols-2">
                                    <div className="text-slate-300">{ui.archetype}: <span className="text-white font-bold">{archetypeLabel}</span></div>
                                    <div className="text-slate-300">{ui.homeNationConfidence}: <span className="text-emerald-400 font-bold">+{managerProfile.bonuses.homeNationConfidenceBonus}</span></div>
                                    <div className="text-slate-300">{ui.transferNegotiation}: <span className="text-cyan-400 font-bold">+{Math.round(managerEffects.transferWillingnessBonus)}%</span></div>
                                    <div className="text-slate-300">{ui.scoutingKnowledge}: <span className="text-purple-400 font-bold">+{Math.round(managerProfile.bonuses.scoutingKnowledgeBonus * 100)}%</span></div>
                                    <div className="text-slate-300">{ui.boardHandling}: <span className="text-amber-400 font-bold">+{Math.round((managerEffects.boardConfidenceGainMultiplier - 1) * 100)}%</span></div>
                                    <div className="text-slate-300">{ui.boardRiskControl}: <span className="text-emerald-400 font-bold">-{Math.round((1 - managerEffects.boardConfidenceLossMultiplier) * 100)}%</span></div>
                                    <div className="text-slate-300">{ui.playerDevelopment}: <span className="text-blue-300 font-bold">+{Math.round(managerEffects.playerDevelopmentBonus * 100)}%</span></div>
                                    <div className="text-slate-300">{ui.youthDiscovery}: <span className="text-fuchsia-300 font-bold">+{Math.round(managerEffects.youthDiscoveryBonus * 100)}%</span></div>
                                </div>
                                <div className="mt-4 rounded-lg bg-slate-900/60 border border-slate-700 p-3 text-sm text-slate-300">
                                    <div className="font-semibold text-white mb-2">{ui.levelAdvantage}</div>
                                    <div>{ui.levelAdvantageDesc}</div>
                                    <div className="mt-2">{replaceTokens(ui.talentCapInfo, { cap: talentLevelCap })}</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {managerProfile && (
                    <div className="bg-slate-800/60 rounded-2xl p-4 sm:p-6 border border-slate-600/30">
                        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-white">{ui.talentTree}</h2>
                                <p className="text-sm text-slate-400 mt-1">{ui.talentTreeDesc}</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="px-4 py-2 rounded-xl bg-violet-500/15 border border-violet-500/30 text-violet-300 font-bold">
                                    {managerProfile.skillPoints} {ui.spShort}
                                </div>
                                <button
                                    onClick={onResetTalents}
                                    disabled={personalBalance < 250000 || talentCards.every(talent => talent.level === 0)}
                                    className="px-4 py-2 rounded-xl bg-slate-800 border border-amber-500/30 text-amber-300 disabled:border-slate-700 disabled:text-slate-500 font-bold transition-all"
                                >
                                    {ui.resetTalents}
                                </button>
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            {talentCards.map((talent) => {
                                const isMaxed = talent.level >= 5;
                                const canUpgrade = (managerProfile.skillPoints || 0) > 0 && !isMaxed;

                                return (
                                    <div key={talent.key} className="rounded-xl border border-slate-700 bg-slate-900/40 p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <div className="text-white font-bold text-lg">{talent.title}</div>
                                                <div className="text-slate-400 text-sm mt-1 leading-relaxed">{talent.description}</div>
                                            </div>
                                            <div className="shrink-0 rounded-lg bg-slate-800 px-3 py-2 text-sm font-bold text-white">
                                                {talent.level}/5
                                            </div>
                                        </div>

                                        <div className="mt-4 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                                            <div className="text-sm text-emerald-300 font-semibold">{talent.effectLabel}</div>
                                            <button
                                                onClick={() => onUpgradeTalent(talent.key)}
                                                disabled={!canUpgrade || talent.level >= talentLevelCap}
                                                className="px-4 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-500 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-400 text-white font-bold transition-all"
                                            >
                                                {isMaxed ? ui.max : talent.level >= talentLevelCap ? replaceTokens(ui.buyCourseLocked, { level: Math.max(2, (talent.level + 1) * 2 - 1) }) : ui.upgrade}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {managerProfile && (managerProfile.objectives?.length || 0) > 0 && (
                    <div className="bg-slate-800/60 rounded-2xl p-4 sm:p-6 border border-slate-600/30">
                        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-white">{ui.seasonObjectives}</h2>
                                <p className="text-sm text-slate-400 mt-1">{ui.seasonObjectivesDesc}</p>
                            </div>
                        </div>
                        <div className="grid gap-4">
                            {managerProfile.objectives.map((objective) => {
                                const currentLabel = objective.type === 'LEAGUE_POSITION'
                                    ? `${ui.current}: #${objective.currentValue}`
                                    : objective.type === 'CLUB_BUDGET'
                                        ? `${ui.current}: ${formatMoney(objective.currentValue)}`
                                        : `${ui.current}: ${objective.currentValue}`;
                                const targetLabel = objective.type === 'LEAGUE_POSITION'
                                    ? `${ui.target}: #${objective.targetValue}+`
                                    : objective.type === 'CLUB_BUDGET'
                                        ? `${ui.target}: ${formatMoney(objective.targetValue)}+`
                                        : `${ui.target}: ${objective.targetValue}+`;
                                const statusStyle = objective.status === 'COMPLETED'
                                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                                    : objective.status === 'FAILED'
                                        ? 'border-red-500/30 bg-red-500/10 text-red-300'
                                        : 'border-slate-600 bg-slate-900/40 text-slate-300';

                                return (
                                    <div key={objective.id} className="rounded-xl border border-slate-700 bg-slate-900/40 p-4">
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                            <div>
                                                <div className="text-white font-bold text-lg">{getObjectiveTitle(objective)}</div>
                                                <div className="text-slate-400 text-sm mt-1">{getObjectiveDescription(objective)}</div>
                                            </div>
                                            <div className={`shrink-0 rounded-lg border px-3 py-2 text-xs font-bold ${statusStyle}`}>
                                                {getObjectiveStatusLabel(objective.status)}
                                            </div>
                                        </div>
                                        <div className="mt-4 flex flex-wrap gap-3 text-sm">
                                            <span className="text-slate-300">{targetLabel}</span>
                                            <span className="text-cyan-300">{currentLabel}</span>
                                            <span className="text-amber-300">{ui.reward}: {formatMoney(objective.rewardBalance)}</span>
                                            <span className="text-sky-300">+{objective.rewardXp} XP</span>
                                            <span className="text-emerald-300">+{objective.rewardReputation} {ui.repShort}</span>
                                        </div>
                                        {objective.type === 'CLUB_BUDGET' && (
                                            <div className="mt-2 text-xs text-slate-500">
                                                {ui.objectiveBudgetWarning}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {managerProfile && (
                    <div className="bg-slate-800/60 rounded-2xl p-4 sm:p-6 border border-slate-600/30">
                        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-white">{ui.managerCourses}</h2>
                                <p className="text-sm text-slate-400 mt-1">{ui.managerCoursesDesc}</p>
                            </div>
                            <div className="w-fit rounded-xl bg-amber-500/15 px-4 py-2 font-bold text-amber-300 border border-amber-500/30">
                                {ui.balance} {formatMoney(personalBalance)}
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            {courses.map((course) => {
                                const lockedByLevel = (managerProfile.level || 1) < course.minLevel;
                                const lockedByMoney = personalBalance < course.cost;
                                return (
                                    <div key={course.key} className="rounded-xl border border-slate-700 bg-slate-900/40 p-4">
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                            <div>
                                                <div className="text-white font-bold text-lg">{course.title}</div>
                                                <div className="text-slate-400 text-sm mt-1 leading-relaxed">{course.description}</div>
                                            </div>
                                            <div className="shrink-0 rounded-lg bg-slate-800 px-3 py-2 text-sm font-bold text-amber-300">
                                                {formatMoney(course.cost)}
                                            </div>
                                        </div>
                                        <div className="mt-4 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                                            <div className="text-sm text-slate-300">{ui.minLevel}: <span className="font-bold text-white">{course.minLevel}</span></div>
                                            <button
                                                onClick={() => onPurchaseCourse(course.key)}
                                                disabled={lockedByLevel || lockedByMoney}
                                                className="px-4 py-2 rounded-lg bg-gradient-to-r from-amber-600 to-orange-500 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-400 text-white font-bold transition-all"
                                            >
                                                {lockedByLevel ? replaceTokens(ui.buyCourseLocked, { level: course.minLevel }) : lockedByMoney ? ui.insufficientBalance : ui.buyCourse}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {managerProfile && (
                    <div className="bg-slate-800/60 rounded-2xl p-4 sm:p-6 border border-slate-600/30">
                        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-white">{ui.personalStaff}</h2>
                                <p className="text-sm text-slate-400 mt-1">{ui.personalStaffDesc}</p>
                            </div>
                            <div className="w-fit rounded-xl bg-teal-500/15 px-4 py-2 font-bold text-teal-300 border border-teal-500/30">
                                {ui.staffCap} {staffLevelCap}/3
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {personalStaffCards.map((staffCard) => {
                                const lockedByCap = staffCard.level >= staffLevelCap;
                                const maxed = staffCard.level >= 3;
                                const canUpgrade = !maxed && !lockedByCap && personalBalance >= staffCard.nextCost;
                                return (
                                    <div key={staffCard.key} className="rounded-xl border border-slate-700 bg-slate-900/40 p-4">
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                            <div>
                                                <div className="text-white font-bold text-lg">{staffCard.title}</div>
                                                <div className="text-slate-400 text-sm mt-1 leading-relaxed">{staffCard.description}</div>
                                            </div>
                                            <div className="shrink-0 rounded-lg bg-slate-800 px-3 py-2 text-sm font-bold text-white">
                                                {staffCard.level}/3
                                            </div>
                                        </div>
                                        <div className="mt-4 text-sm text-teal-300 font-semibold">{staffCard.effectLabel}</div>
                                            <div className="mt-4 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                                            <div className="text-sm text-slate-300">{ui.nextCost}: <span className="font-bold text-white">{formatMoney(staffCard.nextCost)}</span></div>
                                            <button
                                                onClick={() => onUpgradeStaff(staffCard.key)}
                                                disabled={!canUpgrade}
                                                className="px-4 py-2 rounded-lg bg-gradient-to-r from-teal-600 to-cyan-500 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-400 text-white font-bold transition-all"
                                            >
                                                {maxed ? ui.max : lockedByCap ? replaceTokens(ui.buyCourseLocked, { level: 1 + staffCard.level * 3 }) : personalBalance < staffCard.nextCost ? ui.insufficientBalance : ui.hireUpgrade}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Trophy Cabinet */}
                <div className="bg-slate-800/60 rounded-2xl p-4 sm:p-6 border border-slate-600/30">
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        🏆 {t.trophyCabinetTitle || 'Trophy Cabinet'}
                        <span className="text-sm text-gray-400 ml-2">({totalTrophies} {t.trophyCount || ui.trophyWord})</span>
                    </h2>

                    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                        {/* League Title */}
                        <div className="bg-gradient-to-b from-amber-900/40 to-amber-950/40 rounded-xl p-4 
                                      text-center border border-amber-600/30">
                            <div className="text-4xl mb-2">🏆</div>
                            <div className="text-amber-400 font-bold text-2xl">{trophies.leagueTitles}</div>
                            <div className="text-gray-400 text-sm">{t.leagueTitleMatch || t.leagueTitleLabel || 'League Title'}</div>
                        </div>

                        {/* Champions League */}
                        <div className="bg-gradient-to-b from-blue-900/40 to-blue-950/40 rounded-xl p-4 
                                      text-center border border-blue-600/30">
                            <div className="text-4xl mb-2">🏆</div>
                            <div className="text-blue-400 font-bold text-2xl">{trophies.championsLeagueTitles}</div>
                            <div className="text-gray-400 text-sm">{t.championsLeague || t.championsLeagueLabel || 'Champions League'}</div>
                        </div>

                        {/* Europa League - Only show if exists */}
                        {gameState.europaLeague && (
                            <div className="bg-gradient-to-b from-orange-900/40 to-orange-950/40 rounded-xl p-4 
                                          text-center border border-orange-600/30">
                                <div className="text-4xl mb-2">🥈</div>
                                <div className="text-orange-400 font-bold text-2xl">{trophies.uefaCupTitles}</div>
                                <div className="text-gray-400 text-sm">{t.europaLeague || t.europaLeagueLabel || 'Europa League'}</div>
                            </div>
                        )}

                        {/* Super Cup - Only show if exists */}
                        {gameState.superCup && (
                            <div className="bg-gradient-to-b from-purple-900/40 to-purple-950/40 rounded-xl p-4 
                                          text-center border border-purple-600/30">
                                <div className="text-4xl mb-2">⭐</div>
                                <div className="text-purple-400 font-bold text-2xl">{trophies.superCupTitles}</div>
                                <div className="text-gray-400 text-sm">{t.superCupLabel || 'Super Cup'}</div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Career History */}
                <div className="bg-slate-800/60 rounded-2xl p-4 sm:p-6 border border-slate-600/30">
                    <h2 className="text-xl font-bold text-white mb-4">📊 {t.careerHistory || t.careerHistoryTitle || 'Career History'}</h2>

                    {careerHistory.length === 0 ? (
                        <div className="text-center text-gray-400 py-8">
                            {t.noCareerHistory || t.noCareerHistoryYet || 'No career history yet. Complete your first season!'}
                        </div>
                    ) : (
                        <div className="overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left text-gray-400 border-b border-slate-600">
                                        <th className="pb-3">{t.season || 'Season'}</th>
                                        <th className="pb-3">{t.team || 'Team'}</th>
                                        <th className="pb-3 text-center">{t.positionLabel || 'Position'}</th>
                                        <th className="pb-3 text-center">{t.rating}</th>
                                        <th className="pb-3 text-center">{t.trophiesLabel || 'Trophies'}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {careerHistory.slice().reverse().map((entry, idx) => (
                                        <tr key={idx} className="border-b border-slate-700/50">
                                            <td className="py-3 text-white font-medium">{entry.season}</td>
                                            <td className="py-3 text-white">{entry.teamName}</td>
                                            <td className="py-3 text-center">
                                                <span className={`px-2 py-1 rounded ${entry.position === 1 ? 'bg-amber-500/20 text-amber-400' :
                                                    entry.position <= 4 ? 'bg-green-500/20 text-green-400' :
                                                        'bg-slate-600/50 text-gray-300'
                                                    }`}>
                                                    #{entry.position}
                                                </span>
                                            </td>
                                            <td className={`py-3 text-center font-bold ${getRatingColor(entry.rating)}`}>
                                                {entry.rating}
                                            </td>
                                            <td className="py-3 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    {entry.leagueChampion && <span title={t.leagueTitleMatch || t.leagueTitleLabel || 'League Title'}>🏆</span>}
                                                    {entry.championsLeagueWinner && <span title={t.championsLeague || t.championsLeagueLabel || 'Champions League'}>🌟</span>}
                                                    {entry.uefaCupWinner && <span title={t.europaLeagueWinnerTitle || t.europaLeague || 'Europa League'}>🥈</span>}
                                                    {entry.superCupWinner && <span title={t.superCupLabel || 'Super Cup'}>⭐</span>}
                                                    {!entry.leagueChampion && !entry.championsLeagueWinner &&
                                                        !entry.uefaCupWinner && !entry.superCupWinner && (
                                                            <span className="text-gray-500">-</span>
                                                        )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Cup Prize Info */}
                <div className="bg-slate-800/60 rounded-2xl p-4 sm:p-6 border border-slate-600/30">
                    <h2 className="text-xl font-bold text-white mb-4">💰 {t.cupPrizeInfo || t.cupPrizeInfoTitle || 'Cup Prize Info'}</h2>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {Object.entries(getCupPrizes(t, gameState)).map(([key, cup]: [string, any]) => (
                            <div key={key} className="bg-slate-700/50 rounded-xl p-4">
                                <h3 className="font-bold text-white mb-3">{cup.name}</h3>
                                <div className="space-y-2">
                                    {cup.rounds.map((r, idx) => (
                                        <div key={idx} className="flex justify-between text-sm">
                                            <span className="text-gray-400">{r.round}</span>
                                            <span className="text-green-400">{formatMoney(r.prize)}</span>
                                        </div>
                                    ))}
                                    <div className="border-t border-slate-600 pt-2 mt-2 flex justify-between font-bold">
                                        <span className="text-white">{t.knockoutTotalLabel || t.totalPrizeLabel || t.totalLabel || 'Total'}</span>
                                        <span className="text-green-400">{formatMoney(cup.total)}</span>
                                    </div>
                                    {cup.note && (
                                        <div className="pt-2 text-xs text-slate-400 leading-relaxed">
                                            {cup.note}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
