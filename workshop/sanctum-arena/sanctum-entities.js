(function () {
  const THREE = window.THREE;

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  function wrapPi(r) {
    const twoPi = Math.PI * 2;
    return ((r + Math.PI) % twoPi + twoPi) % twoPi - Math.PI;
  }
  function lerpAngle(a, b, t) {
    const d = wrapPi(b - a);
    return a + d * t;
  }

  window.createSanctumEntities = function createSanctumEntities(args) {
    const scene = args.scene;
    const ARENA = args.ARENA;
    const pop = args.pop;

    const game = {
      alive: true,
      hpMax: 100,
      hp: 100,
      level: 1,
      xp: 0,
      dashCd: 0,
      dashCdMax: 0.85,
      swingT: 0,
      swingCd: 0,
      swingCdMax: 0.22,
      invuln: 0
    };

    function xpToNext(lv) {
      return Math.floor(8 + lv * 6);
    }

    function randInArena(m) {
      const margin = m || 1.3;
      return {
        x: THREE.MathUtils.randFloat(-ARENA.halfW + margin, ARENA.halfW - margin),
        z: THREE.MathUtils.randFloat(-ARENA.halfD + margin, ARENA.halfD - margin)
      };
    }

    const player = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.72, 1.2, 6, 18),
      new THREE.MeshStandardMaterial({ color: 0xf2f2f2, roughness: 0.35, metalness: 0.12 })
    );
    player.castShadow = true;
    player.position.set(0, 1.2, 0);
    scene.add(player);

    const halo = new THREE.Mesh(
      new THREE.RingGeometry(0.55, 0.95, 40),
      new THREE.MeshStandardMaterial({
        color: 0xfff3b0,
        emissive: 0xffe08a,
        emissiveIntensity: 1.35,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.95
      })
    );
    halo.rotation.x = -Math.PI / 2;
    halo.position.set(0, 1.95, 0);
    player.add(halo);

    const frontGem = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 16, 16),
      new THREE.MeshStandardMaterial({
        color: 0xfff3b0,
        emissive: 0xffe6a0,
        emissiveIntensity: 3.0,
        roughness: 0.2,
        metalness: 0.15
      })
    );
    frontGem.position.set(0, 1.45, 0.62);
    player.add(frontGem);

    const pointer = new THREE.Mesh(
      new THREE.ConeGeometry(0.22, 0.55, 18),
      new THREE.MeshStandardMaterial({
        color: 0xfff3b0,
        emissive: 0xffe6a0,
        emissiveIntensity: 2.0,
        roughness: 0.35,
        metalness: 0.1,
        transparent: true,
        opacity: 0.95
      })
    );
    pointer.rotation.x = -Math.PI / 2;
    pointer.position.set(0, 0.06, 0);
    scene.add(pointer);

    const swordPivot = new THREE.Group();
    player.add(swordPivot);

    const sword = new THREE.Group();
    sword.position.set(0.55, 0, 0);
    swordPivot.add(sword);

    const handle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.09, 0.09, 0.55, 14),
      new THREE.MeshStandardMaterial({ color: 0x2c2c2c, roughness: 0.9, metalness: 0.1 })
    );
    handle.castShadow = true;
    handle.rotation.z = Math.PI / 2;
    handle.position.set(0.35, 1.05, 0);
    sword.add(handle);

    const guard = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.38, 0.58),
      new THREE.MeshStandardMaterial({ color: 0xd7c16d, roughness: 0.35, metalness: 0.65 })
    );
    guard.castShadow = true;
    guard.position.set(0.55, 1.05, 0);
    sword.add(guard);

    const blade = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.12, 1.7),
      new THREE.MeshStandardMaterial({
        color: 0xe8edf5,
        roughness: 0.25,
        metalness: 0.85,
        emissive: 0x0a0f20,
        emissiveIntensity: 0.25
      })
    );
    blade.castShadow = true;
    blade.position.set(0.55, 1.05, 0.85);
    sword.add(blade);

    const trail = new THREE.Mesh(
      new THREE.PlaneGeometry(0.10, 2.2),
      new THREE.MeshStandardMaterial({
        color: 0xfff3b0,
        emissive: 0xffe6a0,
        emissiveIntensity: 2.2,
        transparent: true,
        opacity: 0.0,
        side: THREE.DoubleSide,
        depthWrite: false
      })
    );
    trail.position.set(0.55, 1.05, 1.0);
    trail.rotation.y = Math.PI / 2;
    sword.add(trail);

    function applyLevelVisuals() {
      const s = 1 + (game.level - 1) * 0.08;
      sword.scale.set(s, s, s);
      halo.scale.set(1 + (game.level - 1) * 0.04, 1 + (game.level - 1) * 0.04, 1);
      halo.material.emissiveIntensity = 1.35 + (game.level - 1) * 0.06;
    }
    applyLevelVisuals();

    const orbs = [];
    const orbGeo = new THREE.IcosahedronGeometry(0.16, 0);
    const orbMat = new THREE.MeshStandardMaterial({
      color: 0xfff3b0,
      emissive: 0xffe6a0,
      emissiveIntensity: 2.2,
      roughness: 0.2,
      metalness: 0.25,
      transparent: true,
      opacity: 0.95
    });

    function spawnOrb(pos, value) {
      const m = new THREE.Mesh(orbGeo, orbMat);
      const p = pos || randInArena();
      m.position.set(p.x, 0.45, p.z);
      scene.add(m);
      orbs.push({ mesh: m, value: value || 1, seed: Math.random() * 10 });
    }

    function ensureOrbs(n) {
      while (orbs.length < n) spawnOrb(null, 1);
    }
    ensureOrbs(28);

    const enemies = [];
    const enemyGeo = new THREE.SphereGeometry(0.55, 18, 18);
    const enemyMatA = new THREE.MeshStandardMaterial({ color: 0x5aa2ff, roughness: 0.55, metalness: 0.1, emissive: 0x1b2a66, emissiveIntensity: 0.9 });
    const enemyMatB = new THREE.MeshStandardMaterial({ color: 0xff5a88, roughness: 0.55, metalness: 0.1, emissive: 0x551126, emissiveIntensity: 0.9 });

    function spawnEnemy() {
      const mesh = new THREE.Mesh(enemyGeo, Math.random() < 0.5 ? enemyMatA : enemyMatB);
      mesh.castShadow = true;

      const side = Math.floor(Math.random() * 4);
      const m = 1.0;
      let x;
      let z;
      if (side === 0) {
        x = -ARENA.halfW + m;
        z = THREE.MathUtils.randFloat(-ARENA.halfD + m, ARENA.halfD - m);
      } else if (side === 1) {
        x = ARENA.halfW - m;
        z = THREE.MathUtils.randFloat(-ARENA.halfD + m, ARENA.halfD - m);
      } else if (side === 2) {
        z = -ARENA.halfD + m;
        x = THREE.MathUtils.randFloat(-ARENA.halfW + m, ARENA.halfW - m);
      } else {
        z = ARENA.halfD - m;
        x = THREE.MathUtils.randFloat(-ARENA.halfW + m, ARENA.halfW - m);
      }

      mesh.position.set(x, 0.75, z);
      scene.add(mesh);

      enemies.push({
        mesh,
        hp: 18 + game.level * 4,
        speed: 1.8 + game.level * 0.06 + Math.random() * 0.4,
        dmg: 10 + game.level * 1.1,
        hitRadius: 0.95,
        wanderT: Math.random() * 2,
        wanderDir: Math.random() * Math.PI * 2
      });
    }

    function ensureEnemies(n) {
      while (enemies.length < n) spawnEnemy();
    }
    ensureEnemies(10);

    function swingStats() {
      return {
        reach: 1.9 + (game.level - 1) * 0.14,
        dmg: 10 + (game.level - 1) * 2.2
      };
    }

    function addXP(amount) {
      game.xp += amount;
      while (game.xp >= xpToNext(game.level)) {
        game.xp -= xpToNext(game.level);
        game.level++;
        game.hpMax = Math.round(game.hpMax + 10);
        game.hp = Math.min(game.hpMax, game.hp + 18);
        applyLevelVisuals();
        pop && pop(980, 0.09, 0.06, "sine");
      }
    }

    function startSwing() {
      if (!game.alive || game.swingCd > 0) return;
      game.swingCd = game.swingCdMax;
      game.swingT = 0.0001;
      swordPivot.userData.didHit = false;
      pop && pop(520, 0.05, 0.06, "square");
    }

    function damageEnemiesInFrontCone() {
      const stats = swingStats();
      const yaw = player.rotation.y;
      const fx = Math.sin(yaw);
      const fz = Math.cos(yaw);
      const px = player.position.x;
      const pz = player.position.z;

      let killed = 0;
      for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        const ex = e.mesh.position.x;
        const ez = e.mesh.position.z;
        const dx = ex - px;
        const dz = ez - pz;
        const dist = Math.hypot(dx, dz);
        if (dist > stats.reach + 0.65) continue;

        const dot = (dx / Math.max(0.0001, dist)) * fx + (dz / Math.max(0.0001, dist)) * fz;
        if (dot < 0.15) continue;

        e.hp -= stats.dmg;
        const nx = dx / Math.max(0.0001, dist);
        const nz = dz / Math.max(0.0001, dist);
        e.mesh.position.x += nx * 0.35;
        e.mesh.position.z += nz * 0.35;

        if (e.hp <= 0) {
          const drops = 3 + Math.floor(game.level * 0.35);
          for (let k = 0; k < drops; k++) {
            spawnOrb({
              x: ex + THREE.MathUtils.randFloat(-0.7, 0.7),
              z: ez + THREE.MathUtils.randFloat(-0.7, 0.7)
            }, 1);
          }
          scene.remove(e.mesh);
          enemies.splice(i, 1);
          killed++;
        }
      }
      if (killed > 0) pop && pop(820, 0.06, 0.05, "triangle");
    }

    function restart() {
      game.alive = true;
      game.hpMax = 100;
      game.hp = 100;
      game.level = 1;
      game.xp = 0;
      game.invuln = 0;
      game.dashCd = 0;
      game.swingCd = 0;
      game.swingT = 0;

      player.position.set(0, 1.2, 0);
      player.rotation.y = 0;

      applyLevelVisuals();

      for (const e of enemies) scene.remove(e.mesh);
      enemies.length = 0;
      for (const o of orbs) scene.remove(o.mesh);
      orbs.length = 0;

      ensureOrbs(28);
      ensureEnemies(10);
    }

    function die() {
      game.alive = false;
      pop && pop(180, 0.12, 0.08, "sawtooth");
    }

    function update(args2) {
      const dt = args2.dt;
      const t = args2.t;
      const input = args2.input;

      game.dashCd = Math.max(0, game.dashCd - dt);
      game.swingCd = Math.max(0, game.swingCd - dt);
      game.invuln = Math.max(0, game.invuln - dt);

      if (input.wantSwing) {
        input.wantSwing = false;
        startSwing();
      }

      let mx = 0;
      let mz = 0;
      if (input.w) mz -= 1;
      if (input.s) mz += 1;
      if (input.a) mx -= 1;
      if (input.d) mx += 1;

      const len = Math.hypot(mx, mz);
      if (len > 0) {
        mx /= len;
        mz /= len;
      }

      let speed = 6.5;
      if (game.alive && input.shift && game.dashCd <= 0 && len > 0) {
        speed = 15.0;
        game.dashCd = game.dashCdMax;
        pop && pop(600, 0.04, 0.03, "square");
      }

      if (game.alive) {
        player.position.x += mx * speed * dt;
        player.position.z += mz * speed * dt;
      }

      player.position.x = clamp(player.position.x, -ARENA.halfW, ARENA.halfW);
      player.position.z = clamp(player.position.z, -ARENA.halfD, ARENA.halfD);

      if (len > 0) {
        const targetYaw = Math.atan2(mx, mz);
        player.rotation.y = lerpAngle(player.rotation.y, targetYaw, 0.22);
      }

      const moveAmount = len * speed;
      player.position.y = 1.2 + Math.sin(t * 10) * 0.06 * Math.min(moveAmount / 6.5, 1);
      halo.rotation.z += dt * (0.9 + moveAmount * 0.03);

      const yaw = player.rotation.y;
      const fx = Math.sin(yaw);
      const fz = Math.cos(yaw);
      pointer.position.x = player.position.x + fx * 0.95;
      pointer.position.z = player.position.z + fz * 0.95;
      pointer.position.y = 0.06 + Math.sin(t * 6) * 0.01;
      pointer.rotation.z = -yaw;
      frontGem.material.emissiveIntensity = 2.7 + Math.sin(t * 6) * 0.35;

      const heldAngle = 0.15;
      const heldTilt = 0.18;
      if (game.swingT > 0) {
        game.swingT += dt;
        const a = Math.min(game.swingT / 0.11, 1);
        const swing = Math.sin(a * Math.PI);

        sword.rotation.y = heldAngle + swing * 1.6;
        sword.rotation.z = heldTilt + swing * 0.45;
        trail.material.opacity = 0.18 * swing;

        if (a > 0.35 && a < 0.50 && !swordPivot.userData.didHit) {
          swordPivot.userData.didHit = true;
          damageEnemiesInFrontCone();
        }
        if (a >= 1) {
          game.swingT = 0;
          swordPivot.userData.didHit = false;
          sword.rotation.y = heldAngle;
          sword.rotation.z = heldTilt;
          trail.material.opacity = 0;
        }
      } else {
        sword.rotation.y = heldAngle;
        sword.rotation.z = heldTilt;
        trail.material.opacity = 0;
        swordPivot.userData.didHit = false;
      }

      if (game.alive) {
        const px = player.position.x;
        const pz = player.position.z;

        for (const e of enemies) {
          const m = e.mesh;
          const vx = px - m.position.x;
          const vz = pz - m.position.z;
          const d = Math.hypot(vx, vz);

          let tx = 0;
          let tz = 0;
          if (d < 8.5 + game.level * 0.15) {
            if (d > 0.0001) {
              tx = vx / d;
              tz = vz / d;
            }
          } else {
            e.wanderT -= dt;
            if (e.wanderT <= 0) {
              e.wanderT = THREE.MathUtils.randFloat(0.7, 2.0);
              e.wanderDir += THREE.MathUtils.randFloat(-1.2, 1.2);
            }
            tx = Math.sin(e.wanderDir);
            tz = Math.cos(e.wanderDir);
          }

          m.position.x = clamp(m.position.x + tx * e.speed * dt, -ARENA.halfW, ARENA.halfW);
          m.position.z = clamp(m.position.z + tz * e.speed * dt, -ARENA.halfD, ARENA.halfD);
          m.position.y = 0.75 + Math.sin(t * 5.5 + m.position.x * 0.3) * 0.05;

          if (game.invuln <= 0) {
            const dd = Math.hypot(px - m.position.x, pz - m.position.z);
            if (dd < e.hitRadius + 0.85) {
              game.hp -= e.dmg;
              game.invuln = 0.35;
              pop && pop(240, 0.05, 0.07, "square");

              const nx = (px - m.position.x) / Math.max(0.0001, dd);
              const nz = (pz - m.position.z) / Math.max(0.0001, dd);
              player.position.x = clamp(player.position.x + nx * 0.55, -ARENA.halfW, ARENA.halfW);
              player.position.z = clamp(player.position.z + nz * 0.55, -ARENA.halfD, ARENA.halfD);

              if (game.hp <= 0) {
                game.hp = 0;
                die();
                break;
              }
            }
          }
        }
      }

      if (game.alive) {
        const px = player.position.x;
        const pz = player.position.z;
        for (let i = orbs.length - 1; i >= 0; i--) {
          const o = orbs[i];
          const m = o.mesh;

          m.position.y = 0.45 + Math.sin(t * 2.7 + o.seed) * 0.08;
          m.rotation.y += dt * 1.6;
          m.rotation.x += dt * 0.9;

          const d = Math.hypot(m.position.x - px, m.position.z - pz);
          const pickR = 0.9 + (game.level - 1) * 0.02;
          if (d < pickR) {
            addXP(o.value);
            pop && pop(680, 0.04, 0.04, "triangle");
            scene.remove(m);
            orbs.splice(i, 1);
          }
        }
      }

      ensureOrbs(28);
      ensureEnemies(10 + Math.floor(game.level * 0.7));
    }

    return { game, player, enemies, orbs, restart, update, swingStats };
  };
})();
