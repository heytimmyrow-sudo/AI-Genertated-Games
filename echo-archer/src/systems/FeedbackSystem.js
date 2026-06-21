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
    const particleCount = Math.max(4, Math.round((10 + strength * 13) * this.quality.particleMultiplier));
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const velocities = [];

    for (let index = 0; index < particleCount; index += 1) {
      positions.push(point.x, point.y, point.z);
      const angle = (index / particleCount) * Math.PI * 2;
      const lift = 0.82 + (index % 4) * 0.2 + strength * 0.08;
      const burst = 0.9 + strength * (index % 3 === 0 ? 1.25 : 0.82);
      velocities.push(Math.sin(angle) * burst, lift, Math.cos(angle) * burst);
    }

    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      color,
      size: 0.075 + strength * 0.032,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
    });
    const points = new THREE.Points(geometry, material);
    this.scene.add(points);
    this.effects.push({ points, geometry, material, velocities, age: 0, life: 0.62 + strength * 0.14 });
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
      if (effect.age < effect.life) {
        return true;
      }

      this.scene.remove(effect.points);
      effect.geometry.dispose();
      effect.material.dispose();
      return false;
    });
  }
}
