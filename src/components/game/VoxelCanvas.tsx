import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { BlockType, InventoryItem, NPC, WorldCoord } from "../../types/game";
import { BLOCK_DEFINITIONS } from "../../game/constants";
import {
  createCharacterGroup,
  createCustomBlockGeometry,
  createMonsterGroup,
} from "../../game/VoxelRendererUtils";
import { MonsterType } from "../../types/game";
import { WorldMap } from "../../utils/worldGenerator";

// Cache for universal box grid texture
let universalGridTexture: THREE.CanvasTexture | null = null;

const SOLID_OBSTACLES = new Set<BlockType>([
  "WOOD_LOG",
  "WALL_BEIGE",
  "WALL_WHITE",
  "WALL_STONE",
  "BRICK",
  "FENCE",
  "TABLE_WOOD",
  "LAMP",
  "ROOF_BROWN",
  "ROOF_RED",
  "ROOF_BLUE",
  "ROOF_DARK",
  "CAUTION_TAPE",
]);

const ENABLE_REALTIME_SHADOWS = false;

// Generates a crisp, pixel-perfect 2D box grid texture that preserves 100% of the block's main color
function getUniversalBoxGridTexture(): THREE.CanvasTexture {
  if (universalGridTexture) {
    return universalGridTexture;
  }

  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    // 1. Fill pure white so when Three.js multiplies material.color * map, the block's exact main color is 100% preserved!
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 64, 64);

    // 2. Add subtle 3D inner bevel for depth without altering base color hue
    ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
    ctx.fillRect(0, 0, 64, 2);
    ctx.fillRect(0, 0, 2, 64);

    ctx.fillStyle = "rgba(0, 0, 0, 0.10)";
    ctx.fillRect(0, 62, 64, 2);
    ctx.fillRect(62, 0, 2, 64);

    // 3. Crisp box grid outline around the perimeter of every small box - gray and thin as requested
    ctx.strokeStyle = "rgba(156, 163, 175, 0.45)"; // light gray grid outline
    ctx.lineWidth = 1.5; // thin outline
    ctx.strokeRect(0, 0, 64, 64);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  universalGridTexture = texture;
  return texture;
}

interface VoxelCanvasProps {
  world: WorldMap;
  onBlockMine: (coord: WorldCoord, blockType: BlockType) => void;
  onBlockPlace: (coord: WorldCoord, blockType: BlockType) => void;
  onNpcClick: (npc: NPC) => void;
  onInspectWagon: () => void;
  selectedItem: InventoryItem | null;
  activeMode: "mine" | "build" | "interact";
  npcs: NPC[];
  timeOfDay: "day" | "sunset" | "night";
  onAddChatMessage: (sender: string, text: string, role?: any) => void;
  cameraZoom: number;
  cameraAngle: number; // 0, 1, 2, 3 (90 degree steps)
  onZoomChange?: (updater: (prev: number) => number) => void;
  gameMode: "survival" | "fighting";
  houseOwned?: boolean;
  onDiscoverLocation?: (locName: string, locationId: string) => void;
  onReady?: () => void;
  onCombatExpGain?: (amount: number) => void;
}

