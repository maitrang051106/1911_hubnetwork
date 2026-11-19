import * as THREE from 'three';

export interface WarriorSceneRig {
  group: THREE.Group;
  warriorUpperBody: THREE.Group;
  warriorHead: THREE.Group;
  blossomCanopy: THREE.Group;
  disposables: Array<{ dispose: () => void }>;
}

/**
 * Procedural mossy gnarled bark texture for the ancient blossom tree.
 */
function createBarkTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#312924';
  ctx.fillRect(0, 0, size, size);

  // Vertical gnarled bark fissures
  for (let i = 0; i < 240; i++) {
    const x = (i / 240) * size + (Math.sin(i * 19.3) * 6);
    const w = 2 + (i % 5) * 1.6;
    const tone = i % 3 === 0 ? '#1d1714' : i % 3 === 1 ? '#443830' : '#29221d';
    ctx.fillStyle = tone;
    ctx.fillRect(x, 0, w, size);
  }

  // Mossy emerald-olive patches clinging to damp bark crevices
  for (let i = 0; i < 95; i++) {
    const x = ((i * 73.1) % size);
    const y = ((i * 139.7) % size);
    const r = 10 + (i % 7) * 6;
    const moss = ctx.createRadialGradient(x, y, 2, x, y, r);
    moss.addColorStop(0, 'rgba(72, 92, 54, 0.55)');
    moss.addColorStop(1, 'rgba(72, 92, 54, 0)');
    ctx.fillStyle = moss;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 5);
  tex.needsUpdate = true;
  return tex;
}

/**
 * Procedural sakura/wild-blossom foliage cluster alpha texture for canopy tufts.
 */
function createBlossomClusterTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, size, size);

  const colors = ['#f6b6c8', '#f9d5df', '#e58ca8', '#fdebf0', '#d47492'];
  for (let i = 0; i < 38; i++) {
    const angle = i * 2.39996;
    const dist = Math.sqrt(i / 38) * 86;
    const x = 128 + Math.cos(angle) * dist;
    const y = 128 + Math.sin(angle) * dist;
    const r = 14 + (i % 5) * 4.5;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = colors[i % colors.length];
    ctx.globalAlpha = 0.82;
    for (let p = 0; p < 5; p++) {
      ctx.rotate((Math.PI * 2) / 5);
      ctx.beginPath();
      ctx.ellipse(0, -r * 0.55, r * 0.38, r * 0.62, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#fbe3a4';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Soft radial ground contact shadow to anchor the tree, warrior, and sword naturally on the meadow.
 */
function createContactShadowTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(128, 128, 12, 128, 128, 120);
  grad.addColorStop(0, 'rgba(12, 10, 14, 0.72)');
  grad.addColorStop(0.55, 'rgba(12, 10, 14, 0.34)');
  grad.addColorStop(1, 'rgba(12, 10, 14, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

/**
 * Builds the composite resting knight, greatsword, and ancient overhanging sakura/blossom tree.
 * Pivoted cleanly at bottom-center (y = 0) so the entire tableau sits flush on the flower meadow.
 */
export function createRestingWarriorTableau(
  maxAnisotropy: number,
  enableShadows: boolean
): WarriorSceneRig {
  const disposables: Array<{ dispose: () => void }> = [];
  const track = <T extends { dispose: () => void }>(item: T): T => {
    disposables.push(item);
    return item;
  };

  const root = new THREE.Group();

  // --- Shared PBR Materials ---
  const darkSteelMat = track(
    new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#343942'),
      metalness: 0.9,
      roughness: 0.28,
      clearcoat: 0.25,
      clearcoatRoughness: 0.35,
    })
  );

  const polishedSteelMat = track(
    new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#8e96a3'),
      metalness: 0.95,
      roughness: 0.16,
      clearcoat: 0.4,
      clearcoatRoughness: 0.2,
    })
  );

  const trimBronzeMat = track(
    new THREE.MeshStandardMaterial({
      color: new THREE.Color('#9f8358'),
      metalness: 0.85,
      roughness: 0.34,
    })
  );

  const chainmailMat = track(
    new THREE.MeshStandardMaterial({
      color: new THREE.Color('#202227'),
      metalness: 0.55,
      roughness: 0.78,
    })
  );

  const leatherMat = track(
    new THREE.MeshStandardMaterial({
      color: new THREE.Color('#35261e'),
      metalness: 0.08,
      roughness: 0.86,
    })
  );

  const cloakMat = track(
    new THREE.MeshStandardMaterial({
      color: new THREE.Color('#2b3135'),
      metalness: 0.04,
      roughness: 0.92,
      side: THREE.DoubleSide,
    })
  );

  const barkTex = track(createBarkTexture());
  barkTex.anisotropy = maxAnisotropy;
  const barkMat = track(
    new THREE.MeshStandardMaterial({
      map: barkTex,
      color: new THREE.Color('#6a5b52'),
      roughness: 0.94,
      metalness: 0.02,
    })
  );

  // Soft contact shadow plane directly beneath the tableau
  const shadowTex = track(createContactShadowTexture());
  const shadowPlane = new THREE.Mesh(
    track(new THREE.PlaneGeometry(7.2, 6.4)),
    track(
      new THREE.MeshBasicMaterial({
        map: shadowTex,
        transparent: true,
        depthWrite: false,
        opacity: 0.65,
      })
    )
  );
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.set(0.3, 0.04, -0.2);
  root.add(shadowPlane);

  // =========================================================================
  // 1. ANCIENT MOSSY BLOSSOM TREE (positioned right behind warrior's back)
  // =========================================================================
  const treeGroup = new THREE.Group();
  treeGroup.position.set(1.55, 0, -0.95);
  root.add(treeGroup);

  // Sculpted gnarled main trunk using LatheGeometry + organic twist
  const trunkPoints = [
    new THREE.Vector2(1.45, -0.35),
    new THREE.Vector2(1.12, 0.35),
    new THREE.Vector2(0.94, 1.3),
    new THREE.Vector2(0.86, 2.5),
    new THREE.Vector2(0.82, 3.8),
    new THREE.Vector2(0.76, 5.2),
    new THREE.Vector2(0.62, 6.6),
    new THREE.Vector2(0.32, 7.6),
  ];
  const trunkGeo = track(new THREE.LatheGeometry(trunkPoints, 20));
  const tPos = trunkGeo.attributes.position;
  for (let i = 0; i < tPos.count; i++) {
    const x = tPos.getX(i);
    const y = tPos.getY(i);
    const z = tPos.getZ(i);
    const angle = Math.atan2(z, x);
    const ridge = Math.sin(angle * 6 + y * 0.9) * 0.085 + Math.cos(angle * 3 - y * 0.5) * 0.06;
    const bendX = -Math.pow(Math.max(y, 0) / 7.5, 1.8) * 0.9;
    tPos.setXYZ(i, x + Math.cos(angle) * ridge + bendX, y, z + Math.sin(angle) * ridge);
  }
  trunkGeo.computeVertexNormals();
  const trunkMesh = new THREE.Mesh(trunkGeo, barkMat);
  trunkMesh.castShadow = enableShadows;
  trunkMesh.receiveShadow = enableShadows;
  treeGroup.add(trunkMesh);

  // Sweeping surface roots anchoring tree into the meadow
  const rootAngles = [0.2, 1.5, 2.8, 4.1, 5.4];
  rootAngles.forEach((ang, idx) => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(Math.cos(ang) * 0.72, 0.85, Math.sin(ang) * 0.72),
      new THREE.Vector3(Math.cos(ang) * 1.45, 0.24, Math.sin(ang) * 1.45),
      new THREE.Vector3(Math.cos(ang) * (2.15 + (idx % 2) * 0.45), -0.18, Math.sin(ang) * (2.15 + (idx % 2) * 0.45)),
    ]);
    const rootGeo = track(new THREE.TubeGeometry(curve, 14, 0.24, 8, false));
    const rootMesh = new THREE.Mesh(rootGeo, barkMat);
    rootMesh.castShadow = enableShadows;
    rootMesh.receiveShadow = enableShadows;
    treeGroup.add(rootMesh);
  });

  // Dramatic overhanging primary branches reaching gracefully over the resting warrior
  const branchSpecs = [
    [
      new THREE.Vector3(-0.3, 4.2, 0.1),
      new THREE.Vector3(-2.1, 4.9, 0.6),
      new THREE.Vector3(-4.2, 5.2, 0.9),
      new THREE.Vector3(-5.8, 4.7, 0.5),
    ],
    [
      new THREE.Vector3(-0.2, 4.9, -0.2),
      new THREE.Vector3(-1.8, 5.7, -1.6),
      new THREE.Vector3(-3.9, 6.0, -2.5),
    ],
    [
      new THREE.Vector3(-0.4, 5.5, 0.2),
      new THREE.Vector3(1.5, 6.2, 1.3),
      new THREE.Vector3(3.3, 6.0, 2.0),
    ],
    [
      new THREE.Vector3(-0.5, 6.2, -0.1),
      new THREE.Vector3(-1.4, 7.1, 1.7),
      new THREE.Vector3(-2.7, 6.9, 2.8),
    ],
  ];

  branchSpecs.forEach((pts, i) => {
    const curve = new THREE.CatmullRomCurve3(pts);
    const bGeo = track(new THREE.TubeGeometry(curve, 18, i === 0 ? 0.24 : 0.17, 8, false));
    const bMesh = new THREE.Mesh(bGeo, barkMat);
    bMesh.castShadow = enableShadows;
    treeGroup.add(bMesh);
  });

  // Lush pink sakura/blossom overhanging canopy built from layered organic blossom clouds
  const blossomCanopy = new THREE.Group();
  treeGroup.add(blossomCanopy);

  const blossomTex = track(createBlossomClusterTexture());
  blossomTex.anisotropy = maxAnisotropy;
  const blossomMat = track(
    new THREE.MeshStandardMaterial({
      map: blossomTex,
      color: new THREE.Color('#f5c0cf'),
      emissive: new THREE.Color('#5a2638'),
      emissiveIntensity: 0.28,
      alphaTest: 0.18,
      transparent: true,
      roughness: 0.85,
      metalness: 0.0,
      side: THREE.DoubleSide,
    })
  );

  // Canopy cluster centers arching above the warrior like in the reference paintings
  const canopyClusters = [
    { pos: [-2.4, 5.2, 0.6], r: 2.1, count: 22 },
    { pos: [-4.4, 5.1, 0.8], r: 2.2, count: 26 },
    { pos: [-5.7, 4.7, 0.3], r: 1.7, count: 18 },
    { pos: [-3.2, 5.8, -1.8], r: 2.1, count: 22 },
    { pos: [-1.1, 6.1, -0.2], r: 2.0, count: 20 },
    { pos: [1.6, 6.0, 1.3], r: 1.9, count: 18 },
    { pos: [-2.3, 6.6, 2.2], r: 1.8, count: 18 },
  ];

  const cardGeo = track(new THREE.PlaneGeometry(1.55, 1.55));
  let cSeed = 11;
  const nextRand = () => {
    cSeed = (cSeed * 16807) % 2147483647;
    return (cSeed - 1) / 2147483646;
  };

  canopyClusters.forEach((cluster) => {
    for (let i = 0; i < cluster.count; i++) {
      const card = new THREE.Mesh(cardGeo, blossomMat);
      const theta = nextRand() * Math.PI * 2;
      const phi = nextRand() * Math.PI;
      const rad = Math.pow(nextRand(), 0.6) * cluster.r;
      card.position.set(
        cluster.pos[0] + Math.sin(phi) * Math.cos(theta) * rad,
        cluster.pos[1] + Math.cos(phi) * rad * 0.52,
        cluster.pos[2] + Math.sin(phi) * Math.sin(theta) * rad
      );
      card.rotation.set(
        (nextRand() - 0.5) * 1.4,
        nextRand() * Math.PI * 2,
        (nextRand() - 0.5) * 1.1
      );
      const s = 0.72 + nextRand() * 0.68;
      card.scale.setScalar(s);
      blossomCanopy.add(card);
    }
  });

  // =========================================================================
  // 2. RESTING ARMORED WARRIOR (Composite 18+ Part Sculpted Plate-Armor Knight)
  // Seated peacefully leaning back against the mossy tree trunk, facing -X/+Z
  // =========================================================================
  const warrior = new THREE.Group();
  warrior.position.set(0.18, 0.0, -0.2);
  warrior.rotation.y = -0.35; // Angled gracefully toward the wide sunset flower meadow
  root.add(warrior);

  const addPart = (
    parent: THREE.Object3D,
    geo: THREE.BufferGeometry,
    mat: THREE.Material,
    pos: [number, number, number],
    rot: [number, number, number] = [0, 0, 0],
    scale: [number, number, number] = [1, 1, 1]
  ): THREE.Mesh => {
    track(geo);
    const m = new THREE.Mesh(geo, mat);
    m.position.set(...pos);
    m.rotation.set(...rot);
    m.scale.set(...scale);
    m.castShadow = enableShadows;
    m.receiveShadow = enableShadows;
    parent.add(m);
    return m;
  };

  // --- Lower Body: Pelvis / Chainmail Seated Base ---
  addPart(warrior, new THREE.SphereGeometry(0.42, 18, 14), chainmailMat, [0.15, 0.34, 0], [0, 0, 0], [1.1, 0.72, 1.15]);

  // Armored Tassets (hip plates resting naturally over upper thighs)
  addPart(warrior, new THREE.CylinderGeometry(0.42, 0.5, 0.28, 12, 1, true, -1.1, 2.2), darkSteelMat, [0.12, 0.44, 0], [0, -Math.PI / 2, 0.22]);

  // --- Right Leg (bent peacefully at the knee like the reference knight!) ---
  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.02, 0.34, 0.24);
  warrior.add(rightLeg);

  // Thigh Cuisse (angled upward toward bent knee)
  addPart(rightLeg, new THREE.CapsuleGeometry(0.155, 0.54, 8, 14), darkSteelMat, [-0.36, 0.22, 0.04], [0, 0, 1.02]);
  // Sculpted Knee Poleyn guard
  addPart(rightLeg, new THREE.SphereGeometry(0.165, 14, 12), polishedSteelMat, [-0.66, 0.42, 0.07], [0, 0, 0], [1.15, 0.95, 1.0]);
  addPart(rightLeg, new THREE.TorusGeometry(0.145, 0.024, 8, 18), trimBronzeMat, [-0.66, 0.42, 0.07], [0, Math.PI / 2, 0.3]);
  // Shin Greave angled down into the flowers
  addPart(rightLeg, new THREE.CapsuleGeometry(0.125, 0.56, 8, 14), darkSteelMat, [-1.02, 0.22, 0.1], [0, 0, -1.18]);
  // Sabaton Boot resting in meadow
  addPart(rightLeg, new THREE.CapsuleGeometry(0.105, 0.26, 8, 12), darkSteelMat, [-1.36, 0.11, 0.12], [0, 0.1, -1.32], [1.0, 1.0, 0.85]);

  // --- Left Leg (extended further out across the flowers, relaxed) ---
  const leftLeg = new THREE.Group();
  leftLeg.position.set(0.04, 0.28, -0.2);
  warrior.add(leftLeg);

  addPart(leftLeg, new THREE.CapsuleGeometry(0.15, 0.58, 8, 14), darkSteelMat, [-0.42, 0.07, -0.05], [0, 0.08, 1.36]);
  addPart(leftLeg, new THREE.SphereGeometry(0.155, 14, 12), polishedSteelMat, [-0.78, 0.15, -0.1], [0, 0, 0], [1.1, 0.92, 0.95]);
  addPart(leftLeg, new THREE.CapsuleGeometry(0.12, 0.56, 8, 14), darkSteelMat, [-1.18, 0.11, -0.14], [0, 0.1, 1.52]);
  addPart(leftLeg, new THREE.CapsuleGeometry(0.1, 0.28, 8, 12), darkSteelMat, [-1.54, 0.15, -0.16], [0, 0.15, 0.35], [1.0, 1.0, 0.85]);

  // --- Upper Body Group (leans back against tree trunk; subtly breathes in render loop) ---
  const warriorUpperBody = new THREE.Group();
  warriorUpperBody.position.set(0.24, 0.42, 0);
  warriorUpperBody.rotation.z = -0.34; // Relaxed lean back against the mossy bark
  warrior.add(warriorUpperBody);

  // Sculpted Fluted Cuirass / Breastplate (Lathe profile with armored waist taper)
  const chestPts = [
    new THREE.Vector2(0.29, 0.0),
    new THREE.Vector2(0.32, 0.18),
    new THREE.Vector2(0.41, 0.52),
    new THREE.Vector2(0.43, 0.82),
    new THREE.Vector2(0.34, 1.02),
    new THREE.Vector2(0.21, 1.1),
  ];
  const chestGeo = new THREE.LatheGeometry(chestPts, 20);
  addPart(warriorUpperBody, chestGeo, darkSteelMat, [0, 0, 0], [0, 0, 0], [0.88, 1.0, 1.08]);

  // Central Cuirass Ridge & Bronze Trim Collar (Gorget)
  addPart(warriorUpperBody, new THREE.BoxGeometry(0.08, 0.68, 0.09), polishedSteelMat, [-0.35, 0.58, 0], [0, 0, -0.08]);
  addPart(warriorUpperBody, new THREE.TorusGeometry(0.24, 0.045, 10, 22), darkSteelMat, [-0.02, 1.04, 0], [Math.PI / 2, 0.15, 0]);
  addPart(warriorUpperBody, new THREE.TorusGeometry(0.25, 0.018, 8, 22), trimBronzeMat, [-0.02, 1.02, 0], [Math.PI / 2, 0.15, 0]);

  // Armored Leather Belt & Buckle across waist
  addPart(warriorUpperBody, new THREE.TorusGeometry(0.32, 0.042, 8, 22), leatherMat, [0, 0.15, 0], [Math.PI / 2, 0, 0], [0.92, 1.12, 1]);
  addPart(warriorUpperBody, new THREE.BoxGeometry(0.08, 0.09, 0.1), trimBronzeMat, [-0.31, 0.15, 0]);

  // Layered Pauldrons (3-tier sculpted shoulder armor)
  [-1, 1].forEach((side) => {
    const pGroup = new THREE.Group();
    pGroup.position.set(-0.02, 0.94, side * 0.44);
    pGroup.rotation.x = side * 0.28;
    warriorUpperBody.add(pGroup);

    addPart(pGroup, new THREE.SphereGeometry(0.23, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.62), darkSteelMat, [0, 0.04, 0], [0, 0, 0], [1.18, 0.95, 1.05]);
    addPart(pGroup, new THREE.SphereGeometry(0.21, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), polishedSteelMat, [0, -0.06, side * 0.04], [side * 0.2, 0, 0], [1.12, 0.85, 1.0]);
    addPart(pGroup, new THREE.TorusGeometry(0.20, 0.015, 8, 20), trimBronzeMat, [0, 0.0, 0], [Math.PI / 2 + side * 0.15, 0, 0]);
  });

  // Right Arm (resting peacefully across lap/knee)
  addPart(warriorUpperBody, new THREE.CapsuleGeometry(0.11, 0.4, 8, 12), chainmailMat, [-0.14, 0.64, 0.46], [0.35, 0, 0.5]);
  addPart(warriorUpperBody, new THREE.SphereGeometry(0.125, 12, 10), polishedSteelMat, [-0.28, 0.42, 0.52]); // Couter
  addPart(warriorUpperBody, new THREE.CapsuleGeometry(0.095, 0.42, 8, 12), darkSteelMat, [-0.46, 0.34, 0.3], [0.85, 0.35, 1.1]); // Vambrace
  addPart(warriorUpperBody, new THREE.SphereGeometry(0.105, 12, 10), darkSteelMat, [-0.58, 0.24, 0.08], [0, 0, 0], [1.25, 0.8, 0.95]); // Gauntlet resting on lap

  // Left Arm (resting calmly down toward meadow flowers)
  addPart(warriorUpperBody, new THREE.CapsuleGeometry(0.11, 0.42, 8, 12), chainmailMat, [-0.1, 0.62, -0.48], [-0.22, 0, 0.35]);
  addPart(warriorUpperBody, new THREE.SphereGeometry(0.125, 12, 10), polishedSteelMat, [-0.2, 0.38, -0.54]);
  addPart(warriorUpperBody, new THREE.CapsuleGeometry(0.092, 0.42, 8, 12), darkSteelMat, [-0.36, 0.18, -0.44], [-0.45, -0.3, 0.8]);
  addPart(warriorUpperBody, new THREE.SphereGeometry(0.1, 12, 10), darkSteelMat, [-0.52, 0.04, -0.34], [0, 0, 0], [1.2, 0.78, 0.95]);

  // Weathered Cloak draped down shoulders onto the meadow
  const cloakShape = new THREE.Shape();
  cloakShape.moveTo(-0.46, 0);
  cloakShape.lineTo(0.46, 0);
  cloakShape.quadraticCurveTo(0.68, -0.65, 0.76, -1.18);
  cloakShape.quadraticCurveTo(0, -1.28, -0.76, -1.18);
  cloakShape.quadraticCurveTo(-0.68, -0.65, -0.46, 0);
  const cloakGeo = new THREE.ShapeGeometry(cloakShape, 12);
  addPart(warriorUpperBody, cloakGeo, cloakMat, [0.36, 0.96, 0], [0, Math.PI / 2, 0.15]);

  // --- Sculpted Knight Helmet (Sallet / Armet with Fluted Visor, gazing over the flowers) ---
  const warriorHead = new THREE.Group();
  warriorHead.position.set(-0.04, 1.18, 0);
  warriorHead.rotation.z = 0.24; // Bowed slightly forward gazing peacefully at the flowers
  warriorHead.rotation.y = 0.08;
  warriorUpperBody.add(warriorHead);

  // Helmet cranium dome
  addPart(warriorHead, new THREE.SphereGeometry(0.245, 20, 16), darkSteelMat, [0, 0.14, 0], [0, 0, 0], [1.12, 1.06, 0.96]);
  // Central helmet crest ridge
  addPart(warriorHead, new THREE.TorusGeometry(0.245, 0.024, 8, 20, Math.PI * 1.1), polishedSteelMat, [0, 0.14, 0], [0, 0, -0.25]);
  // Pointed knight visor (iconic silhouette from the reference paintings!)
  const visorGeo = new THREE.ConeGeometry(0.22, 0.34, 6);
  addPart(warriorHead, visorGeo, polishedSteelMat, [-0.18, 0.08, 0], [0, 0, Math.PI / 2 + 0.12], [0.85, 1.0, 1.05]);
  // Darkened visor eye slit
  addPart(warriorHead, new THREE.BoxGeometry(0.16, 0.025, 0.26), chainmailMat, [-0.24, 0.12, 0], [0, 0, 0.12]);
  // Chin bevor / neck guard
  addPart(warriorHead, new THREE.CylinderGeometry(0.18, 0.22, 0.18, 14), darkSteelMat, [-0.04, -0.02, 0]);

  // =========================================================================
  // 3. HERO GREATSWORD (Leaning faithfully against the tree trunk right beside him)
  // =========================================================================
  const sword = new THREE.Group();
  sword.position.set(0.62, 0.02, 0.56);
  sword.rotation.set(0.08, -0.45, -0.24); // Leans naturally against the mossy tree trunk
  root.add(sword);

  // Double-edged beveled steel blade (ExtrudeGeometry)
  const bladeShape = new THREE.Shape();
  bladeShape.moveTo(-0.072, 0);
  bladeShape.lineTo(0.072, 0);
  bladeShape.lineTo(0.052, 1.65);
  bladeShape.lineTo(0, 1.98);
  bladeShape.lineTo(-0.052, 1.65);
  bladeShape.closePath();

  const bladeGeo = new THREE.ExtrudeGeometry(bladeShape, {
    depth: 0.026,
    bevelEnabled: true,
    bevelThickness: 0.012,
    bevelSize: 0.012,
    bevelSegments: 2,
  });
  bladeGeo.center();
  // Flip blade so tip points down into the flower soil and hilt rests high against the trunk!
  addPart(sword, bladeGeo, polishedSteelMat, [0, 0.98, 0], [0, 0, Math.PI]);

  // Central fuller groove accent
  addPart(sword, new THREE.BoxGeometry(0.024, 1.4, 0.054), darkSteelMat, [0, 1.15, 0]);

  // Sculpted Crossguard (Quillons) with flared tips
  addPart(sword, new THREE.BoxGeometry(0.72, 0.068, 0.075), darkSteelMat, [0, 1.98, 0]);
  addPart(sword, new THREE.SphereGeometry(0.055, 10, 10), trimBronzeMat, [0.36, 1.98, 0]);
  addPart(sword, new THREE.SphereGeometry(0.055, 10, 10), trimBronzeMat, [-0.36, 1.98, 0]);
  addPart(sword, new THREE.OctahedronGeometry(0.078, 0), trimBronzeMat, [0, 1.98, 0], [0, 0, Math.PI / 4]);

  // Leather-wrapped Two-Handed Grip
  addPart(sword, new THREE.CylinderGeometry(0.036, 0.044, 0.56, 12), leatherMat, [0, 2.28, 0]);
  // Grip wire rings
  for (let r = 0; r < 4; r++) {
    addPart(sword, new THREE.TorusGeometry(0.041, 0.007, 6, 16), trimBronzeMat, [0, 2.08 + r * 0.13, 0], [Math.PI / 2, 0, 0]);
  }
  // Faceted Steel Pommel
  addPart(sword, new THREE.OctahedronGeometry(0.085, 1), polishedSteelMat, [0, 2.61, 0], [0, 0, 0], [1.0, 1.15, 0.85]);

  return {
    group: root,
    warriorUpperBody,
    warriorHead,
    blossomCanopy,
    disposables,
  };
}
