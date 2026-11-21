import * as THREE from 'three';
import {
  ATT_LOOK, ATT_VIEW, BAB_BHAR_C, HP_MINARET, KASBAH_MINARET, MAHREZ_COURT, MAHREZ_DOME, TERRACE, TERRACE_H, YD_MINARET, ZIT_COURT, ZIT_MINARET, ZIT_MINARET_H,
  buildTunis,
} from '../monuments/tunis/build';
import type { Hotspot, SiteDef } from './types';

type P2 = [number, number];
const at = (p: P2, h: number) => ({ x: p[0], z: p[1], h });
const lerp = (a: P2, b: P2, t: number): P2 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

/** Places to see. Positions come from OpenStreetMap; viewpoints were checked for a clear line of sight. */
const HOTSPOTS: Hotspot[] = [
  {
    // in the courtyard, looking back at the minaret
    id: 'zitouna', marker: at(ZIT_MINARET, ZIT_MINARET_H + 1), view: at(lerp(ZIT_COURT, [-17.2, 148.8], 0.55), 1.5), fixedView: true, photo: 'zitouna',
    title: { en: 'The Zitouna Mosque', fr: 'La mosquée Zitouna', ar: 'جامع الزيتونة' },
    text: {
      en: 'The great mosque at the heart of the medina, around which the city grew. Founded in the early 8th century and rebuilt under the Aghlabids in the 9th, its prayer hall has 15 naves on about 160 ancient columns, many taken from Carthage. The 43 m minaret was built in 1894 on the model of the Kasbah Mosque’s. For centuries the mosque was also one of the great universities of the Islamic world.',
      fr: 'La grande mosquée au cœur de la médina, autour de laquelle la ville a grandi. Fondée au début du VIIIe siècle et reconstruite sous les Aghlabides au IXe, sa salle de prière compte 15 nefs sur environ 160 colonnes antiques, beaucoup venues de Carthage. Le minaret de 43 m a été bâti en 1894 sur le modèle de celui de la mosquée de la Kasbah. Pendant des siècles, la mosquée fut aussi l’une des grandes universités du monde islamique.',
      ar: 'الجامع الأعظم في قلب المدينة العتيقة، ومن حوله نمت المدينة. تأسّس في مطلع القرن الثامن وأعيد بناؤه في عهد الأغالبة في القرن التاسع، ويضمّ بيت صلاته 15 بلاطة على نحو 160 عمودًا قديمًا جُلب كثير منها من قرطاج. وبُنيت صومعته التي يبلغ ارتفاعها 43 م سنة 1894 على نموذج صومعة جامع القصبة. وكان الجامع طوال قرون من أكبر جامعات العالم الإسلامي.',
    },
  },
  {
    id: 'attarine', marker: at(ATT_LOOK, 3.2), view: at(ATT_VIEW, 1), fixedView: true, photo: 'attarine',
    title: { en: 'Souk el Attarine', fr: 'Le souk El Attarine', ar: 'سوق العطّارين' },
    text: {
      en: 'The perfumers’ souk, laid out around 1240 under the Hafsid ruler Abu Zakariya beside the Zitouna, is the oldest in Tunis. Under its vaults, shops sell essences of jasmine and rose, amber, henna and incense. The trades were arranged round the mosque: perfumes, books and fine cloth close by, noisier crafts such as the dyers and the blacksmiths further out.',
      fr: 'Le souk des parfumeurs, aménagé vers 1240 sous le souverain hafside Abou Zakariya à côté de la Zitouna, est le plus ancien de Tunis. Sous ses voûtes, les boutiques vendent essences de jasmin et de rose, ambre, henné et encens. Les métiers étaient rangés autour de la mosquée : parfums, livres et beaux tissus tout près, métiers bruyants comme les teinturiers et les forgerons plus loin.',
      ar: 'سوق العطّارين، أُنشئ نحو سنة 1240 في عهد السلطان الحفصي أبي زكرياء بجوار الزيتونة، وهو أقدم أسواق تونس. وتحت أقبيته تُباع عطور الياسمين والورد والعنبر والحنّاء والبخور. وقد رُتّبت الحِرف حول الجامع: العطور والكتب والأقمشة الرفيعة قريبًا منه، والحرف الصاخبة كالصبّاغين والحدّادين أبعد.',
    },
  },
  {
    id: 'kasbah', marker: at(KASBAH_MINARET, 33), view: at([-306.8, 120.9], 1), fixedView: true, photo: 'kasbah',
    title: { en: 'The Kasbah Mosque', fr: 'La mosquée de la Kasbah', ar: 'جامع القصبة' },
    text: {
      en: 'Built from about 1230 for Abu Zakariya, founder of the Hafsid dynasty, inside the citadel (kasbah) that stood here. Its minaret, finished in 1233, with panels of lozenge-net decoration in pale stone, follows the Almohad style of Marrakesh and became the model for the Zitouna’s. The square beside it is lined with ministries and the Prime Minister’s offices in Dar el Bey.',
      fr: 'Bâtie à partir de 1230 environ pour Abou Zakariya, fondateur de la dynastie hafside, dans la citadelle (kasbah) qui se dressait ici. Son minaret, achevé en 1233, orné de panneaux en résille de losanges en pierre claire, suit le style almohade de Marrakech et a servi de modèle à celui de la Zitouna. La place voisine est bordée de ministères et des bureaux du Premier ministère, à Dar el Bey.',
      ar: 'بُني ابتداءً من نحو سنة 1230 لأبي زكرياء مؤسّس الدولة الحفصية، داخل القصبة (القلعة) التي كانت قائمة هنا. وصومعته التي اكتملت سنة 1233، بلوحاتها المزخرفة بشبكة معيّنات من الحجر الفاتح، على الطراز الموحّدي في مراكش، وصارت نموذجًا لصومعة الزيتونة. وتحيط بالساحة المجاورة الوزارات ومقرّ رئاسة الحكومة في دار الباي.',
    },
  },
  {
    // the minaret stands among covered souks: seen from a rooftop café terrace, as from the cafés of the Souk el Trouk
    id: 'youssefdey', marker: at(YD_MINARET, 26), view: at(TERRACE, TERRACE_H + 1.5), fixedView: true, rooftop: true, photo: 'youssefdey',
    title: { en: 'Youssef Dey Mosque', fr: 'La mosquée Youssef Dey', ar: 'جامع يوسف داي' },
    text: {
      en: 'Finished around 1615 for Youssef Dey, it was the first mosque in Tunis built by the Ottoman rulers, for the Hanafi rite of the Turks. Its octagonal minaret, the first in the city, set the pattern for the Ottoman mosques that followed.',
      fr: 'Achevée vers 1615 pour Youssef Dey, c’est la première mosquée de Tunis bâtie par les maîtres ottomans, pour le rite hanéfite des Turcs. Son minaret octogonal, le premier de la ville, a fixé le modèle des mosquées ottomanes qui ont suivi.',
      ar: 'اكتمل نحو سنة 1615 ليوسف داي، وهو أول جامع بناه الحكّام العثمانيون في تونس، على المذهب الحنفي الذي كان عليه الأتراك. وصومعته المثمّنة، الأولى في المدينة، صارت نموذجًا للجوامع العثمانية التي تلته.',
    },
  },
  {
    // (the view is found when visiting: a clear spot near the given one)
    id: 'hammouda', marker: at(HP_MINARET, 25), view: at([-113.2, -5], 1), photo: 'hammouda',
    title: { en: 'Hammouda Pacha Mosque', fr: 'La mosquée Hammouda Pacha', ar: 'جامع حمودة باشا' },
    text: {
      en: 'Built in 1655 by Hammouda Pacha Bey, it was the second Hanafi mosque in Tunis. Its slender octagonal minaret follows the model of the Youssef Dey Mosque.',
      fr: 'Bâtie en 1655 par Hammouda Pacha Bey, c’est la deuxième mosquée hanéfite de Tunis. Son minaret octogonal élancé suit le modèle de la mosquée Youssef Dey.',
      ar: 'بناه حمودة باشا باي سنة 1655، وهو ثاني جامع حنفي في تونس. وصومعته المثمّنة الرشيقة على نموذج صومعة جامع يوسف داي.',
    },
  },
  {
    // in the Rue Tourbet el Bey, along the façade with its pilasters (the domes are seen from further off)
    id: 'tourbet', marker: at([162.1, 560.5], 6), view: at([166.3, 574.0], 1), fixedView: true, photo: 'tourbet',
    title: { en: 'Tourbet el Bey', fr: 'Tourbet el Bey', ar: 'تربة الباي' },
    text: {
      en: 'The largest mausoleum in Tunis, built under Ali II Bey (r. 1759–1782) for the Husainid beys, who ruled Tunisia until 1957. Most of the dynasty’s rulers lie here, in chambers under domes covered with green, scale-shaped tiles. Nearby stands Dar Ben Abdallah, an 18th-century palace that is now a museum of traditional life.',
      fr: 'Le plus grand mausolée de Tunis, bâti sous Ali II Bey (règne 1759–1782) pour les beys husseinites, qui ont régné sur la Tunisie jusqu’en 1957. La plupart des souverains de la dynastie reposent ici, dans des salles sous des coupoles couvertes de tuiles vertes en écailles. Tout près, Dar Ben Abdallah, palais du XVIIIe siècle, est devenu un musée de la vie traditionnelle.',
      ar: 'أكبر ضريح في تونس، بُني في عهد علي باي الثاني (حكم 1759–1782) للبايات الحسينيين الذين حكموا تونس حتى 1957. ويرقد هنا أغلب حكّام الأسرة، في قاعات تحت قباب مكسوّة بقرميد أخضر على شكل حراشف. وعلى مقربة منه دار بن عبد الله، قصر من القرن الثامن عشر صار متحفًا للحياة التقليدية.',
    },
  },
  {
    // in the courtyard, facing the hall and its domes
    id: 'mahrez', marker: at(MAHREZ_DOME, 19), view: at(MAHREZ_COURT, 1.5), fixedView: true, photo: 'mahrez',
    title: { en: 'Sidi Mahrez Mosque', fr: 'La mosquée Sidi Mahrez', ar: 'جامع سيدي محرز' },
    text: {
      en: 'Begun in 1692 by Mohamed Bey el Mouradi, opposite the tomb of Sidi Mahrez, patron saint of Tunis. Unlike the other mosques of the city, it follows the great Ottoman mosques of Istanbul: a central dome with smaller domes round it, and no minaret. Its walls are lined with tiles from Iznik in Turkey.',
      fr: 'Commencée en 1692 par Mohamed Bey el Mouradi, face au tombeau de Sidi Mahrez, saint patron de Tunis. Contrairement aux autres mosquées de la ville, elle suit les grandes mosquées ottomanes d’Istanbul : une coupole centrale entourée de coupoles plus petites, et pas de minaret. Ses murs sont revêtus de carreaux d’Iznik, en Turquie.',
      ar: 'شرع في بنائه محمد باي المرادي سنة 1692 قبالة ضريح سيدي محرز، الوليّ الصالح لمدينة تونس. وخلافًا لبقية جوامع المدينة، يحاكي الجوامع العثمانية الكبرى في إسطنبول: قبة وسطى تحيط بها قباب أصغر، ولا صومعة له. وتكسو جدرانَه خزفيات من إزنيق في تركيا.',
    },
  },
  {
    id: 'babbhar', marker: at(BAB_BHAR_C, 13), view: at([433.8, -74.9], 1), fixedView: true, photo: 'babbhar',
    title: { en: 'Bab Bhar', fr: 'Bab Bhar', ar: 'باب بحر' },
    text: {
      en: 'The Sea Gate, also called the Porte de France, stands where the medina meets the new town built from the late 19th century towards the lake. From here the Rue Jamaa Zitouna climbs through the souks to the Great Mosque.',
      fr: 'La porte de la Mer, aussi appelée porte de France, se dresse là où la médina rencontre la ville nouvelle bâtie à partir de la fin du XIXe siècle vers le lac. De là, la rue Jamaa Zitouna monte à travers les souks jusqu’à la Grande Mosquée.',
      ar: 'باب البحر، ويُسمّى أيضًا باب فرنسا، يقوم حيث تلتقي المدينة العتيقة بالمدينة الجديدة التي بُنيت منذ أواخر القرن التاسع عشر نحو البحيرة. ومنه يصعد نهج جامع الزيتونة عبر الأسواق إلى الجامع الأعظم.',
    },
  },
];

