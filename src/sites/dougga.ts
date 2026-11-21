import * as THREE from 'three';
import { CAPITOL, JUNO, MAUSOLEUM, SQUARE_OF_WINDS, THEATRE, buildDougga } from '../monuments/dougga/build';
import type { Hotspot, SiteDef } from './types';

/** Places to see. Positions come from OpenStreetMap outlines. */
const HOTSPOTS: Hotspot[] = [
  {
    id: 'capitol', marker: { x: CAPITOL.c[0], z: CAPITOL.c[1], h: 16 },
    view: { x: CAPITOL.c[0] + CAPITOL.front[0] * 42, z: CAPITOL.c[1] + CAPITOL.front[1] * 42, h: 1 }, photo: 'capitol',
    title: { en: 'The Capitol', fr: 'Le Capitole', ar: 'الكابيتول' },
    text: {
      en: 'Dedicated in 166–167 CE to Jupiter, Juno and Minerva for the health of the emperors Marcus Aurelius and Lucius Verus. Its porch of Corinthian columns and pediment still stand to almost full height, the emblem of Dougga.',
      fr: 'Dédié en 166–167 à Jupiter, Junon et Minerve pour le salut des empereurs Marc Aurèle et Lucius Verus. Son porche de colonnes corinthiennes et son fronton tiennent encore presque à pleine hauteur : c’est l’emblème de Dougga.',
      ar: 'كُرّس سنة 166–167م لجوبيتر وجونو ومينرفا من أجل سلامة الإمبراطورين ماركوس أوريليوس ولوكيوس فيروس. ولا يزال رواقه بأعمدته الكورنثية وجبهته قائمًا بكامل ارتفاعه تقريبًا، وهو رمز دقة.',
    },
  },
  {
    id: 'winds', marker: { x: SQUARE_OF_WINDS[0], z: SQUARE_OF_WINDS[1], h: 1.2 }, view: { x: 40, z: 1, h: 1 }, fixedView: true, photo: 'winds',
    title: { en: 'Square of the Winds', fr: 'La place de la Rose des Vents', ar: 'ساحة وردة الرياح' },
    text: {
      en: 'A paved square beside the forum, named after the compass rose carved into its slabs: a circle with the names of twelve winds, such as Septentrio, Africus and Aquilo. Merchants and citizens met here between the temples.',
      fr: 'Une place dallée près du forum, nommée d’après la rose des vents gravée dans ses dalles : un cercle portant les noms de douze vents, comme Septentrio, Africus ou Aquilo. Marchands et citoyens s’y retrouvaient entre les temples.',
      ar: 'ساحة مبلّطة قرب الساحة العامة، سُمّيت نسبة إلى وردة الرياح المنقوشة في بلاطها: دائرة تحمل أسماء اثنتي عشرة ريحًا مثل سبتنتريو وأفريكوس وأكويلو. كان التجار والمواطنون يلتقون فيها بين المعابد.',
    },
  },
  {
    // sitting high on the seats, looking down at the stage and the valley beyond
    id: 'theatre', marker: { x: THEATRE.c[0] + THEATRE.open[0] * 10, z: THEATRE.c[1] + THEATRE.open[1] * 10, h: 2 },
    view: { x: THEATRE.c[0] - THEATRE.open[0] * 24, z: THEATRE.c[1] - THEATRE.open[1] * 24, h: 7.5 }, fixedView: true, photo: 'theatre',
    title: { en: 'The theatre', fr: 'Le théâtre', ar: 'المسرح' },
    text: {
      en: 'Built in 168–169 CE by a rich citizen, Publius Marcius Quadratus, for about 3,500 spectators. The seats are cut into the hillside and the stage looks over the valley; every summer it hosts a festival of classical theatre.',
      fr: 'Bâti en 168–169 par un riche citoyen, Publius Marcius Quadratus, pour environ 3 500 spectateurs. Les gradins sont taillés dans la colline et la scène domine la vallée ; chaque été il accueille un festival de théâtre classique.',
      ar: 'شيّده سنة 168–169م مواطن ثري هو بوبليوس ماركيوس كوادراتوس، ويتّسع لنحو 3500 متفرّج. المدرّجات منحوتة في السفح والخشبة تطلّ على الوادي، ويحتضن كل صيف مهرجانًا للمسرح الكلاسيكي.',
    },
  },
  {
    id: 'juno', marker: { x: JUNO.c[0], z: JUNO.c[1], h: 9 },
    view: { x: JUNO.c[0] + JUNO.front[0] * (JUNO.R + 12), z: JUNO.c[1] + JUNO.front[1] * (JUNO.R + 12), h: 1 }, photo: 'juno',
    title: { en: 'Temple of Juno Caelestis', fr: 'Le temple de Junon Caelestis', ar: 'معبد جونو سيليستيس' },
    text: {
      en: 'Built under Severus Alexander (222–235 CE) for Caelestis, the Roman form of the Punic goddess Tanit. The temple stands in a half-moon court lined with columns, a shape that recalls the crescent of the goddess.',
      fr: 'Bâti sous Sévère Alexandre (222–235) pour Caelestis, forme romaine de la déesse punique Tanit. Le temple se dresse dans une cour en demi-lune bordée de colonnes, forme qui rappelle le croissant de la déesse.',
      ar: 'شُيّد في عهد سيفيروس ألكسندر (222–235م) لسيليستيس، الصورة الرومانية للإلهة البونيقية تانيت. يقوم المعبد في فناء على شكل نصف قمر تحيط به الأعمدة، شكل يذكّر بهلال الإلهة.',
    },
  },
  {
    id: 'mausoleum', marker: { x: MAUSOLEUM[0], z: MAUSOLEUM[1], h: 9 }, view: { x: MAUSOLEUM[0] + 6, z: MAUSOLEUM[1] - 34, h: 1 }, photo: 'mausoleum',
    title: { en: 'The Libyco-Punic mausoleum', fr: 'Le mausolée libyco-punique', ar: 'الضريح الليبي البونيقي' },
    text: {
      en: 'A tower tomb of the 2nd century BCE, about 21 m tall, from the time of the Numidian kings. Its bilingual inscription in Libyc and Punic was cut out in 1842 and is now in the British Museum; the monument was rebuilt from its fallen stones in 1908–1910.',
      fr: 'Un tombeau-tour du IIe siècle av. J.-C., haut d’environ 21 m, du temps des rois numides. Son inscription bilingue libyque et punique fut arrachée en 1842 et se trouve au British Museum ; le monument a été remonté avec ses pierres tombées en 1908–1910.',
      ar: 'ضريح برجي من القرن الثاني ق.م، بارتفاع نحو 21 م، من زمن الملوك النوميديين. اقتُلع نقشه الثنائي اللغة، الليبي والبونيقي، سنة 1842 وهو اليوم في المتحف البريطاني، وأُعيد بناء المعلم بحجارته المتساقطة بين 1908 و1910.',
    },
  },
  {
    id: 'arch', marker: { x: -120, z: -51, h: 7 }, view: { x: -97, z: -51, h: 1 }, photo: 'arch',
    title: { en: 'Arch of Severus Alexander', fr: 'L’arc de Sévère Alexandre', ar: 'قوس سيفيروس ألكسندر' },
    text: {
      en: 'A single-bay arch at the western edge of town, raised in the 3rd century in honour of the emperor Severus Alexander. Another arch, for Septimius Severus, marks the road to Carthage on the east side.',
      fr: 'Un arc à une baie à l’ouest de la ville, élevé au IIIe siècle en l’honneur de l’empereur Sévère Alexandre. Un autre arc, pour Septime Sévère, marque la route de Carthage à l’est.',
      ar: 'قوس بفتحة واحدة عند الطرف الغربي للمدينة، أُقيم في القرن الثالث تكريمًا للإمبراطور سيفيروس ألكسندر. وقوس آخر لسبتيموس سيفيروس يعلّم طريق قرطاج في الشرق.',
    },
  },
  {
    id: 'baths', marker: { x: 78, z: 87, h: 6 }, view: { x: 62, z: 64, h: 1 }, photo: 'baths',
    title: { en: 'The Licinian Baths', fr: 'Les thermes liciniens', ar: 'الحمّامات الليسينية' },
    text: {
      en: 'Winter baths of the 3rd century, paid for by the Licinii family. Their walls stand high, and a long vaulted service corridor still runs beneath the halls where slaves stoked the furnaces.',
      fr: 'Thermes d’hiver du IIIe siècle, financés par la famille des Licinii. Leurs murs sont encore hauts, et un long couloir de service voûté passe toujours sous les salles, là où les esclaves alimentaient les fours.',
      ar: 'حمّامات شتوية من القرن الثالث موّلتها عائلة الليسينيين. جدرانها لا تزال عالية، ويمتد تحت قاعاتها ممرّ خدمة طويل مقبّب كان العبيد يوقدون منه الأفران.',
    },
  },
  {
    id: 'saturn', marker: { x: 210, z: -305, h: 8 }, view: { x: 205, z: -272, h: 1 }, photo: 'saturn',
    title: { en: 'Temple of Saturn', fr: 'Le temple de Saturne', ar: 'معبد ساتورن' },
    text: {
      en: 'Built in 195 CE at the north-east edge of the town, over an older sanctuary of the Punic god Baal Hammon. A few columns of its porch stand against the sky above the valley.',
      fr: 'Bâti en 195 à l’extrémité nord-est de la ville, sur un sanctuaire plus ancien du dieu punique Baal Hammon. Quelques colonnes de son porche se découpent sur le ciel au-dessus de la vallée.',
      ar: 'شُيّد سنة 195م عند الطرف الشمالي الشرقي للمدينة، فوق معبد أقدم للإله البونيقي بعل حمون. ولا تزال بضعة أعمدة من رواقه منتصبة في السماء فوق الوادي.',
    },
  },
];

