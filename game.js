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
    const p = { x: Math.floor(Math.random() * count), y: Math.floor(Math.random() * count) };
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
  snake.forEach((part, i) => drawCell(part.x, part.y, i === 0 ? "#dbff84" : "#93e65e"));
}

function startGame() {
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
  });
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
});

restartBtn.addEventListener("click", () => {
  reset();
  draw();
});

reset();
draw();
requestAnimationFrame(tick);
