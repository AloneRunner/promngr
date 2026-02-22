# AI Analysis: MatchEngine (Current Production Engine)

## Strengths (Keep/Port)
*   **Proactive Signal System:** The engine actively updates player signals (`updatePlayerSignals`) every tick, allowing for organic "Call for Ball" or "Point to Space" behaviors.
*   **Anti-Backpass Logic:** Explicitly penalizes backward passes (-150 Score) when the player has open space ahead, forcing a more progressive playstyle.
*   **Smart Free Kicks:** A detailed physics simulation for free kicks that considers wall height, blockers, and "Dead Ball" specialist traits.
*   **Performance Optimizations:** Uses direct object property injection for stamina updates instead of expensive deep cloning, ensuring 60 FPS on mobile.
*   **G Motor: Ver-Kaç:** Specifically implements "Pass & Move" logic where attackers sprint forward immediately after passing.

## Weaknesses (Fix/Improve)
*   **GK 1v1 Nerf:** Goalkeepers have a hard-coded penalty (-15 Save Chance) in 1v1 situations. While realistic for average keepers, it makes elite keepers feel too easy to beat.
*   **Reckless Aggression:** Similar to `ucuncumotor`, the "Reckless" setting has an extremely high red card probability (8% per foul).
*   **Strict Offside Check:** The offside logic in `updateBallPhysics` (lines 2447+) might be too aggressive in canceling loose ball recoveries if a player is marginally offside but not interfering with play.

## Unique Features (Consider Porting to Other Engines)
*   **Panther Mode v2:** A complex save formula involving ball speed, reflex deficits, and positioning bonuses.
*   **Isolated Hold Up:** Logic to detect when a player is isolated and force them to hold the ball and signal for support.
*   **Wall Block Physics:** Calculates if a free kick hits the wall based on player height and jump stats.
