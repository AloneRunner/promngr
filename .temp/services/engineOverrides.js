// Lightweight engine override settings for quick experiments.
// Drop-in place to try parameters from other motors (ikincimotor).
export const engineOverrides = {
    // Movement / speed
    MAX_PLAYER_SPEED: 1.15,
    MAX_BALL_SPEED: 4.4,
    // AI ranges (metres)
    SHOOT_RANGE: 32,
    PASS_RANGE_VISION: 52,
    TACKLE_RANGE_BASE: 3.5,
    PRESSING_RANGE: 18,
    // Feature flags
    ENABLE_VER_KAC: true,
    // Tweakable signal/pass weightings (optional)
    SIGNAL_CALL_BONUS: 80,
    SIGNAL_POINT_BONUS: 60,
    RUNNING_PASS_BONUS: 100
};
// Signal tuning
// Aggressive test tuning (user requested stronger/more persistent signals)
engineOverrides.SIGNAL_DURATION = engineOverrides.SIGNAL_DURATION ?? 20; // ticks (longer than default)
engineOverrides.SIGNAL_MEMORY_TICKS = engineOverrides.SIGNAL_MEMORY_TICKS ?? 30; // carrier will remember recent signals
engineOverrides.POINT_PROB = engineOverrides.POINT_PROB ?? 0.20; // chance to emit POINT when sprinting
engineOverrides.CALL_PROB = engineOverrides.CALL_PROB ?? 0.18; // chance to emit CALL when idle/walking
// Also make signal bonuses stronger for testing via overrides
engineOverrides.SIGNAL_CALL_BONUS = engineOverrides.SIGNAL_CALL_BONUS ?? 120;
engineOverrides.SIGNAL_POINT_BONUS = engineOverrides.SIGNAL_POINT_BONUS ?? 90;
