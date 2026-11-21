import type { T3 } from '../i18n';

import type { Hotspot } from '../sites/types';
export type { Hotspot, Pt } from '../sites/types';

export const EL_JEM_INFO = {
  name: { en: 'Amphitheatre of El Jem', fr: 'Amphithéâtre d’El Jem', ar: 'مدرج الجم' } as T3,
  facts: [
    { k: { en: 'Built', fr: 'Construction', ar: 'البناء' }, v: { en: 'c. 238 CE, city of Thysdrus', fr: 'vers 238, cité de Thysdrus', ar: 'حوالي 238م، مدينة تيسدروس' } },
    { k: { en: 'Size', fr: 'Dimensions', ar: 'الأبعاد' }, v: { en: '148 × 122 m, 36 m high', fr: '148 × 122 m, 36 m de haut', ar: '148 × 122 م، بارتفاع 36 م' } },
    { k: { en: 'Arena', fr: 'Arène', ar: 'الحلبة' }, v: { en: '64 × 39 m', fr: '64 × 39 m', ar: '64 × 39 م' } },
    { k: { en: 'Spectators', fr: 'Spectateurs', ar: 'المتفرجون' }, v: { en: 'about 30,000–35,000', fr: 'environ 30 000 à 35 000', ar: 'حوالي 30 إلى 35 ألفًا' } },
    { k: { en: 'UNESCO', fr: 'UNESCO', ar: 'اليونسكو' }, v: { en: 'World Heritage since 1979', fr: 'Patrimoine mondial depuis 1979', ar: 'تراث عالمي منذ 1979' } },
  ],
  visit: [
    { k: { en: 'Where', fr: 'Où', ar: 'الموقع' }, v: {
      en: 'El Jem, Mahdia governorate. About 200 km south of Tunis and 65 km from Sousse.',
      fr: 'El Jem, gouvernorat de Mahdia. Environ 200 km au sud de Tunis et 65 km de Sousse.',
      ar: 'الجم، ولاية المهدية. حوالي 200 كم جنوب تونس العاصمة و65 كم من سوسة.' } },
    { k: { en: 'Getting there', fr: 'Accès', ar: 'الوصول' }, v: {
      en: 'Trains on the Tunis–Sfax line stop in El Jem; the station is a short walk from the amphitheatre. By car, take the A1 motorway.',
      fr: 'Les trains de la ligne Tunis–Sfax s’arrêtent à El Jem ; la gare est à quelques minutes à pied. En voiture, autoroute A1.',
      ar: 'تتوقف قطارات خط تونس–صفاقس في الجم، والمحطة على بعد دقائق سيرًا من المدرج. بالسيارة عبر الطريق السيارة A1.' } },
    { k: { en: 'Best time', fr: 'Meilleure période', ar: 'أفضل وقت' }, v: {
      en: 'Spring and autumn; arrive early or late afternoon for soft light. In summer the El Jem symphonic music festival is held inside the amphitheatre.',
      fr: 'Printemps et automne ; venez tôt le matin ou en fin d’après-midi pour la lumière. En été, le festival de musique symphonique d’El Jem a lieu dans l’amphithéâtre.',
      ar: 'الربيع والخريف، ويفضّل الصباح الباكر أو آخر النهار. في الصيف يقام مهرجان الجم للموسيقى السمفونية داخل المدرج.' } },
    { k: { en: 'Also nearby', fr: 'À voir aussi', ar: 'بالقرب' }, v: {
      en: 'The El Jem archaeological museum, with Roman mosaics from the villas of Thysdrus.',
      fr: 'Le musée archéologique d’El Jem et ses mosaïques romaines des villas de Thysdrus.',
      ar: 'متحف الجم الأثري وفسيفساؤه الرومانية من فيلات تيسدروس.' } },
    { k: { en: 'Tickets', fr: 'Billets', ar: 'التذاكر' }, v: {
      en: 'Check current opening hours and prices before you go; the ticket usually includes the museum.',
      fr: 'Vérifiez les horaires et tarifs avant de partir ; le billet inclut généralement le musée.',
      ar: 'تحقّق من المواعيد والأسعار قبل الزيارة، وعادةً تشمل التذكرة المتحف.' } },
  ],
  searchTerm: 'El Jem',
};

