import * as THREE from 'three';
import { ROBOT, COLORS, JOINT_LIMITS } from '../utils/constants.js';
import { deg2rad } from '../utils/math.js';

export class RobotModel {
  constructor() {
    this.group = new THREE.Group();
    this.joints = []; // Array of joint groups (6 joints)
    this.segments = []; // Visual meshes for collision coloring
    this.tcp = null; // Tool Center Point reference
    this.tcpAxesHelper = null;

    this._buildGeometry();
  }

  _createMaterial(color) {
    return new THREE.MeshStandardMaterial({
      color,
      roughness: 0.4,
      metalness: 0.6,
    });
  }

  _buildGeometry() {
    const R = ROBOT;

    // Pedestal
    const pedestalGeo = new THREE.BoxGeometry(R.pedestalSize, R.pedestalHeight, R.pedestalSize);
    const pedestalMat = this._createMaterial(COLORS.pedestal);
    const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
    pedestal.position.y = R.pedestalHeight / 2;
    pedestal.castShadow = true;
    pedestal.receiveShadow = true;
    this.group.add(pedestal);

    // Joint 1 - Base rotation (Y axis)
    const joint1 = new THREE.Group();
    joint1.position.y = R.pedestalHeight;

    const baseGeo = new THREE.CylinderGeometry(R.baseRadius, R.baseRadius * 1.1, R.baseHeight, 32);
    const baseMesh = new THREE.Mesh(baseGeo, this._createMaterial(COLORS.robotBase));
    baseMesh.position.y = R.baseHeight / 2;
    baseMesh.castShadow = true;
    joint1.add(baseMesh);
    this.segments.push(baseMesh);

    this.group.add(joint1);
    this.joints.push(joint1);

    // Joint 2 - Shoulder (Z axis)
    const joint2 = new THREE.Group();
    joint2.position.y = R.baseHeight + R.shoulderHeight * 0.1;

    // Shoulder housing
    const shoulderGeo = new THREE.BoxGeometry(R.shoulderWidth, R.shoulderHeight, R.shoulderWidth);
    const shoulderMesh = new THREE.Mesh(shoulderGeo, this._createMaterial(COLORS.robotArm));
    shoulderMesh.position.y = R.shoulderHeight / 2;
    shoulderMesh.castShadow = true;
    joint2.add(shoulderMesh);
    this.segments.push(shoulderMesh);

    // Shoulder joint sphere
    const shoulderJointGeo = new THREE.SphereGeometry(R.shoulderWidth * 0.45, 16, 16);
    const shoulderJoint = new THREE.Mesh(shoulderJointGeo, this._createMaterial(COLORS.robotJoint));
    shoulderJoint.position.y = R.shoulderHeight;
    shoulderJoint.castShadow = true;
    joint2.add(shoulderJoint);

    joint1.add(joint2);
    this.joints.push(joint2);

    // Joint 3 - Upper arm / Elbow (Z axis)
    const joint3 = new THREE.Group();
    joint3.position.y = R.shoulderHeight;

    const upperArmGeo = new THREE.BoxGeometry(R.upperArmWidth, R.upperArmLength, R.upperArmWidth);
    const upperArmMesh = new THREE.Mesh(upperArmGeo, this._createMaterial(COLORS.robotArm));
    upperArmMesh.position.y = R.upperArmLength / 2;
    upperArmMesh.castShadow = true;
    joint3.add(upperArmMesh);
    this.segments.push(upperArmMesh);

    // Elbow joint sphere
    const elbowJointGeo = new THREE.SphereGeometry(R.elbowSize * 0.6, 16, 16);
    const elbowJoint = new THREE.Mesh(elbowJointGeo, this._createMaterial(COLORS.robotJoint));
    elbowJoint.position.y = R.upperArmLength;
    elbowJoint.castShadow = true;
    joint3.add(elbowJoint);

    joint2.add(joint3);
    this.joints.push(joint3);

    // Joint 4 - Forearm rotation (Y axis)
    const joint4 = new THREE.Group();
    joint4.position.y = R.upperArmLength;

    const forearmGeo = new THREE.BoxGeometry(R.forearmWidth, R.forearmLength, R.forearmWidth);
    const forearmMesh = new THREE.Mesh(forearmGeo, this._createMaterial(COLORS.robotArm));
    forearmMesh.position.y = R.forearmLength / 2;
    forearmMesh.castShadow = true;
    joint4.add(forearmMesh);
    this.segments.push(forearmMesh);

    joint3.add(joint4);
    this.joints.push(joint4);

    // Joint 5 - Wrist bend (Z axis)
    const joint5 = new THREE.Group();
    joint5.position.y = R.forearmLength;

    const wristGeo = new THREE.CylinderGeometry(R.wristRadius, R.wristRadius, R.wristLength, 16);
    const wristMesh = new THREE.Mesh(wristGeo, this._createMaterial(COLORS.robotJoint));
    wristMesh.position.y = R.wristLength / 2;
    wristMesh.castShadow = true;
    joint5.add(wristMesh);
    this.segments.push(wristMesh);

    joint4.add(joint5);
    this.joints.push(joint5);

    // Joint 6 - Flange rotation (Y axis)
    const joint6 = new THREE.Group();
    joint6.position.y = R.wristLength;

    const flangeGeo = new THREE.CylinderGeometry(R.flangeRadius, R.flangeRadius * 1.2, R.flangeLength, 16);
    const flangeMesh = new THREE.Mesh(flangeGeo, this._createMaterial(COLORS.robotFlange));
    flangeMesh.position.y = R.flangeLength / 2;
    flangeMesh.castShadow = true;
    joint6.add(flangeMesh);
    this.segments.push(flangeMesh);

    // TCP point
    this.tcp = new THREE.Group();
    this.tcp.position.y = R.flangeLength;

    // TCP axes helper
    this.tcpAxesHelper = new THREE.AxesHelper(0.1);
    this.tcp.add(this.tcpAxesHelper);

    // Small TCP sphere
    const tcpGeo = new THREE.SphereGeometry(0.015, 8, 8);
    const tcpMat = new THREE.MeshBasicMaterial({ color: COLORS.accent });
    const tcpMesh = new THREE.Mesh(tcpGeo, tcpMat);
    this.tcp.add(tcpMesh);

    joint6.add(this.tcp);
    joint5.add(joint6);
    this.joints.push(joint6);
  }

  // Set joint angles in degrees
  setJointAngles(angles) {
    const axes = ['y', 'z', 'z', 'y', 'z', 'y'];
    for (let i = 0; i < 6; i++) {
      const joint = this.joints[i];
      const limit = JOINT_LIMITS[i];
      const clamped = Math.max(limit.min, Math.min(limit.max, angles[i]));
      // Reset rotation
      joint.rotation.set(0, 0, 0);
      // Apply rotation on the correct axis
      joint.rotation[axes[i]] = deg2rad(clamped);
    }
  }

  // Get current joint angles in degrees
  getJointAngles() {
    const axes = ['y', 'z', 'z', 'y', 'z', 'y'];
    return this.joints.map((joint, i) => {
      return THREE.MathUtils.radToDeg(joint.rotation[axes[i]]);
    });
  }

  getObject() {
    return this.group;
  }
}
