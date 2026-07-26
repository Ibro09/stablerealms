import React, { useEffect } from 'react';
import { InventoryItem } from '../../types/game';

interface HotbarProps {
  items: InventoryItem[];
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
  activeMode: 'mine' | 'build' | 'interact';
  onToggleMode: (mode: 'mine' | 'build' | 'interact') => void;
}

export const Hotbar: React.FC<HotbarProps> = ({
  items,
  selectedIndex,
  onSelectIndex,
  activeMode,
  onToggleMode,
}) => {
  // Keyboard shortcut listener for slots 1-9
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= 9) {
        onSelectIndex(num - 1);
      } else if (e.key === 'q' || e.key === 'Q') {
        onToggleMode('mine');
      } else if (e.key === 'e' || e.key === 'E') {
        onToggleMode('build');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSelectIndex, onToggleMode]);

  const slots = Array.from({ length: 9 }, (_, i) => items[i] || null);

  return (
    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-2 z-30">
      {/* Mode Selector Toggle Buttons */}
      <div className="flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-2xl border-2 border-slate-700 shadow-2xl">
        <button
          onClick={() => onToggleMode('mine')}
          className={`px-3 py-1 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-md ${
            activeMode === 'mine'
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 scale-105 ring-2 ring-amber-300'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          <span>⛏️</span> Mine / Tool <span className="opacity-60 text-[10px] ml-1">[Q]</span>
        </button>
        <button
          onClick={() => onToggleMode('build')}
          className={`px-3 py-1 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-md ${
            activeMode === 'build'
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 scale-105 ring-2 ring-amber-300'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          <span>🧱</span> Build Mode <span className="opacity-60 text-[10px] ml-1">[E]</span>
        </button>
        <button
          onClick={() => onToggleMode('interact')}
          className={`px-3 py-1 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-md ${
            activeMode === 'interact'
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 scale-105 ring-2 ring-amber-300'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          <span>💬</span> Interact / Lore
        </button>
      </div>

      {/* 9-Slot Hotbar Grid */}
      <div className="flex items-center gap-1.5 bg-slate-950/90 backdrop-blur-lg p-2 rounded-2xl border-4 border-amber-500/80 shadow-2xl">
        {slots.map((item, idx) => {
          const isSelected = selectedIndex === idx;
          return (
            <button
              key={idx}
              onClick={() => onSelectIndex(idx)}
              className={`relative w-12 h-12 rounded-xl flex flex-col items-center justify-center transition-all duration-150 group select-none ${
                isSelected
                  ? 'bg-gradient-to-br from-amber-400 to-orange-500 border-2 border-white scale-110 -translate-y-1 shadow-lg ring-2 ring-amber-300'
                  : 'bg-slate-900/90 border-2 border-slate-700/80 hover:bg-slate-800 hover:border-slate-500'
              }`}
              title={item ? `${item.name} (${item.description})` : 'Empty Slot'}
            >
              {/* Slot Number Badge */}
              <span
                className={`absolute top-0.5 left-1 text-[10px] font-black ${
                  isSelected ? 'text-slate-950 font-extrabold' : 'text-slate-400'
                }`}
              >
                {idx + 1}
              </span>

              {/* Item Icon */}
              {item ? (
                <>
                  <span className="text-2xl transform transition-transform group-hover:scale-110">
                    {item.icon}
                  </span>
                  {/* Item Count */}
                  {item.type === 'block' && (
                    <span
                      className={`absolute bottom-0.5 right-1 text-xs font-black px-1 rounded ${
                        isSelected ? 'bg-slate-950/80 text-amber-300' : 'bg-slate-950/90 text-white'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-slate-700 text-xs font-bold">•</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
