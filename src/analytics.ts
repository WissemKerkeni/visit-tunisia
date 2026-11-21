/**
 * Visitor statistics with Vercel Web Analytics: no cookies and no personal data, only on the deployed site.
 * The home page's views (#/plan…) and the 3D monuments are counted as pages of their own.
 */
import { inject, pageview } from '@vercel/analytics';

// not on a local preview of the build (its script only exists on Vercel)
const on = import.meta.env.PROD && !/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
if (on) inject({ mode: 'production', disableAutoTrack: true });
let last = '';
/** Count a page view (path like /en/plan/ or /3d/el-jem/), once per change. */
export function trackView(path: string) {
  if (!on || path === last) return;
  last = path;
  pageview({ path, route: path });
}
