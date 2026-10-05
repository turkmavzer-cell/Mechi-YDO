# Kütüphane genişletme raporu

`node tools/build_content.ts` tarafından üretilir; elle düzenleme.

Kaynak: Wiktionary İngilizce maddelerinin çeviri tabloları (aynı anlamın Türkçe ve Arapça karşılıkları) ve 
"English phrasebook" ifadeleri — kaikki.org dökümü, **CC-BY-SA 4.0**. Arapça hiçbir kayıtta elle yazılmadı. 
Tüm kayıtlar **doğrulanmamış** (`verified: false`); Arapça bilen biri tarafından gözden geçirilmeli.

| Kategori | Kelime | Fiil | Cümle |
|---|---|---|---|
| günlük | 33 | 17 | 99 |
| alışveriş | 29 | 6 | 5 |
| yolculuk | 38 | 7 | 13 |
| tartışma | 39 | 11 | 8 |
| iş | 48 | 7 | 2 |
| **Toplam** | **187** | **48** | **127** |

## İnceleme gerektirenler

### Seçimde uyarı alan maddeler
- günlük · thirsty: susamış = عَطْشَان — Türkçe elle verildi
- alışveriş · cost: masraf = تَكْلِفَة — "maliyet" tabloda yok; ipucuyla "amount of money spent for a purpose" tablosunun Türkçesi alındı
- yolculuk · suitcase: bavul = حَقِيبَةُ السَّفَر — "valiz" tabloda yok; ipucuyla "large piece of luggage" tablosunun Türkçesi alındı
- yolculuk · embassy: büyükelçilik = سِفَارَة — Türkçe elle verildi
- tartışma · idea: düşünce = فِكْرَة — "fikir" tabloda yok; ipucuyla "an image of an object that is formed in the mind or recalled by the memory" tablosunun Türkçesi alındı
- tartışma · argument: delil = حُجَّة — "argüman" tabloda yok; ipucuyla "1. fact or statement used to support a proposition; a reason" tablosunun Türkçesi alındı
- tartışma · fact: hakikat = حَقِيقَة — "gerçek" tabloda yok; ipucuyla "something actual" tablosunun Türkçesi alındı
- tartışma · also: ayrıca = أَيْضًا — Türkçe elle verildi
- iş · offer: teklif = اِقْتِرَاح — tercih edilen Arapça (عَرْض) tabloda yok

### Okunuş: motor (harekeli yazımdan) ile Wiktionary okunuşu farklı
Görüntülenen okunuş motorundur (ekrandaki harekeli yazımla tutarlı). Fark çoğunlukla Wiktionary okunuşunun
i'rab/tenvin veya farklı bir harf çevriyazısı içermesinden kaynaklanır; yine de gözden geçirin.
- her zaman: دَائِمًا — motor "dāʔima" / Wiktionary "dāʔiman"
- asla: أَبَدًا — motor "ʔabada" / Wiktionary "ʔabadan"
- bazen: أَحْيَانًا — motor "ʔaḥyāna" / Wiktionary "ʔaḥyānan"
- sonra: لَاحِقًا — motor "lāḥiqa" / Wiktionary "lāḥiqan"
- birlikte: مَعًا — motor "maʕa" / Wiktionary "maʕan"
- süpermarket: سُوبَرْمَارْكِت — motor "sūbarmārkit" / Wiktionary "subarmārkit"
- kasiyer: كَاشِير — motor "kāšīr" / Wiktionary "kāšēr"
- ceket: جَاكِيت — motor "jākīt" / Wiktionary "jakēt"
- bavul: حَقِيبَةُ السَّفَر — motor "ḥaqībau as safar" / Wiktionary "ḥaqībatu s-safar"
- kesinlikle: بِالتَّأْكِيد — motor "bit taʔkīd" / Wiktionary "bi-t-taʔkīd"
- ayrıca: أَيْضًا — motor "ʔayḍa" / Wiktionary "ʔayḍan"
- avukat: مُحَامٍ — motor "muḥāmi" / Wiktionary "muḥāmin"
- sekreter: سِكْرِتِير — motor "sikritīr" / Wiktionary "sekretēr"

