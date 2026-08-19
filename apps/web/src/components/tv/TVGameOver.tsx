import React, { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';
import { GameMode } from '@party-draw/shared';
import { Crown, RotateCcw, Sparkles } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';

export const TVGameOver: React.FC = () => {
  const { gameState, playAgain } = useSocket();
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    const end = Date.now() + 4000;

    intervalRef.current = window.setInterval(() => {
      if (Date.now() > end) {
        if (intervalRef.current) window.clearInterval(intervalRef.current);
        return;
      }
      confetti({
        startVelocity: 30,
        spread: 360,
        ticks: 60,
        origin: { x: Math.random(), y: Math.random() * 0.4 }
      });
    }, 300);

    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, []);

  if (!gameState) return null;

  const isTeamMode = gameState.settings.mode === GameMode.TEAMS;

  const podium = isTeamMode
    ? [...gameState.teams]
        .filter((team) => gameState.players.some((p) => p.teamId === team.id))
        .sort((a, b) => b.score - a.score)
        .map((team) => ({
          key: team.id,
          name: team.name,
          score: team.score,
          color: team.color,
          icon: team.emoji,
          detail: gameState.players
            .filter((p) => p.teamId === team.id)
            .map((p) => p.name)
            .join(', ')
        }))
    : [...gameState.players]
        .sort((a, b) => b.score - a.score)
        .map((player) => ({
          key: player.id,
          name: player.name,
          score: player.score,
          color: player.color,
          icon: player.avatar,
          detail: ''
        }));

  const [winner, second, third] = podium;
  const rest = podium.slice(3);

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-6 flex flex-col gap-5 min-h-full text-center">
      <motion.header
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="space-y-2 flex-shrink-0"
      >
        <div className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-500/30 px-4 py-1.5 rounded-full text-amber-300 font-bold text-xs sm:text-base">
          <Sparkles size={18} />
          <span>¡PARTIDA FINALIZADA!</span>
        </div>
        <h2 className="tv-title font-black font-game text-white tracking-tight">
          PODIO DE CAMPEONES
        </h2>
      </motion.header>

      {/* Podio: en pantallas angostas se apila en orden 1-2-3 */}
      <div className="flex-1 flex flex-col justify-center gap-4 min-h-0">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:items-end max-w-3xl mx-auto w-full">
          {/* 2° — en móvil va después del ganador */}
          <div className="order-2 sm:order-1">
            {second ? <PodiumCard entry={second} place={2} /> : <div />}
          </div>

          {/* 1° */}
          <div className="order-1 sm:order-2">
            {winner && <PodiumCard entry={winner} place={1} />}
          </div>

          {/* 3° */}
          <div className="order-3">{third ? <PodiumCard entry={third} place={3} /> : <div />}</div>
        </div>

        {/* Resto de participantes */}
        {rest.length > 0 && (
          <div className="scroll-area max-h-[22vh] max-w-2xl mx-auto w-full space-y-1.5 pt-2">
            {rest.map((entry, idx) => (
              <div
                key={entry.key}
                className="flex items-center justify-between gap-3 panel-soft px-3 py-2"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-slate-500 font-mono font-bold text-sm w-6 flex-shrink-0">
                    #{idx + 4}
                  </span>
                  <span
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                    style={{ backgroundColor: entry.color }}
                    aria-hidden="true"
                  >
                    {entry.icon}
                  </span>
                  <span className="font-bold text-white text-sm truncate">{entry.name}</span>
                </div>
                <span className="font-mono font-bold text-slate-300 flex-shrink-0">
                  {entry.score}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex-shrink-0 pt-2">
        <button
          onClick={playAgain}
          className="btn-game-yellow inline-flex items-center gap-2.5 px-8 py-4 text-lg sm:text-2xl"
        >
          <RotateCcw size={24} />
          <span>JUGAR OTRA VEZ</span>
        </button>
      </div>
    </div>
  );
};

interface PodiumEntry {
  key: string;
  name: string;
  score: number;
  color: string;
  icon: string;
  detail: string;
}

const PLACE_STYLES: Record<number, { label: string; border: string; text: string }> = {
  1: { label: '👑 ¡GANADOR!', border: 'border-amber-400', text: 'text-amber-400' },
  2: { label: '2° PUESTO', border: 'border-slate-400', text: 'text-slate-300' },
  3: { label: '3° PUESTO', border: 'border-amber-700', text: 'text-amber-600' }
};

const PodiumCard: React.FC<{ entry: PodiumEntry; place: number }> = ({ entry, place }) => {
  const style = PLACE_STYLES[place];
  const isWinner = place === 1;

  return (
    <motion.div
      initial={{ y: isWinner ? 60 : 40, opacity: 0, scale: isWinner ? 0.9 : 1 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      transition={{ delay: isWinner ? 0.1 : 0.3, type: 'spring', stiffness: 220, damping: 22 }}
      className="flex flex-col items-center gap-2.5 relative"
    >
      {isWinner && (
        <Crown
          size={36}
          className="text-amber-400 animate-bounce absolute -top-8"
          aria-hidden="true"
        />
      )}

      <div
        className={`rounded-2xl flex items-center justify-center shadow-xl border-2 ${style.border} ${
          isWinner ? 'w-20 h-20 sm:w-24 sm:h-24 text-4xl sm:text-5xl' : 'w-16 h-16 text-3xl'
        }`}
        style={{ backgroundColor: entry.color }}
        aria-hidden="true"
      >
        {entry.icon}
      </div>

      <div
        className={`w-full p-3 sm:p-4 rounded-2xl border ${
          isWinner
            ? 'bg-gradient-to-b from-amber-500/30 to-slate-900 border-amber-500/70 shadow-2xl'
            : 'bg-slate-800/90 border-slate-700'
        }`}
      >
        <span className={`font-black text-xs sm:text-sm block ${style.text}`}>{style.label}</span>
        <h4
          className={`font-black text-white font-game truncate ${
            isWinner ? 'text-lg sm:text-2xl' : 'text-base sm:text-lg'
          }`}
        >
          {entry.name}
        </h4>
        {entry.detail && (
          <p className="text-[11px] text-slate-400 truncate mt-0.5">{entry.detail}</p>
        )}
        <p
          className={`font-mono font-black pt-0.5 ${
            isWinner ? 'text-2xl sm:text-4xl text-amber-400' : 'text-xl text-slate-300'
          }`}
        >
          {entry.score} pts
        </p>
      </div>
    </motion.div>
  );
};
