import * as THREE from 'three';

const PRESETS = {
  isometric: { pos: [1.5, 1.2, 1.5], target: [0, 0.5, 0] },
  top: { pos: [0, 3.0, 0.01], target: [0, 0, 0] },
  front: { pos: [0, 0.7, 2.5], target: [0, 0.5, 0] },
  side: { pos: [2.5, 0.7, 0], target: [0, 0.5, 0] },
};

export class CameraPresets {
  constructor(camera, controls) {
    this.camera = camera;
    this.controls = controls;
    this._tweening = false;
  }

  goTo(presetName) {
    const preset = PRESETS[presetName];
    if (!preset || this._tweening) return;

    this._tweening = true;
    const startPos = this.camera.position.clone();
    const endPos = new THREE.Vector3(...preset.pos);
    const startTarget = this.controls.target.clone();
    const endTarget = new THREE.Vector3(...preset.target);
    const duration = 600;
    const startTime = performance.now();

    const animate = () => {
      const elapsed = performance.now() - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = t * t * (3 - 2 * t);

      this.camera.position.lerpVectors(startPos, endPos, eased);
      this.controls.target.lerpVectors(startTarget, endTarget, eased);
      this.controls.update();

      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        this._tweening = false;
      }
    };
    requestAnimationFrame(animate);
  }
}
