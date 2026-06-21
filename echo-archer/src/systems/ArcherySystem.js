import { SETTINGS } from "../config/settings.js";
import { ArrowProjectile } from "../entities/ArrowProjectile.js";

const { THREE } = window;
const aimRaycaster = new THREE.Raycaster();

export class ArcherySystem {
  constructor(scene, practice = null, enemySystem = null, feedback = null, bossSystem = null) {
    this.scene = scene;
    this.practice = practice;
    this.enemySystem = enemySystem;
    this.bossSystem = bossSystem;
    this.feedback = feedback;
    this.drawAmount = 0;
    this.isDrawing = false;
    this.arrows = [];
    this.stats = {
      drawSpeedMultiplier: 1,
      damageMultiplier: 1,
      steadiness: 0,
    };
    this.gearStats = {
      drawSpeedMultiplier: 1,
      damageMultiplier: 1,
      rangeMultiplier: 1,
      steadiness: 0,
    };
    this.rpgStats = {
      drawSpeedMultiplier: 1,
      damageMultiplier: 1,
      rangeMultiplier: 1,
      steadiness: 0,
      critChance: 0,
    };
    this.bow = this.createBow();
    this.bowPulse = 0;
    this.trailMultiplier = 1;
    this.lastDrawSoundStep = 0;
    this.arrowTypeSystem = null;
    this.windSystem = null;
    scene.add(this.bow);
  }

  setArrowTypeSystem(system) {
    this.arrowTypeSystem = system;
  }

  setWindSystem(system) {
    this.windSystem = system;
  }

  setQuality(preset = null) {
    this.trailMultiplier = preset?.effectsQuality ?? 1;
  }

