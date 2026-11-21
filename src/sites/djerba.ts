import * as THREE from 'three';
import { FUNDUQ_FRONT, GHRIBA, GHRIBA_DOOR, MENZEL, MOSQUE, MURAL, SALAMA, buildDjerba } from '../monuments/djerba/build';
import type { Hotspot, SiteDef } from './types';

const at = (p: [number, number], h: number) => ({ x: p[0], z: p[1], h });
const D = GHRIBA_DOOR;

/** Places to see. Positions come from OpenStreetMap. */
const HOTSPOTS: Hotspot[] = [
  {
    id: 'ghriba', marker: at(GHRIBA, 9), view: at([D.at[0] + D.out[0] * 22, D.at[1] + D.out[1] * 22], 1), fixedView: true, photo: 'ghriba',
    title: { en: 'The Ghriba synagogue', fr: 'La synagogue de la Ghriba', ar: 'كنيس الغريبة' },
    text: {
      en: 'By tradition the oldest synagogue in Africa, founded by priests who fled Jerusalem after the destruction of the First Temple in 586 BCE. The present building dates mostly from the late 19th century. Every spring, for Lag BaOmer, pilgrims come from Tunisia and abroad.',
      fr: 'Selon la tradition la plus ancienne synagogue d’Afrique, fondée par des prêtres ayant fui Jérusalem après la destruction du Premier Temple en 586 av. J.-C. Le bâtiment actuel date surtout de la fin du XIXe siècle. Chaque printemps, pour Lag BaOmer, des pèlerins viennent de Tunisie et de l’étranger.',
      ar: 'حسب الرواية أقدم كنيس في إفريقيا، أسّسه كهنة فرّوا من القدس بعد تدمير الهيكل الأول سنة 586 ق.م. ويعود البناء الحالي في معظمه إلى أواخر القرن التاسع عشر. وفي كل ربيع، بمناسبة لاغ بعومر، يأتيه الحجّاج من تونس ومن الخارج.',
    },
  },
  {
    // just inside the door, looking down the hall
    id: 'hall', marker: at([GHRIBA[0] - D.out[0] * 9, GHRIBA[1] - D.out[1] * 9], 2.2), view: at([D.at[0] - D.out[0] * 4.5, D.at[1] - D.out[1] * 4.5], 1), fixedView: true, photo: 'hall',
    title: { en: 'Inside the Ghriba', fr: 'Dans la Ghriba', ar: 'داخل الغريبة' },
    text: {
      en: 'Walls of blue tiles, white arches on blue columns, a painted wooden ceiling and brass lamps. Visitors take off their shoes and cover their heads; the Torah scrolls are kept in the Ark at the end of the hall.',
      fr: 'Murs de faïence bleue, arcs blancs sur colonnes bleues, plafond de bois peint et lampes de cuivre. Les visiteurs se déchaussent et se couvrent la tête ; les rouleaux de la Torah sont gardés dans l’arche au fond de la salle.',
      ar: 'جدران من الزليج الأزرق وأقواس بيضاء على أعمدة زرقاء وسقف خشبي مزخرف وقناديل نحاسية. يخلع الزوار أحذيتهم ويغطّون رؤوسهم، وتُحفظ لفائف التوراة في الخزانة المقدسة في آخر القاعة.',
    },
  },
  {
    id: 'funduq', marker: at(FUNDUQ_FRONT.at, 4), view: at([FUNDUQ_FRONT.at[0] + FUNDUQ_FRONT.out[0] * 20, FUNDUQ_FRONT.at[1] + FUNDUQ_FRONT.out[1] * 20], 1), fixedView: true, photo: 'funduq',
    title: { en: 'The pilgrims’ caravanserai', fr: 'Le caravansérail des pèlerins', ar: 'فندق الحجّاج' },
    text: {
      en: 'Beside the synagogue, a large guesthouse with two storeys of rooms round a courtyard, built to lodge the pilgrims who come for the annual festival.',
      fr: 'Près de la synagogue, une grande hôtellerie à deux étages de chambres autour d’une cour, bâtie pour loger les pèlerins venus pour la fête annuelle.',
      ar: 'بجانب الكنيس دار ضيافة كبيرة بطابقين من الغرف حول صحن، بُنيت لإيواء الحجّاج القادمين للاحتفال السنوي.',
    },
  },
  {
    // in front of the mural nearest the village square (placed when the scene is built)
    id: 'djerbahood',
    get marker() { return at(MURAL.at, 1.9); },
    get view() { return at([MURAL.at[0] + MURAL.out[0] * 6.5, MURAL.at[1] + MURAL.out[1] * 6.5], 1); },
    fixedView: true, photo: 'djerbahood',
    title: { en: 'Djerbahood', fr: 'Djerbahood', ar: 'جربة هود' },
    text: {
      en: 'In 2014 about 150 street artists from some 30 countries painted the walls of Erriadh, turning the old village of Hara Sghira into an open-air gallery. The murals here are generated, in the spirit of the real ones.',
      fr: 'En 2014, quelque 150 artistes de rue venus d’une trentaine de pays ont peint les murs d’Erriadh, faisant du vieux village de la Hara Sghira une galerie à ciel ouvert. Les fresques ici sont générées, dans l’esprit des vraies.',
      ar: 'في سنة 2014 رسم نحو 150 فنانًا من قرابة ثلاثين بلدًا على جدران الرياض، فجعلوا القرية القديمة الحارة الصغيرة رواقًا في الهواء الطلق. والجداريات هنا مولّدة على روح الجداريات الحقيقية.',
    },
  },
  {
    id: 'mosque', marker: at(MOSQUE, 9), view: at([MOSQUE[0] + 20, MOSQUE[1] + 18], 1), photo: 'mosque',
    title: { en: 'The mosques of Djerba', fr: 'Les mosquées de Djerba', ar: 'مساجد جربة' },
    text: {
      en: 'The island has hundreds of small mosques, many of the Ibadi tradition: white, thick-walled and sometimes fortified, with short minarets, once used as lookouts against raiders from the sea.',
      fr: 'L’île compte des centaines de petites mosquées, beaucoup de tradition ibadite : blanches, aux murs épais et parfois fortifiées, avec de courts minarets qui servaient aussi de postes de guet contre les pillards venus de la mer.',
      ar: 'في الجزيرة مئات المساجد الصغيرة، كثير منها على المذهب الإباضي: بيضاء سميكة الجدران وأحيانًا محصّنة، بصوامع قصيرة كانت تُستعمل أيضًا للمراقبة من غارات القادمين من البحر.',
    },
  },
  {
    id: 'menzel', marker: at(MENZEL, 4), view: at([MENZEL[0] + 38, MENZEL[1] + 16], 1), photo: 'menzel',
    title: { en: 'A menzel among the palms', fr: 'Un menzel parmi les palmiers', ar: 'منزل بين النخيل' },
    text: {
      en: 'Instead of large villages, Djerbians long lived in scattered family estates: white houses with vaulted and domed rooms round a courtyard, a cistern for rainwater, and palms and olive trees around. This way of settling the island is why Djerba was listed by UNESCO in 2023.',
      fr: 'Plutôt qu’en gros villages, les Djerbiens vivaient en domaines familiaux dispersés : maisons blanches aux pièces voûtées et à coupoles autour d’une cour, citerne d’eau de pluie, palmiers et oliviers autour. C’est ce mode d’occupation de l’île qui a valu à Djerba son inscription à l’UNESCO en 2023.',
      ar: 'بدل القرى الكبيرة عاش الجرابة طويلًا في ضيعات عائلية متفرّقة: منازل بيضاء بغرف مقبّبة حول فناء، وماجل لماء المطر، ونخيل وزيتون حولها. وهذا النمط من استيطان الجزيرة هو ما جعل اليونسكو تُدرج جربة سنة 2023.',
    },
  },
  {
    id: 'shrine', marker: at(SALAMA, 6), view: at([SALAMA[0] + 18, SALAMA[1] - 22], 1), photo: 'shrine',
    title: { en: 'A country shrine', fr: 'Un marabout de campagne', ar: 'مقام في الريف' },
    text: {
      en: 'Small white domed shrines such as Sidi Salama El Jenaouni stand among the fields, tombs of holy men visited by the people of the island.',
      fr: 'De petits sanctuaires blancs à coupole, comme Sidi Salama El Jenaouni, se dressent dans les champs : tombeaux de saints hommes visités par les habitants de l’île.',
      ar: 'تنتصب بين الحقول مقامات بيضاء صغيرة بقباب، مثل سيدي سلامة الجناوني، وهي أضرحة لأولياء يزورها أهل الجزيرة.',
    },
  },
];

