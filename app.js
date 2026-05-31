import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// --- State Management ---
const state = {
  activePreset: 'modern-grey',
  timeOfDay: 'noon',
  colors: {
    leftWall: '#d39c82',
    frontFacade: '#d39c82',
    rightWall: '#d39c82',
    backWall: '#d39c82',
    balconies: '#ffffff',
    dividers: '#d0d0d0',
    awnings: '#1b6e4e',
    railings: '#3a3a3a',
    frames: '#ffffff',
    roof: '#d0d0d0',
    roofFixtures: '#ffffff',
    glass: '#8ab4f8'
  }
};

const presets = {
  'classic-peach': {
    leftWall: '#d39c82', // peach stucco
    frontFacade: '#d39c82',
    rightWall: '#d39c82',
    backWall: '#d39c82',
    balconies: '#ffffff', // white stucco balconies
    dividers: '#ffffff',
    awnings: '#1b6e4e', // green awnings
    railings: '#3a3a3a',
    frames: '#ffffff', // white window frames
    roof: '#ffffff',
    roofFixtures: '#ffffff',
    glass: '#8ab4f8'
  },
  'modern-grey': {
    leftWall: '#e5e5e5',
    frontFacade: '#e0e0e0',
    rightWall: '#e5e5e5',
    backWall: '#e5e5e5',
    balconies: '#d0d0d0',
    dividers: '#d0d0d0',
    awnings: '#616161',
    railings: '#3a3a3a',
    frames: '#2a2a2a',
    roof: '#d0d0d0',
    roofFixtures: '#ffffff',
    glass: '#8ab4f8'
  },
  'nordic-wood': {
    leftWall: '#1e2022', // slate/basalt black
    frontFacade: '#f2efe9', // chalk white
    rightWall: '#1e2022',
    backWall: '#1e2022',
    balconies: '#dedcd8', // concrete/sandstone grey
    dividers: '#1e2022',
    awnings: '#2d3134', // slate grey canvas
    railings: '#1a1a1a', // matte black
    frames: '#b08863', // oak wood
    roof: '#dedcd8',
    roofFixtures: '#dedcd8',
    glass: '#5a6f80'
  },
  'terracotta': {
    leftWall: '#ded7c9', // sand
    frontFacade: '#e9dfcf',
    rightWall: '#ded7c9',
    backWall: '#ded7c9',
    balconies: '#b85a3a', // terracotta
    dividers: '#b85a3a',
    awnings: '#8c3a27',
    railings: '#4a4740',
    frames: '#4a4740',
    roof: '#ded7c9',
    roofFixtures: '#ffffff',
    glass: '#8ab4f8'
  },
  'estelada': {
    leftWall: '#fcd116',
    frontFacade: '#fcd116',
    rightWall: '#fcd116',
    backWall: '#fcd116',
    balconies: '#da121a',
    dividers: '#da121a',
    awnings: '#da121a',
    railings: '#0055a5',
    frames: '#ffffff',
    roof: '#fcd116',
    roofFixtures: '#ffffff',
    glass: '#8ab4f8'
  }
};

// --- Three.js Globals ---
let scene, camera, renderer, controls;
let sunLight, hemiLight, ambientLight, streetLampLight;
let materials = {};
let buildingGroup;

// --- DOM Elements ---
const loadingOverlay = document.getElementById('loading-overlay');
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const presetCards = document.querySelectorAll('.preset-card');
const timeButtons = document.querySelectorAll('.time-btn');
const screenshotBtn = document.getElementById('btn-screenshot');

// Color Picker Inputs
const colorInputs = {
  leftWall: document.getElementById('color-left-wall'),
  frontFacade: document.getElementById('color-front-facade'),
  rightWall: document.getElementById('color-right-wall'),
  backWall: document.getElementById('color-back-wall'),
  balconies: document.getElementById('color-balconies'),
  dividers: document.getElementById('color-dividers'),
  awnings: document.getElementById('color-awnings'),
  railings: document.getElementById('color-railings'),
  frames: document.getElementById('color-frames'),
  roof: document.getElementById('color-roof'),
  roofFixtures: document.getElementById('color-roof-fixtures'),
  glass: document.getElementById('color-glass')
};

const colorLabels = {
  leftWall: document.getElementById('val-left-wall'),
  frontFacade: document.getElementById('val-front-facade'),
  rightWall: document.getElementById('val-right-wall'),
  backWall: document.getElementById('val-back-wall'),
  balconies: document.getElementById('val-balconies'),
  dividers: document.getElementById('val-dividers'),
  awnings: document.getElementById('val-awnings'),
  railings: document.getElementById('val-railings'),
  frames: document.getElementById('val-frames'),
  roof: document.getElementById('val-roof'),
  roofFixtures: document.getElementById('val-roof-fixtures'),
  glass: document.getElementById('val-glass')
};

// --- Initialization ---
function init() {
  scene = new THREE.Scene();
  
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 6, 26); 

  const canvas = document.getElementById('webgl-canvas');
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.maxPolarAngle = Math.PI / 2 - 0.05;
  controls.minDistance = 5;
  controls.maxDistance = 60;
  controls.target.set(0, 5, 0);

  initMaterials();
  buildScene();
  setupLighting();
  setupEventListeners();

  applyPreset(state.activePreset);
  updateLightingMode(state.timeOfDay);

  // Set default language from select or browser preference
  const selectLanguage = document.getElementById('select-language');
  if (selectLanguage) {
    const browserLang = navigator.language.slice(0, 2);
    if (translations[browserLang]) {
      selectLanguage.value = browserLang;
    }
    setLanguage(selectLanguage.value);
  }

  animate();

  setTimeout(() => {
    loadingOverlay.classList.add('fade-out');
  }, 1000);
}

// --- Procedural Sky Environment Map for Photorealistic Glass ---
let glassEnvMap = null;

function createReflectiveEnvMap(time) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  
  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  if (time === 'noon') {
    grad.addColorStop(0, '#5894f6'); // Rich sky blue
    grad.addColorStop(0.3, '#8ab4f8'); // Classic light blue
    grad.addColorStop(0.5, '#eef5fc'); // Horizon highlight
    grad.addColorStop(0.55, '#c5b497'); // Warm ground blend
    grad.addColorStop(0.8, '#475b8a'); // Soft grass/ground color reflection
    grad.addColorStop(1, '#1e2436');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 256);
    
    // Draw white clouds for reflection contrast
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.beginPath();
    ctx.arc(100, 60, 25, 0, Math.PI * 2);
    ctx.arc(130, 55, 35, 0, Math.PI * 2);
    ctx.arc(160, 60, 25, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(360, 80, 30, 0, Math.PI * 2);
    ctx.arc(390, 75, 40, 0, Math.PI * 2);
    ctx.fill();
    
    // Sun glow disk
    const sunGrad = ctx.createRadialGradient(256, 40, 2, 256, 40, 35);
    sunGrad.addColorStop(0, 'rgba(255, 255, 240, 1.0)');
    sunGrad.addColorStop(0.2, 'rgba(255, 255, 220, 0.8)');
    sunGrad.addColorStop(1, 'rgba(255, 255, 255, 0.0)');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(256, 40, 35, 0, Math.PI * 2);
    ctx.fill();
    
  } else if (time === 'sunset') {
    grad.addColorStop(0, '#4b1e61'); // Sunset violet
    grad.addColorStop(0.25, '#9c3d84'); // Magenta
    grad.addColorStop(0.45, '#fd7438'); // Deep orange
    grad.addColorStop(0.52, '#ffea85'); // Bright golden horizon
    grad.addColorStop(0.6, '#3a1a0d'); // Dark reddish ground
    grad.addColorStop(1, '#1a0904');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 256);
    
    // Soft wispy sunset clouds
    ctx.fillStyle = 'rgba(253, 148, 90, 0.5)';
    ctx.beginPath();
    ctx.ellipse(150, 70, 70, 15, 0, 0, Math.PI * 2);
    ctx.ellipse(320, 90, 90, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Sunset sun disk
    const sunGrad = ctx.createRadialGradient(220, 110, 5, 220, 110, 45);
    sunGrad.addColorStop(0, 'rgba(255, 220, 120, 1.0)');
    sunGrad.addColorStop(0.3, 'rgba(253, 116, 56, 0.7)');
    sunGrad.addColorStop(1, 'rgba(253, 116, 56, 0.0)');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(220, 110, 45, 0, Math.PI * 2);
    ctx.fill();
    
  } else if (time === 'night') {
    grad.addColorStop(0, '#020306');
    grad.addColorStop(0.4, '#070a14'); // Dark indigo horizon
    grad.addColorStop(0.5, '#141829'); // Sky base
    grad.addColorStop(0.6, '#030408'); // Pure dark ground
    grad.addColorStop(1, '#010204');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 256);
    
    // Star field
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    for (let i = 0; i < 60; i++) {
      const rx = Math.random() * 512;
      const ry = Math.random() * 115;
      const rSize = Math.random() * 1.2 + 0.3;
      ctx.beginPath();
      ctx.arc(rx, ry, rSize, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Moon reflection highlight
    const moonGrad = ctx.createRadialGradient(400, 50, 2, 400, 50, 25);
    moonGrad.addColorStop(0, 'rgba(230, 240, 255, 1.0)');
    moonGrad.addColorStop(0.4, 'rgba(200, 220, 255, 0.4)');
    moonGrad.addColorStop(1, 'rgba(200, 220, 255, 0.0)');
    ctx.fillStyle = moonGrad;
    ctx.beginPath();
    ctx.arc(400, 50, 25, 0, Math.PI * 2);
    ctx.fill();
  }
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  return texture;
}

