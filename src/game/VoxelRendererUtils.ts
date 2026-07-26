import * as THREE from 'three';
import { BlockDef, BlockType, NPC } from '../types/game';

// Helper to add thick black edge lines to any mesh for pixel-art aesthetic
export function addBlackOutline(mesh: THREE.Mesh | THREE.Group, geometry?: THREE.BufferGeometry): THREE.LineSegments {
  const geom = geometry || (mesh instanceof THREE.Mesh ? mesh.geometry : new THREE.BoxGeometry(1, 1, 1));
  const edges = new THREE.EdgesGeometry(geom, 15);
  const lineMaterial = new THREE.LineBasicMaterial({ color: 0x111827, linewidth: 2 });
  const line = new THREE.LineSegments(edges, lineMaterial);
  mesh.add(line);
  return line;
}

// Generates procedural character group with oversized square head & rectangular body
export function createCharacterGroup(npc: NPC): THREE.Group {
  const group = new THREE.Group();
  group.name = `character-${npc.id}`;

  // Materials
  const skinMaterial = new THREE.MeshLambertMaterial({ color: 0xfde047, flatShading: true }); // Cozy golden/beige skin
  const outfitMaterial = new THREE.MeshLambertMaterial({ color: npc.outfitColor, flatShading: true });
  const hairMaterial = new THREE.MeshLambertMaterial({ color: npc.hairColor || 0x334155, flatShading: true });
  const blackMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });

  // 1. Oversized Square Head (1.1 x 1.1 x 1.1)
  const headGeom = new THREE.BoxGeometry(1.0, 1.0, 1.0);
  const head = new THREE.Mesh(headGeom, skinMaterial);
  head.position.set(0, 1.5, 0);
  addBlackOutline(head, headGeom);
  group.add(head);

  // Simple pixel eyes on face (Z+ is forward)
  const eyeGeom = new THREE.BoxGeometry(0.12, 0.12, 0.05);
  const leftEye = new THREE.Mesh(eyeGeom, blackMat);
  leftEye.position.set(-0.25, 1.55, 0.5);
  group.add(leftEye);
  const rightEye = new THREE.Mesh(eyeGeom, blackMat);
  rightEye.position.set(0.25, 1.55, 0.5);
  group.add(rightEye);

  // Hair or Hats based on headStyle
  if (npc.headStyle === 'detective') {
    const brimGeom = new THREE.BoxGeometry(1.4, 0.15, 1.4);
    const brim = new THREE.Mesh(brimGeom, new THREE.MeshLambertMaterial({ color: 0x1e293b }));
    brim.position.set(0, 2.05, 0);
    addBlackOutline(brim, brimGeom);
    group.add(brim);
    const crownGeom = new THREE.BoxGeometry(0.8, 0.4, 0.8);
    const crown = new THREE.Mesh(crownGeom, new THREE.MeshLambertMaterial({ color: 0x334155 }));
    crown.position.set(0, 2.3, 0);
    group.add(crown);
  } else if (npc.headStyle === 'wizard') {
    const coneGeom = new THREE.ConeGeometry(0.7, 1.0, 4);
    const cone = new THREE.Mesh(coneGeom, new THREE.MeshLambertMaterial({ color: 0x6d28d9 }));
    cone.position.set(0, 2.5, 0);
    cone.rotation.y = Math.PI / 4;
    group.add(cone);
  } else {
    // Red Warrior Fighter Bandana / Headband
    const bandanaGeom = new THREE.BoxGeometry(1.04, 0.15, 1.04);
    const bandanaMat = new THREE.MeshLambertMaterial({ color: 0xdc2626, flatShading: true }); // Crimson Red
    const bandana = new THREE.Mesh(bandanaGeom, bandanaMat);
    bandana.position.set(0, 1.75, 0);
    group.add(bandana);

    // Spiky dark warrior hair
    const hairGeom = new THREE.BoxGeometry(1.04, 0.25, 1.04);
    const hair = new THREE.Mesh(hairGeom, hairMaterial);
    hair.position.set(0, 1.95, 0);
    group.add(hair);
  }

  // 2. Rectangular Body with Steel Fighter Chestplate & Gold Belt
  const bodyGeom = new THREE.BoxGeometry(0.75, 0.85, 0.45);
  const body = new THREE.Mesh(bodyGeom, outfitMaterial);
  body.position.set(0, 0.6, 0);
  addBlackOutline(body, bodyGeom);
  group.add(body);

  // Steel Chestplate Armor
  const chestGeom = new THREE.BoxGeometry(0.8, 0.48, 0.5);
  const chestMat = new THREE.MeshLambertMaterial({ color: 0x334155, flatShading: true });
  const chest = new THREE.Mesh(chestGeom, chestMat);
  chest.position.set(0, 0.72, 0);
  addBlackOutline(chest, chestGeom);
  group.add(chest);

  // Gold Belt Buckle
  const beltGeom = new THREE.BoxGeometry(0.82, 0.14, 0.48);
  const beltMat = new THREE.MeshLambertMaterial({ color: 0xf59e0b, flatShading: true });
  const belt = new THREE.Mesh(beltGeom, beltMat);
  belt.position.set(0, 0.38, 0);
  group.add(belt);

  // 3. Arms (left & right) with Steel Shoulder Pauldrons
  const armGeom = new THREE.BoxGeometry(0.25, 0.7, 0.25);
  const pauldronGeom = new THREE.BoxGeometry(0.35, 0.25, 0.35);
  const pauldronMat = new THREE.MeshLambertMaterial({ color: 0x64748b, flatShading: true });

  const leftArm = new THREE.Mesh(armGeom, outfitMaterial);
  leftArm.name = 'leftArm';
  leftArm.position.set(-0.55, 0.65, 0);
  addBlackOutline(leftArm, armGeom);
  // Left Shoulder Pauldron
  const leftPauldron = new THREE.Mesh(pauldronGeom, pauldronMat);
  leftPauldron.position.set(0, 0.25, 0);
  addBlackOutline(leftPauldron, pauldronGeom);
  leftArm.add(leftPauldron);
  group.add(leftArm);

  const rightArm = new THREE.Mesh(armGeom, outfitMaterial);
  rightArm.name = 'rightArm';
  rightArm.position.set(0.55, 0.65, 0);
  addBlackOutline(rightArm, armGeom);
  // Right Shoulder Pauldron
  const rightPauldron = new THREE.Mesh(pauldronGeom, pauldronMat);
  rightPauldron.position.set(0, 0.25, 0);
  addBlackOutline(rightPauldron, pauldronGeom);
  rightArm.add(rightPauldron);

  // 3B. Silver Knife / Sword in Right Hand
  const knifeGroup = new THREE.Group();
  knifeGroup.name = 'playerKnife';
  const bladeGeom = new THREE.BoxGeometry(0.08, 0.85, 0.2);
  const bladeMat = new THREE.MeshLambertMaterial({ color: 0xf1f5f9, flatShading: true });
  const blade = new THREE.Mesh(bladeGeom, bladeMat);
  blade.position.set(0, 0.45, 0.1);
  addBlackOutline(blade, bladeGeom);
  knifeGroup.add(blade);

  const guardGeom = new THREE.BoxGeometry(0.3, 0.08, 0.3);
  const guardMat = new THREE.MeshLambertMaterial({ color: 0xf59e0b, flatShading: true });
  const guard = new THREE.Mesh(guardGeom, guardMat);
  guard.position.set(0, 0.05, 0.1);
  knifeGroup.add(guard);

  const hiltGeom = new THREE.BoxGeometry(0.12, 0.25, 0.12);
  const hiltMat = new THREE.MeshLambertMaterial({ color: 0x78350f });
  const hilt = new THREE.Mesh(hiltGeom, hiltMat);
  hilt.position.set(0, -0.1, 0.1);
  knifeGroup.add(hilt);

  knifeGroup.position.set(0, -0.2, 0.1);
  knifeGroup.rotation.x = -Math.PI / 4; // Tilted forward ready for slicing
  rightArm.add(knifeGroup);

  group.add(rightArm);

  // 4. Legs (left & right)
  const legGeom = new THREE.BoxGeometry(0.3, 0.6, 0.3);
  const legMat = new THREE.MeshLambertMaterial({ color: 0x1e293b }); // dark pants
  const leftLeg = new THREE.Mesh(legGeom, legMat);
  leftLeg.name = 'leftLeg';
  leftLeg.position.set(-0.2, 0.0, 0);
  addBlackOutline(leftLeg, legGeom);
  group.add(leftLeg);

  const rightLeg = new THREE.Mesh(legGeom, legMat);
  rightLeg.name = 'rightLeg';
  rightLeg.position.set(0.2, 0.0, 0);
  addBlackOutline(rightLeg, legGeom);
  group.add(rightLeg);

  // Scale down slightly to fit 1x1x2 block height
  group.scale.set(0.75, 0.75, 0.75);
  return group;
}

