import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Award, Sparkles, CheckCircle2 } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';

export const MobileResults: React.FC = () => {
  const { gameState, player } = useSocket();

  if (!gameState || !player) return null;

  const result = gameState.lastRoundResult;
  const isDrawer = result?.drawerId === player.id;
  const guessed = player.guessedCurrentRound;
  const earnedPoints = player.currentRoundScore;

  const sortedPlayers = [...gameState.players].sort((a, b) => b.score - a.score);
  const currentRank = sortedPlayers.findIndex((p) => p.id === player.id) + 1;

  return (
    <div className="w-full h-full flex flex-col justify-between p-6 max-w-md mx-auto text-center">
      {/* Top Banner: Word Reveal */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="space-y-1.5"
      >
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          LA PALABRA ERA
        </span>
        <div className="bg-gradient-to-r from-amber-500 via-pink-500 to-indigo-500 p-0.5 rounded-2xl shadow-lg">
          <div className="bg-slate-900 px-6 py-2.5 rounded-[14px]">
            <h3 className="text-3xl font-black font-game text-white tracking-wider uppercase">
              {result?.word || '...'}
            </h3>
          </div>
        </div>
      </motion.div>

      {/* Center Personal Performance Card */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-slate-800/90 border-2 border-indigo-500/40 p-6 rounded-3xl shadow-xl space-y-4 my-auto"
      >
        <div className="space-y-1">
          {earnedPoints > 0 ? (
            <>
              <CheckCircle2 size={48} className="text-emerald-400 mx-auto" />
              <h4 className="text-xl font-bold text-white font-game">
                {isDrawer ? '¡Puntos por tus dibujos!' : '¡Adivinaste la palabra!'}
              </h4>
              <p className="text-emerald-400 font-mono font-black text-3xl">
                +{earnedPoints} pts
              </p>
            </>
          ) : (
            <>
              <span className="text-4xl block">😢</span>
              <h4 className="text-xl font-bold text-white font-game">
                {isDrawer ? 'Nadie acertó tu dibujo' : 'No alcanzaste a adivinar'}
              </h4>
              <p className="text-slate-400 text-sm">¡La próxima te irá mejor!</p>
            </>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-700">
          <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-700/60">
            <span className="text-xs text-slate-400 font-semibold block">PUNTAJE TOTAL</span>
            <span className="font-mono text-2xl font-black text-amber-400">{player.score}</span>
          </div>

          <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-700/60">
            <span className="text-xs text-slate-400 font-semibold block">POSICIÓN</span>
            <span className="font-mono text-2xl font-black text-indigo-400">#{currentRank}</span>
          </div>
        </div>
      </motion.div>

      {/* Footer Info */}
      <div className="bg-slate-800/60 border border-slate-700/60 py-3 px-4 rounded-2xl text-slate-400 text-xs font-semibold">
        Mirá la pantalla del televisor para ver la tabla completa
      </div>
    </div>
  );
};
