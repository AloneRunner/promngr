# MENAJER KARİYERİ VE LEVEL UP SİSTEMİ - DETAYLI TASARIM BELGESİ (GDD)

## 2026-03-08 Uygulama Sirasi

Bu dokuman artik sadece vizyon degil, mevcut kod tabanina gore fiili uygulama sirasi da iceriyor.

### Neden bu sirayla?
- Elde zaten `managerRating`, `managerCareerHistory`, `managerTrophies`, `jobOffers`, `boardConfidence` ve sezon sonu ozet mantigi var.
- Yani sifirdan kariyer yazmiyoruz; var olan sistemi "rating + teklif" seviyesinden alip gercek rekabet dongusune tasiyoruz.
- Kullanici kaybi tarafinda ilk etkisi olacak sey avatar degil, rekabet ve ilerleme hissi. Bu yuzden once retention etkisi yuksek katmanlar yapilacak.

### Faz 1: Kariyer Omurgasi
- `GameState` icinde tek tek daginik manager alanlari yerine tipli bir `managerProfile` yapisi kurulacak.
- Bu yapida en az su alanlar olacak: `level`, `xp`, `xpToNextLevel`, `reputation`, `archetype`, `milestones`, `careerStats`, `unlockedAchievements`.
- Mevcut `managerRating` sistemi tamamen silinmeyecek; gecis surecinde `managerProfile.reputation` icin geriye uyumlu kopru olarak kullanilacak.
- `ManagerProfile` ekrani sadece kupa ve rating gosteren panel olmaktan cikacak; level, XP bar, itibar seviyesi ve sezon hedefi merkezi olacak.

### Faz 2: Rekabet ve Baski Dongusu
- Sezon sonu tek seferlik rating artis/azalis mantigi haftalik ve aylik kariyer ilerlemesine bolunecek.
- `boardConfidence`, lig beklentisi, derbi sonucu, kupalar, ust siraya oynama ve alt siraya dusme tek bir kariyer puanlama akisina baglanacak.
- Kovulma `game over` olmaktan cikacak; "issiz menajer" durumuna donecek. Boylece oyuncu kariyere devam edecek, sifirdan baslamayacak.
- Yeni is teklifleri sadece sezon sonunda degil, uygun senaryolarda sezon icinde de gelebilecek.

### Faz 3: Kulup Gecisi ve Menajer Pazari
- Is teklifleri sadece kulup itibari uzerinden degil, beklenti uygunlugu uzerinden de uretilecek.
- Tekliflere su bilgiler eklenecek: beklenen lig sirasi, maas seviyesi, baski seviyesi, hedef tipi.
- Is kabul etme akisi sonrasinda sadece `userTeamId` degismeyecek; menajer gecmisi, hedefler ve kulup acilis mesaji da buna gore yenilenecek.
- Orta vadede "bana teklif geldi" kadar "ben bu ise basvurabilir miyim" mantigi da eklenecek.

### Faz 4: Acil Basarim Sistemi
- Google Play/oyun ici basarim sistemi manager kariyere baglanacak.
- Basarimlar sadece dekor olmayacak; XP, itibar veya sezonluk prestige bonusu uretecek.
- Ilk hedef grubu: ilk galibiyet, beklenmeyen galibiyet, kupa, ust uste seri, temiz sayfa, dusuk butceyle hedef tutturma.

### Faz 5: Asenkron Rekabet
- Canli PvP once degil, en son gelecek.
- Ilk surum aylik/asenkron olacak: oyuncunun takimi ve taktik snapshot'i kaydedilecek, baska oyuncularin snapshot'lariyla sezonluk veya aylik kapisma yapilacak.
- Bu sistem kariyerin ustune binecek; kariyer ana omurga olmadan PvP eklersen retention yerine churn uretir.

### Ilk Kod Sprinti
- `src/types.ts`: tipli manager kariyer modelleri
- `services/engine.ts`: manager XP/reputation gecis katmani
- `components/ManagerProfile.tsx`: yeni kariyer paneli
- `components/JobOffersModal.tsx`: teklif kalitesi ve baski bilgileri
- `App.tsx`: kovulma = kariyer sonu degil, issiz menajer akisi

### Net Urun Karari
- Ilk ekranda karakter yaratma ile baslanmayacak.
- Oyuncu once mac ve sezon dongusune girecek.
- Menajer derinligi, oynadikca acilan bir "ilerleme katmani" gibi hissettirilecek.

## 2026-03-08 Ust Duzey Urun Kararlari

Bu bolum, manager sistemi icin artik degistirilmeyecek temel urun kararlarini netlestirir.

### 1. Menajer Profili Olusturma
- Oyuncu ilk saniyede uzun bir karakter yaratma ekranina zorlanmayacak.
- Kariyer baslangicinda sadece 3 sey secilecek: ad, uyruk, menajer arketipi.
- Yas, dogum tarihi, avatar, ofis dekoru gibi seyler ilk surumun parcasi olmayacak.
- Hedef: 20-30 saniyede tamamlanan, retention dostu bir profil acilisi.

