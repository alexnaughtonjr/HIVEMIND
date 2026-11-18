const $ = (id) => document.getElementById(id);
const SLUG = "murmur";
const LEGACY = "games.murmur.best";

const SPEED = 26;
const SUN_SECONDS = 42;
const START_BIRDS = 16;
const MAX_BIRDS = 36;
const GATE_BIRDS = 4;
const SNAG_BIRDS = 5;
const GATE_SCORE = 300;
const GATE_R = 3.45;
const POCKET_SCORE = 80;
const POCKET_SUN = 2.6;
const POCKET_R = 2.55;
const HARRIER_BIRDS = 3;
const HARRIER_SUN = 2.2;
const Y_MIN = 2.7;
const Y_MAX = 14.2;
const X_MAX = 16;
const ROOST_Z = -790;

const GATES = [
  { x: 0, y: 7.2, z: -48 },
  { x: 6.2, y: 8.6, z: -132 },
  { x: 10.2, y: 6.5, z: -218 },
  { x: 3.4, y: 9.4, z: -308 },
  { x: -6.2, y: 7.1, z: -402 },
  { x: -11, y: 8.6, z: -496 },
  { x: -2.6, y: 6.2, z: -590 },
  { x: 1.2, y: 8, z: -684 }
];

const POCKETS = [
  { x: 2.35, y: 8.9, z: 3.2 },
  { x: 6.5, y: 9.85, z: -70 },
  { x: 8.4, y: 8.2, z: -188 },
  { x: -6.4, y: 9.4, z: -430 },
  { x: 2.2, y: 8.6, z: -612 }
];

const HARRIERS = [
  { z: -108, y: 7.15, span: 12, speed: 0.42, phase: 0.65 },
  { z: -236, y: 8.7, span: 13, speed: 0.34, phase: 1.15 },
  { z: -388, y: 6.9, span: 12, speed: 0.4, phase: 2.2 },
  { z: -524, y: 8.5, span: 14, speed: 0.31, phase: 0.4 },
  { z: -648, y: 7.3, span: 11, speed: 0.46, phase: 1.8 }
];

const POSTS = [
  { x: -4.2, z: -78, h: 15.2 },
  { x: 0.28, z: -108, h: 15.2 },
  { x: 12.4, z: -168, h: 11.5 },
  { x: 5.03, z: -196, h: 12 },
  { x: 11.32, z: -258, h: 11 },
  { x: 0.4, z: -278, h: 12.5 },
  { x: -4.82, z: -348, h: 12 },
  { x: -9.4, z: -372, h: 10.5 },
  { x: -4.8, z: -446, h: 12.5 },
  { x: -14.2, z: -468, h: 9.5 },
  { x: -11.21, z: -540, h: 12 },
  { x: -0.2, z: -562, h: 11.5 },
  { x: 3.6, z: -636, h: 12.5 },
  { x: -4.08, z: -656, h: 11 }
];

const WILLOWS = [
  { x: -19, z: 6, s: 1.25 },
  { x: 17.5, z: -28, s: 1.05 },
  { x: -23, z: -96, s: 1.45 },
  { x: 24, z: -160, s: 1.15 },
  { x: -26, z: -250, s: 1.55 },
  { x: 22, z: -340, s: 1.3 },
  { x: -21, z: -450, s: 1.2 },
  { x: 25, z: -560, s: 1.4 },
  { x: -24, z: -670, s: 1.35 },
  { x: 19, z: -740, s: 1.1 }
];

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

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

function harrierX(h, time) {
  return Math.sin(time * h.speed * Math.PI * 2 + h.phase) * h.span;
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

function softTexture() {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 64;
  const g = c.getContext("2d");
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, "rgba(255,255,255,1)");
  grd.addColorStop(0.35, "rgba(255,255,255,0.55)");
  grd.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const held = new Set();
const pressed = new Set();
const mouse = { x: 0, y: 0, on: false };
const touch = { x: 0, y: 0, on: false };
let touchCall = false;
let pointerZero = null;

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
  if (x !== 0 || y !== 0) return { x, y };
  if (touch.on) return { x: touch.x, y: touch.y };
  if (mouse.on) return { x: mouse.x, y: mouse.y };
  return { x: 0, y: 0 };
}

let audioCtx = null;
let muted = false;

function audio() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!audioCtx) audioCtx = new AC();
  if (audioCtx.state === "suspended") audioCtx.resume().catch(() => {});
  return audioCtx;
}

