const $ = (id) => document.getElementById(id);
const SLUG = "bramble";
const LEGACY = "games.bramble.best";

const QUERY = new URLSearchParams(location.search);
const DEMO = QUERY.has("demo") || QUERY.has("capture");
const CAPTURE = QUERY.has("capture");

const CRUISE = 8.35;
const BOOST = 3.5;
const STRAFE = 7.8;
const MAX_CARRY = 8;
const SUN_SECONDS = 46;
const APPLE_SCORE = 100;
const GOLD_SCORE = 250;
const BURST_STEP = 80;
const GOLD_SUN = 1.5;
const HOME_SUN = 70;
const HOME_APPLE = 50;
const RING_HALF = 1.72;
const PICK_R = 1.36;
const BRIAR_R = 1.28;
const X_LIM = 8.6;
const HOME_Z = -208;
const START_Z = 16;

const RINGS = [
  { x: 0, z: -6.4 },
  { x: -1.35, z: -36 },
  { x: 1.55, z: -72 },
  { x: -0.7, z: -118 },
  { x: 0.35, z: -164 }
];

const APPLES = [
  { x: -1.05, z: 12.2, gold: false },
  { x: 1.0, z: 7.4, gold: false },
  { x: -0.7, z: 2.6, gold: false },
  { x: 0.15, z: -1.4, gold: true },

  { x: 2.15, z: -16, gold: false },
  { x: 2.7, z: -21.5, gold: false },
  { x: -1.55, z: -24, gold: false },
  { x: -2.45, z: -29.5, gold: true },
  { x: 0.2, z: -32.5, gold: false },

  { x: -2.2, z: -48, gold: false },
  { x: -2.85, z: -54, gold: true },
  { x: 1.7, z: -57, gold: false },
  { x: 2.55, z: -63, gold: false },
  { x: 0.15, z: -67.5, gold: false },

  { x: 1.9, z: -86, gold: false },
  { x: 3.15, z: -92, gold: true },
  { x: -1.35, z: -97, gold: false },
  { x: -2.5, z: -104, gold: false },
  { x: 0.45, z: -111, gold: false },

  { x: -1.7, z: -132, gold: false },
  { x: 2.15, z: -139, gold: false },
  { x: 0.35, z: -146, gold: true },
  { x: -1.1, z: -154, gold: false },
  { x: 1.35, z: -176, gold: false },
  { x: -0.8, z: -186, gold: false },
  { x: 0.2, z: -196, gold: true }
];

const BRIARS = [
  { x: 2.55, z: -20.6 },
  { x: -2.7, z: -53 },
  { x: 3.05, z: -93 },
  { x: 0.15, z: -140 },
  { x: -2.15, z: -184 }
];

const TREES = [
  { x: -12.5, z: 18, s: 1.15, c: 0 },
  { x: 13.2, z: 12, s: 1.35, c: 1 },
  { x: -14, z: 2, s: 1.05, c: 2 },
  { x: 11.6, z: -4, s: 1.25, c: 3 },
  { x: -11.2, z: -14, s: 1.4, c: 4 },
  { x: 14.4, z: -24, s: 1.1, c: 5 },
  { x: -13.5, z: -36, s: 1.3, c: 1 },
  { x: 12.2, z: -46, s: 1.5, c: 0 },
  { x: -15, z: -58, s: 1.15, c: 2 },
  { x: 13.8, z: -70, s: 1.2, c: 4 },
  { x: -12.4, z: -84, s: 1.45, c: 3 },
  { x: 11.8, z: -98, s: 1.05, c: 5 },
  { x: -14.2, z: -112, s: 1.3, c: 1 },
  { x: 14.6, z: -128, s: 1.2, c: 0 },
  { x: -11.6, z: -146, s: 1.4, c: 2 },
  { x: 12.8, z: -162, s: 1.15, c: 4 },
  { x: -13.8, z: -180, s: 1.25, c: 3 },
  { x: 13.4, z: -196, s: 1.35, c: 5 },
  { x: -12, z: -212, s: 1.1, c: 1 },
  { x: 11.4, z: -220, s: 1.2, c: 0 }
];

const CANOPY = [0xc4502a, 0xe07a2f, 0xd4a017, 0x8f3d2b, 0xc9842a, 0xe0b15a];

function readBest() {
  try {
    if (!window.HivemindHighscore) return null;
    return window.HivemindHighscore.get(SLUG, LEGACY);
  } catch (err) {
    return null;
  }
}

function commitBest(value) {
  try {
    if (!window.HivemindHighscore) return { best: null, improved: false };
    return window.HivemindHighscore.submit(SLUG, value, { mode: "max", legacy: LEGACY });
  } catch (err) {
    return { best: null, improved: false };
  }
}

function bestText(n) {
  return "BEST: " + (n == null ? "—" : String(n));
}

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function showFail(message) {
  const fail = $("fail");
  const title = $("title");
  if (title) title.classList.add("hidden");
  if (!fail) return;
  fail.classList.remove("hidden");
  fail.innerHTML = `${message} <a href="../../index.html">All games</a>`;
}

function hasWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (canvas.getContext("webgl2") || canvas.getContext("webgl")));
  } catch (err) {
    return false;
  }
}

const held = new Set();
const pressed = new Set();
const touch = { x: 0, y: 0, on: false };
const drag = { x: 0, y: 0, on: false };
let hopQueued = false;

window.addEventListener("keydown", (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.code === "Space" || e.code.startsWith("Arrow")) e.preventDefault();
  if (e.repeat || held.has(e.code)) return;
  held.add(e.code);
  pressed.add(e.code);
});

window.addEventListener("keyup", (e) => {
  held.delete(e.code);
});

window.addEventListener("blur", () => {
  held.clear();
  pressed.clear();
  touch.on = false;
  drag.on = false;
});

function consume(code) {
  if (!pressed.has(code)) return false;
  pressed.delete(code);
  return true;
}

function axis() {
  let x = 0;
  let y = 0;
  if (held.has("KeyA") || held.has("ArrowLeft")) x -= 1;
  if (held.has("KeyD") || held.has("ArrowRight")) x += 1;
  if (held.has("KeyW") || held.has("ArrowUp")) y += 1;
  if (held.has("KeyS") || held.has("ArrowDown")) y -= 1;
  if (x !== 0 || y !== 0) return { x: clamp(x, -1, 1), y: clamp(y, -1, 1) };
  if (touch.on) return { x: touch.x, y: touch.y };
  if (drag.on) return { x: drag.x, y: drag.y };
  return { x: 0, y: 0 };
}

