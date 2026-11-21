import * as THREE from 'three';
import { MeshBVH } from 'three-mesh-bvh';

const RADIUS = 0.3;
const HEIGHT = 1.75;
const EYE = 1.65;
const STEP = 0.5;
const GRAVITY = 22;

export interface MoveInput { forward: number; right: number; run: boolean }

/** First-person walker: capsule collision for walls, ray to the floor for steps and slopes. */
export class Player {
  bvh: MeshBVH;
  pos = new THREE.Vector3();
  vel = new THREE.Vector3();
  yaw = 0;
  pitch = 0;
  onGround = false;
  /** Where the walker may stand (e.g. not out in the sea); unset = anywhere. */
  canStand?: (x: number, z: number) => boolean;
  /** Walking speed multiplier chosen by the visitor (1 = normal walking pace). */
  speedFactor = 1;
  private eyeY = 0;
  private bob = 0;
  private seg = new THREE.Line3();
  private box = new THREE.Box3();
  private v1 = new THREE.Vector3();
  private v2 = new THREE.Vector3();
  private ray = new THREE.Ray();
  private down = new THREE.Vector3(0, -1, 0);
  private safe = new THREE.Vector3();

  constructor(collider: THREE.BufferGeometry) {
    this.bvh = new MeshBVH(collider, { maxLeafTris: 12 });
  }

  /** Swap the collision world (e.g. without the modelled town in satellite mode). */
  setCollider(bvh: MeshBVH) { this.bvh = bvh; }

  teleport(x: number, yHint: number, z: number) {
    const y = this.floorBelow(x, yHint + 1.5, z, 40) ?? yHint;
    this.pos.set(x, y, z);
    this.vel.set(0, 0, 0);
    this.eyeY = y + EYE;
    this.safe.copy(this.pos);
  }

  lookAt(target: THREE.Vector3) {
    const dx = target.x - this.pos.x, dz = target.z - this.pos.z, dy = target.y - (this.pos.y + EYE);
    this.yaw = Math.atan2(-dx, -dz);
    this.pitch = Math.atan2(dy, Math.hypot(dx, dz));
  }

  floorBelow(x: number, fromY: number, z: number, maxDist: number): number | null {
    this.ray.origin.set(x, fromY, z);
    this.ray.direction.copy(this.down);
    const hit = this.bvh.raycastFirst(this.ray, THREE.DoubleSide);
    if (!hit || hit.distance > maxDist) return null;
    return hit.point.y;
  }

  /** True if the segment between the two points hits geometry. */
  blocked(from: THREE.Vector3, to: THREE.Vector3) {
    this.ray.origin.copy(from);
    this.ray.direction.subVectors(to, from);
    const d = this.ray.direction.length();
    this.ray.direction.normalize();
    const hit = this.bvh.raycastFirst(this.ray, THREE.DoubleSide);
    return !!hit && hit.distance < d - 0.3;
  }

  update(dt: number, input: MoveInput) {
    dt = Math.min(dt, 0.05);
    // at high speed, move in sub-steps of at most 15 cm so the capsule can't pass through thin walls
    const maxSpeed = (input.run ? 6.2 : 2.7) * this.speedFactor;
    const n = Math.max(1, Math.ceil((maxSpeed * dt) / 0.15));
    for (let i = 0; i < n; i++) this.step(dt / n, input);
  }

  private step(dt: number, input: MoveInput) {
    const speed = (input.run ? 6.2 : 2.7) * this.speedFactor;
    const fwd = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
    const wish = fwd.multiplyScalar(input.forward).add(right.multiplyScalar(input.right));
    if (wish.lengthSq() > 1) wish.normalize();
    wish.multiplyScalar(speed);
    const accel = this.onGround ? 12 : 2;
    this.vel.x += (wish.x - this.vel.x) * Math.min(1, accel * dt);
    this.vel.z += (wish.z - this.vel.z) * Math.min(1, accel * dt);
    this.vel.y -= GRAVITY * dt;

    const next = this.pos.clone().addScaledVector(this.vel, dt);

    // walls: push the capsule (floating STEP above the feet) out of geometry, horizontally only
    for (let iter = 0; iter < 3; iter++) {
      this.seg.start.set(next.x, next.y + STEP + RADIUS, next.z);
      this.seg.end.set(next.x, next.y + HEIGHT - RADIUS, next.z);
      this.box.makeEmpty().expandByPoint(this.seg.start).expandByPoint(this.seg.end);
      this.box.min.addScalar(-RADIUS); this.box.max.addScalar(RADIUS);
      const push = new THREE.Vector3();
      this.bvh.shapecast({
        intersectsBounds: (b) => b.intersectsBox(this.box),
        intersectsTriangle: (tri) => {
          const d = tri.closestPointToSegment(this.seg, this.v1, this.v2);
          if (d < RADIUS) {
            const dir = this.v2.sub(this.v1);
            dir.y = 0;
            const len = dir.length();
            if (len < 1e-5) return false;
            dir.divideScalar(len);
            const depth = RADIUS - d;
            this.seg.start.addScaledVector(dir, depth);
            this.seg.end.addScaledVector(dir, depth);
            push.addScaledVector(dir, depth);
          }
          return false;
        },
      });
      if (push.lengthSq() === 0) break;
      next.x += push.x; next.z += push.z;
    }

    // keep to standable ground: slide along the edge, or stop
    if (this.canStand && !this.canStand(next.x, next.z)) {
      if (this.canStand(next.x, this.pos.z)) next.z = this.pos.z;
      else if (this.canStand(this.pos.x, next.z)) next.x = this.pos.x;
      else { next.x = this.pos.x; next.z = this.pos.z; }
      this.vel.x = 0; this.vel.z = 0;
    }

    // floor
    const snap = this.onGround ? STEP + 0.1 : 0.05;
    const reach = STEP + 0.05 + snap + Math.max(0, -this.vel.y * dt);
    const floor = this.floorBelow(next.x, next.y + STEP + 0.05, next.z, reach);
    if (floor !== null && this.vel.y <= 0.01 && floor >= next.y - snap) {
      next.y = floor;
      this.vel.y = 0;
      this.onGround = true;
    } else {
      this.onGround = false;
    }
    // ceiling
    if (this.vel.y > 0) {
      this.ray.origin.set(next.x, next.y + 1, next.z); this.ray.direction.set(0, 1, 0);
      const up = this.bvh.raycastFirst(this.ray, THREE.DoubleSide);
      if (up && up.distance < HEIGHT - 1) this.vel.y = 0;
    }

    this.pos.copy(next);
    if (this.onGround) this.safe.copy(this.pos);
    if (this.pos.y < -40) this.teleport(this.safe.x, this.safe.y + 1, this.safe.z);

    const moving = Math.hypot(this.vel.x, this.vel.z);
    this.bob += moving * dt * 2.2;
    const target = this.pos.y + EYE + (this.onGround ? Math.sin(this.bob * 2) * 0.025 * Math.min(1, moving / 3) : 0);
    // smooth only upward steps, follow falls directly
    this.eyeY = target > this.eyeY ? this.eyeY + (target - this.eyeY) * Math.min(1, dt * 14) : target;
  }

  applyCamera(cam: THREE.PerspectiveCamera) {
    cam.position.set(this.pos.x, this.eyeY, this.pos.z);
    cam.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
  }
}
