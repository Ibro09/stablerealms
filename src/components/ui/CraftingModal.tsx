import React, { useState } from 'react';
import { CraftingRecipe, InventoryItem } from '../../types/game';
import { CRAFTING_RECIPES } from '../../game/constants';

interface CraftingModalProps {
  inventory: InventoryItem[];
  playerGold: number;
  onCraft: (recipe: CraftingRecipe) => void;
  onRefillFreeItems?: () => void;
  onClose: () => void;
}

export const CraftingModal: React.FC<CraftingModalProps> = ({
  inventory,
  playerGold,
  onCraft,
  onRefillFreeItems,
  onClose,
}) => {
  const [activeCategory, setActiveCategory] = useState<
    'all' | 'smelting' | 'tools' | 'weapons' | 'cooking' | 'brewing' | 'building'
  >('all');
  const [selectedRecipe, setSelectedRecipe] = useState<CraftingRecipe>(
    CRAFTING_RECIPES[0]
  );
  const [craftMessage, setCraftMessage] = useState<string | null>(null);

  const filteredRecipes =
    activeCategory === 'all'
      ? CRAFTING_RECIPES
      : CRAFTING_RECIPES.filter((r) => r.category === activeCategory);

  const getIngredientCount = (ingredientName: string): number => {
    return inventory.reduce((total, item) => {
      if (item.name.toLowerCase().includes(ingredientName.toLowerCase())) {
        return total + item.count;
      }
      return total;
    }, 0);
  };

  const canCraft = selectedRecipe.ingredients.every(
    (ing) => getIngredientCount(ing.name) >= ing.count
  );

  const handleCraftClick = () => {
    if (!canCraft) return;
    onCraft(selectedRecipe);
    setCraftMessage(`Successfully crafted ${selectedRecipe.result.count}x ${selectedRecipe.name}! ✨`);
    setTimeout(() => setCraftMessage(null), 2500);
  };

  const handleRefillClick = () => {
    if (onRefillFreeItems) {
      onRefillFreeItems();
      setCraftMessage('🎁 Free Materials Stack (+500 All Ores & Logs) added to Inventory!');
      setTimeout(() => setCraftMessage(null), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border-2 border-amber-500/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400 flex items-center justify-center text-xl">
              🛠️
            </div>
            <div>
              <h2 className="text-xl font-black text-amber-400 tracking-wide">
                Blacksmith Forge & Crafting Bench
              </h2>
              <p className="text-xs font-bold text-slate-400">
                Smelt ores, forge weapons, cook meals & brew potions
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onRefillFreeItems && (
              <button
                onClick={handleRefillClick}
                className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:scale-105 text-slate-950 font-black text-xs rounded-xl border border-emerald-300 shadow-md transition-all active:scale-95 flex items-center gap-1.5"
                title="Get 500x free stacks of all materials & ores"
              >
                <span>🎁</span> Get Free Items (+500 All)
              </button>
            )}
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-black text-lg flex items-center justify-center border border-slate-700 transition-transform active:scale-95"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="px-6 py-3 bg-slate-950/60 border-b border-slate-800/80 flex flex-wrap gap-2">
          {[
            { id: 'all', label: 'All Recipes', icon: '📜' },
            { id: 'smelting', label: 'Smelting', icon: '🧱' },
            { id: 'tools', label: 'Tools', icon: '⛏️' },
            { id: 'weapons', label: 'Weapons', icon: '⚔️' },
            { id: 'cooking', label: 'Cooking', icon: '🍲' },
            { id: 'brewing', label: 'Brewing', icon: '🧪' },
            { id: 'building', label: 'Building', icon: '⛺' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeCategory === cat.id
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black shadow-md'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 border border-slate-700'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Modal Body: Recipe List (Left) & Recipe Details / Crafting Forge (Right) */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 p-6 gap-6">
          {/* Left: Recipe List */}
          <div className="md:col-span-5 overflow-y-auto space-y-2.5 pr-2 max-h-[50vh] md:max-h-[58vh]">
            {filteredRecipes.map((recipe) => {
              const recipeCanCraft = recipe.ingredients.every(
                (ing) => getIngredientCount(ing.name) >= ing.count
              );
              const isSelected = selectedRecipe.id === recipe.id;

              return (
                <div
                  key={recipe.id}
                  onClick={() => setSelectedRecipe(recipe)}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-amber-950/40 border-amber-500 shadow-lg ring-1 ring-amber-500'
                      : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-xl shadow-inner">
                      {recipe.icon}
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-100">
                        {recipe.name}
                      </h4>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        {recipe.category}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {recipeCanCraft ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-700 text-[10px] font-black">
                        Ready
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-slate-900 text-slate-400 border border-slate-700 text-[10px] font-bold">
                        Missing
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right: Recipe Crafting Details */}
          <div className="md:col-span-7 bg-slate-950/60 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center gap-4 pb-4 border-b border-slate-800">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border-2 border-amber-500/60 flex items-center justify-center text-3xl shadow-xl">
                  {selectedRecipe.icon}
                </div>
                <div>
                  <h3 className="text-lg font-black text-amber-300">
                    {selectedRecipe.name}
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {selectedRecipe.description}
                  </p>
                </div>
              </div>

              {/* Required Ingredients */}
              <div className="mt-4">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                  Required Ingredients
                </h4>
                <div className="space-y-2">
                  {selectedRecipe.ingredients.map((ing, idx) => {
                    const currentCount = getIngredientCount(ing.name);
                    const isEnough = currentCount >= ing.count;

                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/90 border border-slate-800"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-lg">{ing.icon}</span>
                          <span className="text-xs font-bold text-slate-200">
                            {ing.name}
                          </span>
                        </div>
                        <div className="text-xs font-black font-mono">
                          <span
                            className={
                              isEnough ? 'text-emerald-400' : 'text-red-400'
                            }
                          >
                            {currentCount}
                          </span>
                          <span className="text-slate-500"> / {ing.count}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Craft Message Banner */}
            {craftMessage && (
              <div className="mt-3 p-2.5 rounded-xl bg-emerald-950/90 border border-emerald-500 text-emerald-300 text-xs font-bold text-center animate-bounce">
                {craftMessage}
              </div>
            )}

            {/* Action Craft Button */}
            <div className="mt-5 pt-4 border-t border-slate-800">
              <button
                onClick={handleCraftClick}
                disabled={!canCraft}
                className={`w-full py-3 rounded-2xl text-sm font-black tracking-wide shadow-xl transition-all flex items-center justify-center gap-2 ${
                  canCraft
                    ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 hover:scale-[1.02] active:scale-95 border-2 border-amber-300'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                }`}
              >
                <span>🛠️</span>
                <span>
                  {canCraft
                    ? `Craft ${selectedRecipe.name}`
                    : 'Missing Required Materials'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