export const VoxelCanvas: React.FC<VoxelCanvasProps> = ({
  world,
  onBlockMine,
  onBlockPlace,
  onNpcClick,
  onInspectWagon,
  selectedItem,
  activeMode,
  npcs,
  timeOfDay,
  cameraZoom,
  cameraAngle,
  onZoomChange,
  gameMode,
  houseOwned,
  onDiscoverLocation,
  onReady,
  onCombatExpGain,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  const [isTouchDevice] = useState(
    () => typeof window !== "undefined" && ("ontouchstart" in window || navigator.maxTouchPoints > 0)
  );

  const [locationToast, setLocationToast] = useState<string | null>(null);
  const visitedLandmarksRef = useRef<Set<string>>(new Set());
  const onDiscoverLocationRef = useRef(onDiscoverLocation);

  useEffect(() => {
    onDiscoverLocationRef.current = onDiscoverLocation;
  }, [onDiscoverLocation]);

  const [hoveredBlockInfo, setHoveredBlockInfo] = useState<{
    x: number;
    y: number;
    z: number;
    name: string;
  } | null>(null);
  const hoveredBlockKeyRef = useRef<string | null>(null);

  // Survival Mode Name Tags State
  const [npcTags, setNpcTags] = useState<
    {
      id: string;
      label: string;
      icon: string;
      x: number;
      y: number;
      npc: NPC;
    }[]
  >([]);
  const npcGroupsRef = useRef<Map<string, THREE.Group>>(new Map());
  const lastNpcTagUpdateRef = useRef<number>(0);
  const gameModeRef = useRef(gameMode);
  const npcsRef = useRef(npcs);
  const onNpcClickRef = useRef(onNpcClick);
  const houseOwnedRef = useRef(houseOwned);
  const cameraZoomRef = useRef(cameraZoom);
  const isGameOverRef = useRef(false);
  const lastSliceTimeRef = useRef(0);

  useEffect(() => {
    gameModeRef.current = gameMode;
  }, [gameMode]);
  useEffect(() => {
    npcsRef.current = npcs;
  }, [npcs]);
  useEffect(() => {
    onNpcClickRef.current = onNpcClick;
  }, [onNpcClick]);
  useEffect(() => {
    houseOwnedRef.current = houseOwned;
  }, [houseOwned]);
  useEffect(() => {
    cameraZoomRef.current = cameraZoom;
  }, [cameraZoom]);
  useEffect(() => {
    return () => {
      activeSlashTimersRef.current.forEach((timerId) =>
        window.clearTimeout(timerId),
      );
      activeSlashTimersRef.current = [];
    };
  }, []);

  // Combat UI States
  const [playerHp, setPlayerHp] = useState<number>(100);
  const maxPlayerHp = 100;
  const [zombiesSlain, setZombiesSlain] = useState<number>(0);
  const [zombiesList, setZombiesList] = useState<
    { id: string; hp: number; maxHp: number }[]
  >([]);
  const [isPlayerHit, setIsPlayerHit] = useState<boolean>(false);
  const [isSlicing, setIsSlicing] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  // keep a ref in sync so animation-loop closures always read current value
  useEffect(() => { isGameOverRef.current = isGameOver; }, [isGameOver]);

  // Bottom-Left Context Action Guide State
  const [contextGuide, setContextGuide] = useState<{
    action: string;
    description: string;
    icon: string;
    keyHint: string;
  }>({
    action: "WALK & EXPLORE",
    description: "Use WASD keys to walk around houses, mines & forests",
    icon: "🚶",
    keyHint: "WASD",
  });

  // Floating Labels on top of nearby world objects
  const [objectTags, setObjectTags] = useState<
    { id: string; name: string; icon: string; x: number; y: number }[]
  >([]);
  const [activeObjectTag, setActiveObjectTag] = useState<{
    id: string;
    name: string;
    icon: string;
    x: number;
    y: number;
  } | null>(null);

  // Combat Refs
  interface ActiveMonster {
    id: string;
    type: MonsterType;
    name: string;
    group: THREE.Group;
    x: number;
    z: number;
    hp: number;
    maxHp: number;
    speed: number;
    damage: number;
    goldReward: number;
    attackCooldown: number;
    hitTimer: number;
    isElite?: boolean;
  }

  const getMonsterExpReward = useCallback((monster: ActiveMonster) => {
    switch (monster.type) {
      case "zombie":
        return 1;
      case "wolf":
        return 2;
      case "goblin":
        return 3;
      case "bear":
        return 4;
      case "elite":
        return 5;
      default:
        return 1;
    }
  }, []);
  const activeZombiesRef = useRef<Map<string, ActiveMonster>>(new Map());
  const zombieSpawnTimerRef = useRef<number>(0);
  const nextZombieIdRef = useRef<number>(1);
  const lastUiUpdateRef = useRef<number>(0);
  const playerHpRef = useRef<number>(100);
  const activeSlashTimersRef = useRef<number[]>([]);
  const healthRegenCooldownRef = useRef<number>(0);
  const runTimeRef = useRef<number>(0);
  const movementIntensityRef = useRef<number>(0);

  const cleanupSlashMesh = useCallback(
    (
      mesh: THREE.Mesh,
      geometry: THREE.TorusGeometry,
      material: THREE.MeshBasicMaterial,
    ) => {
      if (mesh.parent) {
        mesh.parent.remove(mesh);
      }
      geometry.dispose();
      material.dispose();
    },
    [],
  );

  const restartFight = useCallback(() => {
    playerHpRef.current = 100;
    setPlayerHp(100);
    setZombiesSlain(0);
    setIsGameOver(false);
    setIsPlayerHit(false);
    setIsSlicing(false);

    activeZombiesRef.current.forEach((monster) => {
      sceneRef.current?.remove(monster.group);
    });
    activeZombiesRef.current.clear();
    setZombiesList([]);
    zombieSpawnTimerRef.current = 0;
    nextZombieIdRef.current = 1;
    healthRegenCooldownRef.current = 0;
    runTimeRef.current = 0;
    movementIntensityRef.current = 0;
  }, []);

  const sliceZombies = useCallback(() => {
    if (
      gameModeRef.current !== "fighting" ||
      isGameOverRef.current ||
      !sceneRef.current ||
      !playerGroupRef.current
    )
      return;

    // Enforce 200ms cooldown so rapid/held P presses don't stack slashes
    const now = performance.now();
    if (now - lastSliceTimeRef.current < 200) return;
    lastSliceTimeRef.current = now;

    setIsSlicing(true);
    // Always clear the flash after 200ms regardless of further presses
    const slicingTimer = window.setTimeout(() => setIsSlicing(false), 200);
    activeSlashTimersRef.current.push(slicingTimer);

    const playerPos = playerGroupRef.current.position;

    // 3D Sword Slash Visual Arc effect
    const slashGeom = new THREE.TorusGeometry(2.2, 0.15, 8, 24, Math.PI);
    const slashMat = new THREE.MeshBasicMaterial({
      color: 0xfef08a,
      wireframe: false,
      transparent: true,
      opacity: 0.9,
    });
    const slashMesh = new THREE.Mesh(slashGeom, slashMat);
    slashMesh.position.copy(playerPos);
    slashMesh.position.y += 1.3;
    slashMesh.rotation.x = Math.PI / 2;
    slashMesh.rotation.z = playerGroupRef.current.rotation.y;
    sceneRef.current.add(slashMesh);

    // Always clean up THIS slash after 200ms
    const slashCleanupTimer = window.setTimeout(() => {
      activeSlashTimersRef.current = activeSlashTimersRef.current.filter(
        (timerId) => timerId !== slashCleanupTimer,
      );
      cleanupSlashMesh(slashMesh, slashGeom, slashMat);
    }, 200);
    activeSlashTimersRef.current.push(slashCleanupTimer);

    // Animate player right arm swinging for 200ms
    const rightArm = playerGroupRef.current.getObjectByName("rightArm");
    if (rightArm) {
      rightArm.rotation.x = -Math.PI / 1.5;
      const armTimer = window.setTimeout(() => {
        if (rightArm) rightArm.rotation.x = 0;
      }, 200);
      activeSlashTimersRef.current.push(armTimer);
    }

    // Check hit on all active monsters within slash reach (distance < 4.5)
    let killedCount = 0;
    let expGained = 0;
    const toRemove: string[] = [];

    activeZombiesRef.current.forEach((m, id) => {
      const dx = m.x - playerPos.x;
      const dz = m.z - playerPos.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist <= 4.5) {
        // Monster is sliced!
        m.hp -= 45;
        m.hitTimer = 0.15; // flash white/red for 150ms

        // Knockback away from player
        if (dist > 0.1) {
          m.x += (dx / dist) * 1.5;
          m.z += (dz / dist) * 1.5;
          m.group.position.set(m.x, 1.5, m.z);
        }

        // Update 3D floating HP bar
        const fg = m.group.getObjectByName("hpBarFg") as THREE.Mesh;
        if (fg) {
          const hpRatio = Math.max(0.001, m.hp / m.maxHp);
          fg.scale.x = hpRatio;
          fg.position.x = -(1.14 * (1 - hpRatio)) / 2;
          const mat = fg.material as THREE.MeshBasicMaterial;
          if (hpRatio > 0.5) mat.color.setHex(0x22c55e);
          else if (hpRatio > 0.25) mat.color.setHex(0xeab308);
          else mat.color.setHex(0xef4444);
        }

        if (m.hp <= 0) {
          expGained += getMonsterExpReward(m);
          toRemove.push(id);
          killedCount++;
        }
      }
    });

    // Remove slain monsters
    toRemove.forEach((id) => {
      const m = activeZombiesRef.current.get(id);
      if (m && sceneRef.current) {
        sceneRef.current.remove(m.group);
      }
      activeZombiesRef.current.delete(id);
    });

    if (killedCount > 0) {
      setZombiesSlain((prev) => prev + killedCount);
      onCombatExpGain?.(expGained);
    }

    // Immediately update UI list
    const list: { id: string; hp: number; maxHp: number }[] = [];
    activeZombiesRef.current.forEach((z) => {
      list.push({
        id: z.id,
        hp: Math.max(0, Math.round(z.hp)),
        maxHp: z.maxHp,
      });
    });
    setZombiesList(list);
  }, [cleanupSlashMesh, getMonsterExpReward, onCombatExpGain]);

  // Listen for 'P' key to slice zombies — block repeated events from held key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return; // ignore auto-repeat when key is held
      if (e.key.toLowerCase() === "p") {
        sliceZombies();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [sliceZombies]);

  // References for dynamic updates
  const instancedMeshesRef = useRef<Map<BlockType, THREE.InstancedMesh>>(
    new Map(),
  );
  const hoverBoxRef = useRef<THREE.Mesh | null>(null);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2(-999, -999));
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const cameraTargetRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 1, 0));
  const sunLightRef = useRef<THREE.DirectionalLight | null>(null);
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const lightConfigRef = useRef<{
    ambientColor: THREE.Color;
    ambientIntensity: number;
    sunColor: THREE.Color;
    sunIntensity: number;
    sunOffset: THREE.Vector3;
    bgColor: THREE.Color;
  }>({
    ambientColor: new THREE.Color(0xffffff),
    ambientIntensity: 0.75,
    sunColor: new THREE.Color(0xfffbeb),
    sunIntensity: 0.9,
    sunOffset: new THREE.Vector3(80, 120, 60),
    bgColor: new THREE.Color(0x3b82f6),
  });
  const clockRef = useRef<THREE.Clock>(new THREE.Clock());

  // Player Character & Movement References
  const playerGroupRef = useRef<THREE.Group | null>(null);
  const keysPressedRef = useRef<Set<string>>(new Set());

  const worldRef = useRef<WorldMap>(world);
  useEffect(() => {
    worldRef.current = world;
  }, [world]);

  // Re-build instanced meshes when world changes
  const updateWorldMeshes = useCallback(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Clear existing instanced meshes
    instancedMeshesRef.current.forEach((mesh) => {
      scene.remove(mesh);
      mesh.geometry.dispose();
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((m) => m.dispose());
      } else {
        mesh.material.dispose();
      }
    });
    instancedMeshesRef.current.clear();

    // Group world coordinates by BlockType
    const blocksByType = new Map<
      BlockType,
      { x: number; y: number; z: number }[]
    >();
    world.blocks.forEach((type, key) => {
      const [x, y, z] = key.split(",").map(Number);
      if (!blocksByType.has(type)) blocksByType.set(type, []);
      blocksByType.get(type)!.push({ x, y, z });
    });

    const matrix = new THREE.Matrix4();

    blocksByType.forEach((coords, type) => {
      const def = BLOCK_DEFINITIONS[type];
      if (!def) return;

      let geom: THREE.BufferGeometry;
      if (def.isCustomMesh) {
        geom = createCustomBlockGeometry(type);
      } else {
        geom = new THREE.BoxGeometry(1, 1, 1);
      }

      const mat = new THREE.MeshLambertMaterial({
        color: def.color,
        // Keep the pixel edge treatment for crafted objects, but let the landscape
        // read as one continuous field instead of a grid of outlined cubes.
        map: def.category === "building" || def.category === "decoration"
          ? getUniversalBoxGridTexture()
          : null,
        flatShading: true,
        transparent: def.transparent || false,
        opacity: def.transparent ? 0.85 : 1.0,
      });

      const mesh = new THREE.InstancedMesh(geom, mat, coords.length);
      mesh.castShadow = ENABLE_REALTIME_SHADOWS;
      mesh.receiveShadow = ENABLE_REALTIME_SHADOWS;
      mesh.name = `instance-${type}`;

      coords.forEach((coord, i) => {
        matrix.setPosition(coord.x, coord.y, coord.z);
        mesh.setMatrixAt(i, matrix);
      });

      mesh.instanceMatrix.needsUpdate = true;
      scene.add(mesh);
      instancedMeshesRef.current.set(type, mesh);
    });
  }, [world]);

  // Update atmosphere and map lighting targets when timeOfDay changes
  useEffect(() => {
    if (timeOfDay === "day") {
      lightConfigRef.current = {
        ambientColor: new THREE.Color(0xffffff),
        ambientIntensity: 0.75,
        sunColor: new THREE.Color(0xfffbeb),
        sunIntensity: 0.9,
        sunOffset: new THREE.Vector3(80, 120, 60),
        bgColor: new THREE.Color(0x3b82f6), // Match WATER block color to hide world edge
      };
    } else if (timeOfDay === "sunset") {
      lightConfigRef.current = {
        ambientColor: new THREE.Color(0xfb923c),
        ambientIntensity: 0.55,
        sunColor: new THREE.Color(0xf97316),
        sunIntensity: 0.85,
        sunOffset: new THREE.Vector3(130, 35, -40), // Low angle golden sunset light with dramatic long shadows
        bgColor: new THREE.Color(0x431407), // Dark sunset ocean depth
      };
    } else if (timeOfDay === "night") {
      lightConfigRef.current = {
        ambientColor: new THREE.Color(0x38bdf8),
        ambientIntensity: 0.22, // Moody dark nocturnal lighting on the map blocks
        sunColor: new THREE.Color(0x818cf8),
        sunIntensity: 0.35,
        sunOffset: new THREE.Vector3(-60, 100, -60), // Moonlight angle
        bgColor: new THREE.Color(0x0f172a), // Dark midnight abyss
      };
    }
  }, [timeOfDay]);

  // Update Camera angle and zoom
  useEffect(() => {
    const camera = cameraRef.current;
    if (!camera) return;

    const dist = 55;
    const yaw = (cameraAngle * Math.PI) / 2 + Math.PI / 4;
    const pitch = Math.atan(1 / Math.sqrt(2)); // ~35.264 degrees isometric

    const target = cameraTargetRef.current;
    camera.position.set(
      target.x + dist * Math.cos(pitch) * Math.sin(yaw),
      target.y + dist * Math.sin(pitch),
      target.z + dist * Math.cos(pitch) * Math.cos(yaw),
    );
    camera.lookAt(target);

    camera.zoom = cameraZoom;
    camera.updateProjectionMatrix();
  }, [cameraAngle, cameraZoom]);

  // Setup Keyboard WASD movement listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return; // ignore auto-repeat; movement is driven by the animation loop
      const key = e.key.toLowerCase();
      keysPressedRef.current.add(key);

      if (key === 'e' && gameModeRef.current === 'survival') {
        if (playerGroupRef.current) {
          const pX = playerGroupRef.current.position.x;
          const pZ = playerGroupRef.current.position.z;
          const nearbyNpc = npcsRef.current.find(
            (n) => Math.sqrt((pX - n.x) ** 2 + (pZ - n.z) ** 2) <= 4.5
          );
          if (nearbyNpc && onNpcClickRef.current) {
            onNpcClickRef.current(nearbyNpc);
          }
        }
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressedRef.current.delete(e.key.toLowerCase());
    };
    // If the page loses focus, all held keys should be released immediately
    const handleBlur = () => {
      keysPressedRef.current.clear();
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("visibilitychange", handleBlur);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("visibilitychange", handleBlur);
    };
  }, []);

  // Setup Three.js scene
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x3b82f6);
    sceneRef.current = scene;

    // Isometric Orthographic Camera
    const aspect = width / height;
    const frustumSize = 65;
    const camera = new THREE.OrthographicCamera(
      (frustumSize * aspect) / -2,
      (frustumSize * aspect) / 2,
      frustumSize / 2,
      frustumSize / -2,
      0.1,
      2000,
    );
    cameraRef.current = camera;

    const dist = 55;
    const yaw = Math.PI / 4;
    const pitch = Math.atan(1 / Math.sqrt(2));
    camera.position.set(
      dist * Math.cos(pitch) * Math.sin(yaw),
      dist * Math.sin(pitch),
      dist * Math.cos(pitch) * Math.cos(yaw),
    );
    camera.lookAt(0, 1, 0);
    camera.zoom = cameraZoom;
    camera.updateProjectionMatrix();

    // WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: false,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.0));
    renderer.shadowMap.enabled = ENABLE_REALTIME_SHADOWS;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    ambientLightRef.current = ambientLight;

    const sunLight = new THREE.DirectionalLight(0xfffbeb, 0.85);
    sunLight.position.set(80, 120, 60);
    sunLight.castShadow = ENABLE_REALTIME_SHADOWS;
    sunLight.shadow.mapSize.width = 4096;
    sunLight.shadow.mapSize.height = 4096;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 500;
    const d = 110;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = -d;
    sunLight.shadow.camera.bottom = d;
    scene.add(sunLight);
    scene.add(sunLight.target);
    sunLightRef.current = sunLight;

    const backdropGeometry = new THREE.PlaneGeometry(12000, 12000);
    const backdropMaterial = new THREE.MeshBasicMaterial({
      color: 0x2f6b1f,
      depthWrite: false,
    });
    const fullscreenBackdrop = new THREE.Mesh(backdropGeometry, backdropMaterial);
    fullscreenBackdrop.rotation.x = -Math.PI / 2;
    fullscreenBackdrop.position.y = -1.5;
    scene.add(fullscreenBackdrop);

    // Create Player Character (Minecraft-style 2D pixel human in 3D voxel world)
    const playerNpc: NPC = {
      id: "player-main",
      name: "Player",
      title: "Explorer",
      x: 0,
      y: 1.5,
      z: 0,
      rotation: 0,
      headStyle: "villager",
      outfitColor: "#3b82f6", // Bright royal blue shirt
      hairColor: "#334155", // Dark slate hair
      level: 1,
      dialogue: { greeting: "", options: [] },
    };
    const playerGroup = createCharacterGroup(playerNpc);
    playerGroup.position.set(0, 1.5, 0);
    scene.add(playerGroup);
    playerGroupRef.current = playerGroup;

    // Hover Highlight Wireframe Box
    const hoverGeom = new THREE.BoxGeometry(1.03, 1.03, 1.03);
    const hoverMat = new THREE.MeshBasicMaterial({
      color: 0xfacc15,
      wireframe: true,
      transparent: true,
      opacity: 0.85,
    });
    const hoverBox = new THREE.Mesh(hoverGeom, hoverMat);
    hoverBox.visible = false;
    scene.add(hoverBox);
    hoverBoxRef.current = hoverBox;

    // Initial meshes
    updateWorldMeshes();

    // Resize observer
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      const newAspect = newWidth / newHeight;
      camera.left = (frustumSize * newAspect) / -2;
      camera.right = (frustumSize * newAspect) / 2;
      camera.top = frustumSize / 2;
      camera.bottom = frustumSize / -2;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      // Clamp delta so a long background pause / tab switch doesn't cause a huge jump
      const delta = Math.min(clockRef.current.getDelta(), 0.05);
      const time = clockRef.current.getElapsedTime();

      // Smoothly interpolate scene lighting, background, and sun angle towards current time of day target
      const cfg = lightConfigRef.current;
      if (ambientLightRef.current) {
        ambientLightRef.current.color.lerp(cfg.ambientColor, 0.05);
        ambientLightRef.current.intensity +=
          (cfg.ambientIntensity - ambientLightRef.current.intensity) * 0.05;
      }
      if (sunLightRef.current && cameraTargetRef.current) {
        sunLightRef.current.color.lerp(cfg.sunColor, 0.05);
        sunLightRef.current.intensity +=
          (cfg.sunIntensity - sunLightRef.current.intensity) * 0.05;

        // Position directional light relative to clamped camera target
        const targetSunPos = cameraTargetRef.current.clone().add(cfg.sunOffset);
        sunLightRef.current.position.lerp(targetSunPos, 0.05);
        sunLightRef.current.target.position.copy(cameraTargetRef.current);
        sunLightRef.current.target.updateMatrixWorld();
      }
      if (
        sceneRef.current &&
        sceneRef.current.background instanceof THREE.Color
      ) {
        sceneRef.current.background.lerp(cfg.bgColor, 0.05);
      }

      fullscreenBackdrop.position.x = cameraTargetRef.current.x;
      fullscreenBackdrop.position.z = cameraTargetRef.current.z;

      // Handle WASD / Arrow Key Player Movement
      if (playerGroupRef.current && camera) {
        const keys = keysPressedRef.current;
        let moveX = 0;
        let moveZ = 0;

        // Screen-oriented isometric movement
        // In default isometric view (camera looking from +X, +Z):
        // W / ArrowUp -> moves North-West on grid (-X, -Z)
        // S / ArrowDown -> moves South-East on grid (+X, +Z)
        // A / ArrowLeft -> moves South-West on grid (-X, +Z)
        // D / ArrowRight -> moves North-East on grid (+X, -Z)
        if (keys.has("w") || keys.has("arrowup")) {
          moveX -= 1;
          moveZ -= 1;
        }
        if (keys.has("s") || keys.has("arrowdown")) {
          moveX += 1;
          moveZ += 1;
        }
        if (keys.has("a") || keys.has("arrowleft")) {
          moveX -= 1;
          moveZ += 1;
        }
        if (keys.has("d") || keys.has("arrowright")) {
          moveX += 1;
          moveZ -= 1;
        }

        const isMoving = moveX !== 0 || moveZ !== 0;
        const speed = 40.0; // Fast traversal while staying frame-rate independent

        if (isMoving) {
          const length = Math.sqrt(moveX * moveX + moveZ * moveZ);
          const normX = moveX / length;
          const normZ = moveZ / length;

          const canWalkTo = (targetX: number, targetZ: number) => {
            const blocks = worldRef.current.blocks;
            const r = 0.25; // Collision check radius around player center
            const corners = [
              [targetX - r, targetZ - r],
              [targetX + r, targetZ - r],
              [targetX - r, targetZ + r],
              [targetX + r, targetZ + r],
            ];
            for (const [cx, cz] of corners) {
              const gx = Math.round(cx);
              const gz = Math.round(cz);
              const bY0 = blocks.get(`${gx},0,${gz}`);
              const bY1 = blocks.get(`${gx},1,${gz}`);
              const bY2 = blocks.get(`${gx},2,${gz}`);

              // Cannot walk into water or off the map!
              if (bY1 === "WATER" || bY0 === "WATER") return false;

              // Cannot walk through solid obstacles at y=1 or y=2!
              if (bY1 && SOLID_OBSTACLES.has(bY1)) return false;
              if (bY2 && SOLID_OBSTACLES.has(bY2)) return false;

              // Must have ground underneath to stand on (at y=0 or y=1)
              const hasGround = bY0 || bY1;
              if (!hasGround) return false;
            }
            return true;
          };

          const curX = playerGroupRef.current.position.x;
          const curZ = playerGroupRef.current.position.z;
          const nextX = curX + normX * speed * delta;
          const nextZ = curZ + normZ * speed * delta;

          // Check X axis independently for smooth wall/coastline sliding
          if (canWalkTo(nextX, curZ)) {
            playerGroupRef.current.position.x = nextX;
          }

          // Check Z axis independently for smooth wall/coastline sliding
          if (canWalkTo(playerGroupRef.current.position.x, nextZ)) {
            playerGroupRef.current.position.z = nextZ;
          }

          // Check real-time discovery of 4 Wilderness Camps (for Pioneer Explorer Quest)
          const curPx = playerGroupRef.current.position.x;
          const curPz = playerGroupRef.current.position.z;
          const landmarks = [
            { id: "village_pond", name: "Village Lily Pond", x: -18, z: 18 },
            { id: "fishing_lake", name: "Fishing Lake 🎣", x: -130, z: 120 },
            { id: "cow_farm", name: "Pastoral Cow Farm 🐄", x: 120, z: 120 },
            { id: "carnival_fair", name: "Carnival Fairground 🎪", x: 140, z: -120 },
            { id: "mine_entrance", name: "Cavern Mine Entrance ⛏️", x: -150, z: -150 },
            { id: "village_bakery", name: "Village Bakery 🍞", x: 160, z: 140 },
            { id: "horse_stable", name: "Horse Stables 🐎", x: 100, z: -100 },
            { id: "blacksmith_forge", name: "Blacksmith Forge ⚒️", x: -100, z: -100 },
            { id: "crystal_tower", name: "Wizard Crystal Tower 🧙", x: 200, z: 200 },
            { id: "wolf_den", name: "Wolf Den Clearing 🐺", x: 220, z: -210 },
            { id: "bear_cave", name: "Bear Cave Sanctuary 🐻", x: -220, z: -220 },
          ];

          landmarks.forEach((loc) => {
            const dist = Math.sqrt((curPx - loc.x) ** 2 + (curPz - loc.z) ** 2);
            if (dist <= 8 && !visitedLandmarksRef.current.has(loc.id)) {
              visitedLandmarksRef.current.add(loc.id);
              setLocationToast(
                `🗺️ Discovered ${loc.name}! (Pioneer Explorer Progress +1)`,
              );
              if (onDiscoverLocationRef.current) {
                onDiscoverLocationRef.current(loc.name, loc.id);
              }
              setTimeout(() => setLocationToast(null), 3500);
            }
          });

          // Rotate character model to face direction of movement
          playerGroupRef.current.rotation.y = Math.atan2(normX, normZ);

          // Animate arms & legs swinging like Minecraft
          const leftLeg = playerGroupRef.current.getObjectByName("leftLeg");
          const rightLeg = playerGroupRef.current.getObjectByName("rightLeg");
          const leftArm = playerGroupRef.current.getObjectByName("leftArm");
          const rightArm = playerGroupRef.current.getObjectByName("rightArm");
          if (leftLeg && rightLeg) {
            leftLeg.rotation.x = Math.sin(time * 14) * 0.65;
            rightLeg.rotation.x = -Math.sin(time * 14) * 0.65;
          }
          if (leftArm && rightArm) {
            leftArm.rotation.x = -Math.sin(time * 14) * 0.65;
            rightArm.rotation.x = Math.sin(time * 14) * 0.65;
          }
        } else {
          // Reset legs & arms when standing still
          const leftLeg = playerGroupRef.current.getObjectByName("leftLeg");
          const rightLeg = playerGroupRef.current.getObjectByName("rightLeg");
          const leftArm = playerGroupRef.current.getObjectByName("leftArm");
          const rightArm = playerGroupRef.current.getObjectByName("rightArm");
          if (leftLeg && rightLeg) {
            leftLeg.rotation.x = 0;
            rightLeg.rotation.x = 0;
          }
          if (leftArm && rightArm) {
            leftArm.rotation.x = 0;
            rightArm.rotation.x = 0;
          }

          // Subtle idle breathing
          const head = playerGroupRef.current.children[0];
          if (head) head.position.y = 1.5 + Math.sin(time * 4) * 0.03;
        }

        // Smoothly update camera target to follow player (clamped to [-220, 220] to cover the vast continent till water)
        const targetX = Math.max(
          -320,
          Math.min(320, playerGroupRef.current.position.x),
        );
        const targetZ = Math.max(
          -320,
          Math.min(320, playerGroupRef.current.position.z),
        );
        const followLerp = 1 - Math.exp(-16 * delta);
        cameraTargetRef.current.x +=
          (targetX - cameraTargetRef.current.x) * followLerp;
        cameraTargetRef.current.z +=
          (targetZ - cameraTargetRef.current.z) * followLerp;

        // Update camera position based on new target
        const yaw = (cameraAngle * Math.PI) / 2 + Math.PI / 4;
        const pitch = Math.atan(1 / Math.sqrt(2));
        camera.position.set(
          cameraTargetRef.current.x + dist * Math.cos(pitch) * Math.sin(yaw),
          1.5 + dist * Math.sin(pitch),
          cameraTargetRef.current.z + dist * Math.cos(pitch) * Math.cos(yaw),
        );
        camera.lookAt(cameraTargetRef.current);
      }

      // --- FIGHTING MODE ZOMBIE HORDE SYSTEM ---
      if (
        gameModeRef.current === "fighting" &&
        !isGameOverRef.current &&
        playerGroupRef.current &&
        sceneRef.current &&
        camera
      ) {
        const playerPos = playerGroupRef.current.position;

        if (healthRegenCooldownRef.current > 0) {
          healthRegenCooldownRef.current = Math.max(
            0,
            healthRegenCooldownRef.current - delta,
          );
        } else if (playerHpRef.current < maxPlayerHp) {
          playerHpRef.current = Math.min(maxPlayerHp, playerHpRef.current + 10);
          setPlayerHp(playerHpRef.current);
          healthRegenCooldownRef.current = 3;
        }

        // Show silver 3D knife in player right hand in Fighting Mode!
        const playerKnife =
          playerGroupRef.current.getObjectByName("playerKnife");
        if (playerKnife) playerKnife.visible = true;

        const keys = keysPressedRef.current;
        const isMoving =
          keys.has("w") ||
          keys.has("arrowup") ||
          keys.has("s") ||
          keys.has("arrowdown") ||
          keys.has("a") ||
          keys.has("arrowleft") ||
          keys.has("d") ||
          keys.has("arrowright");

        if (isMoving) {
          movementIntensityRef.current = Math.min(
            8,
            movementIntensityRef.current + delta * 2.5,
          );
        } else {
          movementIntensityRef.current = Math.max(
            0,
            movementIntensityRef.current - delta * 1.2,
          );
        }

        runTimeRef.current += delta;
        const difficultyScale =
          1 +
          Math.min(2.5, runTimeRef.current / 45) +
          movementIntensityRef.current * 0.12;
        const maxActive = Math.min(
          20,
          6 +
            Math.floor(runTimeRef.current / 20) +
            Math.floor(movementIntensityRef.current),
        );
        const spawnInterval = Math.max(0.45, 2.5 / difficultyScale);

        // 1. Spawning varied monsters over time (Wolves, Bears, Goblins, Zombies, Elites!)
        zombieSpawnTimerRef.current += delta;
        if (
          activeZombiesRef.current.size < maxActive ||
          (zombieSpawnTimerRef.current > spawnInterval &&
            activeZombiesRef.current.size < maxActive)
        ) {
          zombieSpawnTimerRef.current = 0;
          const idStr = `m-${nextZombieIdRef.current++}`;
          const angle = Math.random() * Math.PI * 2;
          const spawnDist = 20 + Math.random() * 15; // 20 to 35 blocks away
          const sx = playerPos.x + Math.cos(angle) * spawnDist;
          const sz = playerPos.z + Math.sin(angle) * spawnDist;

          const roll = Math.random();
          let mType: MonsterType = "zombie";
          let mName = "Zombie Walker 🧟";
          let mHp = 100;
          let mSpeed = 1.4;
          let mDamage = 12;
          let mGold = 35;
          let isElite = false;

          if (roll < 0.28) {
            mType = "wolf";
            mName = "Dire Wolf 🐺";
            mHp = 55;
            mSpeed = 2.1;
            mDamage = 8;
            mGold = 20;
          } else if (roll < 0.55) {
            mType = "goblin";
            mName = "Goblin Raider 👺";
            mHp = 75;
            mSpeed = 1.8;
            mDamage = 10;
            mGold = 30;
          } else if (roll < 0.78) {
            mType = "zombie";
            mName = "Zombie Walker 🧟";
            mHp = 100;
            mSpeed = 1.4;
            mDamage = 12;
            mGold = 35;
          } else if (roll < 0.92) {
            mType = "bear";
            mName = "Grizzly Bear 🐻";
            mHp = 180;
            mSpeed = 1.1;
            mDamage = 20;
            mGold = 70;
          } else {
            mType = "elite";
            mName = "Elite Boss Warlord 👑";
            mHp = 320;
            mSpeed = 1.3;
            mDamage = 25;
            mGold = 150;
            isElite = true;
          }

          const mGroup = createMonsterGroup(idStr, mType);
          mGroup.position.set(sx, 1.5, sz);
          sceneRef.current.add(mGroup);

          activeZombiesRef.current.set(idStr, {
            id: idStr,
            type: mType,
            name: mName,
            group: mGroup,
            x: sx,
            z: sz,
            hp: mHp,
            maxHp: mHp,
            speed: mSpeed,
            damage: mDamage,
            goldReward: mGold,
            attackCooldown: 0,
            hitTimer: 0,
            isElite,
          });
        }

        // 2. Updating each active monster (Movement, Attack, Floating 3D HP Bar Billboard)
        let playerTookDamage = false;
        activeZombiesRef.current.forEach((m) => {
          // Billboard floating HP bar to face camera
          const hpGroup = m.group.getObjectByName("hpBarGroup");
          if (hpGroup && camera) {
            hpGroup.quaternion.copy(camera.quaternion);
          }

          // Hit timer flashing
          if (m.hitTimer > 0) {
            m.hitTimer -= delta;
            const head = m.group.getObjectByName("head") as THREE.Mesh;
            const body = m.group.getObjectByName("body") as THREE.Mesh;
            if (head && body) {
              const headMat = head.material as THREE.MeshLambertMaterial;
              const bodyMat = body.material as THREE.MeshLambertMaterial;
              if (m.hitTimer > 0) {
                headMat.color.setHex(0xffffff);
                bodyMat.color.setHex(0xef4444);
              }
            }
          }

          // Movement towards player
          const dx = playerPos.x - m.x;
          const dz = playerPos.z - m.z;
          const distToPlayer = Math.sqrt(dx * dx + dz * dz);

          if (m.attackCooldown > 0) {
            m.attackCooldown -= delta;
          }

          if (distToPlayer > 1.4) {
            const normX = dx / distToPlayer;
            const normZ = dz / distToPlayer;
            m.x += normX * m.speed * delta;
            m.z += normZ * m.speed * delta;
            m.group.position.set(m.x, 1.5, m.z);
            m.group.rotation.y = Math.atan2(normX, normZ);

            // Animate legs swinging
            const leftLeg = m.group.getObjectByName("leftLeg");
            const rightLeg = m.group.getObjectByName("rightLeg");
            if (leftLeg && rightLeg) {
              leftLeg.rotation.x = Math.sin(time * 12) * 0.7;
              rightLeg.rotation.x = -Math.sin(time * 12) * 0.7;
            }
          } else {
            // Melee Attack Player!
            if (m.attackCooldown <= 0) {
              m.attackCooldown = 1.2;
              playerTookDamage = true;
              playerHpRef.current = Math.max(0, playerHpRef.current - m.damage);
              setPlayerHp(playerHpRef.current);
              healthRegenCooldownRef.current = 3;

              // Check if player died
              if (playerHpRef.current <= 0) {
                setIsGameOver(true);
                setIsSlicing(false);
                setIsPlayerHit(true);
                activeZombiesRef.current.forEach((monster) => {
                  sceneRef.current?.remove(monster.group);
                });
                activeZombiesRef.current.clear();
                setZombiesList([]);
              }
            }
          }
        });

        if (playerTookDamage) {
          setIsPlayerHit(true);
          setTimeout(() => setIsPlayerHit(false), 250);
        }

        // 3. Periodic UI state update (~6 Hz)
        if (time - lastUiUpdateRef.current > 0.15) {
          lastUiUpdateRef.current = time;
          const list: { id: string; hp: number; maxHp: number }[] = [];
          activeZombiesRef.current.forEach((z) => {
            list.push({
              id: z.id,
              hp: Math.max(0, Math.round(z.hp)),
              maxHp: z.maxHp,
            });
          });
          setZombiesList(list);
        }
      } else if (gameModeRef.current === "survival") {
        // Hide knife in survival mode
        if (playerGroupRef.current) {
          const playerKnife =
            playerGroupRef.current.getObjectByName("playerKnife");
          if (playerKnife) playerKnife.visible = false;
        }

        // Clean up any active zombies when in survival mode
        if (activeZombiesRef.current.size > 0) {
          activeZombiesRef.current.forEach((z) => {
            sceneRef.current?.remove(z.group);
          });
          activeZombiesRef.current.clear();
          setZombiesList([]);
          playerHpRef.current = 100;
          setPlayerHp(100);
        }
      }

      // --- REAL-TIME BOTTOM-LEFT CONTEXT ACTION GUIDE ---
      if (playerGroupRef.current && time - lastUiUpdateRef.current > 0.15) {
        const px = Math.round(playerGroupRef.current.position.x);
        const pz = Math.round(playerGroupRef.current.position.z);

        let foundAction = false;

        // 1. Check for nearby NPCs (within 3.5 blocks distance)
        let nearbyNpc: NPC | null = null;
        if (playerGroupRef.current) {
          const pX = playerGroupRef.current.position.x;
          const pZ = playerGroupRef.current.position.z;
          for (const npc of npcsRef.current) {
            const dist = Math.sqrt((pX - npc.x) ** 2 + (pZ - npc.z) ** 2);
            if (dist <= 3.5) {
              nearbyNpc = npc;
              break;
            }
          }
        }

        if (nearbyNpc) {
          setContextGuide({
            action: `TALK TO ${nearbyNpc.name.toUpperCase()}`,
            description: `Near NPC -> Click floating tag or press [E] key to talk`,
            icon: "💬",
            keyHint: "[E] or Click",
          });
          foundAction = true;
        }

        if (gameModeRef.current === "fighting") {
          setContextGuide({
            action: "SLICE MONSTER",
            description:
              "Attacking horde nearby! Press [P] or click Slice button to swing knife",
            icon: "⚔️",
            keyHint: "Press [P]",
          });
          foundAction = true;
        } else if (!foundAction) {
          // Check adjacent blocks around player position within 2.5 blocks radius
          for (let dx = -2; dx <= 2 && !foundAction; dx++) {
            for (let dz = -2; dz <= 2 && !foundAction; dz++) {
              const bY1 = world.blocks.get(`${px + dx},1,${pz + dz}`);
              const bY2 = world.blocks.get(`${px + dx},2,${pz + dz}`);
              const targetBlock = bY2 || bY1;

              if (targetBlock === "WOOD_LOG" || targetBlock === "LEAVES") {
                setContextGuide({
                  action: "CHOP TREE",
                  description:
                    "Near Tree -> Left-Click block to chop timber logs with Woodcutter Axe",
                  icon: "🪓",
                  keyHint: "Left-Click",
                });
                foundAction = true;
              } else if (
                targetBlock === "STONE" ||
                targetBlock === "COBBLESTONE" ||
                targetBlock === "COAL_ORE" ||
                targetBlock === "IRON_ORE" ||
                targetBlock === "GOLD_ORE" ||
                targetBlock === "CRYSTAL_ORE"
              ) {
                setContextGuide({
                  action: "MINE ORE & STONE",
                  description:
                    "Near Ore/Stone -> Left-Click block to mine with Iron Pickaxe",
                  icon: "⛏️",
                  keyHint: "Left-Click",
                });
                foundAction = true;
              } else if (
                targetBlock === "HERB" ||
                targetBlock === "BERRY_BUSH" ||
                targetBlock === "MUSHROOM" ||
                targetBlock === "CROPS" ||
                targetBlock === "FLOWER"
              ) {
                setContextGuide({
                  action: "GATHER FLORA",
                  description:
                    "Near Herbs/Berries -> Left-Click to pick into inventory",
                  icon: "🌿",
                  keyHint: "Left-Click",
                });
                foundAction = true;
              } else if (targetBlock === "TREASURE_CHEST") {
                setContextGuide({
                  action: "DIG TREASURE CHEST",
                  description:
                    "Near Treasure -> Left-Click with Garden Shovel to unearth gold chest",
                  icon: "🪙",
                  keyHint: "Left-Click",
                });
                foundAction = true;
              } else if (targetBlock === "WATER") {
                setContextGuide({
                  action: "CATCH FRESH FISH",
                  description:
                    "Near Water -> Left-Click ocean edge to cast Fishing Rod",
                  icon: "🎣",
                  keyHint: "Left-Click",
                });
                foundAction = true;
              }
            }
          }
        }

        if (!foundAction) {
          setContextGuide({
            action: "WALK & EXPLORE",
            description:
              "Use WASD keys to walk around houses, mines, and forests",
            icon: "🚶",
            keyHint: "WASD",
          });
        }
      }

      // Raycasting for Hover Highlight
      if (mouseRef.current.x !== -999 && camera && scene) {
        raycasterRef.current.setFromCamera(mouseRef.current, camera);
        const meshes: THREE.Object3D[] = [];
        instancedMeshesRef.current.forEach((m) => meshes.push(m));

        const intersects = raycasterRef.current.intersectObjects(meshes);
        if (intersects.length > 0) {
          const hit = intersects[0];
          if (
            hit.instanceId !== undefined &&
            hit.object instanceof THREE.InstancedMesh
          ) {
            const matrix = new THREE.Matrix4();
            hit.object.getMatrixAt(hit.instanceId, matrix);
            const pos = new THREE.Vector3();
            pos.setFromMatrixPosition(matrix);

            if (hoverBoxRef.current) {
              hoverBoxRef.current.position.copy(pos);
              hoverBoxRef.current.visible = true;
            }

            // Find block type name
            let hitType: BlockType = "GRASS";
            instancedMeshesRef.current.forEach((mesh, type) => {
              if (mesh === hit.object) hitType = type;
            });
            const hoverKey = `${Math.round(pos.x)},${Math.round(pos.y)},${Math.round(pos.z)},${hitType}`;
            if (hoveredBlockKeyRef.current !== hoverKey) {
              hoveredBlockKeyRef.current = hoverKey;
              setHoveredBlockInfo({
                x: Math.round(pos.x),
                y: Math.round(pos.y),
                z: Math.round(pos.z),
                name: BLOCK_DEFINITIONS[hitType]?.name || hitType,
              });
            }
          }
        } else {
          if (hoverBoxRef.current) hoverBoxRef.current.visible = false;
          if (hoveredBlockKeyRef.current !== null) {
            hoveredBlockKeyRef.current = null;
            setHoveredBlockInfo(null);
          }
        }
      }

      // Animate NPCs (idle breathing or subtle turning)
      npcGroupsRef.current.forEach((group, id) => {
        const baseNpc = npcsRef.current.find((n) => n.id === id);
        if (baseNpc) {
          group.position.y =
            baseNpc.y + Math.sin(time * 3 + id.charCodeAt(0)) * 0.08;
        }
      });

      // Project NPC 3D positions to 2D Screen coordinates for floating name tags (~10 Hz update to save React re-renders)
      if (
        gameModeRef.current === "survival" &&
        time - lastNpcTagUpdateRef.current > 0.1
      ) {
        lastNpcTagUpdateRef.current = time;
        if (camera && container) {
          const width = container.clientWidth;
          const height = container.clientHeight;
          const tags: {
            id: string;
            label: string;
            icon: string;
            x: number;
            y: number;
            npc: NPC;
          }[] = [];

          const NOTABLE_OUTDOOR_LABELS = new Set<BlockType>([
            "WOOD_LOG",
            "STONE",
            "COAL_ORE",
            "IRON_ORE",
            "GOLD_ORE",
            "CRYSTAL_ORE",
            "HERB",
            "BERRY_BUSH",
            "MUSHROOM",
            "TREASURE_CHEST",
            "CROPS",
            "FLOWER",
            "LAMP",
            "TABLE_WOOD",
            "BENCH",
            "LOG_SEAT",
            "BBQ_GRILL",
            "CIRCUS_TENT",
            "FERRIS_WHEEL",
            "MERRY_GO_ROUND",
            "ICE_CREAM_CART",
            "BALLOON_STAND",
            "WATERFALL",
            "BEEHIVE",
            "COW",
            "CHICKEN",
            "SHEEP",
            "HORSE",
            "GOAT",
            "RABBIT",
            "DEER",
            "DUCK",
            "DOG",
            "CAT",
          ]);

          npcsRef.current.forEach((npc) => {
            // Check if NPC is indoors under roof
            const isIndoors =
              world.blocks.has(`${Math.round(npc.x)},4,${Math.round(npc.z)}`) ||
              world.blocks.has(`${Math.round(npc.x)},5,${Math.round(npc.z)}`);
            if (isIndoors) return;

            const vec = new THREE.Vector3(npc.x, npc.y + 2.5, npc.z); // above head
            vec.project(camera);
            if (vec.z < 1) {
              const screenX = ((vec.x + 1) * width) / 2;
              const screenY = ((-vec.y + 1) * height) / 2;
              if (
                screenX >= -80 &&
                screenX <= width + 80 &&
                screenY >= -80 &&
                screenY <= height + 80
              ) {
                let icon = "💬";
                let label = npc.name;
                if (npc.id === "npc-farmer") { icon = "👨‍🌾"; label = "Cow Farm & Wheat"; }
                else if (npc.id === "npc-finn") { icon = "🎣"; label = "Fishing Lake"; }
                else if (npc.id === "npc-chef") { icon = "👩‍🍳"; label = "Restaurant & Bakery"; }
                else if (npc.id === "npc-cole") { icon = "⚒️"; label = "Blacksmith Forge"; }
                else if (npc.id === "npc-wizard") { icon = "🧙"; label = "Crystal Cavern"; }
                else if (npc.id === "npc-elder") { icon = "🧓"; label = "Town Square"; }
                else if (npc.id === "npc-guard") { icon = "👮"; label = "Patrol Guard"; }
                else if (npc.id === "npc-merchant") { icon = "🛒"; label = "General Store & Fair"; }
                else if (npc.id === "npc-ruby") { icon = "💎"; label = "Jeweller Shop"; }
                else if (npc.id === "npc-stable") { icon = "🐎"; label = "Horse Stable"; }
                else if (npc.id === "npc-explorer") { icon = "⛏️"; label = "Mine Entrance"; }
                else if (npc.id === "npc-delivery") { icon = "📦"; label = "Post Office & Bank"; }
                else if (npc.statusBubble) { label = npc.statusBubble; }

                tags.push({
                  id: npc.id,
                  label,
                  icon,
                  x: screenX,
                  y: screenY,
                  npc,
                });
              }
            }
          });
          setNpcTags(tags);

          // Fast outdoor notable object labels projection (radius 16, step 3)
          if (playerGroupRef.current) {
            const px = Math.round(playerGroupRef.current.position.x);
            const pz = Math.round(playerGroupRef.current.position.z);

            const newObjectTags: {
              id: string;
              name: string;
              icon: string;
              x: number;
              y: number;
            }[] = [];

            const radius = 22;
            const maxObjectTags = 45;

            for (let dx = -radius; dx <= radius; dx += 3) {
              for (let dz = -radius; dz <= radius; dz += 3) {
                const worldX = px + dx;
                const worldZ = pz + dz;

                // Indoor check: skip objects inside building structures
                const hasRoof =
                  world.blocks.has(`${worldX},4,${worldZ}`) ||
                  world.blocks.has(`${worldX},5,${worldZ}`);
                if (hasRoof) continue;

                for (let worldY = 1; worldY <= 3; worldY += 1) {
                  const blockType = world.blocks.get(
                    `${worldX},${worldY},${worldZ}`,
                  );
                  if (!blockType || !NOTABLE_OUTDOOR_LABELS.has(blockType)) continue;

                  const blockDef = BLOCK_DEFINITIONS[blockType as BlockType];
                  if (!blockDef) continue;

                  const vec = new THREE.Vector3(worldX, worldY + 0.9, worldZ);
                  vec.project(camera);
                  if (vec.z < 1) {
                    const screenX = ((vec.x + 1) * width) / 2;
                    const screenY = ((-vec.y + 1) * height) / 2;
                    if (
                      screenX >= 20 &&
                      screenX <= width - 20 &&
                      screenY >= 20 &&
                      screenY <= height - 20
                    ) {
                      newObjectTags.push({
                        id: `${worldX},${worldY},${worldZ}`,
                        name: blockDef.name,
                        icon: blockDef.icon,
                        x: screenX,
                        y: screenY,
                      });
                    }
                  }

                  if (newObjectTags.length >= maxObjectTags) break;
                }

                if (newObjectTags.length >= maxObjectTags) break;
              }
              if (newObjectTags.length >= maxObjectTags) break;
            }

            setObjectTags(newObjectTags);
          }
        }
      }

      renderer.render(scene, camera);
    };
    animate();
    requestAnimationFrame(() => {
      onReady?.();
    });

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
      backdropGeometry.dispose();
      backdropMaterial.dispose();
      renderer.dispose();
    };
  }, []);

  // Spawn & update 3D NPCs in the scene
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;

    // Clear old npc groups
    npcGroupsRef.current.forEach((group) => {
      scene.remove(group);
    });
    npcGroupsRef.current.clear();

    // Add new npc groups
    npcs.forEach((npc) => {
      const group = createCharacterGroup(npc);
      group.position.set(npc.x, npc.y, npc.z);
      group.rotation.y = npc.rotation || 0;
      scene.add(group);
      npcGroupsRef.current.set(npc.id, group);
    });
  }, [npcs]);

  // Re-run world meshes when world changes
  useEffect(() => {
    updateWorldMeshes();
  }, [world, updateWorldMeshes]);

  // Mouse / Touch Event Handlers
  const updateActiveObjectTag = (clientX: number, clientY: number) => {
    if (!containerRef.current) {
      setActiveObjectTag(null);
      return;
    }

    const rect = containerRef.current.getBoundingClientRect();
    const pointerX = clientX - rect.left;
    const pointerY = clientY - rect.top;

    const nearbyTag = objectTags.find((tag) => {
      const dx = tag.x - pointerX;
      const dy = tag.y - pointerY;
      return Math.sqrt(dx * dx + dy * dy) <= 72;
    });

    setActiveObjectTag(nearbyTag ?? null);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    updateActiveObjectTag(e.clientX, e.clientY);

    if (isDraggingRef.current && cameraRef.current) {
      const dx = (e.clientX - dragStartRef.current.x) * 0.05;
      const dy = (e.clientY - dragStartRef.current.y) * 0.05;

      const yaw = (cameraAngle * Math.PI) / 2 + Math.PI / 4;
      // Pan perpendicular to camera yaw
      const forwardX = -Math.cos(yaw);
      const forwardZ = Math.sin(yaw);
      const rightX = -Math.sin(yaw);
      const rightZ = -Math.cos(yaw);

      cameraTargetRef.current.x -= rightX * dx - forwardX * dy * 0.5;
      cameraTargetRef.current.z -= rightZ * dx - forwardZ * dy * 0.5;
      cameraTargetRef.current.x = Math.max(
        -320,
        Math.min(320, cameraTargetRef.current.x),
      );
      cameraTargetRef.current.z = Math.max(
        -320,
        Math.min(320, cameraTargetRef.current.z),
      );

      dragStartRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button === 2 || e.shiftKey || e.ctrlKey) {
      // Right click or shift/ctrl for camera panning
      isDraggingRef.current = true;
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    updateActiveObjectTag(e.clientX, e.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 0) return;
    const touch = e.touches[0];
    updateActiveObjectTag(touch.clientX, touch.clientY);
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      return;
    }

    if (!cameraRef.current || !sceneRef.current) return;

    // Check Voxel Block clicks
    const meshes: THREE.Object3D[] = [];
    instancedMeshesRef.current.forEach((m) => meshes.push(m));
    const intersects = raycasterRef.current.intersectObjects(meshes);

    if (intersects.length > 0) {
      const hit = intersects[0];
      if (
        hit.instanceId !== undefined &&
        hit.object instanceof THREE.InstancedMesh
      ) {
        const matrix = new THREE.Matrix4();
        hit.object.getMatrixAt(hit.instanceId, matrix);
        const pos = new THREE.Vector3();
        pos.setFromMatrixPosition(matrix);
        const x = Math.round(pos.x);
        const y = Math.round(pos.y);
        const z = Math.round(pos.z);

        // Find block type
        let hitType: BlockType = "GRASS";
        instancedMeshesRef.current.forEach((mesh, type) => {
          if (mesh === hit.object) hitType = type;
        });

        const coord: WorldCoord = { x, y, z };

        if (
          activeMode === "mine" ||
          (selectedItem?.type === "tool" &&
            selectedItem.toolType !== "BUILD_WAND")
        ) {
          onBlockMine(coord, hitType);
        } else if (
          activeMode === "build" ||
          (selectedItem?.type === "block" && selectedItem.blockType)
        ) {
          if (hit.face) {
            const normal = hit.face.normal;
            const newCoord: WorldCoord = {
              x: x + Math.round(normal.x),
              y: y + Math.round(normal.y),
              z: z + Math.round(normal.z),
            };
            onBlockPlace(newCoord, selectedItem.blockType);
          }
        }
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full select-none overflow-hidden cursor-crosshair bg-slate-950"
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onContextMenu={(e) => e.preventDefault()}
      onWheel={(e) => {
        if (onZoomChange) {
          e.preventDefault();
          const delta = e.deltaY > 0 ? -0.15 : 0.15;
          onZoomChange((prev) =>
            Math.max(0.4, Math.min(6.0, Number((prev + delta).toFixed(2)))),
          );
        }
      }}
    >
      {/* Red screen flash when player takes damage */}
      {isPlayerHit && (
        <div className="absolute inset-0 pointer-events-none border-8 border-red-600/80 bg-red-600/20 z-50 animate-pulse transition-all duration-150" />
      )}

      {gameMode === "fighting" && isGameOver && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-slate-950/85 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 rounded-3xl border border-red-500/60 bg-slate-900/95 px-8 py-8 text-center shadow-2xl shadow-red-950/60">
            <div className="text-5xl font-black tracking-[0.3em] text-red-500">
              GAME OVER
            </div>
            <p className="max-w-xs text-sm font-semibold text-slate-300">
              The horde overwhelmed you. Try again and survive the next wave.
            </p>
            <button
              onClick={restartFight}
              className="rounded-2xl bg-red-600 px-6 py-3 font-black text-white shadow-lg shadow-red-600/30 transition-all hover:scale-105 hover:bg-red-500"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Top Center Character Livebar in Fighting Mode */}
      {gameMode === "fighting" && (
        <div className="absolute top-14 sm:top-4 left-1/2 transform -translate-x-1/2 z-30 flex items-center gap-3 sm:gap-4 bg-slate-900/95 backdrop-blur-md px-3 sm:px-6 py-2 sm:py-3 rounded-2xl border-2 border-red-500/80 shadow-2xl animate-fade-in max-w-[90vw]">
          <div className="flex items-center gap-2.5">
            <span
              className={`text-2xl ${playerHp <= 30 ? "animate-bounce text-red-500" : "animate-pulse"}`}
            >
              ❤️
            </span>
            <div>
              <div className="flex justify-between items-center text-xs font-black text-white tracking-wider mb-1">
                <span>PLAYER LIVEBAR</span>
                <span
                  className={
                    playerHp <= 30
                      ? "text-red-400 font-extrabold"
                      : "text-emerald-400"
                  }
                >
                  {playerHp} / {maxPlayerHp} HP
                </span>
              </div>
              <div className="w-36 sm:w-48 md:w-64 h-3.5 bg-slate-950 rounded-full overflow-hidden border border-slate-700 shadow-inner">
                <div
                  className={`h-full transition-all duration-200 ${
                    playerHp > 50
                      ? "bg-gradient-to-r from-emerald-600 to-emerald-400"
                      : playerHp > 25
                        ? "bg-gradient-to-r from-yellow-600 to-amber-400"
                        : "bg-gradient-to-r from-red-700 to-red-500"
                  }`}
                  style={{
                    width: `${Math.max(0, Math.min(100, (playerHp / maxPlayerHp) * 100))}%`,
                  }}
                />
              </div>
            </div>
          </div>
          <div className="h-8 w-px bg-slate-700" />
          <div className="flex flex-col items-center justify-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Slain
            </span>
            <span className="text-lg font-black text-amber-400 flex items-center gap-1">
              {zombiesSlain} <span>🧟</span>
            </span>
          </div>
        </div>
      )}

      {/* Location Discovery Toast Banner */}
      {locationToast && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-40 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 text-slate-950 px-6 py-2.5 rounded-full border-2 border-white shadow-2xl font-black text-sm flex items-center gap-2 animate-bounce">
          <span>{locationToast}</span>
        </div>
      )}

      {/* Bottom Center Interactive Slice Button in Fighting Mode */}
      {gameMode === "fighting" && (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-30 flex flex-col items-center gap-2 animate-fade-in">
          <button
            onClick={sliceZombies}
            className={`px-8 py-3.5 rounded-2xl font-black text-base transition-all flex items-center gap-3 border-2 shadow-2xl ${
              isSlicing
                ? "bg-amber-400 text-slate-950 border-white scale-95 shadow-amber-500/50"
                : "bg-gradient-to-r from-red-600 via-red-500 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white border-red-400 hover:scale-105 active:scale-95 shadow-red-600/40"
            }`}
          >
            <span className="text-2xl">⚔️</span>
            <div className="flex flex-col items-start">
              <span className="tracking-wider">SLICE ZOMBIES</span>
              <span className="text-[10px] font-bold text-amber-200/90 tracking-normal uppercase">
                Press [P] Key or Click Here
              </span>
            </div>
          </button>
        </div>
      )}

      {/* Interactive Clickable Floating NPC Tags */}
      {gameMode === "survival" &&
        npcTags.map((tag) => (
          <div
            key={tag.id}
            onClick={() => onNpcClick(tag.npc)}
            className="absolute z-30 pointer-events-auto cursor-pointer transform -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 px-3 py-1 rounded-full border-2 border-white shadow-2xl text-xs font-black tracking-wide animate-bounce hover:scale-110 active:scale-95 transition-all"
            style={{ left: tag.x, top: tag.y }}
          >
            <span className="text-sm">{tag.icon}</span>
            <span>{tag.label}</span>
            <span className="bg-slate-950 text-amber-300 text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase">Talk [E]</span>
          </div>
        ))}

      {/* Small Floating Labels on top of ALL 3D Objects, Buildings, Animals & Resources */}
      {gameMode === "survival" &&
        objectTags.map((tag) => (
          <div
            key={tag.id}
            className="absolute z-20 pointer-events-none transform -translate-x-1/2 -translate-y-1/2 flex items-center gap-1 bg-slate-950/85 backdrop-blur-md text-slate-100 px-2 py-0.5 rounded-full border border-amber-400/60 shadow-lg text-[10px] font-extrabold tracking-tight animate-fade-in"
            style={{ left: tag.x, top: tag.y }}
          >
            <span className="text-xs">{tag.icon}</span>
            <span className="text-amber-200">{tag.name}</span>
          </div>
        ))}

      {/* Bottom-Left Real-time Context Action Guide Widget — hidden on mobile (D-pad is there) */}
      <div className="absolute bottom-5 left-5 z-30 pointer-events-auto hidden sm:flex items-center gap-3 bg-slate-900/95 backdrop-blur-md p-3 rounded-2xl border-2 border-amber-500/80 shadow-2xl animate-fade-in max-w-xs sm:max-w-sm">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-2xl shadow-md border border-white shrink-0">
          {contextGuide.icon}
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-amber-300 tracking-wide uppercase">
              {contextGuide.action}
            </span>
            <span className="px-1.5 py-0.5 rounded-md bg-amber-500 text-slate-950 text-[10px] font-black uppercase font-mono shadow-sm">
              {contextGuide.keyHint}
            </span>
          </div>
          <span className="text-[11px] font-semibold text-slate-300 leading-snug mt-0.5">
            {contextGuide.description}
          </span>
        </div>
      </div>

      {/* Hovered Block Tooltip */}
      {hoveredBlockInfo && gameMode === "survival" && (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 pointer-events-none bg-slate-900/90 backdrop-blur-md text-amber-300 px-4 py-1.5 rounded-full border-2 border-amber-500/60 shadow-xl text-xs font-bold flex items-center gap-2 z-10 animate-fade-in">
          <span>🎯 Location: {hoveredBlockInfo.name}</span>
          <span className="text-slate-400 text-[10px]">
            ({hoveredBlockInfo.x}, {hoveredBlockInfo.y}, {hoveredBlockInfo.z})
          </span>
        </div>
      )}

      {/* Controls Hint in bottom right */}
      <div className="absolute bottom-4 right-4 pointer-events-none bg-slate-900/80 backdrop-blur-sm text-slate-300 px-3 py-2 rounded-xl border border-slate-700 text-[11px] font-medium space-y-1 shadow-lg z-10 hidden md:block">
        <div>
          🕹️ <strong className="text-amber-400">WASD or Arrow Keys:</strong>{" "}
          Move character across terrain
        </div>
        <div>
          🖱️ <strong className="text-amber-400">Left Click:</strong> Mine block
          / Place block
        </div>
        <div>
          🖱️ <strong className="text-amber-400">Right Click Drag:</strong> Pan
          camera view
        </div>
        <div>
          🔍 <strong className="text-amber-400">Mouse Wheel:</strong> Zoom In /
          Out
        </div>
      </div>

      {/* Mobile Virtual D-Pad */}
      {isTouchDevice && (
        <div
          className="absolute bottom-24 left-4 z-40 select-none"
          style={{ touchAction: "none" }}
        >
          {/* Up */}
          <div className="flex justify-center mb-1">
            <button
              onTouchStart={(e) => { e.preventDefault(); keysPressedRef.current.add("w"); }}
              onTouchEnd={(e) => { e.preventDefault(); keysPressedRef.current.delete("w"); }}
              onTouchCancel={() => keysPressedRef.current.delete("w")}
              className="w-13 h-13 w-12 h-12 rounded-xl bg-slate-800/90 border-2 border-slate-600 text-white text-lg font-black flex items-center justify-center active:bg-amber-500 active:border-amber-400 shadow-xl"
            >▲</button>
          </div>
          {/* Middle row */}
          <div className="flex gap-1 justify-center">
            <button
              onTouchStart={(e) => { e.preventDefault(); keysPressedRef.current.add("a"); }}
              onTouchEnd={(e) => { e.preventDefault(); keysPressedRef.current.delete("a"); }}
              onTouchCancel={() => keysPressedRef.current.delete("a")}
              className="w-12 h-12 rounded-xl bg-slate-800/90 border-2 border-slate-600 text-white text-lg font-black flex items-center justify-center active:bg-amber-500 active:border-amber-400 shadow-xl"
            >◀</button>
            <button
              onTouchStart={(e) => { e.preventDefault(); keysPressedRef.current.add("s"); }}
              onTouchEnd={(e) => { e.preventDefault(); keysPressedRef.current.delete("s"); }}
              onTouchCancel={() => keysPressedRef.current.delete("s")}
              className="w-12 h-12 rounded-xl bg-slate-800/90 border-2 border-slate-600 text-white text-lg font-black flex items-center justify-center active:bg-amber-500 active:border-amber-400 shadow-xl"
            >▼</button>
            <button
              onTouchStart={(e) => { e.preventDefault(); keysPressedRef.current.add("d"); }}
              onTouchEnd={(e) => { e.preventDefault(); keysPressedRef.current.delete("d"); }}
              onTouchCancel={() => keysPressedRef.current.delete("d")}
              className="w-12 h-12 rounded-xl bg-slate-800/90 border-2 border-slate-600 text-white text-lg font-black flex items-center justify-center active:bg-amber-500 active:border-amber-400 shadow-xl"
            >▶</button>
          </div>
        </div>
      )}

      {/* Mobile Talk Button (survival) */}
      {isTouchDevice && gameMode === "survival" && (
        <div
          className="absolute bottom-24 right-4 z-40"
          style={{ touchAction: "none" }}
        >
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              if (!playerGroupRef.current) return;
              const pX = playerGroupRef.current.position.x;
              const pZ = playerGroupRef.current.position.z;
              const nearbyNpc = npcsRef.current.find(
                (n) => Math.sqrt((pX - n.x) ** 2 + (pZ - n.z) ** 2) <= 4.5
              );
              if (nearbyNpc && onNpcClickRef.current) {
                onNpcClickRef.current(nearbyNpc);
              }
            }}
            className="w-14 h-14 rounded-2xl bg-amber-500/90 border-2 border-amber-300 text-slate-950 text-xs font-black flex flex-col items-center justify-center shadow-xl active:scale-95"
          >
            <span className="text-xl">💬</span>
            <span>TALK</span>
          </button>
        </div>
      )}
    </div>
  );
};
