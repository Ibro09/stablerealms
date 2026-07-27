import React from "react";
import { PlayerStats } from "../../types/game";

interface MMORPGHeaderProps {
  stats: PlayerStats;
  timeOfDay: "day" | "sunset" | "night";
  onToggleTimeOfDay: () => void;
  onRotateCamera: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onOpenCustomizer: () => void;
  onOpenWagonScene: () => void;
}

export const MMORPGHeader: React.FC<MMORPGHeaderProps> = ({
  stats,
  timeOfDay,
  onToggleTimeOfDay,
  onRotateCamera,
  onZoomIn,
  onZoomOut,
  onOpenCustomizer,
  onOpenWagonScene,
}) => {
  const hpPercent = Math.min(100, Math.round((stats.hp / stats.maxHp) * 100));
  const expPercent = Math.min(
    100,
    Math.round((stats.exp / stats.maxExp) * 100),
  );

  return (
    <header className="absolute top-0 left-0 right-0 p-2 sm:p-3 flex flex-wrap items-center justify-between gap-2 sm:gap-3 z-30 pointer-events-none">
      {/* Top Left: Player Avatar, HP, Stamina, EXP */}
      <div className="flex items-center gap-2 sm:gap-3 bg-slate-950/90 backdrop-blur-md p-2 sm:p-2.5 rounded-2xl border-2 border-amber-500/80 shadow-2xl pointer-events-auto">
        <button
          onClick={onOpenCustomizer}
          className="relative w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center border-2 border-white shadow-md hover:scale-105 transition-transform shrink-0"
          title="Click to customize character"
        >
          <span className="text-lg sm:text-2xl">
            {stats.headStyle === "detective"
              ? "🤠"
              : stats.headStyle === "wizard"
                ? "🧙‍♂️"
                : "🧝"}
          </span>
        
        </button>

        <div className="flex flex-col min-w-[110px] sm:min-w-[150px]">
          <div className="flex items-center justify-between text-xs font-black text-amber-200">
            <span className="truncate max-w-[70px] sm:max-w-none">{stats.name}</span>
            <span className="text-[9px] sm:text-[10px] text-amber-400/80 ml-1">
              [{stats.title}]
            </span>
          </div>

          <div className="w-full bg-slate-800 h-2 sm:h-2.5 rounded-full mt-1 overflow-hidden border border-slate-700 relative">
            <div
              className="bg-gradient-to-r from-red-500 to-pink-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${hpPercent}%` }}
            />
          </div>

          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1 overflow-hidden border border-slate-700 relative">
            <div
              className="bg-gradient-to-r from-amber-400 to-yellow-300 h-full rounded-full transition-all duration-300"
              style={{ width: `${expPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[9px] sm:text-[10px] text-slate-300 font-bold mt-0.5">
            <span>EXP: {stats.exp}</span>
          </div>
        </div>
      </div>

      {/* Top Center: Camera Controls & Time of Day — hidden on mobile */}
      <div className="hidden sm:flex items-center gap-2 bg-slate-900/90 backdrop-blur-md p-2 rounded-2xl border-2 border-slate-700 shadow-xl pointer-events-auto">
        <button
          onClick={onRotateCamera}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-xl text-xs font-black flex items-center gap-1 shadow-md border border-slate-600 transition-all hover:scale-105"
        >
          <span>🔄</span> Rotate View
        </button>
        <button
          onClick={onZoomIn}
          className="w-8 h-8 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-xl font-black text-sm flex items-center justify-center border border-slate-600 shadow-md"
        >
          +
        </button>
        <button
          onClick={onZoomOut}
          className="w-8 h-8 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-xl font-black text-sm flex items-center justify-center border border-slate-600 shadow-md"
        >
          -
        </button>
        <div className="h-5 w-px bg-slate-700 mx-1" />
        <button
          onClick={onToggleTimeOfDay}
          className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-xl text-xs font-black flex items-center gap-1.5 border border-amber-500/40 transition-all"
        >
          <span>
            {timeOfDay === "day"
              ? "☀️ Day"
              : timeOfDay === "sunset"
                ? "🌅 Sunset"
                : "🌙 Night"}
          </span>
        </button>
      </div>

      {/* Mobile: compact zoom + rotate row */}
      <div className="flex sm:hidden items-center gap-1.5 bg-slate-900/90 backdrop-blur-md px-2 py-1.5 rounded-2xl border border-slate-700 shadow-xl pointer-events-auto">
        <button
          onClick={onRotateCamera}
          className="w-8 h-8 bg-slate-800 text-amber-300 rounded-xl font-black text-base flex items-center justify-center border border-slate-600 shadow-md"
        >🔄</button>
        <button
          onClick={onZoomIn}
          className="w-8 h-8 bg-slate-800 text-amber-300 rounded-xl font-black text-sm flex items-center justify-center border border-slate-600"
        >+</button>
        <button
          onClick={onZoomOut}
          className="w-8 h-8 bg-slate-800 text-amber-300 rounded-xl font-black text-sm flex items-center justify-center border border-slate-600"
        >-</button>
        <button
          onClick={onToggleTimeOfDay}
          className="w-8 h-8 bg-amber-500/20 text-amber-300 rounded-xl text-base flex items-center justify-center border border-amber-500/40"
        >
          {timeOfDay === "day" ? "☀️" : timeOfDay === "sunset" ? "🌅" : "🌙"}
        </button>
      </div>

      {/* Top Right: Quick Actions */}
      <div className="hidden sm:flex items-center gap-2 pointer-events-auto">
        <button
          onClick={onOpenCustomizer}
          className="p-2 rounded-2xl font-black text-xs flex items-center justify-center shadow-xl transition-all bg-slate-900/90 hover:bg-slate-800 text-amber-300 border-2 border-slate-700"
          title="Customize Character Avatar"
        >
          🎨
        </button>
      </div>
    </header>
  );
};
