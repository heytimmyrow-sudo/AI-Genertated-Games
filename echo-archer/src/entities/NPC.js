const { THREE } = window;

export class NPC {
  constructor(scene, world, options) {
    this.scene = scene;
    this.world = world;
    this.name = options.name;
    this.role = options.role ?? "";
    this.appearance = options.appearance ?? {};
    this.idleStyle = options.idleStyle ?? "calm";
    this.gestureSeed = (this.name?.length ?? 3) * 0.37 + (this.role?.length ?? 5) * 0.19;
    this.position = new THREE.Vector3(options.position[0], 0, options.position[1]);
    this.walkSpeed = options.walkSpeed ?? 1.35;
    this.motionAmount = 0;
    this.gestureTimer = 0;
    this.gestureKind = "idle";
    this.gestureDuration = 0.55;
    this.interactRadius = options.interactRadius ?? 4;
    this.group = this.createMesh();
    this.group.position.copy(this.position);
    this.group.position.y = world.terrain.getHeightAt(this.position.x, this.position.z);
    scene.add(this.group);
  }

  createMesh() {
    const group = new THREE.Group();
    const cloakMaterial = new THREE.MeshStandardMaterial({ color: this.appearance.cloak ?? 0x6a4c32, roughness: 0.84 });
    const hoodMaterial = new THREE.MeshStandardMaterial({ color: this.appearance.hood ?? 0x2d493b, roughness: 0.86 });
    const staffMaterial = new THREE.MeshStandardMaterial({ color: this.appearance.staff ?? 0x9a6d3d, roughness: 0.76 });
    const trimMaterial = new THREE.MeshStandardMaterial({ color: this.appearance.trim ?? 0xe6b75d, roughness: 0.52, metalness: 0.14, emissive: 0x2a1700, emissiveIntensity: 0.08 });
    const featherMaterial = new THREE.MeshStandardMaterial({ color: this.appearance.feather ?? 0xf0c66a, roughness: 0.62, emissive: 0x251500, emissiveIntensity: 0.05 });
    const role = this.role.toLowerCase();
    const bodyType = this.getBodyType();
    const accessoryMeshes = [];

    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.34, 0.92, 6, 12), cloakMaterial);
    body.position.y = 0.9;
    body.scale.set(bodyType.width, bodyType.height, bodyType.depth);
    body.castShadow = true;
    group.add(body);

    const cloak = new THREE.Mesh(new THREE.ConeGeometry(0.46, 0.72, 7), cloakMaterial);
    cloak.position.y = 0.56;
    cloak.scale.set(0.82, 1, 0.7);
    cloak.castShadow = true;
    group.add(cloak);

    const longCape = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.96, 7), cloakMaterial);
    longCape.position.set(0, 0.78, -0.18);
    longCape.scale.set(0.82, 1, 0.48);
    longCape.rotation.x = -0.16;
    longCape.castShadow = true;
    group.add(longCape);

    const hood = new THREE.Mesh(new THREE.SphereGeometry(0.28, 14, 10), hoodMaterial);
    hood.position.y = 1.48;
    hood.scale.set(1, 0.9, 0.86);
    hood.castShadow = true;
    group.add(hood);

    const faceShadow = new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 7), new THREE.MeshStandardMaterial({ color: 0x15110d, roughness: 0.92 }));
    faceShadow.position.set(0, 1.43, 0.22);
    faceShadow.scale.set(1, 0.55, 0.32);
    group.add(faceShadow);

    const expressionMaterial = new THREE.MeshStandardMaterial({ color: 0xf0d7a5, roughness: 0.7 });
    [-1, 1].forEach((side) => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.016, 7, 5), expressionMaterial);
      eye.position.set(side * 0.055, 1.47, 0.315);
      eye.scale.set(1, 0.58, 0.45);
      group.add(eye);
    });

    const sash = new THREE.Mesh(new THREE.TorusGeometry(0.29, 0.018, 8, 22), trimMaterial);
    sash.position.y = 0.88;
    sash.rotation.x = Math.PI / 2;
    group.add(sash);

    const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 1.85, 8), staffMaterial);
    staff.position.set(0.42, 0.9, 0.08);
    staff.rotation.z = 0.12;
    staff.castShadow = true;
    group.add(staff);

    const marker = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.012, 8, 22), trimMaterial);
    marker.position.y = 1.86;
    marker.rotation.x = Math.PI / 2;
    group.add(marker);

    const staffGem = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), trimMaterial);
    staffGem.position.set(0.54, 1.78, 0.1);
    group.add(staffGem);

    const feather = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.32, 4), featherMaterial);
    feather.position.set(-0.18, 1.78, 0.05);
    feather.rotation.set(0.3, 0.1, -0.55);
    feather.castShadow = true;
    group.add(feather);

    if (this.role.includes("Archer")) {
      const bow = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.02, 7, 32, Math.PI * 1.42), staffMaterial);
      bow.position.set(-0.46, 1.0, -0.14);
      bow.rotation.set(0.08, 0.18, Math.PI / 2.08);
      bow.scale.set(0.68, 1.38, 1);
      bow.castShadow = true;
      group.add(bow);

      const string = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.95, 5), trimMaterial);
      string.position.set(-0.48, 1.02, -0.1);
      string.rotation.z = 0.08;
      group.add(string);

      const quiver = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.14, 0.62, 8), staffMaterial);
      quiver.position.set(0.08, 1.0, -0.32);
      quiver.rotation.set(-0.45, 0.12, 0.08);
      quiver.castShadow = true;
      group.add(quiver);

      for (let index = 0; index < 5; index += 1) {
        const arrow = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.54, 5), trimMaterial);
        arrow.position.set(-0.02 + index * 0.028, 1.34, -0.42);
        arrow.rotation.set(-0.52, 0.12, 0.05);
        group.add(arrow);
      }
    }

    if (this.appearance.badge) {
      const badge = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.012, 8, 18), trimMaterial);
      badge.position.set(0, 1.08, 0.31);
      badge.rotation.x = Math.PI / 2;
      group.add(badge);
    }

    if (role.includes("blacksmith") || role.includes("smith")) {
      const apron = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.54, 0.04), staffMaterial);
      apron.position.set(0, 0.78, 0.31);
      apron.rotation.x = -0.08;
      const hammer = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.32, 0.08), trimMaterial);
      hammer.position.set(-0.34, 0.78, 0.22);
      hammer.rotation.z = 0.28;
      group.add(apron, hammer);
      accessoryMeshes.push(hammer);
    } else if (role.includes("merchant") || role.includes("trader") || role.includes("supplier")) {
      const pack = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.5, 0.22), staffMaterial);
      pack.position.set(-0.18, 0.92, -0.38);
      pack.rotation.y = 0.18;
      const coin = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.018, 12), trimMaterial);
      coin.position.set(0.18, 1.02, 0.31);
      coin.rotation.x = Math.PI / 2;
      group.add(pack, coin);
      accessoryMeshes.push(pack, coin);
    } else if (role.includes("inn") || role.includes("tavern") || role.includes("cook")) {
      const apron = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.46, 0.035), new THREE.MeshStandardMaterial({ color: 0xe8d3a0, roughness: 0.82 }));
      apron.position.set(0, 0.78, 0.32);
      const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.045, 0.12, 8), trimMaterial);
      cup.position.set(0.32, 0.86, 0.22);
      cup.rotation.z = -0.22;
      group.add(apron, cup);
      accessoryMeshes.push(cup);
    } else if (role.includes("farmer") || role.includes("herbalist")) {
      const hat = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.2, 12), new THREE.MeshStandardMaterial({ color: 0xd7bd83, roughness: 0.86 }));
      hat.position.y = 1.72;
      hat.scale.set(1.2, 0.65, 1.0);
      const basket = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.16, 0.18, 8), staffMaterial);
      basket.position.set(-0.34, 0.72, 0.16);
      group.add(hat, basket);
      accessoryMeshes.push(hat, basket);
    } else if (role.includes("guard") || role.includes("watch") || role.includes("warden")) {
      const shoulderGuard = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.018, 8, 22, Math.PI), trimMaterial);
      shoulderGuard.position.set(0, 1.26, 0.02);
      shoulderGuard.rotation.set(Math.PI / 2, 0, 0);
      const pennant = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.28, 3), trimMaterial);
      pennant.position.set(0.5, 1.42, 0.08);
      pennant.rotation.z = -0.7;
      group.add(shoulderGuard, pennant);
      accessoryMeshes.push(pennant);
    } else if (role.includes("scout") || role.includes("explorer") || role.includes("cartographer") || role.includes("map")) {
      const satchel = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.24, 0.12), staffMaterial);
      satchel.position.set(-0.3, 0.82, 0.28);
      satchel.rotation.z = 0.08;
      const mapRoll = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.34, 8), new THREE.MeshStandardMaterial({ color: 0xe8d3a0, roughness: 0.82 }));
      mapRoll.position.set(0.28, 1.0, 0.26);
      mapRoll.rotation.z = 0.8;
      group.add(satchel, mapRoll);
      accessoryMeshes.push(satchel, mapRoll);
    }

    accessoryMeshes.forEach((mesh) => {
      mesh.userData.baseY = mesh.position.y;
      mesh.userData.baseRotY = mesh.rotation.y;
    });
    group.userData = { body, cloak, longCape, staff, staffGem, marker, accessoryMeshes };
    return group;
  }

  getBodyType() {
    const value = `${this.name ?? ""}${this.role ?? ""}`;
    let hash = 0;
    for (let index = 0; index < value.length; index += 1) {
      hash += value.charCodeAt(index) * (index + 1);
    }
    const width = 0.86 + (hash % 5) * 0.035;
    const height = 0.96 + (hash % 7) * 0.018;
    const depth = 0.72 + (hash % 3) * 0.035;
    return { width, height, depth };
  }

  update(player, context = {}) {
    this.gestureTimer = Math.max(0, this.gestureTimer - (context.deltaSeconds ?? 1 / 60));
    const toPlayer = player.group.position.clone().sub(this.group.position);
    toPlayer.y = 0;
    const nearPlayer = toPlayer.lengthSq() <= this.interactRadius * this.interactRadius;
    if (nearPlayer && toPlayer.lengthSq() > 0.001) {
      const yaw = Math.atan2(toPlayer.x, toPlayer.z);
      this.group.rotation.y = THREE.MathUtils.lerp(this.group.rotation.y, yaw, 0.08);
    } else if (context.lookAt) {
      const toFocus = new THREE.Vector3(context.lookAt.x, 0, context.lookAt.z).sub(this.group.position);
      toFocus.y = 0;
      if (toFocus.lengthSq() > 0.08) {
        const yaw = Math.atan2(toFocus.x, toFocus.z);
        this.group.rotation.y = THREE.MathUtils.lerp(this.group.rotation.y, yaw, 0.035);
      }
    }

    const time = performance.now() * 0.001 + this.gestureSeed;
    const { body, longCape, staff, staffGem, marker, accessoryMeshes = [] } = this.group.userData;
    const sitting = context.activity === "sit" || context.activity === "sleep";
    const working = context.activity === "work";
    const sheltering = context.activity === "shelter";
    const gesturing = this.gestureTimer > 0;
    const gestureAmount = gesturing ? Math.sin((this.gestureTimer / Math.max(this.gestureDuration, 0.001)) * Math.PI) : 0;
    if (longCape) {
      longCape.rotation.x = -0.16 + Math.sin(time * (sheltering ? 2.6 : 1.4)) * (sheltering ? 0.045 : 0.025);
    }
    if (staffGem) {
      staffGem.scale.setScalar(1 + Math.sin(time * 2.2) * 0.08);
    }
    if (body) {
      const breathe = 1 + Math.sin(time * 1.1) * 0.018;
      body.scale.y = (sitting ? 0.74 : working ? 1.01 : 1.03) * breathe;
      body.position.y = THREE.MathUtils.lerp(body.position.y, sitting ? 0.72 : 0.9, 0.06);
    }
    if (staff) {
      const baseGesture = gesturing ? 0.22 : nearPlayer ? 0.1 : working ? 0.07 : sheltering ? 0.045 : 0.025;
      staff.rotation.z = 0.12 + Math.sin(time * (gesturing ? 4.4 : 1.8)) * baseGesture;
      staff.rotation.x = THREE.MathUtils.lerp(staff.rotation.x, gesturing ? 0.16 + gestureAmount * 0.16 : 0, 0.12);
      staff.position.y = 0.9 + gestureAmount * (this.gestureKind === "wave" ? 0.12 : this.gestureKind === "work" ? -0.08 : 0.04);
    }
    if (marker) {
      const pulse = nearPlayer ? 1 + Math.sin(time * 4) * 0.1 : 1;
      marker.scale.setScalar(pulse);
    }
    accessoryMeshes.forEach((mesh, index) => {
      mesh.rotation.y = (mesh.userData.baseRotY ?? 0) + Math.sin(time * 1.1 + index) * 0.018;
      mesh.position.y = (mesh.userData.baseY ?? mesh.position.y) + (working ? Math.sin(time * 2.4 + index) * 0.012 : 0) + (this.gestureKind === "work" ? gestureAmount * 0.035 : 0);
      mesh.rotation.z += gestureAmount * (this.gestureKind === "point" ? 0.08 : this.gestureKind === "wave" ? 0.05 : 0);
    });
    if (!nearPlayer) {
      const idleSway = sitting ? 0.004 : this.idleStyle === "restless" ? 0.035 : this.idleStyle === "watchful" ? 0.018 : 0.01;
      const walkSway = Math.sin(time * 5.8) * 0.035 * this.motionAmount;
      const workSway = working ? Math.sin(time * 2.2) * 0.018 : 0;
      this.group.rotation.z = Math.sin(time * 0.8) * idleSway + walkSway + workSway;
    } else {
      this.group.rotation.z = THREE.MathUtils.lerp(this.group.rotation.z, 0, 0.12);
    }
    this.motionAmount = THREE.MathUtils.lerp(this.motionAmount, 0, 0.08);
  }

  playGesture(kind = "talk") {
    this.gestureKind = kind;
    this.gestureDuration = kind === "work" ? 0.75 : kind === "wave" ? 0.68 : 0.55;
    this.gestureTimer = this.gestureDuration;
  }

  isPlayerNear(player) {
    return this.group.position.distanceTo(player.group.position) <= this.interactRadius;
  }

  moveTo(x, z, blend = 1) {
    const target = new THREE.Vector3(x, this.world.terrain.getHeightAt(x, z), z);
    const toTarget = target.clone().sub(this.group.position);
    toTarget.y = 0;
    const distance = toTarget.length();
    this.position.copy(target);
    if (blend >= 1) {
      this.group.position.copy(this.position);
      this.motionAmount = 0;
      return;
    }

    if (distance > 0.04) {
      const step = Math.min(distance, this.walkSpeed * Math.max(0.016, blend));
      toTarget.normalize();
      this.group.position.addScaledVector(toTarget, step);
      const yaw = Math.atan2(toTarget.x, toTarget.z);
      this.group.rotation.y = THREE.MathUtils.lerp(this.group.rotation.y, yaw, 0.12);
      this.motionAmount = THREE.MathUtils.lerp(this.motionAmount, 1, 0.18);
    }
    const y = this.world.terrain.getHeightAt(this.group.position.x, this.group.position.z);
    this.group.position.y = THREE.MathUtils.lerp(this.group.position.y, y, 0.45);
  }
}
