/**
 * The traveller's guide on the home page: festivals by month, itineraries, food, phrases, and opening hours and
 * tickets for the monuments. Written in English (T1); the other languages come from src/locales/<lang>.json.
 * Every fact was checked against the source given with it (research notes in references/guide/*.json).
 */
import type { T1 } from '../i18n';

// ---------- festivals and events ----------
export interface Event { id: string; name: T1; town: string; lat: number; lon: number; months: number[]; text: T1; source: string }
/** months are 1–12. Festivals that follow the Islamic or Hebrew calendar move each year; their text says so. */
export const EVENTS: Event[] = [
  { id: 'medina-festival', name: { en: 'Medina Festival of Tunis' }, town: 'Tunis', lat: 36.798, lon: 10.171, months: [2, 3],
    text: { en: 'Evening concerts of traditional and tarab music, theatre and workshops in the old town of Tunis during Ramadan; the 42nd edition was in 2026. It follows Ramadan, so it comes about eleven days earlier each year.' },
    source: 'https://www.lapresse.tn/2026/02/20/festival-de-la-medina-demain-coup-denvoi-de-la-42%E1%B5%89-edition/' },
  { id: 'ksour-festival', name: { en: 'Festival of the Saharan Ksour' }, town: 'Tataouine', lat: 32.93, lon: 10.45, months: [3],
    text: { en: 'A spring festival of southern Berber heritage, founded in 1979: folk shows, horsemanship and a crafts fair around the fortified granaries. It has been irregular: it paused after 2022, and a revival was announced for March 2026.' },
    source: 'https://www.leconomistemaghrebin.com/2022/03/30/festival-international-des-ksours-sahariens-de-tataouine-2022-une-edition-ratee/' },
  { id: 'ghriba', name: { en: 'Ghriba pilgrimage' }, town: 'Djerba', lat: 33.814, lon: 10.858, months: [4, 5],
    text: { en: 'The yearly Jewish pilgrimage to the El Ghriba synagogue on Djerba, around Lag BaOmer, with prayers and processions. Its date follows the Hebrew calendar; it has been smaller since 2023 and is held under tight security.' },
    source: 'https://www.ksat.com/news/world/2026/05/06/foreign-visitors-return-to-jewish-pilgrimage-in-tunisia-under-tight-security/' },
  { id: 'falconry', name: { en: 'Falconry Festival of El Haouaria' }, town: 'El Haouaria', lat: 37.05, lon: 11.01, months: [6],
    text: { en: 'Three days on Cap Bon where local falconers show and compete with trained sparrowhawks and falcons. Held each June; 2025 was the 56th edition.' },
    source: 'https://www.webmanagercenter.com/2025/06/24/548005/festival-de-lepervier-2025-a-el-haouaria-lart-de-laffaitage-en-route-vers-lunesco/' },
  { id: 'tabarka-jazz', name: { en: 'Tabarka Jazz Festival' }, town: 'Tabarka', lat: 36.955, lon: 8.758, months: [7],
    text: { en: 'Jazz, world and contemporary music on the north coast since 1973, with free street jazz in the evenings. It came back in July 2026 after a six-year break, so it is not held every year.' },
    source: 'https://www.africanews.com/2026/07/09/fans-and-locals-welcome-return-of-tunisias-tabarka-jazz-festival/' },
  { id: 'dougga-festival', name: { en: 'Dougga Festival' }, town: 'Dougga', lat: 36.423, lon: 9.22, months: [7],
    text: { en: 'Summer concerts in the Roman theatre of Dougga, mostly Tunisian artists. Held most summers; the 50th edition ran over ten evenings in July 2026.' },
    source: 'https://www.lapresse.tn/2026/06/27/50e-festival-international-de-dougga-une-edition-anniversaire-recentree-sur-la-scene-tunisienne/' },
  { id: 'testour-malouf', name: { en: 'Malouf Festival of Testour' }, town: 'Testour', lat: 36.55, lon: 9.44, months: [7],
    text: { en: 'A week of malouf, the Arab-Andalusian music of Tunisia, in the Andalusian town of Testour, since 1967. Usually in July, but the 2026 edition was cancelled.' },
    source: 'https://www.webmanagercenter.com/2024/07/08/527358/festival-de-testour-2024-musique-arabo-andalouse-et-patrimoine-a-lhonneur-du-15-au-21-juillet/' },
  { id: 'aoussou', name: { en: 'Aoussou Carnival' }, town: 'Sousse', lat: 35.83, lon: 10.64, months: [7],
    text: { en: 'Sousse’s summer carnival: floats, brass bands and folk troupes from Tunisia and abroad, traditionally on 24 July near Boujaafar beach.' },
    source: 'https://en.wikipedia.org/wiki/Carnival_of_Awussu' },
  { id: 'carthage-festival', name: { en: 'International Festival of Carthage' }, town: 'Carthage', lat: 36.857, lon: 10.326, months: [7, 8],
    text: { en: 'Tunisia’s best-known summer festival, every July and August since 1964 in the Roman theatre of Carthage: concerts by Arab and international artists, some theatre and dance.' },
    source: 'https://en.wikipedia.org/wiki/International_Festival_of_Carthage' },
  { id: 'hammamet-festival', name: { en: 'Hammamet International Festival' }, town: 'Hammamet', lat: 36.394, lon: 10.587, months: [7, 8],
    text: { en: 'Music and stage shows since 1964 in an open-air amphitheatre of 1,000 seats above the Gulf of Hammamet, through July and August.' },
    source: 'https://en.wikipedia.org/wiki/Hammamet_International_Festival' },
  { id: 'el-jem-symphonic', name: { en: 'El Jem Symphonic Music Festival' }, town: 'El Jem', lat: 35.296, lon: 10.707, months: [7, 8],
    text: { en: 'Orchestras from Tunisia and abroad play inside the Roman amphitheatre of El Jem, every summer since the mid-1980s.' },
    source: 'https://discovertunisia.com/en/node/2928' },
  { id: 'sfax-festival', name: { en: 'Sfax International Festival' }, town: 'Sfax', lat: 34.74, lon: 10.76, months: [7, 8],
    text: { en: 'Concerts, shows and films in the open-air theatre of Sfax, from late July to mid-August; 2026 was the 46th edition.' },
    source: 'https://fr.allafrica.com/stories/202607140550.html' },
  { id: 'kerkennah-festival', name: { en: 'Kerkennah Festival' }, town: 'Kerkennah', lat: 34.71, lon: 11.2, months: [7, 8],
    text: { en: 'A popular summer festival on the Kerkennah islands: music, comedy, rap and shows for children. The 30th edition was in summer 2025.' },
    source: 'https://www.tunisienumerique.com/kerkennah-fete-ses-30-ans-de-festival-avec-une-programmation-qui-fait-vibrer-lile/' },
  { id: 'kairouan-mouled', name: { en: 'Mouled in Kairouan' }, town: 'Kairouan', lat: 35.678, lon: 10.096, months: [8],
    text: { en: 'Hundreds of thousands come to Kairouan for the Prophet’s birthday, with free shows and light displays over about a week. It follows the Islamic calendar: late August in 2026, then earlier each year.' },
    source: 'https://discovertunisia.com/en/node/60923' },
  { id: 'carthage-theatre', name: { en: 'Carthage Theatre Days' }, town: 'Tunis', lat: 36.8, lon: 10.18, months: [11, 12],
    text: { en: 'A theatre festival since 1983, with more than 80 shows from Tunisia, the Arab world and Africa, mostly at the City of Culture in Tunis. Recent editions were in late November.' },
    source: 'https://www.webmanagercenter.com/2025/11/23/556455/journees-theatrales-de-carthage-une-26e-edition-lancee-sous-le-signe-de-la-conscience/' },
  { id: 'carthage-film', name: { en: 'Carthage Film Festival' }, town: 'Tunis', lat: 36.8, lon: 10.18, months: [11, 12],
    text: { en: 'African and Arab cinema in Tunis since 1966, with the Tanit d’or award. Traditionally October–November; recent editions were in December.' },
    source: 'https://en.wikipedia.org/wiki/Carthage_Film_Festival' },
  { id: 'douz-sahara', name: { en: 'International Festival of the Sahara' }, town: 'Douz', lat: 33.457, lon: 9.022, months: [12],
    text: { en: 'Four days of desert life at the end of December in Douz: camel races, horsemanship, a Bedouin wedding, poetry and music, at the edge of the dunes.' },
    source: 'https://en.wikipedia.org/wiki/International_Festival_of_the_Sahara' },
  { id: 'tozeur-oases', name: { en: 'Festival of the Oases' }, town: 'Tozeur', lat: 33.92, lon: 8.13, months: [12],
    text: { en: 'Late December in Tozeur, first held in 1938: the oases and the date harvest, with concerts, horsemanship, street arts and date markets.' },
    source: 'https://www.discovertunisia.com/en/evenements/43rd-edition-international-festival-oases-tozeur' },
];

