import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

/** Final grade in display space: gentle contrast, warm lift, a touch of saturation and a soft vignette. */
const GradeShader = {
  uniforms: { tDiffuse: { value: null } },
  vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `
    uniform sampler2D tDiffuse; varying vec2 vUv;
    void main() {
      vec3 c = texture2D(tDiffuse, vUv).rgb;
      float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
      c = mix(vec3(l), c, 1.08);                       // saturation
      c = (c - 0.5) * 1.05 + 0.5;                      // contrast
      c *= vec3(1.015, 1.0, 0.97);                     // warm balance
      c += vec3(0.012, 0.008, 0.0) * (1.0 - l);        // lift shadows warm
      vec2 d = vUv - 0.5; float v = smoothstep(0.85, 0.25, length(d * vec2(1.0, 0.8)));
      c *= mix(0.86, 1.0, v);
      gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
    }`,
};
import { Materials } from './materials';
import { SkySystem } from './sky';
import { Player } from './Player';
import { Input } from './input';
import { buildSatelliteGround } from './satellite';
import { MeshBVH } from 'three-mesh-bvh';
import { SATELLITE } from '../config';

/** Modelled surroundings that the real satellite imagery replaces. */
const TOWN_OBJECTS = ['plaster', 'roof', 'plasterFar', 'roofFar', 'townSteel', 'asphalt', 'urban', 'fields',
  'paving', 'fence', 'plazaBlock', 'cars', 'lamps', 'trees', 'palms'];
import type { BuildResult, Hotspot, Pt, SiteDef } from '../sites/types';

export type Quality = 'low' | 'medium' | 'high';
export type Mode = 'intro' | 'fly' | 'walk';

const BASE = import.meta.env.BASE_URL;

export interface ScreenHotspot { id: string; x: number; y: number; visible: boolean; dist: number }

export class Viewer {
  renderer: THREE.WebGLRenderer;
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(68, 1, 0.1, 30000);
  sky!: SkySystem;
  player!: Player;
  input: Input;
  mode: Mode = 'intro';
  quality: Quality;
  propCredits: string[] = [];
  onModeChange?: (m: Mode) => void;
  onFrame?: (spots: ScreenHotspot[]) => void;

  private composer: EffectComposer | null = null;
  private gtao: GTAOPass | null = null;
  private materials: Materials;
  private nightLights: THREE.Light[] = [];
  private lampMat: THREE.MeshStandardMaterial | null = null;
  private hotspots: { h: Hotspot; pos: THREE.Vector3; occluded: boolean }[] = [];
  private clock = new THREE.Clock();
  private introAngle = 0.35;
  private fly: { from: THREE.Vector3; to: THREE.Vector3; qFrom: THREE.Quaternion; qTo: THREE.Quaternion; t: number; dur: number; done: () => void } | null = null;
  private frame = 0;
  private spawn = { pos: new THREE.Vector3(), look: new THREE.Vector3() };
  private resizeObs: ResizeObserver;
  private fadeEl: HTMLDivElement;
  private hours = 14.5;

  private built: BuildResult | null = null;
  private time = 0;

  constructor(private container: HTMLElement, overlay: HTMLElement, quality: Quality, readonly site: SiteDef) {
    this.quality = quality;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.62;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.append(this.renderer.domElement);
    this.renderer.domElement.className = 'viewer-canvas';
    this.fadeEl = document.createElement('div');
    this.fadeEl.className = 'fade';
    container.append(this.fadeEl);
    this.materials = new Materials(BASE, Math.min(8, this.renderer.capabilities.getMaxAnisotropy()));
    this.scene.fog = new THREE.FogExp2('#d8dfe3', site.fog);
    this.input = new Input(this.renderer.domElement, overlay);
    this.resizeObs = new ResizeObserver(() => this.resize());
    this.resizeObs.observe(container);
  }

  private toVec(p: Pt) { return this.site.toVec(p, this.built!); }

