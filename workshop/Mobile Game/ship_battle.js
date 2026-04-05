const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// ==== GAME STATE ====
const keys = {};
const pressed = {};
window.addEventListener("keydown", (e) => {
  const key = e.key.toLowerCase();
  if (!keys[key]) pressed[key] = true;
  keys[key] = true;
});
window.addEventListener("keyup", (e) => {
  const key = e.key.toLowerCase();
  keys[key] = false;
});

function consumePress(key) {
  if (!pressed[key]) return false;
  pressed[key] = false;
  return true;
}

const player = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  angle: 0,
  speed: 0,
  maxSpeed: 2,
  turnSpeed: 0.05,
  radius: 15,
  hp: 100,
  fireCooldown: 0,
  fireRate: 0.4, // seconds between shots
  damage: 25,
};

let coins = 0;

const cannonballs = [];
const enemyShips = [];

const BOARD_DISTANCE = 80; // distance to allow boarding
let canBoard = false;
let nearbyEnemy = null;

// timing
let lastTime = performance.now() / 1000;

// ==== UI ELEMENTS ====
const coinsEl = document.getElementById("coins");
const hpEl = document.getElementById("hp");
const boardingHintEl = document.getElementById("boardingHint");

// shop buttons
document
  .getElementById("upgradeSpeed")
  .addEventListener("click", () => buyUpgrade("speed"));
document
  .getElementById("upgradeFireRate")
  .addEventListener("click", () => buyUpgrade("fireRate"));
document
  .getElementById("upgradeDamage")
  .addEventListener("click", () => buyUpgrade("damage"));

// ==== MINIGAME STATE ====
const minigameOverlay = document.getElementById("minigameOverlay");
const tapButton = document.getElementById("tapButton");
const tapCountText = document.getElementById("tapCountText");
const startMinigameBtn = document.getElementById("startMinigame");
const exitMinigameBtn = document.getElementById("exitMinigame");

let inMinigame = false;
let taps = 0;
let minigameTimer = 0;
let minigameRunning = false;

startMinigameBtn.addEventListener("click", startMinigame);
exitMinigameBtn.addEventListener("click", exitMinigame);
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && inMinigame) {
    exitMinigame();
  }
});
tapButton.addEventListener("click", () => {
  if (minigameRunning) {
    taps++;
    tapCountText.textContent = `Taps: ${taps}`;
  }
});

// ==== ENEMY SETUP ====
function spawnEnemy() {
  const side = Math.random() < 0.5 ? "horizontal" : "vertical";
  let x, y;
  if (side === "horizontal") {
    x = Math.random() * canvas.width;
    y = Math.random() < 0.5 ? -50 : canvas.height + 50;
  } else {
    x = Math.random() < 0.5 ? -50 : canvas.width + 50;
    y = Math.random() * canvas.height;
  }

  enemyShips.push({
    x,
    y,
    angle: Math.random() * Math.PI * 2,
    speed: 1 + Math.random(),
    radius: 15,
    hp: 50,
    alive: true,
  });
}

// initial enemies
for (let i = 0; i < 4; i++) {
  spawnEnemy();
}

// ==== GAME FUNCTIONS ====
function update(dt) {
  if (inMinigame) {
    updateMinigame(dt);
    return; // pause main game behind minigame
  }

  updatePlayer(dt);
  updateEnemies(dt);
  updateCannonballs(dt);
  checkBoarding();
  updateUI();
}

