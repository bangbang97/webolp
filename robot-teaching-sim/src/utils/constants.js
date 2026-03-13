// Robot dimensions (in meters, roughly based on KUKA KR6 / ABB IRB 1200)
export const ROBOT = {
  baseHeight: 0.15,
  baseRadius: 0.12,
  shoulderHeight: 0.34,
  shoulderWidth: 0.14,
  upperArmLength: 0.35,
  upperArmWidth: 0.10,
  elbowSize: 0.08,
  forearmLength: 0.30,
  forearmWidth: 0.07,
  wristLength: 0.08,
  wristRadius: 0.04,
  flangeLength: 0.06,
  flangeRadius: 0.03,
  pedestalHeight: 0.10,
  pedestalSize: 0.25,
};

// Joint limits in degrees
export const JOINT_LIMITS = [
  { min: -170, max: 170, name: 'Axis 1 (Base)', axis: 'y' },
  { min: -190, max: 45, name: 'Axis 2 (Shoulder)', axis: 'z' },
  { min: -120, max: 156, name: 'Axis 3 (Elbow)', axis: 'z' },
  { min: -185, max: 185, name: 'Axis 4 (Wrist 1)', axis: 'y' },
  { min: -120, max: 120, name: 'Axis 5 (Wrist 2)', axis: 'z' },
  { min: -350, max: 350, name: 'Axis 6 (Flange)', axis: 'y' },
];

// Default home position (degrees)
export const HOME_POSITION = [0, -90, 90, 0, 90, 0];

// Colors
export const COLORS = {
  accent: 0x00d4ff,
  accentHex: '#00d4ff',
  accentOrange: 0xff6b35,
  accentOrangeHex: '#ff6b35',
  background: 0x1a1a2e,
  backgroundHex: '#1a1a2e',
  panelBg: 'rgba(26, 26, 46, 0.85)',
  robotBase: 0x444444,
  robotArm: 0xff6b35,
  robotJoint: 0x333333,
  robotFlange: 0x666666,
  pedestal: 0x555555,
  floor: 0x2a2a3e,
  grid: 0x444466,
  ptpColor: 0x4488ff,
  ptpHex: '#4488ff',
  linColor: 0x44ff88,
  linHex: '#44ff88',
  warningRed: 0xff4444,
};

// Scene
export const SCENE = {
  floorSize: 5,
  gridDivisions: 50,
  shadowMapSize: 2048,
  cameraFov: 50,
  cameraNear: 0.01,
  cameraFar: 100,
};
