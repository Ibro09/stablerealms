import React from 'react';
import { Quest } from '../../types/game';

interface WagonSceneModalProps {
  quest: Quest | undefined;
  onClose: () => void;
  onInspectClue: () => void;
}

export const WagonSceneModal: React.FC<WagonSceneModalProps> = ({
  quest,
  onClose,
  onInspectClue,
}) => {
  const isInspected = quest?.objectives[0]?.current! >= 1;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-slate-900 border-4 border-yellow-500 rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col">
        {/* Banner header with Caution stripes */}
        <div className="bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-500 p-4 text-slate-950 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <span className="text-3xl">⚠️</span>
            <div>
              <h3 className="text-xl font-black uppercase tracking-wider">The Wagon Crime Scene</h3>
              <p className="text-xs font-bold text-slate-900">Official Investigation by Detective Barnaby [Screenshot 1 Inspo]</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-black text-lg flex items-center justify-center transition-colors"
          >
            ×
          </button>
        </div>

        {/* Scene description & visual clues */}
        <div className="p-6 space-y-4 text-slate-200">
          <div className="p-4 bg-slate-950/80 rounded-2xl border-2 border-yellow-500/30 space-y-2">
            <h4 className="text-sm font-black text-yellow-400 flex items-center gap-2">
              <span>🔎</span> Crime Scene Report: Forest Wagon Road
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              A heavy wooden merchant wagon with a brown arched canvas roof has been stranded on the cobblestone path. Yellow police caution tape surrounds the perimeter to keep curious villagers and player bots at bay.
            </p>
          </div>

          {/* Clues Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 flex flex-col justify-between">
              <div>
                <span className="text-xs font-black text-amber-300">Clue #1: The Axle Cut</span>
                <p className="text-[11px] text-slate-300 mt-1">
                  The rear right wheel was severed with a sharp iron tool! It wasn't an accident—someone wanted this wagon stopped.
                </p>
              </div>
              <span className="text-[10px] text-green-400 font-bold mt-2">✅ Inspected by Barnaby</span>
            </div>

            <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 flex flex-col justify-between">
              <div>
                <span className="text-xs font-black text-amber-300">Clue #2: Green Slime Residue</span>
                <p className="text-[11px] text-slate-300 mt-1">
                  Strange glowing slime tracks lead towards the eastern riverbank. A goblin or forest slime was carrying something heavy!
                </p>
              </div>
              <span className="text-[10px] text-amber-400 font-bold mt-2">⏳ Needs Timber Repairs</span>
            </div>
          </div>

          {/* Action button */}
          <div className="pt-2">
            {!isInspected ? (
              <button
                onClick={onInspectClue}
                className="w-full py-3 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-black text-sm rounded-2xl shadow-xl border-2 border-white flex items-center justify-center gap-2 animate-bounce"
              >
                <span>🔍 Inspect Axle & Complete Investigation Objective!</span>
              </button>
            ) : (
              <div className="p-3 bg-green-500/20 border border-green-500/50 rounded-2xl text-center text-xs font-bold text-green-300">
                ✅ Crime Scene Inspected! Bring 5 Oak Timber Logs to Detective Barnaby to finish repairs.
              </div>
            )}
          </div>
        </div>

        <div className="p-4 bg-slate-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-colors"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};
