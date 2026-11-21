/** Languages written in the code next to each text. */
type Base = 'en' | 'fr' | 'ar';
/** Every language of the site: the three in the code, and the others from src/locales/<lang>.json (English text → translation). */
export type Lang = Base | 'de' | 'it' | 'es' | 'ru' | 'uk' | 'pl' | 'cs' | 'nl' | 'zh';
export type T3 = Record<Base, string>;
/** A text written in English only: its other languages come from src/locales/<lang>.json (fr and ar included). */
export type T1 = { en: string } & Partial<T3>;
export const LANGS: { id: Lang; label: string }[] = [
  { id: 'en', label: 'English' },
  { id: 'fr', label: 'Français' },
  { id: 'ar', label: 'العربية' },
  { id: 'de', label: 'Deutsch' },
  { id: 'it', label: 'Italiano' },
  { id: 'es', label: 'Español' },
  { id: 'ru', label: 'Русский' },
  { id: 'uk', label: 'Українська' },
  { id: 'pl', label: 'Polski' },
  { id: 'cs', label: 'Čeština' },
  { id: 'nl', label: 'Nederlands' },
  { id: 'zh', label: '中文' },
];
const isBase = (l: Lang): l is Base => l === 'en' || l === 'fr' || l === 'ar';
/** Translation files, loaded only when their language is picked. */
const LOCALES: Record<Exclude<Lang, 'en'>, () => Promise<{ default: Record<string, string> }>> = {
  fr: () => import('./locales/fr.json'), ar: () => import('./locales/ar.json'),
  de: () => import('./locales/de.json'), it: () => import('./locales/it.json'), ru: () => import('./locales/ru.json'),
  uk: () => import('./locales/uk.json'), pl: () => import('./locales/pl.json'), cs: () => import('./locales/cs.json'),
  nl: () => import('./locales/nl.json'), es: () => import('./locales/es.json'), zh: () => import('./locales/zh.json'),
};
let dict: Record<string, string> | null = null;
async function loadDict(l: Lang) {
  if (l === 'en') { dict = null; return; }
  try { dict = (await LOCALES[l]()).default; } catch { dict = {}; }
}