// Generates specialized geometries for decorative items like Fences, Tables, Caution Tape, Lamps
export function createCustomBlockGeometry(type: BlockType): THREE.BufferGeometry {
  if (type === 'FENCE') {
    // Post in center + rails
    const group = new THREE.Group();
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.0, 0.3));
    group.add(post);
    const railX1 = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.15, 0.1));
    railX1.position.set(0, 0.25, 0);
    group.add(railX1);
    const railX2 = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.15, 0.1));
    railX2.position.set(0, -0.15, 0);
    group.add(railX2);
    return mergeGroupToGeometry(group);
  }
  if (type === 'TABLE_WOOD') {
    // Wide tabletop + 4 legs
    const group = new THREE.Group();
    const top = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.15, 1.0));
    top.position.set(0, 0.4, 0);
    group.add(top);
    const leg1 = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.85, 0.15));
    leg1.position.set(-0.38, 0, -0.38);
    group.add(leg1);
    const leg2 = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.85, 0.15));
    leg2.position.set(0.38, 0, -0.38);
    group.add(leg2);
    const leg3 = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.85, 0.15));
    leg3.position.set(-0.38, 0, 0.38);
    group.add(leg3);
    const leg4 = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.85, 0.15));
    leg4.position.set(0.38, 0, 0.38);
    group.add(leg4);
    return mergeGroupToGeometry(group);
  }
  if (type === 'CAUTION_TAPE') {
    // 2 Yellow posts + yellow warning bar
    const group = new THREE.Group();
    const post1 = new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.0, 0.15));
    post1.position.set(-0.4, 0, 0);
    group.add(post1);
    const post2 = new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.0, 0.15));
    post2.position.set(0.4, 0, 0);
    group.add(post2);
    const tape = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.25, 0.05));
    tape.position.set(0, 0.2, 0);
    group.add(tape);
    return mergeGroupToGeometry(group);
  }
  if (type === 'FLOWER') {
    // Simple crossed planes or small cube cluster
    const group = new THREE.Group();
    const stem = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.6, 0.1));
    stem.position.set(0, -0.2, 0);
    group.add(stem);
    const flower = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.4));
    flower.position.set(0, 0.2, 0);
    group.add(flower);
    return mergeGroupToGeometry(group);
  }
  if (type === 'LAMP') {
    // Lantern cube on small post
    const group = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.3, 0.2));
    base.position.set(0, -0.35, 0);
    group.add(base);
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.7, 0.6));
    lamp.position.set(0, 0.1, 0);
    group.add(lamp);
    return mergeGroupToGeometry(group);
  }
  if (type === 'COAL_ORE') {
    // Dark rock base with jagged coal lumps
    const group = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.7, 0.85));
    base.position.set(0, -0.15, 0);
    group.add(base);
    const lump1 = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 0.42));
    lump1.position.set(-0.15, 0.22, 0.1);
    lump1.rotation.set(0.2, 0.4, 0.1);
    group.add(lump1);
    const lump2 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.35));
    lump2.position.set(0.2, 0.2, -0.15);
    lump2.rotation.set(-0.3, 0.2, 0.5);
    group.add(lump2);
    const lump3 = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.28, 0.28));
    lump3.position.set(-0.08, 0.4, -0.08);
    group.add(lump3);
    return mergeGroupToGeometry(group);
  }
  if (type === 'IRON_ORE') {
    // Jagged gray rock with rusty iron nuggets
    const group = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.75, 0.88));
    base.position.set(0, -0.12, 0);
    group.add(base);
    const nugget1 = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.38, 0.38));
    nugget1.position.set(0.18, 0.22, 0.12);
    nugget1.rotation.set(0.3, 0.2, 0.4);
    group.add(nugget1);
    const nugget2 = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.35, 0.32));
    nugget2.position.set(-0.22, 0.18, -0.18);
    nugget2.rotation.set(-0.2, 0.5, 0.1);
    group.add(nugget2);
    return mergeGroupToGeometry(group);
  }
  if (type === 'GOLD_ORE') {
    // Rocky stone cluster with sparkling gold nuggets
    const group = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.65, 0.85));
    base.position.set(0, -0.17, 0);
    group.add(base);
    const g1 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.4, 0.35));
    g1.position.set(0.15, 0.22, 0.1);
    g1.rotation.set(0.4, 0.3, 0.2);
    group.add(g1);
    const g2 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.35, 0.3));
    g2.position.set(-0.18, 0.18, -0.15);
    g2.rotation.set(-0.3, 0.4, 0.1);
    group.add(g2);
    const g3 = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.28, 0.24));
    g3.position.set(0, 0.4, 0);
    group.add(g3);
    return mergeGroupToGeometry(group);
  }
  if (type === 'CRYSTAL_ORE') {
    // Pointy 3D Mana Crystal Spire
    const group = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.25, 0.65));
    base.position.set(0, -0.375, 0);
    group.add(base);
    const mainSpire = new THREE.Mesh(new THREE.ConeGeometry(0.28, 1.0, 4));
    mainSpire.position.set(0, 0.18, 0);
    mainSpire.rotation.y = Math.PI / 4;
    group.add(mainSpire);
    const shard1 = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.65, 4));
    shard1.position.set(-0.18, 0.02, 0.12);
    shard1.rotation.set(0.2, 0, -0.35);
    group.add(shard1);
    const shard2 = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.55, 4));
    shard2.position.set(0.2, -0.02, -0.12);
    shard2.rotation.set(-0.3, 0, 0.35);
    group.add(shard2);
    return mergeGroupToGeometry(group);
  }
  if (type === 'HERB') {
    // Soil mound base + leafy green wild herb
    const group = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.1, 0.45));
    base.position.set(0, -0.45, 0);
    group.add(base);
    const leaf1 = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.05, 0.22));
    leaf1.position.set(0.12, -0.25, 0);
    leaf1.rotation.set(0.2, 0.5, -0.3);
    group.add(leaf1);
    const leaf2 = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.05, 0.22));
    leaf2.position.set(-0.12, -0.25, 0.08);
    leaf2.rotation.set(-0.2, -0.8, 0.3);
    group.add(leaf2);
    const bloom = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.22));
    bloom.position.set(0, -0.05, 0);
    group.add(bloom);
    return mergeGroupToGeometry(group);
  }
  if (type === 'BERRY_BUSH') {
    // Round green bush with red berries dotted on sides
    const group = new THREE.Group();
    const bush = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.7, 0.8));
    bush.position.set(0, -0.15, 0);
    group.add(bush);
    const b1 = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.16));
    b1.position.set(0.24, 0.15, 0.24);
    group.add(b1);
    const b2 = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.16));
    b2.position.set(-0.24, 0.1, -0.2);
    group.add(b2);
    const b3 = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.16));
    b3.position.set(0.28, -0.05, -0.22);
    group.add(b3);
    const b4 = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.16));
    b4.position.set(-0.18, 0.2, 0.18);
    group.add(b4);
    return mergeGroupToGeometry(group);
  }
  if (type === 'MUSHROOM') {
    // 3D Stalk + Red cap toadstool with white dots
    const group = new THREE.Group();
    const stalk = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.4, 0.2));
    stalk.position.set(0, -0.3, 0);
    group.add(stalk);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.22, 0.65));
    cap.position.set(0, 0.0, 0);
    group.add(cap);
    const dot1 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.12));
    dot1.position.set(0.14, 0.12, 0.14);
    group.add(dot1);
    const dot2 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.12));
    dot2.position.set(-0.14, 0.12, -0.14);
    group.add(dot2);
    return mergeGroupToGeometry(group);
  }
  if (type === 'TREASURE_CHEST') {
    // 3D Wooden chest with gold lock
    const group = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.45, 0.55));
    body.position.set(0, -0.2, 0);
    group.add(body);
    const lid = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.16, 0.58));
    lid.position.set(0, 0.1, 0);
    group.add(lid);
    const lock = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.18, 0.08));
    lock.position.set(0, 0.0, 0.29);
    group.add(lock);
    return mergeGroupToGeometry(group);
  }
  if (type === 'CROPS') {
    // Tilled soil + 4 golden wheat stalks
    const group = new THREE.Group();
    const soil = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.12, 0.85));
    soil.position.set(0, -0.44, 0);
    group.add(soil);
    const posList = [
      [-0.18, 0.08, -0.18],
      [0.18, 0.08, -0.18],
      [-0.18, 0.08, 0.18],
      [0.18, 0.08, 0.18],
    ];
    posList.forEach(([x, y, z]) => {
      const stalk = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.7, 0.06));
      stalk.position.set(x, y, z);
      group.add(stalk);
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.22, 0.14));
      head.position.set(x, y + 0.4, z);
      group.add(head);
    });
    return mergeGroupToGeometry(group);
  }
  if (type === 'BENCH') {
    // Wooden Park Bench (Seat + Backrest + 4 Legs)
    const group = new THREE.Group();
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.1, 0.4));
    seat.position.set(0, 0.05, 0);
    group.add(seat);
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.4, 0.08));
    back.position.set(0, 0.3, -0.16);
    group.add(back);
    const leg1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.5, 0.1));
    leg1.position.set(-0.38, -0.25, -0.15);
    group.add(leg1);
    const leg2 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.5, 0.1));
    leg2.position.set(0.38, -0.25, -0.15);
    group.add(leg2);
    return mergeGroupToGeometry(group);
  }
  if (type === 'BBQ_GRILL') {
    // BBQ Grill Stand (Black body + Grill grate)
    const group = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.4, 0.5));
    body.position.set(0, 0.1, 0);
    group.add(body);
    const leg1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.6, 0.08));
    leg1.position.set(-0.28, -0.3, -0.18);
    group.add(leg1);
    const leg2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.6, 0.08));
    leg2.position.set(0.28, -0.3, -0.18);
    group.add(leg2);
    return mergeGroupToGeometry(group);
  }
  if (type === 'WATERFALL') {
    // Cascading blue water sheet
    const group = new THREE.Group();
    const water = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.8, 0.2));
    water.position.set(0, 0.4, 0);
    group.add(water);
    return mergeGroupToGeometry(group);
  }
  if (type === 'COW') {
    // White & Black Voxel Cow Body + Head
    const group = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.5));
    body.position.set(0, 0, 0);
    group.add(body);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.35));
    head.position.set(0.4, 0.25, 0);
    group.add(head);
    return mergeGroupToGeometry(group);
  }
  if (type === 'CHICKEN') {
    // Small Yellow Chicken
    const group = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3));
    body.position.set(0, -0.1, 0);
    group.add(body);
    const comb = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.08));
    comb.position.set(0.12, 0.15, 0);
    group.add(comb);
    return mergeGroupToGeometry(group);
  }
  if (type === 'HORSE') {
    // Brown Horse Body + Neck
    const group = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.55, 0.45));
    body.position.set(0, 0.05, 0);
    group.add(body);
    const neck = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.5, 0.25));
    neck.position.set(0.35, 0.38, 0);
    group.add(neck);
    return mergeGroupToGeometry(group);
  }
  if (type === 'SHEEP' || type === 'GOAT' || type === 'RABBIT' || type === 'DEER' || type === 'DUCK' || type === 'DOG' || type === 'CAT') {
    // Animal Voxel Group
    const group = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.4));
    body.position.set(0, -0.1, 0);
    group.add(body);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 0.25));
    head.position.set(0.25, 0.15, 0);
    group.add(head);
    return mergeGroupToGeometry(group);
  }
  if (type === 'BOXING_RING') {
    const group = new THREE.Group();
    const floor = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.25, 5.8));
    floor.position.y = -0.35;
    group.add(floor);
    [-2.65, 2.65].forEach((x) => [-2.65, 2.65].forEach((z) => {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.7, 0.22));
      post.position.set(x, 0.4, z);
      group.add(post);
    }));
    [-0.05, 0.45].forEach((y) => {
      [-2.65, 2.65].forEach((z) => {
        const rope = new THREE.Mesh(new THREE.BoxGeometry(5.3, 0.09, 0.09));
        rope.position.set(0, y, z);
        group.add(rope);
      });
      [-2.65, 2.65].forEach((x) => {
        const rope = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.09, 5.3));
        rope.position.set(x, y, 0);
        group.add(rope);
      });
    });
    return mergeGroupToGeometry(group);
  }
  if (type === 'SMALL_POND') {
    const group = new THREE.Group();
    const water = new THREE.Mesh(new THREE.CylinderGeometry(3.1, 3.1, 0.16, 12));
    water.position.y = -0.42;
    group.add(water);
    [[-1.2, -0.7], [1.1, 0.6], [0.25, -1.45]].forEach(([x, z]) => {
      const lily = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.05, 8));
      lily.position.set(x, -0.3, z);
      group.add(lily);
    });
    return mergeGroupToGeometry(group);
  }
  if (type === 'WINDMILL') {
    const group = new THREE.Group();
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 1.05, 3.3, 6));
    tower.position.y = 1.1;
    group.add(tower);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(1.05, 0.9, 4));
    roof.position.y = 3.2;
    group.add(roof);
    const hub = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3));
    hub.position.set(0, 2.1, 0.78);
    group.add(hub);
    [0, Math.PI / 2, Math.PI, Math.PI * 1.5].forEach((angle) => {
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.28, 1.45, 0.12));
      blade.position.set(Math.sin(angle) * 0.68, 2.1 + Math.cos(angle) * 0.68, 0.82);
      blade.rotation.z = -angle;
      group.add(blade);
    });
    return mergeGroupToGeometry(group);
  }
  if (type === 'STONE_MONOLITH') {
    const group = new THREE.Group();
    const stone = new THREE.Mesh(new THREE.BoxGeometry(0.9, 2.8, 0.7));
    stone.position.y = 0.9;
    stone.rotation.z = 0.08;
    group.add(stone);
    return mergeGroupToGeometry(group);
  }
  if (type === 'HAY_BALE') {
    const group = new THREE.Group();
    const bale = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.75, 0.85));
    bale.position.y = -0.1;
    group.add(bale);
    return mergeGroupToGeometry(group);
  }
  if (type === 'GAZEBO') {
    const group = new THREE.Group();
    const roof = new THREE.Mesh(new THREE.ConeGeometry(2.2, 1.15, 6));
    roof.position.y = 2.35;
    group.add(roof);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.1, 0.18));
      post.position.set(Math.cos(a) * 1.65, 0.55, Math.sin(a) * 1.65);
      group.add(post);
    }
    return mergeGroupToGeometry(group);
  }
  if (type === 'STONE_WELL') {
    const group = new THREE.Group();
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 0.55, 10));
    rim.position.y = -0.15;
    group.add(rim);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(1.25, 0.65, 4));
    roof.position.y = 1.45;
    group.add(roof);
    return mergeGroupToGeometry(group);
  }
  if (type === 'WOODEN_BRIDGE') {
    const group = new THREE.Group();
    const deck = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.22, 1.45));
    deck.position.y = -0.28;
    group.add(deck);
    [-2, 2].forEach((x) => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.9, 1.45));
      rail.position.set(x, 0.12, 0);
      group.add(rail);
    });
    return mergeGroupToGeometry(group);
  }
  if (type === 'MARKET_STALL' || type === 'GARDEN_ARCH' || type === 'TRAINING_DUMMY' || type === 'CAMPFIRE' || type === 'FOUNTAIN') {
    const group = new THREE.Group();
    if (type === 'MARKET_STALL') {
      const counter = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.75, 0.8)); counter.position.y = -0.1; group.add(counter);
      const canopy = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.2, 1.2)); canopy.position.y = 1.25; group.add(canopy);
    } else if (type === 'GARDEN_ARCH') {
      [-0.85, 0.85].forEach((x) => { const post = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.8, 0.2)); post.position.set(x, 0.4, 0); group.add(post); });
      const top = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.25, 0.25)); top.position.y = 1.25; group.add(top);
    } else if (type === 'TRAINING_DUMMY') {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.25, 1.65, 0.25)); post.position.y = 0.35; group.add(post);
      const target = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.2, 12)); target.rotation.x = Math.PI / 2; target.position.set(0, 0.65, 0.15); group.add(target);
    } else if (type === 'CAMPFIRE') {
      for (let i = 0; i < 5; i++) { const log = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.18, 0.18)); log.rotation.y = (i / 5) * Math.PI; log.position.y = -0.33; group.add(log); }
      const flame = new THREE.Mesh(new THREE.ConeGeometry(0.38, 1.1, 5)); flame.position.y = 0.18; group.add(flame);
    } else {
      const basin = new THREE.Mesh(new THREE.CylinderGeometry(1.45, 1.15, 0.35, 12)); basin.position.y = -0.3; group.add(basin);
      const column = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 1.05, 8)); column.position.y = 0.25; group.add(column);
      const spray = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.75, 6)); spray.position.y = 1.12; group.add(spray);
    }
    return mergeGroupToGeometry(group);
  }
  // Default cube
  return new THREE.BoxGeometry(1, 1, 1);
}

