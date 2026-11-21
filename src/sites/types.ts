import type * as THREE from 'three';
import type { Materials } from '../viewer/materials';
import type { T3 } from '../i18n';

/**
 * A point in a site's scene:
 * - [x, y, z]: raw scene coordinates;
 * - { t, s, y }: El Jem's amphitheatre ring coordinates (t = angle param, s = 0 arena edge … 1 facade);
 * - { x, z, h }: h metres above the ground at (x, z) (sites on real terrain).
 */
export type Pt = [number, number, number] | { t: number; s: number; y: number } | { x: number; z: number; h: number };

export interface Hotspot {
  id: string;
  marker: Pt;
  /** Where the visitor is taken by "Go there" (y is a hint, the floor is found below it). */
  view: Pt;
  photo?: string;
  legend?: boolean;
  /** Use the view point as given (no search for a clear spot). */
  fixedView?: boolean;
  /** The view is on a rooftop terrace the site builds: the houses round it are kept (no clearing). */
  rooftop?: boolean;
  title: T3;
  text: T3;
}

export interface InfoRow { k: T3; v: T3 }

export interface SiteInfo {
  name: T3;
  facts: InfoRow[];
  visit: InfoRow[];
  searchTerm: string;
  /** One line under the title on the intro panel. */
  intro: T3;
  /** Loading screen text. */
  loading: T3;
  /** Honesty note on what is reconstructed / generated. */
  note: T3;
}

export interface BuildResult {
  group: THREE.Group;
  collider: THREE.BufferGeometry;
  /** Collision of the modelled town (houses), kept apart so satellite mode can drop it. */
  townCollider: THREE.BufferGeometry | null;
  nightLights: THREE.Light[];
  lampMaterial: THREE.MeshStandardMaterial;
  spawn: { pos: THREE.Vector3; look: THREE.Vector3 };
  /** Ground height (m) at a point, for sites on real terrain. */
  groundAt?: (x: number, z: number) => number;
  /** Where the walker may stand (e.g. not in the sea). */
  canStand?: (x: number, z: number) => boolean;
  /** Per-frame animation (water, flags…). */
  update?: (dt: number, time: number) => void;
}

export interface SiteDef {
  id: string;
  lat: number;
  lon: number;
  /** Angle (radians) by which the scene is turned against true north (true east = +x rotated towards +z). */
  northRotation: number;
  info: SiteInfo;
  hotspots: Hotspot[];
  /** Folder under public/photos with the hotspot photos and their credits.json. */
  photos: string;
  build: (materials: Materials, site: SiteDef) => BuildResult | Promise<BuildResult>;
  toVec: (p: Pt, built: BuildResult) => THREE.Vector3;
  /** Slow orbit shown behind the intro panel. */
  intro: { center: [number, number, number]; rx: number; rz: number; height: number };
  /** The sun's shadow box follows the camera within ±shadowClamp metres of the origin. */
  shadowClamp: number;
  /** Day-time fog density. */
  fog: number;
  /** Real satellite ground (El Jem only, needs a Google key). */
  satellite?: boolean;
}