### 2. Millet Bonusu Olacak mi?
- Evet, olacak; ama kucuk ve kontrollu olacak.
- Bu bonus oyunu kiracak kadar buyuk olmayacak, sadece rol yapma ve erken oyun aidiyeti verecek.
- Ana mantik:
    - Kendi uyrugunun liglerinde yonetim guveni ve taraftar toleransi biraz daha yuksek baslar.
    - Kendi uyrugundan oyuncularla sozlesme ve ikna gorusmeleri biraz daha kolay olur.
    - Kendi ulkesindeki alt yapi ve scout raporlarinda bilgi toplama hizi biraz daha yuksek olur.
- Sayisal hedef:
    - yonetim guveni baslangici +5
    - oyuncu ikna katsayisi +%5
    - scout gorunurluk hizi +%10
- Bu bonus hicbir zaman "Turk secince otomatik avantajli meta" haline gelmeyecek.

### 3. Baslangicta Hangi Takimlar Acik Olacak?
- Mevcut oyunda teknik olarak tum ligler ve takimlar secilebilir durumda.
- Yeni manager kariyerde bu tamamen kalkmayacak; ama kariyer modunda kulup secimi iki katmana ayrilacak:
    - Serbest mod: bugunku gibi herkes her takimi secebilir.
    - Gercek kariyer modu: menajer itibari belirli esiklerin ustundeki kulupleri kilitler.
- Ilk surumde oyuncu kariyere sifir itibarla baslamayacak; "alt-orta seviye yeni hoca" seviyesinde baslayacak.
- Baslangic kulup kilidi mantigi:
    - kolay giris: 4500-6200 rep arasi kulupler her zaman acik
    - iddiali giris: 6200-7200 rep arasi kulupler sadece baslangic arketipi ve ulke uyumu varsa acik olabilir
    - dev kulup: 7200+ rep kariyer modunda baslangicta kilitli
- Bu sayede oyuncu oyuna cok zayif takimla baslamaya zorlanmaz, ama dogrudan dunya devi alamaz.

### 4. Gelisim Mantigi Ne Olacak?
- Gelisim tek bir rating sayisi olmayacak.
- Uc katmanli bir manager ilerlemesi olacak:
    - Level: oyuncuya uzun vadeli ilerleme hissi verir.
    - XP: mac, hedef, kupa, basarim ve riskli galibiyetlerden kazanilir.
    - Reputation: hangi kulubun sana bakacagini ve ne kadar buyuk beklentiyle gelecegini belirler.
- Yani seviye atlamak ile is piyasasinda buyumek ayni sey olmayacak.
- Ana kural:
    - XP = emek ve sureklilik odulu
    - Reputation = sonuclar ve itibar odulu
- Oyun hissi:
    - kotu takimla bile yuksek level olabilirsin
    - ama buyuk kulup almak icin itibar da biriktirmen gerekir

### 5. Ofis mi Gelisecek, Menajer mi Gelisecek?
- Ilk ana surumde ofis degil, menajerin kendisi gelisecek.
- Cunku ilk retention ihtiyaci kozmetik degil, guc ve ilerleme hissi.
- Buna ek olarak ikinci katmanda "kisisel ekip" sistemi gelecek:
    - scout
    - gelisim koçu
    - fixer
    - saglik direktoru
- Bu ekip kulubun degil, menajerin olacak. Kulup degistirince beraber tasinacak.
- Ofis/merkez ekranlari daha sonra sadece sunum ve prestij katmani olarak eklenebilir.
- Karar: once RPG ilerleme, sonra ofis sunumu.

### 6. Menajer Yetenekleri Neleri Etkileyecek?
- Yetenekler dogrudan oyuncu OVR'sine kaba +10 vermeyecek.
- Daha cok karar kalitesi, verim ve surec hizina etki edecek.
- Ilk ana agaclar:
    - Ikna ve pazarlik
    - Gelisim ve antrenman
    - Mac ici uzmanlik
    - Scout ve bilgi toplama

### 6.1 Ikna ve Pazarlik
- transfere gelme istegi
- maas pazarligi
- yonetimden ekstra butce koparma
- kovulmadan once yonetim toleransi

### 6.2 Gelisim ve Antrenman
- genc oyuncularin potansiyele ulasma hizi
- kondisyon toparlanmasi
- sakatlik risk azaltma
- form dususunden geri donus hizi

### 6.3 Mac Ici Uzmanlik
- son bolge karar kalitesi
- savunma yerlesimi disiplini
- duran top verimi
- mac sonu yorgunluk yonetimi
- derbi ve baski maclarinda mental dusus azaltma

### 6.4 Scout ve Bilgi Toplama
- oyuncu gizli bilgi acma hizi
- rakip analiz derinligi
- potansiyel tahmin dogrulugu
- ucuz firsat oyuncu bulma sansi

