(function () {
  const ShadowCircuit = window.ShadowCircuit || (window.ShadowCircuit = {});

  ShadowCircuit.CONFIG = {
    width: 960,
    height: 640,
    tileSize: 48,
    player: {
      radius: 14,
      speed: 210,
      dashSpeed: 560,
      dashTime: 0.16,
      dashCooldown: 1.25,
      blastCooldown: 0.18,
      blastSpeed: 540,
      blastDamage: 1,
      maxHealth: 6,
      lives: 3,
      respawnShield: 1.2
    },
    enemyTypes: {
      patrol: {
        radius: 13,
        color: "#5bf0ff",
        maxHealth: 3,
        speed: 92,
        aggroRange: 200,
        contactDamage: 1,
        score: 80
      },
      chaser: {
        radius: 12,
        color: "#ff6a9b",
        maxHealth: 2,
        speed: 148,
        aggroRange: 260,
        contactDamage: 1,
        score: 100
      },
      turret: {
        radius: 14,
        color: "#ffd86e",
        maxHealth: 4,
        speed: 0,
        aggroRange: 320,
        contactDamage: 1,
        fireCooldown: 1.5,
        score: 140
      }
    },
    pickups: {
      shield: { duration: 7 },
      speed: { duration: 8 }
    },
    effects: {
      shakeDamage: 8,
      shakeKill: 10,
      shakeCore: 6
    },
    progression: {
      finalExitCores: 10
    }
  };
}());
