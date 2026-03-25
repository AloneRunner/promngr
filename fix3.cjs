const fs = require('fs');
let c = fs.readFileSync('./src/data/teams.ts', 'utf8');

function fix(name, val) {
  const esc = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const r = new RegExp('(name: "' + esc + '"[\\s\\S]{0,200}?budget: )\\d+');
  if (r.test(c)) {
    c = c.replace(r, '$1' + val);
    console.log('OK: ' + name + ' -> €' + (val/1e6).toFixed(1) + 'M');
  } else {
    console.log('MISS: ' + name);
  }
}

// === GREECE: top 4 too rich (€35-40M → €15-20M) ===
fix('Piraeus', 18000000);
fix('Thessaloniki', 15000000);
fix('Athens AE', 15000000);
fix('Athens P', 13000000);
fix('Thessaloniki Aris', 7000000);
fix('Volos', 3500000);
fix('Peristeri', 4000000);
fix('Tripoli', 3500000);
fix('Heraklion', 3000000);
fix('Agrinio', 2500000);
fix('Lamia', 2000000);
fix('Ioannina', 2200000);
fix('Kifisia', 1800000);
fix('Panserraikos', 2000000);

// === BELGIUM: top teams too rich (€40M → €18M) ===
fix('Bruges Black-Blue', 18000000);   // Club Brugge
fix('Brussels Purple', 15000000);     // Anderlecht
fix('Antwerp Great Old', 12000000);
fix('Genk Smurfs', 11000000);
fix('Gent Buffalos', 10000000);
fix('Liege Reds', 9000000);
fix('Brussels Union', 8000000);
fix('Sint-Truiden Canaries', 4000000);
fix('Charleroi Zebras', 4500000);
fix('Mechelen Yellow-Red', 5000000);
fix('Waregem Farmers', 3500000);
fix('Westerlo Cocks', 3000000);
fix('La Louviere Wolves', 2500000);
fix('Leuven White', 3500000);
fix('Bruges Green-Black', 4000000);
fix('Denderleeuw Blue', 1800000);

// === SCOTLAND: Celtic/Rangers too rich (€35M → €18M) ===
fix('Glasgow Celts', 18000000);
fix('Glasgow Rangers', 15000000);
fix('Aberdeen', 5000000);
fix('Edinburgh Hearts', 4000000);
fix('Edinburgh Hibs', 3500000);
fix('Motherwell', 2500000);
fix('Dundee United', 3000000);
fix('Dundee', 2000000);
fix('Saint Mirren', 2200000);
fix('Kilmarnock', 2500000);
fix('Dingwall', 1500000);
fix('Perth', 1200000);

// === CHINA: modern era (€40M → €10M) ===
fix('Shanghai Port', 10000000);
fix('Beijing Guoan', 9000000);
fix('Shanghai Shenhua', 8000000);
fix('Chengdu Rongcheng', 8000000);
fix('Shandong Taishan', 7000000);
fix('Wuhan Three Towns', 7000000);
fix('Zhejiang FC', 6000000);
fix('Tianjin Jinmen Tiger', 5500000);
fix('Henan FC', 5000000);
fix('Shenzhen City', 5500000);
fix('Changchun Yatai', 4500000);
fix('Qingdao West Coast', 4000000);
fix('Qingdao Hainiu', 4000000);
fix('Cangzhou Mighty Lions', 3500000);
fix('Meizhou Hakka', 3000000);
fix('Nantong Zhiyun', 2800000);

// === ENGLAND lower teams: PL TV money, raise floor ===
fix('Lancashire Clarets', 30000000);
fix('Wearside Black Cats', 28000000);
fix('Forest Archers', 33000000);
fix('South Coast Cherries', 32000000);
fix('Crystal Glaziers', 35000000);
fix('West London Bees', 35000000);

// === LA LIGA lower teams: reduce (no PL TV money) ===
fix('Vallecano Lightning', 12000000);
fix('Vitoria Foxes', 11000000);
fix('Mallorca Islanders', 14000000);
fix('Challengers United', 8000000);
fix('Canary Yellows', 10000000);
fix('Castilla Violet', 8000000);
fix('Pamplona Bulls', 14000000);
fix('South Madrid Blues', 12000000);
fix('Espanyol Parrots', 15000000);

// === SERIE A lower teams: reduce slightly ===
fix('Sassuolo Greenblacks', 12000000);
fix('Udine Friuli', 10000000);
fix('Lecce Wolves', 9000000);
fix('Verona Mastiffs', 9000000);
fix('Cagliari Islanders', 10000000);
fix('Venice Gondoliers', 7000000);
fix('Monza Speed', 9000000);

fs.writeFileSync('./src/data/teams.ts', c);
console.log('\nDONE');