function chirp(freq, dur, gain) {
  if (muted) return;
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, t);
  osc.frequency.exponentialRampToValueAtTime(freq * 1.7, t + dur * 0.45);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g);
  g.connect(ac.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

function thud() {
  if (muted) return;
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(180, t);
  osc.frequency.exponentialRampToValueAtTime(50, t + 0.18);
  g.gain.setValueAtTime(0.06, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
  osc.connect(g);
  g.connect(ac.destination);
  osc.start(t);
  osc.stop(t + 0.24);
}

function shriek() {
  if (muted) return;
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(720, t);
  osc.frequency.exponentialRampToValueAtTime(210, t + 0.28);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.028, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
  osc.connect(g);
  g.connect(ac.destination);
  osc.start(t);
  osc.stop(t + 0.34);
}

function mobileGpu() {
  return document.body.classList.contains("touch") || window.innerWidth < 820;
}

function pixelCap() {
  return Math.min(window.devicePixelRatio || 1, mobileGpu() ? 1.5 : 2);
}

function boot() {
  if (typeof THREE === "undefined") {
    showFail("This browser could not load the 3D library, so Murmur cannot start.");
    return;
  }
  if (!hasWebGL()) {
    showFail("This browser has no WebGL context, so Murmur cannot start.");
    return;
  }

  const canvas = $("view");
  const phone = window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 820;
  if (phone) document.body.classList.add("touch");
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: false,
      powerPreference: phone ? "low-power" : "high-performance",
      failIfMajorPerformanceCaveat: false
    });
  } catch (err) {
    showFail("This browser has no WebGL context, so Murmur cannot start.");
    return;
  }
  if (!renderer.getContext()) {
    showFail("This browser has no WebGL context, so Murmur cannot start.");
    return;
  }
  renderer.setPixelRatio(pixelCap());
  const view = window.viewSize ? window.viewSize() : { w: window.innerWidth, h: window.innerHeight };
  renderer.setSize(view.w, view.h);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.shadowMap.enabled = !phone;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf2a36e);
  scene.fog = new THREE.FogExp2(0xf2a36e, 0.0068);

  const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 800);

  const hemi = new THREE.HemisphereLight(0xffc8a0, 0x2a2218, 0.55);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xffc090, 3.1);
  sun.castShadow = !phone;
  sun.shadow.mapSize.set(phone ? 256 : 512, phone ? 256 : 512);
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 90;
  sun.shadow.camera.left = -28;
  sun.shadow.camera.right = 28;
  sun.shadow.camera.top = 28;
  sun.shadow.camera.bottom = -28;
  sun.shadow.bias = -0.0006;
  sun.shadow.normalBias = 0.04;
  scene.add(sun);
  scene.add(sun.target);

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const soft = softTexture();

  const sky = buildSky();
  scene.add(sky.mesh);

  const sunCore = new THREE.Sprite(new THREE.SpriteMaterial({
    map: soft,
    color: 0xfff3c4,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    fog: false,
    toneMapped: false,
    opacity: 0.95
  }));
  sunCore.scale.set(18, 18, 1);
  scene.add(sunCore);

  const sunGlow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: soft,
    color: 0xff8a3a,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    fog: false,
    toneMapped: false,
    opacity: 0.42
  }));
  sunGlow.scale.set(78, 78, 1);
  scene.add(sunGlow);

  buildStars(sky.mesh, rng(7));
  buildWater(scene);
  const bed = buildBed(scene);
  const reeds = buildReeds(scene, rng(20261116));
  const posts = buildPosts(scene);
  buildWillows(scene);
  const heron = buildHeron();
  heron.position.set(-8.2, 0, -16);
  scene.add(heron);
  const roost = buildRoost();
  roost.position.set(0, 0, ROOST_Z);
  scene.add(roost);
  const roostLight = new THREE.PointLight(0xffb060, 30, 36, 2);
  roostLight.position.set(0, 8, ROOST_Z);
  scene.add(roostLight);

  const gates = buildGates(scene, soft);
  const gateLight = new THREE.PointLight(0xffaa55, 22, 32, 2);
  scene.add(gateLight);
  const pockets = buildPockets(scene, soft);
  const harriers = buildHarriers(scene, soft);

  const birds = buildBirds(scene);
  const far = buildFarFlock(scene);
  const sparks = buildSparks(scene, soft);
  const motes = buildMotes(scene, soft, rng(99));

  const blob = new THREE.Mesh(
    new THREE.CircleGeometry(0.7, 16),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28, depthWrite: false })
  );
  blob.rotation.x = -Math.PI / 2;
  blob.position.y = 0.07;
  scene.add(blob);

  const state = {
    mode: "title",
    x: 0,
    y: 7.2,
    z: 16,
    vx: 0,
    vy: 0,
    birds: START_BIRDS,
    score: 0,
    gates: 0,
    pockets: 0,
    ringPts: 0,
    warmPts: 0,
    flight: 0,
    sun: SUN_SECONDS,
    stall: 0,
    hurt: 0,
    call: 0,
    callCd: 0,
    shake: 0,
    best: readBest(),
    bestAtStart: null,
    flash: 0,
    hint: 0,
    callout: 0,
    oakNoted: false
  };

  const followers = Array.from({ length: MAX_BIRDS - 1 }, (_, i) => ({
    x: 0,
    y: 7.2,
    z: 18 + i * 0.2,
    phase: i * 0.73
  }));

  const sunDir = new THREE.Vector3();
  const look = new THREE.Vector3();
  const desired = new THREE.Vector3();
  const dummy = new THREE.Object3D();
  const wingLocal = new THREE.Object3D();
  const wingMatrix = new THREE.Matrix4();
  let anim = 0;
  let snapCam = false;

  function resetFlockPositions() {
    for (let i = 0; i < followers.length; i++) {
      const spot = formation(i, 1);
      followers[i].x = spot.x;
      followers[i].y = spot.y;
      followers[i].z = spot.z;
    }
  }

  function formation(i, tight) {
    const ring = Math.floor(i / 6);
    const ang = anim * (0.85 + ring * 0.11) + i * 2.399963;
    const rad = (0.85 + ring * 0.78) * tight;
    return {
      x: state.x - state.vx * 0.1 + Math.cos(ang) * rad,
      y: state.y - state.vy * 0.06 + Math.sin(ang * 1.17) * rad * 0.72 + Math.sin(anim * 1.5 + followers[i].phase) * 0.16,
      z: state.z + 1.4 + ring * 1.15
    };
  }

  function burst(x, y, z, color, n, gravity) {
    const c = new THREE.Color(color);
    let left = n;
    for (let i = 0; i < sparks.life.length && left > 0; i++) {
      if (sparks.life[i] > 0) continue;
      const ang = Math.random() * Math.PI * 2;
      const up = 0.4 + Math.random() * 2.2;
      sparks.pos[i * 3] = x;
      sparks.pos[i * 3 + 1] = y;
      sparks.pos[i * 3 + 2] = z;
      sparks.vel[i * 3] = Math.cos(ang) * (1.2 + Math.random() * 2.4);
      sparks.vel[i * 3 + 1] = up;
      sparks.vel[i * 3 + 2] = Math.sin(ang) * (1.2 + Math.random() * 2.4);
      sparks.grav[i] = gravity;
      sparks.life[i] = 0.45 + Math.random() * 0.45;
      sparks.col[i * 3] = c.r;
      sparks.col[i * 3 + 1] = c.g;
      sparks.col[i * 3 + 2] = c.b;
      left -= 1;
    }
    sparks.geo.attributes.position.needsUpdate = true;
    sparks.geo.attributes.color.needsUpdate = true;
  }

  function say(text) {
    const el = $("callout");
    el.textContent = text;
    el.classList.remove("hidden");
    state.callout = 1.15;
  }

  function setMode(next) {
    state.mode = next;
    const modal = next !== "play";
    document.body.classList.toggle("modal", modal);
    $("title").classList.toggle("hidden", next !== "title");
    $("pause").classList.toggle("hidden", next !== "pause");
    $("end").classList.toggle("hidden", next !== "end");
    $("hud").hidden = next === "title" || next === "end";
    $("hint").classList.toggle("hidden", next !== "play" || state.gates > 0 || state.hint > 6);
    $("pauseBtn").setAttribute("aria-pressed", next === "pause" ? "true" : "false");
  }

  function updateHud() {
    $("score").textContent = String(state.score);
    const shown = state.score > (state.best || 0) ? state.score : state.best;
    $("best").textContent = bestText(shown);
    $("birds").textContent = String(state.birds);
    $("rings").textContent = `${state.gates}/8`;
    $("warm").textContent = String(state.pockets);
    const day = clamp(state.sun / SUN_SECONDS, 0, 1);
    const bar = $("sunBar");
    bar.style.transform = `scaleX(${day})`;
    bar.style.background = day < 0.28 ? "#f0883e" : "#d29922";
    const label = $("callLabel");
    if (state.call > 0) {
      label.textContent = "calling";
      label.classList.remove("wait");
    } else if (state.callCd > 0) {
      label.textContent = "call";
      label.classList.add("wait");
    } else {
      label.textContent = "call ready";
      label.classList.remove("wait");
    }
  }

  function beginRun() {
    audio();
    state.x = 0;
    state.y = 7.2;
    state.z = 16;
    state.vx = 0;
    state.vy = 0;
    state.birds = START_BIRDS;
    state.score = 0;
    state.bestAtStart = state.best;
    state.gates = 0;
    state.pockets = 0;
    state.ringPts = 0;
    state.warmPts = 0;
    state.flight = 0;
    state.sun = SUN_SECONDS;
    state.stall = 0;
    state.hurt = 0;
    state.call = 0;
    state.callCd = 0;
    state.shake = 0;
    state.flash = 0;
    state.hint = 0;
    state.oakNoted = false;
    for (const g of gates) {
      g.cleared = false;
      g.resolved = false;
      g.ring.material.color.setHex(0xffb14a);
      g.inner.material.color.setHex(0x9ecbff);
      g.glow.material.opacity = 0.4;
    }
    for (const p of pockets) {
      p.taken = false;
      p.ring.material.color.setHex(0xffe1a8);
      p.glow.material.opacity = 0.78;
      p.column.material.opacity = 0.28;
      if (p.sheet) p.sheet.material.opacity = 0.34;
      p.group.scale.setScalar(1);
    }
    for (const h of harriers) h.struck = false;
    resetFlockPositions();
    snapCam = true;
    setMode("play");
    updateHud();
    $("hint").classList.remove("hidden");
    if (document.activeElement && document.activeElement !== document.body) {
      document.activeElement.blur();
    }
  }

  function snag() {
    const loss = Math.min(SNAG_BIRDS, state.birds);
    state.birds -= loss;
    state.stall = 0.4;
    state.hurt = 0.85;
    state.shake = reduceMotion ? 0 : 0.48;
    state.flash = 0.42;
    say("Snagged");
    thud();
    burst(state.x, state.y, state.z, 0xc4a574, 18, 3.2);
    if (state.birds <= 0) finish(false, "birds");
  }

  function clearGate(g) {
    g.cleared = true;
    state.gates += 1;
    const before = state.birds;
    state.birds = Math.min(MAX_BIRDS, state.birds + GATE_BIRDS);
    const gained = state.birds - before;
    state.score += GATE_SCORE;
    state.ringPts += GATE_SCORE;
    g.ring.material.color.setHex(0x7ee787);
    g.inner.material.color.setHex(0x3fb950);
    g.glow.material.opacity = 0.15;
    say(gained > 0 ? `+${gained} starlings` : "Ring cleared");
    chirp(860 + state.gates * 40, 0.16, 0.045);
    burst(g.x, g.y, g.z, 0xffd18a, 26, 0.4);
    for (let i = before - 1; i < state.birds - 1 && i < followers.length; i++) {
      if (i < 0) continue;
      followers[i].x = g.x;
      followers[i].y = g.y;
      followers[i].z = g.z;
    }
  }

  function takePocket(p) {
    p.taken = true;
    state.pockets += 1;
    state.score += POCKET_SCORE;
    state.warmPts += POCKET_SCORE;
    state.sun = Math.min(SUN_SECONDS, state.sun + POCKET_SUN);
    p.ring.material.color.setHex(0x7ee787);
    p.glow.material.opacity = 0.08;
    p.column.material.opacity = 0.04;
    if (p.sheet) p.sheet.material.opacity = 0.05;
    say("Warm air");
    chirp(490, 0.18, 0.04);
    burst(p.x, p.y, p.z, 0xffe1a8, 20, -0.6);
  }

  function rake(h) {
    h.struck = true;
    const loss = Math.min(HARRIER_BIRDS, state.birds);
    state.birds -= loss;
    state.sun = Math.max(0, state.sun - HARRIER_SUN);
    state.stall = 0.32;
    state.hurt = 0.95;
    state.shake = reduceMotion ? 0 : 0.42;
    state.flash = 0.38;
    say("Harrier");
    shriek();
    burst(state.x, state.y, state.z, 0x8a3a22, 16, 2.6);
    if (state.birds <= 0) finish(false, "birds");
  }

  function finish(won, reason) {
    if (state.mode === "end") return;
    let total = state.score;
    let detail = `Rings ${state.ringPts} · Warm ${state.warmPts}`;
    if (won) {
      const flockBonus = state.birds * 80;
      const sunBonus = Math.ceil(state.sun * 30);
      total += flockBonus + sunBonus;
      detail = `Rings ${state.ringPts} · Warm ${state.warmPts} · Flock ${flockBonus} · Daylight ${sunBonus}`;
      $("endKicker").textContent = "roost";
      $("endTitle").textContent = "The roost holds";
      $("endText").textContent = `You brought ${state.birds} starling${state.birds === 1 ? "" : "s"} home, threaded ${state.gates} of 8 rings, and caught ${state.pockets} warm column${state.pockets === 1 ? "" : "s"}.`;
      chirp(520, 0.28, 0.05);
      setTimeout(() => chirp(780, 0.22, 0.04), 120);
    } else if (reason === "sun") {
      $("endKicker").textContent = "dusk";
      $("endTitle").textContent = "The marsh went dark";
      $("endText").textContent = "The sun left before the oak. The flock scattered into the reeds.";
      thud();
    } else {
      $("endKicker").textContent = "scattered";
      $("endTitle").textContent = "The murmuration broke";
      $("endText").textContent = "Every starling peeled away. The marsh kept the line.";
      thud();
    }
    const prev = state.bestAtStart;
    const result = commitBest(total);
    if (result.best != null) state.best = result.best;
    const improved = total > (prev || 0);
    $("endScore").textContent = `${detail} · Score ${total} · Best ${state.best == null ? "—" : state.best}`;
    $("endRecord").classList.toggle("hidden", !improved);
    state.score = total;
    setMode("end");
  }

  function simulate(dt) {
    const wantCall = consume("Space") || touchCall;
    touchCall = false;
    if (wantCall && state.callCd <= 0) {
      state.call = 1.15;
      state.callCd = 2.45;
      chirp(640, 0.1, 0.03);
    }
    if (state.call > 0) state.call -= dt;
    if (state.callCd > 0) state.callCd -= dt;

    const tight = state.call > 0 ? 0.48 : 1;
    const surge = state.call > 0.5 ? 1.16 : 1;
    const stickAxis = axis();
    const k = 1 - Math.exp(-6.5 * dt);
    state.vx += (stickAxis.x * 13 - state.vx) * k;
    state.vy += (stickAxis.y * 8.5 - state.vy) * k;
    state.x += state.vx * dt;
    state.y += state.vy * dt;
    if (state.x > X_MAX) { state.x = X_MAX; state.vx = 0; }
    if (state.x < -X_MAX) { state.x = -X_MAX; state.vx = 0; }
    if (state.y > Y_MAX) { state.y = Y_MAX; state.vy = 0; }
    if (state.y < Y_MIN) { state.y = Y_MIN; state.vy = 0; }

    const prevZ = state.z;
    const speed = (state.stall > 0 ? SPEED * 0.25 : SPEED) * surge;
    state.z -= speed * dt;
    state.flight += dt;
    if (state.stall > 0) state.stall -= dt;
    if (state.hurt > 0) state.hurt -= dt;
    state.sun -= dt;
    if (state.shake > 0) state.shake = Math.max(0, state.shake - dt * 1.5);
    state.hint += dt;

    for (const g of gates) {
      if (g.resolved) continue;
      if (prevZ > g.z && state.z <= g.z) {
        const dx = state.x - g.x;
        const dy = state.y - g.y;
        g.resolved = true;
        if (dx * dx + dy * dy <= GATE_R * GATE_R) clearGate(g);
        else {
          g.ring.material.color.setHex(0x5c4034);
          g.inner.material.color.setHex(0x2c333b);
          g.glow.material.opacity = 0.05;
        }
      }
    }

    if (state.mode !== "end") {
      for (const p of pockets) {
        if (p.taken) continue;
        const dx = state.x - p.x;
        const dy = state.y - p.y;
        const dz = state.z - p.z;
        if (dx * dx + dy * dy + dz * dz <= POCKET_R * POCKET_R) takePocket(p);
      }
    }

    if (state.mode !== "end" && state.hurt <= 0) {
      const hitR = state.call > 0 ? 0.72 : 1.05;
      for (const p of posts) {
        const dx = state.x - p.x;
        const dz = state.z - p.z;
        if (dx * dx + dz * dz <= hitR * hitR && state.y < p.h) {
          snag();
          break;
        }
      }
    }

    if (state.mode !== "end" && state.hurt <= 0) {
      for (const h of harriers) {
        if (h.struck) continue;
        const dx = (state.x - harrierX(h, state.flight)) / 2.15;
        const dy = state.y - h.y;
        const dz = (state.z - h.z) / 1.45;
        const limit = state.call > 0 ? 0.62 : 1;
        if (dx * dx + dy * dy + dz * dz <= limit) {
          rake(h);
          break;
        }
      }
    }

    const follow = 1 - Math.exp(-4.8 * dt);
    const shown = Math.max(0, state.birds - 1);
    for (let i = 0; i < followers.length; i++) {
      if (i >= shown) continue;
      const spot = formation(i, tight);
      const b = followers[i];
      b.x += (spot.x - b.x) * follow;
      b.y += (spot.y - b.y) * follow;
      b.z += (spot.z - b.z) * follow;
    }

    if (state.mode === "end") return;
    if (state.birds <= 0) finish(false, "birds");
    else if (state.sun <= 0) finish(false, "sun");
    else if (state.z <= ROOST_Z + 8) finish(true, "roost");
    else if (!state.oakNoted && state.z < ROOST_Z + 70) {
      state.oakNoted = true;
      say("The oak");
    }
  }

  function titleDrift(dt) {
    state.y = 7.2 + Math.sin(anim * 0.8) * 0.22;
    state.x = Math.sin(anim * 0.32) * 0.35;
    state.vx = Math.cos(anim * 0.32) * 0.35;
    state.vy = Math.cos(anim * 0.8) * 0.18;
    const follow = 1 - Math.exp(-3.2 * dt);
    const shown = START_BIRDS - 1;
    for (let i = 0; i < shown; i++) {
      const spot = formation(i, 1);
      const b = followers[i];
      b.x += (spot.x - b.x) * follow;
      b.y += (spot.y - b.y) * follow;
      b.z += (spot.z - b.z) * follow;
    }
  }

  function updateCamera(dt) {
    const sh = state.shake;
    const sx = Math.sin(anim * 46) * sh * 0.4;
    const sy = Math.cos(anim * 33) * sh * 0.25;
    if (state.mode === "title") {
      desired.set(Math.sin(anim * 0.22) * 0.6, 6.4, 20);
      look.set(0, 7.8, -28);
    } else {
      desired.set(state.x * 0.35 + sx, state.y + 0.35 + sy, state.z + 12);
      look.set(state.x + state.vx * 0.1, state.y + 2.2, state.z - 30);
    }
    const blend = 1 - Math.exp(-3.4 * Math.max(dt, 0.016));
    if (snapCam) {
      camera.position.copy(desired);
      snapCam = false;
    } else {
      camera.position.lerp(desired, blend);
    }
    camera.lookAt(look);
    camera.rotateZ(-state.vx * 0.016);
  }

  function updateWorld(dt) {
    const day = clamp(state.sun / SUN_SECONDS, 0, 1);
    const lift = 0.05 + day * 0.28;
    sunDir.set(0.62, lift, -1).normalize();
    sky.sun.value.copy(sunDir);
    sky.mesh.position.copy(camera.position);
    sunCore.position.copy(camera.position).addScaledVector(sunDir, 340);
    sunGlow.position.copy(sunCore.position);
    scene.fog.density = 0.0068 + (1 - day) * 0.007;

    sun.position.copy(camera.position);
    sun.target.position.set(state.x, 0, state.z - 8);
    sun.position.copy(sun.target.position).addScaledVector(sunDir, 36);
    sun.target.updateMatrixWorld();
    sun.intensity = 2.2 + day * 1.3;

    const t = anim;
    reeds.material.userData.sway = t;
    const reedDummy = reeds.userData.dummy;
    const data = reeds.userData.data;
    for (let i = 0; i < data.length; i++) {
      const r = data[i];
      reedDummy.position.set(r.x, 0, r.z);
      reedDummy.scale.set(1, r.h, 1);
      reedDummy.rotation.set(0, r.rot, Math.sin(t * 1.6 + r.phase) * 0.12);
      reedDummy.updateMatrix();
      reeds.setMatrixAt(i, reedDummy.matrix);
      if (reeds.userData.cross) reeds.userData.cross.setMatrixAt(i, reedDummy.matrix);
    }
    reeds.instanceMatrix.needsUpdate = true;
    if (reeds.userData.cross) reeds.userData.cross.instanceMatrix.needsUpdate = true;

    waterUniforms.uTime.value = t;

    let next = null;
    for (const g of gates) {
      const isNext = !g.resolved && !next;
      if (isNext) next = g;
      const pulse = g.resolved ? 1 : 1 + Math.sin(t * (isNext ? 5.5 : 2.2)) * (isNext ? 0.06 : 0.025);
      g.group.scale.setScalar(pulse);
      g.ring.rotation.z = t * 0.35;
      g.inner.rotation.z = -t * 0.55;
      if (isNext) g.glow.material.opacity = 0.42 + Math.sin(t * 5) * 0.1;
    }
    if (next) gateLight.position.set(next.x, next.y, next.z);
    gateLight.intensity = next ? 24 : 0;

    const patrol = state.mode === "title" ? anim * 0.25 : state.flight;
    for (const p of pockets) {
      const pulse = p.taken ? 0.72 : 1 + Math.sin(t * 3.1 + p.z) * 0.06;
      p.group.scale.setScalar(pulse);
      p.ring.rotation.z = t * 0.9;
      p.ring.rotation.x = Math.sin(t * 0.7 + p.x) * 0.35;
      if (!p.taken) {
        p.glow.material.opacity = 0.78 + Math.sin(t * 4.2 + p.z) * 0.14;
        p.column.material.opacity = 0.28 + Math.sin(t * 2.2 + p.x) * 0.05;
        if (p.sheet) p.sheet.material.opacity = 0.34 + Math.sin(t * 3 + p.z) * 0.06;
      }
    }
    for (const h of harriers) {
      const x = harrierX(h, patrol);
      const dir = Math.cos(patrol * h.speed * Math.PI * 2 + h.phase);
      h.group.position.set(x, h.y + Math.sin(t * 2.4 + h.phase) * 0.18, h.z);
      h.group.rotation.y = dir >= 0 ? -Math.PI / 2 : Math.PI / 2;
      h.group.rotation.z = dir * -0.35;
      const flap = Math.sin(t * 8.5 + h.phase) * 0.42;
      h.wingL.rotation.z = flap;
      h.wingR.rotation.z = -flap;
    }

    heron.userData.neck.rotation.z = Math.sin(t * 0.7) * 0.12;
    heron.userData.neck.rotation.x = Math.sin(t * 0.45) * 0.06;

    const shown = state.mode === "title" ? START_BIRDS : Math.max(state.birds, 0);
    const leadVisible = shown > 0;
    birds.leader.visible = leadVisible;
    if (leadVisible) {
      birds.leader.position.set(state.x, state.y, state.z);
      birds.leader.rotation.set(state.vy * 0.03, state.vx * -0.02, state.vx * -0.045);
      const flap = Math.sin(t * 11) * 0.7;
      birds.wingL.rotation.z = 0.15 + flap;
      birds.wingR.rotation.z = -0.15 - flap;
    }
    blob.visible = leadVisible;
    blob.position.set(state.x, 0.08, state.z + 0.4);
    blob.material.opacity = clamp(0.3 - state.y * 0.012, 0.06, 0.3);

    const followCount = Math.max(0, shown - 1);
    for (let i = 0; i < followers.length; i++) {
      const b = followers[i];
      const visible = i < followCount;
      const flap = Math.sin(t * 11 + b.phase) * 0.75;
      dummy.position.set(visible ? b.x : 0, visible ? b.y : -40, visible ? b.z : 0);
      dummy.rotation.set(0, Math.sin(b.phase + t) * 0.25, flap * 0.15);
      dummy.scale.setScalar(visible ? 1 : 0);
      dummy.updateMatrix();
      birds.bodies.setMatrixAt(i, dummy.matrix);

      wingLocal.position.set(0, 0.02, 0.04);
      wingLocal.rotation.set(0, 0, 0.2 + flap);
      wingLocal.scale.set(1, 1, 1);
      wingLocal.updateMatrix();
      wingMatrix.multiplyMatrices(dummy.matrix, wingLocal.matrix);
      birds.wingsL.setMatrixAt(i, wingMatrix);

      wingLocal.rotation.set(0, 0, -0.2 - flap);
      wingLocal.updateMatrix();
      wingMatrix.multiplyMatrices(dummy.matrix, wingLocal.matrix);
      birds.wingsR.setMatrixAt(i, wingMatrix);
    }
    birds.bodies.instanceMatrix.needsUpdate = true;
    birds.wingsL.instanceMatrix.needsUpdate = true;
    birds.wingsR.instanceMatrix.needsUpdate = true;

    const farDummy = far.userData.dummy;
    for (let i = 0; i < far.count; i++) {
      const u = i / far.count;
      const wave = t * 0.45 + u * Math.PI * 4;
      const x = -16 + Math.sin(wave) * 12 + Math.sin(wave * 2.2 + u * 6) * 3.5;
      const y = 12.2 + Math.cos(wave * 1.3) * 1.5;
      const z = state.z - 48 - u * 80;
      farDummy.position.set(x, y, z);
      farDummy.rotation.set(0, 0, Math.sin(wave * 8) * 0.5);
      farDummy.scale.setScalar(0.7);
      farDummy.updateMatrix();
      far.setMatrixAt(i, farDummy.matrix);
    }
    far.instanceMatrix.needsUpdate = true;

    for (let i = 0; i < sparks.life.length; i++) {
      if (sparks.life[i] <= 0) continue;
      sparks.life[i] -= dt;
      sparks.vel[i * 3 + 1] -= sparks.grav[i] * dt;
      sparks.pos[i * 3] += sparks.vel[i * 3] * dt;
      sparks.pos[i * 3 + 1] += sparks.vel[i * 3 + 1] * dt;
      sparks.pos[i * 3 + 2] += sparks.vel[i * 3 + 2] * dt;
      if (sparks.life[i] <= 0) {
        sparks.pos[i * 3 + 1] = -80;
        sparks.col[i * 3] = 0;
        sparks.col[i * 3 + 1] = 0;
        sparks.col[i * 3 + 2] = 0;
      }
    }
    sparks.geo.attributes.position.needsUpdate = true;
    sparks.geo.attributes.color.needsUpdate = true;

    const mpos = motes.geo.attributes.position;
    for (let i = 0; i < motes.count; i++) {
      let z = motes.base[i * 3 + 2] + state.z;
      const span = 70;
      z = state.z - 10 - ((state.z - z) % span + span) % span;
      const bob = Math.sin(t * motes.speed[i] + motes.phase[i]);
      const y = motes.base[i * 3 + 1] + bob * 0.35;
      mpos.setXYZ(i, motes.base[i * 3] + state.x * 0.2, y, z);
    }
    mpos.needsUpdate = true;

    const fpos = motes.flies.attributes.position;
    for (let i = 0; i < motes.flyCount; i++) {
      const on = Math.sin(t * motes.flySpeed[i] + motes.flyPhase[i]) > 0.15;
      fpos.setXYZ(
        i,
        motes.flyBase[i * 3],
        on ? motes.flyBase[i * 3 + 1] + Math.sin(t + i) * 0.2 : -60,
        motes.flyBase[i * 3 + 2]
      );
    }
    fpos.needsUpdate = true;

    $("flash").style.opacity = String(state.flash);
    if (state.flash > 0) state.flash = Math.max(0, state.flash - dt * 1.4);
    if (state.callout > 0) {
      state.callout -= dt;
      if (state.callout <= 0) $("callout").classList.add("hidden");
    }
    if (state.mode === "play" && (state.hint > 6.5 || state.gates > 0)) $("hint").classList.add("hidden");

    bed.position.z = state.z - 20;
  }

  function frame(now) {
    const elapsed = Math.max(0.0001, (now - frame.last) / 1000);
    const dt = Math.min(0.05, elapsed);
    frame.last = now;

    if (state.mode === "play") {
      if (consume("KeyP") || consume("Escape")) setMode("pause");
      else if (consume("KeyR")) beginRun();
      else {
        anim += dt;
        simulate(dt);
        updateHud();
      }
    } else if (state.mode === "title") {
      anim += reduceMotion ? dt * 0.35 : dt;
      titleDrift(dt);
      if (consume("Enter")) beginRun();
    } else if (state.mode === "pause") {
      if (consume("Escape") || consume("KeyP")) setMode("play");
      if (consume("KeyR")) beginRun();
    } else if (state.mode === "end") {
      if (consume("KeyR") || consume("Enter")) beginRun();
    }

    if (consume("KeyM")) toggleMute();

    updateCamera(dt || 0.016);
    updateWorld(dt || 0.016);
    renderer.render(scene, camera);

    if (!document.body.dataset.ready) document.body.dataset.ready = "1";
    requestAnimationFrame(frame);
  }
  frame.last = performance.now();

  function toggleMute() {
    muted = !muted;
    const btn = $("muteBtn");
    btn.textContent = muted ? "Muted" : "Sound";
    btn.setAttribute("aria-pressed", muted ? "true" : "false");
    if (!muted) audio();
  }

  $("start").disabled = false;
  $("start").textContent = "Take the lead";
  $("titleBest").textContent = bestText(state.best);
  $("best").textContent = bestText(state.best);

  $("start").addEventListener("click", beginRun);
  $("resume").addEventListener("click", () => setMode("play"));
  $("restart").addEventListener("click", beginRun);
  $("retry").addEventListener("click", beginRun);
  $("pauseBtn").addEventListener("click", () => {
    if (state.mode === "play") setMode("pause");
  });
  $("muteBtn").addEventListener("click", toggleMute);
  const callBtn = $("callBtn");
  if (callBtn) {
    callBtn.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      touchCall = true;
      audio();
    });
  }

  canvas.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch") return;
    const rect = canvas.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    if (!pointerZero) pointerZero = { x: nx, y: ny };
    const dx = nx - pointerZero.x;
    const dy = ny - pointerZero.y;
    if (!mouse.on && Math.hypot(dx, dy) < 0.04) return;
    mouse.on = true;
    mouse.x = clamp(dx * 2.4, -1, 1);
    mouse.y = clamp(-dy * 2.4, -1, 1);
  });

  if (window.matchMedia("(pointer: coarse)").matches) document.body.classList.add("touch");
  wireStick();
  wireDrag(canvas);

  function resizeView() {
    const box = window.viewSize ? window.viewSize() : { w: window.innerWidth, h: window.innerHeight };
    camera.aspect = box.w / box.h;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(pixelCap());
    renderer.setSize(box.w, box.h);
  }
  window.addEventListener("resize", resizeView);
  window.addEventListener("orientationchange", resizeView);
  resizeView();

  document.addEventListener("visibilitychange", () => {
    frame.last = performance.now();
    if (document.hidden && state.mode === "play") setMode("pause");
  });

  resetFlockPositions();
  setMode("title");
  requestAnimationFrame(frame);
}