// ---------- itineraries ----------
export interface Itinerary { id: string; days: number; name: T1; text: T1; plan: { stops: string[]; text: T1 }[] }
export const ITINERARIES: Itinerary[] = [
  { id: 'it-3', days: 3, name: { en: '3 days: Tunis and Roman Africa' }, text: { en: 'A long weekend from Tunis, no hotel change needed.' }, plan: [
    { stops: ['tunis-medina', 'bardo'], text: { en: 'The medina of Tunis in the morning, the mosaics of the Bardo in the afternoon.' } },
    { stops: ['carthage', 'sidi-bou-said'], text: { en: 'The ruins of Carthage by the sea, then sunset in the blue and white village of Sidi Bou Said.' } },
    { stops: ['dougga'], text: { en: 'A day trip to Dougga, the best-kept Roman town in Africa, about two hours from Tunis.' } },
  ] },
  { id: 'it-7', days: 7, name: { en: '7 days: monuments and beaches' }, text: { en: 'The great monuments of the north and centre, with time on the beach.' }, plan: [
    { stops: ['tunis-medina', 'bardo'], text: { en: 'The medina of Tunis and the Bardo museum.' } },
    { stops: ['carthage', 'sidi-bou-said'], text: { en: 'Carthage and Sidi Bou Said.' } },
    { stops: ['kairouan'], text: { en: 'Drive to Kairouan: the Great Mosque, the Aghlabid basins and the makroudh bakeries.' } },
    { stops: ['el-jem', 'mahdia'], text: { en: 'The amphitheatre of El Jem in the morning, then the sea at Mahdia.' } },
    { stops: ['mahdia-beach'], text: { en: 'A beach day at Mahdia, with clear water and the old town on its cape.' } },
    { stops: ['monastir', 'sousse'], text: { en: 'The ribats of Monastir and Sousse, and the medina of Sousse.' } },
    { stops: ['hammamet'], text: { en: 'Hammamet: the medina by the beach, about an hour from Tunis airport.' } },
  ] },
  { id: 'it-10', days: 10, name: { en: '10 days: from Carthage to the Sahara' }, text: { en: 'The whole country, north to south. Fly home from Djerba to save the drive back.' }, plan: [
    { stops: ['tunis-medina', 'bardo'], text: { en: 'The medina of Tunis and the Bardo museum.' } },
    { stops: ['carthage', 'sidi-bou-said'], text: { en: 'Carthage and Sidi Bou Said.' } },
    { stops: ['kairouan'], text: { en: 'Kairouan, the holy city.' } },
    { stops: ['tozeur'], text: { en: 'The long drive to the oasis of Tozeur, its palm groves and its old quarter of patterned brick.' } },
    { stops: ['chebika', 'ong-jemel'], text: { en: 'The mountain oasis of Chebika, then sunset at the rocks of Ong Jemel.' } },
    { stops: ['chott-el-djerid', 'douz'], text: { en: 'Across the salt lake of Chott el Djerid to Douz, the gate of the Sahara.' } },
    { stops: ['ksar-ghilane'], text: { en: 'A night at Ksar Ghilane, among the dunes, with a warm spring to bathe in.' } },
    { stops: ['matmata'], text: { en: 'The cave houses of Matmata.' } },
    { stops: ['chenini', 'ksar-ouled-soltane'], text: { en: 'The Berber village of Chenini and the granaries of Ksar Ouled Soltane, then on to Djerba.' } },
    { stops: ['djerba', 'djerba-beach'], text: { en: 'Djerba: Houmt Souk, the Ghriba synagogue and a last swim.' } },
  ] },
];

