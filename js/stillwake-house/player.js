(function () {
  const StillwakeHouse = window.StillwakeHouse || (window.StillwakeHouse = {});
  const { CONFIG } = StillwakeHouse;

  class Player {
    constructor() {
      this.position = new THREE.Vector3(CONFIG.player.start.x, 0, CONFIG.player.start.z);
      this.velocity = new THREE.Vector3();
      this.group = this.createModel();
      this.visualRoot = this.group.userData.visualRoot;
      this.parts = this.group.userData.parts;
      this.walkCycle = 0;
      this.idleTime = 0;
      this.visualSpeed = 0;
      this.group.position.copy(this.position);
    }

    createModel() {
      const group = new THREE.Group();
      const visualRoot = new THREE.Group();
      const parts = {};

      const materials = {
        skin: new THREE.MeshStandardMaterial({ color: 0xf1d5c0, roughness: 0.94 }),
        hair: new THREE.MeshStandardMaterial({ color: 0x5d4537, roughness: 0.92 }),
        coat: new THREE.MeshStandardMaterial({ color: 0x6d7459, roughness: 0.93 }),
        coatDark: new THREE.MeshStandardMaterial({ color: 0x555942, roughness: 0.95 }),
        scarf: new THREE.MeshStandardMaterial({ color: 0xb98b68, roughness: 0.95 }),
        trousers: new THREE.MeshStandardMaterial({ color: 0x565d67, roughness: 0.95 }),
        boots: new THREE.MeshStandardMaterial({ color: 0x684430, roughness: 0.95 })
      };

      const shadowed = (mesh) => {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        return mesh;
      };

      const torso = shadowed(new THREE.Mesh(
        new THREE.BoxGeometry(0.54, 0.58, 0.3),
        materials.coat
      ));
      torso.position.y = 1.02;
      visualRoot.add(torso);
      parts.torso = torso;

      const torsoHem = shadowed(new THREE.Mesh(
        new THREE.BoxGeometry(0.46, 0.12, 0.26),
        materials.coatDark
      ));
      torsoHem.position.set(0, 0.76, 0);
      visualRoot.add(torsoHem);

      const hipBand = shadowed(new THREE.Mesh(
        new THREE.BoxGeometry(0.42, 0.1, 0.24),
        materials.coatDark
      ));
      hipBand.position.set(0, 0.62, 0);
      visualRoot.add(hipBand);

      const neck = shadowed(new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.09, 0.1, 10),
        materials.skin
      ));
      neck.position.y = 1.35;
      visualRoot.add(neck);

      const head = shadowed(new THREE.Mesh(
        new THREE.SphereGeometry(0.26, 18, 18),
        materials.skin
      ));
      head.position.set(0, 1.62, 0.01);
      visualRoot.add(head);
      parts.head = head;

      const hairCap = shadowed(new THREE.Mesh(
        new THREE.SphereGeometry(0.27, 18, 18, 0, Math.PI * 2, 0, Math.PI * 0.62),
        materials.hair
      ));
      hairCap.position.set(0, 1.72, -0.01);
      hairCap.scale.set(1.02, 0.86, 1.03);
      visualRoot.add(hairCap);

      const fringe = shadowed(new THREE.Mesh(
        new THREE.BoxGeometry(0.34, 0.09, 0.16),
        materials.hair
      ));
      fringe.position.set(0, 1.7, 0.19);
      visualRoot.add(fringe);

      const scarf = shadowed(new THREE.Mesh(
        new THREE.TorusGeometry(0.18, 0.05, 10, 18),
        materials.scarf
      ));
      scarf.rotation.x = Math.PI / 2;
      scarf.position.y = 1.26;
      visualRoot.add(scarf);

      const scarfTail = shadowed(new THREE.Mesh(
        new THREE.BoxGeometry(0.11, 0.34, 0.05),
        materials.scarf
      ));
      scarfTail.position.set(0.12, 1.02, 0.16);
      scarfTail.rotation.z = -0.18;
      visualRoot.add(scarfTail);

      const armGeo = new THREE.CapsuleGeometry(0.07, 0.34, 4, 8);
      const handGeo = new THREE.SphereGeometry(0.075, 12, 12);
      const makeArm = (side) => {
        const arm = new THREE.Group();
        arm.position.set(side * 0.36, 1.09, 0);

        const upper = shadowed(new THREE.Mesh(armGeo, materials.coatDark));
        upper.rotation.z = side * 0.08;
        arm.add(upper);

        const hand = shadowed(new THREE.Mesh(handGeo, materials.skin));
        hand.position.y = -0.28;
        arm.add(hand);

        visualRoot.add(arm);
        return arm;
      };
      parts.leftArm = makeArm(-1);
      parts.rightArm = makeArm(1);

      const legGeo = new THREE.CapsuleGeometry(0.08, 0.36, 4, 8);
      const bootGeo = new THREE.BoxGeometry(0.16, 0.12, 0.28);
      const makeLeg = (side) => {
        const leg = new THREE.Group();
        leg.position.set(side * 0.17, 0.4, 0);

        const upper = shadowed(new THREE.Mesh(
          new THREE.CapsuleGeometry(0.075, 0.24, 4, 8),
          materials.trousers
        ));
        upper.position.y = 0.1;
        leg.add(upper);

        const lower = shadowed(new THREE.Mesh(
          new THREE.CapsuleGeometry(0.068, 0.22, 4, 8),
          materials.trousers
        ));
        lower.position.y = -0.2;
        leg.add(lower);

        const boot = shadowed(new THREE.Mesh(bootGeo, materials.boots));
        boot.position.set(0, -0.39, 0.07);
        leg.add(boot);

        const cuff = shadowed(new THREE.Mesh(
          new THREE.BoxGeometry(0.14, 0.05, 0.14),
          materials.coatDark
        ));
        cuff.position.set(0, -0.06, 0);
        leg.add(cuff);

        visualRoot.add(leg);
        return leg;
      };
      parts.leftLeg = makeLeg(-1);
      parts.rightLeg = makeLeg(1);

      const frontCoat = shadowed(new THREE.Mesh(
        new THREE.BoxGeometry(0.14, 0.18, 0.06),
        materials.coatDark
      ));
      frontCoat.position.set(0, 0.58, 0.12);
      visualRoot.add(frontCoat);

      const backCoat = shadowed(new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.16, 0.06),
        materials.coatDark
      ));
      backCoat.position.set(0, 0.6, -0.1);
      visualRoot.add(backCoat);

      visualRoot.position.y = 0.02;
      group.add(visualRoot);
      group.userData.visualRoot = visualRoot;
      group.userData.parts = parts;

      return group;
    }

    updateVisuals(dt) {
      const speed = this.velocity.length();
      this.visualSpeed += (speed - this.visualSpeed) * Math.min(1, dt * 10);
      this.idleTime += dt;
      const moving = this.visualSpeed > 0.03;
      const strideRate = THREE.MathUtils.lerp(2.2, 8.2, Math.min(1, this.visualSpeed / CONFIG.player.speed));
      this.walkCycle += dt * strideRate;
      this.group.position.set(this.position.x, 0, this.position.z);

      const bob = moving
        ? Math.sin(this.walkCycle * 2) * 0.018 + Math.abs(Math.sin(this.walkCycle)) * 0.018
        : Math.sin(this.idleTime * 1.8) * 0.01;
      this.group.position.y = bob;

      if (!this.visualRoot || !this.parts) {
        return;
      }

      this.visualRoot.rotation.z = moving ? Math.sin(this.walkCycle) * 0.02 : 0;
      this.visualRoot.position.y = 0.02 + (moving ? Math.abs(Math.sin(this.walkCycle)) * 0.012 : Math.sin(this.idleTime * 1.8) * 0.015);

      const intensity = Math.min(1, this.visualSpeed / (CONFIG.player.speed * 0.9));
      const armSwing = moving ? Math.sin(this.walkCycle) * 0.42 * intensity : Math.sin(this.idleTime * 1.6) * 0.05;
      const legSwing = moving ? Math.sin(this.walkCycle) * 0.5 * intensity : 0;
      const kneeSwing = moving ? Math.max(0, Math.sin(this.walkCycle + Math.PI * 0.15)) * 0.18 * intensity : 0;
      const kneeSwingOpposite = moving ? Math.max(0, Math.sin(this.walkCycle + Math.PI + Math.PI * 0.15)) * 0.18 * intensity : 0;
      const headTilt = moving ? Math.sin(this.walkCycle * 0.5) * 0.02 : Math.sin(this.idleTime * 1.4) * 0.02;

      this.parts.leftArm.rotation.x = armSwing * 0.9;
      this.parts.rightArm.rotation.x = -armSwing;
      this.parts.leftLeg.rotation.x = -legSwing + kneeSwingOpposite;
      this.parts.rightLeg.rotation.x = legSwing + kneeSwing;
      this.parts.head.rotation.z = headTilt;
      this.parts.torso.rotation.z = moving ? Math.sin(this.walkCycle) * 0.012 : 0;
      this.parts.torso.rotation.x = moving ? Math.abs(Math.sin(this.walkCycle)) * 0.03 : 0;
    }
  }

  StillwakeHouse.Player = Player;
}());
