import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// --- State Management ---
const state = {
  activePreset: 'modern-grey',
  timeOfDay: 'noon',
  rightAwningsEnabled: true,
  bunnyEnabled: false,
  motorbikeEnabled: false,
  colors: {
    leftWall: '#d39c82',
    leftWallDiagonal: '#d39c82',
    leftWallParallel: '#d39c82',
    frontFacade: '#d39c82',
    leftFacadeStrip: '#d39c82',
    rightFacadeStrip: '#d39c82',
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
  },
  lockedColors: {
    leftWall: false,
    leftWallDiagonal: false,
    leftWallParallel: false,
    frontFacade: false,
    leftFacadeStrip: false,
    rightFacadeStrip: false,
    rightWall: false,
    backWall: false,
    balconies: false,
    dividers: false,
    awnings: false,
    railings: false,
    frames: false,
    roof: false,
    roofFixtures: false,
    glass: false
  }
};

const presets = {
  'classic-peach': {
    leftWall: '#d39c82', // peach stucco
    leftWallDiagonal: '#d39c82',
    leftWallParallel: '#d39c82',
    frontFacade: '#d39c82',
    leftFacadeStrip: '#d39c82',
    rightFacadeStrip: '#d39c82',
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
    leftWallDiagonal: '#e5e5e5',
    leftWallParallel: '#e5e5e5',
    frontFacade: '#e0e0e0',
    leftFacadeStrip: '#e5e5e5',
    rightFacadeStrip: '#e5e5e5',
    rightWall: '#e5e5e5',
    backWall: '#e5e5e5',
    balconies: '#d0d0d0',
    dividers: '#d0d0d0',
    awnings: '#1b6e4e',
    railings: '#3a3a3a',
    frames: '#2a2a2a',
    roof: '#d0d0d0',
    roofFixtures: '#ffffff',
    glass: '#8ab4f8'
  },
  'nordic-wood': {
    leftWall: '#1e2022', // slate/basalt black
    leftWallDiagonal: '#1e2022',
    leftWallParallel: '#1e2022',
    frontFacade: '#f2efe9', // chalk white
    leftFacadeStrip: '#1e2022',
    rightFacadeStrip: '#1e2022',
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
    leftWallDiagonal: '#ded7c9',
    leftWallParallel: '#ded7c9',
    frontFacade: '#e9dfcf',
    leftFacadeStrip: '#ded7c9',
    rightFacadeStrip: '#ded7c9',
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
    leftWallDiagonal: '#fcd116',
    leftWallParallel: '#fcd116',
    frontFacade: '#fcd116',
    leftFacadeStrip: '#fcd116',
    rightFacadeStrip: '#fcd116',
    rightWall: '#fcd116',
    backWall: '#fcd116',
    balconies: '#da121a',
    dividers: '#da121a',
    awnings: '#da121a',
    railings: '#0055a5',
    frames: '#ffffff',
    roof: '#fcd116',
    roofFixtures: '#0055a5',
    glass: '#8ab4f8'
  }
};

// --- Three.js Globals ---
let scene, camera, renderer, controls;
let sunLight, hemiLight, ambientLight, streetLampLight;
let materials = {};
let buildingGroup;
let bunnyMesh;
let scooterMesh;
const bunnyBaseY = 4.55;
let bunnyLastCameraMoveTime = 0;
let bunnyJumpProgress = 1.0;
let bunnyJumpStartTime = 0;
const bunnyJumpDuration = 350; // milliseconds for a quick snappy jump
let bunnyCurrentX = 2.1;
let bunnyCurrentZ = 6.2;
let bunnyTargetX = 2.1;
let bunnyTargetZ = 6.2;
let bunnyParticles = [];
let bunnyAction = null;
let bunnyActionStartTime = 0;
const bunnyActionDuration = 1500;
let peeGeo = null;
let poopGeo = null;
let bunnyActivatedTime = 0;
let bunnyFirstActionTriggered = false;
let bunnyLastActionType = 'poop'; // Alternates to guarantee both pee and poop spawn

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
  leftWallDiagonal: document.getElementById('color-left-wall-diagonal'),
  leftWallParallel: document.getElementById('color-left-wall-parallel'),
  frontFacade: document.getElementById('color-front-facade'),
  leftFacadeStrip: document.getElementById('color-left-facade-strip'),
  rightFacadeStrip: document.getElementById('color-right-facade-strip'),
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
  leftWallDiagonal: document.getElementById('val-left-wall-diagonal'),
  leftWallParallel: document.getElementById('val-left-wall-parallel'),
  frontFacade: document.getElementById('val-front-facade'),
  leftFacadeStrip: document.getElementById('val-left-facade-strip'),
  rightFacadeStrip: document.getElementById('val-right-facade-strip'),
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
  materials.leftWallDiagonal = new THREE.MeshStandardMaterial({ color: 0xd39c82, roughness: 0.8, metalness: 0.0, side: THREE.DoubleSide });
  materials.leftWallParallel = new THREE.MeshStandardMaterial({ color: 0xd39c82, roughness: 0.8, metalness: 0.0, side: THREE.DoubleSide });
  materials.rightWall = new THREE.MeshStandardMaterial({ color: 0xd39c82, roughness: 0.8, metalness: 0.0, side: THREE.DoubleSide });
  materials.backWall = new THREE.MeshStandardMaterial({ color: 0xd39c82, roughness: 0.8, metalness: 0.0, side: THREE.DoubleSide });
  materials.frontFacade = new THREE.MeshStandardMaterial({ color: 0xd39c82, roughness: 0.75, metalness: 0.0, side: THREE.DoubleSide });
  materials.leftFacadeStrip = new THREE.MeshStandardMaterial({ color: 0xd39c82, roughness: 0.8, metalness: 0.0, side: THREE.DoubleSide });
  materials.rightFacadeStrip = new THREE.MeshStandardMaterial({ color: 0xd39c82, roughness: 0.8, metalness: 0.0, side: THREE.DoubleSide });
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

// --- Color Conversion Helpers ---
function hexToHsl(hex) {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);

  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { h: 0, s: 0, l: 0 };
  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

function hslToHex(h, s, l) {
  s /= 100;
  l /= 100;
  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    r = hue2rgb(p, q, h / 360 + 1/3);
    g = hue2rgb(p, q, h / 360);
    b = hue2rgb(p, q, h / 360 - 1/3);
  }

  const toHex = x => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// --- Helpers for Bunny droppings ---
function getLandingHeight(x, z) {
  // 1st floor balcony footprint:
  // X: [-4.3, 4.3], Z: [5.1, 7.27]
  if (x >= -4.3 && x <= 4.3 && z >= 5.1 && z <= 7.27) {
    return 4.55;
  }
  return 0.06; // slightly above walkway/ground to avoid clipping and z-fighting
}

function spawnPoop(spawnPos, shootDir, now) {
  if (!poopGeo) poopGeo = new THREE.SphereGeometry(0.035, 5, 5);
  const poopMat = new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 0.9, transparent: true, opacity: 1.0 });
  const poopMesh = new THREE.Mesh(poopGeo, poopMat);
  poopMesh.position.copy(spawnPos);
  poopMesh.castShadow = true;
  
  // Drop down with an outward push matching pee speed so it can clear the balcony railing
  const speed = 0.04 + Math.random() * 0.02;
  const velocity = shootDir.clone().multiplyScalar(speed);
  velocity.y = 0.04 + Math.random() * 0.03;
  
  scene.add(poopMesh);
  bunnyParticles.push({
    mesh: poopMesh,
    velocity: velocity,
    type: 'poop',
    state: 'falling',
    birthTime: now
  });
}

function resetPoopFlags() {
  window.poopSpawned200 = false;
  window.poopSpawned400 = false;
  window.poopSpawned600 = false;
  window.poopSpawned800 = false;
  window.poopSpawned1000 = false;
}

function clearBunnyParticles() {
  bunnyParticles.forEach(p => {
    scene.remove(p.mesh);
    // Note: Do not dispose p.mesh.geometry since they are shared global geometries (peeGeo / poopGeo)
    if (p.mesh.material) {
      if (Array.isArray(p.mesh.material)) p.mesh.material.forEach(m => m.dispose());
      else p.mesh.material.dispose();
    }
  });
  bunnyParticles = [];
  bunnyAction = null;
  bunnyActionStartTime = 0;
  resetPoopFlags();
  bunnyFirstActionTriggered = false;
  bunnyActivatedTime = 0;
}

