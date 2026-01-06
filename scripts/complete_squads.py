#!/usr/bin/env python3
"""
Takım kadrolarını tamamlayan script
Her takımda 23 oyuncu olacak şekilde eksikleri ekler
"""

import os
import re
from typing import List, Dict

# Takım seviyeleri (ortalama rating aralıkları)
TEAM_TIERS = {
    # Tier S - Dünya devleri (80-91)
    'madrid_blancos': (82, 91, 'Real Madrid'),
    'paris_saint': (80, 90, 'PSG'),
    'mancity': (80, 90, 'Man City'),
    'bayern_munich': (78, 89, 'Bayern'),
    'liverpool': (78, 88, 'Liverpool'),
    
    # Tier A - Büyük takımlar (75-85)
    'catalonia_blaugrana': (75, 88, 'Barcelona'),
    'arsenal': (75, 85, 'Arsenal'),
    'madrid_indios': (74, 84, 'Atletico'),
    'inter': (74, 84, 'Inter'),
    'milan': (73, 83, 'Milan'),
    'dortmund_fc': (73, 83, 'Dortmund'),
    'leipzig_bulls': (72, 82, 'Leipzig'),
    'bayer_leverkusen': (72, 82, 'Leverkusen'),
    
    # Tier B - İyi takımlar (70-80)
    'galatasaray': (70, 82, 'Galatasaray'),
    'fenerbahce': (70, 82, 'Fenerbahce'),
    'besiktas': (68, 80, 'Besiktas'),
    'juventus': (70, 81, 'Juventus'),
    'napoli': (70, 80, 'Napoli'),
    'roma': (68, 79, 'Roma'),
    'tottenham': (68, 79, 'Tottenham'),
    'chelsea': (68, 79, 'Chelsea'),
    
    # Tier C - Orta seviye (65-75)
    'trabzonspor': (65, 78, 'Trabzonspor'),
    'basaksehir': (64, 76, 'Basaksehir'),
    'samsunspor': (63, 75, 'Samsunspor'),
    'atalanta': (65, 76, 'Atalanta'),
    'lazio': (64, 75, 'Lazio'),
    'fiorentina': (63, 74, 'Fiorentina'),
    'astonvilla': (63, 74, 'Aston Villa'),
    'westham': (62, 73, 'West Ham'),
    
    # Tier D - Alt orta (60-70)
    'rizespor': (60, 73, 'Rizespor'),
    'antalyaspor': (60, 72, 'Antalyaspor'),
    'konyaspor': (58, 70, 'Konyaspor'),
    'kasimpasa': (58, 70, 'Kasimpasa'),
    'alanyaspor': (57, 69, 'Alanyaspor'),
    'kayserispor': (57, 69, 'Kayserispor'),
    'goztepe': (56, 68, 'Goztepe'),
    'wolves': (60, 70, 'Wolves'),
    'brighton': (60, 70, 'Brighton'),
    
    # Tier E - Alt sıra (54-68)
    'karagumruk': (54, 74, 'Karagumruk'),
    'gaziantep': (54, 67, 'Gaziantep'),
    'eyupspor': (54, 67, 'Eyupspor'),
    'genclerbirligi': (54, 66, 'Genclerbirligi'),
    'kocaelispor': (54, 66, 'Kocaelispor'),
    'burnley': (55, 67, 'Burnley'),
    'leeds': (55, 67, 'Leeds'),
}

# Türk isimleri (telif için değiştirilmiş)
TURKISH_FIRST_NAMES = [
    'Mehmet', 'Ahmet', 'Mustafa', 'Ali', 'Hasan', 'Hüseyin', 'İbrahim', 'Mahmut',
    'Emre', 'Burak', 'Kerem', 'Eren', 'Arda', 'Ozan', 'Serkan', 'Murat',
    'Berkay', 'Furkan', 'Onur', 'Deniz', 'Alper', 'Cem', 'Yunus', 'Barış',
    'Oğuz', 'Volkan', 'Tolga', 'Çağlar', 'Kaan', 'Batuhan', 'Yusuf', 'Selçuk'
]

TURKISH_LAST_NAMES = [
    'Yılmaz', 'Kaya', 'Demir', 'Çelik', 'Şahin', 'Yıldız', 'Aydın', 'Öztürk',
    'Arslan', 'Doğan', 'Aslan', 'Çetin', 'Koç', 'Kurt', 'Özdemir', 'Şen',
    'Özgür', 'Polat', 'Erdoğan', 'Aktaş', 'Güler', 'Akın', 'Eren', 'Karataş',
    'Kılıç', 'Güneş', 'Tekin', 'Bulut', 'Yavuz', 'Demirci', 'Özer', 'Türk'
]

