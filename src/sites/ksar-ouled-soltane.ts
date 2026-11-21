import * as THREE from 'three';
import { COURT1, COURT2, FOOT, GATE, SPOTS, buildKsar } from '../monuments/ksar/build';
import type { Hotspot, SiteDef } from './types';

const at = (p: [number, number], h: number) => ({ x: p[0], z: p[1], h });
type V = [number, number, number];
const centre = (p: [number, number][]): [number, number] => [p.reduce((s, q) => s + q[0], 0) / p.length, p.reduce((s, q) => s + q[1], 0) / p.length];
const C1 = centre(COURT1), C2 = centre(COURT2), MID = centre(FOOT);

// positions on the ground or in the walls are worked out when the ksar is built (SPOTS)
const court1 = () => {
  const g = SPOTS.ghorfa;
  return { marker: [g.at[0], SPOTS.y0 + 6, g.at[1]] as V, view: [C1[0] + g.front[0] * 5, SPOTS.y0 + 1, C1[1] + g.front[1] * 5] as V };
};
const ghorfa = () => {
  const g = SPOTS.ghorfa, t = g.depth - 0.8;
  return { marker: [g.at[0] + g.front[0] * 4, SPOTS.y0 + 1.3, g.at[1] + g.front[1] * 4] as V, view: [g.at[0] - g.front[0] * t, SPOTS.y0 + 1, g.at[1] - g.front[1] * t] as V };
};
const stair = () => {
  const s = SPOTS.stair;
  return { marker: [s.at[0] + s.front[0] * 16, SPOTS.y0 + 4, s.at[1] + s.front[1] * 16] as V, view: [s.at[0], s.y + 1, s.at[1]] as V };
};
const passage = () => {
  const { a, b } = SPOTS.passage, l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, dx = (b[0] - a[0]) / l, dz = (b[1] - a[1]) / l;
  return { marker: [b[0] + dx * 4, SPOTS.y0 + 1.6, b[1] + dz * 4] as V, view: [a[0] - dx * 4.5, SPOTS.y0 + 1, a[1] - dz * 4.5] as V };
};
const court2 = () => {
  const dx = C2[0] - GATE[0], dz = C2[1] - GATE[1], l = Math.hypot(dx, dz) || 1;
  return { marker: [C2[0] - (dx / l) * 6, SPOTS.y0 + 5, C2[1] - (dz / l) * 6] as V, view: [GATE[0] + (dx / l) * 6, SPOTS.y0 + 1, GATE[1] + (dz / l) * 6] as V };
};

