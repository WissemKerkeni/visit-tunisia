/**
 * Places on the home map that are cards only (no 3D walk): beaches, nature, the Sahara and its oases,
 * and more heritage. Facts are kept short and checked against published sources (see README);
 * photos come from Wikimedia Commons with credits (scripts/find-place-photos.mjs).
 */
import type { T3 } from '../i18n';

export type Cat = 'historic' | 'beach' | 'nature' | 'sahara';
export const CATS: Cat[] = ['historic', 'beach', 'nature', 'sahara'];

export interface Place {
  id: string;
  cat: Cat;
  lat: number;
  lon: number;
  name: T3;
  text: T3;
  /** The nearest town with places to stay, for the hotel search. */
  search: string;
  unesco?: boolean;
}

/** The categories the 12 walkable monuments are also listed under (all of them are 'historic'). */
export const SITE_CATS: Record<string, Cat[]> = {
  'sidi-bou-said': ['historic', 'beach'],
  djerba: ['historic', 'beach'],
  matmata: ['historic', 'sahara'],
  'ksar-ouled-soltane': ['historic', 'sahara'],
};

export const PLACES: Place[] = [
  // ---------------- heritage ----------------
  { id: 'kerkouane', cat: 'historic', lat: 36.9464, lon: 11.0992, unesco: true, search: 'Kelibia',
    name: { en: 'Kerkouane', fr: 'Kerkouane', ar: 'كركوان' },
    text: {
      en: 'A Punic town on the cliffs of Cap Bon, abandoned around 250 BCE and never built over by the Romans. Its streets, houses and pink-plastered baths show how Carthaginians lived.',
      fr: 'Une ville punique sur les falaises du cap Bon, abandonnée vers 250 av. J.-C. et jamais recouverte par les Romains. Ses rues, ses maisons et ses baignoires enduites de rose montrent comment vivaient les Carthaginois.',
      ar: 'مدينة بونيقية على جروف الوطن القبلي، هُجرت نحو 250 ق.م ولم يبنِ الرومان فوقها. شوارعها وبيوتها وأحواض استحمامها المطلية بالوردي تُظهر كيف عاش القرطاجيون.',
    } },
  { id: 'monastir', cat: 'historic', lat: 35.776, lon: 10.833, search: 'Monastir',
    name: { en: 'Ribat of Monastir', fr: 'Ribat de Monastir', ar: 'رباط المنستير' },
    text: {
      en: 'A fortress-monastery founded in 796 to guard the coast, often called the oldest ribat in North Africa. Climb the watchtower for the view over the sea and the Bourguiba mausoleum.',
      fr: 'Un monastère-forteresse fondé en 796 pour garder la côte, souvent présenté comme le plus ancien ribat du Maghreb. Montez à la tour de guet pour la vue sur la mer et le mausolée de Bourguiba.',
      ar: 'حصن ورباط تأسّس سنة 796 لحراسة الساحل، ويُعدّ غالبًا أقدم رباط في شمال إفريقيا. اصعد برج المراقبة لتطلّ على البحر وعلى ضريح بورقيبة.',
    } },
  { id: 'mahdia', cat: 'historic', lat: 35.504, lon: 11.068, search: 'Mahdia',
    name: { en: 'Mahdia', fr: 'Mahdia', ar: 'المهدية' },
    text: {
      en: 'The capital the Fatimids founded in 916 on a narrow peninsula. You enter the old town through the Skifa el Kahla, a dark fortified gate, and end at the marine cemetery above the sea.',
      fr: 'La capitale fondée par les Fatimides en 916 sur une étroite presqu’île. On entre dans la vieille ville par la Skifa el Kahla, sombre porte fortifiée, et l’on finit au cimetière marin, au-dessus de la mer.',
      ar: 'عاصمة أسّسها الفاطميون سنة 916 على شبه جزيرة ضيّقة. تدخل المدينة العتيقة من السقيفة الكحلة، باب محصّن معتم، وتنتهي عند المقبرة البحرية المطلّة على البحر.',
    } },
  { id: 'le-kef', cat: 'historic', lat: 36.182, lon: 8.714, search: 'Le Kef',
    name: { en: 'Le Kef', fr: 'Le Kef', ar: 'الكاف' },
    text: {
      en: 'A hill town of the north-west, ancient Sicca Veneria, crowned by an Ottoman kasbah. Its lanes hold a Roman-era basilica, old zaouias and wide views over the high plains.',
      fr: 'Une ville perchée du nord-ouest, l’antique Sicca Veneria, couronnée par une kasbah ottomane. Ses ruelles abritent une basilique antique, d’anciennes zaouïas et de larges vues sur les hautes plaines.',
      ar: 'مدينة جبلية في الشمال الغربي، سيكا فينيريا القديمة، تعلوها قصبة عثمانية. في أزقّتها بازيليكا قديمة وزوايا عتيقة وإطلالات واسعة على السهول العليا.',
    } },
  { id: 'testour', cat: 'historic', lat: 36.552, lon: 9.444, search: 'Testour',
    name: { en: 'Testour', fr: 'Testour', ar: 'تستور' },
    text: {
      en: 'A town rebuilt in the early 17th century by Muslims expelled from Spain. The Great Mosque’s minaret carries a clock whose numbers run backwards, and its tiled roofs recall Andalusia.',
      fr: 'Une ville rebâtie au début du XVIIe siècle par des musulmans chassés d’Espagne. Le minaret de la Grande Mosquée porte une horloge dont les chiffres tournent à l’envers, et ses toits de tuiles rappellent l’Andalousie.',
      ar: 'بلدة أعاد بناءها في مطلع القرن السابع عشر مسلمون طُردوا من إسبانيا. تحمل صومعة جامعها الكبير ساعة تدور أرقامها بالعكس، وأسقف القرميد في الجامع تذكّر بالأندلس.',
    } },
  { id: 'zaghouan', cat: 'historic', lat: 36.387, lon: 10.133, search: 'Zaghouan',
    name: { en: 'Water Temple of Zaghouan', fr: 'Temple des Eaux de Zaghouan', ar: 'معبد المياه بزغوان' },
    text: {
      en: 'A Roman sanctuary of the 2nd century at the foot of Jebel Zaghouan, built over the spring that fed Carthage. From here an aqueduct ran about 130 km to the city.',
      fr: 'Un sanctuaire romain du IIe siècle au pied du djebel Zaghouan, bâti sur la source qui alimentait Carthage. De là, un aqueduc courait sur environ 130 km jusqu’à la ville.',
      ar: 'معبد روماني من القرن الثاني عند سفح جبل زغوان، بُني فوق العين التي كانت تزوّد قرطاج بالماء. ومنه امتدّت حنايا بطول نحو 130 كم حتى المدينة.',
    } },
  { id: 'thuburbo-majus', cat: 'historic', lat: 36.402, lon: 9.903, search: 'Zaghouan',
    name: { en: 'Thuburbo Majus', fr: 'Thuburbo Majus', ar: 'تبربو ماجوس' },
    text: {
      en: 'A Roman town in farmland an hour from Tunis: a forum with the columns of its Capitol still standing, baths with mosaic floors and a colonnaded exercise court.',
      fr: 'Une ville romaine au milieu des terres agricoles, à une heure de Tunis : un forum où se dressent encore les colonnes du Capitole, des thermes à sols de mosaïque et une palestre à colonnade.',
      ar: 'مدينة رومانية وسط الأراضي الزراعية على بعد ساعة من تونس: ساحة عامة ما زالت أعمدة الكابيتول قائمة فيها، وحمّامات بأرضيات فسيفسائية وساحة رياضة ذات أعمدة.',
    } },
  { id: 'oudhna', cat: 'historic', lat: 36.608, lon: 10.17, search: 'Tunis',
    name: { en: 'Oudhna (Uthina)', fr: 'Oudhna (Uthina)', ar: 'أوذنة' },
    text: {
      en: 'A quiet Roman site half an hour south of Tunis, with an amphitheatre dug into a hill, a huge Capitol on vaulted basements and large public baths.',
      fr: 'Un site romain tranquille à une demi-heure au sud de Tunis, avec un amphithéâtre creusé dans une colline, un immense Capitole sur des sous-sols voûtés et de grands thermes publics.',
      ar: 'موقع روماني هادئ على نصف ساعة جنوب تونس، فيه مدرج محفور في تلّة وكابيتول ضخم فوق أقبية وحمّامات عمومية كبيرة.',
    } },
  { id: 'makthar', cat: 'historic', lat: 35.856, lon: 9.206, search: 'Makthar',
    name: { en: 'Makthar', fr: 'Makthar', ar: 'مكثر' },
    text: {
      en: 'A Numidian then Roman town on a high plateau: a triumphal arch to Trajan, great baths with walls still several storeys tall, and megalithic tombs older than Rome’s rule.',
      fr: 'Une ville numide puis romaine sur un haut plateau : un arc de triomphe dédié à Trajan, de grands thermes aux murs encore hauts de plusieurs étages, et des tombeaux mégalithiques antérieurs à Rome.',
      ar: 'مدينة نوميدية ثم رومانية على هضبة عالية: قوس نصر لتراجان، وحمّامات كبرى ما زالت جدرانها بعلوّ عدّة طوابق، وقبور ميغاليثية أقدم من الحكم الروماني.',
    } },
  { id: 'bardo', cat: 'historic', lat: 36.8093, lon: 10.1345, search: 'Tunis',
    name: { en: 'Bardo Museum', fr: 'Musée du Bardo', ar: 'متحف باردو' },
    text: {
      en: 'One of the world’s great collections of Roman mosaics, shown in a palace of the beys in Tunis. It holds floors lifted from Carthage, Dougga, El Jem and many other Roman sites.',
      fr: 'L’une des plus grandes collections de mosaïques romaines au monde, présentée dans un palais des beys à Tunis. On y voit des pavements venus de Carthage, Dougga, El Jem et de bien d’autres sites romains.',
      ar: 'من أعظم مجموعات الفسيفساء الرومانية في العالم، معروضة في قصر للبايات بتونس. وفيه أرضيات نُقلت من قرطاج ودقة والجم ومواقع رومانية أخرى كثيرة.',
    } },
  { id: 'chenini', cat: 'historic', lat: 32.911, lon: 10.262, search: 'Tataouine',
    name: { en: 'Chenini', fr: 'Chenini', ar: 'شنني' },
    text: {
      en: 'A Berber village clinging to a ridge near Tataouine: cave houses cut into the rock, a ruined hilltop granary and a white mosque below the crest.',
      fr: 'Un village berbère accroché à une crête près de Tataouine : des maisons troglodytes creusées dans la roche, un grenier fortifié en ruine au sommet et une mosquée blanche sous la crête.',
      ar: 'قرية أمازيغية متشبّثة بحافّة جبل قرب تطاوين: بيوت محفورة في الصخر، وقصر خزين متهدّم في القمّة، وجامع أبيض تحت الحافّة.',
    } },
  { id: 'chemtou', cat: 'historic', lat: 36.492, lon: 8.575, search: 'Jendouba',
    name: { en: 'Chemtou', fr: 'Chemtou', ar: 'شمتو' },
    text: {
      en: 'The quarries of the yellow “Numidian marble” that Rome shipped across its empire, with a site museum near the quarries and the remains of a Roman bridge over the Medjerda.',
      fr: 'Les carrières du « marbre numidique » jaune que Rome expédiait dans tout son empire, avec un musée de site près des carrières et les vestiges d’un pont romain sur la Medjerda.',
      ar: 'مقالع «الرخام النوميدي» الأصفر الذي كانت روما تنقله إلى أرجاء إمبراطوريتها، مع متحف قرب المقالع وبقايا جسر روماني على مجردة.',
    } },

  // ---------------- beaches ----------------
  { id: 'hammamet', cat: 'beach', lat: 36.395, lon: 10.613, search: 'Hammamet',
    name: { en: 'Hammamet', fr: 'Hammamet', ar: 'الحمامات' },
    text: {
      en: 'Tunisia’s best-known resort: long sandy beaches on a sheltered gulf, and a small walled medina with a kasbah right on the water. Jasmine bouquets are sold in the streets on summer evenings.',
      fr: 'La station la plus connue de Tunisie : de longues plages de sable sur un golfe abrité, et une petite médina fortifiée avec sa kasbah au bord de l’eau. Le soir, en été, on vend des bouquets de jasmin dans les rues.',
      ar: 'أشهر منتجع في تونس: شواطئ رملية طويلة على خليج محميّ، ومدينة عتيقة صغيرة مسوّرة بقصبتها على حافّة الماء. وفي أمسيات الصيف تُباع مشامم الياسمين في الشوارع.',
    } },
  { id: 'mahdia-beach', cat: 'beach', lat: 35.535, lon: 11.035, search: 'Mahdia',
    name: { en: 'Mahdia’s beaches', fr: 'Plages de Mahdia', ar: 'شواطئ المهدية' },
    text: {
      en: 'North of the old town, a long beach of fine white sand runs past the hotel zone, with clear, shallow turquoise water. It is often ranked among the finest beaches in Tunisia, and quieter than Hammamet or Sousse.',
      fr: 'Au nord de la vieille ville, une longue plage de sable blanc et fin longe la zone touristique, avec une eau turquoise claire et peu profonde. On la classe souvent parmi les plus belles plages de Tunisie, plus calme que Hammamet ou Sousse.',
      ar: 'شمال المدينة العتيقة يمتدّ شاطئ طويل من الرمل الأبيض الناعم على طول المنطقة السياحية، بماء فيروزي صافٍ وضحل. ويُعدّ كثيرًا من أجمل شواطئ تونس، وأهدأ من الحمامات وسوسة.',
    } },
  { id: 'kelibia', cat: 'beach', lat: 36.838, lon: 11.115, search: 'Kelibia',
    name: { en: 'Kelibia', fr: 'Kélibia', ar: 'قليبية' },
    text: {
      en: 'A fishing port on Cap Bon below a hilltop fortress. The beaches of El Mansoura, a few minutes north, have white sand and very clear water.',
      fr: 'Un port de pêche du cap Bon, au pied d’une forteresse perchée. Les plages d’El Mansoura, à quelques minutes au nord, ont un sable blanc et une eau très claire.',
      ar: 'ميناء صيد في الوطن القبلي تحت قلعة على تلّة. وشواطئ المنصورة، على دقائق شمالًا، رملها أبيض وماؤها شديد الصفاء.',
    } },
  { id: 'tabarka', cat: 'beach', lat: 36.956, lon: 8.758, search: 'Tabarka',
    name: { en: 'Tabarka', fr: 'Tabarka', ar: 'طبرقة' },
    text: {
      en: 'Where the green Kroumirie mountains meet the sea. A Genoese fort crowns its former island, rock needles rise by the harbour, and its red coral beds draw divers.',
      fr: 'Là où les montagnes vertes de Kroumirie rejoignent la mer. Un fort génois couronne son ancienne île, des aiguilles rocheuses s’élèvent près du port, et ses fonds de corail rouge attirent les plongeurs.',
      ar: 'حيث تلتقي جبال خمير الخضراء بالبحر. حصن جنوي يعلو جزيرتها السابقة، وإبر صخرية ترتفع قرب الميناء، ومرجانها الأحمر يجذب الغوّاصين.',
    } },
  { id: 'ghar-el-melh', cat: 'beach', lat: 37.168, lon: 10.188, search: 'Ghar El Melh',
    name: { en: 'Ghar El Melh', fr: 'Ghar El Melh', ar: 'غار الملح' },
    text: {
      en: 'An old corsair harbour with three Ottoman forts on a lagoon. Beyond it, the beach of Sidi Ali El Mekki runs under a cape, with straw huts set up along the water’s edge in summer.',
      fr: 'Un ancien port corsaire avec trois forts ottomans au bord d’une lagune. Au-delà, la plage de Sidi Ali El Mekki s’étire sous un cap, avec en été des paillotes installées au bord de l’eau.',
      ar: 'ميناء قراصنة قديم بثلاثة أبراج عثمانية على بحيرة. وبعده يمتدّ شاطئ سيدي علي المكي تحت رأس جبلي، وتُنصب صيفًا أكواخ القشّ على حافّة الماء.',
    } },
  { id: 'raf-raf', cat: 'beach', lat: 37.19, lon: 10.185, search: 'Raf Raf',
    name: { en: 'Raf Raf', fr: 'Raf Raf', ar: 'رفراف' },
    text: {
      en: 'A long crescent of sand below hills of vineyards, facing the rocky islet of Pilau. A popular summer beach for families from Tunis and Bizerte.',
      fr: 'Un long croissant de sable au pied de collines de vignes, face à l’îlot rocheux de Pilau. Une plage d’été très fréquentée par les familles de Tunis et de Bizerte.',
      ar: 'هلال طويل من الرمل تحت تلال الكروم، قبالة جزيرة بيلاو الصخرية. شاطئ صيفي يقصده كثير من عائلات تونس وبنزرت.',
    } },
  { id: 'la-marsa', cat: 'beach', lat: 36.884, lon: 10.332, search: 'La Marsa',
    name: { en: 'La Marsa', fr: 'La Marsa', ar: 'المرسى' },
    text: {
      en: 'The seaside end of the TGM line from Tunis: a corniche, a town beach and cafés. An easy swim after a day in Carthage and Sidi Bou Said next door.',
      fr: 'Le terminus balnéaire du TGM depuis Tunis : une corniche, une plage de ville et des cafés. Une baignade facile après une journée à Carthage et Sidi Bou Saïd, juste à côté.',
      ar: 'نهاية خطّ الـTGM القادم من تونس على البحر: كورنيش وشاطئ ومقاهٍ. سباحة سهلة بعد يوم في قرطاج وسيدي بوسعيد المجاورتين.',
    } },
  { id: 'kantaoui', cat: 'beach', lat: 35.893, lon: 10.595, search: 'Port El Kantaoui',
    name: { en: 'Port El Kantaoui', fr: 'Port El Kantaoui', ar: 'ميناء القنطاوي' },
    text: {
      en: 'A marina resort built in 1979 just north of Sousse, in the white-and-blue style of the coast: boat trips, a golf course and hotel beaches on either side.',
      fr: 'Une station-marina construite en 1979 juste au nord de Sousse, dans le style blanc et bleu de la côte : sorties en bateau, golf et plages d’hôtels de part et d’autre.',
      ar: 'منتجع ومرسى بُني سنة 1979 شمال سوسة مباشرة، على طراز الساحل الأبيض والأزرق: رحلات بحرية وملعب غولف وشواطئ فنادق على الجانبين.',
    } },
  { id: 'kerkennah', cat: 'beach', lat: 34.71, lon: 11.17, search: 'Kerkennah',
    name: { en: 'Kerkennah Islands', fr: 'Îles Kerkennah', ar: 'جزر قرقنة' },
    text: {
      en: 'Flat, quiet islands an hour by ferry from Sfax, ringed by shallow turquoise water. Fishermen still use the charfia, fences of palm fronds set in the sea, listed by UNESCO as living heritage.',
      fr: 'Des îles plates et paisibles à une heure de ferry de Sfax, entourées d’eaux turquoise peu profondes. Les pêcheurs y utilisent encore la charfia, des barrières de palmes plantées en mer, inscrite par l’UNESCO au patrimoine vivant.',
      ar: 'جزر منبسطة هادئة على ساعة بالعبّارة من صفاقس، تحيط بها مياه فيروزية ضحلة. ما زال الصيادون يستعملون «الشرفية»، حواجز من سعف النخيل تُغرس في البحر، وقد أدرجتها اليونسكو تراثًا حيًّا.',
    } },
  { id: 'djerba-beach', cat: 'beach', lat: 33.854, lon: 10.99, search: 'Djerba',
    name: { en: 'Djerba’s beaches', fr: 'Plages de Djerba', ar: 'شواطئ جربة' },
    text: {
      en: 'The island’s north-east coast is one long beach of fine sand, from Sidi Mahrez to Seguia, with warm shallow water from late spring well into autumn.',
      fr: 'La côte nord-est de l’île est une longue plage de sable fin, de Sidi Mahrez à la Séguia, avec une eau chaude et peu profonde de la fin du printemps jusqu’en automne.',
      ar: 'الساحل الشمالي الشرقي للجزيرة شاطئ طويل من الرمل الناعم، من سيدي محرز إلى السقية، بماء دافئ ضحل من أواخر الربيع حتى الخريف.',
    } },
  { id: 'zarzis', cat: 'beach', lat: 33.504, lon: 11.112, search: 'Zarzis',
    name: { en: 'Zarzis', fr: 'Zarzis', ar: 'جرجيس' },
    text: {
      en: 'A southern coast of white sand and palms, backed by vast olive groves. Calmer than Djerba, which you reach by a causeway on Roman foundations to the north.',
      fr: 'Un littoral du sud, de sable blanc et de palmiers, adossé à d’immenses oliveraies. Plus calme que Djerba, que l’on rejoint par une chaussée bâtie sur des fondations romaines, au nord.',
      ar: 'ساحل جنوبي من رمل أبيض ونخيل، تسنده غابات زيتون شاسعة. أهدأ من جربة التي تبلغها عبر طريق مبنيّ على أسس رومانية شمالًا.',
    } },
  { id: 'korbous', cat: 'beach', lat: 36.817, lon: 10.568, search: 'Korbous',
    name: { en: 'Korbous', fr: 'Korbous', ar: 'قربص' },
    text: {
      en: 'A spa village squeezed between cliffs and sea on Cap Bon, known since Roman times for its hot springs. At Aïn Atrous the hot water pours straight into the sea, and people bathe where they mix.',
      fr: 'Un village thermal serré entre falaises et mer sur le cap Bon, connu depuis l’époque romaine pour ses sources chaudes. À Aïn Atrous, l’eau chaude se jette directement dans la mer, et l’on se baigne là où elles se mêlent.',
      ar: 'قرية استشفائية محصورة بين الجروف والبحر في الوطن القبلي، عُرفت منذ العهد الروماني بعيونها الحارّة. وفي عين العتروس يصبّ الماء الساخن مباشرة في البحر، فيستحمّ الناس حيث يختلطان.',
    } },

  // ---------------- nature ----------------
  { id: 'ichkeul', cat: 'nature', lat: 37.14, lon: 9.66, unesco: true, search: 'Bizerte',
    name: { en: 'Ichkeul National Park', fr: 'Parc national de l’Ichkeul', ar: 'الحديقة الوطنية بإشكل' },
    text: {
      en: 'A lake and marshes under a lone mountain, and a major stopover for hundreds of thousands of migrating birds: ducks, geese, storks and flamingos, many of which winter on the lake. World Heritage since 1980.',
      fr: 'Un lac et des marais au pied d’une montagne isolée, grande halte pour des centaines de milliers d’oiseaux migrateurs : canards, oies, cigognes et flamants, dont beaucoup hivernent sur le lac. Patrimoine mondial depuis 1980.',
      ar: 'بحيرة ومستنقعات تحت جبل منفرد، ومحطّة كبرى لمئات الآلاف من الطيور المهاجرة: البطّ والإوزّ واللقالق والنحام، ويقضي كثير منها الشتاء في البحيرة. تراث عالمي منذ 1980.',
    } },
  { id: 'ain-draham', cat: 'nature', lat: 36.776, lon: 8.687, search: 'Ain Draham',
    name: { en: 'Aïn Draham', fr: 'Aïn Draham', ar: 'عين دراهم' },
    text: {
      en: 'A mountain village with red-tiled roofs at about 800 m in the Kroumirie, the wettest corner of Tunisia. Forests of cork oak all around, mist in autumn and often snow in winter.',
      fr: 'Un village de montagne aux toits de tuiles rouges, à environ 800 m dans la Kroumirie, le coin le plus arrosé de Tunisie. Des forêts de chênes-lièges tout autour, de la brume en automne et souvent de la neige en hiver.',
      ar: 'قرية جبلية بأسقف قرميد أحمر على ارتفاع نحو 800 م في خمير، أكثر جهات تونس مطرًا. غابات فلّين من كل جانب، وضباب في الخريف وثلج في الشتاء غالبًا.',
    } },
  { id: 'el-haouaria', cat: 'nature', lat: 37.052, lon: 11.008, search: 'El Haouaria',
    name: { en: 'El Haouaria', fr: 'El Haouaria', ar: 'الهوارية' },
    text: {
      en: 'The tip of Cap Bon, facing Sicily. Sea caves that were Punic and Roman stone quarries, a town of falconers with a festival each June, and birds of prey crossing the strait in spring.',
      fr: 'La pointe du cap Bon, face à la Sicile. Des grottes marines qui furent des carrières puniques et romaines, une ville de fauconniers avec son festival en juin, et des rapaces qui traversent le détroit au printemps.',
      ar: 'طرف الوطن القبلي قبالة صقلية. مغاور بحرية كانت مقالع حجارة بونيقية ورومانية، وبلدة البيازرة بمهرجانها كل جوان، وجوارح تعبر المضيق في الربيع.',
    } },
  { id: 'cape-angela', cat: 'nature', lat: 37.347, lon: 9.742, search: 'Bizerte',
    name: { en: 'Cape Angela', fr: 'Cap Angela', ar: 'رأس أنجلة' },
    text: {
      en: 'Officially the northernmost point of Africa, a rocky cape west of Bizerte marked by a monument shaped like the map of Africa.',
      fr: 'Officiellement le point le plus au nord de l’Afrique, un cap rocheux à l’ouest de Bizerte, signalé par un monument en forme de carte de l’Afrique.',
      ar: 'تُعتمد رسميًّا أقصى نقطة شمالية في إفريقيا، رأس صخري غرب بنزرت يعلّمه نصب على شكل خريطة إفريقيا.',
    } },
  { id: 'chambi', cat: 'nature', lat: 35.206, lon: 8.676, search: 'Kasserine',
    name: { en: 'Jebel Chambi', fr: 'Djebel Chambi', ar: 'جبل الشعانبي' },
    text: {
      en: 'Tunisia’s highest mountain, 1,544 m, above Kasserine, covered in Aleppo pine. It is a national park, but it has been a closed military zone since 2014 and is not open to visitors.',
      fr: 'Le plus haut sommet de Tunisie, 1 544 m, au-dessus de Kasserine, couvert de pins d’Alep. C’est un parc national, mais c’est une zone militaire fermée depuis 2014, interdite aux visiteurs.',
      ar: 'أعلى جبل في تونس، 1544 م، فوق القصرين، يكسوه الصنوبر الحلبي. وهو حديقة وطنية، لكنه منطقة عسكرية مغلقة منذ 2014 ولا يُسمح للزوار بدخوله.',
    } },
  { id: 'bou-hedma', cat: 'nature', lat: 34.48, lon: 9.63, search: 'Sidi Bouzid',
    name: { en: 'Bou Hedma National Park', fr: 'Parc national de Bou Hedma', ar: 'الحديقة الوطنية ببوهدمة' },
    text: {
      en: 'A last piece of acacia savanna on the steppes north of the Sahara. Scimitar-horned oryx, brought back here in 1985, graze under the trees with ostriches.',
      fr: 'Un dernier morceau de savane à acacias, dans les steppes au nord du Sahara. Les oryx algazelles, réintroduits ici en 1985, y paissent sous les arbres avec des autruches.',
      ar: 'آخر قطعة من سافانا الطلح في السهوب شمال الصحراء. يرعى تحت أشجارها المها أبو حراب الذي أُعيد إلى هنا سنة 1985، مع النعام.',
    } },
  { id: 'zembra', cat: 'nature', lat: 37.125, lon: 10.806, search: 'El Haouaria',
    name: { en: 'Zembra', fr: 'Zembra', ar: 'زمبرة' },
    text: {
      en: 'A steep island in the Gulf of Tunis, held by the army and protected as a national park with huge seabird colonies. Landing needs a permit, but you see it from much of Cap Bon’s coast.',
      fr: 'Une île escarpée du golfe de Tunis, tenue par l’armée et protégée en parc national, aux immenses colonies d’oiseaux marins. Il faut une autorisation pour y débarquer, mais on la voit d’une grande partie de la côte du cap Bon.',
      ar: 'جزيرة وعرة في خليج تونس يسيطر عليها الجيش وهي محميّة كحديقة وطنية فيها مستعمرات ضخمة من طيور البحر. النزول فيها يتطلّب ترخيصًا، لكنك تراها من جزء كبير من ساحل الوطن القبلي.',
    } },
  { id: 'jugurtha', cat: 'nature', lat: 35.746, lon: 8.376, search: 'Le Kef',
    name: { en: 'Jugurtha’s Table', fr: 'Table de Jugurtha', ar: 'مائدة يوغرطة' },
    text: {
      en: 'A flat-topped mountain with sheer sides, 1,271 m high, near the Algerian border. Steps cut in the rock lead to the top, where the Numidian king Jugurtha is said to have held out against Rome.',
      fr: 'Une montagne au sommet plat et aux parois à pic, haute de 1 271 m, près de la frontière algérienne. Des marches taillées dans la roche mènent au sommet, où le roi numide Jugurtha aurait résisté à Rome.',
      ar: 'جبل مسطّح القمّة شديد الانحدار بعلوّ 1271 م قرب الحدود الجزائرية. درجات منحوتة في الصخر تقود إلى القمّة، حيث يُروى أن الملك النوميدي يوغرطة صمد في وجه روما.',
    } },

  // ---------------- Sahara and oases ----------------
  { id: 'tozeur', cat: 'sahara', lat: 33.918, lon: 8.133, search: 'Tozeur',
    name: { en: 'Tozeur', fr: 'Tozeur', ar: 'توزر' },
    text: {
      en: 'The capital of the Djerid, beside a palm grove of hundreds of thousands of date palms. In the old quarter of Ouled el Hadef, walls of pale brick are laid in geometric patterns found almost only here and in Nefta.',
      fr: 'La capitale du Djérid, au bord d’une palmeraie de centaines de milliers de dattiers. Dans le vieux quartier d’Ouled el Hadef, les murs de brique claire dessinent des motifs géométriques qu’on ne voit presque qu’ici et à Nefta.',
      ar: 'عاصمة الجريد، بجانب واحة فيها مئات الآلاف من نخيل التمر. وفي حيّ أولاد الهادف العتيق، تُرصّ جدران الآجرّ الفاتح بزخارف هندسية لا تكاد تُرى إلا هنا وفي نفطة.',
    } },
  { id: 'nefta', cat: 'sahara', lat: 33.873, lon: 7.878, search: 'Nefta',
    name: { en: 'Nefta', fr: 'Nefta', ar: 'نفطة' },
    text: {
      en: 'An oasis town of domes and Sufi shrines near the Algerian border. Its “Corbeille” is a deep natural bowl filled with palms, seen from the cafés on its rim.',
      fr: 'Une ville-oasis de coupoles et de sanctuaires soufis près de la frontière algérienne. Sa « Corbeille » est une profonde cuvette naturelle remplie de palmiers, que l’on contemple depuis les cafés du bord.',
      ar: 'مدينة واحة ذات قباب ومقامات صوفية قرب الحدود الجزائرية. و«القفّة» حوض طبيعي عميق يملؤه النخيل، يُشاهد من مقاهي حافّته.',
    } },
  { id: 'chebika', cat: 'sahara', lat: 34.321, lon: 7.939, search: 'Tamerza',
    name: { en: 'Chebika', fr: 'Chebika', ar: 'الشبيكة' },
    text: {
      en: 'A mountain oasis at the mouth of a gorge: a spring, a small waterfall and palms below bare rock. The old village above was left after the floods of 1969.',
      fr: 'Une oasis de montagne au débouché d’une gorge : une source, une petite cascade et des palmiers sous la roche nue. Le vieux village, au-dessus, a été abandonné après les inondations de 1969.',
      ar: 'واحة جبلية عند مخرج خانق: عين وشلّال صغير ونخيل تحت الصخر العاري. وقد هُجرت القرية القديمة في الأعلى بعد فيضانات 1969.',
    } },
  { id: 'tamerza', cat: 'sahara', lat: 34.383, lon: 7.933, search: 'Tamerza',
    name: { en: 'Tamerza', fr: 'Tamerza', ar: 'تمغزة' },
    text: {
      en: 'The largest of the mountain oases, with waterfalls in a canyon and, across the dry riverbed, the empty mud-brick village abandoned after the 1969 floods.',
      fr: 'La plus grande des oasis de montagne, avec des cascades dans un canyon et, de l’autre côté de l’oued à sec, le village de terre désert, abandonné après les inondations de 1969.',
      ar: 'أكبر الواحات الجبلية، فيها شلّالات داخل وادٍ عميق، وعلى الضفّة الأخرى من الوادي الجاف القرية الطينية الخالية التي هُجرت بعد فيضانات 1969.',
    } },
  { id: 'mides', cat: 'sahara', lat: 34.408, lon: 7.918, search: 'Tamerza',
    name: { en: 'Midès', fr: 'Midès', ar: 'ميداس' },
    text: {
      en: 'An old village on the lip of a winding canyon, almost on the Algerian border. The layered walls of the gorge drop straight from the last houses.',
      fr: 'Un vieux village au bord d’un canyon sinueux, presque sur la frontière algérienne. Les parois stratifiées de la gorge tombent à pic depuis les dernières maisons.',
      ar: 'قرية قديمة على شفا خانق متعرّج، تكاد تكون على الحدود الجزائرية. جدران الخانق المتطبّقة تهوي مباشرة من آخر البيوت.',
    } },
  { id: 'chott-el-djerid', cat: 'sahara', lat: 33.9, lon: 8.45, search: 'Tozeur',
    name: { en: 'Chott el Djerid', fr: 'Chott el-Jérid', ar: 'شط الجريد' },
    text: {
      en: 'The largest salt lake of the Sahara, mostly dry in summer. A causeway road crosses its white crust between Tozeur and Kebili, with pools of pink and green brine and mirages on the horizon.',
      fr: 'Le plus grand lac salé du Sahara, presque à sec en été. Une route-digue traverse sa croûte blanche entre Tozeur et Kébili, avec des flaques de saumure rose et verte et des mirages à l’horizon.',
      ar: 'أكبر بحيرة ملحية في الصحراء الكبرى، تكاد تجفّ في الصيف. تعبر قشرتَها البيضاء طريق مرصوفة بين توزر وقبلي، مع برك من الماء المالح الوردي والأخضر وسراب في الأفق.',
    } },
  { id: 'douz', cat: 'sahara', lat: 33.457, lon: 9.02, search: 'Douz',
    name: { en: 'Douz', fr: 'Douz', ar: 'دوز' },
    text: {
      en: 'The “gateway to the Sahara”: a palm-grove town on the edge of the dunes of the Grand Erg Oriental. Camel treks start here, and each winter the Festival of the Sahara fills the town with riders and poets.',
      fr: 'La « porte du Sahara » : une ville-palmeraie au bord des dunes du Grand Erg oriental. Les méharées partent d’ici, et chaque hiver le Festival du Sahara remplit la ville de cavaliers et de poètes.',
      ar: '«بوّابة الصحراء»: مدينة واحة على حافّة كثبان العرق الشرقي الكبير. من هنا تنطلق رحلات الجمال، وكل شتاء يملأ مهرجان الصحراء المدينة بالفرسان والشعراء.',
    } },
  { id: 'ksar-ghilane', cat: 'sahara', lat: 32.988, lon: 9.639, search: 'Ksar Ghilane',
    name: { en: 'Ksar Ghilane', fr: 'Ksar Ghilane', ar: 'قصر غيلان' },
    text: {
      en: 'A small oasis with a warm spring pool, right where the great dunes begin. At sunset you can walk or ride across the sand to the ruin of a Roman frontier fort.',
      fr: 'Une petite oasis avec un bassin d’eau chaude de source, là où commencent les grandes dunes. Au coucher du soleil, on rejoint à pied ou à dos de dromadaire les ruines d’un fortin romain de la frontière.',
      ar: 'واحة صغيرة فيها حوض ماء دافئ من عين، حيث تبدأ الكثبان الكبرى. وعند الغروب يمكنك أن تعبر الرمال مشيًا أو ركوبًا إلى أطلال حصن روماني حدودي.',
    } },
  { id: 'ong-jemel', cat: 'sahara', lat: 33.994, lon: 7.843, search: 'Nefta',
    name: { en: 'Ong Jemel and Mos Espa', fr: 'Ong Jemel et Mos Espa', ar: 'عنق الجمل وموس إسبا' },
    text: {
      en: 'A rock shaped like a camel’s neck above the desert plain north of Nefta. Nearby stands the town of Mos Espa, built in 1997 as a set for Star Wars and left in the desert.',
      fr: 'Un rocher en forme de cou de chameau au-dessus de la plaine désertique, au nord de Nefta. Tout près se dresse la ville de Mos Espa, construite en 1997 comme décor de Star Wars et laissée dans le désert.',
      ar: 'صخرة على شكل عنق جمل فوق السهل الصحراوي شمال نفطة. وعلى مقربة منها مدينة موس إسبا، التي بُنيت سنة 1997 ديكورًا لحرب النجوم وتُركت في الصحراء.',
    } },
  { id: 'selja', cat: 'sahara', lat: 34.385, lon: 8.34, search: 'Gafsa',
    name: { en: 'Selja Gorges and the Red Lizard', fr: 'Gorges de Selja et Lézard rouge', ar: 'خوانق السلجة والسحلية الحمراء' },
    text: {
      en: 'A deep red canyon north-west of Metlaoui. The Lézard Rouge, a train of early 20th-century carriages once used by the bey, runs through it; its service has stopped and restarted over the years, so check before you go.',
      fr: 'Un profond canyon rouge au nord-ouest de Métlaoui. Le Lézard rouge, un train de voitures du début du XXe siècle jadis utilisé par le bey, le parcourt ; son service s’est interrompu et a repris au fil des ans, renseignez-vous avant de partir.',
      ar: 'خانق أحمر عميق شمال غرب المتلوي. يعبره «السحلية الحمراء»، قطار بعربات من مطلع القرن العشرين كان يستعمله الباي؛ وقد توقّفت رحلاته واستُؤنفت مرارًا، فتأكّد قبل الذهاب.',
    } },
];

