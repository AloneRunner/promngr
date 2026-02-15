# Fix Dribbling PowerShell Script
$file = "c:\Users\kaano\OneDrive\Desktop\10\services\MatchEngine.ts"
$lines = Get-Content $file

$startLine = -1
$endLine = -1

for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match "// === PASSING STYLE SPECIFIC BEHAVIORS ===") {
        $startLine = $i
    }
    if ($startLine -ge 0 -and $lines[$i] -match "// --- EXECUTE DECISION ---") {
        $endLine = $i - 1
        break
    }
}

if ($startLine -ge 0 -and $endLine -gt $startLine) {
    Write-Host "Found section: lines $startLine to $endLine"
    
    $newCode = @"
            // === PASSING STYLE SPECIFIC BEHAVIORS ===
            // AGGRESSIVE FIX: Calim HER ZAMAN aktif!
            
            if (tactic.passingStyle === 'Direct') {
                dribbleScore += 120;
                if (spaceObstacles.length === 0) dribbleScore += 60;
                if (isBackPass && pressure === 0) passScore -= 200;
            } else if (tactic.passingStyle === 'Short') {
                dribbleScore += 30;
                passScore += 50;
                if (spaceObstacles.length === 0) dribbleScore += 40;
            } else if (tactic.passingStyle === 'Mixed') {
                dribbleScore += 70;
                if (spaceObstacles.length === 0) dribbleScore += 50;
                if (isBackPass && pressure === 0) passScore -= 80;
            } else {
                dribbleScore += 80;
                if (spaceObstacles.length === 0) dribbleScore += 40;
                if (isBackPass && pressure === 0) passScore -= 150;
            }
            
            if (p.attributes.dribbling > 70) {
                const skillBonus = (p.attributes.dribbling - 70) * 2;
                dribbleScore += skillBonus + 80;
            }
            
            const enemyTeam = isHome ? this.awayPlayers.filter(e => e.lineup === 'STARTING') : this.homePlayers.filter(e => e.lineup === 'STARTING');
            let nearestPresser = null;
            let nearestPresserDist = 999;
            enemyTeam.forEach(enemy => {
                const enemyPos = this.sim.players[enemy.id];
                if (!enemyPos) return;
                const d = dist(simP.x, simP.y, enemyPos.x, enemyPos.y);
                if (d < nearestPresserDist) { nearestPresserDist = d; nearestPresser = enemy; }
            });
            
            if (nearestPresser && nearestPresserDist < 10) {
                const myDribbling = p.attributes.dribbling || 50;
                const presserTackling = nearestPresser.attributes.tackling || 50;
                const skillDiff = myDribbling - presserTackling;
                if (skillDiff > 8) {
                    dribbleScore += skillDiff * 3;
                }
            }

"@
    
    $before = $lines[0..($startLine - 1)]
    $after = $lines[$endLine..$lines.Count]
    
    $newLines = $before + $newCode.Split("`n") + $after
    $newLines | Set-Content $file -Encoding UTF8
    
    Write-Host "SUCCESS: Dribbling fix applied!"
} else {
    Write-Host "ERROR: Could not find section"
}