// Simple geometry merger without external dependencies
function mergeGroupToGeometry(group: THREE.Group): THREE.BufferGeometry {
  const geometries: THREE.BufferGeometry[] = [];
  group.updateMatrixWorld(true);
  group.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      const geom = child.geometry.clone();
      geom.applyMatrix4(child.matrixWorld);
      geometries.push(geom);
    }
  });

  if (geometries.length === 0) return new THREE.BoxGeometry(1, 1, 1);
  if (geometries.length === 1) return geometries[0];

  // Manual buffer merging
  let totalPositions = 0;
  let totalNormals = 0;
  let totalIndices = 0;

  geometries.forEach((g) => {
    const pos = g.getAttribute('position');
    const norm = g.getAttribute('normal');
    if (pos) totalPositions += pos.count * 3;
    if (norm) totalNormals += norm.count * 3;
    if (g.index) totalIndices += g.index.count;
  });

  const posArray = new Float32Array(totalPositions);
  const normArray = new Float32Array(totalNormals);
  const indexArray = new Uint32Array(totalIndices);

  let posOffset = 0;
  let normOffset = 0;
  let indexOffset = 0;
  let vertexOffset = 0;

  geometries.forEach((g) => {
    const pos = g.getAttribute('position');
    const norm = g.getAttribute('normal');
    const idx = g.index;

    if (pos) {
      posArray.set(pos.array as Float32Array, posOffset);
      posOffset += pos.count * 3;
    }
    if (norm) {
      normArray.set(norm.array as Float32Array, normOffset);
      normOffset += norm.count * 3;
    }
    if (idx) {
      for (let i = 0; i < idx.count; i++) {
        indexArray[indexOffset + i] = idx.getX(i) + vertexOffset;
      }
      indexOffset += idx.count;
    }
    if (pos) vertexOffset += pos.count;
  });

  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
  if (totalNormals > 0) {
    merged.setAttribute('normal', new THREE.BufferAttribute(normArray, 3));
  }
  if (totalIndices > 0) {
    merged.setIndex(new THREE.BufferAttribute(indexArray, 1));
  }
  return merged;
}

