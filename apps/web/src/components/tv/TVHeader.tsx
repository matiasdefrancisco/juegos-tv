import React, { useEffect, useState } from 'react';
import { Sparkles, Timer, Palette } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';

export const TVHeader: React.FC = () => {
  const { gameState } = useSocket();
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [progressPercent, setProgressPercent] = useState<number>(100);

  useEffect(() => {
    if (!gameState || !gameState.roundStartedAt || !gameState.roundEndsAt) return;

    const totalDuration = gameState.roundEndsAt - gameState.roundStartedAt;

    const interval = setInterval(() => {
      const remainingMs = Math.max(0, gameState.roundEndsAt! - Date.now());
      const seconds = Math.ceil(remainingMs / 1000);
      setTimeLeft(seconds);

      const percent = (remainingMs / totalDuration) * 100;
      setProgressPercent(Math.max(0, Math.min(100, percent)));
    }, 100);

    return () => clearInterval(interval);
  }, [gameState?.roundStartedAt, gameState?.roundEndsAt]);

  if (!gameState) return null;

  const isLowTime = timeLeft <= 10;
  const isCriticalTime = timeLeft <= 5;

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between">
        {/* Round Badge */}
        <div className="flex items-center space-x-3">
          <span className="bg-indigo-600/40 border border-indigo-500/50 text-indigo-300 font-game font-bold px-4 py-1.5 rounded-2xl text-lg shadow-sm">
            RONDA {gameState.currentRound} / {gameState.totalRounds}
          </span>

          {/* Category Pill */}
          {gameState.wordCategory && (
            <div className="flex items-center space-x-2 bg-pink-500/20 border border-pink-500/40 text-pink-300 font-semibold px-4 py-1.5 rounded-2xl text-base capitalize shadow-sm">
              <Sparkles size={16} />
              <span>Categoría: {gameState.wordCategory}</span>
            </div>
          )}
        </div>

        {/* Drawer Banner */}
        <div className="flex items-center space-x-3 bg-slate-800/90 border border-slate-700 px-5 py-2 rounded-2xl shadow-md">
          <Palette className="text-amber-400" size={22} />
          <span className="text-slate-400 font-medium text-sm">Dibujando:</span>
          <span className="font-game font-bold text-white text-xl">
            {gameState.currentDrawerName || 'Jugador'}
          </span>
        </div>

        {/* Seconds Counter */}
        <div
          className={`flex items-center space-x-2 px-5 py-2 rounded-2xl font-mono font-black text-2xl border transition-all ${
            isCriticalTime
              ? 'bg-rose-600/30 border-rose-500 text-rose-400 animate-bounce-short scale-110'
              : isLowTime
              ? 'bg-amber-500/20 border-amber-500 text-amber-400'
              : 'bg-slate-800/80 border-slate-700 text-white'
          }`}
        >
          <Timer size={22} className={isLowTime ? 'animate-spin' : ''} />
          <span>{timeLeft}s</span>
        </div>
      </div>

      {/* Synchronized Progress Bar */}
      <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700/60 p-0.5 shadow-inner">
        <div
          className={`h-full rounded-full transition-all duration-100 ${
            isCriticalTime
              ? 'bg-gradient-to-r from-rose-600 to-red-500'
              : isLowTime
              ? 'bg-gradient-to-r from-amber-500 to-rose-500'
              : 'bg-gradient-to-r from-emerald-400 via-indigo-500 to-pink-500'
          }`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
};
