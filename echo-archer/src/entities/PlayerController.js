import { SETTINGS } from "../config/settings.js";
import { getBowVisual, getOutfitVisual, SHIELD_VISUALS, WEAPON_VISUALS } from "../config/gearVisuals.js";

const { THREE } = window;

export class PlayerController {
  constructor(scene, world) {
    this.world = world;
    this.terrain = world.terrain;
    this.group = new THREE.Group();
    this.velocity = new THREE.Vector3();
    this.moveDirection = new THREE.Vector3();
    this.smoothedMoveDirection = new THREE.Vector3();
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
    this.recentDamageTimer = 0;
    this.safeRecoveryTimer = 0;
    this.isSprinting = false;
    this.defeated = false;
    this.visualMoveAmount = 0;
    this.airTime = 0;
    this.landingTimer = 0;
    this.interactionGestureTimer = 0;
    this.interactionGestureKind = "interact";
    this.wasGroundedLastFrame = false;
    this.visualGroundOffset = -SETTINGS.player.height / 2;

    this.body = this.createBody();
    this.body.position.y = this.visualGroundOffset;
    this.group.add(this.body);
    this.group.position.set(0, this.terrain.getHeightAt(0, 0) + SETTINGS.player.height / 2, 0);
    scene.add(this.group);
    window.addEventListener("echo-archer:player-interaction", (event) => {
      this.playInteractionGesture(event.detail?.kind ?? "interact");
    });
  }