// Generates a Minecraft/voxel style Zombie with arms outstretched forward and a floating 3D HP bar above its head
export function createZombieGroup(zombieId: string, hp: number = 100, maxHp: number = 100): THREE.Group {
  const group = new THREE.Group();
  group.name = `zombie-${zombieId}`;

  // Materials - toxic green skin, dark torn rags, red eyes
  const skinMaterial = new THREE.MeshLambertMaterial({ color: 0x22c55e, flatShading: true }); // Rotting green
  const outfitMaterial = new THREE.MeshLambertMaterial({ color: 0x1e293b, flatShading: true }); // Dark rags
  const hairMaterial = new THREE.MeshLambertMaterial({ color: 0x14532d, flatShading: true }); // Dark mossy hair
  const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0xef4444 }); // Glowing red eyes

  // 1. Oversized Square Head (1.0 x 1.0 x 1.0)
  const headGeom = new THREE.BoxGeometry(1.0, 1.0, 1.0);
  const head = new THREE.Mesh(headGeom, skinMaterial);
  head.name = 'head';
  head.position.set(0, 1.5, 0);
  addBlackOutline(head, headGeom);
  group.add(head);

  // Red Glowing Eyes
  const eyeGeom = new THREE.BoxGeometry(0.15, 0.15, 0.06);
  const leftEye = new THREE.Mesh(eyeGeom, eyeMaterial);
  leftEye.position.set(-0.25, 1.55, 0.5);
  group.add(leftEye);
  const rightEye = new THREE.Mesh(eyeGeom, eyeMaterial);
  rightEye.position.set(0.25, 1.55, 0.5);
  group.add(rightEye);

  // Hair top
  const hairGeom = new THREE.BoxGeometry(1.04, 0.22, 1.04);
  const hair = new THREE.Mesh(hairGeom, hairMaterial);
  hair.position.set(0, 1.9, 0);
  group.add(hair);

  // 2. Body
  const bodyGeom = new THREE.BoxGeometry(0.75, 0.85, 0.45);
  const body = new THREE.Mesh(bodyGeom, outfitMaterial);
  body.name = 'body';
  body.position.set(0, 0.6, 0);
  addBlackOutline(body, bodyGeom);
  group.add(body);

  // 3. Arms (outstretched forward like classic zombies!)
  const armGeom = new THREE.BoxGeometry(0.25, 0.7, 0.25);
  const leftArm = new THREE.Mesh(armGeom, skinMaterial);
  leftArm.name = 'leftArm';
  leftArm.position.set(-0.55, 0.9, 0.35);
  leftArm.rotation.x = -Math.PI / 2.2; // Pointing forward
  addBlackOutline(leftArm, armGeom);
  group.add(leftArm);

  const rightArm = new THREE.Mesh(armGeom, skinMaterial);
  rightArm.name = 'rightArm';
  rightArm.position.set(0.55, 0.9, 0.35);
  rightArm.rotation.x = -Math.PI / 2.2; // Pointing forward
  addBlackOutline(rightArm, armGeom);
  group.add(rightArm);

  // 4. Legs
  const legGeom = new THREE.BoxGeometry(0.3, 0.6, 0.3);
  const legMat = new THREE.MeshLambertMaterial({ color: 0x0f172a }); // Dark pants
  const leftLeg = new THREE.Mesh(legGeom, legMat);
  leftLeg.name = 'leftLeg';
  leftLeg.position.set(-0.2, 0.0, 0);
  addBlackOutline(leftLeg, legGeom);
  group.add(leftLeg);

  const rightLeg = new THREE.Mesh(legGeom, legMat);
  rightLeg.name = 'rightLeg';
  rightLeg.position.set(0.2, 0.0, 0);
  addBlackOutline(rightLeg, legGeom);
  group.add(rightLeg);

  // 5. 3D Floating HP Bar above head (y = 2.7)
  const hpBarGroup = new THREE.Group();
  hpBarGroup.name = 'hpBarGroup';
  hpBarGroup.position.set(0, 2.7, 0);

  const bgGeom = new THREE.BoxGeometry(1.2, 0.18, 0.05);
  const bgMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
  const bgMesh = new THREE.Mesh(bgGeom, bgMat);
  bgMesh.name = 'hpBarBg';
  hpBarGroup.add(bgMesh);

  const fgGeom = new THREE.BoxGeometry(1.14, 0.14, 0.06);
  const fgMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
  const fgMesh = new THREE.Mesh(fgGeom, fgMat);
  fgMesh.name = 'hpBarFg';
  fgMesh.position.set(0, 0, 0.01);
  hpBarGroup.add(fgMesh);

  group.add(hpBarGroup);
  return group;
}

