import * as THREE from 'three';
import { Sky } from 'three/examples/jsm/objects/Sky.js';

const DEG = Math.PI / 180;

/** NOAA solar position approximation. Returns altitude/azimuth (radians, azimuth from north, clockwise). */
export function solarPosition(lat: number, lon: number, date: Date, localHours: number, tz: number) {
  const start = Date.UTC(date.getFullYear(), 0, 0);
  const doy = Math.floor((Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - start) / 86400000);
  const g = (2 * Math.PI / 365) * (doy - 1 + (localHours - 12) / 24);
  const eqtime = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
  const decl = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g)
    + 0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
  const offset = eqtime + 4 * lon - 60 * tz;
  const tst = localHours * 60 + offset;
  const ha = (tst / 4 - 180) * DEG;
  const la = lat * DEG;
  const cosZen = Math.sin(la) * Math.sin(decl) + Math.cos(la) * Math.cos(decl) * Math.cos(ha);
  const zen = Math.acos(Math.min(1, Math.max(-1, cosZen)));
  const az = Math.atan2(Math.sin(ha), Math.cos(ha) * Math.sin(la) - Math.tan(decl) * Math.cos(la)) + Math.PI;
  return { altitude: Math.PI / 2 - zen, azimuth: az };
}

/** World direction towards the sun (north = -z, east = +x). */
export function sunDirection(alt: number, az: number, out = new THREE.Vector3()) {
  return out.set(Math.sin(az) * Math.cos(alt), Math.sin(alt), -Math.cos(az) * Math.cos(alt));
}

const UP = new THREE.Vector3(0, 1, 0);

export class SkySystem {
  sky = new Sky();
  sun = new THREE.DirectionalLight('#fff3e0', 3);
  hemi = new THREE.HemisphereLight('#e4ebf5', '#d9b07a', 0.6);
  moon = new THREE.DirectionalLight('#9fb6ff', 0);
  stars: THREE.Points;
  dir = new THREE.Vector3();
  altitude = 0;
  private pmrem: THREE.PMREMGenerator;
  private envScene = new THREE.Scene();
  private envSky = new Sky();
  private envRT: THREE.WebGLRenderTarget | null = null;
  private lastEnvAlt = 999;

  /** northRotation: angle (radians) by which the scene is turned against true north (true east = +x rotated towards +z). */
  constructor(renderer: THREE.WebGLRenderer, private scene: THREE.Scene, readonly lat: number, readonly lon: number, readonly northRotation = 0) {
    this.sky.scale.setScalar(20000);
    this.envSky.scale.setScalar(1000);
    this.envScene.add(this.envSky);
    for (const s of [this.sky, this.envSky]) {
      const u = s.material.uniforms;
      u.turbidity.value = 2.4;
      u.rayleigh.value = 0.9;
      u.mieCoefficient.value = 0.003;
      u.mieDirectionalG.value = 0.82;
    }
    scene.add(this.sky, this.sun, this.sun.target, this.hemi, this.moon, this.moon.target);
    this.sun.castShadow = true;
    const cam = this.sun.shadow.camera;
    cam.left = -100; cam.right = 100; cam.top = 100; cam.bottom = -100; cam.near = 10; cam.far = 700;
    this.sun.shadow.bias = -0.0003;
    this.sun.shadow.normalBias = 0.05;
    this.pmrem = new THREE.PMREMGenerator(renderer);

    const n = 1800;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const u = Math.random(), v = Math.random() * 0.95 + 0.05;
      const th = u * Math.PI * 2, ph = Math.acos(1 - v);
      pos.set([Math.sin(ph) * Math.cos(th) * 9000, Math.cos(ph) * 9000, Math.sin(ph) * Math.sin(th) * 9000], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    this.stars = new THREE.Points(g, new THREE.PointsMaterial({ color: '#ffffff', size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0, depthWrite: false, fog: false }));
    scene.add(this.stars);
  }

  setShadowSize(size: number) {
    this.sun.shadow.mapSize.set(size, size);
    this.sun.shadow.map?.dispose();
    (this.sun.shadow as unknown as { map: unknown }).map = null;
  }

  /** Day used for the sun path: a spring day (high sun, long afternoons) shows the monument best. */
  date = new Date(new Date().getFullYear(), 3, 20);

  /** Update for a given local time (hours) in Tunisia (UTC+1). */
  setTime(hours: number) {
    const { altitude, azimuth } = solarPosition(this.lat, this.lon, this.date, hours, 1);
    this.altitude = altitude;
    sunDirection(altitude, azimuth, this.dir);
    this.dir.applyAxisAngle(UP, -this.northRotation);
    for (const s of [this.sky, this.envSky]) s.material.uniforms.sunPosition.value.copy(this.dir);

    const day = THREE.MathUtils.smoothstep(altitude, -0.1, 0.12);
    const low = 1 - THREE.MathUtils.smoothstep(altitude, 0.05, 0.5); // warm near the horizon
    this.sun.position.copy(this.dir).multiplyScalar(350);
    this.sun.intensity = 3.2 * day;
    this.sun.color.setHSL(0.09, 0.35 + 0.5 * low, 0.92 - 0.18 * low);
    this.sun.castShadow = altitude > 0.02;
    this.hemi.intensity = 0.15 + 0.55 * day;
    this.hemi.color.set(day > 0.5 ? '#e4ebf5' : '#5d6e9a');
    this.scene.environmentIntensity = 0.35 + 0.35 * day;
    this.moon.position.set(-0.4, 0.7, 0.5).multiplyScalar(300);
    this.moon.intensity = 0.35 * (1 - day);
    (this.stars.material as THREE.PointsMaterial).opacity = THREE.MathUtils.clamp((-altitude - 0.03) * 8, 0, 0.9);
    // after dusk the physical sky model goes grey; switch to a deep night blue
    this.sky.visible = altitude > -0.1;
    this.scene.background = this.sky.visible ? null : new THREE.Color('#0a1222');

    const fogDay = new THREE.Color('#c9d7e3'), fogSet = new THREE.Color('#e6b98c'), fogNight = new THREE.Color('#141c2c');
    const fogC = fogNight.clone().lerp(fogSet, THREE.MathUtils.smoothstep(altitude, -0.12, 0.02)).lerp(fogDay, THREE.MathUtils.smoothstep(altitude, 0.05, 0.35));
    if (this.scene.fog) (this.scene.fog as THREE.FogExp2).color.copy(fogC);

    if (Math.abs(altitude - this.lastEnvAlt) > 0.02) this.updateEnv();
    return { day, altitude };
  }

  private updateEnv() {
    this.lastEnvAlt = this.altitude;
    const rt = this.pmrem.fromScene(this.envScene as unknown as THREE.Scene, 0, 0.1, 5000);
    this.scene.environment = rt.texture;
    this.envRT?.dispose();
    this.envRT = rt;
  }

  dispose() { this.pmrem.dispose(); this.envRT?.dispose(); }
}
