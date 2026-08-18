import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Award, Sparkles, UserCheck } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { TVCanvas } from './TVCanvas';

export const TVRoundResult: React.FC = () => {
  const { gameState } = useSocket();
  const result = gameState?.lastRoundResult;

  if (!result) return null;

  return (
    <div className="w-full h-full flex flex-col justify-between p-8 max-w-7xl mx-auto">
      {/* Word Reveal Header */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center space-y-2"
      >
        <span className="text-slate-400 font-bold uppercase tracking-widest text-sm">
          ¡TIEMPO TERMINADO!
        </span>
        <div className="inline-block bg-gradient-to-r from-amber-500 via-pink-500 to-indigo-500 p-1 rounded-3xl shadow-2xl">
          <div className="bg-slate-950 px-10 py-3 rounded-[22px]">
            <span className="text-sm font-bold text-amber-400 block tracking-wider uppercase mb-1">
              LA PALABRA ERA
            </span>
            <h2 className="text-5xl md:text-6xl font-black font-game text-white tracking-wider uppercase">
              {result.word}
            </h2>
          </div>
        </div>
      </motion.div>

      {/* Main Content: Drawing Snapshot + Guessers Summary */}
      <div className="grid grid-cols-12 gap-8 my-auto items-center">
        {/* Left: Final Drawing */}
        <div className="col-span-6 h-[400px]">
          <TVCanvas className="border-4 border-slate-700 shadow-2xl" />
        </div>

        {/* Right: Points and Guessers */}
        <div className="col-span-6 bg-slate-800/80 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[420px] overflow-y-auto">
          {/* Drawer summary */}
          <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-3xl">✏️</span>
              <div>
                <p className="font-bold text-white text-lg">{result.drawerName}</p>
                <p className="text-xs text-slate-400">Dibujante de la ronda</p>
              </div>
            </div>
            <div className="bg-amber-500/20 text-amber-300 font-mono font-bold px-3 py-1.5 rounded-xl border border-amber-500/30">
              +{result.drawerPoints} pts
            </div>
          </div>

          <div className="border-t border-slate-700/60 pt-3">
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center space-x-2">
              <UserCheck size={18} className="text-emerald-400" />
              <span>Aciertos ({result.correctGuessers.length})</span>
            </h4>

            {result.correctGuessers.length === 0 ? (
              <p className="text-slate-500 text-center py-6 font-medium">
                Nadie logró adivinar la palabra esta ronda 😢
              </p>
            ) : (
              <div className="space-y-2">
                {result.correctGuessers.map((guesser, idx) => (
                  <motion.div
                    key={guesser.playerId}
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: idx * 0.15 }}
                    className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-3 flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="font-mono font-bold text-sm bg-slate-800 text-slate-300 w-6 h-6 rounded-full flex items-center justify-center">
                        #{guesser.order}
                      </span>
                      <span className="font-bold text-white text-base">{guesser.playerName}</span>
                      <span className="text-xs text-slate-500 font-mono">({guesser.timeTakenSeconds}s)</span>
                    </div>
                    <div className="text-emerald-400 font-mono font-bold text-base">
                      +{guesser.points} pts
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Countdown indicator */}
      <div className="text-center text-slate-400 text-sm font-medium">
        Cargando tabla de posiciones...
      </div>
    </div>
  );
};
