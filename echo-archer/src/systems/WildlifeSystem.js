const { THREE } = window;

const WILDLIFE = [
  { type: "deer", position: [18, 7], radius: 13 },
  { type: "deer", position: [-24, 20], radius: 12 },
  { type: "deer", position: [45, 46], radius: 14 },
  { type: "deer", position: [86, 92], radius: 15 },
  { type: "deer", position: [106, -154], radius: 18 },
  { type: "rabbit", position: [-7, 10], radius: 9 },
  { type: "rabbit", position: [-31, 14], radius: 8 },
  { type: "rabbit", position: [24, 21], radius: 8 },
  { type: "rabbit", position: [55, 3], radius: 10 },
  { type: "rabbit", position: [-48, -143], radius: 10 },
  { type: "rabbit", position: [132, -138], radius: 10 },
  { type: "squirrel", position: [75, 82], radius: 8 },
  { type: "squirrel", position: [110, 92], radius: 8 },
  { type: "squirrel", position: [-43, 35], radius: 7 },
  { type: "squirrel", position: [-18, 24], radius: 7 },
  { type: "squirrel", position: [30, 18], radius: 7 },
  { type: "bird", position: [-2, 30], radius: 16 },
  { type: "bird", position: [38, 14], radius: 16 },
  { type: "bird", position: [52, 56], radius: 16 },
  { type: "bird", position: [-38, 18], radius: 14 },
  { type: "bird", position: [-128, -134], radius: 22 },
  { type: "owl", position: [91, 88], radius: 15 },
  { type: "owl", position: [-54, -140], radius: 16 },
  { type: "duck", position: [62, 33], radius: 7 },
  { type: "duck", position: [-126, -130], radius: 9 },
  { type: "butterfly", position: [84, 104], radius: 9 },
  { type: "butterfly", position: [-28, 4], radius: 8 },
  { type: "butterfly", position: [27, 20], radius: 8 },
  { type: "butterfly", position: [-42, 15], radius: 8 },
  { type: "dragonfly", position: [62, 33], radius: 8 },
  { type: "dragonfly", position: [-74, -62], radius: 10 },
  { type: "firefly", position: [114, 108], radius: 10 },
  { type: "firefly", position: [120, 70], radius: 10 },
  { type: "fish", position: [62, 33], radius: 8 },
  { type: "fish", position: [-126, -132], radius: 12 },
];

const FLYING_TYPES = new Set(["bird", "owl", "butterfly", "firefly", "dragonfly"]);
const AQUATIC_TYPES = new Set(["fish"]);

const ANIMAL_TRAITS = {
  deer: { speed: 2.2, fleeDistance: 7.5, hover: 0, scale: 1, restChance: 0.18, eatChance: 0.36, drinkChance: 0.1 },
  rabbit: { speed: 2.8, fleeDistance: 6, hover: 0, scale: 1, restChance: 0.28, eatChance: 0.3, drinkChance: 0.08 },
  squirrel: { speed: 2.65, fleeDistance: 5.8, hover: 0.05, scale: 0.82, restChance: 0.24, eatChance: 0.26, drinkChance: 0.06 },
  duck: { speed: 1.35, fleeDistance: 5.6, hover: 0.08, scale: 1, restChance: 0.2, eatChance: 0.22, drinkChance: 0.24 },
  fish: { speed: 1.15, fleeDistance: 4.2, hover: -0.18, scale: 1, restChance: 0.16, eatChance: 0.12, drinkChance: 0 },
  bird: { speed: 3.2, fleeDistance: 8, hover: 2.8, scale: 1, restChance: 0.08, eatChance: 0.08, drinkChance: 0.05 },
  owl: { speed: 2.7, fleeDistance: 8, hover: 3.4, scale: 1.08, restChance: 0.16, eatChance: 0.04, drinkChance: 0.04 },
  butterfly: { speed: 1.45, fleeDistance: 4.4, hover: 1.3, scale: 0.48, restChance: 0.05, eatChance: 0.16, drinkChance: 0.02 },
  dragonfly: { speed: 2.15, fleeDistance: 4.8, hover: 1.1, scale: 0.42, restChance: 0.04, eatChance: 0.08, drinkChance: 0.04 },
  firefly: { speed: 1.2, fleeDistance: 4.2, hover: 1.6, scale: 0.55, restChance: 0.08, eatChance: 0.06, drinkChance: 0 },
};

