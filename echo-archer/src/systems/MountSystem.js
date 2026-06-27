export class MountSystem {
  constructor(world, inventory = null, scene = null, player = null, ui = null) {
    this.world = world;
    this.inventory = inventory;
    this.scene = scene;
    this.player = player;
    this.ui = ui;
    this.activeMount = null;
    this.mountSlot = "no-mount";
    this.equipmentSlot = null;
    this.spawnPoint = world.mountStable?.spawnPoint ?? null;
    this.riding = false;
    this.visualSpeed = 0;
    this.visualTime = 0;
    this.mountStats = {
      horse: { name: "Horse", speedMultiplier: 1.52, color: 0x7a4f32 },
      "forest-elk": { name: "Forest Elk", speedMultiplier: 1.42, color: 0x6f5d3d },
      "arrowcrest-stag": { name: "Arrowcrest Stag", speedMultiplier: 1.58, color: 0x8f6f3f },
    };
  }

  update(input = null, player = this.player, deltaSeconds = 1 / 60) {
    this.mountSlot = this.inventory?.equipped?.mounts ?? this.mountSlot;
    this.equipmentSlot = this.inventory?.equipped?.mountGear ?? this.equipmentSlot;
    if (input?.wasPressed?.("KeyR")) {
      this.toggleMount(player);
    }
    this.updateMountVisual(player, deltaSeconds);
  }

  canSpawnMount() {
    return Boolean(this.spawnPoint && this.mountSlot && this.mountSlot !== "no-mount");
  }

  toggleMount(player = this.player) {
    if (!this.canSpawnMount() || !player || !this.scene) {
      this.showToast("Equip a mount at the stable first");
      return;
    }
    if (!this.activeMount) {
      this.spawnMount();
    }
    const distance = player.group.position.distanceTo(this.activeMount.position);
    if (!this.riding && distance > 6.5) {
      this.activeMount.position.copy(player.group.position).add(new window.THREE.Vector3(1.8, -0.75, 1.8));
    }
    this.riding = !this.riding;
    const stats = this.mountStats[this.mountSlot] ?? this.mountStats.horse;
    player.setMounted?.(this.riding, stats.speedMultiplier);
    this.showToast(this.riding ? `Riding ${stats.name}` : `${stats.name} waiting`);
  }

  spawnMount() {
    const { THREE } = window;
    const stats = this.mountStats[this.mountSlot] ?? this.mountStats.horse;
    const group = new THREE.Group();
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: stats.color, roughness: 0.82 });
    const maneMaterial = new THREE.MeshStandardMaterial({ color: 0x2d2118, roughness: 0.88 });
    const trimMaterial = new THREE.MeshStandardMaterial({ color: 0xe6b75d, roughness: 0.52, metalness: 0.12 });
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.42, 1.1, 6, 12), bodyMaterial);
    body.rotation.z = Math.PI / 2;
    body.position.y = 0.9;
    body.scale.set(1.35, 0.82, 0.72);
    body.castShadow = true;
    const neck = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.7, 5, 8), bodyMaterial);
    neck.position.set(0.62, 1.18, 0);
    neck.rotation.z = -0.45;
    neck.castShadow = true;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.25, 12, 8), bodyMaterial);
    head.position.set(0.95, 1.42, 0);
    head.scale.set(1.05, 0.82, 0.7);
    head.castShadow = true;
    const saddle = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.12, 0.54), trimMaterial);
    saddle.position.set(-0.08, 1.27, 0);
    saddle.castShadow = true;
    const chestStrap = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.018, 8, 20), trimMaterial);
    chestStrap.position.set(0.1, 1.02, 0);
    chestStrap.rotation.x = Math.PI / 2;
    const tail = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.58, 5, 8), maneMaterial);
    tail.position.set(-0.86, 0.98, 0);
    tail.rotation.z = Math.PI / 2.55;
    group.add(body, neck, head, saddle, chestStrap, tail);
    group.userData.legs = [];
    [-0.55, -0.1, 0.32, 0.72].forEach((x, index) => {
      const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.72, 5, 8), maneMaterial);
      leg.position.set(x, 0.43, index % 2 === 0 ? -0.24 : 0.24);
      leg.castShadow = true;
      group.add(leg);
      group.userData.legs.push({ mesh: leg, baseX: x, side: index % 2 === 0 ? -1 : 1, phase: index * Math.PI * 0.5 });
    });
    if (this.mountSlot === "forest-elk" || this.mountSlot === "arrowcrest-stag") {
      [-1, 1].forEach((side) => {
        const antler = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.55, 5), trimMaterial);
        antler.position.set(1.05, 1.72, side * 0.13);
        antler.rotation.set(0.45, 0, side * 0.32);
        antler.castShadow = true;
        group.add(antler);
      });
    }
    if (this.mountSlot === "arrowcrest-stag") {
      const crest = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.42, 5), trimMaterial);
      crest.position.set(0.96, 1.62, 0);
      crest.rotation.z = -0.3;
      group.add(crest);
    }
    group.position.copy(this.spawnPoint);
    group.position.y = this.world.terrain.getHeightAt(group.position.x, group.position.z);
    group.userData.mountBob = 0;
    group.userData.neck = neck;
    group.userData.head = head;
    group.userData.body = body;
    group.userData.tail = tail;
    group.userData.saddle = saddle;
    this.scene.add(group);
    this.activeMount = group;
  }

  updateMountVisual(player = this.player, deltaSeconds = 1 / 60) {
    if (!this.activeMount) {
      return;
    }
    const { THREE } = window;
    this.visualTime += deltaSeconds;
    if (this.riding && player) {
      const target = player.group.position.clone();
      target.y = this.world.terrain.getHeightAt(target.x, target.z);
      const previous = this.activeMount.position.clone();
      this.activeMount.position.lerp(target, 1 - Math.exp(-18 * deltaSeconds));
      const moved = previous.distanceTo(this.activeMount.position);
      this.visualSpeed = THREE.MathUtils.lerp(this.visualSpeed, Math.min(1, moved / Math.max(deltaSeconds, 0.001) * 0.18), 1 - Math.exp(-8 * deltaSeconds));
      const yawDelta = Math.atan2(
        Math.sin(player.group.rotation.y - this.activeMount.rotation.y),
        Math.cos(player.group.rotation.y - this.activeMount.rotation.y),
      );
      this.activeMount.rotation.y += yawDelta * (1 - Math.exp(-8 * deltaSeconds));
    } else {
      const y = this.world.terrain.getHeightAt(this.activeMount.position.x, this.activeMount.position.z);
      this.activeMount.position.y = THREE.MathUtils.lerp(this.activeMount.position.y, y + Math.sin(performance.now() * 0.002) * 0.025, 1 - Math.exp(-7 * deltaSeconds));
      this.visualSpeed = THREE.MathUtils.lerp(this.visualSpeed, 0, 1 - Math.exp(-4 * deltaSeconds));
    }
    this.animateMount(deltaSeconds);
  }

  animateMount(deltaSeconds = 1 / 60) {
    if (!this.activeMount) {
      return;
    }
    const { THREE } = window;
    const time = performance.now() * 0.001;
    const gait = time * (5.5 + this.visualSpeed * 6.5);
    const breathing = Math.sin(time * 1.2) * 0.018;
    this.activeMount.rotation.z = THREE.MathUtils.lerp(this.activeMount.rotation.z, Math.sin(gait * 0.5) * 0.018 * this.visualSpeed, 1 - Math.exp(-8 * deltaSeconds));
    this.activeMount.userData.legs?.forEach(({ mesh, phase, side }) => {
      const stride = Math.sin(gait + phase) * this.visualSpeed;
      mesh.rotation.x = THREE.MathUtils.lerp(mesh.rotation.x, stride * 0.42, 0.18);
      mesh.rotation.z = THREE.MathUtils.lerp(mesh.rotation.z, side * 0.03 + stride * 0.08, 0.18);
    });
    if (this.activeMount.userData.body) {
      this.activeMount.userData.body.scale.y = 0.82 + breathing;
    }
    if (this.activeMount.userData.neck) {
      this.activeMount.userData.neck.rotation.z = -0.45 + Math.sin(gait * 0.5) * 0.035 * this.visualSpeed + Math.sin(time * 0.8) * 0.018 * (1 - this.visualSpeed);
    }
    if (this.activeMount.userData.head) {
      this.activeMount.userData.head.position.y = 1.42 + Math.sin(gait * 0.5 + 0.4) * 0.025 * this.visualSpeed + Math.sin(time * 1.1) * 0.014 * (1 - this.visualSpeed);
    }
    if (this.activeMount.userData.tail) {
      this.activeMount.userData.tail.rotation.z = Math.PI / 2.55 + Math.sin(time * 2.6) * (0.08 + this.visualSpeed * 0.12);
    }
  }

  getSpawnPlan() {
    return {
      ready: this.canSpawnMount(),
      mount: this.mountSlot,
      equipment: this.equipmentSlot,
      spawnPoint: this.spawnPoint,
      riding: this.riding,
    };
  }

  showToast(text) {
    if (!this.ui?.toast) {
      return;
    }
    this.ui.toast.textContent = text;
    this.ui.toast.classList.remove("visible");
    void this.ui.toast.offsetWidth;
    this.ui.toast.classList.add("visible");
  }
}
