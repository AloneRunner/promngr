# 📱 AdMob Banner Reklamları - Kurulum Tamamlandı

## ✅ Yapılan İşlemler

### 1. **Package Yüklendi**
```bash
npm install @capacitor-community/admob
npx cap sync android
```

### 2. **AndroidManifest.xml Güncellendi**
- AdMob App ID eklendi: `ca-app-pub-1337451525993562~6785044311`
- Gerekli izinler eklendi (INTERNET, ACCESS_NETWORK_STATE, AD_ID)

### 3. **AdMob Servisi Oluşturuldu**
Dosya: `services/adMobService.ts`
- Banner gösterme/gizleme fonksiyonları
- Test/Production mod switch
- Otomatik init

### 4. **App.tsx'e Entegre Edildi**
- Uygulama açılınca AdMob initialize edilir
- Ana ekranlarda (dashboard, squad, league vs.) banner gösterilir
- **Maç ekranında banner GİZLENİR** (oyun deneyimi bozulmasın)
- Modal/Selector ekranlarında gizlenir

## 🎯 Reklam Davranışı

### Banner GÖSTER:
- ✅ Dashboard
- ✅ Squad (Kadro)
- ✅ League (Lig Tablosu)
- ✅ Club Management
- ✅ Transfers
- ✅ Training
- ✅ News
- ✅ Rankings
- ✅ Guide
- ✅ Fixtures

### Banner GİZLE:
- ❌ Match Center (Maç ekranı)
- ❌ Profile Selector
- ❌ Team Select
- ❌ League Select

## 🧪 Test Etmek İçin

### Test Modunu Aktifleştir (Geliştirme)
`App.tsx` dosyasında, satır ~75:
```typescript
// Bu satırın yorumunu kaldır:
adMobService.enableTestMode();
```

**Test modunda:** Google'ın örnek reklamları gösterilir (gerçek değil).

### Production Moduna Geç (Canlı Yayın)
```typescript
// Bu satırı yorum yap veya sil:
// adMobService.enableTestMode();
```

**Production modunda:** Gerçek reklamlarınız gösterilir.

## 📊 Reklam Bilgileri

- **App ID:** `ca-app-pub-1337451525993562~6785044311`
- **Banner Ad Unit ID:** `ca-app-pub-1337451525993562/8773925168`
- **Banner Boyutu:** 320x50 (Standart Banner)
- **Konum:** Ekranın alt ortası (BOTTOM_CENTER)

## 🚀 Build ve Test

### 1. Uygulamayı Derle
```bash
npm run build
```

### 2. Android'e Sync Et
```bash
npx cap sync android
```

### 3. Android Studio'da Aç
```bash
npx cap open android
```

### 4. Fiziksel Cihazda veya Emülatörde Çalıştır
Android Studio'da "Run" butonuna bas.

## ⏱️ Önemli Not: İlk Saatte Test Reklamları

AdMob'dan aldığınız mesaja göre:
> "Yeni reklam birimlerinin reklam göstermeye başlaması **bir saat kadar** sürebilir."

### İlk Saat:
- Test modunu kullanın: `adMobService.enableTestMode()`
- Google test reklamları gösterilir
- Gerçek reklamlar henüz yüklenmemiş olabilir

### Bir Saat Sonra:
- Test modunu kapatın: `// adMobService.enableTestMode()`
- Gerçek reklamlar gösterilmeye başlar

## 🔧 Manuel Kontrol Fonksiyonları

Herhangi bir component'ten manuel kontrol için:

```typescript
import { adMobService } from './services/adMobService';

// Banner göster
await adMobService.showBanner();

// Banner gizle
await adMobService.hideBanner();

// Banner tamamen kaldır
await adMobService.removeBanner();

// Banner görünür mü kontrol et
const isVisible = adMobService.isBannerVisible();

// Native platform mı kontrol et
const isNative = adMobService.isNative();
```

## 📱 Mobil Uygulama Boyutu

Banner reklam 320x50 boyutunda ve ekranın altına eklenir. 

**Önemli:** MatchCenter'da banner gizlendiği için maç deneyimi etkilenmez!

## 🐛 Sorun Giderme

### Reklamlar görünmüyor?
1. **Test modunu aktif et** → `adMobService.enableTestMode()`
2. **Android Studio loglarını kontrol et** → AdMob hata mesajları var mı?
3. **İnternet bağlantısı olduğundan emin ol**
4. **1 saat bekle** → Yeni reklam birimleri aktif olması zaman alır

### "Ad failed to load" hatası?
- Normal! İlk saatte bu hata alabilirsiniz
- Test moduna geçin
- 1 saat sonra production moda dönün

### Banner çok yukarıda/aşağıda görünüyor?
`services/adMobService.ts` içinde:
```typescript
position: BannerAdPosition.BOTTOM_CENTER, // veya TOP_CENTER
margin: 0, // Piksel cinsinden margin ekle
```

## 📋 AdMob Politikaları

AdMob'dan aldığınız hatırlatma:
> "Gerçekleştirdiğiniz uygulamanın politikalara uygunluğunu denetlemek için AdMob politikalarını inceleyin."

Politikalar: https://support.google.com/admob/answer/6128543

### Temel Kurallar:
- ✅ Reklamları kendi kendine tıklama
- ✅ Kullanıcıları tıklamaya teşvik etme
- ✅ Reklamları içerikten ayırt edilebilir kılma
- ✅ Yanlış reklam yerleşimi

## 🎉 Tamamlandı!

Banner reklam sistemi tamamen entegre edildi. Artık:
- ✅ Ana ekranlarda reklamlar gösteriliyor
- ✅ Maç sırasında reklamlar gizleniyor
- ✅ Test/Production mod switch mevcut
- ✅ Otomatik init ve kontrol

**Sonraki Adım:** Uygulamayı build et ve cihazda test et! 🚀
