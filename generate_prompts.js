const fs = require('fs');

const teamsFilePath = 'C:\\Users\\kaano\\OneDrive\\Desktop\\10\\src\\data\\teams.ts';
console.log('Reading:', teamsFilePath);

try {
    const teamsFile = fs.readFileSync(teamsFilePath, 'utf8');
    console.log('File read successfully, size:', teamsFile.length);

    // Flexible regex for league presets
    const leagueRegex = /\{[\s\S]*?id:\s*['"](\w+)['"],[\s\S]*?name:\s*['"](.*?)['"],[\s\S]*?country:\s*['"](.*?)['"],[\s\S]*?realTeams:\s*\[([\s\S]*?)\]\s*\}/g;
    // Flexible regex for teams
    const teamRegex = /\{[\s\S]*?name:\s*['"](.*?)['"],[\s\S]*?primaryColor:\s*['"](.*?)['"],[\s\S]*?secondaryColor:\s*['"](.*?)['"][\s\S]*?\}/g;

    const flags = {
        'pt': '🇵🇹', 'mx': '🇲🇽', 'na': '🇺🇸', 'ma': '🇲🇦', 'dz': '🇩🇿', 'eg': '🇪🇬',
        'kr': '🇰🇷', 'jp': '🇯🇵', 'sa': '🇸🇦', 'uy': '🇺🇾', 'cl': '🇨🇱', 'co': '🇨🇴',
        'ru': '🇷🇺', 'be': '🇧🇪', 'nl': '🇳🇱'
    };

    const missingLeagues = ['pt', 'mx', 'na', 'ma', 'dz', 'eg', 'kr', 'jp', 'sa', 'uy', 'cl', 'co', 'ru', 'be', 'nl'];

    let match;
    let output = '';
    let foundLeagues = 0;

    while ((match = leagueRegex.exec(teamsFile)) !== null) {
        const id = match[1];
        if (!missingLeagues.includes(id)) continue;

        foundLeagues++;
        const name = match[2];
        const country = match[3];
        const flag = flags[id] || '🏳️';
        const teamsText = match[4];

        console.log(`Processing League: ${name} (${id})`);

        output += `\n---\n\n## ${flag} ${name} (${country})\n\n| Team Name | Prompt |\n|:---|:---|\n`;

        let teamMatch;
        let teamCount = 0;
        // Reset teamRegex lastIndex for each league
        const currentTeamRegex = new RegExp(teamRegex);
        while ((teamMatch = currentTeamRegex.exec(teamsText)) !== null) {
            teamCount++;
            const teamName = teamMatch[1];
            const primary = teamMatch[2];
            const secondary = teamMatch[3];

            let icon = 'shield';
            const lowerName = teamName.toLowerCase();
            if (lowerName.includes('lion')) icon = 'lion head';
            else if (lowerName.includes('tiger')) icon = 'tiger head';
            else if (lowerName.includes('eagle')) icon = 'eagle';
            else if (lowerName.includes('dragon')) icon = 'dragon';
            else if (lowerName.includes('warrior')) icon = 'warrior';
            else if (lowerName.includes('wolf')) icon = 'wolf head';
            else if (lowerName.includes('pirate')) icon = 'pirate skull';
            else if (lowerName.includes('star')) icon = 'star';
            else if (lowerName.includes('sun')) icon = 'sun';
            else if (lowerName.includes('bull')) icon = 'bull head';
            else if (lowerName.includes('ship') || lowerName.includes('sailor')) icon = 'sailing ship';
            else if (lowerName.includes('anchor')) icon = 'anchor';
            else if (lowerName.includes('train') || lowerName.includes('railway')) icon = 'locomotive';
            else if (lowerName.includes('knight')) icon = 'knight helmet';
            else if (lowerName.includes('devil')) icon = 'devil head';
            else if (lowerName.includes('tower')) icon = 'tower silhouette';
            else if (lowerName.includes('mountain')) icon = 'mountain peak';
            else if (lowerName.includes('wave')) icon = 'ocean wave';
            else if (lowerName.includes('shark')) icon = 'shark head';
            else if (lowerName.includes('cat')) icon = 'cat head';
            else if (lowerName.includes('dog')) icon = 'dog head';
            else if (lowerName.includes('bird')) icon = 'bird silhouette';
            else if (lowerName.includes('rooster')) icon = 'rooster';
            else if (lowerName.includes('canary')) icon = 'canary bird';
            else if (lowerName.includes('puma')) icon = 'puma head';
            else if (lowerName.includes('leopard')) icon = 'leopard head';
            else if (lowerName.includes('horse')) icon = 'horse head';
            else if (lowerName.includes('camel')) icon = 'camel';
            else if (lowerName.includes('elephant')) icon = 'elephant';
            else if (lowerName.includes('fox')) icon = 'fox head';
            else if (lowerName.includes('castle')) icon = 'castle fortress';
            else if (lowerName.includes('crown')) icon = 'crown';
            else if (lowerName.includes('steel')) icon = 'steel beam or anvil';
            else if (lowerName.includes('miner')) icon = 'pickaxes or miner lamp';

            output += `| **${teamName}** | A modern esports logo for a football club named '${teamName}'. Main icon: A stylized ${icon}. Colors: ${primary} and ${secondary}. Style: Modern, sleek vector, premium feel, white background. |\n`;
        }
        console.log(`  Found ${teamCount} teams`);
    }

    if (foundLeagues === 0) {
        console.log('No matching leagues found.');
    } else {
        const outPath = 'C:\\Users\\kaano\\OneDrive\\Desktop\\10\\generated_missing_prompts.md';
        fs.writeFileSync(outPath, output);
        console.log(`Successfully generated prompts for ${foundLeagues} leagues to:`, outPath);
    }
} catch (err) {
    console.error('Error occurred:', err.message);
    process.exit(1);
}
