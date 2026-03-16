export const MANAGER_ACHIEVEMENTS = {
  FIRST_OFFICIAL_WIN: {
    title: 'Ilk Kan',
    description: 'Kariyerindeki ilk resmi mac galibiyetini al.',
  },
} as const;

export type ManagerAchievementId = keyof typeof MANAGER_ACHIEVEMENTS;

export const PLAY_GAMES_ACHIEVEMENT_IDS: Record<ManagerAchievementId, string> = {
  // Play Console'da achievement olusturduktan sonra buraya gercek ID'yi yapistir.
  FIRST_OFFICIAL_WIN: 'Cgkli6P58aMOEAIQAQ',
};