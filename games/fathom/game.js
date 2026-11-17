(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const SLUG = "fathom";
  const LEGACY = "games.fathom.best";

  const ZONES = [
    {
      name: "Sunlight",
      range: "0–200 m",
      from: 20,
      to: 180,
      species: "jelly",
      title: "Moon jelly",
      hint: "Clear bell and short tentacles",
      fact: "The sunlight zone is only the top 200 m, and it holds most of the life in the ocean.",
      fog: 0x0c1e2a,
      accent: 0x7ee787,
      speed: 5.6
    },
    {
      name: "Twilight",
      range: "200–1,000 m",
      from: 200,
      to: 900,
      species: "lantern",
      title: "Lanternfish",
      hint: "Long blue body and a bright spot near the eye",
      fact: "Lanternfish are among the most abundant vertebrates on Earth. In the twilight zone they make their own light.",
      fog: 0x071422,
      accent: 0x58a6ff,
      speed: 6.4
    },
    {
      name: "Midnight",
      range: "1,000–4,000 m",
      from: 1000,
      to: 3500,
      species: "angler",
      title: "Angler",
      hint: "Round dark body with an amber lure",
      fact: "Below 1,000 m the sunlight is gone. Anglerfish hunt with a lure lit by glowing bacteria.",
      fog: 0x070d16,
      accent: 0xd29922,
      speed: 6.9
    },
    {
      name: "Abyss",
      range: "4,000–6,000 m",
      from: 4000,
      to: 5800,
      species: "dumbo",
      title: "Dumbo octopus",
      hint: "Pale body and fins that stick out like ears",
      fact: "On the abyssal plain, a few degrees above freezing, dumbo octopuses swim with ear-like fins.",
      fog: 0x100816,
      accent: 0xffb4a2,
      speed: 7.3
    },
    {
      name: "Hadal",
      range: "below 6,000 m",
      from: 6000,
      to: 8000,
      species: "worm",
      title: "Vent worm",
      hint: "White tubes with red tips on a rock",
      fact: "Tube worms at hot vents have no mouth. Bacteria inside them turn chemicals into food.",
      fog: 0x140e0a,
      accent: 0xf0883e,
      speed: 7.6
    }
  ];

  const SPECIES = ["jelly", "lantern", "angler", "dumbo", "worm"];
  const RADIUS = { jelly: 1.05, lantern: 1.15, angler: 1.3, dumbo: 1.15, worm: 1.35 };

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
  const coarse = window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 820;
  if (coarse) document.body.classList.add("touch");
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: !coarse,
      alpha: false,
      powerPreference: coarse ? "low-power" : "high-performance"
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
  renderer.toneMappingExposure = 1.16;
  renderer.setClearColor(0x07141c, 1);

  const scene = new THREE.Scene();
  const sea = new THREE.Color(0x07141c);
  scene.background = sea;
  scene.fog = new THREE.FogExp2(sea, 0.046);

  const camera = new THREE.PerspectiveCamera(52, 1, 0.08, 80);
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  scene.add(new THREE.HemisphereLight(0x9ec9e0, 0x0d1117, 0.55));
  const key = new THREE.DirectionalLight(0xd6ecff, 0.85);
  key.position.set(-4, 10, 6);
  scene.add(key);

  const world = new THREE.Group();
  scene.add(world);

  const sub = new THREE.Group();
  scene.add(sub);

  const glassMat = new THREE.MeshStandardMaterial({
    color: 0xc6e6ff,
    emissive: 0x123044,
    emissiveIntensity: 0.7,
    roughness: 0.08,
    metalness: 0.18,
    transparent: true,
    opacity: 0.48
  });
  const glass = new THREE.Mesh(new THREE.SphereGeometry(0.62, 32, 24), glassMat);
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

  sub.add(new THREE.Mesh(new THREE.SphereGeometry(0.26, 18, 14), new THREE.MeshBasicMaterial({ color: 0xf4fdff })));

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

  const lamp = new THREE.PointLight(0xd7f6ff, 14, 26, 1.35);
  sub.add(lamp);

  const wallMat = new THREE.MeshStandardMaterial({
    color: 0x12181f,
    roughness: 0.94,
    metalness: 0.06,
    emissive: 0x0b1c24,
    emissiveIntensity: 0.45
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

  function std(hex, intensity) {
    const color = new THREE.Color(hex);
    return new THREE.MeshStandardMaterial({
      color: color.clone().multiplyScalar(0.38),
      emissive: color,
      emissiveIntensity: intensity,
      roughness: 0.42,
      metalness: 0.08
    });
  }

  function buildSpecies(species, dim) {
    const g = new THREE.Group();
    const glow = dim ? 0.38 : 1.15;
    if (species === "jelly") {
      const bell = new THREE.Mesh(new THREE.SphereGeometry(0.7, 22, 16), std(0x7ee787, glow));
      bell.scale.y = 0.62;
      g.add(bell);
      const core = new THREE.Mesh(
        new THREE.SphereGeometry(0.32, 14, 12),
        new THREE.MeshBasicMaterial({ color: dim ? 0x1f6f3a : 0xd8ffe8 })
      );
      core.position.y = 0.05;
      g.add(core);
      const tentacles = [];
      for (let i = 0; i < 5; i += 1) {
        const tentacle = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.012, 1.05, 6), std(0x7ee787, glow * 0.6));
        const angle = (i / 5) * Math.PI * 2;
        tentacle.position.set(Math.cos(angle) * 0.28, -0.85, Math.sin(angle) * 0.28);
        g.add(tentacle);
        tentacles.push(tentacle);
      }
      g.userData.wiggle = (time, phase) => {
        if (reduceMotion) return;
        tentacles.forEach((tentacle, i) => {
          tentacle.rotation.x = Math.sin(time * 2.4 + phase + i) * 0.4;
          tentacle.rotation.z = Math.cos(time * 1.8 + phase + i) * 0.3;
        });
      };
      if (!dim) g.add(new THREE.PointLight(0x7ee787, 2.2, 6, 2));
    } else if (species === "lantern") {
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.48, 18, 12), std(0x58a6ff, glow));
      body.scale.set(1.55, 0.62, 0.62);
      g.add(body);
      const tail = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.46, 10), std(0x58a6ff, glow * 0.7));
      tail.rotation.z = Math.PI / 2;
      tail.position.x = -0.85;
      g.add(tail);
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), new THREE.MeshBasicMaterial({ color: 0xf0f6fc }));
      eye.position.set(0.55, 0.12, 0.22);
      g.add(eye);
      const lure = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 10, 8),
        new THREE.MeshBasicMaterial({ color: dim ? 0x24507a : 0x9fd0ff })
      );
      lure.position.set(0.78, 0.18, 0);
      g.add(lure);
      if (!dim) {
        const light = new THREE.PointLight(0x58a6ff, 3, 7, 2);
        light.position.copy(lure.position);
        g.add(light);
      }
      g.userData.wiggle = (time, phase) => {
        if (reduceMotion) return;
        tail.rotation.y = Math.sin(time * 3 + phase) * 0.4;
      };
    } else if (species === "angler") {
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.72, 16, 12), std(0x6b4a22, dim ? 0.25 : 0.55));
      body.scale.set(1.25, 0.78, 0.9);
      g.add(body);
      const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.05, 8, 16), std(0xd29922, dim ? 0.3 : 0.8));
      mouth.position.set(0.72, -0.05, 0);
      mouth.rotation.y = Math.PI / 2;
      g.add(mouth);
      const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.7, 6), std(0x8b6914, 0.4));
      stalk.position.set(0.15, 0.7, 0);
      stalk.rotation.z = -0.5;
      g.add(stalk);
      const lure = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 10, 8),
        new THREE.MeshBasicMaterial({ color: dim ? 0x6b5420 : 0xffd36a })
      );
      lure.position.set(0.48, 0.95, 0);
      g.add(lure);
      if (!dim) {
        const light = new THREE.PointLight(0xd29922, 4, 8, 2);
        light.position.copy(lure.position);
        g.add(light);
      }
      g.userData.wiggle = (time, phase) => {
        if (reduceMotion) return;
        lure.position.y = 0.95 + Math.sin(time * 2 + phase) * 0.06;
      };
    } else if (species === "dumbo") {
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.48, 18, 14), std(0xffb4a2, glow));
      head.scale.set(1, 0.85, 1.05);
      g.add(head);
      const fins = [-1, 1].map((side) => {
        const fin = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 10), std(0xffb4a2, glow));
        fin.scale.set(1.3, 0.35, 0.7);
        fin.position.set(side * 0.55, 0.28, 0);
        g.add(fin);
        return fin;
      });
      for (let i = 0; i < 6; i += 1) {
        const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.02, 0.55, 6), std(0xffb4a2, glow * 0.6));
        const angle = (i / 6) * Math.PI * 2;
        arm.position.set(Math.cos(angle) * 0.2, -0.45, Math.sin(angle) * 0.2);
        g.add(arm);
      }
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0x1c120e });
      [-0.14, 0.14].forEach((x) => {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), eyeMat);
        eye.position.set(x, 0.02, 0.42);
        g.add(eye);
      });
      if (!dim) g.add(new THREE.PointLight(0xffb4a2, 2.2, 6, 2));
      g.userData.wiggle = (time, phase) => {
        if (reduceMotion) return;
        fins.forEach((fin, i) => {
          fin.rotation.z = (i === 0 ? -1 : 1) * (0.4 + Math.sin(time * 3 + phase) * 0.35);
        });
      };
    } else {
      const rock = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.62, 0),
        new THREE.MeshStandardMaterial({ color: 0x2a241c, roughness: 0.9, metalness: 0.1 })
      );
      rock.position.y = -0.35;
      g.add(rock);
      const tips = [];
      for (let i = 0; i < 6; i += 1) {
        const height = 0.7 + (i % 3) * 0.28;
        const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, height, 8), std(0xf0f6fc, dim ? 0.25 : 0.55));
        const angle = (i / 6) * Math.PI * 2;
        tube.position.set(Math.cos(angle) * 0.28, height * 0.15, Math.sin(angle) * 0.22);
        g.add(tube);
        const tip = new THREE.Mesh(
          new THREE.SphereGeometry(0.09, 10, 8),
          new THREE.MeshBasicMaterial({ color: dim ? 0x8a4b28 : 0xff7b72 })
        );
        tip.position.set(tube.position.x, height * 0.15 + height * 0.55, tube.position.z);
        tip.userData.baseY = tip.position.y;
        g.add(tip);
        tips.push(tip);
      }
      if (!dim) {
        const light = new THREE.PointLight(0xf0883e, 3.5, 7, 2);
        light.position.y = 0.8;
        g.add(light);
      }
      g.userData.wiggle = (time, phase) => {
        if (reduceMotion) return;
        tips.forEach((tip, i) => {
          tip.position.y = tip.userData.baseY + Math.sin(time * 2 + phase + i) * 0.04;
        });
      };
    }
    return g;
  }

  const showcase = buildSpecies("jelly", false);
  showcase.position.set(2.5, 0.15, -2.1);
  scene.add(showcase);

  let bloom = null;
  function fit() {
    const box = window.viewSize ? window.viewSize() : { w: window.innerWidth, h: window.innerHeight };
    const w = box.w;
    const h = box.h;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const mobile = document.body.classList.contains("touch") || w < 820;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2));
    renderer.setSize(w, h, false);
  }
  fit();
  try {
    if (window.LabBloom) {
      bloom = window.LabBloom(renderer, scene, camera, {
        threshold: 0.48,
        strength: 0.9,
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
  window.addEventListener("orientationchange", resize);
  if (bloom) bloom.resize();

  const player = { x: 0, z: 0, vx: 0, vz: 0 };
  const keys = new Set();
  const stick = { x: 0, z: 0, id: null, originX: null, originY: null };
  const actors = [];
  const cam = new THREE.Vector3(0, 2.3, 7.4);
  const shake = window.LabFX ? window.LabFX.Shaker() : { add() {}, apply() { return { x: 0, y: 0 }; } };
  const state = { mode: "title" };
  let zoneIndex = 0;
  let score = 0;
  let best = readBest();
  let bestAtStart = best;
  let battery = 100;
  let target = null;
  let tutorial = true;
  let grace = 0;
  let hurt = 0;
  let calloutUntil = 0;

  function damp(current, targetValue, dt, speed) {
    return current + (targetValue - current) * (1 - Math.exp(-(speed || 6) * dt));
  }

  function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
  }

  function sfx(name) {
    const bank = window.LabFX && window.LabFX.sfx;
    if (bank && bank[name]) bank[name]();
  }

  function setModal(on) {
    document.body.classList.toggle("modal", on);
  }

  function disposeGroup(group) {
    const seen = new Set();
    group.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      const list = Array.isArray(obj.material) ? obj.material : obj.material ? [obj.material] : [];
      list.forEach((material) => {
        if (seen.has(material)) return;
        seen.add(material);
        material.dispose();
      });
    });
  }

  function clearActors() {
    actors.forEach((actor) => {
      world.remove(actor.group);
      disposeGroup(actor.group);
    });
    actors.length = 0;
    target = null;
  }

  function paintBest() {
    const line = bestText(best);
    $("titleBest").textContent = line;
    $("best").textContent = line;
  }

  function paintCard() {
    const zone = ZONES[zoneIndex];
    $("zoneName").textContent = zone.name + " · " + zone.range;
    $("specName").textContent = zone.title;
    $("specHint").textContent = zone.hint;
    $("zoneLabel").textContent = zone.name;
    $("card").style.setProperty("--spec", "#" + zone.accent.toString(16).padStart(6, "0"));
    wallMat.emissive.setHex(zone.accent);
  }

  function paintHud() {
    const zone = ZONES[zoneIndex];
    let progress = 0.2;
    if (target) progress = clamp((target.y + 26) / 30, 0, 1);
    const meters = Math.round(zone.from + (zone.to - zone.from) * progress);
    $("depth").textContent = meters.toLocaleString("en-US") + " m";
    $("score").textContent = String(score);
    const charge = clamp(battery / 100, 0, 1);
    $("battBar").style.transform = "scaleX(" + charge + ")";
    $("battBar").style.background = battery < 30 ? "#f85149" : "#58a6ff";
  }

  function say(title, body) {
    $("callout").textContent = title;
    $("fact").textContent = body || "";
    $("callout").classList.remove("hidden");
    $("fact").classList.toggle("hidden", !body);
    calloutUntil = performance.now() + 3400;
  }

  function randomSlot(avoid) {
    for (let n = 0; n < 14; n += 1) {
      const slot = {
        x: (Math.random() * 2 - 1) * 3.9,
        y: (zoneIndex === 0 ? -22 : -14) - Math.random() * 10,
        z: (Math.random() * 2 - 1) * 2.1
      };
      const clear = avoid.every((other) => Math.hypot(other.x - slot.x, (other.y - slot.y) * 0.45, other.z - slot.z) > 2.6);
      if (clear) return slot;
    }
    return { x: 0, y: -28, z: 0 };
  }

  function addActor(actor) {
    actor.group.position.set(actor.x, actor.y, actor.z);
    world.add(actor.group);
    actors.push(actor);
  }

  function spawnCreature(species, isTarget, fixed) {
    const group = buildSpecies(species, !isTarget);
    const slot = fixed || randomSlot(actors);
    const actor = {
      kind: "creature",
      group,
      species,
      target: isTarget,
      radius: RADIUS[species],
      x: slot.x,
      y: slot.y,
      z: slot.z,
      phase: Math.random() * Math.PI * 2,
      dead: false
    };
    if (isTarget) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(actor.radius + 0.42, 0.045, 8, 28),
        new THREE.MeshBasicMaterial({ color: ZONES[zoneIndex].accent })
      );
      ring.rotation.x = Math.PI / 2;
      group.add(ring);
      actor.ring = ring;
      target = actor;
    }
    addActor(actor);
  }

  function spawnRock() {
    const group = new THREE.Group();
    group.add(new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.55 + Math.random() * 0.3, 0),
      new THREE.MeshStandardMaterial({ color: 0x1c2330, roughness: 0.9, metalness: 0.14 })
    ));
    const slot = randomSlot(actors);
    addActor({ kind: "rock", group, radius: 0.95, x: slot.x, y: slot.y, z: slot.z, phase: Math.random(), dead: false });
  }

  function spawnVent() {
    const group = new THREE.Group();
    const material = new THREE.MeshBasicMaterial({ color: 0xf0883e, transparent: true, opacity: 0.9 });
    for (let i = 0; i < 7; i += 1) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(0.08 + (i % 3) * 0.02, 8, 8), material);
      puff.position.set((i % 2 === 0 ? -1 : 1) * 0.12, i * 0.42, (i % 3) * 0.08);
      group.add(puff);
    }
    const slot = randomSlot(actors);
    addActor({ kind: "vent", group, radius: 1.7, x: slot.x, y: slot.y, z: slot.z, phase: 0, dead: false });
  }

  function count(kind, isTarget) {
    return actors.filter((actor) => !actor.dead && actor.kind === kind && (isTarget == null || !!actor.target === isTarget)).length;
  }

  function ensurePopulation() {
    if (!target) {
      const fixed = tutorial ? { x: 1.65, y: -15, z: 0.15 } : null;
      spawnCreature(ZONES[zoneIndex].species, true, fixed);
      tutorial = false;
    }
    const wantDecoys = zoneIndex === 0 ? 1 : 3;
    while (count("creature", false) < wantDecoys) {
      const choices = SPECIES.filter((species) => species !== ZONES[zoneIndex].species);
      spawnCreature(choices[Math.floor(Math.random() * choices.length)], false, null);
    }
    const wantRocks = zoneIndex === 0 ? 0 : zoneIndex === 1 ? 1 : 2;
    while (count("rock") < wantRocks) spawnRock();
    while (count("vent") < (zoneIndex >= 2 ? 1 : 0)) spawnVent();
  }

  function overlaps(actor) {
    const pos = actor.group.position;
    return Math.hypot(player.x - pos.x, -pos.y, player.z - pos.z) < 0.72 + actor.radius + 0.36;
  }

  function finish(won) {
    if (state.mode === "end") return;
    state.mode = "end";
    const prev = bestAtStart;
    if (score > (best || 0)) {
      const result = commitBest(score);
      if (result.best != null) best = result.best;
    }
    const improved = score > (prev || 0);
    $("endKicker").textContent = won ? "survey filed" : "lamp dark";
    $("endTitle").textContent = won ? "Trench logged" : "Lamp dark";
    $("endText").textContent = won
      ? "Five zones, five animals. Leftover lamp charge is part of the score."
      : "The lamp died in the " + ZONES[zoneIndex].name.toLowerCase() + " zone, before the survey reached the vent worms.";
    $("endScore").textContent = "Score " + score + " · Best " + (best == null ? "—" : best);
    $("endRecord").classList.toggle("hidden", !improved);
    $("end").classList.remove("hidden");
    $("pause").classList.add("hidden");
    $("hint").classList.add("hidden");
    $("card").classList.add("hidden");
    $("pauseBtn").setAttribute("aria-pressed", "false");
    setModal(true);
    sfx(won ? "win" : "bad");
    paintBest();
  }

  function logTarget() {
    const zone = ZONES[zoneIndex];
    score += 100 + zoneIndex * 30;
    battery = Math.min(100, battery + 26);
    say(zone.title, zone.fact);
    shake.add(0.22);
    sfx("orb");
    if (zoneIndex === ZONES.length - 1) {
      score += Math.round(battery) * 4;
      finish(true);
      return;
    }
    zoneIndex += 1;
    grace = 1.5;
    clearActors();
    paintCard();
  }

  function showTitle() {
    state.mode = "title";
    $("title").classList.remove("hidden");
    $("pause").classList.add("hidden");
    $("end").classList.add("hidden");
    $("hud").hidden = true;
    $("hint").classList.add("hidden");
    $("card").classList.add("hidden");
    $("callout").classList.add("hidden");
    $("fact").classList.add("hidden");
    showcase.visible = true;
    setModal(true);
    paintBest();
  }

  function begin() {
    clearActors();
    zoneIndex = 0;
    score = 0;
    bestAtStart = best;
    battery = 100;
    tutorial = true;
    grace = 1.6;
    hurt = 0;
    player.x = 0;
    player.z = 0;
    player.vx = 0;
    player.vz = 0;
    state.mode = "play";
    sea.copy(new THREE.Color(ZONES[0].fog));
    scene.fog.density = 0.044;
    showcase.visible = false;
    $("title").classList.add("hidden");
    $("pause").classList.add("hidden");
    $("end").classList.add("hidden");
    $("hud").hidden = false;
    $("hint").classList.remove("hidden");
    $("hint").textContent = "Catch the ring. Dodge the rest.";
    $("card").classList.remove("hidden");
    $("callout").classList.add("hidden");
    $("fact").classList.add("hidden");
    $("pauseBtn").setAttribute("aria-pressed", "false");
    setModal(false);
    paintCard();
    paintHud();
    paintBest();
    ensurePopulation();
    sfx("ui");
  }

  function pause() {
    if (state.mode !== "play") return;
    state.mode = "pause";
    $("pause").classList.remove("hidden");
    $("pauseBtn").setAttribute("aria-pressed", "true");
    setModal(true);
    sfx("ui");
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
  $("retry").addEventListener("click", begin);
  $("pauseBtn").addEventListener("click", () => {
    if (state.mode === "play") pause();
    else if (state.mode === "pause") resume();
  });

  document.addEventListener("keydown", (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key.toLowerCase();
    if (e.key.startsWith("Arrow") || e.key === " ") e.preventDefault();
    if (e.repeat && (k === "enter" || k === "r" || k === "p" || k === "escape")) return;
    keys.add(k);
    if (k === "enter" && (state.mode === "title" || state.mode === "end")) begin();
    if ((k === "p" || k === "escape") && state.mode === "play") pause();
    else if ((k === "p" || k === "escape") && state.mode === "pause") resume();
    if (k === "r" && state.mode !== "title") begin();
  });
  document.addEventListener("keyup", (e) => keys.delete(e.key.toLowerCase()));
  window.addEventListener("blur", () => {
    keys.clear();
    stick.x = 0;
    stick.z = 0;
    stick.id = null;
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && state.mode === "play") pause();
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
    stick.originX = null;
    nub.style.transform = "translate(0,0)";
  }
  pad.addEventListener("pointerdown", (e) => {
    stick.id = e.pointerId;
    stick.originX = null;
    try { pad.setPointerCapture(e.pointerId); } catch (err) { /* already released */ }
    moveStick(e.clientX, e.clientY);
  });
  pad.addEventListener("pointermove", (e) => {
    if (e.pointerId !== stick.id || stick.originX != null) return;
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
  });

  function axis() {
    if (state.mode !== "play") return { x: 0, z: 0 };
    const keyX = (keys.has("d") || keys.has("arrowright") ? 1 : 0) - (keys.has("a") || keys.has("arrowleft") ? 1 : 0);
    const keyZ = (keys.has("s") || keys.has("arrowdown") ? 1 : 0) - (keys.has("w") || keys.has("arrowup") ? 1 : 0);
    return {
      x: clamp(keyX + stick.x, -1, 1),
      z: clamp(keyZ + stick.z, -1, 1)
    };
  }

  function scrollSet(list, step, wrap) {
    list.forEach((mesh) => {
      mesh.position.y += step;
      if (mesh.position.y > 16) mesh.position.y -= wrap;
    });
  }

  function scrollSnow(step) {
    const arr = snowGeo.attributes.position.array;
    for (let i = 0; i < SNOW; i += 1) {
      arr[i * 3 + 1] += step;
      if (arr[i * 3 + 1] > 18) arr[i * 3 + 1] -= 40;
    }
    snowGeo.attributes.position.needsUpdate = true;
  }

  function placeActor(actor, time, dt) {
    if (actor.kind === "creature") {
      const ox = Math.sin(time * 0.7 + actor.phase) * (reduceMotion ? 0.05 : 0.28);
      const oy = Math.sin(time * 1.3 + actor.phase) * (reduceMotion ? 0 : 0.1);
      actor.group.position.set(actor.x + ox, actor.y + oy, actor.z);
      actor.group.rotation.y += dt * 0.35;
      if (actor.group.userData.wiggle) actor.group.userData.wiggle(time, actor.phase);
      if (actor.ring) actor.ring.scale.setScalar(1 + Math.sin(time * 4.2) * 0.07);
    } else {
      actor.group.position.set(actor.x, actor.y, actor.z);
      if (actor.kind === "rock") actor.group.rotation.y += dt * 0.35;
    }
  }

  function sweepDead() {
    for (let i = actors.length - 1; i >= 0; i -= 1) {
      const actor = actors[i];
      if (!actor.dead) continue;
      if (actor === target) target = null;
      world.remove(actor.group);
      disposeGroup(actor.group);
      actors.splice(i, 1);
    }
  }

  showTitle();
  paintBest();

  const clock = new THREE.Clock();
  function frame() {
    requestAnimationFrame(frame);
    const dt = Math.min(0.033, clock.getDelta());
    const time = clock.elapsedTime;
    const diving = state.mode === "play";

    if (diving) {
      grace = Math.max(0, grace - dt);
      hurt = Math.max(0, hurt - dt);
      const steer = axis();
      player.vx = damp(player.vx, steer.x * 7.5, dt, 8);
      player.vz = damp(player.vz, steer.z * 7.5, dt, 8);
      actors.forEach((actor) => {
        if (actor.kind !== "vent" || actor.dead) return;
        if (actor.y > 8) {
          actor.dead = true;
          return;
        }
        const dx = player.x - actor.x;
        const dy = -actor.y;
        const dz = player.z - actor.z;
        const dist = Math.hypot(dx, dy, dz);
        if (dist < 2.3 && dist > 0.001) {
          player.vx += (dx / dist) * 18 * dt;
          player.vz += (dz / dist) * 10 * dt;
        }
      });
      player.vx = clamp(player.vx, -9, 9);
      player.vz = clamp(player.vz, -9, 9);
      player.x = clamp(player.x + player.vx * dt, -4.6, 4.6);
      player.z = clamp(player.z + player.vz * dt, -2.6, 2.6);

      battery -= (1.05 + zoneIndex * 0.08) * dt;
      const step = ZONES[zoneIndex].speed * dt;
      scrollSet(walls, step, 48);
      scrollSet(fins, step, 44);
      scrollSnow(reduceMotion ? step * 0.35 : step);

      actors.forEach((actor) => {
        actor.y += step;
        placeActor(actor, time, dt);
      });

      if (target && !target.dead) {
        if (overlaps(target)) logTarget();
        else if (target.y > 6.5) {
          battery -= 8;
          say("Slipped past", "The " + ZONES[zoneIndex].title.toLowerCase() + " left the lamp.");
          sfx("bad");
          target.dead = true;
        }
      }

      if (state.mode === "play") {
        actors.forEach((actor) => {
          if (actor.dead || actor.target || actor.kind === "vent") return;
          if (actor.y > 8) {
            actor.dead = true;
            return;
          }
          if (grace > 0 || hurt > 0 || !overlaps(actor)) return;
          if (actor.kind === "rock") {
            battery -= 12;
            say("Hull scrape", "Rock spires crowd the trench from the twilight zone down.");
            const away = Math.sign(player.x - actor.x) || 1;
            player.vx += away * 4;
          } else {
            battery -= 16;
            score = Math.max(0, score - 15);
            say("Not on the card", "Only the ringed animal files the zone.");
          }
          hurt = 0.55;
          shake.add(0.4);
          sfx(actor.kind === "rock" ? "hit" : "bad");
          actor.dead = true;
        });
      }

      if (state.mode === "play" && battery <= 0) finish(false);
      if (state.mode === "play") {
        sweepDead();
        ensurePopulation();
        paintHud();
      }
    } else if (state.mode === "title") {
      const drift = dt * (reduceMotion ? 0.4 : 1.6);
      scrollSet(walls, drift, 48);
      scrollSet(fins, drift, 44);
      scrollSnow(drift);
      if (showcase.userData.wiggle) showcase.userData.wiggle(time, 0.4);
      showcase.rotation.y += dt * 0.2;
    } else {
      actors.forEach((actor) => placeActor(actor, time, 0));
    }

    if (calloutUntil && performance.now() > calloutUntil) {
      calloutUntil = 0;
      $("callout").classList.add("hidden");
      $("fact").classList.add("hidden");
    }

    glassMat.emissive.setHex(hurt > 0 ? 0x6e2a2a : 0x123044);
    const near = target ? Math.hypot(player.x - target.x, target.y, player.z - target.z) : 8;
    lamp.intensity = 12 + Math.max(0, 4 - near) * 1.6;

    const bob = reduceMotion ? 0 : Math.sin(time * 1.5) * 0.08;
    sub.position.set(player.x, bob, player.z);
    sub.rotation.z = clamp(-player.vx * 0.045, -0.28, 0.28);
    sub.rotation.x = clamp(player.vz * 0.04, -0.22, 0.22);

    if (diving || state.mode === "title") {
      const zone = ZONES[state.mode === "title" ? 0 : zoneIndex];
      sea.lerp(new THREE.Color(zone.fog), 1 - Math.exp(-1.4 * dt));
    }

    const motion = diving ? dt : state.mode === "title" ? dt : 0;
    const want = new THREE.Vector3(player.x * 0.42, 2.25, player.z + 7.15);
    if (motion > 0) cam.lerp(want, 1 - Math.exp(-4 * motion));
    const kick = shake.apply(dt);
    camera.position.set(cam.x + kick.x, cam.y + kick.y, cam.z);
    camera.lookAt(player.x * 0.65, -0.35, player.z);

    if (bloom) bloom.render();
    else renderer.render(scene, camera);
  }
  frame();
})();
