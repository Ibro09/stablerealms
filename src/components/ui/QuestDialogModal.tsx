import React, { useState } from 'react';
import { NPC, Quest } from '../../types/game';

interface QuestDialogModalProps {
  npc: NPC;
  quest: Quest | null;
  onClose: () => void;
  onAcceptQuest: (questId: string) => void;
  onCompleteQuest: (questId: string) => void;
  onOpenShop: () => void;
}

export const QuestDialogModal: React.FC<QuestDialogModalProps> = ({
  npc,
  quest,
  onClose,
  onAcceptQuest,
  onCompleteQuest,
  onOpenShop,
}) => {
  const [currentSpeech, setCurrentSpeech] = useState<string>(npc.dialogue.greeting);

  const isQuestReady = quest && quest.status === 'active' && quest.objectives.every((o) => o.current >= o.target);
  const isQuestActive = quest && quest.status === 'active' && !isQuestReady;
  const isQuestAvailable = quest && quest.status === 'available';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-slate-900 border-4 border-amber-500/80 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col">
        {/* Header with NPC Info */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-4 border-b-2 border-amber-500/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Oversized Head Avatar Icon */}
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 border-2 border-white flex items-center justify-center text-3xl shadow-lg">
              {npc.headStyle === 'detective' ? '🤠' : npc.headStyle === 'wizard' ? '🧙‍♂️' : npc.headStyle === 'blacksmith' ? '⚒️' : '🧑‍🌾'}
            </div>
            <div>
              <h3 className="text-lg font-black text-amber-300 flex items-center gap-2">
                <span>{npc.name}</span>
                <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/40">
                  Lvl {npc.level}
                </span>
              </h3>
              <p className="text-xs text-slate-400 font-medium">{npc.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-red-500/80 text-white font-black text-lg flex items-center justify-center transition-colors border border-slate-700"
          >
            ×
          </button>
        </div>

        {/* Speech Text Box */}
        <div className="p-6 bg-slate-900/90 text-slate-200 font-semibold text-sm leading-relaxed border-b border-slate-800 min-h-[100px] flex items-center">
          <p className="italic">"{currentSpeech}"</p>
        </div>

        {/* Active / Available Quest Objective Box */}
        {quest && (
          <div className="px-6 py-4 bg-slate-950/80 border-b border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-amber-400 uppercase tracking-wide">
                {isQuestReady ? '✨ Quest Complete Ready!' : isQuestActive ? '⏳ Active Quest Progress' : '📜 New Quest Available'}
              </span>
              <span className="text-xs font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                💰 {quest.rewardGold}g | ⭐ {quest.rewardExp} EXP
              </span>
            </div>
            <h4 className="text-base font-extrabold text-white">{quest.title}</h4>
            <p className="text-xs text-slate-300 font-normal">{quest.summary}</p>

            {/* Objectives */}
            <div className="space-y-1.5 pt-1">
              {quest.objectives.map((obj) => {
                const done = obj.current >= obj.target;
                return (
                  <div key={obj.id} className="flex items-center justify-between text-xs font-bold bg-slate-900 p-2 rounded-xl border border-slate-800">
                    <span className={done ? 'text-green-400 line-through' : 'text-slate-300'}>
                      {done ? '✅' : '🔴'} {obj.description}
                    </span>
                    <span className={done ? 'text-green-400' : 'text-amber-400'}>
                      {obj.current} / {obj.target}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Branching Dialogue Options / Action Buttons */}
        <div className="p-4 bg-slate-950 flex flex-col gap-2">
          {/* Turn In Quest button if ready */}
          {isQuestReady && (
            <button
              onClick={() => {
                onCompleteQuest(quest.id);
                onClose();
              }}
              className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-slate-950 font-black text-sm rounded-2xl shadow-xl border-2 border-green-300 animate-bounce flex items-center justify-center gap-2"
            >
              <span>🎉 Claim Quest Reward! (+{quest.rewardGold}g)</span>
            </button>
          )}

          {/* Accept Quest button if available */}
          {isQuestAvailable && (
            <button
              onClick={() => {
                onAcceptQuest(quest.id);
                setCurrentSpeech("Thank you! Return to me when you've gathered the required materials.");
              }}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm rounded-2xl shadow-xl border-2 border-amber-300 flex items-center justify-center gap-2"
            >
              <span>📜 Accept Quest: "{quest.title}"</span>
            </button>
          )}

          {/* Dialogue Options */}
          {npc.dialogue.options.map((opt, idx) => (
            <button
              key={idx}
              onClick={() => {
                setCurrentSpeech(opt.response);
                if (opt.action === 'accept_quest' && opt.questId) {
                  onAcceptQuest(opt.questId);
                } else if (opt.action === 'open_shop') {
                  onOpenShop();
                }
              }}
              className="w-full text-left p-3 bg-slate-900 hover:bg-slate-800 text-amber-200 hover:text-amber-300 font-bold text-xs rounded-xl border border-slate-700/80 transition-all flex items-center justify-between group"
            >
              <span>💬 "{opt.text}"</span>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity text-amber-400">➔</span>
            </button>
          ))}

          <button
            onClick={onClose}
            className="w-full py-2.5 mt-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-colors text-center"
          >
            Leave Conversation
          </button>
        </div>
      </div>
    </div>
  );
};