### 6.5 Sonraki Faz Notlari
- Manager ilerledikce mevcut kulup sinirlarinin ustune cikan kucuk altyapi bonuslari acilabilir.
- Bunlardan biri gec oyun manager bonusu olarak youth academy ust limitini normal kulup sinirinin biraz ustune tasimak olabilir.
- Ayni mantik scout ekibinde de kullanilabilir: manager uzmanligi sayesinde kulup staff limiti hafifce asilir, ama bu ilk surum parcasi olmayacak.
- Antrenman sekmesinde oyuncuya ozel koç atama sistemi sonraki dalgada eklenecek.
- Bu sistem toplu takim antrenmanindan ayri olacak; tekil oyuncu gelisimi, toparlanma ve rol uzmanlasmasi verecek.

### 7. Bizden Baska Sanal Menajerler Olacak mi?
- Evet, olmak zorunda.
- Oyuncu tek gelisen akil olursa 3-4 sezon sonra sistem kirilir.
- Bu yuzden oyunda diger onemli kuluplerin de sanal menajer profili olacak.
- Her AI menajerde su ozellikler olacak:
    - arketip
    - reputation
    - coaching quality
    - transfer tarzı
    - gelisim odagi
- Tum kuluplere tek tek tam RPG katmani verilmeyecek; ama ust duzey AI kuluplere "temsil menajer" mantigi verilecek.
- Boylece oyuncu sadece takimi degil, rakip hocalari da hissedecek.

### 8. Oyuncu Cok Gelisirse AI'yi Ezer mi?
- Bu en kritik denge sorusu ve cevap: hayir, ezer hale gelmemesi icin sistem kurulacak.
- Anti snowball kurallari:
    - yuksek reputation'li kuluplerin gorunmez coaching quality katsayisi olacak
    - buyuk AI kuluplerin scout ve oyuncu gelisim verimi yuksek olacak
    - ust seviye AI menajerler sezonlar boyunca kendi itibarini ve oyun tarzini koruyacak
    - buyuk kulup yonetirken hedefler sertlesecek, hata toleransi dusecek
    - oyuncu guclendikce karsisina daha zor beklentiler ve daha rekabetci transfer pazari cikacak
- Yani oyuncu guclendikce oyun kolaylasmayacak; sadece daha buyuk masaya oturacak.

### 9. Kovulma ve Kariyer Sonu Mantigi
- Kovulma artik direkt oyun sonu olmamali.
- Dogru model:
    - once yonetim guveni duser
    - sonra baski mesajlari gelir
    - sonra kovulursun
    - sonra issiz menajer olarak yeni teklif beklersin veya daha alt kulube inersin
- Bu hem daha gercekci hem retention icin daha saglikli.

### 10. Ilk Sürümün Net Kapsami
- olacaklar:
    - ad + uyruk + arketip ile hizli profil olusturma
    - XP + level + reputation omurgasi
    - kilitli kulup mantigi olan gercek kariyer modu
    - kovulunca kariyerin bitmemesi
    - gelismis job market mantigi
    - temel yetenek agaci
    - AI menajer temsil sistemi
- olmayacaklar:
    - detayli avatar editörü
    - dekoratif ofis insa sistemi
    - cok katmanli personel binasi simulasyonu
    - tam canli PvP

### 11. Uygulama Sirasinda Uygulanacak Nihai Tasarim Cevabi
- Menajer once kendisi gelisecek.
- Kisisel ekip ikinci dalga olarak eklenecek.
- Milliyet bonusu olacak ama kucuk kalacak.
- Baslangicta herkes her takimi alamayacak; gercek kariyer modunda rep kilidi olacak.
- AI tarafinda da sanal menajerler ve coaching quality sistemi olacak.
- Oyuncu ilerledikce oyunun kolaylasmasi degil, beklentinin ve rakip kalitesinin artmasi hedeflenecek.

Bu belge, oyunun "Maç Simülatörü" olmaktan çıkıp tam teşekküllü bir **"RPG Menajerlik Oyunu"** ve Google Play "Level Up" programı standartlarına uygun bir yapıya geçişi için hazırlanmış Türkçe strateji planıdır.

---

## 1. TEMEL KONSEPT: "İsimsiz Birinden Efsaneye"
Mobil futbol menajerlik oyunlarında (Örn: OSM, Top Eleven, Football Manager Mobile) oyuncuyu bağlayan şey "Gelişim ve İtibar (Reputation)" hissidir. Oyuncu, köy takımından başlayıp kendi yeteneklerini geliştirerek dünya devlerini yönetmek ister.

### 1.1. Menajer Profili (Karakter Yaratma)
Oyuna ilk girişte (veya güncelleme sonrası ilk açılışta) oyuncu kendi bedenini yaratır.
*   **Ad Soyad**
*   **Doğum Tarihi / Yaş** (Kozmetik)
*   **Uyruk (Ülke Dünyası):** Seçtiğin ülkeye göre "Ev Sahibi Ülke Bonusu" alırsın. (Örn: Türk isen Türkiye liglerindeki takımları yönetmek daha kolay olur, o ülkeden oyuncuları ikna etmek %5 daha ucuza mal olur).
*   **Odak Noktası (Başlangıç Sınıfı):** (Sadece 1 tane seçilir)
    1.  *Taktisyen (Mourinho tarzı):* Takımın "Kimya/Takım Uyumu" veya Form grafiği %10 daha hızlı artar.
    2.  *Motivatör (Klopp tarzı):* Oyuncuların Kondisyonu maç sonu %10 daha hızlı dolar, moral değerleri yüksek başlar.
    3.  *Finansör (Wenger tarzı):* Kulüp gelirleri (Bilet/Sponsor) %5 artar, oyuncu maaş pazarlıklarında %10 ucuza anlaşılır.
    4.  *Gözlemci (Scout):* Araştırılan oyuncuların özellikleri %30 daha hızlı ve net görünür.

