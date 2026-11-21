/**
 * Life and logistics on the home map: animals where they really live, region names, airports,
 * ferries, railways and motorways. Transport lines are drawn schematically through their main stops.
 */
import type { T3 } from '../i18n';

export interface Animal { id: string; icon: string; lat: number; lon: number; name: T3; text: T3 }
/** Each animal is placed where sources record it (see README for the sources). */
export const ANIMALS: Animal[] = [
  { id: 'flamingo-sijoumi', icon: '🦩', lat: 36.775, lon: 10.115,
    name: { en: 'Greater flamingos', fr: 'Flamants roses', ar: 'النحام الوردي' },
    text: { en: 'Thousands of flamingos winter on Sebkhet Sijoumi, a salt lagoon inside Tunis itself.', fr: 'Des milliers de flamants hivernent sur la sebkha Séjoumi, une lagune salée au cœur même de Tunis.', ar: 'آلاف من طيور النحام تقضي الشتاء في سبخة السيجومي، بحيرة مالحة داخل مدينة تونس نفسها.' } },
  { id: 'flamingo-korba', icon: '🦩', lat: 36.61, lon: 10.89,
    name: { en: 'Flamingos of Korba', fr: 'Flamants de Korba', ar: 'نحام قربة' },
    text: { en: 'The lagoons of Korba on Cap Bon are a wetland reserve where flamingos feed, and where a colony has nested.', fr: 'Les lagunes de Korba, au cap Bon, sont une zone humide protégée où les flamants se nourrissent, et où une colonie a niché.', ar: 'بحيرات قربة في الوطن القبلي منطقة رطبة محميّة يتغذّى فيها النحام، وقد عشّشت فيها مستعمرة منه.' } },
  { id: 'ducks-ichkeul', icon: '🦆', lat: 37.14, lon: 9.62,
    name: { en: 'Wintering ducks and geese', fr: 'Canards et oies hivernants', ar: 'بطّ وإوزّ الشتاء' },
    text: { en: 'Lake Ichkeul is a winter home for ducks, geese and coots that fly in from Europe.', fr: 'Le lac Ichkeul est le quartier d’hiver de canards, d’oies et de foulques venus d’Europe.', ar: 'بحيرة إشكل مشتى للبطّ والإوزّ والغرّة القادمة من أوروبا.' } },
  { id: 'stork', icon: '🐦', lat: 37.056, lon: 9.238,
    name: { en: 'White storks', fr: 'Cigognes blanches', ar: 'اللقلق الأبيض' },
    text: { en: 'White storks nest on pylons, roofs and the old railway station of Sejnane, and across the Medjerda valley.', fr: 'Les cigognes blanches nichent sur les pylônes, les toits et l’ancienne gare de Sejnane, et dans toute la vallée de la Medjerda.', ar: 'يعشّش اللقلق الأبيض على الأعمدة والأسطح ومحطة القطار القديمة في سجنان، وفي كامل وادي مجردة.' } },
  { id: 'deer', icon: '🦌', lat: 36.5, lon: 8.31,
    name: { en: 'Barbary deer', fr: 'Cerf de Barbarie', ar: 'الأيّل البربري' },
    text: { en: 'Africa’s only native deer lives in the oak forests of El Feija National Park, where it was brought back from the edge of extinction.', fr: 'Le seul cerf originaire d’Afrique vit dans les forêts de chênes du parc national d’El Feija, où il a été sauvé de l’extinction.', ar: 'الأيّل الوحيد الأصيل في إفريقيا يعيش في غابات البلّوط بالحديقة الوطنية بالفايجة، حيث أُنقذ من الانقراض.' } },
  { id: 'boar', icon: '🐗', lat: 36.85, lon: 8.83,
    name: { en: 'Wild boar', fr: 'Sanglier', ar: 'الخنزير البرّي' },
    text: { en: 'Wild boar are common in the cork-oak forests of the Kroumirie mountains.', fr: 'Le sanglier est commun dans les forêts de chênes-lièges des monts de Kroumirie.', ar: 'الخنزير البرّي شائع في غابات الفلّين بجبال خمير.' } },
  { id: 'raptors', icon: '🦅', lat: 37.09, lon: 11.04,
    name: { en: 'Birds of prey', fr: 'Rapaces', ar: 'الطيور الجارحة' },
    text: { en: 'In spring, birds of prey gather over El Haouaria before crossing the sea to Sicily; the town has kept its tradition of falconry.', fr: 'Au printemps, les rapaces se rassemblent au-dessus d’El Haouaria avant de traverser la mer vers la Sicile ; la ville a gardé sa tradition de fauconnerie.', ar: 'في الربيع تتجمّع الجوارح فوق الهوارية قبل عبور البحر نحو صقلية؛ وقد حافظت البلدة على تقليد البيزرة.' } },
  { id: 'turtle', icon: '🐢', lat: 35.8, lon: 11.03,
    name: { en: 'Loggerhead turtles', fr: 'Tortues caouannes', ar: 'السلحفاة البحرية ضخمة الرأس' },
    text: { en: 'The Kuriat Islands off Monastir are Tunisia’s main nesting beach for loggerhead sea turtles, watched over each summer since 1997.', fr: 'Les îles Kuriat, au large de Monastir, sont la principale plage de ponte des tortues caouannes en Tunisie, surveillée chaque été depuis 1997.', ar: 'جزر قوريا قبالة المنستير هي أهمّ شاطئ تعشيش للسلاحف البحرية ضخمة الرأس في تونس، وتُراقَب كل صيف منذ 1997.' } },
  { id: 'oryx', icon: '🦌', lat: 34.5, lon: 9.52,
    name: { en: 'Scimitar-horned oryx', fr: 'Oryx algazelle', ar: 'المها أبو حراب' },
    text: { en: 'Once extinct in the wild, this desert antelope was brought back to Bou Hedma in 1985 and now lives in several southern parks.', fr: 'Autrefois éteinte à l’état sauvage, cette antilope du désert a été réintroduite à Bou Hedma en 1985 et vit aujourd’hui dans plusieurs parcs du sud.', ar: 'هذا الظبي الصحراوي الذي انقرض من البرّية أُعيد إلى بوهدمة سنة 1985، ويعيش اليوم في عدّة حدائق بالجنوب.' } },
  { id: 'camel', icon: '🐪', lat: 33.33, lon: 8.86,
    name: { en: 'Dromedaries', fr: 'Dromadaires', ar: 'الجمال' },
    text: { en: 'Around Douz, dromedaries are still raised, raced at the Festival of the Sahara, and ridden into the dunes.', fr: 'Autour de Douz, on élève encore des dromadaires ; ils courent au Festival du Sahara et emmènent les voyageurs dans les dunes.', ar: 'حول دوز ما زالت الجمال تُربّى، وتتسابق في مهرجان الصحراء، وتحمل المسافرين إلى الكثبان.' } },
  { id: 'fennec', icon: '🦊', lat: 32.4, lon: 8.9,
    name: { en: 'Fennec fox', fr: 'Fennec', ar: 'الفنك' },
    text: { en: 'The small desert fox with huge ears lives in the sands of the Grand Erg Oriental and comes out at night.', fr: 'Le petit renard du désert aux immenses oreilles vit dans les sables du Grand Erg oriental et sort la nuit.', ar: 'ثعلب الصحراء الصغير ذو الأذنين الكبيرتين يعيش في رمال العرق الشرقي الكبير ويخرج ليلًا.' } },
];

