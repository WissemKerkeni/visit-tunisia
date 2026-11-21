import * as THREE from 'three';
import { MOSQUE, PLAN, SIDI_DRISS_POI, KHADIJA_POI, buildMatmata, type Pit } from '../monuments/matmata/build';
import type { Hotspot, Pt, SiteDef } from './types';

const at = (p: [number, number], h: number) => ({ x: p[0], z: p[1], h });
type V = [number, number, number];

// positions inside the pits are only known once the scene is built (the pits are planned on the terrain)
const edge = (pit: Pit, k: number) => {
  const N = pit.p.length, a = pit.p[k % N], b = pit.p[(k + 1) % N], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const u = [(b[0] - a[0]) / L, (b[1] - a[1]) / L];
  return { a, u, n: [u[1], -u[0]], L };
};
/** In the hotel's main courtyard, across from the white steps. */
const hotelView = (): { marker: V; view: V } => {
  const h = PLAN.hotel;
  if (!h) return { marker: [SIDI_DRISS_POI[0], 400, SIDI_DRISS_POI[1]], view: [SIDI_DRISS_POI[0] + 20, 400, SIDI_DRISS_POI[1]] };
  const d = h.stairs ?? h.doors[0];
  const e = edge(h, d?.edge ?? 0), mx = e.a[0] + e.u[0] * (d?.s ?? 0), mz = e.a[1] + e.u[1] * (d?.s ?? 0);
  const dx = mx - h.c[0], dz = mz - h.c[1], l = Math.hypot(dx, dz) || 1;
  return { marker: [mx, h.floor + (d?.sill ?? 0) + 1.2, mz], view: [h.c[0] - (dx / l) * h.r * 0.6, h.floor + 1.2, h.c[1] - (dz / l) * h.r * 0.6] };
};
/** At the back of the deepest room of the hotel, looking out to the courtyard. */
const roomView = (): { marker: V; view: V } => {
  const h = PLAN.hotel;
  const d = h?.doors.filter((o) => o.kind === 'room').sort((a, b) => (b.D ?? 0) - (a.D ?? 0))[0];
  if (!h || !d) return hotelView();
  const e = edge(h, d.edge), mx = e.a[0] + e.u[0] * d.s, mz = e.a[1] + e.u[1] * d.s, t = 0.6 + (d.D ?? 3) - 0.7;
  return { marker: [mx - e.n[0] * 3, h.floor + 1.4, mz - e.n[1] * 3], view: [mx + e.n[0] * t, h.floor + 1.1, mz + e.n[1] * t] };
};
/** In the sunken lane of the hotel's entrance, facing the tunnel mouth. */
const laneView = (): { marker: V; view: Pt } => {
  const h = PLAN.hotel, t = h?.tunnel;
  if (!h || !t) return hotelView();
  const f1 = h.floor + t.slope * t.t1, s = t.t2 - t.t1 > 5 ? t.t1 + 4.5 : t.t2 + 4;
  return { marker: [t.M[0] + t.n[0] * t.t1, f1 + 1.6, t.M[1] + t.n[1] * t.t1], view: at([t.M[0] + t.n[0] * s, t.M[1] + t.n[1] * s], 1) };
};
/** On the rim of a courtyard, opposite its entrance, looking down into it. */
const rimView = (pit: Pit | null, fb: [number, number]): { marker: V; view: Pt } => {
  if (!pit) return { marker: [fb[0], 400, fb[1]], view: at([fb[0] + 15, fb[1]], 1) };
  let dx = 1, dz = 0;
  if (pit.tunnel) { dx = -pit.tunnel.n[0]; dz = -pit.tunnel.n[1]; }
  // stand on the earth ridge round the rim, on that side
  const rim = Math.max(...pit.p.map((q) => (q[0] - pit.c[0]) * dx + (q[1] - pit.c[1]) * dz));
  const far: V = [pit.c[0] - dx * pit.r * 0.45, pit.floor + 1.2, pit.c[1] - dz * pit.r * 0.45];
  return { marker: far, view: at([pit.c[0] + dx * (rim + 0.45), pit.c[1] + dz * (rim + 0.45)], 1.5) };
};

