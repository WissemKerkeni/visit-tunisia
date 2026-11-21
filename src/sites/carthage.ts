import * as THREE from 'three';
import { THEATRE, bathsAt, buildCarthage } from '../monuments/carthage/build';
import type { Hotspot, SiteDef } from './types';

const at = (u: number, v: number, h: number) => { const [x, z] = bathsAt(u, v); return { x, z, h }; };

/** Places to see. Positions come from OpenStreetMap (the baths from their plan, anchored on the real column). */
const HOTSPOTS: Hotspot[] = [
  {
    id: 'column', marker: at(0, 0, 13), view: at(-12, -30, 1), photo: 'column',
    title: { en: 'The frigidarium column', fr: 'La colonne du frigidarium', ar: 'عمود قاعة التبريد' },
    text: {
      en: 'The great cold hall stood on eight granite columns about 15 m tall, brought from Egypt. One was raised again in the 20th century with a marble capital: it shows how high the vaults once rose above the floor you walk on.',
      fr: 'La grande salle froide reposait sur huit colonnes de granit d’environ 15 m, venues d’Égypte. L’une a été relevée au XXe siècle avec un chapiteau de marbre : elle montre à quelle hauteur s’élevaient les voûtes.',
      ar: 'قامت قاعة التبريد الكبرى على ثمانية أعمدة من الغرانيت بطول نحو 15 م جُلبت من مصر. أُعيد نصب أحدها في القرن العشرين مع تاج رخامي، وهو يُظهر علوّ القباب فوق الأرض التي تمشي عليها.',
    },
  },
  {
    id: 'vaults', marker: at(-55, -22, 2.5), view: at(-55, -62, 1), photo: 'vaults',
    title: { en: 'The service level', fr: 'Le niveau de service', ar: 'طابق الخدمات' },
    text: {
      en: 'What survives is the basement: vaulted rooms where slaves fed the furnaces and water flowed to the pools above. The bathing halls themselves, one of the largest in the Roman world, have vanished.',
      fr: 'Ce qui subsiste est le sous-sol : des salles voûtées où les esclaves alimentaient les fours et où l’eau circulait vers les bassins du dessus. Les salles des bains elles-mêmes, parmi les plus grandes du monde romain, ont disparu.',
      ar: 'ما بقي هو الطابق السفلي: غرف مقبّبة كان العبيد يغذّون فيها الأفران ويجري منها الماء إلى الأحواض في الأعلى. أما قاعات الاستحمام، وهي من أكبر قاعات العالم الروماني، فقد زالت.',
    },
  },
  {
    id: 'caldarium', marker: at(0, 36, 4), view: at(0, 8, 1),
    title: { en: 'Hot rooms facing the sea', fr: 'Les salles chaudes face à la mer', ar: 'القاعات الساخنة المطلّة على البحر' },
    text: {
      en: 'Built between 145 and 162 CE under Antoninus Pius, the baths were symmetrical along an axis running to the sea. The hot rooms, the caldaria, opened onto the gulf in great apses to catch the afternoon sun.',
      fr: 'Construits entre 145 et 162 sous Antonin le Pieux, les thermes étaient symétriques le long d’un axe menant à la mer. Les salles chaudes, les caldaria, s’ouvraient sur le golfe en grandes absides pour capter le soleil de l’après-midi.',
      ar: 'شُيّدت الحمّامات بين 145 و162م في عهد أنطونيوس بيوس، متناظرة على محور يتجه إلى البحر. وكانت القاعات الساخنة تنفتح على الخليج بحنايا كبيرة لالتقاط شمس العصر.',
    },
  },
  {
    id: 'latrines', marker: at(80, -36, 1), view: at(80, -60, 1), photo: 'latrines',
    title: { en: 'The latrines', fr: 'Les latrines', ar: 'المراحيض' },
    text: {
      en: 'A horseshoe of stone seats where bathers sat side by side and talked; water ran in a channel beneath. They are among the best-preserved parts of the complex.',
      fr: 'Un fer à cheval de sièges de pierre où les baigneurs s’asseyaient côte à côte et bavardaient ; l’eau coulait dans une rigole en dessous. C’est l’une des parties les mieux conservées.',
      ar: 'مقاعد حجرية على شكل حدوة حصان كان المستحمّون يجلسون عليها جنبًا إلى جنب ويتحدثون، والماء يجري في قناة تحتها. وهي من أحسن أجزاء المجمّع حفظًا.',
    },
  },
  {
    // standing in the orchestra, looking up at the seats
    id: 'theatre', marker: { x: THEATRE.c[0] - THEATRE.open[0] * 38, z: THEATRE.c[1] - THEATRE.open[1] * 38, h: 6 },
    view: { x: THEATRE.c[0] + THEATRE.open[0] * 3, z: THEATRE.c[1] + THEATRE.open[1] * 3, h: 1 }, fixedView: true, photo: 'theatre',
    title: { en: 'The Roman theatre', fr: 'Le théâtre romain', ar: 'المسرح الروماني' },
    text: {
      en: 'Built in the 2nd century and heavily restored, the theatre is cut into the hillside. Every summer it hosts the International Festival of Carthage, one of the oldest festivals in Africa.',
      fr: 'Bâti au IIe siècle et largement restauré, le théâtre est taillé dans la colline. Chaque été il accueille le Festival international de Carthage, l’un des plus anciens d’Afrique.',
      ar: 'شُيّد في القرن الثاني ورُمّم كثيرًا، وهو منحوت في سفح التل. ويحتضن كل صيف مهرجان قرطاج الدولي، من أعرق المهرجانات في إفريقيا.',
    },
  },
  {
    id: 'villa', marker: { x: 225, z: -320, h: 2 }, view: { x: 225, z: -290, h: 1 }, photo: 'villa',
    title: { en: 'Villa of the Aviary', fr: 'La villa de la Volière', ar: 'فيلا القفص' },
    text: {
      en: 'On the hill of the Roman villas, a rich house with a colonnaded garden court, named after a mosaic of birds. Its portico was partly rebuilt to show how such houses looked.',
      fr: 'Sur la colline des villas romaines, une riche demeure à cour-jardin à colonnes, nommée d’après une mosaïque d’oiseaux. Son portique a été en partie reconstruit.',
      ar: 'على تل الفيلات الرومانية، دار فخمة ذات فناء حديقة بأعمدة، سُمّيت نسبة إلى فسيفساء طيور. وأُعيد بناء رواقها جزئيًا.',
    },
  },
  {
    id: 'cathedral', marker: { x: -500, z: 147, h: 28 }, view: { x: -440, z: 160, h: 1 }, photo: 'cathedral',
    title: { en: 'Byrsa and the Saint-Louis cathedral', fr: 'Byrsa et la cathédrale Saint-Louis', ar: 'بيرصا وكاتدرائية القديس لويس' },
    text: {
      en: 'Byrsa was the citadel of Punic Carthage, where legend says Queen Dido founded the city in 814 BCE. The cathedral was built on the summit in 1890; it is now a cultural venue, next to the National Museum of Carthage.',
      fr: 'Byrsa était la citadelle de Carthage punique, où la légende place la fondation de la ville par la reine Didon en 814 av. J.-C. La cathédrale y fut bâtie en 1890 ; c’est aujourd’hui un lieu culturel, près du Musée national.',
      ar: 'كانت بيرصا قلعة قرطاج البونيقية، وتقول الأسطورة إن الملكة عليسة أسست المدينة هناك سنة 814 ق.م. وبُنيت الكاتدرائية على القمة سنة 1890، وهي اليوم فضاء ثقافي قرب المتحف الوطني.',
    },
  },
  {
    id: 'punic', marker: { x: -491, z: 224, h: 1 }, view: { x: -491, z: 190, h: 1 }, photo: 'punic',
    title: { en: 'The Punic quarter', fr: 'Le quartier punique', ar: 'الحي البونيقي' },
    text: {
      en: 'On the slope of Byrsa, the houses of Hannibal’s time: narrow streets, cisterns and walls with the earth fill the Romans dumped on them in 146 BCE when they levelled the hill.',
      fr: 'Sur la pente de Byrsa, les maisons de l’époque d’Hannibal : rues étroites, citernes et murs, sous les remblais déversés par les Romains en 146 av. J.-C. quand ils arasèrent la colline.',
      ar: 'على سفح بيرصا، منازل عصر حنّبعل: أزقة ضيقة وصهاريج وجدران، تحت الردم الذي ألقاه الرومان سنة 146 ق.م حين سوّوا التل.',
    },
  },
];