export const EL_JEM_HOTSPOTS: Hotspot[] = [
  {
    id: 'facade', marker: { t: 0.32, s: 1.02, y: 13 }, view: { t: 0.26, s: 1.17, y: 1 }, photo: 'p15',
    title: { en: 'Three storeys of arches', fr: 'Trois étages d’arcades', ar: 'ثلاثة طوابق من الأقواس' },
    text: {
      en: 'The outer wall is ringed by 64 arches on each of three levels, framed by Corinthian and composite half-columns. A fourth, solid level (the attic) once crowned the top; only fragments survive.',
      fr: 'Le mur extérieur compte 64 arcades sur chacun des trois niveaux, encadrées de demi-colonnes corinthiennes et composites. Un quatrième niveau plein (l’attique) couronnait le tout ; il n’en reste que des fragments.',
      ar: 'يحيط بالجدار الخارجي 64 قوسًا في كل طابق من الطوابق الثلاثة، تؤطرها أنصاف أعمدة كورنثية ومركبة. وكان طابق رابع مصمت (العلّية) يتوّج البناء، ولم تبق منه إلا أجزاء.',
    },
  },
  {
    id: 'thysdrus', marker: { t: 0.0, s: 1.06, y: 6 }, view: { t: 0.0, s: 1.17, y: 1 }, photo: 'p1',
    title: { en: 'Thysdrus, the olive-oil city', fr: 'Thysdrus, la cité de l’huile', ar: 'تيسدروس، مدينة الزيت' },
    text: {
      en: 'Roman Thysdrus grew rich on olive oil exported across the Mediterranean. In 238 CE a revolt here proclaimed the local governor Gordian I emperor. This was the third amphitheatre built on the site.',
      fr: 'La Thysdrus romaine s’est enrichie grâce à l’huile d’olive exportée dans toute la Méditerranée. En 238, une révolte y proclama empereur le gouverneur Gordien Ier. C’est le troisième amphithéâtre construit sur le site.',
      ar: 'اغتنت تيسدروس الرومانية بزيت الزيتون الذي كان يُصدَّر عبر المتوسط. وفي سنة 238م أعلنت ثورة فيها الحاكم غورديان الأول إمبراطورًا. وهذا ثالث مدرج بُني في الموقع.',
    },
  },
  {
    id: 'gallery', marker: { t: 1.25, s: 0.935, y: 5 }, view: { t: 1.08, s: 0.935, y: 1 }, photo: 'p11',
    title: { en: 'The ring corridors', fr: 'Les galeries annulaires', ar: 'الأروقة الدائرية' },
    text: {
      en: 'Two concentric rings of arches form vaulted corridors on every level. They let tens of thousands of people reach their seats, and leave the amphitheatre, in minutes.',
      fr: 'Deux anneaux d’arcades concentriques forment des galeries voûtées à chaque niveau. Elles permettaient à des dizaines de milliers de personnes de rejoindre leur place, et de repartir, en quelques minutes.',
      ar: 'تشكّل حلقتان متداخلتان من الأقواس أروقة مقببة في كل طابق، تتيح لعشرات الآلاف الوصول إلى مقاعدهم والخروج في دقائق.',
    },
  },
  {
    id: 'graffiti', marker: { t: 1.68, s: 0.895, y: 1.7 }, view: { t: 1.55, s: 0.94, y: 1 }, photo: 'p21',
    title: { en: 'Names carved in stone', fr: 'Des noms gravés dans la pierre', ar: 'أسماء محفورة في الحجر' },
    text: {
      en: 'Look closely at the blocks: visitors have left their mark for centuries. You can find carvings dated 1914 and a soldier’s "1943", from the Second World War campaign in Tunisia.',
      fr: 'Regardez les blocs de près : les visiteurs y laissent leur trace depuis des siècles. On y trouve des gravures datées de 1914 et un « 1943 » laissé par un soldat de la campagne de Tunisie.',
      ar: 'تأمّل الحجارة عن قرب: ترك الزوار آثارهم عليها منذ قرون، ومنها نقوش مؤرخة في 1914 وأخرى لجندي كتب «1943» خلال حملة تونس في الحرب العالمية الثانية.',
    },
  },
  {
    id: 'arena', marker: [0, 3.2, 9], view: [-14, 0.5, 9], photo: 'p22',
    title: { en: 'The arena', fr: 'L’arène', ar: 'الحلبة' },
    text: {
      en: 'The sand floor (64 × 39 m) hosted gladiator fights and wild-animal hunts with lions, leopards and bears brought from Africa’s interior. The high podium wall protected the crowd.',
      fr: 'Le sol de sable (64 × 39 m) accueillait combats de gladiateurs et chasses avec lions, léopards et ours venus de l’intérieur de l’Afrique. Le haut mur du podium protégeait le public.',
      ar: 'شهدت أرضية الحلبة الرملية (64 × 39 م) معارك المصارعين وصيد الحيوانات البرية كالأسود والفهود والدببة. وكان جدار المنصة العالي يحمي الجمهور.',
    },
  },
  {
    id: 'hypogeum', marker: [-7, -2.6, 0], view: [-16, -4, 0], photo: 'p32',
    title: { en: 'Under the arena', fr: 'Sous l’arène', ar: 'تحت الحلبة' },
    text: {
      en: 'Two underground galleries cross beneath the arena. Animals, fighters and stage machinery waited in the vaulted cells, then rose through trapdoors into the light. Today a glass roof covers the central slot.',
      fr: 'Deux galeries souterraines se croisent sous l’arène. Animaux, combattants et machinerie attendaient dans les cellules voûtées avant de surgir par des trappes. Aujourd’hui une verrière couvre la fente centrale.',
      ar: 'يتقاطع رواقان تحت أرض الحلبة. كانت الحيوانات والمقاتلون والآلات تنتظر في الحجرات المقببة ثم تصعد عبر فتحات إلى الضوء. واليوم يغطي سقف زجاجي الشق الأوسط.',
    },
  },
  {
    id: 'tunnel', marker: [34, -2.6, 0], view: [26, -4, 0], photo: 'p31',
    title: { en: 'The vaulted tunnel', fr: 'Le tunnel voûté', ar: 'النفق المقبب' },
    text: {
      en: 'The main gallery continues as a long barrel-vaulted tunnel under the seats, so animals and performers could be moved in without crossing the crowd.',
      fr: 'La galerie principale se prolonge par un long tunnel en berceau sous les gradins, pour amener animaux et artistes sans traverser la foule.',
      ar: 'يمتد الرواق الرئيسي في نفق طويل مقبب تحت المدرجات، لنقل الحيوانات والمؤدين دون المرور بين الجمهور.',
    },
  },
  {
    id: 'seats', marker: { t: -1.57, s: 0.22, y: 9 }, view: { t: -1.45, s: 0.3, y: 12 }, photo: 'p13',
    title: { en: 'The seats', fr: 'Les gradins', ar: 'المدرجات' },
    text: {
      en: 'Around 30,000–35,000 spectators sat here, ranked by status: officials nearest the arena, ordinary citizens higher up. The lower tiers you see were restored; the upper ones collapsed long ago.',
      fr: 'Environ 30 000 à 35 000 spectateurs s’asseyaient ici selon leur rang : notables près de l’arène, citoyens ordinaires plus haut. Les gradins inférieurs ont été restaurés ; les supérieurs se sont effondrés il y a longtemps.',
      ar: 'جلس هنا ما بين 30 و35 ألف متفرج حسب مكانتهم: الأعيان قرب الحلبة وعامة الناس في الأعلى. المدرجات السفلية مرمَّمة، أما العلوية فقد انهارت منذ زمن.',
    },
  },
  {
    id: 'stage', marker: [-21, 3.5, 0], view: [-6, 0.5, -6], photo: 'p16',
    title: { en: 'A living monument', fr: 'Un monument vivant', ar: 'معلم حيّ' },
    text: {
      en: 'Every summer the amphitheatre becomes a concert hall for the International Symphonic Music Festival of El Jem. Orchestras play where gladiators once fought.',
      fr: 'Chaque été, l’amphithéâtre devient salle de concert pour le Festival international de musique symphonique d’El Jem. Des orchestres jouent là où combattaient les gladiateurs.',
      ar: 'يتحول المدرج كل صيف إلى قاعة حفلات لمهرجان الجم الدولي للموسيقى السمفونية، فتعزف الفرق حيث كان المصارعون يتقاتلون.',
    },
  },
  {
    id: 'view', marker: { t: 2.55, s: 1.0, y: 23 }, view: { t: 2.45, s: 0.935, y: 21.5 }, photo: 'p2',
    title: { en: 'View over El Jem', fr: 'Vue sur El Jem', ar: 'إطلالة على الجم' },
    text: {
      en: 'From the top gallery you look over the modern town. For centuries its houses, and even the Great Mosque of Kairouan, were partly built with stone taken from the amphitheatre.',
      fr: 'Depuis la galerie supérieure, la vue s’étend sur la ville moderne. Pendant des siècles, ses maisons, et même la Grande Mosquée de Kairouan, ont été bâties en partie avec des pierres prises à l’amphithéâtre.',
      ar: 'من الرواق العلوي تطل على المدينة الحديثة. فلقرون بُنيت بيوتها، بل وجامع القيروان الكبير، جزئيًا بحجارة أُخذت من المدرج.',
    },
  },
  {
    id: 'breach', marker: { t: Math.PI - 0.42, s: 1.0, y: 8 }, view: { t: Math.PI - 0.36, s: 1.17, y: 1 }, photo: 'p29',
    title: { en: 'The breach', fr: 'La brèche', ar: 'الثغرة' },
    text: {
      en: 'The amphitheatre was used as a fortress more than once. In 1695 breaches were opened in the wall so it could no longer shelter rebels, and the gap was never rebuilt.',
      fr: 'L’amphithéâtre a servi plusieurs fois de forteresse. En 1695, des brèches ont été ouvertes dans le mur pour qu’il ne puisse plus abriter de rebelles ; elles n’ont jamais été comblées.',
      ar: 'استُخدم المدرج حصنًا أكثر من مرة. وفي سنة 1695 فُتحت ثغرات في جداره حتى لا يتحصن به المتمردون، ولم تُرمَّم أبدًا.',
    },
  },
  {
    id: 'kahena', legend: true, marker: { t: -2.1, s: 0.87, y: 16 }, view: { t: -2.05, s: 0.52, y: 13 }, photo: 'p5',
    title: { en: 'The legend of the Kahena', fr: 'La légende de la Kahena', ar: 'أسطورة الكاهنة' },
    text: {
      en: 'Local tradition says the Berber queen Dihya, known as the Kahena, held out here against the Arab armies at the end of the 7th century. Historians debate it, but the story is still told in El Jem.',
      fr: 'Selon la tradition, la reine berbère Dihya, dite la Kahena, y aurait résisté aux armées arabes à la fin du VIIe siècle. Les historiens en débattent, mais l’histoire se raconte toujours à El Jem.',
      ar: 'تقول الرواية المحلية إن الملكة الأمازيغية ديهيا المعروفة بالكاهنة تحصّنت هنا في وجه الجيوش العربية أواخر القرن السابع. يختلف المؤرخون حول ذلك، لكن الحكاية ما زالت تُروى في الجم.',
    },
  },
];
