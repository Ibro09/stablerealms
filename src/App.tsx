import React, { useEffect, useRef, useState } from "react";
import { Route, Routes } from "react-router-dom";
import { BlockType, InventoryItem, NPC, WorldCoord } from "./types/game";
import { INITIAL_INVENTORY, INITIAL_NPCS } from "./game/constants";
import { generateInitialWorld, WorldMap } from "./utils/worldGenerator";
import { VoxelCanvas } from "./components/game/VoxelCanvas";
import { SurvivalActivityModal } from "./components/ui/SurvivalActivityModal";
import { MMORPGHeader } from "./components/ui/MMORPGHeader";
import { MiniTasksWidget, MiniTask } from "./components/ui/MiniTasksWidget";
import Hero from "./components/Hero";
import { HowToPlayPage } from "./pages/HowToPlayPage";
import { WalletPage } from "./pages/WalletPage";
import { readJsonSafe } from "./utils/http";

const MINI_TASKS_POOL: Omit<MiniTask, "completed">[] = [
  {
    id: "location:village_pond",
    title: "Find the Lily Pond",
    description: "Walk to the quiet pond near the village.",
    icon: "🪷",
    rewardExp: 10,
  },
  {
    id: "location:fishing_lake",
    title: "Visit Fishing Lake",
    description: "Walk near the Fishing Lake shore.",
    icon: "🎣",
    rewardExp: 10,
  },
  {
    id: "location:cow_farm",
    title: "Visit the Cow Farm",
    description: "Walk into the Pastoral Cow Farm.",
    icon: "🐄",
    rewardExp: 10,
  },
  {
    id: "location:carnival_fair",
    title: "Explore the Carnival",
    description: "Walk over to the Carnival Fairground.",
    icon: "🎪",
    rewardExp: 10,
  },
  {
    id: "location:horse_stable",
    title: "Find the Stables",
    description: "Walk to the Horse Stables.",
    icon: "🐎",
    rewardExp: 10,
  },
  {
    id: "location:mine_entrance",
    title: "Find the Old Mine",
    description: "Walk to the Cavern Mine Entrance.",
    icon: "⛏️",
    rewardExp: 10,
  },
  {
    id: "npc:npc-elder",
    title: "Meet the Village Elder",
    description: "Talk to the Village Elder in town.",
    icon: "🧓",
    rewardExp: 10,
  },
  {
    id: "npc:npc-guard",
    title: "Talk to Guard Marcus",
    description: "Find Guard Marcus and say hello.",
    icon: "🛡️",
    rewardExp: 10,
  },
  {
    id: "npc:npc-finn",
    title: "Talk to Finn",
    description: "Chat with the Pond Keeper.",
    icon: "💬",
    rewardExp: 10,
  },
  {
    id: "npc:npc-merchant",
    title: "Visit the Merchant",
    description: "Talk to the Travelling Merchant.",
    icon: "🛒",
    rewardExp: 10,
  },
];

const pickMiniTasks = (
  count: number,
  excludedIds: string[] = [],
): MiniTask[] => {
  const choices = MINI_TASKS_POOL.filter(
    (task) => !excludedIds.includes(task.id),
  );
  const shuffled = [...choices].sort(() => Math.random() - 0.5);
  return shuffled
    .slice(0, count)
    .map((task) => ({ ...task, completed: false }));
};

const MIN_PLAY_WIDTH = 768;
const AUTH_TOKEN_KEY = "voxelverseAuthToken";
const WALLET_ADDRESS_KEY = "voxelverseWalletAddress";

