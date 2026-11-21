import type { MoveInput } from './Player';

/** Keyboard + mouse (pointer lock or drag) + two-thumb touch controls. */
export class Input {
  keys = new Set<string>();
  lookDX = 0;
  lookDY = 0;
  touchMove = { x: 0, y: 0 };
  enabled = false;
  readonly isTouch = matchMedia('(pointer: coarse)').matches;
  private dragging = false;
  private stickId: number | null = null;
  private lookId: number | null = null;
  private stickOrigin = { x: 0, y: 0 };
  private lookLast = { x: 0, y: 0 };
  private stickEl: HTMLDivElement;
  private knobEl: HTMLDivElement;
  private cleanup: (() => void)[] = [];

  constructor(private el: HTMLElement, overlay: HTMLElement) {
    this.stickEl = document.createElement('div');
    this.stickEl.className = 'stick';
    this.knobEl = document.createElement('div');
    this.knobEl.className = 'stick-knob';
    this.stickEl.append(this.knobEl);
    overlay.append(this.stickEl);

    const on = <K extends keyof WindowEventMap>(t: EventTarget, type: K | string, fn: (e: never) => void, opts?: AddEventListenerOptions) => {
      t.addEventListener(type, fn as EventListener, opts);
      this.cleanup.push(() => t.removeEventListener(type, fn as EventListener, opts));
    };

    on(window, 'keydown', (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT' || (e.target as HTMLElement)?.tagName === 'SELECT') return;
      this.keys.add(e.code);
      if (this.enabled && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
    });
    on(window, 'keyup', (e: KeyboardEvent) => this.keys.delete(e.code));
    on(window, 'blur', () => this.keys.clear());

    on(el, 'click', () => {
      if (this.enabled && !this.isTouch && document.pointerLockElement !== el) {
        try { void (el.requestPointerLock() as unknown as Promise<void> | undefined)?.catch?.(() => {}); } catch { /* not allowed */ }
      }
    });
    on(document, 'mousemove', (e: MouseEvent) => {
      if (!this.enabled) return;
      if (document.pointerLockElement === el) { this.lookDX += e.movementX; this.lookDY += e.movementY; }
      else if (this.dragging) { this.lookDX += e.movementX * 1.4; this.lookDY += e.movementY * 1.4; }
    });
    on(el, 'pointerdown', (e: PointerEvent) => {
      if (!this.enabled) return;
      if (e.pointerType === 'touch') {
        const rect = el.getBoundingClientRect();
        const left = (e.clientX - rect.left) < rect.width * 0.45;
        if (left && this.stickId === null) {
          this.stickId = e.pointerId;
          this.stickOrigin = { x: e.clientX, y: e.clientY };
          this.stickEl.style.display = 'block';
          this.stickEl.style.left = `${e.clientX - rect.left}px`;
          this.stickEl.style.top = `${e.clientY - rect.top}px`;
          this.knobEl.style.transform = 'translate(-50%, -50%)';
        } else if (this.lookId === null) {
          this.lookId = e.pointerId;
          this.lookLast = { x: e.clientX, y: e.clientY };
        }
      } else if (document.pointerLockElement !== el) {
        this.dragging = true;
      }
    });
    on(window, 'pointermove', (e: PointerEvent) => {
      if (e.pointerId === this.stickId) {
        const dx = e.clientX - this.stickOrigin.x, dy = e.clientY - this.stickOrigin.y;
        const len = Math.min(55, Math.hypot(dx, dy));
        const a = Math.atan2(dy, dx);
        this.touchMove.x = (Math.cos(a) * len) / 55;
        this.touchMove.y = (Math.sin(a) * len) / 55;
        this.knobEl.style.transform = `translate(calc(-50% + ${Math.cos(a) * len}px), calc(-50% + ${Math.sin(a) * len}px))`;
      } else if (e.pointerId === this.lookId) {
        this.lookDX += (e.clientX - this.lookLast.x) * 2.2;
        this.lookDY += (e.clientY - this.lookLast.y) * 2.2;
        this.lookLast = { x: e.clientX, y: e.clientY };
      }
    });
    const end = (e: PointerEvent) => {
      if (e.pointerId === this.stickId) { this.stickId = null; this.touchMove = { x: 0, y: 0 }; this.stickEl.style.display = 'none'; }
      if (e.pointerId === this.lookId) this.lookId = null;
      if (e.pointerType !== 'touch') this.dragging = false;
    };
    on(window, 'pointerup', end);
    on(window, 'pointercancel', end);
  }

  get locked() { return document.pointerLockElement === this.el; }

  move(): MoveInput {
    const k = this.keys;
    let f = (k.has('KeyW') || k.has('ArrowUp') ? 1 : 0) - (k.has('KeyS') || k.has('ArrowDown') ? 1 : 0);
    let r = (k.has('KeyD') || k.has('ArrowRight') ? 1 : 0) - (k.has('KeyA') || k.has('ArrowLeft') ? 1 : 0);
    if (this.stickId !== null) { f = -this.touchMove.y; r = this.touchMove.x; }
    const run = k.has('ShiftLeft') || k.has('ShiftRight') || Math.hypot(this.touchMove.x, this.touchMove.y) > 0.95;
    return { forward: f, right: r, run };
  }

  consumeLook() { const d = { x: this.lookDX, y: this.lookDY }; this.lookDX = 0; this.lookDY = 0; return d; }

  release() { if (document.pointerLockElement === this.el) document.exitPointerLock(); }

  dispose() { this.release(); this.cleanup.forEach((f) => f()); this.stickEl.remove(); }
}
