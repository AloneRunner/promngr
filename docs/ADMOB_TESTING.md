# 🚀 AdMob Test Rehberi

## Hızlı Başlangıç

### 1. Test Modunu Aktifleştir (İlk Saatte Önerilen)

`App.tsx` dosyasını aç ve ~76. satırda yorumu kaldır:

```typescript
// Bu satırın yorumunu KALDIR:
adMobService.enableTestMode();
```

### 2. Build ve Sync

```bash
npm run build
npx cap sync android
```

### 3. Android Studio'da Çalıştır

```bash
npx cap open android
```

Android Studio'da "Run" (▶️) butonuna bas.

## 📱 Test Senaryoları

### ✅ Banner Görünür Olmalı:
1. Uygulama açıldığında ana ekranda
2. Squad (Kadro) sayfasında
3. League (Lig) tablosunda
4. Transfers sayfasında
5. Training sayfasında

### ❌ Banner Gizli Olmalı:
1. Maça girdiğinizde (Match Center)
2. Profile Selector'da
3. Team Select ekranında

### 🎮 Test Adımları:

1. **Uygulama Aç**
   - Ekranın altında banner reklam görünmeli
   - Test modundaysa "Test Ad" yazısı olmalı

2. **Farklı Sayfalara Geç**
   - Dashboard → Squad → League → Transfers
   - Her sayfada banner görünmeli

3. **Maça Gir**
   - Fixtures'a git
   - Bir maça tıkla
   - Banner kaybolmalı (maç ekranı tam görünür olmalı)

4. **Maçtan Çık**
   - Maçtan çık
   - Banner tekrar görünmeli

## 🐛 Sorun Giderme

### "Banner görünmüyor!"

**Çözüm 1: Test modunu aktif et**
```typescript
adMobService.enableTestMode();
```

**Çözüm 2: Logları kontrol et**
Android Studio'da "Logcat" sekmesine bak:
- Filtre: `AdMob` veya `Ads`
- Hata mesajları var mı?

**Çözüm 3: İnternet var mı?**
- Emülatör/cihazın interneti olmalı
- WiFi veya mobil veri açık olmalı

**Çözüm 4: İlk çalıştırmaysa bekle**
- İlk kez AdMob kullanılıyorsa 1-2 dakika bekle
- Uygulamayı kapat-aç

### "Ad failed to load" hatası

**Normal!** İlk 1 saatte bu hata alabilirsiniz çünkü:
- Yeni reklam birimi henüz aktif olmamış olabilir
- Test modu kullanın ilk saatte

### Banner konumu yanlış

`services/adMobService.ts` dosyasını düzenle:
```typescript
position: BannerAdPosition.TOP_CENTER, // Üstte göster
// veya
position: BannerAdPosition.BOTTOM_CENTER, // Altta göster
```

## 🎯 Production'a Geçiş (1 Saat Sonra)

### 1. Test Modunu Kapat

`App.tsx` ~76. satırı yorum yap:
```typescript
// adMobService.enableTestMode(); // ← Yorum satırı yap
```

### 2. Tekrar Build

```bash
npm run build
npx cap sync android
```

### 3. Test Et

Artık gerçek reklamlar gösterilmeli!

## 📊 Reklam Performansı Takibi

AdMob Console'dan takip edin:
https://apps.admob.com

- Gösterim sayısı
- Tıklama oranı
- Kazançlar

## ⚠️ Önemli Notlar

1. **Kendi reklamlarınıza tıklamayın!**
   - AdMob hesabınız ban yiyebilir
   - Test modunu kullanın test için

2. **İlk saatte sabırlı olun**
   - Yeni reklam birimleri 1 saat içinde aktif olur
   - Test modunu kullanın beklerken

3. **Maç ekranında banner gizli**
   - Oyun deneyimi için önemli
   - Bu normal ve istenen davranış

## 🎉 Başarılı Test Kontrol Listesi

- [ ] Test modu aktif (ilk saatte)
- [ ] Build ve sync yapıldı
- [ ] Uygulama açıldı
- [ ] Ana ekranda banner görünüyor
- [ ] Farklı sayfalarda banner görünüyor
- [ ] Maç ekranında banner gizli
- [ ] Maçtan çıkınca banner tekrar görünüyor
- [ ] 1 saat sonra production moda geçildi
- [ ] Gerçek reklamlar gösteriliyor

**Hepsi ✅ ise:** AdMob entegrasyonu başarılı! 🚀