let audioCtx = null;
let muted = false;

function audio() {
  if (muted) return null;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  try {
    if (!audioCtx) audioCtx = window.__mobileAudio || new AC();
    if (audioCtx.state === "suspended") audioCtx.resume();
    return audioCtx;
  } catch (err) {
    return null;
  }
}

function tone(freq, dur, type, gain) {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type || "sine";
  osc.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain || 0.05, t + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g);
  g.connect(ac.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

function chord(freqs) {
  freqs.forEach((f, i) => {
    setTimeout(() => tone(f, 0.22, "triangle", 0.04), i * 55);
  });
}

function scratch() {
  const ac = audio();
  if (!ac) return;
  const n = Math.floor(ac.sampleRate * 0.16);
  const buf = ac.createBuffer(1, n, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < n; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const src = ac.createBufferSource();
  src.buffer = buf;
  const filter = ac.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = 700;
  const g = ac.createGain();
  g.gain.value = 0.07;
  src.connect(filter);
  filter.connect(g);
  g.connect(ac.destination);
  src.start();
}

function softTexture() {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 64;
  const g = c.getContext("2d");
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, "rgba(255,255,255,1)");
  grd.addColorStop(0.4, "rgba(255,255,255,0.45)");
  grd.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function groundTexture() {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 512;
  const g = c.getContext("2d");
  g.fillStyle = "#8eae4e";
  g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 2800; i += 1) {
    const shade = Math.random();
    g.fillStyle = shade > 0.55 ? "rgba(90, 70, 30, 0.28)" : "rgba(220, 190, 80, 0.22)";
    g.fillRect(Math.random() * 512, Math.random() * 512, 2 + Math.random() * 4, 1 + Math.random() * 2);
  }
  const path = g.createLinearGradient(150, 0, 362, 0);
  path.addColorStop(0, "rgba(196, 150, 86, 0)");
  path.addColorStop(0.18, "rgba(186, 136, 74, 0.95)");
  path.addColorStop(0.5, "rgba(214, 170, 104, 1)");
  path.addColorStop(0.82, "rgba(186, 136, 74, 0.95)");
  path.addColorStop(1, "rgba(196, 150, 86, 0)");
  g.fillStyle = path;
  g.fillRect(150, 0, 212, 512);
  g.fillStyle = "rgba(110, 72, 36, 0.18)";
  for (let i = 0; i < 180; i += 1) {
    g.fillRect(190 + Math.random() * 140, Math.random() * 512, 10, 2);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.repeat.set(2, 40);
  return tex;
}

function skyTexture() {
  const c = document.createElement("canvas");
  c.width = 8;
  c.height = 256;
  const g = c.getContext("2d");
  const grd = g.createLinearGradient(0, 0, 0, 256);
  grd.addColorStop(0, "#8eb6dc");
  grd.addColorStop(0.38, "#f6d7b0");
  grd.addColorStop(0.62, "#f3b06a");
  grd.addColorStop(1, "#ef8d4e");
  g.fillStyle = grd;
  g.fillRect(0, 0, 8, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function mobileGpu() {
  return document.body.classList.contains("touch") || window.innerWidth < 820;
}

function boot() {
  if (typeof THREE === "undefined") {
    showFail("This browser could not load the 3D library, so Bramble cannot start.");
    return;
  }
  if (!hasWebGL()) {
    showFail("This browser has no WebGL context, so Bramble cannot start.");
    return;
  }

  const canvas = $("view");
  const phone = window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 820;
  if (phone) document.body.classList.add("touch");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: !phone,
      alpha: false,
      powerPreference: phone ? "low-power" : "high-performance",
      failIfMajorPerformanceCaveat: false,
      preserveDrawingBuffer: CAPTURE
    });
  } catch (err) {
    showFail("This browser has no WebGL context, so Bramble cannot start.");
    return;
  }
  if (!renderer.getContext()) {
    showFail("This browser has no WebGL context, so Bramble cannot start.");
    return;
  }

  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf0a56a);
  scene.fog = new THREE.FogExp2(0xf0a56a, 0.0115);
  const fogDay = new THREE.Color(0xf0a56a);
  const fogDusk = new THREE.Color(0xc47a8a);

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 240);

  const hemi = new THREE.HemisphereLight(0xffe0c2, 0x6a8a3a, 0.95);
  scene.add(hemi);
  const fill = new THREE.DirectionalLight(0xc5dcff, 0.62);
  fill.position.set(16, 10, 8);
  scene.add(fill);

  const sun = new THREE.DirectionalLight(0xffc48a, 3.15);
  sun.castShadow = true;
  const mapSize = phone ? 512 : 1024;
  sun.shadow.mapSize.set(mapSize, mapSize);
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = 46;
  sun.shadow.camera.left = -14;
  sun.shadow.camera.right = 14;
  sun.shadow.camera.top = 14;
  sun.shadow.camera.bottom = -14;
  sun.shadow.bias = -0.00028;
  sun.shadow.normalBias = 0.04;
  scene.add(sun);
  scene.add(sun.target);

  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(150, 28, 18),
    new THREE.MeshBasicMaterial({ map: skyTexture(), side: THREE.BackSide, depthWrite: false, fog: false })
  );
  scene.add(sky);

  const soft = softTexture();
  const sunCore = new THREE.Sprite(new THREE.SpriteMaterial({
    map: soft,
    color: 0xfff6d2,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    fog: false,
    toneMapped: false,
    opacity: 0.95
  }));
  sunCore.scale.set(16, 16, 1);
  scene.add(sunCore);
  const sunGlow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: soft,
    color: 0xff7a3a,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    fog: false,
    toneMapped: false,
    opacity: 0.4
  }));
  sunGlow.scale.set(54, 54, 1);
  scene.add(sunGlow);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(36, 280),
    new THREE.MeshStandardMaterial({ map: groundTexture(), color: 0xffffff, roughness: 0.94, metalness: 0 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, 0, -100);
  ground.receiveShadow = true;
  scene.add(ground);

  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5a3a28, roughness: 0.86 });
  const trunkGeo = new THREE.CylinderGeometry(0.18, 0.28, 1.7, 7);
  const canopyGeo = new THREE.SphereGeometry(1, 14, 12);
  const canopyMats = CANOPY.map((hex) => new THREE.MeshStandardMaterial({
    color: hex,
    roughness: 0.78,
    metalness: 0.02
  }));
  TREES.forEach((t) => {
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.set(t.x, 0.85, t.z);
    trunk.scale.setScalar(t.s);
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    scene.add(trunk);
    for (let i = 0; i < 3; i += 1) {
      const puff = new THREE.Mesh(canopyGeo, canopyMats[(t.c + i) % canopyMats.length]);
      const ang = i * 2.1;
      puff.position.set(
        t.x + Math.cos(ang) * 0.45 * t.s,
        1.85 * t.s + (i === 0 ? 0.35 : 0),
        t.z + Math.sin(ang) * 0.38 * t.s
      );
      puff.scale.setScalar(t.s * (i === 0 ? 1.25 : 0.92));
      puff.castShadow = true;
      puff.receiveShadow = true;
      scene.add(puff);
    }
  });

  const grassCount = phone ? 70 : 140;
  const grass = new THREE.InstancedMesh(
    new THREE.ConeGeometry(0.09, 0.42, 4),
    new THREE.MeshStandardMaterial({ color: 0x7ea344, roughness: 0.9 }),
    grassCount
  );
  grass.castShadow = false;
  grass.receiveShadow = true;
  const dummy = new THREE.Object3D();
  for (let i = 0; i < grassCount; i += 1) {
    const side = i % 2 === 0 ? -1 : 1;
    dummy.position.set(side * (4.2 + (i % 7) * 0.85), 0.18, 24 - (i * 1.85) % 250);
    dummy.rotation.y = i;
    dummy.scale.setScalar(0.7 + (i % 5) * 0.12);
    dummy.updateMatrix();
    grass.setMatrixAt(i, dummy.matrix);
  }
  scene.add(grass);

  const leafCount = phone || reduceMotion ? 28 : 56;
  const leafColors = [0xe07a2f, 0xc4502a, 0xe6c15a, 0xa33b24];
  const leafState = [];
  const leaves = new THREE.Group();
  for (let i = 0; i < leafCount; i += 1) {
    const mat = new THREE.SpriteMaterial({
      map: soft,
      color: leafColors[i % leafColors.length],
      transparent: true,
      depthWrite: false,
      opacity: 0.85
    });
    const sprite = new THREE.Sprite(mat);
    const s = 0.16 + (i % 4) * 0.05;
    sprite.scale.set(s, s * 0.7, 1);
    leaves.add(sprite);
    leafState.push({
      sprite,
      x: (Math.random() - 0.5) * 14,
      y: 1.2 + Math.random() * 5,
      z: (Math.random() - 0.5) * 16,
      speed: 0.28 + Math.random() * 0.55,
      drift: (Math.random() - 0.5) * 0.45
    });
  }
  scene.add(leaves);

  const litterCount = phone ? 40 : 80;
  const litter = new THREE.InstancedMesh(
    new THREE.PlaneGeometry(0.28, 0.16),
    new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide }),
    litterCount
  );
  for (let i = 0; i < litterCount; i += 1) {
    litter.setColorAt(i, new THREE.Color(leafColors[i % leafColors.length]));
    dummy.position.set((Math.random() - 0.5) * 16, 0.03, 22 - Math.random() * 240);
    dummy.rotation.set(-Math.PI / 2, 0, Math.random() * 6);
    dummy.scale.setScalar(0.7 + Math.random() * 0.8);
    dummy.updateMatrix();
    litter.setMatrixAt(i, dummy.matrix);
  }
  litter.instanceColor.needsUpdate = true;
  scene.add(litter);

  const appleGeo = new THREE.SphereGeometry(0.26, 16, 14);
  const stemGeo = new THREE.CylinderGeometry(0.025, 0.03, 0.16, 5);
  const leafAppleGeo = new THREE.SphereGeometry(0.09, 8, 6);
  const redMat = new THREE.MeshStandardMaterial({
    color: 0xff4d42,
    roughness: 0.42,
    metalness: 0.04,
    emissive: 0x8a1c14,
    emissiveIntensity: 0.4
  });
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xffd56a,
    roughness: 0.36,
    metalness: 0.08,
    emissive: 0xffb703,
    emissiveIntensity: 0.55
  });
  const stemMat = new THREE.MeshStandardMaterial({ color: 0x5a3a22, roughness: 0.7 });
  const appleLeafMat = new THREE.MeshStandardMaterial({ color: 0x7dba4a, roughness: 0.55 });

  function appleGroup(gold, withLight) {
    const g = new THREE.Group();
    const fruit = new THREE.Mesh(appleGeo, gold ? goldMat : redMat);
    fruit.scale.y = 0.9;
    fruit.castShadow = true;
    g.add(fruit);
    const stem = new THREE.Mesh(stemGeo, stemMat);
    stem.position.y = 0.24;
    g.add(stem);
    const leaf = new THREE.Mesh(leafAppleGeo, appleLeafMat);
    leaf.scale.set(1.4, 0.45, 0.7);
    leaf.position.set(0.1, 0.28, 0);
    leaf.rotation.z = -0.6;
    g.add(leaf);
    if (withLight && gold && !phone) {
      const light = new THREE.PointLight(0xffc14d, 0.7, 3.4, 2);
      light.position.y = 0.2;
      g.add(light);
    }
    return g;
  }

  const apples = APPLES.map((spec) => {
    const mesh = appleGroup(spec.gold, true);
    mesh.position.set(spec.x, 0.26, spec.z);
    scene.add(mesh);
    return { x: spec.x, z: spec.z, gold: spec.gold, baseX: spec.x, baseZ: spec.z, mesh, taken: false };
  });

  const slotRoot = new THREE.Group();
  const slots = [];
  const slotSpots = [
    [-0.64, 0.52, -0.02],
    [0.64, 0.5, 0.02],
    [-0.3, 0.86, -0.08],
    [0.32, 0.88, -0.12],
    [-0.52, 0.34, -0.36],
    [0.54, 0.32, -0.38],
    [0.02, 0.8, -0.4],
    [-0.12, 0.46, -0.56]
  ];
  for (let i = 0; i < MAX_CARRY; i += 1) {
    const mesh = appleGroup(false, false);
    mesh.position.set(slotSpots[i][0], slotSpots[i][1], slotSpots[i][2]);
    mesh.scale.setScalar(0.7);
    mesh.visible = false;
    slotRoot.add(mesh);
    slots.push({ mesh, gold: false, apple: null });
  }

  const briarMat = new THREE.MeshStandardMaterial({
    color: 0x6a3034,
    roughness: 0.72,
    emissive: 0x4a1420,
    emissiveIntensity: 0.55
  });
  const thornMat = new THREE.MeshStandardMaterial({
    color: 0xe25566,
    roughness: 0.4,
    emissive: 0xa02030,
    emissiveIntensity: 0.8
  });
  const thornGeo = new THREE.ConeGeometry(0.09, 0.72, 5);
  const briars = BRIARS.map((spec) => {
    const g = new THREE.Group();
    const base = new THREE.Mesh(new THREE.SphereGeometry(0.48, 12, 10), briarMat);
    base.scale.set(1.35, 0.7, 1.15);
    base.position.y = 0.28;
    base.castShadow = true;
    base.receiveShadow = true;
    g.add(base);
    const crown = new THREE.Mesh(thornGeo, thornMat);
    crown.position.y = 0.62;
    crown.castShadow = true;
    g.add(crown);
    for (let i = 0; i < 8; i += 1) {
      const thorn = new THREE.Mesh(thornGeo, thornMat);
      const ang = (i / 8) * Math.PI * 2;
      thorn.position.set(Math.cos(ang) * 0.3, 0.38, Math.sin(ang) * 0.26);
      thorn.rotation.z = -Math.cos(ang) * 0.75;
      thorn.rotation.x = Math.sin(ang) * 0.75;
      thorn.castShadow = true;
      g.add(thorn);
    }
    g.position.set(spec.x, 0, spec.z);
    scene.add(g);
    return { x: spec.x, z: spec.z, mesh: g };
  });

  const ringMat = new THREE.MeshStandardMaterial({
    color: 0xc48a3c,
    roughness: 0.48,
    metalness: 0.08,
    emissive: 0x8a4e12,
    emissiveIntensity: 0.45
  });
  const ringGlowMat = new THREE.MeshBasicMaterial({ color: 0xffd27a });
  const ringDoneMat = new THREE.MeshBasicMaterial({ color: 0x7ee787 });
  const rings = RINGS.map((spec) => {
    const g = new THREE.Group();
    const hoop = new THREE.Mesh(new THREE.TorusGeometry(1.72, 0.13, 10, 28), ringMat);
    hoop.castShadow = true;
    hoop.receiveShadow = true;
    g.add(hoop);
    const glow = new THREE.Mesh(new THREE.TorusGeometry(1.48, 0.035, 8, 32), ringGlowMat);
    g.add(glow);
    const basket = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.36, 0.42, 10), ringMat);
    basket.position.set(-2.35, -1.5, 0.15);
    basket.castShadow = true;
    basket.receiveShadow = true;
    g.add(basket);
    const light = new THREE.PointLight(0xffb45a, phone ? 0.8 : 1.6, 9, 2);
    light.position.set(0, 1.2, 0);
    g.add(light);
    g.position.set(spec.x, 1.72, spec.z);
    scene.add(g);
    const postL = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 1.5, 6), trunkMat);
    postL.position.set(spec.x - 1.72, 0.75, spec.z);
    postL.castShadow = true;
    scene.add(postL);
    const postR = postL.clone();
    postR.position.x = spec.x + 1.72;
    scene.add(postR);
    return { x: spec.x, z: spec.z, mesh: g, glow, light, used: false };
  });

  const burrow = new THREE.Group();
  const mound = new THREE.Mesh(
    new THREE.SphereGeometry(1.6, 18, 14),
    new THREE.MeshStandardMaterial({ color: 0x6a4a32, roughness: 0.9 })
  );
  mound.scale.y = 0.55;
  mound.position.y = 0.35;
  mound.castShadow = true;
  mound.receiveShadow = true;
  burrow.add(mound);
  const mouth = new THREE.Mesh(
    new THREE.CircleGeometry(0.7, 18),
    new THREE.MeshBasicMaterial({ color: 0x1a0e08 })
  );
  mouth.position.set(0, 0.55, 0.85);
  burrow.add(mouth);
  const arch = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.08, 8, 20, Math.PI), ringMat);
  arch.position.set(0, 0.15, 0.9);
  arch.rotation.y = Math.PI;
  burrow.add(arch);
  const hearth = new THREE.PointLight(0xffa040, 3.2, 12, 2);
  hearth.position.set(0, 0.7, 0.4);
  burrow.add(hearth);
  burrow.position.set(0, 0, HOME_Z - 1.2);
  scene.add(burrow);

  const hog = new THREE.Group();
  const roll = new THREE.Group();
  roll.position.y = 0.5;
  hog.add(roll);
  const body = new THREE.Mesh(
    new THREE.SphereGeometry(0.48, 22, 16),
    new THREE.MeshStandardMaterial({
      color: 0x7a4e28,
      roughness: 0.7,
      metalness: 0.03,
      emissive: 0x4a2c14,
      emissiveIntensity: 0.35
    })
  );
  body.castShadow = true;
  roll.add(body);
  const spineGeo = new THREE.ConeGeometry(0.075, 0.5, 5);
  spineGeo.translate(0, 0.18, 0);
  const spineMat = new THREE.MeshStandardMaterial({ color: 0xe6d3b4, roughness: 0.48 });
  const spineDark = new THREE.MeshStandardMaterial({ color: 0x8d5e34, roughness: 0.62 });
  const spineCount = 22;
  for (let i = 0; i < spineCount; i += 1) {
    const y = 1 - (i / (spineCount - 1)) * 1.35;
    const ringR = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = Math.PI * (3 - Math.sqrt(5)) * i;
    const dir = new THREE.Vector3(Math.cos(theta) * ringR, y, Math.sin(theta) * ringR);
    if (dir.z > 0.2 && dir.y > -0.05) continue;
    const spine = new THREE.Mesh(spineGeo, i % 3 === 0 ? spineDark : spineMat);
    spine.position.copy(dir).multiplyScalar(0.42);
    spine.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    spine.castShadow = true;
    roll.add(spine);
  }
  hog.add(slotRoot);

  const face = new THREE.Group();
  const muzzle = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 14, 12),
    new THREE.MeshStandardMaterial({ color: 0xf0d2b4, roughness: 0.62 })
  );
  muzzle.scale.set(1, 0.82, 1.15);
  face.add(muzzle);
  const nose = new THREE.Mesh(
    new THREE.SphereGeometry(0.07, 10, 8),
    new THREE.MeshStandardMaterial({ color: 0x2a160f, roughness: 0.4 })
  );
  nose.position.set(0, 0.02, -0.18);
  face.add(nose);
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x1a120e, roughness: 0.3 });
  const eyeWhite = new THREE.MeshBasicMaterial({ color: 0xfff8ee });
  [-0.1, 0.1].forEach((x) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), eyeMat);
    eye.position.set(x, 0.1, -0.12);
    face.add(eye);
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 6), eyeWhite);
    dot.position.set(x + 0.015, 0.12, -0.16);
    face.add(dot);
  });
  const earMat = new THREE.MeshStandardMaterial({ color: 0x6b4423, roughness: 0.7 });
  const innerMat = new THREE.MeshStandardMaterial({ color: 0xd9897a, roughness: 0.6 });
  [-1, 1].forEach((side) => {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), earMat);
    ear.scale.set(0.7, 1.15, 0.55);
    ear.position.set(side * 0.16, 0.24, 0.02);
    face.add(ear);
    const inner = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), innerMat);
    inner.position.set(side * 0.16, 0.24, -0.03);
    face.add(inner);
  });
  face.position.set(0.02, 0.42, 0.34);
  face.rotation.y = Math.PI;
  hog.add(face);
  hog.scale.setScalar(1.28);

  const blob = new THREE.Mesh(
    new THREE.CircleGeometry(0.62, 18),
    new THREE.MeshBasicMaterial({ color: 0x1a120c, transparent: true, opacity: 0.32, depthWrite: false })
  );
  blob.rotation.x = -Math.PI / 2;
  blob.position.y = 0.025;
  scene.add(blob);
  scene.add(hog);

  const sparkCount = 40;
  const sparks = [];
  for (let i = 0; i < sparkCount; i += 1) {
    const mesh = new THREE.Sprite(new THREE.SpriteMaterial({
      map: soft,
      color: 0xffd27a,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
      opacity: 0
    }));
    mesh.scale.set(0.4, 0.4, 1);
    mesh.visible = false;
    scene.add(mesh);
    sparks.push({ mesh, life: 0, vel: new THREE.Vector3() });
  }

  let bloom = null;
  function fit() {
    const box = window.viewSize ? window.viewSize() : { w: window.innerWidth, h: window.innerHeight };
    camera.aspect = box.w / Math.max(1, box.h);
    camera.updateProjectionMatrix();
    const cap = Math.min(window.devicePixelRatio || 1, mobileGpu() ? 1.5 : 2);
    renderer.setPixelRatio(cap);
    renderer.setSize(box.w, box.h, false);
  }
  fit();
  try {
    if (window.LabBloom && !phone) {
      bloom = window.LabBloom(renderer, scene, camera, {
        threshold: 0.78,
        strength: 0.32,
        div: 2
      });
    }
  } catch (err) {
    bloom = null;
  }
  function resize() {
    fit();
    if (bloom) bloom.resize();
  }
  window.addEventListener("resize", resize);
  window.addEventListener("orientationchange", resize);

  const state = {
    mode: "title",
    x: 0,
    z: START_Z,
    y: 0,
    vy: 0,
    prevZ: START_Z,
    spin: 0,
    score: 0,
    carried: 0,
    rings: 0,
    sun: SUN_SECONDS,
    slow: 0,
    hitCd: 0,
    hint: 0,
    call: 0,
    shake: 0,
    squash: 0,
    time: 0,
    best: readBest()
  };

  const camPos = new THREE.Vector3(2.6, 3.2, START_Z + 6);
  const look = new THREE.Vector3();

  function paintBest() {
    const text = bestText(state.best);
    const best = $("best");
    const titleBest = $("titleBest");
    if (best) best.textContent = text;
    if (titleBest) titleBest.textContent = text;
  }
  paintBest();

  function say(text) {
    const node = $("callout");
    if (!node) return;
    node.textContent = text;
    node.classList.remove("hidden");
    state.call = 1.35;
  }

  function flash(color, amount) {
    const node = $("flash");
    if (!node) return;
    node.style.background = color;
    node.style.opacity = String(amount);
  }

  function burst(x, y, z, color, n) {
    let left = n;
    for (let i = 0; i < sparks.length && left > 0; i += 1) {
      const spark = sparks[i];
      if (spark.life > 0) continue;
      spark.life = 0.45 + Math.random() * 0.35;
      spark.mesh.visible = true;
      spark.mesh.position.set(x, y, z);
      spark.mesh.material.color.set(color);
      spark.mesh.material.opacity = 1;
      spark.vel.set((Math.random() - 0.5) * 3.2, 1.1 + Math.random() * 2.2, (Math.random() - 0.5) * 3.2);
      left -= 1;
    }
  }

  function setModal(on) {
    document.body.classList.toggle("modal", on);
  }

  function resetWorld() {
    state.x = 0;
    state.z = START_Z;
    state.y = 0;
    state.vy = 0;
    state.prevZ = START_Z;
    state.spin = 0;
    state.score = 0;
    state.carried = 0;
    state.rings = 0;
    state.sun = SUN_SECONDS;
    state.slow = 0;
    state.hitCd = 0;
    state.hint = 1.8;
    state.call = 0;
    state.shake = 0;
    state.squash = 0;
    apples.forEach((apple) => {
      apple.taken = false;
      apple.x = apple.baseX;
      apple.z = apple.baseZ;
      apple.mesh.visible = true;
      apple.mesh.position.set(apple.x, 0.26, apple.z);
      apple.mesh.scale.setScalar(1);
    });
    slots.forEach((slot) => {
      slot.mesh.visible = false;
      slot.gold = false;
      slot.apple = null;
      slot.mesh.children[0].material = redMat;
    });
    rings.forEach((ring) => {
      ring.used = false;
      ring.glow.material = ringGlowMat;
      ring.light.color.set(0xffb45a);
      ring.light.intensity = phone ? 0.8 : 1.6;
    });
    paintHud();
  }

  function paintHud() {
    const score = $("score");
    const spines = $("spines");
    const ringsLabel = $("rings");
    const sunBar = $("sunBar");
    if (score) score.textContent = String(state.score);
    if (spines) spines.textContent = state.carried + "/" + MAX_CARRY;
    if (ringsLabel) ringsLabel.textContent = state.rings + "/5";
    if (sunBar) sunBar.style.transform = "scaleX(" + clamp(state.sun / SUN_SECONDS, 0, 1) + ")";
  }

  function showTitle() {
    state.mode = "title";
    $("title").classList.remove("hidden");
    $("pause").classList.add("hidden");
    $("end").classList.add("hidden");
    $("hud").hidden = true;
    $("hint").classList.add("hidden");
    setModal(true);
  }

  function begin() {
    resetWorld();
    state.mode = "play";
    $("title").classList.add("hidden");
    $("pause").classList.add("hidden");
    $("end").classList.add("hidden");
    $("hud").hidden = false;
    $("hint").classList.remove("hidden");
    setModal(false);
    camPos.set(state.x + 2.5, 3.15, state.z + 5.8);
    audio();
  }

  function pause() {
    if (state.mode !== "play") return;
    state.mode = "pause";
    $("pause").classList.remove("hidden");
    setModal(true);
  }

  function resume() {
    if (state.mode !== "pause") return;
    state.mode = "play";
    $("pause").classList.add("hidden");
    setModal(false);
  }

  function finish(won) {
    if (state.mode === "end") return;
    if (won) {
      const left = Math.max(0, Math.ceil(state.sun));
      const bonus = left * HOME_SUN + state.carried * HOME_APPLE;
      state.score += bonus;
      say("+" + bonus);
      chord([523, 659, 784, 1046]);
    } else {
      tone(196, 0.4, "sawtooth", 0.03);
    }
    state.mode = "end";
    const result = commitBest(state.score);
    if (result && result.best != null) state.best = result.best;
    paintBest();
    paintHud();
    $("endKicker").textContent = won ? "burrow" : "dusk";
    $("endTitle").textContent = won ? "Home before dark" : "The sun went down";
    $("endText").textContent = won
      ? "The burrow is warm. Every apple still on your spines and every second of daylight came home with you."
      : "Dusk closed the orchard. The rings you banked still count. The apples left on your spines do not.";
    $("endRecord").classList.toggle("hidden", !(result && result.improved));
    const bestBit = state.best == null ? "" : " Best " + state.best + ".";
    $("endScore").textContent = "Score " + state.score + "." + bestBit;
    $("end").classList.remove("hidden");
    $("hud").hidden = true;
    setModal(true);
  }

  function stickApple(apple) {
    if (apple.taken || state.carried >= MAX_CARRY) return;
    apple.taken = true;
    apple.mesh.visible = false;
    const slot = slots[state.carried];
    slot.gold = apple.gold;
    slot.apple = apple;
    slot.mesh.children[0].material = apple.gold ? goldMat : redMat;
    slot.mesh.visible = true;
    slot.mesh.scale.setScalar(0.2);
    state.carried += 1;
    state.squash = 0.18;
    burst(state.x, 0.8 + state.y, state.z, apple.gold ? 0xffd56a : 0xff6b5a, apple.gold ? 8 : 5);
    if (apple.gold) {
      tone(880, 0.12, "triangle", 0.05);
      setTimeout(() => tone(1174, 0.14, "sine", 0.04), 60);
      say("gold");
    } else {
      tone(620, 0.08, "sine", 0.045);
    }
    paintHud();
  }

  function dropApples() {
    const n = Math.min(2, state.carried);
    if (!n) return;
    for (let k = 0; k < n; k += 1) {
      state.carried -= 1;
      const slot = slots[state.carried];
      slot.mesh.visible = false;
      const apple = slot.apple;
      slot.apple = null;
      const side = k === 0 ? -1 : 1;
      if (apple) {
        apple.taken = false;
        apple.x = clamp(state.x + side * 2.3, -X_LIM, X_LIM);
        apple.z = state.z - 3.4 - k * 0.6;
        apple.mesh.visible = true;
        apple.mesh.position.set(apple.x, 0.26, apple.z);
      }
    }
    state.slow = 0.55;
    state.hitCd = 0.85;
    state.shake = 0.28;
    scratch();
    flash("#ffb4a8", 0.35);
    say("briar");
    burst(state.x, 0.6, state.z, 0xff5a4a, 10);
    paintHud();
  }

  function bank(ring) {
    if (state.carried <= 0 || ring.used) return;
    const n = state.carried;
    let gained = 0;
    let golds = 0;
    for (let i = 0; i < n; i += 1) {
      const slot = slots[i];
      gained += slot.gold ? GOLD_SCORE : APPLE_SCORE;
      if (slot.gold) golds += 1;
      slot.mesh.visible = false;
      slot.apple = null;
    }
    const burstBonus = n >= 4 ? BURST_STEP * (n - 3) : 0;
    gained += burstBonus;
    state.score += gained;
    state.carried = 0;
    state.rings += 1;
    ring.used = true;
    ring.glow.material = ringDoneMat;
    ring.light.color.set(0x7ee787);
    state.sun = Math.min(SUN_SECONDS, state.sun + golds * GOLD_SUN);
    state.squash = 0.28;
    state.shake = 0.12;
    burst(ring.x, 1.3, ring.z, 0xffe1a8, 18);
    flash("#ffe7c2", 0.42);
    say("+" + gained);
    chord([659, 830, 988]);
    paintHud();
  }

  function demoAxis() {
    let avoid = 0;
    briars.forEach((briar) => {
      const ahead = state.z - briar.z;
      if (ahead > 0.3 && ahead < 7.5) {
        const dx = briar.x - state.x;
        if (Math.abs(dx) < 1.9) avoid += dx > 0 ? -1 : 1;
      }
    });
    let best = null;
    let bestAhead = 1e9;
    if (state.carried < MAX_CARRY) {
      apples.forEach((apple) => {
        if (apple.taken) return;
        const ahead = state.z - apple.z;
        if (ahead < -0.3 || ahead > 14) return;
        if (ahead < bestAhead) {
          bestAhead = ahead;
          best = apple;
        }
      });
    }
    const next = rings.find((ring) => !ring.used && ring.z < state.z - 0.15);
    const ringAhead = next ? state.z - next.z : 1e9;
    let targetX = 0;
    if (best && (state.carried === 0 || bestAhead + 0.6 < ringAhead)) targetX = best.x;
    else if (next) targetX = next.x;
    else if (best) targetX = best.x;
    if (avoid) targetX = state.x + avoid * 2.8;
    const steer = clamp((targetX - state.x) * 1.6, -1, 1);
    const liningUp = next && state.carried > 0 && ringAhead < 8;
    return { x: steer, y: liningUp ? -0.25 : 0.08 };
  }

  function update(dt) {
    state.time += dt;
    const playing = state.mode === "play";
    const input = playing ? (DEMO ? demoAxis() : axis()) : { x: 0, y: 0 };

    if (playing) {
      if ((consume("Space") || hopQueued) && state.y <= 0.02) {
        state.vy = 5.35;
        state.squash = 0.16;
        tone(240, 0.09, "triangle", 0.04);
      }
      hopQueued = false;
      state.vy -= 15.5 * dt;
      state.y += state.vy * dt;
      if (state.y <= 0) {
        if (state.vy < -1.2) {
          state.squash = 0.2;
          burst(state.x, 0.15, state.z, 0xd7b899, 5);
        }
        state.y = 0;
        state.vy = 0;
      }

      const slowMul = state.slow > 0 ? 0.46 : 1;
      state.slow = Math.max(0, state.slow - dt);
      state.hitCd = Math.max(0, state.hitCd - dt);
      const forward = (CRUISE + input.y * BOOST) * slowMul;
      state.prevZ = state.z;
      state.z -= Math.max(2.2, forward) * dt;
      state.x += input.x * STRAFE * dt;
      if (state.x > X_LIM || state.x < -X_LIM) {
        state.x = clamp(state.x, -X_LIM, X_LIM);
      }
      state.spin -= forward * dt / 0.5;
      state.sun -= dt;
      state.hint = Math.max(0, state.hint - dt);
      if (state.sun <= 0) {
        state.sun = 0;
        finish(false);
      }
    }

    apples.forEach((apple, index) => {
      if (apple.taken) return;
      const bob = Math.sin(state.time * 2.2 + index) * (apple.gold ? 0.09 : 0.05);
      apple.mesh.position.set(apple.x, 0.26 + bob, apple.z);
      apple.mesh.rotation.y += dt * (apple.gold ? 1.4 : 0.6);
      if (!playing) return;
      const dx = apple.x - state.x;
      const dz = apple.z - state.z;
      if (dx * dx + dz * dz < PICK_R * PICK_R && state.y < 1.15) stickApple(apple);
    });

    if (playing && state.y < 0.4 && state.hitCd <= 0) {
      briars.forEach((briar) => {
        if (state.hitCd > 0) return;
        const dx = briar.x - state.x;
        const dz = briar.z - state.z;
        if (dx * dx + dz * dz < BRIAR_R * BRIAR_R) dropApples();
      });
    }

    if (playing) {
      rings.forEach((ring) => {
        if (ring.used) return;
        const crossed = state.prevZ > ring.z && state.z <= ring.z;
        if (!crossed) return;
        if (Math.abs(state.x - ring.x) > RING_HALF) {
          if (state.carried > 0) say("missed");
          return;
        }
        if (state.carried > 0) bank(ring);
        else say("need apples");
      });
      if (state.z <= HOME_Z && Math.abs(state.x) < 3.2) finish(true);
    }

    const lean = playing ? input.x : Math.sin(state.time * 0.8) * 0.15;
    hog.position.set(state.x, state.y, state.z);
    hog.rotation.z = lerp(hog.rotation.z, -lean * 0.28, 0.18);
    hog.rotation.y = lerp(hog.rotation.y, lean * 0.18, 0.12);
    roll.rotation.x = state.spin;
    const squash = 1 - state.squash;
    const hopStretch = state.y > 0.05 ? 1.06 : 1;
    roll.scale.set(1 + state.squash * 0.4, squash * hopStretch, 1 + state.squash * 0.2);
    state.squash = Math.max(0, state.squash - dt * 1.6);
    face.position.y = 0.58 + Math.sin(state.time * (playing ? 14 : 3)) * (playing ? 0.025 : 0.04);
    blob.position.set(state.x, 0.03, state.z);
    const blobScale = 1 - Math.min(0.45, state.y * 0.35);
    blob.scale.setScalar(blobScale);

    slots.forEach((slot, index) => {
      if (!slot.mesh.visible) return;
      const s = slot.mesh.scale.x;
      const wobble = 1 + Math.sin(state.time * 7 + index) * 0.04;
      slot.mesh.scale.setScalar(lerp(s, 0.7 * wobble, 0.22));
    });

    rings.forEach((ring) => {
      const pulse = 1 + Math.sin(state.time * 3 + ring.z) * 0.035;
      ring.glow.scale.setScalar(ring.used ? 1 : pulse);
    });
    hearth.intensity = 2.4 + Math.sin(state.time * 5) * 0.6;

    const anchorZ = playing || state.mode === "pause" || state.mode === "end" ? state.z : START_Z;
    const anchorX = playing || state.mode === "pause" || state.mode === "end" ? state.x : 0;
    let desired;
    if (state.mode === "title" && !reduceMotion) {
      const ang = state.time * 0.18;
      desired = new THREE.Vector3(Math.sin(ang) * 6.2, 2.8, START_Z + 4.8 + Math.cos(ang) * 1.4);
    } else {
      desired = new THREE.Vector3(anchorX + 1.55, 2.25 + state.y * 0.25, anchorZ + 4.15);
    }
    const shake = state.shake;
    if (shake > 0) {
      desired.x += Math.sin(state.time * 46) * shake;
      desired.y += Math.cos(state.time * 38) * shake * 0.5;
      state.shake = Math.max(0, shake - dt);
    }
    const follow = 1 - Math.exp(-4.5 * dt);
    camPos.lerp(desired, state.mode === "title" ? follow : Math.min(1, follow + 0.05));
    camera.position.copy(camPos);
    look.set(anchorX - 0.05, 0.78 + state.y * 0.15, anchorZ - 2.6);
    camera.lookAt(look);

    sun.position.set(anchorX - 14, 16, anchorZ + 12);
    sun.target.position.set(anchorX, 0, anchorZ - 4);
    sun.target.updateMatrixWorld();
    sky.position.copy(camera.position);
    sunCore.position.set(anchorX - 28, 9.5, anchorZ - 36);
    sunGlow.position.copy(sunCore.position);

    const dusk = playing ? clamp(1 - state.sun / SUN_SECONDS, 0, 1) : 0;
    scene.fog.color.copy(fogDay).lerp(fogDusk, dusk * 0.55);
    renderer.toneMappingExposure = 1.08 - dusk * 0.22;

    for (let i = 0; i < leafCount; i += 1) {
      const leaf = leafState[i];
      leaf.y -= leaf.speed * dt * (reduceMotion ? 0.25 : 1);
      leaf.x += leaf.drift * dt;
      if (leaf.y < 0.2) {
        leaf.y = 4.5 + Math.random() * 2.5;
        leaf.x = (Math.random() - 0.5) * 12;
        leaf.z = (Math.random() - 0.5) * 12;
      }
      leaf.sprite.position.set(anchorX + leaf.x, leaf.y, anchorZ + leaf.z);
    }

    sparks.forEach((spark) => {
      if (spark.life <= 0) return;
      spark.life -= dt;
      spark.vel.y -= 6 * dt;
      spark.mesh.position.addScaledVector(spark.vel, dt);
      spark.mesh.material.opacity = Math.max(0, spark.life * 1.6);
      const s = 0.1 + spark.life * 0.28;
      spark.mesh.scale.set(s, s, 1);
      if (spark.life <= 0) spark.mesh.visible = false;
    });

    if (state.call > 0) {
      state.call -= dt;
      if (state.call <= 0) $("callout").classList.add("hidden");
    }
    const flashNode = $("flash");
    if (flashNode && flashNode.style.opacity) {
      const next = Math.max(0, parseFloat(flashNode.style.opacity) - dt * 1.8);
      flashNode.style.opacity = String(next);
    }
    const hint = $("hint");
    if (hint) hint.classList.toggle("hidden", !(playing && state.hint > 0 && state.call <= 0));
    if (playing) paintHud();
  }

  function renderFrame() {
    if (bloom) bloom.render();
    else renderer.render(scene, camera);
  }

  let last = performance.now();
  function loop(now) {
    if (CAPTURE) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (state.mode !== "pause") update(dt || 0.016);
    renderFrame();
    requestAnimationFrame(loop);
  }

  window.__stepFrame = () => {
    if (state.mode === "title") begin();
    update(1 / 25);
    renderFrame();
    return { mode: state.mode, score: state.score, z: state.z, carried: state.carried, rings: state.rings, sun: state.sun };
  };

  $("start").disabled = false;
  $("start").textContent = "Roll";
  $("start").addEventListener("click", begin);
  $("pauseBtn").addEventListener("click", () => {
    if (state.mode === "play") pause();
    else if (state.mode === "pause") resume();
  });
  $("resume").addEventListener("click", resume);
  $("restart").addEventListener("click", begin);
  $("retry").addEventListener("click", begin);
  $("muteBtn").addEventListener("click", () => {
    muted = !muted;
    $("muteBtn").textContent = muted ? "Muted" : "Sound";
    $("muteBtn").setAttribute("aria-pressed", muted ? "true" : "false");
  });
  const hopBtn = $("hopBtn");
  hopBtn.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    hopQueued = true;
    document.body.classList.add("touch");
  });

  wireStick();
  wireDrag(canvas);
  canvas.addEventListener("contextmenu", (e) => e.preventDefault());

  window.addEventListener("keydown", (e) => {
    if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
    if ((e.code === "Enter" || e.code === "Space") && state.mode === "title" && !$("start").disabled) begin();
    if (e.code === "KeyP" || e.code === "Escape") {
      if (state.mode === "play") pause();
      else if (state.mode === "pause") resume();
    }
    if (e.code === "KeyR" && (state.mode === "play" || state.mode === "pause" || state.mode === "end")) begin();
    if (e.code === "KeyM") $("muteBtn").click();
  });

  showTitle();
  if (DEMO) begin();
  requestAnimationFrame(loop);
}

