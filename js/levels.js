export const level1 = {
  name: "Starter Isle",
  objective: "Collect 3 crystals, activate the switch, and light the Heart Lamp.",
  world: { x: 28, y: 28, width: 844, height: 544 },
  playerStart: { x: 84, y: 456 },
  walls: [
    { x: 0, y: 0, width: 900, height: 28 },
    { x: 0, y: 572, width: 900, height: 28 },
    { x: 0, y: 0, width: 28, height: 600 },
    { x: 872, y: 0, width: 28, height: 600 },
    { x: 180, y: 108, width: 34, height: 320 },
    { x: 180, y: 108, width: 250, height: 34 },
    { x: 306, y: 218, width: 34, height: 220 },
    { x: 430, y: 108, width: 34, height: 180 },
    { x: 520, y: 324, width: 188, height: 34 },
    { x: 594, y: 174, width: 34, height: 184 },
    { x: 700, y: 174, width: 34, height: 210 }
  ],
  enemies: [
    { x: 356, y: 462, speed: 70, detectionRadius: 150, health: 30 },
    { x: 662, y: 118, speed: 88, detectionRadius: 190, health: 36 }
  ],
  crystals: [
    { x: 120, y: 112, radius: 10, collected: false },
    { x: 542, y: 104, radius: 10, collected: false },
    { x: 780, y: 476, radius: 10, collected: false }
  ],
  keyFragments: [
    { x: 506, y: 256, radius: 11, collected: false }
  ],
  switches: [
    { x: 522, y: 476, width: 28, height: 28, active: false, gateId: "northGate" }
  ],
  gates: [
    { id: "northGate", x: 734, y: 270, width: 34, height: 92, open: false }
  ],
  shrine: { x: 100, y: 300, width: 32, height: 32, used: false },
  lamp: { x: 804, y: 90, radius: 22, lit: false }
};

export const levels = [level1];
