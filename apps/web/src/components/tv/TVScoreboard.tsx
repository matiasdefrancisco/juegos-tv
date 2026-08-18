import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, ArrowRight, Crown, Medal } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';

export const TVScoreboard: React.FC = () => {
  const { gameState, nextRound } = useSocket();

  if (!gameState) return null;

  const sortedPlayers = [...gameState.players].sort((a, b) => b.score - a.score);
  const isFinalRound = gameState.currentRound >= gameState.totalRounds;

  return (
    <div className="w-full h-full flex flex-col justify-between p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center space-x-2 bg-amber-500/20 border border-amber-500/30 px-4 py-1.5 rounded-full text-amber-300 font-semibold text-sm">
          <Trophy size={18} />
          <span>TABLA DE POSICIONES</span>
        </div>
        <h2 className="text-5xl font-black font-game text-white tracking-tight">
          PUNTUACIONES
        </h2>
      </div>

      {/* Leaderboard List */}
      <div className="my-auto space-y-3 max-h-[480px] overflow-y-auto px-2">
        {sortedPlayers.map((player, index) => {
          const isLeader = index === 0 && player.score > 0;
          return (
            <motion.div
              key={player.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              className={`p-4 rounded-2xl border flex items-center justify-between shadow-xl transition-all ${
                isLeader
                  ? 'bg-gradient-to-r from-amber-500/20 via-slate-800 to-slate-900 border-amber-500/60 scale-102'
                  : 'bg-slate-800/80 border-slate-700/70'
              }`}
            >
              <div className="flex items-center space-x-4">
                <div className="w-10 text-center font-game font-black text-2xl">
                  {index === 0 ? (
                    <Crown className="text-amber-400 mx-auto" size={28} />
                  ) : index === 1 ? (
                    <Medal className="text-slate-300 mx-auto" size={24} />
                  ) : index === 2 ? (
                    <Medal className="text-amber-700 mx-auto" size={24} />
                  ) : (
                    <span className="text-slate-500 text-lg">#{index + 1}</span>
                  )}
                </div>

                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl border border-white/20 shadow-inner"
                  style={{ backgroundColor: player.color }}
                >
                  {player.avatar}
                </div>

                <div>
                  <h4 className="font-bold text-white text-xl flex items-center space-x-2">
                    <span>{player.name}</span>
                    {player.isHost && (
                      <span className="text-[10px] bg-indigo-500/30 text-indigo-300 px-2 py-0.5 rounded-full font-semibold">
                        Host
                      </span>
                    )}
                  </h4>
                  {!player.connected && (
                    <span className="text-xs text-rose-400 font-semibold">Desconectado</span>
                  )}
                </div>
              </div>

              <div className="text-right">
                <span className="font-mono font-black text-3xl text-amber-400">
                  {player.score}
                </span>
                <span className="text-xs text-slate-400 block font-bold uppercase tracking-wider">
                  puntos
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Footer Next Round Button */}
      <div className="flex items-center justify-between pt-6 border-t border-slate-700/60">
        <span className="text-slate-400 text-base font-medium">
          {isFinalRound
            ? '¡Última ronda completada!'
            : `Siguiente: Ronda ${gameState.currentRound + 1} de ${gameState.totalRounds}`}
        </span>

        <button
          onClick={nextRound}
          className="btn-game-primary flex items-center space-x-3 px-8 py-4 text-xl"
        >
          <span>{isFinalRound ? 'VER GANADOR FINAL' : 'SIGUIENTE TURNO'}</span>
          <ArrowRight size={22} />
        </button>
      </div>
    </div>
  );
};
