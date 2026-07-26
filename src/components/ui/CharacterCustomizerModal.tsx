import React, { useState } from 'react';
import { PlayerStats } from '../../types/game';

interface CharacterCustomizerModalProps {
  stats: PlayerStats;
  onClose: () => void;
  onUpdateStats: (newStats: Partial<PlayerStats>) => void;
}

const HEAD_STYLES = [
  { id: 'villager', name: 'Cozy Villager', icon: '🧑‍🌾', desc: 'Standard peaceful builder head' },
  { id: 'detective', name: 'Sheriff Detective', icon: '🤠', desc: 'Royal investigator hat from Screenshot 1' },
  { id: 'wizard', name: 'Mystic Wizard', icon: '🧙‍♂️', desc: 'Pointy purple hat for arcane builders' },
  { id: 'blacksmith', name: 'Master Smith', icon: '⚒️', desc: 'Heavy brow and rugged apron style' },
  { id: 'elf', name: 'Forest Elf', icon: '🧝', desc: 'Pointy ears and forest ranger spirit' },
];

const OUTFIT_COLORS = [
  { name: 'Cozy Orange', hex: '#ea580c' },
  { name: 'Royal Blue', hex: '#1d4ed8' },
  { name: 'Forest Green', hex: '#047857' },
  { name: 'Crimson Red', hex: '#b91c1c' },
  { name: 'Slate Knight', hex: '#1e293b' },
  { name: 'Mystic Purple', hex: '#6d28d9' },
  { name: 'Sun Golden', hex: '#d97706' },
];

const TITLES = [
  'Voxel Architect',
  'Royal Detective',
  'Town Council Member',
  'Master Mining Engineer',
  'Cozy Homestead Builder',
  'Pixel Lore Seeker',
];

export const CharacterCustomizerModal: React.FC<CharacterCustomizerModalProps> = ({
  stats,
  onClose,
  onUpdateStats,
}) => {
  const [name, setName] = useState(stats.name);
  const [headStyle, setHeadStyle] = useState(stats.headStyle);
  const [outfitColor, setOutfitColor] = useState(stats.outfitColor);
  const [title, setTitle] = useState(stats.title);

  const handleSave = () => {
    onUpdateStats({ name: name || 'CozyBuilder', headStyle, outfitColor, title });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-slate-900 border-4 border-amber-500 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 p-4 text-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-2 font-black text-lg">
            <span>🎨</span> Customize Voxel Avatar
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-slate-950 text-white font-black text-lg flex items-center justify-center">
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
          {/* Avatar Preview Card */}
          <div className="p-4 bg-slate-950 rounded-2xl border-2 border-slate-800 flex items-center gap-4">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl shadow-xl border-4 border-black"
              style={{ backgroundColor: outfitColor }}
            >
              {HEAD_STYLES.find((h) => h.id === headStyle)?.icon || '🧑‍🌾'}
            </div>
            <div>
              <h3 className="text-base font-black text-white">{name || 'Unnamed Player'}</h3>
              <span className="text-xs text-amber-400 font-bold">[{title}]</span>
              <p className="text-[11px] text-slate-400 mt-1">Oversized square head with rectangular body & thick black outlines.</p>
            </div>
          </div>

          {/* Name & Title Inputs */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Player Character Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={16}
                className="w-full bg-slate-950 border-2 border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-bold focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">RPG Honor Title</label>
              <select
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-950 border-2 border-slate-700 rounded-xl px-3 py-2 text-sm text-amber-300 font-bold focus:border-amber-400 focus:outline-none"
              >
                {TITLES.map((t, i) => (
                  <option key={i} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Head Style Grid */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-2">Oversized Head Style</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {HEAD_STYLES.map((hs) => (
                <button
                  key={hs.id}
                  onClick={() => setHeadStyle(hs.id)}
                  className={`p-2.5 rounded-xl border-2 flex items-center gap-2 text-left transition-all ${
                    headStyle === hs.id
                      ? 'bg-amber-500/20 border-amber-400 text-white font-black scale-105 shadow-md'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600 font-bold'
                  }`}
                >
                  <span className="text-2xl">{hs.icon}</span>
                  <div>
                    <div className="text-xs leading-tight">{hs.name}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Outfit Color Swatches */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-2">Rectangular Body Color</label>
            <div className="flex flex-wrap gap-2.5">
              {OUTFIT_COLORS.map((col) => (
                <button
                  key={col.name}
                  onClick={() => setOutfitColor(col.hex)}
                  className={`w-9 h-9 rounded-xl border-2 transition-all ${
                    outfitColor === col.hex ? 'border-white scale-125 ring-2 ring-amber-400 shadow-lg' : 'border-black hover:scale-110'
                  }`}
                  style={{ backgroundColor: col.hex }}
                  title={col.name}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Save Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end gap-2">
          <button onClick={onClose} className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl">
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black text-xs rounded-xl shadow-lg scale-105"
          >
            Save Voxel Character
          </button>
        </div>
      </div>
    </div>
  );
};
