import * as THREE from 'three';
import { ANTONINE, BATHS, BELLATOR, FORT, FO_W, TEMPLES, TETRARCHY, THEATRE_SPEC, VITALIS, buildSbeitla, fo } from '../monuments/sbeitla/build';
import type { Hotspot, SiteDef } from './types';

const at = (p: [number, number], h: number) => ({ x: p[0], z: p[1], h });
const T = THEATRE_SPEC;

/** Places to see. Positions come from OpenStreetMap; inside the forum, from its plan. */
const HOTSPOTS: Hotspot[] = [
  {
    // in the forum square, facing the three temples
    id: 'temples', marker: at(TEMPLES[1], 13), view: at(fo(12, FO_W / 2), 1), fixedView: true, photo: 'temples',
    title: { en: 'The three temples', fr: 'Les trois temples', ar: 'المعابد الثلاثة' },
    text: {
      en: 'Instead of a single Capitol, Sufetula built three separate temples side by side in the 2nd century, for Jupiter, Juno and Minerva, linked by arches. They are among the best-preserved Roman temples in North Africa.',
      fr: 'Au lieu d’un Capitole unique, Sufetula bâtit au IIe siècle trois temples séparés côte à côte, pour Jupiter, Junon et Minerve, reliés par des arcs. Ce sont parmi les temples romains les mieux conservés d’Afrique du Nord.',
      ar: 'بدل كابيتول واحد، شيّدت سوفيتولا في القرن الثاني ثلاثة معابد منفصلة متجاورة لجوبيتر وجونو ومينرفا، تصل بينها أقواس. وهي من أحسن المعابد الرومانية حفظًا في شمال إفريقيا.',
    },
  },
  {
    id: 'antonine', marker: at(ANTONINE, 9), view: at(fo(-30, 40), 1), fixedView: true, photo: 'antonine',
    title: { en: 'The Antonine gate', fr: 'La porte antonine', ar: 'الباب الأنطوني' },
    text: {
      en: 'The monumental entrance to the forum, a gate of three arches dedicated in 139 CE to the emperor Antoninus Pius and his adopted sons. Through it, the three temples appear framed at the end of the square.',
      fr: 'L’entrée monumentale du forum, une porte à trois arches dédiée en 139 à l’empereur Antonin le Pieux et à ses fils adoptifs. À travers elle, les trois temples apparaissent encadrés au fond de la place.',
      ar: 'المدخل الضخم للساحة العامة، باب بثلاثة أقواس كُرّس سنة 139م للإمبراطور أنطونيوس بيوس وابنيه بالتبنّي. ومن خلاله تظهر المعابد الثلاثة مؤطَّرة في آخر الساحة.',
    },
  },
  {
    id: 'tetrarchy', marker: at(TETRARCHY, 8), view: at([TETRARCHY[0] + 6, TETRARCHY[1] + 30], 1), photo: 'tetrarchy',
    title: { en: 'Arch of the Tetrarchy', fr: 'L’arc de la Tétrarchie', ar: 'قوس الحكم الرباعي' },
    text: {
      en: 'A triumphal arch of about 300 CE, at the southern entrance of the town, dedicated to the four emperors who then shared the empire, Diocletian and Maximian with their deputies.',
      fr: 'Un arc de triomphe d’environ 300, à l’entrée sud de la ville, dédié aux quatre empereurs qui se partageaient alors l’empire, Dioclétien et Maximien avec leurs césars.',
      ar: 'قوس نصر من نحو سنة 300م عند المدخل الجنوبي للمدينة، كُرّس للأباطرة الأربعة الذين اقتسموا الإمبراطورية آنذاك، ديوكلتيانوس وماكسيميانوس ونائبيهما.',
    },
  },
  {
    // high on the seats, looking down at the stage and the wadi
    id: 'theatre', marker: at([T.c[0] + T.open[0] * 8, T.c[1] + T.open[1] * 8], 2),
    view: at([T.c[0] - T.open[0] * 20, T.c[1] - T.open[1] * 20], 6.5), fixedView: true, photo: 'theatre',
    title: { en: 'The theatre', fr: 'Le théâtre', ar: 'المسرح' },
    text: {
      en: 'Built on the bank of the wadi, with the river behind the stage. Some columns of the stage front have been raised again; the theatre hosts the Sbeitla spring festival.',
      fr: 'Bâti au bord de l’oued, avec la rivière derrière la scène. Quelques colonnes du front de scène ont été relevées ; le théâtre accueille le festival du printemps de Sbeïtla.',
      ar: 'شُيّد على ضفة الوادي والنهر خلف الخشبة. وأُعيد نصب بعض أعمدة واجهة الخشبة، ويحتضن المسرح مهرجان ربيع سبيطلة.',
    },
  },
  {
    id: 'vitalis', marker: at(VITALIS, 3), view: at([VITALIS[0] + 18, VITALIS[1] + 14], 1), photo: 'vitalis',
    title: { en: 'Church of Vitalis', fr: 'L’église de Vitalis', ar: 'كنيسة فيتاليس' },
    text: {
      en: 'A large Christian basilica of the 5th–6th century with five aisles. Its baptistery keeps a baptismal font lined with bright mosaics of crosses, fish and candles.',
      fr: 'Une grande basilique chrétienne des Ve–VIe siècles à cinq nefs. Son baptistère conserve une cuve baptismale revêtue de mosaïques vives de croix, de poissons et de cierges.',
      ar: 'كنيسة مسيحية كبيرة من القرنين الخامس والسادس بخمسة أروقة. ولا يزال حوض التعميد في معموديتها مكسوًّا بفسيفساء زاهية من صلبان وأسماك وشموع.',
    },
  },
  {
    id: 'bellator', marker: at(BELLATOR, 3), view: at([BELLATOR[0] + 16, BELLATOR[1] + 12], 1), photo: 'bellator',
    title: { en: 'Church of Bellator', fr: 'L’église de Bellator', ar: 'كنيسة بيلاتور' },
    text: {
      en: 'One of the great churches of the town centre, named after Bellator, who appears in an inscription. Its columns still mark the nave and aisles; beside it stands the small chapel of Bishop Jucundus.',
      fr: 'L’une des grandes églises du centre de la ville, nommée d’après Bellator, cité dans une inscription. Ses colonnes dessinent encore la nef et les bas-côtés ; à côté se trouve la petite chapelle de l’évêque Jucundus.',
      ar: 'إحدى الكنائس الكبرى في وسط المدينة، سُمّيت باسم بيلاتور الوارد في نقش. ولا تزال أعمدتها ترسم الرواق الأوسط والجانبيين، وبجانبها كنيسة صغيرة للأسقف يوكوندوس.',
    },
  },
  {
    id: 'baths', marker: at(BATHS, 3), view: at([BATHS[0] - 14, BATHS[1] - 48], 1), photo: 'baths',
    title: { en: 'The great baths', fr: 'Les grands thermes', ar: 'الحمّامات الكبرى' },
    text: {
      en: 'Public baths with cold, warm and hot rooms, a palaestra for exercise, and floors on small brick pillars so that hot air from the furnaces could run underneath.',
      fr: 'Des thermes publics avec salles froides, tièdes et chaudes, une palestre pour l’exercice, et des sols posés sur de petits piliers de brique pour que l’air chaud des fours circule dessous.',
      ar: 'حمّامات عامة بقاعات باردة ودافئة وساخنة وساحة للرياضة، وأرضيات على أعمدة صغيرة من الآجرّ ليجري الهواء الساخن من الأفران تحتها.',
    },
  },
  {
    id: 'fort', marker: at(FORT, 7), view: at([FORT[0] - 40, FORT[1] - 20], 1), photo: 'fort',
    title: { en: 'The Byzantine forts', fr: 'Les fortins byzantins', ar: 'الحصون البيزنطية' },
    text: {
      en: 'In the 6th and 7th centuries, the Byzantines turned houses and buildings of the old town into small forts. In 647 the first Arab army defeated the exarch Gregory near Sufetula, the start of the Muslim conquest of Ifriqiya.',
      fr: 'Aux VIe et VIIe siècles, les Byzantins transformèrent des maisons et édifices de la vieille ville en petits fortins. En 647, la première armée arabe vainquit l’exarque Grégoire près de Sufetula, début de la conquête musulmane de l’Ifriqiya.',
      ar: 'في القرنين السادس والسابع حوّل البيزنطيون منازل ومباني المدينة القديمة إلى حصون صغيرة. وفي سنة 647 هزم أول جيش عربي البطريق جرجير قرب سبيطلة، فكانت بداية الفتح الإسلامي لإفريقية.',
    },
  },
];