// Helper to add standard 3D floating HP bar above any monster head
function addFloatingHpBar(group: THREE.Group, yOffset: number = 2.4) {
  const hpBarGroup = new THREE.Group();
  hpBarGroup.name = 'hpBarGroup';
  hpBarGroup.position.set(0, yOffset, 0);

  const bgGeom = new THREE.BoxGeometry(1.2, 0.18, 0.05);
  const bgMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
  const bgMesh = new THREE.Mesh(bgGeom, bgMat);
  bgMesh.name = 'hpBarBg';
  hpBarGroup.add(bgMesh);

  const fgGeom = new THREE.BoxGeometry(1.14, 0.14, 0.06);
  const fgMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
  const fgMesh = new THREE.Mesh(fgGeom, fgMat);
  fgMesh.name = 'hpBarFg';
  fgMesh.position.set(0, 0, 0.01);
  hpBarGroup.add(fgMesh);

  group.add(hpBarGroup);
}

// 🐺 Generates 3D Voxel Wolf (4 legs, dark fur, snout, ears, tail)
export function createWolfGroup(wolfId: string): THREE.Group {
  const group = new THREE.Group();
  group.name = `wolf-${wolfId}`;

  const furMat = new THREE.MeshLambertMaterial({ color: 0x475569, flatShading: true }); // Dark Slate Fur
  const snoutMat = new THREE.MeshLambertMaterial({ color: 0x334155, flatShading: true });
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xef4444 }); // Glowing red eyes

  // Wolf Body
  const bodyGeom = new THREE.BoxGeometry(0.8, 0.7, 1.4);
  const body = new THREE.Mesh(bodyGeom, furMat);
  body.name = 'body';
  body.position.set(0, 0.7, 0);
  addBlackOutline(body, bodyGeom);
  group.add(body);

  // Wolf Head & Snout
  const headGeom = new THREE.BoxGeometry(0.65, 0.65, 0.65);
  const head = new THREE.Mesh(headGeom, furMat);
  head.name = 'head';
  head.position.set(0, 1.1, 0.8);
  addBlackOutline(head, headGeom);
  group.add(head);

  const snoutGeom = new THREE.BoxGeometry(0.35, 0.3, 0.4);
  const snout = new THREE.Mesh(snoutGeom, snoutMat);
  snout.position.set(0, 1.0, 1.2);
  group.add(snout);

  // Ears (left & right)
  const earGeom = new THREE.BoxGeometry(0.15, 0.3, 0.15);
  const leftEar = new THREE.Mesh(earGeom, furMat);
  leftEar.position.set(-0.25, 1.5, 0.8);
  group.add(leftEar);

  const rightEar = new THREE.Mesh(earGeom, furMat);
  rightEar.position.set(0.25, 1.5, 0.8);
  group.add(rightEar);

  // Eyes
  const eyeGeom = new THREE.BoxGeometry(0.12, 0.12, 0.05);
  const leftEye = new THREE.Mesh(eyeGeom, eyeMat);
  leftEye.position.set(-0.2, 1.15, 1.13);
  group.add(leftEye);

  const rightEye = new THREE.Mesh(eyeGeom, eyeMat);
  rightEye.position.set(0.2, 1.15, 1.13);
  group.add(rightEye);

  // 4 Legs
  const legGeom = new THREE.BoxGeometry(0.22, 0.6, 0.22);
  const legMat = new THREE.MeshLambertMaterial({ color: 0x334155 });
  const flLeg = new THREE.Mesh(legGeom, legMat);
  flLeg.name = 'leftLeg';
  flLeg.position.set(-0.3, 0.3, 0.5);
  group.add(flLeg);

  const frLeg = new THREE.Mesh(legGeom, legMat);
  frLeg.name = 'rightLeg';
  frLeg.position.set(0.3, 0.3, 0.5);
  group.add(frLeg);

  const blLeg = new THREE.Mesh(legGeom, legMat);
  blLeg.position.set(-0.3, 0.3, -0.5);
  group.add(blLeg);

  const brLeg = new THREE.Mesh(legGeom, legMat);
  brLeg.position.set(0.3, 0.3, -0.5);
  group.add(brLeg);

  addFloatingHpBar(group, 2.0);
  return group;
}

