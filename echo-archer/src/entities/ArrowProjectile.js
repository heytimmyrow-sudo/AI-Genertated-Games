import { SETTINGS } from "../config/settings.js";

const { THREE } = window;

const flightQuaternion = new THREE.Quaternion();
const forwardAxis = new THREE.Vector3(0, 0, 1);

export class ArrowProjectile {
  constructor(scene, origin, velocity, feedback = null, shotPower = 0, arrowType = null, trailMultiplier = 1) {
    this.scene = scene;
    this.feedback = feedback;
    this.shotPower = shotPower;
    this.arrowType = arrowType ?? { id: "standard", name: "Standard Arrow", color: 0xffe3a0 };
    this.velocity = velocity.clone();
    this.age = 0;
    this.stuck = false;
    this.stuckAge = 0;
    this.stuckLifetime = SETTINGS.archery.stuckArrowLife ?? 3;
    this.hitObjectRef = null;
    this.hitPoint = null;
    this.hitProcessed = false;
    this.lastPosition = origin.clone();
    this.group = this.createMesh();
    this.trailPointLimit = Math.max(5, Math.round((8 + shotPower * 8) * trailMultiplier));
    this.trail = this.createTrail(origin);
    this.trailPoints = Array.from({ length: this.trailPointLimit }, () => origin.clone());
    this.group.position.copy(origin);
    this.alignToVelocity();
    scene.add(this.group);
    scene.add(this.trail);
  }

