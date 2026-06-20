import { SETTINGS } from "../config/settings.js";

const { THREE } = window;

export class PlayerController {
  constructor(scene, world) {
    this.world = world;
    this.terrain = world.terrain;
    this.group = new THREE.Group();
    this.velocity = new THREE.Vector3();
    this.moveDirection = new THREE.Vector3();
    this.onGround = false;
    this.stats = {
      staminaMax: SETTINGS.player.stamina,
      stamina: SETTINGS.player.stamina,
      healthMax: 100,
      health: 100,
      defense: 0,
      environmentalResistance: 0,
      recoveryMultiplier: 1,
      discoveryRewardMultiplier: 1,
      reputationRewardMultiplier: 1,
      staminaRecoveryMultiplier: 1,
    };
    this.rpgModifiers = {
      staminaMaxBonus: 0,
      healthMaxBonus: 0,
      movementSpeedMultiplier: 1,
      staminaRecoveryMultiplier: 1,
    };
    this.mounted = false;
    this.mountSpeedMultiplier = 1;
    this.visualTime = 0;
    this.lastGroundY = this.terrain.getHeightAt(0, 0);
    this.groundContactGrace = 0;
    this.heatWarningCooldown = 0;
    this.damageCooldown = 0;
    this.defeated = false;
    this.visualGroundOffset = -SETTINGS.player.height / 2;

    this.body = this.createBody();
    this.body.position.y = this.visualGroundOffset;
    this.group.add(this.body);
    this.group.position.set(0, this.terrain.getHeightAt(0, 0) + SETTINGS.player.height / 2, 0);
    scene.add(this.group);
  }

