import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Wifi, WifiOff, Maximize, Minimize } from 'lucide-react';
import { sounds } from '../../utils/soundEffects';

interface HeaderProps {
  title?: string;
  gameCode?: string | null;
  connected?: boolean;
  isTV?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title = 'PARTY DRAW',
  gameCode,
  connected = true,
  isTV = false
}) => {
  const [muted, setMuted] = useState(sounds.isMuted());
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleToggleSound = () => {
    const newMuted = sounds.toggleMute();
    setMuted(newMuted);
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <header className={`w-full flex items-center justify-between z-30 transition-all ${
      isTV 
        ? 'py-5 px-10 bg-slate-950/60 backdrop-blur-md border-b border-indigo-500/20' 
        : 'py-3 px-4 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 safe-top'
    }`}>
      {/* Brand & Title */}
      <div className="flex items-center space-x-3">
        <span className={isTV ? 'text-4xl' : 'text-2xl'}>🎨</span>
        <h1 className={`font-game font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-pink-500 to-indigo-400 drop-shadow-sm ${
          isTV ? 'text-4xl' : 'text-xl'
        }`}>
          {title}
        </h1>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-3">
        {gameCode && (
          <div className={`bg-slate-900/90 border border-slate-700/80 rounded-2xl flex items-center shadow-md ${
            isTV ? 'px-5 py-2 space-x-3' : 'px-3 py-1.5 space-x-2'
          }`}>
            <span className={`text-slate-400 font-bold uppercase tracking-wider ${
              isTV ? 'text-sm' : 'text-[10px]'
            }`}>
              SALA
            </span>
            <span className={`font-mono font-black text-amber-400 tracking-widest ${
              isTV ? 'text-2xl' : 'text-base'
            }`}>
              {gameCode}
            </span>
          </div>
        )}

        {/* Mute Button */}
        <button
          onClick={handleToggleSound}
          className={`rounded-2xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 text-slate-300 hover:text-white transition-all shadow-md active:scale-95 ${
            isTV ? 'p-3' : 'p-2'
          }`}
          title={muted ? 'Activar sonido' : 'Silenciar sonido'}
        >
          {muted ? <VolumeX size={isTV ? 24 : 18} /> : <Volume2 size={isTV ? 24 : 18} />}
        </button>

        {/* Fullscreen Button (Especially useful on TV browsers) */}
        {isTV && (
          <button
            onClick={handleToggleFullscreen}
            className="p-3 rounded-2xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 text-slate-300 hover:text-white transition-all shadow-md active:scale-95"
            title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
          >
            {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
          </button>
        )}

        {/* Connection Status */}
        <div className={`flex items-center rounded-2xl bg-slate-900/80 border border-slate-800 ${
          isTV ? 'px-3.5 py-2.5' : 'p-2'
        }`}>
          {connected ? (
            <span className="flex items-center text-emerald-400 space-x-1.5 font-semibold text-xs">
              <Wifi size={isTV ? 20 : 16} />
              {isTV && <span>ONLINE</span>}
            </span>
          ) : (
            <span className="flex items-center text-rose-400 space-x-1.5 font-semibold text-xs animate-pulse">
              <WifiOff size={isTV ? 20 : 16} />
              {isTV && <span>RECONECTANDO...</span>}
            </span>
          )}
        </div>
      </div>
    </header>
  );
};