### Türkçe çekimi elle doğrulanmamış yeni fiiller (kural çıktısı, ilk şahıs örnekleri)
- hatırlamak: hatırladım, hatırlıyorum, hatırlayacağım, hatırlarım, hatırla
- getirmek: getirdim, getiriyorum, getireceğim, getiririm, getir
- kullanmak: kullandım, kullanıyorum, kullanacağım, kullanırım, kullan
- öğretmek: öğrettim, öğretiyorum, öğreteceğim, öğretirim, öğret
- aramak: aradım, arıyorum, arayacağım, ararım, ara
- göndermek: gönderdim, gönderiyorum, göndereceğim, gönderirim, gönder
- harcamak: harcadım, harcıyorum, harcayacağım, harcarım, harca
- saymak: saydım, sayıyorum, sayacağım, sayarım, say
- tartmak: tarttım, tartıyorum, tartacağım, tartarım, tart
- taşımak: taşıdım, taşıyorum, taşıyacağım, taşırım, taşı
- kiralamak: kiraladım, kiralıyorum, kiralayacağım, kiralarım, kirala
- ulaşmak: ulaştım, ulaşıyorum, ulaşacağım, ulaşırım, ulaş
- katılmak: katıldım, katılıyorum, katılacağım, katılırım, katıl
- açıklamak: açıkladım, açıklıyorum, açıklayacağım, açıklarım, açıkla
- cevaplamak: cevapladım, cevaplıyorum, cevaplayacağım, cevaplarım, cevapla
- tartışmak: tartıştım, tartışıyorum, tartışacağım, tartışırım, tartış
- kanıtlamak: kanıtladım, kanıtlıyorum, kanıtlayacağım, kanıtlarım, kanıtla
- kastetmek: kastettim, kastediyorum, kastedeceğim, kastederim, kastet
- imzalamak: imzaladım, imzalıyorum, imzalayacağım, imzalarım, imzala
- buluşmak: buluştum, buluşuyorum, buluşacağım, buluşurum, buluş
- bitirmek: bitirdim, bitiriyorum, bitireceğim, bitiririm, bitir
- hazırlamak: hazırladım, hazırlıyorum, hazırlayacağım, hazırlarım, hazırla
- toplamak: topladım, topluyorum, toplayacağım, toplarım, topla

## Alınamayanlar

### Kavram bulunamadı / tablo yok
- günlük · sick (adj): Türkçe+Arapça çeviri tablosu yok
- alışveriş · free (adj): "bedava" hiçbir anlam tablosunda yok, ipucu da tutmadı
- alışveriş · exchange (v): Türkçe+Arapça çeviri tablosu yok
- alışveriş · closed (adj): Türkçe+Arapça çeviri tablosu yok
- alışveriş · enough (adj): madde yok
- alışveriş · more (adv): "daha" hiçbir anlam tablosunda yok, ipucu da tutmadı
- alışveriş · less (adv): Türkçe+Arapça çeviri tablosu yok
- yolculuk · straight (adv): Türkçe+Arapça çeviri tablosu yok
- yolculuk · seat (n): Türkçe+Arapça çeviri tablosu yok
- tartışma · agreement (n): "anlaşma" hiçbir anlam tablosunda yok, ipucu da tutmadı
- tartışma · disagreement (n): Türkçe+Arapça çeviri tablosu yok
- tartışma · clear (adj): Türkçe+Arapça çeviri tablosu yok
- tartışma · however (adv): "ancak" hiçbir anlam tablosunda yok, ipucu da tutmadı
- tartışma · disagree (v): Türkçe+Arapça çeviri tablosu yok
- tartışma · complain (v): Türkçe+Arapça çeviri tablosu yok
- iş · loss (n): Türkçe+Arapça çeviri tablosu yok
- iş · deadline (n): "son tarih" hiçbir anlam tablosunda yok, ipucu da tutmadı
- iş · manage (v): Türkçe+Arapça çeviri tablosu yok
- iş · organize (v): Türkçe+Arapça çeviri tablosu yok
- iş · check (v): Türkçe+Arapça çeviri tablosu yok
- iş · must (v): "zorunda olmak" hiçbir anlam tablosunda yok, ipucu da tutmadı

### Fiil bilgisi çıkarılamadı