const waterUniforms = {
  uTime: { value: 0 },
  fogColor: { value: new THREE.Color(0xf2a36e) },
  fogDensity: { value: 0.0115 },
  fogNear: { value: 1 },
  fogFar: { value: 2000 }
};

function buildSky() {
  const sun = { value: new THREE.Vector3(0.4, 0.25, -1).normalize() };
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(520, 32, 24),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      toneMapped: false,
      uniforms: {
        uSun: sun,
        uTop: { value: new THREE.Color(0x2a1648) },
        uMid: { value: new THREE.Color(0xa34858) },
        uHor: { value: new THREE.Color(0xffb07a) },
        uBot: { value: new THREE.Color(0x4a2818) }
      },
      vertexShader: `
        varying vec3 vDir;
        void main() {
          vDir = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vDir;
        uniform vec3 uSun;
        uniform vec3 uTop;
        uniform vec3 uMid;
        uniform vec3 uHor;
        uniform vec3 uBot;
        void main() {
          vec3 dir = normalize(vDir);
          float h = dir.y;
          vec3 col = mix(uHor, uMid, smoothstep(0.0, 0.34, h));
          col = mix(col, uTop, smoothstep(0.22, 0.78, h));
          col = mix(uBot, col, smoothstep(-0.35, 0.05, h));
          float d = max(dot(dir, normalize(uSun)), 0.0);
          col += vec3(1.0, 0.95, 0.8) * pow(d, 460.0) * 2.0;
          col += vec3(1.0, 0.62, 0.28) * pow(d, 14.0) * 0.7;
          col += vec3(1.0, 0.45, 0.22) * pow(d, 3.0) * 0.22;
          gl_FragColor = vec4(col, 1.0);
          #include <colorspace_fragment>
        }
      `
    })
  );
  mesh.frustumCulled = false;
  return { mesh, sun };
}