export const site: SiteDef = {
  id: 'tunis-medina',
  lat: 36.7985, lon: 10.1712,
  northRotation: 0,
  info: {
    name: { en: 'Medina of Tunis', fr: 'Médina de Tunis', ar: 'مدينة تونس العتيقة' },
    facts: [
      { k: { en: 'Heart', fr: 'Cœur', ar: 'القلب' }, v: { en: 'the Zitouna Mosque, founded in the 8th century', fr: 'la mosquée Zitouna, fondée au VIIIe siècle', ar: 'جامع الزيتونة، تأسّس في القرن الثامن' } },
      { k: { en: 'Capital', fr: 'Capitale', ar: 'عاصمة' }, v: { en: 'of the Hafsids from 1229, then of the Ottoman deys and the beys', fr: 'des Hafsides dès 1229, puis des deys ottomans et des beys', ar: 'للحفصيين منذ 1229، ثم للدايات العثمانيين والبايات' } },
      { k: { en: 'Monuments', fr: 'Monuments', ar: 'المعالم' }, v: { en: 'some 700: mosques, palaces, mausoleums, madrasas, fountains', fr: 'quelque 700 : mosquées, palais, mausolées, médersas, fontaines', ar: 'نحو 700: جوامع وقصور وأضرحة ومدارس وسبالات' } },
      { k: { en: 'UNESCO', fr: 'UNESCO', ar: 'اليونسكو' }, v: { en: 'World Heritage since 1979', fr: 'Patrimoine mondial depuis 1979', ar: 'تراث عالمي منذ 1979' } },
    ],
    visit: [
      { k: { en: 'Getting there', fr: 'Accès', ar: 'الوصول' }, v: {
        en: 'In central Tunis: walk from the Avenue Habib Bourguiba through Bab Bhar, then up the Rue Jamaa Zitouna.',
        fr: 'Au centre de Tunis : depuis l’avenue Habib Bourguiba, passez Bab Bhar, puis montez la rue Jamaa Zitouna.',
        ar: 'في وسط تونس: انطلق من شارع الحبيب بورقيبة عبر باب بحر، ثم اصعد نهج جامع الزيتونة.' } },
      { k: { en: 'Visiting', fr: 'Visite', ar: 'الزيارة' }, v: {
        en: 'The lanes and souks are free. Non-Muslim visitors may look into the Zitouna’s courtyard from the visitors’ area outside prayer times; dress modestly. Some palaces are museums with tickets.',
        fr: 'Ruelles et souks sont libres d’accès. Les visiteurs non musulmans peuvent voir la cour de la Zitouna depuis l’espace des visiteurs, hors des heures de prière ; tenue correcte. Certains palais sont des musées payants.',
        ar: 'الأزقّة والأسواق مفتوحة مجانًا. ويمكن للزوار غير المسلمين مشاهدة صحن الزيتونة من الفضاء المخصّص للزوار خارج أوقات الصلاة، مع لباس محتشم. وبعض القصور متاحف بتذاكر.' } },
      { k: { en: 'Best time', fr: 'Meilleure période', ar: 'أفضل وقت' }, v: {
        en: 'Mornings, when the souks open. Climb to a rooftop café for the view over the minarets.',
        fr: 'Le matin, à l’ouverture des souks. Montez sur la terrasse d’un café pour la vue sur les minarets.',
        ar: 'الصباح، حين تفتح الأسواق. واصعد إلى سطح أحد المقاهي لتطلّ على الصوامع.' } },
    ],
    searchTerm: 'Medina of Tunis',
    intro: {
      en: 'The Zitouna Mosque, the vaulted souks, the minarets and the gates, on the real lanes of the medina of Tunis.',
      fr: 'La mosquée Zitouna, les souks voûtés, les minarets et les portes, sur les vraies ruelles de la médina de Tunis.',
      ar: 'جامع الزيتونة والأسواق المسقوفة والصوامع والأبواب، على أزقّة مدينة تونس العتيقة الحقيقية.',
    },
    loading: { en: 'Opening the souks of Tunis…', fr: 'On ouvre les souks de Tunis…', ar: 'جارٍ فتح أسواق تونس…' },
    note: {
      en: 'Terrain, lanes, squares and monument outlines come from real map data; the monuments are modelled from photos and published descriptions, simplified. The houses of the medina and of the city around it are generated.',
      fr: 'Relief, ruelles, places et contours des monuments viennent de vraies données cartographiques ; les monuments sont modélisés d’après des photos et des descriptions publiées, simplifiés. Les maisons de la médina et de la ville autour sont générées.',
      ar: 'التضاريس والأزقّة والساحات وحدود المعالم من بيانات خرائط حقيقية، والمعالم منمذجة بتبسيط اعتمادًا على صور وأوصاف منشورة. ومنازل المدينة العتيقة والمدينة المحيطة بها مولّدة.',
    },
  },
  hotspots: HOTSPOTS,
  photos: 'tunis-medina',
  build: buildTunis,
  toVec: (p, built) => {
    if (Array.isArray(p)) return new THREE.Vector3(...p);
    if ('x' in p) return new THREE.Vector3(p.x, (built.groundAt?.(p.x, p.z) ?? 0) + p.h, p.z);
    return new THREE.Vector3(0, p.y, 0);
  },
  intro: { center: [0, 50, 0], rx: 620, rz: 760, height: 280 },
  shadowClamp: 850,
  fog: 0.0005,
};
