(function () {
window.Relicbound = window.Relicbound || {};

window.Relicbound.GAME_CONFIG = {
  tileSize: 48,
  world: {
    ambientPetals: 28
  },
  player: {
    radius: 16,
    speed: 220,
    maxHealth: 7,
    attackDamage: 1,
    attackRange: 62,
    attackRadius: 38,
    attackCooldown: 0.34,
    attackWindow: 0.14,
    invulnerability: 0.7
  },
  camera: {
    smoothness: 0.12,
    anchorX: 0.5,
    anchorY: 0.7
  },
  render: {
    floorSquash: 0.54,
    wallHeight: 58,
    actorHeight: 40,
    collectableLift: 26
  },
  input: {
    stickDeadzone: 0.24
  },
  combat: {
    screenShakeOnHit: 4,
    screenShakeOnKill: 7,
    screenShakeOnBossKill: 11
  },
  progression: {
    coinScoreValue: 10,
    relicScoreValue: 100
  },
  enemyTypes: {
    brambleScout: {
      label: "Bramble Scout",
      color: "#75d66f",
      radius: 15,
      speed: 84,
      maxHealth: 3,
      touchDamage: 1,
      detectionRange: 170,
      patrolDistance: 42,
      patrolStyle: "line"
    },
    ruinWisp: {
      label: "Ruin Wisp",
      color: "#7de3ff",
      radius: 13,
      speed: 116,
      maxHealth: 2,
      touchDamage: 1,
      detectionRange: 210,
      patrolDistance: 30,
      patrolStyle: "orbit"
    },
    stoneWarden: {
      label: "Stone Warden",
      color: "#d7b58a",
      radius: 24,
      speed: 72,
      maxHealth: 12,
      touchDamage: 2,
      detectionRange: 280,
      patrolDistance: 54,
      patrolStyle: "line",
      isBoss: true
    }
  },
  upgrades: [
    {
      id: "vigor",
      key: "1",
      name: "Vigor Sigil",
      description: "Raise max health and restore 1 heart on purchase.",
      maxRank: 3,
      cost: 1
    },
    {
      id: "tempo",
      key: "2",
      name: "Tempo Sigil",
      description: "Move faster and recover swings sooner.",
      maxRank: 3,
      cost: 1
    },
    {
      id: "edge",
      key: "3",
      name: "Edge Sigil",
      description: "Increase sword damage for quicker kills.",
      maxRank: 3,
      cost: 1
    },
    {
      id: "ward",
      key: "4",
      name: "Ward Sigil",
      description: "Extend post-hit safety frames and steady recovery.",
      maxRank: 3,
      cost: 1
    }
  ]
};
}());