export const site: SiteDef = {
  id: 'carthage',
  lat: 36.8550, lon: 10.3290,
  northRotation: 0,
  info: {
    name: { en: 'Carthage', fr: 'Carthage', ar: 'قرطاج' },
    facts: [
      { k: { en: 'Founded', fr: 'Fondation', ar: 'التأسيس' }, v: { en: '814 BCE (tradition), by Phoenicians', fr: '814 av. J.-C. (tradition), par les Phéniciens', ar: '814 ق.م (رواية)، على يد الفينيقيين' } },
      { k: { en: 'Destroyed', fr: 'Destruction', ar: 'التدمير' }, v: { en: 'by Rome in 146 BCE, rebuilt as a Roman city', fr: 'par Rome en 146 av. J.-C., rebâtie en ville romaine', ar: 'على يد روما سنة 146 ق.م، ثم أعيد بناؤها مدينة رومانية' } },
      { k: { en: 'Antonine Baths', fr: 'Thermes d’Antonin', ar: 'حمامات أنطونيوس' }, v: { en: '145–162 CE, about 200 m along the sea', fr: '145–162, environ 200 m le long de la mer', ar: '145–162م، نحو 200 م على طول البحر' } },
      { k: { en: 'UNESCO', fr: 'UNESCO', ar: 'اليونسكو' }, v: { en: 'World Heritage since 1979', fr: 'Patrimoine mondial depuis 1979', ar: 'تراث عالمي منذ 1979' } },
    ],
    visit: [
      { k: { en: 'Getting there', fr: 'Accès', ar: 'الوصول' }, v: {
        en: 'TGM light railway from Tunis Marine: Carthage Hannibal for the Antonine Baths, Carthage Byrsa for the hill and the museum.',
        fr: 'TGM depuis Tunis Marine : Carthage Hannibal pour les thermes d’Antonin, Carthage Byrsa pour la colline et le musée.',
        ar: 'قطار TGM من تونس البحرية: محطة قرطاج حنّبعل للحمامات، ومحطة قرطاج بيرصا للتل والمتحف.' } },
      { k: { en: 'Tickets', fr: 'Billets', ar: 'التذاكر' }, v: {
        en: 'One ticket usually covers several sites (baths, Byrsa and museum, theatre, villas, Punic ports, Tophet). Check current prices and hours.',
        fr: 'Un billet couvre en général plusieurs sites (thermes, Byrsa et musée, théâtre, villas, ports puniques, Tophet). Vérifiez prix et horaires.',
        ar: 'تشمل التذكرة عادة عدة مواقع (الحمامات، بيرصا والمتحف، المسرح، الفيلات، الموانئ البونيقية، التوفيت). تحقّق من الأسعار والمواعيد.' } },
      { k: { en: 'Best time', fr: 'Meilleure période', ar: 'أفضل وقت' }, v: {
        en: 'Spring and autumn mornings. The sites are spread over several kilometres: combine with Sidi Bou Said, one stop further.',
        fr: 'Les matinées de printemps et d’automne. Les sites s’étendent sur plusieurs kilomètres : combinez avec Sidi Bou Saïd, un arrêt plus loin.',
        ar: 'صباحات الربيع والخريف. المواقع منتشرة على عدة كيلومترات، ويمكن الجمع بينها وبين سيدي بوسعيد على بعد محطة.' } },
    ],
    searchTerm: 'Carthage',
    intro: {
      en: 'From Byrsa Hill to the sea: the Antonine Baths, the Roman theatre and the Punic quarter, on the real terrain and streets.',
      fr: 'De la colline de Byrsa à la mer : les thermes d’Antonin, le théâtre romain et le quartier punique, sur le vrai relief et les vraies rues.',
      ar: 'من تل بيرصا إلى البحر: حمامات أنطونيوس والمسرح الروماني والحي البونيقي، على التضاريس والشوارع الحقيقية.',
    },
    loading: { en: 'Raising the columns of Carthage…', fr: 'On relève les colonnes de Carthage…', ar: 'جارٍ نصب أعمدة قرطاج…' },
    note: {
      en: 'Terrain, streets and site outlines come from real map data; the ruins are modelled from published plans and photos and simplified. Houses on unmapped plots are generated.',
      fr: 'Relief, rues et contours des sites viennent de vraies données cartographiques ; les ruines sont modélisées d’après des plans publiés et des photos, simplifiées. Les maisons des parcelles non cartographiées sont générées.',
      ar: 'التضاريس والشوارع وحدود المواقع من بيانات خرائط حقيقية، والآثار منمذجة بتبسيط اعتمادًا على مخططات منشورة وصور. والمنازل في القطع غير المرسومة مولّدة.',
    },
  },
  hotspots: HOTSPOTS,
  photos: 'carthage',
  build: buildCarthage,
  toVec: (p, built) => {
    if (Array.isArray(p)) return new THREE.Vector3(...p);
    if ('x' in p) return new THREE.Vector3(p.x, (built.groundAt?.(p.x, p.z) ?? 0) + p.h, p.z);
    return new THREE.Vector3(0, p.y, 0);
  },
  intro: { center: [80, 25, 80], rx: 620, rz: 520, height: 260 },
  shadowClamp: 800,
  fog: 0.0005,
};
