import * as THREE from 'three';
import './styles/main.css';
import { SceneSetup } from './scene/SceneSetup.js';
import { CameraPresets } from './scene/CameraPresets.js';
import { RobotModel } from './robot/RobotModel.js';
import { RobotController } from './robot/RobotController.js';
import { Program } from './teaching/Program.js';
import { createWaypoint } from './teaching/Waypoint.js';
import { Player } from './teaching/Player.js';
import { AxisSliders } from './ui/AxisSliders.js';
import { WaypointList } from './ui/WaypointList.js';
import { PlaybackControls } from './ui/PlaybackControls.js';
import { StatusBar } from './ui/StatusBar.js';
import { ImportExport } from './ui/ImportExport.js';
import { COLORS } from './utils/constants.js';

// ─── Globals ───
let sceneSetup, cameraPresets, robot, controller, program, player;
let axisSliders, waypointList, playbackControls, statusBar;
let waypointMarkers = [];
let waypointLines = null;
let trailPoints = [];
let trailLine = null;
let trailEnabled = false;
let selectedAxis = 0;
let selectedMoveType = 'PTP';

// ─── Init ───
function init() {
  const canvasContainer = document.getElementById('canvas-container');

  // Scene
  sceneSetup = new SceneSetup(canvasContainer);
  cameraPresets = new CameraPresets(sceneSetup.camera, sceneSetup.controls);

  // Robot
  robot = new RobotModel();
  sceneSetup.scene.add(robot.getObject());

  // Controller
  controller = new RobotController(robot);

  // Program
  program = new Program();
  program.name = 'Teaching Program';

  // Player
  player = new Player(program, controller);

  // ─── UI Setup ───
  setupUI();

  // Connect updates
  controller.onUpdate = (angles, tcpInfo) => {
    axisSliders.updateDisplay(angles);
    statusBar.update(angles, tcpInfo);
    updateTrail(tcpInfo);
  };

  program.onChange = (waypoints) => {
    waypointList.render(waypoints, player.currentIndex);
    updateWaypointMarkers();
  };

  player.onStateChange = (info) => {
    playbackControls.updateState(info);
    waypointList.render(program.waypoints, info.currentIndex);
  };

  player.onProgress = (progress) => {
    playbackControls.updateProgress(progress);
  };

  // Initial display update
  const tcpInfo = controller.getTCPInfo();
  statusBar.update(controller.currentAngles, tcpInfo);
  axisSliders.updateDisplay(controller.currentAngles);

  // Keyboard shortcuts
  setupKeyboard();

  // Animation loop
  animate();
}

// ─── UI Construction ───
function setupUI() {
  // Header camera buttons
  const headerBtns = document.getElementById('header-buttons');
  const presets = [
    { label: 'ISO', preset: 'isometric' },
    { label: 'TOP', preset: 'top' },
    { label: 'FRONT', preset: 'front' },
    { label: 'SIDE', preset: 'side' },
  ];
  presets.forEach(p => {
    const btn = document.createElement('button');
    btn.className = 'cam-btn';
    btn.textContent = p.label;
    btn.addEventListener('click', () => cameraPresets.goTo(p.preset));
    headerBtns.appendChild(btn);
  });

  // Trail toggle
  const trailBtn = document.createElement('button');
  trailBtn.className = 'cam-btn';
  trailBtn.textContent = 'TRAIL';
  trailBtn.addEventListener('click', () => {
    trailEnabled = !trailEnabled;
    trailBtn.style.color = trailEnabled ? COLORS.accentHex : '#aaa';
    if (!trailEnabled) clearTrail();
  });
  headerBtns.appendChild(trailBtn);

  // Left panel: Axis sliders
  const leftPanel = document.getElementById('panel-left');
  axisSliders = new AxisSliders(leftPanel, controller);

  // Right panel: Teach button, waypoint list, playback, import/export
  const rightPanel = document.getElementById('panel-right');

  // Move type selector + Teach button row
  const teachRow = document.createElement('div');
  teachRow.className = 'flex gap-2 mb-3';

  // PTP/LIN toggle
  const moveTypeToggle = document.createElement('div');
  moveTypeToggle.className = 'flex rounded overflow-hidden border border-gray-600';

  const ptpBtn = document.createElement('button');
  ptpBtn.className = 'move-type-btn move-type-active-ptp';
  ptpBtn.textContent = 'PTP';
  ptpBtn.title = 'Point-to-Point (Joint interpolation)';

  const linBtn = document.createElement('button');
  linBtn.className = 'move-type-btn';
  linBtn.textContent = 'LIN';
  linBtn.title = 'Linear (Cartesian interpolation)';

  function updateMoveTypeUI() {
    if (selectedMoveType === 'PTP') {
      ptpBtn.className = 'move-type-btn move-type-active-ptp';
      linBtn.className = 'move-type-btn';
    } else {
      ptpBtn.className = 'move-type-btn';
      linBtn.className = 'move-type-btn move-type-active-lin';
    }
  }

  ptpBtn.addEventListener('click', () => { selectedMoveType = 'PTP'; updateMoveTypeUI(); });
  linBtn.addEventListener('click', () => { selectedMoveType = 'LIN'; updateMoveTypeUI(); });

  moveTypeToggle.appendChild(ptpBtn);
  moveTypeToggle.appendChild(linBtn);
  teachRow.appendChild(moveTypeToggle);

  // Teach Point button
  const teachBtn = document.createElement('button');
  teachBtn.className = 'teach-btn flex-1';
  teachBtn.textContent = 'TEACH POINT (T)';
  teachBtn.addEventListener('click', () => teachCurrentPoint());
  teachRow.appendChild(teachBtn);

  rightPanel.appendChild(teachRow);

  // Waypoint list
  waypointList = new WaypointList(rightPanel, program, player);
  waypointList.onGoToWaypoint = (idx) => player.goToWaypoint(idx);

  // Playback controls
  playbackControls = new PlaybackControls(rightPanel, player);

  // Import/Export
  new ImportExport(rightPanel, program);

  // Status bar
  const statusBarEl = document.getElementById('status-bar');
  statusBar = new StatusBar(statusBarEl);
}

