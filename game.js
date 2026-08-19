const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreText = document.getElementById("score");
const coinsText = document.getElementById("coins");
const speedText = document.getElementById("speed");

const startScreen = document.getElementById("startScreen");
const gameOverScreen = document.getElementById("gameOver");

const startButton = document.getElementById("startButton");
const restartButton = document.getElementById("restartButton");

const finalScore = document.getElementById("finalScore");

let W;
let H;

function resize() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
}

window.addEventListener("resize", resize);
resize();

let player;
let obstacles;
let coins;
let score;
let coinCount;
let gameSpeed;
let running;
let lastTime;

function resetGame() {
  player = {
    lane: 1,
    x: 0,
    y: H - 170,
    width: 55,
    height: 75,
    jumping: false,
    jumpPower: 0
  };

  obstacles = [];
  coins = [];

  score = 0;
  coinCount = 0;
  gameSpeed = 7;
  running = true;

  updateText();
}

function updateText() {
  scoreText.textContent = Math.floor(score);
  coinsText.textContent = coinCount;
  speedText.textContent = (gameSpeed / 7).toFixed(1) + "x";
}

function laneX(lane) {
  const roadWidth = Math.min(W * 0.75, 420);
  const roadLeft = (W - roadWidth) / 2;

  return roadLeft + roadWidth * (lane + 0.5) / 3;
}

function drawRoad() {
  const roadWidth = Math.min(W * 0.75, 420);
  const roadLeft = (W - roadWidth) / 2;

  ctx.fillStyle = "#222";
  ctx.fillRect(roadLeft, 0, roadWidth, H);

  ctx.strokeStyle = "#eee";
  ctx.lineWidth = 4;

  for (let i = 1; i < 3; i++) {
    const x = roadLeft + roadWidth * i / 3;

    for (let y = -40; y < H; y += 80) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + 40);
      ctx.stroke();
    }
  }
}

function drawPlayer() {
  const x = laneX(player.lane);

  player.x = x;

  const groundY = H - 95;
  let y = groundY - player.height;

  if (player.jumping) {
    y -= player.jumpPower;
  }

  player.y = y;

  // جسم اللاعب
  ctx.fillStyle = "#fff";
  ctx.fillRect(x - 25, y + 25, 50, 45);

  // الرأس
  ctx.fillStyle = "#8b5a3c";
  ctx.beginPath();
  ctx.arc(x, y + 12, 18, 0, Math.PI * 2);
  ctx.fill();

  // الشعر
  ctx.fillStyle = "#111";
  ctx.beginPath();
  ctx.arc(x, y + 5, 17, Math.PI, Math.PI * 2);
  ctx.fill();

  // البنطلون
  ctx.fillStyle = "#111";
  ctx.fillRect(x - 23, y + 65, 20, 20);
  ctx.fillRect(x + 3, y + 65, 20, 20);

  // الكرة
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(x + 38, y + 65, 9, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#111";
  ctx.font = "bold 9px Arial";
  ctx.textAlign = "center";
  ctx.fillText("V", x, y + 52);
}

function createObstacle() {
  obstacles.push({
    lane: Math.floor(Math.random() * 3),
    y: -70,
    width: 55,
    height: 55
  });
}

function createCoin() {
  coins.push({
    lane: Math.floor(Math.random() * 3),
    y: -30,
    size: 16
  });
}

function drawObstacles() {
  obstacles.forEach(o => {
    const x = laneX(o.lane);

    ctx.fillStyle = "#e53935";
    ctx.fillRect(
      x - o.width / 2,
      o.y,
      o.width,
      o.height
    );

    ctx.fillStyle = "#fff";
    ctx.font = "bold 25px Arial";
    ctx.textAlign = "center";
    ctx.fillText("!", x, o.y + 38);
  });
}

function drawCoins() {
  coins.forEach(c => {
    const x = laneX(c.lane);

    ctx.fillStyle = "#ffd21c";

    ctx.beginPath();
    ctx.arc(x, c.y, c.size, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#fff";
    ctx.font = "bold 14px Arial";
    ctx.textAlign = "center";
    ctx.fillText("$", x, c.y + 5);
  });
}

function collision(a, b) {
  return (
    a.x - a.width / 2 < b.x + b.width / 2 &&
    a.x + a.width / 2 > b.x - b.width / 2 &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function update(dt) {
  score += dt * gameSpeed;

  gameSpeed += dt * 0.12;

  if (Math.random() < dt * 0.8) {
    createObstacle();
  }

  if (Math.random() < dt * 1.1) {
    createCoin();
  }

  obstacles.forEach(o => {
    o.y += gameSpeed * dt * 60;
  });

  coins.forEach(c => {
    c.y += gameSpeed * dt * 60;
  });

  obstacles = obstacles.filter(o => o.y < H + 100);
  coins = coins.filter(c => c.y < H + 100);

  if (player.jumping) {
    player.jumpPower += 900 * dt;

    if (player.jumpPower >= 250) {
      player.jumping = false;
      player.jumpPower = 0;
    }
  }

  for (const o of obstacles) {
    const obstacleBox = {
      x: laneX(o.lane),
      y: o.y,
      width: o.width,
      height: o.height
    };

    if (!player.jumping && collision(player, obstacleBox)) {
      endGame();
      return;
    }
  }

  coins = coins.filter(c => {
    const dx = Math.abs(laneX(c.lane) - player.x);
    const dy = Math.abs(c.y - (player.y + 40));

    if (dx < 45 && dy < 55) {
      coinCount++;
      score += 25;
      return false;
    }

    return true;
  });

  updateText();
}

function draw() {
  ctx.clearRect(0, 0, W, H);

  ctx.fillStyle = "#58ad50";
  ctx.fillRect(0, 0, W, H);

  drawRoad();
  drawCoins();
  drawObstacles();
  drawPlayer();
}

function loop(time) {
  if (!running) return;

  const dt = Math.min((time - lastTime) / 1000, 0.05);
  lastTime = time;

  update(dt);
  draw();

  requestAnimationFrame(loop);
}

function startGame() {
  startScreen.classList.add("hidden");
  gameOverScreen.classList.add("hidden");

  resetGame();

  lastTime = performance.now();
  requestAnimationFrame(loop);
}

function endGame() {
  running = false;

  finalScore.textContent = Math.floor(score);

  gameOverScreen.classList.remove("hidden");
}

function moveLeft() {
  if (!running) return;

  if (player.lane > 0) {
    player.lane--;
  }
}

function moveRight() {
  if (!running) return;

  if (player.lane < 2) {
    player.lane++;
  }
}

function jump() {
  if (!running) return;

  if (!player.jumping) {
    player.jumping = true;
    player.jumpPower = 1;
  }
}

document.getElementById("left").addEventListener("click", moveLeft);
document.getElementById("right").addEventListener("click", moveRight);
document.getElementById("jump").addEventListener("click", jump);

startButton.addEventListener("click", startGame);
restartButton.addEventListener("click", startGame);

document.addEventListener("keydown", e => {
  if (e.key === "ArrowLeft") moveLeft();
  if (e.key === "ArrowRight") moveRight();
  if (e.key === "ArrowUp" || e.key === " ") jump();
});

draw();
