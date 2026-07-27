import React, { useState } from 'react';

export interface MiniTask {
  id: string;
  title: string;
  description: string;
  icon: string;
  rewardExp: number;
  completed: boolean;
}

interface MiniTasksWidgetProps {
  tasks: MiniTask[];
  onCompleteTask: (taskId: string) => void;
}

export const MiniTasksWidget: React.FC<MiniTasksWidgetProps> = ({ tasks, onCompleteTask }) => {
  const [isCollapsed, setIsCollapsed] = useState(
    () => typeof window !== "undefined" && window.innerWidth < 640
  );

  return (
    <div className="fixed top-[80px] sm:top-[100px] left-2 z-30 flex flex-col gap-2 font-sans select-none animate-fade-in max-w-[min(92vw,20rem)]">
      {/* Widget Header Toggle */}
      <div
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex items-center justify-between gap-3 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 px-3.5 py-2 rounded-2xl border-2 border-white shadow-xl cursor-pointer transition-all hover:scale-105 active:scale-95"
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">📋</span>
          <div className="flex flex-col">
            <span className="font-black text-xs uppercase tracking-wider text-slate-950">Mini Tasks (+10 XP)</span>
            <span className="text-[10px] font-bold text-slate-900/90">Quick Village Micro-Quests</span>
          </div>
        </div>
        <span className="text-xs font-black text-slate-950 bg-white/40 px-2 py-0.5 rounded-full">
          {isCollapsed ? '▶ Show' : '▼ Hide'}
        </span>
      </div>

      {/* Task List */}
      {!isCollapsed && (
        <div className="flex flex-col gap-2 max-w-xs bg-slate-950/90 backdrop-blur-md p-3 rounded-2xl border-2 border-amber-500/70 shadow-2xl">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`flex items-center justify-between gap-2 p-2.5 rounded-xl border transition-all ${
                task.completed
                  ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300'
                  : 'bg-slate-900/80 border-slate-700/80 text-slate-200 hover:border-amber-400/80'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-2xl p-1 bg-slate-800/80 rounded-lg border border-slate-700">{task.icon}</span>
                <div className="flex flex-col">
                  <span className="text-xs font-black text-amber-300 flex items-center gap-1">
                    {task.title}
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950 px-1.5 py-0.2 rounded-full border border-emerald-600/60">
                      +{task.rewardExp} XP
                    </span>
                  </span>
                  <span className="text-[11px] font-medium text-slate-400 leading-tight mt-0.5">
                    {task.description}
                  </span>
                </div>
              </div>

              {task.completed ? (
                <button
                  onClick={() => onCompleteTask(task.id)}
                  className="text-[10px] font-black bg-gradient-to-r from-emerald-400 via-amber-400 to-emerald-500 text-slate-950 px-2.5 py-1.5 rounded-lg border-2 border-white transition-all hover:scale-110 active:scale-95 shrink-0 animate-bounce shadow-lg shadow-emerald-500/40"
                >
                  🎁 Claim!
                </button>
              ) : (
                <span className="text-[10px] font-bold text-slate-400 bg-slate-900/90 border border-slate-800 px-2.5 py-1 rounded-lg shrink-0 flex items-center gap-1">
                  <span>⏳</span> 0/1
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
