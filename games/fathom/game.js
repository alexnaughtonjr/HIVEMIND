(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);

  function showFail() {
    const fail = $("fail");
    const title = $("title");
    if (fail) fail.classList.remove("hidden");
    if (title) title.classList.add("hidden");
  }

  if (!window.THREE) {
    showFail();
    return;
  }

  const canvas = $("view");
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: "high-performance"
    });
  } catch (err) {
    showFail();
    return;
  }
  if (!renderer || !renderer.getContext()) {
    showFail();
    return;
  }

  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.setClearColor(0x07141c, 1);

  const scene = new THREE.Scene();
  const sea = new THREE.Color(0x07141c);
  scene.background = sea;
  scene.fog = new THREE.FogExp2(sea, 0.046);

  const camera = new THREE.PerspectiveCamera(52, 1, 0.08, 80);
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarse = window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 820;
  if (coarse) document.body.classList.add("touch");

  scene.add(new THREE.HemisphereLight(0x9ec9e0, 0x0d1117, 0.55));
  const key = new THREE.DirectionalLight(0xd6ecff, 0.85);
  key.position.set(-4, 10, 6);
  scene.add(key);

  const world = new THREE.Group();
  scene.add(world);

  const sub = new THREE.Group();
  scene.add(sub);

  const glass = new THREE.Mesh(
    new THREE.SphereGeometry(0.62, 32, 24),
    new THREE.MeshStandardMaterial({
      color: 0xc6e6ff,
      emissive: 0x123044,
      emissiveIntensity: 0.7,
      roughness: 0.08,
      metalness: 0.18,
      transparent: true,
      opacity: 0.48
    })
  );
  sub.add(glass);

  const brass = new THREE.Mesh(
    new THREE.TorusGeometry(0.64, 0.055, 12, 40),
    new THREE.MeshStandardMaterial({
      color: 0x8a6232,
      emissive: 0x3a2410,
      emissiveIntensity: 0.3,
      roughness: 0.34,
      metalness: 0.74
    })
  );
  brass.rotation.x = Math.PI / 2;
  sub.add(brass);

  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 18, 14),
    new THREE.MeshBasicMaterial({ color: 0xe8fbff })
  );
  sub.add(bulb);

  const porthole = new THREE.Mesh(
    new THREE.TorusGeometry(0.2, 0.03, 8, 24),
    new THREE.MeshStandardMaterial({ color: 0xc9a36a, metalness: 0.7, roughness: 0.3 })
  );
  porthole.position.z = 0.5;
  sub.add(porthole);

  const cable = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.025, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0x30363d, metalness: 0.4, roughness: 0.55 })
  );
  cable.position.y = 4.5;
  sub.add(cable);

  const lamp = new THREE.PointLight(0xd7f6ff, 7, 16, 2);
  sub.add(lamp);

  const wallMat = new THREE.MeshStandardMaterial({
    color: 0x12181f,
    roughness: 0.94,
    metalness: 0.06,
    emissive: 0x0b1c24,
    emissiveIntensity: 0.35
  });
  const wallGeo = new THREE.BoxGeometry(1.15, 3.4, 2.4);
  const walls = [];
  for (let i = 0; i < 12; i += 1) {
    const y = -22 + i * 4;
    [-1, 1].forEach((side, s) => {
      const mesh = new THREE.Mesh(wallGeo, wallMat);
      mesh.position.set(side * 6.5, y, (s === 0 ? -0.4 : 0.3) + (i % 2) * 0.4);
      mesh.scale.z = 1.1 + (i % 3) * 0.25;
      world.add(mesh);
      walls.push(mesh);
    });
  }

  const finGeo = new THREE.BoxGeometry(0.35, 3.2, 0.8);
  const fins = [];
  for (let i = 0; i < 8; i += 1) {
    const mesh = new THREE.Mesh(finGeo, wallMat);
    mesh.position.set((i % 2 === 0 ? -1 : 1) * 2.2, -18 + i * 5.5, -4.2);
    world.add(mesh);
    fins.push(mesh);
  }

  const SNOW = 340;
  const snowPos = new Float32Array(SNOW * 3);
  for (let i = 0; i < SNOW; i += 1) {
    snowPos[i * 3] = (Math.random() - 0.5) * 13;
    snowPos[i * 3 + 1] = (Math.random() - 0.5) * 42;
    snowPos[i * 3 + 2] = (Math.random() - 0.5) * 10;
  }
  const snowGeo = new THREE.BufferGeometry();
  snowGeo.setAttribute("position", new THREE.BufferAttribute(snowPos, 3));
  const snow = new THREE.Points(
    snowGeo,
    new THREE.PointsMaterial({
      color: 0xd7eaff,
      size: 0.055,
      transparent: true,
      opacity: 0.7,
      depthWrite: false
    })
  );
  scene.add(snow);

  let bloom = null;
  function fit() {
    const w = Math.max(1, window.innerWidth);
    const h = Math.max(1, window.innerHeight);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setSize(w, h, false);
  }
  fit();
  try {
    if (window.LabBloom) {
      bloom = window.LabBloom(renderer, scene, camera, {
        threshold: 0.5,
        strength: 0.85,
        div: coarse ? 4 : 2
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
  if (bloom) bloom.resize();

  const player = { x: 0, z: 0, vx: 0, vz: 0 };
  const keys = new Set();
  const stick = { x: 0, z: 0, id: null };
  const state = { mode: "title", depth: 0 };
  const cam = new THREE.Vector3(0, 2.3, 7.4);
  const shake = window.LabFX ? window.LabFX.Shaker() : { add() {}, apply() { return { x: 0, y: 0 }; } };

  function damp(current, target, dt, speed) {
    return current + (target - current) * (1 - Math.exp(-(speed || 6) * dt));
  }

  function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
  }

  function setModal(on) {
    document.body.classList.toggle("modal", on);
  }

  function showTitle() {
    state.mode = "title";
    $("title").classList.remove("hidden");
    $("pause").classList.add("hidden");
    $("hud").hidden = true;
    $("hint").classList.add("hidden");
    $("pauseBtn").setAttribute("aria-pressed", "false");
    setModal(true);
  }

  function begin() {
    state.mode = "play";
    state.depth = 12;
    player.x = 0;
    player.z = 0;
    player.vx = 0;
    player.vz = 0;
    $("title").classList.add("hidden");
    $("pause").classList.add("hidden");
    $("hud").hidden = false;
    $("hint").classList.remove("hidden");
    $("pauseBtn").setAttribute("aria-pressed", "false");
    setModal(false);
    if (window.LabFX) window.LabFX.sfx.ui();
  }

  function pause() {
    if (state.mode !== "play") return;
    state.mode = "pause";
    $("pause").classList.remove("hidden");
    $("pauseBtn").setAttribute("aria-pressed", "true");
    setModal(true);
    if (window.LabFX) window.LabFX.sfx.ui();
  }

  function resume() {
    if (state.mode !== "pause") return;
    state.mode = "play";
    $("pause").classList.add("hidden");
    $("pauseBtn").setAttribute("aria-pressed", "false");
    setModal(false);
  }

  $("start").addEventListener("click", begin);
  $("resume").addEventListener("click", resume);
  $("restart").addEventListener("click", begin);
  $("pauseBtn").addEventListener("click", () => {
    if (state.mode === "play") pause();
    else resume();
  });

  document.addEventListener("keydown", (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key.toLowerCase();
    if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(e.key === " " ? " " : k) || e.key.startsWith("Arrow")) {
      e.preventDefault();
    }
    keys.add(k);
    if (k === "enter" && state.mode === "title") begin();
    if ((k === "p" || k === "escape") && (state.mode === "play" || state.mode === "pause")) {
      if (state.mode === "play") pause();
      else resume();
    }
    if (k === "r" && state.mode !== "title") begin();
  });
  document.addEventListener("keyup", (e) => keys.delete(e.key.toLowerCase()));
  window.addEventListener("blur", () => {
    keys.clear();
    stick.x = 0;
    stick.z = 0;
    stick.id = null;
  });

  const pad = $("stick");
  const nub = $("nub");
  function moveStick(clientX, clientY) {
    const rect = pad.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const max = rect.width * 0.34;
    const mag = Math.hypot(dx, dy) || 1;
    const reach = Math.min(max, mag);
    dx = (dx / mag) * reach;
    dy = (dy / mag) * reach;
    nub.style.transform = "translate(" + dx + "px," + dy + "px)";
    stick.x = dx / max;
    stick.z = dy / max;
  }
  function endStick(e) {
    if (stick.id != null && e.pointerId !== stick.id) return;
    stick.id = null;
    stick.x = 0;
    stick.z = 0;
    nub.style.transform = "translate(0,0)";
  }
  pad.addEventListener("pointerdown", (e) => {
    stick.id = e.pointerId;
    try { pad.setPointerCapture(e.pointerId); } catch (err) { /* already released */ }
    moveStick(e.clientX, e.clientY);
  });
  pad.addEventListener("pointermove", (e) => {
    if (e.pointerId !== stick.id) return;
    moveStick(e.clientX, e.clientY);
  });
  pad.addEventListener("pointerup", endStick);
  pad.addEventListener("pointercancel", endStick);

  canvas.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "touch" || state.mode !== "play") return;
    stick.id = e.pointerId;
    stick.originX = e.clientX;
    stick.originY = e.clientY;
  });
  canvas.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "touch" || e.pointerId !== stick.id || stick.originX == null) return;
    stick.x = clamp((e.clientX - stick.originX) / 80, -1, 1);
    stick.z = clamp((e.clientY - stick.originY) / 80, -1, 1);
  });
  canvas.addEventListener("pointerup", (e) => {
    if (e.pointerType !== "touch") return;
    endStick(e);
    stick.originX = null;
  });

  function axis() {
    const keyX = (keys.has("d") || keys.has("arrowright") ? 1 : 0) - (keys.has("a") || keys.has("arrowleft") ? 1 : 0);
    const keyZ = (keys.has("s") || keys.has("arrowdown") ? 1 : 0) - (keys.has("w") || keys.has("arrowup") ? 1 : 0);
    return {
      x: clamp(keyX + stick.x, -1, 1),
      z: clamp(keyZ + stick.z, -1, 1)
    };
  }

  function scrollProps(dt) {
    const step = 6.4 * dt;
    walls.forEach((mesh) => {
      mesh.position.y += step;
      if (mesh.position.y > 16) mesh.position.y -= 48;
    });
    fins.forEach((mesh) => {
      mesh.position.y += step;
      if (mesh.position.y > 16) mesh.position.y -= 44;
    });
    const arr = snowGeo.attributes.position.array;
    const fall = (reduceMotion ? 1.2 : 6.4) * dt;
    for (let i = 0; i < SNOW; i += 1) {
      arr[i * 3 + 1] += fall;
      if (arr[i * 3 + 1] > 18) arr[i * 3 + 1] -= 40;
    }
    snowGeo.attributes.position.needsUpdate = true;
  }

  showTitle();

  const clock = new THREE.Clock();
  function frame() {
    requestAnimationFrame(frame);
    const dt = Math.min(0.033, clock.getDelta());
    const t = clock.elapsedTime;
    const diving = state.mode === "play";
    const ambient = state.mode === "title" ? dt * (reduceMotion ? 0.2 : 0.45) : dt;

    if (diving) {
      const a = axis();
      player.vx = damp(player.vx, a.x * 7.4, dt, 8);
      player.vz = damp(player.vz, a.z * 7.4, dt, 8);
      player.x = clamp(player.x + player.vx * dt, -4.6, 4.6);
      player.z = clamp(player.z + player.vz * dt, -2.6, 2.6);
      state.depth += 18 * dt;
      $("depth").textContent = Math.floor(state.depth) + " m";
      scrollProps(dt);
    } else if (state.mode === "title") {
      scrollProps(ambient);
    }

    const bob = reduceMotion ? 0 : Math.sin(t * 1.5) * 0.08;
    sub.position.set(player.x, bob, player.z);
    sub.rotation.z = clamp(-player.vx * 0.045, -0.28, 0.28);
    sub.rotation.x = clamp(player.vz * 0.04, -0.22, 0.22);

    const want = new THREE.Vector3(player.x * 0.42, 2.25, player.z + 7.15);
    cam.lerp(want, 1 - Math.exp(-4 * (diving ? dt : ambient)));
    const kick = shake.apply(dt);
    camera.position.set(cam.x + kick.x, cam.y + kick.y, cam.z);
    camera.lookAt(player.x * 0.65, -0.35, player.z);

    if (bloom) bloom.render();
    else renderer.render(scene, camera);
  }
  frame();
})();
