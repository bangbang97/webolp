import { JOINT_LIMITS, HOME_POSITION } from '../utils/constants.js';
import { clamp, lerp } from '../utils/math.js';
import { computeFK, computeIK } from './Kinematics.js';

export class RobotController {
  constructor(robotModel) {
    this.model = robotModel;
    this.currentAngles = [...HOME_POSITION];
    this.targetAngles = [...HOME_POSITION];
    this.isAnimating = false;
    this.animationSpeed = 1.0;
    this.onUpdate = null; // callback when angles change

    // Apply initial home position
    this.model.setJointAngles(this.currentAngles);
  }

  setJointAngle(index, angleDeg) {
    const limit = JOINT_LIMITS[index];
    this.currentAngles[index] = clamp(angleDeg, limit.min, limit.max);
    this.targetAngles[index] = this.currentAngles[index];
    this.model.setJointAngles(this.currentAngles);
    if (this.onUpdate) this.onUpdate(this.currentAngles, this.getTCPInfo());
  }

  setAllAngles(angles) {
    for (let i = 0; i < 6; i++) {
      const limit = JOINT_LIMITS[i];
      this.currentAngles[i] = clamp(angles[i], limit.min, limit.max);
    }
    this.targetAngles = [...this.currentAngles];
    this.model.setJointAngles(this.currentAngles);
    if (this.onUpdate) this.onUpdate(this.currentAngles, this.getTCPInfo());
  }

  nudgeJoint(index, deltaDeg) {
    this.setJointAngle(index, this.currentAngles[index] + deltaDeg);
  }

  goHome() {
    this.setAllAngles([...HOME_POSITION]);
  }

  getTCPInfo() {
    return computeFK(this.model);
  }

  moveToTCPPosition(x, y, z) {
    const result = computeIK(this.model, { x, y, z });
    if (result.success) {
      this.currentAngles = [...result.angles];
      this.targetAngles = [...result.angles];
      if (this.onUpdate) this.onUpdate(this.currentAngles, this.getTCPInfo());
    }
    return result;
  }

  // Animate from current angles to target angles over time
  // Returns a promise that resolves when animation is complete
  animateTo(targetAngles, durationMs = 1000, speedMultiplier = 1.0) {
    return new Promise((resolve) => {
      const startAngles = [...this.currentAngles];
      const startTime = performance.now();
      const duration = durationMs / speedMultiplier;

      const animate = () => {
        const elapsed = performance.now() - startTime;
        const t = Math.min(elapsed / duration, 1.0);
        // Smooth step easing
        const eased = t * t * (3 - 2 * t);

        for (let i = 0; i < 6; i++) {
          this.currentAngles[i] = lerp(startAngles[i], targetAngles[i], eased);
        }
        this.model.setJointAngles(this.currentAngles);
        if (this.onUpdate) this.onUpdate(this.currentAngles, this.getTCPInfo());

        if (t < 1.0) {
          requestAnimationFrame(animate);
        } else {
          this.currentAngles = [...targetAngles];
          this.model.setJointAngles(this.currentAngles);
          if (this.onUpdate) this.onUpdate(this.currentAngles, this.getTCPInfo());
          resolve();
        }
      };

      requestAnimationFrame(animate);
    });
  }

  // Animate linearly in cartesian space (for LIN movement)
  animateLinear(targetAngles, durationMs = 1000, speedMultiplier = 1.0) {
    // For LIN, we interpolate the TCP position and use IK at each step
    // First get start and end TCP positions
    const startAngles = [...this.currentAngles];
    const startTCP = this.getTCPInfo();

    // Temporarily set target to get end TCP
    this.model.setJointAngles(targetAngles);
    const endTCP = this.getTCPInfo();
    // Restore
    this.model.setJointAngles(startAngles);

    return new Promise((resolve) => {
      const startTime = performance.now();
      const duration = durationMs / speedMultiplier;

      const animate = () => {
        const elapsed = performance.now() - startTime;
        const t = Math.min(elapsed / duration, 1.0);
        const eased = t * t * (3 - 2 * t);

        // Interpolate TCP position
        const x = lerp(startTCP.position.x, endTCP.position.x, eased);
        const y = lerp(startTCP.position.y, endTCP.position.y, eased);
        const z = lerp(startTCP.position.z, endTCP.position.z, eased);

        // Use IK to solve
        const result = computeIK(this.model, { x, y, z });
        if (result.success) {
          this.currentAngles = [...result.angles];
        } else {
          // Fallback to joint interpolation
          for (let i = 0; i < 6; i++) {
            this.currentAngles[i] = lerp(startAngles[i], targetAngles[i], eased);
          }
          this.model.setJointAngles(this.currentAngles);
        }

        if (this.onUpdate) this.onUpdate(this.currentAngles, this.getTCPInfo());

        if (t < 1.0) {
          requestAnimationFrame(animate);
        } else {
          this.currentAngles = [...targetAngles];
          this.model.setJointAngles(this.currentAngles);
          if (this.onUpdate) this.onUpdate(this.currentAngles, this.getTCPInfo());
          resolve();
        }
      };

      requestAnimationFrame(animate);
    });
  }
}
