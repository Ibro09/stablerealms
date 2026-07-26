import React, { useState } from 'react';
import { DailyQuest } from '../../types/game';

interface DailyQuestsModalProps {
  dailyQuests: DailyQuest[];
  onClaimReward: (questId: string) => void;
  onClose: () => void;
}

export const DailyQuestsModal: React.FC<DailyQuestsModalProps> = ({
  dailyQuests,
  onClaimReward,
  onClose,
}) => {
  const [openGuideId, setOpenGuideId] = useState<string | null>(null);

  const completedCount = dailyQuests.filter((q) => q.completed).length;
  const totalCount = dailyQuests.length;

  const toggleGuide = (id: string) => {
    setOpenGuideId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-slate-900 border-2 border-amber-500/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400 flex items-center justify-center text-xl">
              📋
            </div>
            <div>
              <h2 className="text-xl font-black text-amber-400 tracking-wide flex items-center gap-2">
                <span>Daily Quests & Bounties</span>
                <span className="bg-amber-950/80 text-amber-300 text-xs px-2 py-0.5 rounded-full border border-amber-700 font-mono">
                  {completedCount} / {totalCount} Completed
                </span>
              </h2>
              <p className="text-xs font-bold text-slate-400">
                Click any task dropdown menu below to view step-by-step instructions!
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-black text-lg flex items-center justify-center border border-slate-700 transition-transform active:scale-95"
          >
            ✕
          </button>
        </div>

        {/* Quest List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3.5 max-h-[68vh]">
          {dailyQuests.map((quest) => {
            const progressPct = Math.min(
              100,
              Math.round((quest.current / quest.target) * 100)
            );
            const canClaim = quest.completed && !quest.claimed;
            const isGuideOpen = openGuideId === quest.id;

            return (
              <div
                key={quest.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col gap-3 ${
                  quest.claimed
                    ? 'bg-slate-950/60 border-slate-800/80 opacity-75'
                    : canClaim
                    ? 'bg-amber-950/40 border-amber-500 shadow-lg ring-1 ring-amber-500'
                    : 'bg-slate-800/60 border-slate-700/80'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5 flex-1">
                    <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center text-2xl shadow-inner shrink-0">
                      {quest.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-black text-slate-100">
                          {quest.title}
                        </h4>
                        {quest.claimed ? (
                          <span className="bg-slate-900 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-md border border-slate-800">
                            Claimed
                          </span>
                        ) : quest.completed ? (
                          <span className="bg-emerald-950 text-emerald-400 text-[10px] font-black px-2 py-0.5 rounded-md border border-emerald-700 animate-pulse">
                            Ready to Claim!
                          </span>
                        ) : null}
                      </div>
                      <p className="text-xs text-slate-300 mt-0.5 line-clamp-2">
                        {quest.summary}
                      </p>

                      {/* Progress Bar */}
                      <div className="mt-2.5 w-full">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 mb-1">
                          <span>Progress</span>
                          <span className="font-mono text-amber-300">
                            {quest.current} / {quest.target} ({progressPct}%)
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-700/80 shadow-inner">
                          <div
                            className={`h-full transition-all duration-300 ${
                              quest.completed
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                                : 'bg-gradient-to-r from-amber-500 to-yellow-400'
                            }`}
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Reward, Dropdown & Claim Button */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800">
                    <div className="text-right">
                      <div className="text-xs font-black text-amber-400 flex items-center gap-1 justify-end">
                        <span>💰 +{quest.rewardGold} Gold</span>
                      </div>
                      <div className="text-[10px] font-bold text-slate-400">
                        +{quest.rewardExp} EXP
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Dropdown Menu Toggle Button */}
                      <button
                        onClick={() => toggleGuide(quest.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1 border transition-all ${
                          isGuideOpen
                            ? 'bg-amber-500 text-slate-950 border-white shadow-md'
                            : 'bg-slate-900 text-amber-300 border-slate-700 hover:bg-slate-800'
                        }`}
                        title="Click to view step-by-step instructions"
                      >
                        <span>📖 Guide</span>
                        <span>{isGuideOpen ? '▲' : '▼'}</span>
                      </button>

                      {canClaim ? (
                        <button
                          onClick={() => onClaimReward(quest.id)}
                          className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:scale-105 text-slate-950 font-black text-xs rounded-xl shadow-lg border border-emerald-300 transition-all active:scale-95"
                        >
                          Claim! 🎁
                        </button>
                      ) : quest.claimed ? (
                        <span className="text-xs font-bold text-slate-500 italic">
                          Done ✓
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* Collapsible Guide Dropdown Menu */}
                {isGuideOpen && quest.guideSteps && (
                  <div className="mt-2 p-3.5 bg-slate-950/90 rounded-xl border border-amber-500/40 space-y-2 animate-fade-in">
                    <div className="flex items-center gap-2 text-xs font-black text-amber-400 border-b border-slate-800 pb-1.5">
                      <span>💡 How to Complete:</span>
                      <span className="text-slate-400 text-[11px] font-semibold">
                        ({quest.title})
                      </span>
                    </div>
                    <div className="space-y-1.5 pl-1">
                      {quest.guideSteps.map((step, idx) => (
                        <div
                          key={idx}
                          className="text-xs text-slate-200 font-medium flex items-start gap-2 leading-relaxed"
                        >
                          <span className="text-amber-400 font-bold shrink-0">
                            •
                          </span>
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
