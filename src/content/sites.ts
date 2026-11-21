import type { T3 } from '../i18n';

export interface Site {
  id: string;
  name: T3;
  era: T3;
  lat: number;
  lon: number;
  ready: boolean;
  unesco: boolean;
}

/** The nearest town with places to stay, for the hotel search of each monument. */
export const HOTEL_TOWN: Record<string, string> = {
  'el-jem': 'El Jem', 'sidi-bou-said': 'Sidi Bou Said', carthage: 'Carthage', 'tunis-medina': 'Tunis', dougga: 'Teboursouk',
  'bulla-regia': 'Jendouba', kairouan: 'Kairouan', sousse: 'Sousse', sbeitla: 'Sbeitla', matmata: 'Matmata', djerba: 'Djerba',
  'ksar-ouled-soltane': 'Tataouine',
};

export const SITES: Site[] = [
  { id: 'el-jem', ready: true, unesco: true, lat: 35.2964, lon: 10.7069,
    name: { en: 'Amphitheatre of El Jem', fr: 'Amphithéâtre d’El Jem', ar: 'مدرج الجم' },
    era: { en: 'Roman, c. 238 CE', fr: 'Romain, vers 238', ar: 'روماني، حوالي 238م' } },
  { id: 'sidi-bou-said', ready: true, unesco: true, lat: 36.8708, lon: 10.3417,
    name: { en: 'Sidi Bou Said', fr: 'Sidi Bou Saïd', ar: 'سيدي بوسعيد' },
    era: { en: 'Village, 13th c. to today', fr: 'Village, du XIIIe s. à nos jours', ar: 'قرية، من القرن 13 إلى اليوم' } },
  { id: 'carthage', ready: true, unesco: true, lat: 36.8529, lon: 10.3233,
    name: { en: 'Carthage', fr: 'Carthage', ar: 'قرطاج' },
    era: { en: 'Punic and Roman', fr: 'Punique et romain', ar: 'بونيقي وروماني' } },
  { id: 'tunis-medina', ready: true, unesco: true, lat: 36.7983, lon: 10.1700,
    name: { en: 'Medina of Tunis', fr: 'Médina de Tunis', ar: 'مدينة تونس العتيقة' },
    era: { en: 'Almohad and Hafsid', fr: 'Almohade et hafside', ar: 'موحدي وحفصي' } },
  { id: 'dougga', ready: true, unesco: true, lat: 36.4228, lon: 9.2186,
    name: { en: 'Dougga', fr: 'Dougga', ar: 'دقة' },
    era: { en: 'Numidian and Roman', fr: 'Numide et romain', ar: 'نوميدي وروماني' } },
  { id: 'bulla-regia', ready: true, unesco: false, lat: 36.5583, lon: 8.7556,
    name: { en: 'Bulla Regia', fr: 'Bulla Regia', ar: 'بلاريجيا' },
    era: { en: 'Roman underground villas', fr: 'Villas romaines souterraines', ar: 'فيلات رومانية تحت الأرض' } },
  { id: 'kairouan', ready: true, unesco: true, lat: 35.6812, lon: 10.1036,
    name: { en: 'Great Mosque of Kairouan', fr: 'Grande Mosquée de Kairouan', ar: 'جامع عقبة بن نافع' },
    era: { en: 'Founded 670 CE', fr: 'Fondée en 670', ar: 'تأسس سنة 670م' } },
  { id: 'sousse', ready: true, unesco: true, lat: 35.8256, lon: 10.6411,
    name: { en: 'Medina and Ribat of Sousse', fr: 'Médina et ribat de Sousse', ar: 'مدينة ورباط سوسة' },
    era: { en: '8th–9th c.', fr: 'VIIIe–IXe s.', ar: 'القرنان 8 و9' } },
  { id: 'sbeitla', ready: true, unesco: false, lat: 35.2369, lon: 9.1236,
    name: { en: 'Sbeitla (Sufetula)', fr: 'Sbeïtla (Sufetula)', ar: 'سبيطلة' },
    era: { en: 'Roman temples', fr: 'Temples romains', ar: 'معابد رومانية' } },
  { id: 'matmata', ready: true, unesco: false, lat: 33.5446, lon: 9.9667,
    name: { en: 'Matmata troglodyte houses', fr: 'Maisons troglodytes de Matmata', ar: 'مساكن مطماطة' },
    era: { en: 'Berber', fr: 'Berbère', ar: 'أمازيغي' } },
  { id: 'djerba', ready: true, unesco: true, lat: 33.8076, lon: 10.8451,
    name: { en: 'Djerba', fr: 'Djerba', ar: 'جربة' },
    era: { en: 'Island heritage', fr: 'Patrimoine insulaire', ar: 'تراث جزيرة' } },
  { id: 'ksar-ouled-soltane', ready: true, unesco: false, lat: 32.7886, lon: 10.5122,
    name: { en: 'Ksar Ouled Soltane', fr: 'Ksar Ouled Soltane', ar: 'قصر أولاد سلطان' },
    era: { en: '15th c. granary', fr: 'Grenier du XVe s.', ar: 'مخزن من القرن 15' } },
];
