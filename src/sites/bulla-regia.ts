import * as THREE from 'three';
import { APOLLO, FORT, FORUM_C, MEMMIA, THEATRE, VILLAS, buildBullaRegia, type Villa } from '../monuments/bulla-regia/build';
import type { Hotspot, SiteDef } from './types';

const at = (p: [number, number], h: number) => ({ x: p[0], z: p[1], h });
type V3 = [number, number, number];
// points in a house's underground frame (its floor level is only known once the scene is built)
const pt = (V: Villa | undefined, a: number, b: number, dy: number): V3 => {
  if (!V) return [0, 200, 0];
  return [V.c[0] + V.u[0] * a + V.v[0] * b, (V.F ?? 190) + dy, V.c[1] + V.u[1] * a + V.v[1] * b];
};
const villa = (re: RegExp) => VILLAS.find((v) => re.test(v.name.source));
const HUNT = () => villa(/chasse/), AMPH = () => villa(/Amphitrite/), FISH = () => villa(/che/);
const T = THEATRE, toStage = (d: number): [number, number] => [T.c[0] + T.open[0] * d, T.c[1] + T.open[1] * d];

/** Places to see. Positions come from OpenStreetMap. */
const HOTSPOTS: Hotspot[] = [
  {
    // in a corner of the portico, looking across the light well
    id: 'hunt',
    get marker() { const V = HUNT(); return pt(V, (V?.cw ?? 6) / 2, (V?.cl ?? 6) / 2, 2.2); },
    get view() { const V = HUNT(); return pt(V, -(V?.W ?? 14) / 2 + 1.2, -(V?.L ?? 14) / 2 + 1.4, 1); },
    fixedView: true, photo: 'hunt',
    title: { en: 'House of the Hunt', fr: 'Maison de la Chasse', ar: 'دار الصيد' },
    text: {
      en: 'Its underground floor is a courtyard lit by a light well, with Corinthian columns carrying stone architraves. Wealthy families of Bulla Regia dug such floors to escape the summer heat of the plain. The house is named after a hunting mosaic on its upper floor.',
      fr: 'Son étage souterrain est une cour éclairée par un puits de lumière, avec des colonnes corinthiennes portant des architraves de pierre. Les riches familles de Bulla Regia creusaient ces étages pour fuir la chaleur estivale de la plaine. La maison doit son nom à une mosaïque de chasse de l’étage supérieur.',
      ar: 'طابقها تحت الأرض صحن يضيئه بئر للضوء، تحمل فيه أعمدة كورنثية عتبات من الحجر. وكانت العائلات الثريّة في بلاريجيا تحفر هذه الطوابق هربًا من حرّ السهل صيفًا. وسُمّيت الدار باسم فسيفساء صيد في طابقها العلوي.',
    },
  },
  {
    // in the main underground room, looking down the mosaic
    id: 'amphitrite',
    get marker() { const V = AMPH(); return pt(V, 0, (V?.L ?? 13) / 2 + (V?.rd ?? 6) * 0.7, 0); },
    get view() { const V = AMPH(); return pt(V, 0, (V?.L ?? 13) / 2 - 0.8, 1); },
    fixedView: true, photo: 'amphitrite',
    title: { en: 'House of Amphitrite', fr: 'Maison d’Amphitrite', ar: 'دار أمفيتريت' },
    text: {
      en: 'Its underground room holds the most famous mosaic of the site: Venus carried over the sea by two sea-centaurs, long taken for the sea-goddess Amphitrite, hence the name. The floor here is a generated pattern; the photo shows the real mosaic, still in place.',
      fr: 'Sa salle souterraine abrite la plus célèbre mosaïque du site : Vénus portée sur la mer par deux centaures marins, longtemps prise pour la déesse marine Amphitrite, d’où le nom. Le sol est ici un motif généré ; la photo montre la vraie mosaïque, restée en place.',
      ar: 'تضمّ قاعتها تحت الأرض أشهر فسيفساء في الموقع: فينوس يحملها على البحر قنطوران بحريّان، وقد ظُنّت طويلًا الإلهةَ البحرية أمفيتريت، ومن هنا الاسم. الأرضية هنا زخرفة مولّدة، والصورة تُظهر الفسيفساء الحقيقية في مكانها.',
    },
  },
  {
    id: 'fishing',
    get marker() { const V = FISH(); return pt(V, 0, 0, 2); },
    get view() { const V = FISH(); return pt(V, (V?.W ?? 13) / 2 - 1.2, (V?.L ?? 13) / 2 - 1.2, 1); },
    fixedView: true, photo: 'fishing',
    title: { en: 'House of the Fishing', fr: 'Maison de la Pêche', ar: 'دار الصيد البحري' },
    text: {
      en: 'Thought to be the earliest of the underground houses. Beside a fountain in its basement, a small room has a mosaic of fishermen at work among fish and sea creatures.',
      fr: 'Considérée comme la plus ancienne des maisons souterraines. Près d’une fontaine du sous-sol, une petite salle garde une mosaïque de pêcheurs au travail parmi les poissons et les créatures marines.',
      ar: 'تُعدّ أقدم الدور ذات الطوابق الجوفية. وبجانب نافورة في طابقها السفلي غرفة صغيرة فيها فسيفساء لصيّادين يعملون بين الأسماك وكائنات البحر.',
    },
  },
  {
    id: 'theatre', marker: at(toStage(-22), 7), view: at(toStage(2), 1), fixedView: true, photo: 'theatre',
    title: { en: 'The theatre', fr: 'Le théâtre', ar: 'المسرح' },
    text: {
      en: 'Built under Marcus Aurelius and Lucius Verus (161–169 CE), on flat ground with its seats carried on vaults. A 4th-century mosaic of a bear lies in the orchestra. Around 399 Saint Augustine preached here, scolding the townspeople for their love of the shows.',
      fr: 'Bâti sous Marc Aurèle et Lucius Verus (161-169), sur un terrain plat, ses gradins portés par des voûtes. Une mosaïque d’ours du IVe siècle orne l’orchestre. Vers 399, saint Augustin y prêcha, reprochant aux habitants leur goût des spectacles.',
      ar: 'بُني في عهد ماركوس أوريليوس ولوكيوس فيروس (161-169م) على أرض مستوية، تحمل مدرّجاتِه أقبية. وفي الأوركسترا فسيفساء دبّ من القرن الرابع. ونحو سنة 399 وعظ فيه القدّيس أوغسطين، لائمًا السكّان على ولعهم بالعروض.',
    },
  },
  {
    id: 'forum', marker: at(APOLLO, 5), view: at(FORUM_C, 1), fixedView: true, photo: 'forum',
    title: { en: 'The forum', fr: 'Le forum', ar: 'الساحة العامة' },
    text: {
      en: 'The paved square at the heart of the town, with the Temple of Apollo on one side and the Capitol on another. Bulla Regia was a royal city of the Numidian kings, hence its name, before it became Roman.',
      fr: 'La place dallée au cœur de la ville, avec le temple d’Apollon d’un côté et le Capitole de l’autre. Bulla Regia fut une ville royale des rois numides, d’où son nom, avant de devenir romaine.',
      ar: 'الساحة المبلّطة في قلب المدينة، يطلّ عليها معبد أبولون من جهة والكابيتول من جهة أخرى. كانت بلاريجيا مدينة ملكية لملوك نوميديا، ومن هنا اسمها، قبل أن تصير رومانية.',
    },
  },
  {
    id: 'baths', marker: at(MEMMIA, 5), view: at([MEMMIA[0] + 35, MEMMIA[1] - 20], 1), photo: 'baths',
    title: { en: 'Baths of Julia Memmia', fr: 'Thermes de Julia Memmia', ar: 'حمّامات جوليا ميميا' },
    text: {
      en: 'The largest baths of the town, near the entrance, where high walls and arches of the halls still stand.',
      fr: 'Les plus grands thermes de la ville, près de l’entrée, dont les hauts murs et les arcs des salles sont encore debout.',
      ar: 'أكبر حمّامات المدينة قرب المدخل، وما زالت جدران قاعاتها العالية وأقواسها قائمة.',
    },
  },
  {
    id: 'fort', marker: at(FORT, 4), view: at([FORT[0] + 30, FORT[1] + 10], 1), // (no free photo of the fort found)
    title: { en: 'The Byzantine fort', fr: 'Le fort byzantin', ar: 'الحصن البيزنطي' },
    text: {
      en: 'In the 6th century, when the town had shrunk, the Byzantines built a small fort here from the stones of older buildings.',
      fr: 'Au VIe siècle, quand la ville s’était réduite, les Byzantins bâtirent ici un petit fort avec les pierres d’édifices plus anciens.',
      ar: 'في القرن السادس، حين تقلّصت المدينة، بنى البيزنطيون هنا حصنًا صغيرًا بحجارة مبانٍ أقدم.',
    },
  },
];

