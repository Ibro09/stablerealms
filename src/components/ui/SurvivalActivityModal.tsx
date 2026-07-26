import React, { useState, useEffect } from "react";
import { InventoryItem, NPC } from "../../types/game";

interface SurvivalActivityModalProps {
  npc: NPC;
  onClose: () => void;
  gold: number;
  setGold: React.Dispatch<React.SetStateAction<number>>;
  houseOwned: boolean;
  setHouseOwned: React.Dispatch<React.SetStateAction<boolean>>;
  inventory: InventoryItem[];
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  playerHp: number;
  setPlayerHp: React.Dispatch<React.SetStateAction<number>>;
  stamina: number;
  setStamina: React.Dispatch<React.SetStateAction<number>>;
}

export const SurvivalActivityModal: React.FC<SurvivalActivityModalProps> = ({
  npc,
  onClose,
  gold,
  setGold,
  houseOwned,
  setHouseOwned,
  inventory,
  setInventory,
  playerHp,
  setPlayerHp,
  stamina,
  setStamina,
}) => {
  const [statusMessage, setStatusMessage] = useState<string>("");

  // Fishing State
  const [isFishing, setIsFishing] = useState<boolean>(false);
  const [fishProgress, setFishProgress] = useState<number>(0);

  // Boxing State
  const [inMatch, setInMatch] = useState<boolean>(false);
  const [boxerHp, setBoxerHp] = useState<number>(100);
  const [combatLogs, setCombatLogs] = useState<string[]>([
    "Round 1! Put up your dukes!",
  ]);
  const [isGuarded, setIsGuarded] = useState<boolean>(false);

  // Helper to get item count from inventory
  const getItemCount = (idOrName: string): number => {
    const item = inventory.find(
      (i) =>
        i.id === idOrName ||
        i.name.toLowerCase().includes(idOrName.toLowerCase()),
    );
    return item ? item.count : 0;
  };

  // Helper to add/modify item count in inventory
  const addItemCount = (
    id: string,
    name: string,
    icon: string,
    delta: number,
  ) => {
    setInventory((prev) => {
      const idx = prev.findIndex((i) => i.id === id || i.name === name);
      if (idx !== -1) {
        const updated = [...prev];
        const newCount = Math.max(0, updated[idx].count + delta);
        updated[idx] = { ...updated[idx], count: newCount };
        return updated;
      } else if (delta > 0) {
        return [
          ...prev,
          {
            id,
            name,
            type: "consumable",
            count: delta,
            icon,
            description: `Gathered ${name} from village activities.`,
          } as InventoryItem,
        ];
      }
      return prev;
    });
  };

  // Fishing Timer Effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isFishing) {
      timer = setInterval(() => {
        setFishProgress((prev) => {
          if (prev >= 100) {
            setIsFishing(false);
            addItemCount("cons-1", "Fresh Fish", "🐟", 1);
            setStatusMessage("🎣 TUG! You caught a delicious Fresh Fish!");
            return 0;
          }
          return prev + 25;
        });
      }, 500);
    }
    return () => clearInterval(timer);
  }, [isFishing]);

  // Boxing Opponent AI Attack Loop
  useEffect(() => {
    let aiTimer: NodeJS.Timeout;
    if (inMatch && boxerHp > 0 && playerHp > 0) {
      aiTimer = setInterval(() => {
        if (isGuarded) {
          setCombatLogs((prev) => [
            "🛡️ You dodged & guarded against Jax's hook!",
            ...prev.slice(0, 5),
          ]);
          setIsGuarded(false);
        } else {
          const dmg = Math.floor(Math.random() * 7) + 12; // 12-18 dmg
          setPlayerHp((prev) => {
            const nextHp = Math.max(0, prev - dmg);
            if (nextHp === 0) {
              setCombatLogs((prev) => [
                "💫 KNOCKOUT! You went down on the mat!",
                ...prev.slice(0, 5),
              ]);
            } else {
              setCombatLogs((prev) => [
                `💥 Jax landed a right hook for ${dmg} damage!`,
                ...prev.slice(0, 5),
              ]);
            }
            return nextHp;
          });
        }
      }, 1800);
    }
    return () => clearInterval(aiTimer);
  }, [inMatch, boxerHp, playerHp, isGuarded, setPlayerHp]);

  // Actions
  const handleChopTree = () => {
    if (stamina < 10) {
      setStatusMessage("⚡ Too tired! Eat fish or rest in your house.");
      return;
    }
    setStamina((prev) => Math.max(0, prev - 10));
    addItemCount("block-1", "Oak Timber Log", "🪵", 1);
    setStatusMessage("🪓 TIMBER! You chopped +1 Oak Timber Log!");
  };

  const handleMineCoal = () => {
    if (stamina < 15) {
      setStatusMessage("⚡ Too tired to mine! Eat fish or rest.");
      return;
    }
    setStamina((prev) => Math.max(0, prev - 15));
    addItemCount("cons-2", "Coal Lump", "⬛", 1);
    setStatusMessage("⛏️ Strike! You extracted +1 Coal Lump!");
  };

  const handleStartFishing = () => {
    if (stamina < 5) {
      setStatusMessage("⚡ Too tired to cast line! Eat fish or rest.");
      return;
    }
    if (isFishing) return;
    setStamina((prev) => Math.max(0, prev - 5));
    setFishProgress(0);
    setIsFishing(true);
    setStatusMessage("🎣 Bobber floating in the pond... waiting for a bite!");
  };

  const handleEatFish = () => {
    const count = getItemCount("cons-1");
    if (count <= 0) {
      setStatusMessage("❌ No Fresh Fish in inventory! Catch some first.");
      return;
    }
    addItemCount("cons-1", "Fresh Fish", "🐟", -1);
    setPlayerHp((prev) => Math.min(100, prev + 40));
    setStamina((prev) => Math.min(100, prev + 50));
    setStatusMessage("🐟 Yum! Ate grilled fish. (+40 HP, +50 Stamina)");
    if (inMatch) {
      setCombatLogs((prev) => [
        "🐟 Ate Fresh Fish in corner! Recovered +40 HP!",
        ...prev.slice(0, 5),
      ]);
    }
  };

  const handleSellItem = (
    id: string,
    name: string,
    price: number,
    sellAll = false,
  ) => {
    const count = getItemCount(id);
    if (count <= 0) {
      setStatusMessage(`❌ You don't have any ${name} to sell!`);
      return;
    }
    const toSell = sellAll ? count : 1;
    addItemCount(id, name, "", -toSell);
    setGold((prev) => prev + toSell * price);
    setStatusMessage(`💰 Sold ${toSell}x ${name} for $${toSell * price} Gold!`);
  };

  const handleBuyHouse = () => {
    if (gold < 250) {
      setStatusMessage(
        "❌ Not enough Gold! You need $250 Gold to buy this cottage.",
      );
      return;
    }
    setGold((prev) => prev - 250);
    setHouseOwned(true);
    setStatusMessage(
      "🎉 Congratulations! You are now the owner of this cozy cottage!",
    );
  };

  const handleSleepInBed = () => {
    setPlayerHp(100);
    setStamina(100);
    setStatusMessage(
      "🛏️ Slept soundly in your warm bed! HP & Stamina restored to 100%!",
    );
  };

  const handleEnterRing = () => {
    if (gold < 20) {
      setStatusMessage("❌ You need $20 Gold for the boxing match entry fee!");
      return;
    }
    setGold((prev) => prev - 20);
    setBoxerHp(100);
    setInMatch(true);
    setCombatLogs(["🥊 Bell rings! Round 1 against Iron Glove Jax!"]);
  };

  const handlePunch = (type: "jab" | "hook") => {
    if (boxerHp <= 0 || playerHp <= 0) return;
    let dmg = type === "jab" ? 15 : 25;
    let logMsg = "";
    if (type === "hook" && Math.random() < 0.25) {
      dmg = 40;
      logMsg = "🔥 CRITICAL HOOK! Landed a devastating blow for 40 damage!";
    } else {
      logMsg = `💥 You threw a ${type.toUpperCase()} for ${dmg} damage!`;
    }
    setBoxerHp((prev) => {
      const next = Math.max(0, prev - dmg);
      if (next === 0) {
        setCombatLogs((prevLogs) => [
          "🏆 KNOCKOUT! You defeated Iron Glove Jax!",
          ...prevLogs.slice(0, 5),
        ]);
      } else {
        setCombatLogs((prevLogs) => [logMsg, ...prevLogs.slice(0, 5)]);
      }
      return next;
    });
  };

  const handleDodge = () => {
    setIsGuarded(true);
    setStamina((prev) => Math.min(100, prev + 20));
    setCombatLogs((prev) => [
      "🛡️ Guard raised! Preparing to dodge next attack (+20 Stamina)",
      ...prev.slice(0, 5),
    ]);
  };

  const handleClaimPrize = () => {
    setGold((prev) => prev + 100);
    setInMatch(false);
    setStatusMessage("🏆 Claimed $100 Prize Money & Boxing Trophy! Champion!");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border-2 border-slate-700 rounded-3xl p-6 shadow-2xl text-white overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-2xl">
              {npc.id === "npc-finn" || npc.statusBubble === "Pond"
                ? "🎣"
                : null}
              {npc.id === "npc-cole" || npc.statusBubble === "Coal House"
                ? "⛏️"
                : null}
              {(npc.id === "npc-rocky" ||
                npc.id === "npc-buster" ||
                npc.id === "npc-kira" ||
                npc.statusBubble === "Boxing Ring") &&
                "🥊"}
              {npc.id === "npc-ruby" || npc.statusBubble === "House For Sale"
                ? "🏡"
                : null}
              {npc.id === "npc-jack" || npc.statusBubble === "Lumber Forest"
                ? "🌲"
                : null}
              {![
                "npc-finn",
                "npc-cole",
                "npc-rocky",
                "npc-buster",
                "npc-kira",
                "npc-ruby",
                "npc-jack",
              ].includes(npc.id) &&
                ![
                  "Pond",
                  "Coal House",
                  "Boxing Ring",
                  "House For Sale",
                  "Lumber Forest",
                ].includes(npc.statusBubble || "") &&
                "💬"}
            </div>
            <div>
              <h2 className="text-lg font-black tracking-wide text-amber-400">
                {npc.name}
              </h2>
              <p className="text-xs font-semibold text-slate-400">
                {npc.title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold flex items-center justify-center transition-all border border-slate-700 shadow"
          >
            ✕
          </button>
        </div>

        {/* Status Message Banner */}
        {statusMessage && (
          <div className="mb-4 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold animate-pulse">
            {statusMessage}
          </div>
        )}

        {/* 1. LUMBER FOREST 🌲 */}
        {npc.id === "npc-jack" && (
          <div className="space-y-4">
            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
              "{npc.dialogue.greeting}"
            </p>
            <div className="flex items-center justify-between bg-slate-800/60 p-3 rounded-2xl border border-slate-700">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🪵</span>
                <div>
                  <div className="text-xs font-bold text-white">
                    Oak Timber Logs
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Market Price: $15 Gold each
                  </div>
                </div>
              </div>
              <div className="text-sm font-black text-amber-400">
                In Pack: {getItemCount("block-1")}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 pt-2">
              <button
                onClick={handleChopTree}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-black text-sm rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 border border-emerald-400"
              >
                <span>🪓</span>
                <span>Chop Wood Log (-10 Stamina)</span>
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() =>
                    handleSellItem("block-1", "Oak Timber Log", 15)
                  }
                  className="py-2.5 bg-amber-500 hover:bg-amber-400 active:scale-98 text-slate-950 font-bold text-xs rounded-xl shadow transition-all"
                >
                  💰 Sell 1 Log (+$15)
                </button>
                <button
                  onClick={() =>
                    handleSellItem("block-1", "Oak Timber Log", 15, true)
                  }
                  className="py-2.5 bg-amber-600 hover:bg-amber-500 active:scale-98 text-white font-bold text-xs rounded-xl shadow transition-all"
                >
                  💰 Sell ALL Logs
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2. COAL HOUSE ⛏️ */}
        {npc.id === "npc-cole" && (
          <div className="space-y-4">
            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
              "{npc.dialogue.greeting}"
            </p>
            <div className="flex items-center justify-between bg-slate-800/60 p-3 rounded-2xl border border-slate-700">
              <div className="flex items-center gap-2">
                <span className="text-2xl">⬛</span>
                <div>
                  <div className="text-xs font-bold text-white">
                    Anthracite Coal Lumps
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Market Price: $25 Gold each
                  </div>
                </div>
              </div>
              <div className="text-sm font-black text-amber-400">
                In Pack: {getItemCount("cons-2")}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 pt-2">
              <button
                onClick={handleMineCoal}
                className="w-full py-3 bg-slate-700 hover:bg-slate-600 active:scale-98 text-white font-black text-sm rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 border border-slate-500"
              >
                <span>⛏️</span>
                <span>Mine Coal Seam (-15 Stamina)</span>
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleSellItem("cons-2", "Coal Lump", 25)}
                  className="py-2.5 bg-amber-500 hover:bg-amber-400 active:scale-98 text-slate-950 font-bold text-xs rounded-xl shadow transition-all"
                >
                  💰 Sell 1 Coal (+$25)
                </button>
                <button
                  onClick={() =>
                    handleSellItem("cons-2", "Coal Lump", 25, true)
                  }
                  className="py-2.5 bg-amber-600 hover:bg-amber-500 active:scale-98 text-white font-bold text-xs rounded-xl shadow transition-all"
                >
                  💰 Sell ALL Coal
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 3. FISHING POND 🎣 */}
        {npc.id === "npc-finn" && (
          <div className="space-y-4">
            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
              "{npc.dialogue.greeting}"
            </p>
            <div className="flex items-center justify-between bg-slate-800/60 p-3 rounded-2xl border border-slate-700">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🐟</span>
                <div>
                  <div className="text-xs font-bold text-white">
                    Fresh Salmon & Bass
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Eat to restore +40 HP & +50 Stamina
                  </div>
                </div>
              </div>
              <div className="text-sm font-black text-amber-400">
                In Pack: {getItemCount("cons-1")}
              </div>
            </div>

            {isFishing && (
              <div className="space-y-1.5 bg-blue-950/60 p-3 rounded-2xl border border-blue-500/40">
                <div className="flex justify-between text-xs font-bold text-blue-300">
                  <span>🎣 Fishing in progress... Keep watch!</span>
                  <span>{fishProgress}%</span>
                </div>
                <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-700">
                  <div
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${fishProgress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-2 pt-2">
              <button
                onClick={handleStartFishing}
                disabled={isFishing}
                className={`w-full py-3 rounded-2xl font-black text-sm shadow-lg transition-all flex items-center justify-center gap-2 border ${
                  isFishing
                    ? "bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-500 active:scale-98 text-white border-blue-400"
                }`}
              >
                <span>🎣</span>
                <span>
                  {isFishing
                    ? "Reeling line in..."
                    : "Cast Fishing Rod (-5 Stamina)"}
                </span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleEatFish}
                  className="py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-1.5 border border-emerald-400"
                >
                  <span>🐟</span>
                  <span>Eat Fish (+40 HP)</span>
                </button>
                <button
                  onClick={() => handleSellItem("cons-1", "Fresh Fish", 20)}
                  className="py-2.5 bg-amber-500 hover:bg-amber-400 active:scale-98 text-slate-950 font-bold text-xs rounded-xl shadow transition-all"
                >
                  💰 Sell 1 Fish (+$20)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 4. HOUSE FOR SALE 🏡 */}
        {npc.id === "npc-ruby" && (
          <div className="space-y-4">
            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
              "{npc.dialogue.greeting}"
            </p>

            <div className="p-4 rounded-3xl bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-950 border-2 border-amber-500/40 text-center space-y-3 shadow-inner">
              <div className="text-4xl animate-bounce">🏡</div>
              <div>
                <h3 className="text-base font-black text-amber-400">
                  Village Cozy Cottage
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  {houseOwned
                    ? "🌟 Property Owned by You! Enjoy unlimited rest and healing anytime."
                    : "A beautifully crafted stone & wood cottage with a garden fence and lanterns."}
                </p>
              </div>

              {!houseOwned ? (
                <div className="pt-2">
                  <div className="text-lg font-black text-amber-300 mb-3">
                    Price: $250 Gold Coin
                  </div>
                  <button
                    onClick={handleBuyHouse}
                    className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm rounded-2xl shadow-xl transition-all active:scale-98 border border-amber-300"
                  >
                    🔑 Buy Cottage ($250 Gold)
                  </button>
                </div>
              ) : (
                <div className="pt-2">
                  <button
                    onClick={handleSleepInBed}
                    className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-sm rounded-2xl shadow-xl transition-all active:scale-98 border border-purple-400 flex items-center justify-center gap-2"
                  >
                    <span className="text-lg">🛏️</span>
                    <span>Sleep in Bed & Rest (Full Heal)</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 5. BOXING RING 🥊 */}
        {npc.id === "npc-rocky" && (
          <div className="space-y-4">
            {!inMatch ? (
              <>
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                  "{npc.dialogue.greeting}"
                </p>
                <div className="p-4 rounded-3xl bg-red-950/30 border-2 border-red-500/40 text-center space-y-3">
                  <div className="text-4xl">🥊</div>
                  <div>
                    <h3 className="text-base font-black text-red-400">
                      3-Round Prize Fight
                    </h3>
                    <p className="text-xs text-slate-300 mt-1">
                      Defeat opponent "Iron Glove Jax" in the ring! Dodge
                      punches and land combos to win $100 Gold Prize Money!
                    </p>
                  </div>
                  <button
                    onClick={handleEnterRing}
                    className="w-full py-3.5 bg-red-600 hover:bg-red-500 active:scale-98 text-white font-black text-sm rounded-2xl shadow-xl transition-all border border-red-400"
                  >
                    🥊 Enter Ring ($20 Entry Fee)
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-4 animate-fade-in">
                {/* Fighter HP Bars */}
                <div className="grid grid-cols-2 gap-3 bg-slate-950 p-3 rounded-2xl border border-slate-800">
                  <div>
                    <div className="text-[10px] font-bold text-blue-400 mb-1">
                      YOU (Challenger)
                    </div>
                    <div className="text-xs font-black text-white mb-1">
                      {playerHp} / 100 HP
                    </div>
                    <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-700">
                      <div
                        className="h-full bg-blue-500 transition-all duration-200"
                        style={{ width: `${playerHp}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-red-400 mb-1">
                      IRON GLOVE JAX
                    </div>
                    <div className="text-xs font-black text-white mb-1">
                      {boxerHp} / 100 HP
                    </div>
                    <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-700">
                      <div
                        className="h-full bg-red-600 transition-all duration-200"
                        style={{ width: `${boxerHp}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Combat Log Box */}
                <div className="h-24 overflow-y-auto bg-slate-950/90 p-2.5 rounded-2xl border border-slate-800 text-[11px] font-mono space-y-1 flex flex-col-reverse">
                  {combatLogs.map((log, idx) => (
                    <div
                      key={idx}
                      className={
                        log.includes("CRITICAL") || log.includes("KNOCKOUT")
                          ? "text-amber-400 font-bold"
                          : log.includes("Jax landed")
                            ? "text-red-400"
                            : "text-slate-300"
                      }
                    >
                      {log}
                    </div>
                  ))}
                </div>

                {/* Combat Actions */}
                {boxerHp > 0 && playerHp > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handlePunch("jab")}
                      className="py-3 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-black text-xs rounded-xl shadow border border-blue-400"
                    >
                      💥 Jab Punch (15 Dmg)
                    </button>
                    <button
                      onClick={() => handlePunch("hook")}
                      className="py-3 bg-red-600 hover:bg-red-500 active:scale-95 text-white font-black text-xs rounded-xl shadow border border-red-400"
                    >
                      🥊 Power Hook (25 Dmg)
                    </button>
                    <button
                      onClick={handleDodge}
                      className="py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-amber-300 font-bold text-xs rounded-xl shadow border border-slate-600"
                    >
                      🛡️ Dodge & Guard (+20 Stamina)
                    </button>
                    <button
                      onClick={handleEatFish}
                      className="py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow border border-emerald-400 flex items-center justify-center gap-1"
                    >
                      <span>🐟</span>
                      <span>Eat Fish (+40 HP)</span>
                    </button>
                  </div>
                ) : boxerHp <= 0 ? (
                  <div className="p-3 bg-amber-500/20 border-2 border-amber-500 rounded-2xl text-center space-y-2">
                    <div className="text-lg font-black text-amber-400">
                      🏆 VICTORY! YOU WIN!
                    </div>
                    <p className="text-xs text-slate-300">
                      You knocked out Iron Glove Jax and won the championship
                      purse!
                    </p>
                    <button
                      onClick={handleClaimPrize}
                      className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm rounded-xl shadow-lg transition-all"
                    >
                      🏆 Claim $100 Prize Money
                    </button>
                  </div>
                ) : (
                  <div className="p-3 bg-red-500/20 border-2 border-red-500 rounded-2xl text-center space-y-2">
                    <div className="text-lg font-black text-red-400">
                      💫 KNOCKED DOWN!
                    </div>
                    <p className="text-xs text-slate-300">
                      Rocky pulled you out of the ring to rest and heal up.
                    </p>
                    <button
                      onClick={() => {
                        setInMatch(false);
                        setPlayerHp(50);
                      }}
                      className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl"
                    >
                      Exit Ring & Rest
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Generic NPC Dialogue Fallback */}
        {![
          "npc-finn",
          "npc-cole",
          "npc-rocky",
          "npc-ruby",
          "npc-jack",
        ].includes(npc.id) && (
          <div className="space-y-4">
            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
              "{npc.dialogue.greeting}"
            </p>
            <div className="space-y-2">
              {npc.dialogue.options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => setStatusMessage(opt.response)}
                  className="w-full text-left p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold transition-all border border-slate-700 shadow"
                >
                  💬 {opt.text}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
