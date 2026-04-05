(function () {
  const StillwakeHouse = window.StillwakeHouse || (window.StillwakeHouse = {});

  StillwakeHouse.CONFIG = {
    width: 1280,
    height: 720,
    world: {
      bounds: {
        minX: -8,
        maxX: 25,
        minZ: -8,
        maxZ: 9
      }
    },
    houses: {
      home: { x: 0, z: 0 },
      neighbor: { x: 18, z: 1.2 }
    },
    room: {
      width: 13,
      depth: 11,
      wallHeight: 3.8
    },
    player: {
      start: { x: -3.8, y: 0, z: 2.4 },
      speed: 3.8,
      radius: 0.34,
      height: 1.45
    },
    camera: {
      distance: 4.8,
      height: 2.25,
      lookHeight: 1.15,
      smooth: 0.08,
      focusDistance: 2.1,
      focusHeight: 1.2
    },
    interaction: {
      range: 1.5
    },
    notes: {
      homeLetter: {
        label: "Folded Letter",
        title: "For You",
        lines: [
          { text: "You need to leave before-" },
          { text: "they are already here", scratched: true },
          { text: "Do not trust-" },
          { text: "the village", scratched: true },
          { text: "If you're reading this, it's already-" }
        ]
      },
      houseTwoNote: {
        label: "Old Note",
        title: "Your Handwriting",
        lines: [
          { text: "I checked this house already." },
          { text: "There's nothing here." },
          { text: "Stop wasting time." }
        ]
      }
    },
    audio: {
      placeholder: [
        "soft room tone",
        "window breeze",
        "quiet floor creak loop"
      ]
    }
  };
}());
