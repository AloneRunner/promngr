export const MANAGER_ACHIEVEMENTS = {
  FIRST_OFFICIAL_WIN: {
    title: 'Ilk Kan',
    description: 'Kariyerindeki ilk resmi mac galibiyetini al.',
  },
  ENGINE_PREF_CLASSIC: {
    title: 'Klasikci',
    description: 'Klasik Motorda 10 mac tamamla.',
  },
  ENGINE_PREF_ARCADE: {
    title: 'Arcade Tutkunu',
    description: 'Arcade Motorda 10 mac tamamla.',
  },
  ENGINE_PREF_PRO: {
    title: 'Taktiksel Deha',
    description: 'Pro Motorda 10 mac tamamla.',
  },
  // === 10 NEW ACHIEVEMENTS ===
  LEAGUE_CHAMPION: {
    title: 'Taht Benim',
    description: 'Ilk lig sampiyonlugunu kazan.',
  },
  CUP_WINNER: {
    title: 'Kupa Avcisi',
    description: 'Ilk kupa sampiyonlugunu kazan.',
  },
  MONEY_TALKS: {
    title: 'Para Konusur',
    description: 'Kulup kasasinda 100 Milyon Euro biriksin.',
  },
  COMEBACK_KING: {
    title: 'Seytanin Bacagi',
    description: '70. dakikadan sonra geride giderken maci cevir ve kazan.',
  },
  CLEAN_SHEET_STREAK: {
    title: 'Cin Seddi',
    description: 'Ust uste 5 macta gol yeme.',
  },
  DAVID_GOLIATH: {
    title: 'David ve Goliath',
    description: 'Senden en az %30 daha itibarli bir takimi maglubet et.',
  },
  LEVEL_10: {
    title: 'Efsanenin Dogusu',
    description: 'Menajer seviyesinde 10. seviyeye ulas.',
  },
  GLOBE_TROTTER: {
    title: 'Gocebe Hoca',
    description: '3 farkli ulkede kulup yonet.',
  },
  YOUTH_DIAMOND: {
    title: 'Elmas Ham Tasi',
    description: 'Alt yapidan yetistirdigin oyuncu 80+ OVR ye ulassin.',
  },
  GOAL_MACHINE: {
    title: 'Golcu Firtinasi',
    description: 'Bir macta 7 veya daha fazla gol at.',
  },
  // === 6 NEW ACHIEVEMENTS (batch 2) ===
  FIRST_MATCH: {
    title: 'Ilk Adim',
    description: 'Kariyerindeki ilk resmi maci oyna.',
  },
  CONTINENTAL_DEBUT: {
    title: 'Kitaya Acilis',
    description: 'Ilk uluslararasi kupa macini oyna.',
  },
  AWAY_MACHINE: {
    title: 'Deplasmanin Canavari',
    description: 'Deplasmanda ust uste 5 mac kazan.',
  },
  DOUBLE_WINNER: {
    title: 'Cifte Tac',
    description: 'Ayni sezonda hem lig hem uluslararasi kupay kazan.',
  },
  BACK_TO_BACK_CHAMPION: {
    title: 'Vazgecilmez Hoca',
    description: 'Ust uste 2 sezon lig sampiyonu ol.',
  },
  DYNASTY: {
    title: 'Hanedan',
    description: 'Ust uste 3 veya daha fazla sezon lig sampiyonu ol.',
  },
} as const;

export type ManagerAchievementId = keyof typeof MANAGER_ACHIEVEMENTS;

export const PLAY_GAMES_ACHIEVEMENT_IDS: Record<ManagerAchievementId, string> = {
  FIRST_OFFICIAL_WIN: 'CgkIi6P58aMOEAIQAQ',
  ENGINE_PREF_CLASSIC: 'CgkIi6P58aMOEAIQAg',
  ENGINE_PREF_ARCADE: 'CgkIi6P58aMOEAIQAw',
  ENGINE_PREF_PRO: 'CgkIi6P58aMOEAIQBA',
  FIRST_MATCH: 'CgkIi6P58aMOEAIQBQ',
  CONTINENTAL_DEBUT: 'CgkIi6P58aMOEAIQBg',
  AWAY_MACHINE: 'CgkIi6P58aMOEAIQBw',
  DOUBLE_WINNER: 'CgkIi6P58aMOEAIQCA',
  BACK_TO_BACK_CHAMPION: 'CgkIi6P58aMOEAIQCQ',
  DYNASTY: 'CgkIi6P58aMOEAIQCg',
  // Play Console'da henuz olusturulmamis basarimlar
  LEAGUE_CHAMPION: '',
  CUP_WINNER: '',
  MONEY_TALKS: '',
  COMEBACK_KING: '',
  CLEAN_SHEET_STREAK: '',
  DAVID_GOLIATH: '',
  LEVEL_10: '',
  GLOBE_TROTTER: '',
  YOUTH_DIAMOND: '',
  GOAL_MACHINE: '',
};