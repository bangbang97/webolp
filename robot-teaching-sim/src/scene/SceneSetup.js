import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { COLORS, SCENE } from '../utils/constants.js';

export class SceneSetup {
  constructor(container) {
    this.container = container;

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    container.appendChild(this.renderer.domElement);

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(COLORS.background);
    this.scene.fog = new THREE.FogExp2(COLORS.background, 0.08);

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      SCENE.cameraFov,
      window.innerWidth / window.innerHeight,
      SCENE.cameraNear,
      SCENE.cameraFar
    );
    this.camera.position.set(1.5, 1.2, 1.5);

    // Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(0, 0.5, 0);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 0.5;
    this.controls.maxDistance = 8;
    this.controls.update();

    this._setupLighting();
    this._setupFloor();
    this._setupWorldAxes();

    // Resize handler
    window.addEventListener('resize', () => this._onResize());
  }

  _setupLighting() {
    // Ambient
    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambient);

    // Main directional light
    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.0);
    dirLight1.position.set(3, 5, 3);
    dirLight1.castShadow = true;
    dirLight1.shadow.mapSize.width = SCENE.shadowMapSize;
    dirLight1.shadow.mapSize.height = SCENE.shadowMapSize;
    dirLight1.shadow.camera.near = 0.1;
    dirLight1.shadow.camera.far = 20;
    dirLight1.shadow.camera.left = -3;
    dirLight1.shadow.camera.right = 3;
    dirLight1.shadow.camera.top = 3;
    dirLight1.shadow.camera.bottom = -3;
    dirLight1.shadow.bias = -0.0005;
    this.scene.add(dirLight1);

    // Fill light
    const dirLight2 = new THREE.DirectionalLight(0x8888ff, 0.3);
    dirLight2.position.set(-2, 3, -2);
    this.scene.add(dirLight2);

    // Hemisphere light for natural feel
    const hemiLight = new THREE.HemisphereLight(0x606080, 0x404040, 0.3);
    this.scene.add(hemiLight);
  }

  _setupFloor() {
    // Floor plane
    const floorGeo = new THREE.PlaneGeometry(SCENE.floorSize, SCENE.floorSize);
    const floorMat = new THREE.MeshStandardMaterial({
      color: COLORS.floor,
      roughness: 0.8,
      metalness: 0.2,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Grid helper
    const grid = new THREE.GridHelper(SCENE.floorSize, SCENE.gridDivisions, COLORS.grid, COLORS.grid);
    grid.position.y = 0.001;
    grid.material.opacity = 0.3;
    grid.material.transparent = true;
    this.scene.add(grid);
    this.grid = grid;
  }

  _setupWorldAxes() {
    // Small axes helper in corner (rendered in scene at origin)
    const axesHelper = new THREE.AxesHelper(0.15);
    axesHelper.position.set(-SCENE.floorSize / 2 + 0.2, 0.01, SCENE.floorSize / 2 - 0.2);
    this.scene.add(axesHelper);
  }

  _onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  update() {
    this.controls.update();
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}
