export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Partial<Record<string, string | boolean | EventListener>> = {},
  ...children: (Node | string | null | undefined | false)[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v === undefined || v === false) continue;
    if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v as EventListener);
    else if (k === 'class') el.className = String(v);
    else if (k === 'html') el.innerHTML = String(v);
    else el.setAttribute(k, v === true ? '' : String(v));
  }
  for (const c of children) if (c !== null && c !== undefined && c !== false) el.append(c);
  return el;
}

export interface PhotoCredit { file: string; author: string; license: string; license_url: string; source: string }

const photoCredits = new Map<string, Record<string, PhotoCredit>>();
export async function loadPhotoCredits(site: string): Promise<Record<string, PhotoCredit>> {
  const cached = photoCredits.get(site);
  if (cached) return cached;
  let out: Record<string, PhotoCredit> = {};
  try {
    const r = await fetch(`${import.meta.env.BASE_URL}photos/${site}/credits.json`);
    if (r.ok) out = await r.json();
  } catch { /* none */ }
  photoCredits.set(site, out);
  return out;
}

export function creditLine(c: PhotoCredit, label = 'Photo') {
  return h('div', { class: 'credit' },
    `${label}: `, h('a', { href: c.source, target: '_blank', rel: 'noopener' }, c.author), ', ',
    h('a', { href: c.license_url, target: '_blank', rel: 'noopener' }, c.license));
}