/** Places to see. Positions come from OpenStreetMap. */
const HOTSPOTS: Hotspot[] = [
  {
    id: 'sididriss', get marker() { return hotelView().marker; }, get view() { return hotelView().view; }, fixedView: true, photo: 'sididriss',
    title: { en: 'Hotel Sidi Driss', fr: 'Hôtel Sidi Driss', ar: 'نزل سيدي إدريس' },
    text: {
      en: 'A family house of several courtyard pits joined by underground passages, now a hotel. In 1976 this courtyard was filmed as the home of Luke Skywalker in Star Wars, which made Matmata known around the world.',
      fr: 'Une maison familiale de plusieurs cours creusées, reliées par des passages souterrains, devenue hôtel. En 1976 cette cour a servi de décor à la maison de Luke Skywalker dans La Guerre des étoiles, ce qui a fait connaître Matmata dans le monde entier.',
      ar: 'دار عائلية من عدّة أحواش محفورة تصل بينها ممرّات تحت الأرض، صارت نُزُلًا. وفي سنة 1976 صُوِّر هذا الحوش بيتًا لِلوك سكايووكر في فيلم حرب النجوم، فعرف العالمُ مطماطة.',
    },
  },
  {
    id: 'room', get marker() { return roomView().marker; }, get view() { return roomView().view; }, fixedView: true, photo: 'room',
    title: { en: 'A room in the rock', fr: 'Une chambre dans la roche', ar: 'غرفة في الصخر' },
    text: {
      en: 'Vaulted rooms are dug into the soft rock all round the courtyard and lime-washed inside. Under several metres of earth they stay cool in the summer heat and mild on winter nights. The upper openings are granaries for grain and oil.',
      fr: 'Des pièces voûtées sont creusées dans la roche tendre tout autour de la cour et blanchies à la chaux. Sous plusieurs mètres de terre, elles restent fraîches en été et tièdes les nuits d’hiver. Les ouvertures du haut sont des greniers à grain et à huile.',
      ar: 'تُحفر حول الحوش غرف مقبّبة في الصخر اللين وتُطلى من الداخل بالجير. وتحت أمتار من التراب تبقى باردة في حرّ الصيف ومعتدلة في ليالي الشتاء. أمّا الفتحات العليا فمخازن للحبوب والزيت.',
    },
  },
  {
    id: 'sqifa', get marker() { return laneView().marker; }, get view() { return laneView().view; }, fixedView: true, photo: 'sqifa',
    title: { en: 'The entrance tunnel', fr: 'Le tunnel d’entrée', ar: 'السقيفة' },
    text: {
      en: 'The only way in is a sloping tunnel, the sqifa, dug from the hillside down to the courtyard. A sunken lane leads to its whitewashed mouth; inside, it was also a place to keep animals and to receive visitors.',
      fr: 'La seule entrée est un tunnel en pente, la skifa, creusé depuis le flanc de la colline jusqu’à la cour. Un chemin encaissé mène à sa bouche blanchie ; à l’intérieur, on y gardait aussi les bêtes et on y recevait les visiteurs.',
      ar: 'المدخل الوحيد نفق مائل يسمّى السقيفة، محفور من سفح التلّ نزولًا إلى الحوش. يؤدّي إليه ممرّ غائر حتى فوّهته المطليّة بالجير، وكان داخله أيضًا مكانًا للدوابّ ولاستقبال الزوّار.',
    },
  },
  {
    id: 'khadija', get marker() { return rimView(PLAN.museum, KHADIJA_POI).marker; }, get view() { return rimView(PLAN.museum, KHADIJA_POI).view; }, fixedView: true, photo: 'khadija',
    title: { en: 'Dar Khadija', fr: 'Dar Khadija', ar: 'دار خديجة' },
    text: {
      en: 'A troglodyte house kept as a small museum, furnished as a Berber family lived in it, with the tools of daily life in the rooms round the courtyard. Several families often shared one house, each with its own rooms.',
      fr: 'Une maison troglodyte devenue petit musée, meublée comme y vivait une famille berbère, avec les objets de la vie quotidienne dans les pièces autour de la cour. Souvent plusieurs familles partageaient une maison, chacune avec ses pièces.',
      ar: 'دار جوفية صارت متحفًا صغيرًا، مؤثّثة كما كانت تعيش فيها عائلة أمازيغية، بأدوات الحياة اليومية في الغرف حول الحوش. وكثيرًا ما تقاسمت عدّة أسر دارًا واحدة، لكلّ منها غرفها.',
    },
  },
  {
    id: 'ruin', get marker() { return rimView(PLAN.ruin, SIDI_DRISS_POI).marker; }, get view() { return rimView(PLAN.ruin, SIDI_DRISS_POI).view; }, fixedView: true, photo: 'ruin',
    title: { en: 'An abandoned courtyard', fr: 'Une cour abandonnée', ar: 'حوش مهجور' },
    text: {
      en: 'In 1969 weeks of rain soaked the soft rock and many pits collapsed. Many families moved to New Matmata, built on the plain to the north, and many courtyards have stood empty since. (This pit is generated, among the mapped ones.)',
      fr: 'En 1969, des semaines de pluie ont détrempé la roche tendre et beaucoup de cours se sont effondrées. Beaucoup de familles sont parties pour Matmata la Nouvelle, bâtie dans la plaine au nord, et bien des cours sont vides depuis. (Cette cour est générée, parmi celles de la carte.)',
      ar: 'في سنة 1969 أغرقت أسابيعُ من المطر الصخرَ اللين فانهار كثير من الأحواش. وانتقلت عائلات كثيرة إلى مطماطة الجديدة المبنيّة في السهل شمالًا، وبقيت أحواش كثيرة خالية منذ ذلك الحين. (هذا الحوش مولَّد بين الأحواش المسجّلة في الخريطة.)',
    },
  },
  {
    id: 'craters',
    get marker() { const [x, y, z] = PLAN.seen; return [x, y, z] as V; },
    get view() { return at(PLAN.high, 1); }, fixedView: true, photo: 'craters',
    title: { en: 'A village of craters', fr: 'Un village de cratères', ar: 'قرية من الحُفَر' },
    text: {
      en: 'Seen from the hills, Matmata is a field of round holes. Its Berber people dug their houses into the soft rock of the Dahar hills, sheltered from the heat and wind, with olive trees and palms in the hollows where the rain water gathers behind small earth dams (jessour).',
      fr: 'Vue des collines, Matmata est un champ de trous ronds. Ses habitants berbères ont creusé leurs maisons dans la roche tendre des monts du Dahar, à l’abri de la chaleur et du vent, avec des oliviers et des palmiers dans les creux où l’eau de pluie s’amasse derrière de petites digues de terre (jessour).',
      ar: 'من التلال تبدو مطماطة حقلًا من الحفر المستديرة. حفر سكّانها الأمازيغ دورهم في صخر جبال الظاهر اللين، بعيدًا عن الحرّ والريح، وغرسوا الزيتون والنخيل في المنخفضات حيث يتجمّع ماء المطر خلف سدود ترابية صغيرة تسمّى الجسور.',
    },
  },
  {
    id: 'mosque', marker: at(MOSQUE, 10), view: at([MOSQUE[0] + 25, MOSQUE[1] + 25], 1), photo: 'mosque',
    title: { en: 'The village above ground', fr: 'Le village en surface', ar: 'القرية فوق الأرض' },
    text: {
      en: 'The mosque, the shops and the newer stone houses of Matmata stand above ground, on the hill around which the pits are dug. Some families still live in their courtyards; others open them to visitors.',
      fr: 'La mosquée, les boutiques et les maisons de pierre plus récentes de Matmata sont en surface, sur la colline autour de laquelle les cours sont creusées. Quelques familles vivent encore dans leurs cours ; d’autres les ouvrent aux visiteurs.',
      ar: 'يقوم الجامع والدكاكين ودور الحجر الأحدث فوق الأرض، على التلّ الذي حُفرت حوله الأحواش. وما زالت بعض العائلات تسكن أحواشها، وأخرى تفتحها للزوّار.',
    },
  },
];