// --- Helper: Create a cute procedural 3D Bunny ---
function createBunny() {
  const bunnyGroup = new THREE.Group();
  bunnyGroup.name = 'bunny';

  const bunnyMat = new THREE.MeshStandardMaterial({
    color: 0x9c9c9c,
    roughness: 0.9,
    metalness: 0.0
  });
  const pinkMat = new THREE.MeshStandardMaterial({
    color: 0xffb6c1, // light pink
    roughness: 0.8,
    metalness: 0.0
  });

  // Body
  const bodyGeo = new THREE.SphereGeometry(0.2, 16, 16);
  const body = new THREE.Mesh(bodyGeo, bunnyMat);
  body.scale.set(1.0, 0.85, 1.3);
  body.position.set(0, 0.16, 0);
  body.castShadow = true;
  body.receiveShadow = true;
  bunnyGroup.add(body);

  // Head
  const headGeo = new THREE.SphereGeometry(0.13, 16, 16);
  const head = new THREE.Mesh(headGeo, bunnyMat);
  head.position.set(0, 0.28, 0.18);
  head.castShadow = true;
  bunnyGroup.add(head);

  // Ears
  const earGeo = new THREE.SphereGeometry(0.04, 8, 16);
  
  // Left Ear
  const leftEar = new THREE.Mesh(earGeo, bunnyMat);
  leftEar.name = 'leftEar';
  leftEar.scale.set(1, 3.5, 1);
  leftEar.position.set(-0.06, 0.45, 0.15);
  leftEar.rotation.set(-0.2, 0, 0.1);
  leftEar.castShadow = true;
  bunnyGroup.add(leftEar);
  
  const leftEarInner = new THREE.Mesh(earGeo, pinkMat);
  leftEarInner.name = 'leftEarInner';
  leftEarInner.scale.set(0.7, 2.5, 0.7);
  leftEarInner.position.set(-0.06, 0.43, 0.17);
  leftEarInner.rotation.set(-0.2, 0, 0.1);
  bunnyGroup.add(leftEarInner);

  // Right Ear
  const rightEar = new THREE.Mesh(earGeo, bunnyMat);
  rightEar.name = 'rightEar';
  rightEar.scale.set(1, 3.5, 1);
  rightEar.position.set(0.06, 0.45, 0.15);
  rightEar.rotation.set(-0.2, 0, -0.1);
  rightEar.castShadow = true;
  bunnyGroup.add(rightEar);

  const rightEarInner = new THREE.Mesh(earGeo, pinkMat);
  rightEarInner.name = 'rightEarInner';
  rightEarInner.scale.set(0.7, 2.5, 0.7);
  rightEarInner.position.set(0.06, 0.43, 0.17);
  rightEarInner.rotation.set(-0.2, 0, -0.1);
  bunnyGroup.add(rightEarInner);

  // Tail
  const tailGeo = new THREE.SphereGeometry(0.05, 8, 8);
  const tail = new THREE.Mesh(tailGeo, bunnyMat);
  tail.position.set(0, 0.18, -0.22);
  tail.castShadow = true;
  bunnyGroup.add(tail);

  // Eyes (black beads, adjusted to protrude outside head sphere)
  const eyeGeo = new THREE.SphereGeometry(0.018, 8, 8);
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
  
  const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
  leftEye.position.set(-0.08, 0.31, 0.28);
  bunnyGroup.add(leftEye);

  const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
  rightEye.position.set(0.08, 0.31, 0.28);
  bunnyGroup.add(rightEye);

  // Nose (tiny pink sphere, adjusted to protrude outside head sphere)
  const noseGeo = new THREE.SphereGeometry(0.015, 8, 8);
  const nose = new THREE.Mesh(noseGeo, pinkMat);
  nose.position.set(0, 0.27, 0.31);
  bunnyGroup.add(nose);

  // Feet
  const footGeo = new THREE.SphereGeometry(0.05, 8, 8);
  
  // Front feet
  const flFoot = new THREE.Mesh(footGeo, bunnyMat);
  flFoot.scale.set(1, 0.6, 1.5);
  flFoot.position.set(-0.07, 0.03, 0.15);
  bunnyGroup.add(flFoot);
  
  const frFoot = new THREE.Mesh(footGeo, bunnyMat);
  frFoot.scale.set(1, 0.6, 1.5);
  frFoot.position.set(0.07, 0.03, 0.15);
  bunnyGroup.add(frFoot);

  // Back feet
  const blFoot = new THREE.Mesh(footGeo, bunnyMat);
  blFoot.scale.set(1.2, 0.8, 1.8);
  blFoot.position.set(-0.09, 0.04, -0.1);
  bunnyGroup.add(blFoot);
  
  const brFoot = new THREE.Mesh(footGeo, bunnyMat);
  brFoot.scale.set(1.2, 0.8, 1.8);
  brFoot.position.set(0.09, 0.04, -0.1);
  bunnyGroup.add(brFoot);

  return bunnyGroup;
}