// 🐻 Generates 3D Voxel Bear (Heavy brown tank beast)
export function createBearGroup(bearId: string): THREE.Group {
  const group = new THREE.Group();
  group.name = `bear-${bearId}`;

  const furMat = new THREE.MeshLambertMaterial({ color: 0x78350f, flatShading: true }); // Dark Grizzly Fur
  const darkMat = new THREE.MeshLambertMaterial({ color: 0x451a03, flatShading: true });
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 }); // Amber eyes

  // Heavy Body
  const bodyGeom = new THREE.BoxGeometry(1.2, 1.1, 1.6);
  const body = new THREE.Mesh(bodyGeom, furMat);
  body.name = 'body';
  body.position.set(0, 0.9, 0);
  addBlackOutline(body, bodyGeom);
  group.add(body);

  // Bear Head & Muzzle
  const headGeom = new THREE.BoxGeometry(0.9, 0.85, 0.85);
  const head = new THREE.Mesh(headGeom, furMat);
  head.name = 'head';
  head.position.set(0, 1.4, 0.9);
  addBlackOutline(head, headGeom);
  group.add(head);

  const muzzleGeom = new THREE.BoxGeometry(0.45, 0.38, 0.45);
  const muzzle = new THREE.Mesh(muzzleGeom, darkMat);
  muzzle.position.set(0, 1.25, 1.4);
  group.add(muzzle);

  // Round ears
  const earGeom = new THREE.BoxGeometry(0.25, 0.25, 0.15);
  const leftEar = new THREE.Mesh(earGeom, darkMat);
  leftEar.position.set(-0.35, 1.9, 0.85);
  group.add(leftEar);

  const rightEar = new THREE.Mesh(earGeom, darkMat);
  rightEar.position.set(0.35, 1.9, 0.85);
  group.add(rightEar);

  // Paws / Legs
  const legGeom = new THREE.BoxGeometry(0.38, 0.7, 0.38);
  const flLeg = new THREE.Mesh(legGeom, darkMat);
  flLeg.name = 'leftLeg';
  flLeg.position.set(-0.45, 0.35, 0.6);
  group.add(flLeg);

  const frLeg = new THREE.Mesh(legGeom, darkMat);
  frLeg.name = 'rightLeg';
  frLeg.position.set(0.45, 0.35, 0.6);
  group.add(frLeg);

  const blLeg = new THREE.Mesh(legGeom, darkMat);
  blLeg.position.set(-0.45, 0.35, -0.6);
  group.add(blLeg);

  const brLeg = new THREE.Mesh(legGeom, darkMat);
  brLeg.position.set(0.45, 0.35, -0.6);
  group.add(brLeg);

  addFloatingHpBar(group, 2.6);
  group.scale.set(1.2, 1.2, 1.2);
  return group;
}

