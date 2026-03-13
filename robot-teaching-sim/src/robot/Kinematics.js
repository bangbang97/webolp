import * as THREE from 'three';
import { JOINT_LIMITS } from '../utils/constants.js';
import { deg2rad, rad2deg, clamp, getTCPWorldTransform } from '../utils/math.js';

// Forward Kinematics - computed automatically by Three.js scene graph
// Just read the TCP world position after setting joint angles
export function computeFK(robotModel) {
  // Force world matrix update
  robotModel.group.updateMatrixWorld(true);
  return getTCPWorldTransform(robotModel.tcp);
}

// Inverse Kinematics using CCD (Cyclic Coordinate Descent)
// Iteratively adjusts joints to reach a target TCP position
export function computeIK(robotModel, targetPos, maxIterations = 20, tolerance = 0.005) {
  const target = new THREE.Vector3(targetPos.x, targetPos.y, targetPos.z);
  const axes = ['y', 'z', 'z', 'y', 'z', 'y'];
  const currentAngles = robotModel.getJointAngles();

  for (let iter = 0; iter < maxIterations; iter++) {
    robotModel.group.updateMatrixWorld(true);

    const tcpWorld = new THREE.Vector3();
    robotModel.tcp.getWorldPosition(tcpWorld);
    const dist = tcpWorld.distanceTo(target);
    if (dist < tolerance) {
      return { success: true, angles: robotModel.getJointAngles(), distance: dist };
    }

    // Iterate joints from tip to base (5 down to 0)
    for (let i = 5; i >= 0; i--) {
      const joint = robotModel.joints[i];
      const axis = axes[i];

      // Get joint world position
      const jointWorldPos = new THREE.Vector3();
      joint.getWorldPosition(jointWorldPos);

      // Get current TCP position
      robotModel.group.updateMatrixWorld(true);
      robotModel.tcp.getWorldPosition(tcpWorld);

      // Get joint rotation axis in world space
      const axisVec = new THREE.Vector3();
      if (axis === 'x') axisVec.set(1, 0, 0);
      else if (axis === 'y') axisVec.set(0, 1, 0);
      else axisVec.set(0, 0, 1);

      // Transform axis to world space
      const jointWorldQuat = new THREE.Quaternion();
      joint.parent.getWorldQuaternion(jointWorldQuat);
      axisVec.applyQuaternion(jointWorldQuat);

      // Project vectors onto the plane perpendicular to the rotation axis
      const toTCP = new THREE.Vector3().subVectors(tcpWorld, jointWorldPos);
      const toTarget = new THREE.Vector3().subVectors(target, jointWorldPos);

      // Remove axis component
      const tcpProj = toTCP.clone().sub(axisVec.clone().multiplyScalar(toTCP.dot(axisVec)));
      const targetProj = toTarget.clone().sub(axisVec.clone().multiplyScalar(toTarget.dot(axisVec)));

      if (tcpProj.length() < 0.001 || targetProj.length() < 0.001) continue;

      tcpProj.normalize();
      targetProj.normalize();

      // Angle between projections
      let angle = Math.acos(clamp(tcpProj.dot(targetProj), -1, 1));
      const cross = new THREE.Vector3().crossVectors(tcpProj, targetProj);
      if (cross.dot(axisVec) < 0) angle = -angle;

      // Limit step size for stability
      angle = clamp(angle, -deg2rad(10), deg2rad(10));

      // Apply angle change
      const currentAngleDeg = rad2deg(joint.rotation[axis]);
      const newAngleDeg = clamp(
        currentAngleDeg + rad2deg(angle),
        JOINT_LIMITS[i].min,
        JOINT_LIMITS[i].max
      );

      joint.rotation[axis] = deg2rad(newAngleDeg);
    }
  }

  robotModel.group.updateMatrixWorld(true);
  const finalTCP = new THREE.Vector3();
  robotModel.tcp.getWorldPosition(finalTCP);
  const finalDist = finalTCP.distanceTo(target);

  return {
    success: finalDist < tolerance * 3,
    angles: robotModel.getJointAngles(),
    distance: finalDist,
  };
}
