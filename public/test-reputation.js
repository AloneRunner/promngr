// Bu dosyayı browser'da aç: http://localhost:5173/test-reputation.html
// Reputation formülünün doğru çalışıp çalışmadığını test et

console.log("=== REPUTATION FORMULA TEST ===");

// Test case: Weak team (5000 rep) loses to strong team (8000 rep)
const teamRep = 5000;
const opponentRep = 8000;
const won = false;
const drew = false;

const expectedOutcome = 1 / (1 + Math.pow(10, (opponentRep - teamRep) / 1500));
const actualResult = won ? 1 : drew ? 0.5 : 0;
const kFactor = 8;
let change = Math.round(kFactor * (actualResult - expectedOutcome) * 2.5);

console.log("Expected outcome:", expectedOutcome);
console.log("Actual result:", actualResult);
console.log("Initial change:", change);

// Cap at -15
if (change < -15) {
    console.log("⚠️ CAPPED! Change was", change, "now -15");
    change = -15;
}

console.log("Final change:", change);
console.log(change <= -15 ? "✅ CAP WORKING" : "❌ CAP NOT WORKING");
