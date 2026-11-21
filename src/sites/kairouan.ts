import * as THREE from 'three';
import { BAB_CHOUHADA, BIG_BASIN, BIG_BASIN_R, BIR_BAROUTA, MQ_W, SIDI_SAHAB, THREE_DOORS, buildKairouan, gateOut, mq } from '../monuments/kairouan/build';
import type { Hotspot, SiteDef } from './types';

const MID = MQ_W / 2;
const at = (p: [number, number], h: number) => ({ x: p[0], z: p[1], h });
/** A view along a lane, a few metres from a façade on it. */
const alongLane = (f: typeof THREE_DOORS, dist: number) => at([f.street[0] + f.along[0] * dist + f.n[0] * 0.8, f.street[1] + f.along[1] * dist + f.n[1] * 0.8], 1);
const OUT = gateOut(BAB_CHOUHADA);

/** Places to see. Positions come from OpenStreetMap; inside the Great Mosque, from its published plan. */
const HOTSPOTS: Hotspot[] = [
  {
    // standing in the courtyard, looking back at the minaret
    id: 'minaret', marker: at(mq(5.4, MID), 32), view: at(mq(58, MID), 1), fixedView: true, photo: 'minaret',
    title: { en: 'The minaret', fr: 'Le minaret', ar: 'الصومعة' },
    text: {
      en: 'Built in the early 9th century, about 31.5 m tall in three tiers, it is one of the oldest standing minarets in the world. Its square, battered shape became the model for minarets across North Africa and Andalusia.',
      fr: 'Bâti au début du IXe siècle, haut d’environ 31,5 m en trois étages, c’est l’un des plus anciens minarets encore debout au monde. Sa forme carrée et massive a servi de modèle aux minarets du Maghreb et d’al-Andalus.',
      ar: 'شُيّدت في مطلع القرن التاسع بارتفاع نحو 31.5 م على ثلاث طبقات، وهي من أقدم الصوامع القائمة في العالم. وصار شكلها المربّع الضخم نموذجًا لصوامع المغرب والأندلس.',
    },
  },
  {
    id: 'court', marker: at(mq(46, MID), 1.5), view: at(mq(16, 17), 1), fixedView: true, photo: 'court',
    title: { en: 'The courtyard', fr: 'La cour', ar: 'الصحن' },
    text: {
      en: 'A vast marble-paved court ringed by arcades of horseshoe arches. It slopes gently towards the centre, where rainwater drains into a great cistern below; the carved well-heads drew it up. A sundial gave the hours of prayer.',
      fr: 'Une vaste cour pavée de marbre, bordée d’arcades en fer à cheval. Elle descend doucement vers le centre, où l’eau de pluie s’écoule dans une grande citerne ; les margelles sculptées servaient à la puiser. Un cadran solaire donnait l’heure des prières.',
      ar: 'صحن واسع مبلّط بالرخام تحيط به أروقة بأقواس حدوية. ينحدر برفق نحو الوسط حيث تنساب مياه المطر إلى ماجل كبير تحته، وكانت الخرزات المنحوتة تُستعمل لجلبها. وكانت مزولة شمسية تحدّد أوقات الصلاة.',
    },
  },
  {
    // inside the prayer hall, down the central nave towards the mihrab
    id: 'prayer', marker: at(mq(124.6, MID), 3), view: at(mq(91, MID), 1), fixedView: true, photo: 'prayer',
    title: { en: 'The prayer hall', fr: 'La salle de prière', ar: 'بيت الصلاة' },
    text: {
      en: 'Seventeen naves on hundreds of marble and granite columns, many reused from Roman and Byzantine buildings such as those of Carthage. At the end of the wider central nave, the mihrab is lined with 9th-century lustre tiles from Baghdad, beside the oldest minbar in the Islamic world still in place.',
      fr: 'Dix-sept nefs sur des centaines de colonnes de marbre et de granit, beaucoup prises à des édifices romains et byzantins, comme ceux de Carthage. Au bout de la nef centrale, plus large, le mihrab est orné de carreaux lustrés du IXe siècle venus de Bagdad, à côté du plus ancien minbar du monde islamique encore en place.',
      ar: 'سبع عشرة بلاطة على مئات الأعمدة من الرخام والغرانيت، كثير منها مأخوذ من مبانٍ رومانية وبيزنطية مثل مباني قرطاج. وفي آخر البلاطة الوسطى الأعرض محراب مكسوّ بخزف ذي بريق معدني من بغداد يعود إلى القرن التاسع، بجانب أقدم منبر في العالم الإسلامي لا يزال في مكانه.',
    },
  },
  {
    id: 'basins', marker: at(BIG_BASIN, 2), view: at([BIG_BASIN[0], BIG_BASIN[1] + BIG_BASIN_R], 3), fixedView: true, photo: 'basins',
    title: { en: 'The Aghlabid basins', fr: 'Les bassins des Aghlabides', ar: 'فسقيات الأغالبة' },
    text: {
      en: 'Built around 862 to store water brought by aqueduct for a city on a dry plain. The large basin, about 128 m across with rounded buttresses all round, held a pavilion on its central pier where the emir could rest.',
      fr: 'Construits vers 862 pour stocker l’eau amenée par aqueduc dans une ville bâtie sur une plaine sèche. Le grand bassin, d’environ 128 m de diamètre, cerné de contreforts arrondis, portait sur son pilier central un pavillon où l’émir venait se reposer.',
      ar: 'بُنيت نحو سنة 862 لتخزين الماء الذي تجلبه القناة إلى مدينة في سهل جاف. يبلغ قطر الفسقية الكبرى نحو 128 م وتحيط بها دعامات مستديرة، وكان على عمودها الأوسط جوسق يستريح فيه الأمير.',
    },
  },
  {
    id: 'sahab', marker: at(SIDI_SAHAB, 9), view: at([SIDI_SAHAB[0] + 20, SIDI_SAHAB[1] + 68], 1), fixedView: true, photo: 'sahab',
    title: { en: 'Mausoleum of Sidi Sahab', fr: 'Le mausolée de Sidi Sahab', ar: 'مقام الصحابي أبي زمعة البلوي' },
    text: {
      en: 'The shrine of Abu Zama al-Balawi, a companion of the Prophet, known as "the Barber" because he is said to have kept three hairs of the Prophet’s beard. The 17th-century courts are lined with tiles and carved stucco.',
      fr: 'Le sanctuaire d’Abou Zamaa al-Balaoui, compagnon du Prophète, dit « le Barbier » car il aurait gardé trois poils de la barbe du Prophète. Les cours du XVIIe siècle sont revêtues de céramiques et de stucs sculptés.',
      ar: 'مقام أبي زمعة البلوي، صحابي النبي، ويُعرف بـ«الحجّام» لأنه يُروى أنه احتفظ بثلاث شعرات من لحية النبي. وتكسو أفنيتَه التي تعود إلى القرن السابع عشر الزليجُ والجبس المنقوش.',
    },
  },
  {
    id: 'threedoors',
    marker: at([THREE_DOORS.c[0] + THREE_DOORS.n[0] * 4.5, THREE_DOORS.c[1] + THREE_DOORS.n[1] * 4.5], 5),
    view: alongLane(THREE_DOORS, 11), fixedView: true, photo: 'threedoors',
    title: { en: 'Mosque of the Three Doors', fr: 'La mosquée des Trois Portes', ar: 'جامع الأبواب الثلاثة' },
    text: {
      en: 'Founded in 866 by Muhammad ibn Khayrun, from Andalusia. Its carved façade, with three arched doors and bands of Kufic inscriptions and floral friezes, is one of the oldest decorated mosque façades in Islamic art.',
      fr: 'Fondée en 866 par Mohammed ibn Khayrun, venu d’al-Andalus. Sa façade sculptée, avec trois portes en arc et des bandeaux d’inscriptions coufiques et de frises végétales, est l’une des plus anciennes façades de mosquée décorées de l’art islamique.',
      ar: 'أسّسه محمد بن خيرون الأندلسي سنة 866. وواجهته المنحوتة، بأبوابها الثلاثة المقوّسة وأشرطة الكتابة الكوفية والزخارف النباتية، من أقدم واجهات المساجد المزخرفة في الفن الإسلامي.',
    },
  },
  {
    id: 'barouta', marker: at([BIR_BAROUTA.c[0] + BIR_BAROUTA.n[0] * (BIR_BAROUTA.depth / 2 + 0.2), BIR_BAROUTA.c[1] + BIR_BAROUTA.n[1] * (BIR_BAROUTA.depth / 2 + 0.2)], 4.5),
    view: alongLane(BIR_BAROUTA, 12), photo: 'barouta',
    title: { en: 'Bir Barouta', fr: 'Bir Barouta', ar: 'بئر بروطة' },
    text: {
      en: 'A well dug, by tradition, in the 17th century, in a domed building. Upstairs a blindfolded camel still walks in circles to turn the wheel that raises the water. Legend says it is linked to the well of Zamzam in Mecca.',
      fr: 'Un puits creusé, selon la tradition, au XVIIe siècle, dans un édifice à coupole. À l’étage, un dromadaire aux yeux bandés tourne encore en rond pour actionner la noria qui remonte l’eau. La légende la relie au puits de Zamzam à La Mecque.',
      ar: 'بئر حُفرت حسب الرواية في القرن السابع عشر، في بناء بقبة. وفي الطابق العلوي لا يزال جمل معصوب العينين يدور ليحرّك الناعورة التي ترفع الماء. وتقول الأسطورة إنها متصلة ببئر زمزم في مكة.',
    },
  },
  {
    id: 'gate', marker: at(BAB_CHOUHADA, 9), view: at([BAB_CHOUHADA[0] + OUT[0] * 26, BAB_CHOUHADA[1] + OUT[1] * 26], 1), photo: 'gate',
    title: { en: 'The ramparts and Bab ech Chouhada', fr: 'Les remparts et Bab ech Chouhada', ar: 'الأسوار وباب الشهداء' },
    text: {
      en: 'About 3 km of brick ramparts with bastions enclose the medina; most date from the 18th century, on older lines. Bab ech Chouhada, the Gate of the Martyrs, is the main way in from the south.',
      fr: 'Environ 3 km de remparts de brique flanqués de bastions entourent la médina ; ils datent surtout du XVIIIe siècle, sur des tracés plus anciens. Bab ech Chouhada, la porte des Martyrs, est la grande entrée au sud.',
      ar: 'تحيط بالمدينة العتيقة أسوار من الآجرّ بطول نحو 3 كم تتخلّلها أبراج، يعود أغلبها إلى القرن الثامن عشر على مسارات أقدم. وباب الشهداء هو المدخل الرئيسي من الجنوب.',
    },
  },
];

