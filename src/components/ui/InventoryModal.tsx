import React, { useState } from 'react';
import { InventoryItem, PlayerStats } from '../../types/game';

interface InventoryModalProps {
  items: InventoryItem[];
  stats: PlayerStats;
  onClose: () => void;
  onCraft: (recipeId: string) => void;
  onBuyItem: (item: InventoryItem, cost: number) => void;
  onSellItem: (itemId: string, gain: number) => void;
}

interface CraftRecipe {
  id: string;
  name: string;
  resultIcon: string;
  resultCount: number;
  description: string;
  ingredients: { name: string; count: number; id: string }[];
}

const RECIPES: CraftRecipe[] = [
  {
    id: 'craft-planks',
    name: 'Wooden Planks',
    resultIcon: '🪚',
    resultCount: 16,
    description: 'Refined lumber boards used for flooring and building.',
    ingredients: [{ name: 'Oak Timber Log', count: 2, id: 'block-1' }],
  },
  {
    id: 'craft-fence',
    name: 'Wooden Fence',
    resultIcon: '🚧',
    resultCount: 4,
    description: 'Classic RPG village perimeter fence (Screenshot 2 Inspo!).',
    ingredients: [{ name: 'Wooden Planks', count: 2, id: 'block-3' }],
  },
  {
    id: 'craft-table',
    name: 'Council Meeting Table',
    resultIcon: '🪑',
    resultCount: 1,
    description: 'Large dark wooden table for town square meetings.',
    ingredients: [{ name: 'Wooden Planks', count: 4, id: 'block-3' }],
  },
  {
    id: 'craft-beige',
    name: 'Beige House Wall',
    resultIcon: '🏠',
    resultCount: 4,
    description: 'Warm beige stucco block for building cozy cottages.',
    ingredients: [{ name: 'Village Cobblestone', count: 2, id: 'block-2' }],
  },
  {
    id: 'craft-roof',
    name: 'Brown Shingle Roof',
    resultIcon: '⛺',
    resultCount: 4,
    description: 'Angled brown roof tiles for classic medieval roofs.',
    ingredients: [{ name: 'Oak Timber Log', count: 1, id: 'block-1' }],
  },
  {
    id: 'craft-lantern',
    name: 'Village Lantern',
    resultIcon: '🏮',
    resultCount: 2,
    description: 'Casts a warm cozy light across night village paths.',
    ingredients: [
      { name: 'Village Cobblestone', count: 1, id: 'block-2' },
      { name: 'Wild Meadow Flower', count: 1, id: 'flower' },
    ],
  },
];

const SHOP_ITEMS: { item: InventoryItem; cost: number }[] = [
  { item: { id: 'shop-1', name: 'Golden Pickaxe', type: 'tool', toolType: 'PICKAXE', count: 1, icon: '✨', description: 'Mines 2x faster than iron!' }, cost: 250 },
  { item: { id: 'shop-2', name: 'Village Lantern', type: 'block', blockType: 'LAMP', count: 4, icon: '🏮', description: 'Decorative glowing light.' }, cost: 50 },
  { item: { id: 'shop-3', name: 'Beige House Wall', type: 'block', blockType: 'WALL_BEIGE', count: 16, icon: '🏠', description: 'Cozy stucco bricks.' }, cost: 80 },
  { item: { id: 'shop-4', name: 'Brown Shingle Roof', type: 'block', blockType: 'ROOF_BROWN', count: 16, icon: '⛺', description: 'Brown shingle tiles.' }, cost: 80 },
  { item: { id: 'shop-5', name: 'Caution Barricade', type: 'block', blockType: 'CAUTION_TAPE', count: 8, icon: '⚠️', description: 'Yellow warning tape.' }, cost: 40 },
];