  createBow() {
    const group = new THREE.Group();
    const bowMaterial = new THREE.MeshStandardMaterial({ color: 0x8e5b2f, roughness: 0.58, metalness: 0.05 });
    const bowEdgeMaterial = new THREE.LineBasicMaterial({ color: 0xffda7a, transparent: true, opacity: 0.68 });
    const gripMaterial = new THREE.MeshStandardMaterial({ color: 0x2d2118, roughness: 0.84 });
    const wrapMaterial = new THREE.MeshStandardMaterial({ color: 0xe0b75f, roughness: 0.46, metalness: 0.18, emissive: 0x261400, emissiveIntensity: 0.08 });
    const stringMaterial = new THREE.LineBasicMaterial({ color: 0xffefd0, transparent: true, opacity: 0.78 });

    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.03, -0.74, 0),
      new THREE.Vector3(0.16, -0.36, 0.07),
      new THREE.Vector3(0.19, 0, 0.1),
      new THREE.Vector3(0.16, 0.36, 0.07),
      new THREE.Vector3(-0.03, 0.74, 0),
    ]);

    const limb = new THREE.Mesh(new THREE.TubeGeometry(curve, 36, 0.034, 8, false), bowMaterial);
    limb.castShadow = true;
    const limbEdge = new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(32)), bowEdgeMaterial);
    const grip = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.28, 5, 10), gripMaterial);
    grip.rotation.x = Math.PI / 2;
    grip.castShadow = true;
    const upperWrap = new THREE.Mesh(new THREE.TorusGeometry(0.064, 0.008, 6, 16), wrapMaterial);
    upperWrap.position.y = 0.14;
    upperWrap.rotation.x = Math.PI / 2;
    const lowerWrap = upperWrap.clone();
    lowerWrap.position.y = -0.14;
    const upperTip = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.18, 5), wrapMaterial);
    upperTip.position.set(-0.04, 0.78, 0.01);
    upperTip.rotation.z = Math.PI;
    upperTip.castShadow = true;
    const lowerTip = upperTip.clone();
    lowerTip.position.y = -0.78;
    lowerTip.rotation.z = 0;
    const nockGlow = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), wrapMaterial);
    nockGlow.position.set(0, 0, -0.06);
    const sightBead = new THREE.Mesh(new THREE.SphereGeometry(0.026, 8, 6), wrapMaterial);
    sightBead.position.set(0.16, 0.08, 0.14);
    const string = new THREE.Line(new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-0.02, -0.71, 0),
      new THREE.Vector3(0, 0, -0.08),
      new THREE.Vector3(-0.02, 0.71, 0),
    ]), stringMaterial);
    group.add(limb, limbEdge, grip, upperWrap, lowerWrap, upperTip, lowerTip, nockGlow, sightBead, string);
    group.userData.string = string;
    group.userData.nockGlow = nockGlow;
    group.userData.sightBead = sightBead;
    this.updateString(group, 0);
    return group;
  }

  update(deltaSeconds, input, player, cameraRig, world) {
    this.updateDraw(deltaSeconds, input, player, cameraRig, world);
    this.updateBow(player, cameraRig);
    this.updateArrows(deltaSeconds, world);
  }

  cancelDraw() {
    this.isDrawing = false;
    this.drawAmount = 0;
    this.lastDrawSoundStep = 0;
  }

  updateDraw(deltaSeconds, input, player, cameraRig, world) {
    if (!this.isDrawing && input.isMouseDown(0) && input.pointerLocked) {
      this.isDrawing = true;
      this.drawAmount = Math.max(this.drawAmount, 0.05);
      this.lastDrawSoundStep = 0;
      this.feedback?.playSound("bowDraw", 0.4);
    }

    if (this.isDrawing && input.isMouseDown(0) && input.pointerLocked) {
      this.drawAmount = Math.min(1, this.drawAmount + (deltaSeconds * this.getDrawSpeedMultiplier()) / SETTINGS.archery.drawTime);
      const soundStep = Math.floor(this.drawAmount * 4);
      if (soundStep > this.lastDrawSoundStep) {
        this.lastDrawSoundStep = soundStep;
        this.feedback?.playSound("bowDraw", 0.45 + this.drawAmount * 0.35);
      }
    }

    if (this.isDrawing && input.wasMouseReleased(0)) {
      this.shoot(player, cameraRig, world);
      this.isDrawing = false;
      this.drawAmount = 0;
    }

    if (!input.pointerLocked || !input.isMouseDown(0)) {
      this.isDrawing = false;
      this.drawAmount = input.wasMouseReleased(0) ? 0 : Math.max(0, this.drawAmount - deltaSeconds * 3);
    }
  }

  shoot(player, cameraRig, world) {
    if (this.drawAmount < 0.08) {
      return;
    }

    const origin = this.getArrowOrigin(player, cameraRig);
    const direction = this.getShotDirection(origin, cameraRig, world);
    this.applyAimSteadiness(direction);
    const power = THREE.MathUtils.smoothstep(this.drawAmount, 0, 1);
    const releasePower = 0.82 + power * 0.28;
    const arrowType = this.arrowTypeSystem?.getCurrentArrowType?.() ?? { id: "standard", name: "Standard Arrow", damageMultiplier: 1, rangeMultiplier: 1 };
    const typeRange = arrowType.rangeMultiplier ?? 1;
    const speed = THREE.MathUtils.lerp(SETTINGS.archery.minSpeed, SETTINGS.archery.maxSpeed * this.gearStats.rangeMultiplier * this.rpgStats.rangeMultiplier * typeRange, power) * releasePower;
    origin.add(direction.clone().multiplyScalar(0.7));
    const inheritedVelocity = player.velocity.clone().multiplyScalar(0.35);
    const windDrift = this.windSystem?.getArrowDrift?.(origin, power) ?? new THREE.Vector3();
    const velocity = direction.clone().multiplyScalar(speed).add(inheritedVelocity).add(windDrift);
    const arrow = new ArrowProjectile(this.scene, origin, velocity, this.feedback, power, arrowType, this.trailMultiplier);
    const critical = Math.random() < Math.min(0.5, this.rpgStats.critChance + power * 0.04);
    arrow.critical = critical;
    arrow.damageMultiplier = this.stats.damageMultiplier * this.gearStats.damageMultiplier * this.rpgStats.damageMultiplier * (arrowType.damageMultiplier ?? 1) * (critical ? 1.75 : 1);
    this.arrows.push(arrow);
    this.bowPulse = 1.15 + power * 0.35;
    this.feedback?.playSound("bowRelease", 0.72 + power * 0.9);
    if (power > 0.45) {
      window.setTimeout(() => this.feedback?.playSound("arrowFlyby", 0.35 + power * 0.65), 45);
    }
    this.feedback?.spawnImpact(origin.clone(), power > 0.7 ? 0xffe0a0 : 0xe6b75d, 0.45 + power * 0.6);
    this.feedback?.shake(0.025 + power * 0.045);
    if (power > 0.72) {
      this.feedback?.shake(0.13 + power * 0.17);
      this.feedback?.playSound("powerfulHit", power);
    }
    if (critical) {
      this.feedback?.spawnImpact(origin.clone(), 0xffd166, 1.1);
      window.dispatchEvent(new CustomEvent("echo-archer:combat-text", {
        detail: {
          text: "CRITICAL",
          kind: "damage strong",
          x: window.innerWidth * 0.5,
          y: window.innerHeight * 0.34,
        },
      }));
    }
    this.practice?.registerShot();
  }

  updateBow(player, cameraRig) {
    const origin = this.getBowOrigin(player, cameraRig);
    const direction = cameraRig.getAimDirection(origin);
    this.bow.visible = cameraRig.mode === "first" || this.isDrawing;
    this.bow.position.copy(origin);
    this.bow.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), direction);
    this.bow.rotateZ((cameraRig.mode === "first" ? -0.06 : -0.28) - this.drawAmount * 0.12);
    const drawSettle = Math.sin(performance.now() * 0.018) * this.drawAmount * 0.012;
    this.bow.position.add(cameraRig.getPlanarSide().clone().multiplyScalar((cameraRig.mode === "first" ? -0.11 : -0.04) * this.drawAmount + drawSettle));
    const modeScale = cameraRig.mode === "first" ? 1.12 : 0.54;
    const tensionPulse = Math.sin(performance.now() * 0.028) * this.drawAmount * 0.015;
    this.bow.scale.setScalar(modeScale + this.bowPulse * 0.055 + this.drawAmount * 0.04 + tensionPulse);
    this.bowPulse *= 0.74;
    const nockGlow = this.bow.userData.nockGlow;
    if (nockGlow) {
      nockGlow.scale.setScalar(1 + this.drawAmount * 1.2 + this.bowPulse * 0.8);
      nockGlow.material.emissiveIntensity = 0.08 + this.drawAmount * 0.48;
    }
    const sightBead = this.bow.userData.sightBead;
    if (sightBead) {
      sightBead.scale.setScalar(1 + this.drawAmount * 0.35);
    }
    this.updateString(this.bow, this.drawAmount);
  }

  updateArrows(deltaSeconds, world) {
    this.arrows = this.arrows.filter((arrow) => {
      const alive = arrow.update(deltaSeconds, world);
      if (arrow.stuck && !arrow.hitProcessed) {
        arrow.hitProcessed = true;
        this.practice?.handleArrowHit(arrow);
        this.enemySystem?.handleArrowHit(arrow);
        this.bossSystem?.handleArrowHit(arrow);
        this.handleSpecialArrowImpact(arrow);
      }
      return alive;
    });
  }

  handleSpecialArrowImpact(arrow) {
    const type = arrow.arrowType?.id;
    if (!type || type === "standard") {
      return;
    }

    this.feedback?.spawnImpact(arrow.hitPoint ?? arrow.group.position, arrow.arrowType.color, type === "explosive" ? 2.2 : 1.25);
    if (type === "explosive") {
      this.feedback?.shake(0.18 + arrow.shotPower * 0.16);
      this.enemySystem?.handleAreaArrowEffect(arrow);
      this.bossSystem?.handleAreaArrowEffect?.(arrow);
    }
  }

  getBowOrigin(player, cameraRig) {
    if (cameraRig.mode === "first") {
      const offset = SETTINGS.archery.firstPersonBowOffset;
      return cameraRig.camera.localToWorld(new THREE.Vector3(offset.x, offset.y, offset.z));
    }

    const offset = SETTINGS.archery.thirdPersonBowOffset;
    const side = cameraRig.getPlanarSide().clone().multiplyScalar(offset.x);
    const forward = cameraRig.getPlanarForward().clone().multiplyScalar(offset.z);
    return player.group.position.clone().add(side).add(forward).add(new THREE.Vector3(0, offset.y, 0));
  }

  getArrowOrigin(player, cameraRig) {
    return this.getBowOrigin(player, cameraRig);
  }

  getShotDirection(origin, cameraRig, world) {
    const cameraDirection = cameraRig.getAimDirection();
    const targetPoint = this.getAimTarget(cameraRig, world, cameraDirection);
    if (targetPoint) {
      return targetPoint.sub(origin).normalize();
    }
    return cameraDirection;
  }

  getAimTarget(cameraRig, world, cameraDirection) {
    if (!world) {
      return null;
    }

    const rayOrigin = cameraRig.camera.position.clone();
    aimRaycaster.set(rayOrigin, cameraDirection.clone().normalize());
    aimRaycaster.far = 110;
    const hits = aimRaycaster.intersectObjects(world.colliders ?? [], false);
    if (hits.length > 0) {
      return hits[0].point.clone();
    }

    for (let distance = 8; distance <= 105; distance += 4) {
      const point = rayOrigin.clone().add(cameraDirection.clone().multiplyScalar(distance));
      const terrainY = world.terrain.getHeightAt(point.x, point.z);
      if (point.y <= terrainY + 0.12) {
        point.y = terrainY + 0.12;
        return point;
      }
    }

    return rayOrigin.add(cameraDirection.clone().multiplyScalar(105));
  }

  updateString(bow, drawAmount) {
    const pull = -0.08 - drawAmount * 0.42;
    const tension = Math.sin(performance.now() * 0.045) * drawAmount * 0.018;
    const points = [
      new THREE.Vector3(-0.02, -0.71, 0),
      new THREE.Vector3(tension, 0, pull),
      new THREE.Vector3(-0.02, 0.71, 0),
    ];
    bow.userData.string.geometry.setFromPoints(points);
  }

  applyAimSteadiness(direction) {
    const drift = (1 - Math.min(0.92, this.stats.steadiness + this.gearStats.steadiness + this.rpgStats.steadiness)) * 0.012;
    if (drift <= 0.001) {
      return;
    }

    const time = performance.now() * 0.001;
    direction.x += Math.sin(time * 1.7) * drift;
    direction.y += Math.cos(time * 1.3) * drift * 0.55;
    direction.z += Math.sin(time * 0.9) * drift;
    direction.normalize();
  }

  setGearModifiers(modifiers = {}) {
    this.gearStats.drawSpeedMultiplier = modifiers.drawSpeedMultiplier ?? 1;
    this.gearStats.damageMultiplier = modifiers.damageMultiplier ?? 1;
    this.gearStats.rangeMultiplier = modifiers.rangeMultiplier ?? 1;
    this.gearStats.steadiness = modifiers.steadiness ?? 0;
  }

  setBowStyle(bow = {}) {
    const palette = {
      stormcaller: 0x82c8ff,
      whisperbranch: 0x9af6b9,
      frostbite: 0x8ddcff,
      sunpiercer: 0xffa64f,
      whisperwind: 0xcfffc2,
      tidepiercer: 0x5fd8ff,
      bogpiercer: 0x9af6b9,
      infernoheart: 0xff6a1d,
      "ancient-bow": 0xc79cff,
      "hunter-bow": 0x9b6838,
      longbow: 0xd0a15d,
    };
    const color = palette[bow.id] ?? 0x8e5b2f;
    this.bow.traverse((child) => {
      if (child.material?.color && child.type !== "Line") {
        child.material.color.setHex(color);
        if (child.material.emissive) {
          child.material.emissive.setHex(bow.rarity === "legendary" ? color : 0x261400);
          child.material.emissiveIntensity = bow.rarity === "legendary" ? 0.18 : 0.08;
        }
      }
    });
  }

  setRpgModifiers(modifiers = {}) {
    this.rpgStats.drawSpeedMultiplier = modifiers.drawSpeedMultiplier ?? 1;
    this.rpgStats.damageMultiplier = modifiers.damageMultiplier ?? 1;
    this.rpgStats.rangeMultiplier = modifiers.rangeMultiplier ?? 1;
    this.rpgStats.steadiness = modifiers.steadiness ?? 0;
    this.rpgStats.critChance = modifiers.critChance ?? 0;
  }

  getDrawSpeedMultiplier() {
    return this.stats.drawSpeedMultiplier * this.gearStats.drawSpeedMultiplier * this.rpgStats.drawSpeedMultiplier;
  }
}
