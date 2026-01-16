# 📋 Proje Not Defteri

## 🔧 Yapılan Değişiklikler (Son Eklenen Üstte)

### 2026-01-16 (Gece)
- **Altyapı İsim Sistemi:** 10 ülke için kapsamlı isim listesi eklendi (200+ isim)
  - TR, EN, ES, IT, FR, DE + NL, BR, RU, SE
  - Her ligde altyapıdan gelen oyuncular o ülkeye uygun isim alıyor
- **GameGuide Çevirileri:** About bölümü EN/TR/ES destekliyor
- **Tesis Maliyetleri Düşürüldü:**
  - Yükseltme: 1.3 → 1.15 exponent
  - Bakım: 1.6 → 1.3 exponent, multiplier %50 düşürüldü
  - TR/FR liglerinde %30 bakım indirimi
- **Tesisler Rehberi:** 25 level ve doğru fiyatlar gösteriliyor

### 2026-01-16
- **Finishing Mesafe Cezası:** Düşük finishing oyuncular uzaktan şutta daha fazla ceza alıyor (finish 50=2x, 85=1x penalty)
- **Kırmızı Kart Fix:** Auto lineup artık kırmızı kartlı oyuncuları hariç tutuyor (11 kişi bug'ı düzeltildi)
- **Crash Fix:** `applySteeringBehavior` fonksiyonuna null check eklendi
- **Oyun Stili Eklendi:** Taktik UI'da Dengeli/Topa Sahip Ol/Kontra Atak/Yüksek Pres/Kapalı Savunma seçenekleri
- **2. Yarı Santrası:** tickCount===0 kontrolü ile hemen santra yapılıyor
- **Set Piece Göstergeleri:** FOUL, FREE KICK, CORNER, THROW IN, KICK OFF overlay'ları eklendi
- **Baraj Formasyonu:** Serbest vuruşlarda 3-4 kişilik baraj oluşturuluyor
- **Faul Oranı:** %25 → %15'e düşürüldü
- **Kart Oranları:** Sarı %8, Kırmızı %0.5'e düşürüldü
- **THROW_IN Fix:** Top y=2 veya y=98'e konuyor (sonsuz döngü düzeltildi)

---

## 📝 YAPILACAKLAR (TODO)

### 🔴 Kritik
- [ ] Yatay ekranda "Geri Dön" butonu navigasyonun altında kalıyor - z-index veya padding düzeltmesi gerekli
- [ ] Normal maçlarda taraftar sayısı gözükmüyor (dostluk maçlarında var)

### 🟡 UI İyileştirmeleri
- [ ] Skor yanına küçük takım isimleri veya logoları ekle (2. görsel)
- [ ] Yatay ekranda maç arayüzü iyileştirmeleri

### 🟢 Engine İyileştirmeleri
- [ ] Finishing yeteneğine göre şut mesafesi ayarı (düşük finishing = yakın şut tercih)
- [ ] Dribbling yeteneğine göre çalım tercihi ayarı
- [ ] J.Mario tipi oyuncular için mesafe cezası artırılacak

### 🔵 Sonraki Özellikler
- [ ] Ofsayt sistemi
- [ ] Penaltı sistemi
- [ ] Sakatlık sistemi (maç içi)

---

## 🎯 Engine Ayar Değerleri (Referans)

### Şut Kararı
```typescript
// shootScore hesaplaması - actionShoot tetiklemesi
shootScore = baseScore + finishing + distanceBonus + angleBonus
```

### Kart Oranları
```typescript
yellowChance = riskFactor * 0.08  // ~5-15%
redChance = riskFactor * 0.005   // ~0.3-1%
```

### Faul Oranı
```typescript
foulChance = riskFactor * 0.15   // ~9-27%
```

---

## ⏪ ESKİ DEĞERLER (Rollback İçin)

### Finishing Mesafe Cezası - ESKİ HALİ
```typescript
// ESKİ KOD (Satır 1932):
shootScore = 120 - (distToGoal * 2); // Closer = Better

// Finishing impact eklendi sonra:
shootScore += (p.attributes.finishing * 1.2) - 30;

// ESKİ: Tüm oyuncular aynı mesafe cezası alıyordu
// YENİ: Finishing 50 = 2x ceza, 85+ = 1x ceza
```

### YENİ HALİ (2026-01-16)
```typescript
// Finishing-based distance penalty
const finishingFactor = Math.max(0.6, 2.0 - (p.attributes.finishing / 50));
const distancePenalty = distToGoal * finishingFactor;

// Extra penalty for low finishers beyond 20m
if (distToGoal > 20 && p.attributes.finishing < 70) {
    shootScore -= (distToGoal - 20) * 3;
}

shootScore = 120 - distancePenalty;
```

---

## 📸 Referans Görseller
- Görsel 1: Yatay ekran navigasyon sorunu
- Görsel 2: Skor alanı - takım logoları/isimleri eklenecek
- Görsel 3: Dikey skorboard örneği
