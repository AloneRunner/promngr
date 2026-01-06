# 🔊 Ses Sistemi Kullanım Kılavuzu

## Nasıl Çalışır?

Ses sistemi maç durumuna göre otomatik olarak çalışır:

### 1. **Arka Plan Sesi (Tribün)**
- Maç başladığında otomatik olarak loop'ta çalar
- Hafif bir tribün sesi (volume: 30%)
- Speed = 0 (Pause) yapınca durur
- Speed > 0 yapınca devam eder

### 2. **Event-Based Sesler**
Maç olaylarına göre otomatik çalar:
- ⚽ **Gol** → `goal.mp3` + `cheer.mp3`
- 🟨 **Sarı Kart** → `yellow_card.mp3`
- 🟥 **Kırmızı Kart** → `red_card.mp3`
- 🔄 **Oyuncu Değişikliği** → `substitution.mp3`
- 🎯 **Penaltı** → `penalty.mp3`
- ⚡ **Korner** → `corner.mp3`
- 🎺 **Düdük (Başlangıç)** → `whistle_start.mp3`
- 🎺 **Düdük (Bitiş)** → `whistle_end.mp3`

### 3. **Hız Kontrolü**
- **Speed = 0** → Tüm sesler durur
- **Speed = 0.5x-4x** → Event sesleri çalar
- **Hızlı Sarma (Skip)** → Sesler suspend edilir

### 4. **UI Sesleri** (Opsiyonel)
- Buton tıklama → `ui_click.mp3`
- Bildirim → `notification.mp3`

## Ses Dosyalarını Nereye Koymalıyım?

Tüm ses dosyaları `public/sounds/` klasörüne konulmalı:

```
public/
  sounds/
    crowd_ambience.mp3    ← Sürekli tribün sesi (loop)
    goal.mp3              ← Gol anında çalan ses
    cheer.mp3             ← Alkış/tezahürat
    whistle_start.mp3     ← Maç başlangıç düdüğü
    whistle_end.mp3       ← Maç bitiş düdüğü
    yellow_card.mp3       ← Sarı kart
    red_card.mp3          ← Kırmızı kart
    substitution.mp3      ← Oyuncu değişikliği
    penalty.mp3           ← Penaltı düdüğü
    corner.mp3            ← Korner sesi
    ui_click.mp3          ← (Opsiyonel) Buton tıklama
    notification.mp3      ← (Opsiyonel) Bildirim sesi
```

## Ses Dosyalarını Nereden Bulabilirim?

### Ücretsiz Ses Kaynakları:
1. **Freesound.org** - https://freesound.org
   - "stadium crowd", "whistle", "goal celebration" ara
   
2. **Zapsplat** - https://www.zapsplat.com
   - Sport sounds kategorisine bak

3. **Pixabay** - https://pixabay.com/sound-effects
   - Ücretsiz, telif hakkı yok

4. **YouTube Audio Library** - https://studio.youtube.com
   - Sound effects kategorisi

### Önerilen Aramalar:
- `stadium crowd ambience` (tribün sesi için)
- `referee whistle` (düdük sesi için)
- `crowd cheer celebration` (gol kutlaması için)
- `yellow card referee whistle` (kart sesi için)

## Ses Dosyası Formatı

- **Format:** MP3 (önerilen) veya OGG
- **Süre:** 
  - Ambience: 30-60 saniye (loop olacak)
  - Event sounds: 1-5 saniye (kısa ve net)
- **Kalite:** 128-192 kbps yeterli (mobil için optimize)

## Hızlı Test

1. Ses dosyalarını `public/sounds/` klasörüne koy
2. Uygulamayı çalıştır: `npm run dev`
3. Bir maça gir
4. Tribün sesi otomatik başlamalı
5. Gol at → Gol sesi çalmalı
6. Pause yap → Sesler durmalı

## Ses Ayarları

Volume'leri değiştirmek için `services/soundManager.ts` dosyasını düzenle:

```typescript
// Örnek: Tribün sesini daha yüksek yap
this.config.set('crowd_ambience', { 
  volume: 0.5,  // 0.3'ten 0.5'e çıkar
  loop: true 
});

// Gol sesini daha yüksek yap
this.config.set('goal', { volume: 1.0, loop: false }); // Max volume
```

## Sorun Giderme

### Sesler çalmıyor?
1. Tarayıcı console'da hata var mı kontrol et
2. Ses dosyaları doğru yerde mi? (`public/sounds/`)
3. Dosya isimleri doğru mu? (`crowd_ambience.mp3` vs `crowd-ambience.mp3`)

### Sesler çok yüksek/alçak?
- `soundManager.ts` içindeki volume değerlerini ayarla (0-1 arası)

### Ambience loop'ta takılıyor?
- Ses dosyasının başı ve sonu smooth olmalı
- Audacity gibi programla fade in/out ekle

## Demo Ses Paketi Önerisi

Başlangıç için basit bir demo paketi:
1. **crowd_ambience.mp3** → Freesound'dan "stadium crowd low" ara
2. **goal.mp3** → "crowd cheer short" ara
3. **whistle_start.mp3** → "referee whistle long" ara
4. **whistle_end.mp3** → "referee whistle short" ara

Diğer sesler opsiyoneldir, eklemezsen sadece o eventlerde ses çalmaz (hata vermez).