  createMesh() {
    const group = new THREE.Group();
    const shaftMaterial = new THREE.MeshStandardMaterial({ color: 0x9b6b37, roughness: 0.64 });
    const headMaterial = new THREE.MeshStandardMaterial({
      color: this.arrowType.color ?? 0xd4c4a0,
      roughness: 0.36,
      metalness: 0.34,
      emissive: this.arrowType.id === "standard" ? 0x000000 : this.arrowType.color,
      emissiveIntensity: this.arrowType.id === "standard" ? 0 : 0.28,
    });
    const fletchMaterial = new THREE.MeshStandardMaterial({ color: 0xe6b75d, roughness: 0.58 });
    const accentMaterial = new THREE.MeshStandardMaterial({ color: this.arrowType.color ?? 0x315545, roughness: 0.72, emissive: this.arrowType.color ?? 0x000000, emissiveIntensity: this.arrowType.id === "standard" ? 0 : 0.12 });

    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.017, SETTINGS.archery.arrowLength, 10), shaftMaterial);
    shaft.rotation.x = Math.PI / 2;
    shaft.castShadow = true;
    group.add(shaft);

    const head = new THREE.Mesh(new THREE.ConeGeometry(0.085, 0.3, 4), headMaterial);
    head.position.z = SETTINGS.archery.arrowLength / 2 + 0.15;
    head.rotation.x = Math.PI / 2;
    head.rotation.z = Math.PI / 4;
    head.castShadow = true;
    group.add(head);

    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.08, 10), accentMaterial);
    collar.position.z = SETTINGS.archery.arrowLength / 2 + 0.01;
    collar.rotation.x = Math.PI / 2;
    collar.castShadow = true;
    group.add(collar);

    const nock = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.07, 8), accentMaterial);
    nock.position.z = -SETTINGS.archery.arrowLength / 2 - 0.02;
    nock.rotation.x = Math.PI / 2;
    group.add(nock);

    for (let index = 0; index < 3; index += 1) {
      const feather = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.24, 0.3), index === 1 ? accentMaterial : fletchMaterial);
      feather.position.z = -SETTINGS.archery.arrowLength / 2 + 0.15;
      feather.rotation.z = (index / 3) * Math.PI * 2;
      feather.rotation.y = 0.16;
      feather.castShadow = true;
      group.add(feather);
    }

    if (this.arrowType.id === "explosive") {
      const charge = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), accentMaterial);
      charge.position.z = -0.08;
      charge.scale.set(1, 0.85, 1);
      group.add(charge);
    }

    return group;
  }

  createTrail(origin) {
    const geometry = new THREE.BufferGeometry().setFromPoints(Array.from({ length: this.trailPointLimit }, () => origin.clone()));
    const material = new THREE.LineBasicMaterial({
      color: this.arrowType.color ?? 0xffe3a0,
      transparent: true,
      opacity: this.arrowType.id === "standard" ? 0.78 : 0.94,
      blending: THREE.AdditiveBlending,
      linewidth: 2,
    });
    return new THREE.Line(geometry, material);
  }

  update(deltaSeconds, world) {
    if (this.stuck) {
      this.stuckAge += deltaSeconds;
      this.fadeTrail(deltaSeconds);
      if (this.stuckAge >= this.stuckLifetime) {
        this.dispose();
        return false;
      }
      return true;
    }

    this.age += deltaSeconds;
    this.lastPosition.copy(this.group.position);
    this.velocity.y -= SETTINGS.archery.gravity * deltaSeconds;
    this.group.position.addScaledVector(this.velocity, deltaSeconds);
    this.alignToVelocity();
    this.updateTrail();

    if (this.hitObject(world) || this.hitTerrain(world)) {
      this.stuck = true;
      this.velocity.set(0, 0, 0);
      this.emitImpact();
      return true;
    }

    if (this.age > SETTINGS.archery.arrowLife) {
      this.dispose();
      return false;
    }

    return true;
  }

  hitObject(world) {
    const travel = this.group.position.clone().sub(this.lastPosition);
    const distance = travel.length();
    if (distance <= 0.001 || world.colliders.length === 0) {
      return false;
    }

    const raycaster = new THREE.Raycaster(this.lastPosition, travel.normalize(), 0, distance + 0.18);
    const hits = raycaster.intersectObjects(world.colliders, false);
    if (hits.length === 0) {
      return false;
    }

    this.group.position.copy(hits[0].point);
    this.hitObjectRef = hits[0].object;
    this.hitPoint = hits[0].point.clone();
    return true;
  }

  hitTerrain(world) {
    const terrainY = world.terrain.getHeightAt(this.group.position.x, this.group.position.z);
    if (this.group.position.y > terrainY + 0.03) {
      return false;
    }

    this.group.position.y = terrainY + 0.03;
    this.hitPoint = this.group.position.clone();
    return true;
  }

  alignToVelocity() {
    if (this.velocity.lengthSq() < 0.001) {
      return;
    }

    flightQuaternion.setFromUnitVectors(forwardAxis, this.velocity.clone().normalize());
    this.group.quaternion.copy(flightQuaternion);
  }

  updateTrail() {
    const point = this.trailPoints.pop();
    point.copy(this.group.position);
    this.trailPoints.unshift(point);
    this.trailPoints.length = this.trailPointLimit;
    this.trail.geometry.setFromPoints(this.trailPoints);
    const shimmer = Math.sin((this.age + this.shotPower) * 24) * 0.04;
    this.trail.material.opacity = Math.min(1, 0.52 + this.shotPower * 0.48 + shimmer);
  }

  fadeTrail(deltaSeconds) {
    this.trail.material.opacity = Math.max(0, this.trail.material.opacity - deltaSeconds * 2.6);
  }

  dispose() {
    this.scene.remove(this.group);
    this.scene.remove(this.trail);
    this.group.traverse((child) => {
      child.geometry?.dispose?.();
      if (Array.isArray(child.material)) {
        child.material.forEach((material) => material.dispose?.());
      } else {
        child.material?.dispose?.();
      }
    });
    this.trail.geometry?.dispose?.();
    this.trail.material?.dispose?.();
  }

  emitImpact() {
    if (!this.feedback || !this.hitPoint) {
      return;
    }

    const creature = this.hitObjectRef?.userData.enemy || this.hitObjectRef?.userData.boss;
    const weakSpot = this.hitObjectRef?.name?.toLowerCase?.().includes("weakspot");
    const strength = creature ? 1.38 + this.shotPower * 1.08 : 0.78 + this.shotPower * 0.72;
    const impactColor = this.arrowType.id === "standard"
      ? (creature ? (weakSpot ? 0xfff1a6 : (this.shotPower > 0.7 ? 0xffb15f : 0xcf7c4e)) : (this.shotPower > 0.7 ? 0xffdf8a : 0xe0b75f))
      : this.arrowType.color;
    this.feedback.spawnImpact(this.hitPoint, impactColor, strength + this.shotPower * (weakSpot ? 1.05 : 0.52));
    if (creature && this.shotPower > 0.68) {
      this.feedback.spawnImpact(this.hitPoint, weakSpot ? 0xfff1a6 : 0xffc06a, 0.8 + this.shotPower * 0.55);
    }
    if (weakSpot) {
      this.feedback.spawnImpact(this.hitPoint, 0xfff1a6, 1.6 + this.shotPower);
      this.feedback.shake(0.06 + this.shotPower * 0.07);
    }
    if (!creature && this.shotPower > 0.75) {
      this.feedback.shake(0.03 + this.shotPower * 0.03);
    }
    this.feedback.playSound(weakSpot ? "weakpointHit" : (creature ? "enemyHit" : "arrowHit"), strength + this.shotPower * 0.25);
  }
}
