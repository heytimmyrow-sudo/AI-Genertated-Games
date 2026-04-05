(function () {
  const StillwakeHouse = window.StillwakeHouse || (window.StillwakeHouse = {});
  const { CONFIG } = StillwakeHouse;

  class HouseWorld {
    constructor(scene) {
      this.scene = scene;
      this.materials = this.createMaterials();
      this.zones = {};
      this.currentBuildZone = null;
      this.currentBounds = CONFIG.world.bounds;
      this.colliders = [];
      this.interactables = [];
      this.build();
    }

    createMaterials() {
      return {
        floorWood: new THREE.MeshStandardMaterial({ color: 0x74492e, roughness: 0.88 }),
        darkWood: new THREE.MeshStandardMaterial({ color: 0x5b3824, roughness: 0.93 }),
        midWood: new THREE.MeshStandardMaterial({ color: 0x875537, roughness: 0.89 }),
        lightWood: new THREE.MeshStandardMaterial({ color: 0xb27b50, roughness: 0.85 }),
        wall: new THREE.MeshStandardMaterial({ color: 0xe9d8c2, roughness: 0.98 }),
        wallShade: new THREE.MeshStandardMaterial({ color: 0xdcc4aa, roughness: 0.99 }),
        ceiling: new THREE.MeshStandardMaterial({ color: 0xf1e4cf, roughness: 1 }),
        grass: new THREE.MeshStandardMaterial({ color: 0x758e62, roughness: 1 }),
        foliage: new THREE.MeshStandardMaterial({ color: 0x6c8054, roughness: 0.96 }),
        path: new THREE.MeshStandardMaterial({ color: 0xb18f70, roughness: 1 }),
        roof: new THREE.MeshStandardMaterial({ color: 0x7a5d4e, roughness: 0.95 }),
        fabricCream: new THREE.MeshStandardMaterial({ color: 0xede1cf, roughness: 1 }),
        fabricBlue: new THREE.MeshStandardMaterial({ color: 0x67778a, roughness: 0.98 }),
        fabricRed: new THREE.MeshStandardMaterial({ color: 0x9c6658, roughness: 0.98 }),
        fabricGold: new THREE.MeshStandardMaterial({ color: 0xbe986a, roughness: 0.97 }),
        brass: new THREE.MeshStandardMaterial({ color: 0xc49c68, roughness: 0.52, metalness: 0.14 }),
        glass: new THREE.MeshStandardMaterial({
          color: 0xd3e4f0,
          roughness: 0.14,
          metalness: 0.1,
          transparent: true,
          opacity: 0.36
        }),
        paper: new THREE.MeshStandardMaterial({ color: 0xebd9b9, roughness: 1 }),
        bookBlue: new THREE.MeshStandardMaterial({ color: 0x5f7087, roughness: 0.92 }),
        bookGreen: new THREE.MeshStandardMaterial({ color: 0x6e7d5a, roughness: 0.94 }),
        bookGold: new THREE.MeshStandardMaterial({ color: 0xb48a58, roughness: 0.9 }),
        candleWax: new THREE.MeshStandardMaterial({ color: 0xf5e6c8, roughness: 0.95 }),
        blanketWarm: new THREE.MeshStandardMaterial({ color: 0xb87a63, roughness: 0.98 })
      };
    }

    createZone(name, bounds) {
      const group = new THREE.Group();
      group.visible = false;
      this.scene.add(group);
      this.zones[name] = {
        name: name,
        group: group,
        bounds: bounds,
        colliders: [],
        interactables: [],
        dustSystems: []
      };
      return this.zones[name];
    }

    setBuildZone(name) {
      this.currentBuildZone = this.zones[name];
    }

    clearBuildZone() {
      this.currentBuildZone = null;
    }

    shadowed(mesh, cast, receive) {
      mesh.castShadow = cast;
      mesh.receiveShadow = receive;
      return mesh;
    }

    addMesh(geometry, material, x, y, z, rx, ry, rz, cast, receive) {
      const mesh = this.shadowed(new THREE.Mesh(geometry, material), cast !== false, receive !== false);
      mesh.position.set(x || 0, y || 0, z || 0);
      mesh.rotation.set(rx || 0, ry || 0, rz || 0);
      if (this.currentBuildZone) {
        this.currentBuildZone.group.add(mesh);
      } else {
        this.scene.add(mesh);
      }
      return mesh;
    }

    addCollider(x, z, w, d) {
      const target = this.currentBuildZone ? this.currentBuildZone.colliders : this.colliders;
      target.push({
        minX: x - w / 2,
        maxX: x + w / 2,
        minZ: z - d / 2,
        maxZ: z + d / 2
      });
    }

    addInteractable(interactable) {
      const target = this.currentBuildZone ? this.currentBuildZone.interactables : this.interactables;
      target.push(interactable);
    }

    addDustCluster(x, y, z, spreadX, spreadY, spreadZ, count) {
      const geo = new THREE.BufferGeometry();
      const positions = new Float32Array(count * 3);
      for (let i = 0; i < count; i += 1) {
        positions[i * 3] = x + (Math.random() - 0.5) * spreadX;
        positions[i * 3 + 1] = y + Math.random() * spreadY;
        positions[i * 3 + 2] = z + (Math.random() - 0.5) * spreadZ;
      }
      geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      const dust = new THREE.Points(
        geo,
        new THREE.PointsMaterial({ color: 0xfff2d2, size: 0.026, transparent: true, opacity: 0.34 })
      );
      dust.userData.baseY = y;
      if (this.currentBuildZone) {
        this.currentBuildZone.group.add(dust);
        this.currentBuildZone.dustSystems.push(dust);
      } else {
        this.scene.add(dust);
      }
    }

    setZone(name) {
      for (const zoneName of Object.keys(this.zones)) {
        this.zones[zoneName].group.visible = zoneName === name;
      }
      const zone = this.zones[name];
      this.currentZone = name;
      this.currentBounds = zone.bounds;
      this.colliders = zone.colliders;
      this.interactables = zone.interactables;
    }

    getBounds() {
      return this.currentBounds;
    }

    buildRoof(origin, room) {
      const mats = this.materials;
      const roofHalf = new THREE.BoxGeometry(room.width + 0.7, 0.22, room.depth / 2 + 0.45);
      const left = this.shadowed(new THREE.Mesh(roofHalf, mats.roof), true, true);
      left.position.set(origin.x, room.wallHeight + 0.72, origin.z - room.depth * 0.14);
      left.rotation.x = -0.22;
      this.currentBuildZone.group.add(left);

      const right = this.shadowed(new THREE.Mesh(roofHalf, mats.roof), true, true);
      right.position.set(origin.x, room.wallHeight + 0.72, origin.z + room.depth * 0.14);
      right.rotation.x = 0.22;
      this.currentBuildZone.group.add(right);

      this.addMesh(
        new THREE.BoxGeometry(room.width + 0.3, 0.08, 0.18),
        mats.lightWood,
        origin.x,
        room.wallHeight + 0.98,
        origin.z,
        0,
        0,
        0,
        true,
        true
      );
      this.addMesh(
        new THREE.BoxGeometry(room.width + 0.36, 0.06, 0.06),
        mats.darkWood,
        origin.x,
        room.wallHeight + 1.06,
        origin.z,
        0,
        0,
        0,
        true,
        true
      );
    }

    addPottedShape(x, z, scale) {
      const pot = this.addMesh(
        new THREE.CylinderGeometry(0.14 * scale, 0.18 * scale, 0.22 * scale, 12),
        this.materials.midWood,
        x,
        0.12 * scale,
        z,
        0,
        0,
        0,
        true,
        true
      );
      pot.material = this.materials.midWood;
      const leaves = this.addMesh(
        new THREE.SphereGeometry(0.2 * scale, 12, 10),
        this.materials.foliage,
        x,
        0.34 * scale,
        z,
        0,
        0,
        0,
        true,
        true
      );
      leaves.scale.set(1, 0.8, 1);
      return { pot: pot, leaves: leaves };
    }

    addTree(x, z, scale) {
      const trunk = this.addMesh(
        new THREE.CylinderGeometry(0.12 * scale, 0.16 * scale, 1.3 * scale, 10),
        this.materials.darkWood,
        x,
        0.65 * scale,
        z,
        0,
        0,
        0,
        true,
        true
      );
      trunk.material = trunk.material.clone();
      trunk.material.color.offsetHSL(0.02, 0.03, 0.02);

      const crown = this.addMesh(
        new THREE.SphereGeometry(0.62 * scale, 14, 12),
        this.materials.foliage,
        x,
        1.58 * scale,
        z,
        0,
        0,
        0,
        true,
        true
      );
      crown.scale.set(1.08, 0.92, 1);

      this.addMesh(
        new THREE.SphereGeometry(0.4 * scale, 12, 10),
        this.materials.foliage,
        x - 0.34 * scale,
        1.46 * scale,
        z + 0.12 * scale,
        0,
        0,
        0,
        true,
        true
      );
      this.addMesh(
        new THREE.SphereGeometry(0.36 * scale, 12, 10),
        this.materials.foliage,
        x + 0.3 * scale,
        1.38 * scale,
        z - 0.08 * scale,
        0,
        0,
        0,
        true,
        true
      );
    }

    addBush(x, z, scale) {
      const base = this.addMesh(
        new THREE.SphereGeometry(0.34 * scale, 12, 10),
        this.materials.foliage,
        x,
        0.22 * scale,
        z,
        0,
        0,
        0,
        true,
        true
      );
      base.scale.set(1.2, 0.72, 1);
      const side = this.addMesh(
        new THREE.SphereGeometry(0.22 * scale, 10, 8),
        this.materials.foliage,
        x + 0.24 * scale,
        0.2 * scale,
        z + 0.12 * scale,
        0,
        0,
        0,
        true,
        true
      );
      side.scale.set(1, 0.7, 1);
      this.addMesh(
        new THREE.SphereGeometry(0.2 * scale, 10, 8),
        this.materials.foliage,
        x - 0.22 * scale,
        0.18 * scale,
        z - 0.08 * scale,
        0,
        0,
        0,
        true,
        true
      ).scale.set(1, 0.68, 1);
      return { base: base, side: side };
    }

    addRock(x, z, scale, rotationY) {
      const rock = this.addMesh(
        new THREE.DodecahedronGeometry(0.26 * scale, 0),
        this.materials.path,
        x,
        0.12 * scale,
        z,
        0.22,
        rotationY || 0,
        -0.16,
        true,
        true
      );
      rock.scale.set(1.2, 0.7, 0.95);
      rock.material = rock.material.clone();
      rock.material.color.offsetHSL(0, -0.08, -0.06);
    }

    buildRug(x, z, width, depth, rotationY, accentMaterial) {
      const base = this.addMesh(
        new THREE.BoxGeometry(width, 0.024, depth),
        accentMaterial || this.materials.fabricRed,
        x,
        0.018,
        z,
        0,
        rotationY || 0,
        0,
        false,
        true
      );
      const inner = this.addMesh(
        new THREE.BoxGeometry(width - 0.18, 0.012, depth - 0.18),
        this.materials.fabricGold,
        x,
        0.028,
        z,
        0,
        rotationY || 0,
        0,
        false,
        true
      );
      base.material = base.material.clone();
      base.material.color.offsetHSL(0, 0, -0.03);
      inner.material = inner.material.clone();
      inner.material.color.offsetHSL(0, -0.03, 0.02);
    }

    addShelfBooks(x, y, z, count) {
      const mats = [this.materials.bookBlue, this.materials.bookGreen, this.materials.bookGold];
      for (let i = 0; i < count; i += 1) {
        const mat = mats[i % mats.length];
        const height = 0.24 + i * 0.03;
        this.addMesh(
          new THREE.BoxGeometry(0.1, height, 0.14),
          mat,
          x + i * 0.14,
          y + height / 2,
          z,
          0,
          0,
          i % 2 === 0 ? 0.02 : -0.02,
          true,
          true
        );
      }
    }

    addFoldedCloth(x, y, z, rotationY, width, depth) {
      const cloth = this.addMesh(
        new THREE.BoxGeometry(width, 0.035, depth),
        this.materials.blanketWarm,
        x,
        y,
        z,
        0,
        rotationY || 0,
        0,
        true,
        true
      );
      cloth.material = cloth.material.clone();
      cloth.material.color.offsetHSL(0.01, -0.02, 0.02);

      this.addMesh(
        new THREE.BoxGeometry(width * 0.78, 0.022, depth * 0.66),
        this.materials.fabricCream,
        x + 0.02,
        y + 0.022,
        z - 0.01,
        0,
        rotationY || 0,
        0,
        true,
        true
      );
    }

    addSmallVessel(x, y, z, scale) {
      const body = this.addMesh(
        new THREE.CylinderGeometry(0.07 * scale, 0.09 * scale, 0.2 * scale, 12),
        this.materials.lightWood,
        x,
        y,
        z,
        0,
        0,
        0,
        true,
        true
      );
      body.material = body.material.clone();
      body.material.color.offsetHSL(-0.01, -0.08, 0.04);
      this.addMesh(
        new THREE.TorusGeometry(0.05 * scale, 0.012 * scale, 8, 12),
        this.materials.brass,
        x - 0.06 * scale,
        y + 0.01 * scale,
        z + 0.01 * scale,
        Math.PI / 2,
        0,
        0,
        false,
        false
      );
    }

    buildSmallChest(x, z, rotationY, scale) {
      const chest = new THREE.Group();
      const body = this.shadowed(new THREE.Mesh(
        new THREE.BoxGeometry(0.86 * scale, 0.42 * scale, 0.48 * scale),
        this.materials.midWood
      ), true, true);
      body.position.y = 0.21 * scale;
      chest.add(body);

      const lid = this.shadowed(new THREE.Mesh(
        new THREE.BoxGeometry(0.92 * scale, 0.1 * scale, 0.54 * scale),
        this.materials.darkWood
      ), true, true);
      lid.position.y = 0.49 * scale;
      chest.add(lid);

      const band = this.shadowed(new THREE.Mesh(
        new THREE.BoxGeometry(0.08 * scale, 0.44 * scale, 0.5 * scale),
        this.materials.brass
      ), true, true);
      band.position.set(0, 0.22 * scale, 0);
      chest.add(band);

      chest.position.set(x, 0, z);
      chest.rotation.y = rotationY || 0;
      this.currentBuildZone.group.add(chest);
    }

    buildExteriorHouse(origin, room, doorSide, doorZ) {
      const mats = this.materials;
      const wallT = 0.2;
      const wallHeight = room.wallHeight * 0.84;
      const sideSign = doorSide === "east" ? 1 : -1;
      const splitX = origin.x + sideSign * room.width / 2;
      const doorWidth = 1.24;
      const leftDepth = doorZ - doorWidth / 2 - (origin.z - room.depth / 2);
      const rightDepth = (origin.z + room.depth / 2) - (doorZ + doorWidth / 2);

      this.addMesh(new THREE.BoxGeometry(room.width, wallHeight, wallT), mats.wall, origin.x, wallHeight / 2, origin.z - room.depth / 2, 0, 0, 0, false, true);
      this.addCollider(origin.x, origin.z - room.depth / 2, room.width, wallT);
      this.addMesh(new THREE.BoxGeometry(room.width, wallHeight, wallT), mats.wall, origin.x, wallHeight / 2, origin.z + room.depth / 2, 0, 0, 0, false, true);
      this.addCollider(origin.x, origin.z + room.depth / 2, room.width, wallT);

      const solidSideX = origin.x - sideSign * room.width / 2;
      this.addMesh(new THREE.BoxGeometry(wallT, wallHeight, room.depth), mats.wall, solidSideX, wallHeight / 2, origin.z, 0, 0, 0, false, true);
      this.addCollider(solidSideX, origin.z, wallT, room.depth);

      if (leftDepth > 0.2) {
        const z = origin.z - room.depth / 2 + leftDepth / 2;
        this.addMesh(new THREE.BoxGeometry(wallT, wallHeight, leftDepth), mats.wall, splitX, wallHeight / 2, z, 0, 0, 0, false, true);
        this.addCollider(splitX, z, wallT, leftDepth);
      }
      if (rightDepth > 0.2) {
        const z = origin.z + room.depth / 2 - rightDepth / 2;
        this.addMesh(new THREE.BoxGeometry(wallT, wallHeight, rightDepth), mats.wall, splitX, wallHeight / 2, z, 0, 0, 0, false, true);
        this.addCollider(splitX, z, wallT, rightDepth);
      }

      this.addMesh(new THREE.BoxGeometry(room.width + 0.12, 0.24, room.depth + 0.12), mats.darkWood, origin.x, 0.02, origin.z, 0, 0, 0, false, true);
      this.addMesh(new THREE.BoxGeometry(room.width + 0.18, 0.1, 0.12), mats.lightWood, origin.x, wallHeight + 0.02, origin.z - room.depth / 2, 0, 0, 0, true, true);
      this.addMesh(new THREE.BoxGeometry(room.width + 0.18, 0.1, 0.12), mats.lightWood, origin.x, wallHeight + 0.02, origin.z + room.depth / 2, 0, 0, 0, true, true);
      this.addMesh(new THREE.BoxGeometry(0.12, wallHeight + 0.08, room.depth + 0.18), mats.lightWood, origin.x - room.width / 2, wallHeight / 2, origin.z, 0, 0, 0, true, true);
      this.addMesh(new THREE.BoxGeometry(0.12, wallHeight + 0.08, room.depth + 0.18), mats.lightWood, origin.x + room.width / 2, wallHeight / 2, origin.z, 0, 0, 0, true, true);

      const porchX = origin.x + sideSign * (room.width / 2 + 0.5);
      this.addMesh(new THREE.BoxGeometry(1.44, 0.12, 1.68), mats.path, porchX, 0.05, doorZ, 0, 0.02, 0, false, true);
      this.addMesh(new THREE.BoxGeometry(0.22, 0.16, 1.54), mats.darkWood, porchX - sideSign * 0.54, 0.08, doorZ, 0, 0, 0, true, true);
      this.addMesh(new THREE.BoxGeometry(0.82, 0.08, 1.24), mats.lightWood, porchX, 0.15, doorZ, 0, 0.02, 0, true, true);

      const windowX = origin.x - sideSign * (room.width / 2 - 0.02);
      const outerFrame = this.addMesh(new THREE.BoxGeometry(0.18, 1.56, 1.98), mats.darkWood, windowX, 2.05, origin.z - 1.4, 0, 0, 0, true, true);
      const innerFrame = this.addMesh(new THREE.BoxGeometry(0.1, 1.28, 1.62), mats.lightWood, windowX + sideSign * 0.02, 2.05, origin.z - 1.4, 0, 0, 0, true, true);
      const mullion = this.addMesh(new THREE.BoxGeometry(0.05, 1.14, 0.09), mats.midWood, windowX + sideSign * 0.03, 2.05, origin.z - 1.4, 0, 0, 0, true, true);
      const rail = this.addMesh(new THREE.BoxGeometry(0.05, 0.08, 1.46), mats.midWood, windowX + sideSign * 0.03, 2.05, origin.z - 1.4, 0, 0, 0, true, true);
      this.addMesh(new THREE.BoxGeometry(0.04, 1.08, 1.32), mats.glass, windowX + sideSign * 0.07, 2.05, origin.z - 1.4, 0, 0, 0, false, true);
      this.addMesh(new THREE.BoxGeometry(0.3, 0.09, 2.08), mats.lightWood, windowX + sideSign * 0.02, 1.22, origin.z - 1.4, 0, 0, 0, true, true);
      this.addMesh(new THREE.BoxGeometry(0.18, 0.08, 1.72), mats.darkWood, windowX - sideSign * 0.02, 2.88, origin.z - 1.4, 0, 0, 0, true, true);
      outerFrame.receiveShadow = innerFrame.receiveShadow = mullion.receiveShadow = rail.receiveShadow = true;

      const doorFrameX = origin.x + sideSign * (room.width / 2 - 0.06);
      this.addMesh(new THREE.BoxGeometry(0.26, 0.22, 1.48), mats.darkWood, doorFrameX, 2.42, doorZ, 0, 0, 0, true, true);
      this.addMesh(new THREE.BoxGeometry(0.24, 2.54, 0.2), mats.darkWood, doorFrameX, 1.19, doorZ - 0.58, 0, 0, 0, true, true);
      this.addMesh(new THREE.BoxGeometry(0.24, 2.54, 0.2), mats.darkWood, doorFrameX, 1.19, doorZ + 0.58, 0, 0, 0, true, true);
      const doorX = origin.x + sideSign * (room.width / 2 - 0.14);
      this.addMesh(new THREE.BoxGeometry(0.16, 2.28, 1.08), mats.midWood, doorX, 1.15, doorZ, 0, 0, 0, true, true);
      this.addMesh(new THREE.BoxGeometry(0.03, 2.02, 0.08), mats.darkWood, doorX + sideSign * 0.05, 1.15, doorZ - 0.36, 0, 0, 0, true, true);
      this.addMesh(new THREE.BoxGeometry(0.03, 2.02, 0.08), mats.darkWood, doorX + sideSign * 0.05, 1.15, doorZ + 0.36, 0, 0, 0, true, true);
      this.addMesh(new THREE.BoxGeometry(0.03, 0.08, 0.76), mats.darkWood, doorX + sideSign * 0.05, 2.0, doorZ, 0, 0, 0, true, true);
      this.addMesh(new THREE.BoxGeometry(0.03, 0.08, 0.76), mats.darkWood, doorX + sideSign * 0.05, 1.12, doorZ, 0, 0, 0, true, true);
      this.addMesh(new THREE.BoxGeometry(0.03, 0.08, 0.76), mats.darkWood, doorX + sideSign * 0.05, 0.27, doorZ, 0, 0, 0, true, true);
      this.addMesh(new THREE.SphereGeometry(0.05, 12, 12), mats.brass, doorX - sideSign * 0.08, 1.1, doorZ + 0.26, 0, 0, 0, true, true);
      this.buildRoof(origin, { width: room.width, depth: room.depth, wallHeight: wallHeight });

      const gableHeight = 0.72;
      const gableShape = new THREE.Shape();
      gableShape.moveTo(-room.depth / 2 - 0.22, 0);
      gableShape.lineTo(0, gableHeight);
      gableShape.lineTo(room.depth / 2 + 0.22, 0);
      gableShape.lineTo(-room.depth / 2 - 0.22, 0);
      const gableGeo = new THREE.ExtrudeGeometry(gableShape, { depth: 0.08, bevelEnabled: false });
      const frontGable = this.shadowed(new THREE.Mesh(gableGeo, mats.lightWood), true, true);
      frontGable.position.set(origin.x + room.width / 2 + 0.02, wallHeight - 0.02, origin.z - room.depth / 2 - 0.04);
      frontGable.rotation.set(0, Math.PI / 2, 0);
      this.currentBuildZone.group.add(frontGable);
      const backGable = frontGable.clone();
      backGable.position.x = origin.x - room.width / 2 - 0.1;
      this.currentBuildZone.group.add(backGable);
    }

    buildRoomShell(origin, room, door) {
      const mats = this.materials;
      const wallT = 0.18;

      const floor = this.addMesh(new THREE.BoxGeometry(room.width, 0.22, room.depth), mats.floorWood, origin.x, -0.11, origin.z);
      floor.receiveShadow = true;

      for (let i = 0; i < 9; i += 1) {
        const plank = this.addMesh(
          new THREE.BoxGeometry(room.width - 0.2, 0.01, 0.015),
          mats.darkWood,
          origin.x,
          0.005,
          origin.z - room.depth / 2 + 0.9 + i * 1.1,
          0,
          0,
          0,
          false,
          true
        );
        plank.material = plank.material.clone();
        plank.material.color.offsetHSL(0, 0, i % 2 === 0 ? -0.02 : 0.02);
      }

      this.addMesh(new THREE.BoxGeometry(room.width, 0.12, room.depth), mats.ceiling, origin.x, room.wallHeight, origin.z, 0, 0, 0, false, true);

      const sideSign = door.side === "east" ? 1 : -1;
      const splitX = origin.x + sideSign * room.width / 2;
      const centerZ = origin.z + door.z;
      const doorWidth = door.width;
      const leftDepth = centerZ - doorWidth / 2 - (origin.z - room.depth / 2);
      const rightDepth = (origin.z + room.depth / 2) - (centerZ + doorWidth / 2);

      this.addMesh(new THREE.BoxGeometry(room.width, room.wallHeight, wallT), mats.wall, origin.x, room.wallHeight / 2, origin.z - room.depth / 2, 0, 0, 0, false, true);
      this.addCollider(origin.x, origin.z - room.depth / 2, room.width, wallT);
      this.addMesh(new THREE.BoxGeometry(room.width, room.wallHeight, wallT), mats.wall, origin.x, room.wallHeight / 2, origin.z + room.depth / 2, 0, 0, 0, false, true);
      this.addCollider(origin.x, origin.z + room.depth / 2, room.width, wallT);

      const solidSideX = origin.x - sideSign * room.width / 2;
      this.addMesh(new THREE.BoxGeometry(wallT, room.wallHeight, room.depth), mats.wall, solidSideX, room.wallHeight / 2, origin.z, 0, 0, 0, false, true);
      this.addCollider(solidSideX, origin.z, wallT, room.depth);

      if (leftDepth > 0.2) {
        const z = origin.z - room.depth / 2 + leftDepth / 2;
        this.addMesh(new THREE.BoxGeometry(wallT, room.wallHeight, leftDepth), mats.wall, splitX, room.wallHeight / 2, z, 0, 0, 0, false, true);
        this.addCollider(splitX, z, wallT, leftDepth);
      }
      if (rightDepth > 0.2) {
        const z = origin.z + room.depth / 2 - rightDepth / 2;
        this.addMesh(new THREE.BoxGeometry(wallT, room.wallHeight, rightDepth), mats.wall, splitX, room.wallHeight / 2, z, 0, 0, 0, false, true);
        this.addCollider(splitX, z, wallT, rightDepth);
      }

      const baseboards = [
        { x: origin.x, z: origin.z - room.depth / 2 + 0.04, w: room.width - 0.28, d: 0.08 },
        { x: origin.x, z: origin.z + room.depth / 2 - 0.04, w: room.width - 0.28, d: 0.08 },
        { x: solidSideX, z: origin.z, w: 0.08, d: room.depth - 0.28 }
      ];

      for (const strip of baseboards) {
        this.addMesh(new THREE.BoxGeometry(strip.w, 0.16, strip.d), mats.darkWood, strip.x, 0.14, strip.z, 0, 0, 0, false, true);
      }
      if (leftDepth > 0.2) {
        this.addMesh(new THREE.BoxGeometry(0.08, 0.16, leftDepth - 0.16), mats.darkWood, splitX, 0.14, origin.z - room.depth / 2 + leftDepth / 2, 0, 0, 0, false, true);
      }
      if (rightDepth > 0.2) {
        this.addMesh(new THREE.BoxGeometry(0.08, 0.16, rightDepth - 0.16), mats.darkWood, splitX, 0.14, origin.z + room.depth / 2 - rightDepth / 2, 0, 0, 0, false, true);
      }

      const ceilingBeams = [-3.7, 0, 3.7];
      for (const z of ceilingBeams) {
        this.addMesh(new THREE.BoxGeometry(room.width - 0.1, 0.18, 0.22), mats.darkWood, origin.x, room.wallHeight - 0.1, origin.z + z, 0, 0, 0, false, true);
      }
    }

    buildDoorFrame(origin, room, door) {
      const mats = this.materials;
      const sideSign = door.side === "east" ? 1 : -1;
      const frameX = origin.x + sideSign * (room.width / 2 - 0.08);
      const centerZ = origin.z + door.z;
      this.addMesh(new THREE.BoxGeometry(0.26, 0.2, door.width + 0.26), mats.darkWood, frameX, 2.52, centerZ, 0, 0, 0, true, true);
      this.addMesh(new THREE.BoxGeometry(0.24, 2.72, 0.2), mats.darkWood, frameX, 1.23, centerZ - door.width / 2, 0, 0, 0, true, true);
      this.addMesh(new THREE.BoxGeometry(0.24, 2.72, 0.2), mats.darkWood, frameX, 1.23, centerZ + door.width / 2, 0, 0, 0, true, true);
      this.addMesh(new THREE.BoxGeometry(0.18, 0.07, door.width + 0.08), mats.lightWood, frameX - sideSign * 0.06, 0.03, centerZ, 0, 0, 0, true, true);
      this.addMesh(new THREE.BoxGeometry(0.14, 2.36, door.width - 0.12), mats.midWood, frameX - sideSign * 0.11, 1.19, centerZ, 0, 0, 0, true, true);
      this.addMesh(new THREE.BoxGeometry(0.03, 2.12, 0.08), mats.darkWood, frameX - sideSign * 0.05, 1.19, centerZ - 0.37, 0, 0, 0, true, true);
      this.addMesh(new THREE.BoxGeometry(0.03, 2.12, 0.08), mats.darkWood, frameX - sideSign * 0.05, 1.19, centerZ + 0.37, 0, 0, 0, true, true);
      this.addMesh(new THREE.BoxGeometry(0.03, 0.08, 0.82), mats.darkWood, frameX - sideSign * 0.05, 2.08, centerZ, 0, 0, 0, true, true);
      this.addMesh(new THREE.BoxGeometry(0.03, 0.08, 0.82), mats.darkWood, frameX - sideSign * 0.05, 1.18, centerZ, 0, 0, 0, true, true);
      this.addMesh(new THREE.BoxGeometry(0.03, 0.08, 0.82), mats.darkWood, frameX - sideSign * 0.05, 0.3, centerZ, 0, 0, 0, true, true);
      this.addMesh(new THREE.SphereGeometry(0.05, 12, 12), mats.brass, frameX - sideSign * 0.18, 1.16, centerZ + 0.26, 0, 0, 0, true, true);
    }

    buildWindow(origin, room, zOffset) {
      const mats = this.materials;
      const wallX = origin.x + room.width / 2 - 0.02;
      const group = new THREE.Group();

      const casingTop = this.shadowed(new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.18, 2.34), mats.darkWood), true, true);
      casingTop.position.y = 0.8;
      group.add(casingTop);
      const casingBottom = this.shadowed(new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.12, 2.18), mats.midWood), true, true);
      casingBottom.position.y = -0.8;
      group.add(casingBottom);
      const casingSideGeo = new THREE.BoxGeometry(0.2, 1.64, 0.18);
      const leftCasing = this.shadowed(new THREE.Mesh(casingSideGeo, mats.darkWood), true, true);
      leftCasing.position.set(0, 0, -1.08);
      group.add(leftCasing);
      const rightCasing = leftCasing.clone();
      rightCasing.position.z = 1.08;
      group.add(rightCasing);
      const frameInner = this.shadowed(new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.4, 1.82), mats.lightWood), true, true);
      frameInner.position.x = -0.04;
      group.add(frameInner);
      const glassPane = this.shadowed(new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.14, 1.5), mats.glass), false, true);
      glassPane.position.x = -0.11;
      group.add(glassPane);
      const mullion = this.shadowed(new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.08, 0.09), mats.midWood), true, true);
      mullion.position.x = -0.03;
      group.add(mullion);
      const transom = this.shadowed(new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 1.44), mats.midWood), true, true);
      transom.position.x = -0.03;
      group.add(transom);
      const sill = this.shadowed(new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.09, 2.38), mats.lightWood), true, true);
      sill.position.set(-0.18, -0.88, 0);
      group.add(sill);

      group.position.set(wallX, 2.2, origin.z + zOffset);
      this.currentBuildZone.group.add(group);

      const sunbeam = this.addMesh(
        new THREE.PlaneGeometry(2.7, 2.4),
        new THREE.MeshBasicMaterial({ color: 0xffefc3, transparent: true, opacity: 0.13, side: THREE.DoubleSide }),
        origin.x + room.width / 2 - 2.6,
        1.45,
        origin.z + zOffset + 0.35,
        -0.48,
        Math.PI / 2,
        0.18,
        false,
        false
      );
      sunbeam.renderOrder = 2;
    }

    buildInteriorMysteryDoor(origin) {
      const mats = this.materials;
      this.addMesh(new THREE.BoxGeometry(1.34, 0.16, 0.2), mats.darkWood, origin.x - 0.8, 2.43, origin.z - 5.35, 0, 0, 0, true, true);
      this.addMesh(new THREE.BoxGeometry(0.16, 2.58, 0.2), mats.darkWood, origin.x - 1.4, 1.19, origin.z - 5.35, 0, 0, 0, true, true);
      this.addMesh(new THREE.BoxGeometry(0.16, 2.58, 0.2), mats.darkWood, origin.x - 0.2, 1.19, origin.z - 5.35, 0, 0, 0, true, true);
      this.addMesh(new THREE.BoxGeometry(1.16, 0.05, 0.16), mats.lightWood, origin.x - 0.8, 0.03, origin.z - 5.31, 0, 0, 0, true, true);
      this.addMesh(new THREE.BoxGeometry(1, 2.32, 0.11), mats.midWood, origin.x - 0.8, 1.19, origin.z - 5.28, 0, 0, 0, true, true);
      this.addMesh(new THREE.BoxGeometry(0.56, 0.66, 0.02), mats.lightWood, origin.x - 0.8, 1.66, origin.z - 5.21, 0, 0, 0, true, true);
      this.addMesh(new THREE.BoxGeometry(0.56, 0.66, 0.02), mats.lightWood, origin.x - 0.8, 0.75, origin.z - 5.21, 0, 0, 0, true, true);
      this.addMesh(new THREE.SphereGeometry(0.05, 12, 12), mats.brass, origin.x - 0.34, 1.12, origin.z - 5.2, 0, 0, 0, true, true);
    }

    buildTable(origin, rotationY) {
      const mats = this.materials;
      const table = new THREE.Group();

      const topCore = this.shadowed(new THREE.Mesh(new THREE.BoxGeometry(1.44, 0.09, 0.82), mats.midWood), true, true);
      topCore.position.y = 0.93;
      table.add(topCore);
      const topFront = this.shadowed(new THREE.Mesh(new THREE.BoxGeometry(1.58, 0.1, 0.1), mats.darkWood), true, true);
      topFront.position.set(0, 0.88, 0.36);
      table.add(topFront);
      const topBack = topFront.clone();
      topBack.position.z = -0.36;
      table.add(topBack);
      const topSide = this.shadowed(new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.72), mats.darkWood), true, true);
      topSide.position.set(-0.74, 0.88, 0);
      table.add(topSide);
      const topSide2 = topSide.clone();
      topSide2.position.x = 0.74;
      table.add(topSide2);
      const apronFront = this.shadowed(new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.11, 0.07), mats.darkWood), true, true);
      apronFront.position.set(0, 0.76, 0.28);
      table.add(apronFront);
      const apronBack = apronFront.clone();
      apronBack.position.z = -0.28;
      table.add(apronBack);
      const apronSide = this.shadowed(new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.11, 0.46), mats.darkWood), true, true);
      apronSide.position.set(-0.57, 0.76, 0);
      table.add(apronSide);
      const apronSide2 = apronSide.clone();
      apronSide2.position.x = 0.57;
      table.add(apronSide2);
      const legGeo = new THREE.CylinderGeometry(0.045, 0.06, 0.76, 10);
      for (const x of [-0.6, 0.6]) {
        for (const z of [-0.24, 0.24]) {
          const leg = this.shadowed(new THREE.Mesh(legGeo, mats.darkWood), true, true);
          leg.position.set(x, 0.38, z);
          table.add(leg);
        }
      }
      const stretcher = this.shadowed(new THREE.Mesh(new THREE.BoxGeometry(0.94, 0.05, 0.05), mats.lightWood), true, true);
      stretcher.position.set(0, 0.18, 0);
      table.add(stretcher);

      table.position.set(origin.x, 0, origin.z);
      table.rotation.y = rotationY || 0;
      this.currentBuildZone.group.add(table);
      this.addCollider(origin.x, origin.z, 1.82, 1.08);
    }

    buildChair(origin, rotationY, pulledOut) {
      const mats = this.materials;
      const chair = new THREE.Group();
      const seat = this.shadowed(new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.08, 0.54), mats.midWood), true, true);
      seat.position.y = 0.58;
      chair.add(seat);
      const seatCushion = this.shadowed(new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.045, 0.4), mats.fabricBlue), true, true);
      seatCushion.position.set(0, 0.64, 0.01);
      chair.add(seatCushion);
      const backPostGeo = new THREE.CylinderGeometry(0.038, 0.05, 0.96, 10);
      for (const x of [-0.2, 0.2]) {
        const post = this.shadowed(new THREE.Mesh(backPostGeo, mats.darkWood), true, true);
        post.position.set(x, 1.02, -0.22);
        chair.add(post);
      }
      const legGeo = new THREE.CylinderGeometry(0.038, 0.05, 0.62, 10);
      for (const x of [-0.22, 0.22]) {
        for (const z of [-0.21, 0.21]) {
          const leg = this.shadowed(new THREE.Mesh(legGeo, mats.darkWood), true, true);
          leg.position.set(x, 0.27, z);
          chair.add(leg);
        }
      }
      const backTop = this.shadowed(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 0.08), mats.midWood), true, true);
      backTop.position.set(0, 1.38, -0.22);
      chair.add(backTop);
      const backRail = this.shadowed(new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.07, 0.07), mats.lightWood), true, true);
      backRail.position.set(0, 1.06, -0.22);
      chair.add(backRail);
      for (const x of [-0.1, 0, 0.1]) {
        const slat = this.shadowed(new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.34, 0.04), mats.lightWood), true, true);
        slat.position.set(x, 0.95, -0.22);
        chair.add(slat);
      }
      const sideBrace = this.shadowed(new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.36), mats.darkWood), true, true);
      sideBrace.position.set(-0.16, 0.18, 0);
      chair.add(sideBrace);
      const sideBrace2 = sideBrace.clone();
      sideBrace2.position.x = 0.16;
      chair.add(sideBrace2);
      chair.position.set(origin.x, 0, origin.z);
      chair.rotation.y = rotationY;
      this.currentBuildZone.group.add(chair);
      this.addCollider(origin.x, origin.z, 0.86, pulledOut ? 1.04 : 0.86);
    }

    buildShelf(origin, rotationY, slightlyOpen) {
      const mats = this.materials;
      const cabinet = new THREE.Group();
      const body = this.shadowed(new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.32, 0.42), mats.midWood), true, true);
      body.position.y = 0.66;
      cabinet.add(body);
      const top = this.shadowed(new THREE.Mesh(new THREE.BoxGeometry(1.38, 0.08, 0.5), mats.darkWood), true, true);
      top.position.y = 1.36;
      cabinet.add(top);
      const shelfLine = this.shadowed(new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.05, 0.32), mats.lightWood), true, true);
      shelfLine.position.set(0, 0.82, 0);
      cabinet.add(shelfLine);
      const leftDoor = this.shadowed(new THREE.Mesh(new THREE.BoxGeometry(0.56, 1.08, 0.04), mats.lightWood), true, true);
      leftDoor.position.set(-0.29, 0.62, 0.22);
      cabinet.add(leftDoor);
      const rightDoor = this.shadowed(new THREE.Mesh(new THREE.BoxGeometry(0.56, 1.08, 0.04), mats.lightWood), true, true);
      rightDoor.position.set(0.29, 0.62, slightlyOpen ? 0.19 : 0.22);
      rightDoor.rotation.y = slightlyOpen ? -0.28 : 0;
      cabinet.add(rightDoor);
      cabinet.position.set(origin.x, 0, origin.z);
      cabinet.rotation.y = rotationY || 0;
      this.currentBuildZone.group.add(cabinet);
      this.addCollider(origin.x, origin.z, 1.38, 0.52);
    }

    buildBed(origin, rotationY) {
      const mats = this.materials;
      const bed = new THREE.Group();

      const frameBase = this.shadowed(new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.18, 1.34), mats.darkWood), true, true);
      frameBase.position.y = 0.18;
      bed.add(frameBase);

      const sideRail = this.shadowed(new THREE.Mesh(new THREE.BoxGeometry(2.08, 0.16, 0.08), mats.midWood), true, true);
      sideRail.position.set(0, 0.28, -0.58);
      bed.add(sideRail);
      const sideRail2 = sideRail.clone();
      sideRail2.position.z = 0.58;
      bed.add(sideRail2);

      const footRail = this.shadowed(new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.22, 1.2), mats.midWood), true, true);
      footRail.position.set(1.02, 0.3, 0);
      bed.add(footRail);

      const headboard = this.shadowed(new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.02, 1.36), mats.midWood), true, true);
      headboard.position.set(-1.02, 0.7, 0);
      bed.add(headboard);

      const headCap = this.shadowed(new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.08, 1.46), mats.lightWood), true, true);
      headCap.position.set(-1.04, 1.18, 0);
      bed.add(headCap);

      const mattress = this.shadowed(new THREE.Mesh(new THREE.BoxGeometry(1.94, 0.24, 1.16), mats.fabricCream), true, true);
      mattress.position.set(-0.02, 0.44, 0);
      bed.add(mattress);

      const blanket = this.shadowed(new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.12, 1.06), mats.fabricBlue), true, true);
      blanket.position.set(0.08, 0.6, 0.08);
      blanket.rotation.z = -0.04;
      bed.add(blanket);

      const pillow = this.shadowed(new THREE.Mesh(new THREE.SphereGeometry(0.22, 14, 12), mats.fabricCream), true, true);
      pillow.scale.set(1.3, 0.42, 0.82);
      pillow.position.set(-0.62, 0.58, 0);
      bed.add(pillow);

      for (const x of [-0.96, 0.96]) {
        for (const z of [-0.54, 0.54]) {
          const leg = this.shadowed(new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.2, 0.1), mats.darkWood), true, true);
          leg.position.set(x, 0.02, z);
          bed.add(leg);
        }
      }

      bed.position.set(origin.x, 0, origin.z);
      bed.rotation.y = rotationY || 0;
      this.currentBuildZone.group.add(bed);
      this.addCollider(origin.x, origin.z, 2.24, 1.42);
    }

    addNote(noteId, position, focusPoint, prompt) {
      const note = this.addMesh(new THREE.BoxGeometry(0.34, 0.02, 0.26), this.materials.paper, position.x, position.y, position.z);
      note.rotation.y = -0.18;
      this.addInteractable({
        id: noteId,
        type: "note",
        position: new THREE.Vector3(position.x, 0, position.z + 0.52),
        focusPoint: focusPoint.clone(),
        prompt: prompt,
        note: CONFIG.notes[noteId]
      });
    }

    addTransitionDoor(id, prompt, position, targetZone, spawn, yaw) {
      this.addInteractable({
        id: id,
        type: "transition",
        position: position,
        prompt: prompt,
        targetZone: targetZone,
        spawn: spawn,
        yaw: yaw
      });
    }

    buildOutdoorZone() {
      const home = CONFIG.houses.home;
      const neighbor = CONFIG.houses.neighbor;
      const homeRoom = CONFIG.room;
      const houseTwoRoom = { width: 10.5, depth: 8.6, wallHeight: 3.5 };

      this.setBuildZone("outdoor");

      const ground = this.addMesh(new THREE.BoxGeometry(42, 0.3, 22), this.materials.grass, 8.5, -0.26, 0.3);
      ground.receiveShadow = true;
      this.addMesh(new THREE.BoxGeometry(13.4, 0.16, 3.6), this.materials.grass, 10.6, -0.18, 3.2, 0, 0.04, 0, false, true).material.color.offsetHSL(0, 0.02, 0.03);
      this.addMesh(new THREE.BoxGeometry(8.2, 0.14, 4.8), this.materials.grass, 2.4, -0.19, -1.6, 0, -0.05, 0, false, true).material.color.offsetHSL(0, -0.01, -0.01);
      this.addMesh(new THREE.BoxGeometry(7.6, 0.18, 4.4), this.materials.grass, 19.8, -0.17, -1.7, 0, 0.03, 0, false, true).material.color.offsetHSL(0, 0.01, 0.01);

      this.addMesh(new THREE.BoxGeometry(12.5, 0.02, 1.6), this.materials.path, 11.3, 0.01, 2.9, 0, 0.03, 0, false, true);
      this.addMesh(new THREE.BoxGeometry(1.7, 0.03, 1.7), this.materials.path, 6.95, 0.02, 2.9, 0, 0.04, 0, false, true);
      this.addMesh(new THREE.BoxGeometry(1.7, 0.03, 1.7), this.materials.path, 16.75, 0.02, 2.5, 0, 0.04, 0, false, true);
      this.addMesh(new THREE.BoxGeometry(5.8, 0.04, 4.6), this.materials.path, 11.4, 0, 2.85, 0, 0.06, 0, false, true);
      this.addMesh(new THREE.BoxGeometry(2.6, 0.02, 2.1), this.materials.path, 6.3, 0.015, 2.95, 0, 0.02, 0, false, true).material.color.offsetHSL(0, -0.06, -0.03);
      this.addMesh(new THREE.BoxGeometry(2.4, 0.02, 1.9), this.materials.path, 17.35, 0.015, 2.55, 0, -0.03, 0, false, true).material.color.offsetHSL(0, -0.05, -0.04);

      this.addTree(-4.8, -2.3, 1.1);
      this.addTree(24.2, -2.9, 1.18);
      this.addTree(23.1, 6.1, 0.92);
      this.addBush(-2.2, 4.8, 1.2);
      this.addBush(10.7, -5.1, 0.95);
      this.addBush(21.4, 4.9, 1.08);
      this.addRock(-0.9, -4.2, 1.1, 0.5);
      this.addRock(18.9, -4.6, 0.92, -0.2);
      this.addRock(25.8, 2.2, 0.88, 0.7);
      this.addPottedShape(4.8, -1.8, 1.05);
      this.addPottedShape(20.9, -1.15, 0.95);

      this.buildExteriorHouse(home, homeRoom, "east", home.z + 2.9);
      this.buildExteriorHouse(neighbor, houseTwoRoom, "west", neighbor.z + 1.3);

      this.addTransitionDoor(
        "door-home-enter",
        "Press E to enter your house",
        new THREE.Vector3(home.x + homeRoom.width / 2 + 0.45, 0, home.z + 2.9),
        "home",
        new THREE.Vector3(home.x + 4.9, 0, home.z + 2.9),
        -Math.PI / 2
      );
      this.addTransitionDoor(
        "door-house2-enter",
        "Press E to enter the quiet house",
        new THREE.Vector3(neighbor.x - houseTwoRoom.width / 2 - 0.45, 0, neighbor.z + 1.3),
        "house2",
        new THREE.Vector3(neighbor.x - 3.6, 0, neighbor.z + 1.2),
        Math.PI / 2
      );

      this.addDustCluster(8.6, 0.35, 0.5, 18, 1.1, 8.4, 90);

      this.clearBuildZone();
    }

    buildHomeZone() {
      const room = CONFIG.room;
      const origin = CONFIG.houses.home;
      const door = { side: "east", z: 2.9, width: 1.28 };

      this.setBuildZone("home");
      this.buildRoomShell(origin, room, door);
      this.buildWindow(origin, room, -1.5);
      this.buildDoorFrame(origin, room, door);
      this.buildInteriorMysteryDoor(origin);
      this.buildBed({ x: origin.x - 3.6, z: origin.z + 2.95 }, Math.PI / 2);
      this.buildTable({ x: origin.x + 1.25, z: origin.z + 0.2 });
      this.buildRug(origin.x + 0.25, origin.z + 0.9, 3.2, 2.2, 0.08, this.materials.fabricRed);

      const bookStack = [
        { x: origin.x + 0.88, y: 1.02, z: origin.z - 0.22, w: 0.34, h: 0.07, d: 0.24, mat: this.materials.bookGreen },
        { x: origin.x + 0.91, y: 1.09, z: origin.z - 0.22, w: 0.3, h: 0.06, d: 0.22, mat: this.materials.bookGold },
        { x: origin.x + 1.54, y: 1.02, z: origin.z + 0.18, w: 0.32, h: 0.06, d: 0.24, mat: this.materials.bookBlue }
      ];
      for (const book of bookStack) {
        this.addMesh(new THREE.BoxGeometry(book.w, book.h, book.d), book.mat, book.x, book.y, book.z);
      }
      this.addMesh(new THREE.CylinderGeometry(0.1, 0.12, 0.05, 14), this.materials.brass, origin.x + 1.56, 1.0, origin.z - 0.18);
      this.addMesh(new THREE.CylinderGeometry(0.04, 0.05, 0.2, 12), this.materials.candleWax, origin.x + 1.56, 1.12, origin.z - 0.18);
      this.addMesh(new THREE.SphereGeometry(0.03, 10, 10), new THREE.MeshBasicMaterial({ color: 0xffca7a }), origin.x + 1.56, 1.25, origin.z - 0.18, 0, 0, 0, false, false);
      this.addFoldedCloth(origin.x + 1.68, 1.01, origin.z + 0.3, 0.18, 0.26, 0.18);
      this.addMesh(new THREE.BoxGeometry(1.42, 0.08, 0.2), this.materials.darkWood, origin.x - 3.25, 1.92, origin.z - 4.98, 0, 0, 0, true, true);
      this.addMesh(new THREE.BoxGeometry(0.12, 0.36, 0.12), this.materials.midWood, origin.x - 3.78, 1.77, origin.z - 4.93, 0, 0, 0.28, true, true);
      this.addMesh(new THREE.BoxGeometry(0.12, 0.36, 0.12), this.materials.midWood, origin.x - 2.72, 1.77, origin.z - 4.93, 0, 0, -0.28, true, true);
      this.addShelfBooks(origin.x - 3.78, 1.94, origin.z - 5.0, 4);
      this.addSmallVessel(origin.x - 2.95, 2.08, origin.z - 5.01, 1);
      this.buildSmallChest(origin.x - 4.65, origin.z + 3.55, 0.08, 1);

      this.addNote(
        "homeLetter",
        new THREE.Vector3(origin.x + 1.18, 1.03, origin.z + 0.08),
        new THREE.Vector3(origin.x + 1.18, 1.02, origin.z + 0.08),
        "Press E to read the letter"
      );

      this.addTransitionDoor(
        "door-home-exit",
        "Press E to step outside",
        new THREE.Vector3(origin.x + room.width / 2 - 0.55, 0, origin.z + 2.9),
        "outdoor",
        new THREE.Vector3(origin.x + room.width / 2 + 1.05, 0, origin.z + 2.9),
        -Math.PI / 2
      );

      this.addDustCluster(origin.x, 0.9, origin.z - 1.6, 7.2, 2.3, 2.6, 140);
      this.addDustCluster(origin.x + 2.8, 1.25, origin.z - 1.45, 2.4, 1.2, 1.8, 48);
      this.clearBuildZone();
    }

    buildHouseTwoZone() {
      const room = { width: 10.5, depth: 8.6, wallHeight: 3.5 };
      const origin = CONFIG.houses.neighbor;
      const door = { side: "west", z: 1.3, width: 1.2 };

      this.setBuildZone("house2");
      this.buildRoomShell(origin, room, door);
      this.buildDoorFrame(origin, room, door);
      this.buildWindow(origin, room, -1.45);
      this.buildTable({ x: origin.x + 0.55, z: origin.z + 0.3 });
      this.buildChair({ x: origin.x + 1.7, z: origin.z + 1.15 }, -0.58, true);
      this.buildShelf({ x: origin.x - 3.2, z: origin.z - 2.35 }, 0, true);
      this.buildRug(origin.x + 0.2, origin.z + 0.55, 2.7, 1.85, -0.04, this.materials.fabricBlue);
      this.addMesh(new THREE.BoxGeometry(0.74, 0.05, 0.18), this.materials.darkWood, origin.x + 2.65, 1.62, origin.z - 2.88, 0, 0, 0, true, true);
      this.addShelfBooks(origin.x + 2.42, 1.62, origin.z - 2.9, 3);
      this.addSmallVessel(origin.x + 3.02, 1.72, origin.z - 2.86, 0.8);
      this.addFoldedCloth(origin.x + 0.96, 1.01, origin.z + 0.18, -0.14, 0.22, 0.14);

      const houseLight = new THREE.PointLight(0xffd7a6, 8, 5.8, 2);
      houseLight.position.set(origin.x - 0.8, 1.85, origin.z + 0.6);
      this.currentBuildZone.group.add(houseLight);
      const coolFill = new THREE.PointLight(0x8ea7c2, 3.8, 5.2, 2);
      coolFill.position.set(origin.x + 1.8, 1.7, origin.z - 1.9);
      this.currentBuildZone.group.add(coolFill);

      this.addNote(
        "houseTwoNote",
        new THREE.Vector3(origin.x + 0.42, 1.03, origin.z + 0.14),
        new THREE.Vector3(origin.x + 0.5, 1.02, origin.z + 0.14),
        "Press E to read the note"
      );

      this.addTransitionDoor(
        "door-house2-exit",
        "Press E to step outside",
        new THREE.Vector3(origin.x - room.width / 2 + 0.55, 0, origin.z + 1.3),
        "outdoor",
        new THREE.Vector3(origin.x - room.width / 2 - 1.05, 0, origin.z + 1.3),
        Math.PI / 2
      );

      this.addDustCluster(origin.x + 0.1, 0.82, origin.z - 0.2, 4.4, 1.9, 3.1, 90);
      this.addDustCluster(origin.x + 3.05, 1.15, origin.z - 1.3, 1.8, 1.1, 1.4, 28);
      this.clearBuildZone();
    }

    build() {
      this.createZone("outdoor", CONFIG.world.bounds);
      this.createZone("home", { minX: -6.1, maxX: 6.1, minZ: -4.9, maxZ: 4.9 });
      this.createZone("house2", { minX: 12.8, maxX: 23.2, minZ: -2.9, maxZ: 5.6 });

      this.buildOutdoorZone();
      this.buildHomeZone();
      this.buildHouseTwoZone();

      this.setZone("home");
    }

    update(dt, time) {
      for (const zoneName of Object.keys(this.zones)) {
        const zone = this.zones[zoneName];
        if (!zone.group.visible) continue;
        for (const dust of zone.dustSystems) {
          dust.rotation.y += dt * 0.03;
          dust.rotation.x = Math.sin(time * 0.12) * 0.03;
          dust.position.y = Math.sin(time * 0.36) * 0.02;
        }
      }
    }
  }

  StillwakeHouse.HouseWorld = HouseWorld;
}());