# Pozisyonlar ve dağılımları
POSITIONS = {
    'KL': 3,    # Kaleci
    'STP': 4,   # Stoper
    'SĞB': 2,   # Sağ bek
    'SLB': 2,   # Sol bek
    'MDO': 3,   # Merkez defansif orta
    'MO': 3,    # Merkez orta
    'MOO': 2,   # Merkez ofansif orta
    'SĞO': 2,   # Sağ kanat
    'SLO': 2,   # Sol kanat
    'SNT': 2,   # Santrafor
}

def get_team_tier(team_name: str):
    """Takımın seviyesini döndür"""
    if team_name in TEAM_TIERS:
        return TEAM_TIERS[team_name]
    # Default: orta seviye
    return (60, 72, team_name.replace('_', ' ').title())

def count_existing_players(file_path: str) -> int:
    """Dosyadaki oyuncu sayısını say"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            return len(re.findall(r'^\s*ad:', content, re.MULTILINE))
    except:
        return 0

def parse_existing_positions(file_path: str) -> Dict[str, int]:
    """Mevcut oyuncuların pozisyonlarını say"""
    positions = {}
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            for match in re.finditer(r'mevki:\s*"([^"]+)"', content):
                pos = match.group(1)
                positions[pos] = positions.get(pos, 0) + 1
    except:
        pass
    return positions

def generate_player(position: str, rating: int, age: int, nationality: str, team_name: str, is_turkish: bool):
    """Oyuncu verisi oluştur"""
    
    # İsim oluştur
    if is_turkish:
        first = TURKISH_FIRST_NAMES[hash(f"{team_name}{position}{rating}") % len(TURKISH_FIRST_NAMES)]
        last = TURKISH_LAST_NAMES[hash(f"{team_name}{position}{rating}{age}") % len(TURKISH_LAST_NAMES)]
        name = f"{first} {last}"
    else:
        # Yabancı isimler için basit jenerik isimler
        first_names = ['Marco', 'Lucas', 'David', 'Carlos', 'Andre', 'João', 'Pedro', 'Diego']
        last_names = ['Silva', 'Santos', 'Costa', 'Perez', 'Garcia', 'Martinez', 'Lopez', 'Rodriguez']
        first = first_names[hash(f"{position}{rating}") % len(first_names)]
        last = last_names[hash(f"{team_name}{age}") % len(last_names)]
        name = f"{first} {last}"
    
    # Pozisyona göre özellikler
    if position == 'KL':
        attrs = {
            'hiz': min(75, rating - 10),
            'sut': 20,
            'pas': 40,
            'dribbling': 25,
            'defans': 25,
            'fizik': min(80, rating)
        }
        details = f"ucma: {rating - 10}, refleks: {rating}, vurus: {rating - 5}, pozisyon: {rating - 8}, top_kontrol: {rating - 12}"
    elif position in ['STP', 'SĞB', 'SLB']:
        attrs = {
            'hiz': rating - 10,
            'sut': rating - 25,
            'pas': rating - 8,
            'dribbling': rating - 10,
            'defans': rating,
            'fizik': rating - 5
        }
        details = f"ayakta_mudahale: {rating}, top_kesme: {rating - 5}, kafa_isabeti: {rating - 10}, guc: {rating - 8}"
    elif position in ['MDO']:
        attrs = {
            'hiz': rating - 15,
            'sut': rating - 20,
            'pas': rating - 5,
            'dribbling': rating - 8,
            'defans': rating,
            'fizik': rating - 5
        }
        details = f"top_kesme: {rating}, ayakta_mudahale: {rating - 5}, dayaniklilik: {rating - 3}, kisa_pas: {rating - 8}"
    elif position in ['MO', 'MOO']:
        attrs = {
            'hiz': rating - 12,
            'sut': rating - 10,
            'pas': rating,
            'dribbling': rating - 5,
            'defans': rating - 15,
            'fizik': rating - 10
        }
        details = f"vizyon: {rating - 5}, kisa_pas: {rating}, top_kontrol: {rating - 8}, dayaniklilik: {rating - 12}"
    elif position in ['SĞO', 'SLO']:
        attrs = {
            'hiz': rating + 5,
            'sut': rating - 5,
            'pas': rating - 8,
            'dribbling': rating + 2,
            'defans': 35,
            'fizik': rating - 15
        }
        details = f"dribbling: {rating}, ceviklik: {rating + 3}, orta_acma: {rating - 10}, sprint: {rating + 5}"
    else:  # SNT
        attrs = {
            'hiz': rating,
            'sut': rating + 3,
            'pas': rating - 15,
            'dribbling': rating - 8,
            'defans': 30,
            'fizik': rating - 10
        }
        details = f"bitiricilik: {rating}, pozisyon: {rating - 5}, sut_gucu: {rating - 8}, kafa_isabeti: {rating - 12}"
    
    # Clamp değerler
    for key in attrs:
        attrs[key] = max(20, min(99, attrs[key]))
    
    return f"""  {{
    ad: "{name}",
    takim: "{team_name}",
    uyruk: "{nationality}",
    mevki: "{position}",
    reyting: {rating},
    yas: {age},
    ana_ozellikler: {{ hiz: {attrs['hiz']}, sut: {attrs['sut']}, pas: {attrs['pas']}, dribbling: {attrs['dribbling']}, defans: {attrs['defans']}, fizik: {attrs['fizik']} }},
    detaylar: {{ {details} }},
    oyun_tarzlari: []
  }}"""

def complete_squad_file(file_path: str):
    """Bir takım dosyasını 23 oyuncuya tamamla"""
    
    team_name = os.path.basename(file_path).replace('.ts', '')
    current_count = count_existing_players(file_path)
    
    if current_count >= 23:
        print(f"✓ {team_name}: Zaten tamamlanmış ({current_count} oyuncu)")
        return
    
    needed = 23 - current_count
    print(f"⚙ {team_name}: {current_count} → 23 oyuncu ({needed} ekleniyor)")
    
    # Takım seviyesi
    min_rating, max_rating, real_name = get_team_tier(team_name)
    
    # Mevcut pozisyonları oku
    existing_positions = parse_existing_positions(file_path)
    
    # Eksik pozisyonları belirle
    new_players = []
    is_turkish_team = team_name in ['galatasaray', 'fenerbahce', 'besiktas', 'trabzonspor', 
                                      'basaksehir', 'samsunspor', 'rizespor', 'antalyaspor',
                                      'konyaspor', 'kasimpasa', 'alanyaspor', 'kayserispor',
                                      'goztepe', 'karagumruk', 'gaziantep', 'eyupspor',
                                      'genclerbirligi', 'kocaelispor']
    
    positions_to_add = []
    for pos, target_count in POSITIONS.items():
        current = existing_positions.get(pos, 0)
        for _ in range(target_count - current):
            positions_to_add.append(pos)
    
    # Fazla pozisyon varsa genel havuzdan ekle
    while len(positions_to_add) < needed:
        positions_to_add.append(list(POSITIONS.keys())[len(positions_to_add) % len(POSITIONS)])
    
    # Oyuncuları oluştur
    for i, position in enumerate(positions_to_add[:needed]):
        # Rating aralığını pozisyona göre ayarla
        if i < 11:  # İlk 11
            rating = min_rating + (max_rating - min_rating) * (11 - i) // 11
        else:  # Yedekler
            rating = min_rating + (max_rating - min_rating) * (23 - i) // 23
        
        age = 20 + (i % 15)
        
        # Milliyetler (Türk takımlarında %70 Türk)
        if is_turkish_team:
            nationality = 'Türkiye' if i % 10 < 7 else ['Brezilya', 'Arjantin', 'Portekiz'][i % 3]
        else:
            nationality = ['Brezilya', 'Arjantin', 'İspanya', 'Fransa', 'İtalya', 'Portekiz'][i % 6]
        
        player = generate_player(position, rating, age, nationality, real_name, is_turkish_team and nationality == 'Türkiye')
        new_players.append(player)
    
    # Dosyayı oku ve güncelle
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Son ]; ifadesinden önce yeni oyuncuları ekle
        if '];' in content:
            parts = content.rsplit('];', 1)
            # Virgül ekle
            if current_count > 0 and not parts[0].rstrip().endswith(','):
                parts[0] = parts[0].rstrip() + ','
            new_content = parts[0] + '\n' + ',\n'.join(new_players) + '\n];' + parts[1]
        else:
            new_content = content
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        
        print(f"  ✓ Tamamlandı")
        
    except Exception as e:
        print(f"  ✗ Hata: {e}")

def main():
    """Ana fonksiyon"""
    data_dir = r"c:\Users\kaano\OneDrive\Desktop\10\data"
    
    # Tüm .ts dosyalarını bul
    files = [f for f in os.listdir(data_dir) if f.endswith('.ts') and f not in ['seriea.ts', 'premierleague.ts']]
    
    print(f"\n🏆 Takım Kadrolarını Tamamlama")
    print(f"{'='*50}\n")
    
    for file in sorted(files):
        file_path = os.path.join(data_dir, file)
        complete_squad_file(file_path)
    
    print(f"\n{'='*50}")
    print("✅ Tamamlandı!\n")

if __name__ == "__main__":
    main()