/** When to go, by category (shown on every card). */
export const BEST_TIME: Record<Cat, T3> = {
  historic: { en: 'March to June, September to November', fr: 'De mars à juin, de septembre à novembre', ar: 'من مارس إلى جوان، ومن سبتمبر إلى نوفمبر' },
  beach: { en: 'June to September', fr: 'De juin à septembre', ar: 'من جوان إلى سبتمبر' },
  nature: { en: 'March to May; winter for the birds', fr: 'De mars à mai ; l’hiver pour les oiseaux', ar: 'من مارس إلى ماي؛ والشتاء للطيور' },
  sahara: { en: 'October to April', fr: 'D’octobre à avril', ar: 'من أكتوبر إلى أفريل' },
};

export interface Journey { id: string; name: T3; text: T3; stops: string[] }
/** Ready-made routes drawn on the map (stops are ids of monuments or places). */
export const JOURNEYS: Journey[] = [
  { id: 'roman', stops: ['carthage', 'oudhna', 'thuburbo-majus', 'dougga', 'bulla-regia', 'chemtou', 'makthar', 'sbeitla', 'el-jem'],
    name: { en: 'Roman Africa', fr: 'L’Afrique romaine', ar: 'إفريقيا الرومانية' },
    text: { en: 'From Carthage to the amphitheatre of El Jem through the cities of the grain lands.', fr: 'De Carthage à l’amphithéâtre d’El Jem, par les cités des terres à blé.', ar: 'من قرطاج إلى مدرج الجم عبر مدن أرض القمح.' } },
  { id: 'medinas', stops: ['tunis-medina', 'kairouan', 'sousse', 'monastir', 'mahdia'],
    name: { en: 'Medinas and ribats', fr: 'Médinas et ribats', ar: 'مدن عتيقة ورباطات' },
    text: { en: 'The old Islamic cities, from the souks of Tunis to the Fatimid peninsula of Mahdia.', fr: 'Les vieilles cités islamiques, des souks de Tunis à la presqu’île fatimide de Mahdia.', ar: 'المدن الإسلامية العتيقة، من أسواق تونس إلى شبه جزيرة المهدية الفاطمية.' } },
  { id: 'coast', stops: ['tabarka', 'cape-angela', 'raf-raf', 'ghar-el-melh', 'la-marsa', 'sidi-bou-said', 'korbous', 'el-haouaria', 'kelibia', 'hammamet'],
    name: { en: 'The northern coast and Cap Bon', fr: 'La côte nord et le cap Bon', ar: 'الساحل الشمالي والوطن القبلي' },
    text: { en: 'Coral coast, the tip of Africa, lagoon beaches and the capes facing Sicily.', fr: 'Côte de corail, pointe de l’Afrique, plages de lagune et caps face à la Sicile.', ar: 'ساحل المرجان وأقصى شمال إفريقيا وشواطئ البحيرات والرؤوس المقابلة لصقلية.' } },
  { id: 'sahara', stops: ['tozeur', 'nefta', 'ong-jemel', 'chebika', 'tamerza', 'mides', 'chott-el-djerid', 'douz', 'ksar-ghilane', 'matmata'],
    name: { en: 'Oases and the great dunes', fr: 'Oasis et grandes dunes', ar: 'الواحات والكثبان الكبرى' },
    text: { en: 'Palm groves, mountain oases, the salt lake and a night by the dunes.', fr: 'Palmeraies, oasis de montagne, lac salé et une nuit au pied des dunes.', ar: 'واحات النخيل والواحات الجبلية والبحيرة الملحية وليلة عند الكثبان.' } },
  { id: 'starwars', stops: ['djerba', 'matmata', 'chott-el-djerid', 'tozeur', 'ong-jemel'],
    name: { en: 'The Star Wars trail', fr: 'Sur les traces de Star Wars', ar: 'على خطى حرب النجوم' },
    text: { en: 'Film locations of Tatooine: Ajim on Djerba, the Hotel Sidi Driss in Matmata, the salt lake and the Mos Espa set.', fr: 'Les lieux de tournage de Tatooine : Ajim à Djerba, l’hôtel Sidi Driss à Matmata, le lac salé et le décor de Mos Espa.', ar: 'مواقع تصوير تاتوين: أجيم في جربة، ونزل سيدي إدريس في مطماطة، والبحيرة الملحية وديكور موس إسبا.' } },
];