function updateGlassEnvironment(time) {
  if (glassEnvMap) {
    glassEnvMap.dispose();
  }
  glassEnvMap = createReflectiveEnvMap(time);
  if (materials.glass) {
    materials.glass.envMap = glassEnvMap;
    if (time === 'noon') {
      materials.glass.envMapIntensity = 2.5;
    } else if (time === 'sunset') {
      materials.glass.envMapIntensity = 2.2;
    } else {
      materials.glass.envMapIntensity = 1.0;
    }
    materials.glass.needsUpdate = true;
  }
}

// --- Materials Initialization ---
function initMaterials() {
  materials.leftWall = new THREE.MeshStandardMaterial({ color: 0xd39c82, roughness: 0.8, metalness: 0.0, side: THREE.DoubleSide });
  materials.rightWall = new THREE.MeshStandardMaterial({ color: 0xd39c82, roughness: 0.8, metalness: 0.0, side: THREE.DoubleSide });
  materials.backWall = new THREE.MeshStandardMaterial({ color: 0xd39c82, roughness: 0.8, metalness: 0.0, side: THREE.DoubleSide });
  materials.frontFacade = new THREE.MeshStandardMaterial({ color: 0xd39c82, roughness: 0.75, metalness: 0.0, side: THREE.DoubleSide });
  materials.balconies = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6, metalness: 0.0, side: THREE.DoubleSide });
  materials.dividers = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6, metalness: 0.0, side: THREE.DoubleSide });
  materials.awnings = new THREE.MeshStandardMaterial({ color: 0x1b6e4e, roughness: 0.9, metalness: 0.0, side: THREE.DoubleSide });
  materials.railings = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.5, metalness: 0.2 });
  materials.frames = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5, metalness: 0.0 });
  materials.roof = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6, metalness: 0.0, side: THREE.DoubleSide });
  materials.roofFixtures = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7, metalness: 0.0 });

  // Fixed Materials
  materials.glass = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(state.colors.glass),
    roughness: 0.04,
    metalness: 0.1,
    transparent: true,
    opacity: 0.5,
    transmission: 0.7,
    thickness: 0.15,
    ior: 1.52,
    clearcoat: 1.0,
    clearcoatRoughness: 0.01,
    side: THREE.DoubleSide
  });
  materials.walkway = new THREE.MeshStandardMaterial({ color: 0x7a7a7a, roughness: 0.9, metalness: 0.1 });
  materials.ground = new THREE.MeshStandardMaterial({ color: 0x557a46, roughness: 0.95, metalness: 0.0 });
  materials.lampPost = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.3, metalness: 0.8 });
  materials.lampGlass = new THREE.MeshBasicMaterial({ color: 0xffe066, transparent: true, opacity: 0.7 });
}

// --- Helper: Create a Hollow Architectural Frame ---
function createHollowFrame(w, h, depth, border, x, y, z, frameMat, glassMat, isGarage = false) {
  const group = new THREE.Group();

  // Top frame member
  const topGeo = new THREE.BoxGeometry(w, border, depth);
  const topFrame = new THREE.Mesh(topGeo, frameMat);
  topFrame.position.set(x, y + h / 2 - border / 2, z + depth / 2);
  topFrame.castShadow = true;
  group.add(topFrame);

  // Bottom frame member
  const bottomGeo = new THREE.BoxGeometry(w, border, depth);
  const bottomFrame = new THREE.Mesh(bottomGeo, frameMat);
  bottomFrame.position.set(x, y - h / 2 + border / 2, z + depth / 2);
  bottomFrame.castShadow = true;
  group.add(bottomFrame);

  // Left frame member
  const sideH = h - 2 * border;
  const leftGeo = new THREE.BoxGeometry(border, sideH, depth);
  const leftFrame = new THREE.Mesh(leftGeo, frameMat);
  leftFrame.position.set(x - w / 2 + border / 2, y, z + depth / 2);
  leftFrame.castShadow = true;
  group.add(leftFrame);

  // Right frame member
  const rightFrame = new THREE.Mesh(leftGeo, frameMat);
  rightFrame.position.set(x + w / 2 - border / 2, y, z + depth / 2);
  rightFrame.castShadow = true;
  group.add(rightFrame);

  const innerW = w - 2 * border;
  const innerH = h - 2 * border;

  if (isGarage) {
    const panelGeo = new THREE.BoxGeometry(innerW, innerH, 0.04);
    const panel = new THREE.Mesh(panelGeo, frameMat);
    panel.position.set(x, y, z + 0.04);
    panel.castShadow = true;
    group.add(panel);
  } else {
    const backingGeo = new THREE.BoxGeometry(innerW, innerH, 0.01);
    const backing = new THREE.Mesh(backingGeo, new THREE.MeshBasicMaterial({ color: 0x050505 }));
    backing.position.set(x, y, z + 0.01);
    group.add(backing);

    const glassGeo = new THREE.BoxGeometry(innerW, innerH, 0.02);
    const glass = new THREE.Mesh(glassGeo, glassMat);
    glass.position.set(x, y, z + 0.04);
    group.add(glass);
  }

  return group;
}

// --- Helper: Create a Green Roll-up Awning ---
function createAwning(ySlabUnderside, xCenter, width, projD, bD) {
  const awningGroup = new THREE.Group();

  // Awning Box (casing)
  const awningBoxGeo = new THREE.BoxGeometry(width, 0.15, 0.15);
  const awningBox = new THREE.Mesh(awningBoxGeo, materials.awnings);
  const boxY = ySlabUnderside - 0.075;
  const boxZ = bD / 2 + projD - 0.075;
  awningBox.position.set(xCenter, boxY, boxZ);
  awningBox.castShadow = true;
  awningGroup.add(awningBox);

  // Fabric
  const fabricShape = new THREE.Shape();
  fabricShape.moveTo(0, 0);
  fabricShape.lineTo(0, -0.15);
  fabricShape.lineTo(-1.5, -0.6);
  fabricShape.lineTo(-1.5, -0.85); 
  fabricShape.lineTo(-1.4, -0.85);
  fabricShape.lineTo(-1.35, -0.6);
  fabricShape.lineTo(0, 0);
  
  const fabricWidth = width - 0.2;
  const fabricSettings = { depth: fabricWidth, bevelEnabled: false };
  const fabricGeo = new THREE.ExtrudeGeometry(fabricShape, fabricSettings);
  const fabric = new THREE.Mesh(fabricGeo, materials.awnings);
  fabric.rotation.y = Math.PI / 2;
  fabric.position.set(xCenter - fabricWidth / 2, boxY, boxZ + 0.05);
  fabric.castShadow = true;
  awningGroup.add(fabric);

  return awningGroup;
}

