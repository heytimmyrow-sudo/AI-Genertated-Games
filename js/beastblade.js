(function () {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas && canvas.getContext ? canvas.getContext("2d") : null;
  if (!canvas || !ctx) return;

  const STAGES = [
    [
      "##################",
      "#P............A..#",
      "#....F...#.......#",
      "#........#..B....#",
      "#..##........##..#",
      "#.......M........#",
      "#..H.........X...#",
      "#................#",
      "##################"
    ],
    [
      "##################",
      "#P........#....X.#",
      "#..F......#..B...#",
      "#..##.....#......#",
      "#......A.....F...#",
      "#..H......M......#",
      "#.........##.....#",
      "#................#",
      "##################"
    ]
  ];

  const CELL = 64;
  const FOV = Math.PI / 3;
  const HALF_FOV = FOV / 2;
  const RAYS = 220;
  const MAX_DEPTH = CELL * 18;
  const MOUSE_SENSITIVITY = 0.0026;
  const STAGE_THEMES = [
    {
      skyTop: "#52261a",
      skyBottom: "#a4592d",
      floorTop: "#4d4024",
      floorBottom: "#181108",
      wall: [120, 82, 54],
      glow: "#ffb36b",
      haze: "rgba(255, 179, 107, 0.12)"
    },
    {
      skyTop: "#1d1237",
      skyBottom: "#6f4e94",
      floorTop: "#3a2a40",
      floorBottom: "#110c15",
      wall: [92, 70, 120],
      glow: "#92fbff",
      haze: "rgba(146, 251, 255, 0.12)"
    }
  ];

  class InputHandler {
    constructor() {
      this.keys = Object.create(null);
      this.previous = Object.create(null);
      window.addEventListener("keydown", (event) => {
        const key = event.key.toLowerCase();
        this.keys[key] = true;
        if (["arrowup", "arrowdown", "arrowleft", "arrowright", " ", "q", "u", "1", "2", "3", "p", "escape"].includes(key)) event.preventDefault();
      });
      window.addEventListener("keyup", (event) => {
        this.keys[event.key.toLowerCase()] = false;
      });
      window.addEventListener("blur", () => {
        this.keys = Object.create(null);
        this.previous = Object.create(null);
      });
    }

    isDown() {
      return Array.from(arguments).some((key) => this.keys[key]);
    }

    wasPressed() {
      return Array.from(arguments).some((key) => this.keys[key] && !this.previous[key]);
    }

    endFrame() {
      this.previous = { ...this.keys };
    }
  }

  function normalizeAngle(angle) {
    while (angle < -Math.PI) angle += Math.PI * 2;
    while (angle > Math.PI) angle -= Math.PI * 2;
    return angle;
  }

  function distance(ax, ay, bx, by) {
    return Math.hypot(ax - bx, ay - by);
  }

  function returnToMenu() {
    if (document.pointerLockElement === canvas && document.exitPointerLock) {
      document.exitPointerLock();
    }
    if (window.top && window.top !== window) {
      window.top.postMessage({ type: "codex-menu-exit" }, window.location.origin);
      return;
    }
    window.location.href = "../index.html";
  }

  function enemyTemplate(symbol) {
    if (symbol === "F") return { kind: "fang", color: "#7fefff", health: 40, speed: 78, damage: 10, radius: 16, reward: 15 };
    if (symbol === "B") return { kind: "brute", color: "#ffae6b", health: 75, speed: 48, damage: 18, radius: 20, reward: 22 };
    return { kind: "alpha", color: "#ff637d", health: 120, speed: 58, damage: 22, radius: 24, reward: 45 };
  }

  function createCampaign() {
    return {
      stageIndex: 0,
      screen: "title",
      message: "Enter the arena and begin the hunt.",
      level: 1,
      xp: 0,
      upgradePoints: 0,
      swordTier: 1,
      armorTier: 1,
      beastTier: 0,
      flashTimer: 0
    };
  }

  function createWorld(campaign) {
    const map = STAGES[campaign.stageIndex];
    const theme = STAGE_THEMES[campaign.stageIndex % STAGE_THEMES.length];
    const world = {
      width: map[0].length,
      height: map.length,
      grid: map.map((row) => row.split("")),
      walls: new Set(["#"]),
      theme,
      player: {
        x: 0,
        y: 0,
        angle: -Math.PI / 2,
        radius: 18,
        health: 100 + (campaign.armorTier - 1) * 20,
        maxHealth: 100 + (campaign.armorTier - 1) * 20,
        swordDamage: 24 + (campaign.swordTier - 1) * 10,
        attackCooldown: 0,
        attackTimer: 0,
        damageTimer: 0,
        spawnGraceTimer: 3
      },
      companion: {
        active: campaign.beastTier > 0,
        x: 0,
        y: 0,
        radius: 14,
        health: 70 + campaign.beastTier * 20,
        maxHealth: 70 + campaign.beastTier * 20,
        damage: 14 + campaign.beastTier * 6,
        speed: 118,
        attackCooldown: 0
      },
      enemies: [],
      altar: null,
      spring: null,
      portal: null,
      portalActive: false,
      embers: Array.from({ length: 34 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: 1 + Math.random() * 3,
        speed: 12 + Math.random() * 26,
        drift: -10 + Math.random() * 20,
        alpha: 0.14 + Math.random() * 0.24
      }))
    };

    for (let row = 0; row < world.height; row += 1) {
      for (let col = 0; col < world.width; col += 1) {
        const cell = world.grid[row][col];
        const x = col * CELL + CELL / 2;
        const y = row * CELL + CELL / 2;
        if (cell === "P") {
          world.player.x = x;
          world.player.y = y;
          world.grid[row][col] = ".";
        } else if (["F", "B", "M"].includes(cell)) {
          const base = enemyTemplate(cell);
          world.enemies.push({ x, y, ...base, baseHealth: base.health, alive: true, hitTimer: 0, attackCooldown: 0 });
          world.grid[row][col] = ".";
        } else if (cell === "A") {
          world.altar = { col, row };
          world.grid[row][col] = ".";
        } else if (cell === "H") {
          world.spring = { x, y, used: false };
          world.grid[row][col] = ".";
        } else if (cell === "X") {
          world.portal = { col, row };
          world.grid[row][col] = ".";
        }
      }
    }

    if (world.companion.active) {
      world.companion.x = world.player.x - 18;
      world.companion.y = world.player.y + 18;
    }
    return world;
  }

  const input = new InputHandler();
  let campaign = createCampaign();
  let world = createWorld(campaign);
  let lastTime = 0;
  let pointerLocked = false;

  function requestPointerLock() {
    if (document.pointerLockElement !== canvas && canvas.requestPointerLock) {
      canvas.requestPointerLock();
    }
  }

  document.addEventListener("pointerlockchange", () => {
    pointerLocked = document.pointerLockElement === canvas;
  });

  document.addEventListener("mousemove", (event) => {
    if (!pointerLocked || campaign.screen !== "playing") return;
    world.player.angle = normalizeAngle(world.player.angle + event.movementX * MOUSE_SENSITIVITY);
  });

  canvas.addEventListener("click", () => {
    if (campaign.screen === "playing") requestPointerLock();
  });

  function rebuildWorld() {
    world = createWorld(campaign);
    campaign.message = "Safe landing zone active. You have 3 seconds to get set.";
  }

  function resetCampaign() {
    if (document.pointerLockElement === canvas && document.exitPointerLock) {
      document.exitPointerLock();
    }
    campaign = createCampaign();
    rebuildWorld();
  }

  function getCell(col, row) {
    if (row < 0 || row >= world.height || col < 0 || col >= world.width) return "#";
    return world.grid[row][col];
  }

  function isWallAt(x, y) {
    return world.walls.has(getCell(Math.floor(x / CELL), Math.floor(y / CELL)));
  }

  function tryMovePlayer(nextX, nextY) {
    const r = world.player.radius;
    if (!isWallAt(nextX - r, world.player.y) && !isWallAt(nextX + r, world.player.y)) world.player.x = nextX;
    if (!isWallAt(world.player.x, nextY - r) && !isWallAt(world.player.x, nextY + r)) world.player.y = nextY;
  }

  function grantXp(amount) {
    campaign.xp += amount;
    while (campaign.xp >= 100) {
      campaign.xp -= 100;
      campaign.level += 1;
      campaign.upgradePoints += 1;
      campaign.message = "Level up. Press U for upgrades.";
    }
  }

  function killEnemy(enemy) {
    enemy.alive = false;
    grantXp(enemy.reward);
    campaign.flashTimer = 0.12;
    campaign.message = enemy.kind + " defeated.";
    if (world.enemies.every((item) => !item.alive)) {
      world.portalActive = true;
      campaign.upgradePoints += 1;
      if (campaign.beastTier === 0) {
        campaign.beastTier = 1;
        rebuildWorld();
        world.companion.active = true;
        campaign.message = "Arena cleared. Rift Beast unlocked on Q.";
      } else {
        campaign.message = "Arena cleared. Portal open and bonus upgrade gained.";
      }
    }
  }

  function attack() {
    for (const enemy of world.enemies) {
      if (!enemy.alive) continue;
      const angleToEnemy = Math.atan2(enemy.y - world.player.y, enemy.x - world.player.x);
      const delta = Math.abs(normalizeAngle(angleToEnemy - world.player.angle));
      const dist = distance(world.player.x, world.player.y, enemy.x, enemy.y);
      if (dist <= 108 && delta <= Math.PI / 4) {
        enemy.health -= world.player.swordDamage;
        enemy.hitTimer = 0.15;
        if (enemy.health <= 0) killEnemy(enemy);
      }
    }
  }

  function toggleUpgrades() {
    campaign.screen = campaign.screen === "upgrades" ? "playing" : "upgrades";
    campaign.message = campaign.screen === "upgrades" ? "Press 1, 2, or 3 to upgrade." : "Back to the arena.";
  }

  function buyUpgrade(slot) {
    if (campaign.upgradePoints <= 0) {
      campaign.message = "No upgrade points available.";
      return;
    }
    campaign.upgradePoints -= 1;
    if (slot === 1) campaign.swordTier += 1;
    if (slot === 2) campaign.armorTier += 1;
    if (slot === 3) campaign.beastTier = Math.max(1, campaign.beastTier + 1);
    rebuildWorld();
    campaign.screen = "playing";
    campaign.message = "Upgrade applied.";
  }

  function interact() {
    const frontX = world.player.x + Math.cos(world.player.angle) * 40;
    const frontY = world.player.y + Math.sin(world.player.angle) * 40;
    const col = Math.floor(frontX / CELL);
    const row = Math.floor(frontY / CELL);
    if (world.altar && col === world.altar.col && row === world.altar.row) {
      toggleUpgrades();
      return;
    }
    if (world.portal && col === world.portal.col && row === world.portal.row) {
      if (!world.portalActive) {
        campaign.message = "Defeat every monster to activate the portal.";
        return;
      }
      if (campaign.stageIndex >= STAGES.length - 1) {
        campaign.screen = "victory";
        campaign.message = "You conquered Beastblade Ascent.";
        return;
      }
      campaign.stageIndex += 1;
      rebuildWorld();
      campaign.message = "A harder hunt begins. Safe landing zone active.";
    }
  }

  function updatePlayer(dt) {
    if (input.isDown("arrowleft")) world.player.angle -= 2.2 * dt;
    if (input.isDown("arrowright")) world.player.angle += 2.2 * dt;
    const forward = (input.isDown("w", "arrowup") ? 1 : 0) - (input.isDown("s", "arrowdown") ? 1 : 0);
    const strafe = (input.isDown("d") ? 1 : 0) - (input.isDown("a") ? 1 : 0);
    if (forward) {
      const speed = forward * 160 * dt;
      tryMovePlayer(world.player.x + Math.cos(world.player.angle) * speed, world.player.y + Math.sin(world.player.angle) * speed);
    }
    if (strafe) {
      const speed = strafe * 140 * dt;
      tryMovePlayer(world.player.x + Math.cos(world.player.angle + Math.PI / 2) * speed, world.player.y + Math.sin(world.player.angle + Math.PI / 2) * speed);
    }
    world.player.angle = normalizeAngle(world.player.angle);
    world.player.attackCooldown = Math.max(0, world.player.attackCooldown - dt);
    world.player.attackTimer = Math.max(0, world.player.attackTimer - dt);
    world.player.damageTimer = Math.max(0, world.player.damageTimer - dt);
    world.player.spawnGraceTimer = Math.max(0, world.player.spawnGraceTimer - dt);
    if (input.wasPressed(" ") && world.player.attackCooldown <= 0) {
      world.player.attackCooldown = 0.42;
      world.player.attackTimer = 0.18;
      attack();
    }
    if (input.wasPressed("q") && campaign.beastTier > 0) {
      world.companion.active = !world.companion.active;
      if (world.companion.active) {
        world.companion.x = world.player.x - 18;
        world.companion.y = world.player.y + 18;
      }
      campaign.message = world.companion.active ? "Rift Beast summoned." : "Rift Beast dismissed.";
    }
    if (input.wasPressed("e")) interact();
  }

  function updateSpring() {
    if (world.spring && !world.spring.used && distance(world.player.x, world.player.y, world.spring.x, world.spring.y) < 28) {
      world.spring.used = true;
      world.player.health = Math.min(world.player.maxHealth, world.player.health + 35);
      campaign.message = "Vitality spring restored your health.";
    }
  }

  function updateCompanion(dt) {
    if (!world.companion.active) return;
    world.companion.attackCooldown = Math.max(0, world.companion.attackCooldown - dt);
    let target = null;
    let nearest = Infinity;
    for (const enemy of world.enemies) {
      if (!enemy.alive) continue;
      const dist = distance(world.companion.x, world.companion.y, enemy.x, enemy.y);
      if (dist < nearest) {
        nearest = dist;
        target = enemy;
      }
    }
    if (!target) {
      world.companion.x += (world.player.x - world.companion.x) * Math.min(1, dt * 3);
      world.companion.y += (world.player.y - world.companion.y) * Math.min(1, dt * 3);
      return;
    }
    const dx = target.x - world.companion.x;
    const dy = target.y - world.companion.y;
    const dist = Math.max(1, Math.hypot(dx, dy));
    if (dist > 24) {
      const step = world.companion.speed * dt;
      const nextX = world.companion.x + (dx / dist) * step;
      const nextY = world.companion.y + (dy / dist) * step;
      if (!isWallAt(nextX, world.companion.y)) world.companion.x = nextX;
      if (!isWallAt(world.companion.x, nextY)) world.companion.y = nextY;
    }
    if (dist < 32 && world.companion.attackCooldown <= 0) {
      target.health -= world.companion.damage;
      target.hitTimer = 0.12;
      world.companion.attackCooldown = 0.7;
      if (target.health <= 0) killEnemy(target);
    }
  }

  function updateEnemies(dt) {
    for (const enemy of world.enemies) {
      if (!enemy.alive) continue;
      enemy.hitTimer = Math.max(0, enemy.hitTimer - dt);
      enemy.attackCooldown = Math.max(0, enemy.attackCooldown - dt);
      if (world.player.spawnGraceTimer > 0) continue;
      const target = world.companion.active &&
        distance(enemy.x, enemy.y, world.companion.x, world.companion.y) < distance(enemy.x, enemy.y, world.player.x, world.player.y) + 10
        ? world.companion
        : world.player;
      const dx = target.x - enemy.x;
      const dy = target.y - enemy.y;
      const dist = Math.hypot(dx, dy);
      if (dist < CELL * 5) {
        const step = enemy.speed * dt;
        const moveX = (dx / Math.max(dist, 1)) * step;
        const moveY = (dy / Math.max(dist, 1)) * step;
        if (!isWallAt(enemy.x + moveX, enemy.y)) enemy.x += moveX;
        if (!isWallAt(enemy.x, enemy.y + moveY)) enemy.y += moveY;
      }
      if (dist < enemy.radius + target.radius && enemy.attackCooldown <= 0) {
        enemy.attackCooldown = 0.95;
        campaign.flashTimer = 0.12;
        if (target === world.player && world.player.damageTimer <= 0) {
          world.player.health = Math.max(0, world.player.health - enemy.damage);
          world.player.damageTimer = 0.55;
          campaign.message = "A " + enemy.kind + " hit you.";
        } else if (target === world.companion) {
          world.companion.health = Math.max(0, world.companion.health - enemy.damage);
          if (world.companion.health <= 0) {
            world.companion.active = false;
            campaign.message = "Your Rift Beast was forced out.";
          }
        }
      }
    }
  }

  function castRay(angle) {
    const sin = Math.sin(angle);
    const cos = Math.cos(angle);
    for (let depth = 1; depth < MAX_DEPTH; depth += 2) {
      const x = world.player.x + cos * depth;
      const y = world.player.y + sin * depth;
      if (world.walls.has(getCell(Math.floor(x / CELL), Math.floor(y / CELL)))) return { depth };
    }
    return { depth: MAX_DEPTH };
  }

  function projectSprite(x, y) {
    const dx = x - world.player.x;
    const dy = y - world.player.y;
    const dist = Math.hypot(dx, dy);
    const angle = normalizeAngle(Math.atan2(dy, dx) - world.player.angle);
    if (Math.abs(angle) > HALF_FOV + 0.35) return null;
    return {
      x: (angle / FOV + 0.5) * canvas.width,
      size: Math.min(320, (CELL * canvas.height) / Math.max(dist, 1)),
      distance: dist
    };
  }

  function updateAtmosphere(dt) {
    for (const ember of world.embers) {
      ember.y += ember.speed * dt;
      ember.x += ember.drift * dt;
      if (ember.y > canvas.height + 12) {
        ember.y = -12;
        ember.x = Math.random() * canvas.width;
      }
      if (ember.x < -12) ember.x = canvas.width + 12;
      if (ember.x > canvas.width + 12) ember.x = -12;
    }
  }

  function drawAtmosphere() {
    ctx.save();
    ctx.fillStyle = world.theme.haze;
    ctx.fillRect(0, canvas.height * 0.18, canvas.width, canvas.height * 0.46);

    for (const ember of world.embers) {
      ctx.fillStyle = `rgba(255, 235, 205, ${ember.alpha})`;
      ctx.beginPath();
      ctx.arc(ember.x, ember.y, ember.size, 0, Math.PI * 2);
      ctx.fill();
    }

    const vignette = ctx.createRadialGradient(
      canvas.width / 2,
      canvas.height / 2,
      canvas.width * 0.15,
      canvas.width / 2,
      canvas.height / 2,
      canvas.width * 0.72
    );
    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(1, "rgba(8,4,6,0.46)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }

  function drawWeapon() {
    const swing = world.player.attackTimer > 0 ? 28 : 0;
    ctx.save();
    ctx.translate(canvas.width * 0.72, canvas.height - 26);
    ctx.rotate(-0.34 - swing * 0.012);

    ctx.fillStyle = "rgba(255, 199, 131, 0.12)";
    ctx.beginPath();
    ctx.arc(-20, -8, 56, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#8f4e21";
    ctx.fillRect(-10, -8, 16, 92);
    ctx.fillStyle = "#ffcf8c";
    ctx.fillRect(-4, -98 - swing * 0.2, 6, 92);
    ctx.fillStyle = "#ffb36b";
    ctx.fillRect(-24, -7, 46, 10);
    ctx.fillStyle = "rgba(255, 243, 224, 0.58)";
    ctx.fillRect(-3, -98 - swing * 0.2, 4, 88);
    ctx.restore();

    ctx.strokeStyle = "rgba(255, 232, 190, 0.65)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2 - 8, canvas.height / 2);
    ctx.lineTo(canvas.width / 2 + 8, canvas.height / 2);
    ctx.moveTo(canvas.width / 2, canvas.height / 2 - 8);
    ctx.lineTo(canvas.width / 2, canvas.height / 2 + 8);
    ctx.stroke();
  }

  function drawCompass() {
    const dir = normalizeAngle(world.player.angle);
    const headings = [
      { label: "N", angle: -Math.PI / 2 },
      { label: "E", angle: 0 },
      { label: "S", angle: Math.PI / 2 },
      { label: "W", angle: Math.PI }
    ];
    ctx.save();
    ctx.fillStyle = "rgba(15, 7, 7, 0.58)";
    ctx.fillRect(canvas.width / 2 - 110, 14, 220, 28);
    ctx.strokeStyle = "rgba(255, 190, 120, 0.16)";
    ctx.strokeRect(canvas.width / 2 - 110, 14, 220, 28);
    ctx.font = "12px Segoe UI";
    ctx.textAlign = "center";
    for (const heading of headings) {
      const delta = normalizeAngle(heading.angle - dir);
      const x = canvas.width / 2 + (delta / HALF_FOV) * 82;
      if (x > canvas.width / 2 - 108 && x < canvas.width / 2 + 108) {
        ctx.fillStyle = heading.label === "N" ? "#fff1d8" : "#ccb5a5";
        ctx.fillText(heading.label, x, 32);
      }
    }
    ctx.restore();
  }

  function drawScene() {
    const sky = ctx.createLinearGradient(0, 0, 0, canvas.height / 2);
    sky.addColorStop(0, world.theme.skyTop);
    sky.addColorStop(1, world.theme.skyBottom);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, canvas.width, canvas.height / 2);
    const floor = ctx.createLinearGradient(0, canvas.height / 2, 0, canvas.height);
    floor.addColorStop(0, world.theme.floorTop);
    floor.addColorStop(1, world.theme.floorBottom);
    ctx.fillStyle = floor;
    ctx.fillRect(0, canvas.height / 2, canvas.width, canvas.height / 2);

    ctx.save();
    ctx.strokeStyle = "rgba(255, 220, 180, 0.05)";
    for (let i = 0; i < 8; i += 1) {
      const y = canvas.height / 2 + i * 26;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
    ctx.restore();

    const depthBuffer = new Array(RAYS);
    const colWidth = canvas.width / RAYS;
    for (let ray = 0; ray < RAYS; ray += 1) {
      const angle = world.player.angle - HALF_FOV + (ray / RAYS) * FOV;
      const hit = castRay(angle);
      const depth = hit.depth * Math.cos(angle - world.player.angle);
      depthBuffer[ray] = depth;
      const height = Math.min(canvas.height * 0.95, (CELL * canvas.height) / Math.max(depth, 1));
      const shade = Math.max(0.18, 1 - depth / (CELL * 10));
      ctx.fillStyle = `rgba(${Math.floor(world.theme.wall[0] * shade)}, ${Math.floor(world.theme.wall[1] * shade)}, ${Math.floor(world.theme.wall[2] * shade)}, 1)`;
      ctx.fillRect(ray * colWidth, canvas.height / 2 - height / 2, colWidth + 1, height);
    }

    const sprites = [];
    for (const enemy of world.enemies) if (enemy.alive) sprites.push({ x: enemy.x, y: enemy.y, color: enemy.hitTimer > 0 ? "#fff1de" : enemy.color, health: enemy.health, maxHealth: enemy.baseHealth });
    if (world.companion.active) sprites.push({ x: world.companion.x, y: world.companion.y, color: "#92fbff", health: world.companion.health, maxHealth: world.companion.maxHealth });
    if (world.spring && !world.spring.used) sprites.push({ x: world.spring.x, y: world.spring.y, color: "#bbfff2" });
    if (world.altar) sprites.push({ x: world.altar.col * CELL + CELL / 2, y: world.altar.row * CELL + CELL / 2, color: "#ffd166" });
    if (world.portal) sprites.push({ x: world.portal.col * CELL + CELL / 2, y: world.portal.row * CELL + CELL / 2, color: world.portalActive ? "#8ea5ff" : "#5f5260" });

    sprites.sort((a, b) => distance(world.player.x, world.player.y, b.x, b.y) - distance(world.player.x, world.player.y, a.x, a.y));
    for (const sprite of sprites) {
      const projection = projectSprite(sprite.x, sprite.y);
      if (!projection) continue;
      const rayIndex = Math.max(0, Math.min(RAYS - 1, Math.floor((projection.x / canvas.width) * RAYS)));
      if (projection.distance > depthBuffer[rayIndex] + 18) continue;
      const width = projection.size * 0.48;
      const height = projection.size * 0.78;
      const drawX = projection.x - width / 2;
      const drawY = canvas.height / 2 + projection.size * 0.18 - height;
      ctx.save();
      ctx.globalAlpha = Math.max(0.36, 1 - projection.distance / (CELL * 13));
      ctx.shadowColor = sprite.color;
      ctx.shadowBlur = sprite.maxHealth ? 14 : 24;
      ctx.fillStyle = sprite.color;
      if (sprite.maxHealth) {
        ctx.beginPath();
        ctx.moveTo(projection.x, drawY);
        ctx.lineTo(drawX + width, drawY + height * 0.35);
        ctx.lineTo(drawX + width * 0.74, drawY + height);
        ctx.lineTo(drawX + width * 0.26, drawY + height);
        ctx.lineTo(drawX, drawY + height * 0.35);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = "rgba(35, 12, 14, 0.42)";
        ctx.fillRect(drawX + width * 0.18, drawY + height * 0.38, width * 0.64, height * 0.18);
      } else if (sprite.color === "#ffd166") {
        ctx.fillRect(drawX + width * 0.2, drawY + height * 0.16, width * 0.6, height * 0.78);
        ctx.fillStyle = "#fff0c8";
        ctx.fillRect(drawX + width * 0.34, drawY, width * 0.32, height * 0.18);
      } else if (sprite.color === "#bbfff2") {
        ctx.beginPath();
        ctx.arc(projection.x, drawY + height * 0.56, width * 0.44, 0, Math.PI * 2);
        ctx.fill();
      } else if (sprite.color === "#8ea5ff" || sprite.color === "#5f5260") {
        ctx.beginPath();
        ctx.ellipse(projection.x, drawY + height * 0.55, width * 0.54, height * 0.52, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(projection.x, drawY + height / 2, width / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      if (sprite.health !== undefined) {
        ctx.fillStyle = "rgba(0,0,0,0.3)";
        ctx.fillRect(drawX, drawY - 10, width, 6);
        ctx.fillStyle = "#ff8f79";
        ctx.fillRect(drawX, drawY - 10, width * Math.max(0, sprite.health / sprite.maxHealth), 6);
      }
      ctx.restore();
    }
  }

  function drawHud() {
    ctx.save();
    const hud = ctx.createLinearGradient(16, 16, 16, 164);
    hud.addColorStop(0, "rgba(24, 10, 10, 0.84)");
    hud.addColorStop(1, "rgba(12, 5, 5, 0.7)");
    ctx.fillStyle = hud;
    ctx.fillRect(16, 16, 348, 146);
    ctx.strokeStyle = "rgba(255, 190, 120, 0.2)";
    ctx.strokeRect(16, 16, 348, 146);
    ctx.fillStyle = "#fff6ec";
    ctx.font = "bold 20px Georgia";
    ctx.fillText("Beastblade Ascent", 28, 42);
    ctx.font = "14px Segoe UI";
    ctx.fillStyle = "#ccb5a5";
    ctx.fillText("Stage " + (campaign.stageIndex + 1) + "  |  Lv." + campaign.level, 28, 62);
    ctx.fillText("Clear monsters, forge upgrades, and enter the portal.", 28, 82, 300);
    ctx.fillStyle = "rgba(255,255,255,0.11)";
    ctx.fillRect(28, 94, 184, 14);
    ctx.fillStyle = "#ff7d72";
    ctx.fillRect(28, 94, 184 * (world.player.health / world.player.maxHealth), 14);
    ctx.strokeStyle = "rgba(255,255,255,0.14)";
    ctx.strokeRect(28, 94, 184, 14);
    ctx.fillStyle = "#fff6ec";
    ctx.fillText("HP " + Math.ceil(world.player.health) + "/" + world.player.maxHealth, 220, 106);
    ctx.fillStyle = "#ffd166";
    ctx.fillText("XP " + campaign.xp + "/100", 28, 128);
    ctx.fillStyle = "#ffb36b";
    ctx.fillText("Upgrades " + campaign.upgradePoints, 120, 128);
    ctx.fillStyle = "#93f8ff";
    ctx.fillText("Beast T" + campaign.beastTier, 250, 128);
    if (world.player.spawnGraceTimer > 0) {
      ctx.fillStyle = "#ffe88d";
      ctx.fillText("Safe " + world.player.spawnGraceTimer.toFixed(1) + "s", 28, 146);
    }
    ctx.restore();

    ctx.fillStyle = "rgba(15, 7, 7, 0.72)";
    ctx.fillRect(16, canvas.height - 52, 520, 34);
    ctx.strokeStyle = "rgba(255, 190, 120, 0.16)";
    ctx.strokeRect(16, canvas.height - 52, 520, 34);
    ctx.font = "14px Segoe UI";
    ctx.fillStyle = "#ffe2bc";
    ctx.fillText(campaign.message, 28, canvas.height - 30);
  }

  function drawOverlay() {
    if (campaign.flashTimer > 0) {
      ctx.fillStyle = "rgba(255, 90, 114, 0.14)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    if (campaign.screen === "playing") return;
    ctx.save();
    ctx.fillStyle = "rgba(7, 3, 3, 0.76)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.textAlign = "center";
    ctx.fillStyle = "#fff6ec";
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    if (campaign.screen === "title") {
      ctx.font = "bold 42px Georgia";
      ctx.fillText("Beastblade Ascent", cx, cy - 56);
      ctx.font = "18px Segoe UI";
      ctx.fillStyle = "#ccb5a5";
      ctx.fillText("Enter to begin. Click to lock the mouse and look around like Minecraft.", cx, cy - 8);
      ctx.fillText("Space attacks, Q summons your beast, and U opens upgrades.", cx, cy + 24);
    } else if (campaign.screen === "paused") {
      ctx.font = "bold 40px Georgia";
      ctx.fillText("Paused", cx, cy - 24);
      ctx.font = "18px Segoe UI";
      ctx.fillStyle = "#ccb5a5";
      ctx.fillText("Press P to return, then click the canvas to relock the mouse.", cx, cy + 16);
    } else if (campaign.screen === "upgrades") {
      ctx.font = "bold 40px Georgia";
      ctx.fillText("Forge Upgrades", cx, cy - 90);
      ctx.font = "20px Segoe UI";
      ctx.fillStyle = "#ccb5a5";
      ctx.fillText("1 Sword  2 Armor  3 Beast", cx, cy - 18);
      ctx.fillText("Press U or E to return.", cx, cy + 18);
    } else if (campaign.screen === "gameover") {
      ctx.font = "bold 40px Georgia";
      ctx.fillText("The Hunt Ends Here", cx, cy - 24);
      ctx.font = "18px Segoe UI";
      ctx.fillStyle = "#ccb5a5";
      ctx.fillText("Press R to restart.", cx, cy + 16);
    } else if (campaign.screen === "victory") {
      ctx.font = "bold 40px Georgia";
      ctx.fillText("Champion Of The Rift Wilds", cx, cy - 24);
      ctx.font = "18px Segoe UI";
      ctx.fillStyle = "#ccb5a5";
      ctx.fillText("Press R to run the hunt again.", cx, cy + 16);
    }
    ctx.restore();
  }

  function render() {
    drawScene();
    drawAtmosphere();
    drawHud();
    drawCompass();
    drawWeapon();
    drawOverlay();
  }

  function update(dt) {
    campaign.flashTimer = Math.max(0, campaign.flashTimer - dt);
    if (input.wasPressed("escape")) {
      returnToMenu();
      return;
    }
    if (input.wasPressed("p")) {
      if (campaign.screen === "playing") {
        campaign.screen = "paused";
        if (document.pointerLockElement === canvas && document.exitPointerLock) {
          document.exitPointerLock();
        }
      } else if (campaign.screen === "paused") {
        campaign.screen = "playing";
      }
    }
    if (campaign.screen === "title") {
      if (input.wasPressed("enter")) {
        campaign.screen = "playing";
        campaign.message = "Click the game to lock your mouse and look around.";
        requestPointerLock();
      }
      return;
    }
    if (campaign.screen === "paused") return;
    if (campaign.screen === "gameover" || campaign.screen === "victory") {
      if (input.wasPressed("r")) resetCampaign();
      return;
    }
    if (input.wasPressed("u")) toggleUpgrades();
    if (campaign.screen === "upgrades") {
      if (input.wasPressed("1")) buyUpgrade(1);
      if (input.wasPressed("2")) buyUpgrade(2);
      if (input.wasPressed("3")) buyUpgrade(3);
      return;
    }
    updatePlayer(dt);
    updateSpring();
    updateCompanion(dt);
    updateEnemies(dt);
    updateAtmosphere(dt);
    if (world.player.health <= 0) {
      campaign.screen = "gameover";
      campaign.message = "Your hunter fell in battle.";
    }
  }

  function loop(timestamp) {
    const dt = Math.min(0.033, ((timestamp - lastTime) / 1000) || 0);
    lastTime = timestamp;
    update(dt);
    render();
    input.endFrame();
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
