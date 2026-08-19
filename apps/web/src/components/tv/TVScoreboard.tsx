import React from 'react';
import { motion } from 'framer-motion';
import { GameMode } from '@party-draw/shared';
import { ArrowRight, Crown, Medal, Trophy } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { usePhaseCountdown } from '../../utils/usePhaseCountdown';

export const TVScoreboard: React.FC = () => {
  const { gameState, nextRound } = useSocket();
  const { secondsLeft, percent } = usePhaseCountdown(gameState?.phaseEndsAt);

  if (!gameState) return null;

  const isTeamMode = gameState.settings.mode === GameMode.TEAMS;
  const isFinalRound = gameState.currentRound >= gameState.totalRounds;

  const sortedPlayers = [...gameState.players].sort((a, b) => b.score - a.score);
  const sortedTeams = [...gameState.teams]
    .filter((team) => gameState.players.some((p) => p.teamId === team.id))
    .sort((a, b) => b.score - a.score);

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-6 flex flex-col gap-4 min-h-full">
      <header className="text-center space-y-2 flex-shrink-0">
        <div className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-500/30 px-4 py-1.5 rounded-full text-amber-300 font-semibold text-xs sm:text-sm">
          <Trophy size={16} />
          <span>TABLA DE POSICIONES</span>
        </div>
        <h2 className="tv-title font-black font-game text-white tracking-tight">
          {isTeamMode ? 'PUNTAJE POR EQUIPOS' : 'PUNTUACIONES'}
        </h2>
      </header>

      {/* Listado con scroll propio */}
      <div className="scroll-area flex-1 min-h-0 space-y-2.5 px-1">
        {isTeamMode
          ? sortedTeams.map((team, index) => {
              const members = gameState.players.filter((p) => p.teamId === team.id);

              return (
                <motion.div
                  key={team.id}
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: Math.min(index * 0.08, 0.5) }}
                  className={`p-3 sm:p-4 rounded-2xl border flex items-center justify-between gap-3 shadow-xl ${
                    index === 0
                      ? 'bg-gradient-to-r from-amber-500/20 via-slate-800 to-slate-900 border-amber-500/60'
                      : 'bg-slate-800/80 border-slate-700/70'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 flex-shrink-0 text-center">
                      {index === 0 ? (
                        <Crown className="text-amber-400 mx-auto" size={24} />
                      ) : (
                        <span className="text-slate-500 font-game font-black">#{index + 1}</span>
                      )}
                    </div>

                    <span
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl border border-white/20 flex-shrink-0"
                      style={{ backgroundColor: team.color }}
                      aria-hidden="true"
                    >
                      {team.emoji}
                    </span>

                    <div className="min-w-0">
                      <h4 className="font-bold text-white text-base sm:text-xl truncate">
                        {team.name}
                      </h4>
                      <p className="text-[11px] sm:text-xs text-slate-400 truncate">
                        {members.map((m) => m.name).join(', ') || 'Sin jugadores'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className="font-mono font-black text-2xl sm:text-3xl text-amber-400">
                      {team.score}
                    </span>
                    {team.currentRoundScore > 0 && (
                      <span className="block text-[11px] text-emerald-400 font-bold">
                        +{team.currentRoundScore}
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })
          : sortedPlayers.map((player, index) => {
              const isLeader = index === 0 && player.score > 0;

              return (
                <motion.div
                  key={player.id}
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: Math.min(index * 0.06, 0.5) }}
                  className={`p-3 sm:p-4 rounded-2xl border flex items-center justify-between gap-3 shadow-xl ${
                    isLeader
                      ? 'bg-gradient-to-r from-amber-500/20 via-slate-800 to-slate-900 border-amber-500/60'
                      : 'bg-slate-800/80 border-slate-700/70'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 flex-shrink-0 text-center font-game font-black">
                      {index === 0 ? (
                        <Crown className="text-amber-400 mx-auto" size={24} />
                      ) : index === 1 ? (
                        <Medal className="text-slate-300 mx-auto" size={20} />
                      ) : index === 2 ? (
                        <Medal className="text-amber-700 mx-auto" size={20} />
                      ) : (
                        <span className="text-slate-500 text-base">#{index + 1}</span>
                      )}
                    </div>

                    <span
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl border border-white/20 flex-shrink-0"
                      style={{ backgroundColor: player.color }}
                      aria-hidden="true"
                    >
                      {player.avatar}
                    </span>

                    <div className="min-w-0">
                      <h4 className="font-bold text-white text-base sm:text-xl truncate">
                        {player.name}
                      </h4>
                      {!player.connected && (
                        <span className="text-[11px] text-rose-400 font-semibold">
                          Desconectado
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className="font-mono font-black text-2xl sm:text-3xl text-amber-400">
                      {player.score}
                    </span>
                    {player.currentRoundScore > 0 && (
                      <span className="block text-[11px] text-emerald-400 font-bold">
                        +{player.currentRoundScore}
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
      </div>

      {/* Avance automático + atajo manual */}
      <div className="pt-3 border-t border-slate-700/60 space-y-2.5 flex-shrink-0">
        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700/60">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-pink-500 rounded-full transition-[width] duration-200"
            style={{ width: `${percent}%` }}
          />
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-slate-400 text-sm text-center sm:text-left">
            {isFinalRound
              ? '¡Última ronda completada!'
              : `Siguiente: ronda ${gameState.currentRound + 1} de ${gameState.totalRounds}`}
            <span className="text-slate-500"> — continúa en {secondsLeft}s</span>
          </p>

          <button
            onClick={nextRound}
            className="btn-game-primary w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 py-3 text-base sm:text-lg"
          >
            <span>{isFinalRound ? 'VER GANADOR' : 'SIGUIENTE TURNO'}</span>
            <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};