function buildStars(scene, rand) {
  const n = 80;
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const theta = rand() * Math.PI * 2;
    const y = 0.35 + rand() * 0.65;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    pos[i * 3] = Math.cos(theta) * r * 430;
    pos[i * 3 + 1] = y * 430;
    pos[i * 3 + 2] = Math.sin(theta) * r * 430;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const stars = new THREE.Points(geo, new THREE.PointsMaterial({
    color: 0xfff6e8,
    size: 1.6,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.7,
    depthWrite: false,
    fog: false,
    toneMapped: false
  }));
  stars.frustumCulled = false;
  scene.add(stars);
}

function buildBed(scene) {
  const bed = new THREE.Mesh(
    new THREE.PlaneGeometry(220, 160),
    new THREE.MeshStandardMaterial({ color: 0x101610, roughness: 1, metalness: 0 })
  );
  bed.rotation.x = -Math.PI / 2;
  bed.position.y = -0.04;
  bed.receiveShadow = true;
  scene.add(bed);
  return bed;
}

function buildWater(scene) {
  const geo = new THREE.PlaneGeometry(240, 1100, 1, 1);
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    fog: true,
    uniforms: waterUniforms,
    vertexShader: `
      varying vec3 vWorld;
      #include <fog_pars_vertex>
      void main() {
        vec4 world = modelMatrix * vec4(position, 1.0);
        vWorld = world.xyz;
        vec4 mvPosition = viewMatrix * world;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }
    `,
    fragmentShader: `
      varying vec3 vWorld;
      uniform float uTime;
      #include <fog_pars_fragment>
      void main() {
        float rip = sin(vWorld.x * 0.35 + uTime * 1.3) * sin(vWorld.z * 0.22 - uTime * 0.8);
        float streak = exp(-pow((vWorld.x - 7.5) * 0.22, 2.0));
        vec3 deep = vec3(0.03, 0.045, 0.05);
        vec3 glint = vec3(1.0, 0.72, 0.38);
        vec3 col = deep + vec3(0.012, 0.016, 0.014) * rip;
        col += glint * streak * (0.7 + rip * 0.15);
        gl_FragColor = vec4(col, 0.92);
        #include <fog_fragment>
        #include <colorspace_fragment>
      }
    `
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(0, 0.02, -480);
  mesh.renderOrder = 1;
  scene.add(mesh);
}

