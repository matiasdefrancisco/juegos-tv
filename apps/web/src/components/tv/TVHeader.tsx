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
    // 4 actualizaciones por segundo alcanzan para que la barra se vea fluida
    const interval = window.setInterval(tick, 250);
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

  const soloResponders = gameState.players.filter(
    (p) => p.connected && p.id !== gameState.currentDrawerId
  );
  const soloAnswered = soloResponders.filter((p) =>
    isRiskMode ? p.hasAnswered : p.guessedCurrentRound
  ).length;

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className="bg-indigo-600/40 border border-indigo-500/50 text-indigo-300 font-game font-bold px-5 py-2.5 rounded-xl text-2xl whitespace-nowrap">
            RONDA {gameState.currentRound}/{gameState.totalRounds}
          </span>

          {gameState.wordCategory && (
            <span className="flex items-center gap-2 bg-pink-500/20 border border-pink-500/40 text-pink-300 font-semibold px-5 py-2.5 rounded-xl text-xl">
              <Sparkles size={22} className="flex-shrink-0" />
              <span className="truncate max-w-[280px]">
                {getCategoryLabel(gameState.wordCategory)}
              </span>
            </span>
          )}

          {isRiskMode && (
            <span className="flex items-center gap-2 bg-purple-500/20 border border-purple-500/40 text-purple-300 px-5 py-2.5 rounded-xl text-xl font-semibold">
              <Dices size={22} className="flex-shrink-0" />
              <span>Riesgo</span>
            </span>
          )}
        </div>

        {/* Dibujante */}
        <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-700 px-5 py-2.5 rounded-xl min-w-0">
          <Palette className="text-amber-400 flex-shrink-0" size={26} />
          <span className="text-slate-400 font-medium text-xl">Dibuja:</span>
          <span className="font-game font-bold text-white text-2xl truncate max-w-[320px]">
            {gameState.currentDrawerName || 'Jugador'}
          </span>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Quién responde */}
          {isTeamMode ? (
            isAllPlay ? (
              <span className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-pink-500 text-slate-950 px-5 py-2.5 rounded-xl text-xl font-black whitespace-nowrap">
                <Sparkles size={22} className="flex-shrink-0" />
                <span>¡JUEGAN TODOS!</span>
              </span>
            ) : (
              turnTeam && (
                <span
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xl font-black text-white border whitespace-nowrap"
                  style={{ backgroundColor: `${turnTeam.color}33`, borderColor: turnTeam.color }}
                >
                  <span aria-hidden="true">{turnTeam.emoji}</span>
                  <span className="truncate max-w-[220px]">{turnTeam.name}</span>
                </span>
              )
            )
          ) : (
            soloResponders.length > 0 && (
              <span className="flex items-center gap-2 bg-slate-800/80 border border-slate-700 text-slate-300 px-5 py-2.5 rounded-xl text-xl font-bold">
                <Users size={22} className="flex-shrink-0" />
                <span className="font-mono">
                  {soloAnswered}/{soloResponders.length}
                </span>
              </span>
            )
          )}

          {/* Intentos del equipo en turno */}
          {isTeamMode && !isAllPlay && gameState.attemptsLeft != null && (
            <span
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xl font-bold border whitespace-nowrap ${
                gameState.attemptsLeft <= 1
                  ? 'bg-rose-600/20 border-rose-500/50 text-rose-300'
                  : 'bg-slate-800/80 border-slate-700 text-slate-300'
              }`}
            >
              <Target size={22} className="flex-shrink-0" />
              <span className="font-mono">{gameState.attemptsLeft}</span>
            </span>
          )}

          {/* Reloj */}
          <span
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-mono font-black text-4xl border ${
              isCriticalTime
                ? 'bg-rose-600/30 border-rose-500 text-rose-400'
                : isLowTime
                ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                : 'bg-slate-800/80 border-slate-700 text-white'
            }`}
          >
            <Timer size={30} className="flex-shrink-0" />
            <span className="tabular-nums w-[3ch] text-right">{timeLeft}</span>
          </span>
        </div>
      </div>

      {/* Barra de tiempo */}
      <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700/60">
        <div
          className={`h-full rounded-full ${
            isCriticalTime
              ? 'bg-gradient-to-r from-rose-600 to-red-500'
              : isLowTime
              ? 'bg-gradient-to-r from-amber-500 to-rose-500'
              : 'bg-gradient-to-r from-emerald-400 via-indigo-500 to-pink-500'
          }`}
          style={{ width: `${progressPercent}%`, transition: 'width 250ms linear' }}
        />
      </div>
    </div>
  );
};
