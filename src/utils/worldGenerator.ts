import { BlockType } from '../types/game';

export interface WorldMap {
  blocks: Map<string, BlockType>; // Key is "x,y,z"
  sizeX: number;
  sizeZ: number;
}

export function generateInitialWorld(): WorldMap {
  const blocks = new Map<string, BlockType>();
  // Keep generation radius moderate so startup and movement stay smooth.
  const minX = -360;
  const maxX = 360;
  const minZ = -360;
  const maxZ = 360;

  const setBlock = (x: number, y: number, z: number, type: BlockType) => {
    blocks.set(`${x},${y},${z}`, type);
  };

  // 1. Massive Continental Terrain & Outer Ocean Border
  // Continuous land stretches full screen across the vast continent out to radius 185,
  // where sandy beaches transition into organic crystal ocean water extending to the horizon.
  const islandRadius = 300;
  for (let x = minX; x <= maxX; x++) {
    for (let z = minZ; z <= maxZ; z++) {
      const distFromCenter = Math.sqrt(x * x + z * z);
      const wave = Math.sin(x * 0.08) * 8 + Math.cos(z * 0.08) * 8 + Math.sin((x + z) * 0.04) * 5;
      const effectiveRadius = distFromCenter + wave;

      if (effectiveRadius > islandRadius + 12) {
        // Deep Ocean Water till horizon
        setBlock(x, 0, z, 'SAND');
        setBlock(x, 1, z, 'WATER');
      } else if (effectiveRadius > islandRadius) {
        // Sandy Beach Coastline
        setBlock(x, 0, z, 'SAND');
        setBlock(x, 1, z, 'SAND');
      } else {
        // Full Continental Grassy Land
        setBlock(x, 0, z, 'DIRT');
        setBlock(x, 1, z, 'GRASS');
      }
    }
  }

  // 2. Organic Village Plazas, Ring Roads, and Meandering Forest Trails (No X or + shapes!)
  // Central Spawn Courtyard Plaza
  for (let x = -8; x <= 8; x++) {
    for (let z = -8; z <= 8; z++) {
      const distSq = x * x + z * z;
      if (distSq <= 64) {
        if (blocks.get(`${x},1,${z}`) === 'GRASS') {
          const type = distSq < 16 ? 'COBBLESTONE' : (distSq % 3 === 0 ? 'COBBLESTONE' : 'DIRT');
          setBlock(x, 1, z, type);
        }
      }
    }
  }

  // Inner Village Loop Road (Radius ~36 with organic wave modulation)
  for (let angle = 0; angle < Math.PI * 2; angle += 0.015) {
    const r = 36 + Math.sin(angle * 3) * 6 + Math.cos(angle * 5) * 4;
    const px = Math.round(r * Math.cos(angle));
    const pz = Math.round(r * Math.sin(angle));
    for (let w = -1; w <= 1; w++) {
      for (let dw = -1; dw <= 1; dw++) {
        if (blocks.get(`${px + w},1,${pz + dw}`) === 'GRASS') {
          setBlock(px + w, 1, pz + dw, (px + w + pz + dw) % 3 === 0 ? 'COBBLESTONE' : 'DIRT');
        }
      }
    }
  }

  // Serpentine Connecting Trails (Curved, asymmetrical paths connecting the plaza to the wilderness)
  // Trail A: Winding Northeast Forest Lane (spirals out smoothly)
  for (let t = 8; t <= 125; t++) {
    const angle = 0.35 + t * 0.008 + Math.sin(t * 0.08) * 0.2;
    const px = Math.round(t * Math.cos(angle));
    const pz = Math.round(t * Math.sin(angle));
    for (let w = -1; w <= 1; w++) {
      if (blocks.get(`${px + w},1,${pz}`) === 'GRASS') setBlock(px + w, 1, pz, 'DIRT');
      if (blocks.get(`${px},1,${pz + w}`) === 'GRASS') setBlock(px, 1, pz + w, 'DIRT');
    }
  }

  // Trail B: Winding Southern Coastal Trail (curves gently south)
  for (let t = 8; t <= 125; t++) {
    const angle = 2.05 - t * 0.006 + Math.cos(t * 0.07) * 0.25;
    const px = Math.round(t * Math.cos(angle));
    const pz = Math.round(t * Math.sin(angle));
    for (let w = -1; w <= 1; w++) {
      if (blocks.get(`${px + w},1,${pz}`) === 'GRASS') setBlock(px + w, 1, pz, 'DIRT');
      if (blocks.get(`${px},1,${pz + w}`) === 'GRASS') setBlock(px, 1, pz + w, 'DIRT');
    }
  }

  // Trail C: Winding Northwest Meadow Path
  for (let t = 8; t <= 125; t++) {
    const angle = -1.15 + t * 0.007 + Math.sin(t * 0.09) * 0.3;
    const px = Math.round(t * Math.cos(angle));
    const pz = Math.round(t * Math.sin(angle));
    for (let w = -1; w <= 1; w++) {
      if (blocks.get(`${px + w},1,${pz}`) === 'GRASS') setBlock(px + w, 1, pz, 'DIRT');
      if (blocks.get(`${px},1,${pz + w}`) === 'GRASS') setBlock(px, 1, pz + w, 'DIRT');
    }
  }

  // Roadside Scenic Rest Clearings
  const clearings = [
    { x: 34, z: 22 }, { x: -28, z: 45 }, { x: -50, z: -35 }, { x: 75, z: -60 }, { x: -80, z: 70 }
  ];
  clearings.forEach(c => {
    for (let dx = -3; dx <= 3; dx++) {
      for (let dz = -3; dz <= 3; dz++) {
        if (dx * dx + dz * dz <= 10 && blocks.get(`${c.x + dx},1,${c.z + dz}`) === 'GRASS') {
          setBlock(c.x + dx, 1, c.z + dz, 'COBBLESTONE');
        }
      }
    }
  });

  // 3. Village Everyday Landmark Structures (Survival Mode Interactive Zones)
  // 3A. Fishing Pond 🎣 (at x: -18, z: 18)
  for (let dx = -5; dx <= 5; dx++) {
    for (let dz = -5; dz <= 5; dz++) {
      const distSq = dx * dx + dz * dz;
      if (distSq <= 16) {
        setBlock(-18 + dx, 0, 18 + dz, 'SAND');
        setBlock(-18 + dx, 1, 18 + dz, 'WATER');
      } else if (distSq <= 25) {
        setBlock(-18 + dx, 1, 18 + dz, 'SAND');
      }
    }
  }
  // Wooden Dock sticking out into Pond
  for (let dz = -5; dz <= -1; dz++) {
    setBlock(-18, 1, 18 + dz, 'PLANKS');
  }
  setBlock(-18, 2, 13, 'LAMP');

  const buildCoalHouse = (cx: number, cz: number) => {
    for (let dx = -4; dx <= 4; dx++) {
      for (let dz = -4; dz <= 4; dz++) {
        setBlock(cx + dx, 1, cz + dz, 'COBBLESTONE');
        if (Math.abs(dx) === 4 || Math.abs(dz) === 4) {
          if (dz === -4 && Math.abs(dx) <= 1) continue;
          for (let y = 2; y <= 4; y++) {
            setBlock(cx + dx, y, cz + dz, 'STONE');
          }
        }
      }
    }
    for (let dx = -4; dx <= 4; dx++) {
      for (let dz = -4; dz <= 4; dz++) {
        setBlock(cx + dx, 5, cz + dz, 'ROOF_BROWN');
      }
    }
    setBlock(cx - 2, 2, cz, 'GOLD_ORE');
    setBlock(cx + 2, 2, cz, 'STONE');
    setBlock(cx, 2, cz + 3, 'STONE');
    setBlock(cx, 4, cz - 4, 'LAMP');
  };

  const buildBoxingRing = (cx: number, cz: number) => {
    for (let dx = -4; dx <= 4; dx++) {
      for (let dz = -4; dz <= 4; dz++) {
        setBlock(cx + dx, 1, cz + dz, 'COBBLESTONE');
        if (Math.abs(dx) <= 3 && Math.abs(dz) <= 3) {
          setBlock(cx + dx, 2, cz + dz, 'PLANKS');
        }
      }
    }
    const ringCorners = [
      { x: cx - 3, z: cz - 3 }, { x: cx + 3, z: cz - 3 }, { x: cx - 3, z: cz + 3 }, { x: cx + 3, z: cz + 3 }
    ];
    ringCorners.forEach((corner) => {
      setBlock(corner.x, 3, corner.z, 'WOOD_LOG');
      setBlock(corner.x, 4, corner.z, 'WOOD_LOG');
    });
    for (let dx = -3; dx <= 3; dx++) {
      setBlock(cx + dx, 3, cz - 3, 'CAUTION_TAPE');
      setBlock(cx + dx, 3, cz + 3, 'CAUTION_TAPE');
    }
    for (let dz = -3; dz <= 3; dz++) {
      setBlock(cx - 3, 3, cz + dz, 'CAUTION_TAPE');
      setBlock(cx + 3, 3, cz + dz, 'CAUTION_TAPE');
    }
    setBlock(cx, 4, cz - 4, 'LAMP');
    setBlock(cx, 4, cz + 4, 'LAMP');
  };

  buildCoalHouse(22, -18);
  buildCoalHouse(-90, 80);
  buildBoxingRing(-22, -18);
  buildBoxingRing(-90, 70);
  buildBoxingRing(80, -70);

  // 3D. House for Sale 🏡 (at x: 20, z: 20) - Cozy cottage with garden
  for (let dx = -4; dx <= 4; dx++) {
    for (let dz = -4; dz <= 4; dz++) {
      setBlock(20 + dx, 1, 20 + dz, 'COBBLESTONE');
      if (Math.abs(dx) === 4 || Math.abs(dz) === 4) {
        if (dz === -4 && Math.abs(dx) <= 1) continue; // Front door
        for (let y = 2; y <= 4; y++) {
          setBlock(20 + dx, y, 20 + dz, 'WALL_BEIGE');
        }
      }
    }
  }
  for (let dx = -5; dx <= 5; dx++) {
    for (let dz = -5; dz <= 5; dz++) {
      if (Math.abs(dx) === 5 || Math.abs(dz) === 5) {
        setBlock(20 + dx, 5, 20 + dz, 'ROOF_BROWN');
      } else {
        setBlock(20 + dx, 5, 20 + dz, 'ROOF_BROWN');
        setBlock(20 + dx, 6, 20 + dz, 'ROOF_BROWN');
      }
    }
  }
  setBlock(20, 2, 20, 'TABLE_WOOD');
  setBlock(18, 4, 16, 'LAMP');
  setBlock(22, 4, 16, 'LAMP');

  const buildSmallHouse = (cx: number, cz: number, wallType: BlockType = 'WALL_BEIGE', roofType: BlockType = 'ROOF_BROWN') => {
    for (let dx = -3; dx <= 3; dx++) {
      for (let dz = -3; dz <= 3; dz++) {
        setBlock(cx + dx, 1, cz + dz, 'COBBLESTONE');
        if (Math.abs(dx) === 3 || Math.abs(dz) === 3) {
          if (dz === -3 && dx === 0) continue;
          for (let y = 2; y <= 4; y++) setBlock(cx + dx, y, cz + dz, wallType);
        } else {
          setBlock(cx + dx, 2, cz + dz, 'PLANKS');
        }
      }
    }
    for (let dx = -3; dx <= 3; dx++) {
      for (let dz = -3; dz <= 3; dz++) {
        setBlock(cx + dx, 5, cz + dz, roofType);
      }
    }
    setBlock(cx, 6, cz, roofType);
    setBlock(cx, 2, cz - 3, 'TABLE_WOOD');
    setBlock(cx - 2, 4, cz - 3, 'LAMP');
    setBlock(cx + 2, 4, cz - 3, 'LAMP');
  };

  const buildCottage = (cx: number, cz: number) => {
    for (let dx = -4; dx <= 4; dx++) {
      for (let dz = -4; dz <= 4; dz++) {
        setBlock(cx + dx, 1, cz + dz, 'COBBLESTONE');
        if (Math.abs(dx) === 4 || Math.abs(dz) === 4) {
          if (dz === -4 && Math.abs(dx) <= 1) continue;
          for (let y = 2; y <= 4; y++) setBlock(cx + dx, y, cz + dz, 'WALL_WHITE');
        }
      }
    }
    for (let dx = -4; dx <= 4; dx++) {
      for (let dz = -4; dz <= 4; dz++) {
        setBlock(cx + dx, 5, cz + dz, 'ROOF_RED');
      }
    }
    setBlock(cx, 2, cz, 'TABLE_WOOD');
    setBlock(cx, 3, cz + 4, 'LAMP');
  };

  const buildGeneralStore = (cx: number, cz: number) => {
    for (let dx = -5; dx <= 5; dx++) {
      for (let dz = -4; dz <= 4; dz++) {
        setBlock(cx + dx, 1, cz + dz, 'COBBLESTONE');
        if (Math.abs(dx) === 5 || Math.abs(dz) === 4) {
          for (let y = 2; y <= 4; y++) setBlock(cx + dx, y, cz + dz, 'BRICK');
        }
      }
    }
    for (let dx = -5; dx <= 5; dx++) {
      for (let dz = -4; dz <= 4; dz++) {
        setBlock(cx + dx, 5, cz + dz, 'ROOF_BLUE');
      }
    }
    setBlock(cx, 2, cz + 4, 'TABLE_WOOD');
    setBlock(cx, 2, cz - 4, 'TABLE_WOOD');
    setBlock(cx + 3, 2, cz, 'LAMP');
  };

  const buildBlacksmith = (cx: number, cz: number) => {
    for (let dx = -4; dx <= 4; dx++) {
      for (let dz = -3; dz <= 3; dz++) {
        setBlock(cx + dx, 1, cz + dz, 'COBBLESTONE');
        if (Math.abs(dx) === 4 || Math.abs(dz) === 3) {
          for (let y = 2; y <= 4; y++) setBlock(cx + dx, y, cz + dz, 'STONE');
        }
      }
    }
    for (let dx = -4; dx <= 4; dx++) {
      for (let dz = -3; dz <= 3; dz++) {
        setBlock(cx + dx, 5, cz + dz, 'ROOF_DARK');
      }
    }
    setBlock(cx, 2, cz, 'STONE');
    setBlock(cx + 2, 2, cz, 'IRON_ORE');
    setBlock(cx - 2, 2, cz, 'LAMP');
  };

  const buildLumberMill = (cx: number, cz: number) => {
    for (let dx = -5; dx <= 5; dx++) {
      for (let dz = -3; dz <= 3; dz++) {
        setBlock(cx + dx, 1, cz + dz, 'COBBLESTONE');
        if (Math.abs(dx) === 5 || Math.abs(dz) === 3) {
          for (let y = 2; y <= 4; y++) setBlock(cx + dx, y, cz + dz, 'PLANKS');
        }
      }
    }
    for (let dx = -5; dx <= 5; dx++) {
      for (let dz = -3; dz <= 3; dz++) {
        setBlock(cx + dx, 5, cz + dz, 'ROOF_BROWN');
      }
    }
    for (let dx = -2; dx <= 2; dx++) setBlock(cx + dx, 2, cz, 'WOOD_LOG');
    setBlock(cx, 2, cz + 2, 'LAMP');
  };

  const buildMineEntrance = (cx: number, cz: number) => {
    for (let dx = -3; dx <= 3; dx++) {
      for (let dz = -3; dz <= 3; dz++) {
        setBlock(cx + dx, 1, cz + dz, 'COBBLESTONE');
        if (Math.abs(dx) === 3 || Math.abs(dz) === 3) {
          for (let y = 2; y <= 4; y++) setBlock(cx + dx, y, cz + dz, 'STONE');
        }
      }
    }
    setBlock(cx, 2, cz, 'COAL_ORE');
    setBlock(cx + 1, 2, cz - 3, 'LAMP');
    setBlock(cx - 1, 2, cz - 3, 'LAMP');
  };

  const buildBank = (cx: number, cz: number) => {
    for (let dx = -4; dx <= 4; dx++) {
      for (let dz = -3; dz <= 3; dz++) {
        setBlock(cx + dx, 1, cz + dz, 'COBBLESTONE');
        if (Math.abs(dx) === 4 || Math.abs(dz) === 3) {
          for (let y = 2; y <= 4; y++) setBlock(cx + dx, y, cz + dz, 'WALL_STONE');
        }
      }
    }
    for (let dx = -4; dx <= 4; dx++) {
      for (let dz = -3; dz <= 3; dz++) {
        setBlock(cx + dx, 5, cz + dz, 'ROOF_BLUE');
      }
    }
    setBlock(cx, 2, cz, 'GOLD_ORE');
    setBlock(cx, 2, cz + 3, 'LAMP');
  };

  const buildBakery = (cx: number, cz: number) => {
    buildSmallHouse(cx, cz, 'WALL_BEIGE', 'ROOF_RED');
    setBlock(cx, 2, cz, 'TABLE_WOOD');
    setBlock(cx, 2, cz + 2, 'CROPS');
    setBlock(cx - 2, 2, cz + 2, 'LAMP');
  };

  const buildButcher = (cx: number, cz: number) => {
    buildSmallHouse(cx, cz, 'WALL_STONE', 'ROOF_DARK');
    setBlock(cx, 2, cz, 'STONE');
    setBlock(cx + 2, 2, cz, 'STONE');
    setBlock(cx - 2, 2, cz, 'LAMP');
  };

  const buildRestaurant = (cx: number, cz: number) => {
    buildCottage(cx, cz);
    setBlock(cx, 2, cz, 'TABLE_WOOD');
    setBlock(cx + 2, 2, cz, 'TABLE_WOOD');
    setBlock(cx, 2, cz - 2, 'LAMP');
  };

  const buildCoffeeShop = (cx: number, cz: number) => {
    buildSmallHouse(cx, cz, 'WALL_WHITE', 'ROOF_BLUE');
    setBlock(cx, 2, cz, 'TABLE_WOOD');
    setBlock(cx - 2, 2, cz, 'LAMP');
  };

  const buildFishingLake = (cx: number, cz: number) => {
    for (let dx = -10; dx <= 10; dx++) {
      for (let dz = -10; dz <= 10; dz++) {
        const distSq = dx * dx + dz * dz;
        if (distSq <= 80) {
          setBlock(cx + dx, 0, cz + dz, 'SAND');
          setBlock(cx + dx, 1, cz + dz, 'WATER');
        } else if (distSq <= 96) {
          setBlock(cx + dx, 1, cz + dz, 'SAND');
        }
      }
    }
    for (let dx = -3; dx <= 3; dx++) setBlock(cx + dx, 1, cz - 10, 'PLANKS');
    setBlock(cx, 2, cz - 10, 'LAMP');
  };

  const buildWaterfall = (cx: number, cz: number) => {
    for (let y = 2; y <= 6; y++) {
      setBlock(cx, y, cz, 'STONE');
      setBlock(cx + 1, y, cz, 'STONE');
      setBlock(cx - 1, y, cz, 'STONE');
    }
    for (let dz = -2; dz <= 2; dz++) setBlock(cx, 1, cz + dz, 'WATER');
    setBlock(cx, 2, cz + 3, 'LAMP');
  };

  const buildFarmPlot = (cx: number, cz: number, type: 'cow' | 'chicken' | 'sheep' | 'horse' | 'goat' | 'rabbit' | 'deer' | 'wolf' | 'bear') => {
    for (let dx = -6; dx <= 6; dx++) {
      for (let dz = -6; dz <= 6; dz++) {
        if (Math.abs(dx) === 6 || Math.abs(dz) === 6) setBlock(cx + dx, 1, cz + dz, 'FENCE');
        else setBlock(cx + dx, 1, cz + dz, 'GRASS');
      }
    }
    if (type === 'cow' || type === 'goat') {
      setBlock(cx, 2, cz, 'WOOD_LOG');
      setBlock(cx + 2, 2, cz, 'WOOD_LOG');
      setBlock(cx - 2, 2, cz, 'WOOD_LOG');
    } else if (type === 'chicken' || type === 'rabbit') {
      setBlock(cx, 2, cz, 'PLANKS');
      setBlock(cx + 2, 2, cz, 'PLANKS');
    } else if (type === 'horse') {
      setBlock(cx, 2, cz, 'WOOD_LOG');
      setBlock(cx + 3, 2, cz, 'WOOD_LOG');
    } else if (type === 'sheep') {
      setBlock(cx, 2, cz, 'FENCE');
      setBlock(cx + 2, 2, cz, 'FENCE');
    } else if (type === 'deer') {
      setBlock(cx, 2, cz, 'LEAVES');
    } else if (type === 'wolf' || type === 'bear') {
      setBlock(cx, 2, cz, 'STONE');
      setBlock(cx + 2, 2, cz, 'STONE');
    }
    setBlock(cx, 2, cz + 4, 'LAMP');
  };

  const buildBench = (cx: number, cz: number) => {
    setBlock(cx, 1, cz, 'COBBLESTONE');
    setBlock(cx, 2, cz, 'PLANKS');
    setBlock(cx + 1, 2, cz, 'PLANKS');
    setBlock(cx - 1, 2, cz, 'PLANKS');
  };

  const buildCampfire = (cx: number, cz: number) => {
    setBlock(cx, 1, cz, 'COBBLESTONE');
    setBlock(cx, 2, cz, 'STONE');
    setBlock(cx + 1, 2, cz, 'STONE');
    setBlock(cx - 1, 2, cz, 'STONE');
  };

  const buildBbq = (cx: number, cz: number) => {
    setBlock(cx, 1, cz, 'COBBLESTONE');
    setBlock(cx, 2, cz, 'STONE');
    setBlock(cx + 1, 2, cz, 'STONE');
  };

  const buildLogSeat = (cx: number, cz: number) => {
    setBlock(cx, 2, cz, 'WOOD_LOG');
    setBlock(cx + 1, 2, cz, 'WOOD_LOG');
  };

  const buildCircusTent = (cx: number, cz: number) => {
    for (let dx = -5; dx <= 5; dx++) {
      for (let dz = -4; dz <= 4; dz++) {
        if (Math.abs(dx) === 5 || Math.abs(dz) === 4) setBlock(cx + dx, 1, cz + dz, 'COBBLESTONE');
        if (Math.abs(dx) <= 3 && Math.abs(dz) <= 3) setBlock(cx + dx, 2, cz + dz, 'PLANKS');
      }
    }
    for (let dx = -5; dx <= 5; dx++) setBlock(cx + dx, 3, cz, 'WALL_WHITE');
    setBlock(cx, 4, cz, 'LAMP');
  };

  const buildFerrisWheel = (cx: number, cz: number) => {
    for (let dx = -2; dx <= 2; dx++) {
      for (let dz = -2; dz <= 2; dz++) setBlock(cx + dx, 2, cz + dz, 'PLANKS');
    }
    setBlock(cx, 3, cz, 'WOOD_LOG');
    setBlock(cx + 3, 2, cz, 'LAMP');
  };

  const buildMerryGoRound = (cx: number, cz: number) => {
    for (let dx = -2; dx <= 2; dx++) {
      for (let dz = -2; dz <= 2; dz++) setBlock(cx + dx, 2, cz + dz, 'PLANKS');
    }
    setBlock(cx, 3, cz, 'WOOD_LOG');
  };

  const buildBalloonStand = (cx: number, cz: number) => {
    setBlock(cx, 2, cz, 'PLANKS');
    setBlock(cx + 1, 2, cz, 'PLANKS');
    setBlock(cx - 1, 2, cz, 'PLANKS');
  };

  const buildIceCreamCart = (cx: number, cz: number) => {
    setBlock(cx, 2, cz, 'TABLE_WOOD');
    setBlock(cx + 1, 2, cz, 'PLANKS');
    setBlock(cx - 1, 2, cz, 'PLANKS');
  };

  // Reusable landmark pads keep the larger decorative structures walkable and readable.
  const buildLandmarkPad = (cx: number, cz: number, radius: number, landmark: BlockType) => {
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dz = -radius; dz <= radius; dz++) {
        if (dx * dx + dz * dz <= radius * radius) setBlock(cx + dx, 1, cz + dz, 'COBBLESTONE');
      }
    }
    setBlock(cx, 2, cz, landmark);
  };

  const buildLilyPond = (cx: number, cz: number, withBridge = false) => {
    for (let dx = -5; dx <= 5; dx++) {
      for (let dz = -4; dz <= 4; dz++) {
        const distance = (dx * dx) / 25 + (dz * dz) / 16;
        if (distance <= 1) {
          setBlock(cx + dx, 0, cz + dz, 'SAND');
          setBlock(cx + dx, 1, cz + dz, 'WATER');
        } else if (distance <= 1.35) {
          setBlock(cx + dx, 1, cz + dz, 'SAND');
        }
      }
    }
    setBlock(cx, 2, cz, 'SMALL_POND');
    if (withBridge) setBlock(cx, 2, cz, 'WOODEN_BRIDGE');
  };

  // 1. North-West Fishing Lake & Cascade District
  buildFishingLake(-130, 120);
  buildWaterfall(-160, 150);
  buildRestaurant(-90, 90);
  buildCoffeeShop(-80, 80);

  // 2. North-East Farming & Pastoral Valley
  buildFarmPlot(120, 120, 'cow');
  buildFarmPlot(140, 100, 'chicken');
  buildFarmPlot(90, 150, 'sheep');
  buildBakery(160, 140);

  // 3. South-West Industrial Mining District
  buildBlacksmith(-100, -100);
  buildMineEntrance(-150, -150);
  buildButcher(-80, -140);

  // 4. South-East Carnival & Equestrian District
  buildFarmPlot(100, -100, 'horse');
  buildCircusTent(140, -120);
  buildFerrisWheel(170, -150);
  buildMerryGoRound(150, -160);
  buildBalloonStand(130, -140);
  buildIceCreamCart(120, -130);

  // 5. Outer Wilderness Animal Habitats & Lumber Mill
  buildFarmPlot(-220, 60, 'goat');
  buildFarmPlot(60, 220, 'rabbit');
  buildFarmPlot(-210, -180, 'deer');
  buildFarmPlot(220, -210, 'wolf');
  buildFarmPlot(-220, -220, 'bear');
  buildLumberMill(210, -60);

  // 6. Central Village Plaza & Market Square
  buildGeneralStore(15, -15);
  buildBank(-15, -15);
  buildSmallHouse(20, 20);
  buildCottage(-20, 20);
  buildBench(-10, 0);
  buildBench(10, 0);
  buildBench(0, 10);
  buildCampfire(-15, -5);
  buildBbq(15, 5);
  buildLogSeat(-20, -10);

  // 7. Extra landmark collection: small, recognisable structures spread through every district.
  // These are deliberately open-air attractions, not more house shells.
  buildLilyPond(-118, 52, true);
  buildLilyPond(42, 112);
  buildLandmarkPad(-118, -102, 4, 'STONE_WELL');
  buildLandmarkPad(-128, -72, 5, 'GAZEBO');
  buildLandmarkPad(-104, -122, 4, 'MARKET_STALL');
  buildLandmarkPad(112, 52, 5, 'WINDMILL');
  buildLandmarkPad(118, -42, 5, 'BOXING_RING');
  buildLandmarkPad(104, -22, 3, 'TRAINING_DUMMY');
  buildLandmarkPad(78, 118, 3, 'HAY_BALE');
  buildLandmarkPad(-38, 118, 3, 'GARDEN_ARCH');
  buildLandmarkPad(12, 108, 3, 'CAMPFIRE');
  buildLandmarkPad(-8, 48, 4, 'FOUNTAIN');
  buildLandmarkPad(-178, 72, 3, 'STONE_MONOLITH');
  buildLandmarkPad(186, -88, 3, 'STONE_MONOLITH');

  // 3F. Diverse Houses Across the World Map 🏠 (Huts, Small Houses, 2-Storey Manors, Grand Mansions - all with Fence Yards!)
  const buildHut = (cx: number, cz: number, wallType: BlockType, roofType: BlockType) => {
    // 3x3 footprint hut
    for (let dx = -2; dx <= 2; dx++) {
      for (let dz = -2; dz <= 2; dz++) {
        setBlock(cx + dx, 1, cz + dz, 'COBBLESTONE');
        if (Math.abs(dx) === 2 || Math.abs(dz) === 2) {
          if (dz === -2 && dx === 0) continue; // Door opening
          setBlock(cx + dx, 2, cz + dz, wallType);
          setBlock(cx + dx, 3, cz + dz, wallType);
        } else {
          setBlock(cx + dx, 2, cz + dz, 'PLANKS');
        }
      }
    }
    // Low pyramid roof
    for (let dx = -2; dx <= 2; dx++) {
      for (let dz = -2; dz <= 2; dz++) {
        setBlock(cx + dx, 4, cz + dz, roofType);
      }
    }
    setBlock(cx, 5, cz, roofType);
    setBlock(cx + 1, 3, cz - 2, 'LAMP');

    // Wooden Fence Yard around Hut
    for (let dx = -4; dx <= 4; dx++) {
      for (let dz = -4; dz <= 4; dz++) {
        if (Math.abs(dx) === 4 || Math.abs(dz) === 4) {
          if (dz === -4 && Math.abs(dx) <= 1) continue; // Gate
          setBlock(cx + dx, 2, cz + dz, 'FENCE');
        }
      }
    }
    setBlock(cx - 4, 3, cz - 4, 'LAMP');
    setBlock(cx + 4, 3, cz - 4, 'LAMP');
  };

  const buildMediumHouse = (cx: number, cz: number, groundWall: BlockType, upperWall: BlockType, roofType: BlockType) => {
    // 6x6 footprint 2-storey house
    for (let dx = -3; dx <= 3; dx++) {
      for (let dz = -3; dz <= 3; dz++) {
        setBlock(cx + dx, 1, cz + dz, 'COBBLESTONE');
        if (Math.abs(dx) === 3 || Math.abs(dz) === 3) {
          if (dz === -3 && Math.abs(dx) <= 1) continue;
          for (let y = 2; y <= 4; y++) {
            setBlock(cx + dx, y, cz + dz, groundWall);
          }
        }
        setBlock(cx + dx, 5, cz + dz, 'PLANKS');
        if (Math.abs(dx) === 3 || Math.abs(dz) === 3) {
          for (let y = 6; y <= 8; y++) {
            setBlock(cx + dx, y, cz + dz, upperWall);
          }
        }
      }
    }
    for (let dx = -4; dx <= 4; dx++) {
      for (let dz = -4; dz <= 4; dz++) {
        setBlock(cx + dx, 9, cz + dz, roofType);
      }
    }
    for (let dx = -2; dx <= 2; dx++) {
      for (let dz = -2; dz <= 2; dz++) {
        setBlock(cx + dx, 10, cz + dz, roofType);
      }
    }
    setBlock(cx + 2, 9, cz + 2, 'STONE');
    setBlock(cx + 2, 10, cz + 2, 'STONE');
    setBlock(cx + 2, 11, cz + 2, 'STONE');
    setBlock(cx - 2, 4, cz - 3, 'LAMP');
    setBlock(cx + 2, 4, cz - 3, 'LAMP');

    // Wooden Fence Yard around 2-Storey House
    for (let dx = -7; dx <= 7; dx++) {
      for (let dz = -7; dz <= 7; dz++) {
        if (Math.abs(dx) === 7 || Math.abs(dz) === 7) {
          if (dz === -7 && Math.abs(dx) <= 1) continue; // Front Gate
          setBlock(cx + dx, 2, cz + dz, 'FENCE');
        }
      }
    }
    setBlock(cx - 7, 3, cz - 7, 'LAMP');
    setBlock(cx + 7, 3, cz - 7, 'LAMP');
    setBlock(cx + 4, 2, cz - 4, 'TABLE_WOOD');
    setBlock(cx - 4, 2, cz - 4, 'FLOWER');
  };

  const buildMansion = (cx: number, cz: number, groundWall: BlockType, upperWall: BlockType, roofType: BlockType) => {
    // 8x10 footprint Grand Mansion
    for (let dx = -5; dx <= 5; dx++) {
      for (let dz = -6; dz <= 6; dz++) {
        setBlock(cx + dx, 1, cz + dz, 'COBBLESTONE');
        if (Math.abs(dx) === 5 || Math.abs(dz) === 6) {
          if (dz === -6 && Math.abs(dx) <= 1) continue;
          for (let y = 2; y <= 5; y++) {
            setBlock(cx + dx, y, cz + dz, groundWall);
          }
        }
        setBlock(cx + dx, 6, cz + dz, 'PLANKS');
        if (Math.abs(dx) === 5 || Math.abs(dz) === 6) {
          for (let y = 7; y <= 9; y++) {
            setBlock(cx + dx, y, cz + dz, upperWall);
          }
        }
      }
    }
    setBlock(cx - 3, 2, cz - 7, 'WOOD_LOG');
    setBlock(cx - 3, 3, cz - 7, 'WOOD_LOG');
    setBlock(cx - 3, 4, cz - 7, 'WOOD_LOG');
    setBlock(cx - 3, 5, cz - 7, 'LAMP');
    setBlock(cx + 3, 2, cz - 7, 'WOOD_LOG');
    setBlock(cx + 3, 3, cz - 7, 'WOOD_LOG');
    setBlock(cx + 3, 4, cz - 7, 'WOOD_LOG');
    setBlock(cx + 3, 5, cz - 7, 'LAMP');

    for (let dx = -6; dx <= 6; dx++) {
      for (let dz = -7; dz <= 7; dz++) {
        setBlock(cx + dx, 10, cz + dz, roofType);
      }
    }
    for (let dx = -4; dx <= 4; dx++) {
      for (let dz = -5; dz <= 5; dz++) {
        setBlock(cx + dx, 11, cz + dz, roofType);
      }
    }
    for (let dx = -2; dx <= 2; dx++) {
      for (let dz = -3; dz <= 3; dz++) {
        setBlock(cx + dx, 12, cz + dz, roofType);
      }
    }
    setBlock(cx, 13, cz, 'STONE');
    setBlock(cx, 14, cz, 'LAMP');

    // Grand Estate Wooden Fence Yard
    for (let dx = -9; dx <= 9; dx++) {
      for (let dz = -10; dz <= 10; dz++) {
        if (Math.abs(dx) === 9 || Math.abs(dz) === 10) {
          if (dz === -10 && Math.abs(dx) <= 2) continue; // Grand Gate
          setBlock(cx + dx, 2, cz + dz, 'FENCE');
        }
      }
    }
    setBlock(cx - 4, 3, cz - 10, 'LAMP');
    setBlock(cx + 4, 3, cz - 10, 'LAMP');
    setBlock(cx - 7, 2, cz - 4, 'FLOWER');
    setBlock(cx + 7, 2, cz - 4, 'FLOWER');
    setBlock(cx + 7, 2, cz + 2, 'TABLE_WOOD');
  };

  // 3G. Monster Camps ⛺ (Fighting Mode Special Encounter Clearings with Bonfires & Barricades)
  const buildMonsterCamp = (cx: number, cz: number) => {
    for (let dx = -5; dx <= 5; dx++) {
      for (let dz = -5; dz <= 5; dz++) {
        if (dx * dx + dz * dz <= 25) {
          setBlock(cx + dx, 1, cz + dz, (dx + dz) % 2 === 0 ? 'COBBLESTONE' : 'DIRT');
        }
      }
    }
    // Bonfire at center
    setBlock(cx, 2, cz, 'LAMP');
    setBlock(cx - 1, 2, cz, 'STONE');
    setBlock(cx + 1, 2, cz, 'STONE');
    setBlock(cx, 2, cz - 1, 'STONE');
    setBlock(cx, 2, cz + 1, 'STONE');

    // Barricade fence around perimeter
    for (let dx = -5; dx <= 5; dx++) {
      for (let dz = -5; dz <= 5; dz++) {
        if (Math.abs(dx) === 5 || Math.abs(dz) === 5) {
          if (dz === -5 && Math.abs(dx) <= 1) continue;
          setBlock(cx + dx, 2, cz + dz, 'CAUTION_TAPE');
        }
      }
    }
    setBlock(cx - 3, 2, cz - 2, 'WOOD_LOG');
    setBlock(cx + 3, 2, cz - 2, 'WOOD_LOG');
    setBlock(cx - 3, 2, cz + 2, 'TREASURE_CHEST');
    setBlock(cx + 3, 2, cz + 2, 'TREASURE_CHEST');
    setBlock(cx, 2, cz + 3, 'CRYSTAL_ORE');
  };

  // Build 4 Monster Camps in the wilderness
  buildMonsterCamp(-45, -55); // Northwest Goblin Outpost Camp
  buildMonsterCamp(55, 45);   // Southeast Wolf Den Camp
  buildMonsterCamp(-60, 60);  // Southwest Bear Cave Camp
  buildMonsterCamp(65, -60);  // Northeast Elite Boss Shrine Camp

  // Place houses distributed across all regions of the world map (keeping spawn center clear for WASD movement!)
  // Near Village Center (at comfortable 25-35 block distances)
  buildSmallHouse(32, 26, 'WALL_WHITE', 'ROOF_RED');        // Village East House
  buildMediumHouse(-32, -26, 'BRICK', 'WALL_BEIGE', 'ROOF_BLUE'); // Village West House
  buildHut(26, -32, 'WOOD_LOG', 'ROOF_DARK');               // North Forest Cabin
  buildSmallHouse(-26, 32, 'WALL_BEIGE', 'ROOF_BROWN');      // South Meadow Cottage

  // Mid-Distance Neighborhoods (45-65 block distances)
  buildSmallHouse(55, 45, 'WALL_WHITE', 'ROOF_BLUE');       // Southeast Lakeside Cottage
  buildMediumHouse(-50, 50, 'WALL_STONE', 'WALL_WHITE', 'ROOF_DARK'); // Southwest Stone Manor
  buildHut(-55, -45, 'WOOD_LOG', 'ROOF_BROWN');            // Northwest Woodsman Hut
  buildMediumHouse(50, -50, 'COBBLESTONE', 'WALL_BEIGE', 'ROOF_RED'); // Northeast Guild Hall

  // Outer Estates & Mansions (70-100 block distances)
  buildMansion(-80, -75, 'WALL_STONE', 'WALL_WHITE', 'ROOF_DARK');  // Northwest Grand Mansion
  buildMansion(85, -70, 'BRICK', 'WALL_WHITE', 'ROOF_BLUE');        // Northeast Grand Mansion
  buildMansion(75, 80, 'WALL_STONE', 'WALL_BEIGE', 'ROOF_RED');     // Southeast Grand Mansion
  buildMansion(-75, 85, 'WALL_STONE', 'WALL_WHITE', 'ROOF_BLUE');   // Southwest Grand Mansion
  buildHut(90, 20, 'WOOD_LOG', 'ROOF_DARK');                         // Far East Coast Outpost
  buildHut(-90, -20, 'WALL_BEIGE', 'ROOF_BROWN');                    // Far West Coast Outpost

  // List of house centers & radii to avoid when placing trees/decor
  const houseExclusions = [
    { x: 20, z: 20, r: 8 },
    { x: 32, z: 26, r: 8 },
    { x: -32, z: -26, r: 9 },
    { x: 26, z: -32, r: 6 },
    { x: -26, z: 32, r: 8 },
    { x: 55, z: 45, r: 8 },
    { x: -50, z: 50, r: 9 },
    { x: -55, z: -45, r: 6 },
    { x: 50, z: -50, r: 9 },
    { x: -80, z: -75, r: 12 },
    { x: 85, z: -70, r: 12 },
    { x: 75, z: 80, r: 12 },
    { x: -75, z: 85, r: 12 },
    { x: 90, z: 20, r: 6 },
    { x: -90, z: -20, r: 6 },
  ];

  // 4. Layered Cubic Trees scattered evenly across the massive continent using a jittered spatial grid
  // This ensures trees are never jampacked together and form natural open woodlands and clearings.
  const treeCellSize = 12; // Minimum spacing between trees
  let treeIndex = 0;
  for (let cx = -135; cx <= 135; cx += treeCellSize) {
    for (let cz = -135; cz <= 135; cz += treeCellSize) {
      // Deterministic hash for natural scattering within cell
      const hash1 = Math.sin(cx * 12.9898 + cz * 78.233) * 43758.5453;
      const fract1 = hash1 - Math.floor(hash1);

      // Leave ~25% of cells empty to create natural open meadows and clearings
      if (fract1 < 0.25) continue;

      const hash2 = Math.sin(cx * 39.346 + cz * 11.135) * 23145.132;
      const fract2 = hash2 - Math.floor(hash2);

      // Place tree at random offset within the 12x12 cell (leaving a 2-block margin)
      const tx = cx + Math.floor(fract1 * (treeCellSize - 4)) + 2;
      const tz = cz + Math.floor(fract2 * (treeCellSize - 4)) + 2;

      // Avoid spawn center, roads, landmark centers & houses!
      if (Math.abs(tx) < 6 && Math.abs(tz) < 6) continue;
      if (Math.abs(tx - (-18)) < 8 && Math.abs(tz - 18) < 8) continue; // Pond
      if (Math.abs(tx - 22) < 8 && Math.abs(tz - (-18)) < 8) continue; // Coal House
      if (Math.abs(tx - (-22)) < 8 && Math.abs(tz - (-18)) < 8) continue; // Boxing Ring
      if (Math.abs(tx - 0) < 6 && Math.abs(tz - (-28)) < 6) continue; // Lumber clearing center
      if (houseExclusions.some(h => Math.abs(tx - h.x) <= h.r && Math.abs(tz - h.z) <= h.r)) continue;
      if (blocks.get(`${tx},1,${tz}`) !== 'GRASS') continue;

      // Determine tree size variation (0: Small Compact, 1: Medium Oak, 2: Tall Slender Pine, 3: Grand Wide Oak)
      const treeType = treeIndex % 4;
      treeIndex++;

      if (treeType === 0) {
        // 1. Small Compact Sapling / Bush Tree (3 blocks tall)
        setBlock(tx, 2, tz, 'WOOD_LOG');
        setBlock(tx, 3, tz, 'WOOD_LOG');
        for (let dx = -1; dx <= 1; dx++) {
          for (let dz = -1; dz <= 1; dz++) {
            if (dx === 0 && dz === 0) continue;
            setBlock(tx + dx, 3, tz + dz, 'LEAVES');
          }
        }
        setBlock(tx, 4, tz, 'LEAVES');
      } else if (treeType === 1) {
        // 2. Standard Medium Oak Tree (5 blocks tall)
        setBlock(tx, 2, tz, 'WOOD_LOG');
        setBlock(tx, 3, tz, 'WOOD_LOG');
        setBlock(tx, 4, tz, 'WOOD_LOG');
        for (let dx = -1; dx <= 1; dx++) {
          for (let dz = -1; dz <= 1; dz++) {
            if (dx === 0 && dz === 0) continue;
            setBlock(tx + dx, 4, tz + dz, 'LEAVES');
          }
        }
        for (let dx = -1; dx <= 1; dx++) {
          for (let dz = -1; dz <= 1; dz++) {
            setBlock(tx + dx, 5, tz + dz, 'LEAVES');
          }
        }
        setBlock(tx, 6, tz, 'LEAVES');
      } else if (treeType === 2) {
        // 3. Tall Slender Pine / Spruce Tree (7 blocks tall)
        for (let y = 2; y <= 6; y++) {
          setBlock(tx, y, tz, 'WOOD_LOG');
        }
        for (let dx = -1; dx <= 1; dx++) {
          for (let dz = -1; dz <= 1; dz++) {
            if (dx === 0 && dz === 0) continue;
            setBlock(tx + dx, 3, tz + dz, 'LEAVES');
            setBlock(tx + dx, 5, tz + dz, 'LEAVES');
          }
        }
        setBlock(tx, 4, tz, 'LEAVES');
        for (let dx = -1; dx <= 1; dx++) {
          for (let dz = -1; dz <= 1; dz++) {
            setBlock(tx + dx, 6, tz + dz, 'LEAVES');
          }
        }
        setBlock(tx, 7, tz, 'LEAVES');
        setBlock(tx, 8, tz, 'LEAVES');
      } else {
        // 4. Grand Wide Ancient Oak (6 blocks tall, wide 5x5 canopy)
        for (let y = 2; y <= 5; y++) {
          setBlock(tx, y, tz, 'WOOD_LOG');
        }
        for (let y = 4; y <= 5; y++) {
          for (let dx = -2; dx <= 2; dx++) {
            for (let dz = -2; dz <= 2; dz++) {
              if (dx === 0 && dz === 0 && y === 4) continue;
              // Trim extreme corners for an organic rounded canopy
              if (Math.abs(dx) === 2 && Math.abs(dz) === 2) continue;
              setBlock(tx + dx, y, tz + dz, 'LEAVES');
            }
          }
        }
        for (let dx = -1; dx <= 1; dx++) {
          for (let dz = -1; dz <= 1; dz++) {
            setBlock(tx + dx, 6, tz + dz, 'LEAVES');
          }
        }
        setBlock(tx, 7, tz, 'LEAVES');
      }
    }
  }

  // 4. Flowers, Herbs, Berries, Mushrooms, Ores & Treasure Chests scattered across the map
  const decorCellSize = 6;
  let decorIndex = 0;
  for (let cx = -140; cx <= 140; cx += decorCellSize) {
    for (let cz = -140; cz <= 140; cz += decorCellSize) {
      const hash = Math.sin(cx * 53.123 + cz * 21.897) * 51234.567;
      const fract = hash - Math.floor(hash);
      if (fract < 0.35) continue;

      const hash2 = Math.sin(cx * 89.123 + cz * 45.678) * 31234.567;
      const fract2 = hash2 - Math.floor(hash2);

      const dx = cx + Math.floor(fract * (decorCellSize - 1));
      const dz = cz + Math.floor(fract2 * (decorCellSize - 1));

      if (Math.abs(dx) < 5 && Math.abs(dz) < 5) continue;
      if (blocks.get(`${dx},1,${dz}`) !== 'GRASS' && blocks.get(`${dx},1,${dz}`) !== 'STONE') continue;
      if (blocks.get(`${dx},2,${dz}`)) continue;

      // Cycle decor & resource nodes
      let type: BlockType = 'FLOWER';
      const rMod = decorIndex % 12;
      if (rMod === 0) type = 'HERB';
      else if (rMod === 1) type = 'BERRY_BUSH';
      else if (rMod === 2) type = 'MUSHROOM';
      else if (rMod === 3) type = 'COAL_ORE';
      else if (rMod === 4) type = 'IRON_ORE';
      else if (rMod === 5) type = 'GOLD_ORE';
      else if (rMod === 6) type = 'CRYSTAL_ORE';
      else if (rMod === 7) type = 'TREASURE_CHEST';
      else if (rMod === 8) type = 'CROPS';
      else if (rMod === 9) type = 'STONE';
      else type = 'FLOWER';

      setBlock(dx, 2, dz, type);
      decorIndex++;
    }
  }

  return { blocks, sizeX: maxX - minX, sizeZ: maxZ - minZ };
}