function buildReeds(scene, rand) {
  const geo = new THREE.PlaneGeometry(0.28, 1, 1, 3);
  geo.translate(0, 0.5, 0);
  const count = 340;
  const mesh = new THREE.InstancedMesh(
    geo,
    new THREE.MeshStandardMaterial({ color: 0x314628, roughness: 0.92, side: THREE.DoubleSide }),
    count
  );
  const data = [];
  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  for (let i = 0; i < count; i++) {
    const z = 36 - rand() * 960;
    const side = rand() < 0.5 ? -1 : 1;
    const band = rand() < 0.18 ? 3.2 + rand() * 2.4 : 7 + rand() * 16;
    const x = side * band;
    const h = 0.9 + rand() * 2.6;
    const rot = rand() * Math.PI;
    color.set(rand() > 0.8 ? 0x5a4a28 : rand() > 0.4 ? 0x3e5228 : 0x24341c);
    data.push({ x, z, h, rot, phase: rand() * 6.28, tint: color.getHex() });
    dummy.position.set(x, 0, z);
    dummy.scale.set(1, h, 1);
    dummy.rotation.y = rot;
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
    mesh.setColorAt(i, color);
  }
  mesh.instanceColor.needsUpdate = true;
  mesh.userData = { data, dummy: new THREE.Object3D() };
  mesh.castShadow = false;
  mesh.receiveShadow = true;
  scene.add(mesh);

  const cross = new THREE.InstancedMesh(
    geo.clone().rotateY(Math.PI / 2),
    mesh.material,
    count
  );
  for (let i = 0; i < count; i++) {
    const r = data[i];
    dummy.position.set(r.x, 0, r.z);
    dummy.scale.set(1, r.h, 1);
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    cross.setMatrixAt(i, dummy.matrix);
    cross.setColorAt(i, color.setHex(data[i].tint));
  }
  cross.instanceColor.needsUpdate = true;
  scene.add(cross);
  mesh.userData.cross = cross;
  return mesh;
}

