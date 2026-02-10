import math

# === GAME CONSTANTS ===
WEEKS_PER_YEAR = 52
STADIUM_CAPACITY_PER_LEVEL = 6000
STADIUM_MIN = 5000

# League Params (Simplified for simulation)
LEAGUES = {
    'es': {'base_ticket': 45, 'coeff': 1.4, 'tv_base': 600000, 'maint_discount': 1.0},
    'ng': {'base_ticket': 3, 'coeff': 0.6, 'tv_base': 50000, 'maint_discount': 0.7} # Assuming Nigeria is low cost
}

class Team:
    def __init__(self, name, league_id, reputation, budget, stadium_level):
        self.name = name
        self.league_id = league_id
        self.reputation = reputation
        self.budget = budget
        self.stadium_level = stadium_level
        self.league_params = LEAGUES[league_id]
        
        # Derived
        self.calculate_capacity()
        
        # Estimations
        self.wages = self.estimate_wages()
        
    def calculate_capacity(self):
        self.capacity = STADIUM_MIN + (self.stadium_level - 1) * STADIUM_CAPACITY_PER_LEVEL

    def estimate_wages(self):
        # Rough correlation: Budget ~ 50x yearly wages? Or Rep based
        # Madrid: 9300 rep -> High wages. 
        # Kun Khalifat: 3500 rep -> Low wages.
        if self.reputation > 8000: return 2500000 # 2.5M/week
        if self.reputation < 4000: return 20000   # 20k/week
        return 500000

    def get_weekly_finances(self, week):
        is_home = week % 2 == 0 # Simple alternate home/away
        
        # === INCOME ===
        # Ticket Price Logic
        league_base = self.league_params['base_ticket']
        # My new logic: Math.max(LeagueBase, TeamRep/100, LeagueRep/150)
        # Assuming LeagueRep ~ TeamRep for top teams, but let's stick to the simpler implemented one:
        # Math.max(LeagueBase, TeamRep/100)
        price = max(league_base, self.reputation / 100)
        
        # Attendance (Simplified)
        # Top team ~ 95%, Bottom ~ 60%
        att_rate = 0.95 if self.reputation > 8000 else 0.60
        attendance = self.capacity * att_rate
        
        ticket_income = 0
        if is_home:
            ticket_income = attendance * price * 1.3 # Home bonus
            
        # TV Rights
        tv = self.league_params['tv_base'] * 1.0 # Avg position
        
        # Merchandise
        merch = (self.reputation * 2) * 1.3 # Simplified
        
        # Sponsor
        sponsor = 50000 * math.sqrt(self.league_params['coeff']) * 1.3
        
        total_income = ticket_income + tv + merch + sponsor
        
        # === EXPENSES ===
        # Maintenance: Level^1.3 * 2000 * Discount * Coeff
        maint_base = 2000
        discount = self.league_params['maint_discount']
        coeff = self.league_params['coeff']
        # Assuming Training/Academy are roughly same level as Stadium for simplicity mult * 3
        # But let's just calc stadium maint and multiply by 2 for others
        stadium_maint = math.pow(self.stadium_level, 1.3) * maint_base * discount * coeff
        total_maint = stadium_maint * 2.5 
        
        total_expense = self.wages + total_maint
        
        return total_income, total_expense

    def get_upgrade_cost(self):
        next_level = self.stadium_level + 1
        if next_level > 25: return float('inf')
        
        base_cost = 2000000
        # levelMultiplier = nextLevel + (nextLevel > 15 ? (nextLevel - 15) * 0.5 : 0);
        # cost = Math.floor(baseCost * levelMultiplier * (1 + nextLevel * 0.05));
        
        level_mult = next_level + ((next_level - 15) * 0.5 if next_level > 15 else 0)
        cost = base_cost * level_mult * (1 + next_level * 0.05)
        return cost

    def simulate_year(self):
        log = []
        upgrades = 0
        
        for w in range(1, 53):
            inc, exp = self.get_weekly_finances(w)
            self.budget += (inc - exp)
            
            # Check Upgrade
            cost = self.get_upgrade_cost()
            # AI Logic: Upgrade if we have 1.5x the cash required (Safety buffer)
            if self.budget > cost * 1.5:
                self.budget -= cost
                self.stadium_level += 1
                self.calculate_capacity()
                upgrades += 1
                log.append(f"Week {w}: Upgraded to Level {self.stadium_level} (Cost: {cost/1_000_000:.2f}M)")
                
        return {
            'end_budget': self.budget,
            'end_level': self.stadium_level,
            'upgrades': upgrades,
            'capacity': self.capacity,
            'log': log
        }

# === RUN SIMULATION ===
print("=== SIMULATION START ===")

# 1. Madrid Blancos (Top Tier)
# Rep 9300, Budget 170M, Cap 81k (Level ~14)
madrid = Team("Madrid Blancos", "es", 9300, 170000000, 14)

print(f"\n--- {madrid.name} (Start) ---")
print(f"Budget: {madrid.budget/1_000_000:.1f}M, Level: {madrid.stadium_level}, Cap: {madrid.capacity}")

for year in range(1, 6): # 5 Years
    res = madrid.simulate_year()
    print(f"Year {year} End: Lvl {res['end_level']}, Cap {res['capacity']}, Budget {res['end_budget']/1_000_000:.1f}M. Upgrades: {res['upgrades']}")
    # for l in res['log']: print(f"  {l}")

# 2. Kun Khalifat FC (Bottom Tier)
# Rep 3500, Budget 1M, Cap 3000 -> Level 1 (Actually 3000 is < 5000 min, but let's say Level 1)
# Note: Team data says 3000 capacity, Min is 5000. Engine defaults to Lvl 1.
kun = Team("Kun Khalifat FC", "ng", 3500, 1000000, 1)

print(f"\n--- {kun.name} (Start) ---")
print(f"Budget: {kun.budget/1_000_000:.1f}M, Level: {kun.stadium_level}, Cap: {kun.capacity}")

for year in range(1, 11): # 10 Years
    res = kun.simulate_year()
    print(f"Year {year} End: Lvl {res['end_level']}, Cap {res['capacity']}, Budget {res['end_budget']/1_000_000:.1f}M. Upgrades: {res['upgrades']}")