// 👺 Generates 3D Voxel Goblin (Green humanoid with pointy ears & loincloth)
export function createGoblinGroup(goblinId: string): THREE.Group {
  const group = new THREE.Group();
  group.name = `goblin-${goblinId}`;

  const skinMat = new THREE.MeshLambertMaterial({ color: 0x16a34a, flatShading: true }); // Bright Goblin Green
  const clothMat = new THREE.MeshLambertMaterial({ color: 0xb45309, flatShading: true }); // Leather vest
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 }); // Yellow eyes

  // Head
  const headGeom = new THREE.BoxGeometry(0.85, 0.85, 0.85);
  const head = new THREE.Mesh(headGeom, skinMat);
  head.name = 'head';
  head.position.set(0, 1.2, 0);
  addBlackOutline(head, headGeom);
  group.add(head);

  // Pointy ears
  const earGeom = new THREE.BoxGeometry(0.35, 0.2, 0.1);
  const leftEar = new THREE.Mesh(earGeom, skinMat);
  leftEar.position.set(-0.55, 1.25, 0);
  leftEar.rotation.z = Math.PI / 8;
  group.add(leftEar);

  const rightEar = new THREE.Mesh(earGeom, skinMat);
  rightEar.position.set(0.55, 1.25, 0);
  rightEar.rotation.z = -Math.PI / 8;
  group.add(rightEar);

  // Body
  const bodyGeom = new THREE.BoxGeometry(0.6, 0.65, 0.35);
  const body = new THREE.Mesh(bodyGeom, clothMat);
  body.name = 'body';
  body.position.set(0, 0.45, 0);
  addBlackOutline(body, bodyGeom);
  group.add(body);

  // Arms & Legs
  const armGeom = new THREE.BoxGeometry(0.2, 0.55, 0.2);
  const leftArm = new THREE.Mesh(armGeom, skinMat);
  leftArm.name = 'leftArm';
  leftArm.position.set(-0.45, 0.45, 0);
  group.add(leftArm);

  const rightArm = new THREE.Mesh(armGeom, skinMat);
  rightArm.name = 'rightArm';
  rightArm.position.set(0.45, 0.45, 0);
  group.add(rightArm);

  const legGeom = new THREE.BoxGeometry(0.22, 0.45, 0.22);
  const leftLeg = new THREE.Mesh(legGeom, skinMat);
  leftLeg.name = 'leftLeg';
  leftLeg.position.set(-0.18, 0, 0);
  group.add(leftLeg);

  const rightLeg = new THREE.Mesh(legGeom, skinMat);
  rightLeg.name = 'rightLeg';
  rightLeg.position.set(0.18, 0, 0);
  group.add(rightLeg);

  addFloatingHpBar(group, 2.1);
  group.scale.set(0.85, 0.85, 0.85);
  return group;
}