/** Names of regions written across the land. */
export const REGIONS: { lat: number; lon: number; rot?: number; size?: number; name: T3 }[] = [
  { lat: 36.82, lon: 8.95, rot: -8, name: { en: 'Kroumirie', fr: 'Kroumirie', ar: 'خمير' } },
  { lat: 36.3, lon: 9.35, rot: -18, size: 1.15, name: { en: 'The Tell', fr: 'Le Tell', ar: 'التلّ' } },
  { lat: 36.72, lon: 10.82, rot: -48, name: { en: 'Cap Bon', fr: 'Cap Bon', ar: 'الوطن القبلي' } },
  { lat: 35.62, lon: 9.05, rot: -28, name: { en: 'Dorsal', fr: 'Dorsale', ar: 'الظهرية' } },
  { lat: 35.5, lon: 10.45, rot: -70, name: { en: 'Sahel', fr: 'Sahel', ar: 'الساحل' } },
  { lat: 34.85, lon: 9.4, size: 1.15, name: { en: 'Steppes', fr: 'Steppes', ar: 'السباسب' } },
  { lat: 33.1, lon: 10.25, rot: -60, name: { en: 'Dahar', fr: 'Dahar', ar: 'الظاهر' } },
  { lat: 31.9, lon: 9.15, size: 1.5, name: { en: 'Sahara · Grand Erg Oriental', fr: 'Sahara · Grand Erg oriental', ar: 'الصحراء · العرق الشرقي الكبير' } },
];

