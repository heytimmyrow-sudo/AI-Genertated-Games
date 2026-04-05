(function () {
  const ShadowCircuit = window.ShadowCircuit || (window.ShadowCircuit = {});
  const T = 48;

  function rect(tx, ty, tw, th) {
    return { x: tx * T, y: ty * T, w: tw * T, h: th * T };
  }

  ShadowCircuit.MAP_DATA = {
    name: "Shadow Circuit Mainframe",
    width: 37 * T,
    height: 25 * T,
    playerSpawn: { x: 3.5 * T, y: 4.5 * T },
    finalExit: rect(33, 20, 2, 2),
    zones: [
      { name: "Cold Boot", rect: rect(0, 0, 11, 10) },
      { name: "Pulse Lattice", rect: rect(10, 0, 14, 10) },
      { name: "Signal Lock", rect: rect(24, 0, 13, 12) },
      { name: "Mirror Drain", rect: rect(0, 10, 18, 15) },
      { name: "Exit Spine", rect: rect(18, 10, 19, 15) }
    ],
    walls: [
      rect(0, 0, 37, 1), rect(0, 24, 37, 1), rect(0, 0, 1, 25), rect(36, 0, 1, 25),
      rect(6, 1, 1, 10), rect(10, 0, 1, 7), rect(10, 9, 1, 8), rect(15, 3, 1, 13),
      rect(20, 0, 1, 8), rect(20, 10, 1, 9), rect(26, 1, 1, 12), rect(30, 4, 1, 13),
      rect(4, 13, 11, 1), rect(17, 11, 1, 10), rect(22, 8, 10, 1), rect(23, 16, 10, 1),
      rect(8, 19, 16, 1), rect(28, 18, 1, 6), rect(12, 6, 5, 1), rect(24, 20, 7, 1),
      rect(31, 12, 5, 1), rect(2, 8, 4, 1)
    ],
    hazards: [
      rect(7, 3, 2, 2), rect(12, 10, 2, 2), rect(18, 4, 2, 2), rect(28, 6, 2, 2),
      rect(6, 21, 3, 1), rect(24, 13, 2, 2), rect(32, 21, 2, 2)
    ],
    gates: [
      { id: "gate-alpha", rect: rect(10, 7, 1, 2), requiredCores: 3, open: false },
      { id: "gate-beta", rect: rect(20, 8, 1, 2), requiredCores: 6, open: false },
      { id: "gate-gamma", rect: rect(30, 17, 1, 2), requiredCores: 8, open: false }
    ],
    checkpoints: [
      { x: 4.5 * T, y: 4.5 * T, active: true },
      { x: 13.5 * T, y: 4.5 * T, active: false },
      { x: 24.5 * T, y: 18.5 * T, active: false }
    ],
    cores: [
      { x: 4.5 * T, y: 10.5 * T }, { x: 8.5 * T, y: 16.5 * T }, { x: 13.5 * T, y: 2.5 * T },
      { x: 18.5 * T, y: 6.5 * T }, { x: 19.5 * T, y: 14.5 * T }, { x: 22.5 * T, y: 3.5 * T },
      { x: 25.5 * T, y: 11.5 * T }, { x: 28.5 * T, y: 14.5 * T }, { x: 32.5 * T, y: 10.5 * T },
      { x: 33.5 * T, y: 22.5 * T }, { x: 15.5 * T, y: 22.5 * T }, { x: 5.5 * T, y: 20.5 * T }
    ],
    pickups: [
      { type: "shield", x: 11.5 * T, y: 15.5 * T },
      { type: "speed", x: 27.5 * T, y: 3.5 * T },
      { type: "shield", x: 31.5 * T, y: 19.5 * T },
      { type: "speed", x: 16.5 * T, y: 21.5 * T }
    ],
    terminals: [
      { x: 5.5 * T, y: 6.5 * T, text: "CORE LOCKS DETECTED. SECURE ENERGY CORES TO OPEN SEALED GATES." },
      { x: 23.5 * T, y: 18.5 * T, text: "EXIT SPINE ONLINE. FINAL PORT REQUIRES TEN CORES." }
    ],
    enemies: [
      { type: "patrol", x: 7.5 * T, y: 7.5 * T, path: [{ x: 7.5 * T, y: 7.5 * T }, { x: 7.5 * T, y: 11.5 * T }] },
      { type: "patrol", x: 14.5 * T, y: 8.5 * T, path: [{ x: 12.5 * T, y: 8.5 * T }, { x: 18.5 * T, y: 8.5 * T }] },
      { type: "chaser", x: 9.5 * T, y: 18.5 * T },
      { type: "patrol", x: 16.5 * T, y: 4.5 * T, path: [{ x: 16.5 * T, y: 4.5 * T }, { x: 19.5 * T, y: 4.5 * T }] },
      { type: "turret", x: 23.5 * T, y: 5.5 * T },
      { type: "chaser", x: 23.5 * T, y: 14.5 * T },
      { type: "patrol", x: 27.5 * T, y: 10.5 * T, path: [{ x: 27.5 * T, y: 10.5 * T }, { x: 32.5 * T, y: 10.5 * T }] },
      { type: "turret", x: 31.5 * T, y: 8.5 * T },
      { type: "chaser", x: 29.5 * T, y: 21.5 * T },
      { type: "patrol", x: 13.5 * T, y: 22.5 * T, path: [{ x: 11.5 * T, y: 22.5 * T }, { x: 16.5 * T, y: 22.5 * T }] },
      { type: "turret", x: 34.5 * T, y: 18.5 * T }
    ]
  };
}());
