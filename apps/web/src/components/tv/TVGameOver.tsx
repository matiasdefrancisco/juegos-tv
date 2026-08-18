import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';
import { Trophy, Crown, RotateCcw, Sparkles } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';

export const TVGameOver: React.FC = () => {
  const { gameState, playAgain } = useSocket();

  useEffect(() => {
    // Launch celebratory confetti sequence
    const duration = 4 * 1000;
    const end = Date.now() + duration;

    const interval: any = setInterval(() => {
      if (Date.now() > end) {
        return clearInterval(interval);
      }
      confetti({
        startVelocity: 30,
        spread: 360,
        ticks: 60,
        origin: { x: Math.random(), y: Math.random() * 0.4 }
      });
    }, 300);

    return () => clearInterval(interval);
  }, []);

  if (!gameState) return null;

  const sortedPlayers = [...gameState.players].sort((a, b) => b.score - a.score);
  const winner = sortedPlayers[0];
  const second = sortedPlayers[1];
  const third = sortedPlayers[2];

  return (
    <div className="w-full h-full flex flex-col justify-between p-8 max-w-5xl mx-auto text-center">
      {/* Top Title */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="space-y-2"
      >
        <div className="inline-flex items-center space-x-2 bg-amber-500/20 border border-amber-500/30 px-5 py-2 rounded-full text-amber-300 font-bold text-base">
          <Sparkles size={20} />
          <span>¡PARTIDA FINALIZADA!</span>
        </div>
        <h2 className="text-6xl font-black font-game text-white tracking-tight">
          PODIO DE CAMPEONES
        </h2>
      </motion.div>

      {/* Podium Display */}
      <div className="grid grid-cols-3 gap-6 items-end my-auto max-w-3xl mx-auto w-full pt-8">
        {/* 2nd Place */}
        {second ? (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col items-center space-y-3"
          >
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl shadow-xl border-2 border-slate-400"
              style={{ backgroundColor: second.color }}
            >
              {second.avatar}
            </div>
            <div className="bg-slate-800/90 border border-slate-700 w-full p-4 rounded-2xl">
              <span className="text-slate-400 font-bold text-sm block">2° PUESTO</span>
              <h4 className="font-bold text-white text-lg truncate">{second.name}</h4>
              <p className="font-mono text-2xl font-black text-slate-300">{second.score} pts</p>
            </div>
          </motion.div>
        ) : (
          <div />
        )}

        {/* 1st Place (Winner) */}
        {winner && (
          <motion.div
            initial={{ y: 80, scale: 0.8, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: 'spring' }}
            className="flex flex-col items-center space-y-3 relative"
          >
            <div className="absolute -top-10">
              <Crown size={48} className="text-amber-400 animate-bounce" />
            </div>
            <div
              className="w-28 h-28 rounded-3xl flex items-center justify-center text-6xl shadow-2xl border-4 border-amber-400 animate-pulse-glow"
              style={{ backgroundColor: winner.color }}
            >
              {winner.avatar}
            </div>
            <div className="bg-gradient-to-b from-amber-500/30 to-slate-900 border-2 border-amber-500/80 w-full p-5 rounded-3xl shadow-2xl">
              <span className="text-amber-400 font-black text-base block tracking-wider">
                👑 ¡GANADOR!
              </span>
              <h3 className="font-black text-white text-2xl font-game truncate">{winner.name}</h3>
              <p className="font-mono text-4xl font-black text-amber-400 pt-1">
                {winner.score} pts
              </p>
            </div>
          </motion.div>
        )}

        {/* 3rd Place */}
        {third ? (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col items-center space-y-3"
          >
            <div
              className="w-18 h-18 rounded-2xl flex items-center justify-center text-3xl shadow-xl border-2 border-amber-700"
              style={{ backgroundColor: third.color }}
            >
              {third.avatar}
            </div>
            <div className="bg-slate-800/90 border border-slate-700 w-full p-4 rounded-2xl">
              <span className="text-amber-700 font-bold text-sm block">3° PUESTO</span>
              <h4 className="font-bold text-white text-lg truncate">{third.name}</h4>
              <p className="font-mono text-2xl font-black text-amber-600">{third.score} pts</p>
            </div>
          </motion.div>
        ) : (
          <div />
        )}
      </div>

      {/* Play Again Action */}
      <div className="pt-6">
        <button
          onClick={playAgain}
          className="btn-game-yellow inline-flex items-center space-x-3 px-10 py-5 text-2xl"
        >
          <RotateCcw size={26} />
          <span>JUGAR OTRA VEZ</span>
        </button>
      </div>
    </div>
  );
};
