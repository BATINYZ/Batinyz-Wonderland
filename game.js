const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const statusEl = document.getElementById("status");
const introOverlay = document.getElementById("introOverlay");
const restartBtn = document.getElementById("restartBtn");

const grid = 20;
const count = 24;
const speedStart = 120;

let speed = speedStart;
let lastTime = 0;
let snake;
let dir;
let nextDir;
let food;
let gameOver;
let score;
let started = false;
let audioCtx;
let musicTimer;
let noteIndex = 0;

const melody = [523.25, 659.25, 783.99, 659.25, 523.25, 659.25, 880.0, 783.99];
const bass = [130.81, 146.83, 164.81, 146.83];

function reset() {
  snake = [{ x: 12, y: 12 }];
  dir = { x: 1, y: 0 };
  nextDir = { x: 1, y: 0 };
  food = spawnFood();
  gameOver = false;
  score = 0;
  speed = speedStart;
  scoreEl.textContent = "Skor: 0";
  statusEl.textContent = "Yakala! Yemleri topla.";
  restartBtn.classList.remove("show");
}

function spawnFood() {
  while (true) {
    const p = {
      x: 1 + Math.floor(Math.random() * (count - 2)),
      y: 1 + Math.floor(Math.random() * (count - 2))
    };
    if (!snake.some((s) => s.x === p.x && s.y === p.y)) return p;
  }
}

function setDirection(name) {
  if (!started || gameOver) return;
  if (name === "up" && dir.y !== 1) nextDir = { x: 0, y: -1 };
  if (name === "down" && dir.y !== -1) nextDir = { x: 0, y: 1 };
  if (name === "left" && dir.x !== 1) nextDir = { x: -1, y: 0 };
  if (name === "right" && dir.x !== -1) nextDir = { x: 1, y: 0 };
}

function drawCell(x, y, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x * grid + 2, y * grid + 2, grid - 4, grid - 4, 6);
  ctx.fill();
}

