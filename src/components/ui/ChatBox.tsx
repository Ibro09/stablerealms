import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, PlayerStats } from '../../types/game';

interface ChatBoxProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  stats: PlayerStats;
}

export const ChatBox: React.FC<ChatBoxProps> = ({
  messages,
  onSendMessage,
  stats,
}) => {
  const [input, setInput] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isExpanded) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isExpanded]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSendMessage(input.trim());
    setInput('');
  };

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="absolute bottom-20 left-4 bg-slate-900/90 hover:bg-slate-800 text-amber-300 font-black text-xs px-3.5 py-2 rounded-2xl border-2 border-amber-500/80 shadow-2xl flex items-center gap-2 z-20 transition-all hover:scale-105"
      >
        <span>💬</span> Open Village Chat <span className="bg-amber-500 text-slate-950 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold">{messages.length}</span>
      </button>
    );
  }

  return (
    <div className="absolute bottom-20 left-4 w-80 md:w-96 bg-slate-950/90 backdrop-blur-md rounded-2xl border-2 border-slate-700 shadow-2xl flex flex-col overflow-hidden z-20 transition-all max-h-64">
      {/* Header */}
      <div className="bg-slate-900/90 px-3 py-1.5 border-b border-slate-800 flex items-center justify-between text-xs font-black text-slate-300">
        <div className="flex items-center gap-1.5">
          <span className="text-amber-400">💬</span> Village Square Chat & Emotes
        </div>
        <button
          onClick={() => setIsExpanded(false)}
          className="hover:text-amber-400 font-bold px-1.5 rounded transition-colors"
          title="Minimize Chat"
        >
          _
        </button>
      </div>

      {/* Messages Feed */}
      <div className="p-2.5 flex-1 overflow-y-auto space-y-1.5 text-xs font-medium">
        {messages.map((msg) => {
          const isSystem = msg.senderRole === 'System';
          const isPlayer = msg.senderRole === 'Player';
          return (
            <div key={msg.id} className={`leading-relaxed ${isSystem ? 'bg-amber-500/10 p-1.5 rounded-lg border border-amber-500/20 text-amber-200 text-[11px] font-bold' : ''}`}>
              {!isSystem && (
                <span className={`font-black mr-1 ${
                  isPlayer ? 'text-amber-400' : msg.senderRole === 'Bot' ? 'text-purple-400' : 'text-green-400'
                }`}>
                  [{msg.senderRole || 'Player'}] {msg.sender}:
                </span>
              )}
              <span className={isSystem ? 'text-amber-300' : 'text-slate-200'}>{msg.text}</span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-1.5 bg-slate-900/90 border-t border-slate-800 flex gap-1">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type message or /wave, /dance..."
          maxLength={80}
          className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-medium"
        />
        <button
          type="submit"
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-3 py-1 rounded-xl transition-colors shadow-md"
        >
          Send
        </button>
      </form>
    </div>
  );
};