export interface Airport { id: string; code: string; lat: number; lon: number; name: T3; intl?: boolean }
export const AIRPORTS: Airport[] = [
  { id: 'tun', code: 'TUN', lat: 36.851, lon: 10.227, intl: true, name: { en: 'Tunis–Carthage', fr: 'Tunis-Carthage', ar: 'تونس قرطاج' } },
  { id: 'nbe', code: 'NBE', lat: 36.076, lon: 10.439, intl: true, name: { en: 'Enfidha–Hammamet', fr: 'Enfidha-Hammamet', ar: 'النفيضة الحمامات' } },
  { id: 'mir', code: 'MIR', lat: 35.758, lon: 10.755, intl: true, name: { en: 'Monastir', fr: 'Monastir', ar: 'المنستير' } },
  { id: 'dje', code: 'DJE', lat: 33.875, lon: 10.775, intl: true, name: { en: 'Djerba–Zarzis', fr: 'Djerba-Zarzis', ar: 'جربة جرجيس' } },
  { id: 'sfa', code: 'SFA', lat: 34.718, lon: 10.691, intl: true, name: { en: 'Sfax–Thyna', fr: 'Sfax-Thyna', ar: 'صفاقس طينة' } },
  { id: 'toe', code: 'TOE', lat: 33.94, lon: 8.111, name: { en: 'Tozeur–Nefta', fr: 'Tozeur-Nefta', ar: 'توزر نفطة' } },
  { id: 'tbj', code: 'TBJ', lat: 36.98, lon: 8.877, name: { en: 'Tabarka–Aïn Draham', fr: 'Tabarka-Aïn Draham', ar: 'طبرقة عين دراهم' } },
  { id: 'gaf', code: 'GAF', lat: 34.422, lon: 8.823, name: { en: 'Gafsa–Ksar', fr: 'Gafsa-Ksar', ar: 'قفصة القصر' } },
  { id: 'gae', code: 'GAE', lat: 33.733, lon: 9.919, name: { en: 'Gabès–Matmata', fr: 'Gabès-Matmata', ar: 'قابس مطماطة' } },
];