export const site: SiteDef = {
  id: 'dougga',
  lat: 36.4228, lon: 9.2182,
  northRotation: 0,
  info: {
    name: { en: 'Dougga', fr: 'Dougga', ar: 'دقة' },
    facts: [
      { k: { en: 'Ancient name', fr: 'Nom antique', ar: 'الاسم القديم' }, v: { en: 'Thugga, a Numidian then Roman town', fr: 'Thugga, ville numide puis romaine', ar: 'توقة، مدينة نوميدية ثم رومانية' } },
      { k: { en: 'Area', fr: 'Superficie', ar: 'المساحة' }, v: { en: 'about 70 ha on a hillside at 570 m', fr: 'environ 70 ha à flanc de colline, à 570 m', ar: 'نحو 70 هكتارًا على سفح تل بارتفاع 570 م' } },
      { k: { en: 'Capitol', fr: 'Capitole', ar: 'الكابيتول' }, v: { en: '166–167 CE', fr: '166–167', ar: '166–167م' } },
      { k: { en: 'UNESCO', fr: 'UNESCO', ar: 'اليونسكو' }, v: { en: 'World Heritage since 1997', fr: 'Patrimoine mondial depuis 1997', ar: 'تراث عالمي منذ 1997' } },
    ],
    visit: [
      { k: { en: 'Getting there', fr: 'Accès', ar: 'الوصول' }, v: {
        en: 'About 110 km south-west of Tunis, near Téboursouk (Béja governorate). By car, or louage to Téboursouk and a taxi for the last few kilometres.',
        fr: 'À environ 110 km au sud-ouest de Tunis, près de Téboursouk (gouvernorat de Béja). En voiture, ou en louage jusqu’à Téboursouk puis taxi pour les derniers kilomètres.',
        ar: 'على بعد نحو 110 كم جنوب غرب تونس، قرب تبرسق (ولاية باجة). بالسيارة، أو باللواج إلى تبرسق ثم سيارة أجرة للكيلومترات الأخيرة.' } },
      { k: { en: 'Tickets', fr: 'Billets', ar: 'التذاكر' }, v: {
        en: 'Pay at the entrance. The site is large and hilly: allow at least three hours. Check current prices and hours.',
        fr: 'Billet à l’entrée. Le site est vaste et vallonné : comptez au moins trois heures. Vérifiez prix et horaires.',
        ar: 'تُدفع التذكرة عند المدخل. الموقع واسع ومتعرّج: خصّص ثلاث ساعات على الأقل. تحقّق من الأسعار والمواعيد.' } },
      { k: { en: 'Best time', fr: 'Meilleure période', ar: 'أفضل وقت' }, v: {
        en: 'Spring, when the fields are green and flowers grow among the stones. There is little shade: bring water and good shoes.',
        fr: 'Le printemps, quand les champs sont verts et que les fleurs poussent entre les pierres. Peu d’ombre : prévoyez de l’eau et de bonnes chaussures.',
        ar: 'الربيع، حين تخضرّ الحقول وتنبت الأزهار بين الحجارة. الظل قليل: احمل الماء وحذاءً مريحًا.' } },
    ],
    searchTerm: 'Dougga',
    intro: {
      en: 'A whole Roman town on its hillside: the Capitol, the theatre, temples, baths and a Numidian mausoleum, on the real terrain.',
      fr: 'Toute une ville romaine sur sa colline : le Capitole, le théâtre, les temples, les thermes et un mausolée numide, sur le vrai relief.',
      ar: 'مدينة رومانية كاملة على سفحها: الكابيتول والمسرح والمعابد والحمّامات وضريح نوميدي، على التضاريس الحقيقية.',
    },
    loading: { en: 'Climbing the hill of Thugga…', fr: 'On gravit la colline de Thugga…', ar: 'جارٍ صعود تل توقة…' },
    note: {
      en: 'Terrain and monument outlines come from real map data; the ruins are modelled from published plans and photos and simplified.',
      fr: 'Le relief et les contours des monuments viennent de vraies données cartographiques ; les ruines sont modélisées d’après des plans publiés et des photos, simplifiées.',
      ar: 'التضاريس وحدود المعالم من بيانات خرائط حقيقية، والآثار منمذجة بتبسيط اعتمادًا على مخططات منشورة وصور.',
    },
  },
  hotspots: HOTSPOTS,
  photos: 'dougga',
  build: buildDougga,
  toVec: (p, built) => {
    if (Array.isArray(p)) return new THREE.Vector3(...p);
    if ('x' in p) return new THREE.Vector3(p.x, (built.groundAt?.(p.x, p.z) ?? 0) + p.h, p.z);
    return new THREE.Vector3(0, p.y, 0);
  },
  intro: { center: [40, 565, 0], rx: 380, rz: 340, height: 160 },
  shadowClamp: 600,
  fog: 0.0006,
};
