import React, { useState, useEffect } from 'react';
import { AlertCircle, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { PLAYER_COLORS } from '@party-draw/shared';
import { Header } from '../components/common/Header';
import { Screen, ScreenContent } from '../components/common/Screen';
import { AvatarPicker } from '../components/common/AvatarPicker';
import { useSocket } from '../context/SocketContext';

interface PlayerJoinProps {
  initialCode?: string;
  onJoined: () => void;
  onBack?: () => void;
}

export const PlayerJoin: React.FC<PlayerJoinProps> = ({ initialCode = '', onJoined, onBack }) => {
  const { joinGame, error, clearError, player, connected } = useSocket();

  const [code, setCode] = useState(initialCode.toUpperCase());
  const [name, setName] = useState(() => localStorage.getItem('party_draw_name') || '');
  const [avatar, setAvatar] = useState(() => localStorage.getItem('party_draw_avatar') || '🦊');
  const [color, setColor] = useState(
    () => localStorage.getItem('party_draw_color') || PLAYER_COLORS[0]
  );
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialCode) setCode(initialCode.toUpperCase());
  }, [initialCode]);

  useEffect(() => {
    if (player) onJoined();
  }, [player, onJoined]);

  // Un error del servidor rehabilita el formulario
  useEffect(() => {
    if (error) setSubmitting(false);
  }, [error]);

  const isValid = code.trim().length >= 4 && name.trim().length >= 2;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    if (!isValid || !connected || submitting) return;

    localStorage.setItem('party_draw_name', name.trim());
    localStorage.setItem('party_draw_avatar', avatar);
    localStorage.setItem('party_draw_color', color);

    setSubmitting(true);
    joinGame(code.trim().toUpperCase(), name.trim(), avatar, color);
  };

  return (
    <Screen header={<Header title="UNIRSE A PARTIDA" connected={connected} />}>
      <ScreenContent width="sm">
        <div
          className="anim-slide-up panel p-5 sm:p-6 space-y-5"
        >
          <div className="text-center space-y-1">
            <h2 className="text-xl sm:text-2xl font-black font-game text-white">¡Entrá al juego!</h2>
            <p className="text-xs text-slate-400 font-medium">
              Elegí tu nombre y personalizá tu personaje para la TV
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="anim-pop bg-rose-500/20 border border-rose-500/50 p-3 rounded-2xl flex items-start gap-2 text-rose-300 text-xs font-semibold"
            >
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="room-code"
                className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5"
              >
                Código de la sala
              </label>
              <input
                id="room-code"
                type="text"
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))
                }
                placeholder="KP7R"
                maxLength={6}
                required
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                className="w-full bg-slate-950 border-2 border-slate-700 focus:border-indigo-500 text-amber-400 font-mono font-black text-center text-2xl sm:text-3xl tracking-[0.25em] py-3 rounded-2xl outline-none uppercase shadow-inner"
              />
            </div>

            <div>
              <label
                htmlFor="player-name"
                className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5"
              >
                Tu nombre
              </label>
              <input
                id="player-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Matías"
                maxLength={15}
                required
                className="w-full bg-slate-950 border-2 border-slate-700 focus:border-indigo-500 text-white font-bold text-base px-4 py-3 rounded-2xl outline-none shadow-inner"
              />
            </div>

            <div className="pt-2 border-t border-slate-800">
              <AvatarPicker
                selectedAvatar={avatar}
                selectedColor={color}
                onSelectAvatar={setAvatar}
                onSelectColor={setColor}
              />
            </div>

            <div className="pt-1 space-y-2">
              <button
                type="submit"
                disabled={!isValid || !connected || submitting}
                className={`w-full py-4 rounded-2xl font-bold font-game text-lg flex items-center justify-center gap-2 transition-all ${
                  isValid && connected && !submitting ? 'btn-game-primary' : 'btn-disabled'
                }`}
              >
                {submitting ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    <span>ENTRANDO...</span>
                  </>
                ) : !connected ? (
                  <span>CONECTANDO...</span>
                ) : (
                  <>
                    <span>¡ENTRAR AHORA!</span>
                    <ArrowRight size={20} />
                  </>
                )}
              </button>

              {onBack && (
                <button
                  type="button"
                  onClick={onBack}
                  className="w-full py-2.5 rounded-2xl text-slate-400 hover:text-white text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <ArrowLeft size={16} />
                  <span>Volver al inicio</span>
                </button>
              )}
            </div>
          </form>
        </div>

        <p className="text-center text-slate-600 text-xs font-medium pt-4 safe-bottom">
          Party Draw — No requiere descargar apps
        </p>
      </ScreenContent>
    </Screen>
  );
};
