const SLUG = "memory";
const LEGACY = "games.memory.bestMoves";

const FACES = [
  {
    id: "diamond",
    label: "Diamond",
    svg: '<svg viewBox="0 0 64 64" aria-hidden="true"><path fill="#58a6ff" d="M32 6 58 32 32 58 6 32Z"/></svg>',
  },
  {
    id: "circle",
    label: "Circle",
    svg: '<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="22" fill="#3fb950"/></svg>',
  },
  {
    id: "triangle",
    label: "Triangle",
    svg: '<svg viewBox="0 0 64 64" aria-hidden="true"><path fill="#d2a8ff" d="M32 8 56 54H8Z"/></svg>',
  },
  {
    id: "square",
    label: "Square",
    svg: '<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="12" y="12" width="40" height="40" rx="4" fill="#ffa657"/></svg>',
  },
  {
    id: "star",
    label: "Star",
    svg: '<svg viewBox="0 0 64 64" aria-hidden="true"><path fill="#ff7b72" d="M32 6 39 24l19 2-14 12 4 19-16-10L16 57l4-19L6 26l19-2Z"/></svg>',
  },
  {
    id: "plus",
    label: "Plus",
    svg: '<svg viewBox="0 0 64 64" aria-hidden="true"><path fill="#79c0ff" d="M26 8h12v18h18v12H38v18H26V38H8V26h18Z"/></svg>',
  },
  {
    id: "heart",
    label: "Heart",
    svg: '<svg viewBox="0 0 64 64" aria-hidden="true"><path fill="#f778ba" d="M32 54 12.5 34.8C6 28.4 6.4 18 13.6 12.2 19.6 7.4 27.4 9 32 15.2 36.6 9 44.4 7.4 50.4 12.2 57.6 18 58 28.4 51.5 34.8Z"/></svg>',
  },
  {
    id: "moon",
    label: "Moon",
    svg: '<svg viewBox="0 0 64 64" aria-hidden="true"><path fill="#e3b341" d="M40 8a24 24 0 1 0 0 48 20 20 0 1 1 0-48Z"/></svg>',
  },
];

const grid = document.getElementById("grid");
const movesEl = document.getElementById("moves");
const matchesEl = document.getElementById("matches");
const timeEl = document.getElementById("time");
const bestEl = document.getElementById("best");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlay-title");
const overlayText = document.getElementById("overlay-text");
const restartBtn = document.getElementById("restart");
const overlayRestart = document.getElementById("overlay-restart");

let cards = [];
let buttons = [];
let open = [];
let lock = false;
let moves = 0;
let matches = 0;
let started = false;
let t0 = 0;
let timerId = null;
let mismatchTimer = null;
let bestMoves = readBest();
let memoryHiddenAt = 0;

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
    return window.HivemindHighscore.submit(SLUG, value, { mode: "min", legacy: LEGACY });
  } catch (err) {
    return { best: null, improved: false };
  }
}

function shuffle(list) {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function fmt(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return m + ":" + String(s).padStart(2, "0");
}

function elapsed() {
  return started ? performance.now() - t0 : 0;
}

function bestText() {
  return bestMoves == null ? "—" : bestMoves + " moves";
}

function updateHud() {
  movesEl.textContent = String(moves);
  matchesEl.textContent = matches + "/" + FACES.length;
  timeEl.textContent = fmt(elapsed());
  bestEl.textContent = bestText();
}

function paint(i) {
  const card = cards[i];
  const btn = buttons[i];
  const faceUp = card.up || card.matched;
  btn.classList.toggle("is-up", faceUp);
  btn.classList.toggle("is-matched", card.matched);
  btn.setAttribute("aria-label", faceUp ? card.label + (card.matched ? ", matched" : "") : "Face-down card");
}

function stopTimer() {
  if (timerId !== null) {
    clearInterval(timerId);
    timerId = null;
  }
}

function startTimer() {
  t0 = performance.now();
  started = true;
  stopTimer();
  timerId = setInterval(updateHud, 200);
}

function showWin(ms) {
  lock = true;
  stopTimer();
  const result = commitBest(moves);
  const improved = !!result.improved;
  if (result.best != null) bestMoves = result.best;
  updateHud();
  const bestShown = bestMoves == null ? "—" : bestMoves + " moves";
  overlayTitle.textContent = "Cleared";
  overlayText.textContent = moves + " moves in " + fmt(ms) + ". Best " + bestShown + ".";
  const record = document.getElementById("overlay-record");
  if (record) record.hidden = !improved;
  overlay.hidden = false;
}

function deal() {
  clearTimeout(mismatchTimer);
  stopTimer();
  lock = false;
  open = [];
  moves = 0;
  matches = 0;
  started = false;
  cards = shuffle(FACES.flatMap((face) => [face, face])).map((face) => ({
    id: face.id,
    label: face.label,
    svg: face.svg,
    up: false,
    matched: false,
  }));
  grid.replaceChildren();
  buttons = cards.map((card, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "card";
    btn.innerHTML =
      '<span class="card-inner"><span class="face back"></span><span class="face front">' +
      card.svg +
      "</span></span>";
    btn.addEventListener("pointerup", (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    flip(i);
  });
  btn.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    flip(i);
  });
    grid.appendChild(btn);
    return btn;
  });
  buttons.forEach((_, i) => paint(i));
  const record = document.getElementById("overlay-record");
  if (record) record.hidden = true;
  overlay.hidden = true;
  updateHud();
}

function flip(i) {
  if (lock) return;
  const card = cards[i];
  if (card.up || card.matched) return;
  card.up = true;
  paint(i);
  if (!started) startTimer();
  open.push(i);
  if (open.length < 2) return;

  moves += 1;
  const [a, b] = open;
  updateHud();
  if (cards[a].id === cards[b].id) {
    cards[a].matched = true;
    cards[b].matched = true;
    paint(a);
    paint(b);
    open = [];
    matches += 1;
    updateHud();
    if (matches === FACES.length) showWin(elapsed());
    return;
  }

  lock = true;
  mismatchTimer = setTimeout(() => {
    cards[a].up = false;
    cards[b].up = false;
    paint(a);
    paint(b);
    open = [];
    lock = false;
  }, 700);
}

grid.addEventListener("keydown", (e) => {
  const cols = 4;
  const i = buttons.indexOf(document.activeElement);
  if (i < 0) return;
  let next = i;
  if (e.key === "ArrowRight") next = (i + 1) % buttons.length;
  else if (e.key === "ArrowLeft") next = (i - 1 + buttons.length) % buttons.length;
  else if (e.key === "ArrowDown") next = Math.min(buttons.length - 1, i + cols);
  else if (e.key === "ArrowUp") next = Math.max(0, i - cols);
  else return;
  e.preventDefault();
  buttons[next].focus();
});

restartBtn.addEventListener("click", deal);
overlayRestart.addEventListener("click", deal);
document.addEventListener("visibilitychange", () => {
  if (!started || matches === FACES.length) return;
  if (document.hidden) {
    memoryHiddenAt = performance.now();
    stopTimer();
  } else if (memoryHiddenAt) {
    t0 += performance.now() - memoryHiddenAt;
    memoryHiddenAt = 0;
    timerId = setInterval(updateHud, 200);
  }
});
deal();
