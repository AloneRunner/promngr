// Verification Script for Capacity & Dynamic Reputation

// Mock Data
const team = {
    id: 'team_1',
    name: 'Istanbul Arena',
    leagueId: 'tr',
    reputation: 2000,
    facilities: {
        stadiumLevel: 10,
        stadiumCapacity: 59000 // The "Real" value in state
    }
};

// 1. Capacity Mismatch Simulation
const formulaCapacity = 5000 + (team.facilities.stadiumLevel - 1) * 6000;
console.log(`--- Capacity Check ---`);
console.log(`State Capacity: ${team.facilities.stadiumCapacity}`);
console.log(`Formula Capacity (Level ${team.facilities.stadiumLevel}): ${formulaCapacity}`);
console.log(`Mismatch? ${team.facilities.stadiumCapacity !== formulaCapacity}`);

// 2. Dynamic League Reputation Simulation
// Current Logic: Static defaults
const LEAGUE_TICKET_PRICES = { 'tr': 18, 'en': 55 };

// Proposed Logic: Dynamic Modifier based on "World Reputation"
// We need a way to track League Reputation over time.
let leagueReputations = {
    'tr': 4000, // Starting Rep
    'en': 8500  // Starting Rep
};

const getDynamicTicketPrice = (leagueId, teamRep) => {
    const leagueRep = leagueReputations[leagueId];
    // Base price derived from League Rep (e.g., Rep / 150)
    // 4000 / 150 = ~26. 8500 / 150 = ~56.
    const leagueBasePrice = Math.floor(leagueRep / 150);

    // Team Rep Bonus (TeamRep / 100)
    // 2000 / 100 = 20.
    const teamComponent = Math.floor(teamRep / 100);

    return Math.max(leagueBasePrice, teamComponent);
};

console.log(`\n--- Dynamic Pricing & Reputation Check ---`);
console.log(`TR League Rep: ${leagueReputations['tr']}`);
console.log(`TR Base Price (Derived): ${Math.floor(leagueReputations['tr'] / 150)}`);
console.log(`Team Rep: ${team.reputation}`);
console.log(`Ticket Price: ${getDynamicTicketPrice('tr', team.reputation)}`);

// Simulate Time Passing: TR League becomes successful (e.g. 10 years later)
leagueReputations['tr'] = 9000; // Overtook England!
console.log(`\n[FUTURE] TR League Rep: ${leagueReputations['tr']} (Super League!)`);
console.log(`TR Base Price (Derived): ${Math.floor(leagueReputations['tr'] / 150)}`);
console.log(`Ticket Price: ${getDynamicTicketPrice('tr', team.reputation)}`);