// --- Procedural Scene Builder ---
function buildScene() {
  buildingGroup = new THREE.Group();

  // Dimensions
  const bW = 9.0;  // Building width (X)
  const bH = 14.3; // Building height (Y) - 13.7 roof floor + 0.6 parapet
  const bD = 10.5; // Building depth (Z)

  // --- 1. Base / Ground Elements ---
  const grassGeo = new THREE.PlaneGeometry(100, 100);
  const grass = new THREE.Mesh(grassGeo, materials.ground);
  grass.rotation.x = -Math.PI / 2;
  grass.position.y = -0.05;
  grass.receiveShadow = true;
  scene.add(grass);

  // Walkway / Pavement (Front)
  const walkGeo = new THREE.BoxGeometry(bW, 0.05, 8);
  const walkway = new THREE.Mesh(walkGeo, materials.walkway);
  walkway.position.set(0, 0, bD / 2 + 4);
  walkway.receiveShadow = true;
  scene.add(walkway);

  // --- 2. Building Walls (Angled 4-Wall Enclosure, Closed / No Holes) ---
  // Left Side Wall Segment 1 (Front straight section, Z: 5.25 to -2.0)
  const segment1L = bD / 2 - (-2.0); // 7.25
  const leftWall1Geo = new THREE.BoxGeometry(0.3, bH, segment1L);
  const leftWall1 = new THREE.Mesh(leftWall1Geo, materials.leftWall);
  leftWall1.position.set(-bW / 2, bH / 2, (bD / 2 - 2.0) / 2); // Center: Z = 1.625
  leftWall1.castShadow = true;
  leftWall1.receiveShadow = true;
  leftWall1.name = 'leftWall1';
  buildingGroup.add(leftWall1);

  // Left Side Wall Segment 2 (Bending 30 degrees to the left, truncated before the end)
  const xStart = -bW / 2; // -4.5
  const zStart = -2.0;

  // Truncated end points to create a 1.6m wide chamfer
  const xEndChamfer1 = -6.785;
  const zEndChamfer1 = -5.96;
  const xEndChamfer2 = -5.856;
  const zEndChamfer2 = -7.262;

  const segment2Length = Math.sqrt(Math.pow(xEndChamfer1 - xStart, 2) + Math.pow(zEndChamfer1 - zStart, 2)); // ~4.57
  const segment2H = bH;
  
  const leftWall2Geo = new THREE.BoxGeometry(0.3, segment2H, segment2Length);
  const leftWall2 = new THREE.Mesh(leftWall2Geo, materials.leftWall);
  const midX = (xStart + xEndChamfer1) / 2;
  const midZ = (zStart + zEndChamfer1) / 2;
  leftWall2.position.set(midX, segment2H / 2, midZ);
  leftWall2.rotation.y = Math.atan2(xEndChamfer1 - xStart, zEndChamfer1 - zStart);
  leftWall2.castShadow = true;
  leftWall2.receiveShadow = true;
  leftWall2.name = 'leftWall2';
  buildingGroup.add(leftWall2);

  // Chamfer / Truncation Wall Segment (1.6m wide)
  const chamferLength = 1.6;
  const chamferWallGeo = new THREE.BoxGeometry(0.3, bH, chamferLength);
  const chamferWall = new THREE.Mesh(chamferWallGeo, materials.leftWall);
  const chamferMidX = (xEndChamfer1 + xEndChamfer2) / 2;
  const chamferMidZ = (zEndChamfer1 + zEndChamfer2) / 2;
  chamferWall.position.set(chamferMidX, bH / 2, chamferMidZ);
  chamferWall.rotation.y = Math.atan2(xEndChamfer2 - xEndChamfer1, zEndChamfer2 - zEndChamfer1);
  chamferWall.castShadow = true;
  chamferWall.receiveShadow = true;
  chamferWall.name = 'chamferWall';
  buildingGroup.add(chamferWall);

  // Right Side Wall (runs straight along X = bW/2, Z: 5.25 to -5.25)
  const rightWallGeo = new THREE.BoxGeometry(0.3, bH, bD);
  const rightWall = new THREE.Mesh(rightWallGeo, materials.rightWall);
  rightWall.position.set(bW / 2, bH / 2, 0);
  rightWall.castShadow = true;
  rightWall.receiveShadow = true;
  buildingGroup.add(rightWall);

  // Back Wall (runs from chamfer end C2 to Back-Right corner B)
  const bxStart = xEndChamfer2; // -5.856
  const bzStart = zEndChamfer2; // -7.262
  const bxEnd = bW / 2; // 4.5
  const bzEnd = -bD / 2; // -5.25
  const bdx = bxEnd - bxStart; // 10.356
  const bdz = bzEnd - bzStart; // 2.012
  const backWallL = Math.sqrt(bdx * bdx + bdz * bdz); // ~10.55
  const backWallH = bH;
  
  const backWallGeo = new THREE.BoxGeometry(0.3, backWallH, backWallL);
  const backWallMesh = new THREE.Mesh(backWallGeo, materials.backWall);
  const bmidX = (bxStart + bxEnd) / 2;
  const bmidZ = (bzStart + bzEnd) / 2;
  backWallMesh.position.set(bmidX, backWallH / 2, bmidZ);
  backWallMesh.rotation.y = Math.atan2(bdx, bdz);
  backWallMesh.castShadow = true;
  backWallMesh.receiveShadow = true;
  buildingGroup.add(backWallMesh);

  // Front Facade Wall (ends at the roof slab level Y = 13.7)
  const frontWallGeo = new THREE.BoxGeometry(bW - 0.3, 13.7, 0.3);
  const frontWall = new THREE.Mesh(frontWallGeo, materials.frontFacade);
  frontWall.position.set(0, 13.7 / 2, bD / 2 - 0.15);
  frontWall.castShadow = true;
  frontWall.receiveShadow = true;
  buildingGroup.add(frontWall);

  // --- 3. Custom Extruded Slabs (Floor and Ceiling of Interior) ---
  const halfW = bW / 2 - 0.2;
  const projD = 2.2;

  // Building footprint shape
  const buildingShape = new THREE.Shape();
  buildingShape.moveTo(bW / 2, -bD / 2);      // Front-Right (4.5, -5.25)
  buildingShape.lineTo(-bW / 2, -bD / 2);     // Front-Left (-4.5, -5.25)
  buildingShape.lineTo(-bW / 2, 2.0);         // Left-Bend (-4.5, 2.0)
  buildingShape.lineTo(xEndChamfer1, -zEndChamfer1); // Back-Left Chamfer Corner 1
  buildingShape.lineTo(xEndChamfer2, -zEndChamfer2); // Back-Left Chamfer Corner 2
  buildingShape.lineTo(bW / 2, 5.25);         // Back-Right (4.5, 5.25)
  buildingShape.closePath();

  // Roof shape with projecting balcony at the front
  const roofShape = new THREE.Shape();
  roofShape.moveTo(bW / 2, 5.25);          // Back-Right (4.5, 5.25)
  roofShape.lineTo(bW / 2, -bD / 2);       // Front-Right (4.5, -5.25)
  roofShape.lineTo(halfW, -bD / 2);        // Right facade balcony corner (4.3, -5.25)
  roofShape.lineTo(halfW, -(bD / 2 + projD)); // Front-Right balcony corner (4.3, -7.45)
  roofShape.lineTo(-halfW, -(bD / 2 + projD)); // Front-Left balcony corner (-4.3, -7.45)
  roofShape.lineTo(-halfW, -bD / 2);       // Left facade balcony corner (-4.3, -5.25)
  roofShape.lineTo(-bW / 2, -bD / 2);      // Front-Left (-4.5, -5.25)
  roofShape.lineTo(-bW / 2, 2.0);          // Left-Bend (-4.5, 2.0)
  roofShape.lineTo(xEndChamfer1, -zEndChamfer1); // Back-Left Chamfer Corner 1
  roofShape.lineTo(xEndChamfer2, -zEndChamfer2); // Back-Left Chamfer Corner 2
  roofShape.closePath();

  // Floor Slab
  const baseExtrude = { depth: 0.2, bevelEnabled: false };
  const baseSlabGeo = new THREE.ExtrudeGeometry(buildingShape, baseExtrude);
  const baseSlab = new THREE.Mesh(baseSlabGeo, materials.balconies);
  baseSlab.rotation.x = -Math.PI / 2;
  baseSlab.position.set(0, -0.2, 0);
  baseSlab.receiveShadow = true;
  buildingGroup.add(baseSlab);

  // Roof Slab
  const roofExtrude = { depth: 0.4, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.02, bevelSegments: 3 };
  const roofSlabGeo = new THREE.ExtrudeGeometry(roofShape, roofExtrude);
  const roofSlab = new THREE.Mesh(roofSlabGeo, materials.roof);
  roofSlab.rotation.x = -Math.PI / 2;
  const firstFloorHeight = 3.8;
  const floors = 3;
  const floorInterval = 3.3;
  const roofY = firstFloorHeight + (floors - 1) * floorInterval + floorInterval;
  roofSlab.position.set(0, roofY, 0);
  roofSlab.castShadow = true;
  roofSlab.receiveShadow = true;
  buildingGroup.add(roofSlab);

  // --- 4. Balconies & Pillars ---
  for (let f = 0; f < 3; f++) {
    const yPos = firstFloorHeight + f * floorInterval;

    // A. Balcony Slab (SQUARE corner on the right - no curves)
    const balconyShape = new THREE.Shape();
    const halfW = bW / 2 - 0.2;
    const projD = 2.2;
    // Sharp rectangle layout
    balconyShape.moveTo(-halfW, 0);
    balconyShape.lineTo(halfW, 0);
    balconyShape.lineTo(halfW, -projD);
    balconyShape.lineTo(-halfW, -projD);
    balconyShape.closePath();

    const slabSettings = { depth: 0.35, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.02, bevelSegments: 3 };
    const slabGeo = new THREE.ExtrudeGeometry(balconyShape, slabSettings);
    const slab = new THREE.Mesh(slabGeo, materials.balconies);
    slab.castShadow = true;
    slab.receiveShadow = true;
    slab.rotation.x = -Math.PI / 2;
    slab.position.set(0, yPos + 0.35, bD / 2 - 0.15);
    buildingGroup.add(slab);

    // C. Balcony Railings
    const railingH = 1.0;
    const railGroup = new THREE.Group();
    const handrailGeo = new THREE.BoxGeometry(bW - 0.4, 0.06, 0.06);
    const handrailFront = new THREE.Mesh(handrailGeo, materials.railings);
    handrailFront.position.set(0, yPos + 0.35 + railingH, bD / 2 + projD - 0.18);
    handrailFront.castShadow = true;
    railGroup.add(handrailFront);

    const sideRailGeo = new THREE.BoxGeometry(0.06, 0.06, projD - 0.18);
    const sideRailLeft = new THREE.Mesh(sideRailGeo, materials.railings);
    sideRailLeft.position.set(-halfW, yPos + 0.35 + railingH, 5.25 + (projD - 0.18) / 2);
    sideRailLeft.castShadow = true;
    railGroup.add(sideRailLeft);

    const sideRailRight = new THREE.Mesh(sideRailGeo, materials.railings);
    sideRailRight.position.set(halfW, yPos + 0.35 + railingH, 5.25 + (projD - 0.18) / 2);
    sideRailRight.castShadow = true;
    railGroup.add(sideRailRight);

    // Vertical rods
    const numBars = 22;
    const barGeo = new THREE.CylinderGeometry(0.015, 0.015, railingH, 6);
    for (let i = 0; i < numBars; i++) {
      const xPos = -halfW + (i * 2 * halfW / (numBars - 1));
      const bar = new THREE.Mesh(barGeo, materials.railings);
      bar.position.set(xPos, yPos + 0.35 + railingH / 2, bD / 2 + projD - 0.18);
      bar.castShadow = true;
      railGroup.add(bar);
    }
    // Side rods
    const numSideBars = 6;
    for (let i = 0; i < numSideBars; i++) {
      const zPos = 5.25 + (i * (projD - 0.18) / (numSideBars - 1));
      const barL = new THREE.Mesh(barGeo, materials.railings);
      barL.position.set(-halfW, yPos + 0.35 + railingH / 2, zPos);
      barL.castShadow = true;
      railGroup.add(barL);

      const barR = new THREE.Mesh(barGeo, materials.railings);
      barR.position.set(halfW, yPos + 0.35 + railingH / 2, zPos);
      barR.castShadow = true;
      railGroup.add(barR);
    }
    buildingGroup.add(railGroup);

    // F. Balcony Privacy Divider (Separator between flats)
    const dividerGeo = new THREE.BoxGeometry(0.1, 2.95, 2.2);
    const divider = new THREE.Mesh(dividerGeo, materials.dividers);
    divider.position.set(0, yPos + 0.35 + 2.95 / 2, bD / 2 - 0.15 + 2.2 / 2);
    divider.castShadow = true;
    divider.receiveShadow = true;
    buildingGroup.add(divider);

    // E. Windows Layout (Symmetric layout, door windows sit on balcony floor and align at top)
    const winLayouts = [
      { x: -3.0, w: 1.5, h: 2.4, yOffset: 1.55, type: 'door' },  // leftmost door-sized window (recessed/flush with balcony)
      { x: -1.2, w: 1.2, h: 1.2, yOffset: 2.15, type: 'regular' },  // middle-left regular window (smaller)
      { x: 1.2, w: 1.2, h: 1.2, yOffset: 2.15, type: 'regular' },   // middle-right regular window (smaller)
      { x: 3.0, w: 1.5, h: 2.4, yOffset: 1.55, type: 'door' }   // rightmost door-sized window (recessed/flush with balcony)
    ];

    winLayouts.forEach(win => {
      const winGroup = createHollowFrame(
        win.w,
        win.h,
        0.12, // depth
        0.08, // border thickness
        win.x,
        yPos + win.yOffset,
        bD / 2,
        materials.frames,
        materials.glass,
        false
      );
      buildingGroup.add(winGroup);
    });
  }

  // --- 4B. Back Wall Windows (4 square windows per upper floor, except ground floor) ---
  const backWallWindowsGroup = new THREE.Group();
  backWallWindowsGroup.position.set(bmidX, 0, bmidZ);
  backWallWindowsGroup.rotation.y = Math.atan2(bdx, bdz);

  const zOffsets = [-3.3, -1.1, 1.1, 3.3];

  for (let f = 0; f < 3; f++) {
    const yPos = firstFloorHeight + f * floorInterval;
    const yLocal = yPos + 2.15; // Align window heads with front doors

    zOffsets.forEach(zLocal => {
      // Create window centered at (0,0,0) locally, then position and rotate it
      const win = createHollowFrame(1.2, 1.2, 0.12, 0.08, 0, 0, 0, materials.frames, materials.glass, false);
      win.position.set(0.15, yLocal, zLocal); // Offset by 0.15 to sit flush on outer back wall face
      win.rotation.y = Math.PI / 2; // Rotate to face outward
      backWallWindowsGroup.add(win);
    });
  }
  buildingGroup.add(backWallWindowsGroup);

  // --- 5. Roof Terrace Railings & Fixtures ---
  const roofRailH = 1.1;
  const roofRailGroup = new THREE.Group();
  
  // Outer perimeter corners of the roof (matching wall alignment, enclosing roof balcony)
  const roofCorners = [
    new THREE.Vector3(bW / 2, 0, -bD / 2),
    new THREE.Vector3(xEndChamfer2, 0, zEndChamfer2),
    new THREE.Vector3(xEndChamfer1, 0, zEndChamfer1),
    new THREE.Vector3(-bW / 2, 0, -2.0),
    new THREE.Vector3(-bW / 2, 0, bD / 2),
    new THREE.Vector3(-halfW, 0, bD / 2),
    new THREE.Vector3(-halfW, 0, bD / 2 + projD),
    new THREE.Vector3(halfW, 0, bD / 2 + projD),
    new THREE.Vector3(halfW, 0, bD / 2),
    new THREE.Vector3(bW / 2, 0, bD / 2)
  ];

  for (let i = 0; i < roofCorners.length; i++) {
    const pStart = roofCorners[i];
    const pEnd = roofCorners[(i + 1) % roofCorners.length];
    
    // Segment vector and length
    const dir = new THREE.Vector3().subVectors(pEnd, pStart);
    const dist = dir.length();
    
    // All fence segments sit flush on the roof slab deck (Y = 13.7) all around
    const segmentY = roofY;
    
    // Handrail
    const handrailGeo = new THREE.BoxGeometry(0.06, 0.06, dist);
    const handrail = new THREE.Mesh(handrailGeo, materials.railings);
    
    const mid = new THREE.Vector3().addVectors(pStart, pEnd).multiplyScalar(0.5);
    handrail.position.set(mid.x, segmentY + roofRailH, mid.z);
    handrail.rotation.y = Math.atan2(dir.x, dir.z);
    handrail.castShadow = true;
    roofRailGroup.add(handrail);

    // Vertical rods along the segment
    const barSpacing = 0.35;
    const numBars = Math.max(2, Math.floor(dist / barSpacing));
    const barGeo = new THREE.CylinderGeometry(0.015, 0.015, roofRailH, 6);
    
    for (let j = 0; j <= numBars; j++) {
      const t = j / numBars;
      const pos = new THREE.Vector3().lerpVectors(pStart, pEnd, t);
      const bar = new THREE.Mesh(barGeo, materials.railings);
      bar.position.set(pos.x, segmentY + roofRailH / 2, pos.z);
      bar.castShadow = true;
      roofRailGroup.add(bar);
    }
  }
  buildingGroup.add(roofRailGroup);

  // Rooftop Fixtures
  const roofFixturesGroup = new THREE.Group();
  const chimneyGeo = new THREE.BoxGeometry(3.0, 2.6, 3.0);
  const chimney = new THREE.Mesh(chimneyGeo, materials.roofFixtures);
  chimney.position.set(0, roofY + 1.3, 1.5);
  chimney.castShadow = true;
  roofFixturesGroup.add(chimney);

  const antennaPoleGeo = new THREE.CylinderGeometry(0.04, 0.04, 3.5, 6);
  const antennaPole = new THREE.Mesh(antennaPoleGeo, materials.roofFixtures);
  antennaPole.position.set(1.5, roofY + 2.15, -1.0);
  antennaPole.castShadow = true;
  roofFixturesGroup.add(antennaPole);

  const crossbarGeo = new THREE.BoxGeometry(1.0, 0.03, 0.03);
  const cross1 = new THREE.Mesh(crossbarGeo, materials.roofFixtures);
  cross1.position.set(1.5, roofY + 3.25, -1.0);
  const cross2 = new THREE.Mesh(crossbarGeo, materials.roofFixtures);
  cross2.position.set(1.5, roofY + 3.65, -1.0);
  roofFixturesGroup.add(cross1);
  roofFixturesGroup.add(cross2);
  buildingGroup.add(roofFixturesGroup);

  // --- 5B. Green Roll-up Awnings (Attached to the bottom of the balconies/roof above) ---
  // Ground floor awning is removed.
  // Each floor has 2 awnings (left side X = -2.1, right side X = 2.1, width = 3.2).
  
  // 1st floor awnings: under 2nd floor balcony slab (underside Y = 7.1)
  const awning1FL = createAwning(7.1, -2.1, 3.2, projD, bD);
  const awning1FR = createAwning(7.1, 2.1, 3.2, projD, bD);
  buildingGroup.add(awning1FL);
  buildingGroup.add(awning1FR);

  // 2nd floor awnings: under 3rd floor balcony slab (underside Y = 10.4)
  const awning2FL = createAwning(10.4, -2.1, 3.2, projD, bD);
  const awning2FR = createAwning(10.4, 2.1, 3.2, projD, bD);
  buildingGroup.add(awning2FL);
  buildingGroup.add(awning2FR);

  // 3rd floor awnings: under the roof slab (underside Y = 13.3)
  const awning3FL = createAwning(13.3, -2.1, 3.2, projD, bD);
  const awning3FR = createAwning(13.3, 2.1, 3.2, projD, bD);
  buildingGroup.add(awning3FL);
  buildingGroup.add(awning3FR);

  // --- 6. Ground Floor Features (Aligned & Square with Hollow Frames) ---
  // Garage Door (Converted to Window to match other ground floor windows)
  const garage = createHollowFrame(3.0, 3.0, 0.12, 0.1, -2.6, 1.5, bD / 2, materials.frames, materials.glass, false);
  buildingGroup.add(garage);

  // Main Entrance Door
  const mainDoor = createHollowFrame(2.0, 3.0, 0.12, 0.1, 0.0, 1.5, bD / 2, materials.frames, materials.glass, false);
  buildingGroup.add(mainDoor);

  // Shopfront Window
  const shopfront = createHollowFrame(3.0, 3.0, 0.12, 0.1, 2.6, 1.5, bD / 2, materials.frames, materials.glass, false);
  buildingGroup.add(shopfront);

  // --- 7. Downpipes & Drainage ---
  const pipeGroup = new THREE.Group();
  
  // Front downpipe (attaches to front facade of height 13.7)
  const mainPipeGeo1 = new THREE.CylinderGeometry(0.06, 0.06, 13.7, 8);
  const mainPipe1 = new THREE.Mesh(mainPipeGeo1, materials.railings);
  mainPipe1.position.set(-bW / 2 + 0.1, 13.7 / 2, bD / 2 - 0.15);
  mainPipe1.castShadow = true;
  pipeGroup.add(mainPipe1);

  // Side downpipe (attaches to side wall segment 2 at the chamfer corner)
  const mainPipeGeo2 = new THREE.CylinderGeometry(0.06, 0.06, segment2H, 8);
  const mainPipe2 = new THREE.Mesh(mainPipeGeo2, materials.railings);
  mainPipe2.position.set(xEndChamfer1 + 0.1, segment2H / 2, zEndChamfer1 + 0.15);
  mainPipe2.castShadow = true;
  pipeGroup.add(mainPipe2);

  const bracketGeo = new THREE.BoxGeometry(0.18, 0.04, 0.18);
  const numBrackets = 6;
  for (let i = 0; i < numBrackets; i++) {
    // Front pipe brackets (max Y = 13.0, matching front wall height 13.7)
    const yPos1 = 1.0 + i * (12.0 / (numBrackets - 1));
    const br1 = new THREE.Mesh(bracketGeo, materials.railings);
    br1.position.set(-bW / 2 + 0.05, yPos1, bD / 2 - 0.15);
    pipeGroup.add(br1);

    // Side pipe brackets (max Y = 13.8, matching side wall height 14.3)
    const yPos2 = 1.0 + i * (12.8 / (numBrackets - 1));
    const br2 = new THREE.Mesh(bracketGeo, materials.railings);
    br2.position.set(xEndChamfer1 + 0.05, yPos2, zEndChamfer1 + 0.15);
    pipeGroup.add(br2);
  }
  buildingGroup.add(pipeGroup);

  // --- 8. Sidewalk Street Lamp (Physical models removed, light source retained for night mode) ---
  streetLampLight = new THREE.PointLight(0xffb74d, 0, 15, 1.2);
  streetLampLight.position.set(bW / 2 + 0.7, 4.7, bD / 2 + 3.0);
  streetLampLight.castShadow = true;
  streetLampLight.shadow.bias = -0.002;
  scene.add(streetLampLight);



  // Add building to the scene
  scene.add(buildingGroup);
}