const UI = {
  brand: { en: 'Visit Tunisia', fr: 'Visit Tunisia', ar: 'زوروا تونس' },
  heroTitle: {
    en: 'All of Tunisia on one living map',
    fr: 'Toute la Tunisie sur une carte vivante',
    ar: 'تونس كلّها على خريطة حيّة',
  },
  heroText: {
    en: 'Beaches, oases, Roman cities, wildlife and how to get around, from the green north to the Sahara. Zoom in, pick what you like, build your trip, and walk twelve monuments in 3D.',
    fr: 'Plages, oasis, cités romaines, faune et moyens de transport, du nord verdoyant au Sahara. Zoomez, choisissez ce qui vous plaît, composez votre voyage, et parcourez douze monuments en 3D.',
    ar: 'شواطئ وواحات ومدن رومانية وحياة برّية ووسائل تنقّل، من الشمال الأخضر إلى الصحراء. كبّر الخريطة، واختر ما يعجبك، وابنِ رحلتك، وتجوّل في اثني عشر معلمًا بالأبعاد الثلاثة.',
  },
  startElJem: { en: 'Walk into El Jem', fr: 'Entrer à El Jem', ar: 'ادخل مدرج الجم' },
  heroEm: { en: 'one living map', fr: 'une carte vivante', ar: 'خريطة حيّة' },
  heroEyebrow: { en: 'Free · in your browser · no download', fr: 'Gratuit · dans votre navigateur · sans téléchargement', ar: 'مجاني · في متصفحك · دون تنزيل' },
  browseAll: { en: 'Browse all monuments', fr: 'Voir tous les monuments', ar: 'تصفّح كل المعالم' },
  legendOpen: { en: 'Available in 3D', fr: 'Ouvert en 3D', ar: 'متاح بالأبعاد الثلاثة' },
  openCount: { en: '{n} of {m} monuments open', fr: '{n} monument(s) ouvert(s) sur {m}', ar: '{n} من {m} معالم متاحة' },
  walkIn3d: { en: 'Walk in 3D', fr: 'Visite en 3D', ar: 'جولة ثلاثية الأبعاد' },
  scrollCue: { en: 'Scroll for all the places', fr: 'Faites défiler pour voir tous les lieux', ar: 'مرّر لرؤية كل الأماكن' },
  monumentsTitle: { en: 'The monuments', fr: 'Les monuments', ar: 'المعالم' },
  monumentsText: {
    en: 'Twelve places that tell Tunisia’s story, from Punic Carthage to the desert ksour. All twelve are open: El Jem, Sidi Bou Said, Carthage, the Medina of Tunis, Dougga, Kairouan, Sousse, Sbeitla, Djerba, Matmata, Ksar Ouled Soltane and Bulla Regia.',
    fr: 'Douze lieux qui racontent l’histoire de la Tunisie, de la Carthage punique aux ksour du désert. Les douze sont ouverts : El Jem, Sidi Bou Saïd, Carthage, la médina de Tunis, Dougga, Kairouan, Sousse, Sbeïtla, Djerba, Matmata, Ksar Ouled Soltane et Bulla Regia.',
    ar: 'اثنا عشر مكانًا تروي تاريخ تونس، من قرطاج البونيقية إلى قصور الصحراء. الأماكن الاثنا عشر كلّها متاحة: مدرج الجم وسيدي بوسعيد وقرطاج ومدينة تونس العتيقة ودقة والقيروان وسوسة وسبيطلة وجربة ومطماطة وقصر أولاد سلطان وبلاريجيا.',
  },
  // ---- home map ----
  catAll: { en: 'Everything', fr: 'Tout', ar: 'الكل' },
  catHistoric: { en: 'Heritage', fr: 'Patrimoine', ar: 'تراث' },
  catBeach: { en: 'Beaches', fr: 'Plages', ar: 'شواطئ' },
  catNature: { en: 'Nature', fr: 'Nature', ar: 'طبيعة' },
  catSahara: { en: 'Sahara & oases', fr: 'Sahara et oasis', ar: 'الصحراء والواحات' },
  layerWildlife: { en: 'Wildlife', fr: 'Faune', ar: 'الحياة البرّية' },
  layerTransport: { en: 'Getting around', fr: 'Se déplacer', ar: 'التنقّل' },
  journeys: { en: 'Journeys', fr: 'Itinéraires', ar: 'مسارات' },
  myTrip: { en: 'My trip', fr: 'Mon voyage', ar: 'رحلتي' },
  addTrip: { en: 'Add to my trip', fr: 'Ajouter à mon voyage', ar: 'أضف إلى رحلتي' },
  removeTrip: { en: 'Remove from my trip', fr: 'Retirer de mon voyage', ar: 'احذف من رحلتي' },
  tripEmpty: { en: 'Open a place and press “Add to my trip”. Your route is drawn on the map with distances.', fr: 'Ouvrez un lieu et appuyez sur « Ajouter à mon voyage ». Votre itinéraire se dessine sur la carte avec les distances.', ar: 'افتح مكانًا واضغط «أضف إلى رحلتي». يُرسم مسارك على الخريطة مع المسافات.' },
  tripStats: { en: '{n} stops · about {km} km · {h} of driving', fr: '{n} étapes · environ {km} km · {h} de route', ar: '{n} محطات · نحو {km} كم · {h} من القيادة' },
  tripOrder: { en: 'Suggested order, starting nearest to Tunis. Distances are rough estimates.', fr: 'Ordre suggéré, en partant du plus proche de Tunis. Les distances sont des estimations.', ar: 'ترتيب مقترح يبدأ بالأقرب إلى تونس. المسافات تقديرية.' },
  copyLink: { en: 'Copy link', fr: 'Copier le lien', ar: 'انسخ الرابط' },
  copied: { en: 'Copied', fr: 'Copié', ar: 'تم النسخ' },
  clear: { en: 'Clear', fr: 'Effacer', ar: 'امسح' },
  hoursShort: { en: '{h} h', fr: '{h} h', ar: '{h} س' },
  fromTunis: { en: 'From Tunis', fr: 'Depuis Tunis', ar: 'من تونس' },
  byRoad: { en: 'about {km} km, {h} by road', fr: 'environ {km} km, {h} par la route', ar: 'نحو {km} كم، {h} بالطريق' },
  nearestAirport: { en: 'Nearest airport', fr: 'Aéroport le plus proche', ar: 'أقرب مطار' },
  nearestStation: { en: 'Nearest train station', fr: 'Gare la plus proche', ar: 'أقرب محطة قطار' },
  kmAway: { en: '{name} ({km} km)', fr: '{name} ({km} km)', ar: '{name} ({km} كم)' },
  bestTime: { en: 'Best time', fr: 'Meilleure période', ar: 'أفضل وقت' },
  hotelsNearby: { en: 'Hotels nearby', fr: 'Hôtels à proximité', ar: 'فنادق قريبة' },
  directions: { en: 'Directions', fr: 'Itinéraire', ar: 'الاتجاهات' },
  showOnMap: { en: 'Show on map', fr: 'Voir sur la carte', ar: 'أظهر على الخريطة' },
  zoomIn: { en: 'Zoom in', fr: 'Zoomer', ar: 'تكبير' },
  zoomOut: { en: 'Zoom out', fr: 'Dézoomer', ar: 'تصغير' },
  resetView: { en: 'Whole country', fr: 'Tout le pays', ar: 'كامل البلاد' },
  surprise: { en: 'Surprise me', fr: 'Surprenez-moi', ar: 'فاجئني' },
  searchPlaces: { en: 'Search a place…', fr: 'Chercher un lieu…', ar: 'ابحث عن مكان…' },
  mapHint: { en: 'Ctrl + scroll to zoom · drag to move', fr: 'Ctrl + molette pour zoomer · glissez pour déplacer', ar: 'اضغط Ctrl ومرّر للتكبير · اسحب للتحريك' },
  mapHintTouch: { en: 'Pinch to zoom · drag to move', fr: 'Pincez pour zoomer · glissez pour déplacer', ar: 'قرّب بإصبعين للتكبير · اسحب للتحريك' },
  layerWeather: { en: 'Weather', fr: 'Météo', ar: 'الطقس' },
  nowShort: { en: 'Now', fr: 'Maintenant', ar: 'الآن' },
  weatherAt: { en: 'Weather at {town}', fr: 'Météo à {town}', ar: 'الطقس في {town}' },
  wHigh: { en: 'Daytime high', fr: 'Maximum du jour', ar: 'الحرارة القصوى نهارًا' },
  wSeaLeg: { en: 'Sea', fr: 'Mer', ar: 'البحر' },
  rainyDays: { en: '{n} rainy days', fr: '{n} jours de pluie', ar: '{n} أيام ممطرة' },
  wSummary: { en: 'In {month}: about {hi}° by day and {lo}° at night{sea}, {n} rainy days on average.', fr: 'En {month} : environ {hi}° le jour et {lo}° la nuit{sea}, {n} jours de pluie en moyenne.', ar: 'في {month}: نحو {hi}° نهارًا و{lo}° ليلًا{sea}، و{n} أيام ممطرة في المتوسط.' },
  wSea: { en: ', sea at {sea}°', fr: ', mer à {sea}°', ar: '، والبحر {sea}°' },
  wSource: { en: 'Weather: Open-Meteo.com · averages 2015–2024', fr: 'Météo : Open-Meteo.com · moyennes 2015–2024', ar: 'الطقس: Open-Meteo.com · متوسطات 2015–2024' },
  wNoteNow: { en: 'The weather now in 24 towns. 🌊 Sea temperature for this month (average).', fr: 'La météo actuelle dans 24 villes. 🌊 Température de la mer ce mois-ci (moyenne).', ar: 'الطقس الآن في 24 مدينة. 🌊 حرارة البحر لهذا الشهر (متوسط).' },
  wNoteLoading: { en: 'Loading the weather now…', fr: 'Chargement de la météo…', ar: 'جارٍ تحميل الطقس…' },
  wNoteMonth: { en: 'Typical daytime highs in {month}, and 🌊 the sea, averaged over 2015–2024. Pick a month to plan when to come.', fr: 'Maximales habituelles en {month}, et 🌊 la mer, moyennes 2015–2024. Choisissez un mois pour préparer votre venue.', ar: 'الحرارة القصوى المعتادة في {month}، و🌊 حرارة البحر، متوسط 2015–2024. اختر شهرًا لتخطّط لموعد زيارتك.' },
  wNoteOffline: { en: 'The live weather is not available: showing the averages for {month}.', fr: 'La météo en direct n’est pas disponible : moyennes de {month}.', ar: 'الطقس المباشر غير متاح: نعرض متوسطات {month}.' },
  navGuide: { en: 'Before you go', fr: 'Avant de partir', ar: 'قبل السفر' },
  navEvents: { en: 'What’s on', fr: 'Agenda', ar: 'المهرجانات' },
  navItin: { en: 'Itineraries', fr: 'Itinéraires', ar: 'مسارات الرحلة' },
  navFood: { en: 'Food and words', fr: 'Cuisine et mots', ar: 'الأكل والكلمات' },
  guideTitle: { en: 'Before you go', fr: 'Avant de partir', ar: 'قبل السفر' },
  guideText: { en: 'Visas, money, safety, health and getting around: the practical side of a trip, from official and well-known sources. Rules change, so check them before you book.', fr: 'Visas, argent, sécurité, santé et déplacements : le côté pratique du voyage, d’après des sources officielles et reconnues. Les règles changent : vérifiez-les avant de réserver.', ar: 'التأشيرات والمال والأمان والصحة والتنقل: الجانب العملي للرحلة من مصادر رسمية ومعروفة. القواعد تتغير، فتحقق منها قبل الحجز.' },
  sources: { en: 'Sources', fr: 'Sources', ar: 'المصادر' },
  source: { en: 'Source', fr: 'Source', ar: 'المصدر' },
  eventsTitle: { en: 'Festivals month by month', fr: 'Les festivals mois par mois', ar: 'المهرجانات شهرًا بشهر' },
  eventsText: { en: 'Concerts in Roman theatres, desert festivals, music of the medinas. Dates change from year to year, and some festivals skip a year: check the programme before you go.', fr: 'Concerts dans les théâtres romains, festivals du désert, musiques des médinas. Les dates changent d’une année à l’autre et certains festivals sautent une année : vérifiez le programme avant de partir.', ar: 'حفلات في المسارح الرومانية ومهرجانات الصحراء وموسيقى المدن العتيقة. تتغير المواعيد من سنة لأخرى وقد يغيب بعضها سنة: تحقق من البرنامج قبل السفر.' },
  noEvents: { en: 'No big festival in {month}. It is a fine month for the monuments, with fewer visitors.', fr: 'Pas de grand festival en {month}. C’est un bon mois pour les monuments, avec moins de visiteurs.', ar: 'لا مهرجان كبير في {month}. إنه شهر جيد لزيارة المعالم بزوار أقل.' },
  itinTitle: { en: 'Ready-made itineraries', fr: 'Itinéraires tout prêts', ar: 'مسارات جاهزة' },
  itinText: { en: 'Three trips day by day, with sensible distances. Show one on the map, then add or remove stops in My trip.', fr: 'Trois voyages jour par jour, avec des distances raisonnables. Affichez-en un sur la carte, puis ajoutez ou retirez des étapes dans Mon voyage.', ar: 'ثلاث رحلات يومًا بيوم بمسافات معقولة. اعرض واحدة على الخريطة ثم أضف أو احذف محطات في رحلتي.' },
  daysShort: { en: 'days', fr: 'jours', ar: 'أيام' },
  dayN: { en: 'Day {n}', fr: 'Jour {n}', ar: 'اليوم {n}' },
  showRoute: { en: 'Show on the map', fr: 'Voir sur la carte', ar: 'اعرض على الخريطة' },
  foodTitle: { en: 'What to eat', fr: 'Que manger', ar: 'ماذا تأكل' },
  foodText: { en: 'Tunisian food is generous, spicy and built on olive oil. Here are the dishes to look for, and where they are best.', fr: 'La cuisine tunisienne est généreuse, relevée et faite à l’huile d’olive. Voici les plats à chercher, et où ils sont les meilleurs.', ar: 'المطبخ التونسي سخي وحار وأساسه زيت الزيتون. هذه الأطباق التي تستحق البحث عنها وأين تجدها في أفضل حال.' },
  phrasesTitle: { en: 'A few words of Tunisian', fr: 'Quelques mots de tunisien', ar: 'كلمات من الدارجة التونسية' },
  phrasesText: { en: 'People speak Tunisian Arabic (Derja). French works almost everywhere, but a few words of Derja always bring a smile.', fr: 'On parle l’arabe tunisien (derja). Le français marche presque partout, mais quelques mots de derja font toujours sourire.', ar: 'يتحدث الناس الدارجة التونسية. الفرنسية مفهومة في كل مكان تقريبًا، لكن بضع كلمات بالدارجة تجلب الابتسامة دائمًا.' },
  converterTitle: { en: 'Dinar converter', fr: 'Convertisseur de dinars', ar: 'محول الدينار' },
  converterNote: { en: 'Indicative rate, updated daily; banks and exchange offices give their own rate.', fr: 'Taux indicatif, mis à jour chaque jour ; banques et bureaux de change appliquent leur propre taux.', ar: 'سعر تقريبي يُحدَّث يوميًا؛ للبنوك ومكاتب الصرف أسعارها الخاصة.' },
  converterOff: { en: 'Rates unavailable offline', fr: 'Taux indisponibles hors ligne', ar: 'الأسعار غير متاحة دون اتصال' },
  ratesBy: { en: 'Rates by Exchange Rate API', fr: 'Taux par Exchange Rate API', ar: 'الأسعار من Exchange Rate API' },
  amount: { en: 'Amount', fr: 'Montant', ar: 'المبلغ' },
  currency: { en: 'Currency', fr: 'Devise', ar: 'العملة' },
  visiting: { en: 'Visiting', fr: 'Visite', ar: 'الزيارة' },
  hoursL: { en: 'Hours', fr: 'Horaires', ar: 'المواعيد' },
  ticketL: { en: 'Ticket', fr: 'Billet', ar: 'التذكرة' },
  closedL: { en: 'Closed', fr: 'Fermé', ar: 'مغلق' },
  checkedIn: { en: 'Checked in {y}. Hours change in Ramadan and prices go up in January 2027: check before you go.', fr: 'Vérifié en {y}. Les horaires changent pendant le ramadan et les prix augmentent en janvier 2027 : vérifiez avant de partir.', ar: 'تم التحقق في {y}. تتغير المواعيد في رمضان وترتفع الأسعار في جانفي 2027: تحقق قبل الذهاب.' },
  festivalsNear: { en: 'Festivals nearby', fr: 'Festivals à proximité', ar: 'مهرجانات قريبة' },
  navExplore: { en: 'Explore', fr: 'Explorer', ar: 'استكشف' },
  navPlan: { en: 'Plan my trip', fr: 'Préparer mon voyage', ar: 'خطط لرحلتي' },
  navFoodShort: { en: 'Food', fr: 'Cuisine', ar: 'الأكل' },
  tabMap: { en: 'Map', fr: 'Carte', ar: 'الخريطة' },
  tabTrip: { en: 'Trip', fr: 'Voyage', ar: 'الرحلة' },
  tabGuide: { en: 'Guide', fr: 'Guide', ar: 'الدليل' },
  tabEvents: { en: 'Events', fr: 'Agenda', ar: 'المهرجانات' },
  tabFood: { en: 'Food', fr: 'Cuisine', ar: 'الأكل' },
  mapLayers: { en: 'Map layers', fr: 'Couches de la carte', ar: 'طبقات الخريطة' },
  expand: { en: 'Open or lower the card', fr: 'Ouvrir ou baisser la fiche', ar: 'افتح البطاقة أو اخفضها' },
  tabOverview: { en: 'Overview', fr: 'Aperçu', ar: 'نظرة عامة' },
  tabVisit: { en: 'Visit', fr: 'Visite', ar: 'الزيارة' },
  tabGetThere: { en: 'Getting there', fr: 'Y aller', ar: 'الوصول' },
  noVisitInfo: { en: 'We have no checked opening hours or prices for this place yet.', fr: 'Nous n’avons pas encore d’horaires ni de prix vérifiés pour ce lieu.', ar: 'لا تتوفر لدينا بعد مواعيد أو أسعار موثقة لهذا المكان.' },
  teaserEvents: { en: 'What’s on in {month}', fr: 'Les sorties de {month}', ar: 'مهرجانات {month}' },
  planTitle: { en: 'Plan your journey', fr: 'Préparez votre voyage', ar: 'خطط لرحلتك' },
  planText: { en: 'Pick a ready-made itinerary or build your own from the map, then set your arrival date: every night gets its own hotel search.', fr: 'Choisissez un itinéraire tout prêt ou composez le vôtre depuis la carte, puis indiquez votre date d’arrivée : chaque nuit a sa recherche d’hôtel.', ar: 'اختر مسارًا جاهزًا أو كوّن مسارك من الخريطة، ثم حدد تاريخ وصولك: لكل ليلة بحث فنادق خاص بها.' },
  readyMade: { en: 'Ready-made itineraries', fr: 'Itinéraires tout prêts', ar: 'مسارات جاهزة' },
  themedJourneys: { en: 'Themed journeys', fr: 'Circuits à thème', ar: 'رحلات حسب الموضوع' },
  stopN: { en: 'Stop {n}', fr: 'Étape {n}', ar: 'المحطة {n}' },
  nightsN: { en: '{n} nights', fr: '{n} nuits', ar: '{n} ليالٍ' },
  hotelsNight: { en: 'Hotels in {town} for this night', fr: 'Hôtels à {town} pour cette nuit', ar: 'فنادق في {town} لهذه الليلة' },
  tripEmptyPlan: { en: 'Your trip is empty. Open a place on the map and choose “Add to my trip”.', fr: 'Votre voyage est vide. Ouvrez un lieu sur la carte et choisissez « Ajouter à mon voyage ».', ar: 'رحلتك فارغة. افتح مكانًا على الخريطة واختر «أضف إلى رحلتي».' },
  statDays: { en: 'Days', fr: 'Jours', ar: 'الأيام' },
  statStops: { en: 'Stops', fr: 'Étapes', ar: 'المحطات' },
  statDistance: { en: 'Distance', fr: 'Distance', ar: 'المسافة' },
  statDriving: { en: 'Driving', fr: 'Route', ar: 'القيادة' },
  arrivalHint: { en: 'Pick your arrival date to search hotels for the right nights.', fr: 'Choisissez votre date d’arrivée pour chercher des hôtels aux bonnes dates.', ar: 'اختر تاريخ وصولك للبحث عن فنادق في الليالي المناسبة.' },
  makeMine: { en: 'Make it my trip', fr: 'En faire mon voyage', ar: 'اجعلها رحلتي' },
  fAll: { en: 'All', fr: 'Tout', ar: 'الكل' },
  fStreet: { en: 'Street food', fr: 'Sur le pouce', ar: 'أكل الشارع' },
  fMain: { en: 'Main dishes', fr: 'Plats', ar: 'أطباق رئيسية' },
  fSweet: { en: 'Sweets', fr: 'Douceurs', ar: 'حلويات' },
  fProducts: { en: 'Drinks and products', fr: 'Boissons et produits', ar: 'مشروبات ومنتجات' },
  installApp: { en: 'Install the app (works offline)', fr: 'Installer l’appli (fonctionne hors ligne)', ar: 'ثبّت التطبيق (يعمل دون اتصال)' },
  share: { en: 'Share', fr: 'Partager', ar: 'مشاركة' },
  toursHere: { en: 'Tours and activities', fr: 'Visites et activités', ar: 'جولات وأنشطة' },
  arrival: { en: 'Arrival', fr: 'Arrivée', ar: 'الوصول' },
  nightsPerStop: { en: 'Nights per stop', fr: 'Nuits par étape', ar: 'ليالٍ في كل محطة' },
  tripDatesNote: { en: 'With an arrival date, the hotel links search your dates at each stop.', fr: 'Avec une date d’arrivée, les liens d’hôtels cherchent vos dates à chaque étape.', ar: 'مع تاريخ الوصول، تبحث روابط الفنادق عن تواريخك في كل محطة.' },
  airportIntl: { en: 'International airport', fr: 'Aéroport international', ar: 'مطار دولي' },
  airportDom: { en: 'Airport', fr: 'Aéroport', ar: 'مطار' },
  transportNote: { en: 'Lines are drawn schematically. Check timetables before you travel: some services are limited. Shared taxis (louages) link every town.', fr: 'Les lignes sont schématiques. Vérifiez les horaires avant de partir : certains services sont limités. Les louages (taxis collectifs) relient toutes les villes.', ar: 'الخطوط مرسومة بشكل تخطيطي. تحقّق من المواعيد قبل السفر فبعض الخدمات محدودة. وتربط سيارات اللواج كل المدن.' },
  railway: { en: 'Railway', fr: 'Chemin de fer', ar: 'سكّة حديد' },
  motorway: { en: 'Motorway', fr: 'Autoroute', ar: 'طريق سيارة' },
  ferry: { en: 'Ferry', fr: 'Ferry', ar: 'عبّارة' },
  wildlifeTag: { en: 'Wildlife', fr: 'Faune', ar: 'حياة برّية' },
  saltLake: { en: 'Salt lake', fr: 'Lac salé', ar: 'بحيرة ملحية' },
  placesTitle: { en: 'Places to visit', fr: 'Lieux à visiter', ar: 'أماكن للزيارة' },
  placesText: {
    en: 'Twelve monuments you can walk through in 3D, and beaches, oases, parks and old towns to see for real. Use the filters to narrow the list.',
    fr: 'Douze monuments à parcourir en 3D, et des plages, des oasis, des parcs et de vieilles villes à voir en vrai. Utilisez les filtres pour réduire la liste.',
    ar: 'اثنا عشر معلمًا تتجوّل فيها بالأبعاد الثلاثة، وشواطئ وواحات وحدائق ومدن عتيقة تراها على أرض الواقع. استعمل المرشّحات لتضييق القائمة.',
  },
  nPlaces: { en: '{n} places', fr: '{n} lieux', ar: '{n} مكانًا' },
  independent: { en: 'An independent guide, not an official tourism site. Map: NASA Blue Marble, OpenStreetMap, Natural Earth.', fr: 'Un guide indépendant, pas un site officiel de tourisme. Carte : NASA Blue Marble, OpenStreetMap, Natural Earth.', ar: 'دليل مستقلّ وليس موقعًا سياحيًا رسميًا. الخريطة: NASA Blue Marble وOpenStreetMap وNatural Earth.' },
  seaLabel: { en: 'Mediterranean Sea', fr: 'Mer Méditerranée', ar: 'البحر الأبيض المتوسط' },
  algeria: { en: 'Algeria', fr: 'Algérie', ar: 'الجزائر' },
  libya: { en: 'Libya', fr: 'Libye', ar: 'ليبيا' },
  sicily: { en: 'Sicily', fr: 'Sicile', ar: 'صقلية' },
  exploreMap: { en: 'Explore the map', fr: 'Explorer la carte', ar: 'استكشف الخريطة' },
  mapTitle: { en: 'Tunisia, place by place', fr: 'La Tunisie, lieu par lieu', ar: 'تونس مكانًا مكانًا' },
  mapText: {
    en: 'Pick a monument. El Jem, Sidi Bou Said, Carthage, Dougga, Kairouan, Sousse, Sbeitla, Djerba, Matmata, Ksar Ouled Soltane and Bulla Regia are open now; more are being built.',
    fr: 'Choisissez un monument. Les douze sont ouverts : El Jem, Sidi Bou Saïd, Carthage, la médina de Tunis, Dougga, Kairouan, Sousse, Sbeïtla, Djerba, Matmata, Ksar Ouled Soltane et Bulla Regia.',
    ar: 'اختر معلمًا. مدرج الجم وسيدي بوسعيد وقرطاج ودقة والقيروان وسوسة وسبيطلة وجربة ومطماطة وقصر أولاد سلطان وبلاريجيا متاحة الآن، والبقية قيد الإنشاء.',
  },
  open: { en: 'Open in 3D', fr: 'Ouvrir en 3D', ar: 'افتح بالأبعاد الثلاثة' },
  soon: { en: 'Coming soon', fr: 'Bientôt', ar: 'قريبًا' },
  credits: { en: 'Credits', fr: 'Crédits', ar: 'المصادر' },
  back: { en: 'Map', fr: 'Carte', ar: 'الخريطة' },
  startWalk: { en: 'Start walking', fr: 'Commencer la visite', ar: 'ابدأ الجولة' },

  controlsDesktop: {
    en: 'Click to look around · WASD / arrows to walk · Shift to run · + / − speed · Esc to release the mouse',
    fr: 'Cliquez pour regarder · ZQSD / flèches pour marcher · Maj pour courir · + / − vitesse · Échap pour libérer la souris',
    ar: 'انقر للنظر حولك · WASD أو الأسهم للمشي · Shift للجري · + / − السرعة · Esc لتحرير الفأرة',
  },
  controlsTouch: {
    en: 'Left thumb: walk · Right thumb: look around',
    fr: 'Pouce gauche : marcher · Pouce droit : regarder',
    ar: 'الإبهام الأيسر للمشي · الإبهام الأيمن للنظر',
  },
  time: { en: 'Time of day', fr: 'Heure', ar: 'الوقت' },
  quality: { en: 'Quality', fr: 'Qualité', ar: 'الجودة' },
  low: { en: 'Low', fr: 'Basse', ar: 'منخفضة' },
  medium: { en: 'Medium', fr: 'Moyenne', ar: 'متوسطة' },
  high: { en: 'High', fr: 'Haute', ar: 'عالية' },
  sound: { en: 'Sound', fr: 'Son', ar: 'الصوت' },
  on: { en: 'on', fr: 'activé', ar: 'مفعّل' },
  speed: { en: 'Speed', fr: 'Vitesse', ar: 'السرعة' },
  ground: { en: 'Ground', fr: 'Sol', ar: 'الأرضية' },
  groundModel: { en: 'Model', fr: 'Modèle', ar: 'النموذج' },
  groundSatellite: { en: 'Satellite', fr: 'Satellite', ar: 'صور الأقمار الصناعية' },
  speedSlow: { en: 'Slow', fr: 'Lente', ar: 'بطيئة' },
  speedNormal: { en: 'Normal', fr: 'Normale', ar: 'عادية' },
  speedFast: { en: 'Fast', fr: 'Rapide', ar: 'سريعة' },
  speedVeryFast: { en: 'Very fast', fr: 'Très rapide', ar: 'سريعة جدًا' },
  off: { en: 'off', fr: 'coupé', ar: 'متوقف' },
  places: { en: 'Places to see', fr: 'À voir', ar: 'أماكن للمشاهدة' },
  goThere: { en: 'Go there', fr: 'Y aller', ar: 'اذهب إلى هناك' },
  close: { en: 'Close', fr: 'Fermer', ar: 'إغلاق' },
  planVisit: { en: 'Plan your visit', fr: 'Préparer votre visite', ar: 'خطّط لزيارتك' },
  findTours: { en: 'Find tours', fr: 'Trouver une excursion', ar: 'ابحث عن جولات' },
  findHotels: { en: 'Find hotels nearby', fr: 'Hôtels à proximité', ar: 'فنادق قريبة' },
  photo: { en: 'Photo', fr: 'Photo', ar: 'صورة' },
  photoMode: { en: 'Photo mode', fr: 'Mode photo', ar: 'وضع التصوير' },
  savePhoto: { en: 'Save photo', fr: 'Enregistrer', ar: 'احفظ الصورة' },
  legend: { en: 'Legend', fr: 'Légende', ar: 'أسطورة' },

  creditsTitle: { en: 'Credits and licences', fr: 'Crédits et licences', ar: 'المصادر والتراخيص' },
  photosBy: { en: 'Photos', fr: 'Photos', ar: 'الصور' },
  texturesBy: { en: 'Textures', fr: 'Textures', ar: 'الخامات' },
  mapData: { en: 'Map data', fr: 'Données cartographiques', ar: 'بيانات الخريطة' },
  webglError: {
    en: 'Your browser could not start 3D graphics (WebGL). Try another browser or enable hardware acceleration.',
    fr: 'Votre navigateur n’a pas pu démarrer la 3D (WebGL). Essayez un autre navigateur ou activez l’accélération matérielle.',
    ar: 'تعذّر على متصفحك تشغيل الرسوميات ثلاثية الأبعاد (WebGL). جرّب متصفحًا آخر أو فعّل تسريع العتاد.',
  },
} satisfies Record<string, T3>;