function buildPosts(scene) {
  const wood = new THREE.MeshStandardMaterial({ color: 0x3a2a20, roughness: 0.9, metalness: 0.02 });
  const ribbonMat = new THREE.MeshBasicMaterial({ color: 0xff4d2e, toneMapped: false });
  const list = [];
  for (const p of POSTS) {
    const group = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.16, p.h, 6), wood);
    pole.position.y = p.h / 2;
    pole.castShadow = true;
    pole.receiveShadow = true;
    group.add(pole);
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 1.35, 5), wood);
    arm.rotation.z = Math.PI / 2;
    arm.position.y = p.h - 0.55;
    arm.castShadow = true;
    group.add(arm);
    const ribbon = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.32, 0.46), ribbonMat);
    ribbon.position.set(0.15, p.h * 0.62, 0);
    group.add(ribbon);
    const shade = new THREE.Mesh(
      new THREE.CircleGeometry(0.7, 10),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.22, depthWrite: false })
    );
    shade.rotation.x = -Math.PI / 2;
    shade.position.y = 0.05;
    group.add(shade);
    group.position.set(p.x, 0, p.z);
    scene.add(group);
    list.push(p);
  }
  return list;
}

function buildWillows(scene) {
  const proto = makeWillow();
  for (const w of WILLOWS) {
    const tree = proto.clone();
    tree.position.set(w.x, 0, w.z);
    tree.scale.setScalar(w.s);
    tree.rotation.y = w.x;
    scene.add(tree);
  }
}