  async load(onProgress: (f: number) => void) {
    const mgr = THREE.DefaultLoadingManager;
    mgr.onProgress = (_u, loaded, total) => onProgress(0.15 + 0.75 * (loaded / Math.max(1, total)));
    const texturesDone = new Promise<void>((res) => { mgr.onLoad = () => res(); setTimeout(res, 12000); });
    onProgress(0.05);
    await new Promise((r) => setTimeout(r, 30)); // let the loading screen paint

    this.sky = new SkySystem(this.renderer, this.scene, this.site.lat, this.site.lon, this.site.northRotation);
    const built = await this.site.build(this.materials, this.site);
    this.built = built;
    this.scene.add(built.group);
    this.nightLights = built.nightLights;
    this.lampMat = built.lampMaterial;
    this.spawn = built.spawn;

    this.monumentGroup = built.group;
    this.colliderParts = { base: [built.collider], town: built.townCollider };
    const parts = [...this.colliderParts.base, ...(built.townCollider ? [built.townCollider] : [])];
    const collider = parts.length > 1 ? mergeGeometries(parts)! : parts[0];
    this.player = new Player(collider);
    this.player.canStand = built.canStand;
    this.fullBVH = this.player.bvh;
    this.player.teleport(this.spawn.pos.x, this.spawn.pos.y + 1, this.spawn.pos.z);
    this.player.lookAt(this.spawn.look);

    this.hotspots = this.site.hotspots.map((h) => ({ h, pos: this.toVec(h.marker), occluded: false }));
    this.applyQuality();
    this.setTime(this.hours);
    this.resize();

    await texturesDone;
    onProgress(1);
    this.renderer.setAnimationLoop(() => this.tick());
  }

  // ---------------------------------------------------------------------------

  setTime(hours: number) {
    this.hours = hours;
    if (!this.sky) return;
    const { day } = this.sky.setTime(hours);
    const night = 1 - day;
    // each light can carry its own night intensity (village lamps are far weaker than El Jem's floodlights)
    this.nightLights.forEach((l) => { l.intensity = night > 0.35 ? ((l.userData.nightIntensity as number | undefined) ?? 3200) * night : 0; });
    if (this.lampMat) this.lampMat.emissiveIntensity = night > 0.3 ? 4 * night : 0;
    this.renderer.toneMappingExposure = 0.78 + 0.35 * night;
    (this.scene.fog as THREE.FogExp2).density = this.site.fog * (1 + 0.55 * night);
  }

  /** Called when the viewer lowers the quality on its own because frames are slow. */
  onAutoQuality?: (q: Quality) => void;
  private userPickedQuality = false;
  private perf = { warm: 0, frames: 0, time: 0, done: false };

  private monumentGroup: THREE.Object3D | null = null;

  // ---- real satellite ground ------------------------------------------------
  groundMode: 'model' | 'satellite' = 'model';
  onAttribution?: (text: string) => void;
  private satellite: THREE.Object3D | null = null;
  private satelliteLoading: Promise<void> | null = null;
  private colliderParts: { base: THREE.BufferGeometry[]; town: THREE.BufferGeometry | null } | null = null;
  private fullBVH: MeshBVH | null = null;
  private noTownBVH: MeshBVH | null = null;

  /** Satellite mode is available when a Google Map Tiles key is configured. */
  get satelliteAvailable() { return !!SATELLITE.key && !!this.site.satellite; }

