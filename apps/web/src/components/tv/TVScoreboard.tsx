import React from 'react';
import { GameMode } from '@party-draw/shared';
import { ArrowRight, Crown, Medal, Trophy } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { usePhaseCountdown } from '../../utils/usePhaseCountdown';

interface Row {
  key: string;
  name: string;
  detail: string;
  score: number;
  roundScore: number;
  color: string;
  icon: string;
  offline?: boolean;
}

/** Escala tipográfica según cuántas filas hay que mostrar sin scroll */
function densityFor(rows: number) {
  if (rows <= 4) return { avatar: 72, name: 'text-4xl', score: 'text-5xl', pad: 'px-6' };
  if (rows <= 6) return { avatar: 60, name: 'text-3xl', score: 'text-4xl', pad: 'px-5' };
  if (rows <= 9) return { avatar: 48, name: 'text-2xl', score: 'text-3xl', pad: 'px-4' };
  if (rows <= 12) return { avatar: 40, name: 'text-xl', score: 'text-2xl', pad: 'px-3' };
  return { avatar: 32, name: 'text-lg', score: 'text-xl', pad: 'px-3' };
}

export const TVScoreboard: React.FC = () => {
  const { gameState, nextRound } = useSocket();
  const { secondsLeft, percent } = usePhaseCountdown(gameState?.phaseEndsAt);

  if (!gameState) return null;

  const isTeamMode = gameState.settings.mode === GameMode.TEAMS;
  const isFinalRound = gameState.currentRound >= gameState.totalRounds;

  const rows: Row[] = isTeamMode
    ? [...gameState.teams]
        .filter((t) => gameState.players.some((p) => p.teamId === t.id))
        .sort((a, b) => b.score - a.score)
        .map((t) => ({
          key: t.id,
          name: t.name,
          detail: gameState.players
            .filter((p) => p.teamId === t.id)
            .map((p) => p.name)
            .join(', '),
          score: t.score,
          roundScore: t.currentRoundScore,
          color: t.color,
          icon: t.emoji
        }))
    : [...gameState.players]
        .sort((a, b) => b.score - a.score)
        .map((p) => ({
          key: p.id,
          name: p.name,
          detail: '',
          score: p.score,
          roundScore: p.currentRoundScore,
          color: p.color,
          icon: p.avatar,
          offline: !p.connected
        }));

  const d = densityFor(rows.length);

  return (
    <div className="w-full h-full flex flex-col gap-4">
      <header className="flex-none text-center">
        <div className="inline-flex items-center gap-3 bg-amber-500/20 border border-amber-500/30 px-6 py-2 rounded-full text-amber-300 font-semibold text-xl">
          <Trophy size={24} />
          <span>TABLA DE POSICIONES</span>
        </div>
        <h2 className="tv-heading text-5xl font-black font-game text-white tracking-tight mt-2">
          {isTeamMode ? 'PUNTAJE POR EQUIPOS' : 'PUNTUACIONES'}
        </h2>
      </header>

      {/* Filas repartidas en el alto exacto: sin scroll, siempre entran todas */}
      <div
        className="flex-1 min-h-0 grid gap-2.5 max-w-[1500px] w-full mx-auto"
        style={{ gridTemplateRows: `repeat(${rows.length}, minmax(0, 1fr))` }}
      >
        {rows.map((row, index) => (
          <div
            key={row.key}
            className={`rounded-2xl border flex items-center justify-between gap-5 ${d.pad} min-h-0 overflow-hidden ${
              index === 0 && row.score > 0
                ? 'bg-gradient-to-r from-amber-500/20 via-slate-800 to-slate-900 border-amber-500/60'
                : 'bg-slate-800/80 border-slate-700/70'
            }`}
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-14 flex-shrink-0 text-center">
                {index === 0 ? (
                  <Crown className="text-amber-400 mx-auto" size={d.avatar * 0.55} />
                ) : index === 1 ? (
                  <Medal className="text-slate-300 mx-auto" size={d.avatar * 0.5} />
                ) : index === 2 ? (
                  <Medal className="text-amber-700 mx-auto" size={d.avatar * 0.5} />
                ) : (
                  <span className={`text-slate-500 font-game font-black ${d.name}`}>
                    {index + 1}
                  </span>
                )}
              </div>

              <span
                className="rounded-xl flex items-center justify-center border border-white/20 flex-shrink-0"
                style={{
                  backgroundColor: row.color,
                  width: d.avatar,
                  height: d.avatar,
                  fontSize: d.avatar * 0.52
                }}
                aria-hidden="true"
              >
                {row.icon}
              </span>

              <div className="min-w-0">
                <h4 className={`font-bold text-white truncate ${d.name}`}>{row.name}</h4>
                {row.detail && (
                  <p className="text-slate-400 truncate text-lg">{row.detail}</p>
                )}
                {row.offline && (
                  <span className="text-rose-400 font-semibold text-base">Desconectado</span>
                )}
              </div>
            </div>

            <div className="text-right flex-shrink-0">
              <span className={`font-mono font-black text-amber-400 ${d.score}`}>{row.score}</span>
              {row.roundScore > 0 && (
                <span className="block text-emerald-400 font-bold text-lg leading-none">
                  +{row.roundScore}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Avance automático */}
      <div className="flex-none space-y-3">
        <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700/60">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-pink-500 rounded-full"
            style={{ width: `${percent}%`, transition: 'width 200ms linear' }}
          />
        </div>

        <div className="flex items-center justify-between gap-6">
          <p className="text-2xl text-slate-400">
            {isFinalRound
              ? '¡Última ronda completada!'
              : `Siguiente: ronda ${gameState.currentRound + 1} de ${gameState.totalRounds}`}
            <span className="text-slate-500"> — continúa en {secondsLeft}s</span>
          </p>

          <button
            onClick={nextRound}
            className="btn-game-primary flex items-center gap-3 px-8 py-4 text-2xl flex-shrink-0"
          >
            <span>{isFinalRound ? 'VER GANADOR' : 'SIGUIENTE'}</span>
            <ArrowRight size={26} />
          </button>
        </div>
      </div>
    </div>
  );
};
