import * as THREE from 'three';
import { BAB_GHARBI, KASBAH_C, KHALEF, KOBBA, MQ_W, MUSEUM, NADOR, RIBAT, SOUK, buildSousse, mq } from '../monuments/sousse/build';
import type { Hotspot, SiteDef } from './types';

const at = (p: [number, number], h: number) => ({ x: p[0], z: p[1], h });

/** Places to see. Positions come from OpenStreetMap; inside the Ribat and the mosque, from their plans. */
const HOTSPOTS: Hotspot[] = [
  {
    // on the street before the gate, the watchtower on the right
    id: 'ribat', marker: at(NADOR, 15), view: at([110, -236], 1), fixedView: true, photo: 'ribat',
    title: { en: 'The Ribat', fr: 'Le Ribat', ar: 'الرباط' },
    text: {
      en: 'A fortified monastery of the late 8th century, finished in 821: warrior-monks lived in its cells, prayed and watched the sea for Byzantine ships. It is one of the oldest and best preserved ribats of the North African coast.',
      fr: 'Un monastère fortifié de la fin du VIIIe siècle, achevé en 821 : des moines-soldats y vivaient dans des cellules, priaient et guettaient la mer pour y voir venir les navires byzantins. C’est l’un des ribats les plus anciens et les mieux conservés de la côte d’Afrique du Nord.',
      ar: 'حصن رباط من أواخر القرن الثامن اكتمل سنة 821، كان المرابطون يقيمون في حجراته ويصلّون ويرقبون البحر تحسّبًا لسفن البيزنطيين. وهو من أقدم الرباطات وأحسنها حفظًا على ساحل شمال إفريقيا.',
    },
  },
  {
    // in the courtyard, looking up at the watchtower
    id: 'ribatcourt', marker: at(NADOR, 22), view: at([RIBAT.x0 + 11, RIBAT.z0 + 12], 1), fixedView: true, photo: 'ribatcourt',
    title: { en: 'Inside the Ribat', fr: 'Dans le Ribat', ar: 'داخل الرباط' },
    text: {
      en: 'Two storeys of cells round a courtyard, with the prayer hall upstairs on the south side. The round watchtower, the nador, rises about 27 m; from its top, fire and smoke signals could be passed along a chain of ribats down the coast.',
      fr: 'Deux étages de cellules autour d’une cour, avec la salle de prière à l’étage côté sud. La tour de guet ronde, le nador, s’élève à environ 27 m ; de son sommet, des signaux de feu et de fumée passaient d’un ribat à l’autre le long de la côte.',
      ar: 'طابقان من الحجرات حول صحن، وبيت الصلاة في الطابق العلوي من الجهة الجنوبية. ويرتفع برج المراقبة المستدير، الناظور، نحو 27 م، ومن أعلاه كانت إشارات النار والدخان تنتقل من رباط إلى آخر على طول الساحل.',
    },
  },
  {
    id: 'mosque', marker: at(mq(17, MQ_W / 2), 1.5), view: at(mq(9, 9), 1), fixedView: true, photo: 'mosque',
    title: { en: 'The Great Mosque', fr: 'La Grande Mosquée', ar: 'الجامع الكبير' },
    text: {
      en: 'Built in 850–851 under the Aghlabid emir Abu al-Abbas Muhammad, next to the Ribat. With its crenellated walls and corner towers it looks like a fortress; it has no minaret, and the call to prayer was given from the small domed kiosk on a tower. A band of Kufic inscription runs above the courtyard arches.',
      fr: 'Bâtie en 850–851 sous l’émir aghlabide Abou al-Abbas Mohammed, près du Ribat. Avec ses murs crénelés et ses tours d’angle, elle ressemble à une forteresse ; elle n’a pas de minaret, l’appel à la prière se faisait depuis le petit kiosque à coupole d’une tour. Un bandeau d’inscription coufique court au-dessus des arcades de la cour.',
      ar: 'شُيّد سنة 850–851 في عهد الأمير الأغلبي أبي العباس محمد، بجوار الرباط. يشبه القلعة بأسواره المشرّفة وأبراج زواياه، وليس له صومعة، فكان الأذان يُرفع من قبيبة صغيرة على أحد الأبراج. ويمتد شريط من الكتابة الكوفية فوق أقواس الصحن.',
    },
  },
  {
    id: 'kasbah', marker: at(KHALEF, 32), view: at([-95, 345], 1), fixedView: true, photo: 'kasbah',
    title: { en: 'The Kasbah and the Khalef al-Fata tower', fr: 'La Kasbah et la tour Khalef al-Fata', ar: 'القصبة وبرج خلف الفتى' },
    text: {
      en: 'On the highest corner of the medina, the Kasbah guards the town. Its square tower, built in 859 and about 30 m tall, has served as a lighthouse for ships coming into Sousse.',
      fr: 'Au point le plus haut de la médina, la Kasbah garde la ville. Sa tour carrée, bâtie en 859 et haute d’environ 30 m, sert de phare aux navires qui entrent à Sousse.',
      ar: 'في أعلى ركن من المدينة العتيقة تحرس القصبة المدينة. وبرجها المربّع، المبني سنة 859 بارتفاع نحو 30 م، يُستعمل منارةً للسفن القادمة إلى سوسة.',
    },
  },
  {
    id: 'museum', marker: at(KASBAH_C, 6), view: at([MUSEUM[0] + 6, MUSEUM[1] - 16], 1), photo: 'museum',
    title: { en: 'The Archaeological Museum', fr: 'Le Musée archéologique', ar: 'المتحف الأثري' },
    text: {
      en: 'Inside the Kasbah, around garden courts, one of the finest collections of Roman mosaics after the Bardo in Tunis: sea gods, Bacchus and hunting scenes from Hadrumetum, as Sousse was called in Roman times.',
      fr: 'Dans la Kasbah, autour de cours-jardins, l’une des plus belles collections de mosaïques romaines après le Bardo à Tunis : dieux marins, Bacchus et scènes de chasse d’Hadrumète, nom romain de Sousse.',
      ar: 'داخل القصبة، حول أفنية مغروسة، من أجمل مجموعات الفسيفساء الرومانية بعد متحف باردو بتونس: آلهة البحر وباخوس ومشاهد الصيد من حضرموت، الاسم الروماني لسوسة.',
    },
  },
  {
    // on the roof terrace, beside the dome
    id: 'kobba', marker: at(KOBBA, 11), view: at([KOBBA[0] - 8, KOBBA[1] - 12], 9), fixedView: true, photo: 'kobba',
    title: { en: 'The Kalaout el-Koubba', fr: 'La Kalaout el-Koubba', ar: 'قلعة القبّة' },
    text: {
      en: 'A medieval hall known for its dome with zigzag ribs, a design found nowhere else in Tunisia. Probably built in the 11th century, it may have been a meeting place or a tomb; today it houses a museum of traditional arts and costumes.',
      fr: 'Une salle médiévale connue pour sa coupole à côtes en zigzag, un décor sans équivalent en Tunisie. Bâtie sans doute au XIe siècle, elle fut peut-être un lieu de réunion ou un tombeau ; elle abrite aujourd’hui un musée des arts et costumes traditionnels.',
      ar: 'قاعة من العصر الوسيط تشتهر بقبّتها ذات الأضلاع المتعرّجة، وهي زخرفة لا مثيل لها في تونس. بُنيت على الأرجح في القرن الحادي عشر، وربما كانت مكانًا للاجتماع أو ضريحًا، وهي اليوم متحف للفنون والأزياء التقليدية.',
    },
  },
  {
    id: 'souks', marker: at(SOUK, 3), view: at([SOUK[0] + 14, SOUK[1] - 4], 1), photo: 'souks',
    title: { en: 'The souks', fr: 'Les souks', ar: 'الأسواق' },
    text: {
      en: 'Covered and open lanes of shops cross the medina from Bab el Gharbi towards the Great Mosque: spices, leather, copper, carpets and jewellery, as in the souks of every Tunisian medina.',
      fr: 'Des ruelles marchandes couvertes et à ciel ouvert traversent la médina de Bab el Gharbi vers la Grande Mosquée : épices, cuir, cuivre, tapis et bijoux, comme dans les souks de toutes les médinas tunisiennes.',
      ar: 'أزقّة تجارية مسقوفة ومكشوفة تعبر المدينة العتيقة من باب الغربي نحو الجامع الكبير: توابل وجلود ونحاس وزرابي وحلي، كما في أسواق كل المدن العتيقة التونسية.',
    },
  },
  {
    id: 'gate', marker: at(BAB_GHARBI, 9), view: at([BAB_GHARBI[0] - 26, BAB_GHARBI[1] + 6], 1), photo: 'gate',
    title: { en: 'The ramparts', fr: 'Les remparts', ar: 'الأسوار' },
    text: {
      en: 'About 2.25 km of 9th-century walls still surround the medina, among the best preserved in the Islamic world. Bab el Gharbi, the western gate, leads into the souks.',
      fr: 'Environ 2,25 km de murailles du IXe siècle entourent toujours la médina, parmi les mieux conservées du monde islamique. Bab el Gharbi, la porte de l’ouest, mène aux souks.',
      ar: 'لا يزال نحو 2.25 كم من أسوار القرن التاسع يحيط بالمدينة العتيقة، وهي من أفضل الأسوار حفظًا في العالم الإسلامي. ويؤدّي باب الغربي إلى الأسواق.',
    },
  },
];