  /**
   * 'satellite': stream Google satellite imagery as the ground and hide the modelled town, roads and plaza
   * (the real streets and roofs are in the imagery). Tiles are only requested the first time it is turned on.
   */
  async setGroundMode(mode: 'model' | 'satellite') {
    if (!this.monumentGroup) return;
    if (mode === 'satellite' && !this.satellite) {
      if (!this.satelliteAvailable) return;
      this.satelliteLoading ??= buildSatelliteGround({
        key: SATELLITE.key, lat: SATELLITE.lat, lon: SATELLITE.lon, rotationDeg: SATELLITE.rotationDeg, offset: SATELLITE.offset,
        onAttribution: (t) => this.onAttribution?.(t),
      }).then((g) => { this.satellite = g; this.scene.add(g); });
      await this.satelliteLoading;
    }
    this.groundMode = mode;
    const sat = mode === 'satellite';
    // collision: without the modelled houses in satellite mode (built once, on first use)
    if (sat && !this.noTownBVH && this.colliderParts) {
      const b = this.colliderParts.base;
      this.noTownBVH = new MeshBVH(b.length > 1 ? mergeGeometries(b)! : b[0], { maxLeafTris: 12 });
    }
    const bvh = sat ? this.noTownBVH : this.fullBVH;
    if (bvh) this.player.setCollider(bvh);
    if (this.satellite) this.satellite.visible = sat;
    for (const name of TOWN_OBJECTS) {
      this.monumentGroup.traverse((o) => { if (o.name === name) o.visible = !sat; });
    }
    if (!sat) this.onAttribution?.('');
  }

  setQuality(q: Quality, fromUser = true) {
    if (fromUser) this.userPickedQuality = true;
    this.quality = q;
    this.applyQuality();
    this.perf = { warm: 0, frames: 0, time: 0, done: this.perf.done };
  }

  /** Measure ~2 s of frames (after warm-up); if slower than ~30 fps, step quality down once per check. */
  private autoQuality(rawDt: number) {
    if (this.userPickedQuality || this.perf.done || document.visibilityState !== 'visible' || this.mode === 'fly') return;
    const p = this.perf;
    if (p.warm++ < 90) return;
    p.frames++; p.time += rawDt;
    if (p.frames < 120) return;
    const avg = p.time / p.frames;
    if (avg > 1 / 30 && this.quality !== 'low') {
      const next: Quality = this.quality === 'high' ? 'medium' : 'low';
      this.setQuality(next, false);
      this.onAutoQuality?.(next);
    } else {
      p.done = true;
    }
  }