// ---------- food ----------
export type DishKind = 'street' | 'main' | 'sweet' | 'product';
/** A dish: its kind (for the filter), where it is best, and the place on the map to show (if one). Photo: photos/food/<id>.jpg */
export interface Dish { id: string; name: string; ar: string; kind: DishKind; place?: string; where?: T1; text: T1; source: string }
export const DISHES: Dish[] = [
  { id: 'couscous', name: 'Couscous', ar: 'كسكسي', kind: 'main', text: { en: 'Called kosksi at home: semolina steamed over a stew, served with vegetables and meat or fish that change with the region and the season. Its know-how is on the UNESCO list of intangible heritage since 2020, shared with Algeria, Mauritania and Morocco.' }, source: 'https://ich.unesco.org/en/RL/couscous-mediterranean-01602' },
  { id: 'brik', name: 'Brik', ar: 'بريك', kind: 'street', text: { en: 'A paper-thin sheet of malsouka pastry folded around a filling and fried until crisp. The classic hides a whole egg with tuna, onion, parsley and harissa.' }, source: 'https://en.wikipedia.org/wiki/Brik' },
  { id: 'lablabi', name: 'Lablabi', ar: 'لبلابي', kind: 'street', text: { en: 'Chickpeas in a garlic and cumin broth over pieces of bread, topped with harissa, olive oil, egg, capers or tuna. Once a winter breakfast, now eaten at any hour.' }, source: 'https://en.wikipedia.org/wiki/Lablabi' },
  { id: 'ojja', name: 'Ojja', ar: 'عجة', kind: 'main', text: { en: 'Eggs cooked in a spicy sauce of tomatoes, green chillies and harissa, often with merguez sausage. Mop it up with bread.' }, source: 'https://en.wikipedia.org/wiki/Tunisian_cuisine' },
  { id: 'kafteji', name: 'Kafteji', ar: 'كفتاجي', kind: 'street', place: 'kairouan', where: { en: 'Kairouan and Tunis, each with its own recipe' }, text: { en: 'Fried peppers and tomatoes chopped together with eggs, eaten by dipping bread. Kairouan’s is very spicy; the Tunis one adds pumpkin.' }, source: 'https://lepetitjournal.com/tunis/a-voir-a-faire/gastronomie-lincontournable-kafteji-53945' },
  { id: 'harissa', name: 'Harissa', ar: 'هريسة', kind: 'product', where: { en: 'Cap Bon, above all Nabeul' }, text: { en: 'Tunisia’s chilli paste: sun-dried peppers ground with salt, garlic and coriander. It seasons everyday food and is on the UNESCO list of intangible heritage since 2022.' }, source: 'https://ich.unesco.org/en/RL/harissa-knowledge-skills-and-culinary-and-social-practices-01710' },
  { id: 'mloukhia', name: 'Mloukhia', ar: 'ملوخية', kind: 'main', text: { en: 'A dark green sauce of powdered mulukhiyah leaves slowly cooked in olive oil with beef or lamb, eaten with bread.' }, source: 'https://en.wikipedia.org/wiki/Mulukhiyah' },
  { id: 'makroudh', name: 'Makroudh', ar: 'مقروض', kind: 'sweet', place: 'kairouan', where: { en: 'Kairouan' }, text: { en: 'Small diamonds of semolina filled with dates. They come from Kairouan, which held the first national makroudh festival in 2008.' }, source: 'https://carthagemagazine.com/tunisian-makroudh/' },
  { id: 'bambalouni', name: 'Bambalouni', ar: 'بمبالوني', kind: 'sweet', place: 'sidi-bou-said', where: { en: 'Sidi Bou Said' }, text: { en: 'A fried doughnut dusted with sugar or soaked in honey. Sidi Bou Said is famous for it.' }, source: 'https://en.wikipedia.org/wiki/Bambalouni' },
  { id: 'tea', name: 'Thé aux pignons', ar: 'شاي بالصنوبر', kind: 'product', text: { en: 'Sweet mint tea poured over pine nuts in the glass; almonds or peanuts sometimes take their place.' }, source: 'https://en.wikipedia.org/wiki/Tea_with_pine_nuts' },
  { id: 'fricasse', name: 'Fricassé', ar: 'فريكاسي', kind: 'street', text: { en: 'A small fried roll filled with tuna, egg, potato, olives, capers, preserved lemon and harissa: the classic street snack.' }, source: 'https://en.wikipedia.org/wiki/Fricasse' },
  { id: 'chakchouka', name: 'Chakchouka', ar: 'شكشوكة', kind: 'main', text: { en: 'Its name means “mixed”: a stew of tomatoes, peppers, onions and garlic, often with eggs.' }, source: 'https://en.wikipedia.org/wiki/Shakshouka' },
  { id: 'deglet-nour', name: 'Deglet Nour', ar: 'دقلة نور', kind: 'product', place: 'tozeur', where: { en: 'The oases of the Djerid and Nefzaoua' }, text: { en: 'Soft, honey-sweet dates, the “dates of light”, grown in the desert oases. They also fill the makroudh.' }, source: 'https://en.wikipedia.org/wiki/Deglet_Nour' },
  { id: 'olive-oil', name: 'Zitoun', ar: 'زيت زيتون', kind: 'product', where: { en: 'Sfax' }, text: { en: 'Olive oil is central to life around Sfax, which makes about 40% of Tunisia’s. The geographer al-Idrisi praised its olives in the 12th century.' }, source: 'https://en.wikipedia.org/wiki/Sfax' },
];

