(function () {
  window.initSanctumUI = function initSanctumUI(args) {
    const ARENA = args.ARENA;
    const altar = args.altar;
    const entities = args.entities;

    const statsEl = document.getElementById("stats");
    const barEl = document.getElementById("bar");
    const debugEl = document.getElementById("debug");
    const mini = document.getElementById("minimap");
    const ctx = mini ? mini.getContext("2d") : null;

    const setText = (el, t) => {
      if (el) el.textContent = t;
    };
    const setBar = (el, pct) => {
      if (el) el.style.width = `${pct}%`;
    };

    function setupMinimapCanvas() {
      if (!mini || !ctx) return;
      const cssW = mini.clientWidth || 180;
      const cssH = mini.clientHeight || 180;
      const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      mini.width = Math.floor(cssW * dpr);
      mini.height = Math.floor(cssH * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = true;
    }
    setupMinimapCanvas();

    function xpToNext(lv) {
      return Math.floor(8 + lv * 6);
    }

    function drawMinimap() {
      if (!ctx || !mini) return;
      const W = mini.clientWidth || 180;
      const H = mini.clientHeight || 180;
      const pad = 10;

      const worldW = ARENA.halfW * 2;
      const worldH = ARENA.halfD * 2;
      const scale = Math.min((W - pad * 2) / worldW, (H - pad * 2) / worldH);
      const toMini = (x, z) => ({ mx: W / 2 + x * scale, my: H / 2 + z * scale });

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "rgba(0,0,0,0.28)";
      ctx.fillRect(0, 0, W, H);

      ctx.strokeStyle = "rgba(255,255,255,0.18)";
      ctx.lineWidth = 2;
      ctx.strokeRect(
        W / 2 - ARENA.halfW * scale,
        H / 2 - ARENA.halfD * scale,
        ARENA.halfW * 2 * scale,
        ARENA.halfD * 2 * scale
      );

      if (altar) {
        const a = toMini(altar.position.x, altar.position.z);
        ctx.fillStyle = "rgba(255,235,170,0.85)";
        ctx.fillRect(a.mx - 3, a.my - 3, 6, 6);
      }

      ctx.fillStyle = "rgba(255,235,170,0.65)";
      for (const o of entities.orbs) {
        const p = o.mesh.position;
        const m = toMini(p.x, p.z);
        ctx.fillRect(m.mx - 1, m.my - 1, 2, 2);
      }

      ctx.fillStyle = "rgba(255,90,136,0.9)";
      for (const e of entities.enemies) {
        const p = e.mesh.position;
        const m = toMini(p.x, p.z);
        ctx.beginPath();
        ctx.arc(m.mx, m.my, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }

      const pp = toMini(entities.player.position.x, entities.player.position.z);
      const yaw = entities.player.rotation.y;
      const fx = Math.sin(yaw);
      const fz = Math.cos(yaw);
      const tip = toMini(entities.player.position.x + fx * 1.2, entities.player.position.z + fz * 1.2);

      ctx.strokeStyle = "rgba(170,220,255,0.95)";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(pp.mx, pp.my);
      ctx.lineTo(tip.mx, tip.my);
      ctx.stroke();

      ctx.fillStyle = "rgba(170,220,255,0.95)";
      ctx.beginPath();
      ctx.arc(pp.mx, pp.my, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }

    function update(args2) {
      const input = args2.input;
      const g = entities.game;
      const xpNeed = xpToNext(g.level);
      const xpPct = (g.xp / Math.max(1, xpNeed)) * 100;
      setBar(barEl, Math.max(0, Math.min(100, xpPct)));

      const stats = entities.swingStats();
      const dashPct = g.dashCd <= 0 ? 100 : (1 - g.dashCd / g.dashCdMax) * 100;
      const swingPct = g.swingCd <= 0 ? 100 : (1 - g.swingCd / g.swingCdMax) * 100;

      const status = g.alive
        ? `HP: ${Math.ceil(g.hp)}/${g.hpMax}
Level: ${g.level} | Faith: ${g.xp}/${xpNeed}
Sword: dmg ${stats.dmg.toFixed(0)} | reach ${stats.reach.toFixed(1)}
Enemies: ${entities.enemies.length} | Orbs: ${entities.orbs.length}
Dash: ${dashPct.toFixed(0)}% | Swing: ${swingPct.toFixed(0)}%`
        : `You fell in the Sanctum.\nPress R to restart.`;

      setText(statsEl, status);
      setText(
        debugEl,
        `Last key: ${input.lastKey}
Down: ${Object.entries({ w: input.w, a: input.a, s: input.s, d: input.d, shift: input.shift }).filter(([, v]) => v).map(([k]) => k).join(", ") || "(none)"}
Minimap: player arrow shows facing`
      );

      drawMinimap();
    }

    function resize() {
      setupMinimapCanvas();
    }

    return { update, resize };
  };
})();
