import React, { useState, useEffect } from 'react';
import { Maximize, Minimize, Volume2, VolumeX, Wifi, WifiOff } from 'lucide-react';
import { sounds } from '../../utils/soundEffects';

interface HeaderProps {
  title?: string;
  gameCode?: string | null;
  connected?: boolean;
  isTV?: boolean;
  teamName?: string;
  teamColor?: string;
}

export const Header: React.FC<HeaderProps> = ({
  title = 'PARTY DRAW',
  gameCode,
  connected = true,
  isTV = false,
  teamName,
  teamColor
}) => {
  const [muted, setMuted] = useState(sounds.isMuted());
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleToggleSound = () => setMuted(sounds.toggleMute());

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const iconSize = isTV ? 26 : 16;

  return (
    <header
      className={`w-full flex items-center justify-between gap-2 z-30 bg-slate-950 border-b ${
        isTV
          ? 'h-full px-10 border-indigo-500/20'
          : 'py-2.5 px-3 border-slate-800 safe-top bg-slate-950'
      }`}
    >
      {/* Marca y título */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <span className={isTV ? 'text-4xl' : 'text-xl'} aria-hidden="true">
          🎨
        </span>
        <h1
          className={`font-game font-black tracking-wide text-gradient-party truncate ${
            isTV ? 'text-4xl' : 'text-base'
          }`}
        >
          {title}
        </h1>

        {teamName && (
          <span
            className="text-[10px] font-black px-2 py-0.5 rounded-lg text-white flex-shrink-0 truncate max-w-[5.5rem]"
            style={{ backgroundColor: teamColor || '#6366F1' }}
          >
            {teamName}
          </span>
        )}
      </div>

      {/* Controles */}
      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
        {gameCode && (
          <div
            className={`bg-slate-900/90 border border-slate-700/80 rounded-xl flex items-center shadow-md ${
              isTV ? 'px-5 py-2 gap-3' : 'px-2 py-1 gap-1.5'
            }`}
          >
            <span
              className={`text-slate-400 font-bold uppercase tracking-wider ${
                isTV ? 'text-base' : 'text-[9px] hidden sm:inline'
              }`}
            >
              Sala
            </span>
            <span
              className={`font-mono font-black text-amber-400 tracking-widest ${
                isTV ? 'text-3xl' : 'text-sm'
              }`}
            >
              {gameCode}
            </span>
          </div>
        )}

        <button
          onClick={handleToggleSound}
          className={`btn-ghost ${isTV ? 'p-3.5' : 'p-2'}`}
          title={muted ? 'Activar sonido' : 'Silenciar sonido'}
          aria-label={muted ? 'Activar sonido' : 'Silenciar sonido'}
          aria-pressed={muted}
        >
          {muted ? <VolumeX size={iconSize} /> : <Volume2 size={iconSize} />}
        </button>

        {isTV && (
          <button
            onClick={handleToggleFullscreen}
            className="btn-ghost p-3.5"
            title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
            aria-label={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
          >
            {isFullscreen ? <Minimize size={iconSize} /> : <Maximize size={iconSize} />}
          </button>
        )}

        <div
          className={`flex items-center rounded-xl bg-slate-900/80 border border-slate-800 ${
            isTV ? 'px-4 py-2.5' : 'p-2'
          }`}
          title={connected ? 'Conectado' : 'Reconectando'}
        >
          {connected ? (
            <span
              className={`flex items-center text-emerald-400 gap-2 font-semibold ${
                isTV ? 'text-lg' : 'text-xs'
              }`}
            >
              <Wifi size={iconSize} />
              {isTV && <span>ONLINE</span>}
            </span>
          ) : (
            <span
              className={`flex items-center text-rose-400 gap-2 font-semibold ${
                isTV ? 'text-lg' : 'text-xs'
              }`}
            >
              <WifiOff size={iconSize} />
              {isTV && <span>RECONECTANDO</span>}
            </span>
          )}
        </div>
      </div>
    </header>
  );
};