// --- Helper: Create a Green Roll-up Awning ---
function createAwning(ySlabUnderside, xCenter, width, projD, bD) {
  const awningGroup = new THREE.Group();

  // Awning Box (casing)
  const awningBoxGeo = new THREE.BoxGeometry(width, 0.15, 0.15);
  const awningBox = new THREE.Mesh(awningBoxGeo, materials.awnings);
  const boxY = ySlabUnderside - 0.075;
  const boxZ = bD / 2 + projD - 0.325; // Shifted back by 25cm to connect to the ceiling above
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

// --- Procedural 3D Classic Honda CB350 Motorbike Builder ---
function createScooter() {
  const scooter = new THREE.Group();
  scooter.name = 'scooter'; // Keep name for preset/saved style reference compatibility

  // Materials
  const bodyGreyMat = new THREE.MeshStandardMaterial({ color: 0x8a929b, roughness: 0.15, metalness: 0.85 }); // metallic gunmetal grey bodywork
  const darkMetalMat = new THREE.MeshStandardMaterial({ color: 0x242528, roughness: 0.5, metalness: 0.7 }); // matte dark steel frame/engine parts
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.05, metalness: 1.0 }); // high-gloss chrome highlights
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x1c1c1c, roughness: 0.9, metalness: 0.0 }); // rubber tires
  const seatMat = new THREE.MeshStandardMaterial({ color: 0x3d2723, roughness: 0.85, metalness: 0.0 }); // rich brown leather seat
  const seatTrimMat = new THREE.MeshStandardMaterial({ color: 0x2d1b18, roughness: 0.9, metalness: 0.0 }); // darker leather piping
  const redMat = new THREE.MeshStandardMaterial({ color: 0xdd1111, roughness: 0.2, metalness: 0.1 }); // red lights/reflectors
  const basicRedMat = new THREE.MeshBasicMaterial({ color: 0xff1111 }); // glowing brake light
  const headlightLensMat = new THREE.MeshBasicMaterial({ color: 0xfffee0 }); // headlight glowing lens
  const indicatorLensMat = new THREE.MeshBasicMaterial({ color: 0xff9800 }); // amber lenses
  const screenMat = new THREE.MeshBasicMaterial({ color: 0x80deea }); // cyan digital instruments
  const glassMat = new THREE.MeshStandardMaterial({ color: 0xe0f7fa, transparent: true, opacity: 0.4, roughness: 0.1, metalness: 0.9 }); // mirrors / windshield
  const blackMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.65, metalness: 0.05 }); // matte black plastic

  // Dimensions & Scale normalization:
  // Standard motorbike length ~ 1.8m. Front axle Z = -0.6, Rear axle Z = 0.6.
  // Wheel radius ~ 0.28 (17 inch wheels), width ~ 0.08.
  
  // 1. Double Cradle Frame (Exposed tubes cradling the engine and supporting seat/forks)
  const frameGroup = new THREE.Group();
  
  const tubeGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.7, 8);
  const leftRail = new THREE.Mesh(tubeGeo, darkMetalMat);
  leftRail.position.set(-0.08, 0.35, -0.1);
  leftRail.rotation.x = 0.2; // angled slightly
  
  const rightRail = new THREE.Mesh(tubeGeo, darkMetalMat);
  rightRail.position.set(0.08, 0.35, -0.1);
  rightRail.rotation.x = 0.2;
  
  const bottomRailGeo = new THREE.CylinderGeometry(0.014, 0.014, 0.8, 8);
  bottomRailGeo.rotateX(Math.PI / 2);
  const leftBottomRail = new THREE.Mesh(bottomRailGeo, darkMetalMat);
  leftBottomRail.position.set(-0.08, 0.18, 0.05);
  const rightBottomRail = new THREE.Mesh(bottomRailGeo, darkMetalMat);
  rightBottomRail.position.set(0.08, 0.18, 0.05);
  
  const backboneGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.65, 8);
  backboneGeo.rotateX(Math.PI / 2);
  const backbone = new THREE.Mesh(backboneGeo, darkMetalMat);
  backbone.position.set(0, 0.6, -0.1);

  // Rear swingarm
  const swingarmGeo = new THREE.BoxGeometry(0.2, 0.03, 0.55);
  const swingarm = new THREE.Mesh(swingarmGeo, darkMetalMat);
  swingarm.position.set(0, 0.28, 0.3);
  
  frameGroup.add(leftRail, rightRail, leftBottomRail, rightBottomRail, backbone, swingarm);
  scooter.add(frameGroup);

  // 2. Front Suspension Telescopic Forks (Classic angled fork with rubber boots)
  const forkGroup = new THREE.Group();
  forkGroup.position.set(0, 0.55, -0.48);
  forkGroup.rotation.x = -0.32; // classic fork rake angle (~18 degrees)

  const innerForkGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.72, 8);
  const leftForkInner = new THREE.Mesh(innerForkGeo, chromeMat);
  leftForkInner.position.set(-0.1, 0.1, 0);
  const rightForkInner = new THREE.Mesh(innerForkGeo, chromeMat);
  rightForkInner.position.set(0.1, 0.1, 0);
  forkGroup.add(leftForkInner, rightForkInner);

  // Lower fork legs (sliders) in dark metal
  const outerForkGeo = new THREE.CylinderGeometry(0.024, 0.024, 0.38, 8);
  const leftForkOuter = new THREE.Mesh(outerForkGeo, darkMetalMat);
  leftForkOuter.position.set(-0.1, -0.18, 0);
  const rightForkOuter = new THREE.Mesh(outerForkGeo, darkMetalMat);
  rightForkOuter.position.set(0.1, -0.18, 0);
  forkGroup.add(leftForkOuter, rightForkOuter);

  // Rubber fork gaiters (accordion boots) for classic details
  const bootTorusGeo = new THREE.TorusGeometry(0.025, 0.007, 8, 16);
  bootTorusGeo.rotateX(Math.PI / 2);
  for (let i = 0; i < 5; i++) {
    const yOffset = -0.05 + i * 0.03;
    const bootL = new THREE.Mesh(bootTorusGeo, blackMat);
    bootL.position.set(-0.1, yOffset, 0);
    const bootR = new THREE.Mesh(bootTorusGeo, blackMat);
    bootR.position.set(0.1, yOffset, 0);
    forkGroup.add(bootL, bootR);
  }

  // Triple clamps (Upper and Lower steering yoke)
  const clampGeo = new THREE.BoxGeometry(0.24, 0.025, 0.06);
  const lowerClamp = new THREE.Mesh(clampGeo, darkMetalMat);
  lowerClamp.position.set(0, 0.32, 0);
  const upperClamp = new THREE.Mesh(clampGeo, chromeMat);
  upperClamp.position.set(0, 0.44, 0);
  forkGroup.add(lowerClamp, upperClamp);
  
  scooter.add(forkGroup);

  // 3. Wheels & Brake Systems (Classic 17" spoke wheels with detailed discs and calipers)
  const tireGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.08, 20);
  tireGeo.rotateZ(Math.PI / 2); // Axle along X-axis, wheels face forward
  const rimGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.084, 16);
  rimGeo.rotateZ(Math.PI / 2);
  
  // Spokes (Grid of thin spokes radiating in the YZ plane)
  const spokeGeo = new THREE.CylinderGeometry(0.003, 0.003, 0.21, 6);
  
  // Brake Discs and Calipers (YZ plane alignment)
  const brakeDiscGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.008, 16);
  brakeDiscGeo.rotateZ(Math.PI / 2);
  const caliperGeo = new THREE.BoxGeometry(0.04, 0.07, 0.05);

  // --- Front Wheel Assembly ---
  const frontWheelGroup = new THREE.Group();
  frontWheelGroup.position.set(0, 0.28, -0.6); // Front axle
  
  const frontTire = new THREE.Mesh(tireGeo, tireMat);
  const frontRim = new THREE.Mesh(rimGeo, chromeMat);
  frontWheelGroup.add(frontTire, frontRim);

  // 16 radial spokes crossing at angles in the YZ plane of the wheel
  for (let i = 0; i < 16; i++) {
    const spoke = new THREE.Mesh(spokeGeo, chromeMat);
    spoke.rotation.x = i * (Math.PI * 2 / 16);
    spoke.position.x = (i % 2 === 0 ? 0.015 : -0.015); // cross lacing
    frontWheelGroup.add(spoke);
  }

  // Front brake disc
  const frontBrakeDisc = new THREE.Mesh(brakeDiscGeo, chromeMat);
  frontBrakeDisc.position.set(0.045, 0, 0); // mounted on the right side
  const frontCaliper = new THREE.Mesh(caliperGeo, redMat);
  frontCaliper.position.set(0.055, 0.11, -0.09); // clamped
  frontWheelGroup.add(frontBrakeDisc, frontCaliper);

  scooter.add(frontWheelGroup);

  // --- Rear Wheel Assembly ---
  const rearWheelGroup = new THREE.Group();
  rearWheelGroup.position.set(0, 0.28, 0.6); // Rear axle
  
  const rearTire = new THREE.Mesh(tireGeo, tireMat);
  const rearRim = new THREE.Mesh(rimGeo, chromeMat);
  rearWheelGroup.add(rearTire, rearRim);

  // 16 radial spokes in the YZ plane
  for (let i = 0; i < 16; i++) {
    const spoke = new THREE.Mesh(spokeGeo, chromeMat);
    spoke.rotation.x = i * (Math.PI * 2 / 16);
    spoke.position.x = (i % 2 === 0 ? 0.015 : -0.015);
    rearWheelGroup.add(spoke);
  }

  // Rear brake disc & caliper
  const rearBrakeDisc = new THREE.Mesh(brakeDiscGeo, chromeMat);
  rearBrakeDisc.position.set(-0.045, 0, 0); // mounted on the left side
  const rearCaliper = new THREE.Mesh(caliperGeo, redMat);
  rearCaliper.position.set(-0.055, 0.11, 0.09);
  rearWheelGroup.add(rearBrakeDisc, rearCaliper);

  // Rear Drive Sprocket & Chain
  const sprocketGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.015, 12);
  sprocketGeo.rotateZ(Math.PI / 2);
  const sprocket = new THREE.Mesh(sprocketGeo, darkMetalMat);
  sprocket.position.set(0.045, 0, 0); // right side drive
  
  const chainGeo = new THREE.BoxGeometry(0.01, 0.02, 0.65);
  const topChain = new THREE.Mesh(chainGeo, darkMetalMat);
  topChain.position.set(0.045, 0.09, -0.3);
  const bottomChain = new THREE.Mesh(chainGeo, darkMetalMat);
  bottomChain.position.set(0.045, -0.09, -0.3);
  rearWheelGroup.add(sprocket, topChain, bottomChain);

  scooter.add(rearWheelGroup);

  // 4. Detailed Exposed Engine Block (350cc Single Cylinder with horizontal cooling fins)
  const engineGroup = new THREE.Group();
  engineGroup.position.set(0, 0.36, -0.08);

  // Engine Crankcase (center bottom)
  const crankcaseGeo = new THREE.BoxGeometry(0.22, 0.18, 0.28);
  const crankcase = new THREE.Mesh(crankcaseGeo, darkMetalMat);
  engineGroup.add(crankcase);

  // Chrome left & right covers
  const coverGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.04, 12);
  coverGeo.rotateZ(Math.PI / 2);
  const leftCover = new THREE.Mesh(coverGeo, chromeMat);
  leftCover.position.set(-0.115, 0.01, 0);
  const rightCover = new THREE.Mesh(coverGeo, chromeMat);
  rightCover.position.set(0.115, 0.01, 0);
  engineGroup.add(leftCover, rightCover);

  // Cylinder block (vertical engine barrel, angled forward at -0.1 rad)
  const cylinderGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.2, 10);
  const cylinder = new THREE.Mesh(cylinderGeo, darkMetalMat);
  cylinder.position.set(0, 0.16, -0.03);
  cylinder.rotation.x = -0.1;
  engineGroup.add(cylinder);

  // Cylinder cooling fins (stacked horizontal plates for maximum details)
  const finGeo = new THREE.BoxGeometry(0.16, 0.01, 0.16);
  for (let i = 0; i < 7; i++) {
    const fin = new THREE.Mesh(finGeo, darkMetalMat);
    fin.position.set(0, 0.08 + i * 0.024, -0.03);
    fin.rotation.x = -0.1;
    engineGroup.add(fin);
  }

  // Spark plug cap & wire (red cable, chrome plug)
  const plugGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.03, 8);
  const sparkPlug = new THREE.Mesh(plugGeo, chromeMat);
  sparkPlug.position.set(0, 0.27, -0.04);
  
  const wireGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.18, 8);
  wireGeo.rotateX(Math.PI / 2);
  const sparkWire = new THREE.Mesh(wireGeo, redMat);
  sparkWire.position.set(-0.04, 0.22, -0.08);
  engineGroup.add(sparkPlug, sparkWire);

  // Carburetor & Air Intake pipe (facing Z-back)
  const intakeGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.08, 8);
  intakeGeo.rotateX(Math.PI / 2);
  const intake = new THREE.Mesh(intakeGeo, chromeMat);
  intake.position.set(0, 0.18, 0.1);
  const carbGeo = new THREE.BoxGeometry(0.06, 0.06, 0.06);
  const carb = new THREE.Mesh(carbGeo, darkMetalMat);
  carb.position.set(0, 0.18, 0.14);
  engineGroup.add(intake, carb);

  scooter.add(engineGroup);

  // 5. Megaphone Exhaust Muffler System (Right Side chrome pipe curving from engine)
  const exhaustGroup = new THREE.Group();
  
  // Header pipe coming from front of cylinder, curving down
  const headerPipeGeo1 = new THREE.CylinderGeometry(0.022, 0.022, 0.26, 8);
  const headerPart1 = new THREE.Mesh(headerPipeGeo1, chromeMat);
  headerPart1.position.set(0.12, 0.38, -0.18);
  headerPart1.rotation.x = 0.5; // angled down-forward
  
  const headerPipeGeo2 = new THREE.CylinderGeometry(0.022, 0.022, 0.45, 8);
  headerPipeGeo2.rotateX(Math.PI / 2);
  const headerPart2 = new THREE.Mesh(headerPipeGeo2, chromeMat);
  headerPart2.position.set(0.12, 0.2, -0.1);
  
  // Megaphone Muffler (flaring cylinder running to back right)
  const mufflerGeo = new THREE.CylinderGeometry(0.022, 0.048, 0.6, 12);
  mufflerGeo.rotateX(Math.PI / 2);
  const muffler = new THREE.Mesh(mufflerGeo, chromeMat);
  muffler.position.set(0.18, 0.26, 0.38);
  muffler.rotation.x = -0.1; // angled slightly upward
  
  // Dark end-cap tip
  const mufflerTipGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.01, 8);
  mufflerTipGeo.rotateX(Math.PI / 2);
  const mufflerTip = new THREE.Mesh(mufflerTipGeo, darkMetalMat);
  mufflerTip.position.set(0, 0, 0.3); // relative to muffler
  muffler.add(mufflerTip);

  // Chrome heat shield plate
  const heatShieldGeo = new THREE.BoxGeometry(0.01, 0.04, 0.35);
  const heatShield = new THREE.Mesh(heatShieldGeo, chromeMat);
  heatShield.position.set(0.04, 0.015, -0.05); // side of muffler
  muffler.add(heatShield);

  exhaustGroup.add(headerPart1, headerPart2, muffler);
  scooter.add(exhaustGroup);

  // 6. Fuel Tank (Beautiful teardrop motorcycle fuel tank sitting between seat and forks)
  const tankGroup = new THREE.Group();
  tankGroup.position.set(0, 0.68, -0.18);

  const tankFront = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 16), bodyGreyMat);
  tankFront.scale.set(1.0, 0.9, 1.0);
  tankFront.position.set(0, 0, -0.14);
  
  const tankBack = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.09, 0.3, 16), bodyGreyMat);
  tankBack.rotation.x = Math.PI / 2;
  tankBack.scale.set(1.0, 1.0, 0.9);
  tankBack.position.set(0, -0.015, 0.05);
  
  // Rubber knee pads (Classic styling details on the sides)
  const padGeo = new THREE.BoxGeometry(0.01, 0.12, 0.18);
  const leftPad = new THREE.Mesh(padGeo, blackMat);
  leftPad.position.set(-0.15, -0.02, -0.04);
  leftPad.rotation.y = 0.2;
  const rightPad = new THREE.Mesh(padGeo, blackMat);
  rightPad.position.set(0.15, -0.02, -0.04);
  rightPad.rotation.y = -0.2;
  
  // Chrome gas cap
  const capGeo = new THREE.CylinderGeometry(0.038, 0.038, 0.015, 10);
  const gasCap = new THREE.Mesh(capGeo, chromeMat);
  gasCap.position.set(0.05, 0.13, -0.12); // offset to right-top
  gasCap.rotation.z = -0.1;

  tankGroup.add(tankFront, tankBack, leftPad, rightPad, gasCap);
  scooter.add(tankGroup);

  // 7. Ribbed Leather Seat & cowls (Dark brown leather saddle with ribbed ridges)
  const seatGroup = new THREE.Group();
  seatGroup.position.set(0, 0.66, 0.2);

  const mainSeatGeo = new THREE.BoxGeometry(0.18, 0.08, 0.46);
  const mainSeat = new THREE.Mesh(mainSeatGeo, seatMat);
  mainSeat.castShadow = true;
  seatGroup.add(mainSeat);

  // 6 horizontal seat ribs (stitching ridges) in dark leather
  const ribGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.176, 8);
  ribGeo.rotateZ(Math.PI / 2);
  for (let i = 0; i < 6; i++) {
    const zOffset = -0.18 + i * 0.07;
    const rib = new THREE.Mesh(ribGeo, seatTrimMat);
    rib.position.set(0, 0.042, zOffset);
    seatGroup.add(rib);
  }

  // Rear seat grab rail (chrome tube looping around the seat back)
  const railTubeGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.2, 8);
  const leftRailT = new THREE.Mesh(railTubeGeo, chromeMat);
  leftRailT.position.set(-0.1, 0.05, 0.18);
  const rightRailT = new THREE.Mesh(railTubeGeo, chromeMat);
  rightRailT.position.set(0.1, 0.05, 0.18);
  
  const backLoopGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.2, 8);
  backLoopGeo.rotateZ(Math.PI / 2);
  const backLoop = new THREE.Mesh(backLoopGeo, chromeMat);
  backLoop.position.set(0, 0.1, 0.24);
  seatGroup.add(leftRailT, rightRailT, backLoop);

  scooter.add(seatGroup);

  // 8. Fenders (Mudguards - hugging the wheels)
  // Front Fender (curves over front wheel)
  const frontFenderGeo = new THREE.BoxGeometry(0.13, 0.02, 0.44);
  const frontFender = new THREE.Mesh(frontFenderGeo, bodyGreyMat);
  frontFender.position.set(0, 0.48, -0.68);
  frontFender.rotation.x = -0.38; // matches wheel curve
  scooter.add(frontFender);

  // Rear Fender (curves over rear wheel)
  const rearFenderGeo = new THREE.BoxGeometry(0.15, 0.02, 0.55);
  const rearFender = new THREE.Mesh(rearFenderGeo, bodyGreyMat);
  rearFender.position.set(0, 0.48, 0.68);
  rearFender.rotation.x = 0.38;
  scooter.add(rearFender);

  // 9. Side covers / Battery cover (Grey panels under the seat with chrome emblem)
  const leftCoverPanelGeo = new THREE.BoxGeometry(0.03, 0.16, 0.24);
  const leftPanel = new THREE.Mesh(leftCoverPanelGeo, bodyGreyMat);
  leftPanel.position.set(-0.11, 0.52, 0.12);
  
  const rightPanel = new THREE.Mesh(leftCoverPanelGeo, bodyGreyMat);
  rightPanel.position.set(0.11, 0.52, 0.12);

  // Emblems
  const emblemGeo = new THREE.BoxGeometry(0.008, 0.03, 0.08);
  const leftEmblem = new THREE.Mesh(emblemGeo, chromeMat);
  leftEmblem.position.set(-0.116, 0.52, 0.12);
  const rightEmblem = new THREE.Mesh(emblemGeo, chromeMat);
  rightEmblem.position.set(0.116, 0.52, 0.12);

  scooter.add(leftPanel, rightPanel, leftEmblem, rightEmblem);

  // 10. Rider Footpegs, Shifter, Kickstand
  const footpegGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.08, 8);
  footpegGeo.rotateZ(Math.PI / 2);
  
  const leftPeg = new THREE.Mesh(footpegGeo, blackMat);
  leftPeg.position.set(-0.16, 0.24, 0.02);
  const rightPeg = new THREE.Mesh(footpegGeo, blackMat);
  rightPeg.position.set(0.16, 0.24, 0.02);
  
  const pegBarGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.36, 8);
  pegBarGeo.rotateZ(Math.PI / 2);
  const pegBar = new THREE.Mesh(pegBarGeo, chromeMat);
  pegBar.position.set(0, 0.24, 0.02);
  
  scooter.add(leftPeg, rightPeg, pegBar);

  // Kickstand (mounted on left side, tilted)
  const standGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.32, 8);
  const kickstand = new THREE.Mesh(standGeo, darkMetalMat);
  kickstand.position.set(-0.12, 0.16, 0.02);
  kickstand.rotation.z = 0.55; // tilted out
  kickstand.rotation.x = 0.2;
  scooter.add(kickstand);

  // 11. Handlebars, Cockpit Gauges, Windshield (Classic cruiser bars & round twin dials)
  const handlebarGroup = new THREE.Group();
  handlebarGroup.position.set(0, 0.98, -0.32); // mounted at top of forks

  // Main chrome riser bar
  const mainBarGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.44, 8);
  mainBarGeo.rotateZ(Math.PI / 2);
  const handlebar = new THREE.Mesh(mainBarGeo, chromeMat);
  handlebarGroup.add(handlebar);

  // Grips
  const gripGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.09, 8);
  gripGeo.rotateZ(Math.PI / 2);
  const leftGrip = new THREE.Mesh(gripGeo, tireMat);
  leftGrip.position.set(-0.21, 0, 0);
  const rightGrip = new THREE.Mesh(gripGeo, tireMat);
  rightGrip.position.set(0.21, 0, 0);
  handlebarGroup.add(leftGrip, rightGrip);

  // Brake & Clutch Levers (chrome details)
  const leverGeo = new THREE.BoxGeometry(0.08, 0.008, 0.008);
  leverGeo.rotateY(0.25);
  const frontBrakeLever = new THREE.Mesh(leverGeo, chromeMat);
  frontBrakeLever.position.set(0.16, -0.01, -0.03);
  const clutchLever = new THREE.Mesh(leverGeo, chromeMat);
  clutchLever.position.set(-0.16, -0.01, -0.03);
  handlebarGroup.add(frontBrakeLever, clutchLever);

  // Twin Classic Round Instruments (Speedometer and Tachometer)
  const gaugeGeo = new THREE.CylinderGeometry(0.032, 0.032, 0.038, 8);
  gaugeGeo.rotateX(-0.4); // angled towards rider
  
  const leftGauge = new THREE.Mesh(gaugeGeo, chromeMat);
  leftGauge.position.set(-0.045, 0.04, 0.02);
  const leftGaugeFace = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.005, 8), screenMat);
  leftGaugeFace.position.set(0, 0.02, 0.008);
  leftGaugeFace.rotation.x = -0.4;
  leftGauge.add(leftGaugeFace);
  
  const rightGauge = new THREE.Mesh(gaugeGeo, chromeMat);
  rightGauge.position.set(0.045, 0.04, 0.02);
  const rightGaugeFace = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.005, 8), screenMat);
  rightGaugeFace.position.set(0, 0.02, 0.008);
  rightGaugeFace.rotation.x = -0.4;
  rightGauge.add(rightGaugeFace);
  
  handlebarGroup.add(leftGauge, rightGauge);

  // Classic Round Mirrors (Chrome backings on curved stems)
  const stemGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.16, 8);
  const leftStem = new THREE.Mesh(stemGeo, chromeMat);
  leftStem.position.set(-0.15, 0.09, 0.02);
  leftStem.rotation.z = -0.3;
  leftStem.rotation.y = 0.25;
  const leftMirrorHead = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.015, 12), chromeMat);
  leftMirrorHead.rotateX(Math.PI / 2);
  leftMirrorHead.position.set(-0.19, 0.16, 0.04);
  const leftMirrorGlass = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.005, 12), glassMat);
  leftMirrorGlass.rotateX(Math.PI / 2);
  leftMirrorGlass.position.set(-0.19, 0.16, 0.032);
  handlebarGroup.add(leftStem, leftMirrorHead, leftMirrorGlass);

  const rightStem = new THREE.Mesh(stemGeo, chromeMat);
  rightStem.position.set(0.15, 0.09, 0.02);
  rightStem.rotation.z = 0.3;
  rightStem.rotation.y = -0.25;
  const rightMirrorHead = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.015, 12), chromeMat);
  rightMirrorHead.rotateX(Math.PI / 2);
  rightMirrorHead.position.set(0.19, 0.16, 0.04);
  const rightMirrorGlass = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.005, 12), glassMat);
  rightMirrorGlass.rotateX(Math.PI / 2);
  rightMirrorGlass.position.set(0.19, 0.16, 0.032);
  handlebarGroup.add(rightStem, rightMirrorHead, rightMirrorGlass);

  // Sleek windscreen above dials
  const screenGeo = new THREE.BoxGeometry(0.24, 0.18, 0.015);
  const windscreen = new THREE.Mesh(screenGeo, glassMat);
  windscreen.position.set(0, 0.15, -0.05);
  windscreen.rotation.x = -0.25;
  handlebarGroup.add(windscreen);

  scooter.add(handlebarGroup);

  // 12. Lights & Signals (Round classic chrome headlight, tail light, indicators)
  // Round Headlight (mounted in front of triple clamps)
  const headlightBucket = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.1, 12), chromeMat);
  headlightBucket.rotateX(Math.PI / 2);
  headlightBucket.position.set(0, 0.88, -0.45);
  
  const headlightLens = new THREE.Mesh(new THREE.CylinderGeometry(0.076, 0.076, 0.01, 12), headlightLensMat);
  headlightLens.rotateX(Math.PI / 2);
  headlightLens.position.set(0, 0, -0.052); // relative to bucket
  headlightBucket.add(headlightLens);
  scooter.add(headlightBucket);

  // Front indicators (Left & Right round orange indicators)
  const indicatorHousingGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.03, 8);
  indicatorHousingGeo.rotateZ(Math.PI / 2);
  const indicatorLensGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.01, 8);
  indicatorLensGeo.rotateZ(Math.PI / 2);

  const frontLeftInd = new THREE.Mesh(indicatorHousingGeo, darkMetalMat);
  frontLeftInd.position.set(-0.18, 0.84, -0.44);
  const frontLeftLens = new THREE.Mesh(indicatorLensGeo, indicatorLensMat);
  frontLeftLens.position.set(-0.016, 0, 0);
  frontLeftInd.add(frontLeftLens);

  const frontRightInd = new THREE.Mesh(indicatorHousingGeo, darkMetalMat);
  frontRightInd.position.set(0.18, 0.84, -0.44);
  const frontRightLens = new THREE.Mesh(indicatorLensGeo, indicatorLensMat);
  frontRightLens.position.set(0.016, 0, 0);
  frontRightInd.add(frontRightLens);

  scooter.add(frontLeftInd, frontRightInd);

  // Rear tail light (mounted on rear fender)
  const tailLightGroup = new THREE.Group();
  tailLightGroup.position.set(0, 0.55, 0.88);
  
  const tailLightBracket = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, 0.04), chromeMat);
  const tailLightLens = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.03, 0.02), basicRedMat);
  tailLightLens.position.set(0, 0, 0.025);
  tailLightGroup.add(tailLightBracket, tailLightLens);
  scooter.add(tailLightGroup);

  // Rear indicators
  const rearLeftInd = new THREE.Mesh(indicatorHousingGeo, darkMetalMat);
  rearLeftInd.position.set(-0.16, 0.52, 0.8);
  const rearLeftLens = new THREE.Mesh(indicatorLensGeo, indicatorLensMat);
  rearLeftLens.position.set(-0.016, 0, 0);
  rearLeftInd.add(rearLeftLens);

  const rearRightInd = new THREE.Mesh(indicatorHousingGeo, darkMetalMat);
  rearRightInd.position.set(0.16, 0.52, 0.8);
  const rearRightLens = new THREE.Mesh(indicatorLensGeo, indicatorLensMat);
  rearRightLens.position.set(0.016, 0, 0);
  rearRightInd.add(rearRightLens);

  scooter.add(rearLeftInd, rearRightInd);

  // Red Honda Logo (mounted below headlight on fork clamp)
  const logoGeo = new THREE.BoxGeometry(0.08, 0.03, 0.015);
  const logo = new THREE.Mesh(logoGeo, redMat);
  logo.position.set(0, 0.78, -0.4);
  scooter.add(logo);

  // 13. Rear Shock Absorbers (Rear swingarm to frame rail suspension with chrome coil springs)
  const shockGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.38, 8);
  const leftShock = new THREE.Mesh(shockGeo, darkMetalMat);
  leftShock.position.set(-0.13, 0.44, 0.44);
  leftShock.rotation.x = -0.3; // angled forward
  
  const rightShock = new THREE.Mesh(shockGeo, darkMetalMat);
  rightShock.position.set(0.13, 0.44, 0.44);
  rightShock.rotation.x = -0.3;

  const coilCount = 8;
  const torusGeo = new THREE.TorusGeometry(0.018, 0.005, 8, 16);
  torusGeo.rotateX(Math.PI / 2);
  for (let i = 0; i < coilCount; i++) {
    const yOffset = -0.14 + i * 0.038;
    const coilL = new THREE.Mesh(torusGeo, chromeMat);
    coilL.position.set(0, yOffset, 0);
    leftShock.add(coilL);
    
    const coilR = new THREE.Mesh(torusGeo, chromeMat);
    coilR.position.set(0, yOffset, 0);
    rightShock.add(coilR);
  }
  scooter.add(leftShock, rightShock);

  // 14. License Plate Assembly (mounted on rear fender below tail light)
  const plateHolder = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.12, 0.015), darkMetalMat);
  plateHolder.position.set(0, 0.38, 0.94);
  plateHolder.rotation.x = -0.15; // angled down
  
  const plateWhite = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.11, 0.005), chromeMat);
  plateWhite.position.set(0, 0, 0.008);
  plateHolder.add(plateWhite);
  
  const blueStrip = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.11, 0.006), new THREE.MeshBasicMaterial({ color: 0x003399 }));
  blueStrip.position.set(-0.06, 0, 0.001);
  plateWhite.add(blueStrip);
  scooter.add(plateHolder);

  // 15. Rear Rack and Adventure Top Case (Helmet box)
  // Rear chrome support rack
  const rackGeo = new THREE.BoxGeometry(0.18, 0.02, 0.22);
  const rack = new THREE.Mesh(rackGeo, chromeMat);
  rack.position.set(0, 0.74, 0.52);
  scooter.add(rack);

  // Helmet box (Top Case) styled as a high-quality aluminum adventure trunk
  const boxGeo = new THREE.BoxGeometry(0.28, 0.24, 0.28);
  const helmetBox = new THREE.Mesh(boxGeo, darkMetalMat);
  helmetBox.position.set(0, 0.85, 0.52);
  
  // Metallic grey top cover
  const boxCover = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.04, 0.26), bodyGreyMat);
  boxCover.position.set(0, 0.13, 0);
  helmetBox.add(boxCover);
  
  // Chrome corner reinforcements (4 corners)
  const cornerGeo = new THREE.BoxGeometry(0.03, 0.24, 0.03);
  const c1 = new THREE.Mesh(cornerGeo, chromeMat); c1.position.set(-0.13, 0, -0.13);
  const c2 = new THREE.Mesh(cornerGeo, chromeMat); c2.position.set(0.13, 0, -0.13);
  const c3 = new THREE.Mesh(cornerGeo, chromeMat); c3.position.set(-0.13, 0, 0.13);
  const c4 = new THREE.Mesh(cornerGeo, chromeMat); c4.position.set(0.13, 0, 0.13);
  helmetBox.add(c1, c2, c3, c4);

  // Red reflector strip on back
  const reflector = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.03, 0.01), redMat);
  reflector.position.set(0, 0.02, 0.142);
  
  // Black locking clasp
  const latch = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.08, 0.02), blackMat);
  latch.position.set(0, -0.04, 0.142);
  helmetBox.add(reflector, latch);

  scooter.add(helmetBox);

  // Enable shadow casting & receiving for all meshes inside the group
  scooter.traverse(child => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  return scooter;
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
  // Left Side Wall Segment 1 (Front straight section, shortened by 0.3m to clear front facade, Z: 4.95 to -2.0)
  const segment1L = (bD / 2 - 0.3) - (-2.0); // 6.95
  const leftWall1Geo = new THREE.BoxGeometry(0.3, bH, segment1L);
  const leftWall1 = new THREE.Mesh(leftWall1Geo, materials.leftWall);
  leftWall1.position.set(-bW / 2, bH / 2, ((bD / 2 - 0.3) + -2.0) / 2); // Center: Z = 1.475
  leftWall1.castShadow = true;
  leftWall1.receiveShadow = true;
  leftWall1.name = 'leftWall1';
  buildingGroup.add(leftWall1);

  // Left Side Wall Segment 2 (Bending 30 degrees to the left, truncated before the end)
  const xStart = -bW / 2; // -4.5
  const zStart = -2.0;

  // Truncated end points to create a straight wall parallel to the right wall (X coordinates match)
  const xEndChamfer1 = -9.5;
  const zEndChamfer1 = -6.5;
  const xEndChamfer2 = -9.5;
  const zEndChamfer2 = -10.0;

  const segment2Length = Math.sqrt(Math.pow(xEndChamfer1 - xStart, 2) + Math.pow(zEndChamfer1 - zStart, 2)); // ~4.57
  const segment2H = bH;
  
  const leftWall2Geo = new THREE.BoxGeometry(0.3, segment2H, segment2Length);
  const leftWall2 = new THREE.Mesh(leftWall2Geo, materials.leftWallDiagonal);
  const midX = (xStart + xEndChamfer1) / 2;
  const midZ = (zStart + zEndChamfer1) / 2;
  leftWall2.position.set(midX, segment2H / 2, midZ);
  leftWall2.rotation.y = Math.atan2(xEndChamfer1 - xStart, zEndChamfer1 - zStart);
  leftWall2.castShadow = true;
  leftWall2.receiveShadow = true;
  leftWall2.name = 'leftWall2';
  buildingGroup.add(leftWall2);

  // Chamfer / Truncation Wall Segment (Parallel to right wall)
  const chamferLength = Math.sqrt(Math.pow(xEndChamfer2 - xEndChamfer1, 2) + Math.pow(zEndChamfer2 - zEndChamfer1, 2));
  const chamferWallGeo = new THREE.BoxGeometry(0.3, bH, chamferLength);
  const chamferWall = new THREE.Mesh(chamferWallGeo, materials.leftWallParallel);
  const chamferMidX = (xEndChamfer1 + xEndChamfer2) / 2;
  const chamferMidZ = (zEndChamfer1 + zEndChamfer2) / 2;
  chamferWall.position.set(chamferMidX, bH / 2, chamferMidZ);
  chamferWall.rotation.y = Math.atan2(xEndChamfer2 - xEndChamfer1, zEndChamfer2 - zEndChamfer1);
  chamferWall.castShadow = true;
  chamferWall.receiveShadow = true;
  chamferWall.name = 'chamferWall';
  buildingGroup.add(chamferWall);

  // Right Side Wall (runs straight along X = bW/2, shortened by 0.3m to clear front facade, Z: 4.95 to -5.25)
  const rightWallGeo = new THREE.BoxGeometry(0.3, bH, bD - 0.3); // 10.2
  const rightWall = new THREE.Mesh(rightWallGeo, materials.rightWall);
  rightWall.position.set(bW / 2, bH / 2, -0.15);
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

  // Left Facade Strip (Vertical Column on the Left of Front Facade)
  const leftFacadeStripGeo = new THREE.BoxGeometry(0.3, bH, 0.3);
  const leftFacadeStripMats = [
    materials.leftWall, // +X
    materials.leftWall, // -X (visible left side face)
    materials.leftWall, // +Y
    materials.leftWall, // -Y
    materials.leftFacadeStrip, // +Z (visible front face)
    materials.leftWall  // -Z
  ];
  const leftFacadeStrip = new THREE.Mesh(leftFacadeStripGeo, leftFacadeStripMats);
  leftFacadeStrip.position.set(-bW / 2, bH / 2, bD / 2 - 0.15);
  leftFacadeStrip.castShadow = true;
  leftFacadeStrip.receiveShadow = true;
  leftFacadeStrip.name = 'leftFacadeStrip';
  buildingGroup.add(leftFacadeStrip);

  // Right Facade Strip (Vertical Column on the Right of Front Facade)
  const rightFacadeStripGeo = new THREE.BoxGeometry(0.3, bH, 0.3);
  const rightFacadeStripMats = [
    materials.rightWall, // +X (visible right side face)
    materials.rightWall, // -X
    materials.rightWall, // +Y
    materials.rightWall, // -Y
    materials.rightFacadeStrip, // +Z (visible front face)
    materials.rightWall  // -Z
  ];
  const rightFacadeStrip = new THREE.Mesh(rightFacadeStripGeo, rightFacadeStripMats);
  rightFacadeStrip.position.set(bW / 2, bH / 2, bD / 2 - 0.15);
  rightFacadeStrip.castShadow = true;
  rightFacadeStrip.receiveShadow = true;
  rightFacadeStrip.name = 'rightFacadeStrip';
  buildingGroup.add(rightFacadeStrip);

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
  roofShape.lineTo(bW / 2, -(bD / 2 - 0.3)); // Front-Right wall corner (4.5, -4.95)
  roofShape.lineTo(halfW, -(bD / 2 - 0.3));  // Step inward (4.3, -4.95)
  roofShape.lineTo(halfW, -(bD / 2 + projD)); // Front-Right balcony corner (4.3, -7.45)
  roofShape.lineTo(-halfW, -(bD / 2 + projD)); // Front-Left balcony corner (-4.3, -7.45)
  roofShape.lineTo(-halfW, -(bD / 2 - 0.3));  // Step inward (-4.3, -4.95)
  roofShape.lineTo(-bW / 2, -(bD / 2 - 0.3)); // Step outward to left wall (-4.5, -4.95)
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

    // F. Balcony Privacy Divider (Separator between flats - stops short of the front railing)
    const dividerGeo = new THREE.BoxGeometry(0.1, 2.95, 2.0);
    const divider = new THREE.Mesh(dividerGeo, materials.dividers);
    divider.position.set(0, yPos + 0.35 + 2.95 / 2, bD / 2 - 0.15 + 2.0 / 2);
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

    if (f === 0) {
      bunnyMesh = createBunny();
      bunnyMesh.position.set(2.1, yPos + 0.75, 6.2);
      bunnyMesh.visible = state.bunnyEnabled;
      bunnyCurrentX = 2.1;
      bunnyCurrentZ = 6.2;
      bunnyTargetX = 2.1;
      bunnyTargetZ = 6.2;
      bunnyJumpProgress = 1.0;
      bunnyActivatedTime = performance.now();
      bunnyFirstActionTriggered = false;
      buildingGroup.add(bunnyMesh);
    }
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
    new THREE.Vector3(-bW / 2, 0, bD / 2 - 0.3),
    new THREE.Vector3(-halfW, 0, bD / 2 - 0.3),
    new THREE.Vector3(-halfW, 0, bD / 2 + projD),
    new THREE.Vector3(halfW, 0, bD / 2 + projD),
    new THREE.Vector3(halfW, 0, bD / 2 - 0.3),
    new THREE.Vector3(bW / 2, 0, bD / 2 - 0.3)
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
  
  // 1st floor awnings: under 2nd floor balcony slab (underside Y = 7.45)
  const awning1FL = createAwning(7.45, -2.1, 3.2, projD, bD);
  const awning1FR = createAwning(7.45, 2.1, 3.2, projD, bD);
  awning1FR.name = "right-awning";
  buildingGroup.add(awning1FL);
  buildingGroup.add(awning1FR);

  // 2nd floor awnings: under 3rd floor balcony slab (underside Y = 10.75)
  const awning2FL = createAwning(10.75, -2.1, 3.2, projD, bD);
  const awning2FR = createAwning(10.75, 2.1, 3.2, projD, bD);
  awning2FR.name = "right-awning";
  buildingGroup.add(awning2FL);
  buildingGroup.add(awning2FR);

  // 3rd floor awnings: under the roof slab (underside Y = 13.7)
  const awning3FL = createAwning(13.7, -2.1, 3.2, projD, bD);
  const awning3FR = createAwning(13.7, 2.1, 3.2, projD, bD);
  awning3FR.name = "right-awning";
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

  const bracketGeo = new THREE.BoxGeometry(0.18, 0.04, 0.18);
  const numBrackets = 6;
  for (let i = 0; i < numBrackets; i++) {
    // Front pipe brackets (max Y = 13.0, matching front wall height 13.7)
    const yPos1 = 1.0 + i * (12.0 / (numBrackets - 1));
    const br1 = new THREE.Mesh(bracketGeo, materials.railings);
    br1.position.set(-bW / 2 + 0.05, yPos1, bD / 2 - 0.15);
    pipeGroup.add(br1);
  }
  buildingGroup.add(pipeGroup);

  // --- 8. Sidewalk Street Lamp (Physical models removed, light source retained for night mode) ---
  streetLampLight = new THREE.PointLight(0xffb74d, 0, 15, 1.2);
  streetLampLight.position.set(bW / 2 + 0.7, 4.7, bD / 2 + 3.0);
  streetLampLight.castShadow = true;
  streetLampLight.shadow.bias = -0.002;
  scene.add(streetLampLight);



  // Add the metallic grey Honda 350 cc scooter parked on the right side of the walkway, next to the window
  scooterMesh = createScooter();
  // Aligned all the way to the right of the window (centered at X = 4.3, Z = 7.2)
  // Front of scooter is facing the window (which is in the -Z direction)
  // Walkway top is at Y = 0.025. Scooter wheels rest on walkway.
  scooterMesh.position.set(4.3, 0.025, 7.2);
  // Scale it up for a larger 350cc presence (increased to 1.7)
  scooterMesh.scale.set(1.7, 1.7, 1.7);
  // Park it at a slight realistic angle (facing window, tilted on kickstand)
  scooterMesh.rotation.y = 0.18; 
  scooterMesh.rotation.z = -0.06; 
  scooterMesh.visible = state.motorbikeEnabled;
  scene.add(scooterMesh);

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
  // OrbitControls movement detection for bunny jumping
  if (controls) {
    controls.addEventListener('change', () => {
      bunnyLastCameraMoveTime = performance.now();
      if (bunnyMesh && bunnyMesh.visible && bunnyJumpProgress >= 1.0) {
        // Cancel any active pee/poop action
        bunnyAction = null;
        resetPoopFlags();
        
        bunnyJumpProgress = 0.0;
        bunnyJumpStartTime = performance.now();
        
        // Store current position as the start of the jump
        bunnyCurrentX = bunnyMesh.position.x;
        bunnyCurrentZ = bunnyMesh.position.z;
        
        // Calculate the direction vector from the bunny to the camera
        const dx = camera.position.x - bunnyCurrentX;
        const dz = camera.position.z - bunnyCurrentZ;
        const len = Math.sqrt(dx * dx + dz * dz);
        if (len > 0.001) {
          const dirX = dx / len;
          const dirZ = dz / len;
          
          // Target position is 0.25m towards the camera, clamped to safe balcony bounds
          const hopDist = 0.25;
          bunnyTargetX = Math.max(0.6, Math.min(3.7, bunnyCurrentX + dirX * hopDist));
          bunnyTargetZ = Math.max(5.2, Math.min(6.6, bunnyCurrentZ + dirZ * hopDist));
        }
      }
    });
  }

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

  // 3B. Lock/Unlock Color Buttons
  document.querySelectorAll('.btn-lock').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const key = btn.dataset.colorKey;
      state.lockedColors[key] = !state.lockedColors[key];
      
      const isLocked = state.lockedColors[key];
      btn.classList.toggle('locked', isLocked);
      btn.textContent = isLocked ? '🔒' : '🔓';
      
      // Update dynamic tooltip title
      const activeLang = document.getElementById('select-language')?.value || 'en';
      const dict = translations[activeLang] || translations['en'];
      const titleText = isLocked ? (dict.unlockTitle || "Unlock Color") : (dict.lockTitle || "Lock Color");
      btn.setAttribute('title', titleText);
      btn.setAttribute('aria-label', titleText);
    });
  });

  // 3C. Randomize Colors Button with Smart Harmonization
  document.getElementById('btn-randomize').addEventListener('click', () => {
    const currentColors = { ...state.colors };
    const lockedKeys = Object.keys(state.colors).filter(key => state.lockedColors[key]);

    const getHslOf = key => hexToHsl(currentColors[key]);

    // Determine HSL seed
    let seedH = Math.floor(Math.random() * 360);
    let seedS = 20 + Math.floor(Math.random() * 20); // 20% - 40%
    let seedL = 75 + Math.floor(Math.random() * 15); // 75% - 90% (light stucco)
    let hasSeed = false;

    const wallKeys = ['leftWall', 'leftWallDiagonal', 'leftWallParallel', 'frontFacade', 'leftFacadeStrip', 'rightFacadeStrip', 'rightWall', 'backWall'];
    const structureKeys = ['balconies', 'roof', 'dividers', 'roofFixtures'];
    
    let seedKey = lockedKeys.find(k => wallKeys.includes(k)) || 
                  lockedKeys.find(k => structureKeys.includes(k)) || 
                  lockedKeys[0];

    if (seedKey) {
      const hsl = getHslOf(seedKey);
      seedH = hsl.h;
      seedS = hsl.s;
      seedL = hsl.l;
      hasSeed = true;
    }

    // Determine random harmony mode
    const harmonyMode = Math.floor(Math.random() * 3); // 0 = Monochromatic, 1 = Analogous, 2 = Complementary

    Object.keys(state.colors).forEach(key => {
      if (state.lockedColors[key]) return; // Skip locked elements

      let nextColorHex;

      if (wallKeys.includes(key)) {
        const anotherLockedWall = lockedKeys.find(k => wallKeys.includes(k));
        if (anotherLockedWall) {
          const hsl = getHslOf(anotherLockedWall);
          let lOffset = 0;
          if (key === 'frontFacade') {
            lOffset = (hsl.l > 50) ? -5 : 5;
          }
          nextColorHex = hslToHex(hsl.h, hsl.s, Math.max(10, Math.min(95, hsl.l + lOffset)));
        } else {
          let h = seedH;
          if (hasSeed) {
            if (harmonyMode === 1) { // Analogous
              h = (seedH + (Math.random() > 0.5 ? 30 : -30)) % 360;
            } else if (harmonyMode === 2) { // Complementary
              h = (seedH + 180) % 360;
            }
          }
          let s = Math.max(5, Math.min(45, seedS));
          let l = seedL;
          if (key === 'frontFacade') {
            l = Math.max(15, Math.min(95, seedL + (seedL > 50 ? -5 : 5)));
          }
          nextColorHex = hslToHex(h, s, l);
        }
      }
      else if (structureKeys.includes(key)) {
        const anotherLockedStruct = lockedKeys.find(k => structureKeys.includes(k));
        if (anotherLockedStruct) {
          const hsl = getHslOf(anotherLockedStruct);
          let lOffset = 0;
          if (key === 'roof') lOffset = -5;
          nextColorHex = hslToHex(hsl.h, hsl.s, Math.max(10, Math.min(95, hsl.l + lOffset)));
        } else {
          let h = seedH;
          let s = Math.min(5, seedS);
          const isLight = (Math.random() > 0.3);
          let l = isLight ? 85 + Math.floor(Math.random() * 10) : 18 + Math.floor(Math.random() * 10);
          if (key === 'roof') l = Math.max(10, l - 5);
          nextColorHex = hslToHex(h, s, l);
        }
      }
      else if (key === 'awnings') {
        let h = (seedH + 180) % 360;
        if (harmonyMode === 1) {
          h = (seedH + 30) % 360;
        } else if (harmonyMode === 0) {
          h = seedH;
        }
        let s = 60 + Math.floor(Math.random() * 25);
        let l = 35 + Math.floor(Math.random() * 20);
        nextColorHex = hslToHex(h, s, l);
      }
      else if (key === 'railings') {
        const rand = Math.random();
        if (rand < 0.6) {
          nextColorHex = '#222222';
        } else if (rand < 0.8) {
          nextColorHex = '#3e352f';
        } else {
          nextColorHex = '#eeeeee';
        }
      }
      else if (key === 'frames') {
        const rand = Math.random();
        if (rand < 0.4) {
          nextColorHex = '#f8f8f8';
        } else if (rand < 0.7) {
          nextColorHex = '#282828';
        } else {
          nextColorHex = hslToHex(30, 40, 45); // Wood brown
        }
      }
      else if (key === 'glass') {
        const rand = Math.random();
        let h = 205;
        if (rand < 0.3) h = 165;
        else if (rand < 0.5) h = 0;
        let s = (h === 0) ? 0 : 25 + Math.floor(Math.random() * 15);
        let l = 75 + Math.floor(Math.random() * 10);
        nextColorHex = hslToHex(h, s, l);
      }

      state.colors[key] = nextColorHex;
      if (colorInputs[key]) colorInputs[key].value = nextColorHex;
      if (colorLabels[key]) colorLabels[key].textContent = nextColorHex.toUpperCase();
      if (materials[key]) {
        materials[key].color.set(nextColorHex);
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

  // 7B. Toggle Right Awnings
  const toggleRightAwnings = document.getElementById('toggle-right-awnings');
  if (toggleRightAwnings) {
    toggleRightAwnings.addEventListener('change', (e) => {
      const enabled = e.target.checked;
      state.rightAwningsEnabled = enabled;
      
      scene.traverse((node) => {
        if (node.name === "right-awning") {
          node.visible = enabled;
        }
      });
      
      presetCards.forEach(c => c.classList.remove('active'));
      document.querySelectorAll('.saved-style-card').forEach(c => c.classList.remove('active'));
      state.activePreset = 'custom';
    });
  }

  // 7C. Toggle Interactive Bunny
  const toggleBunny = document.getElementById('toggle-bunny');
  if (toggleBunny) {
    toggleBunny.addEventListener('change', (e) => {
      const enabled = e.target.checked;
      state.bunnyEnabled = enabled;
      if (bunnyMesh) {
        bunnyMesh.visible = enabled;
        if (enabled) {
          bunnyMesh.position.set(2.1, bunnyBaseY, 6.2);
          bunnyCurrentX = 2.1;
          bunnyCurrentZ = 6.2;
          bunnyTargetX = 2.1;
          bunnyTargetZ = 6.2;
          bunnyJumpProgress = 1.0;
          bunnyActivatedTime = performance.now();
          bunnyFirstActionTriggered = false;
        }
      }
      if (!enabled) {
        clearBunnyParticles();
      }
    });
  }

  // 7D. Toggle Interactive Motorbike
  const toggleMotorbike = document.getElementById('toggle-motorbike');
  if (toggleMotorbike) {
    toggleMotorbike.addEventListener('change', (e) => {
      const enabled = e.target.checked;
      state.motorbikeEnabled = enabled;
      if (scooterMesh) {
        scooterMesh.visible = enabled;
      }
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
    const handleSave = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const name = inputName.value.trim();
      saveStyle(name);
      inputName.value = '';
      if (inputName) inputName.blur(); // Dismiss mobile keyboard instantly
    };
    btnSaveStyle.addEventListener('click', handleSave);
    btnSaveStyle.addEventListener('touchstart', handleSave);
    if (inputName) {
      inputName.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const name = inputName.value.trim();
          saveStyle(name);
          inputName.value = '';
          inputName.blur(); // Dismiss mobile keyboard instantly
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

  // Unlock all colors when a preset is applied
  if (state.lockedColors) {
    Object.keys(state.lockedColors).forEach(key => {
      state.lockedColors[key] = false;
    });
  }
  document.querySelectorAll('.btn-lock').forEach(btn => {
    btn.classList.remove('locked');
    btn.textContent = '🔓';
    const activeLang = document.getElementById('select-language')?.value || 'en';
    const dict = translations[activeLang] || translations['en'];
    const titleText = dict.lockTitle || "Lock Color";
    btn.setAttribute('title', titleText);
    btn.setAttribute('aria-label', titleText);
  });

  // Preset themes always enable all awnings by default
  state.rightAwningsEnabled = true;
  const toggleRightAwnings = document.getElementById('toggle-right-awnings');
  if (toggleRightAwnings) {
    toggleRightAwnings.checked = true;
  }
  scene.traverse((node) => {
    if (node.name === "right-awning") {
      node.visible = true;
    }
  });

  // Preset themes deactivate bunny by default
  state.bunnyEnabled = false;
  const toggleBunny = document.getElementById('toggle-bunny');
  if (toggleBunny) {
    toggleBunny.checked = false;
  }
  if (bunnyMesh) {
    bunnyMesh.visible = false;
  }
  clearBunnyParticles();

  // Preset themes deactivate motorbike by default
  state.motorbikeEnabled = false;
  const toggleMotorbike = document.getElementById('toggle-motorbike');
  if (toggleMotorbike) {
    toggleMotorbike.checked = false;
  }
  if (scooterMesh) {
    scooterMesh.visible = false;
  }
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

  // Update bunny animation
  if (bunnyMesh && bunnyMesh.visible) {
    const now = performance.now();
    
    // Always face the camera view point (horizontal angle)
    const dx = camera.position.x - bunnyMesh.position.x;
    const dz = camera.position.z - bunnyMesh.position.z;
    const faceAngle = Math.atan2(dx, dz);
    
    if (bunnyAction === null) {
      bunnyMesh.rotation.y = faceAngle;
    }
    
    if (bunnyJumpProgress < 1.0) {
      // Calculate jump progress (0.0 to 1.0)
      const elapsed = now - bunnyJumpStartTime;
      bunnyJumpProgress = Math.min(elapsed / bunnyJumpDuration, 1.0);
      
      const p = bunnyJumpProgress;
      // Interpolate horizontal position from current to target
      bunnyMesh.position.x = bunnyCurrentX + p * (bunnyTargetX - bunnyCurrentX);
      bunnyMesh.position.z = bunnyCurrentZ + p * (bunnyTargetZ - bunnyCurrentZ);
      
      // Snappy gravity jump curve (parabolic arc, 16cm height)
      bunnyMesh.position.y = bunnyBaseY + 4 * 0.16 * p * (1 - p);
      
      // Wiggle ears during jump
      const leftEar = bunnyMesh.getObjectByName('leftEar');
      const leftEarInner = bunnyMesh.getObjectByName('leftEarInner');
      const rightEar = bunnyMesh.getObjectByName('rightEar');
      const rightEarInner = bunnyMesh.getObjectByName('rightEarInner');
      
      if (leftEar && rightEar) {
        const wiggle = Math.sin(p * Math.PI * 2) * 0.15;
        leftEar.rotation.z = 0.1 + wiggle;
        if (leftEarInner) leftEarInner.rotation.z = 0.1 + wiggle;
        
        rightEar.rotation.z = -0.1 - wiggle;
        if (rightEarInner) rightEarInner.rotation.z = -0.1 - wiggle;
      }
    } else {
      // Settle down at base height and target horizontal positions
      bunnyMesh.position.x = bunnyTargetX;
      bunnyMesh.position.z = bunnyTargetZ;
      bunnyMesh.position.y = bunnyBaseY;
      
      // Reset ear rotations
      const leftEar = bunnyMesh.getObjectByName('leftEar');
      const leftEarInner = bunnyMesh.getObjectByName('leftEarInner');
      const rightEar = bunnyMesh.getObjectByName('rightEar');
      const rightEarInner = bunnyMesh.getObjectByName('rightEarInner');
      
      if (leftEar && rightEar) {
        leftEar.rotation.z = 0.1;
        if (leftEarInner) leftEarInner.rotation.z = 0.1;
        
        rightEar.rotation.z = -0.1;
        if (rightEarInner) rightEarInner.rotation.z = -0.1;
      }

      // Handle random pee/poop action only when stationary
      if (bunnyAction === null) {
        const timeSinceActivation = now - bunnyActivatedTime;
        if (!bunnyFirstActionTriggered) {
          // Trigger the first action exactly after 5 seconds of activation
          if (timeSinceActivation >= 5000) {
            bunnyAction = (bunnyLastActionType === 'poop') ? 'pee' : 'poop';
            bunnyLastActionType = bunnyAction;
            bunnyActionStartTime = now;
            bunnyFirstActionTriggered = true;
          }
        } else {
          // Subsequent actions trigger randomly
          // 0.7% chance per frame (approx once every 2.4 seconds)
          if (Math.random() < 0.007) {
            bunnyAction = (bunnyLastActionType === 'poop') ? 'pee' : 'poop';
            bunnyLastActionType = bunnyAction;
            bunnyActionStartTime = now;
          }
        }
      }
      
      if (bunnyAction !== null) {
        const elapsed = now - bunnyActionStartTime;
        if (elapsed < bunnyActionDuration) {
          let angleOffset = 0;
          if (elapsed < 200) {
            // Spin 180 degrees (0 to PI)
            angleOffset = (elapsed / 200) * Math.PI;
          } else if (elapsed >= 200 && elapsed < 1300) {
            // Stay faced away
            angleOffset = Math.PI;
            
            // Emit particles at the rear of the bunny
            const spawnPos = new THREE.Vector3(0, 0.05, -0.2).applyMatrix4(bunnyMesh.matrixWorld);
            const shootDir = new THREE.Vector3(0, 0, -1).applyQuaternion(bunnyMesh.quaternion);
            
            if (bunnyAction === 'pee') {
              // Emit 1 yellow particle every frame
              if (!peeGeo) peeGeo = new THREE.SphereGeometry(0.02, 4, 4);
              const peeMat = new THREE.MeshBasicMaterial({ color: 0xffeb3b, transparent: true, opacity: 0.9 });
              const peeMesh = new THREE.Mesh(peeGeo, peeMat);
              peeMesh.position.copy(spawnPos);
              
              // Shoot outward with random velocity
              const speed = 0.04 + Math.random() * 0.02;
              const velocity = shootDir.clone().multiplyScalar(speed);
              velocity.y = 0.04 + Math.random() * 0.03;
              
              scene.add(peeMesh);
              bunnyParticles.push({
                mesh: peeMesh,
                velocity: velocity,
                type: 'pee',
                state: 'falling',
                birthTime: now
              });
            } else if (bunnyAction === 'poop') {
              const frameTime = Math.floor(elapsed);
              if (!window.poopSpawned200 && frameTime >= 200 && frameTime < 250) {
                window.poopSpawned200 = true;
                spawnPoop(spawnPos, shootDir, now);
              }
              if (!window.poopSpawned400 && frameTime >= 400 && frameTime < 450) {
                window.poopSpawned400 = true;
                spawnPoop(spawnPos, shootDir, now);
              }
              if (!window.poopSpawned600 && frameTime >= 600 && frameTime < 650) {
                window.poopSpawned600 = true;
                spawnPoop(spawnPos, shootDir, now);
              }
              if (!window.poopSpawned800 && frameTime >= 800 && frameTime < 850) {
                window.poopSpawned800 = true;
                spawnPoop(spawnPos, shootDir, now);
              }
              if (!window.poopSpawned1000 && frameTime >= 1000 && frameTime < 1050) {
                window.poopSpawned1000 = true;
                spawnPoop(spawnPos, shootDir, now);
              }
            }
          } else {
            // Spin back (PI to 2*PI)
            const p = (elapsed - 1300) / 200;
            angleOffset = Math.PI + p * Math.PI;
            resetPoopFlags();
          }
          bunnyMesh.rotation.y = faceAngle + angleOffset;
        } else {
          bunnyAction = null;
          resetPoopFlags();
        }
      }
    }
  }

  // Update falling/splat particles
  if (bunnyParticles.length > 0) {
    const now = performance.now();
    for (let i = bunnyParticles.length - 1; i >= 0; i--) {
      const p = bunnyParticles[i];
      if (p.state === 'falling') {
        p.velocity.y -= 0.005; // gravity force per frame
        
        // Apply horizontal air resistance (damping) only after clearing the railing to drop them closer to the building facade
        if (p.mesh.position.z > 7.27) {
          p.velocity.x *= 0.85;
          p.velocity.z *= 0.85;
        }
        
        p.mesh.position.add(p.velocity);
        
        // Detect landing
        const landY = getLandingHeight(p.mesh.position.x, p.mesh.position.z);
        if (p.mesh.position.y <= landY) {
          p.mesh.position.y = landY;
          p.state = 'splat';
          p.landTime = now;
          p.velocity.set(0, 0, 0);
          
          if (p.type === 'pee') {
            p.mesh.scale.set(4, 0.1, 4); // flatten into puddle
          } else {
            p.mesh.scale.set(2.5, 0.2, 2.5); // flatten into splat
          }
        }
      }
    }

    // Safety cap: Limit maximum active particles to 2000 to prevent WebGL memory overload on long sessions
    while (bunnyParticles.length > 2000) {
      const oldest = bunnyParticles.shift();
      if (oldest) {
        scene.remove(oldest.mesh);
        if (oldest.mesh.material) {
          if (Array.isArray(oldest.mesh.material)) oldest.mesh.material.forEach(m => m.dispose());
          else oldest.mesh.material.dispose();
        }
      }
    }
  }

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
    labelLeftWall: "Left Wall (Front Segment)",
    labelLeftWallDiagonal: "Left Wall (Diagonal Segment)",
    labelLeftWallParallel: "Left Wall (Parallel Segment)",
    labelFrontFacade: "Front Facade",
    labelLeftFacadeStrip: "Left Facade Strip",
    labelRightFacadeStrip: "Right Facade Strip",
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
    labelRightAwnings: "🟢 Right Side Awnings",
    labelInteractiveBunny: "🐰 Interactive Bunny",
    labelInteractiveMotorbike: "🏍️ Motorbike",
    btnScreenshot: "Export Visualization PNG",
    interactionHelp: "🖱️ Left Click + Drag to rotate | 🖱️ Right Click + Drag to pan | 📜 Scroll to zoom",
    loadingTitle: "Generating 3D Model...",
    loadingText: "Constructing architecture, lighting, and textures",
    openCustomizer: "Open Customizer",
    savedStylesHeading: "My Favorite Styles",
    btnSaveStyle: "Save Style",
    saveStylePlaceholder: "Name your style...",
    noSavedStyles: "No saved styles yet.",
    lockTitle: "Lock Color",
    unlockTitle: "Unlock Color"
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
    labelLeftWall: "Pared Izq. (Tramo Frontal)",
    labelLeftWallDiagonal: "Pared Izq. (Tramo Diagonal)",
    labelLeftWallParallel: "Pared Izq. (Tramo Paralelo)",
    labelFrontFacade: "Fachada Frontal",
    labelLeftFacadeStrip: "Franja Izquierda de la Fachada",
    labelRightFacadeStrip: "Franja Derecha de la Fachada",
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
    labelRightAwnings: "🟢 Toldos del Lado Derecho",
    labelInteractiveBunny: "🐰 Conejo Interactivo",
    labelInteractiveMotorbike: "🏍️ Moto",
    btnScreenshot: "Exportar PNG de Visualización",
    interactionHelp: "🖱️ Clic Izquierdo + Arrastrar para rotar | 🖱️ Clic Derecho + Arrastrar para desplazar | 📜 Deslizar para zoom",
    loadingTitle: "Generando Modelo 3D...",
    loadingText: "Construyendo arquitectura, iluminación y texturas",
    openCustomizer: "Abrir Personalizador",
    savedStylesHeading: "Mis Estilos Favoritos",
    btnSaveStyle: "Guardar Estilo",
    saveStylePlaceholder: "Nombre del estilo...",
    noSavedStyles: "Aún no hay estilos guardados.",
    lockTitle: "Bloquear Color",
    unlockTitle: "Desbloquear Color"
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
    labelLeftWall: "Paret Esquerra (Tram Frontal)",
    labelLeftWallDiagonal: "Paret Esquerra (Tram Diagonal)",
    labelLeftWallParallel: "Paret Esquerra (Tram Paral·lel)",
    labelFrontFacade: "Fatxada Frontal",
    labelLeftFacadeStrip: "Franja Esquerra de la Fatxada",
    labelRightFacadeStrip: "Franja Dreta de la Fatxada",
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
    labelRightAwnings: "🟢 Tendals del Costat Dret",
    labelInteractiveBunny: "🐰 Conill Interactiu",
    labelInteractiveMotorbike: "🏍️ Moto",
    btnScreenshot: "Exportar PNG de Visualització",
    interactionHelp: "🖱️ Clic Esquerre + Arrossegar per rotar | 🖱️ Clic Dret + Arrossegar per desplaçar | 📜 Lliscament per zoom",
    loadingTitle: "Generant Model 3D...",
    loadingText: "Construint arquitectura, il·luminació i textures",
    openCustomizer: "Obrir Personalitzador",
    savedStylesHeading: "Els Meus Estils Preferits",
    btnSaveStyle: "Desar Estil",
    saveStylePlaceholder: "Nom de l'estil...",
    noSavedStyles: "Encara no hi ha estils desats.",
    lockTitle: "Bloquejar Color",
    unlockTitle: "Desbloquejar Color"
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

  // Keep lock buttons titles updated
  document.querySelectorAll('.btn-lock').forEach(btn => {
    const isLocked = btn.classList.contains('locked');
    const titleText = isLocked ? (dict.unlockTitle || "Unlock Color") : (dict.lockTitle || "Lock Color");
    btn.setAttribute('title', titleText);
    btn.setAttribute('aria-label', titleText);
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
    enableShadows: renderer.shadowMap.enabled,
    rightAwningsEnabled: state.rightAwningsEnabled,
    bunnyEnabled: state.bunnyEnabled,
    motorbikeEnabled: state.motorbikeEnabled
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

  // Unlock all colors when a style is applied
  if (state.lockedColors) {
    Object.keys(state.lockedColors).forEach(key => {
      state.lockedColors[key] = false;
    });
  }
  document.querySelectorAll('.btn-lock').forEach(btn => {
    btn.classList.remove('locked');
    btn.textContent = '🔓';
    const activeLang = document.getElementById('select-language')?.value || 'en';
    const dict = translations[activeLang] || translations['en'];
    const titleText = dict.lockTitle || "Lock Color";
    btn.setAttribute('title', titleText);
    btn.setAttribute('aria-label', titleText);
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

  // Apply right side awnings toggle if present
  if (styleObj.rightAwningsEnabled !== undefined) {
    state.rightAwningsEnabled = styleObj.rightAwningsEnabled;
    const toggleRightAwnings = document.getElementById('toggle-right-awnings');
    if (toggleRightAwnings) {
      toggleRightAwnings.checked = styleObj.rightAwningsEnabled;
      scene.traverse((node) => {
        if (node.name === "right-awning") {
          node.visible = styleObj.rightAwningsEnabled;
        }
      });
    }
  }

  // Apply bunny toggle if present
  if (styleObj.bunnyEnabled !== undefined) {
    state.bunnyEnabled = styleObj.bunnyEnabled;
    const toggleBunny = document.getElementById('toggle-bunny');
    if (toggleBunny) {
      toggleBunny.checked = styleObj.bunnyEnabled;
    }
    if (bunnyMesh) {
      bunnyMesh.visible = styleObj.bunnyEnabled;
      if (styleObj.bunnyEnabled) {
        bunnyMesh.position.set(2.1, bunnyBaseY, 6.2);
        bunnyCurrentX = 2.1;
        bunnyCurrentZ = 6.2;
        bunnyTargetX = 2.1;
        bunnyTargetZ = 6.2;
        bunnyJumpProgress = 1.0;
        bunnyActivatedTime = performance.now();
        bunnyFirstActionTriggered = false;
      }
    }
    if (!styleObj.bunnyEnabled) {
      clearBunnyParticles();
    }
  }

  // Apply motorbike toggle if present
  if (styleObj.motorbikeEnabled !== undefined) {
    state.motorbikeEnabled = styleObj.motorbikeEnabled;
    const toggleMotorbike = document.getElementById('toggle-motorbike');
    if (toggleMotorbike) {
      toggleMotorbike.checked = styleObj.motorbikeEnabled;
    }
    if (scooterMesh) {
      scooterMesh.visible = styleObj.motorbikeEnabled;
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
  const lang = document.getElementById('select-language')?.value || 'en';
  const dict = translations[lang] || translations.en;
  
  if (savedStyles.length === 0) {
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

    let timeLabel = '';
    if (style.timeOfDay) {
      const key = 'btn' + style.timeOfDay.charAt(0).toUpperCase() + style.timeOfDay.slice(1);
      timeLabel = (dict[key] || style.timeOfDay).toUpperCase();
    }

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

    // Click handler to load style (with touchstart support to handle touch events instantly)
    const handleCardTap = (e) => {
      if (e.target.classList.contains('btn-delete-style')) return;
      e.preventDefault();
      e.stopPropagation();
      applyStyle(style);
      state.activePreset = style.id;
      
      document.querySelectorAll('.preset-card').forEach(c => c.classList.remove('active'));
      document.querySelectorAll('.saved-style-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
    };
    card.addEventListener('click', handleCardTap);
    card.addEventListener('touchstart', handleCardTap);

    // Delete handler
    const btnDelete = card.querySelector('.btn-delete-style');
    if (btnDelete) {
      const handleDelete = (e) => {
        e.preventDefault();
        e.stopPropagation();
        deleteStyle(style.id);
      };
      btnDelete.addEventListener('click', handleDelete);
      btnDelete.addEventListener('touchstart', handleDelete);
    }

    container.appendChild(card);
  });
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

window.onload = init;