function makeWillow() {
  const g = new THREE.Group();
  const bark = new THREE.MeshStandardMaterial({ color: 0x241910, roughness: 1 });
  const leaf = new THREE.MeshStandardMaterial({ color: 0x1b2814, roughness: 1 });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.32, 3.6, 6), bark);
  trunk.position.y = 1.8;
  trunk.castShadow = true;
  g.add(trunk);
  const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(1.35, 1), leaf);
  crown.position.y = 4.1;
  crown.scale.set(1.15, 0.72, 1.15);
  crown.castShadow = true;
  g.add(crown);
  for (let i = 0; i < 7; i++) {
    const vine = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.04, 2.4, 4), leaf);
    const ang = (i / 7) * Math.PI * 2;
    vine.position.set(Math.cos(ang) * 0.7, 2.7, Math.sin(ang) * 0.7);
    vine.rotation.z = Math.cos(ang) * 0.35;
    vine.rotation.x = Math.sin(ang) * 0.35;
    g.add(vine);
  }
  return g;
}

function buildHeron() {
  const g = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ color: 0x140e0c });
  const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.3, 4), mat);
  const legR = legL.clone();
  legL.position.set(-0.12, 0.65, 0);
  legR.position.set(0.12, 0.65, 0);
  g.add(legL, legR);
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 6), mat);
  body.scale.set(1, 0.7, 1.5);
  body.position.y = 1.45;
  g.add(body);
  const neck = new THREE.Group();
  neck.position.set(0, 1.6, -0.15);
  const neckMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 0.9, 5), mat);
  neckMesh.position.y = 0.4;
  neckMesh.rotation.x = 0.4;
  neck.add(neckMesh);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 6), mat);
  head.position.set(0, 0.82, -0.16);
  neck.add(head);
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.34, 5), mat);
  beak.rotation.x = Math.PI / 2;
  beak.position.set(0, 0.8, -0.36);
  neck.add(beak);
  g.add(neck);
  g.userData.neck = neck;
  g.scale.setScalar(1.7);
  return g;
}

function buildRoost() {
  const g = makeWillow();
  g.scale.setScalar(3.2);
  const glowMat = new THREE.MeshBasicMaterial({ color: 0xffb14a, toneMapped: false });
  for (let i = 0; i < 9; i++) {
    const light = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), glowMat);
    const ang = (i / 9) * Math.PI * 2;
    light.position.set(Math.cos(ang) * 1.4, 4.3 + (i % 3) * 0.35, Math.sin(ang) * 1.2);
    g.add(light);
  }
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(4.2, 0.08, 8, 28),
    new THREE.MeshBasicMaterial({ color: 0xffd18a, toneMapped: false })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.15;
  g.add(ring);
  return g;
}

function buildGates(scene, soft) {
  const gates = [];
  for (const spec of GATES) {
    const group = new THREE.Group();
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(4, 0.09, 8, 28),
      new THREE.MeshBasicMaterial({ color: 0xffb14a, toneMapped: false })
    );
    const inner = new THREE.Mesh(
      new THREE.TorusGeometry(3.55, 0.035, 6, 24),
      new THREE.MeshBasicMaterial({ color: 0x9ecbff, toneMapped: false })
    );
    group.add(ring, inner);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: soft,
      color: 0xffb060,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.4,
      toneMapped: false
    }));
    glow.scale.set(9.5, 9.5, 1);
    glow.position.z = -0.4;
    group.add(glow);
    group.position.set(spec.x, spec.y, spec.z);
    scene.add(group);
    gates.push({ ...spec, group, ring, inner, glow, cleared: false });
  }
  return gates;
}

function buildPockets(scene, soft) {
  const pockets = [];
  for (const spec of POCKETS) {
    const group = new THREE.Group();
    const column = new THREE.Mesh(
      new THREE.CylinderGeometry(0.9, 1.65, 12, 8, 1, true),
      new THREE.MeshBasicMaterial({
        color: 0xffc56a,
        transparent: true,
        opacity: 0.28,
        side: THREE.DoubleSide,
        depthWrite: false,
        toneMapped: false
      })
    );
    column.position.y = -2.2;
    group.add(column);
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(POCKET_R, 0.07, 6, 22),
      new THREE.MeshBasicMaterial({ color: 0xffe1a8, toneMapped: false })
    );
    group.add(ring);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: soft,
      color: 0xffc56a,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
      opacity: 0.62,
      toneMapped: false
    }));
    glow.scale.set(8.4, 13, 1);
    glow.material.opacity = 0.78;
    group.add(glow);
    const sheetMat = new THREE.MeshBasicMaterial({
      color: 0xffd48a,
      transparent: true,
      opacity: 0.34,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false
    });
    const sheet = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 10), sheetMat);
    sheet.position.y = -1.6;
    const sheetB = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 10), sheetMat);
    sheetB.position.y = -1.6;
    sheetB.rotation.y = Math.PI / 2;
    group.add(sheet, sheetB);
    group.position.set(spec.x, spec.y, spec.z);
    scene.add(group);
    pockets.push({ ...spec, group, column, ring, glow, sheet, taken: false });
  }
  return pockets;
}

function buildHarriers(scene, soft) {
  const harriers = [];
  for (const spec of HARRIERS) {
    const bird = makeHarrier(soft);
    scene.add(bird.group);
    const lane = new THREE.Mesh(
      new THREE.BoxGeometry(spec.span * 2, 0.16, 0.14),
      new THREE.MeshBasicMaterial({ color: 0xff5a3c, transparent: true, opacity: 0.82, toneMapped: false, depthWrite: false })
    );
    lane.position.set(0, spec.y, spec.z);
    scene.add(lane);
    harriers.push({ ...spec, group: bird.group, wingL: bird.wingL, wingR: bird.wingR, lane, struck: false });
  }
  return harriers;
}

function makeHarrier(soft) {
  const g = new THREE.Group();
  const dark = new THREE.MeshBasicMaterial({ color: 0x140c0a, side: THREE.DoubleSide });
  const rust = new THREE.MeshBasicMaterial({ color: 0x8a3418, side: THREE.DoubleSide });
  const pale = new THREE.MeshBasicMaterial({ color: 0xf0d7b0, side: THREE.DoubleSide });
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.34, 8, 6), dark);
  body.scale.set(0.55, 0.4, 1.45);
  g.add(body);
  const wingL = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.46), dark);
  wingL.position.set(-1.05, 0.04, 0.02);
  const wingR = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.46), dark);
  wingR.position.set(1.05, 0.04, 0.02);
  g.add(wingL, wingR);
  const underL = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 0.22), pale);
  underL.position.set(-0.85, -0.02, 0.04);
  const underR = underL.clone();
  underR.position.x = 0.85;
  g.add(underL, underR);
  const tail = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.55), rust);
  tail.position.set(0, 0.04, 0.62);
  g.add(tail);
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.28, 5), rust);
  beak.rotation.x = Math.PI / 2;
  beak.position.set(0, 0.02, -0.62);
  g.add(beak);
  const mark = new THREE.Sprite(new THREE.SpriteMaterial({
    map: soft,
    color: 0xff4d2e,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    fog: false,
    opacity: 0.45,
    toneMapped: false
  }));
  mark.scale.set(2.4, 2.4, 1);
  g.add(mark);
  g.scale.setScalar(1.28);
  return { group: g, wingL, wingR };
}