  createBody() {
    const body = new THREE.Group();
    const cloakMaterial = new THREE.MeshStandardMaterial({ color: 0x263f36, roughness: 0.82, metalness: 0.02 });
    const cloakDarkMaterial = new THREE.MeshStandardMaterial({ color: 0x172922, roughness: 0.9, metalness: 0.01 });
    const leatherMaterial = new THREE.MeshStandardMaterial({ color: 0x7b4e2f, roughness: 0.82 });
    const trimMaterial = new THREE.MeshStandardMaterial({ color: 0xe6b75d, roughness: 0.5, metalness: 0.22, emissive: 0x2a1700, emissiveIntensity: 0.08 });
    const clothMaterial = new THREE.MeshStandardMaterial({ color: 0x6f8d63, roughness: 0.88 });
    const shadowFaceMaterial = new THREE.MeshStandardMaterial({ color: 0x11120e, roughness: 0.94 });

    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.3, 0.86, 7, 14), cloakMaterial);
    torso.position.y = 0.96;
    torso.scale.set(0.86, 1.08, 0.72);
    torso.castShadow = true;
    body.add(torso);

    const cloakSkirt = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.54, 7), cloakDarkMaterial);
    cloakSkirt.position.y = 0.7;
    cloakSkirt.scale.set(0.82, 1, 0.66);
    cloakSkirt.castShadow = true;
    body.add(cloakSkirt);

    const shoulderCape = new THREE.Mesh(new THREE.ConeGeometry(0.48, 0.38, 7), cloakMaterial);
    shoulderCape.position.y = 1.16;
    shoulderCape.scale.set(1, 0.62, 0.7);
    shoulderCape.rotation.y = Math.PI / 7;
    shoulderCape.castShadow = true;
    body.add(shoulderCape);

    const backCape = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.9, 7), cloakDarkMaterial);
    backCape.position.set(0, 0.88, -0.18);
    backCape.scale.set(0.9, 1, 0.48);
    backCape.rotation.x = -0.18;
    backCape.castShadow = true;
    body.add(backCape);

    const hood = new THREE.Mesh(new THREE.SphereGeometry(0.33, 20, 14), cloakMaterial);
    hood.position.y = 1.54;
    hood.scale.set(1, 0.88, 0.88);
    hood.castShadow = true;
    body.add(hood);

    const hoodPeak = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.38, 5), cloakDarkMaterial);
    hoodPeak.position.set(0, 1.58, 0.09);
    hoodPeak.rotation.x = Math.PI / 2;
    hoodPeak.scale.set(0.9, 0.72, 1);
    hoodPeak.castShadow = true;
    body.add(hoodPeak);

    const faceShadow = new THREE.Mesh(new THREE.SphereGeometry(0.2, 14, 8), shadowFaceMaterial);
    faceShadow.position.set(0, 1.49, 0.25);
    faceShadow.scale.set(1, 0.62, 0.34);
    body.add(faceShadow);

    const scarf = new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.035, 8, 26), clothMaterial);
    scarf.position.set(0, 1.26, 0.02);
    scarf.rotation.x = Math.PI / 2;
    scarf.scale.set(1, 0.72, 1);
    scarf.castShadow = true;
    body.add(scarf);

    const belt = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.028, 8, 28), leatherMaterial);
    belt.position.y = 0.82;
    belt.rotation.x = Math.PI / 2;
    body.add(belt);

    const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.035), trimMaterial);
    buckle.position.set(0, 0.82, 0.31);
    buckle.castShadow = true;
    body.add(buckle);

    const echoBand = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.011, 8, 32), trimMaterial);
    echoBand.position.set(0, 1.55, 0.015);
    echoBand.rotation.x = Math.PI / 2;
    body.add(echoBand);

    const limbs = [];
    for (const side of [-1, 1]) {
      const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 8), leatherMaterial);
      shoulder.position.set(side * 0.33, 1.2, 0.02);
      shoulder.scale.set(1.15, 0.72, 0.84);
      shoulder.castShadow = true;
      body.add(shoulder);

      const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.48, 5, 8), leatherMaterial);
      arm.position.set(side * 0.42, 0.92, 0.02);
      arm.rotation.z = side * 0.18;
      arm.castShadow = true;
      body.add(arm);
      limbs.push({ mesh: arm, side, baseZ: side * 0.18, type: "arm" });

      const bracer = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.065, 0.16, 8), trimMaterial);
      bracer.position.set(side * 0.46, 0.7, 0.035);
      bracer.rotation.z = side * 0.18;
      bracer.castShadow = true;
      body.add(bracer);

      const upperLeg = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.34, 5, 9), clothMaterial);
      upperLeg.position.set(side * 0.135, 0.45, 0.035);
      upperLeg.rotation.z = side * -0.035;
      upperLeg.scale.set(0.95, 1, 0.82);
      upperLeg.castShadow = true;
      body.add(upperLeg);
      limbs.push({ mesh: upperLeg, side, baseZ: side * -0.035, type: "upperLeg" });

      const lowerLeg = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.34, 5, 9), leatherMaterial);
      lowerLeg.position.set(side * 0.17, 0.2, 0.055);
      lowerLeg.rotation.z = side * -0.06;
      lowerLeg.scale.set(0.9, 1, 0.78);
      lowerLeg.castShadow = true;
      body.add(lowerLeg);
      limbs.push({ mesh: lowerLeg, side, baseZ: side * -0.06, type: "lowerLeg" });

      const foot = new THREE.Mesh(new THREE.CapsuleGeometry(0.045, 0.18, 5, 8), leatherMaterial);
      foot.position.set(side * 0.17, 0.045, 0.14);
      foot.rotation.set(Math.PI / 2, 0, side * 0.035);
      foot.scale.set(0.82, 1, 0.72);
      foot.castShadow = true;
      body.add(foot);
      limbs.push({ mesh: foot, side, baseZ: side * 0.035, type: "foot" });
    }

    const quiver = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 0.62, 8), leatherMaterial);
    quiver.position.set(-0.24, 1.02, -0.32);
    quiver.rotation.set(-0.42, 0.22, -0.18);
    quiver.castShadow = true;
    body.add(quiver);

    for (let index = 0; index < 4; index += 1) {
      const arrow = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.58, 5), trimMaterial);
      arrow.position.set(-0.29 + index * 0.035, 1.34, -0.42);
      arrow.rotation.set(-0.52, 0.18, -0.12);
      body.add(arrow);
    }

    const stanceMarker = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.24, 4), trimMaterial);
    stanceMarker.position.set(0.18, 1.38, 0.14);
    stanceMarker.rotation.set(Math.PI / 2, 0, Math.PI / 4);
    stanceMarker.castShadow = true;
    body.add(stanceMarker);

    body.userData = { limbs, torso, shoulderCape, backCape };
    return body;
  }

  update(deltaSeconds, input, cameraRig) {
    this.body.visible = cameraRig.mode !== "first";
    this.visualTime += deltaSeconds;
    this.damageCooldown = Math.max(0, this.damageCooldown - deltaSeconds);
    if (this.defeated) {
      this.velocity.multiplyScalar(0.9);
      this.animateBody(deltaSeconds, input);
      return;
    }
    this.readMovementInput(input, cameraRig);
    this.applyHeatEffects(deltaSeconds);
    this.applyHorizontalMotion(deltaSeconds, input.isDown("ShiftLeft") || input.isDown("ShiftRight"));
    this.applyVerticalMotion(deltaSeconds, input);
    this.integrate(deltaSeconds);
    this.animateBody(deltaSeconds, input);
    this.alignBody(cameraRig);
  }

  readMovementInput(input, cameraRig) {
    const forward = cameraRig.getPlanarForward();
    const side = cameraRig.getPlanarSide();
    this.moveDirection.set(0, 0, 0);

    if (input.isDown("KeyW")) this.moveDirection.add(forward);
    if (input.isDown("KeyS")) this.moveDirection.sub(forward);
    if (input.isDown("KeyD")) this.moveDirection.add(side);
    if (input.isDown("KeyA")) this.moveDirection.sub(side);

    if (this.moveDirection.lengthSq() > 0) {
      this.moveDirection.normalize();
    }
  }

  applyHorizontalMotion(deltaSeconds, sprinting) {
    const bogMultiplier = this.world.getBogSlowMultiplierAt?.(this.group.position) ?? 1;
    const heatMultiplier = this.world.getHeatMovementMultiplierAt?.(this.group.position, this.stats.environmentalResistance ?? 0) ?? 1;
    const speed = this.getMoveSpeed(sprinting) * bogMultiplier * heatMultiplier;
    const targetX = this.moveDirection.x * speed;
    const targetZ = this.moveDirection.z * speed;
    const acceleration = this.onGround ? SETTINGS.player.acceleration : SETTINGS.player.airAcceleration;
    const blend = 1 - Math.exp(-acceleration * deltaSeconds);

    this.velocity.x = THREE.MathUtils.lerp(this.velocity.x, targetX, blend);
    this.velocity.z = THREE.MathUtils.lerp(this.velocity.z, targetZ, blend);

    if (this.moveDirection.lengthSq() === 0 && this.onGround) {
      const damping = 1 - Math.exp(-SETTINGS.player.damping * deltaSeconds);
      this.velocity.x = THREE.MathUtils.lerp(this.velocity.x, 0, damping);
      this.velocity.z = THREE.MathUtils.lerp(this.velocity.z, 0, damping);
    }
  }

  applyVerticalMotion(deltaSeconds, input) {
    if (input.wasPressed("Space") && this.onGround && !this.mounted) {
      this.velocity.y = SETTINGS.player.jumpVelocity;
      this.onGround = false;
    }

    this.velocity.y -= SETTINGS.player.gravity * deltaSeconds;
  }

  integrate(deltaSeconds) {
    this.group.position.addScaledVector(this.velocity, deltaSeconds);
    this.resolveWorldCollisions();

    const halfHeight = SETTINGS.player.height / 2;
    const groundSurfaceY = this.getWalkableGroundHeight(this.group.position.x, this.group.position.z);
    const groundY = groundSurfaceY + halfHeight;
    const distanceToGround = this.group.position.y - groundY;
    const movingHorizontally = Math.hypot(this.velocity.x, this.velocity.z) > 0.08;
    const walkingOnGround = this.onGround && this.velocity.y <= 0.35;
    const snapDistance = movingHorizontally ? Math.max(SETTINGS.player.groundSnap, 0.56) : SETTINGS.player.groundSnap;
    const closeEnoughToSnap = distanceToGround <= snapDistance && this.velocity.y <= 0;
    const walkableStep = Math.abs(groundSurfaceY - this.lastGroundY) <= SETTINGS.player.maxGroundStep;
    const fallingIntoGround = this.group.position.y < groundY;
    const shouldStickToSlope = walkingOnGround && walkableStep && distanceToGround < 0.72;

    if (shouldStickToSlope || closeEnoughToSnap || fallingIntoGround) {
      const snapImmediately = fallingIntoGround || Math.abs(distanceToGround) > 0.28;
      this.group.position.y = !snapImmediately
        ? THREE.MathUtils.lerp(this.group.position.y, groundY, 1 - Math.exp(-SETTINGS.player.groundFollow * deltaSeconds))
        : groundY;
      this.velocity.y = 0;
      this.onGround = true;
      this.groundContactGrace = 0.12;
      this.lastGroundY = groundSurfaceY;
    } else {
      this.groundContactGrace = Math.max(0, this.groundContactGrace - deltaSeconds);
      this.onGround = this.groundContactGrace > 0 && this.velocity.y <= 0;
    }
  }

  getWalkableGroundHeight(x, z) {
    const terrainY = this.sampleTerrainHeight(x, z);
    const platformY = this.world.getPlatformHeightAt?.(x, z) ?? -Infinity;
    return Math.max(terrainY, platformY);
  }

  sampleTerrainHeight(x, z) {
    const radius = SETTINGS.player.radius * 0.72;
    const center = this.terrain.getHeightAt(x, z);
    const front = this.terrain.getHeightAt(x, z + radius);
    const back = this.terrain.getHeightAt(x, z - radius);
    const left = this.terrain.getHeightAt(x - radius, z);
    const right = this.terrain.getHeightAt(x + radius, z);
    const average = (center * 2 + front + back + left + right) / 6;
    const highest = Math.max(center, front, back, left, right);
    return THREE.MathUtils.lerp(average, highest, 0.28);
  }

  resolveWorldCollisions() {
    const volumes = this.world.collisionVolumes ?? [];
    if (!volumes.length) {
      return;
    }

    const position = this.group.position;
    const radius = SETTINGS.player.radius;
    const halfHeight = SETTINGS.player.height / 2;
    const feetY = position.y - halfHeight + 0.08;
    const headY = position.y + halfHeight - 0.1;

    volumes.forEach((volume) => {
      if (headY < volume.minY || feetY > volume.maxY) {
        return;
      }

      if (volume.type === "cylinder") {
        const dx = position.x - volume.x;
        const dz = position.z - volume.z;
        const distance = Math.hypot(dx, dz);
        const minimum = radius + volume.radius;
        if (distance > 0.0001 && distance < minimum) {
          const push = minimum - distance;
          position.x += (dx / distance) * push;
          position.z += (dz / distance) * push;
          this.dampenVelocity(dx / distance, dz / distance);
        }
        return;
      }

      if (volume.type === "box") {
        const cos = Math.cos(-volume.yaw);
        const sin = Math.sin(-volume.yaw);
        const dx = position.x - volume.x;
        const dz = position.z - volume.z;
        const localX = dx * cos - dz * sin;
        const localZ = dx * sin + dz * cos;
        const halfWidth = volume.width / 2 + radius;
        const halfDepth = volume.depth / 2 + radius;

        if (Math.abs(localX) >= halfWidth || Math.abs(localZ) >= halfDepth) {
          return;
        }

        const pushX = halfWidth - Math.abs(localX);
        const pushZ = halfDepth - Math.abs(localZ);
        let pushLocalX = 0;
        let pushLocalZ = 0;
        if (pushX < pushZ) {
          pushLocalX = Math.sign(localX || 1) * pushX;
        } else {
          pushLocalZ = Math.sign(localZ || 1) * pushZ;
        }

        const worldPushX = pushLocalX * Math.cos(volume.yaw) - pushLocalZ * Math.sin(volume.yaw);
        const worldPushZ = pushLocalX * Math.sin(volume.yaw) + pushLocalZ * Math.cos(volume.yaw);
        position.x += worldPushX;
        position.z += worldPushZ;
        const length = Math.hypot(worldPushX, worldPushZ);
        if (length > 0.0001) {
          this.dampenVelocity(worldPushX / length, worldPushZ / length);
        }
      }
    });
  }

  dampenVelocity(normalX, normalZ) {
    const towardWall = this.velocity.x * normalX + this.velocity.z * normalZ;
    if (towardWall < 0) {
      this.velocity.x -= normalX * towardWall;
      this.velocity.z -= normalZ * towardWall;
    }
  }

  alignBody(cameraRig) {
    const moving = this.moveDirection.lengthSq() > 0.001;
    const desiredYaw = moving ? Math.atan2(this.moveDirection.x, this.moveDirection.z) : cameraRig.yaw;
    const currentYaw = this.group.rotation.y;
    this.group.rotation.y = THREE.MathUtils.lerp(currentYaw, desiredYaw, moving ? 0.18 : 0.08);
  }

  animateBody(deltaSeconds, input) {
    const horizontalSpeed = Math.hypot(this.velocity.x, this.velocity.z);
    const moving = horizontalSpeed > 0.2;
    const sprinting = moving && (input.isDown("ShiftLeft") || input.isDown("ShiftRight"));
    const gait = this.visualTime * (sprinting ? 13 : 8.5);
    const bob = moving ? Math.sin(gait) * (sprinting ? 0.035 : 0.022) : Math.sin(this.visualTime * 2.2) * 0.008;
    const sway = moving ? Math.sin(gait * 0.5) * 0.035 : Math.sin(this.visualTime * 1.6) * 0.012;

    this.body.position.y = THREE.MathUtils.lerp(this.body.position.y, this.visualGroundOffset + bob, 1 - Math.exp(-10 * deltaSeconds));
    this.body.rotation.z = THREE.MathUtils.lerp(this.body.rotation.z, sway, 1 - Math.exp(-8 * deltaSeconds));

    const { limbs = [], torso, shoulderCape, backCape } = this.body.userData;
    limbs.forEach(({ mesh, side, baseZ, type }) => {
      const stride = moving ? Math.sin(gait + (side > 0 ? Math.PI : 0)) : 0;
      if (type === "upperLeg") {
        mesh.rotation.x = THREE.MathUtils.lerp(mesh.rotation.x, stride * 0.34, 1 - Math.exp(-12 * deltaSeconds));
        mesh.rotation.z = THREE.MathUtils.lerp(mesh.rotation.z, baseZ + stride * 0.08, 1 - Math.exp(-12 * deltaSeconds));
        return;
      }
      if (type === "lowerLeg") {
        mesh.rotation.x = THREE.MathUtils.lerp(mesh.rotation.x, -stride * 0.18 + Math.max(0, -stride) * 0.14, 1 - Math.exp(-12 * deltaSeconds));
        mesh.rotation.z = THREE.MathUtils.lerp(mesh.rotation.z, baseZ + stride * 0.06, 1 - Math.exp(-12 * deltaSeconds));
        return;
      }
      if (type === "foot") {
        mesh.rotation.x = THREE.MathUtils.lerp(mesh.rotation.x, Math.PI / 2 + (moving ? Math.max(0, stride) * 0.12 : 0), 1 - Math.exp(-12 * deltaSeconds));
        mesh.rotation.z = THREE.MathUtils.lerp(mesh.rotation.z, baseZ, 1 - Math.exp(-12 * deltaSeconds));
        return;
      }

      const target = baseZ + stride * 0.18;
      mesh.rotation.z = THREE.MathUtils.lerp(mesh.rotation.z, target, 1 - Math.exp(-12 * deltaSeconds));
    });

    if (torso) {
      torso.rotation.x = THREE.MathUtils.lerp(torso.rotation.x, moving ? -0.04 : 0.02, 1 - Math.exp(-6 * deltaSeconds));
    }
    if (shoulderCape) {
      shoulderCape.rotation.z = Math.sin(this.visualTime * 2.8) * 0.018;
    }
    if (backCape) {
      backCape.rotation.x = -0.18 - Math.min(horizontalSpeed / this.getMoveSpeed(true), 1) * 0.18;
    }
  }

  getEyePosition(height) {
    return new THREE.Vector3(this.group.position.x, this.group.position.y - SETTINGS.player.height / 2 + height, this.group.position.z);
  }

  getFeetPosition() {
    return new THREE.Vector3(
      this.group.position.x,
      this.group.position.y - SETTINGS.player.height / 2,
      this.group.position.z,
    );
  }

  takeDamage(amount, sourcePosition = null, options = {}) {
    if (this.defeated || this.damageCooldown > 0) {
      return false;
    }

    const defenseMultiplier = 1 - Math.min(0.68, Math.max(0, this.stats.defense ?? 0));
    const finalDamage = Math.max(1, amount * defenseMultiplier);
    this.stats.health = Math.max(0, (this.stats.health ?? this.stats.healthMax) - finalDamage);
    this.damageCooldown = options.cooldown ?? SETTINGS.enemies.playerDamageCooldown ?? 0.85;

    if (sourcePosition) {
      const knockback = this.group.position.clone().sub(sourcePosition);
      knockback.y = 0;
      if (knockback.lengthSq() > 0.001) {
        knockback.normalize();
        const force = options.hitKind === "charge" ? 3.4 : options.hitKind === "area" ? 2.2 : 1.45;
        this.velocity.x += knockback.x * force;
        this.velocity.z += knockback.z * force;
      }
    }

    window.dispatchEvent(new CustomEvent("echo-archer:combat-text", {
      detail: {
        text: `-${Math.round(finalDamage)} HP`,
        kind: options.hitKind === "charge" || options.hitKind === "area" ? "damage strong" : "damage",
        x: window.innerWidth * 0.5,
        y: window.innerHeight * 0.58,
      },
    }));
    window.dispatchEvent(new CustomEvent("echo-archer:sound", {
      detail: { name: "enemyHit", intensity: options.hitKind === "charge" ? 0.78 : 0.55 },
    }));

    if (this.stats.health <= 0) {
      this.defeated = true;
      this.stats.health = 0;
      this.velocity.set(0, 0, 0);
      window.dispatchEvent(new CustomEvent("echo-archer:combat-text", {
        detail: {
          text: "You were overwhelmed",
          kind: "damage strong",
          x: window.innerWidth * 0.5,
          y: window.innerHeight * 0.5,
        },
      }));
    }

    return true;
  }

  heal(amount) {
    this.stats.health = Math.min(this.stats.healthMax, (this.stats.health ?? this.stats.healthMax) + amount);
    if (this.stats.health > 0) {
      this.defeated = false;
    }
  }

  getMoveSpeed(sprinting) {
    const base = sprinting ? SETTINGS.player.sprintSpeed : SETTINGS.player.walkSpeed;
    return base * (this.rpgModifiers.movementSpeedMultiplier ?? 1) * (this.mounted ? this.mountSpeedMultiplier : 1);
  }

  applyHeatEffects(deltaSeconds) {
    this.heatWarningCooldown = Math.max(0, this.heatWarningCooldown - deltaSeconds);
    const heat = this.world.getHeatAt?.(this.group.position);
    if (!heat?.zone || heat.intensity < 0.22) {
      return;
    }
    const mitigated = Math.max(0, heat.intensity - (this.stats.environmentalResistance ?? 0) * 0.65);
    if (mitigated < 0.18 || this.heatWarningCooldown > 0) {
      return;
    }
    this.heatWarningCooldown = 3.5;
    window.dispatchEvent(new CustomEvent("echo-archer:combat-text", {
      detail: {
        text: mitigated > 0.55 ? "EXTREME HEAT" : "Heat rising",
        kind: mitigated > 0.55 ? "damage strong" : "damage",
        x: window.innerWidth * 0.5,
        y: window.innerHeight * 0.68,
      },
    }));
  }

  setRpgModifiers(modifiers = {}) {
    this.rpgModifiers = { ...this.rpgModifiers, ...modifiers };
    const previousMaxHealth = this.stats.healthMax || 100;
    const previousHealthRatio = THREE.MathUtils.clamp((this.stats.health ?? previousMaxHealth) / previousMaxHealth, 0, 1);
    this.stats.staminaMax = SETTINGS.player.stamina + (modifiers.staminaMaxBonus ?? 0);
    this.stats.healthMax = 100 + (modifiers.healthMaxBonus ?? 0);
    this.stats.health = Math.max(1, Math.min(this.stats.healthMax, this.stats.healthMax * previousHealthRatio));
    this.stats.defense = modifiers.defense ?? 0;
    this.stats.environmentalResistance = modifiers.environmentalResistance ?? 0;
    this.stats.recoveryMultiplier = modifiers.recoveryMultiplier ?? 1;
    this.stats.discoveryRewardMultiplier = modifiers.discoveryRewardMultiplier ?? 1;
    this.stats.reputationRewardMultiplier = modifiers.reputationRewardMultiplier ?? 1;
    this.stats.staminaRecoveryMultiplier = modifiers.staminaRecoveryMultiplier ?? this.stats.staminaRecoveryMultiplier ?? 1;
  }

  setMounted(mounted, speedMultiplier = 1) {
    this.mounted = mounted;
    this.mountSpeedMultiplier = speedMultiplier;
    this.body.scale.setScalar(mounted ? 1.08 : 1);
  }

  setOutfitStyle(setId = "starter") {
    const palette = {
      hunter: { torso: 0x2f4d38, cape: 0x1e3328 },
      explorer: { torso: 0x51613e, cape: 0x37462f },
      guildRanger: { torso: 0x314b55, cape: 0x21363e },
      ancientArcher: { torso: 0x4b4267, cape: 0x302842 },
      starter: { torso: 0x263f36, cape: 0x172922 },
    }[setId] ?? { torso: 0x263f36, cape: 0x172922 };
    const { torso, shoulderCape, backCape } = this.body.userData;
    if (torso?.material?.color) {
      torso.material.color.setHex(palette.torso);
    }
    [shoulderCape, backCape].forEach((mesh) => {
      if (mesh?.material?.color) {
        mesh.material.color.setHex(palette.cape);
      }
    });
  }
}
