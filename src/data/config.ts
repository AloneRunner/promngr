
export const TICKET_PRICE = 50; // Base price, adjusted by league

// Realistic ticket prices by league (in EUR) - Average prices
export const LEAGUE_TICKET_PRICES: Record<string, number> = {
    'tr': 18,     // Turkey average €18 (range €10-30)
    'en': 55,     // England average €55 (range €40-100)
    'es': 45,     // Spain average €45 (range €30-80)
    'it': 40,     // Italy average €40 (range €25-70)
    'de': 35,     // Germany average €35 (range €20-60)
    'fr': 40,     // France average €40 (range €25-70)
    'ar': 15,     // Argentina average €15 (range €8-25)
    'br': 12,     // Brazil average €12 (range €5-20)
    'na': 40,     // USA/MLS average €40
    'jp': 25,     // Japan average €25
    'kr': 20,     // South Korea average €20
    'au': 30,     // Australia average €30
    'sa': 20,     // Saudi Arabia average €20
    'mx': 15,     // Mexico average €15
    'cl': 12,     // Chile average €12
    'uy': 12,     // Uruguay average €12
    'co': 10,     // Colombia average €10
    'ma': 8,      // Morocco average €8
    'za': 8,      // South Africa average €8
    'eg': 5,      // Egypt average €5
    'car': 5,     // Caribbean average €5
    'default': 25
};

// Attendance rates by league (base rates, can go to 100% for derbies/big games)
export const LEAGUE_ATTENDANCE_RATES: Record<string, { min: number; max: number }> = {
    'tr': { min: 0.50, max: 0.95 },   // Turkey
    'en': { min: 0.85, max: 1.00 },   // England
    'es': { min: 0.65, max: 0.95 },   // Spain
    'it': { min: 0.60, max: 0.90 },   // Italy
    'de': { min: 0.88, max: 1.00 },   // Germany
    'fr': { min: 0.70, max: 0.95 },   // France
    'ar': { min: 0.60, max: 0.98 },   // Argentina
    'br': { min: 0.65, max: 0.98 },   // Brazil
    'na': { min: 0.70, max: 0.95 },   // USA
    'jp': { min: 0.60, max: 0.90 },   // Japan
    'kr': { min: 0.50, max: 0.85 },   // Korea
    'au': { min: 0.40, max: 0.80 },   // Australia
    'sa': { min: 0.30, max: 0.95 },   // Saudi (High variance)
    'mx': { min: 0.60, max: 0.95 },   // Mexico
    'cl': { min: 0.50, max: 0.90 },   // Chile
    'uy': { min: 0.50, max: 0.90 },   // Uruguay
    'co': { min: 0.50, max: 0.90 },   // Colombia
    'ma': { min: 0.50, max: 0.95 },   // Morocco
    'za': { min: 0.40, max: 0.85 },   // South Africa
    'eg': { min: 0.40, max: 0.95 },   // Egypt
    'car': { min: 0.30, max: 0.80 },  // Caribbean
    'default': { min: 0.50, max: 0.80 }
};