export const InventoryModal: React.FC<InventoryModalProps> = ({
  items,
  stats,
  onClose,
  onCraft,
  onBuyItem,
  onSellItem,
}) => {
  const [tab, setTab] = useState<'bag' | 'craft' | 'shop'>('bag');

  // Helper to check ingredient counts
  const canCraft = (recipe: CraftRecipe) => {
    return recipe.ingredients.every((ing) => {
      const found = items.find((i) => i.name === ing.name || i.id === ing.id);
      return found && found.count >= ing.count;
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-slate-900 border-4 border-amber-500 rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col h-[650px] max-h-[90vh]">
        {/* Header Tabs */}
        <div className="bg-slate-950 p-4 border-b-2 border-amber-500/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTab('bag')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                tab === 'bag' ? 'bg-amber-400 text-slate-950 scale-105' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              🎒 Bag & Inventory ({items.length})
            </button>
            <button
              onClick={() => setTab('craft')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                tab === 'craft' ? 'bg-amber-400 text-slate-950 scale-105' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              ⚒️ Crafting Workbench
            </button>
            <button
              onClick={() => setTab('shop')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                tab === 'shop' ? 'bg-amber-400 text-slate-950 scale-105' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              🏪 Village Trade Shop
            </button>
          </div>

          <div className="flex items-center gap-4">
            <span className="bg-amber-500/20 text-amber-300 px-3 py-1 rounded-xl text-xs font-black border border-amber-500/40">
              💰 {stats.gold}g
            </span>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-red-500 text-white font-black text-lg flex items-center justify-center transition-colors"
            >
              ×
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          {tab === 'bag' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400 font-medium">
                Your character bag contains mining tools and voxel building blocks. Click an item in your Hotbar (bottom of screen) or use number keys 1-9 to equip it!
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-slate-950/80 rounded-2xl border-2 border-slate-800 flex flex-col justify-between hover:border-amber-500/60 transition-all group"
                  >
                    <div className="flex items-start justify-between">
                      <span className="text-3xl">{item.icon}</span>
                      {item.type === 'block' && (
                        <span className="bg-amber-500/20 text-amber-300 text-xs font-black px-2 py-0.5 rounded-lg border border-amber-500/30">
                          x{item.count}
                        </span>
                      )}
                    </div>
                    <div className="mt-2">
                      <h4 className="text-xs font-extrabold text-white">{item.name}</h4>
                      <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">{item.description}</p>
                    </div>

                    {/* Quick Sell button for extra gold */}
                    {item.type === 'block' && item.count >= 5 && (
                      <button
                        onClick={() => onSellItem(item.id, 15)}
                        className="mt-3 w-full py-1.5 bg-slate-800 hover:bg-green-600/80 text-green-300 hover:text-white rounded-xl text-[11px] font-bold transition-all border border-slate-700"
                      >
                        Sell 5 for 💰 15g
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'craft' && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs text-amber-200 font-medium">
                💡 <strong className="text-amber-400">Crafting Workbench:</strong> Convert raw logs and stone into refined building tiles like Beige Stucco Walls, Brown Shingle Roofs, and Village Fences!
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {RECIPES.map((recipe) => {
                  const possible = canCraft(recipe);
                  return (
                    <div
                      key={recipe.id}
                      className={`p-4 rounded-2xl border-2 flex flex-col justify-between transition-all ${
                        possible ? 'bg-slate-950 border-amber-500/60 shadow-lg' : 'bg-slate-950/50 border-slate-800 opacity-60'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-3xl p-2 bg-slate-900 rounded-xl border border-slate-800">{recipe.resultIcon}</span>
                        <div>
                          <h4 className="text-sm font-black text-white flex items-center gap-1.5">
                            <span>{recipe.name}</span>
                            <span className="text-xs text-amber-400 font-bold">(x{recipe.resultCount})</span>
                          </h4>
                          <p className="text-xs text-slate-400 mt-0.5">{recipe.description}</p>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-slate-400">Req:</span>
                          {recipe.ingredients.map((ing, i) => {
                            const have = items.find((it) => it.name === ing.name || it.id === ing.id)?.count || 0;
                            return (
                              <span
                                key={i}
                                className={`text-xs font-black px-2 py-0.5 rounded-md border ${
                                  have >= ing.count ? 'bg-green-500/10 text-green-400 border-green-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'
                                }`}
                              >
                                {ing.name}: {have}/{ing.count}
                              </span>
                            );
                          })}
                        </div>

                        <button
                          disabled={!possible}
                          onClick={() => onCraft(recipe.id)}
                          className={`px-4 py-1.5 rounded-xl font-black text-xs transition-all ${
                            possible
                              ? 'bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 shadow-md scale-105'
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          Craft ✨
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tab === 'shop' && (
            <div className="space-y-4">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs text-emerald-200 font-medium flex items-center justify-between">
                <span>🏪 <strong className="text-emerald-400">Blacksmith Kael & Merchant Lyra's Shop:</strong> Trade your hard-earned quest gold for upgraded pickaxes and cozy village decor!</span>
                <span className="font-extrabold text-amber-400">Your Balance: 💰 {stats.gold}g</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {SHOP_ITEMS.map(({ item, cost }, i) => {
                  const canBuy = stats.gold >= cost;
                  return (
                    <div key={i} className="p-4 bg-slate-950 rounded-2xl border-2 border-slate-800 flex flex-col justify-between">
                      <div className="flex items-start gap-3">
                        <span className="text-3xl p-2 bg-slate-900 rounded-xl">{item.icon}</span>
                        <div>
                          <h4 className="text-sm font-black text-white">{item.name}</h4>
                          <span className="text-xs text-amber-400 font-bold">x{item.count}</span>
                          <p className="text-[11px] text-slate-400 mt-1">{item.description}</p>
                        </div>
                      </div>

                      <button
                        disabled={!canBuy}
                        onClick={() => onBuyItem(item, cost)}
                        className={`mt-4 w-full py-2 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 ${
                          canBuy
                            ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-slate-950 shadow-md'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        <span>Buy for 💰 {cost}g</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-colors"
          >
            Close Menu
          </button>
        </div>
      </div>
    </div>
  );
};
