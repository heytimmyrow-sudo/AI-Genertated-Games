(() => {
  const canvas = document.getElementById("gameCanvas");
  const scoreValue = document.getElementById("scoreValue");
  const streakValue = document.getElementById("streakValue");
  const timeValue = document.getElementById("timeValue");
  const waveValue = document.getElementById("waveValue");
  const bestValue = document.getElementById("bestValue");
  const startPanel = document.getElementById("startPanel");
  const endPanel = document.getElementById("endPanel");
  const endTitle = document.getElementById("endTitle");
  const endStats = document.getElementById("endStats");
  const startButton = document.getElementById("startButton");
  const againButton = document.getElementById("againButton");
  const resetButton = document.getElementById("resetButton");
  const touchFire = document.getElementById("touchFire");

  const bestKey = "targetRangeFpsBest";
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(72, 1, 0.1, 160);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2(0, 0);
  const clock = new THREE.Clock();

  const player = {
    yaw: 0,
    pitch: 0,
    velocity: new THREE.Vector3(),
    position: new THREE.Vector3(0, 2.1, 22)
  };

  const state = {
    running: false,
    score: 0,
    streak: 0,
    wave: 1,
    timeLeft: 90,
    spawnTimer: 0,
    flashTimer: 0,
    recoilTimer: 0,
    best: Number(localStorage.getItem(bestKey) || 0)
  };

  window.targetRangeFpsStatus = {
    ready: false,
    frames: 0,
    targets: 0,
    running: false
  };

  const keys = new Set();
  const touchMoves = new Set();
  const targets = [];
  const particles = [];
  const tempDirection = new THREE.Vector3();
  const forward = new THREE.Vector3();
  const right = new THREE.Vector3();

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  scene.background = new THREE.Color(0x07101a);
  scene.fog = new THREE.Fog(0x07101a, 28, 92);

  const hemi = new THREE.HemisphereLight(0x9ad8ff, 0x122012, 1.4);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xfff0c2, 1.7);
  sun.position.set(-16, 24, 12);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  scene.add(sun);

  const floorTexture = makeGridTexture();
  floorTexture.wrapS = THREE.RepeatWrapping;
  floorTexture.wrapT = THREE.RepeatWrapping;
  floorTexture.repeat.set(16, 16);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(96, 96),
    new THREE.MeshStandardMaterial({ color: 0x15202b, roughness: 0.82, metalness: 0.08, map: floorTexture })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x18293a, roughness: 0.7, metalness: 0.12 });
  addWall(0, 4, -38, 84, 8, 2);
  addWall(-42, 4, 0, 2, 8, 76);
  addWall(42, 4, 0, 2, 8, 76);

  for (let index = 0; index < 18; index += 1) {
    const pillar = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 5 + Math.random() * 4, 1.2),
      new THREE.MeshStandardMaterial({ color: index % 3 === 0 ? 0x27455c : 0x203342, roughness: 0.62 })
    );
    pillar.position.set(-34 + index * 4, pillar.geometry.parameters.height / 2, -31 - Math.sin(index) * 2);
    pillar.castShadow = true;
    pillar.receiveShadow = true;
    scene.add(pillar);
  }

  const muzzleLight = new THREE.PointLight(0xffd166, 0, 12, 2);
  camera.add(muzzleLight);
  scene.add(camera);

  const targetMaterial = new THREE.MeshStandardMaterial({ color: 0xff4c65, roughness: 0.38, metalness: 0.16 });
  const targetRingMaterial = new THREE.MeshStandardMaterial({ color: 0xffd166, roughness: 0.3, metalness: 0.22 });
  const targetCoreMaterial = new THREE.MeshStandardMaterial({ color: 0x4ff0b1, emissive: 0x1ca675, emissiveIntensity: 0.65 });

  bestValue.textContent = state.best;
  resize();
  resetTargets();
  window.targetRangeFpsStatus.ready = true;
  document.body.dataset.fpsReady = "true";
  animate();

  function addWall(x, y, z, width, height, depth) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), wallMaterial);
    wall.position.set(x, y, z);
    wall.castShadow = true;
    wall.receiveShadow = true;
    scene.add(wall);
  }

  function makeGridTexture() {
    const gridCanvas = document.createElement("canvas");
    gridCanvas.width = 256;
    gridCanvas.height = 256;
    const context = gridCanvas.getContext("2d");
    context.fillStyle = "#162432";
    context.fillRect(0, 0, 256, 256);
    context.strokeStyle = "rgba(67, 213, 255, 0.22)";
    context.lineWidth = 2;
    for (let line = 0; line <= 256; line += 32) {
      context.beginPath();
      context.moveTo(line, 0);
      context.lineTo(line, 256);
      context.moveTo(0, line);
      context.lineTo(256, line);
      context.stroke();
    }
    context.strokeStyle = "rgba(255, 209, 102, 0.2)";
    context.strokeRect(3, 3, 250, 250);
    return new THREE.CanvasTexture(gridCanvas);
  }

  function makeTarget() {
    const group = new THREE.Group();
    const body = new THREE.Mesh(new THREE.SphereGeometry(1.05, 32, 20), targetMaterial.clone());
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.18, 0.08, 12, 40), targetRingMaterial.clone());
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.34, 20, 12), targetCoreMaterial.clone());

    body.castShadow = true;
    ring.castShadow = true;
    core.castShadow = true;
    group.add(body, ring, core);
    group.userData = {
      body,
      ring,
      core,
      health: 1,
      value: 100,
      age: 0,
      phase: Math.random() * Math.PI * 2,
      speed: 0.72 + Math.random() * 0.55,
      lane: Math.random() > 0.5 ? 1 : -1,
      radius: 12 + Math.random() * 22,
      baseY: 2.2 + Math.random() * 5.4
    };
    scene.add(group);
    targets.push(group);
    placeTarget(group, true);
    return group;
  }

  function placeTarget(target, fresh = false) {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.8;
    const distance = target.userData.radius;
    target.position.set(Math.cos(angle) * distance, target.userData.baseY, Math.sin(angle) * distance - 10);
    if (!fresh) {
      target.userData.phase = Math.random() * Math.PI * 2;
      target.userData.speed += 0.04;
    }
  }

  function resetTargets() {
    while (targets.length) {
      const target = targets.pop();
      scene.remove(target);
    }
    const total = 7 + state.wave;
    for (let index = 0; index < total; index += 1) {
      makeTarget();
    }
    window.targetRangeFpsStatus.targets = targets.length;
  }

  function startGame() {
    state.running = true;
    state.score = 0;
    state.streak = 0;
    state.wave = 1;
    state.timeLeft = 90;
    state.spawnTimer = 0;
    state.recoilTimer = 0;
    player.position.set(0, 2.1, 22);
    player.velocity.set(0, 0, 0);
    player.yaw = 0;
    player.pitch = 0;
    startPanel.hidden = true;
    endPanel.hidden = true;
    resetTargets();
    syncHud();
    if (canvas.requestPointerLock && matchMedia("(hover: hover)").matches) {
      canvas.requestPointerLock();
    }
  }

  function endGame() {
    state.running = false;
    document.exitPointerLock?.();
    if (state.score > state.best) {
      state.best = state.score;
      localStorage.setItem(bestKey, String(state.best));
    }
    bestValue.textContent = state.best;
    endTitle.textContent = state.score >= 5000 ? "Sharp shooting" : "Run complete";
    endStats.textContent = `Score ${state.score} | Streak ${state.streak} | Wave ${state.wave}`;
    endPanel.hidden = false;
  }

  function syncHud() {
    scoreValue.textContent = state.score;
    streakValue.textContent = state.streak;
    timeValue.textContent = Math.max(0, Math.ceil(state.timeLeft));
    waveValue.textContent = state.wave;
    window.targetRangeFpsStatus.targets = targets.length;
    window.targetRangeFpsStatus.running = state.running;
    document.body.dataset.fpsTargets = String(targets.length);
    document.body.dataset.fpsRunning = String(state.running);
  }

  function updateCamera() {
    camera.rotation.order = "YXZ";
    camera.rotation.y = player.yaw;
    camera.rotation.x = player.pitch;
    camera.position.copy(player.position);
    if (state.recoilTimer > 0) {
      camera.rotation.x -= state.recoilTimer * 0.018;
    }
  }

  function updateMovement(delta) {
    const movingForward = keys.has("KeyW") || keys.has("ArrowUp") || touchMoves.has("forward");
    const movingBack = keys.has("KeyS") || keys.has("ArrowDown") || touchMoves.has("backward");
    const movingLeft = keys.has("KeyA") || keys.has("ArrowLeft") || touchMoves.has("left");
    const movingRight = keys.has("KeyD") || keys.has("ArrowRight") || touchMoves.has("right");

    forward.set(Math.sin(player.yaw), 0, Math.cos(player.yaw) * -1).normalize();
    right.set(Math.cos(player.yaw), 0, Math.sin(player.yaw)).normalize();
    tempDirection.set(0, 0, 0);
    if (movingForward) tempDirection.add(forward);
    if (movingBack) tempDirection.sub(forward);
    if (movingRight) tempDirection.add(right);
    if (movingLeft) tempDirection.sub(right);
    if (tempDirection.lengthSq() > 0) tempDirection.normalize();

    const speed = keys.has("ShiftLeft") || keys.has("ShiftRight") ? 15 : 10.5;
    player.velocity.lerp(tempDirection.multiplyScalar(speed), 1 - Math.pow(0.02, delta));
    player.position.addScaledVector(player.velocity, delta);
    player.position.x = THREE.MathUtils.clamp(player.position.x, -34, 34);
    player.position.z = THREE.MathUtils.clamp(player.position.z, -31, 28);
  }

  function updateTargets(delta) {
    targets.forEach((target, index) => {
      const data = target.userData;
      data.age += delta;
      target.position.x += Math.sin(data.age * data.speed + data.phase) * delta * 7.5 * data.lane;
      target.position.y = data.baseY + Math.sin(data.age * 2.1 + data.phase) * 1.2;
      target.position.z += Math.cos(data.age * data.speed * 0.8 + index) * delta * 2.4;
      target.rotation.y += delta * (1.2 + state.wave * 0.1);
      target.rotation.z = Math.sin(data.age * 2 + data.phase) * 0.22;
      data.ring.rotation.z += delta * 2.5;
      data.core.scale.setScalar(1 + Math.sin(data.age * 8) * 0.12);

      if (Math.abs(target.position.x) > 38 || target.position.z > 26 || target.position.z < -36) {
        placeTarget(target);
      }
    });
  }

  function spawnParticles(position, color) {
    for (let index = 0; index < 10; index += 1) {
      const particle = new THREE.Mesh(
        new THREE.BoxGeometry(0.16, 0.16, 0.16),
        new THREE.MeshBasicMaterial({ color })
      );
      particle.position.copy(position);
      particle.userData.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 9,
        Math.random() * 7,
        (Math.random() - 0.5) * 9
      );
      particle.userData.life = 0.48 + Math.random() * 0.28;
      scene.add(particle);
      particles.push(particle);
    }
  }

  function updateParticles(delta) {
    for (let index = particles.length - 1; index >= 0; index -= 1) {
      const particle = particles[index];
      particle.userData.life -= delta;
      particle.userData.velocity.y -= delta * 12;
      particle.position.addScaledVector(particle.userData.velocity, delta);
      particle.rotation.x += delta * 10;
      particle.rotation.y += delta * 8;
      particle.material.opacity = Math.max(0, particle.userData.life);
      if (particle.userData.life <= 0) {
        scene.remove(particle);
        particles.splice(index, 1);
      }
    }
  }

  function shoot() {
    if (!state.running) return;
    state.recoilTimer = 1;
    state.flashTimer = 0.07;
    muzzleLight.intensity = 9;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(targets, true);
    if (hits.length) {
      const hitGroup = getTargetGroup(hits[0].object);
      if (hitGroup) {
        const closeBonus = Math.max(0, Math.floor((32 - camera.position.distanceTo(hitGroup.position)) * 2));
        const streakBonus = Math.min(400, state.streak * 20);
        const points = hitGroup.userData.value + closeBonus + streakBonus;
        state.score += points;
        state.streak += 1;
        spawnParticles(hits[0].point, hitGroup.userData.core.material.color);
        placeTarget(hitGroup);
        if (state.streak % 8 === 0) {
          state.wave += 1;
          makeTarget();
        }
      }
    } else {
      state.streak = 0;
    }
    syncHud();
  }

  function getTargetGroup(object) {
    let current = object;
    while (current && current.parent) {
      if (targets.includes(current)) return current;
      current = current.parent;
    }
    return null;
  }

  function animate() {
    requestAnimationFrame(animate);
    const delta = Math.min(clock.getDelta(), 0.04);
    window.targetRangeFpsStatus.frames += 1;
    document.body.dataset.fpsFrames = String(window.targetRangeFpsStatus.frames);

    if (state.running) {
      state.timeLeft -= delta;
      if (state.timeLeft <= 0) {
        state.timeLeft = 0;
        endGame();
      }
      state.spawnTimer += delta;
      if (state.spawnTimer > 12 && targets.length < 18) {
        state.spawnTimer = 0;
        state.wave += 1;
        makeTarget();
      }
      updateMovement(delta);
      updateTargets(delta);
      syncHud();
    } else {
      updateTargets(delta * 0.45);
    }

    state.recoilTimer = Math.max(0, state.recoilTimer - delta * 8);
    state.flashTimer = Math.max(0, state.flashTimer - delta);
    muzzleLight.intensity = state.flashTimer > 0 ? 9 : 0;
    updateParticles(delta);
    updateCamera();
    renderer.render(scene, camera);
  }

  function resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  window.addEventListener("resize", resize);
  window.addEventListener("keydown", (event) => {
    keys.add(event.code);
    if (event.code === "Space") {
      event.preventDefault();
      shoot();
    }
    if (event.code === "Escape" && state.running) {
      endGame();
    }
  });
  window.addEventListener("keyup", (event) => keys.delete(event.code));
  window.addEventListener("mousemove", (event) => {
    if (!state.running) return;
    if (document.pointerLockElement !== canvas && matchMedia("(hover: hover)").matches) return;
    player.yaw -= event.movementX * 0.0022;
    player.pitch -= event.movementY * 0.0022;
    player.pitch = THREE.MathUtils.clamp(player.pitch, -1.18, 1.1);
  });
  window.addEventListener("pointerdown", (event) => {
    if (event.target.closest("button")) return;
    if (!state.running) return;
    if (canvas.requestPointerLock && matchMedia("(hover: hover)").matches && document.pointerLockElement !== canvas) {
      canvas.requestPointerLock();
    }
    shoot();
  });

  document.querySelectorAll("[data-move]").forEach((button) => {
    const move = button.dataset.move;
    const start = (event) => {
      event.preventDefault();
      touchMoves.add(move);
    };
    const stop = (event) => {
      event.preventDefault();
      touchMoves.delete(move);
    };
    button.addEventListener("pointerdown", start);
    button.addEventListener("pointerup", stop);
    button.addEventListener("pointercancel", stop);
    button.addEventListener("pointerleave", stop);
  });

  let lastTouchX = null;
  let lastTouchY = null;
  canvas.addEventListener("touchstart", (event) => {
    if (!state.running || !event.touches.length) return;
    lastTouchX = event.touches[0].clientX;
    lastTouchY = event.touches[0].clientY;
  }, { passive: true });
  canvas.addEventListener("touchmove", (event) => {
    if (!state.running || !event.touches.length || lastTouchX === null) return;
    const touch = event.touches[0];
    player.yaw -= (touch.clientX - lastTouchX) * 0.006;
    player.pitch -= (touch.clientY - lastTouchY) * 0.006;
    player.pitch = THREE.MathUtils.clamp(player.pitch, -1.18, 1.1);
    lastTouchX = touch.clientX;
    lastTouchY = touch.clientY;
  }, { passive: true });

  startButton.addEventListener("click", startGame);
  againButton.addEventListener("click", startGame);
  touchFire.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    shoot();
  });
  resetButton.addEventListener("click", () => {
    state.best = 0;
    localStorage.removeItem(bestKey);
    bestValue.textContent = "0";
  });
})();
