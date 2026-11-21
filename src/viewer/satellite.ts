import * as THREE from 'three';

/**
 * Real satellite ground from Google Map Tiles API (2D, mapType "satellite").
 * Tiles are streamed per page load (Google's terms do not allow storing them) and stitched
 * into one canvas texture per detail ring. Requires an API key with Map Tiles API enabled,
 * restricted to the site's domains. Attribution must be shown (see `attribution`).
 */
export interface SatelliteOptions {
  key: string;
  lat: number;              // local origin (centre of the arena)
  lon: number;
  rotationDeg?: number;     // rotate imagery so the real monument lines up with the model
  offset?: [number, number]; // metres east, metres south
  onAttribution?: (text: string) => void;
}

const RINGS = [
  { zoom: 19, radius: 360, y: 0.016 },   // ≈ 0.25 m/px around the monument
  { zoom: 17, radius: 1300, y: 0.010 },  // ≈ 1 m/px over the town
  { zoom: 15, radius: 5200, y: 0.004 },  // ≈ 4 m/px for the outskirts
];
const API = 'https://tile.googleapis.com';

function lonToTileX(lon: number, z: number) { return ((lon + 180) / 360) * 2 ** z; }
function latToTileY(lat: number, z: number) {
  const r = (lat * Math.PI) / 180;
  return ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * 2 ** z;
}
function tileXToLon(x: number, z: number) { return (x / 2 ** z) * 360 - 180; }
function tileYToLat(y: number, z: number) {
  const n = Math.PI - (2 * Math.PI * y) / 2 ** z;
  return (180 / Math.PI) * Math.atan(Math.sinh(n));
}

export async function buildSatelliteGround(o: SatelliteOptions): Promise<THREE.Group> {
  const res = await fetch(`${API}/v1/createSession?key=${encodeURIComponent(o.key)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mapType: 'satellite', language: 'en-US', region: 'TN' }),
  });
  if (!res.ok) throw new Error(`Map Tiles session failed: ${res.status} ${await res.text()}`);
  const { session } = await res.json() as { session: string };

  const mPerDegLat = 110574;
  const mPerDegLon = 111320 * Math.cos((o.lat * Math.PI) / 180);
  const [ox, oz] = o.offset ?? [0, 0];
  // local metres: x = east, z = south (three.js: north is -z)
  const toLocal = (lat: number, lon: number) => new THREE.Vector2((lon - o.lon) * mPerDegLon + ox, -(lat - o.lat) * mPerDegLat + oz);

  const group = new THREE.Group();
  group.name = 'satellite-ground';
  group.rotation.y = THREE.MathUtils.degToRad(o.rotationDeg ?? 0);

  for (const ring of RINGS) {
    const z = ring.zoom;
    const dLat = ring.radius / mPerDegLat, dLon = ring.radius / mPerDegLon;
    const x0 = Math.floor(lonToTileX(o.lon - dLon, z)), x1 = Math.floor(lonToTileX(o.lon + dLon, z));
    const y0 = Math.floor(latToTileY(o.lat + dLat, z)), y1 = Math.floor(latToTileY(o.lat - dLat, z));
    const nx = x1 - x0 + 1, ny = y1 - y0 + 1;
    const canvas = document.createElement('canvas');
    canvas.width = nx * 256; canvas.height = ny * 256;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#b9a789'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;

    // plane covering the exact tile range
    const nw = toLocal(tileYToLat(y0, z), tileXToLon(x0, z));
    const se = toLocal(tileYToLat(y1 + 1, z), tileXToLon(x1 + 1, z));
    const geo = new THREE.PlaneGeometry(se.x - nw.x, se.y - nw.y);
    geo.rotateX(-Math.PI / 2);
    geo.translate((nw.x + se.x) / 2, ring.y, (nw.y + se.y) / 2);
    const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 1, metalness: 0, polygonOffset: true, polygonOffsetFactor: -1 - z / 10 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.receiveShadow = true;
    mesh.renderOrder = -1;
    group.add(mesh);

    // stream the tiles (a few at a time), then refresh the texture
    const jobs: (() => Promise<void>)[] = [];
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
      jobs.push(async () => {
        try {
          const r = await fetch(`${API}/v1/2dtiles/${z}/${tx}/${ty}?session=${session}&key=${encodeURIComponent(o.key)}`);
          if (!r.ok) return;
          const bmp = await createImageBitmap(await r.blob());
          ctx.drawImage(bmp, (tx - x0) * 256, (ty - y0) * 256);
          tex.needsUpdate = true;
        } catch { /* skip tile */ }
      });
    }
    const workers = Array.from({ length: 8 }, async () => { while (jobs.length) await jobs.shift()!(); });
    void Promise.all(workers);
  }

  // attribution for the visible area (required by Google)
  try {
    const d = 1300 / mPerDegLat, e = 1300 / mPerDegLon;
    const q = new URLSearchParams({ session, key: o.key, zoom: '17', north: String(o.lat + d), south: String(o.lat - d), east: String(o.lon + e), west: String(o.lon - e) });
    const vr = await fetch(`${API}/tile/v1/viewport?${q}`);
    if (vr.ok) {
      const v = await vr.json() as { copyright?: string };
      o.onAttribution?.(v.copyright ? `Imagery ${v.copyright}` : 'Imagery © Google');
    } else o.onAttribution?.('Imagery © Google');
  } catch { o.onAttribution?.('Imagery © Google'); }

  return group;
}