// --- Dynamic Lighting Manager ---
function setupLighting() {
  hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.6);
  scene.add(hemiLight);

  ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
  scene.add(ambientLight);

  sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
  sunLight.position.set(18, 24, 15);
  sunLight.castShadow = true;
  
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.camera.near = 0.5;
  sunLight.shadow.camera.far = 60;
  
  const d = 25;
  sunLight.shadow.camera.left = -d;
  sunLight.shadow.camera.right = d;
  sunLight.shadow.camera.top = d;
  sunLight.shadow.camera.bottom = -d;
  sunLight.shadow.bias = -0.0005;

  scene.add(sunLight);
}

// Update light positions and intensities based on time of day
function updateLightingMode(time) {
  state.timeOfDay = time;

  if (time === 'noon') {
    renderer.setClearColor(0xcbe3f8);
    scene.fog = new THREE.FogExp2(0xcbe3f8, 0.008);

    hemiLight.color.setHex(0xffffff);
    hemiLight.groundColor.setHex(0x5d8a66);
    hemiLight.intensity = 0.7;

    ambientLight.color.setHex(0xffffff);
    ambientLight.intensity = 0.85;

    sunLight.color.setHex(0xfffbf0);
    sunLight.position.set(16, 26, 14);
    sunLight.intensity = 1.5;
    sunLight.visible = true;

    streetLampLight.intensity = 0.0;
  } 
  else if (time === 'sunset') {
    renderer.setClearColor(0xfd945a);
    scene.fog = new THREE.FogExp2(0xfd945a, 0.01);

    hemiLight.color.setHex(0xffa873);
    hemiLight.groundColor.setHex(0x3d2112);
    hemiLight.intensity = 0.5;

    ambientLight.color.setHex(0xffcaa6);
    ambientLight.intensity = 0.65;

    sunLight.color.setHex(0xff5511);
    sunLight.position.set(22, 7, 10);
    sunLight.intensity = 1.6;
    sunLight.visible = true;

    streetLampLight.intensity = 0.3;
  } 
  else if (time === 'night') {
    renderer.setClearColor(0x0a0c16);
    scene.fog = new THREE.FogExp2(0x0a0c16, 0.015);

    hemiLight.color.setHex(0x4a65a0);
    hemiLight.groundColor.setHex(0x0e1424);
    hemiLight.intensity = 0.45;

    ambientLight.color.setHex(0x3a4f80);
    ambientLight.intensity = 0.55;

    sunLight.color.setHex(0xe3ecff); // Bright silver-white moonlight
    sunLight.position.set(-18, 20, -15);
    sunLight.intensity = 0.95; // High intensity for a bright full moon night
    sunLight.visible = true;

    streetLampLight.intensity = 4.5;
  }

  // Update glass reflections for current environment map
  updateGlassEnvironment(time);
}

