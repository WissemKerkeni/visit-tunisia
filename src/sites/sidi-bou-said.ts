import * as THREE from 'three';
import { buildSidiBouSaid } from '../monuments/sidi-bou-said/build';
import type { Hotspot, SiteDef } from './types';

/** Points of interest. Positions are real (OpenStreetMap), heights are metres above the ground. */
const HOTSPOTS: Hotspot[] = [
  {
    id: 'nattes', marker: { x: 1, z: 0, h: 6 }, view: { x: -30, z: 17, h: 1 }, photo: 'nattes',
    title: { en: 'Café des Nattes', fr: 'Café des Nattes', ar: 'مقهى الحُصُر' },
    text: {
      en: 'At the top of a broad flight of steps, the oldest café of the village takes its name from the straw mats (nattes) its regulars sat on. Painters and writers from Paul Klee to Simone de Beauvoir stopped here.',
      fr: 'En haut d’un large escalier, le plus vieux café du village doit son nom aux nattes de paille sur lesquelles s’asseyaient les habitués. Des peintres et écrivains, de Paul Klee à Simone de Beauvoir, s’y sont arrêtés.',
      ar: 'في أعلى درج عريض، يحمل أقدم مقاهي القرية اسمه من الحُصُر التي كان يجلس عليها رواده. توقف فيه رسامون وكتّاب من بول كلي إلى سيمون دي بوفوار.',
    },
  },
  {
    id: 'mosque', marker: { x: 42, z: 15, h: 20 }, view: { x: 12, z: -24, h: 1 }, photo: 'minaret',
    title: { en: 'The mosque and its minaret', fr: 'La mosquée et son minaret', ar: 'الجامع وصومعته' },
    text: {
      en: 'The village grew around the zaouia of Abu Said al-Baji, a Sufi teacher who died here in 1231. His sanctuary and the white minaret still crown the hill and gave Sidi Bou Said its name.',
      fr: 'Le village s’est formé autour de la zaouïa d’Abou Saïd al-Béji, maître soufi mort ici en 1231. Son sanctuaire et le minaret blanc couronnent toujours la colline et ont donné son nom à Sidi Bou Saïd.',
      ar: 'نشأت القرية حول زاوية أبي سعيد الباجي، المتصوف الذي توفي هنا سنة 1231. وما زال مقامه والصومعة البيضاء يتوّجان التل، ومنه أخذت سيدي بوسعيد اسمها.',
    },
  },
  {
    id: 'doors', marker: { x: -45, z: 23, h: 1.6 }, view: { x: -58, z: 29, h: 1 }, photo: 'door',
    title: { en: 'Blue doors and white walls', fr: 'Portes bleues et murs blancs', ar: 'أبواب زرقاء وجدران بيضاء' },
    text: {
      en: 'In 1915 Baron Rodolphe d’Erlanger had the village protected: walls stay lime-washed white, doors, shutters and window grilles painted blue. The studded doors carry patterns of black nails that once told who lived inside.',
      fr: 'En 1915, le baron Rodolphe d’Erlanger fit protéger le village : murs chaulés de blanc, portes, volets et grilles peints en bleu. Les portes cloutées portent des motifs de clous noirs qui disaient autrefois qui vivait là.',
      ar: 'سنة 1915 سعى البارون رودولف ديرلانجي إلى حماية القرية: جدران مطلية بالجير الأبيض، وأبواب ونوافذ وشبابيك زرقاء. وتحمل الأبواب المرصّعة نقوشًا من المسامير السوداء كانت تدل على ساكنيها.',
    },
  },
  {
    id: 'lighthouse', marker: { x: 54, z: -165, h: 9 }, view: { x: 22, z: -142, h: 1 }, photo: 'lighthouse',
    title: { en: 'Cape Carthage lighthouse', fr: 'Le phare du cap Carthage', ar: 'منارة رأس قرطاج' },
    text: {
      en: 'On the summit of the cape, about 130 m above the sea, the lighthouse guides ships into the Gulf of Tunis. The hill was a lookout long before: ancient sailors called the cape Promontorium Apollinis.',
      fr: 'Au sommet du cap, à environ 130 m au-dessus de la mer, le phare guide les navires vers le golfe de Tunis. La colline était déjà un poste de guet : les marins antiques l’appelaient Promontorium Apollinis.',
      ar: 'على قمة الرأس، على ارتفاع نحو 130 م فوق البحر، ترشد المنارة السفن نحو خليج تونس. وكان التل مرصدًا منذ القديم.',
    },
  },
  {
    id: 'view', marker: [430, 25, -30], view: { x: 86, z: -111, h: 1 }, fixedView: true, photo: 'cliff',
    title: { en: 'Over the Gulf of Tunis', fr: 'Sur le golfe de Tunis', ar: 'إطلالة على خليج تونس' },
    text: {
      en: 'From the cliff the view runs across the gulf to the twin peaks of Bou Kornine and the Cap Bon peninsula. The cafés on the terraces below are the classic place to watch the sun set over the water.',
      fr: 'De la falaise, la vue file au-dessus du golfe jusqu’aux deux pics du Bou Kornine et à la presqu’île du cap Bon. Les cafés des terrasses en contrebas sont le lieu classique pour voir le soleil se coucher.',
      ar: 'من الجرف يمتد البصر فوق الخليج حتى قمتي جبل بوقرنين وشبه جزيرة الوطن القبلي. ومقاهي المدرجات في الأسفل مكان مثالي لمشاهدة الغروب.',
    },
  },
  {
    id: 'delices', marker: { x: 268, z: 124, h: 0.5 }, view: { x: 254, z: 98, h: 1 }, fixedView: true, photo: 'gulf',
    title: { en: 'Café des Délices', fr: 'Café des Délices', ar: 'مقهى الدليس' },
    text: {
      en: 'Officially the Café Sidi Chabaane, its white terraces step down the cliff towards the marina, with blue-and-white benches under blue umbrellas. It is the classic place for mint tea with pine nuts at sunset.',
      fr: 'De son vrai nom café Sidi Chabaane, ses terrasses blanches descendent la falaise vers le port, avec des banquettes bleu et blanc sous des parasols bleus. C’est le lieu classique pour un thé à la menthe aux pignons au coucher du soleil.',
      ar: 'اسمه الرسمي مقهى سيدي شعبان، وتنحدر مدرجاته البيضاء على الجرف نحو الميناء، بمقاعد زرقاء وبيضاء تحت مظلات زرقاء. وهو المكان المعهود لشاي النعناع بالصنوبر عند الغروب.',
    },
  },
  {
    id: 'ennejma', marker: { x: 2, z: 208, h: 11 }, view: { x: -20, z: 168, h: 1 }, photo: 'ennejma',
    title: { en: 'Ennejma Ezzahra', fr: 'Ennejma Ezzahra', ar: 'النجمة الزهراء' },
    text: {
      en: 'Built from 1912 to 1922 by Baron d’Erlanger, a musicologist who loved Arab music, this palace mixes Andalusian and Tunisian crafts. It now houses the Centre of Arab and Mediterranean Music.',
      fr: 'Bâti de 1912 à 1922 par le baron d’Erlanger, musicologue passionné de musique arabe, ce palais mêle artisanats andalou et tunisien. Il abrite aujourd’hui le Centre des musiques arabes et méditerranéennes.',
      ar: 'شيّده البارون ديرلانجي بين 1912 و1922، وهو عالم موسيقى شغوف بالموسيقى العربية، ويجمع القصر بين الحرف الأندلسية والتونسية. ويضم اليوم مركز الموسيقى العربية والمتوسطية.',
    },
  },
  {
    id: 'marina', marker: { x: 330, z: 450, h: 2 }, view: { x: 290, z: 400, h: 1 }, photo: 'marina',
    title: { en: 'The marina', fr: 'Le port de plaisance', ar: 'ميناء الترفيه' },
    text: {
      en: 'Below the cliff, sailing boats and fishing boats share the small harbour. A path and steps lead down from the village; the walk back up is steep but worth the view.',
      fr: 'Au pied de la falaise, voiliers et barques de pêche se partagent le petit port. Un chemin et des escaliers y descendent depuis le village ; la remontée est raide mais la vue en vaut la peine.',
      ar: 'أسفل الجرف تتقاسم المراكب الشراعية وقوارب الصيد الميناء الصغير. ينزل إليه طريق ودرج من القرية، والصعود شاق لكن المنظر يستحق.',
    },
  },
];

