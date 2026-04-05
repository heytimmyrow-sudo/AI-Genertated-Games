(function () {
  const SkyArcher = window.SkyArcher || (window.SkyArcher = {});

  // Wave data stays separate so new enemy mixes can be authored without touching the main loop.
  SkyArcher.WAVES = [
    {
      label: "Wave 1",
      enemies: [
        { type: "walker", delay: 0.4, lane: 0 },
        { type: "walker", delay: 1.4, lane: 1 },
        { type: "runner", delay: 2.6, lane: 0 }
      ]
    },
    {
      label: "Wave 2",
      enemies: [
        { type: "walker", delay: 0.3, lane: 0 },
        { type: "runner", delay: 1.0, lane: 1 },
        { type: "walker", delay: 1.6, lane: 2 },
        { type: "runner", delay: 2.3, lane: 1 }
      ]
    },
    {
      label: "Wave 3",
      enemies: [
        { type: "walker", delay: 0.3, lane: 0 },
        { type: "runner", delay: 0.9, lane: 2 },
        { type: "flyer", delay: 1.4, lane: 1 },
        { type: "walker", delay: 2.0, lane: 0 },
        { type: "runner", delay: 2.6, lane: 2 }
      ]
    },
    {
      label: "Wave 4",
      enemies: [
        { type: "flyer", delay: 0.4, lane: 1 },
        { type: "runner", delay: 0.9, lane: 0 },
        { type: "walker", delay: 1.4, lane: 2 },
        { type: "flyer", delay: 2.0, lane: 0 },
        { type: "runner", delay: 2.5, lane: 1 },
        { type: "walker", delay: 3.1, lane: 2 }
      ]
    },
    {
      label: "Wave 5",
      enemies: [
        { type: "walker", delay: 0.2, lane: 0 },
        { type: "runner", delay: 0.7, lane: 1 },
        { type: "flyer", delay: 1.1, lane: 2 },
        { type: "runner", delay: 1.7, lane: 0 },
        { type: "flyer", delay: 2.2, lane: 1 },
        { type: "walker", delay: 2.8, lane: 2 },
        { type: "runner", delay: 3.4, lane: 1 }
      ]
    }
  ];
}());
