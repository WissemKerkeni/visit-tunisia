/**
 * Partner / affiliate settings. Leave ids empty until you join the programmes;
 * links then work as plain searches (no commission).
 */
const env = import.meta.env as Record<string, string | undefined>;
export const AFFILIATE = {
  getyourguidePartnerId: env.VITE_GYG_PARTNER_ID ?? '',   // GetYourGuide "partner_id" (.env.local)
  bookingAid: env.VITE_BOOKING_AID ?? '',                 // Booking.com "aid" (.env.local)
};
/** Where the site is published (for share links); empty in local builds. */
export const SITE_URL = (env.VITE_SITE_URL ?? '').replace(/\/$/, '');

/**
 * Real satellite ground (Google Map Tiles API). The key comes from .env.local:
 *   VITE_GOOGLE_MAPS_KEY=...
 * Restrict the key in Google Cloud to the Map Tiles API and to your site's domains.
 * rotationDeg / offset line the real amphitheatre up with the model (major axis along x).
 */
export const SATELLITE = {
  key: (import.meta.env.VITE_GOOGLE_MAPS_KEY as string | undefined) ?? '',
  lat: 35.296496,  // centre of the arena (OpenStreetMap outline, same origin as the town)
  lon: 10.706936,
  rotationDeg: -8.3, // the scene's x axis is the amphitheatre's long axis, bearing 81.7°
  offset: [0, 0] as [number, number],
};

/**
 * Live weather on the home map (Open-Meteo forecast API: no key, free for non-commercial use; a commercial
 * site needs their paid API plan, https://open-meteo.com/en/pricing). With live off, the map and the cards
 * show the monthly climate only. The climate averages (src/content/climate.ts) are bundled data under
 * CC BY 4.0 and need only the credit.
 */
export const WEATHER = { live: (env.VITE_LIVE_WEATHER ?? 'on') !== 'off' };

export function toursUrl(term: string) {
  const u = new URL('https://www.getyourguide.com/s/');
  u.searchParams.set('q', term);
  if (AFFILIATE.getyourguidePartnerId) u.searchParams.set('partner_id', AFFILIATE.getyourguidePartnerId);
  return u.toString();
}

/** Booking.com search; with dates when the visitor has set them (YYYY-MM-DD). */
export function hotelsUrl(term: string, dates?: { checkin: string; checkout: string }) {
  const u = new URL('https://www.booking.com/searchresults.html');
  u.searchParams.set('ss', term);
  if (dates) { u.searchParams.set('checkin', dates.checkin); u.searchParams.set('checkout', dates.checkout); }
  if (AFFILIATE.bookingAid) u.searchParams.set('aid', AFFILIATE.bookingAid);
  return u.toString();
}