export type UIKey = keyof typeof UI;
/** All interface texts (for the build script that writes the place pages). */
export const UI_TEXTS: Record<string, T3> = UI;

/** A place page (written by scripts/make-pages.mjs) sets its language; otherwise the visitor's choice or browser. */
const pageLang = (globalThis as { __LANG__?: Lang }).__LANG__;
let current: Lang = pageLang ?? detect();
const listeners = new Set<() => void>();

function detect(): Lang {
  try {
    const saved = localStorage.getItem('lang') as Lang | null;
    if (saved && LANGS.some((x) => x.id === saved)) return saved;
  } catch { /* storage blocked */ }
  // the visitor's browser languages, in order of preference
  for (const n of navigator.languages ?? [navigator.language]) {
    const c = (n || '').slice(0, 2).toLowerCase() as Lang;
    if (LANGS.some((x) => x.id === c)) return c;
  }
  return 'en';
}

export function lang(): Lang { return current; }

/** Load the translations of the starting language (call once before the first page is drawn). */
export async function initLang() { await loadDict(current); applyDir(); }

export async function setLang(l: Lang) {
  await loadDict(l);
  current = l;
  try { localStorage.setItem('lang', l); } catch { /* ignore */ }
  applyDir();
  listeners.forEach((fn) => fn());
}

export function applyDir() {
  document.documentElement.lang = current;
  document.documentElement.dir = current === 'ar' ? 'rtl' : 'ltr';
}

export function onLangChange(fn: () => void) { listeners.add(fn); return () => listeners.delete(fn); }

export function tr(v: T1): string { return (isBase(current) ? v[current] : undefined) ?? dict?.[v.en] ?? v.en; }
export function t(key: UIKey): string { return tr(UI[key]); }

export function langSelect(): HTMLSelectElement {
  const sel = document.createElement('select');
  sel.className = 'lang-select';
  sel.setAttribute('aria-label', 'Language');
  for (const l of LANGS) {
    const o = document.createElement('option');
    o.value = l.id; o.textContent = l.label; o.selected = l.id === current;
    sel.append(o);
  }
  sel.addEventListener('change', () => { void setLang(sel.value as Lang); });
  return sel;
}