// ---------- phrases (Tunisian Arabic) ----------
export interface Phrase { tr: string; ar: string; en: T1 }
export const PHRASES: Phrase[] = [
  { tr: 'Aslema', ar: 'عالسلامة', en: { en: 'Hello' } },
  { tr: 'Sbah el khir', ar: 'صباح الخير', en: { en: 'Good morning' } },
  { tr: 'Msa el khir', ar: 'مسا الخير', en: { en: 'Good evening' } },
  { tr: 'Labes?', ar: 'لاباس؟', en: { en: 'How are you? / I’m fine' } },
  { tr: 'Yaishek', ar: 'يعيشك', en: { en: 'Thank you' } },
  { tr: 'Min fadhlek', ar: 'من فضلك', en: { en: 'Please' } },
  { tr: 'Ey', ar: 'إيه', en: { en: 'Yes' } },
  { tr: 'Le', ar: 'لا', en: { en: 'No' } },
  { tr: 'Le, yaishek', ar: 'لا، يعيشك', en: { en: 'No, thank you' } },
  { tr: 'Behi', ar: 'باهي', en: { en: 'OK, good' } },
  { tr: 'Samahni', ar: 'سامحني', en: { en: 'Excuse me, sorry' } },
  { tr: 'Mafhemtech', ar: 'ما فهمتش', en: { en: 'I don’t understand' } },
  { tr: 'Nheb…', ar: 'نحب…', en: { en: 'I would like…' } },
  { tr: 'Bqaddech?', ar: 'بقدّاش؟', en: { en: 'How much?' } },
  { tr: 'Ghali barcha', ar: 'غالي برشة', en: { en: 'Too expensive' } },
  { tr: 'Barcha', ar: 'برشة', en: { en: 'A lot, very' } },
  { tr: 'Win el…?', ar: 'وين الـ…؟', en: { en: 'Where is the…?' } },
  { tr: 'Bnin!', ar: 'بنين', en: { en: 'Delicious!' } },
  { tr: 'El hsab, yaishek', ar: 'الحساب يعيشك', en: { en: 'The bill, please' } },
  { tr: 'Beslema', ar: 'بالسلامة', en: { en: 'Goodbye' } },
];
export const PHRASE_SOURCES = ['https://en.wikivoyage.org/wiki/Tunisian_Arabic_phrasebook', 'https://carthagemagazine.com/tunisian-arabic-phrases/'];

