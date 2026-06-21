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

    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.34, 0.92, 6, 12), cloakMaterial);
    body.position.y = 0.9;
    body.scale.set(0.92, 1.03, 0.78);
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

    group.userData = { body, cloak, longCape, staff, staffGem, marker };
    return group;
  }

  update(player) {
    const toPlayer = player.group.position.clone().sub(this.group.position);
    toPlayer.y = 0;
    if (toPlayer.lengthSq() > 0.001) {
      const yaw = Math.atan2(toPlayer.x, toPlayer.z);
      this.group.rotation.y = THREE.MathUtils.lerp(this.group.rotation.y, yaw, 0.08);
    }

    const time = performance.now() * 0.001 + this.gestureSeed;
    const nearPlayer = toPlayer.lengthSq() <= this.interactRadius * this.interactRadius;
    const { body, longCape, staff, staffGem, marker } = this.group.userData;
    if (longCape) {
      longCape.rotation.x = -0.16 + Math.sin(time * 1.4) * 0.025;
    }
    if (staffGem) {
      staffGem.scale.setScalar(1 + Math.sin(time * 2.2) * 0.08);
    }
    if (body) {
      const breathe = 1 + Math.sin(time * 1.1) * 0.018;
      body.scale.y = 1.03 * breathe;
    }
    if (staff) {
      const gestureAmount = nearPlayer ? 0.1 : 0.025;
      staff.rotation.z = 0.12 + Math.sin(time * 1.8) * gestureAmount;
    }
    if (marker) {
      const pulse = nearPlayer ? 1 + Math.sin(time * 4) * 0.1 : 1;
      marker.scale.setScalar(pulse);
    }
    if (!nearPlayer) {
      const idleSway = this.idleStyle === "restless" ? 0.035 : this.idleStyle === "watchful" ? 0.018 : 0.01;
      this.group.rotation.z = Math.sin(time * 0.8) * idleSway;
    } else {
      this.group.rotation.z = THREE.MathUtils.lerp(this.group.rotation.z, 0, 0.12);
    }
  }

  isPlayerNear(player) {
    return this.group.position.distanceTo(player.group.position) <= this.interactRadius;
  }

  moveTo(x, z, blend = 1) {
    const y = this.world.terrain.getHeightAt(x, z);
    this.position.set(x, y, z);
    if (blend >= 1) {
      this.group.position.copy(this.position);
      return;
    }
    this.group.position.lerp(this.position, blend);
    this.group.position.y = y;
  }
}
