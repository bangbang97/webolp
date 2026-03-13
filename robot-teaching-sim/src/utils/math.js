import * as THREE from 'three';

export function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

export function rad2deg(rad) {
  return rad * (180 / Math.PI);
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function lerpAngle(a, b, t) {
  return lerp(a, b, t);
}

// Smooth step for easing animations
export function smoothstep(t) {
  return t * t * (3 - 2 * t);
}

// Get TCP world position and quaternion from the robot's flange
export function getTCPWorldTransform(flangeObject) {
  const position = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  flangeObject.getWorldPosition(position);
  flangeObject.getWorldQuaternion(quaternion);
  const euler = new THREE.Euler().setFromQuaternion(quaternion, 'XYZ');
  return {
    position: { x: position.x, y: position.y, z: position.z },
    rotation: {
      rx: rad2deg(euler.x),
      ry: rad2deg(euler.y),
      rz: rad2deg(euler.z),
    },
  };
}
