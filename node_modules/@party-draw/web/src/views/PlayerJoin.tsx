import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, AlertCircle, Sparkles, Smartphone } from 'lucide-react';
import { Header } from '../components/common/Header';
import { AvatarPicker } from '../components/common/AvatarPicker';
import { useSocket } from '../context/SocketContext';
import { PLAYER_COLORS } from '@party-draw/shared';

interface PlayerJoinProps {
  initialCode?: string;
  onJoined: () => void;
}

export const PlayerJoin: React.FC<PlayerJoinProps> = ({ initialCode = '', onJoined }) => {
  const { joinGame, error, clearError, player } = useSocket();

  const [code, setCode] = useState(initialCode.toUpperCase());
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('🦊');
  const [color, setColor] = useState(PLAYER_COLORS[0]);

  useEffect(() => {
    if (initialCode) {
      setCode(initialCode.toUpperCase());
    }
  }, [initialCode]);

  useEffect(() => {
    if (player) {
      onJoined();
    }
  }, [player, onJoined]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!code.trim()) return;
    if (name.trim().length < 2) return;

    joinGame(code.trim().toUpperCase(), name.trim(), avatar, color);
  };

  return (
    <div className="h-[100dvh] max-h-[100dvh] party-bg-ambient flex flex-col justify-between overflow-hidden select-none">
      <Header title="UNIRSE A PARTIDA" />

      <main className="flex-1 flex flex-col justify-center p-4 max-w-md mx-auto w-full my-auto overflow-y-auto">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl shadow-2xl space-y-5"
        >
          <div className="text-center space-y-1">
            <h2 className="text-2xl font-black font-game text-white">¡Entrá al juego!</h2>
            <p className="text-xs text-slate-400 font-medium">
              Elegí tu nombre y personalizá tu personaje para la TV
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-rose-500/20 border border-rose-500/50 p-3 rounded-2xl flex items-center space-x-2 text-rose-300 text-xs font-semibold"
            >
              <AlertCircle size={16} className="flex-shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Room Code */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Código de la sala
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="4827"
                maxLength={6}
                required
                className="w-full bg-slate-950 border-2 border-slate-700 focus:border-indigo-500 text-amber-400 font-mono font-black text-center text-3xl tracking-widest py-3 rounded-2xl outline-none uppercase shadow-inner"
              />
            </div>

            {/* Player Name */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Tu nombre
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Matías"
                maxLength={15}
                required
                className="w-full bg-slate-950 border-2 border-slate-700 focus:border-indigo-500 text-white font-bold text-lg px-4 py-3 rounded-2xl outline-none shadow-inner"
              />
            </div>

            {/* Avatar & Color Picker */}
            <div className="pt-2 border-t border-slate-800">
              <AvatarPicker
                selectedAvatar={avatar}
                selectedColor={color}
                onSelectAvatar={setAvatar}
                onSelectColor={setColor}
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={!code.trim() || name.trim().length < 2}
                className={`w-full py-4 rounded-2xl font-bold font-game text-lg flex items-center justify-center space-x-2 transition-all ${
                  code.trim() && name.trim().length >= 2
                    ? 'btn-game-primary cursor-pointer'
                    : 'bg-slate-800 text-slate-600 cursor-not-allowed opacity-60'
                }`}
              >
                <span>¡ENTRAR AHORA!</span>
                <ArrowRight size={20} />
              </button>
            </div>
          </form>
        </motion.div>
      </main>

      <footer className="p-3 text-center text-slate-600 text-xs font-medium safe-bottom">
        Party Draw — No requiere descargar apps
      </footer>
    </div>
  );
};
