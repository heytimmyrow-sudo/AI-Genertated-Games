(function () {
  const SkyArcher = window.SkyArcher || (window.SkyArcher = {});

  SkyArcher.CONFIG = {
    width: 1280,
    height: 720,
    gravity: 980,
    bow: {
      minPower: 380,
      maxPower: 980,
      drawTime: 1.2,
      anchorX: 242,
      anchorY: 396,
      maxAngleUp: -1.48,
      minAngleDown: 0.34
    },
    arrows: {
      maxAmmo: 8,
      refillRate: 0.42,
      radius: 8,
      damage: 1,
      specialTypes: {
        normal: { label: "Standard Arrow", damage: 1 },
        fire: { label: "Fire Arrow", damage: 1.4 },
        explosive: { label: "Explosive Arrow", damage: 1.8 }
      }
    },
    tower: {
      health: 20,
      hitCooldown: 0.5
    },
    enemyTypes: {
      walker: {
        label: "Bridge Raider",
        speed: 42,
        radius: 24,
        health: 2,
        damage: 1,
        score: 90,
        path: "bridge"
      },
      runner: {
        label: "Sky Skirmisher",
        speed: 76,
        radius: 19,
        health: 1,
        damage: 1,
        score: 120,
        path: "bridge"
      },
      flyer: {
        label: "Wing Drone",
        speed: 108,
        radius: 18,
        health: 2,
        damage: 1,
        score: 150,
        path: "air"
      }
    }
  };
}());