---

## 2. GELİŞİM SİSTEMİ: Seviye (Level) ve Deneyim (XP) Puanı Nasıl Çalışır?

Oyunda "Takımın Gücü (Reputation)" ve "Menajerin Gücü (Level/XP)" tamamen ayrılacak. Kötü bir takımı yönetiyor olabilirsin ama dünyaca ünlü 50. seviye bir menajer olabilirsin. 

### 2.1. XP Nasıl Kazanılır? (Büyüme Hızı)
Amaç, oyuncunun her maç sonu "biraz daha geliştiğini" hissetmesidir.
*   **Kazanılan Her Maç:** +50 XP
*   **Beraberlik:** +20 XP
*   **Mağlubiyet:** +5 XP (Çünkü tecrübe edindin)
*   **Derbi / Zorlu Rakip Galibiyeti:** +100 XP (Senden çok güçlü bir takımı yendiysen ekstra ödül)
*   **Hat-Trick / Farklı Galibiyet:** +20 XP (İzleyenlere şov yaptıysan)
*   **Sezon Sonu Hedefini Tutturmak:** +500 ~ +2000 XP (Takımının büyüklüğüne göre)
*   **Kupa Kazanmak:** +3000 XP

### 2.2. Seviye Atlamak (Level Up) Ne Kazandırır?
*   Max Seviye başlangıçta 100 olarak belirlenecek.
*   İlk seviyelerde hızlı atlarken, ileride yavaşlayacak. (Örn: Lvl 1->2 için 500 XP, Lvl 50->51 için 15.000 XP gerekecek).
*   **Ne İşe Yarar?** Her seviye atladığında sana **+1 Yetenek Puanı (Skill Point - SP)** ve Google Play üzerinden sanal ödül/başarım bildirimi gidecek.

---

## 3. MENAJER YETENEK AĞACI (SKILL TREE) - Denge ve Etkiler

Seviye atlayıp kazandığın Yetenek Puanları (SP) ile kendini geliştireceksin. Her bir özelliği 5 kere (Örn: 1. Seviye, 2. Seviye... 5. Seviye) yükseltebileceksin.

### Ağaç 1: Takım Yönetimi ve İkna (Karizma)
*   **Transfer İkna Yeteneği (Level 1-5):** Yetenek seviyen arttıkça, oyuncuların kulübüne gelme ihtimali yükselir. (Örn: Lvl 1 = %5 daha ucuz maaş ister, Lvl 5 = Senden yıldız olarak çok üstün oyuncuyu bile %25 ikna şansı).
*   **Yönetimle Pazarlık (Level 1-5):** Sezon başı kulüp başkanı sana transfer bütçesi verirken, bu yeteneğinle bütçeyi %5 ile %25 arası daha fazla (Ek Bütçe) alabilsin.

### Ağaç 2: Saha İçi Dokunuşlar (Antrenörlük)
*(İşte burası doğrudan Maç Motorunu etkiler!)*
*   **Hücum Antrenörü (Level 1-5):** Takımındaki FORVET (FWD) oyuncularının "Bitiricilik (Finishing)" ve "Hücum Pozisyonu" statlarına maç içinde kalıcı **+1 ile +5** arası doğrudan GİZLİ BUFF ekler.
*   **Savunma Uzmanı (Level 1-5):** DEF ve GK oyuncularının "Markaj (Tackling)" ve "Kademeye Girme" hızına (Speed/Positioning) **+1 ile +5** arası buff ekler. (Örn: Lvl 5 Savunma Uzmanı isen defansların kolay çalım yemez).
*   **Dayanıklılık Eğitimi (Level 1-5):** Maçın 70. dakikasından sonra gerçekleşen Kondisyon Düşüşünü yavaşlatır. Lvl 5 isen 90. dakikada oyuncuların %20 daha enerjik olur.

### Ağaç 3: Gözlemcilik ve Kurum (Scouting)
*   **Keskin Gözler (Level 1-5):** (Aşağıda bahsedilen "Özellik Gizleme" sistemi için) Oyuncuların "Gerçek Güçlerini (Overall)" ve istatistiklerini ilk bakışta daha net görürsün.
*   **Tıbbi Mucize (Level 1-5):** Sakatlık ihtimallerini düşürür ve sakatlık sürelerini %10 ile %50 arası kısaltır.

---

## 4. İŞE GİRME, İTİBAR VE "MENAJERLİK PUANI / REPUTATION" MANTIĞI

En önemli kural: **MENAJER İTİBARI < KULÜP İTİBARI ise o takımı YÖNETEMEZSİN!** 