  createBody() {
    const body = new THREE.Group();
    const cloakMaterial = new THREE.MeshStandardMaterial({ color: 0x263f36, roughness: 0.82, metalness: 0.02 });
    const cloakDarkMaterial = new THREE.MeshStandardMaterial({ color: 0x172922, roughness: 0.9, metalness: 0.01 });
    const leatherMaterial = new THREE.MeshStandardMaterial({ color: 0x7b4e2f, roughness: 0.82 });
    const trimMaterial = new THREE.MeshStandardMaterial({ color: 0xe6b75d, roughness: 0.5, metalness: 0.22, emissive: 0x2a1700, emissiveIntensity: 0.08 });
    const clothMaterial = new THREE.MeshStandardMaterial({ color: 0x6f8d63, roughness: 0.88 });
    const bootMaterial = new THREE.MeshStandardMaterial({ color: 0x3d2a1f, roughness: 0.86 });
    const gloveMaterial = new THREE.MeshStandardMaterial({ color: 0x4b3425, roughness: 0.82 });
    const shadowFaceMaterial = new THREE.MeshStandardMaterial({ color: 0x11120e, roughness: 0.94 });
    const bowMaterial = new THREE.MeshStandardMaterial({ color: 0xa86836, roughness: 0.62, metalness: 0.04 });
    const bowStringMaterial = new THREE.MeshStandardMaterial({ color: 0xf5e9c6, roughness: 0.7, emissive: 0x1e1304, emissiveIntensity: 0.05 });

    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.3, 0.86, 7, 14), cloakMaterial);
    torso.position.y = 0.96;
    torso.scale.set(0.86, 1.08, 0.72);
    torso.castShadow = true;
    body.add(torso);

    const chestPlate = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.38, 0.055), trimMaterial);
    chestPlate.position.set(0, 1.08, 0.25);
    chestPlate.rotation.x = -0.08;
    chestPlate.castShadow = true;
    body.add(chestPlate);

    const chestArrow = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.34, 4), trimMaterial);
    chestArrow.position.set(0, 1.08, 0.295);
    chestArrow.rotation.x = Math.PI / 2;
    chestArrow.castShadow = true;
    body.add(chestArrow);

    const chestStrap = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.92, 0.042), leatherMaterial);
    chestStrap.position.set(-0.13, 1.0, 0.285);
    chestStrap.rotation.set(-0.04, 0, -0.48);
    chestStrap.castShadow = true;
    body.add(chestStrap);

    const waistWrap = new THREE.Mesh(new THREE.TorusGeometry(0.31, 0.018, 8, 30), clothMaterial);
    waistWrap.position.set(0, 0.9, 0.012);
    waistWrap.rotation.x = Math.PI / 2;
    waistWrap.scale.set(1.06, 0.72, 1);
    waistWrap.castShadow = true;
    body.add(waistWrap);

    const layeredTunic = new THREE.Mesh(new THREE.ConeGeometry(0.36, 0.52, 7), clothMaterial);
    layeredTunic.position.set(0, 0.78, 0.02);
    layeredTunic.scale.set(0.78, 0.76, 0.58);
    layeredTunic.castShadow = true;
    body.add(layeredTunic);

    const cloakSkirt = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.54, 7), cloakDarkMaterial);
    cloakSkirt.position.y = 0.7;
    cloakSkirt.scale.set(0.82, 1, 0.66);
    cloakSkirt.castShadow = true;
    body.add(cloakSkirt);

    const frontTabard = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.44, 0.035), clothMaterial);
    frontTabard.position.set(0, 0.64, 0.25);
    frontTabard.rotation.x = -0.06;
    frontTabard.castShadow = true;
    body.add(frontTabard);

    const tabardTrim = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.035, 0.042), trimMaterial);
    tabardTrim.position.set(0, 0.42, 0.272);
    tabardTrim.rotation.x = -0.06;
    tabardTrim.castShadow = true;
    body.add(tabardTrim);

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

    const capeHem = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.045, 0.04), trimMaterial);
    capeHem.position.set(0, 0.44, -0.42);
    capeHem.rotation.x = -0.24;
    capeHem.castShadow = true;
    body.add(capeHem);

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

    const hoodTrim = new THREE.Mesh(new THREE.TorusGeometry(0.245, 0.012, 8, 28), trimMaterial);
    hoodTrim.position.set(0, 1.5, 0.185);
    hoodTrim.rotation.x = Math.PI / 2;
    hoodTrim.scale.set(1.04, 0.52, 1);
    hoodTrim.castShadow = true;
    body.add(hoodTrim);

    const faceShadow = new THREE.Mesh(new THREE.SphereGeometry(0.2, 14, 8), shadowFaceMaterial);
    faceShadow.position.set(0, 1.49, 0.25);
    faceShadow.scale.set(1, 0.62, 0.34);
    body.add(faceShadow);

    const expressionMaterial = new THREE.MeshStandardMaterial({ color: 0xf0d7a5, roughness: 0.72, emissive: 0x140a02, emissiveIntensity: 0.04 });
    [-1, 1].forEach((side) => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 6), expressionMaterial);
      eye.position.set(side * 0.06, 1.52, 0.315);
      eye.scale.set(1, 0.62, 0.48);
      body.add(eye);
    });

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

      const pauldron = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.28, 5), trimMaterial);
      pauldron.position.set(side * 0.37, 1.25, 0.02);
      pauldron.rotation.set(0.15, 0, side * -0.82);
      pauldron.scale.set(1.05, 0.48, 0.82);
      pauldron.castShadow = true;
      body.add(pauldron);

      const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.48, 5, 8), leatherMaterial);
      arm.position.set(side * 0.42, 0.92, 0.02);
      arm.rotation.z = side * 0.18;
      arm.castShadow = true;
      body.add(arm);
      limbs.push({ mesh: arm, side, baseZ: side * 0.18, type: "arm" });

      const sleeve = new THREE.Mesh(new THREE.CapsuleGeometry(0.065, 0.26, 5, 8), cloakDarkMaterial);
      sleeve.position.set(side * 0.405, 1.03, 0.015);
      sleeve.rotation.z = side * 0.2;
      sleeve.scale.set(0.92, 1, 0.86);
      sleeve.castShadow = true;
      body.add(sleeve);
      limbs.push({ mesh: sleeve, side, baseZ: side * 0.2, type: "sleeve" });

      const bracer = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.065, 0.16, 8), trimMaterial);
      bracer.position.set(side * 0.46, 0.7, 0.035);
      bracer.rotation.z = side * 0.18;
      bracer.castShadow = true;
      body.add(bracer);
      limbs.push({ mesh: bracer, side, baseZ: side * 0.18, type: "bracer" });

      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.062, 10, 7), gloveMaterial);
      hand.position.set(side * 0.48, 0.58, 0.06);
      hand.scale.set(0.86, 0.72, 0.78);
      hand.castShadow = true;
      body.add(hand);
      limbs.push({ mesh: hand, side, baseZ: side * 0.18, type: "hand" });

      const upperLeg = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.38, 6, 10), clothMaterial);
      upperLeg.position.set(side * 0.17, 0.47, 0.035);
      upperLeg.rotation.z = side * -0.075;
      upperLeg.scale.set(0.98, 1.14, 0.86);
      upperLeg.castShadow = true;
      body.add(upperLeg);
      limbs.push({ mesh: upperLeg, side, baseZ: side * -0.035, type: "upperLeg" });

      const thighWrap = new THREE.Mesh(new THREE.CylinderGeometry(0.078, 0.073, 0.12, 8), leatherMaterial);
      thighWrap.position.set(side * 0.17, 0.5, 0.042);
      thighWrap.rotation.z = side * -0.075;
      thighWrap.castShadow = true;
      body.add(thighWrap);
      limbs.push({ mesh: thighWrap, side, baseZ: side * -0.035, type: "thighWrap" });

      const kneePad = new THREE.Mesh(new THREE.SphereGeometry(0.075, 9, 6), trimMaterial);
      kneePad.position.set(side * 0.16, 0.34, 0.115);
      kneePad.scale.set(0.82, 0.48, 0.42);
      kneePad.castShadow = true;
      body.add(kneePad);
      limbs.push({ mesh: kneePad, side, baseZ: side * -0.04, type: "knee" });

      const lowerLeg = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.38, 6, 10), bootMaterial);
      lowerLeg.position.set(side * 0.19, 0.2, 0.055);
      lowerLeg.rotation.z = side * -0.085;
      lowerLeg.scale.set(1.03, 1.08, 0.86);
      lowerLeg.castShadow = true;
      body.add(lowerLeg);
      limbs.push({ mesh: lowerLeg, side, baseZ: side * -0.06, type: "lowerLeg" });

      const bootCuff = new THREE.Mesh(new THREE.CylinderGeometry(0.078, 0.068, 0.1, 8), trimMaterial);
      bootCuff.position.set(side * 0.19, 0.13, 0.055);
      bootCuff.rotation.z = side * -0.085;
      bootCuff.castShadow = true;
      body.add(bootCuff);
      limbs.push({ mesh: bootCuff, side, baseZ: side * -0.06, type: "bootCuff" });

      const foot = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.22, 6, 9), bootMaterial);
      foot.position.set(side * 0.19, 0.02, 0.2);
      foot.rotation.set(Math.PI / 2, 0, side * 0.035);
      foot.scale.set(1.08, 1.52, 0.82);
      foot.castShadow = true;
      body.add(foot);
      limbs.push({ mesh: foot, side, baseZ: side * 0.035, type: "foot" });

      const bootToe = new THREE.Mesh(new THREE.SphereGeometry(0.058, 9, 6), bootMaterial);
      bootToe.position.set(side * 0.19, 0.005, 0.33);
      bootToe.scale.set(0.86, 0.48, 1.18);
      bootToe.castShadow = true;
      body.add(bootToe);
      limbs.push({ mesh: bootToe, side, baseZ: side * 0.035, type: "bootToe" });
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

    const bowGroup = new THREE.Group();
    bowGroup.position.set(0.42, 0.86, 0.23);
    bowGroup.rotation.set(0.08, -0.18, -0.16);
    body.add(bowGroup);
    const bowLimbMeshes = [];
    const bowAccentMeshes = [];

    const bowUpper = new THREE.Mesh(new THREE.CapsuleGeometry(0.025, 0.74, 6, 10), bowMaterial);
    bowUpper.position.y = 0.28;
    bowUpper.rotation.z = -0.18;
    bowUpper.scale.set(0.72, 1, 0.72);
    bowUpper.castShadow = true;
    bowGroup.add(bowUpper);
    bowLimbMeshes.push(bowUpper);

    const bowLower = bowUpper.clone();
    bowLower.position.y = -0.28;
    bowLower.rotation.z = 0.18;
    bowGroup.add(bowLower);
    bowLimbMeshes.push(bowLower);

    [-1, 1].forEach((side) => {
      const bowTip = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.16, 5), trimMaterial);
      bowTip.position.set(side * 0.08, side * 0.72, 0);
      bowTip.rotation.z = side > 0 ? -0.7 : Math.PI + 0.7;
      bowTip.castShadow = true;
      bowGroup.add(bowTip);
      bowAccentMeshes.push(bowTip);
    });

    const bowGrip = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.18, 8), leatherMaterial);
    bowGrip.rotation.x = Math.PI / 2;
    bowGrip.castShadow = true;
    bowGroup.add(bowGrip);

    const bowString = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 1.38, 5), bowStringMaterial);
    bowString.position.set(0.12, 0, -0.01);
    bowString.rotation.z = 0.01;
    bowString.castShadow = true;
    bowGroup.add(bowString);

    const guildCharm = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.12, 4), trimMaterial);
    guildCharm.position.set(0.03, -0.1, 0.035);
    guildCharm.rotation.set(Math.PI / 2, 0, Math.PI / 4);
    guildCharm.castShadow = true;
    bowGroup.add(guildCharm);
    bowAccentMeshes.push(guildCharm);
    bowGroup.userData = { limbMeshes: bowLimbMeshes, accentMeshes: bowAccentMeshes, stringMesh: bowString, grip: bowGrip };

    const sidearmGroup = new THREE.Group();
    sidearmGroup.position.set(0.31, 0.58, -0.22);
    sidearmGroup.rotation.set(-0.2, -0.16, -0.72);
    body.add(sidearmGroup);
    const sidearmBlade = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.5, 0.025), trimMaterial);
    sidearmBlade.position.y = 0.18;
    sidearmBlade.castShadow = true;
    const sidearmGrip = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.18, 8), leatherMaterial);
    sidearmGrip.position.y = -0.13;
    sidearmGrip.rotation.x = Math.PI / 2;
    sidearmGrip.castShadow = true;
    const sidearmGuard = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.035, 0.035), trimMaterial);
    sidearmGuard.position.y = -0.03;
    sidearmGuard.castShadow = true;
    sidearmGroup.add(sidearmBlade, sidearmGrip, sidearmGuard);

    const shieldGroup = new THREE.Group();
    shieldGroup.position.set(-0.38, 0.84, -0.28);
    shieldGroup.rotation.set(-0.18, 0.46, 0.22);
    shieldGroup.visible = false;
    body.add(shieldGroup);
    const shieldFace = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.3, 0.055, 9), leatherMaterial);
    shieldFace.rotation.x = Math.PI / 2;
    shieldFace.scale.set(0.85, 1.15, 1);
    shieldFace.castShadow = true;
    const shieldRim = new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.014, 8, 28), trimMaterial);
    shieldRim.rotation.x = Math.PI / 2;
    shieldRim.scale.set(0.85, 1.15, 1);
    const shieldBoss = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 7), trimMaterial);
    shieldBoss.scale.set(1, 0.4, 1);
    shieldBoss.position.z = 0.035;
    shieldGroup.add(shieldFace, shieldRim, shieldBoss);

    const backpackGroup = new THREE.Group();
    backpackGroup.position.set(0.08, 0.93, -0.42);
    backpackGroup.rotation.set(-0.1, -0.08, 0.04);
    body.add(backpackGroup);
    const backpack = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.44, 0.18), leatherMaterial);
    backpack.castShadow = true;
    const bedroll = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.42, 8), clothMaterial);
    bedroll.position.set(0, 0.27, -0.02);
    bedroll.rotation.z = Math.PI / 2;
    bedroll.castShadow = true;
    const packStrap = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.045, 0.035), trimMaterial);
    packStrap.position.set(0, 0.02, 0.1);
    backpackGroup.add(backpack, bedroll, packStrap);

    const stanceMarker = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.24, 4), trimMaterial);
    stanceMarker.position.set(0.18, 1.38, 0.14);
    stanceMarker.rotation.set(Math.PI / 2, 0, Math.PI / 4);
    stanceMarker.castShadow = true;
    body.add(stanceMarker);

    body.userData = {
      limbs,
      torso,
      layeredTunic,
      shoulderCape,
      backCape,
      scarf,
      frontTabard,
      capeHem,
      bowGroup,
      bowString,
      sidearmGroup,
      shieldGroup,
      backpackGroup,
      gearMeshes: { sidearmBlade, sidearmGuard, shieldFace, shieldRim, shieldBoss, backpack, bedroll, packStrap, chestPlate, chestArrow, tabardTrim, hoodTrim, belt, buckle },
    };
    return body;
  }

  update(deltaSeconds, input, cameraRig) {
    this.body.visible = cameraRig.mode !== "first";
    this.visualTime += deltaSeconds;
    this.damageCooldown = Math.max(0, this.damageCooldown - deltaSeconds);
    this.recentDamageTimer = Math.max(0, this.recentDamageTimer - deltaSeconds);
    this.interactionGestureTimer = Math.max(0, this.interactionGestureTimer - deltaSeconds);
    if (this.defeated) {
      this.velocity.multiplyScalar(0.9);
      this.animateBody(deltaSeconds, input);
      return;
    }
    this.readMovementInput(input, cameraRig);
    this.applyHeatEffects(deltaSeconds);
    const wantsSprint = input.isDown("ShiftLeft") || input.isDown("ShiftRight");
    this.applyHorizontalMotion(deltaSeconds, wantsSprint);
    this.applyVerticalMotion(deltaSeconds, input);
    this.integrate(deltaSeconds);
    this.animateBody(deltaSeconds, input);
    this.alignBody(cameraRig, deltaSeconds);
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

  applyHorizontalMotion(deltaSeconds, wantsSprint) {
    const bogMultiplier = this.world.getBogSlowMultiplierAt?.(this.group.position) ?? 1;
    const heatMultiplier = this.world.getHeatMovementMultiplierAt?.(this.group.position, this.stats.environmentalResistance ?? 0) ?? 1;
    const moving = this.moveDirection.lengthSq() > 0.001;
    const minimumSprintStamina = SETTINGS.player.staminaSprintMinimum ?? 8;
    const canSprint = wantsSprint && moving && !this.mounted && (this.stats.stamina ?? 0) > minimumSprintStamina;
    this.isSprinting = Boolean(canSprint || (this.mounted && wantsSprint && moving));
    this.updateStamina(deltaSeconds, canSprint, moving);
    const sprinting = this.isSprinting;
    const aiming = Boolean(window.echoArcherCombatState?.isDrawing);
    const aimMultiplier = aiming && !this.mounted ? (SETTINGS.player.aimMoveMultiplier ?? 0.68) : 1;
    const speed = this.getMoveSpeed(sprinting) * bogMultiplier * heatMultiplier * aimMultiplier;
    const directionBlend = 1 - Math.exp((moving ? -14 : -18) * deltaSeconds);
    this.smoothedMoveDirection.lerp(this.moveDirection, directionBlend);
    if (!moving && this.smoothedMoveDirection.lengthSq() < 0.0004) {
      this.smoothedMoveDirection.set(0, 0, 0);
    }
    const targetX = this.smoothedMoveDirection.x * speed;
    const targetZ = this.smoothedMoveDirection.z * speed;
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

  updateStamina(deltaSeconds, sprinting, moving) {
    const staminaMax = Math.max(1, this.stats.staminaMax ?? SETTINGS.player.stamina);
    const current = THREE.MathUtils.clamp(this.stats.stamina ?? staminaMax, 0, staminaMax);

    if (sprinting) {
      this.stats.stamina = Math.max(0, current - (SETTINGS.player.sprintStaminaDrain ?? 24) * deltaSeconds);
      if (this.stats.stamina <= 0) {
        this.isSprinting = false;
      }
      return;
    }

    const recoveryMultiplier = this.stats.staminaRecoveryMultiplier ?? 1;
    const movementPenalty = moving ? 0.58 : 1;
    const recovery = (SETTINGS.player.staminaRecovery ?? 18) * recoveryMultiplier * movementPenalty;
    this.stats.stamina = Math.min(staminaMax, current + recovery * deltaSeconds);
  }

  integrate(deltaSeconds) {
    this.wasGroundedLastFrame = this.onGround;
    this.group.position.addScaledVector(this.velocity, deltaSeconds);
    this.resolveWorldCollisions();

    const halfHeight = SETTINGS.player.height / 2;
    const groundSurfaceY = this.getWalkableGroundHeight(this.group.position.x, this.group.position.z);
    const groundY = groundSurfaceY + halfHeight;
    const distanceToGround = this.group.position.y - groundY;
    const movingHorizontally = Math.hypot(this.velocity.x, this.velocity.z) > 0.08;
    const walkingOnGround = this.onGround && this.velocity.y <= 0.35;
    const snapDistance = movingHorizontally ? Math.max(SETTINGS.player.groundSnap, 0.72) : SETTINGS.player.groundSnap;
    const closeEnoughToSnap = Math.abs(distanceToGround) <= snapDistance && this.velocity.y <= 0.15;
    const walkableStep = Math.abs(groundSurfaceY - this.lastGroundY) <= SETTINGS.player.maxGroundStep;
    const fallingIntoGround = this.group.position.y < groundY;
    const shouldStickToSlope = walkingOnGround && walkableStep && distanceToGround < 0.72;

    if (shouldStickToSlope || closeEnoughToSnap || fallingIntoGround) {
      const snapImmediately = fallingIntoGround || Math.abs(distanceToGround) > 0.2;
      this.group.position.y = !snapImmediately
        ? THREE.MathUtils.lerp(this.group.position.y, groundY, 1 - Math.exp(-SETTINGS.player.groundFollow * deltaSeconds))
        : groundY;
      this.velocity.y = 0;
      this.onGround = true;
      this.groundContactGrace = 0.12;
      this.lastGroundY = groundSurfaceY;
      if (!this.wasGroundedLastFrame && this.airTime > 0.08) {
        this.landingTimer = SETTINGS.player.landingSettleTime ?? 0.18;
      }
      this.airTime = 0;
    } else {
      this.airTime += deltaSeconds;
      this.groundContactGrace = Math.max(0, this.groundContactGrace - deltaSeconds);
      this.onGround = this.groundContactGrace > 0 && this.velocity.y <= 0;
    }
    this.landingTimer = Math.max(0, this.landingTimer - deltaSeconds);
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
    const average = (center * 2.8 + front + back + left + right) / 6.8;
    const highest = Math.max(center, front, back, left, right);
    return THREE.MathUtils.lerp(average, highest, 0.12);
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

  alignBody(cameraRig, deltaSeconds = 1 / 60) {
    const moving = this.smoothedMoveDirection.lengthSq() > 0.001;
    const desiredYaw = moving ? Math.atan2(this.smoothedMoveDirection.x, this.smoothedMoveDirection.z) : cameraRig.yaw;
    const currentYaw = this.group.rotation.y;
    const turnBlend = 1 - Math.exp(-(SETTINGS.player.turnSpeed ?? 11) * Math.min(deltaSeconds, 0.05));
    this.group.rotation.y = this.lerpAngle(currentYaw, desiredYaw, moving ? turnBlend : turnBlend * 0.45);
  }

  lerpAngle(from, to, amount) {
    const delta = Math.atan2(Math.sin(to - from), Math.cos(to - from));
    return from + delta * THREE.MathUtils.clamp(amount, 0, 1);
  }

  animateBody(deltaSeconds, input) {
    const horizontalSpeed = Math.hypot(this.velocity.x, this.velocity.z);
    const moving = horizontalSpeed > 0.2;
    const sprinting = moving && this.isSprinting;
    const speedRatio = THREE.MathUtils.clamp(horizontalSpeed / Math.max(0.001, this.getMoveSpeed(true)), 0, 1);
    this.visualMoveAmount = THREE.MathUtils.lerp(this.visualMoveAmount, moving ? speedRatio : 0, 1 - Math.exp(-9 * deltaSeconds));
    const gait = this.visualTime * THREE.MathUtils.lerp(6.2, sprinting ? 13.8 : 9.4, this.visualMoveAmount);
    const rawBob = Math.sin(gait) * (sprinting ? 0.018 : 0.012) * this.visualMoveAmount;
    const landingRatio = this.landingTimer > 0 ? this.landingTimer / (SETTINGS.player.landingSettleTime ?? 0.18) : 0;
    const landingDip = landingRatio > 0 ? Math.sin(landingRatio * Math.PI) * -0.046 : 0;
    const airborneLift = this.onGround ? 0 : -0.025;
    const idleBreath = moving ? 0 : Math.sin(this.visualTime * 1.2) * 0.008;
    const idleShift = moving ? 0 : Math.sin(this.visualTime * 0.62) * 0.012;
    const bob = Math.min(rawBob, 0.004) + landingDip + airborneLift;
    const sway = moving ? Math.sin(gait * 0.5) * 0.03 * this.visualMoveAmount : Math.sin(this.visualTime * 1.6) * 0.008 + idleShift;

    this.body.position.y = THREE.MathUtils.lerp(this.body.position.y, this.visualGroundOffset + bob + idleBreath, 1 - Math.exp(-14 * deltaSeconds));
    this.body.rotation.z = THREE.MathUtils.lerp(this.body.rotation.z, sway, 1 - Math.exp(-9 * deltaSeconds));

    const { limbs = [], torso, layeredTunic, shoulderCape, backCape, scarf, frontTabard, capeHem, bowGroup, bowString, sidearmGroup, shieldGroup, backpackGroup } = this.body.userData;
    const combatState = window.echoArcherCombatState ?? {};
    const drawAmount = combatState.drawAmount ?? 0;
    const releaseKick = combatState.releaseKick ?? 0;
    const aiming = Boolean(combatState.isDrawing || drawAmount > 0.03 || (input?.isMouseDown?.(0) && input?.pointerLocked));
    const gesture = this.interactionGestureTimer > 0 ? this.interactionGestureTimer / 0.55 : 0;
    limbs.forEach(({ mesh, side, baseZ, type }) => {
      const stride = moving ? Math.sin(gait + (side > 0 ? Math.PI : 0)) : 0;
      if (type === "upperLeg") {
        const stanceBrace = aiming ? side * 0.04 + drawAmount * 0.035 : 0;
        mesh.rotation.x = THREE.MathUtils.lerp(mesh.rotation.x, stride * (sprinting ? 0.52 : 0.38) - landingRatio * 0.16, 1 - Math.exp(-14 * deltaSeconds));
        mesh.rotation.z = THREE.MathUtils.lerp(mesh.rotation.z, baseZ + stride * 0.075 + stanceBrace, 1 - Math.exp(-14 * deltaSeconds));
        return;
      }
      if (type === "lowerLeg") {
        const kneeBend = Math.max(0, -stride) * (sprinting ? 0.34 : 0.22);
        mesh.rotation.x = THREE.MathUtils.lerp(mesh.rotation.x, -stride * 0.16 + kneeBend + landingRatio * 0.22, 1 - Math.exp(-14 * deltaSeconds));
        mesh.rotation.z = THREE.MathUtils.lerp(mesh.rotation.z, baseZ + stride * 0.05, 1 - Math.exp(-14 * deltaSeconds));
        return;
      }
      if (type === "knee" || type === "bootCuff" || type === "thighWrap") {
        mesh.rotation.x = THREE.MathUtils.lerp(mesh.rotation.x, stride * 0.08, 1 - Math.exp(-14 * deltaSeconds));
        mesh.rotation.z = THREE.MathUtils.lerp(mesh.rotation.z, baseZ + stride * 0.04, 1 - Math.exp(-14 * deltaSeconds));
        return;
      }
      if (type === "foot" || type === "bootToe") {
        const footPlant = moving ? Math.max(0, stride) * 0.16 - Math.max(0, -stride) * 0.08 : 0;
        mesh.rotation.x = THREE.MathUtils.lerp(mesh.rotation.x, Math.PI / 2 + footPlant, 1 - Math.exp(-16 * deltaSeconds));
        mesh.rotation.z = THREE.MathUtils.lerp(mesh.rotation.z, baseZ + stride * 0.025, 1 - Math.exp(-16 * deltaSeconds));
        return;
      }

      const drawPose = aiming ? drawAmount : 0;
      const gestureLift = gesture > 0 && side > 0 ? -0.34 * Math.sin(gesture * Math.PI) : 0;
      const target = baseZ + stride * 0.16 + (aiming ? -side * (0.12 + drawPose * 0.12) : 0) + gestureLift;
      mesh.rotation.z = THREE.MathUtils.lerp(mesh.rotation.z, target, 1 - Math.exp(-12 * deltaSeconds));
      mesh.rotation.x = THREE.MathUtils.lerp(mesh.rotation.x, aiming ? -0.16 - drawPose * 0.12 + releaseKick * 0.08 : gesture > 0 && side > 0 ? -0.18 * Math.sin(gesture * Math.PI) : 0, 1 - Math.exp(-10 * deltaSeconds));
      if (type === "hand" || type === "bracer") {
        mesh.position.z = THREE.MathUtils.lerp(mesh.position.z, aiming ? 0.12 + drawPose * 0.04 : gesture > 0 && side > 0 ? 0.18 : 0.06, 1 - Math.exp(-11 * deltaSeconds));
      }
    });

    if (torso) {
      torso.rotation.x = THREE.MathUtils.lerp(torso.rotation.x, aiming ? -0.08 - drawAmount * 0.045 + releaseKick * 0.035 : moving ? -0.045 : 0.018, 1 - Math.exp(-7 * deltaSeconds));
      torso.scale.y = THREE.MathUtils.lerp(torso.scale.y, 1.08 + (moving ? 0 : Math.sin(this.visualTime * 1.2) * 0.018), 1 - Math.exp(-6 * deltaSeconds));
    }
    if (layeredTunic) {
      layeredTunic.rotation.z = Math.sin(gait * 0.5) * 0.018 * this.visualMoveAmount + sway * 0.35;
    }
    if (frontTabard) {
      frontTabard.rotation.x = THREE.MathUtils.lerp(frontTabard.rotation.x, -0.06 + this.visualMoveAmount * 0.035 + landingRatio * 0.05, 1 - Math.exp(-8 * deltaSeconds));
      frontTabard.rotation.z = Math.sin(gait * 0.5) * 0.016 * this.visualMoveAmount + sway * 0.25;
    }
    if (scarf) {
      scarf.rotation.z = Math.sin(this.visualTime * 2.1) * 0.018 + this.visualMoveAmount * 0.035;
    }
    if (shoulderCape) {
      shoulderCape.rotation.z = Math.sin(this.visualTime * 2.8) * 0.018;
    }
    if (backCape) {
      backCape.rotation.x = -0.18 - Math.min(horizontalSpeed / this.getMoveSpeed(true), 1) * 0.18 + Math.sin(this.visualTime * 1.4) * 0.018;
    }
    if (capeHem) {
      capeHem.rotation.x = -0.24 - Math.min(horizontalSpeed / this.getMoveSpeed(true), 1) * 0.16 + Math.sin(this.visualTime * 1.4 + 0.3) * 0.02;
      capeHem.rotation.z = sway * 0.35;
    }
    if (bowGroup) {
      const bowVisualScale = bowGroup.userData.visualScale ?? 1;
      bowGroup.position.x = THREE.MathUtils.lerp(bowGroup.position.x, aiming ? 0.52 : 0.42, 1 - Math.exp(-10 * deltaSeconds));
      bowGroup.position.y = THREE.MathUtils.lerp(bowGroup.position.y, aiming ? 0.94 : 0.86 + Math.sin(this.visualTime * 1.2) * 0.006, 1 - Math.exp(-9 * deltaSeconds));
      bowGroup.position.z = THREE.MathUtils.lerp(bowGroup.position.z, aiming ? 0.31 + drawAmount * 0.035 : 0.23, 1 - Math.exp(-10 * deltaSeconds));
      bowGroup.rotation.x = THREE.MathUtils.lerp(bowGroup.rotation.x, aiming ? -0.14 - drawAmount * 0.08 + releaseKick * 0.05 : 0.08, 1 - Math.exp(-10 * deltaSeconds));
      bowGroup.rotation.y = THREE.MathUtils.lerp(bowGroup.rotation.y, aiming ? -0.34 : -0.18, 1 - Math.exp(-10 * deltaSeconds));
      bowGroup.rotation.z = THREE.MathUtils.lerp(bowGroup.rotation.z, aiming ? -0.04 - drawAmount * 0.09 : -0.16 + Math.sin(this.visualTime * 1.6) * 0.008, 1 - Math.exp(-10 * deltaSeconds));
      bowGroup.scale.setScalar(THREE.MathUtils.lerp(bowGroup.scale.x, bowVisualScale * (1 + drawAmount * 0.035 + releaseKick * 0.04), 1 - Math.exp(-12 * deltaSeconds)));
    }
    if (bowString) {
      bowString.position.x = THREE.MathUtils.lerp(bowString.position.x, 0.12 - drawAmount * 0.08 + releaseKick * 0.06, 1 - Math.exp(-14 * deltaSeconds));
      bowString.scale.y = THREE.MathUtils.lerp(bowString.scale.y, 1 + drawAmount * 0.05, 1 - Math.exp(-14 * deltaSeconds));
    }
    if (sidearmGroup) {
      sidearmGroup.rotation.z = -0.72 + Math.sin(gait * 0.5) * 0.025 * this.visualMoveAmount + sway * 0.18;
    }
    if (shieldGroup) {
      shieldGroup.rotation.z = 0.22 + Math.sin(gait * 0.5 + 0.4) * 0.018 * this.visualMoveAmount;
    }
    if (backpackGroup) {
      backpackGroup.rotation.x = -0.1 - Math.min(horizontalSpeed / this.getMoveSpeed(true), 1) * 0.035 + Math.sin(this.visualTime * 1.2) * 0.008;
      backpackGroup.position.y = 0.93 + idleBreath * 0.7 + Math.abs(rawBob) * 0.4;
    }
  }

  playInteractionGesture(kind = "interact") {
    this.interactionGestureKind = kind;
    this.interactionGestureTimer = kind === "read" ? 0.72 : 0.55;
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
    this.recentDamageTimer = SETTINGS.player.safeHealthRegenCombatDelay ?? 3;

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

  updateSafeRecovery(deltaSeconds, safe) {
    if (this.defeated || !safe) {
      this.safeRecoveryTimer = 0;
      return;
    }

    const healthMax = Math.max(1, this.stats.healthMax ?? 100);
    const health = THREE.MathUtils.clamp(this.stats.health ?? healthMax, 0, healthMax);
    if (health >= healthMax) {
      this.safeRecoveryTimer = 0;
      return;
    }

    this.safeRecoveryTimer += deltaSeconds;
    if (this.safeRecoveryTimer < (SETTINGS.player.safeHealthRegenDelay ?? 4.2)) {
      return;
    }

    // Safe recovery is intentionally fixed: out of combat = 10 HP per second.
    this.stats.health = Math.min(
      healthMax,
      health + (SETTINGS.player.safeHealthRegen ?? 10) * deltaSeconds,
    );
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
    const palette = getOutfitVisual(setId);
    const { torso, shoulderCape, backCape, layeredTunic, frontTabard, scarf, gearMeshes = {} } = this.body.userData;
    if (torso?.material?.color) {
      torso.material.color.setHex(palette.torso);
    }
    [shoulderCape, backCape].forEach((mesh) => {
      if (mesh?.material?.color) {
        mesh.material.color.setHex(palette.cape);
      }
    });
    [layeredTunic, frontTabard, scarf].forEach((mesh) => {
      if (mesh?.material?.color) {
        mesh.material.color.setHex(palette.torso);
      }
    });
    [gearMeshes.chestPlate, gearMeshes.chestArrow, gearMeshes.tabardTrim, gearMeshes.hoodTrim, gearMeshes.buckle].forEach((mesh) => {
      if (mesh?.material?.color) {
        mesh.material.color.setHex(palette.trim);
      }
      if (mesh?.material?.emissive) {
        mesh.material.emissive.setHex(palette.trim);
        mesh.material.emissiveIntensity = setId === "masterArcher" || setId === "ancientArcher" ? 0.14 : 0.08;
      }
    });
    [gearMeshes.backpack, gearMeshes.packStrap].forEach((mesh) => {
      if (mesh?.material?.color) {
        mesh.material.color.setHex(palette.leather);
      }
    });
  }

  setBowStyle(bow = {}) {
    const visual = getBowVisual(bow?.id);
    const { bowGroup } = this.body.userData;
    if (!bowGroup) {
      return;
    }
    bowGroup.userData.limbMeshes?.forEach((mesh) => {
      mesh.material.color.setHex(visual.limb);
      if (mesh.material.emissive) {
        mesh.material.emissive.setHex(visual.limb);
        mesh.material.emissiveIntensity = bow?.rarity === "legendary" ? 0.08 : 0.02;
      }
    });
    bowGroup.userData.accentMeshes?.forEach((mesh) => {
      mesh.material.color.setHex(visual.accent);
      if (mesh.material.emissive) {
        mesh.material.emissive.setHex(visual.accent);
        mesh.material.emissiveIntensity = bow?.rarity === "legendary" ? 0.18 : 0.06;
      }
    });
    if (bowGroup.userData.stringMesh?.material?.color) {
      bowGroup.userData.stringMesh.material.color.setHex(visual.string);
    }
    bowGroup.scale.setScalar(visual.scale ?? 1);
    bowGroup.userData.visualScale = visual.scale ?? 1;
  }

  setEquipmentStyle({ weapon = null, shield = null } = {}) {
    const { sidearmGroup, shieldGroup, gearMeshes = {} } = this.body.userData;
    const weaponVisual = WEAPON_VISUALS[weapon?.id] ?? WEAPON_VISUALS["wooden-sword"];
    if (sidearmGroup) {
      sidearmGroup.visible = Boolean(weapon);
      sidearmGroup.scale.setScalar(weaponVisual.scale ?? 1);
    }
    [gearMeshes.sidearmBlade, gearMeshes.sidearmGuard].forEach((mesh, index) => {
      if (mesh?.material?.color) {
        mesh.material.color.setHex(index === 0 ? weaponVisual.color : weaponVisual.accent);
      }
    });
    const shieldVisual = SHIELD_VISUALS[shield?.id];
    if (shieldGroup) {
      shieldGroup.visible = Boolean(shieldVisual);
      shieldGroup.scale.setScalar(shieldVisual?.scale ?? 1);
    }
    if (shieldVisual) {
      [gearMeshes.shieldFace, gearMeshes.shieldRim, gearMeshes.shieldBoss].forEach((mesh, index) => {
        if (mesh?.material?.color) {
          mesh.material.color.setHex(index === 0 ? shieldVisual.color : shieldVisual.accent);
        }
      });
    }
  }
}
