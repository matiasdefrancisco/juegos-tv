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
        <span
          className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2"
          id="avatar-label"
        >
          Elegí tu ícono
        </span>
        <div className="grid grid-cols-6 gap-1.5" role="radiogroup" aria-labelledby="avatar-label">
          {AVATAR_EMOJIS.map((emoji) => {
            const active = selectedAvatar === emoji;
            return (
              <button
                key={emoji}
                type="button"
                role="radio"
                aria-checked={active}
                aria-label={`Avatar ${emoji}`}
                onClick={() => onSelectAvatar(emoji)}
                className={`aspect-square text-xl sm:text-2xl rounded-xl border transition-all flex items-center justify-center ${
                  active
                    ? 'border-indigo-500 bg-indigo-500/20 scale-105 shadow-md shadow-indigo-500/20'
                    : 'border-slate-800 bg-slate-900/50 hover:bg-slate-800/80'
                }`}
              >
                {emoji}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <span
          className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2"
          id="color-label"
        >
          Elegí tu color
        </span>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-labelledby="color-label">
          {PLAYER_COLORS.map((color) => {
            const active = selectedColor === color;
            return (
              <button
                key={color}
                type="button"
                role="radio"
                aria-checked={active}
                aria-label={`Color ${color}`}
                onClick={() => onSelectColor(color)}
                style={{ backgroundColor: color }}
                className={`w-8 h-8 rounded-full border-2 transition-transform ${
                  active
                    ? 'border-white scale-110 shadow-lg shadow-black/50'
                    : 'border-transparent hover:scale-105 opacity-80'
                }`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
