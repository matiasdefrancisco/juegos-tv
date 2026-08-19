import React, { useEffect } from 'react';
import { GameMode } from '@party-draw/shared';
import { Crown, RotateCcw, Sparkles } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { celebrateWinner } from '../../utils/celebrate';

interface PodiumEntry {
  key: string;
  name: string;
  score: number;
  color: string;
  icon: string;
  detail: string;
}

/** Cuántos participantes fuera del podio entran sin scroll */
const MAX_REST = 6;

export const TVGameOver: React.FC = () => {
  const { gameState, playAgain } = useSocket();

  useEffect(() => celebrateWinner(), []);

  if (!gameState) return null;

  const isTeamMode = gameState.settings.mode === GameMode.TEAMS;

  const podium: PodiumEntry[] = isTeamMode
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
  const rest = podium.slice(3, 3 + MAX_REST);
  const hiddenCount = Math.max(0, podium.length - 3 - rest.length);

  return (
    <div className="w-full h-full flex flex-col gap-4 text-center">
      <header className="flex-none">
        <div className="inline-flex items-center gap-3 bg-amber-500/20 border border-amber-500/30 px-6 py-2 rounded-full text-amber-300 font-bold text-xl">
          <Sparkles size={24} />
          <span>¡PARTIDA FINALIZADA!</span>
        </div>
        <h2 className="tv-heading text-6xl font-black font-game text-white tracking-tight mt-2">
          PODIO DE CAMPEONES
        </h2>
      </header>

      {/* Podio */}
      <div className="flex-1 min-h-0 flex flex-col gap-4">
        <div className="flex-1 min-h-0 grid grid-cols-3 gap-6 items-end max-w-[1200px] mx-auto w-full pb-2">
          {second ? <PodiumCard entry={second} place={2} /> : <div />}
          {winner ? <PodiumCard entry={winner} place={1} /> : <div />}
          {third ? <PodiumCard entry={third} place={3} /> : <div />}
        </div>

        {/* Resto de participantes */}
        {rest.length > 0 && (
          <div
            className="flex-none grid gap-2 max-w-[1200px] mx-auto w-full"
            style={{ gridTemplateColumns: `repeat(${Math.min(rest.length, 3)}, minmax(0, 1fr))` }}
          >
            {rest.map((entry, idx) => (
              <div
                key={entry.key}
                className="flex items-center justify-between gap-3 panel-soft px-4 py-2"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-slate-500 font-mono font-bold text-xl w-8 flex-shrink-0">
                    {idx + 4}
                  </span>
                  <span
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
                    style={{ backgroundColor: entry.color }}
                    aria-hidden="true"
                  >
                    {entry.icon}
                  </span>
                  <span className="font-bold text-white text-xl truncate">{entry.name}</span>
                </div>
                <span className="font-mono font-bold text-slate-300 text-xl flex-shrink-0">
                  {entry.score}
                </span>
              </div>
            ))}
          </div>
        )}

        {hiddenCount > 0 && (
          <p className="flex-none text-slate-500 text-lg">y {hiddenCount} participantes más</p>
        )}
      </div>

      <div className="flex-none">
        <button
          onClick={playAgain}
          className="btn-game-yellow inline-flex items-center gap-4 px-12 py-5 text-3xl"
        >
          <RotateCcw size={32} />
          <span>JUGAR OTRA VEZ</span>
        </button>
      </div>
    </div>
  );
};

const PLACE_STYLES: Record<number, { label: string; border: string; text: string }> = {
  1: { label: '👑 ¡GANADOR!', border: 'border-amber-400', text: 'text-amber-400' },
  2: { label: '2° PUESTO', border: 'border-slate-400', text: 'text-slate-300' },
  3: { label: '3° PUESTO', border: 'border-amber-700', text: 'text-amber-600' }
};

const PodiumCard: React.FC<{ entry: PodiumEntry; place: number }> = ({ entry, place }) => {
  const style = PLACE_STYLES[place];
  const isWinner = place === 1;

  return (
    <div className="h-full flex flex-col items-center justify-end gap-3 relative min-h-0">
      {isWinner && (
        <Crown size={56} className="text-amber-400 flex-shrink-0" aria-hidden="true" />
      )}

      <div
        className={`rounded-2xl flex items-center justify-center shadow-xl border-4 flex-shrink-0 ${style.border}`}
        style={{
          backgroundColor: entry.color,
          width: isWinner ? 140 : 104,
          height: isWinner ? 140 : 104,
          fontSize: isWinner ? 76 : 56
        }}
        aria-hidden="true"
      >
        {entry.icon}
      </div>

      <div
        className={`w-full p-5 rounded-2xl border flex-shrink-0 ${
          isWinner
            ? 'bg-gradient-to-b from-amber-500/30 to-slate-900 border-amber-500/70 shadow-2xl'
            : 'bg-slate-800/90 border-slate-700'
        }`}
      >
        <span className={`font-black block ${style.text} ${isWinner ? 'text-2xl' : 'text-lg'}`}>
          {style.label}
        </span>
        <h4
          className={`font-black text-white font-game truncate ${
            isWinner ? 'text-4xl' : 'text-2xl'
          }`}
        >
          {entry.name}
        </h4>
        {entry.detail && (
          <p className="text-base text-slate-400 truncate mt-0.5">{entry.detail}</p>
        )}
        <p
          className={`font-mono font-black pt-1 ${
            isWinner ? 'text-5xl text-amber-400' : 'text-3xl text-slate-300'
          }`}
        >
          {entry.score}
        </p>
      </div>
    </div>
  );
};