export const site: SiteDef = {
  id: 'kairouan',
  lat: 35.6810, lon: 10.0985,
  northRotation: 0,
  info: {
    name: { en: 'Kairouan', fr: 'Kairouan', ar: 'القيروان' },
    facts: [
      { k: { en: 'Founded', fr: 'Fondation', ar: 'التأسيس' }, v: { en: '670 CE, by Uqba ibn Nafi', fr: '670, par Oqba ibn Nafi', ar: 'سنة 670م، على يد عقبة بن نافع' } },
      { k: { en: 'Great Mosque', fr: 'Grande Mosquée', ar: 'الجامع الكبير' }, v: { en: 'rebuilt 836 under the Aghlabids, about 9,000 m²', fr: 'reconstruite en 836 sous les Aghlabides, environ 9 000 m²', ar: 'أعيد بناؤه سنة 836 في عهد الأغالبة، نحو 9000 م²' } },
      { k: { en: 'Medina', fr: 'Médina', ar: 'المدينة العتيقة' }, v: { en: 'about 54 ha inside 3 km of ramparts', fr: 'environ 54 ha dans 3 km de remparts', ar: 'نحو 54 هكتارًا داخل 3 كم من الأسوار' } },
      { k: { en: 'UNESCO', fr: 'UNESCO', ar: 'اليونسكو' }, v: { en: 'World Heritage since 1988', fr: 'Patrimoine mondial depuis 1988', ar: 'تراث عالمي منذ 1988' } },
    ],
    visit: [
      { k: { en: 'Getting there', fr: 'Accès', ar: 'الوصول' }, v: {
        en: 'About 2 h by road from Tunis, 1 h from Sousse; buses and louages arrive at the station west of the medina.',
        fr: 'Environ 2 h de route depuis Tunis, 1 h depuis Sousse ; bus et louages arrivent à la gare à l’ouest de la médina.',
        ar: 'نحو ساعتين بالطريق من تونس وساعة من سوسة، وتصل الحافلات واللواجات إلى المحطة غرب المدينة العتيقة.' } },
      { k: { en: 'Tickets', fr: 'Billets', ar: 'التذاكر' }, v: {
        en: 'A combined ticket covers the Great Mosque, the Aghlabid basins and other monuments. Non-Muslim visitors see the prayer hall from its doors; the mosque closes to visitors at prayer times and on Friday afternoons. Dress modestly.',
        fr: 'Un billet combiné donne accès à la Grande Mosquée, aux bassins des Aghlabides et à d’autres monuments. Les visiteurs non musulmans voient la salle de prière depuis ses portes ; la mosquée ferme aux visiteurs aux heures de prière et le vendredi après-midi. Tenue correcte.',
        ar: 'تذكرة موحّدة تشمل الجامع الكبير وفسقيات الأغالبة ومعالم أخرى. يشاهد الزوار غير المسلمين بيت الصلاة من أبوابه، ويُغلق الجامع أمام الزوار في أوقات الصلاة وبعد ظهر الجمعة. يُطلب لباس محتشم.' } },
      { k: { en: 'Best time', fr: 'Meilleure période', ar: 'أفضل وقت' }, v: {
        en: 'Spring and autumn mornings; summers on the plain are very hot. Try the makroudh, date pastries for which Kairouan is famous.',
        fr: 'Les matinées de printemps et d’automne ; l’été est très chaud sur la plaine. Goûtez les makroudh, les gâteaux aux dattes qui ont fait la réputation de Kairouan.',
        ar: 'صباحات الربيع والخريف، فالصيف حارّ جدًا في السهل. ولا تفوّت المقروض، حلوى التمر التي اشتهرت بها القيروان.' } },
    ],
    searchTerm: 'Kairouan',
    intro: {
      en: 'The Great Mosque of Uqba, the walled medina and the Aghlabid basins, on the real streets of Kairouan.',
      fr: 'La Grande Mosquée d’Oqba, la médina fortifiée et les bassins des Aghlabides, sur les vraies rues de Kairouan.',
      ar: 'جامع عقبة الكبير والمدينة العتيقة المسوّرة وفسقيات الأغالبة، على شوارع القيروان الحقيقية.',
    },
    loading: { en: 'Raising the minaret of Kairouan…', fr: 'On élève le minaret de Kairouan…', ar: 'جارٍ رفع صومعة القيروان…' },
    note: {
      en: 'Terrain, streets, ramparts and monument outlines come from real map data; the Great Mosque is modelled from its published plan and photos and simplified. Houses in the medina are generated.',
      fr: 'Relief, rues, remparts et contours des monuments viennent de vraies données cartographiques ; la Grande Mosquée est modélisée d’après son plan publié et des photos, simplifiée. Les maisons de la médina sont générées.',
      ar: 'التضاريس والشوارع والأسوار وحدود المعالم من بيانات خرائط حقيقية، والجامع الكبير منمذج بتبسيط اعتمادًا على مخطّطه المنشور وصور. ومنازل المدينة العتيقة مولّدة.',
    },
  },
  hotspots: HOTSPOTS,
  photos: 'kairouan',
  build: buildKairouan,
  toVec: (p, built) => {
    if (Array.isArray(p)) return new THREE.Vector3(...p);
    if ('x' in p) return new THREE.Vector3(p.x, (built.groundAt?.(p.x, p.z) ?? 0) + p.h, p.z);
    return new THREE.Vector3(0, p.y, 0);
  },
  intro: { center: [150, 60, 20], rx: 720, rz: 700, height: 300 },
  shadowClamp: 800,
  fog: 0.0005,
};