export const site: SiteDef = {
  id: 'matmata',
  lat: 33.5425, lon: 9.9705,
  northRotation: 0,
  info: {
    name: { en: 'Matmata troglodyte houses', fr: 'Maisons troglodytes de Matmata', ar: 'مساكن مطماطة' },
    facts: [
      { k: { en: 'Houses', fr: 'Maisons', ar: 'المساكن' }, v: { en: 'courtyards dug 6 to 9 m deep, with rooms in their walls', fr: 'cours creusées de 6 à 9 m, pièces dans leurs parois', ar: 'أحواش بعمق 6 إلى 9 م، وغرف في جدرانها' } },
      { k: { en: 'People', fr: 'Habitants', ar: 'السكّان' }, v: { en: 'Berber (Amazigh)', fr: 'Berbères (Amazighs)', ar: 'أمازيغ' } },
      { k: { en: 'Here', fr: 'Ici', ar: 'هنا' }, v: { en: 'Matmata el Qadima and Hotel Sidi Driss', fr: 'Matmata el Qadima et l’hôtel Sidi Driss', ar: 'مطماطة القديمة ونزل سيدي إدريس' } },
      { k: { en: 'Altitude', fr: 'Altitude', ar: 'الارتفاع' }, v: { en: 'about 400 m, in the Dahar hills', fr: 'environ 400 m, dans les monts du Dahar', ar: 'نحو 400 م، في جبال الظاهر' } },
    ],
    visit: [
      { k: { en: 'Getting there', fr: 'Accès', ar: 'الوصول' }, v: {
        en: 'About 45 km south-west of Gabès by road, through New Matmata; louages (shared taxis) run from Gabès.',
        fr: 'À environ 45 km au sud-ouest de Gabès par la route, en passant par Matmata la Nouvelle ; des louages partent de Gabès.',
        ar: 'على نحو 45 كم جنوب غرب قابس، مرورًا بمطماطة الجديدة، وتنطلق اللواجات من قابس.' } },
      { k: { en: 'Tickets', fr: 'Billets', ar: 'التذاكر' }, v: {
        en: 'Small fees for Hotel Sidi Driss and Dar Khadija; some families show their homes for a tip.',
        fr: 'De petites entrées pour l’hôtel Sidi Driss et Dar Khadija ; certaines familles font visiter leur maison contre un pourboire.',
        ar: 'رسوم بسيطة لنزل سيدي إدريس ودار خديجة، وبعض العائلات تُري دورها مقابل إكرامية.' } },
      { k: { en: 'Best time', fr: 'Meilleure période', ar: 'أفضل وقت' }, v: {
        en: 'Spring and autumn; in summer the courtyards are the coolest place to be at midday.',
        fr: 'Le printemps et l’automne ; en été, les cours sont l’endroit le plus frais à midi.',
        ar: 'الربيع والخريف، وفي الصيف تكون الأحواش أبرد مكان عند الظهيرة.' } },
    ],
    searchTerm: 'Matmata',
    intro: {
      en: 'The pit houses of a Berber village, dug into the hills: walk down the tunnels into their courtyards and rooms.',
      fr: 'Les maisons creusées d’un village berbère dans les collines : descendez par les tunnels dans leurs cours et leurs pièces.',
      ar: 'دور قرية أمازيغية محفورة في التلال: انزل عبر السقائف إلى أحواشها وغرفها.',
    },
    loading: { en: 'Digging the courtyards of Matmata…', fr: 'On creuse les cours de Matmata…', ar: 'جارٍ حفر أحواش مطماطة…' },
    note: {
      en: 'Terrain, roads and the 18 mapped courtyards come from real map data; more pits are generated around them, and rooms and tunnels are modelled from photos and simplified.',
      fr: 'Le relief, les routes et les 18 cours cartographiées viennent de vraies données ; d’autres cours sont générées autour, et les pièces et tunnels sont modélisés d’après des photos, simplifiés.',
      ar: 'التضاريس والطرق والأحواش الثمانية عشر المسجّلة من بيانات خرائط حقيقية، وأحواش أخرى مولّدة حولها، والغرف والسقائف منمذجة بتبسيط اعتمادًا على صور.',
    },
  },
  hotspots: HOTSPOTS,
  photos: 'matmata',
  build: buildMatmata,
  toVec: (p, built) => {
    if (Array.isArray(p)) return new THREE.Vector3(...p);
    if ('x' in p) return new THREE.Vector3(p.x, (built.groundAt?.(p.x, p.z) ?? 0) + p.h, p.z);
    return new THREE.Vector3(0, p.y, 0);
  },
  intro: { center: [-150, 400, 30], rx: 420, rz: 420, height: 170 },
  shadowClamp: 650,
  fog: 0.0007,
};
