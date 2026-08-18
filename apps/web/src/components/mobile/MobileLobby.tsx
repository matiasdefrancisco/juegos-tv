import React from 'react';
import { motion } from 'framer-motion';
import { Smartphone, Sparkles, Users, Crown } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';

export const MobileLobby: React.FC = () => {
  const { gameState, player, gameCode, startGame } = useSocket();

  if (!gameState || !player) return null;

  const isHost = player.isHost;
  const canStart = gameState.players.length >= 2;

  return (
    <div className="w-full h-full flex flex-col justify-between p-6 max-w-md mx-auto text-center">
      {/* Top Banner */}
      <div className="space-y-2">
        <div className="inline-flex items-center space-x-2 bg-indigo-500/20 border border-indigo-500/30 px-3.5 py-1 rounded-full text-indigo-300 font-semibold text-xs">
          <Sparkles size={14} />
          <span>¡ESTÁS DENTRO!</span>
        </div>
        <h2 className="text-3xl font-black font-game text-white">SALA DE ESPERA</h2>
      </div>

      {/* Player Profile Card */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-slate-800/90 border-2 border-indigo-500/40 p-6 rounded-3xl shadow-xl space-y-4 my-auto"
      >
        <div
          className="w-20 h-20 rounded-2xl mx-auto flex items-center justify-center text-4xl shadow-lg border-2 border-white/30"
          style={{ backgroundColor: player.color }}
        >
          {player.avatar}
        </div>

        <div>
          <h3 className="font-black text-2xl text-white font-game">{player.name}</h3>
          {isHost && (
            <span className="inline-flex items-center space-x-1 text-xs bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-full mt-1">
              <Crown size={12} />
              <span>Anfitrión</span>
            </span>
          )}
        </div>

        <div className="bg-slate-900/80 border border-slate-700/80 py-2.5 px-4 rounded-xl flex items-center justify-between text-sm">
          <span className="text-slate-400 font-semibold flex items-center space-x-1.5">
            <Users size={16} />
            <span>Jugadores:</span>
          </span>
          <span className="font-mono font-bold text-indigo-400 text-base">
            {gameState.players.length} / {gameState.settings.maxPlayers}
          </span>
        </div>

        <p className="text-slate-400 text-xs font-medium">
          Mirá la pantalla del televisor mientras los demás jugadores se conectan.
        </p>
      </motion.div>

      {/* Host Controls */}
      <div>
        {isHost ? (
          <button
            onClick={startGame}
            disabled={!canStart}
            className={`w-full py-4 rounded-2xl text-lg font-bold font-game ${
              canStart
                ? 'btn-game-yellow cursor-pointer hover:scale-102'
                : 'bg-slate-700 text-slate-500 cursor-not-allowed opacity-60'
            }`}
          >
            {canStart ? 'INICIAR PARTIDA' : 'ESPERANDO MÁS JUGADORES...'}
          </button>
        ) : (
          <div className="bg-slate-800/60 border border-slate-700/60 py-3.5 px-4 rounded-2xl text-slate-400 text-sm font-semibold">
            Esperando a que el anfitrión inicie la partida...
          </div>
        )}
      </div>
    </div>
  );
};
