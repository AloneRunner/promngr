# Create tactics.ts
$tacticsPath = "src/data/tactics.ts"
if (Test-Path $tacticsPath) { Remove-Item $tacticsPath }
Set-Content $tacticsPath -Value "import { TeamTactic, TacticType } from '../types';" -Encoding UTF8
$teamsContent = Get-Content src/data/teams.ts -Encoding UTF8
$tacticsData = $teamsContent | Select-Object -Skip 725 -First 4564
Add-Content $tacticsPath -Value $tacticsData -Encoding UTF8

# Create players.ts
$playersPath = "src/data/players.ts"
if (Test-Path $playersPath) { Remove-Item $playersPath }
$imports = $teamsContent | Select-Object -First 447
$imports = $imports -replace '\./data/', './'
$names = $teamsContent | Select-Object -Skip 508 -First 217
$squads = $teamsContent | Select-Object -Skip 5871 -First 164
$real = $teamsContent | Select-Object -Skip 6036 -First 1

Set-Content $playersPath -Value $imports -Encoding UTF8
Add-Content $playersPath -Value "`n" -Encoding UTF8
Add-Content $playersPath -Value $names -Encoding UTF8
Add-Content $playersPath -Value "`nexport const ALL_SQUADS = [" -Encoding UTF8
Add-Content $playersPath -Value $squads -Encoding UTF8
Add-Content $playersPath -Value "`n" -Encoding UTF8
Add-Content $playersPath -Value $real -Encoding UTF8

# Create teams.ts (Cleaned)
$newTeamsPath = "src/data/teams.ts.new"
$presets = $teamsContent | Select-Object -Skip 5290 -First 578
$derby = $teamsContent | Select-Object -Skip 6049

Set-Content $newTeamsPath -Value "import { LeaguePreset } from '../types';" -Encoding UTF8
Add-Content $newTeamsPath -Value "`n" -Encoding UTF8
Add-Content $newTeamsPath -Value $presets -Encoding UTF8
Add-Content $newTeamsPath -Value "`n" -Encoding UTF8
Add-Content $newTeamsPath -Value $derby -Encoding UTF8

# Overwrite teams.ts
Move-Item -Force $newTeamsPath src/data/teams.ts