export const site: SiteDef = {
  id: 'sousse',
  lat: 35.8252, lon: 10.6375,
  northRotation: 0,
  info: {
    name: { en: 'Sousse', fr: 'Sousse', ar: 'سوسة' },
    facts: [
      { k: { en: 'Ancient name', fr: 'Nom antique', ar: 'الاسم القديم' }, v: { en: 'Hadrumetum, a Phoenician then Roman port', fr: 'Hadrumète, port phénicien puis romain', ar: 'حضرموت، ميناء فينيقي ثم روماني' } },
      { k: { en: 'Ribat', fr: 'Ribat', ar: 'الرباط' }, v: { en: 'completed 821', fr: 'achevé en 821', ar: 'اكتمل سنة 821' } },
      { k: { en: 'Great Mosque', fr: 'Grande Mosquée', ar: 'الجامع الكبير' }, v: { en: '850–851, Aghlabid', fr: '850–851, aghlabide', ar: '850–851م، أغلبي' } },
      { k: { en: 'UNESCO', fr: 'UNESCO', ar: 'اليونسكو' }, v: { en: 'World Heritage since 1988', fr: 'Patrimoine mondial depuis 1988', ar: 'تراث عالمي منذ 1988' } },
    ],
    visit: [
      { k: { en: 'Getting there', fr: 'Accès', ar: 'الوصول' }, v: {
        en: 'About 2 h by train or road from Tunis; Sousse Bab Jedid station is at the foot of the medina walls, by the harbour.',
        fr: 'Environ 2 h en train ou par la route depuis Tunis ; la gare de Sousse Bab Jedid est au pied des remparts, près du port.',
        ar: 'نحو ساعتين بالقطار أو بالطريق من تونس، ومحطة سوسة باب الجديد عند سفح الأسوار قرب الميناء.' } },
      { k: { en: 'Tickets', fr: 'Billets', ar: 'التذاكر' }, v: {
        en: 'Separate tickets for the Ribat, the Great Mosque courtyard and the Archaeological Museum. The mosque closes to visitors at prayer times. Check current prices and hours.',
        fr: 'Billets séparés pour le Ribat, la cour de la Grande Mosquée et le Musée archéologique. La mosquée ferme aux visiteurs aux heures de prière. Vérifiez prix et horaires.',
        ar: 'تذاكر منفصلة للرباط وصحن الجامع الكبير والمتحف الأثري. ويُغلق الجامع أمام الزوار في أوقات الصلاة. تحقّق من الأسعار والمواعيد.' } },
      { k: { en: 'Best time', fr: 'Meilleure période', ar: 'أفضل وقت' }, v: {
        en: 'Morning, before the heat and the crowds; climb the Ribat’s tower for the view over the medina and the sea.',
        fr: 'Le matin, avant la chaleur et la foule ; montez à la tour du Ribat pour la vue sur la médina et la mer.',
        ar: 'الصباح، قبل الحرّ والزحام، واصعد برج الرباط للإطلالة على المدينة العتيقة والبحر.' } },
    ],
    searchTerm: 'Sousse',
    intro: {
      en: 'The Ribat, the Great Mosque, the Kasbah and the walled medina above the harbour, on the real streets of Sousse.',
      fr: 'Le Ribat, la Grande Mosquée, la Kasbah et la médina fortifiée au-dessus du port, sur les vraies rues de Sousse.',
      ar: 'الرباط والجامع الكبير والقصبة والمدينة العتيقة المسوّرة فوق الميناء، على شوارع سوسة الحقيقية.',
    },
    loading: { en: 'Manning the walls of Sousse…', fr: 'On garnit les remparts de Sousse…', ar: 'جارٍ تحصين أسوار سوسة…' },
    note: {
      en: 'Terrain, coastline, streets, ramparts and monument outlines come from real map data; the Ribat and the Great Mosque are modelled from their published plans and photos and simplified. Houses on unmapped plots are generated.',
      fr: 'Relief, côte, rues, remparts et contours des monuments viennent de vraies données cartographiques ; le Ribat et la Grande Mosquée sont modélisés d’après leurs plans publiés et des photos, simplifiés. Les maisons des parcelles non cartographiées sont générées.',
      ar: 'التضاريس والساحل والشوارع والأسوار وحدود المعالم من بيانات خرائط حقيقية، والرباط والجامع الكبير منمذجان بتبسيط اعتمادًا على مخطّطاتهما المنشورة وصور. والمنازل في القطع غير المرسومة مولّدة.',
    },
  },
  hotspots: HOTSPOTS,
  photos: 'sousse',
  build: buildSousse,
  toVec: (p, built) => {
    if (Array.isArray(p)) return new THREE.Vector3(...p);
    if ('x' in p) return new THREE.Vector3(p.x, (built.groundAt?.(p.x, p.z) ?? 0) + p.h, p.z);
    return new THREE.Vector3(0, p.y, 0);
  },
  intro: { center: [0, 20, 20], rx: 560, rz: 520, height: 240 },
  shadowClamp: 700,
  fog: 0.0005,
};