function drawHead(x, y) {
  const px = x * grid + 2;
  const py = y * grid + 2;
  const size = grid - 4;
  ctx.fillStyle = "#e2ff92";
  ctx.beginPath();
  ctx.roundRect(px, py, size, size, 7);
  ctx.fill();

  let eye1 = { x: px + 6, y: py + 6 };
  let eye2 = { x: px + size - 6, y: py + 6 };
  let tongueFrom = { x: px + size / 2, y: py + size / 2 };
  let tongueTo = { x: px + size / 2, y: py - 4 };

  if (dir.x === 1) {
    eye1 = { x: px + size - 6, y: py + 6 };
    eye2 = { x: px + size - 6, y: py + size - 6 };
    tongueFrom = { x: px + size - 1, y: py + size / 2 };
    tongueTo = { x: px + size + 6, y: py + size / 2 };
  } else if (dir.x === -1) {
    eye1 = { x: px + 6, y: py + 6 };
    eye2 = { x: px + 6, y: py + size - 6 };
    tongueFrom = { x: px + 1, y: py + size / 2 };
    tongueTo = { x: px - 6, y: py + size / 2 };
  } else if (dir.y === 1) {
    eye1 = { x: px + 6, y: py + size - 6 };
    eye2 = { x: px + size - 6, y: py + size - 6 };
    tongueFrom = { x: px + size / 2, y: py + size - 1 };
    tongueTo = { x: px + size / 2, y: py + size + 6 };
  }

  ctx.fillStyle = "#1c2b1e";
  ctx.beginPath();
  ctx.arc(eye1.x, eye1.y, 2.1, 0, Math.PI * 2);
  ctx.arc(eye2.x, eye2.y, 2.1, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#ff8a9a";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(tongueFrom.x, tongueFrom.y);
  ctx.lineTo(tongueTo.x, tongueTo.y);
  ctx.stroke();
}

function drawAmazonBoardBackdrop() {
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#2a6d47");
  gradient.addColorStop(1, "#19482f");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.globalAlpha = 0.16;
  for (let i = 0; i < 6; i += 1) {
    const baseX = 40 + i * 78;
    ctx.fillStyle = "#245a34";
    ctx.fillRect(baseX, 240, 18, 240);
    ctx.beginPath();
    ctx.arc(baseX + 9, 232, 38, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(baseX - 8, 248, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(baseX + 27, 248, 24, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  ctx.strokeStyle = "rgba(175, 238, 120, 0.16)";
  for (let i = 0; i <= count; i += 1) {
    const p = i * grid;
    ctx.beginPath();
    ctx.moveTo(p, 0);
    ctx.lineTo(p, canvas.height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, p);
    ctx.lineTo(canvas.width, p);
    ctx.stroke();
  }
}

function tick(timestamp) {
  if (!lastTime) lastTime = timestamp;
  const elapsed = timestamp - lastTime;
  if (elapsed >= speed) {
    lastTime = timestamp;
    if (started) update();
    draw();
  }
  requestAnimationFrame(tick);
}

function update() {
  if (gameOver) return;
  dir = nextDir;
  const head = snake[0];
  const newHead = { x: head.x + dir.x, y: head.y + dir.y };

  const wall = newHead.x < 0 || newHead.y < 0 || newHead.x >= count || newHead.y >= count;
  const body = snake.some((p) => p.x === newHead.x && p.y === newHead.y);

  if (wall || body) {
    gameOver = true;
    statusEl.textContent = "Bitti! Restart ile yeniden baslayabilirsin.";
    restartBtn.classList.add("show");
    deathSound();
    return;
  }

  snake.unshift(newHead);

  if (newHead.x === food.x && newHead.y === food.y) {
    score += 1;
    speed = Math.max(65, speed - 2);
    scoreEl.textContent = `Skor: ${score}`;
    statusEl.textContent = "Maymunlar alkisliyor! Devam!";
    food = spawnFood();
  } else {
    snake.pop();
  }
}

function draw() {
  drawAmazonBoardBackdrop();
  if (!started) return;
  drawCell(food.x, food.y, "#ff7e54");
  snake.forEach((part, i) => {
    if (i === 0) drawHead(part.x, part.y);
    else drawCell(part.x, part.y, "#93e65e");
  });
}

function tone(freq, duration, type = "square", volume = 0.03, when = 0) {
  if (!audioCtx) return;
  const t0 = audioCtx.currentTime + when;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(volume, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(t0);
  osc.stop(t0 + duration);
}

function initAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === "suspended") audioCtx.resume();
}

function startMusic() {
  if (musicTimer) clearInterval(musicTimer);
  musicTimer = setInterval(() => {
    if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
    const m = melody[noteIndex % melody.length];
    const b = bass[noteIndex % bass.length];
    tone(m, 0.16, "square", 0.07, 0);
    tone(b, 0.2, "triangle", 0.05, 0.01);
    noteIndex += 1;
  }, 190);
}

function deathSound() {
  if (!audioCtx) return;
  tone(420, 0.2, "sawtooth", 0.04, 0.0);
  tone(300, 0.25, "sawtooth", 0.04, 0.18);
  tone(180, 0.35, "triangle", 0.045, 0.4);
}

function startGame() {
  if (started) return;
  initAudio();
  startMusic();
  started = true;
  introOverlay.classList.add("hidden");
  statusEl.textContent = "Oyun basladi!";
  reset();
  draw();
}

window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowUp") setDirection("up");
  if (e.key === "ArrowDown") setDirection("down");
  if (e.key === "ArrowLeft") setDirection("left");
  if (e.key === "ArrowRight") setDirection("right");
  if (e.key === " " && gameOver) {
    reset();
    draw();
  }
});

document.querySelectorAll(".controls button").forEach((btn) => {
  btn.addEventListener("touchstart", (e) => {
    e.preventDefault();
    setDirection(btn.dataset.dir);
  }, { passive: false });
  btn.addEventListener("click", () => setDirection(btn.dataset.dir));
});

let touchStartX = 0;
let touchStartY = 0;
canvas.addEventListener("touchstart", (e) => {
  const t = e.changedTouches[0];
  touchStartX = t.clientX;
  touchStartY = t.clientY;
});
canvas.addEventListener("touchend", (e) => {
  if (!started || gameOver) return;
  const t = e.changedTouches[0];
  const dx = t.clientX - touchStartX;
  const dy = t.clientY - touchStartY;
  if (Math.abs(dx) > Math.abs(dy)) setDirection(dx > 0 ? "right" : "left");
  else setDirection(dy > 0 ? "down" : "up");
});

introOverlay.addEventListener("click", startGame);
introOverlay.addEventListener("touchstart", (e) => {
  e.preventDefault();
  startGame();
}, { passive: false });

restartBtn.addEventListener("click", () => {
  reset();
  draw();
});

reset();
draw();
requestAnimationFrame(tick);
