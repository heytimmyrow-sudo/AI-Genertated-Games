(function () {
window.Relicbound = window.Relicbound || {};

window.Relicbound.MAPS = {
  sunkenWilds: {
    id: "sunkenWilds",
    name: "Sunken Wilds",
    scale: 2.1,
    objective: "Cross the wilds, recover the lost relic shards, and purge the roaming packs.",
    spawnPoints: {
      entry: { x: 120, y: 840 }
    },
    tiles: [
      "##################################",
      "#....t......C......t.........C...#",
      "#..#####..............#####......#",
      "#..#...#..e.....t.....#...#..e...#",
      "#..#...#..............#...#......#",
      "#..#...#....S....C....#...####...#",
      "#..#...#####......#####......#...#",
      "#..#...........t..............C..#",
      "#..#.e.....R..............e......#",
      "#..#####...........######........#",
      "#......#....C...........#....t...#",
      "#..t...#......S.....e...#........#",
      "#......###...........####....C...#",
      "#..e...........t.................#",
      "#......C.....#####....R..........#",
      "#................................#",
      "#.............S......e..........#",
      "#.P..................C.....t....#",
      "#.............t..................#",
      "#.........................e......#",
      "#..C.................C...........#",
      "##################################"
    ],
    exits: [],
    biomes: [
      { id: "haven", name: "Lantern Rest Village", x: 0, y: 672, width: 720, height: 528, floor: "#314b38", wall: "#4d5f48", accent: "#5d8e63" },
      { id: "grove", name: "Whisper Grove", x: 0, y: 0, width: 1152, height: 720, floor: "#284731", wall: "#425d45", accent: "#8ac16e" },
      { id: "ruins", name: "Broken Causeway", x: 672, y: 336, width: 1056, height: 768, floor: "#323b45", wall: "#5b6470", accent: "#8fb4d3" },
      { id: "marsh", name: "Drowned March", x: 1056, y: 864, width: 1056, height: 672, floor: "#29403c", wall: "#46544c", accent: "#7dd0b7" }
    ],
    villages: [
      { id: "lantern-rest", name: "Lantern Rest Village", x: 72, y: 816, width: 720, height: 336 }
    ],
    houses: [
      { id: "mira-house", x: 144, y: 864, width: 96, height: 96 },
      { id: "oren-forge", x: 300, y: 900, width: 108, height: 96 },
      { id: "nilo-stall", x: 468, y: 900, width: 108, height: 84 },
      { id: "lyra-hall", x: 180, y: 1032, width: 132, height: 96 }
    ],
    npcs: [
      {
        id: "warden-mira",
        name: "Warden Mira",
        role: "Scout Captain",
        x: 288,
        y: 936,
        lines: [
          "The camps woke when the relic shards cracked open.",
          "Use the shrines. You will need every sigil to cross the far marsh."
        ]
      },
      {
        id: "smith-oren",
        name: "Oren",
        role: "Forgekeeper",
        x: 420,
        y: 1032,
        lines: [
          "These shrines still answer steel and nerve.",
          "The Stone Warden holds the old road. Break it, and the region breathes again."
        ]
      },
      {
        id: "sage-lyra",
        name: "Lyra",
        role: "Relic Sage",
        x: 216,
        y: 1128,
        lines: [
          "Each shard you recover feeds the valley's warding lattice.",
          "Three camps, one warden, and the wilds will settle."
        ]
      }
    ],
    merchants: [
      {
        id: "peddler-nilo",
        name: "Nilo",
        role: "Wayfarer Merchant",
        x: 552,
        y: 960,
        lines: [
          "Five coins for a field tonic. Cheap compared to dying.",
          "Come back when your purse rattles louder."
        ],
        items: [
          {
            id: "field-tonic",
            key: "1",
            name: "Field Tonic",
            cost: 5,
            description: "Restore 3 health.",
            effect: "heal"
          },
          {
            id: "sharpening-oil",
            key: "2",
            name: "Sharpening Oil",
            cost: 8,
            description: "Gain +1 sword damage for this run.",
            effect: "damage"
          }
        ]
      }
    ],
    sanctuaries: [
      { id: "lantern-rest", name: "Lantern Rest Shrine", x: 696, y: 984, radius: 74 },
      { id: "causeway-sanctuary", name: "Causeway Shrine", x: 1128, y: 552, radius: 74 }
    ],
    craftingStations: [
      {
        id: "oren-bench",
        name: "Oren's Bench",
        x: 372,
        y: 1032,
        recipes: [
          { id: "timber-grip", key: "1", name: "Timber Grip", wood: 3, stone: 0, description: "+1 sword damage.", effect: "damage" },
          { id: "stone-plate", key: "2", name: "Stone Plate", wood: 0, stone: 4, description: "+1 max health and heal 1.", effect: "health" },
          { id: "wayfarer-kit", key: "3", name: "Wayfarer Kit", wood: 2, stone: 2, description: "Restore full health.", effect: "heal" }
        ]
      }
    ],
    resourceNodes: [
      { id: "oak-1", kind: "tree", x: 840, y: 192, yield: 3 },
      { id: "oak-2", kind: "tree", x: 984, y: 264, yield: 3 },
      { id: "oak-3", kind: "tree", x: 1512, y: 1248, yield: 3 },
      { id: "oak-4", kind: "tree", x: 408, y: 1200, yield: 3 },
      { id: "stone-1", kind: "stone", x: 696, y: 720, yield: 3 },
      { id: "stone-2", kind: "stone", x: 1248, y: 552, yield: 3 },
      { id: "stone-3", kind: "stone", x: 1584, y: 960, yield: 3 },
      { id: "stone-4", kind: "stone", x: 1080, y: 1296, yield: 3 }
    ],
    dungeons: [
      {
        id: "glass-vault",
        name: "Glass Vault",
        x: 1512,
        y: 1224,
        lines: [
          "The crystal gate still answers old relic marks.",
          "Step through when you are ready. The vault is live now."
        ],
        to: "glassVault",
        spawnKey: "fromWilds"
      }
    ],
    camps: [
      { id: "thorn-camp", name: "Thorn Camp", x: 528, y: 384, radius: 220, reward: { type: "coins", amount: 6 } },
      { id: "causeway-camp", name: "Causeway Camp", x: 1284, y: 720, radius: 240, reward: { type: "shard", amount: 1 } },
      { id: "marsh-camp", name: "Marsh Camp", x: 1680, y: 1104, radius: 220, reward: { type: "heal", amount: 4 } }
    ],
    enemies: [
      { type: "brambleScout", x: 408, y: 216 },
      { type: "brambleScout", x: 552, y: 432 },
      { type: "brambleScout", x: 312, y: 648 },
      { type: "brambleScout", x: 768, y: 792 },
      { type: "brambleScout", x: 1224, y: 384 },
      { type: "brambleScout", x: 1344, y: 960 },
      { type: "ruinWisp", x: 1272, y: 216 },
      { type: "ruinWisp", x: 888, y: 576 },
      { type: "ruinWisp", x: 1488, y: 744 },
      { type: "ruinWisp", x: 1728, y: 936 },
      { type: "ruinWisp", x: 1056, y: 1152 },
      { type: "ruinWisp", x: 504, y: 1056 },
      { type: "stoneWarden", x: 1560, y: 888 }
    ],
    collectibles: [
      { type: "coin", x: 600, y: 96 },
      { type: "coin", x: 1488, y: 96 },
      { type: "coin", x: 864, y: 264 },
      { type: "coin", x: 1632, y: 456 },
      { type: "coin", x: 648, y: 624 },
      { type: "coin", x: 1560, y: 696 },
      { type: "coin", x: 408, y: 984 },
      { type: "coin", x: 1248, y: 1104 },
      { type: "coin", x: 1704, y: 1248 },
      { type: "relic", x: 888, y: 336 },
      { type: "relic", x: 720, y: 864 },
      { type: "relic", x: 1488, y: 1128 }
    ]
  },
  glassVault: {
    id: "glassVault",
    name: "Glass Vault",
    scale: 2.1,
    objective: "Clear the vault sentries and recover the crystal cache.",
    spawnPoints: {
      fromWilds: { x: 168, y: 456 },
      returnGate: { x: 600, y: 456 }
    },
    tiles: [
      "################",
      "#......R....E..#",
      "#..####....##..#",
      "#..#..#..C.##..#",
      "#..#..#........#",
      "#P....S....e...#",
      "#..#..#........#",
      "#..#..#..C.##..#",
      "#..####....##..#",
      "#....R...t.....#",
      "#..e......C....#",
      "################"
    ],
    exits: [
      {
        id: "toWilds",
        x: 624,
        y: 72,
        width: 96,
        height: 96,
        to: "sunkenWilds",
        spawnKey: "entry"
      }
    ],
    biomes: [
      { id: "vault", name: "Glass Vault", x: 0, y: 0, width: 768, height: 576, floor: "#2d3447", wall: "#67738c", accent: "#9fd3ff" }
    ],
    npcs: [],
    merchants: [],
    sanctuaries: [],
    dungeons: [],
    camps: [],
    enemies: [
      { type: "ruinWisp", x: 552, y: 264 },
      { type: "brambleScout", x: 120, y: 504 },
      { type: "stoneWarden", x: 504, y: 504 }
    ],
    collectibles: [
      { type: "coin", x: 432, y: 216 },
      { type: "coin", x: 432, y: 360 },
      { type: "coin", x: 552, y: 504 },
      { type: "relic", x: 336, y: 504 }
    ]
  }
};
}());
