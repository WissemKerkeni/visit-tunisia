import * as THREE from 'three';

/**
 * World-space weathering for stone and ground materials, injected into MeshStandardMaterial:
 * - large-scale colour variation (breaks texture tiling, suggests individual block tones)
 * - darker grime near the ground and in the underground level
 * - vertical rain / soot streaks on walls
 * - sand dust settling on upward-facing surfaces
 * - slight sun-bleaching on high surfaces
 */
export interface WeatherOpts {
  variation?: number; // 0..1
  patina?: number;    // grey-brown weathering patches (defaults to variation)
  grime?: number;
  streaks?: number;
  dust?: number;
  bleach?: number;
  blockScale?: number; // metres per tone cell (ashlar size)
  dustColor?: string;
}

const NOISE = /* glsl */ `
varying vec3 vWPos;
varying vec3 vWNrm;
float wHash(vec3 p) { p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3)); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float wNoise(vec3 x) {
  vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(wHash(i), wHash(i + vec3(1,0,0)), f.x), mix(wHash(i + vec3(0,1,0)), wHash(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(wHash(i + vec3(0,0,1)), wHash(i + vec3(1,0,1)), f.x), mix(wHash(i + vec3(0,1,1)), wHash(i + vec3(1,1,1)), f.x), f.y), f.z);
}
float wFbm(vec3 p) { return 0.57 * wNoise(p) + 0.29 * wNoise(p * 2.03) + 0.14 * wNoise(p * 4.1); }
`;

export function weather(mat: THREE.MeshStandardMaterial, o: WeatherOpts = {}) {
  const u = {
    uVar: { value: o.variation ?? 0.5 },
    uPatina: { value: o.patina ?? o.variation ?? 0.5 },
    uGrime: { value: o.grime ?? 0.5 },
    uStreak: { value: o.streaks ?? 0.5 },
    uDust: { value: o.dust ?? 0.5 },
    uBleach: { value: o.bleach ?? 0.3 },
    uBlock: { value: o.blockScale ?? 1.2 },
    uDustCol: { value: new THREE.Color(o.dustColor ?? '#e9cf9f') },
  };
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, u);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWPos;\nvarying vec3 vWNrm;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vec4 wp = modelMatrix * vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
          wp = modelMatrix * instanceMatrix * vec4(transformed, 1.0);
        #endif
        vWPos = wp.xyz;
        vWNrm = normalize(mat3(modelMatrix) * objectNormal);`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
        uniform float uVar, uPatina, uGrime, uStreak, uDust, uBleach, uBlock;
        uniform vec3 uDustCol;
        ${NOISE}`)
      .replace('#include <map_fragment>', `#include <map_fragment>
        {
          vec3 p = vWPos;
          vec3 n = normalize(vWNrm);
          vec3 col = diffuseColor.rgb;
          // block-sized tone cells + broad patches
          float cell = wHash(floor(p / vec3(uBlock * 1.6, uBlock * 0.7, uBlock * 1.6)));
          float broad = wFbm(p * 0.045);
          float fine = wNoise(p * 1.7);
          float tone = mix(0.76, 1.12, cell) * mix(0.72, 1.15, broad);
          col *= mix(vec3(1.0), vec3(tone) * mix(vec3(1.04, 0.98, 0.9), vec3(0.94, 0.97, 1.02), fine), uVar);
          // grey-brown patina in broad patches (lichen, soot, old weathering)
          float patina = smoothstep(0.55, 0.8, wNoise(p * 0.11 + vec3(11.0, 0.0, 5.0)) * 0.7 + broad * 0.3);
          col = mix(col, col * vec3(0.62, 0.58, 0.54), uPatina * patina * 0.75);
          // grime near the ground (y = 0) and in the underground level (y = -5)
          float h = min(abs(p.y), abs(p.y + 5.0) + 0.6);
          float grime = (1.0 - smoothstep(0.0, 2.2, h)) * (0.6 + 0.4 * wNoise(p * 0.8));
          col *= 1.0 - 0.32 * uGrime * grime;
          // vertical streaks on walls
          float vert = 1.0 - abs(n.y);
          float st = wNoise(vec3(p.x * 2.2, p.y * 0.12, p.z * 2.2)) * wNoise(vec3(p.x * 0.5, p.y * 0.05, p.z * 0.5) + 7.0);
          col *= 1.0 - uStreak * 0.5 * vert * smoothstep(0.22, 0.55, st);
          // dust on upward faces, patchy
          float up = smoothstep(0.55, 0.95, n.y);
          float dustPatch = smoothstep(0.3, 0.75, wNoise(p * 0.35 + 3.0));
          col = mix(col, uDustCol * (0.9 + 0.2 * fine), uDust * up * (0.35 + 0.65 * dustPatch) * 0.75);
          // sun-bleached high parts
          col = mix(col, col * 1.08 + 0.02, uBleach * smoothstep(12.0, 34.0, p.y));
          diffuseColor.rgb = col;
        }`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        roughnessFactor = clamp(roughnessFactor + 0.15 * (wHash(floor(vWPos * 1.3)) - 0.5), 0.3, 1.0);`);
  };
  mat.customProgramCacheKey = () => 'weather-v1';
  return mat;
}