export class WildlifeSystem {
  constructor(scene, world) {
    this.scene = scene;
    this.world = world;
    this.animals = WILDLIFE.map((config, index) => this.createAnimal(config, index));
    this.panicTimer = 0;
    this.weatherHideTimer = 0;
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
    if (FLYING_TYPES.has(config.type)) {
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), material);
      body.scale.setScalar(ANIMAL_TRAITS[config.type]?.scale ?? 1);
      const wingLength = config.type === "owl" ? 0.72 : config.type === "dragonfly" ? 0.62 : 0.5;
      const wingDepth = config.type === "butterfly" ? 0.26 : config.type === "dragonfly" ? 0.1 : 0.16;
      const wing = new THREE.Mesh(new THREE.BoxGeometry(wingLength, 0.035, wingDepth), material);
      group.add(body, wing);
      group.userData.wing = wing;
    } else if (config.type === "duck") {
      const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.15, 0.38, 5, 8), material);
      body.rotation.z = Math.PI / 2;
      body.position.y = 0.22;
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), material);
      head.position.set(0.32, 0.36, 0);
      const bill = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.16, 5), new THREE.MeshStandardMaterial({ color: 0xe6a13f, roughness: 0.7 }));
      bill.position.set(0.43, 0.35, 0);
      bill.rotation.z = -Math.PI / 2;
      group.add(body, head, bill);
    } else if (config.type === "fish") {
      const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.34, 4, 8), material);
      body.rotation.z = Math.PI / 2;
      const tail = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.18, 3), material);
      tail.position.set(-0.28, 0, 0);
      tail.rotation.z = Math.PI / 2;
      group.add(body, tail);
      group.userData.tail = tail;
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
      } else if (config.type === "squirrel") {
        const tail = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.34, 4, 8), material);
        tail.position.set(-0.28, 0.38, -0.02);
        tail.rotation.z = -0.72;
        group.add(tail);
        group.userData.tail = tail;
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
      state: "wander",
      stateTimer: 1 + (index % 4),
      socialTimer: 0,
      socialTarget: null,
      seed: index * 0.73,
      skippedTime: 0,
    };
  }

  update(deltaSeconds, player) {
    this.panicTimer = Math.max(0, this.panicTimer - deltaSeconds);
    this.animals.forEach((animal) => this.updateAnimal(animal, deltaSeconds, player));
  }

  updateAnimal(animal, deltaSeconds, player) {
    const distanceToPlayer = animal.group.position.distanceTo(player.group.position);
    animal.group.visible = distanceToPlayer < 165;
    if (!animal.group.visible) {
      animal.skippedTime = (animal.skippedTime ?? 0) + deltaSeconds;
      if (animal.skippedTime < 0.75) {
        return;
      }
      deltaSeconds = animal.skippedTime;
      animal.skippedTime = 0;
    }

    animal.timer -= deltaSeconds;
    animal.stateTimer -= deltaSeconds;
    const playerDistance = animal.group.position.distanceTo(player.group.position);
    const traits = ANIMAL_TRAITS[animal.type] ?? ANIMAL_TRAITS.rabbit;
    const rain = this.world.lastWeatherProfile?.rain ?? 0;
    const night = this.world.dayNightState?.nightFactor ?? 0;
    const weatherHide = rain > 0.35 && !["duck", "fish", "frog", "firefly"].includes(animal.type);
    const nocturnal = animal.type === "owl" || animal.type === "firefly";
    const nightRest = night > 0.58 && !nocturnal && !AQUATIC_TYPES.has(animal.type);
    const flee = playerDistance < traits.fleeDistance || this.panicTimer > 0;
    animal.socialTimer = Math.max(0, (animal.socialTimer ?? 0) - deltaSeconds);

    if (flee) {
      animal.state = "flee";
      animal.stateTimer = 0.8;
      animal.socialTarget = null;
    } else if ((weatherHide || nightRest) && animal.state !== "rest") {
      animal.state = "rest";
      animal.stateTimer = nightRest ? 5 + Math.random() * 4 : 3 + Math.random() * 2;
      animal.target.copy(animal.home);
    } else if (animal.stateTimer <= 0) {
      animal.socialTarget = this.findNearbyAnimal(animal);
      animal.state = animal.socialTarget ? "social" : this.pickState(animal.type);
      animal.stateTimer = animal.state === "rest" ? 2.6 + Math.random() * 3 : animal.state === "eat" ? 1.8 + Math.random() * 2.2 : 3 + Math.random() * 3;
      if (animal.state === "drink") animal.stateTimer = 1.8 + Math.random() * 1.8;
      if (animal.state === "social") animal.stateTimer = 1.6 + Math.random() * 1.8;
    }

    if (animal.timer <= 0 || flee) {
      animal.timer = flee ? 0.55 : ["rest", "eat", "drink", "social"].includes(animal.state) ? 1.6 : 3 + Math.random() * 3;
      const away = animal.group.position.clone().sub(player.group.position).setY(0).normalize();
      const angle = Math.random() * Math.PI * 2;
      const wander = new THREE.Vector3(Math.sin(angle), 0, Math.cos(angle));
      const direction = flee ? away : wander;
      const distance = flee ? 7 : animal.state === "wander" ? 4 : animal.state === "drink" ? 1.2 : 0.6;
      if (animal.state === "social" && animal.socialTarget) {
        animal.target.copy(animal.socialTarget.group.position);
      } else {
        animal.target.copy(animal.group.position).add(direction.multiplyScalar(distance));
      }
      const fromHome = animal.target.clone().sub(animal.home);
      if (fromHome.length() > animal.radius) {
        fromHome.setLength(animal.radius);
        animal.target.copy(animal.home).add(fromHome);
      }
    }

    const flying = FLYING_TYPES.has(animal.type);
    const speed = traits.speed;
    const direction = animal.target.clone().sub(animal.group.position);
    direction.y = 0;
    if (direction.lengthSq() > 0.05 && !["rest", "eat", "drink"].includes(animal.state)) {
      direction.normalize();
      animal.group.position.addScaledVector(direction, speed * deltaSeconds * (flee ? 1.6 : animal.state === "social" ? 0.45 : 1));
      animal.group.rotation.y = Math.atan2(direction.x, direction.z);
    } else if (animal.state === "social" && animal.socialTarget) {
      const toFriend = animal.socialTarget.group.position.clone().sub(animal.group.position);
      toFriend.y = 0;
      if (toFriend.lengthSq() > 0.01) {
        animal.group.rotation.y = THREE.MathUtils.lerp(animal.group.rotation.y, Math.atan2(toFriend.x, toFriend.z), 0.04);
      }
    }
    this.placeOnGround(animal.group, animal.type);
    this.applyStateAnimation(animal, deltaSeconds);
    if (animal.group.userData.wing) {
      const wingSpeed = animal.type === "dragonfly" ? 0.05 : animal.type === "butterfly" ? 0.022 : 0.015;
      animal.group.userData.wing.rotation.z = Math.sin(performance.now() * wingSpeed + animal.seed) * (animal.type === "dragonfly" ? 0.65 : 0.35);
    }
  }

  pickState(type) {
    const traits = ANIMAL_TRAITS[type] ?? ANIMAL_TRAITS.rabbit;
    const roll = Math.random();
    if (roll < traits.restChance) return "rest";
    if (roll < traits.restChance + traits.eatChance) return "eat";
    if (roll < traits.restChance + traits.eatChance + traits.drinkChance) return "drink";
    return "wander";
  }

  findNearbyAnimal(animal) {
    if (animal.socialTimer > 0 || FLYING_TYPES.has(animal.type) || AQUATIC_TYPES.has(animal.type)) {
      return null;
    }
    const friend = this.animals.find((candidate) => (
      candidate !== animal
      && candidate.type === animal.type
      && candidate.group.visible
      && candidate.group.position.distanceTo(animal.group.position) < 5.5
      && candidate.state !== "flee"
    ));
    if (friend && Math.random() < 0.32) {
      animal.socialTimer = 8;
      return friend;
    }
    return null;
  }

  applyStateAnimation(animal) {
    const time = performance.now() * 0.001 + animal.seed;
    const resting = animal.state === "rest";
    const eating = animal.state === "eat";
    const drinking = animal.state === "drink";
    const social = animal.state === "social";
    animal.group.rotation.z = THREE.MathUtils.lerp(animal.group.rotation.z, resting ? Math.sin(time * 0.8) * 0.03 : social ? Math.sin(time * 2.4) * 0.018 : 0, 0.08);
    animal.group.rotation.x = THREE.MathUtils.lerp(animal.group.rotation.x, drinking ? -0.18 : eating ? -0.08 : 0, 0.08);
    animal.group.scale.y = THREE.MathUtils.lerp(animal.group.scale.y, resting ? 0.86 : eating ? 0.94 + Math.sin(time * 5.2) * 0.025 : drinking ? 0.91 : 1, 0.08);
    animal.group.scale.x = THREE.MathUtils.lerp(animal.group.scale.x, resting ? 1.08 : 1, 0.08);
    if (animal.type === "firefly") {
      animal.group.traverse((child) => {
        if (child.material?.emissiveIntensity !== undefined) {
          child.material.emissiveIntensity = 0.42 + (this.world.dayNightState?.nightFactor ?? 0) * 0.58 + Math.sin(time * 3) * 0.08;
        }
      });
    }
    if (animal.group.userData.tail) {
      animal.group.userData.tail.rotation.z += Math.sin(time * 4.5) * 0.01;
    }
  }

  placeOnGround(group, type) {
    const flying = FLYING_TYPES.has(type);
    const aquatic = AQUATIC_TYPES.has(type);
    const traits = ANIMAL_TRAITS[type] ?? ANIMAL_TRAITS.rabbit;
    const hoverBob = (flying || aquatic || type === "duck") ? Math.sin(performance.now() * 0.002 + group.position.x) * 0.08 : 0;
    group.position.y = this.world.terrain.getHeightAt(group.position.x, group.position.z) + (flying || aquatic || type === "duck" ? traits.hover + hoverBob : 0);
  }

  getAnimalColor(type) {
    if (type === "deer") return 0x9a7045;
    if (type === "rabbit") return 0xb8ad90;
    if (type === "owl") return 0x8a795f;
    if (type === "squirrel") return 0xa46e42;
    if (type === "duck") return 0x6f8f5b;
    if (type === "fish") return 0x7dc7d8;
    if (type === "butterfly") return 0xc5d8ff;
    if (type === "dragonfly") return 0x9fdcff;
    if (type === "firefly") return 0x9dffd0;
    return 0x6f8fa8;
  }
}
