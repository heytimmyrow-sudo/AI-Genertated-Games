const { THREE } = window;

export class FeedbackSystem {
  constructor(scene, cameraRig) {
    this.scene = scene;
    this.cameraRig = cameraRig;
    this.effects = [];
    this.quality = { particleMultiplier: 1, effectsQuality: 1 };
    this.soundHooks = {
      bowDraw: "sfx/bow-draw-placeholder",
      bowRelease: "sfx/bow-release-placeholder",
      arrowHit: "sfx/arrow-hit-placeholder",
      bullseyeHit: "sfx/bullseye-hit-placeholder",
      caveArrowHit: "sfx/cave-arrow-hit-placeholder",
      enemyHit: "sfx/enemy-hit-placeholder",
      weakpointHit: "sfx/weakpoint-hit-placeholder",
      enemyDefeat: "sfx/enemy-defeat-placeholder",
      arrowFlyby: "sfx/arrow-flyby-placeholder",
      bossNotice: "sfx/boss-notice-placeholder",
      bossCharge: "sfx/boss-charge-placeholder",
      bossDefeat: "sfx/boss-defeat-placeholder",
      powerfulHit: "sfx/power-hit-placeholder",
      questComplete: "sfx/quest-complete-placeholder",
      uiClick: "sfx/ui-click-placeholder",
      caveGateOpen: "sfx/cave-gate-open-placeholder",
    };
  }

  setQuality(preset = null) {
    this.quality = {
      particleMultiplier: preset?.particleMultiplier ?? 1,
      effectsQuality: preset?.effectsQuality ?? 1,
    };
  }

  playSound(name, intensity = 1) {
    window.dispatchEvent(new CustomEvent("echo-archer:sound", {
      detail: { name, hook: this.soundHooks[name], intensity },
    }));
  }

  shake(amount) {
    this.cameraRig.addShake(amount);
  }

  spawnImpact(point, color = 0xe0b75f, strength = 1) {
    const particleCount = Math.max(4, Math.round((11 + strength * 13) * this.quality.particleMultiplier));
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const velocities = [];

    for (let index = 0; index < particleCount; index += 1) {
      positions.push(point.x, point.y, point.z);
      const angle = (index / particleCount) * Math.PI * 2;
      const lift = 0.9 + (index % 4) * 0.2 + strength * 0.09;
      const burst = 0.98 + strength * (index % 3 === 0 ? 1.32 : 0.88);
      velocities.push(Math.sin(angle) * burst, lift, Math.cos(angle) * burst);
    }

    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      color,
      size: 0.078 + strength * 0.034,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
    });
    const points = new THREE.Points(geometry, material);
    this.scene.add(points);
    const ring = strength > 0.88 ? this.createImpactRing(point, color, strength) : null;
    this.effects.push({
      points,
      geometry,
      material,
      velocities,
      ring,
      ringMaterial: ring?.material ?? null,
      age: 0,
      life: 0.62 + strength * 0.14,
      strength,
    });
  }

  createImpactRing(point, color, strength) {
    const geometry = new THREE.RingGeometry(0.08, 0.1 + strength * 0.035, 20);
    const material = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.58,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
    const ring = new THREE.Mesh(geometry, material);
    ring.position.copy(point);
    ring.scale.setScalar(0.7);
    if (this.cameraRig?.camera) {
      ring.lookAt(this.cameraRig.camera.position);
    }
    this.scene.add(ring);
    return ring;
  }

  update(deltaSeconds) {
    this.effects = this.effects.filter((effect) => {
      effect.age += deltaSeconds;
      const position = effect.geometry.attributes.position;

      for (let index = 0; index < position.count; index += 1) {
        const velocityIndex = index * 3;
        const velocityX = effect.velocities[velocityIndex];
        const velocityY = effect.velocities[velocityIndex + 1];
        const velocityZ = effect.velocities[velocityIndex + 2];
        position.setXYZ(
          index,
          position.getX(index) + velocityX * deltaSeconds,
          position.getY(index) + velocityY * deltaSeconds,
          position.getZ(index) + velocityZ * deltaSeconds
        );
        effect.velocities[velocityIndex + 1] = velocityY - 5.2 * deltaSeconds;
      }

      position.needsUpdate = true;
      effect.material.opacity = Math.max(0, 1 - effect.age / effect.life);
      if (effect.ring) {
        const progress = Math.min(1, effect.age / effect.life);
        effect.ring.scale.setScalar(0.75 + progress * (1.35 + effect.strength * 0.22));
        effect.ringMaterial.opacity = Math.max(0, 0.55 * (1 - progress));
        if (this.cameraRig?.camera) {
          effect.ring.lookAt(this.cameraRig.camera.position);
        }
      }
      if (effect.age < effect.life) {
        return true;
      }

      this.scene.remove(effect.points);
      if (effect.ring) {
        this.scene.remove(effect.ring);
        effect.ring.geometry.dispose();
        effect.ringMaterial.dispose();
      }
      effect.geometry.dispose();
      effect.material.dispose();
      return false;
    });
  }
}