function updatePlayer(dt) {
  // rotate with A/D or left/right arrows
  if (keys["a"] || keys["arrowleft"]) {
    player.angle -= player.turnSpeed;
  }
  if (keys["d"] || keys["arrowright"]) {
    player.angle += player.turnSpeed;
  }

  // throttle with W/S or up/down arrows
  if (keys["w"] || keys["arrowup"]) {
    player.speed += 0.05;
  } else if (keys["s"] || keys["arrowdown"]) {
    player.speed -= 0.05;
  } else {
    // friction
    player.speed *= 0.98;
  }

  // clamp speed
  if (player.speed > player.maxSpeed) player.speed = player.maxSpeed;
  if (player.speed < -player.maxSpeed / 2) player.speed = -player.maxSpeed / 2;

  // move
  player.x += Math.cos(player.angle) * player.speed;
  player.y += Math.sin(player.angle) * player.speed;

  // wrap around screen
  if (player.x < 0) player.x += canvas.width;
  if (player.x > canvas.width) player.x -= canvas.width;
  if (player.y < 0) player.y += canvas.height;
  if (player.y > canvas.height) player.y -= canvas.height;

  // shooting: space or enter
  player.fireCooldown -= dt;
  if ((keys[" "] || keys["enter"]) && player.fireCooldown <= 0) {
    shootCannonball(player);
    player.fireCooldown = player.fireRate;
  }

  // press "b" to board if near
  if (canBoard && nearbyEnemy && consumePress("b")) {
    openMinigame();
  }
}

function shootCannonball(ship, isEnemy = false) {
  const speed = isEnemy ? 3 : 4;
  cannonballs.push({
    x: ship.x + Math.cos(ship.angle) * ship.radius,
    y: ship.y + Math.sin(ship.angle) * ship.radius,
    vx: Math.cos(ship.angle) * speed,
    vy: Math.sin(ship.angle) * speed,
    radius: 4,
    damage: isEnemy ? 10 : player.damage,
    owner: isEnemy ? "enemy" : "player",
  });
}

function updateEnemies(dt) {
  for (const enemy of enemyShips) {
    if (!enemy.alive) continue;

    // simple AI: move towards player
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const targetAngle = Math.atan2(dy, dx);
    let angleDiff = targetAngle - enemy.angle;
    // normalize angle
    angleDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));
    enemy.angle += angleDiff * 0.02;

    enemy.x += Math.cos(enemy.angle) * enemy.speed;
    enemy.y += Math.sin(enemy.angle) * enemy.speed;

    // wrap
    if (enemy.x < -100) enemy.x = canvas.width + 100;
    if (enemy.x > canvas.width + 100) enemy.x = -100;
    if (enemy.y < -100) enemy.y = canvas.height + 100;
    if (enemy.y > canvas.height + 100) enemy.y = -100;

    // enemy sometimes shoots
    if (Math.random() < 0.005) {
      shootCannonball(enemy, true);
    }

    // if dead, respawn after giving coins
    if (enemy.hp <= 0 && enemy.alive) {
      enemy.alive = false;
      coins += 5;
      setTimeout(spawnEnemy, 2000);
    }
  }
}

function updateCannonballs(dt) {
  for (let i = cannonballs.length - 1; i >= 0; i--) {
    const c = cannonballs[i];
    c.x += c.vx;
    c.y += c.vy;

    // remove if off-screen a lot
    if (
      c.x < -100 ||
      c.x > canvas.width + 100 ||
      c.y < -100 ||
      c.y > canvas.height + 100
    ) {
      cannonballs.splice(i, 1);
      continue;
    }

    // collisions
    if (c.owner === "player") {
      // check enemies
      for (const enemy of enemyShips) {
        if (!enemy.alive) continue;
        const dist = Math.hypot(enemy.x - c.x, enemy.y - c.y);
        if (dist < enemy.radius + c.radius) {
          enemy.hp -= c.damage;
          cannonballs.splice(i, 1);
          break;
        }
      }
    } else if (c.owner === "enemy") {
      const dist = Math.hypot(player.x - c.x, player.y - c.y);
      if (dist < player.radius + c.radius) {
        player.hp -= c.damage;
        cannonballs.splice(i, 1);
        if (player.hp <= 0) {
          // super simple "respawn"
          player.hp = 100;
          player.x = canvas.width / 2;
          player.y = canvas.height / 2;
          player.speed = 0;
          coins = Math.max(0, coins - 10);
        }
      }
    }
  }
}