### Tohumda zaten olan (tohum önceliklidir)
- ev (house)
- oda (room)
- yatak (bed)
- kapı (door)
- pencere (window)
- anahtar (key)
- su (water)
- ekmek (bread)
- pirinç (rice)
- et (meat)
- tavuk (chicken)
- balık (fish)
- yumurta (egg)
- süt (milk)
- peynir (cheese)
- meyve (fruit)
- sebze (vegetable)
- çay (tea)
- kahve (coffee)
- şeker (sugar)
- tuz (salt)
- sabah (morning)
- akşam (evening)
- gece (night)
- hafta (week)
- ay (month)
- anne (mother)
- baba (father)
- çocuk (child)
- arkadaş (friend)
- baş (head)
- el (hand)
- göz (eye)
- diş (tooth)
- kalp (heart)
- ağrı (pain)
- ilaç (medicine)
- ateş (fever)
- güzel (beautiful)
- yeni (new)
- eski (old)
- sıcak (hot)
- soğuk (cold)
- temiz (clean)
- kirli (dirty)
- şimdi (now)
- çok (very)
- pazar (market)
- fiyat (price)
- para (money)
- nakit (cash)
- indirim (discount)
- ucuz (cheap)
- pahalı (expensive)
- çanta (bag)
- kırmızı (red)
- mavi (blue)
- yeşil (green)
- siyah (black)
- beyaz (white)
- sarı (yellow)
- eczane (pharmacy)
- elma (apple)
- kredi kartı (credit card)
- açık (open)
- havalimanı (airport)
- uçak (airplane)
- bilet (ticket)
- otel (hotel)
- tren (train)
- istasyon (station)
- otobüs (bus)
- taksi (taxi)
- araba (car)
- yol (road)
- sokak (street)
- harita (map)
- sol (left)
- sağ (right)
- yakın (near)
- uzak (far)
- şehir (city)
- ülke (country)
- köprü (bridge)
- polis (police)
- tuvalet (toilet)
- doğru (correct)
- yanlış (wrong)
- çünkü (because)
- ama (but)
- veya (or)
- iş (work)
- hesap (account)
- banka (bank)
- telefon (telephone)
- acil (urgent)
- iyi akşamlar (good evening)
- günaydın (good morning)
- merhaba (hello)
- anlamıyorum (I don't understand)
- hesap lütfen (the bill, please)
- adın ne? (what is your name)

### Tekrar eden Türkçe anahtar
- fiil beklemek (wait)
- müşteri (client)
- cümle iyi günler (have a nice day)
- cümle önemli değil (not at all)
- cümle rica ederim (you're welcome)

### Phrasebook: atlanan ifadeler
- **Türkçe yok** (192): all the best, am I under arrest, anything is possible, are you doing anything tomorrow, are you feeling better, be careful, be right back, be thankful for small mercies, call the fire brigade, can you tell us, consider it done, does this train stop at, do not enter, do you have any brothers or sisters, do you have any pets, do you have Wi-Fi, do you know, do you need to use the bathroom, do you think you can walk, enjoy your meal, happy holidays, have a gas, have a good weekend, have a safe trip home, help is on the way, help wanted, he's unconscious, how did it go, how do I get to, how do you like, how do you mean, how many stops until, how much does it cost, how much do I owe you, how much is it, I am a doctor, I am blind, I am hungry, I am thirsty, I am tired …
- **Fusha Arapça yok** (58): are you allergic to any medications, beware of the dog, don't worry, do you accept American dollars, how do I get to the bus station, how many siblings do you have, how much do you charge, I am HIV positive, I can't thank you enough, I could eat a horse, I don't drive, I have a disability, I have a fever, I have AIDS, I have asthma, I have cancer, I have diabetes, I have high blood pressure, I have low blood pressure, I'll call the police, I lost my backpack, I lost my glasses, I lost my handbag, I'm afraid not, I'm a girl, I'm allergic to nuts, I'm allergic to penicillin, I'm asexual, I'm a trans girl, I'm a trans guy, I'm bisexual, I'm busy, I'm divorced, I'm fine, thank you, I'm not religious, I'm straight, is anyone sitting here, is it going to rain, it doesn't matter, marry me …
- **kapsam dışı** (57): are you religious, are you single, be called, can I buy you a drink, can I use your phone, cheers, could I see the menu, please, does anyone here speak English, do you believe in God, do you come here often, do you have a boyfriend, do you have a girlfriend, do you have a menu in English, do you love me, get lost, good afternoon, got it, Happy Christmas, happy Easter, happy Hanukkah, have a seat, have fun, help, how do you do, how do you say … in English, I am English, I'd like to kiss you, I don't eat meat, I hate you, I like you, I live in Melbourne, I love you, I'm a Protestant, I'm a vegan, I'm bleeding, I'm cold, I'm in love with you, I miss you, I'm tired, I think so …
- **yeterince harekeli Fusha yok** (11): caution - slippery when wet, do I know you, I'm allergic to pollen, it depends, I've been raped, I've been shot, keep the change, please pass the salt, there isn't any easy way to say this, the toilet is clogged, what's on your mind
- **yer tutuculu** (6): I can't find my ..., I'm ... year(s) old, I need ..., I was born in ..., my blood type is ..., what does … mean