*   Oyun başında sıfır tecrübelisin. İlk itibar Puanın: **2.500 Puan (Amatör)**
*   Real Madrid'in veya Man City'nin İtibarı: **9.500 Puan**
*   Yani oyuna "Sıradan bir hoca" olarak başladığında Real Madrid sana **ASLA TEDAARUK OLMAZ / KAPISINDAN SOKMAZ.**

**Süreç Nasıl İşler?**
1.  **Kanıtlama Evresi:** Mecburen itibarı 2.000 - 3.500 arası olan zayıf/orta halli bir takım (Veya kendi uyruğundan zayıf bir lig takımı) seçeceksin.
2.  **Güven İnşası:** O takımı kümede bırakarak veya şampiyon yaparak Menajer İtibarını **2.500'den -> 4.000'e** çıkaracaksın.
3.  **Transfer Teklifleri (Job Offers):** Birkaç sezon sonra veya sezon ortasında diğer takımların yönetimleri seni izler. "Aaa bu hoca çok iyi iş yapıyor" diye sana posta kutusuna teklif yollarlar.
4.  **Büyük Sıçrama:** Hedefleri (Örn: Ligi İlk 4'te bitir) tutturdukça itibarın büyüyecek, sonunda 9.000 puana ulaştığında Real Madrid "Hocam gel bizi yönet!" diyecek.
*   **(Ceza Sistemi):** Eğer üst üste 5 maç kaybedersen veya takımı küme düşürürsen kulüp seni **KOVAR**. İtibarın devasa düşer, alt liglerden teklif beklemek zorunda kalırsın!

---

## 5. BİLİNMEZLİK ZİNDANI: "FOG OF WAR" & KAPSAMLI SCOUTİNG

Şu an transfer listesini açtığında Ronaldo'nun şutunun 95 olduğunu kabak gibi görüyorsun. Gerçek FM oyunları böyle çalışmaz!
*   **Bilinmezlik:** Takımındaki oyuncular hariç, dünyadaki tüm oyuncuların (Özellikle farklı liglerdeki ve henüz izlemediğin gençlerin) detaylı özellikleri **Gizlenir**.
*   **Görünüm Şekli:** Messi'nin pas statına baktığında "98" yerine **"85-99 Arası"** veya sadece "??" yazar. Yıldız puanı bile "3.5 - 5 Yıldız Arası" olarak bulanıklaştırılır.
*   **Gözlemci (Scout) Yollama:** Kesin rakamı öğrenmek ve oyuncunun gizli "Huyunu, Sakatlanma Riskini, Taktik Uyumunu" öğrenmek için Yönetim bütçenden para harcayıp OYUNCUYU İZLEMEYE adam yollaman (Scout Raporu) istenecek. Bu 1-2 hafta sürer. Hafta geçince rapor gelir ve gizem ortadan kalkar. Gerçekten 90 mı yoksa çöp mü oradan anlarsın.

---

## 6. GOOGLE PLAY LEVEL UP: BAŞARIMLAR EKRANI (ACHIEVEMENTS)

Google play "etkileşim" için bu sistemi zorunlu kılıyor. Oyun içinde arka planda sinsi sinsi başarımları izleyecek bir sistem kuracağız. Başarımları kazandığında ekranın üstünde büyük afili bir bildirim çıkacak ve Google Play hebaXP kazanacaksın.

**Örnek Başarım Listesi:**
*   🥉 "İlk Kan" -> Kariyerindeki ilk resmi maç galibiyetini al. (Google Play XP: 500)
*   🥈 "Çin Seddi" -> Bir maçta rakibe hiç isabetli şut çektirtme veya gol yeme.
*   🥇 "David ve Goliath" -> Senin takımından en az %30 daha itibarlı (güçlü) bir takımı mağlup et!
*   🏅 "Şeytanın Bacağını Kırmak" -> Oyunu geride götürürken son 10 dakikada atılan golle maçı çevir.
*   🏆 "Efsanenin Doğuşu" -> Menajer seviyesinde 10. Seviyeye ulaş!
*   💎 "Para Konuşur" -> Kasada 100 Milyon Euro birikti.

---

## 7. SON AŞAMA: DÜNYA ARENASI (ASENKRON PvP)
Eğer kariyerden sıkıldıysan, takımını "Dünya Arenasına" sokacaksın.
Sistem şöyle çalışır:
*   Maç yap dediğinde, sunucu Çin'den veya Brezilya'dan "Senin gibi oyunu oynayıp takımını Arena moduna kaydetmiş" gerçek bir kullanıcının takımını ve taktiğini (Şablonunu) bilgisayarına çeker.
*   Karşı taraf Çevrimdışı (Offline) olsa bile, Maç Motorun onun kurduğu taktiklerle Senin Taktiklerini savaştırır.
*   Kazanırsan (ELO / Rank Sistemi ile) Bronz'dan Gümüş'e küme atlarsın. Ay sonu sezon bitince rütbene göre hesabına "Nadir Oyuncu, Ekstra Bütçe" yatar. 

---

### BU PLANI NASIL İNŞAA EDECEĞİZ? (Teknik Roadmap)
Bu iş devasa bir RPG altyapısı demek. Sırayla yapıp bozmadan ilerleyeceğiz:

1.  **Faz A:** `ManagerProfile` altyapısı. İlk giriş ekranını (Karakter yaratma) ve XP barını kodlayacağız.
2.  **Faz B:** `engine.ts` maç sonlarına XP ve Seviye hesaplama mantığını entegre edeceğiz. Kazanınca XP barının dolduğunu göreceksin.
3.  **Faz C:** İtibar'a Göre (Reputation) Kulüp Seçimi kilit ekranını inşa edeceğiz. 
4.  **Faz D:** Yetenek Ağacını (Skill Tree UI) tasarlayıp, maç motorundaki statları (örneğin o +3 Finishing buff'ını) buraya bağlayacağız.
5.  **Faz E:** Google Play Başarımlar Motorunu ekleyeceğiz.

Hazırsak bu dosyayı rehber alıp, oyununu resmen bir dünyaya çevirmeye Faz A'dan başlayalım mı?

---
---

# CLAUDE'UN TASARIM NOTLARI
*Yukarıdaki bölümler orijinal vizyonu yansıtıyor. Aşağıdakiler benim kendi bakış açım — bazı şeyleri farklı düşünüyorum, bazılarını genişletiyorum.*

---

## C1. FELSEFE: "ÖNCE OYNAT, SONRA ANLAT"

Yukarıdaki planda karakter yaratma ilk ekranda yer alıyor. Ben buna katılmıyorum.

**Neden:** Google Play'de Day-1 Retention en kritik metrik. Oyuncunun ilk 5 dakikasını form doldurmaya harcatırsan büyük kısmı atar.

**Benim önerdiğim sıra:**
1. Oyuncu direkt maça giriyor — mevcut sistem, sıfır sürtüşme
2. İlk galibiyet sonrası XP barı belirir, level atlar — "Bu ne?" merakı
3. İkinci veya üçüncü maç sonrası: *"Menajer profilini oluşturmak ister misin? Bu senin kariyerin."* — artık oyuncu yatırım yapmış, formu doldurmaya istekli
4. Kişisel ekip slotları seviye 3-5 civarında açılmaya başlar — her şey zamanla ortaya çıkar

RPG katmanını başta zorla yutturma. Önce bağla, sonra derinliği göster.

---

## C2. KİŞİSEL EKİP — "SENİN ADAMLARIN"

Yukarıdaki Skill Tree yerine benim önerdiğim sistem bu. Aynı bonuslar, ama çok daha somut ve duygusal.

**Temel Fark:** Bu ekip takıma değil, **sana** ait. Kulüp değiştirince onlar da seninle gelir.

### C2.1. Menajer Geliri
Kişisel ekibinin maaşını kulüp bütçesinden değil, **Menajer Geliri** adlı ayrı bir kaynaktan ödersin.

- Her sezon kulüp sana "yönetim ücreti" öder (kulüp büyüklüğüne göre değişir)
- Küçük takım → az gelir → 1-2 eleman tutabilirsin
- Real Madrid seviyesi → yüksek gelir → tam kadro
- Bu otomatik denge sağlar. Küçük takımda 5 kişilik ekip tutmak zaten imkansız olur

### C2.2. Ekip Üyeleri ve Görevleri

**Kişisel Scoutlar (Oyuncu Keşif)**
- Her scout belirli bir coğrafyaya atanır: Avrupa, Güney Amerika, Afrika, Asya, vb.
- O bölgedeki oyuncuların gizli statları açılmaya başlar (Fog of War ile entegre)
- Scout olmayan bölgedeki oyuncular `??` olarak kalır
- Raporlar anlık değil, 3-5 gün içinde gelir — gerçekçi bekleme

**Alt Yapı Scoutları (Genç Oyuncu Keşif)**
- Sadece 18 yaş altı potansiyelli gençleri arar
- "Senegal'de 16 yaşında Potansiyel 88 bir çocuk var, izleyeyim mi?" bildirimi gelir
- Ayrı slot — senior scout ile karıştırılmaz

**Antrenörler (Gelişim Hızı)**
- *Benim felsefem:* Antrenörler stat vermez, **potansiyele ulaşma hızını** artırır
- Her oyuncunun gizli bir "Potansiyel Tavanı" var (scout açar bunu)
- 72 OVR, Potansiyel 82 olan oyuncu normalde 4 sezonda tavana ulaşır. Antrenörle 2 sezonda ulaşır
- **Tavan değişmez.** 70 potansiyelli oyuncu en iyi antrenörle de 70'de durur
- Her antrenör aynı anda maksimum 3-4 oyuncuya odaklanabilir — herkesi aynı anda geliştirme imkansız

**Fixer / Bağlantı Adamı**
- Transferlerde kulüp itibarının biraz üstündeki oyunculara ulaşmayı sağlar
- Kulüp itibarı 6.000 → normalde 6.000 altı oyuncularla ilgilenebilirsin
- Seviye 3 Fixer ile 6.800'lük oyuncuyla masaya oturabilirsin
- Gerçekçi: "Ajanı güçlü hoca daha iyi oyuncu çeker" mantığı

**Sağlık Direktörü**
- Sakatlanma ihtimalini düşürür
- Sakatlık süresini kısaltır
- Maç sonu kondisyon toparlanmasını hızlandırır

### C2.3. İşten Çıkarma
Menajer gelirin düşerse (küçük takıma inersen) tüm ekibi tutamazsın. Birini seçmek zorundasın. Bu **her kulüp değişikliğini dramatik bir karar** haline getirir. "Scout'u mu bıraksam antrenörü mü?"

---

## C3. YAPAY ZEKA DENGESİ — "KULÜP ANTRENÖRLÜKSEVİYESİ"

Mevcut planda AI takımların nasıl dengeleneceği belirsiz. Benim çözümüm şu:

Her kulübün görünmez bir **Coaching Quality** puanı var (1-10 arası):

- Real Madrid → 9 | Küçük lig takımı → 3
- Bu puan, o kulübün oyuncularının kendi potansiyellerine ne kadar hızlı ulaştığını belirler — tamamen arka planda, otomatik
- Oyuncu o kulübü devraldığında Coaching Quality değeri devreye girer — kendi antrenörleriyle bunu değiştirebilir
- AI takımlar bu sayede dinamik ama görünmez şekilde gelişir

Oyuncu bunu hiç hesaplaması gerekmez. Sadece "Bu kulüpte oyuncular neden bu kadar hızlı gelişti?" diye şaşırır — arka planda sistem çalışıyor.

---

## C4. KOVULMA SİSTEMİ — BİRAZ YUMUŞAT

Orijinal planda "5 üst üste mağlubiyet = kovulma" var. Ben bu eşiği çok sert buluyorum.

**Önerim:**
- Kulüp başkanıyla ilişki puanı sistemi (1-100)
- Her mağlubiyet düşürür, her galibiyet artırır, hedef tutturma büyük artırır
- 0'a düşerse ANCAK o zaman kovulursun
- Bu hem daha gerçekçi hem daha az frustrating — "beş maç kaybettim atıldım" yerine "zaten uzun süredir kötü gidiyordu" hissi verir
- Aynı zamanda "başkanı idare etmek" de bir oyun mekaniği olur

---

## C5. FARKLI FAZ SIRASI

Orijinal planda Achievements en sona bırakılmış (Faz E). Ben tam tersini düşünüyorum.

| Faz | Ne | Neden |
|-----|----|-------|
| **1** | Google Play Achievements API entegrasyonu | Oyun tasarımına dokunmuyor, 1 haftalık iş, Google Level Up için direkt etki |
| **2** | XP bar + Level göstergesi (görsel) | Session length artar, her maçta "büyüdüm" hissi — hızlı kazanım |
| **3** | İtibar sistemi + Kulüp kilidi | Uzun vadeli retention, oyunun omurgası |
| **4** | Kişisel Ekip (Staff) sistemi | Ekonomi ve denge gerektiriyor, iyi planlanmalı |
| **5** | Fog of War (Stat gizleme) | Scout sistemine bağlı, en karmaşık ama en derin |
| **6** | Async PvP | Backend altyapısı gerektirir, uzak gelecek |
| **Bekle** | Skill Tree | Kişisel Ekip sistemi bunu zaten karşılıyor, ikisi birden olmasın |

---

## C6. BAŞARIMLAR — BENİM LİSTEM

Orijinaldeki liste iyiydi ama birkaç şey eklemek istedim. Özellikle "pasif tetiklenen" ve "gizli" başarımlar retention için çok önemli — oyuncu beklemediği an gelince çok daha etkili.

### Standart Başarımlar — Genel Kariyer

- **"İlk Adım"** → Kariyerinde ilk maçını oyna. *(500 XP — neredeyse herkese verilen, iyi niyet)*
- **"İlk Kan"** → Kariyerindeki ilk galibiyeti al. *(1.000 XP)*
- **"Efsanenin Doğuşu"** → Menajer seviye 10'a ulaş. *(5.000 XP)*
- **"Para Konuşur"** → Kasada 100 Milyon Euro birikti. *(3.000 XP)*
- **"Göçebe Hoca"** → 3 farklı ülkede kulüp yönet. *(4.000 XP)*
- **"Kendi Ekibim"** → Kişisel ekibinin tüm slotlarını doldur. *(3.500 XP)*

---

### Lig & Şampiyonluk Başarımları

- **"Taht Benim"** → İlk lig şampiyonluğunu kazan. *(5.000 XP)*
- **"Vazgeçilmez Hoca"** → Üst üste 2 sezon lig şampiyonu ol. *(8.000 XP)*
- **"Hanedan"** → Üst üste 3 veya daha fazla sezon lig şampiyonu ol. *(15.000 XP — nadir)*
- **"Yenilmezler"** → Bir sezonu hiç mağlubiyet almadan tamamla (beraberlik olabilir). *(12.000 XP)*
- **"Gol Makinesi"** → Takımındaki bir oyuncu o sezonun lig gol krallığını kazansın. *(4.000 XP)*
- **"Son Nefes"** → Son haftada şampiyonluğu kazan (son maça kadar fark 3 veya daha az). *(6.000 XP)*
- **"Kurtarıcı"** → Küme düşme sınırında devraldığın takımı aynı sezonda kurtarsın. *(7.000 XP)*
- **"Yerli Malı"** → Bir sezonda sadece kendi alt yapından yetiştirdiğin oyuncularla şampiyon ol (transfer yok). *(10.000 XP — çok nadir)*

---

### Avrupa / Uluslararası Kupa Başarımları

- **"Kıtaya Açılış"** → İlk uluslararası kupa maçını oyna. *(1.500 XP)*
- **"Grup Lideri"** → Uluslararası kupada grubu lider olarak geç. *(4.000 XP)*
- **"Son 8"** → Uluslararası kupada çeyrek finale çık. *(6.000 XP)*
- **"Yarı Final Savaşçısı"** → Uluslararası kupada yarı finale çık. *(8.000 XP)*
- **"Kıta Fatihi"** → Uluslararası kupayı kazan. *(15.000 XP)*
- **"Çifte Taç"** → Aynı sezonda hem lig hem uluslararası kupayı kazan. *(20.000 XP — çok özel)*
- **"Süper Güç"** → Süper Kupayı kazan. *(8.000 XP)*
- **"Arka Arkaya Kıta"** → Üst üste 2 sezon uluslararası kupayı kazan. *(25.000 XP — efsane seviyesi)*

---

### Geri Dönüş & Dramatik An Başarımları

- **"Çin Seddi"** → Bir sezonda hiç gol yemeden 5 maç kazan. *(2.000 XP)*
- **"David ve Goliath"** → Takım itibarın en az %40 daha yüksek rakibi lig maçında mağlup et. *(3.000 XP)*
- **"Şeytanın Bacağı"** → 80+ dakikada geride giderken maçı çevir. *(2.500 XP)*
- **"İmkansız"** → 3-0 geride giderken maçı kazanmaya dön (3 fark kapatıp öne geç). *(7.000 XP — çok nadir)*
- **"Deplasman Canavarı"** → Deplasmanda üst üste 5 maç kazan. *(4.000 XP)*
- **"Temiz Sayfa"** → Üst üste 8 maç gol yeme. *(5.000 XP)*
- **"Golcü Fırtınası"** → Bir maçta 7 veya daha fazla gol at. *(3.000 XP)*
- **"Kupa Katili"** → Kupa turnuvasında bir maçta 3 veya daha güçlü takımı üst üste eleyerek şampiyon ol. *(6.000 XP)*

---

### Pasif Tetiklenen Başarımlar
*Oyuncu bunları beklemeden kazanır — en güçlü duygusal anlar bunlar.*

- **"Pişmanlık"** → Sattığın bir oyuncu, sana karşı oynanan maçta gol atar. *(2.000 XP)*
- **"Kör Şans"** → Scout raporu almadan transfer ettiğin oyuncu 85+ OVR çıkar. *(2.500 XP)*
- **"Sürgün'ün İntikamı"** → Kovulduktan sonra seni kovan kulübü bir sonraki sezon mağlup et. *(5.000 XP)*
- **"Ata Yurdu"** → Kendi uyruğundaki bir kulübü şampiyon yap. *(4.000 XP)*
- **"Elmas Ham Taşı"** → Alt yapıdan yetiştirdiğin oyuncu 80+ OVR'ye ulaşır. *(3.000 XP)*
- **"Lokomotif"** → Aynı kişisel scout ile 3 farklı kulüpte çalış. *(2.000 XP)*
- **"Dünya Gezgini"** → Kişisel scoutların aynı anda 4 farklı kıtada aktif olsun. *(3.000 XP)*
- **"Efsane Forvet"** → Takımındaki bir oyuncu tek sezonda 40+ gol atar. *(5.000 XP)*
- **"Kendi Yarattığım"** → Alt yapıdan yetiştirdiğin oyuncu uluslararası kupada gol atar. *(4.000 XP)*

---

### Gizli Başarımlar (Google Play "secret achievement")
*Açıklaması yok, sadece "Gizli Başarım" yazar — merak uyandırır.*

- **"????"** → Aynı oyuncuyu iki farklı kulüpten transfer et (sat, sonra başka yerden geri al).
- **"????"** → Menajer itibarın kulüp itibarından yüksek olduğu halde alt lig takımını tercih et.
- **"????"** → Bir maçta 5-0 geriye düş ve berabere bit.
- **"????"** → Grup aşamasında son sıradayken son maçta grubu lider geç.
- **"????"** → Gol kralı olan oyuncunu o sezon bittikten hemen sonra sat.

---

*Son not: Bu sistemlerin hepsi aynı anda yapılmayacak. Test sürümü kararlı olduktan sonra, Faz 1'den (Achievements) başlayarak sırayla eklenecek. Her faz kendi başına tam ve çalışır halde olacak.*
