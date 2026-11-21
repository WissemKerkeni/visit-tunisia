import * as THREE from 'three';
import { EL_JEM_HOTSPOTS, EL_JEM_INFO } from '../content/el-jem';
import { buildElJem } from '../monuments/el-jem/build';
import { NORTH_ROTATION } from '../monuments/el-jem/town';
import { ringPoint } from '../monuments/el-jem/geometry';
import type { SiteDef } from './types';

export const site: SiteDef = {
  id: 'el-jem',
  lat: 35.296496, lon: 10.706936, // centre of the arena (OpenStreetMap)
  northRotation: NORTH_ROTATION,
  info: {
    ...EL_JEM_INFO,
    intro: {
      en: 'A reconstruction of the amphitheatre as it stands today, built to its real dimensions.',
      fr: 'Une reconstitution de l’amphithéâtre tel qu’il est aujourd’hui, à ses dimensions réelles.',
      ar: 'إعادة بناء للمدرج كما هو اليوم، بأبعاده الحقيقية.',
    },
    loading: { en: 'Building the amphitheatre…', fr: 'Construction de l’amphithéâtre…', ar: 'جارٍ بناء المدرج…' },
    note: {
      en: 'Procedural reconstruction for illustration, based on published dimensions and reference photos. Details are simplified.',
      fr: 'Reconstitution procédurale à titre d’illustration, d’après les dimensions publiées et des photos de référence. Les détails sont simplifiés.',
      ar: 'إعادة بناء توضيحية مبنية على الأبعاد المنشورة وصور مرجعية، مع تبسيط بعض التفاصيل.',
    },
  },
  hotspots: EL_JEM_HOTSPOTS,
  photos: 'el-jem',
  build: buildElJem,
  toVec: (p) => (Array.isArray(p) ? new THREE.Vector3(...p) : 't' in p ? ringPoint(p.t, p.s, p.y) : new THREE.Vector3(p.x, p.h, p.z)),
  intro: { center: [0, 6, 0], rx: 175, rz: 150, height: 70 },
  shadowClamp: 60,
  fog: 0.0011,
  satellite: true,
};