export const site: SiteDef = {
  id: 'sidi-bou-said',
  lat: 36.87114, lon: 10.34830, // Café des Nattes
  northRotation: 0,
  info: {
    name: { en: 'Sidi Bou Said', fr: 'Sidi Bou Saïd', ar: 'سيدي بوسعيد' },
    facts: [
      { k: { en: 'Where', fr: 'Où', ar: 'الموقع' }, v: { en: 'Cape Carthage, 20 km from Tunis', fr: 'Cap Carthage, à 20 km de Tunis', ar: 'رأس قرطاج، 20 كم من تونس' } },
      { k: { en: 'Height', fr: 'Altitude', ar: 'الارتفاع' }, v: { en: 'about 100–130 m above the sea', fr: 'environ 100 à 130 m au-dessus de la mer', ar: 'حوالي 100 إلى 130 م فوق البحر' } },
      { k: { en: 'Named after', fr: 'Nom', ar: 'التسمية' }, v: { en: 'Abu Said al-Baji, Sufi, d. 1231', fr: 'Abou Saïd al-Béji, soufi, mort en 1231', ar: 'أبو سعيد الباجي، متصوف، ت 1231' } },
      { k: { en: 'Protected', fr: 'Protégé', ar: 'محمي' }, v: { en: 'since 1915: white walls, blue doors', fr: 'depuis 1915 : murs blancs, portes bleues', ar: 'منذ 1915: جدران بيضاء وأبواب زرقاء' } },
    ],
    visit: [
      { k: { en: 'Getting there', fr: 'Accès', ar: 'الوصول' }, v: {
        en: 'Take the TGM light railway from Tunis Marine to the Sidi Bou Said stop (about 35 minutes), then walk up the main street.',
        fr: 'Prenez le TGM depuis Tunis Marine jusqu’à l’arrêt Sidi Bou Saïd (environ 35 minutes), puis montez à pied la rue principale.',
        ar: 'استقل قطار الضاحية TGM من تونس البحرية إلى محطة سيدي بوسعيد (حوالي 35 دقيقة)، ثم اصعد الشارع الرئيسي مشيًا.' } },
      { k: { en: 'Best time', fr: 'Meilleure période', ar: 'أفضل وقت' }, v: {
        en: 'Early morning before the crowds, or late afternoon for the sunset over the gulf. Spring brings the bougainvillea and jasmine.',
        fr: 'Tôt le matin avant la foule, ou en fin d’après-midi pour le coucher de soleil sur le golfe. Le printemps apporte bougainvilliers et jasmin.',
        ar: 'باكرًا قبل الزحام، أو آخر النهار لمشاهدة الغروب فوق الخليج. ويجلب الربيع الجهنمية والياسمين.' } },
      { k: { en: 'Also nearby', fr: 'À voir aussi', ar: 'بالقرب' }, v: {
        en: 'The ruins of Carthage are one TGM stop away; La Marsa and its beach are next door.',
        fr: 'Les ruines de Carthage sont à un arrêt de TGM ; La Marsa et sa plage sont juste à côté.',
        ar: 'آثار قرطاج على بعد محطة واحدة، والمرسى وشاطئها بجوارها.' } },
    ],
    searchTerm: 'Sidi Bou Said',
    intro: {
      en: 'The village on its cliff above the Gulf of Tunis, built on the real terrain, streets and houses.',
      fr: 'Le village sur sa falaise au-dessus du golfe de Tunis, construit sur le vrai relief, les vraies rues et maisons.',
      ar: 'القرية على جرفها فوق خليج تونس، مبنية على التضاريس والشوارع والمنازل الحقيقية.',
    },
    loading: { en: 'Whitewashing the village…', fr: 'On blanchit le village à la chaux…', ar: 'جارٍ طلاء القرية بالأبيض…' },
    note: {
      en: 'Terrain, streets and many buildings come from real map data; houses on unmapped plots and all details are generated from reference photos.',
      fr: 'Relief, rues et de nombreux bâtiments viennent de vraies données cartographiques ; les maisons des parcelles non cartographiées et les détails sont générés d’après des photos.',
      ar: 'التضاريس والشوارع وكثير من المباني من بيانات خرائط حقيقية، أما المنازل في القطع غير المرسومة والتفاصيل فمولّدة اعتمادًا على صور مرجعية.',
    },
  },
  hotspots: HOTSPOTS,
  photos: 'sidi-bou-said',
  build: buildSidiBouSaid,
  toVec: (p, built) => {
    if (Array.isArray(p)) return new THREE.Vector3(...p);
    if ('x' in p) return new THREE.Vector3(p.x, (built.groundAt?.(p.x, p.z) ?? 0) + p.h, p.z);
    return new THREE.Vector3(0, p.y, 0);
  },
  intro: { center: [20, 95, 20], rx: 330, rz: 300, height: 120 },
  shadowClamp: 600,
  fog: 0.00055,
};
