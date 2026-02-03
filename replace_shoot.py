
import os

path = r"c:\Users\kaano\OneDrive\Desktop\10\services\MatchEngine.ts"
with open(path, "r", encoding="utf-8") as f:
    lines = f.readlines()

# 0-indexed
start_idx = 3748
end_idx = 3956

# Verify
if "private actionShoot" not in lines[start_idx]:
    print(f"Error: Line {start_idx+1} is not actionShoot: {lines[start_idx]}")
    exit(1)

new_content = """    private actionShoot(p: Player, isHome: boolean) {
        const pos = this.sim.players[p.id];
        const goalX = isHome ? 100 : 0;
        const goalY = 50;
        const state = this.playerStates[p.id];

        // === YORGUNLUK DAHİL GERÇEK STATLAR ===
        const isGK = p.position === Position.GK;
        const fatigueMods = getAllFatigueModifiers(state.currentStamina, isGK);

        const fin = p.attributes.finishing * fatigueMods.finishing;
        const pwr = p.attributes.strength * fatigueMods.strength;
        const composure = p.attributes.composure * fatigueMods.composure;
        // Decisions impact spread
        const decisions = p.attributes.decisions * fatigueMods.decisions;

        // === DEBUG LOG ===
        // console.log(`🎯 ŞUT: ${p.lastName} | Fin: ${fin.toFixed(1)}`);

        const distToGoal = dist(pos.x, pos.y, goalX, 50);

        // === xG HESABI (Sadeleştirilmiş) ===
        const baseXG = Math.max(0.01, (0.45 - (distToGoal / 80)));
        const finishingMod = 0.5 + (fin / 100) * 0.7;
        const xGValue = baseXG * finishingMod;

        // Stat Update
        if (isHome) {
            this.match.stats.homeShots++;
            this.match.stats.homeXG += xGValue;
        } else {
            this.match.stats.awayShots++;
            this.match.stats.awayXG += xGValue;
        }

        const enemyPlayers = isHome ? this.awayPlayers : this.homePlayers;
        const gk = enemyPlayers.find(ep => this.playerRoles[ep.id] === Position.GK);
        let targetY = goalY;

        // Composure etkisi: Target selection modification
        const confidence = ((fin - 50) / 50) * (composure / 100);
        const cornerBias = Math.max(0.6, confidence);

        if (gk && this.sim.players[gk.id]) {
            const gkY = this.sim.players[gk.id].y;
            // Aim for corners away from GK
            if (gkY > 50) targetY = lerp(50, GOAL_Y_TOP + 1, cornerBias);
            else targetY = lerp(50, GOAL_Y_BOTTOM - 1, cornerBias);
        } else {
            targetY = 50;
        }

        const dy = targetY - pos.y;
        const dx = goalX - pos.x;
        const angle = Math.atan2(dy, dx);

        let accuracyPenalty = 0;
        const currentSpeed = Math.sqrt(this.sim.players[p.id].vx ** 2 + this.sim.players[p.id].vy ** 2);

        if (currentSpeed > MAX_PLAYER_SPEED * 0.5) accuracyPenalty += 0.15;
        if (currentSpeed > MAX_PLAYER_SPEED * 0.9) accuracyPenalty += 0.25;

        // === SPECIAL SHOT TYPES ===
        let shotType = 'NORMAL';
        let traceText = `${p.lastName} şut çekti!`;
        const ballZ = this.sim.ball.z || 0;

        // 1. VOLLEY / BICYCLE KICK
        if (ballZ > 0.6) {
             if (ballZ > 1.4 && (p.playStyles?.includes("Akrobatik") || p.playStyles?.includes("Akrobatik+"))) {
                 shotType = 'BICYCLE';
                 traceText = `🚲 ${p.lastName} RÖVEŞATA DENEDİ!`;
                 accuracyPenalty += 0.3; // Hard
             } else {
                 shotType = 'VOLLEY';
                 traceText = `🚀 ${p.lastName} gelişine vurdu!`;
                 accuracyPenalty += 0.15;
             }
        }

        // 2. CHIP SHOT (AŞIRTMA) - 1v1 and GK is out
        if (shotType === 'NORMAL' && distToGoal < 22) {
             const gkPos = gk ? this.sim.players[gk.id] : null;
             if (gkPos) {
                 const distGKToGoal = isHome ? gkPos.x : (100 - gkPos.x); // approx
                 if (distGKToGoal > 8) { // GK is far out (>8m)
                     const hasChipTrait = p.playStyles?.includes("Aşırtma") || p.playStyles?.includes("Aşırtma+");
                     // High flair players try it
                     if (hasChipTrait || (p.attributes.dribbling > 85 && Math.random() < 0.3)) {
                         shotType = 'CHIP';
                         traceText = `✨ ${p.lastName} kalecinin üstünden aşırtıyor!`;
                     }
                 }
             }
        }

        // === ACCURACY & SPREAD ===
        let baseSpread: number;
        if (fin >= 95) baseSpread = 0.05 + (100 - fin) * 0.005;
        else if (fin >= 85) baseSpread = 0.10 + (95 - fin) * 0.005;
        else if (fin >= 70) baseSpread = 0.18 + (85 - fin) * 0.008;
        else if (fin >= 50) baseSpread = 0.30 + (70 - fin) * 0.01;
        else baseSpread = 0.50 + (50 - fin) * 0.015;

        let spread = baseSpread + accuracyPenalty;

        // Pressure Effect
        let pressureMod = 1.0;
        const defendingPlayers = isHome ? this.awayPlayers : this.homePlayers;
        const nearbyDefenders = defendingPlayers.filter(e => {
            const ePos = this.sim.players[e.id];
            return ePos && dist(ePos.x, ePos.y, pos.x, pos.y) < 4.0;
        });

        if (nearbyDefenders.length > 0) {
            const pressureResist = (p.personality?.pressureHandling || 0.5);
            const impact = 1.0 - (pressureResist * 0.6); // Better resist
            pressureMod += (nearbyDefenders.length * 0.30 * impact);
        }
        spread *= pressureMod;

        // Distance Penalty
        if (distToGoal > 25) {
            const extraDist = distToGoal - 25;
            spread *= (1.0 + (extraDist * 0.035)); 
        }

        // Fatigue Decision Impact
        spread *= (1 + (1 - fatigueMods.decisions) * 0.4);

        // Shot Speed
        let shotSpeed = 2.8 + (pwr / 70);
        shotSpeed *= fatigueMods.speed;

        // Playstyle Effects on Shot
        if (p.playStyles?.includes("Plase Şut")) {
             spread *= 0.75;
             shotSpeed *= 0.90;
        }
        if (p.playStyles?.includes("Kuvvetli Şut")) {
             shotSpeed *= 1.25;
             spread *= 1.15;
        }
        if (shotType === 'BICYCLE') {
            shotSpeed *= 1.1; // Powerful
            spread *= 1.5; // Inaccurate
        }
        if (shotType === 'CHIP') {
             shotSpeed *= 0.6; // Slow
             spread *= 0.8; // Precise vertical
        }

        const shotAngle = angle + (Math.random() * spread - spread / 2);

        // Target Check
        const finalYAtGoal = pos.y + (goalX - pos.x) * Math.tan(shotAngle);
        const isOnTarget = finalYAtGoal > GOAL_Y_TOP && finalYAtGoal < GOAL_Y_BOTTOM;
        if (isOnTarget) {
            if (isHome) this.match.stats.homeOnTarget++;
            else this.match.stats.awayOnTarget++;
        }

        // BLOCK CHECK
        const enemies = (isHome ? this.awayPlayers : this.homePlayers).filter(e => e.lineup === 'STARTING');
        for (const e of enemies) {
            const ePos = this.sim.players[e.id];
            if (!ePos || e.position === Position.GK) continue; // Skip GK (handled later)
            
            const d = dist(pos.x, pos.y, ePos.x, ePos.y);
            if (d < 3) {
                const angleToE = Math.atan2(ePos.y - pos.y, ePos.x - pos.x);
                if (Math.abs(angleToE - shotAngle) < 0.4) {
                     // Block Chance
                     let blockChance = 0.4;
                     if (e.playStyles?.includes("Engel")) blockChance += 0.3;
                     
                     if (Math.random() < blockChance) {
                        this.traceLog.push(`${e.lastName} şutu blokladı!`);
                        this.sim.ball.ownerId = null;
                        this.sim.ball.vx = (Math.random() - 0.5) * 2;
                        this.sim.ball.vy = (Math.random() - 0.5) * 2;
                        this.playerStates[p.id].possessionCooldown = 20;
                        this.lastTouchTeamId = e.teamId;
                        return;
                    }
                }
            }
        }

        // EXECUTE SHOT
        this.sim.ball.ownerId = null;
        this.sim.ball.vx = Math.cos(shotAngle) * shotSpeed;
        this.sim.ball.vy = Math.sin(shotAngle) * shotSpeed;
        
        // Z-Axis Physics
        if (shotType === 'CHIP') {
            this.sim.ball.vz = 2.2 + Math.random() * 0.5; // High arc
        } else if (distToGoal > 25) {
             this.sim.ball.vz = 0.5 + Math.random(); // Long shots rise
        } else {
             this.sim.ball.vz = 0.2 + (Math.random() * 0.7); // Low driven
        }

        // Curve
        if (p.playStyles.includes("Plase Şut") || Math.random() > 0.75) {
            const yDiff = pos.y - 50;
            this.sim.ball.curve = yDiff > 0 ? -0.8 : 0.8;
        } else { this.sim.ball.curve = 0; }

        this.playerStates[p.id].possessionCooldown = 15;
        this.sim.players[p.id].state = 'KICK';
        this.lastTouchTeamId = p.teamId;
        this.lastShooterId = p.id;
        this.traceLog.push(traceText);
    }
"""

# Replace
lines[start_idx:end_idx] = [new_content + "\n"]

with open(path, "w", encoding="utf-8") as f:
    f.writelines(lines)