export const site: SiteDef = {
  id: 'sbeitla',
  lat: 35.2400, lon: 9.1195,
  northRotation: 0,
  info: {
    name: { en: 'Sbeitla', fr: 'Sbeïtla', ar: 'سبيطلة' },
    facts: [
      { k: { en: 'Ancient name', fr: 'Nom antique', ar: 'الاسم القديم' }, v: { en: 'Sufetula, founded in the 1st century', fr: 'Sufetula, fondée au Ier siècle', ar: 'سوفيتولا، تأسست في القرن الأول' } },
      { k: { en: 'Forum temples', fr: 'Temples du forum', ar: 'معابد الساحة' }, v: { en: '2nd century CE', fr: 'IIe siècle', ar: 'القرن الثاني م' } },
      { k: { en: 'Battle', fr: 'Bataille', ar: 'معركة' }, v: { en: '647, Arab victory over the Byzantines', fr: '647, victoire arabe sur les Byzantins', ar: '647م، انتصار العرب على البيزنطيين' } },
      { k: { en: 'Altitude', fr: 'Altitude', ar: 'الارتفاع' }, v: { en: 'about 540 m, on the steppe of central Tunisia', fr: 'environ 540 m, sur la steppe du centre tunisien', ar: 'نحو 540 م، في سهوب الوسط التونسي' } },
    ],
    visit: [
      { k: { en: 'Getting there', fr: 'Accès', ar: 'الوصول' }, v: {
        en: 'In Kasserine governorate, about 1 h 30 west of Kairouan by road; the site is at the northern edge of the modern town.',
        fr: 'Dans le gouvernorat de Kasserine, à environ 1 h 30 de route à l’ouest de Kairouan ; le site est au nord de la ville moderne.',
        ar: 'في ولاية القصرين، على بعد نحو ساعة ونصف بالطريق غرب القيروان، والموقع في الطرف الشمالي من المدينة الحديثة.' } },
      { k: { en: 'Tickets', fr: 'Billets', ar: 'التذاكر' }, v: {
        en: 'One ticket for the site and its small museum near the entrance. Check current prices and hours.',
        fr: 'Un billet pour le site et son petit musée près de l’entrée. Vérifiez prix et horaires.',
        ar: 'تذكرة واحدة للموقع ومتحفه الصغير قرب المدخل. تحقّق من الأسعار والمواعيد.' } },
      { k: { en: 'Best time', fr: 'Meilleure période', ar: 'أفضل وقت' }, v: {
        en: 'Late afternoon, when the low sun warms the temples’ stone; spring and autumn. Allow two to three hours.',
        fr: 'En fin d’après-midi, quand le soleil bas réchauffe la pierre des temples ; au printemps et en automne. Comptez deux à trois heures.',
        ar: 'آخر النهار حين تدفّئ الشمس المائلة حجارة المعابد، في الربيع والخريف. خصّص ساعتين إلى ثلاث.' } },
    ],
    searchTerm: 'Sbeitla',
    intro: {
      en: 'The forum and its three temples, the triumphal arches, the theatre and the Byzantine churches of Sufetula, on the real terrain.',
      fr: 'Le forum et ses trois temples, les arcs de triomphe, le théâtre et les églises byzantines de Sufetula, sur le vrai relief.',
      ar: 'الساحة العامة ومعابدها الثلاثة وأقواس النصر والمسرح والكنائس البيزنطية في سوفيتولا، على التضاريس الحقيقية.',
    },
    loading: { en: 'Raising the temples of Sufetula…', fr: 'On relève les temples de Sufetula…', ar: 'جارٍ رفع معابد سوفيتولا…' },
    note: {
      en: 'Terrain, ancient streets and ruin outlines come from real map data; the forum is modelled from its plan and photos and simplified. Houses of the modern town are generated.',
      fr: 'Relief, rues antiques et contours des ruines viennent de vraies données cartographiques ; le forum est modélisé d’après son plan et des photos, simplifié. Les maisons de la ville moderne sont générées.',
      ar: 'التضاريس والشوارع القديمة وحدود الآثار من بيانات خرائط حقيقية، والساحة العامة منمذجة بتبسيط اعتمادًا على مخطّطها وصور. ومنازل المدينة الحديثة مولّدة.',
    },
  },
  hotspots: HOTSPOTS,
  photos: 'sbeitla',
  build: buildSbeitla,
  toVec: (p, built) => {
    if (Array.isArray(p)) return new THREE.Vector3(...p);
    if ('x' in p) return new THREE.Vector3(p.x, (built.groundAt?.(p.x, p.z) ?? 0) + p.h, p.z);
    return new THREE.Vector3(0, p.y, 0);
  },
  intro: { center: [0, 545, 0], rx: 460, rz: 460, height: 200 },
  shadowClamp: 600,
  fog: 0.0006,
};