function checkBoarding() {
  canBoard = false;
  nearbyEnemy = null;
  boardingHintEl.textContent = "";

  for (const enemy of enemyShips) {
    if (!enemy.alive) continue;
    const dist = Math.hypot(enemy.x - player.x, enemy.y - player.y);
    if (dist < BOARD_DISTANCE) {
      canBoard = true;
      nearbyEnemy = enemy;
      boardingHintEl.textContent = 'Press B to board!';
      break;
    }
  }
}

function updateUI() {
  coinsEl.textContent = `Coins: ${coins}`;
  hpEl.textContent = `HP: ${player.hp}`;
}

// ==== SHOP / UPGRADES ====
function buyUpgrade(type) {
  if (type === "speed" && coins >= 10) {
    coins -= 10;
    player.maxSpeed += 0.3;
  } else if (type === "fireRate" && coins >= 10) {
    coins -= 10;
    player.fireRate = Math.max(0.15, player.fireRate - 0.05);
  } else if (type === "damage" && coins >= 15) {
    coins -= 15;
    player.damage += 5;
  }
}

// ==== MINIGAME LOGIC ====
function openMinigame() {
  inMinigame = true;
  minigameOverlay.classList.remove("hidden");
  taps = 0;
  minigameTimer = 0;
  minigameRunning = false;
  tapCountText.textContent = "Taps: 0";
}

function startMinigame() {
  taps = 0;
  minigameTimer = 3; // seconds
  minigameRunning = true;
}

function exitMinigame() {
  inMinigame = false;
  minigameOverlay.classList.add("hidden");
}

function updateMinigame(dt) {
  if (!minigameRunning) return;

  minigameTimer -= dt;
  if (minigameTimer <= 0) {
    minigameRunning = false;
    // evaluate result
    if (taps >= 15) {
      // success
      coins += 10;
      alert(`You won the boarding battle! +10 coins (Taps: ${taps})`);
      if (nearbyEnemy) {
        nearbyEnemy.hp = 0;
        nearbyEnemy.alive = false;
        setTimeout(spawnEnemy, 2000);
      }
    } else {
      alert(`You lost the boarding battle... (Taps: ${taps})`);
      player.hp = Math.max(10, player.hp - 20);
    }
    exitMinigame();
  }
}

// ==== RENDER ====
function drawShip(x, y, angle, color = "white") {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(20, 0);
  ctx.lineTo(-15, -10);
  ctx.lineTo(-10, 0);
  ctx.lineTo(-15, 10);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

function draw() {
  // ocean background
  ctx.fillStyle = "#00334d";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // waves (simple)
  ctx.strokeStyle = "rgba(255,255,255,0.1)";
  for (let y = 0; y < canvas.height; y += 40) {
    ctx.beginPath();
    for (let x = 0; x < canvas.width; x += 40) {
      ctx.arc(x + (y % 40), y, 1, 0, Math.PI * 2);
    }
    ctx.stroke();
  }

  // draw cannonballs
  for (const c of cannonballs) {
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
    ctx.fillStyle = "black";
    ctx.fill();
  }

  // draw enemies
  for (const enemy of enemyShips) {
    if (!enemy.alive) continue;
    drawShip(enemy.x, enemy.y, enemy.angle, "#ffcc66");

    // small hp bar
    ctx.fillStyle = "red";
    ctx.fillRect(enemy.x - 15, enemy.y - 25, 30, 4);
    ctx.fillStyle = "lime";
    const hpWidth = (enemy.hp / 50) * 30;
    ctx.fillRect(enemy.x - 15, enemy.y - 25, hpWidth, 4);
  }

  // draw player
  drawShip(player.x, player.y, player.angle, "#66d9ff");
}

// ==== MAIN LOOP ====
function loop() {
  const now = performance.now() / 1000;
  const dt = now - lastTime;
  lastTime = now;

  update(dt);
  draw();

  requestAnimationFrame(loop);
}

loop();