/** Places to see. Positions come from OpenStreetMap. */
const HOTSPOTS: Hotspot[] = [
  {
    id: 'court2', get marker() { return court2().marker; }, get view() { return court2().view; }, fixedView: true, photo: 'court2',
    title: { en: 'The second courtyard', fr: 'La seconde cour', ar: 'الصحن الثاني' },
    text: {
      en: 'In the 19th century the ksar was extended with a second courtyard, bringing it to around 400 ghorfas. The tribes of the plain kept their harvests here, safe from raids, and came back to fetch grain and oil as they needed them.',
      fr: 'Au XIXe siècle le ksar a été agrandi d’une seconde cour, portant le nombre de ghorfas à environ 400. Les tribus de la plaine y gardaient leurs récoltes à l’abri des razzias, et revenaient y chercher grain et huile selon leurs besoins.',
      ar: 'في القرن التاسع عشر وُسِّع القصر بصحن ثانٍ فبلغ عدد غرفه نحو 400. كانت قبائل السهل تخزن فيه محاصيلها بمأمن من الغارات، وتعود إليه لأخذ الحبوب والزيت عند الحاجة.',
    },
  },
  {
    id: 'court1', get marker() { return court1().marker; }, get view() { return court1().view; }, fixedView: true, photo: 'court1',
    title: { en: 'The first courtyard', fr: 'La première cour', ar: 'الصحن الأول' },
    text: {
      en: 'The oldest part of the ksar, often dated to the 15th century (some historians say 1699): vaulted ghorfas stacked four storeys high around a closed courtyard. In 1997 it was filmed for Star Wars: The Phantom Menace.',
      fr: 'La partie la plus ancienne du ksar, souvent datée du XVe siècle (certains historiens disent 1699) : des ghorfas voûtées empilées sur quatre étages autour d’une cour fermée. En 1997 on y a tourné des scènes de Star Wars : La Menace fantôme.',
      ar: 'أقدم أجزاء القصر، يُؤرَّخ غالبًا بالقرن الخامس عشر (ويقول بعض المؤرّخين 1699): غرف مقبّبة مكدّسة على أربعة طوابق حول صحن مغلق. وفي سنة 1997 صُوّرت فيه مشاهد من فيلم حرب النجوم: الخطر الشبح.',
    },
  },
  {
    id: 'ghorfa', get marker() { return ghorfa().marker; }, get view() { return ghorfa().view; }, fixedView: true, photo: 'ghorfa',
    title: { en: 'Inside a ghorfa', fr: 'Dans une ghorfa', ar: 'داخل غرفة' },
    text: {
      en: 'Each ghorfa is a long barrel-vaulted cell of stone and mud plaster, with a small wooden door. Thick walls kept grain, oil and dried food cool and dry through the summer; each family had its own cells.',
      fr: 'Chaque ghorfa est une longue cellule voûtée en berceau, de pierre et d’enduit de terre, fermée par une petite porte de bois. Les murs épais gardaient au frais et au sec le grain, l’huile et les provisions pendant l’été ; chaque famille avait ses propres cellules.',
      ar: 'كل غرفة خليّة طويلة بقبو أسطواني من الحجر والطين المليّس، يُغلقها باب خشبي صغير. وكانت الجدران السميكة تحفظ الحبوب والزيت والمؤونة باردة جافّة طوال الصيف، ولكل عائلة غرفها.',
    },
  },
  {
    id: 'stairs', get marker() { return stair().marker; }, get view() { return stair().view; }, fixedView: true, photo: 'stairs',
    title: { en: 'Stairs without railings', fr: 'Des escaliers sans rampe', ar: 'سلالم بلا درابزين' },
    text: {
      en: 'Narrow stair ramps of plastered stone climb the walls to the upper doors. Beam ends sticking out under the doors served as footholds and to hoist sacks up by rope.',
      fr: 'D’étroites rampes d’escalier en pierre enduite grimpent le long des murs vers les portes du haut. Les bouts de poutres qui dépassent sous les portes servaient d’appuis pour les pieds et à hisser les sacs à la corde.',
      ar: 'سلالم ضيّقة من الحجر المليّس تصعد على الجدران إلى الأبواب العليا. وكانت أطراف العوارض البارزة تحت الأبواب تُستعمل موطئًا للقدم ولرفع الأكياس بالحبال.',
    },
  },
  {
    id: 'passage', get marker() { return passage().marker; }, get view() { return passage().view; }, fixedView: true, photo: 'passage',
    title: { en: 'Between the two courtyards', fr: 'Entre les deux cours', ar: 'بين الصحنين' },
    text: {
      en: 'A short passage, roofed with palm trunks, joins the two courtyards.',
      fr: 'Un court passage, couvert de troncs de palmier, relie les deux cours.',
      ar: 'ممرّ قصير مسقوف بجذوع النخيل يصل بين الصحنين.',
    },
  },
  {
    // on open ground west of the ksar, looking along its blank outer wall
    id: 'outside', marker: at([MID[0] - 30, MID[1]], 6), view: at([MID[0] - 100, MID[1] + 22], 1), fixedView: true, photo: 'outside',
    title: { en: 'On the hilltop', fr: 'Au sommet de la colline', ar: 'على قمّة التلّ' },
    text: {
      en: 'From outside the ksar shows almost blank walls: a fortress of granaries on a hilltop of the Dahar, about 20 km south of Tataouine, above the village that took its name.',
      fr: 'De l’extérieur, le ksar ne montre que des murs presque aveugles : une forteresse de greniers au sommet d’une colline du Dahar, à une vingtaine de kilomètres au sud de Tataouine, au-dessus du village qui porte son nom.',
      ar: 'من الخارج لا يُظهر القصر إلا جدرانًا شبه صمّاء: قلعة مخازن على قمّة تلّ من جبال الظاهر، على نحو 20 كم جنوب تطاوين، فوق القرية التي تحمل اسمه.',
    },
  },
];

