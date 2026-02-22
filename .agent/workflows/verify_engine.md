---
description: verifying the active match engine version
---

1.  **Open the Match Center**: Start a match or load a save game to enter the match simulation.
2.  **Locate the Engine Version**: Look at the top center of the screen, just below the red "LIVE" indicator.
3.  **Verify the Text**:
    *   **"MATCH ENGINE (ACTIVE v3.1)"**: Confirms you are running the latest `MatchEngine.ts` (Active Engine).
    *   **"G-MOTOR v3.1 (REFERENCE)"**: Confirms you are running `ucuncumotor.ts` directly.
    *   **"IKINCI MOTOR v2.0"**: Confirms you are running `ikincimotor.ts`.
4.  **Troubleshooting**: If you see "Engine v?" or "Engine Not Found", the engine instance might not be initialized correctly or the version property is missing. Ensure you have reloaded the application after the update.