export const site: SiteDef = {
  id: 'djerba',
  lat: 33.8175, lon: 10.8565,
  northRotation: 0,
  info: {
    name: { en: 'Djerba', fr: 'Djerba', ar: 'جربة' },
    facts: [
      { k: { en: 'Island', fr: 'Île', ar: 'الجزيرة' }, v: { en: 'about 514 km², the largest in North Africa', fr: 'environ 514 km², la plus grande d’Afrique du Nord', ar: 'نحو 514 كم²، أكبر جزر شمال إفريقيا' } },
      { k: { en: 'Here', fr: 'Ici', ar: 'هنا' }, v: { en: 'Erriadh (Hara Sghira) and the Ghriba', fr: 'Erriadh (Hara Sghira) et la Ghriba', ar: 'الرياض (الحارة الصغيرة) والغريبة' } },
      { k: { en: 'Pilgrimage', fr: 'Pèlerinage', ar: 'الزيارة' }, v: { en: 'every spring, at Lag BaOmer', fr: 'chaque printemps, à Lag BaOmer', ar: 'كل ربيع، في لاغ بعومر' } },
      { k: { en: 'UNESCO', fr: 'UNESCO', ar: 'اليونسكو' }, v: { en: 'World Heritage since 2023', fr: 'Patrimoine mondial depuis 2023', ar: 'تراث عالمي منذ 2023' } },
    ],
    visit: [
      { k: { en: 'Getting there', fr: 'Accès', ar: 'الوصول' }, v: {
        en: 'Fly to Djerba-Zarzis, or drive over the causeway from Zarzis or take the ferry from Jorf to Ajim. Erriadh is about 7 km south of Houmt Souk.',
        fr: 'Par l’aéroport de Djerba-Zarzis, par la chaussée depuis Zarzis ou par le bac de Jorf à Ajim. Erriadh est à environ 7 km au sud de Houmt Souk.',
        ar: 'عبر مطار جربة جرجيس، أو بالطريق الروماني من جرجيس، أو بالعبّارة من الجرف إلى أجيم. والرياض على بعد نحو 7 كم جنوب حومة السوق.' } },
      { k: { en: 'Tickets', fr: 'Billets', ar: 'التذاكر' }, v: {
        en: 'A small fee for the Ghriba; dress modestly, cover your head and take off your shoes. The murals of Erriadh are free to see.',
        fr: 'Une petite entrée pour la Ghriba ; tenue correcte, tête couverte, chaussures retirées. Les fresques d’Erriadh se voient librement.',
        ar: 'رسوم بسيطة لدخول الغريبة، مع لباس محتشم وتغطية الرأس وخلع الحذاء. وجداريات الرياض مفتوحة للجميع.' } },
      { k: { en: 'Best time', fr: 'Meilleure période', ar: 'أفضل وقت' }, v: {
        en: 'Morning or late afternoon; the pilgrimage in spring is lively but crowded and closely guarded.',
        fr: 'Le matin ou en fin d’après-midi ; le pèlerinage du printemps est animé mais très fréquenté et très surveillé.',
        ar: 'الصباح أو آخر النهار، والزيارة الربيعية حيّة لكنها مزدحمة ومحروسة.' } },
    ],
    searchTerm: 'Djerba',
    intro: {
      en: 'The Ghriba synagogue, the painted village of Erriadh and the island’s white houses among palms and olive trees, on the real streets.',
      fr: 'La synagogue de la Ghriba, le village peint d’Erriadh et les maisons blanches de l’île parmi les palmiers et les oliviers, sur les vraies rues.',
      ar: 'كنيس الغريبة وقرية الرياض المرسومة ومنازل الجزيرة البيضاء بين النخيل والزيتون، على الشوارع الحقيقية.',
    },
    loading: { en: 'Whitewashing the houses of Djerba…', fr: 'On blanchit les maisons de Djerba…', ar: 'جارٍ تبييض منازل جربة…' },
    note: {
      en: 'Terrain, streets and every house outline come from real map data; the Ghriba is modelled from photos and simplified, and the murals are generated.',
      fr: 'Le relief, les rues et le contour de chaque maison viennent de vraies données cartographiques ; la Ghriba est modélisée d’après des photos, simplifiée, et les fresques sont générées.',
      ar: 'التضاريس والشوارع وحدود كل منزل من بيانات خرائط حقيقية، والغريبة منمذجة بتبسيط اعتمادًا على صور، والجداريات مولّدة.',
    },
  },
  hotspots: HOTSPOTS,
  photos: 'djerba',
  build: buildDjerba,
  toVec: (p, built) => {
    if (Array.isArray(p)) return new THREE.Vector3(...p);
    if ('x' in p) return new THREE.Vector3(p.x, (built.groundAt?.(p.x, p.z) ?? 0) + p.h, p.z);
    return new THREE.Vector3(0, p.y, 0);
  },
  intro: { center: [0, 12, 0], rx: 600, rz: 640, height: 260 },
  shadowClamp: 650,
  fog: 0.0006,
};
