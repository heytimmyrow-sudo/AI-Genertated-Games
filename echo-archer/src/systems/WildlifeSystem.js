const { THREE } = window;

const WILDLIFE = [
  { type: "deer", position: [18, 7], radius: 13 },
  { type: "deer", position: [45, 46], radius: 14 },
  { type: "rabbit", position: [-7, 10], radius: 9 },
  { type: "rabbit", position: [24, 21], radius: 8 },
  { type: "rabbit", position: [55, 3], radius: 10 },
  { type: "bird", position: [-2, 30], radius: 16 },
  { type: "bird", position: [38, 14], radius: 16 },
  { type: "bird", position: [52, 56], radius: 16 },
  { type: "owl", position: [91, 88], radius: 15 },
  { type: "squirrel", position: [75, 82], radius: 8 },
  { type: "squirrel", position: [110, 92], radius: 8 },
  { type: "butterfly", position: [84, 104], radius: 9 },
  { type: "firefly", position: [114, 108], radius: 10 },
  { type: "firefly", position: [120, 70], radius: 10 },
];

export class WildlifeSystem {
  constructor(scene, world) {
    this.scene = scene;
    this.world = world;
    this.animals = WILDLIFE.map((config, index) => this.createAnimal(config, index));
    this.panicTimer = 0;
    window.addEventListener("echo-archer:sound", (event) => {
      if (["bowRelease", "enemyHit", "powerfulHit"].includes(event.detail?.name)) {
        this.panicTimer = 2.4;
      }
    });
  }

  createAnimal(config, index) {
    const group = new THREE.Group();
    const material = new THREE.MeshStandardMaterial({
      color: this.getAnimalColor(config.type),
      roughness: 0.82,
      emissive: config.type === "firefly" ? 0x75ff9e : 0x000000,
      emissiveIntensity: config.type === "firefly" ? 0.58 : 0,
    });
    const dark = new THREE.MeshStandardMaterial({ color: 0x3d3327, roughness: 0.9 });
    if (config.type === "bird" || config.type === "owl" || config.type === "butterfly" || config.type === "firefly") {
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), material);
      body.scale.setScalar(config.type === "firefly" ? 0.55 : config.type === "butterfly" ? 0.48 : 1);
      const wing = new THREE.Mesh(new THREE.BoxGeometry(config.type === "owl" ? 0.72 : 0.5, 0.035, config.type === "butterfly" ? 0.26 : 0.16), material);
      group.add(body, wing);
      group.userData.wing = wing;
    } else {
      const isDeer = config.type === "deer";
      const body = new THREE.Mesh(new THREE.CapsuleGeometry(isDeer ? 0.18 : 0.12, isDeer ? 0.58 : 0.28, 5, 8), material);
      body.rotation.z = Math.PI / 2;
      body.position.y = isDeer ? 0.55 : 0.24;
      const head = new THREE.Mesh(new THREE.SphereGeometry(isDeer ? 0.16 : 0.11, 8, 6), material);
      head.position.set(0.38, isDeer ? 0.72 : 0.34, 0);
      group.add(body, head);
      if (isDeer) {
        for (const side of [-1, 1]) {
          const antler = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.22, 4), dark);
          antler.position.set(0.44, 0.94, side * 0.08);
          antler.rotation.z = -0.28;
          group.add(antler);
        }
      }
    }
    group.traverse((child) => {
      if (child.isMesh) child.castShadow = true;
    });
    group.position.set(config.position[0], 0, config.position[1]);
    this.placeOnGround(group, config.type);
    this.scene.add(group);
    return {
      ...config,
      group,
      home: new THREE.Vector3(config.position[0], 0, config.position[1]),
      target: new THREE.Vector3(config.position[0], 0, config.position[1]),
      timer: index * 0.7,
    };
  }

  update(deltaSeconds, player) {
    this.panicTimer = Math.max(0, this.panicTimer - deltaSeconds);
    this.animals.forEach((animal) => this.updateAnimal(animal, deltaSeconds, player));
  }

  updateAnimal(animal, deltaSeconds, player) {
    animal.timer -= deltaSeconds;
    const playerDistance = animal.group.position.distanceTo(player.group.position);
    const flee = playerDistance < (animal.type === "bird" ? 8 : 6) || this.panicTimer > 0;
    if (animal.timer <= 0 || flee) {
      animal.timer = flee ? 0.8 : 3 + Math.random() * 3;
      const away = animal.group.position.clone().sub(player.group.position).setY(0).normalize();
      const angle = Math.random() * Math.PI * 2;
      const wander = new THREE.Vector3(Math.sin(angle), 0, Math.cos(angle));
      const direction = flee ? away : wander;
      animal.target.copy(animal.group.position).add(direction.multiplyScalar(flee ? 7 : 4));
      const fromHome = animal.target.clone().sub(animal.home);
      if (fromHome.length() > animal.radius) {
        fromHome.setLength(animal.radius);
        animal.target.copy(animal.home).add(fromHome);
      }
    }

    const flying = ["bird", "owl", "butterfly", "firefly"].includes(animal.type);
    const speed = flying ? (animal.type === "owl" ? 2.7 : 3.2) : animal.type === "deer" ? 2.2 : 2.8;
    const direction = animal.target.clone().sub(animal.group.position);
    direction.y = 0;
    if (direction.lengthSq() > 0.05) {
      direction.normalize();
      animal.group.position.addScaledVector(direction, speed * deltaSeconds * (flee ? 1.6 : 1));
      animal.group.rotation.y = Math.atan2(direction.x, direction.z);
    }
    this.placeOnGround(animal.group, animal.type);
    if (animal.group.userData.wing) {
      animal.group.userData.wing.rotation.z = Math.sin(performance.now() * 0.015) * 0.35;
    }
  }

  placeOnGround(group, type) {
    const flying = ["bird", "owl", "butterfly", "firefly"].includes(type);
    const hover = type === "owl" ? 3.4 : type === "butterfly" ? 1.3 : type === "firefly" ? 1.6 : 2.8;
    group.position.y = this.world.terrain.getHeightAt(group.position.x, group.position.z) + (flying ? hover : 0);
  }

  getAnimalColor(type) {
    if (type === "deer") return 0x9a7045;
    if (type === "rabbit") return 0xb8ad90;
    if (type === "owl") return 0x8a795f;
    if (type === "squirrel") return 0xa46e42;
    if (type === "butterfly") return 0xc5d8ff;
    if (type === "firefly") return 0x9dffd0;
    return 0x6f8fa8;
  }
}