// 👑 Generates 3D Voxel Elite Boss (Giant scaled Chief with glowing Red Horns)
export function createEliteGroup(eliteId: string, baseType: 'zombie' | 'wolf' | 'bear' | 'goblin'): THREE.Group {
  let group: THREE.Group;
  if (baseType === 'wolf') group = createWolfGroup(eliteId);
  else if (baseType === 'bear') group = createBearGroup(eliteId);
  else if (baseType === 'goblin') group = createGoblinGroup(eliteId);
  else group = createZombieGroup(eliteId);

  group.name = `elite-${eliteId}`;

  // Add glowing Red Horns / Crown to signify Elite Boss status
  const crownGeom = new THREE.BoxGeometry(0.6, 0.25, 0.6);
  const crownMat = new THREE.MeshBasicMaterial({ color: 0xef4444 }); // Glowing Crimson Red Crown
  const crown = new THREE.Mesh(crownGeom, crownMat);
  crown.position.set(0, 2.2, 0);
  group.add(crown);

  group.scale.multiplyScalar(1.4); // 1.4x larger Boss scale!
  return group;
}

// Unified Monster Group Generator
export function createMonsterGroup(id: string, type: 'zombie' | 'wolf' | 'bear' | 'goblin' | 'elite'): THREE.Group {
  if (type === 'wolf') return createWolfGroup(id);
  if (type === 'bear') return createBearGroup(id);
  if (type === 'goblin') return createGoblinGroup(id);
  if (type === 'elite') return createEliteGroup(id, 'bear');
  return createZombieGroup(id);
}
