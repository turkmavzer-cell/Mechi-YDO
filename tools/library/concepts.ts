/**
 * Kütüphane kavram listesi (yalnızca İngilizce madde başlıkları; Arapça ve Türkçe karşılıklar Wiktionary
 * çeviri tablolarından gelir, burada yazılmaz).
 *
 * Satır biçimi: "İngilizce madde | tür | anlam ipucu | tercih edilen Türkçe | tercih edilen Arapça"
 *   tür: n (isim), v (fiil), adj, adv, phr (kalıp/edat/bağlaç)
 *   anlam ipucu: çeviri tablosunun "sense" etiketinde aranacak parça (boşsa ilk uygun tablo)
 *   tercih edilen Türkçe: tabloda birden çok Türkçe karşılık varsa bunu seç; "=" önekli ise Türkçe elle verilmiştir
 *     (yalnızca Türkçesi kesin olan, tablosu zayıf maddeler; Arapça yine Wiktionary tablosundan)
 *   tercih edilen Arapça: yalnızca tablonun zaten listelediği seçenekler arasından seçim (ör. فَكَّرَ / فَكَرَ)
 */
export type Category =
  | 'günlük' | 'alışveriş' | 'yolculuk' | 'tartışma' | 'iş'
  | 'sağlık' | 'banka' | 'ev' | 'tamir' | 'yön' | 'sayılar' | 'zaman';