export const site: SiteDef = {
  id: 'bulla-regia',
  lat: 36.55884, lon: 8.75482,
  northRotation: 0,
  info: {
    name: { en: 'Bulla Regia', fr: 'Bulla Regia', ar: 'بلاريجيا' },
    facts: [
      { k: { en: 'Known for', fr: 'Célèbre pour', ar: 'تشتهر بـ' }, v: { en: 'houses with underground floors', fr: 'ses maisons à étage souterrain', ar: 'دورها ذات الطوابق الجوفية' } },
      { k: { en: 'Before Rome', fr: 'Avant Rome', ar: 'قبل روما' }, v: { en: 'a royal city of the Numidian kings', fr: 'ville royale des rois numides', ar: 'مدينة ملكية لملوك نوميديا' } },
      { k: { en: 'Theatre', fr: 'Théâtre', ar: 'المسرح' }, v: { en: '161–169 CE', fr: '161-169', ar: '161-169م' } },
      { k: { en: 'Where', fr: 'Où', ar: 'الموقع' }, v: { en: 'at the foot of Jebel Rebia, near Jendouba', fr: 'au pied du djebel Rebia, près de Jendouba', ar: 'عند سفح جبل ربيعة قرب جندوبة' } },
    ],
    visit: [
      { k: { en: 'Getting there', fr: 'Accès', ar: 'الوصول' }, v: {
        en: 'About 6 km north of Jendouba; louages and taxis run from Jendouba, which has trains and buses from Tunis.',
        fr: 'À environ 6 km au nord de Jendouba ; louages et taxis depuis Jendouba, desservie par train et bus depuis Tunis.',
        ar: 'على نحو 6 كم شمال جندوبة، باللواج أو بسيارة أجرة من جندوبة التي يصلها القطار والحافلة من تونس.' } },
      { k: { en: 'Tickets', fr: 'Billets', ar: 'التذاكر' }, v: {
        en: 'An entry fee; the small museum is at the entrance. Bring a torch for the underground rooms.',
        fr: 'Entrée payante ; le petit musée est à l’entrée. Prenez une lampe pour les salles souterraines.',
        ar: 'الدخول بمقابل، والمتحف الصغير عند المدخل. خذ معك مصباحًا للقاعات الجوفية.' } },
      { k: { en: 'Best time', fr: 'Meilleure période', ar: 'أفضل وقت' }, v: {
        en: 'Spring, when the plain is green; in summer, do as the Romans did and go underground at midday.',
        fr: 'Le printemps, quand la plaine est verte ; en été, faites comme les Romains et descendez sous terre à midi.',
        ar: 'الربيع حين يخضرّ السهل، وفي الصيف افعل كالرومان وانزل تحت الأرض عند الظهيرة.' } },
    ],
    searchTerm: 'Bulla Regia',
    intro: {
      en: 'A Roman town whose rich houses had a second floor under the ground: walk down into their columned courtyards and mosaic rooms.',
      fr: 'Une ville romaine dont les riches maisons avaient un second étage sous terre : descendez dans leurs cours à colonnes et leurs salles à mosaïques.',
      ar: 'مدينة رومانية كان لدورها الثريّة طابق ثانٍ تحت الأرض: انزل إلى صحونها ذات الأعمدة وقاعاتها المزيّنة بالفسيفساء.',
    },
    loading: { en: 'Digging out the villas of Bulla Regia…', fr: 'On dégage les villas de Bulla Regia…', ar: 'جارٍ كشف دور بلاريجيا…' },
    note: {
      en: 'Terrain, paths and the outline of every ruin come from real map data; the underground floors are modelled from photos and simplified, and the mosaics are generated patterns.',
      fr: 'Le relief, les chemins et le contour de chaque ruine viennent de vraies données cartographiques ; les étages souterrains sont modélisés d’après des photos, simplifiés, et les mosaïques sont des motifs générés.',
      ar: 'التضاريس والممرّات وحدود كل أثر من بيانات خرائط حقيقية، والطوابق الجوفية منمذجة بتبسيط اعتمادًا على صور، والفسيفساء زخارف مولّدة.',
    },
  },
  hotspots: HOTSPOTS,
  photos: 'bulla-regia',
  build: buildBullaRegia,
  toVec: (p, built) => {
    if (Array.isArray(p)) return new THREE.Vector3(...p);
    if ('x' in p) return new THREE.Vector3(p.x, (built.groundAt?.(p.x, p.z) ?? 0) + p.h, p.z);
    return new THREE.Vector3(0, p.y, 0);
  },
  intro: { center: [-40, 170, -60], rx: 300, rz: 300, height: 120 },
  shadowClamp: 560,
  fog: 0.0007,
};