  private applyQuality() {
    const dpr = window.devicePixelRatio || 1;
    const q = this.quality;
    this.renderer.setPixelRatio(q === 'low' ? 1 : q === 'medium' ? Math.min(dpr, 1.5) : Math.min(dpr, 2));
    this.sky?.setShadowSize(q === 'low' ? 1024 : q === 'medium' ? 2048 : 4096);
    this.renderer.shadowMap.type = q === 'low' ? THREE.PCFShadowMap : THREE.PCFSoftShadowMap;
    this.composer?.dispose();
    this.composer = null;
    this.gtao = null;
    if (q === 'high') {
      try {
        const size = this.renderer.getDrawingBufferSize(new THREE.Vector2());
        const rt = new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.HalfFloatType, samples: 4 });
        this.composer = new EffectComposer(this.renderer, rt);
        this.composer.addPass(new RenderPass(this.scene, this.camera));
        this.gtao = new GTAOPass(this.scene, this.camera, size.x, size.y);
        this.gtao.updateGtaoMaterial({ radius: 1.4, distanceExponent: 1.6, thickness: 2.5, scale: 1.0, samples: 8 });
        this.gtao.blendIntensity = 0.85;
        this.composer.addPass(this.gtao);
        this.composer.addPass(new UnrealBloomPass(new THREE.Vector2(size.x, size.y), 0.18, 0.5, 0.92));
        this.composer.addPass(new OutputPass());
        this.composer.addPass(new ShaderPass(GradeShader));
      } catch (err) {
        console.warn('Post-processing unavailable, falling back', err);
        this.composer = null;
      }
    }
    this.resize();
    this.scene.traverse((o) => { const m = (o as THREE.Mesh).material as THREE.Material | undefined; if (m) m.needsUpdate = true; });
  }

  private resize() {
    const w = this.container.clientWidth || 1, h = this.container.clientHeight || 1;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    if (this.composer) {
      this.composer.setPixelRatio(this.renderer.getPixelRatio());
      this.composer.setSize(w, h);
    }
  }

  // ---------------------------------------------------------------------------

  private setMode(m: Mode) { this.mode = m; this.input.enabled = m === 'walk'; this.onModeChange?.(m); }

  startWalk() {
    if (this.mode !== 'intro') return;
    const to = new THREE.Vector3(this.player.pos.x, this.player.pos.y + 1.65, this.player.pos.z);
    const look = new THREE.Object3D();
    look.position.copy(to);
    look.rotation.set(this.player.pitch, this.player.yaw, 0, 'YXZ');
    this.setMode('fly');
    this.fly = { from: this.camera.position.clone(), to, qFrom: this.camera.quaternion.clone(), qTo: look.quaternion.clone(), t: 0, dur: 3.2,
      done: () => this.setMode('walk') };
  }

  async goTo(h: Hotspot) {
    if (this.mode === 'intro') {
      this.setMode('walk');
    }
    await this.fade(true);
    const marker = this.toVec(h.marker);
    let v = this.toVec(h.view);
    if (this.built?.groundAt && !h.fixedView) v = this.findView(marker, v);
    this.player.teleport(v.x, v.y, v.z);
    this.player.lookAt(marker);
    this.player.applyCamera(this.camera);
    await this.fade(false);
  }

  /**
   * On terrain sites (dense villages), find a clear place to stand near the suggested one: on open ground
   * (not a roof), away from walls, with nothing between the eye and the landmark. Tall landmarks are seen
   * from further away so they are not straight overhead.
   */
  private findView(marker: THREE.Vector3, hint: THREE.Vector3) {
    const b = this.built!, g = b.groundAt!;
    const rMin = Math.max(8, (marker.y - g(marker.x, marker.z)) * 1.3);
    const eye = new THREE.Vector3(), side = new THREE.Vector3();
    let best: THREE.Vector3 | null = null, score = Infinity;
    for (let r = rMin; r <= rMin + 60; r += 3) {
      for (let k = 0; k < 40; k++) {
        const a = (k / 40) * Math.PI * 2, x = marker.x + Math.cos(a) * r, z = marker.z + Math.sin(a) * r;
        if (b.canStand && !b.canStand(x, z)) continue;
        const gy = g(x, z), floor = this.player.floorBelow(x, gy + 40, z, 80);
        if (floor === null || Math.abs(floor - gy) > 0.8) continue; // a roof or a house is here
        eye.set(x, gy + 1.65, z);
        if (this.player.blocked(eye, marker)) continue;
        let tight = false;
        for (const [ox, oz] of [[1.3, 0], [-1.3, 0], [0, 1.3], [0, -1.3]]) { side.set(x + ox, gy + 1.2, z + oz); if (this.player.blocked(eye, side)) { tight = true; break; } }
        if (tight) continue;
        const sc = Math.hypot(x - hint.x, z - hint.z) + Math.abs(r - rMin - 12) * 0.5;
        if (sc < score) { score = sc; best = new THREE.Vector3(x, gy + 1, z); }
      }
    }
    return best ?? hint;
  }

  private fade(on: boolean) {
    this.fadeEl.classList.toggle('on', on);
    return new Promise((r) => setTimeout(r, 380));
  }

  // ---------------------------------------------------------------------------

  private tick() {
    const rawDt = this.clock.getDelta();
    const dt = Math.min(rawDt, 0.1);
    this.frame++;
    this.autoQuality(rawDt);
    if (this.mode === 'intro') {
      this.introAngle += dt * 0.045;
      const a = this.introAngle, o = this.site.intro, [cx, cy, cz] = o.center;
      this.camera.position.set(cx + Math.cos(a) * o.rx, cy + o.height + Math.sin(a * 0.7) * 8, cz + Math.sin(a) * o.rz);
      this.camera.lookAt(cx, cy, cz);
    } else if (this.mode === 'fly' && this.fly) {
      const f = this.fly;
      f.t += dt / f.dur;
      const e = f.t >= 1 ? 1 : 1 - Math.pow(1 - f.t, 3);
      // arc over the top so we don't clip through walls
      const p = f.from.clone().lerp(f.to, e);
      p.y += Math.sin(Math.PI * e) * 25 * (1 - e);
      this.camera.position.copy(p);
      this.camera.quaternion.copy(f.qFrom).slerp(f.qTo, e);
      if (f.t >= 1) { this.fly = null; f.done(); }
    } else if (this.mode === 'walk') {
      const look = this.input.consumeLook();
      this.player.yaw -= look.x * 0.0022;
      this.player.pitch = THREE.MathUtils.clamp(this.player.pitch - look.y * 0.0022, -1.45, 1.45);
      this.player.update(dt, this.input.move());
      this.player.applyCamera(this.camera);
    }

    // shadow frustum follows the camera a little, staying centred on the monument
    if (this.sky) {
      const c = this.camera.position;
      const k = this.site.shadowClamp;
      const fx = THREE.MathUtils.clamp(c.x, -k, k), fz = THREE.MathUtils.clamp(c.z, -k, k);
      const focus = new THREE.Vector3(fx, this.built?.groundAt?.(fx, fz) ?? 0, fz);
      this.sky.sun.target.position.copy(focus);
      this.sky.sun.position.copy(this.sky.dir).multiplyScalar(350).add(focus);
      this.sky.stars.position.copy(c);
    }

    this.time += dt;
    this.built?.update?.(dt, this.time);
    if (this.composer) this.composer.render(dt); else this.renderer.render(this.scene, this.camera);
    this.emitHotspots();
  }

  private emitHotspots() {
    if (!this.onFrame) return;
    const w = this.container.clientWidth, h = this.container.clientHeight;
    const cam = this.camera.position;
    const out: ScreenHotspot[] = [];
    const checkOcclusion = this.frame % 8 === 0 && this.mode === 'walk';
    for (const hs of this.hotspots) {
      const dist = cam.distanceTo(hs.pos);
      if (checkOcclusion) hs.occluded = this.player.blocked(cam, hs.pos);
      const p = hs.pos.clone().project(this.camera);
      const inFront = p.z < 1 && p.z > -1;
      const visible = this.mode === 'walk' && inFront && dist < 75 && !hs.occluded;
      out.push({ id: hs.h.id, x: (p.x * 0.5 + 0.5) * w, y: (-p.y * 0.5 + 0.5) * h, visible, dist });
    }
    this.onFrame(out);
  }

  /** Render one frame and return it as a JPEG blob with a small caption. */
  async capture(caption: string): Promise<Blob | null> {
    if (this.composer) this.composer.render(0); else this.renderer.render(this.scene, this.camera);
    const src = this.renderer.domElement;
    const c = document.createElement('canvas');
    c.width = src.width; c.height = src.height;
    const ctx = c.getContext('2d')!;
    ctx.drawImage(src, 0, 0);
    const pad = Math.round(c.width * 0.02), fs = Math.round(c.width * 0.018);
    ctx.font = `600 ${fs}px "Cormorant Garamond", Georgia, serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = fs * 0.4;
    ctx.textAlign = 'right';
    ctx.fillText(caption, c.width - pad, c.height - pad);
    return new Promise((r) => c.toBlob((b) => r(b), 'image/jpeg', 0.92));
  }

  dispose() {
    this.renderer.setAnimationLoop(null);
    this.resizeObs.disconnect();
    this.input.dispose();
    this.composer?.dispose();
    this.sky?.dispose();
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) { m.geometry.dispose(); }
    });
    this.materials.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
    this.fadeEl.remove();
  }
}
