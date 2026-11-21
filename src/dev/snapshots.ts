// Dev-only: render a fixed set of views and save them via the Vite /__snapshot endpoint.
import * as THREE from 'three';
import type { Viewer } from '../viewer/Viewer';

type View = { name: string; hours: number; pos: [number, number, number]; look: [number, number, number]; walk: boolean };

export const VIEWS: View[] = [
  { name: 'aerial', hours: 16.4, pos: [150, 70, 125], look: [0, 6, 0], walk: false },
  { name: 'facade', hours: 15.5, pos: [-75, 1, 78], look: [-40, 14, 40], walk: true },
  { name: 'arena', hours: 14.5, pos: [-12, 1, 10], look: [30, 8, -10], walk: true },
  { name: 'seats', hours: 12, pos: [-6, 14, -33], look: [25, 4, 5], walk: true },
  { name: 'corridor', hours: 14.5, pos: [25.8, 1, 54.3], look: [38.5, 3, 49.1], walk: true },
  { name: 'street', hours: 10.5, pos: [84, 1, 50], look: [0, 14, 0], walk: true },
  { name: 'townview', hours: 10.5, pos: [-54.7, 21.5, 37.4], look: [-160, 6, 120], walk: true },
];

export async function snapAll(v: Viewer, prefix: string) {
  const out: string[] = [];
  const panel = document.querySelector('.overlay') as HTMLElement | null;
  if (panel) panel.style.visibility = 'hidden';
  for (const view of VIEWS) {
    v.setTime(view.hours);
    if (view.walk) {
      (v as unknown as { mode: string }).mode = 'walk';
      v.player.teleport(view.pos[0], view.pos[1], view.pos[2]);
      v.player.lookAt(new THREE.Vector3(...view.look));
      v.player.applyCamera(v.camera);
    } else {
      (v as unknown as { mode: string }).mode = 'still';
      v.camera.position.set(...view.pos);
      v.camera.lookAt(...view.look);
    }
    await new Promise((r) => setTimeout(r, 900)); // let shadows / env settle over a few frames
    const blob = await v.capture('');
    if (!blob) continue;
    const dataUrl: string = await new Promise((r) => { const fr = new FileReader(); fr.onload = () => r(fr.result as string); fr.readAsDataURL(blob); });
    await fetch(`/__snapshot?name=${prefix}-${view.name}`, { method: 'POST', body: dataUrl });
    out.push(`${prefix}-${view.name}`);
  }
  if (panel) panel.style.visibility = '';
  return out;
}
