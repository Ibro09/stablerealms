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
  gameMode?: "survival" | "fighting";
  onSetSurvival?: () => void;
  onSetFighting?: () => void;
}

export const MMORPGHeader: React.FC<MMORPGHeaderProps> = ({
  stats,
  timeOfDay,
  onToggleTimeOfDay,
  onRotateCamera,
  onZoomIn,
  onZoomOut,
  onOpenCustomizer,
  gameMode,
  onSetSurvival,
  onSetFighting,
}) => {
  const hpPercent = Math.min(100, Math.round((stats.hp / stats.maxHp) * 100));
  const expPercent = Math.min(100, Math.round((stats.exp / stats.maxExp) * 100));

  return (
    <header className="absolute top-0 left-0 right-0 z-30 pointer-events-none">
      {/* ── Single row for all screen sizes ── */}
      <div className="flex items-center gap-2 p-2 pointer-events-auto">

        {/* Player card */}
        <div className="flex items-center gap-2 bg-slate-950/90 backdrop-blur-md p-1.5 sm:p-2.5 rounded-2xl border-2 border-amber-500/80 shadow-2xl shrink-0">
          <button
            onClick={onOpenCustomizer}
            className="w-8 h-8 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center border-2 border-white shadow-md shrink-0"
          >
            <span className="text-base sm:text-xl">
              {stats.headStyle === "detective" ? "🤠" : stats.headStyle === "wizard" ? "🧙‍♂️" : "🧝"}
            </span>
          </button>

          <div className="flex flex-col w-[100px] sm:w-[150px]">
            <div className="flex items-center justify-between text-[10px] sm:text-xs font-black text-amber-200">
              <span className="truncate">{stats.name}</span>
              <span className="text-[9px] text-amber-400/80 ml-1 hidden sm:inline">[{stats.title}]</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full mt-1 overflow-hidden border border-slate-700">
              <div className="bg-gradient-to-r from-red-500 to-pink-500 h-full rounded-full transition-all duration-300" style={{ width: `${hpPercent}%` }} />
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-0.5 overflow-hidden border border-slate-700">
              <div className="bg-gradient-to-r from-amber-400 to-yellow-300 h-full rounded-full transition-all duration-300" style={{ width: `${expPercent}%` }} />
            </div>
            <span className="text-[9px] text-slate-300 font-bold mt-0.5">EXP: {stats.exp}</span>
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Mode toggle — visible on mobile */}
        {gameMode !== undefined && onSetSurvival && onSetFighting && (
          <div className="flex items-center bg-slate-950/90 backdrop-blur-md p-1 rounded-xl border border-slate-700 shadow-inner shrink-0">
            <button
              onClick={onSetSurvival}
              className={`px-2 py-1 rounded-lg font-black text-xs flex items-center gap-1 transition-all ${gameMode === "survival" ? "bg-emerald-500 text-slate-950" : "text-slate-300 hover:bg-slate-800"}`}
            >
              <span>🌿</span>
              <span className="hidden sm:inline">Survival</span>
            </button>
            <button
              onClick={onSetFighting}
              className={`px-2 py-1 rounded-lg font-black text-xs flex items-center gap-1 transition-all ${gameMode === "fighting" ? "bg-red-600 text-white animate-pulse" : "text-slate-300 hover:bg-slate-800"}`}
            >
              <span>⚔️</span>
              <span className="hidden sm:inline">Fight</span>
            </button>
          </div>
        )}

        {/* Camera + time controls */}
        <div className="flex items-center gap-1 sm:gap-1.5 bg-slate-900/90 backdrop-blur-md px-1.5 sm:px-2 py-1.5 rounded-2xl border border-slate-700 shadow-xl shrink-0">
          <button onClick={onRotateCamera} className="w-8 h-8 bg-slate-800 text-amber-300 rounded-xl font-black text-base flex items-center justify-center border border-slate-600">🔄</button>
          <button onClick={onZoomIn}       className="w-8 h-8 bg-slate-800 text-amber-300 rounded-xl font-black text-sm  flex items-center justify-center border border-slate-600">+</button>
          <button onClick={onZoomOut}      className="w-8 h-8 bg-slate-800 text-amber-300 rounded-xl font-black text-sm  flex items-center justify-center border border-slate-600">−</button>
          <button onClick={onToggleTimeOfDay} className="w-8 h-8 bg-amber-500/20 text-amber-300 rounded-xl text-base flex items-center justify-center border border-amber-500/40">
            {timeOfDay === "day" ? "☀️" : timeOfDay === "sunset" ? "🌅" : "🌙"}
          </button>
        </div>
      </div>
    </header>
  );
};