export const CONCEPTS: Partial<Record<Category, string[]>> = {
  günlük: [
    'house|n|dwelling|ev', 'room|n|part of a building|oda', 'kitchen|n||mutfak', 'bathroom|n|room containing a bath|banyo',
    'bed|n|piece of furniture|yatak', 'door|n||kapı', 'window|n|opening|pencere', 'key|n|device designed to open|anahtar',
    'table|n|furniture|masa', 'chair|n||sandalye', 'water|n|clear liquid|su', 'bread|n||ekmek', 'rice|n|seeds|pirinç',
    'meat|n|animal flesh|et', 'chicken|n|meat|tavuk', 'fish|n|flesh of fish|balık', 'egg|n|of birds|yumurta',
    'milk|n|liquid|süt', 'cheese|n||peynir', 'fruit|n|food|meyve', 'vegetable|n|plant|sebze', 'tea|n|drink|çay',
    'coffee|n|beverage|kahve', 'sugar|n|sucrose|şeker', 'salt|n|sodium chloride|tuz', 'breakfast|n||kahvaltı',
    'lunch|n||öğle yemeği', 'dinner|n|main meal|akşam yemeği', 'morning|n|part of the day|sabah', 'evening|n||akşam',
    'night|n|period between sunset|gece', 'week|n|period of seven days|hafta', 'month|n|period into which a year|ay',
    'weather|n|state of the atmosphere|hava', 'rain|n|condensed water|yağmur', 'snow|n|precipitation|kar',
    'wind|n|movement of air|rüzgâr', 'mother|n|female parent|anne', 'father|n|male parent|baba',
    'brother|n|son of the same parents|erkek kardeş', 'sister|n|woman or girl in relation|kız kardeş',
    'son|n|male offspring|oğul', 'wife|n|married woman|eş', 'husband|n|man in a marriage|koca',
    'child|n|a minor|çocuk', 'friend|n|person other than a family member|arkadaş',
    'neighbour|n||komşu', 'name|n|word or phrase indicating|ad', 'clothes|n|items of clothing|giysi',
    'shoe|n|protective covering for the foot|ayakkabı', 'shirt|n|article of clothing|gömlek', 'head|n|part of the body|baş',
    'hand|n|part of the fore limb|el', 'eye|n|organ|göz', 'mouth|n|opening of a creature|ağız', 'tooth|n|biological|diş',
    'heart|n|organ|kalp', 'pain|n|ache|ağrı', 'medicine|n|substance|ilaç', 'fever|n|higher than normal body temperature|ateş|حُمَّى',
    'hungry|adj|affected by hunger|aç', 'thirsty|adj|needing to drink|=susamış', 'tired|adj|in need of rest|yorgun',
    'sick|adj|having an urge to vomit|hasta', 'happy|adj|having a feeling arising from|mutlu', 'sad|adj|emotionally negative|üzgün',
    'beautiful|adj|attractive|güzel', 'new|adj|recently made|yeni', 'old|adj|of an object|eski', 'hot|adj|having a high temperature|sıcak',
    'cold|adj|having a low temperature|soğuk', 'clean|adj|free of dirt|temiz', 'dirty|adj|unclean|kirli',
    'always|adv||her zaman', 'never|adv|at no time|asla', 'sometimes|adv||bazen', 'now|adv|at the present time|şimdi',
    'later|adv|afterward|sonra', 'together|adv|into one place|birlikte', 'very|adv|to a great extent|çok',
    'sleep|v|to rest in a state|uyumak', 'wake up|v|to (cause to) stop sleeping|uyanmak', 'wash|v|to clean with water|yıkamak',
    'cook|v|to prepare food|pişirmek', 'clean|v|to remove dirt|temizlemek', 'listen|v|to pay attention to a sound|dinlemek',
    'hear|v|to perceive sounds|duymak', 'forget|v|to lose remembrance|unutmak', 'remember|v|to recall|hatırlamak',
    'find|v|to encounter, to locate|bulmak', 'put|v|to place something somewhere|koymak', 'bring|v|to transport toward somebody|getirmek',
    'show|v|to display|göstermek', 'use|v|to utilize|kullanmak', 'teach|v|to pass on knowledge|öğretmek',
    'help|v|to provide assistance|yardım etmek', 'call|v|telephone|aramak', 'send|v|make something go somewhere|göndermek',
  ],
  alışveriş: [
    'shop|n|establishment that sells goods|dükkân', 'market|n|gathering of people for the purchase|pazar',
    'supermarket|n||süpermarket', 'price|n|cost required to gain possession|fiyat', 'money|n|legally or socially binding|para',
    'cash|n|money in the form of notes|nakit', 'change|n|small denominations of money|bozukluk', 'receipt|n|written acknowledgment|makbuz',
    'discount|n|reduction in price|indirim', 'cheap|adj|low in price|ucuz', 'expensive|adj|having a high price|pahalı',
    'sale|n|exchange of goods|satış', 'customer|n|patron|müşteri', 'seller|n|someone who sells|satıcı',
    'cashier|n|one employed to receive|kasiyer', 'wallet|n|case for keeping money|cüzdan', 'bag|n|flexible container|çanta',
    'bottle|n|container|şişe', 'kilogram|n||kilogram', 'litre|n||litre',
    'piece|n|part of a larger whole|parça', 'color|n||renk',
    'red|adj|having red as its colour|kırmızı', 'blue|adj|of the colour blue|mavi', 'green|adj|having green as its colour|yeşil',
    'black|adj|absorbing all light|siyah', 'white|adj|bright and colourless|beyaz', 'yellow|adj|having yellow as its colour|sarı',
    'gift|n|something given to another voluntarily|hediye', 'quality|n|level of excellence|kalite|جَوْدَة', 'free|adj|obtainable without any payment|bedava',
    'bakery|n|shop in which bread|fırın', 'butcher|n|person who prepares|kasap', 'pharmacy|n|place where medicines|eczane',
    'dress|n|item of clothing|elbise', 'pants|n|trousers|pantolon', 'jacket|n|piece of clothing|ceket',
    'apple|n|fruit|elma', 'banana|n|fruit|muz',
    'potato|n|plant tuber|patates', 'onion|n|plant|soğan', 'oil|n|liquid fat|yağ', 'soap|n|substance able to mix|sabun',
    'bill|n|invoice|fatura', 'credit card|n||kredi kartı', 'cost|n|amount of money|maliyet',
    'buy|v|to obtain (something) in exchange for money|satın almak', 'choose|v|to pick|seçmek', 'try|v|to attempt|denemek',
    'spend|v|to pay out (money)|harcamak', 'count|v|to recite numbers|saymak', 'weigh|v|to determine the weight|tartmak',
    'exchange|v|to trade or barter|değiştirmek', 'carry|v|to lift|taşımak', 'open|adj|not closed|açık', 'closed|adj|not open|kapalı',
    'enough|adj|sufficient|yeterli', 'more|adv|to a greater degree|daha', 'less|adv|to a smaller extent|daha az',
  ],
  yolculuk: [
    'journey|n|set amount of travelling|yolculuk', 'airport|n|place designated for airplanes|havalimanı',
    'airplane|n||uçak', 'flight|n|act of flying|uçuş', 'passport|n|official document|pasaport', 'visa|n|permit|vize',
    'ticket|n|admission to an event|bilet', 'luggage|n|baggage|bagaj', 'suitcase|n|large piece of luggage|valiz', 'hotel|n|establishment|otel',
    'reservation|n|arrangement by which something|rezervasyon', 'train|n|line of connected cars|tren', 'station|n|place where a vehicle may stop|istasyon',
    'bus|n|motor vehicle for carrying|otobüs', 'taxi|n|vehicle that may be hired|taksi', 'car|n|automobile|araba', 'road|n|way used for travelling|yol',
    'street|n|paved part of road|sokak', 'map|n|visual representation|harita', 'left|adj||sol', 'right|adj|direction|sağ',
    'straight|adv|in a straight direction|düz', 'near|adj|physically close|yakın', 'far|adj|remote in space|uzak', 'north|n|compass point|kuzey',
    'south|n|compass point|güney', 'east|n|compass point|doğu', 'west|n|compass point|batı', 'border|n|line or frontier area|sınır',
    'embassy|n|organization representing|=büyükelçilik', 'arrival|n|act of arriving|varış',
    'departure|n|act of departing|kalkış', 'delay|n|period of time before|gecikme', 'seat|n|place in which to sit|koltuk',
    'driver|n|one who drives|sürücü', 'fuel|n|substance consumed|yakıt', 'gasoline|n||benzin', 'tourist|n|someone who travels|turist',
    'museum|n|building|müze', 'beach|n|shore|plaj', 'sea|n|large body of salty water|deniz', 'mountain|n|large mass of earth|dağ',
    'city|n|large settlement|şehir', 'village|n|rural habitation|köy', 'country|n|nation state|ülke', 'address|n|description of the location|adres',
    'bridge|n|construction or natural feature|köprü', 'traffic|n|pedestrians or vehicles|trafik', 'accident|n|unexpected event with negative|kaza',
    'police|n|organisation|polis', 'ship|n|water-borne vessel|gemi', 'port|n|place on the coast|liman', 'boat|n|craft used for transportation|tekne',
    'subway|n|underground railway|metro', 'stop|n|place to get on and off|durak', 'entrance|n|place of entering|giriş', 'exit|n|way out|çıkış',
    'toilet|n|room used for urination|tuvalet', 'restaurant|n|eating establishment|lokanta', 'menu|n|details of the food|menü',
    'travel|v|to be on a journey|seyahat etmek', 'fly|v|to travel through the air|uçmak', 'drive|v|to operate|sürmek', 'arrive|v|to reach|varmak',
    'stop|v|to cause|durmak', 'rent|v|to occupy premises in exchange|kiralamak', 'reach|v|to arrive at|ulaşmak',
    'wait|v|to delay movement or action|beklemek', 'lose|v|to cause (something) to cease to be in one\'s possession|kaybetmek',
  ],
  tartışma: [
    'opinion|n|thought a person has formed|görüş', 'idea|n|image of an object|fikir', 'argument|n|fact or statement used to support|argüman',
    'discussion|n|conversation or debate|tartışma', 'debate|n|argument|münazara', 'reason|n|cause|sebep', 'problem|n|difficulty|sorun',
    'solution|n|answer to a problem|çözüm', 'truth|n|true facts|gerçek', 'lie|n|intentionally false statement|yalan', 'mistake|n|error|hata',
    'question|n|sentence, phrase or word which asks|soru', 'answer|n|response or reply|cevap', 'example|n|something representative|örnek',
    'fact|n|something actual|gerçek', 'evidence|n|facts or observations|kanıt', 'decision|n|choice or judgement|karar',
    'compromise|n|settlement of differences|uzlaşma', 'complaint|n|grievance|şikâyet', 'apology|n|expression of remorse|özür',
    'agreement|n|understanding to follow|anlaşma', 'disagreement|n|argument or debate|anlaşmazlık',
    'right|n|legal or moral entitlement|hak', 'peace|n|tranquility|barış', 'anger|n|strong feeling of displeasure|öfke',
    'correct|adj|free from error|doğru', 'wrong|adj|incorrect|yanlış',
    'important|adj|having relevant and crucial value|önemli', 'possible|adj|able but not certain|mümkün', 'impossible|adj|not able to be done|imkânsız',
    'clear|adj|easily understood|açık', 'angry|adj|displaying or feeling anger|kızgın', 'calm|adj|free from anxiety|sakin',
    'maybe|adv|indicating a lack of certainty|belki', 'certainly|adv|without doubt|kesinlikle',
    'because|phr|by or for the cause that|çünkü', 'but|phr|although|ama', 'however|adv|nevertheless|ancak', 'therefore|adv|for that or this reason|bu yüzden',
    'also|adv|in addition|=ayrıca', 'only|adv|without others|sadece', 'if|phr|supposing that|eğer|إِذَا', 'or|phr|connects at least two alternatives|veya',
    'agree|v|to harmonize in opinion|katılmak', 'disagree|v|to fail to agree|katılmamak', 'think|v|to ponder|düşünmek|فَكَّرَ', 'believe|v|to accept as true|inanmak',
    'explain|v|to make plain|açıklamak', 'ask|v|to request an answer|sormak', 'answer|v|to make a reply|cevaplamak', 'discuss|v|to converse|tartışmak',
    'prove|v|to demonstrate|kanıtlamak', 'refuse|v|to decline|reddetmek', 'accept|v|to receive|kabul etmek',
    'promise|v|to commit to something|söz vermek', 'apologize|v|to make an apology|özür dilemek', 'complain|v|to express feelings of pain|şikâyet etmek',
    'decide|v|to resolve|karar vermek', 'convince|v|to make someone believe|ikna etmek', 'forgive|v|to pardon|affetmek', 'mean|v|to intend|kastetmek',
  ],
  iş: [
    'work|n|employment|iş', 'company|n|corporation|şirket', 'office|n|room|ofis', 'manager|n|person whose job|müdür',
    'boss|n|person in charge|patron', 'employee|n|individual who provides labor|çalışan', 'colleague|n|fellow member of a profession|meslektaş|زَمِيل',
    'meeting|n|gathering for a purpose|toplantı', 'contract|n|agreement|sözleşme', 'salary|n|fixed amount of money|maaş', 'interview|n|conversation with|mülâkat',
    'experience|n|event|deneyim', 'project|n|planned endeavor|proje', 'report|n|information describing|rapor',
    'email|n|system for transferring messages|e-posta', 'computer|n|programmable electronic device|bilgisayar', 'document|n|original or official paper|belge',
    'signature|n|person\'s autograph name|imza', 'client|n|customer|müşteri', 'offer|n|proposal|teklif|عَرْض', 'tax|n|money paid to the government|vergi',
    'account|n|registry of pecuniary transactions|hesap', 'bank|n|institution|banka', 'debt|n|action, state of mind|borç',
    'profit|n|benefit|kazanç|رِبْح', 'loss|n|something that is lost|kayıp', 'product|n|commodity|ürün', 'service|n|act of being of assistance|hizmet',
    'team|n|group of people|takım', 'schedule|n|time-based plan|program', 'appointment|n|arrangement for a meeting|randevu', 'holiday|n|period of one or more days|tatil',
    'trade|n|buying and selling|ticaret', 'investment|n|placement of capital|yatırım', 'engineer|n|person qualified|mühendis',
    'worker|n|person who performs labor|işçi', 'factory|n|manufacturing place|fabrika', 'teacher|n|person who teaches|öğretmen',
    'lawyer|n|professional person authorized|avukat', 'secretary|n|person keeping records|sekreter', 'telephone|n||telefon', 'number|n|abstract entity|sayı',
    'date|n|point of time|tarih', 'deadline|n|time limit|son tarih', 'plan|n|set of intended actions|plan', 'goal|n|result that one is attempting|hedef',
    'responsibility|n|state of being responsible|sorumluluk', 'permission|n|authorisation|izin|إِذْن', 'busy|adj|doing a great deal|meşgul', 'free|adj|unconstrained|serbest',
    'urgent|adj|requiring immediate attention|acil', 'ready|adj|prepared for immediate action|hazır', 'late|adj|near the end of a period|geç', 'early|adj|at a time in advance|erken',
    'sign|v|to write one\'s signature|imzalamak', 'manage|v|to direct or be in charge|yönetmek', 'earn|v|to receive payment|kazanmak', 'hire|v|to employ|işe almak',
    'meet|v|to come face to face|buluşmak', 'begin|v|to start|başlamak', 'finish|v|to complete|bitirmek|أَنْهَى', 'organize|v|to arrange in working order|düzenlemek',
    'prepare|v|to make ready|hazırlamak', 'check|v|to inspect|kontrol etmek', 'collect|v|to gather together|toplamak',
    'need|v|to have an absolute requirement|ihtiyaç duymak', 'must|v|to have to|zorunda olmak',
  ],
};