function wireStick() {
  const stick = $("stick");
  const nub = $("nub");
  if (!stick || !nub) return;
  let id = null;

  function move(e) {
    const rect = stick.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = clamp((e.clientX - cx) / 46, -1, 1);
    const dy = clamp((e.clientY - cy) / 46, -1, 1);
    touch.on = true;
    touch.x = dx;
    touch.y = -dy;
    stick.setAttribute("aria-valuenow", dx.toFixed(2));
    nub.style.transform = `translate(${dx * 36}px, ${dy * 36}px)`;
  }

  stick.addEventListener("pointerdown", (e) => {
    id = e.pointerId;
    stick.setPointerCapture(e.pointerId);
    move(e);
    document.body.classList.add("touch");
  });
  stick.addEventListener("pointermove", (e) => {
    if (e.pointerId !== id) return;
    move(e);
  });
  function end(e) {
    if (e.pointerId !== id) return;
    id = null;
    touch.on = false;
    touch.x = 0;
    touch.y = 0;
    nub.style.transform = "translate(0, 0)";
  }
  stick.addEventListener("pointerup", end);
  stick.addEventListener("pointercancel", end);
}

function wireDrag(canvas) {
  let id = null;
  let origin = null;
  canvas.addEventListener("pointerdown", (e) => {
    if (e.target !== canvas) return;
    id = e.pointerId;
    origin = { x: e.clientX, y: e.clientY };
    if (e.pointerType !== "mouse") document.body.classList.add("touch");
  });
  canvas.addEventListener("pointermove", (e) => {
    if (e.pointerId !== id || !origin) return;
    if (touch.on && e.target === $("stick")) return;
    drag.x = clamp((e.clientX - origin.x) / 90, -1, 1);
    drag.y = clamp(-(e.clientY - origin.y) / 110, -1, 1);
    drag.on = true;
  });
  function end(e) {
    if (e.pointerId !== id) return;
    id = null;
    origin = null;
    drag.on = false;
    drag.x = 0;
    drag.y = 0;
  }
  canvas.addEventListener("pointerup", end);
  canvas.addEventListener("pointercancel", end);
}

if (typeof THREE === "undefined") {
  showFail("This browser could not load the 3D library, so Bramble cannot start.");
} else if (!hasWebGL()) {
  showFail("This browser has no WebGL context, so Bramble cannot start.");
} else {
  boot();
}