// --- UI Interaction Bindings ---
function setupEventListeners() {
  // 1. Tab Switching
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      const tabId = `tab-${btn.dataset.tab}`;
      document.getElementById(tabId).classList.add('active');
    });
  });

  // 2. Preset Themes
  presetCards.forEach(card => {
    card.addEventListener('click', () => {
      presetCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      
      const presetName = card.dataset.preset;
      applyPreset(presetName);
    });
  });

  // 3. Custom Color Pickers
  Object.keys(colorInputs).forEach(key => {
    const picker = colorInputs[key];
    picker.addEventListener('input', (e) => {
      const colorVal = e.target.value;
      state.colors[key] = colorVal;
      colorLabels[key].textContent = colorVal.toUpperCase();
      
      if (materials[key]) {
        materials[key].color.set(colorVal);
      }
      
      presetCards.forEach(c => c.classList.remove('active'));
      document.querySelectorAll('.saved-style-card').forEach(c => c.classList.remove('active'));
      state.activePreset = 'custom';
    });
  });

  // 3B. Randomize Colors Button
  document.getElementById('btn-randomize').addEventListener('click', () => {
    Object.keys(colorInputs).forEach(key => {
      const randomColor = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
      state.colors[key] = randomColor;
      if (colorInputs[key]) colorInputs[key].value = randomColor;
      if (colorLabels[key]) colorLabels[key].textContent = randomColor.toUpperCase();
      if (materials[key]) {
        materials[key].color.set(randomColor);
      }
    });

    presetCards.forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.saved-style-card').forEach(c => c.classList.remove('active'));
    state.activePreset = 'custom';
  });

  // 4. Time of Day Toggles
  timeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      timeButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      const timeVal = btn.dataset.time;
      updateLightingMode(timeVal);
      
      presetCards.forEach(c => c.classList.remove('active'));
      document.querySelectorAll('.saved-style-card').forEach(c => c.classList.remove('active'));
      state.activePreset = 'custom';
    });
  });

  // 5. Camera View Presets
  document.getElementById('btn-view-isometric').addEventListener('click', () => {
    animateCamera(22, 12, 25);
  });
  document.getElementById('btn-view-front').addEventListener('click', () => {
    animateCamera(0, 6, 26);
  });
  document.getElementById('btn-view-side').addEventListener('click', () => {
    animateCamera(-26, 6, 4);
  });

  // 6. Screenshot Export
  screenshotBtn.addEventListener('click', () => {
    exportScreenshot();
  });

  // 7. Toggle Shadows (On/Off)
  const toggleShadows = document.getElementById('toggle-shadows');
  if (toggleShadows) {
    toggleShadows.addEventListener('change', (e) => {
      const enabled = e.target.checked;
      
      // Update renderer shadow map setting
      renderer.shadowMap.enabled = enabled;
      
      // Traverse scene to update cast/receive settings on meshes and recompile shaders
      scene.traverse((node) => {
        if (node.isMesh) {
          node.castShadow = enabled;
          node.receiveShadow = enabled;
          if (node.material) {
            if (Array.isArray(node.material)) {
              node.material.forEach(m => m.needsUpdate = true);
            } else {
              node.material.needsUpdate = true;
            }
          }
        }
      });

      presetCards.forEach(c => c.classList.remove('active'));
      document.querySelectorAll('.saved-style-card').forEach(c => c.classList.remove('active'));
      state.activePreset = 'custom';
    });
  }

  // 8. Toggle Control Panel (Close/Open) with Touch Support & Event Isolation
  const btnClosePanel = document.getElementById('btn-close-panel');
  const btnFloatingOpen = document.getElementById('btn-floating-open');
  const uiContainer = document.querySelector('.ui-container');
  
  if (btnClosePanel && btnFloatingOpen && uiContainer) {
    // Isolate UI panel and floating button from Three.js OrbitControls interactions
    const stopEvents = ['click', 'mousedown', 'mouseup', 'touchstart', 'touchend', 'pointerdown', 'pointerup'];
    stopEvents.forEach(evtType => {
      uiContainer.addEventListener(evtType, (e) => {
        e.stopPropagation();
      });
      btnFloatingOpen.addEventListener(evtType, (e) => {
        e.stopPropagation();
      });
    });

    const handleClose = (e) => {
      e.preventDefault();
      e.stopPropagation();
      uiContainer.classList.add('hidden');
      btnFloatingOpen.classList.add('visible');
    };
    
    const handleOpen = (e) => {
      e.preventDefault();
      e.stopPropagation();
      uiContainer.classList.remove('hidden');
      btnFloatingOpen.classList.remove('visible');
    };

    // Listen to both click and touchend for instant mobile response
    btnClosePanel.addEventListener('click', handleClose);
    btnClosePanel.addEventListener('touchend', handleClose);
    
    btnFloatingOpen.addEventListener('click', handleOpen);
    btnFloatingOpen.addEventListener('touchend', handleOpen);
  }

  // 9. Language Switcher Listener
  const selectLanguage = document.getElementById('select-language');
  if (selectLanguage) {
    selectLanguage.addEventListener('change', (e) => {
      setLanguage(e.target.value);
    });
  }

  // 10. Save Style Event Listener
  const btnSaveStyle = document.getElementById('btn-save-style');
  if (btnSaveStyle) {
    const inputName = document.getElementById('input-style-name');
    btnSaveStyle.addEventListener('click', () => {
      const name = inputName.value.trim();
      saveStyle(name);
      inputName.value = '';
    });
    if (inputName) {
      inputName.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const name = inputName.value.trim();
          saveStyle(name);
          inputName.value = '';
        }
      });
    }
  }

  window.addEventListener('resize', onWindowResize);
}

