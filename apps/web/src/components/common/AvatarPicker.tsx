import React from 'react';
import { PLAYER_COLORS } from '@party-draw/shared';

const AVATAR_EMOJIS = ['🦊', '🐼', '🦁', '🐸', '🦄', '🐙', '🚀', '⭐', '🍕', '🎮', '🥑', '👾'];

interface AvatarPickerProps {
  selectedAvatar: string;
  selectedColor: string;
  onSelectAvatar: (avatar: string) => void;
  onSelectColor: (color: string) => void;
}

export const AvatarPicker: React.FC<AvatarPickerProps> = ({
  selectedAvatar,
  selectedColor,
  onSelectAvatar,
  onSelectColor
}) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
          Elegí tu ícono
        </label>
        <div className="grid grid-cols-6 gap-2">
          {AVATAR_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => onSelectAvatar(emoji)}
              className={`text-2xl p-2 rounded-xl border transition-all ${
                selectedAvatar === emoji
                  ? 'border-indigo-500 bg-indigo-500/20 scale-110 shadow-md shadow-indigo-500/20'
                  : 'border-slate-800 bg-slate-900/50 hover:bg-slate-800/80'
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
          Elegí tu color
        </label>
        <div className="flex flex-wrap gap-2.5">
          {PLAYER_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => onSelectColor(color)}
              style={{ backgroundColor: color }}
              className={`w-8 h-8 rounded-full border-2 transition-transform ${
                selectedColor === color
                  ? 'border-white scale-125 shadow-lg shadow-black/50'
                  : 'border-transparent hover:scale-110 opacity-80'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