// ─── Teaching ───
function teachCurrentPoint() {
  const angles = [...controller.currentAngles];
  const tcpInfo = controller.getTCPInfo();
  const wp = createWaypoint(angles, tcpInfo, { moveType: selectedMoveType });
  program.addWaypoint(wp);
}

// ─── 3D Waypoint Markers ───
function updateWaypointMarkers() {
  // Remove old markers
  waypointMarkers.forEach(m => sceneSetup.scene.remove(m));
  waypointMarkers = [];
  if (waypointLines) {
    sceneSetup.scene.remove(waypointLines);
    waypointLines = null;
  }

  if (program.waypoints.length === 0) return;

  const points = [];

  program.waypoints.forEach((wp, idx) => {
    const pos = new THREE.Vector3(wp.tcp.x, wp.tcp.y, wp.tcp.z);
    points.push(pos);

    // Marker sphere
    const color = wp.moveType === 'LIN' ? COLORS.linColor : COLORS.ptpColor;
    const geo = new THREE.SphereGeometry(0.02, 8, 8);
    const mat = new THREE.MeshBasicMaterial({ color });
    const sphere = new THREE.Mesh(geo, mat);
    sphere.position.copy(pos);
    sceneSetup.scene.add(sphere);
    waypointMarkers.push(sphere);

    // Label sprite
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = wp.moveType === 'LIN' ? COLORS.linHex : COLORS.ptpHex;
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(wp.id, 32, 22);
    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.position.copy(pos);
    sprite.position.y += 0.04;
    sprite.scale.set(0.08, 0.04, 1);
    sceneSetup.scene.add(sprite);
    waypointMarkers.push(sprite);
  });

  // Connection lines - color-coded per segment (PTP=blue, LIN=green)
  if (points.length >= 2) {
    waypointLines = new THREE.Group();
    for (let i = 1; i < program.waypoints.length; i++) {
      const wp = program.waypoints[i];
      const segColor = wp.moveType === 'LIN' ? COLORS.linColor : COLORS.ptpColor;
      const segGeo = new THREE.BufferGeometry().setFromPoints([points[i - 1], points[i]]);
      const segMat = new THREE.LineDashedMaterial({
        color: segColor,
        dashSize: 0.03,
        gapSize: 0.02,
      });
      const seg = new THREE.Line(segGeo, segMat);
      seg.computeLineDistances();
      waypointLines.add(seg);
    }
    sceneSetup.scene.add(waypointLines);
  }
}

// ─── Trail ───
function updateTrail(tcpInfo) {
  if (!trailEnabled || !tcpInfo) return;

  const p = tcpInfo.position;
  trailPoints.push(new THREE.Vector3(p.x, p.y, p.z));

  // Limit trail length
  if (trailPoints.length > 5000) trailPoints.shift();

  // Update trail line
  if (trailLine) sceneSetup.scene.remove(trailLine);

  if (trailPoints.length >= 2) {
    const geo = new THREE.BufferGeometry().setFromPoints(trailPoints);
    const mat = new THREE.LineBasicMaterial({ color: COLORS.accent, opacity: 0.6, transparent: true });
    trailLine = new THREE.Line(geo, mat);
    sceneSetup.scene.add(trailLine);
  }
}

function clearTrail() {
  trailPoints = [];
  if (trailLine) {
    sceneSetup.scene.remove(trailLine);
    trailLine = null;
  }
}

// ─── Keyboard ───
function setupKeyboard() {
  window.addEventListener('keydown', (e) => {
    // Ignore if typing in input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    switch (e.key) {
      case '1': case '2': case '3': case '4': case '5': case '6':
        selectedAxis = parseInt(e.key) - 1;
        break;
      case '+': case '=':
        controller.nudgeJoint(selectedAxis, 1);
        axisSliders.updateDisplay(controller.currentAngles);
        break;
      case '-': case '_':
        controller.nudgeJoint(selectedAxis, -1);
        axisSliders.updateDisplay(controller.currentAngles);
        break;
      case 't': case 'T':
        teachCurrentPoint();
        break;
      case ' ':
        e.preventDefault();
        if (player.state === 'playing') player.pause();
        else player.play();
        break;
      case 'r': case 'R':
        controller.goHome();
        axisSliders.updateDisplay(controller.currentAngles);
        break;
      case 'Escape':
        player.stop();
        break;
    }
  });
}

// ─── Animation Loop ───
function animate() {
  requestAnimationFrame(animate);
  sceneSetup.update();
  sceneSetup.render();

  // Update status bar FPS
  const tcpInfo = controller.getTCPInfo();
  statusBar.update(controller.currentAngles, tcpInfo);
}

// ─── Start ───
init();