// Apply Selected Preset Scheme to all elements
function applyPreset(presetName) {
  state.activePreset = presetName;
  const config = presets[presetName];
  if (!config) return;

  Object.keys(config).forEach(key => {
    const val = config[key];
    state.colors[key] = val;
    
    if (colorInputs[key]) colorInputs[key].value = val;
    if (colorLabels[key]) colorLabels[key].textContent = val.toUpperCase();
    
    if (materials[key]) {
      materials[key].color.set(val);
    }
  });
}

// Camera movement animation helper
function animateCamera(tx, ty, tz) {
  const duration = 1000;
  const startX = camera.position.x;
  const startY = camera.position.y;
  const startZ = camera.position.z;
  const startTime = performance.now();

  function updateCam(time) {
    const elapsed = time - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const ease = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;

    camera.position.x = startX + (tx - startX) * ease;
    camera.position.y = startY + (ty - startY) * ease;
    camera.position.z = startZ + (tz - startZ) * ease;
    controls.target.set(0, 5, 0);

    if (progress < 1) {
      requestAnimationFrame(updateCam);
    }
  }
  requestAnimationFrame(updateCam);
}

// Export canvas image
function exportScreenshot() {
  const helpEl = document.querySelector('.interaction-help');
  if (helpEl) helpEl.style.opacity = '0';
  
  renderer.render(scene, camera);
  
  const dataURL = renderer.domElement.toDataURL('image/png');
  
  const link = document.createElement('a');
  link.download = `remodel3d-visualization-${state.activePreset}-${state.timeOfDay}.png`;
  link.href = dataURL;
  link.click();

  if (helpEl) helpEl.style.opacity = '1';
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// --- Animation Loop ---
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

// --- Internationalization (i18n) translation dictionaries ---
const translations = {
  en: {
    subtitle: "Building Visualizer & Color Customizer",
    tabPresets: "Presets",
    tabColors: "Custom Colors",
    tabEnvironment: "Environment",
    presetsHeading: "Select a Remodeling Theme",
    presetModernGreyTitle: "Modern Grey",
    presetModernGreyDesc: "Clean light grey stucco with charcoal accents",
    presetClassicTitle: "Classic Original",
    presetClassicDesc: "Original peach facade with dark brown siding",
    presetNordicTitle: "Nordic Contrast",
    presetNordicDesc: "Off-white front with deep charcoal side wall",
    presetTerracottaTitle: "Warm Terracotta",
    presetTerracottaDesc: "Rust-orange details on warm sand facade",
    presetEsteladaTitle: "Estelada",
    presetEsteladaDesc: "Catalan Independence flag themed walls and colors",
    colorsHeading: "Customize Material Colors",
    btnRandomize: "🎲 Randomize All Colors",
    labelLeftWall: "Left Side Wall",
    labelFrontFacade: "Front Facade",
    labelRightWall: "Right Side Wall",
    labelBackWall: "Back Wall",
    labelBalconies: "Balcony Slabs & Pillars",
    labelDividers: "Balcony Divider",
    labelAwnings: "Awnings (Canvas fabric)",
    labelRailings: "Metal Railings",
    labelFrames: "Window & Door Frames",
    labelGlass: "Window Glass",
    labelRoof: "Roof Slab",
    labelRoofFixtures: "Rooftop Fixtures",
    envHeading: "Environment & Lighting",
    labelTimeOfDay: "Time of Day",
    btnNoon: "Noon",
    btnSunset: "Sunset",
    btnNight: "Night",
    labelCameraViews: "Camera Views",
    btnViewIsometric: "Three-Quarter View",
    btnViewFront: "Front Facade View",
    btnViewSide: "Side Wall View",
    labelLightingEffects: "Lighting Effects",
    labelEnableShadows: "👥 Enable Shadows",
    btnScreenshot: "Export Visualization PNG",
    interactionHelp: "🖱️ Left Click + Drag to rotate | 🖱️ Right Click + Drag to pan | 📜 Scroll to zoom",
    loadingTitle: "Generating 3D Model...",
    loadingText: "Constructing architecture, lighting, and textures",
    openCustomizer: "Open Customizer",
    savedStylesHeading: "My Favorite Styles",
    btnSaveStyle: "Save Style",
    saveStylePlaceholder: "Name your style...",
    noSavedStyles: "No saved styles yet."
  },
  es: {
    subtitle: "Visualizador de Edificios y Personalizador de Colores",
    tabPresets: "Temas",
    tabColors: "Colores",
    tabEnvironment: "Entorno",
    presetsHeading: "Seleccionar un Tema de Remodelación",
    presetModernGreyTitle: "Gris Moderno",
    presetModernGreyDesc: "Estuco gris claro limpio con detalles en carbón",
    presetClassicTitle: "Clásico Original",
    presetClassicDesc: "Fachada color melocotón original con laterales marrón oscuro",
    presetNordicTitle: "Contraste Nórdico",
    presetNordicDesc: "Frente blanco roto con pared lateral carbón profundo",
    presetTerracottaTitle: "Terracota Cálida",
    presetTerracottaDesc: "Detalles naranja óxido en fachada de arena cálida",
    presetEsteladaTitle: "Estelada",
    presetEsteladaDesc: "Paredes y colores temáticos de la bandera catalana",
    colorsHeading: "Personalizar Colores de Materiales",
    btnRandomize: "🎲 Colores Aleatorios",
    labelLeftWall: "Pared Lateral Izquierda",
    labelFrontFacade: "Fachada Frontal",
    labelRightWall: "Pared Lateral Derecha",
    labelBackWall: "Pared Trasera",
    labelBalconies: "Losas y Pilares de Balcón",
    labelDividers: "Separador de Balcón",
    labelAwnings: "Toldos (Lona)",
    labelRailings: "Barandillas Metálicas",
    labelFrames: "Marcos de Ventanas y Puertas",
    labelGlass: "Vidrio de Ventanas",
    labelRoof: "Losa del Techo",
    labelRoofFixtures: "Instalaciones del Techo",
    envHeading: "Entorno e Iluminación",
    labelTimeOfDay: "Hora del Día",
    btnNoon: "Mediodía",
    btnSunset: "Atardecer",
    btnNight: "Noche",
    labelCameraViews: "Vistas de Cámara",
    btnViewIsometric: "Vista de Tres Cuartos",
    btnViewFront: "Vista Frontal",
    btnViewSide: "Vista Lateral",
    labelLightingEffects: "Efectos de Iluminación",
    labelEnableShadows: "👥 Activar Sombras",
    btnScreenshot: "Exportar PNG de Visualización",
    interactionHelp: "🖱️ Clic Izquierdo + Arrastrar para rotar | 🖱️ Clic Derecho + Arrastrar para desplazar | 📜 Deslizar para zoom",
    loadingTitle: "Generando Modelo 3D...",
    loadingText: "Construyendo arquitectura, iluminación y texturas",
    openCustomizer: "Abrir Personalizador",
    savedStylesHeading: "Mis Estilos Favoritos",
    btnSaveStyle: "Guardar Estilo",
    saveStylePlaceholder: "Nombre del estilo...",
    noSavedStyles: "Aún no hay estilos guardados."
  },
  ca: {
    subtitle: "Visualitzador d'Edificis i Personalitzador de Colors",
    tabPresets: "Temes",
    tabColors: "Colors",
    tabEnvironment: "Entorn",
    presetsHeading: "Seleccionar un Tema de Remodelació",
    presetModernGreyTitle: "Gris Modern",
    presetModernGreyDesc: "Estuc gris clar net amb detalls en carbó",
    presetClassicTitle: "Clàssic Original",
    presetClassicDesc: "Fatxada color préssec original amb laterals marró fosc",
    presetNordicTitle: "Contrast Nòrdic",
    presetNordicDesc: "Front blanc trencat amb paret lateral carbó profund",
    presetTerracottaTitle: "Terracota Càlida",
    presetTerracottaDesc: "Detalls taronja òxid en fatxada de sorra càlida",
    presetEsteladaTitle: "Estelada",
    presetEsteladaDesc: "Parets i colors temàtics de la bandera catalana",
    colorsHeading: "Personalitzar Colors de Materials",
    btnRandomize: "🎲 Colors Aleatoris",
    labelLeftWall: "Paret Lateral Esquerra",
    labelFrontFacade: "Fatxada Frontal",
    labelRightWall: "Paret Lateral Dreta",
    labelBackWall: "Paret Posterior",
    labelBalconies: "Lloses i Pilars de Balcó",
    labelDividers: "Separador de Balcó",
    labelAwnings: "Tendals (Lona)",
    labelRailings: "Baranes Metàl·liques",
    labelFrames: "Marcs de Finestres i Portes",
    labelGlass: "Vidre de Finestres",
    labelRoof: "Llosa del Sostre",
    labelRoofFixtures: "Instal·lacions del Sostre",
    envHeading: "Entorn i Il·luminació",
    labelTimeOfDay: "Hora del Dia",
    btnNoon: "Migdia",
    btnSunset: "Capvespre",
    btnNight: "Nit",
    labelCameraViews: "Vistes de Càmera",
    btnViewIsometric: "Vista de Tres Quarts",
    btnViewFront: "Vista Frontal",
    btnViewSide: "Vista Lateral",
    labelLightingEffects: "Efectes d'Il·luminació",
    labelEnableShadows: "👥 Activar Ombres",
    btnScreenshot: "Exportar PNG de Visualització",
    interactionHelp: "🖱️ Clic Esquerre + Arrossegar per rotar | 🖱️ Clic Dret + Arrossegar per desplaçar | 📜 Lliscament per zoom",
    loadingTitle: "Generant Model 3D...",
    loadingText: "Construint arquitectura, il·luminació i textures",
    openCustomizer: "Obrir Personalitzador",
    savedStylesHeading: "Els Meus Estils Preferits",
    btnSaveStyle: "Desar Estil",
    saveStylePlaceholder: "Nom de l'estil...",
    noSavedStyles: "Encara no hi ha estils desats."
  }
};

function setLanguage(lang) {
  const dict = translations[lang];
  if (!dict) return;
  
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (dict[key]) {
      if (el.tagName === 'INPUT' && el.type === 'button') {
        el.value = dict[key];
      } else {
        const icon = el.querySelector('.icon') || el.querySelector('svg');
        if (icon) {
          for (let node of el.childNodes) {
            if (node.nodeType === Node.TEXT_NODE && node.nodeValue.trim() !== '') {
              node.nodeValue = ' ' + dict[key];
              break;
            }
          }
        } else {
          const innerSvg = el.querySelector('svg');
          if (innerSvg) {
            for (let node of [...el.childNodes]) {
              if (node.nodeType === Node.TEXT_NODE) {
                node.remove();
              }
            }
            el.appendChild(document.createTextNode(' ' + dict[key]));
          } else {
            const valLabel = el.querySelector('.color-value-label');
            if (valLabel) {
              const spanLabel = el.querySelector('span:first-child');
              if (spanLabel) {
                spanLabel.textContent = dict[key];
              }
            } else {
              el.textContent = dict[key];
            }
          }
        }
      }
    }
  });

  // Keep floating button aria-label updated
  const btnFloatingOpen = document.getElementById('btn-floating-open');
  if (btnFloatingOpen && dict.openCustomizer) {
    btnFloatingOpen.setAttribute('aria-label', dict.openCustomizer);
  }

  // Update input placeholder translation if key exists
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.dataset.i18nPlaceholder;
    if (dict[key]) {
      el.placeholder = dict[key];
    }
  });

  // Re-render saved styles list to update locale text (e.g. empty message)
  renderSavedStyles();
}