import { MORE_CONCEPTS } from './concepts_more.ts';

export interface Concept {
  en: string;
  pos: 'n' | 'v' | 'adj' | 'adv' | 'phr' | 'num';
  hint: string;
  trPrefer: string;
  /** Türkçe tabloda yoksa/zayıfsa elle verilen kesin Türkçe ("=" ile işaretlenir; Arapça yine tablodan). */
  trForce: boolean;
  /** Tablodaki Arapça seçenekler arasından tercih (tabloda yoksa yok sayılır). */
  arPrefer: string;
  category: Category;
}

export function concepts(): Concept[] {
  const out: Concept[] = [];
  // Aynı kategori iki listede olabilir (günlük): satırlar birleşir; çakışan Türkçe anahtarları üretici tekilleştirir.
  const all = new Map<Category, string[]>();
  for (const src of [CONCEPTS, MORE_CONCEPTS] as Record<string, string[] | undefined>[]) {
    for (const [c, rows] of Object.entries(src)) all.set(c as Category, [...(all.get(c as Category) ?? []), ...(rows ?? [])]);
  }
  for (const [category, rows] of all) {
    for (const row of rows) {
      const [en, pos, hint = '', trRaw = '', arPrefer = ''] = row.split('|');
      const trForce = trRaw.startsWith('=');
      out.push({ en, pos: pos as Concept['pos'], hint, trPrefer: trForce ? trRaw.slice(1) : trRaw, trForce, arPrefer, category });
    }
  }
  return out;
}