function buildBirds(scene) {
  const bodyGeo = new THREE.SphereGeometry(1, 8, 6);
  bodyGeo.scale(0.2, 0.13, 0.46);
  const wingShape = new THREE.Shape();
  wingShape.moveTo(0.02, 0.02);
  wingShape.lineTo(0.92, 0.2);
  wingShape.lineTo(0.78, -0.02);
  wingShape.lineTo(0.12, -0.1);
  wingShape.closePath();
  const wingGeo = new THREE.ShapeGeometry(wingShape);
  const wingGeoR = wingGeo.clone().scale(-1, 1, 1);
  const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
  const count = MAX_BIRDS - 1;
  const bodies = new THREE.InstancedMesh(bodyGeo, mat, count);
  const wingsL = new THREE.InstancedMesh(wingGeo, mat, count);
  const wingsR = new THREE.InstancedMesh(wingGeoR, mat, count);
  const dark = new THREE.Color(0x121016);
  const warm = new THREE.Color(0x2c2218);
  for (let i = 0; i < count; i++) {
    const c = i % 6 === 0 ? warm : dark;
    bodies.setColorAt(i, c);
    wingsL.setColorAt(i, c);
    wingsR.setColorAt(i, c);
  }
  bodies.instanceColor.needsUpdate = true;
  wingsL.instanceColor.needsUpdate = true;
  wingsR.instanceColor.needsUpdate = true;
  bodies.frustumCulled = false;
  wingsL.frustumCulled = false;
  wingsR.frustumCulled = false;
  scene.add(bodies, wingsL, wingsR);

  const leaderMat = new THREE.MeshBasicMaterial({ color: 0x100e14 });
  const leader = new THREE.Group();
  const body = new THREE.Mesh(bodyGeo, leaderMat);
  leader.add(body);
  const wingL = new THREE.Mesh(wingGeo, leaderMat);
  const wingR = new THREE.Mesh(wingGeoR, leaderMat);
  wingL.position.y = 0.02;
  wingR.position.y = 0.02;
  leader.add(wingL, wingR);
  const beak = new THREE.Mesh(
    new THREE.ConeGeometry(0.035, 0.16, 5),
    new THREE.MeshBasicMaterial({ color: 0xc48848, toneMapped: false })
  );
  beak.rotation.x = Math.PI / 2;
  beak.position.set(0, 0, -0.34);
  leader.add(beak);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: softTexture(),
    color: 0xffb060,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    opacity: 0.32,
    toneMapped: false
  }));
  glow.scale.set(1.15, 1.15, 1);
  glow.position.z = 0.15;
  leader.add(glow);
  leader.scale.setScalar(1.35);
  scene.add(leader);
  return { bodies, wingsL, wingsR, leader, wingL, wingR };
}

function buildFarFlock(scene) {
  const geo = new THREE.SphereGeometry(1, 6, 4);
  geo.scale(0.12, 0.08, 0.28);
  const mesh = new THREE.InstancedMesh(
    geo,
    new THREE.MeshBasicMaterial({ color: 0x100e14 }),
    56
  );
  mesh.count = 56;
  mesh.frustumCulled = false;
  mesh.userData.dummy = new THREE.Object3D();
  scene.add(mesh);
  return mesh;
}

function buildSparks(scene, soft) {
  const n = 80;
  const pos = new Float32Array(n * 3);
  const col = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) pos[i * 3 + 1] = -80;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3).setUsage(THREE.DynamicDrawUsage));
  const mat = new THREE.PointsMaterial({
    size: 0.34,
    map: soft,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: true,
    toneMapped: false,
    opacity: 0.95
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  scene.add(points);
  return {
    geo,
    pos,
    col,
    vel: new Float32Array(n * 3),
    grav: new Float32Array(n),
    life: new Float32Array(n)
  };
}

function buildMotes(scene, soft, rand) {
  const count = 120;
  const base = new Float32Array(count * 3);
  const speed = new Float32Array(count);
  const phase = new Float32Array(count);
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    base[i * 3] = (rand() - 0.5) * 36;
    base[i * 3 + 1] = 2 + rand() * 12;
    base[i * 3 + 2] = -rand() * 70;
    speed[i] = 0.4 + rand() * 1.4;
    phase[i] = rand() * 6.28;
    pos[i * 3 + 1] = base[i * 3 + 1];
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
  const motes = new THREE.Points(geo, new THREE.PointsMaterial({
    size: 0.16,
    map: soft,
    color: 0xffd7a1,
    transparent: true,
    opacity: 0.75,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false
  }));
  motes.frustumCulled = false;
  scene.add(motes);

  const flyCount = 36;
  const flyBase = new Float32Array(flyCount * 3);
  const flyPos = new Float32Array(flyCount * 3);
  const flySpeed = new Float32Array(flyCount);
  const flyPhase = new Float32Array(flyCount);
  for (let i = 0; i < flyCount; i++) {
    const side = rand() < 0.5 ? -1 : 1;
    flyBase[i * 3] = side * (8 + rand() * 14);
    flyBase[i * 3 + 1] = 0.6 + rand() * 2.2;
    flyBase[i * 3 + 2] = 20 - rand() * 860;
    flySpeed[i] = 1.5 + rand() * 3;
    flyPhase[i] = rand() * 6.28;
  }
  const flyGeo = new THREE.BufferGeometry();
  flyGeo.setAttribute("position", new THREE.BufferAttribute(flyPos, 3).setUsage(THREE.DynamicDrawUsage));
  const flies = new THREE.Points(flyGeo, new THREE.PointsMaterial({
    size: 0.18,
    map: soft,
    color: 0xb6f27a,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false
  }));
  flies.frustumCulled = false;
  scene.add(flies);

  return { geo, base, speed, phase, count, flies: flyGeo, flyBase, flySpeed, flyPhase, flyCount };
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
    nub.style.transform = `translate(${dx * 36}px, ${dy * 36}px)`;
  }

  stick.addEventListener("pointerdown", (e) => {
    id = e.pointerId;
    stick.setPointerCapture(e.pointerId);
    move(e);
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
    if (e.pointerType === "mouse") return;
    if (e.target !== canvas) return;
    id = e.pointerId;
    origin = { x: e.clientX, y: e.clientY };
    document.body.classList.add("touch");
  });
  canvas.addEventListener("pointermove", (e) => {
    if (e.pointerId !== id || !origin || touch.on && e.target === $("stick")) return;
    if (id === null) return;
    const dx = clamp((e.clientX - origin.x) / 80, -1, 1);
    const dy = clamp((e.clientY - origin.y) / 80, -1, 1);
    touch.x = dx;
    touch.y = -dy;
    touch.on = true;
  });
  function end(e) {
    if (e.pointerId !== id) return;
    id = null;
    origin = null;
    if (!$("stick").hasPointerCapture?.(e.pointerId)) {
      touch.on = false;
      touch.x = 0;
      touch.y = 0;
    }
  }
  canvas.addEventListener("pointerup", end);
  canvas.addEventListener("pointercancel", end);
}

if (typeof THREE === "undefined") {
  showFail("This browser could not load the 3D library, so Murmur cannot start.");
} else if (!hasWebGL()) {
  showFail("This browser has no WebGL context, so Murmur cannot start.");
} else {
  boot();
}