// --- Saved Styles Management ---

function getSavedStyles() {
  const str = localStorage.getItem('remodel3d_saved_styles');
  try {
    return str ? JSON.parse(str) : [];
  } catch (e) {
    return [];
  }
}

function saveStyle(name) {
  const styles = getSavedStyles();
  const newStyle = {
    id: 'style_' + Date.now(),
    name: name || 'Custom Style',
    colors: { ...state.colors },
    timeOfDay: state.timeOfDay,
    enableShadows: renderer.shadowMap.enabled
  };
  styles.push(newStyle);
  localStorage.setItem('remodel3d_saved_styles', JSON.stringify(styles));
  renderSavedStyles();
}

function deleteStyle(id) {
  let styles = getSavedStyles();
  styles = styles.filter(s => s.id !== id);
  localStorage.setItem('remodel3d_saved_styles', JSON.stringify(styles));
  if (state.activePreset === id) {
    state.activePreset = 'custom';
  }
  renderSavedStyles();
}

function applyStyle(styleObj) {
  // Apply colors
  Object.keys(styleObj.colors).forEach(key => {
    const val = styleObj.colors[key];
    state.colors[key] = val;
    
    if (colorInputs[key]) colorInputs[key].value = val;
    if (colorLabels[key]) colorLabels[key].textContent = val.toUpperCase();
    
    if (materials[key]) {
      materials[key].color.set(val);
    }
  });

  // Apply time of day if present
  if (styleObj.timeOfDay) {
    state.timeOfDay = styleObj.timeOfDay;
    const timeButtons = document.querySelectorAll('.time-btn');
    timeButtons.forEach(btn => {
      if (btn.dataset.time === styleObj.timeOfDay) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
    updateLightingMode(styleObj.timeOfDay);
  }

  // Apply shadows toggle if present
  if (styleObj.enableShadows !== undefined) {
    const toggleShadows = document.getElementById('toggle-shadows');
    if (toggleShadows) {
      toggleShadows.checked = styleObj.enableShadows;
      renderer.shadowMap.enabled = styleObj.enableShadows;
      scene.traverse((node) => {
        if (node.isMesh) {
          node.castShadow = styleObj.enableShadows;
          node.receiveShadow = styleObj.enableShadows;
          if (node.material) {
            if (Array.isArray(node.material)) {
              node.material.forEach(m => m.needsUpdate = true);
            } else {
              node.material.needsUpdate = true;
            }
          }
        }
      });
    }
  }

  // Remove active state from preset cards because this is a custom style
  const presetCards = document.querySelectorAll('.preset-card');
  presetCards.forEach(c => c.classList.remove('active'));
}

function renderSavedStyles() {
  const container = document.getElementById('saved-styles-container');
  if (!container) return;

  const savedStyles = getSavedStyles();
  
  if (savedStyles.length === 0) {
    const lang = document.getElementById('select-language')?.value || 'en';
    const dict = translations[lang] || translations.en;
    container.innerHTML = `<div class="empty-saved-styles">${dict.noSavedStyles || 'No saved styles yet.'}</div>`;
    return;
  }

  container.innerHTML = '';
  savedStyles.forEach(style => {
    const card = document.createElement('div');
    card.className = 'saved-style-card';
    if (state.activePreset === style.id) {
      card.classList.add('active');
    }

    // Create dots for Side Wall, Front Facade, Balconies, Glass
    const dot1 = style.colors.leftWall || '#ffffff';
    const dot2 = style.colors.frontFacade || '#ffffff';
    const dot3 = style.colors.balconies || '#ffffff';
    const dot4 = style.colors.glass || '#ffffff';

    const timeLabel = style.timeOfDay ? style.timeOfDay.toUpperCase() : '';

    card.innerHTML = `
      <div class="saved-style-info">
        <div class="saved-style-palette">
          <div class="palette-dot" style="background-color: ${dot1};"></div>
          <div class="palette-dot" style="background-color: ${dot2};"></div>
          <div class="palette-dot" style="background-color: ${dot3};"></div>
          <div class="palette-dot" style="background-color: ${dot4};"></div>
        </div>
        <span class="saved-style-name">${escapeHtml(style.name)}</span>
      </div>
      <span class="saved-style-meta">${timeLabel}</span>
      <button class="btn-delete-style" aria-label="Delete style" data-id="${style.id}">&times;</button>
    `;

    // Click handler to load style
    card.addEventListener('click', (e) => {
      if (e.target.classList.contains('btn-delete-style')) return;
      applyStyle(style);
      state.activePreset = style.id;
      
      document.querySelectorAll('.preset-card').forEach(c => c.classList.remove('active'));
      document.querySelectorAll('.saved-style-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
    });

    // Delete handler
    const btnDelete = card.querySelector('.btn-delete-style');
    btnDelete.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteStyle(style.id);
    });

    container.appendChild(card);
  });
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

window.onload = init;