// ---------- visiting: hours and tickets ----------
/** Prices are for foreign visitors; the state raised them on 1 April 2026 and again from January 2027. */
export interface Visit { hours?: T1; price?: T1; closed?: T1; note?: T1; year: number; source: string }
const D8: T1 = { en: '8 dinars (5 for residents)' };
const PRICES_2026 = 'https://www.tekiano.com/2026/04/01/musees-tunisiens-et-sites-historiques-nouveaux-tarifs-dentree-a-partir-du-01-avril-2026/';
const AMVPPC = 'https://www.patrimoinedetunisie.com.tn/';
export const VISITS: Record<string, Visit> = {
  'el-jem': { hours: { en: '7:30–18:30 in summer, 7:30–17:30 in winter' }, price: { en: '20 dinars, 30 from January 2027 (8 for residents)' }, note: { en: 'The ticket includes the El Jem museum.' }, year: 2026, source: PRICES_2026 },
  carthage: { hours: { en: '8:00–18:00 in summer, 8:30–17:00 in winter' }, price: { en: '20 dinars for all the sites, 30 from January 2027 (9 for residents)' }, note: { en: 'A ticket for Carthage and the Bardo together costs 45 dinars.' }, year: 2026, source: PRICES_2026 },
  'tunis-medina': { hours: { en: 'Zitouna mosque 8:00–14:00 (Friday until 12:00)' }, price: { en: 'Zitouna 5 dinars; Dar Ben Abdallah museum free' }, closed: { en: 'Dar Ben Abdallah: Mondays' }, note: { en: 'Visits to the Zitouna by non-Muslims have varied in recent years, and its prayer hall is closed to them: ask at the door.' }, year: 2026, source: 'https://managers.tn/2026/04/01/voici-les-nouveaux-tarifs-pour-les-musees-et-sites-historiques-en-tunisie/' },
  dougga: { hours: { en: '8:00–19:00 in summer, 8:30–17:30 in winter' }, price: D8, year: 2026, source: AMVPPC + 'sites/le-site-archeologique-de-dougga/apercu/' },
  'bulla-regia': { hours: { en: '8:00–19:00 in summer, 8:30–17:30 in winter' }, price: D8, year: 2026, source: AMVPPC + 'sites/site-archeologique-de-bulla-regia/' },
  kairouan: { hours: { en: 'Great Mosque 7:30–14:00 in summer, 8:00–14:00 in winter' }, price: { en: '20 dinars, a ticket for several monuments; 30 from January 2027' }, closed: { en: 'Friday from noon' }, year: 2026, source: PRICES_2026 },
  sousse: { hours: { en: 'Ribat 8:00–19:00 in summer, 8:00–17:30 in winter; museum 9:00–18:00 in summer, 9:00–17:00 in winter' }, price: { en: 'Museum 10 dinars; ribat 8–10 dinars' }, closed: { en: 'Museum: Mondays' }, year: 2026, source: AMVPPC + 'musees/musee-archeologique-de-sousse/apercu/' },
  sbeitla: { hours: { en: '8:00–19:00 in summer, 8:00–17:30 in winter' }, price: D8, closed: { en: 'Museum: Mondays' }, year: 2026, source: AMVPPC + 'sites/site-archeologique-de-sbeitla/' },
  djerba: { hours: { en: 'Heritage museum 9:00–17:00 in summer, 9:30–16:30 in winter' }, price: { en: 'Museum 8 dinars; El Ghriba free, donations welcome' }, closed: { en: 'Museum: Fridays' }, note: { en: 'El Ghriba may close for the Sabbath, holidays or security. Dress modestly.' }, year: 2026, source: AMVPPC + 'musees/musee-du-patrimoine-traditionnel-de-djerba/apercu/' },
  'ksar-ouled-soltane': { price: { en: 'A small fee, a little more with a camera' }, year: 2026, source: 'https://www.takeyourbackpack.com/backpacking-in-tunisia/visit-ksar-ouled-soltane/' },
  kerkouane: { hours: { en: '9:00–18:00 in summer, 9:00–16:00 in winter' }, price: D8, closed: { en: 'Mondays' }, year: 2026, source: AMVPPC + 'sites/kerkouane/' },
  monastir: { hours: { en: 'Ribat 8:00–19:00 in summer, 8:30–17:30 in winter' }, price: D8, year: 2024, source: AMVPPC + 'monuments/ribat-de-monastir/apercu/' },
  mahdia: { hours: { en: 'Museum 9:00–16:00 in summer, 9:30–16:00 in winter' }, price: D8, closed: { en: 'Mondays' }, note: { en: 'The visit ends on the terrace of the Skifa el Kahla gate.' }, year: 2024, source: AMVPPC + 'musees/musee-de-mahdia/apercu/' },
  zaghouan: { price: { en: 'Usually free' }, year: 2026, source: 'https://www.takeyourbackpack.com/backpacking-in-tunisia/visit-roman-water-temple/' },
  'thuburbo-majus': { hours: { en: '8:00–17:00 in summer, 8:30–17:30 in winter' }, price: D8, year: 2026, source: AMVPPC + 'sites/site-archeologique-de-thuburbo-maius/' },
  oudhna: { hours: { en: '9:00–17:00 all year' }, price: D8, year: 2024, source: AMVPPC + 'sites/site-archeologique-doudhna/' },
  makthar: { hours: { en: '8:00–17:00 all year' }, price: D8, closed: { en: 'Mondays' }, year: 2026, source: AMVPPC + 'sites/makthar-mactaris/' },
  bardo: { hours: { en: '9:00–17:00 in summer, 9:30–16:30 in winter' }, price: { en: '30 dinars, 45 from January 2027 (8 for residents)' }, closed: { en: 'Mondays' }, note: { en: 'A ticket for the Bardo and Carthage together costs 45 dinars.' }, year: 2026, source: PRICES_2026 },
  chemtou: { hours: { en: '9:30–15:00 all year' }, price: D8, year: 2024, source: AMVPPC + 'sites/le-site-archeologique-de-chimtou/' },
};

