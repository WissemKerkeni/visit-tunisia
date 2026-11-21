/**
 * Weather for the home map: the weather now and the next days (live, Open-Meteo forecast API, no key),
 * and the monthly climate of 24 towns (src/content/climate.ts, averages over ten years).
 * Every place takes the climate and the forecast of the nearest town.
 */
import { WEATHER } from '../config';
import { CLIMATE, type Climate } from '../content/climate';
import { km } from '../content/atlas';
import { lang, type T3 } from '../i18n';

export interface Now { t: number; code: number; day: boolean; days: { hi: number; lo: number; code: number }[] }

/** Icon and words for a WMO weather code. */
export function sky(code: number, day = true): { icon: string; text: T3 } {
  if (code === 0) return { icon: day ? '☀️' : '🌙', text: { en: 'Clear sky', fr: 'Dégagé', ar: 'صافٍ' } };
  if (code === 1) return { icon: day ? '🌤️' : '🌙', text: { en: 'Mostly clear', fr: 'Plutôt dégagé', ar: 'صافٍ غالبًا' } };
  if (code === 2) return { icon: '⛅', text: { en: 'Partly cloudy', fr: 'Partiellement nuageux', ar: 'غائم جزئيًا' } };
  if (code === 3) return { icon: '☁️', text: { en: 'Cloudy', fr: 'Nuageux', ar: 'غائم' } };
  if (code === 45 || code === 48) return { icon: '🌫️', text: { en: 'Fog', fr: 'Brouillard', ar: 'ضباب' } };
  if (code >= 51 && code <= 57) return { icon: '🌦️', text: { en: 'Drizzle', fr: 'Bruine', ar: 'رذاذ' } };
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return { icon: '🌧️', text: { en: 'Rain', fr: 'Pluie', ar: 'مطر' } };
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return { icon: '🌨️', text: { en: 'Snow', fr: 'Neige', ar: 'ثلج' } };
  if (code >= 95) return { icon: '⛈️', text: { en: 'Thunderstorm', fr: 'Orage', ar: 'عاصفة رعدية' } };
  return { icon: '🌤️', text: { en: 'Fair', fr: 'Beau', ar: 'معتدل' } };
}
/** A month's typical sky, from its rainy days. */
export const monthSky = (rainDays: number) => (rainDays <= 2 ? '☀️' : rainDays <= 6 ? '🌤️' : '🌦️');

export function nearestTown(lat: number, lon: number): Climate {
  let best = CLIMATE[0], bd = Infinity;
  for (const c of CLIMATE) { const d = km([lat, lon], [c.lat, c.lon]); if (d < bd) { bd = d; best = c; } }
  return best;
}
/** Short month names in the current language. */
export const monthName = (m: number, style: 'short' | 'long' = 'short') =>
  new Intl.DateTimeFormat(lang() === 'ar' ? 'ar-TN' : lang(), { month: style }).format(new Date(2024, m, 15));
export const thisMonth = () => new Date().getMonth();

let nowP: Promise<Map<string, Now> | null> | null = null, fetchedAt = 0;
/** The weather now at every town (one request, kept for 30 minutes). Null when switched off or offline. */
export function weatherNow(): Promise<Map<string, Now> | null> {
  if (!WEATHER.live) return Promise.resolve(null);
  if (nowP && Date.now() - fetchedAt < 30 * 60 * 1000) return nowP;
  fetchedAt = Date.now();
  const u = new URL('https://api.open-meteo.com/v1/forecast');
  u.searchParams.set('latitude', CLIMATE.map((c) => c.lat).join(','));
  u.searchParams.set('longitude', CLIMATE.map((c) => c.lon).join(','));
  u.searchParams.set('current', 'temperature_2m,weather_code,is_day');
  u.searchParams.set('daily', 'temperature_2m_max,temperature_2m_min,weather_code');
  u.searchParams.set('forecast_days', '4');
  u.searchParams.set('timezone', 'Africa/Tunis');
  nowP = fetch(u).then((r) => (r.ok ? r.json() : null)).then((j) => {
    if (!j) return null;
    const list = Array.isArray(j) ? j : [j];
    const out = new Map<string, Now>();
    list.forEach((x, i) => {
      const c = CLIMATE[i]; if (!c || !x.current) return;
      out.set(c.id, {
        t: Math.round(x.current.temperature_2m), code: x.current.weather_code, day: !!x.current.is_day,
        days: x.daily.time.slice(1).map((_: string, k: number) => ({ hi: Math.round(x.daily.temperature_2m_max[k + 1]), lo: Math.round(x.daily.temperature_2m_min[k + 1]), code: x.daily.weather_code[k + 1] })),
      });
    });
    return out;
  }).catch(() => null);
  return nowP;
}
