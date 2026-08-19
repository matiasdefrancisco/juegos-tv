import React, { useEffect, useState } from 'react';
import { GameMode, getCategoryLabel, RoundMode } from '@party-draw/shared';
import { Dices, Palette, Sparkles, Target, Timer, Users } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';

export const TVHeader: React.FC = () => {
  const { gameState } = useSocket();
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [progressPercent, setProgressPercent] = useState<number>(100);

  const roundStartedAt = gameState?.roundStartedAt ?? null;
  const roundEndsAt = gameState?.roundEndsAt ?? null;

  useEffect(() => {
    if (!roundStartedAt || !roundEndsAt) return;

    const totalDuration = Math.max(1, roundEndsAt - roundStartedAt);

    const tick = () => {
      const remainingMs = Math.max(0, roundEndsAt - Date.now());
      setTimeLeft(Math.ceil(remainingMs / 1000));
      setProgressPercent(Math.max(0, Math.min(100, (remainingMs / totalDuration) * 100)));
    };

    tick();
    const interval = window.setInterval(tick, 200);
    return () => window.clearInterval(interval);
  }, [roundStartedAt, roundEndsAt]);

  if (!gameState) return null;

  const { settings } = gameState;
  const isTeamMode = settings.mode === GameMode.TEAMS;
  const isAllPlay = gameState.isAllPlayRound;
  const isRiskMode = !isTeamMode && settings.roundMode === RoundMode.RISK;

  const isLowTime = timeLeft <= 10;
  const isCriticalTime = timeLeft <= 5;

  const turnTeam = gameState.teams.find((t) => t.id === gameState.currentTeamId);

  // En todos contra todos se muestra cuántos ya respondieron
  const soloResponders = gameState.players.filter(
    (p) => p.connected && p.id !== gameState.currentDrawerId
  );
  const soloAnswered = soloResponders.filter((p) =>
    isRiskMode ? p.hasAnswered : p.guessedCurrentRound
  ).length;

  return (
    <div className="w-full space-y-2.5">
      <div className="flex flex-wrap items-center justify-center lg:justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <span className="bg-indigo-600/40 border border-indigo-500/50 text-indigo-300 font-game font-bold px-3 py-1.5 rounded-xl text-sm sm:text-base">
            RONDA {gameState.currentRound}/{gameState.totalRounds}
          </span>

          {gameState.wordCategory && (
            <span className="flex items-center gap-1.5 bg-pink-500/20 border border-pink-500/40 text-pink-300 font-semibold px-3 py-1.5 rounded-xl text-xs sm:text-sm">
              <Sparkles size={14} className="flex-shrink-0" />
              <span className="truncate max-w-[10rem]">
                {getCategoryLabel(gameState.wordCategory)}
              </span>
            </span>
          )}

          {isRiskMode && (
            <span className="flex items-center gap-1.5 bg-purple-500/20 border border-purple-500/40 text-purple-300 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold">
              <Dices size={14} className="flex-shrink-0" />
              <span>Riesgo</span>
            </span>
          )}
        </div>

        {/* Dibujante */}
        <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-700 px-3 py-1.5 rounded-xl min-w-0">
          <Palette className="text-amber-400 flex-shrink-0" size={18} />
          <span className="text-slate-400 font-medium text-xs sm:text-sm hidden sm:inline">
            Dibuja:
          </span>
          <span className="font-game font-bold text-white text-sm sm:text-lg truncate max-w-[8rem] sm:max-w-[12rem]">
            {gameState.currentDrawerName || 'Jugador'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Quién responde */}
          {isTeamMode ? (
            isAllPlay ? (
              <span className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-pink-500 text-slate-950 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-black animate-pulse">
                <Sparkles size={14} className="flex-shrink-0" />
                <span>¡JUEGAN TODOS!</span>
              </span>
            ) : (
              turnTeam && (
                <span
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-black text-white border"
                  style={{ backgroundColor: `${turnTeam.color}33`, borderColor: turnTeam.color }}
                >
                  <span aria-hidden="true">{turnTeam.emoji}</span>
                  <span className="truncate max-w-[8rem]">Turno: {turnTeam.name}</span>
                </span>
              )
            )
          ) : (
            soloResponders.length > 0 && (
              <span className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700 text-slate-300 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold">
                <Users size={14} className="flex-shrink-0" />
                <span className="font-mono">
                  {soloAnswered}/{soloResponders.length}
                </span>
              </span>
            )
          )}

          {/* Intentos restantes del equipo en turno */}
          {isTeamMode && !isAllPlay && gameState.attemptsLeft != null && (
            <span
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold border ${
                gameState.attemptsLeft <= 1
                  ? 'bg-rose-600/20 border-rose-500/50 text-rose-300'
                  : 'bg-slate-800/80 border-slate-700 text-slate-300'
              }`}
            >
              <Target size={14} className="flex-shrink-0" />
              <span className="font-mono">{gameState.attemptsLeft}</span>
              <span className="hidden md:inline font-medium text-slate-400">
                {gameState.attemptsLeft === 1 ? 'intento' : 'intentos'}
              </span>
            </span>
          )}

          {/* Reloj */}
          <span
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono font-black text-lg sm:text-2xl border transition-colors ${
              isCriticalTime
                ? 'bg-rose-600/30 border-rose-500 text-rose-400 animate-pulse'
                : isLowTime
                ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                : 'bg-slate-800/80 border-slate-700 text-white'
            }`}
          >
            <Timer size={18} className="flex-shrink-0" />
            <span>{timeLeft}s</span>
          </span>
        </div>
      </div>

      <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700/60">
        <div
          className={`h-full rounded-full transition-[width] duration-200 ${
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