function GamePage() {
  const [hasStarted, setHasStarted] = useState(false);
  const [isGameReady, setIsGameReady] = useState(false);
  const [isStartingGame, setIsStartingGame] = useState(false);
  const [canPlayOnThisScreen, setCanPlayOnThisScreen] = useState(
    () => window.innerWidth >= MIN_PLAY_WIDTH,
  );
  // Core Game State
  const [world, setWorld] = useState<WorldMap>(() => generateInitialWorld());
  const [inventory, setInventory] =
    useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [activeMode, setActiveMode] = useState<"mine" | "build" | "interact">(
    "mine",
  );
  const [timeOfDay, setTimeOfDay] = useState<"day" | "sunset" | "night">("day");
  const [gameMode, setGameMode] = useState<"survival" | "fighting">("survival");

  // Everyday Activities & Economy State
  const [gold, setGold] = useState<number>(200);
  const [stamina, setStamina] = useState<number>(100);
  const [playerHp, setPlayerHp] = useState<number>(100);
  const [playerExp, setPlayerExp] = useState<number>(120);
  const [playerLevel, setPlayerLevel] = useState<number>(1);
  const [houseOwned, setHouseOwned] = useState<boolean>(false);
  const [activeNpcModal, setActiveNpcModal] = useState<NPC | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(() =>
    localStorage.getItem(AUTH_TOKEN_KEY),
  );
  const [walletExpLoaded, setWalletExpLoaded] = useState(false);
  const expSyncTimerRef = useRef<number | null>(null);

  // Mini Tasks (+10 XP) State
  const [miniTasks, setMiniTasks] = useState<MiniTask[]>([...pickMiniTasks(3)]);
  const [miniTaskToast, setMiniTaskToast] = useState<string | null>(null);

  const completeMiniTask = (taskId: string) => {
    const task = miniTasks.find((t) => t.id === taskId);
    if (!task) return;

    // Grant XP
    setPlayerExp((prev) => prev + task.rewardExp);

    // Show celebratory toast banner
    setMiniTaskToast(
      `🎉 Mini Task Completed: ${task.title}! (+${task.rewardExp} XP)`,
    );
    setTimeout(() => setMiniTaskToast(null), 3500);

    // Replace completed task with a fresh random task from pool
    const otherTaskIds = miniTasks
      .filter((task) => task.id !== taskId)
      .map((task) => task.id);
    const [nextTaskTemplate] = pickMiniTasks(1, otherTaskIds);

    setMiniTasks((prev) =>
      prev.map((t) => (t.id === taskId ? nextTaskTemplate : t)),
    );
  };

  // Trigger helper for mini task completion requirement by type
  const checkMiniTaskTrigger = (targetType: string) => {
    setMiniTasks((prev) =>
      prev.map((t) =>
        t.id === targetType && !t.completed ? { ...t, completed: true } : t,
      ),
    );
  };

  // Default camera zoom & angle
  const [cameraZoom, setCameraZoom] = useState<number>(1.0);
  const [cameraAngle, setCameraAngle] = useState<number>(0);

  // Block Mining & Resource Gathering Handler
  const handleBlockMine = (coord: WorldCoord, type: BlockType) => {
    if (coord.y < 0) return;

    const key = `${coord.x},${coord.y},${coord.z}`;
    if (!world.blocks.has(key)) return;

    // Remove block from world
    const newBlocks = new Map(world.blocks);
    newBlocks.delete(key);
    setWorld({ ...world, blocks: newBlocks });

    // Resource Gathering Rewards & Inventory Additions
    let rewardGold = 0;
    let rewardExp = 5;
    let itemIcon = "🪨";
    let itemName = "Resource";

    if (
      [
        "STONE",
        "COBBLESTONE",
        "COAL_ORE",
        "IRON_ORE",
        "GOLD_ORE",
        "CRYSTAL_ORE",
      ].includes(type)
    ) {
      checkMiniTaskTrigger("mt-mine");
    }

    if (type === "WOOD_LOG") {
      itemName = "Oak Timber Log";
      itemIcon = "🪵";
      checkMiniTaskTrigger("mt-chop");
    } else if (type === "STONE" || type === "COBBLESTONE") {
      itemName = "Village Cobblestone";
      itemIcon = "🧱";
    } else if (type === "COAL_ORE") {
      itemName = "Black Coal Deposit";
      itemIcon = "⬛";
      rewardGold = 15;
    } else if (type === "IRON_ORE") {
      itemName = "Rich Iron Vein";
      itemIcon = "🪨";
      rewardGold = 25;
    } else if (type === "GOLD_ORE") {
      itemName = "Glittering Gold Ore";
      itemIcon = "✨";
      rewardGold = 50;
    } else if (type === "CRYSTAL_ORE") {
      itemName = "Glowing Mana Crystal";
      itemIcon = "💎";
      rewardGold = 75;
    } else if (type === "HERB") {
      itemName = "Healing Wild Herb";
      itemIcon = "🌿";
      rewardGold = 10;
    } else if (type === "BERRY_BUSH") {
      itemName = "Wild Berry Bush";
      itemIcon = "🍓";
      rewardGold = 12;
    } else if (type === "MUSHROOM") {
      itemName = "Red Cap Mushroom";
      itemIcon = "🍄";
      rewardGold = 15;
    } else if (type === "TREASURE_CHEST") {
      itemName = "Buried Gem Chest";
      itemIcon = "🪙";
      rewardGold = 250;
      rewardExp = 50;
    } else if (type === "CROPS") {
      itemName = "Wheat Wheatland";
      itemIcon = "🌾";
      rewardGold = 20;
    }

    if (rewardGold > 0) setGold((prev) => prev + rewardGold);
    setPlayerExp((prev) => prev + rewardExp);

    // Add item to inventory
    setInventory((prevInv) => {
      const existing = prevInv.find((i) => i.name === itemName);
      if (existing) {
        return prevInv.map((i) =>
          i.name === itemName ? { ...i, count: i.count + 1 } : i,
        );
      }
      return [
        ...prevInv,
        {
          id: `item-${Date.now()}`,
          name: itemName,
          type: "block",
          blockType: type,
          count: 1,
          icon: itemIcon,
          description: `Gathered resource from the wild continent.`,
        },
      ];
    });
  };

  // Block Placement Handler
  const handleBlockPlace = (coord: WorldCoord, type: BlockType) => {
    const key = `${coord.x},${coord.y},${coord.z}`;
    if (world.blocks.has(key)) return;

    const newBlocks = new Map(world.blocks);
    newBlocks.set(key, type);
    setWorld({ ...world, blocks: newBlocks });
  };

  // Location Discovery Handler
  const handleDiscoverLocation = () => {
    setGold((prev) => prev + 100);
    setPlayerExp((prev) => prev + 50);
  };

  useEffect(() => {
    if (!authToken) {
      setWalletExpLoaded(true);
      return;
    }
    setWalletExpLoaded(false);

    const loadWalletExp = async () => {
      try {
        const response = await fetch("/api/player/me", {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        const data = await readJsonSafe<{ exp?: number }>(response);
        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem(AUTH_TOKEN_KEY);
            localStorage.removeItem(WALLET_ADDRESS_KEY);
            setAuthToken(null);
          }
          return;
        }

        if (typeof data.exp === "number" && Number.isFinite(data.exp)) {
          setPlayerExp(Math.max(0, Math.floor(data.exp)));
        }
      } catch {
        // Keep local EXP when profile fetch fails.
      } finally {
        setWalletExpLoaded(true);
      }
    };

    void loadWalletExp();
  }, [authToken]);

  useEffect(() => {
    if (!authToken || !walletExpLoaded) return;

    if (expSyncTimerRef.current !== null) {
      window.clearTimeout(expSyncTimerRef.current);
    }

    expSyncTimerRef.current = window.setTimeout(async () => {
      try {
        const response = await fetch("/api/player/exp", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ exp: Math.floor(playerExp) }),
        });

        if (response.status === 401) {
          localStorage.removeItem(AUTH_TOKEN_KEY);
          localStorage.removeItem(WALLET_ADDRESS_KEY);
          setAuthToken(null);
        }
      } catch {
        // Keep gameplay uninterrupted if sync fails.
      }
    }, 700);

    return () => {
      if (expSyncTimerRef.current !== null) {
        window.clearTimeout(expSyncTimerRef.current);
      }
    };
  }, [playerExp, authToken]);

  useEffect(() => {
    const handleResize = () => {
      setCanPlayOnThisScreen(window.innerWidth >= MIN_PLAY_WIDTH);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none">
      {!hasStarted && (
        <Hero
          onPlay={() => {
            setIsStartingGame(true);
            const token = localStorage.getItem(AUTH_TOKEN_KEY);
            const walletAddress = localStorage.getItem(WALLET_ADDRESS_KEY);
            if (!token || !walletAddress) {
              window.alert(
                "Connect your wallet on the Wallet page before playing.",
              );
              setIsStartingGame(false);
              return;
            }
            setAuthToken(token);
            setHasStarted(true);
            setIsGameReady(false);
          }}
          isLoading={isStartingGame}
        />
      )}

      {hasStarted && !isGameReady && (
        <Hero onPlay={() => {}} isLoading={true} />
      )}

      {hasStarted && (
        <div
          className={isGameReady ? "contents" : "invisible pointer-events-none"}
        >
          {/* Top Header Controls */}
          <MMORPGHeader
            stats={{
              name: "Hero Fighter",
              level: playerLevel,
              exp: playerExp,
              maxExp: 1000,
              hp: playerHp,
              maxHp: 100,
              stamina: stamina,
              maxStamina: 100,
              gold: gold,
              title: "Village Warrior",
              headStyle: "guard",
              outfitColor: "#1e293b",
            }}
            quests={[]}
            timeOfDay={timeOfDay}
            onToggleTimeOfDay={() =>
              setTimeOfDay((prev) =>
                prev === "day" ? "sunset" : prev === "sunset" ? "night" : "day",
              )
            }
            onRotateCamera={() => setCameraAngle((prev) => (prev + 1) % 4)}
            onZoomIn={() =>
              setCameraZoom((prev) =>
                Math.min(6.0, Number((prev + 0.25).toFixed(2))),
              )
            }
            onZoomOut={() =>
              setCameraZoom((prev) =>
                Math.max(0.4, Number((prev - 0.25).toFixed(2))),
              )
            }
            onOpenCustomizer={() => {}}
            onOpenWagonScene={() => {}}
          />

          {/* Three.js Isometric Voxel Canvas */}
          <VoxelCanvas
            world={world}
            onBlockMine={handleBlockMine}
            onBlockPlace={handleBlockPlace}
            onNpcClick={(npc) => {
              setActiveNpcModal(npc);
              checkMiniTaskTrigger(`npc:${npc.id}`);
            }}
            onInspectWagon={() => {}}
            selectedItem={inventory[0] || null}
            activeMode={activeMode}
            npcs={INITIAL_NPCS}
            timeOfDay={timeOfDay}
            onAddChatMessage={() => {}}
            cameraZoom={cameraZoom}
            cameraAngle={cameraAngle}
            onZoomChange={setCameraZoom}
            gameMode={gameMode}
            houseOwned={houseOwned}
            onDiscoverLocation={(_, locationId) => {
              if (locationId) checkMiniTaskTrigger(`location:${locationId}`);
            }}
            onReady={() => setIsGameReady(true)}
            onCombatExpGain={(amount) => {
              setPlayerExp((prev) => prev + amount);
            }}
          />

          {/* Mini Tasks (+10 XP) Widget */}
          <MiniTasksWidget
            tasks={miniTasks}
            onCompleteTask={completeMiniTask}
          />

          {/* Mini Task Celebratory Toast */}
          {miniTaskToast && (
            <div className="absolute top-30 left-1/2 transform -translate-x-1/2 z-50 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-slate-950 px-6 py-2.5 rounded-full border-2 border-white shadow-2xl font-black text-sm flex items-center gap-2 animate-bounce">
              <span>{miniTaskToast}</span>
            </div>
          )}

          {/* Title & Game Mode Toggle */}
          <div className="absolute top-20 sm:top-16 right-2 sm:right-4 z-20 flex items-center gap-2 sm:gap-3 bg-slate-900/90 backdrop-blur-md px-2 sm:px-4 py-1.5 sm:py-2 rounded-2xl border-2 border-slate-700/80 shadow-xl">
            <div className="hidden sm:flex items-center gap-2 pr-2 border-r border-slate-700/80">
              <span className="text-xl">🌿</span>
              <div>
                <h1 className="text-xs font-black text-white tracking-wide">
                  Voxelverse RPG
                </h1>
                <p className="text-[10px] font-semibold text-amber-400">
                  WASD to walk & explore
                </p>
              </div>
            </div>

            {/* Game Mode Selector */}
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-700 shadow-inner">
              <button
                onClick={() => setGameMode("survival")}
                className={`px-2 sm:px-3 py-1 rounded-lg font-black text-xs transition-all flex items-center gap-1 ${
                  gameMode === "survival"
                    ? "bg-emerald-500 text-slate-950 shadow-md"
                    : "text-slate-300 hover:text-white hover:bg-slate-800"
                }`}
              >
                <span>🌿</span>
                <span className="hidden sm:inline">Survival</span>
              </button>
              <button
                onClick={() => setGameMode("fighting")}
                className={`px-2 sm:px-3 py-1 rounded-lg font-black text-xs transition-all flex items-center gap-1 ${
                  gameMode === "fighting"
                    ? "bg-red-600 text-white shadow-md animate-pulse"
                    : "text-slate-300 hover:text-white hover:bg-slate-800"
                }`}
              >
                <span>⚔️</span>
                <span className="hidden sm:inline">Fighting</span>
              </button>
            </div>
          </div>

          {/* Active Everyday Activity Modal */}
          {activeNpcModal && (
            <SurvivalActivityModal
              npc={activeNpcModal}
              onClose={() => setActiveNpcModal(null)}
              gold={gold}
              setGold={setGold}
              houseOwned={houseOwned}
              setHouseOwned={setHouseOwned}
              inventory={inventory}
              setInventory={setInventory}
              playerHp={playerHp}
              setPlayerHp={setPlayerHp}
              stamina={stamina}
              setStamina={setStamina}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<GamePage />} />
      <Route path="/how-to-play" element={<HowToPlayPage />} />
      <Route path="/docs" element={<HowToPlayPage />} />
      <Route path="/wallet" element={<WalletPage />} />
    </Routes>
  );
}