// ---------- before you go ----------
export interface Section { id: string; icon: string; title: T1; points: T1[]; sources: string[] }
export const PRACTICAL: Section[] = [
  { id: 'visa', icon: '🛂', title: { en: 'Visas and passports' }, points: [
    { en: 'No visa for up to 90 days for most of the EU, the UK, the US, Canada, Switzerland, Norway, Russia, China, the Gulf states, Algeria, Libya and Morocco.' },
    { en: 'Ukrainians normally need a visa, except on an organised tour with a hotel voucher.' },
    { en: 'Bring your passport: identity cards are not accepted. The UK asks for a passport valid for the whole stay; Canada advises six months beyond departure.' },
    { en: 'Officers may ask for a return ticket and where you are staying. There is no e-visa: a visa, when needed, comes from a Tunisian embassy.' },
    { en: 'Rules change and depend on your nationality: check with the Tunisian embassy before booking.' },
  ],
    sources: ['https://en.wikipedia.org/wiki/Visa_policy_of_Tunisia', 'https://www.gov.uk/foreign-travel-advice/tunisia/entry-requirements', 'https://travel.gc.ca/destinations/tunisia'] },
  { id: 'money', icon: '💶', title: { en: 'Money' }, points: [
    { en: 'The dinar (TND) is a closed currency: you cannot bring dinars in or take them out. Change money after you land.' },
    { en: 'Change at banks, licensed exchange offices, hotels or post offices, with your passport. Keep the receipts: you need them to change dinars back before you leave.' },
    { en: 'Cash machines are common in towns and take Visa and Mastercard. Many hotels and restaurants take cards; taxis, louages, markets and small places want cash.' },
    { en: 'Hotels charge a small tourist tax per person and night, for up to ten nights.' },
  ],
    sources: ['https://discovertunisia.com/en/node/158', 'https://www.gov.uk/foreign-travel-advice/tunisia/entry-requirements', 'https://en.wikivoyage.org/wiki/Tunisia'] },
  { id: 'safety', icon: '🛡️', title: { en: 'Safety' }, points: [
    { en: 'Most visits are trouble-free, but the UK, US and Canadian governments ask travellers to stay alert to the risk of terrorism, at tourist and religious sites and in crowds.' },
    { en: 'Theft is the most common crime: keep valuables out of sight. Avoid demonstrations, and carry a copy of your passport.' },
    { en: 'Drones need a permit. Follow the flags on the beach.' },
  ],
    sources: ['https://www.gov.uk/foreign-travel-advice/tunisia/safety-and-security', 'https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories/tunisia-travel-advisory.html', 'https://travel.gc.ca/destinations/tunisia'] },
  { id: 'health', icon: '🩺', title: { en: 'Health' }, points: [
    { en: 'Tap water is treated in the cities and on the coast; bottled water is cheap and wiser in the countryside and the south.' },
    { en: 'Ask a travel clinic about hepatitis A and typhoid. Take insurance that covers treatment and repatriation: clinics expect payment on the spot.' },
    { en: 'Pharmacies are common in towns. Bring your medicines in their boxes with a doctor’s note.' },
    { en: 'Inland summers are very hot: drink often, cover up and rest at midday. Do not touch stray dogs; get care at once after a bite.' },
  ],
    sources: ['https://www.gov.uk/foreign-travel-advice/tunisia/health', 'https://wwwnc.cdc.gov/travel/destinations/traveler/none/tunisia', 'https://www.worldtravelguide.net/guides/africa/tunisia/health'] },
  { id: 'emergency', icon: '🚨', title: { en: 'Emergency numbers' }, points: [
    { en: 'Police: 197. National Guard (countryside): 193.' },
    { en: 'Ambulance: 190. Fire and road accidents: 198.' },
    { en: 'For a lost passport, call your embassy in Tunis.' },
  ],
    sources: ['https://www.gov.uk/foreign-travel-advice/tunisia/getting-help', 'https://travel.gc.ca/destinations/tunisia'] },
  { id: 'phone', icon: '📱', title: { en: 'Phone and internet' }, points: [
    { en: 'Three networks: Ooredoo, Orange and Tunisie Telecom, with counters in the arrivals hall of Tunis–Carthage. A SIM needs your passport itself, not a copy.' },
    { en: 'A travel eSIM can be set up before you leave. Hotels and cafés in towns usually have Wi-Fi.' },
    { en: 'The country code is +216, then eight digits.' },
  ],
    sources: ['https://carthagemagazine.com/prepaid-sim-card-in-tunisia/', 'https://en.wikivoyage.org/wiki/Tunisia'] },
  { id: 'power', icon: '🔌', title: { en: 'Electricity' }, points: [
    { en: '230 V, 50 Hz, with two round pins (types C and E): a continental European plug fits.' },
    { en: 'Summer heat can cause short power cuts.' },
  ],
    sources: ['https://en.wikipedia.org/wiki/Mains_electricity_by_country', 'https://www.gov.uk/foreign-travel-advice/tunisia/safety-and-security'] },
  { id: 'airports', icon: '✈️', title: { en: 'From the airport' }, points: [
    { en: 'Tunis–Carthage: bus 635 to Tunis Marine every 30–40 minutes by day, cash on board; or a yellow taxi with the meter on. Ride apps work too.' },
    { en: 'Enfidha–Hammamet: no train. Agree the taxi fare before you set off; package holidays usually include the transfer.' },
    { en: 'Monastir: the Sahel Metro stops 150 m from the terminal, with trains to Monastir, Sousse and Mahdia.' },
    { en: 'Djerba: taxis to Houmt Souk and the hotels; ask for the meter.' },
  ],
    sources: ['https://www.cestee.com/airport/tunis-tun/transport', 'https://www.cestee.com/airport/enfidha-nbe/transport', 'https://habibbourguibaairport.com/en-EN/to-from-the-airport/page/rail-transportation', 'https://en.wikivoyage.org/wiki/Djerba'] },
  { id: 'transport', icon: '🚐', title: { en: 'Getting around' }, points: [
    { en: 'Louages are shared minibuses between towns. They leave when full, at fixed fares; a red stripe means long distance.' },
    { en: 'Trains run from Tunis to Sousse, Monastir and Sfax; allow for delays. In Tunis, the TGM light railway goes to La Goulette, Carthage, Sidi Bou Said and La Marsa.' },
    { en: 'Driving is on the right. Bring your licence and an international permit, and expect police checkpoints.' },
    { en: 'Avoid driving at night: poor lighting, animals on the road and unmarked speed bumps.' },
  ],
    sources: ['https://en.wikipedia.org/wiki/Louage', 'https://en.wikipedia.org/wiki/Tunis-Goulette-Marsa', 'https://www.lonelyplanet.com/articles/getting-around-tunisia', 'https://travel.gc.ca/destinations/tunisia'] },
  { id: 'etiquette', icon: '🤝', title: { en: 'Customs' }, points: [
    { en: 'Beachwear is fine at the resorts; cover up in towns, at religious sites and in the more conservative south.' },
    { en: 'Most working mosques are closed to non-Muslims; the courtyards of the Great Mosques of Kairouan, Sousse and Mahdia can be visited. Mind prayer times, above all on Friday at noon.' },
    { en: 'Do not photograph police, military or government buildings, and ask before photographing people.' },
    { en: 'Bargaining is normal in the souks; state craft shops have fixed prices, a useful guide. A tip of about 10% is usual in restaurants.' },
    { en: 'Shops do not sell alcohol on Fridays or during Ramadan; licensed hotels and bars still serve it.' },
  ],
    sources: ['https://www.gov.uk/foreign-travel-advice/tunisia/safety-and-security', 'https://en.wikivoyage.org/wiki/Tunisia', 'https://www.webdo.tn/fr/actualite/chroniques/pourquoi-les-mosquees-sont-elles-fermees-aux-non-musulmans/206436/'] },
  { id: 'calendar', icon: '📅', title: { en: 'Time, holidays and Ramadan' }, points: [
    { en: 'GMT+1 all year, with no summer time.' },
    { en: 'Ramadan 2027 is expected from about 8 February to 8 March, depending on the moon. Many restaurants open only at sunset; do not eat, drink or smoke in public by day.' },
    { en: 'Public holidays: 1 January, 20 March, 9 April, 1 May, 25 July, 13 August, 15 October and 17 December, plus the two Eids, the Islamic New Year and the Prophet’s birthday.' },
  ],
    sources: ['https://en.wikipedia.org/wiki/Public_holidays_in_Tunisia', 'https://www.timeanddate.com/holidays/tunisia/2027', 'https://discovertunisia.com/en/node/158'] },
  { id: 'language', icon: '🗣️', title: { en: 'Language' }, points: [
    { en: 'Arabic is the official language; people speak Tunisian Arabic, called Tounsi or Derja.' },
    { en: 'French is widely spoken and most signs are in Arabic and French. English is common in hotels and tourist places, less elsewhere.' },
  ],
    sources: ['https://en.wikipedia.org/wiki/Tunisian_Arabic', 'https://en.wikivoyage.org/wiki/Tunisia'] },
];