export const site: SiteDef = {
  id: 'ksar-ouled-soltane',
  lat: 32.78843, lon: 10.51483,
  northRotation: 0,
  info: {
    name: { en: 'Ksar Ouled Soltane', fr: 'Ksar Ouled Soltane', ar: 'قصر أولاد سلطان' },
    facts: [
      { k: { en: 'Built', fr: 'Construit', ar: 'البناء' }, v: { en: 'first courtyard 15th c. (or 1699), second 19th c.', fr: 'première cour XVe s. (ou 1699), seconde XIXe s.', ar: 'الصحن الأول القرن 15 (أو 1699)، والثاني القرن 19' } },
      { k: { en: 'Ghorfas', fr: 'Ghorfas', ar: 'الغرف' }, v: { en: 'about 400, up to four storeys', fr: 'environ 400, jusqu’à quatre étages', ar: 'نحو 400، حتى أربعة طوابق' } },
      { k: { en: 'Use', fr: 'Usage', ar: 'الوظيفة' }, v: { en: 'fortified granary of grain and olive oil', fr: 'grenier fortifié pour le grain et l’huile', ar: 'مخزن محصّن للحبوب والزيت' } },
      { k: { en: 'Altitude', fr: 'Altitude', ar: 'الارتفاع' }, v: { en: 'about 500 m, in the Dahar hills', fr: 'environ 500 m, dans les monts du Dahar', ar: 'نحو 500 م، في جبال الظاهر' } },
    ],
    visit: [
      { k: { en: 'Getting there', fr: 'Accès', ar: 'الوصول' }, v: {
        en: 'About 20 km south of Tataouine by a winding road; take a taxi or join a tour of the ksour.',
        fr: 'À une vingtaine de kilomètres au sud de Tataouine par une route sinueuse ; en taxi ou avec un circuit des ksour.',
        ar: 'على نحو 20 كم جنوب تطاوين عبر طريق ملتوية، بسيارة أجرة أو ضمن جولة القصور.' } },
      { k: { en: 'Tickets', fr: 'Billets', ar: 'التذاكر' }, v: {
        en: 'Free to walk in; there is a café by the entrance. Take care on the stairs, which have no railings.',
        fr: 'Entrée libre ; un café se trouve à l’entrée. Prudence dans les escaliers, sans rampe.',
        ar: 'الدخول مجاني، وبجانب المدخل مقهى. انتبه في السلالم فهي بلا درابزين.' } },
      { k: { en: 'Best time', fr: 'Meilleure période', ar: 'أفضل وقت' }, v: {
        en: 'Early morning or late afternoon, when the low sun warms the ochre walls; spring and autumn are the most comfortable.',
        fr: 'Tôt le matin ou en fin d’après-midi, quand le soleil bas réchauffe les murs ocre ; le printemps et l’automne sont les plus agréables.',
        ar: 'باكرًا صباحًا أو آخر النهار حين تدفئ الشمس المنخفضة الجدران الصفراء، والربيع والخريف أنسب الفصول.' } },
    ],
    searchTerm: 'Ksar Ouled Soltane',
    intro: {
      en: 'A fortified granary on a hilltop of the south: two courtyards ringed by vaulted cells stacked four storeys high.',
      fr: 'Un grenier fortifié au sommet d’une colline du Sud : deux cours entourées de cellules voûtées empilées sur quatre étages.',
      ar: 'مخزن محصّن على قمّة تلّ في الجنوب: صحنان تحيط بهما غرف مقبّبة مكدّسة على أربعة طوابق.',
    },
    loading: { en: 'Stacking the ghorfas…', fr: 'On empile les ghorfas…', ar: 'جارٍ تكديس الغرف…' },
    note: {
      en: 'Terrain, roads and the outline of the ksar and its courtyards come from real map data; the ghorfas, doors and stairs are modelled from photos and simplified.',
      fr: 'Le relief, les routes et le contour du ksar et de ses cours viennent de vraies données cartographiques ; les ghorfas, portes et escaliers sont modélisés d’après des photos, simplifiés.',
      ar: 'التضاريس والطرق وحدود القصر وصحنيه من بيانات خرائط حقيقية، والغرف والأبواب والسلالم منمذجة بتبسيط اعتمادًا على صور.',
    },
  },
  hotspots: HOTSPOTS,
  photos: 'ksar-ouled-soltane',
  build: buildKsar,
  toVec: (p, built) => {
    if (Array.isArray(p)) return new THREE.Vector3(...p);
    if ('x' in p) return new THREE.Vector3(p.x, (built.groundAt?.(p.x, p.z) ?? 0) + p.h, p.z);
    return new THREE.Vector3(0, p.y, 0);
  },
  intro: { center: [0, 505, 0], rx: 170, rz: 150, height: 70 },
  shadowClamp: 600,
  fog: 0.0008,
};
