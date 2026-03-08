# Beta Motor Review Addendum (2026-03-04)

Bu not, ilk raporun yazıldığı andan sonraki kod değişiklikleri ve dış yorumlar ışığında güncel doğrulamayı içerir.

## Kesin doğru bulunan noktalar
- Dribbling taban skorunun düşük olması önemliydi ve düzeltildi.
- Skill mismatch etkisinin zayıf olması önemliydi ve güçlendirildi.
- Penaltıda kaleci etkisi düşük görünüyordu; penaltı özelinde GK etkisi artırıldı.
- Keskin dönüşlerde momentum hissi zayıftı; turn momentum penalty eklendi.

## İlk raporda artık güncel olmayan veya eksik okunan noktalar
- Tempo hiç kullanılmıyor yorumu güncel kod için doğru değil:
  - decisionSpeed üstünde etkisi var.
  - karar skorlarında Fast/Slow etkileri var.
  - off-ball hareket hızına tempo çarpanı eklendi.
- Width hiç kullanılmıyor yorumu güncel kod için doğru değil:
  - ofansif ve defansif targetY yayılımında width kullanılıyor.
  - kanat oyuncusu davranışlarında width etkisi var.
  - forvet savunma kanalında width etkisi eklendi.
- 3D fizik yok yorumu yanlış:
  - top için z, vz, gravity, bounce ve hava topu hesapları aktif.
- Korner rutini yok yorumu tam doğru değil:
  - set-piece corner AI, aerial/ground seçimi ve olimpiko denemesi mevcut.

## Bu turda yapılan ek iyileştirmeler
- 1v1 anında elit kaleciye tutarlılık buff eklendi.
- 90°+ dönüşlerde hız düşüşü belirginleştirildi (momentum hissi).
- Shot opening hesabı açı + şut hattı mesafesi + yaklaşan savunmacı hızı ile güncellendi.
- Çok net açıklıkta (shotOpenness > 0.9) şut skoru ek bonus alacak şekilde ayarlandı.
- GK low cross tehdidi için claim/punch ayrımı ve karar akışı eklendi.
- Kornerlerde near/far/edge hedef varyasyonları deterministik pattern ile eklendi.
- GK low-cross kararına trafik yoğunluğu (rakip/teammate kalabalığı) etkisi eklendi.
- Kısa korner talimatı (`ShortCorners`/`PlayShortCorners`) explicit olarak corner kararına bağlandı.
- Korner sonrası second-ball için ceza sahası koşuları (`supportRunUntil`) tetiklenir hale getirildi.

## Sonraki teknik adaylar
- Penaltı psikolojisi (seri penaltılarda baskı artışı) ve atıcı profili çeşitlendirmesi.
- Set-piece savunmasında adam paylaşımı (zonal + man hybrid) derinleştirmesi.