type LL = [number, number];
export interface Line { id: string; kind: 'rail' | 'road' | 'ferry'; name: T3; note?: T3; p: LL[] }
export const LINES: Line[] = [
  { id: 'rail-south', kind: 'rail', name: { en: 'Train Tunis – Sousse – Sfax – Gabès', fr: 'Train Tunis – Sousse – Sfax – Gabès', ar: 'قطار تونس – سوسة – صفاقس – قابس' },
    p: [[36.795, 10.181], [36.727, 10.337], [36.6, 10.5], [36.43, 10.57], [36.3, 10.45], [36.13, 10.38], [35.87, 10.53], [35.83, 10.63], [35.73, 10.58], [35.297, 10.713], [34.735, 10.766], [34.53, 10.5], [34.3, 10.07], [33.89, 10.1]] },
  { id: 'rail-nabeul', kind: 'rail', name: { en: 'Train to Hammamet and Nabeul', fr: 'Train vers Hammamet et Nabeul', ar: 'قطار الحمامات ونابل' },
    p: [[36.43, 10.57], [36.4, 10.61], [36.455, 10.735]] },
  { id: 'rail-djerid', kind: 'rail', name: { en: 'Train Sfax – Gafsa – Tozeur', fr: 'Train Sfax – Gafsa – Tozeur', ar: 'قطار صفاقس – قفصة – توزر' },
    p: [[34.53, 10.5], [34.52, 10.22], [34.61, 9.6], [34.48, 9.26], [34.42, 8.78], [34.32, 8.4], [33.92, 8.13]] },
  { id: 'rail-west', kind: 'rail', name: { en: 'Train Tunis – Béja – Jendouba – Ghardimaou', fr: 'Train Tunis – Béja – Jendouba – Ghardimaou', ar: 'قطار تونس – باجة – جندوبة – غار الدماء' },
    p: [[36.795, 10.181], [36.85, 9.93], [36.83, 9.84], [36.65, 9.61], [36.67, 9.42], [36.725, 9.19], [36.61, 8.97], [36.5, 8.78], [36.45, 8.44]] },
  { id: 'rail-bizerte', kind: 'rail', name: { en: 'Train Tunis – Mateur – Bizerte', fr: 'Train Tunis – Mateur – Bizerte', ar: 'قطار تونس – ماطر – بنزرت' },
    p: [[36.85, 9.93], [37.04, 9.67], [37.16, 9.76], [37.27, 9.87]] },
  { id: 'rail-sahel', kind: 'rail', name: { en: 'Sahel Metro: Sousse – Monastir – Mahdia', fr: 'Métro du Sahel : Sousse – Monastir – Mahdia', ar: 'مترو الساحل: سوسة – المنستير – المهدية' },
    p: [[35.83, 10.63], [35.77, 10.83], [35.64, 10.89], [35.5, 11.06]] },
  { id: 'a1', kind: 'road', name: { en: 'A1 motorway Tunis – Sfax – Gabès', fr: 'Autoroute A1 Tunis – Sfax – Gabès', ar: 'الطريق السيارة أ1 تونس – صفاقس – قابس' },
    p: [[36.76, 10.22], [36.42, 10.52], [36.13, 10.33], [35.82, 10.53], [35.3, 10.62], [34.8, 10.65], [34.33, 10.03], [33.93, 10.02]] },
  { id: 'a3', kind: 'road', name: { en: 'A3 motorway Tunis – Bou Salem', fr: 'Autoroute A3 Tunis – Bou Salem', ar: 'الطريق السيارة أ3 تونس – بوسالم' },
    p: [[36.8, 10.1], [36.66, 9.63], [36.68, 9.43], [36.6, 9.0]] },
  { id: 'a4', kind: 'road', name: { en: 'A4 motorway Tunis – Bizerte', fr: 'Autoroute A4 Tunis – Bizerte', ar: 'الطريق السيارة أ4 تونس – بنزرت' },
    p: [[36.86, 10.15], [37.05, 10.03], [37.22, 9.86]] },
  { id: 'ferry-kerkennah', kind: 'ferry', name: { en: 'Ferry Sfax – Kerkennah', fr: 'Ferry Sfax – Kerkennah', ar: 'عبّارة صفاقس – قرقنة' },
    note: { en: 'about 1 h', fr: 'environ 1 h', ar: 'نحو ساعة' }, p: [[34.727, 10.775], [34.655, 11.02]] },
  { id: 'ferry-djerba', kind: 'ferry', name: { en: 'Ferry El Jorf – Ajim (Djerba)', fr: 'Bac El Jorf – Ajim (Djerba)', ar: 'بطّاح الجرف – أجيم (جربة)' },
    note: { en: 'about 15 min, day and night', fr: 'environ 15 min, jour et nuit', ar: 'نحو 15 دقيقة، ليلًا ونهارًا' }, p: [[33.697, 10.728], [33.727, 10.747]] },
  { id: 'ferry-europe', kind: 'ferry', name: { en: 'Ferries from La Goulette to Marseille, Genoa and Sicily', fr: 'Ferries de La Goulette vers Marseille, Gênes et la Sicile', ar: 'عبّارات حلق الوادي نحو مرسيليا وجنوة وصقلية' },
    p: [[36.81, 10.305], [37.2, 10.75], [37.75, 11.3]] },
];
/** Main stations, to judge the nearest train from a place. */
export const STATIONS: { name: T3; lat: number; lon: number }[] = [
  { name: { en: 'Tunis', fr: 'Tunis', ar: 'تونس' }, lat: 36.795, lon: 10.181 },
  { name: { en: 'Bizerte', fr: 'Bizerte', ar: 'بنزرت' }, lat: 37.27, lon: 9.87 },
  { name: { en: 'Béja', fr: 'Béja', ar: 'باجة' }, lat: 36.725, lon: 9.19 },
  { name: { en: 'Jendouba', fr: 'Jendouba', ar: 'جندوبة' }, lat: 36.5, lon: 8.78 },
  { name: { en: 'Hammamet', fr: 'Hammamet', ar: 'الحمامات' }, lat: 36.4, lon: 10.61 },
  { name: { en: 'Nabeul', fr: 'Nabeul', ar: 'نابل' }, lat: 36.455, lon: 10.735 },
  { name: { en: 'Sousse', fr: 'Sousse', ar: 'سوسة' }, lat: 35.83, lon: 10.63 },
  { name: { en: 'Monastir', fr: 'Monastir', ar: 'المنستير' }, lat: 35.77, lon: 10.83 },
  { name: { en: 'Mahdia', fr: 'Mahdia', ar: 'المهدية' }, lat: 35.5, lon: 11.06 },
  { name: { en: 'El Jem', fr: 'El Jem', ar: 'الجم' }, lat: 35.297, lon: 10.713 },
  { name: { en: 'Sfax', fr: 'Sfax', ar: 'صفاقس' }, lat: 34.735, lon: 10.766 },
  { name: { en: 'Gabès', fr: 'Gabès', ar: 'قابس' }, lat: 33.89, lon: 10.1 },
  { name: { en: 'Gafsa', fr: 'Gafsa', ar: 'قفصة' }, lat: 34.42, lon: 8.78 },
  { name: { en: 'Tozeur', fr: 'Tozeur', ar: 'توزر' }, lat: 33.92, lon: 8.13 },
];

/** Great-circle distance in km. */
export function km(a: LL, b: LL) {
  const R = 6371, r = Math.PI / 180, dLat = (b[0] - a[0]) * r, dLon = (b[1] - a[1]) * r;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}
/** Rough road distance and driving time between two points (straight line × 1.25, about 75 km/h). */
export function drive(a: LL, b: LL) {
  const d = km(a, b) * 1.25;
  return { km: Math.round(d / 5) * 5, h: d / 75 };
}
export const TUNIS: LL = [36.8, 10.18];
